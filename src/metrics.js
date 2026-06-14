import { percentile } from './randomness.js';

export class MetricsStore {
  constructor(config) {
    this.windowSec = config.metrics?.windowSec ?? 30;
    this.nodes = {};
    this.system = { rtSamples: [], throughput: [], rejects: 0, completed: 0, lastRt: null };
    config.nodes.forEach((n) => {
      this.nodes[n.id] = {
        tokensIn: 0,
        tokensOut: 0,
        rejects: 0,
        received: 0,
        processTimes: [],
        waitTimes: [],
        emitSamples: [],
        arriveSamples: [],
        rejectSamples: [],
        state: 'idle',
        queueDepth: 0,
      };
    });
  }

  _trim(arr) {
    const cutoff = Date.now() - this.windowSec * 1000;
    return arr.filter((x) => x.t >= cutoff);
  }

  recordArrive(nodeId) {
    const m = this.nodes[nodeId];
    if (m) {
      m.tokensIn += 1;
      m.queueDepth += 1;
      m.arriveSamples.push({ t: Date.now(), v: 1 });
      m.arriveSamples = this._trim(m.arriveSamples);
    }
  }

  recordProcessStart(nodeId, waitMs) {
    const m = this.nodes[nodeId];
    if (!m) return;
    m.state = 'processing';
    if (waitMs) {
      m.waitTimes.push({ t: Date.now(), v: waitMs });
      m.waitTimes = this._trim(m.waitTimes);
    }
  }

  recordProcessEnd(nodeId, processMs) {
    const m = this.nodes[nodeId];
    if (!m) return;
    m.state = 'idle';
    m.queueDepth = Math.max(0, m.queueDepth - 1);
    if (processMs) {
      m.processTimes.push({ t: Date.now(), v: processMs });
      m.processTimes = this._trim(m.processTimes);
    }
  }

  recordEmit(nodeId, count = 1) {
    const m = this.nodes[nodeId];
    if (!m) return;
    m.tokensOut += count;
    m.emitSamples.push({ t: Date.now(), v: count });
    m.emitSamples = this._trim(m.emitSamples);
  }

  recordReject(nodeId) {
    const m = this.nodes[nodeId];
    if (m) {
      m.rejects += 1;
      m.rejectSamples.push({ t: Date.now(), v: 1 });
      m.rejectSamples = this._trim(m.rejectSamples);
    }
    this.system.rejects += 1;
  }

  recordSink(nodeId) {
    const m = this.nodes[nodeId];
    if (m) {
      m.received += 1;
      m.tokensOut += 1;
      m.queueDepth = Math.max(0, m.queueDepth - 1);
    }
  }

  recordFlowComplete(rtMs) {
    this.system.lastRt = rtMs;
    this.system.completed += 1;
    this.system.rtSamples.push({ t: Date.now(), v: rtMs });
    this.system.rtSamples = this._trim(this.system.rtSamples);
    this.system.throughput.push({ t: Date.now(), v: 1 });
    this.system.throughput = this._trim(this.system.throughput);
  }

  setState(nodeId, state) {
    if (this.nodes[nodeId]) this.nodes[nodeId].state = state;
  }

  setQueueDepth(nodeId, depth) {
    if (this.nodes[nodeId]) this.nodes[nodeId].queueDepth = depth;
  }

  nodeStats(nodeId) {
    const m = this.nodes[nodeId];
    if (!m) return null;
    const proc = m.processTimes.map((x) => x.v).sort((a, b) => a - b);
    const wait = m.waitTimes.map((x) => x.v).sort((a, b) => a - b);
    return {
      ...m,
      p50Process: percentile(proc, 50),
      p90Process: percentile(proc, 90),
      p99Process: percentile(proc, 99),
      p50Wait: percentile(wait, 50),
    };
  }

  systemStats() {
    const rts = this.system.rtSamples.map((x) => x.v).sort((a, b) => a - b);
    const span = this.windowSec || 30;
    const tp = this.system.throughput.length / span;
    return {
      lastRt: this.system.lastRt,
      completed: this.system.completed,
      rejects: this.system.rejects,
      throughput: Math.round(tp * 10) / 10,
      p50Rt: percentile(rts, 50),
      p90Rt: percentile(rts, 90),
      p99Rt: percentile(rts, 99),
    };
  }
}
