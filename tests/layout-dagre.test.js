import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dagreLayout } from '../src/layout-dagre.js';
import { parseConfig } from '../src/config.js';
import { autoLayout } from '../src/layout.js';

describe('dagreLayout', () => {
  it('assigns coordinates to all nodes', () => {
    const cfg = parseConfig({
      nodes: [
        { id: 'a', type: 'port', role: 'source' },
        { id: 'b', type: 'process', label: 'B' },
        { id: 'c', type: 'port', role: 'sink' },
      ],
      edges: [
        { id: 'ab', from: 'a', to: 'b' },
        { id: 'bc', from: 'b', to: 'c' },
      ],
    });
    dagreLayout(cfg.nodes, cfg.edges, { direction: 'LR', force: true });
    cfg.nodes.forEach((n) => {
      assert.ok(typeof n.x === 'number');
      assert.ok(typeof n.y === 'number');
    });
    assert.ok(cfg.nodes[1].x > cfg.nodes[0].x);
  });

  it('layered force layout overwrites manual coords', () => {
    const nodes = [
      { id: 'a', type: 'port', x: 10, y: 10 },
      { id: 'b', type: 'process', x: 20, y: 20 },
    ];
    const edges = [{ id: 'ab', from: 'a', to: 'b' }];
    autoLayout(nodes, edges, { force: true, rankGap: 200 });
    assert.notEqual(nodes[1].x, 20);
  });
});
