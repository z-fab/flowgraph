import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseConfig } from '../src/config.js';
import { FlowPlayer, normalizeScenario } from '../src/flow-player.js';

const MINIMAL = {
  nodes: [
    { id: 'a', type: 'port', role: 'source', x: 0, y: 0 },
    { id: 'b', type: 'process', label: 'B', x: 100, y: 0 },
  ],
  edges: [{ id: 'ab', from: 'a', to: 'b' }],
  scenario: {
    loop: false,
    steps: [
      { travel: { edge: 'ab', token: 'default', title: 'Go' } },
      { dwell: { node: 'b', effect: 'processing', ms: 100, title: 'B' } },
    ],
  },
};

function makePlayer(cfg, hooks = {}) {
  const scenario = cfg.scenario;
  const track = scenario.tracks[0];
  return new FlowPlayer(track, scenario, {
    shouldNarrate: () => true,
    ...hooks,
  });
}

describe('parseConfig v2', () => {
  it('requires scenario', () => {
    assert.throws(() => parseConfig({ nodes: [], edges: [] }), /scenario/);
  });

  it('parses tokenTypes and scenario steps', () => {
    const cfg = parseConfig({
      ...MINIMAL,
      tokenTypes: { default: { color: '#f00' } },
    });
    assert.equal(cfg.scenario.tracks[0].steps.length, 2);
    assert.equal(cfg.tokenTypes.default.color, '#f00');
    assert.equal(cfg.edges[0].routing, 'bezier');
  });

  it('parses scenario tracks', () => {
    const cfg = parseConfig({
      ...MINIMAL,
      scenario: {
        tracks: [
          { id: 'a', label: 'A', steps: [{ travel: { edge: 'ab' } }] },
          { id: 'b', label: 'B', steps: [{ dwell: { node: 'b', ms: 100 } }] },
        ],
      },
    });
    assert.equal(cfg.scenario.tracks.length, 2);
  });

  it('validates edge routing', () => {
    assert.throws(
      () => parseConfig({
        ...MINIMAL,
        edges: [{ id: 'ab', from: 'a', to: 'b', routing: 'invalid' }],
      }),
      /routing/
    );
  });
});

describe('FlowPlayer', () => {
  it('runs steps in order', async () => {
    const cfg = parseConfig(MINIMAL);
    const log = [];
    const player = makePlayer(cfg, {
      onNarration: (t) => log.push(t),
      travel: async () => { log.push('travel:ab'); },
      dwell: async () => { log.push('dwell:b'); },
    });
    await player.runNext(true);
    await player.runNext(true);
    assert.deepEqual(log, ['travel:ab', 'Go', 'dwell:b', 'B']);
    assert.equal(player.stepIndex, 2);
  });

  it('ignores wait in step mode', async () => {
    const cfg = parseConfig({
      ...MINIMAL,
      scenario: {
        loop: false,
        steps: [{ wait: { ms: 5000 } }, { travel: { edge: 'ab' } }],
      },
    });
    const player = makePlayer(cfg, { travel: async () => {} });
    const t0 = Date.now();
    await player.runNext(true);
    await player.runNext(true);
    assert.ok(Date.now() - t0 < 2000);
    assert.equal(player.stepIndex, 2);
  });

  it('passes direction reverse to travel hook', async () => {
    const cfg = parseConfig({
      ...MINIMAL,
      scenario: {
        loop: false,
        steps: [{ travel: { edge: 'ab', token: 'default', direction: 'reverse' } }],
      },
    });
    let direction;
    const player = makePlayer(cfg, {
      travel: async (step) => { direction = step.direction; },
    });
    await player.runNext(true);
    assert.equal(direction, 'reverse');
  });

  it('loops when configured', async () => {
    const cfg = parseConfig({ ...MINIMAL, scenario: { ...MINIMAL.scenario, loop: true } });
    const player = makePlayer(cfg, {
      travel: async () => {},
      dwell: async () => {},
    });
    await player.runNext(false);
    await player.runNext(false);
    await player.runNext(false);
    assert.equal(player.stepIndex, 1);
  });
});

describe('normalizeScenario', () => {
  it('defaults defaultMode to play', () => {
    const s = normalizeScenario({ steps: [{ travel: { edge: 'x' } }] });
    assert.equal(s.defaultMode, 'play');
    assert.equal(s.tracks.length, 1);
  });
});
