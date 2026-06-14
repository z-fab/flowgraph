import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPillsBottom } from '../src/compose-pills.js';

describe('buildPillsBottom', () => {
  it('slot admission shows slots, processing, and rejects together', () => {
    const node = { type: 'process', admission: { mode: 'slot', max: 2, rejectEdge: 'rej' } };
    const state = { slots: 2, processing: true, rejects: 3 };
    const pills = buildPillsBottom(node, state, { rejects: 3 });
    assert.equal(pills.length, 3);
    assert.equal(pills[0].text, '2/2');
    assert.equal(pills[0].tone, 'danger');
    assert.equal(pills[1].icon, '···');
    assert.equal(pills[2].icon, 'circle-x');
    assert.equal(pills[2].text, '3');
  });

  it('slot keeps reject pill at zero to avoid flicker', () => {
    const node = { type: 'process', admission: { mode: 'slot', max: 2, rejectEdge: 'rej' } };
    const pills = buildPillsBottom(node, { slots: 0, rejects: 0 }, { rejects: 0 });
    assert.ok(pills.some((p) => p.icon === 'circle-x' && p.text === '0'));
  });

  it('port showReceived displays count', () => {
    const node = { type: 'port', showReceived: true };
    const pills = buildPillsBottom(node, { received: 42 }, {});
    assert.deepEqual(pills, [{ text: '42' }]);
  });

  it('join gate shows waiting pill', () => {
    const node = { type: 'process', gate: { from: 'all-edges', count: 1 } };
    const pills = buildPillsBottom(node, { waiting: true, processing: false }, {});
    assert.ok(pills.some((p) => p.text === 'waiting'));
  });

  it('process node shows processing dots', () => {
    const node = { type: 'process', admission: { mode: 'queue' } };
    const pills = buildPillsBottom(node, { processing: true }, {});
    assert.ok(pills.some((p) => p.icon === '···'));
  });
});
