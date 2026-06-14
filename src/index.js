import { parseConfig, applyNodePatch } from './config.js';
import { graphBoundsWithEdges, graphBounds } from './geometry.js';
import { createViewport } from './viewport.js';
import { renderEdges } from './render-edge.js';
import { renderNodes } from './render-node.js';
import { ParticleSystem, spawnBurst } from './particles.js';
import { SimulationEngine } from './simulation.js';
import { MetricsStore } from './metrics.js';
import { autoLayout, needsLayout } from './layout.js';
import { applyCanvasBackground } from './ui/canvas-bg.js';
import { createChrome, updatePlayButton, syncGlobalMetricsButton, syncChromePinned } from './ui/controls.js';
import { attachNodeDrag } from './interaction/drag.js';
import {
  mountGlobalDrawer,
  mountNodeDrawer,
  updateGlobalPanel,
  updateNodePanel,
  closeNodeDrawer,
  refreshOpenPanels as refreshPanels,
} from './ui/panels.js';

const NS = 'http://www.w3.org/2000/svg';
const CSS_HREF = 'flowgraph.css';

function resolveTarget(target) {
  if (typeof target === 'string') return document.querySelector(target);
  return target;
}

function injectStylesheet() {
  if (document.querySelector('link[data-flowgraph-css]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = CSS_HREF;
  link.setAttribute('data-flowgraph-css', '1');
  document.head.appendChild(link);
}

class FlowGraphInstance {
  constructor(container, rawConfig) {
    this.container = container;
    this.config = parseConfig(rawConfig);
    this.listeners = {};
    this.running = false;
    this._raf = null;
    this._lastTs = 0;
    this.metrics = new MetricsStore(this.config);
    this._selectedNode = null;
    this._metricsTimer = null;

    if (this.config.injectStyles) injectStylesheet();

    this._mount();
    this._bindSimulation();

    if (this.config.autoStart) this.start();
  }

  _mount() {
    const cfg = this.config;
    this.container.innerHTML = '';
    this.container.classList.add('fg-container');

    const root = document.createElement('div');
    root.className = 'fg-root';
    root.style.setProperty('--fg-bg', cfg.theme.background);
    root.style.setProperty('--fg-font', cfg.theme.font);
    root.style.setProperty('--fg-primary', cfg.theme.primary);
    root.style.setProperty('--fg-border', cfg.theme.border);
    root.style.setProperty('--fg-text', cfg.theme.text);
    root.style.setProperty('--fg-text-muted', cfg.theme.textMuted);
    root.style.setProperty('--fg-edge-label-bg', cfg.theme.pillSurface || '#FFFFFF');
    applyCanvasBackground(root, cfg.viewport, cfg.theme);

    if (cfg.viewport.height) {
      root.style.height = typeof cfg.viewport.height === 'number' ? `${cfg.viewport.height}px` : cfg.viewport.height;
    }
    if (cfg.viewport.width) {
      root.style.width = typeof cfg.viewport.width === 'number' ? `${cfg.viewport.width}px` : cfg.viewport.width;
    }

    const canvasBg = document.createElement('div');
    canvasBg.className = 'fg-canvas-bg';
    canvasBg.setAttribute('aria-hidden', 'true');

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'fg-svg');
    svg.setAttribute('xmlns', NS);

    const viewportG = document.createElementNS(NS, 'g');
    viewportG.setAttribute('class', 'fg-viewport');

    const edgesLayer = document.createElementNS(NS, 'g');
    edgesLayer.setAttribute('class', 'fg-edges');
    const particlesLayer = document.createElementNS(NS, 'g');
    particlesLayer.setAttribute('class', 'fg-particles');
    const labelsLayer = document.createElementNS(NS, 'g');
    labelsLayer.setAttribute('class', 'fg-labels');
    const nodesLayer = document.createElementNS(NS, 'g');
    nodesLayer.setAttribute('class', 'fg-nodes');

    viewportG.appendChild(edgesLayer);
    viewportG.appendChild(particlesLayer);
    viewportG.appendChild(labelsLayer);
    viewportG.appendChild(nodesLayer);
    svg.appendChild(viewportG);
    root.appendChild(canvasBg);
    root.appendChild(svg);

    this.root = root;
    this.svg = svg;
    this.viewportG = viewportG;

    this.bounds = graphBoundsWithEdges(cfg.nodes, cfg.edges, cfg.nodesById, cfg.viewport.padding);
    this.edgeRenderer = renderEdges(edgesLayer, labelsLayer, cfg.edges, cfg.nodesById, cfg.theme);
    this.nodeRenderer = renderNodes(nodesLayer, cfg.nodes, cfg.theme);
    this.particles = new ParticleSystem(particlesLayer, this.edgeRenderer, cfg);
    this.viewport = createViewport(svg, viewportG, cfg, this.bounds);

    mountGlobalDrawer(root, this, cfg);
    mountNodeDrawer(root, this, cfg);
    createChrome(root, this, cfg);
    this.container.appendChild(root);

    const nodeDrag = cfg.interaction?.nodeDrag !== false;
    const nodeSelect = cfg.interaction?.nodeSelect !== false;
    const nodeDrawerOn = cfg.metrics?.nodeDrawer !== false && cfg.metrics?.nodePanel !== false;

    cfg.nodes.forEach((n) => {
      const g = this.nodeRenderer.nodeViews[n.id]?.g;
      if (!g) return;
      if (nodeDrag) g.style.cursor = 'grab';
      else if (nodeSelect) g.style.cursor = 'pointer';

      if (!nodeSelect) return;
      g.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this._nodeJustDragged) {
          this._nodeJustDragged = false;
          return;
        }
        this.selectNode(n.id);
        if (nodeDrawerOn) updateNodePanel(this, n.id);
      });
    });

    if (nodeDrag) attachNodeDrag(this);

    this.nodeRenderer.refreshIcons();
    requestAnimationFrame(() => {
      this.edgeRenderer.updateLabels();
      this.viewport.fit();
    });

    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(() => this.viewport.fit());
      this._ro.observe(svg);
    }
  }

  selectNode(nodeId) {
    if (this._selectedNode && this._selectedNode !== nodeId) {
      this.nodeRenderer.setSelected(this._selectedNode, false);
    }
    this._selectedNode = nodeId;
    this.nodeRenderer.setSelected(nodeId, true);
    this._highlightEdges(nodeId);
  }

  _highlightEdges(nodeId) {
    const primary = this.config.theme.primary;
    this.config.edges.forEach((e) => {
      const hit = e.from === nodeId || e.to === nodeId;
      this.edgeRenderer.setActive(e.id, hit, hit ? primary : null);
      this.edgeRenderer.setDimmed(e.id, !hit);
    });
  }

  _clearEdgeHighlight() {
    this.config.edges.forEach((e) => {
      this.edgeRenderer.setActive(e.id, false);
      this.edgeRenderer.setDimmed(e.id, false);
    });
  }

  updateNode(nodeId, patch) {
    applyNodePatch(this.config, nodeId, patch);
    this.sim.patchNode(nodeId, this.config.nodesById[nodeId]);
    if (this._selectedNode === nodeId) this.refreshOpenPanels();
  }

  toggleGlobalDrawer() {
    if (this._globalDrawer?.isOpen()) {
      this._globalDrawer.close();
    } else {
      this._globalDrawer?.open();
      updateGlobalPanel(this);
    }
    syncGlobalMetricsButton(this);
    syncChromePinned(this);
  }

  refreshGlobalPanel() {
    updateGlobalPanel(this);
  }

  refreshOpenPanels() {
    refreshPanels(this);
  }

  _recomputeBounds() {
    this.viewport.updateBounds(graphBoundsWithEdges(
      this.config.nodes,
      this.config.edges,
      this.config.nodesById,
      this.config.viewport.padding
    ));
  }

  async applyAutoLayout(engine) {
    const layoutCfg = this.config.layout || {};
    const eng = engine || layoutCfg.engine || 'layered';

    if (eng === 'dagre') {
      const { dagreLayout } = await import('./layout-dagre.js');
      dagreLayout(this.config.nodes, this.config.edges, { ...layoutCfg, force: true });
    } else {
      autoLayout(this.config.nodes, this.config.edges, { ...layoutCfg, force: true });
    }

    this.config.nodes.forEach((n) => {
      this.nodeRenderer.setPosition(n.id, n.x, n.y);
    });
    this.edgeRenderer.updatePaths(this.config.nodesById);
    this._recomputeBounds();
    requestAnimationFrame(() => this.viewport.fit());
    this._emit('layout:change', { engine: eng });
  }

  _bindSimulation() {
    const onSpawnTrack = (token, edgeId) => {
      if (token?.id) this.sim.noteTokenSpawn(token.id, edgeId);
    };

    this.sim = new SimulationEngine(this.config, {
      onEvent: (event, payload) => {
        this._emit(event, payload);
        if (event === 'token:spawn' && payload.sourceId) {
          const src = this.config.sources.find((s) => s.id === payload.sourceId);
          if (src) {
            const edge = this.config.edgesById[src.edgeId];
            if (edge?.from) {
              this.metrics.recordEmit(edge.from, src.burst?.count || 1);
              if (this._selectedNode === edge.from) {
                this.refreshOpenPanels();
              }
            }
          }
        }
        if (event === 'flow:complete') this.refreshOpenPanels();
      },
      spawnOnEdge: (edgeId, tokenCfg, burst, onArrive) => {
        spawnBurst(
          this.particles,
          edgeId,
          burst,
          tokenCfg,
          (token) => { if (onArrive) onArrive(token); },
          (token) => onSpawnTrack(token, edgeId)
        );
      },
      getNodeMetrics: (nodeId) => {
        const s = this.metrics.nodeStats(nodeId);
        return s ? { rejects: s.rejects, queueDepth: s.queueDepth } : {};
      },
      onPills: (nodeId, pills) => {
        this.nodeRenderer.setPillsBottom(nodeId, pills);
      },
      onMetrics: (kind, data) => {
        if (kind === 'arrive') this.metrics.recordArrive(data.nodeId);
        if (kind === 'processStart') this.metrics.recordProcessStart(data.nodeId, data.waitMs);
        if (kind === 'processEnd') this.metrics.recordProcessEnd(data.nodeId, data.processMs);
        if (kind === 'emit') this.metrics.recordEmit(data.nodeId);
        if (kind === 'reject') this.metrics.recordReject(data.nodeId);
        if (kind === 'sink') this.metrics.recordSink(data.nodeId);
        if (kind === 'flowComplete') this.metrics.recordFlowComplete(data.rtMs);
        if (kind === 'queue') this.metrics.setQueueDepth(data.nodeId, data.depth);
        if (data?.nodeId) this.sim._refreshPills(data.nodeId);
        this.refreshOpenPanels();
      },
      onNodeProcessStart: (nodeId, effect) => {
        this.nodeRenderer.setEffect(nodeId, effect);
        this.nodeRenderer.setActive(nodeId, true);
        this.metrics.setState(nodeId, 'processing');
      },
      onNodeProcessEnd: (nodeId) => {
        this.nodeRenderer.setEffect(nodeId, null);
        this.nodeRenderer.setActive(nodeId, false);
        this.metrics.setState(nodeId, 'idle');
      },
      onNodeWaiting: (nodeId) => {
        this.nodeRenderer.setEffect(nodeId, 'waiting');
        this.metrics.setState(nodeId, 'waiting');
      },
      onReset: () => {
        this.particles.clear();
        this.metrics = new MetricsStore(this.config);
        this.config.nodes.forEach((n) => {
          this.nodeRenderer.setEffect(n.id, null);
          this.nodeRenderer.setActive(n.id, false);
          this.sim._refreshPills(n.id);
        });
        this.refreshGlobalPanel();
        closeNodeDrawer(this);
      },
    });
  }

  _emit(event, payload) {
    (this.listeners[event] || []).forEach((fn) => fn(payload));
  }

  on(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
    return this;
  }

  _tick(ts) {
    if (!this._lastTs) this._lastTs = ts;
    const dt = ts - this._lastTs;
    this._lastTs = ts;
    this.particles.update(dt);
    this._raf = requestAnimationFrame((t) => this._tick(t));
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._lastTs = 0;
    this.sim.start();
    this._raf = requestAnimationFrame((t) => this._tick(t));
    this._metricsTimer = setInterval(() => this.refreshOpenPanels(), 500);
    updatePlayButton(this);
  }

  pause() {
    this.running = false;
    this.sim.pause();
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
    if (this._metricsTimer) clearInterval(this._metricsTimer);
    updatePlayButton(this);
  }

  reset() {
    this.pause();
    this.sim.reset();
    updatePlayButton(this);
  }

  destroy() {
    this.pause();
    if (this._ro) this._ro.disconnect();
    this.container.innerHTML = '';
    this.container.classList.remove('fg-container');
  }

  fit() {
    this.viewport.fit();
  }

  getConfig() {
    return this.config;
  }

  toJSON() {
    return {
      title: this.config.title,
      viewport: { ...this.config.viewport, background: this.config.viewport.background },
      layout: this.config.layout,
      interaction: this.config.interaction,
      controls: this.config.controls,
      metrics: this.config.metrics,
      nodes: this.config.nodes.map((n) => ({
        id: n.id, type: n.type, role: n.role, label: n.label, icon: n.icon, tone: n.tone,
        shape: n.shape, x: n.x, y: n.y, duration: n.duration,
        admission: n.admission, gate: n.gate, emit: n.emit, retry: n.retry, circuit: n.circuit,
        pillTop: n.pillTop, showReceived: n.showReceived,
      })),
      edges: this.config.edges.map(({ id, from, to, stroke, label, weight, speed, routing, loopSide, token }) => ({
        id, from, to, stroke, label, weight, speed, routing, loopSide, token,
      })),
      sources: this.config.sources,
    };
  }

  emit(edgeId, tokenCfg) {
    this.sim.emit(edgeId, tokenCfg);
  }
}

function create(target, config) {
  const container = resolveTarget(target);
  if (!container) throw new Error('FlowGraph: container not found');
  return new FlowGraphInstance(container, config);
}

async function createFromURL(target, url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FlowGraph: failed to load ${url}`);
  return create(target, await res.json());
}

export const FlowGraph = { create, createFromURL, parseConfig, autoLayout, needsLayout };
export { parseConfig, SimulationEngine, graphBounds, graphBoundsWithEdges, MetricsStore };

if (typeof window !== 'undefined') {
  window.FlowGraph = FlowGraph;
}

export default FlowGraph;
