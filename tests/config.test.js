import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseConfig, applyNodePatch } from '../src/config.js';

describe('applyNodePatch', () => {
  it('updates admission and gate', () => {
    const cfg = parseConfig({
      nodes: [
        { id: 'j', type: 'process', x: 0, y: 0, duration: 100, gate: { from: 'all-edges', count: 2 } },
        { id: 'cb', type: 'process', x: 100, y: 0, duration: 200, circuit: { failureRate: 0.1 } },
      ],
      edges: [{ id: 'ab', from: 'j', to: 'cb' }],
    });

    applyNodePatch(cfg, 'j', { duration: 150, gate: { mode: 'count', count: 3 } });
    assert.equal(cfg.nodesById.j.duration, 150);
    assert.equal(cfg.nodesById.j.gate.count, 3);

    applyNodePatch(cfg, 'cb', {
      circuit: { failureRate: 0.5, failureThreshold: 3, recoveryMs: 5000 },
    });
    assert.equal(cfg.nodesById.cb.circuit.failureRate, 0.5);
  });

  it('updates weighted emit edges', () => {
    const cfg = parseConfig({
      nodes: [
        { id: 'r', type: 'process', emit: { mode: 'weighted' }, x: 0, y: 0 },
        { id: 'a', type: 'port', role: 'sink', x: 100, y: 0 },
        { id: 'b', type: 'port', role: 'sink', x: 100, y: 50 },
      ],
      edges: [
        { id: 'ra', from: 'r', to: 'a', weight: 1 },
        { id: 'rb', from: 'r', to: 'b', weight: 1 },
      ],
    });

    applyNodePatch(cfg, 'r', { weights: { ra: 3, rb: 1 } });
    assert.equal(cfg.edgesById.ra.weight, 3);
    assert.equal(cfg.edgesById.rb.weight, 1);
  });
});

describe('parseConfig', () => {
  it('rejects unknown node types', () => {
    assert.throws(
      () => parseConfig({
        nodes: [{ id: 'x', type: 'buffer' }],
        edges: [{ from: 'x', to: 'x' }],
      }),
      /unknown node type "buffer"/,
    );
  });
});
