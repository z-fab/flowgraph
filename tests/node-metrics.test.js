import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildNodeInfoRows, buildNodeMetricRows } from '../src/ui/node-metrics.js';

describe('node-metrics contextual', () => {
  const cfg = { metrics: { windowSec: 30 }, outgoing: {}, edgesById: {}, sources: [] };

  it('port sink omits queue from info', () => {
    const node = { id: 'out', type: 'port', role: 'sink' };
    const stats = { state: 'idle', tokensIn: 10, tokensOut: 10, received: 10, rejects: 0, queueDepth: 0 };
    const rows = buildNodeInfoRows(node, stats, cfg);
    const labels = rows.map((r) => r[0]);
    assert.ok(labels.includes('Recebidos'));
    assert.ok(!labels.includes('Fila'));
  });

  it('port source shows emit stats not process percentiles', () => {
    const node = { id: 'src', type: 'port', role: 'source' };
    const stats = {
      state: 'idle', tokensOut: 5, emitSamples: [{ t: Date.now(), v: 1 }],
      processTimes: [], waitTimes: [],
    };
    const metrics = buildNodeMetricRows(node, stats, cfg);
    assert.ok(metrics.some((r) => r[0] === 'Taxa emit'));
    assert.ok(!metrics.some((r) => r[0].includes('p50 process')));
  });

  it('slot admission always shows rejects row', () => {
    const node = { id: 'sem', type: 'process', admission: { mode: 'slot', max: 2, rejectEdge: 'rej' } };
    const stats = {
      state: 'idle', tokensIn: 0, tokensOut: 0, queueDepth: 0,
      rejects: 0, processTimes: [], waitTimes: [],
    };
    const info = buildNodeInfoRows(node, stats, cfg);
    assert.ok(info.some((r) => r[0] === 'Rejeitados' && r[1] === '0'));
  });
});
