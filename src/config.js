import { autoLayout, needsLayout } from './layout.js';

const DEFAULTS = {
  viewport: { width: '100%', height: 420, padding: 40 },
  zoom: { enabled: true, min: 0.4, max: 2.5, wheel: true },
  theme: {
    background: '#FAFAF8',
    font: 'DM Sans, system-ui, sans-serif',
    primary: '#7C3AED',
    success: '#3D6B52',
    warning: '#D97706',
    danger: '#9B1C1C',
    border: '#CEC9BF',
    text: '#1C1917',
    textMuted: '#57534E',
    pillSurface: '#FFFFFF',
  },
  tokens: { shape: 'circle', size: 7, speed: 120, color: '#7C3AED' },
  layout: { engine: 'layered', direction: 'LR', rankGap: 140, nodeGap: 100 },
  metrics: { nodePanel: true, nodeDrawer: true, systemPanel: true, globalDrawer: true, windowSec: 30, charts: true },
  randomness: { enabled: false, duration: { jitter: 0.2 }, speed: { jitter: 0.1 }, sources: { jitter: 0.15 } },
  controls: { toolbar: true, playPause: true, zoomReset: true, metricsDrawer: true, reset: true, layout: false },
  interaction: { nodeDrag: true, nodeSelect: true },
  maxParticles: 200,
};

const TONE_COLORS = {
  primary: '#7C3AED',
  success: '#3D6B52',
  warning: '#D97706',
  danger: '#9B1C1C',
};

const VALID_TYPES = new Set(['port', 'process']);

function edgeId(from, to, explicit) {
  return explicit || `${from}-${to}`;
}

function resolveColor(color, theme) {
  if (!color) return theme.border;
  if (TONE_COLORS[color]) return TONE_COLORS[color];
  return color;
}

function normalizeToken(token, theme) {
  if (!token) return null;
  const t = { ...token };
  if (t.color) t.color = resolveColor(t.color, theme);
  return t;
}

function normalizePills(arr) {
  if (!arr) return [];
  const list = Array.isArray(arr) ? arr : [arr];
  return list.map((p) => (typeof p === 'string' ? { text: p } : { ...p }));
}

function defaultShape(type, role, rawShape) {
  if (rawShape) return rawShape === 'circle' ? 'circle' : 'rect';
  if (type === 'port' && (role === 'source' || role === 'terminal')) return 'circle';
  return 'rect';
}

function defaultSize(shape) {
  return shape === 'circle' ? { w: 64, h: 64 } : { w: 96, h: 56 };
}

function normalizeEmit(raw, rejectEdge) {
  if (!raw) {
    if (rejectEdge) return { mode: 'excludeReject', count: 1 };
    return { mode: 'all', count: 1 };
  }
  const mode = raw.mode || 'all';
  if (mode === 'map') {
    return { mode: 'map', map: raw.map || {}, count: raw.count ?? 1, token: raw.token };
  }
  return { mode, count: raw.count ?? 1, token: raw.token, map: raw.map };
}

function normalizeGate(raw) {
  const g = raw?.gate;
  if (!g) return { count: 1, from: 'any' };
  if (Array.isArray(g.from)) return { count: g.count ?? 1, from: g.from };
  if (g.from === 'all-edges') return { count: g.count ?? 1, from: 'all-edges' };
  return { count: g.count ?? 1, from: g.from || 'any' };
}

function normalizeAdmission(raw) {
  const a = raw.admission;
  if (!a) {
    return { mode: 'queue', max: null, step: 1, rejectEdge: null };
  }
  return {
    mode: a.mode || 'queue',
    max: a.max ?? null,
    step: a.step ?? 1,
    rejectEdge: a.rejectEdge || null,
  };
}

function normalizeRetry(raw) {
  if (!raw.retry) return null;
  return {
    backEdge: raw.retry.backEdge,
    maxRetries: raw.retry.maxRetries ?? 3,
  };
}

function normalizeCircuit(raw) {
  if (!raw.circuit) return null;
  const c = raw.circuit;
  return {
    failureRate: c.failureRate ?? 0.25,
    failureThreshold: c.failureThreshold ?? 5,
    recoveryMs: c.recoveryMs ?? 8000,
    acceptEdge: c.acceptEdge || null,
    fallbackEdge: c.fallbackEdge || null,
  };
}

function normalizeNode(n, theme) {
  const type = n.type || 'process';
  if (!VALID_TYPES.has(type)) {
    throw new Error(`FlowGraph: unknown node type "${type}" on "${n.id}"`);
  }

  const role = n.role || (type === 'port' ? 'sink' : null);
  const shape = defaultShape(type, role, n.shape);
  const size = { ...defaultSize(shape), ...(n.size || {}) };

  const style = {
    fill: '#fff',
    stroke: theme.border,
    strokeWidth: 1.5,
    radius: shape === 'circle' ? size.w / 2 : 8,
    ...(n.style || {}),
  };
  if (n.tone && TONE_COLORS[n.tone]) style.stroke = TONE_COLORS[n.tone];

  const admission = normalizeAdmission(n);
  const gate = type === 'process' ? normalizeGate(n) : { count: 1, from: 'any' };
  const emit = type === 'process' ? normalizeEmit(n.emit, admission.rejectEdge) : null;
  const retry = type === 'process' ? normalizeRetry(n) : null;
  const circuit = type === 'process' ? normalizeCircuit(n) : null;

  return {
    id: n.id,
    x: n.x,
    y: n.y,
    type,
    role,
    label: shape === 'circle' ? null : (n.label || n.id),
    shape,
    size,
    icon: n.icon || null,
    tone: n.tone || null,
    style,
    pillTop: normalizePills(n.pillTop),
    pillBottom: [],
    duration: type === 'process' ? (n.duration ?? 800) : 0,
    durationJitter: n.durationJitter,
    admission,
    gate,
    emit,
    retry,
    circuit,
    rejectToken: normalizeToken(n.rejectToken, theme),
    showReceived: n.showReceived === true,
    emitToken: n.emit?.token || n.emitToken || null,
  };
}

function normalizeEdge(e, theme) {
  const strokeRaw = e.stroke || {};
  const dashMap = { solid: null, dash: '6 4', dot: '2 3' };
  const dashVal = strokeRaw.dash;
  const dash = dashVal == null ? null : (dashMap[dashVal] || dashVal);

  return {
    id: edgeId(e.from, e.to, e.id),
    from: e.from,
    to: e.to,
    routing: e.routing || 'bezier',
    loopSide: e.loopSide || null,
    weight: e.weight ?? null,
    speed: e.speed ?? null,
    animated: e.animated === true,
    stroke: {
      color: resolveColor(strokeRaw.color || e.color, theme),
      width: strokeRaw.width ?? e.width ?? 2,
      dash,
    },
    label: e.label
      ? typeof e.label === 'string'
        ? { text: e.label, icon: null, animated: false, progress: null }
        : { text: e.label.text || null, icon: e.label.icon || null, animated: e.label.animated, progress: e.label.progress ?? null }
      : null,
    token: normalizeToken(e.token, theme),
  };
}

export function parseConfig(raw) {
  if (!raw || !raw.nodes || !raw.edges) {
    throw new Error('FlowGraph: config requires nodes[] and edges[]');
  }

  const theme = { ...DEFAULTS.theme, ...(raw.theme || {}) };
  const viewport = { ...DEFAULTS.viewport, ...(raw.viewport || {}) };
  if (raw.viewport?.background) {
    viewport.background = { ...(DEFAULTS.viewport.background || {}), ...raw.viewport.background };
  }
  const zoom = { ...DEFAULTS.zoom, ...(raw.zoom || {}) };
  const layout = { ...DEFAULTS.layout, ...(raw.layout || {}) };
  const metrics = { ...DEFAULTS.metrics, ...(raw.metrics || {}) };
  const randomness = { ...DEFAULTS.randomness, ...(raw.randomness || {}) };
  const tokenDefault = normalizeToken({ ...DEFAULTS.tokens, ...(raw.tokens || {}) }, theme) || { ...DEFAULTS.tokens };

  let nodes = raw.nodes.map((n) => normalizeNode(n, theme));
  const edges = raw.edges.map((e) => normalizeEdge(e, theme));

  if (needsLayout(nodes)) {
    nodes = autoLayout(nodes, edges, {
      direction: layout.direction,
      rankGap: layout.rankGap,
      nodeGap: layout.nodeGap,
      padding: viewport.padding || 60,
    });
  }

  const nodesById = {};
  nodes.forEach((n) => { nodesById[n.id] = n; });

  const edgesById = {};
  edges.forEach((e) => { edgesById[e.id] = e; });

  const outgoing = {};
  const incoming = {};
  edges.forEach((e) => {
    if (!outgoing[e.from]) outgoing[e.from] = [];
    if (!incoming[e.to]) incoming[e.to] = [];
    outgoing[e.from].push(e);
    incoming[e.to].push(e);
  });

  const sources = (raw.sources || []).map((s, i) => {
    const edgeRef = s.edge || (s.from && s.to ? edgeId(s.from, s.to) : null);
    if (!edgeRef) throw new Error(`FlowGraph: source[${i}] needs edge or from/to`);
    const edge = edgesById[edgeRef] || edges.find((e) => e.from === s.from && e.to === s.to);
    if (!edge) throw new Error(`FlowGraph: source[${i}] references unknown edge "${edgeRef}"`);
    return {
      id: s.id || `source-${i}`,
      edgeId: edge.id,
      interval: s.interval != null ? s.interval : 1400,
      delay: s.delay ?? 0,
      jitter: s.jitter || randomness.sources?.jitter || 0,
      burst: s.burst || { count: 1, spacing: 60 },
      token: normalizeToken({ ...tokenDefault, ...(s.token || {}) }, theme) || { ...tokenDefault },
      enabled: s.enabled !== false,
    };
  });

  return {
    title: raw.title || null,
    viewport,
    zoom,
    theme,
    layout,
    metrics,
    randomness,
    tokenDefault,
    maxParticles: raw.maxParticles ?? DEFAULTS.maxParticles,
    controls: { ...DEFAULTS.controls, ...(raw.controls || {}) },
    interaction: { ...DEFAULTS.interaction, ...(raw.interaction || {}) },
    injectStyles: raw.injectStyles === true,
    autoStart: raw.autoStart !== false,
    nodes,
    nodesById,
    edges,
    edgesById,
    outgoing,
    incoming,
    sources,
  };
}

export function resolveTokenConfig(config, fromNode, edge) {
  const base = { ...config.tokenDefault };
  if (fromNode?.emitToken) Object.assign(base, fromNode.emitToken);
  if (edge?.token) Object.assign(base, edge.token);
  const rejectId = fromNode?.admission?.rejectEdge;
  if (fromNode?.rejectToken && edge?.id === rejectId) Object.assign(base, fromNode.rejectToken);
  if (base.color) base.color = resolveColor(base.color, config.theme);
  return base;
}

export function applyNodePatch(config, nodeId, patch) {
  const node = config.nodesById[nodeId];
  if (!node) throw new Error(`FlowGraph: unknown node "${nodeId}"`);

  if (patch.duration != null) node.duration = Number(patch.duration);
  if (patch.showReceived != null) node.showReceived = !!patch.showReceived;

  if (patch.admission) {
    node.admission = { ...node.admission, ...patch.admission };
  }

  if (patch.gate) {
    const { mode, count } = patch.gate;
    if (mode === 'all') node.gate = { count: count ?? 1, from: 'all-edges' };
    else node.gate = { count: count ?? 1, from: 'any' };
  }

  if (patch.retry) {
    node.retry = { ...node.retry, ...patch.retry };
  }

  if (patch.circuit) {
    node.circuit = { ...node.circuit, ...patch.circuit };
  }

  if (patch.weights && typeof patch.weights === 'object') {
    Object.entries(patch.weights).forEach(([edgeId, weight]) => {
      const edge = config.edgesById[edgeId];
      if (edge && edge.from === nodeId) edge.weight = Number(weight);
    });
    node.emit = { ...node.emit, mode: 'weighted' };
  }

  const idx = config.nodes.findIndex((n) => n.id === nodeId);
  if (idx >= 0) config.nodes[idx] = node;
  return node;
}
