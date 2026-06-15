import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseConfig } from '../src/config.js';

describe('parseConfig v2', () => {
  it('parses typed nodes and edges', () => {
    const cfg = parseConfig({
      nodes: [
        { id: 'a', type: 'port', role: 'source', x: 0, y: 0 },
        { id: 'b', type: 'process', label: 'B', x: 100, y: 0 },
      ],
      edges: [
        { id: 'ab', from: 'a', to: 'b', routing: 'straight' },
      ],
      scenario: {
        steps: [{ travel: { edge: 'ab' } }],
      },
    });
    assert.equal(cfg.nodes.length, 2);
    assert.equal(cfg.edges[0].routing, 'straight');
    assert.equal(cfg.scenario.tracks[0].steps[0].kind, 'travel');
  });

  it('throws without nodes or edges', () => {
    assert.throws(() => parseConfig({ nodes: [], edges: [] }));
  });

  it('resolves tone names in edge stroke', () => {
    const cfg = parseConfig({
      nodes: [
        { id: 'a', type: 'port', x: 0, y: 0 },
        { id: 'b', type: 'port', x: 100, y: 0 },
      ],
      edges: [{ id: 'ab', from: 'a', to: 'b', stroke: { color: 'success' } }],
      scenario: { steps: [{ narrate: { title: 't' } }] },
    });
    assert.equal(cfg.edges[0].stroke.color, '#3D6B52');
  });
});
