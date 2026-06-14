import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { parseConfig } from '../src/config.js';
import { SimulationEngine } from '../src/simulation.js';

function baseConfig(overrides = {}) {
  return parseConfig({
    autoStart: false,
    nodes: [
      { id: 'a', type: 'process', x: 0, y: 0, duration: 100, gate: { count: 1 } },
      { id: 'b', type: 'process', x: 100, y: 0, duration: 50, gate: { from: 'any', count: 2 } },
      { id: 'c', type: 'port', role: 'sink', x: 200, y: 0, shape: 'rect', label: 'Out' },
    ],
    edges: [
      { id: 'ab', from: 'a', to: 'b' },
      { id: 'bc', from: 'b', to: 'c' },
    ],
    sources: [{ id: 's1', edge: 'ab', interval: 1000 }],
    ...overrides,
  });
}

describe('parseConfig v1', () => {
  it('parses typed nodes and edges', () => {
    const cfg = baseConfig();
    assert.equal(cfg.nodes[0].type, 'process');
    assert.equal(cfg.nodes[2].role, 'sink');
    assert.ok(cfg.edgesById.ab);
    assert.equal(cfg.edges[0].stroke.width, 2);
  });

  it('auto-layouts nodes without x/y', () => {
    const cfg = parseConfig({
      nodes: [
        { id: 'a', type: 'port', role: 'source', shape: 'circle', icon: 'inbox' },
        { id: 'b', type: 'process', label: 'P' },
      ],
      edges: [{ from: 'a', to: 'b' }],
    });
    assert.ok(cfg.nodes[0].x != null);
    assert.ok(cfg.nodes[1].x != null);
  });

  it('throws without nodes or edges', () => {
    assert.throws(() => parseConfig({ nodes: [] }), /requires nodes/);
  });

  it('resolves tone names in edge stroke and token colors', () => {
    const cfg = parseConfig({
      nodes: [
        { id: 'a', type: 'port', role: 'source', shape: 'circle' },
        { id: 'b', type: 'port', role: 'sink', shape: 'circle' },
      ],
      edges: [{
        id: 'ab', from: 'a', to: 'b',
        stroke: { color: 'danger', dash: 'dash' },
        token: { color: 'danger', shape: 'rect' },
      }],
      tokens: { color: 'warning' },
      sources: [{ edge: 'ab', interval: 1000, token: { color: 'success' } }],
    });
    assert.equal(cfg.edgesById.ab.stroke.color, '#9B1C1C');
    assert.equal(cfg.edgesById.ab.token.color, '#9B1C1C');
    assert.equal(cfg.tokenDefault.color, '#D97706');
    assert.equal(cfg.sources[0].token.color, '#3D6B52');
  });
});

describe('SimulationEngine v1', () => {
  let events;
  let spawns;
  let config;
  let sim;

  beforeEach(() => {
    events = [];
    spawns = [];
    config = baseConfig({ sources: [] });
    sim = new SimulationEngine(config, {
      onEvent: (e, p) => events.push({ e, p }),
      spawnOnEdge: (edgeId, tokenCfg, burst, onArrive) => {
        spawns.push({ edgeId, burst });
        if (onArrive) onArrive({ id: spawns.length, edgeId });
      },
    });
  });

  it('join waits for gate count', () => {
    const processStarts = [];
    const sim2 = new SimulationEngine(config, {
      onEvent: (e, p) => {
        if (e === 'node:process:start') processStarts.push(p.nodeId);
      },
      spawnOnEdge: (edgeId, _tc, _b, onArrive) => {
        if (onArrive) onArrive({ id: Math.random(), edgeId });
      },
    });
    sim2.start();
    sim2.emit('ab', {});
    assert.equal(processStarts.length, 0);
    sim2.emit('ab', {});
    assert.ok(processStarts.includes('b'));
    sim2.pause();
  });

  it('port sink absorbs tokens', () => {
    const sinks = [];
    sim = new SimulationEngine(config, {
      onEvent: (e, p) => { if (e === 'token:arrive') sinks.push(p.nodeId); },
      spawnOnEdge: (edgeId, _t, _b, onArrive) => onArrive?.({ id: 1, edgeId }),
      onMetrics: () => {},
    });
    sim.start();
    sim.emit('ab', {});
    sim.emit('ab', {});
    return new Promise((resolve) => {
      setTimeout(() => {
        assert.ok(sinks.includes('c'));
        sim.pause();
        resolve();
      }, 120);
    });
  });

  it('join all-edges ignores loopback inputs', () => {
    const cfg = parseConfig({
      nodes: [
        { id: 'a', type: 'process', duration: 10, x: 0, y: 0 },
        { id: 'b', type: 'process', duration: 10, x: 0, y: 80 },
        { id: 'j', type: 'process', duration: 10, gate: { from: 'all-edges', count: 1 }, x: 120, y: 40 },
        { id: 'out', type: 'port', role: 'sink', x: 240, y: 40 },
      ],
      edges: [
        { id: 'aj', from: 'a', to: 'j' },
        { id: 'bj', from: 'b', to: 'j' },
        { id: 'back', from: 'out', to: 'j', routing: 'loopback' },
        { id: 'jo', from: 'j', to: 'out' },
      ],
      sources: [],
    });
    const starts = [];
    const simJoin = new SimulationEngine(cfg, {
      onEvent: (e, p) => { if (e === 'node:process:start') starts.push(p.nodeId); },
      spawnOnEdge: (edgeId, _t, _b, onArrive) => onArrive?.({ id: Math.random(), edgeId }),
    });
    simJoin.start();
    simJoin.emit('aj', {});
    assert.equal(starts.length, 0);
    simJoin.emit('bj', {});
    assert.ok(starts.includes('j'));
    simJoin.pause();
  });

  it('slot admission rejects when full', () => {
    const cfg = parseConfig({
      nodes: [
        { id: 'src', type: 'port', role: 'source', shape: 'circle', x: 0, y: 0 },
        { id: 'sem', type: 'process', x: 100, y: 0, duration: 200,
          admission: { mode: 'slot', max: 1, rejectEdge: 'rej' },
          emit: { mode: 'map', map: { accept: 1 } } },
        { id: 'ok', type: 'port', role: 'sink', x: 200, y: 0, label: 'OK' },
        { id: 'rej', type: 'port', role: 'sink', shape: 'circle', icon: 'ban', x: 200, y: 80, tone: 'danger' },
      ],
      edges: [
        { id: 'in', from: 'src', to: 'sem' },
        { id: 'accept', from: 'sem', to: 'ok' },
        { id: 'rej', from: 'sem', to: 'rej' },
      ],
      sources: [],
    });
    const rejects = [];
    const sim3 = new SimulationEngine(cfg, {
      onEvent: (e) => { if (e === 'token:reject') rejects.push(1); },
      spawnOnEdge: (edgeId, _t, _b, onArrive) => onArrive?.({ id: Math.random(), edgeId }),
    });
    sim3.start();
    sim3.emit('in', {});
    sim3.emit('in', {});
    assert.equal(rejects.length, 1);
    sim3.pause();
  });

  it('queue admission rejects when busy', () => {
    const cfg = parseConfig({
      nodes: [
        { id: 'src', type: 'port', role: 'source', x: 0, y: 0 },
        { id: 'p', type: 'process', x: 100, y: 0, duration: 500,
          admission: { mode: 'queue', max: 1, rejectEdge: 'rej' } },
        { id: 'ok', type: 'port', role: 'sink', x: 200, y: 0 },
        { id: 'rej', type: 'port', role: 'sink', x: 200, y: 80 },
      ],
      edges: [
        { id: 'in', from: 'src', to: 'p' },
        { id: 'out', from: 'p', to: 'ok' },
        { id: 'rej', from: 'p', to: 'rej' },
      ],
      sources: [],
    });
    const rejects = [];
    const simQ = new SimulationEngine(cfg, {
      onEvent: (e) => { if (e === 'token:reject') rejects.push(1); },
      spawnOnEdge: (edgeId, _t, _b, onArrive) => onArrive?.({ id: Math.random(), edgeId }),
    });
    simQ.start();
    simQ.emit('in', {});
    simQ.emit('in', {});
    assert.equal(rejects.length, 1);
    simQ.pause();
  });

  it('circuit trips open and routes to fallback', () => {
    const cfg = parseConfig({
      autoStart: false,
      nodes: [
        { id: 'src', type: 'port', role: 'source', x: 0, y: 0 },
        { id: 'cb', type: 'process', x: 100, y: 0, duration: 5,
          circuit: { failureRate: 1, failureThreshold: 2, acceptEdge: 'ok', fallbackEdge: 'fb' } },
        { id: 'okn', type: 'port', role: 'sink', x: 200, y: 0 },
        { id: 'fbn', type: 'port', role: 'sink', x: 200, y: 80 },
      ],
      edges: [
        { id: 'in', from: 'src', to: 'cb' },
        { id: 'ok', from: 'cb', to: 'okn' },
        { id: 'fb', from: 'cb', to: 'fbn' },
      ],
      sources: [],
    });

    const pills = [];
    const spawns = [];
    const sim4 = new SimulationEngine(cfg, {
      onPills: (nodeId, p) => { if (nodeId === 'cb') pills.push(p.map((x) => x.text)); },
      spawnOnEdge: (edgeId, _t, _b, onArrive) => {
        spawns.push(edgeId);
        onArrive?.({ id: spawns.length, edgeId });
      },
    });
    sim4.start();
    sim4.emit('in', {});
    sim4.emit('in', {});

    return new Promise((resolve) => {
      setTimeout(() => {
        const flat = pills.flat();
        assert.ok(flat.includes('OPEN'), `expected OPEN in pills, got ${flat.join(',')}`);
        assert.ok(spawns.includes('fb'), 'fallback edge should spawn when open');
        sim4.pause();
        resolve();
      }, 80);
    });
  });
});
