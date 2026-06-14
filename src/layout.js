/** Layered layout without external deps. */
export function autoLayout(nodes, edges, options = {}) {
  const rankGap = options.rankGap ?? 140;
  const nodeGap = options.nodeGap ?? 100;
  const direction = options.direction || 'LR';
  const padding = options.padding ?? 60;

  const incoming = {};
  const outgoing = {};
  edges.forEach((e) => {
    if (!outgoing[e.from]) outgoing[e.from] = [];
    if (!incoming[e.to]) incoming[e.to] = [];
    outgoing[e.from].push(e);
    incoming[e.to].push(e);
  });

  const layers = {};
  const visited = new Set();
  const roots = nodes.filter((n) => !(incoming[n.id]?.length) || n.role === 'source');
  const queue = roots.length ? roots.map((n) => n.id) : nodes.map((n) => n.id);

  queue.forEach((id) => {
    layers[id] = 0;
    visited.add(id);
  });

  let guard = 0;
  while (queue.length && guard++ < nodes.length * 3) {
    const id = queue.shift();
    const rank = layers[id] ?? 0;
    (outgoing[id] || []).forEach((e) => {
      const next = e.to;
      layers[next] = Math.max(layers[next] ?? 0, rank + 1);
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    });
  }

  nodes.forEach((n) => {
    if (layers[n.id] == null) layers[n.id] = 0;
  });

  const byRank = {};
  nodes.forEach((n) => {
    const r = layers[n.id];
    if (!byRank[r]) byRank[r] = [];
    byRank[r].push(n);
  });

  Object.keys(byRank).forEach((rank) => {
    byRank[rank].forEach((n, i) => {
      if (!options.force && n.x != null && n.y != null) return;
      if (direction === 'LR') {
        n.x = padding + Number(rank) * rankGap;
        n.y = padding + i * nodeGap;
      } else {
        n.x = padding + i * nodeGap;
        n.y = padding + Number(rank) * rankGap;
      }
    });
  });

  return nodes;
}

export function needsLayout(nodes) {
  return nodes.some((n) => n.x == null || n.y == null);
}
