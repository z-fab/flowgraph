import { applyJitter } from './randomness.js';
import { resolveTokenConfig } from './config.js';
import { buildPillsBottom } from './compose-pills.js';
import { tryAdmit, releaseSlot, hasCircuit, hasRetry } from './admission.js';

export class SimulationEngine {
  constructor(config, hooks) {
    this.config = config;
    this.hooks = hooks;
    this.running = false;
    this.nodeState = {};
    this.sourceTimers = {};
    this.processTimers = {};
    this.roundRobinIdx = {};
    this.tokenStarted = {};
    this.rtStart = null;
    this._initState();
  }

  _initState() {
    this.config.nodes.forEach((n) => {
      this.nodeState[n.id] = {
        buffer: 0,
        bufferByEdge: {},
        processing: false,
        waiting: false,
        flushing: false,
        fill: 0,
        slots: 0,
        retries: 0,
        rejects: 0,
        received: 0,
        waitSince: null,
        circuitState: n.circuit ? 'closed' : null,
        failures: 0,
        openSince: null,
      };
      this.roundRobinIdx[n.id] = 0;
    });
    this.rtStart = null;
  }

  _emit(event, payload) {
    if (this.hooks.onEvent) this.hooks.onEvent(event, payload);
  }

  _refreshPills(nodeId) {
    if (!this.hooks.onPills) return;
    const node = this.config.nodesById[nodeId];
    const state = this.nodeState[nodeId];
    if (!node || !state) return;
    const metricsSlice = this.hooks.getNodeMetrics?.(nodeId) || { rejects: state.rejects };
    this.hooks.onPills(nodeId, buildPillsBottom(node, state, metricsSlice));
  }

  _jitterDuration(ms) {
    const r = this.config.randomness;
    return applyJitter(ms, r.duration?.jitter, r.enabled);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._emit('sim:start', {});
    this.config.sources.forEach((src) => {
      if (src.enabled === false) return;
      const kick = () => {
        this._fireSource(src);
        this._scheduleSource(src);
      };
      if (src.delay > 0) {
        this.sourceTimers[`${src.id}-delay`] = setTimeout(kick, src.delay);
      } else {
        kick();
      }
    });
  }

  pause() {
    this.running = false;
    Object.values(this.sourceTimers).forEach(clearTimeout);
    Object.values(this.processTimers).forEach(clearTimeout);
    this.sourceTimers = {};
    this.processTimers = {};
    this._emit('sim:pause', {});
  }

  reset() {
    this.pause();
    this._initState();
    if (this.hooks.onReset) this.hooks.onReset();
    this._emit('sim:reset', {});
  }

  patchNode(nodeId, node) {
    if (!this.config.nodesById[nodeId]) return;
    this.config.nodesById[nodeId] = node;
  }

  _evaluateCircuit(node, state) {
    const c = node.circuit;
    if (!c) return;
    const rate = c.failureRate ?? 0.25;
    const threshold = c.failureThreshold ?? 5;
    const recoveryMs = c.recoveryMs ?? 8000;
    const now = Date.now();

    if (state.circuitState === 'open' && state.openSince && now - state.openSince >= recoveryMs) {
      state.circuitState = 'half-open';
    }

    if (state.circuitState === 'open') {
      this._refreshPills(node.id);
      return;
    }

    const failed = Math.random() < rate;
    if (failed) {
      state.failures += 1;
      if (this.hooks.onMetrics) this.hooks.onMetrics('reject', { nodeId: node.id });
      if (state.failures >= threshold) {
        state.circuitState = 'open';
        state.openSince = now;
      }
    } else {
      state.failures = 0;
      if (state.circuitState === 'half-open') state.circuitState = 'closed';
    }
    this._refreshPills(node.id);
  }

  _scheduleSource(src) {
    if (!this.running) return;
    const jitter = src.jitter ? (Math.random() * 2 - 1) * src.jitter * src.interval : 0;
    const delay = Math.max(50, src.interval + jitter);
    this.sourceTimers[src.id] = setTimeout(() => {
      this._fireSource(src);
      this._scheduleSource(src);
    }, delay);
  }

  _fireSource(src) {
    if (!this.running) return;
    if (!this.rtStart) this.rtStart = Date.now();
    this._emit('token:spawn', { sourceId: src.id, edgeId: src.edgeId });
    if (this.hooks.spawnOnEdge) {
      this.hooks.spawnOnEdge(src.edgeId, src.token, src.burst, (token) => {
        this._handleArrive(src.edgeId, token);
      });
    }
  }

  emit(edgeId, tokenCfg) {
    if (!this.hooks.spawnOnEdge) return;
    const edge = this.config.edgesById[edgeId];
    if (!edge) return;
    this._emit('token:spawn', { edgeId, manual: true });
    const token = { ...this.config.tokenDefault, ...tokenCfg };
    this.hooks.spawnOnEdge(edgeId, token, { count: 1, spacing: 0 }, (t) => {
      this._handleArrive(edgeId, t);
    });
  }

  noteTokenSpawn(tokenId, edgeId) {
    this.tokenStarted[tokenId] = Date.now();
  }

  _handleArrive(inEdgeId, token) {
    const edge = this.config.edgesById[inEdgeId];
    if (!edge) return;
    const nodeId = edge.to;
    const node = this.config.nodesById[nodeId];
    if (!node) return;

    if (this.tokenStarted[token?.id]) delete this.tokenStarted[token?.id];

    const state = this.nodeState[nodeId];
    if (this.hooks.onMetrics) this.hooks.onMetrics('arrive', { nodeId });

    if (node.type === 'port') {
      this._handlePort(node, state, token, inEdgeId);
      return;
    }

    const result = tryAdmit(node, state, inEdgeId);

    if (result.overflow) {
      this._overflow(node, state, token, inEdgeId);
      return;
    }

    if (result.accumulating) {
      this._emit('token:arrive', { nodeId, tokenId: token?.id, edgeId: inEdgeId, accumulating: true });
      this._refreshPills(nodeId);
      return;
    }

    if (result.slots != null && this.hooks.onMetrics) {
      this.hooks.onMetrics('queue', { nodeId, depth: result.slots });
    }

    this._emit('token:arrive', { nodeId, tokenId: token?.id, edgeId: inEdgeId });
    this._refreshPills(nodeId);

    if (state.processing) return;

    if (this._gateSatisfied(node, state)) {
      state.waiting = false;
      this._startProcess(node, state);
    } else {
      state.waiting = true;
      if (this.hooks.onNodeWaiting) this.hooks.onNodeWaiting(nodeId);
      this._refreshPills(nodeId);
    }
  }

  _handlePort(node, state, token, inEdgeId) {
    this._emit('token:arrive', { nodeId: node.id, tokenId: token?.id, edgeId: inEdgeId });
    state.received += 1;
    if (this.hooks.onMetrics) this.hooks.onMetrics('sink', { nodeId: node.id });
    if (node.showReceived) this._refreshPills(node.id);
    if (node.role === 'terminal' && this.rtStart) {
      const rt = Date.now() - this.rtStart;
      this._emit('flow:complete', { nodeId: node.id, rtMs: rt });
      if (this.hooks.onMetrics) this.hooks.onMetrics('flowComplete', { rtMs: rt });
      this.rtStart = null;
    }
  }

  _overflow(node, state, token, inEdgeId) {
    state.rejects += 1;
    const rejectId = node.admission?.rejectEdge;
    if (rejectId) {
      this._spawnReject(node, token, rejectId);
    } else {
      this._emit('token:drop', { nodeId: node.id, edgeId: inEdgeId, reason: 'queue-full' });
    }
    if (this.hooks.onMetrics) this.hooks.onMetrics('reject', { nodeId: node.id });
    this._refreshPills(node.id);
  }

  _spawnReject(node, token, rejectEdgeId) {
    if (!rejectEdgeId || !this.hooks.spawnOnEdge) return;
    const edge = this.config.edgesById[rejectEdgeId];
    const tokenCfg = resolveTokenConfig(this.config, node, edge);
    this._emit('token:reject', { nodeId: node.id, edgeId: rejectEdgeId });
    this.hooks.spawnOnEdge(rejectEdgeId, tokenCfg, { count: 1, spacing: 0 }, (t) => {
      this._handleArrive(rejectEdgeId, t);
    });
  }

  _gateEdges(node) {
    const gate = node.gate || { count: 1, from: 'any' };
    const incoming = this.config.incoming[node.id] || [];
    if (Array.isArray(gate.from)) {
      return incoming.filter((e) => gate.from.includes(e.id));
    }
    if (gate.from === 'all-edges') {
      return incoming.filter((e) => e.routing !== 'loopback');
    }
    return incoming;
  }

  _gateSatisfied(node, state) {
    const gate = node.gate || { count: 1, from: 'any' };
    const need = gate.count || 1;
    if (gate.from === 'all-edges' || Array.isArray(gate.from)) {
      const inc = this._gateEdges(node);
      return inc.length > 0 && inc.every((e) => (state.bufferByEdge[e.id] || 0) >= need);
    }
    return state.buffer >= need;
  }

  _consumeGate(node, state) {
    const gate = node.gate || { count: 1, from: 'any' };
    const need = gate.count || 1;
    if (gate.from === 'all-edges' || Array.isArray(gate.from)) {
      this._gateEdges(node).forEach((e) => {
        state.bufferByEdge[e.id] = Math.max(0, (state.bufferByEdge[e.id] || 0) - need);
      });
    } else {
      state.buffer = Math.max(0, state.buffer - need);
    }
  }

  _startProcess(node, state) {
    state.processing = true;
    state.waiting = false;
    state.waitSince = state.waitSince || Date.now();
    this._consumeGate(node, state);

    const duration = this._jitterDuration(node.duration || 800);
    const isFast = duration < 400;
    const effect = isFast ? 'active' : 'processing';

    this._emit('node:process:start', { nodeId: node.id, effect });
    if (this.hooks.onNodeProcessStart) this.hooks.onNodeProcessStart(node.id, effect);
    this._refreshPills(node.id);
    if (this.hooks.onMetrics) {
      this.hooks.onMetrics('processStart', { nodeId: node.id, waitMs: state.waitSince ? Date.now() - state.waitSince : 0 });
    }

    const t0 = Date.now();
    this.processTimers[node.id] = setTimeout(() => {
      state.processing = false;
      state.waitSince = null;
      const processMs = Date.now() - t0;

      if (node.admission?.mode === 'slot') releaseSlot(state);
      state.flushing = false;

      this._emit('node:process:end', { nodeId: node.id });
      if (this.hooks.onNodeProcessEnd) this.hooks.onNodeProcessEnd(node.id);
      if (this.hooks.onMetrics) this.hooks.onMetrics('processEnd', { nodeId: node.id, processMs });
      this._refreshPills(node.id);

      if (hasCircuit(node)) this._evaluateCircuit(node, state);

      this._emitFromNode(node);

      if (this._gateSatisfied(node, state)) {
        this._startProcess(node, state);
      } else if (state.buffer > 0 || Object.values(state.bufferByEdge).some((n) => n > 0)) {
        state.waiting = true;
        this._refreshPills(node.id);
      }
    }, duration);
  }

  _emitFromNode(node) {
    const out = this._resolveOutgoing(node);
    if (!out.length) return;

    this._emit('node:emit', { nodeId: node.id });
    if (this.hooks.onMetrics) this.hooks.onMetrics('emit', { nodeId: node.id });

    const emitCfg = node.emit || { mode: 'all', count: 1 };

    if (emitCfg.mode === 'weighted') {
      const picked = this._pickWeighted(out);
      if (picked) this._spawnOnEdge(picked, 1, node);
      return;
    }

    if (emitCfg.mode === 'round-robin') {
      const idx = this.roundRobinIdx[node.id] % out.length;
      this.roundRobinIdx[node.id] += 1;
      this._spawnOnEdge(out[idx], emitCfg.count || 1, node);
      return;
    }

    if (emitCfg.mode === 'map' && emitCfg.map) {
      Object.keys(emitCfg.map).forEach((edgeId) => {
        const e = this.config.edgesById[edgeId];
        if (e) this._spawnOnEdge(e, emitCfg.map[edgeId], node);
      });
      return;
    }

    out.forEach((e) => this._spawnOnEdge(e, emitCfg.count || 1, node));
  }

  _resolveOutgoing(node) {
    let out = [...(this.config.outgoing[node.id] || [])];
    const emitCfg = node.emit || {};
    const rejectId = node.admission?.rejectEdge;

    if (emitCfg.mode === 'excludeReject' && rejectId) {
      out = out.filter((e) => e.id !== rejectId);
    }
    if (emitCfg.mode === 'map' && emitCfg.map) {
      out = out.filter((e) => emitCfg.map[e.id] != null);
    }

    if (hasCircuit(node)) {
      const c = node.circuit;
      const st = this.nodeState[node.id]?.circuitState || 'closed';
      if (st === 'open' && c.fallbackEdge) {
        const fb = this.config.edgesById[c.fallbackEdge];
        return fb ? [fb] : out;
      }
      if (c.acceptEdge) {
        const acc = this.config.edgesById[c.acceptEdge];
        return acc ? [acc] : out;
      }
    }

    if (hasRetry(node)) {
      const be = this.config.edgesById[node.retry.backEdge];
      const st = this.nodeState[node.id];
      if (st && st.retries < (node.retry.maxRetries || 3) && be) {
        st.retries += 1;
        this._refreshPills(node.id);
        return [be];
      }
    }

    return out;
  }

  _pickWeighted(edges) {
    const weights = edges.map((e) => e.weight ?? 1);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < edges.length; i++) {
      r -= weights[i];
      if (r <= 0) return edges[i];
    }
    return edges[edges.length - 1];
  }

  _spawnOnEdge(edge, count, fromNode) {
    const n = count != null ? count : 1;
    for (let i = 0; i < n; i++) {
      if (!this.hooks.spawnOnEdge) continue;
      const tokenCfg = resolveTokenConfig(this.config, fromNode, edge);
      if (edge.speed) tokenCfg.speed = edge.speed;
      this.hooks.spawnOnEdge(
        edge.id,
        tokenCfg,
        { count: 1, spacing: i * 50 },
        (token) => this._handleArrive(edge.id, token)
      );
    }
  }
}
