import { autoLayout, needsLayout } from './layout.js';
import { normalizeScenario } from './flow-player.js';

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
  controls: {
    toolbar: true, playPause: true, zoomReset: true, reset: true, layout: false,
    step: true, fullscreen: true, metricsDrawer: false, speed: true,
  },
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
const VALID_ROUTING = new Set(['bezier', 'straight', 'loopback', 'orthogonal']);

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
    pillBottom: normalizePills(n.pillBottom),
    metrics: n.metrics ? {
      queue: n.metrics.queue ? { max: n.metrics.queue.max ?? null } : null,
      count: n.metrics.count === true,
    } : null,
  };
}

function normalizeEdge(e, theme) {
  const routing = e.routing || 'bezier';
  if (!VALID_ROUTING.has(routing)) {
    throw new Error(`FlowGraph: unknown routing "${routing}" on edge "${e.id || `${e.from}-${e.to}`}"`);
  }

  const strokeRaw = e.stroke || {};
  const dashMap = { solid: null, dash: '6 4', dot: '2 3' };
  const dashVal = strokeRaw.dash;
  const dash = dashVal == null ? null : (dashMap[dashVal] || dashVal);

  return {
    id: edgeId(e.from, e.to, e.id),
    from: e.from,
    to: e.to,
    routing,
    loopSide: e.loopSide || null,
    speed: e.speed ?? null,
    animated: e.animated === true,
    stroke: {
      color: resolveColor(strokeRaw.color || e.color, theme),
      width: strokeRaw.width ?? e.width ?? 2,
      dash,
    },
    label: e.label
      ? typeof e.label === 'string'
        ? { text: e.label, icon: null, animated: false, progress: null, position: 'above' }
        : {
          text: e.label.text || null,
          icon: e.label.icon || null,
          animated: e.label.animated,
          progress: e.label.progress ?? null,
          position: e.label.position || 'above',
          offset: e.label.offset ?? null,
        }
      : null,
    token: normalizeToken(e.token, theme),
  };
}

function normalizeTokenTypes(raw, theme, tokenDefault) {
  const types = { default: { ...tokenDefault } };
  if (!raw) return types;
  Object.entries(raw).forEach(([key, val]) => {
    types[key] = normalizeToken({ ...tokenDefault, ...val }, theme) || { ...tokenDefault };
  });
  return types;
}

export function parseConfig(raw) {
  if (!raw || !raw.nodes || !raw.edges) {
    throw new Error('FlowGraph: config requires nodes[] and edges[]');
  }
  if (!raw.scenario) {
    throw new Error('FlowGraph: config requires scenario (v2 visual format)');
  }

  const theme = { ...DEFAULTS.theme, ...(raw.theme || {}) };
  const viewport = { ...DEFAULTS.viewport, ...(raw.viewport || {}) };
  if (raw.viewport?.background) {
    viewport.background = { ...(DEFAULTS.viewport.background || {}), ...raw.viewport.background };
  }
  const zoom = { ...DEFAULTS.zoom, ...(raw.zoom || {}) };
  const layout = { ...DEFAULTS.layout, ...(raw.layout || {}) };
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

  const tokenTypes = normalizeTokenTypes(raw.tokenTypes, theme, tokenDefault);
  const scenario = normalizeScenario(raw.scenario);

  return {
    title: raw.title || null,
    viewport,
    zoom,
    theme,
    layout,
    tokenDefault,
    tokenTypes,
    scenario,
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
  };
}

export function resolveTokenType(config, typeKey, edge) {
  const base = { ...(config.tokenTypes.default || config.tokenDefault) };
  if (typeKey && config.tokenTypes[typeKey]) Object.assign(base, config.tokenTypes[typeKey]);
  if (edge?.token) Object.assign(base, edge.token);
  if (base.color) base.color = resolveColor(base.color, config.theme);
  return base;
}

export { autoLayout, needsLayout };
