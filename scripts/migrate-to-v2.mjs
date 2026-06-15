#!/usr/bin/env node
/** Migrate v1 demo configs to v2 visual scenario format. */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = join(__dirname, '../demos/configs');

const VISUAL_NODE_KEYS = new Set([
  'id', 'type', 'role', 'label', 'icon', 'shape', 'size', 'tone', 'style',
  'pillTop', 'pillBottom', 'x', 'y',
]);

const VISUAL_EDGE_KEYS = new Set([
  'id', 'from', 'to', 'routing', 'loopSide', 'stroke', 'label', 'token', 'animated',
]);

function slimNode(n) {
  const out = {};
  Object.keys(n).forEach((k) => {
    if (VISUAL_NODE_KEYS.has(k)) out[k] = n[k];
  });
  return out;
}

function slimEdge(e) {
  const out = {};
  Object.keys(e).forEach((k) => {
    if (VISUAL_EDGE_KEYS.has(k)) out[k] = e[k];
  });
  return out;
}

function buildOutgoing(edges) {
  const out = {};
  edges.forEach((e) => {
    if (!out[e.from]) out[e.from] = [];
    out[e.from].push(e);
  });
  return out;
}

function autoScenario(raw) {
  const edges = raw.edges || [];
  const nodesById = Object.fromEntries((raw.nodes || []).map((n) => [n.id, n]));
  const outgoing = buildOutgoing(edges);
  const steps = [];

  const tokenTypes = {
    default: { ...(raw.tokens || {}), color: raw.tokens?.color || '#7C3AED' },
  };

  const sources = raw.sources?.length
    ? raw.sources
    : (raw.nodes || []).filter((n) => n.role === 'source').map((n, i) => ({
      id: `src-${i}`,
      edge: edges.find((e) => e.from === n.id)?.id,
    })).filter((s) => s.edge);

  const visited = new Set();

  function walkFromEdge(edgeId, depth = 0) {
    if (!edgeId || visited.has(edgeId) || depth > 40) return;
    visited.add(edgeId);
    const edge = edges.find((e) => e.id === edgeId);
    if (!edge) return;

    const token = edge.token?.color ? 'edge' : 'default';
    if (edge.token && !tokenTypes.edge) {
      tokenTypes.edge = { ...edge.token };
    }

    steps.push({
      travel: {
        edge: edge.id,
        token,
        title: edge.label?.text ? `${edge.from} → ${edge.to} · ${edge.label.text}` : undefined,
      },
    });

    const toNode = nodesById[edge.to];
    if (toNode?.type === 'process') {
      steps.push({
        dwell: {
          node: toNode.id,
          effect: 'processing',
          ms: typeof toNode.duration === 'number' ? Math.min(toNode.duration, 1200) : 500,
          title: toNode.label || toNode.id,
        },
      });
    }

    const nextEdges = outgoing[edge.to] || [];
    nextEdges.forEach((ne) => walkFromEdge(ne.id, depth + 1));
  }

  sources.forEach((src) => walkFromEdge(src.edge));

  if (!steps.length && edges.length) {
    walkFromEdge(edges[0].id);
  }

  if (!steps.length) {
    steps.push({ narrate: { title: raw.title || 'Demo', description: 'Cenário visual.', ms: 800 } });
  }

  steps.push({ wait: { ms: 1200 } });

  return { tokenTypes, scenario: { loop: true, playInterval: 600, steps } };
}

function migrate(raw) {
  if (raw.scenario) return raw;

  const { tokenTypes, scenario } = autoScenario(raw);

  const out = {
    title: raw.title,
    viewport: raw.viewport,
    theme: raw.theme,
    layout: raw.layout,
    tokens: raw.tokens,
    tokenTypes,
    controls: { ...(raw.controls || {}), metricsDrawer: false },
    interaction: raw.interaction,
    autoStart: raw.autoStart,
    nodes: (raw.nodes || []).map(slimNode),
    edges: (raw.edges || []).map(slimEdge),
    scenario,
  };

  Object.keys(out).forEach((k) => out[k] == null && delete out[k]);
  return out;
}

const files = readdirSync(CONFIG_DIR).filter((f) => f.endsWith('.json'));
let count = 0;
files.forEach((file) => {
  const path = join(CONFIG_DIR, file);
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  if (raw.scenario) return;
  const v2 = migrate(raw);
  writeFileSync(path, `${JSON.stringify(v2, null, 2)}\n`);
  count += 1;
  console.log('migrated', file);
});
console.log(`Done: ${count} files migrated.`);
