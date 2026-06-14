import dagre from '@dagrejs/dagre';
import { estimateBottomPillHeight } from './compose-pills.js';

/** Dagre layout adapter (opt-in via layout.engine: "dagre" or applyAutoLayout). */
export function dagreLayout(nodes, edges, options = {}) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: options.direction || 'LR',
    nodesep: options.nodeGap ?? 60,
    ranksep: options.rankGap ?? 90,
    marginx: options.padding ?? 48,
    marginy: options.padding ?? 48,
  });

  nodes.forEach((n) => {
    const w = n.size?.w ?? 96;
    const h = (n.size?.h ?? 56) + estimateBottomPillHeight(n);
    g.setNode(n.id, { width: w, height: h });
  });

  edges
    .filter((e) => e.routing !== 'loopback')
    .forEach((e) => {
      if (g.hasNode(e.from) && g.hasNode(e.to)) g.setEdge(e.from, e.to);
    });

  dagre.layout(g);

  nodes.forEach((n) => {
    const pos = g.node(n.id);
    if (pos) {
      n.x = pos.x;
      n.y = pos.y;
    }
  });

  return nodes;
}
