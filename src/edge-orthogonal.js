/** Manhattan / orthogonal edge routing (90° segments). */

const LANE_GAP = 20;

function nodeBounds(node) {
  const { w, h } = node.size;
  const hw = w / 2;
  if (node.shape === 'circle') return { hw, hh: hw };
  return { hw, hh: h / 2 };
}

export function boundaryOnSide(node, side, lane = 0) {
  const { hw, hh } = nodeBounds(node);
  switch (side) {
    case 'right':
      return { x: node.x + hw, y: node.y + lane, side };
    case 'left':
      return { x: node.x - hw, y: node.y + lane, side };
    case 'top':
      return { x: node.x + lane, y: node.y - hh, side };
    case 'bottom':
      return { x: node.x + lane, y: node.y + hh, side };
    default:
      return { x: node.x + hw, y: node.y + lane, side: 'right' };
  }
}

function pickSides(fromNode, toNode) {
  const dx = toNode.x - fromNode.x;
  const dy = toNode.y - fromNode.y;
  if (Math.abs(dx) >= Math.abs(dy) * 0.65) {
    return dx >= 0
      ? { exit: 'right', enter: 'left' }
      : { exit: 'left', enter: 'right' };
  }
  return dy >= 0
    ? { exit: 'bottom', enter: 'top' }
    : { exit: 'top', enter: 'bottom' };
}

function isHorizontalSide(side) {
  return side === 'left' || side === 'right';
}

/** Build orthogonal polyline between two nodes. */
export function buildOrthogonalPoints(fromNode, toNode, anchorOff = {}) {
  const lane = anchorOff.lane || 0;
  const sides = pickSides(fromNode, toNode);
  const p0 = boundaryOnSide(fromNode, sides.exit, isHorizontalSide(sides.exit) ? lane : 0);
  const p3 = boundaryOnSide(toNode, sides.enter, isHorizontalSide(sides.enter) ? lane : 0);

  const pts = [p0];

  if (sides.exit === 'right' && sides.enter === 'left') {
    const midX = (p0.x + p3.x) / 2 + lane * 0.2;
    if (Math.abs(p0.y - p3.y) < 4) {
      if (lane !== 0) {
        pts.push({ x: p0.x + 16, y: p0.y }, { x: p0.x + 16, y: p0.y + lane }, { x: p3.x - 16, y: p0.y + lane }, { x: p3.x - 16, y: p3.y });
      } else {
        pts.push({ x: p3.x, y: p0.y });
      }
    } else {
      pts.push({ x: midX, y: p0.y }, { x: midX, y: p3.y });
    }
    pts.push(p3);
    return pts;
  }

  if (sides.exit === 'left' && sides.enter === 'right') {
    const midX = (p0.x + p3.x) / 2 - lane * 0.2;
    if (Math.abs(p0.y - p3.y) < 4) {
      if (lane !== 0) {
        pts.push({ x: p0.x - 16, y: p0.y }, { x: p0.x - 16, y: p0.y + lane }, { x: p3.x + 16, y: p0.y + lane }, { x: p3.x + 16, y: p3.y });
      } else {
        pts.push({ x: p3.x, y: p0.y });
      }
    } else {
      pts.push({ x: midX, y: p0.y }, { x: midX, y: p3.y });
    }
    pts.push(p3);
    return pts;
  }

  if (sides.exit === 'bottom' && sides.enter === 'top') {
    const midY = p0.y + Math.max(40, (p3.y - p0.y) * 0.45) + lane * 0.35;
    if (Math.abs(p0.x - p3.x) < 4) {
      pts.push({ x: p0.x, y: p3.y });
    } else {
      pts.push({ x: p0.x, y: midY }, { x: p3.x, y: midY });
    }
    pts.push(p3);
    return pts;
  }

  if (sides.exit === 'top' && sides.enter === 'bottom') {
    const midY = p0.y - Math.max(40, (p0.y - p3.y) * 0.45) - lane * 0.35;
    if (Math.abs(p0.x - p3.x) < 4) {
      pts.push({ x: p0.x, y: p3.y });
    } else {
      pts.push({ x: p0.x, y: midY }, { x: p3.x, y: midY });
    }
    pts.push(p3);
    return pts;
  }

  // Mixed sides — L-route via midpoint
  if (isHorizontalSide(sides.exit)) {
    pts.push({ x: p3.x, y: p0.y });
  } else {
    pts.push({ x: p0.x, y: p3.y });
  }
  pts.push(p3);
  return pts;
}

/** Orthogonal loopback (U-route above or below). */
export function buildOrthogonalLoopback(fromNode, toNode, loopSide, anchorOff = {}) {
  const lane = anchorOff.lane || 0;
  const side = loopSide === 'below' ? 'below' : 'above';
  const goingBack = toNode.x < fromNode.x - 8;
  const exitSide = goingBack ? 'left' : 'right';
  const enterSide = goingBack ? 'right' : 'left';
  const p0 = boundaryOnSide(fromNode, exitSide, lane);
  const p3 = boundaryOnSide(toNode, enterSide, lane);
  const { hw: fhw } = nodeBounds(fromNode);
  const { hw: thw } = nodeBounds(toNode);
  const bulge = Math.max(72, Math.abs(p3.x - p0.x) * 0.35 + 56) + Math.abs(lane) * 0.5;
  const outerX = Math.min(p0.x, p3.x) - Math.max(fhw, thw) - bulge;

  if (side === 'above') {
    const topY = Math.min(fromNode.y, toNode.y) - bulge;
    return [
      p0,
      { x: outerX, y: p0.y },
      { x: outerX, y: topY },
      { x: p3.x + (enterSide === 'left' ? -thw * 0.1 : thw * 0.1), y: topY },
      { x: p3.x, y: topY },
      { x: p3.x, y: p3.y },
      p3,
    ];
  }

  const botY = Math.max(fromNode.y, toNode.y) + bulge;
  return [
    p0,
    { x: outerX, y: p0.y },
    { x: outerX, y: botY },
    { x: p3.x, y: botY },
    p3,
  ];
}

export function polylineToPath(points) {
  if (!points.length) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

export function polylineLength(points) {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return len;
}

export function pointOnPolyline(points, t) {
  const total = polylineLength(points);
  if (total < 1) return { x: points[0]?.x || 0, y: points[0]?.y || 0, angle: 0, segment: 0 };
  const target = Math.max(0, Math.min(1, t)) * total;
  let acc = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const segLen = Math.hypot(b.x - a.x, b.y - a.y);
    if (acc + segLen >= target) {
      const u = segLen > 0 ? (target - acc) / segLen : 0;
      const x = a.x + (b.x - a.x) * u;
      const y = a.y + (b.y - a.y) * u;
      const angle = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)
        ? 0
        : Math.PI / 2;
      return { x, y, angle, segment: i - 1, horizontal: Math.abs(b.y - a.y) < 1 };
    }
    acc += segLen;
  }
  const last = points[points.length - 1];
  return { x: last.x, y: last.y, angle: 0, segment: points.length - 2, horizontal: true };
}

/** Prefer label on longest horizontal segment. */
export function labelOnPolyline(points, lane = 0) {
  let best = null;
  let bestLen = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const horizontal = Math.abs(b.y - a.y) < 2;
    if (horizontal && len > bestLen) {
      bestLen = len;
      best = {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2 - 12 - lane * 0.15,
        angle: 0,
      };
    }
  }
  if (best) return best;
  return pointOnPolyline(points, 0.5);
}

export function computeOrthogonalLanes(edges, nodesById) {
  const fromGroups = {};
  const offsets = {};

  edges.forEach((edge) => {
    if (edge.routing !== 'orthogonal') return;
    const fromNode = nodesById[edge.from];
    const toNode = nodesById[edge.to];
    if (!fromNode || !toNode) return;
    const key = `${edge.from}:${edge.routing}`;
    if (!fromGroups[key]) fromGroups[key] = [];
    fromGroups[key].push({ edge, angle: Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x) });
    if (!offsets[edge.id]) offsets[edge.id] = {};
    offsets[edge.id].lane = 0;
  });

  Object.values(fromGroups).forEach((group) => {
    if (group.length <= 1) return;
    group.sort((a, b) => a.angle - b.angle);
    const n = group.length;
    group.forEach((item, i) => {
      if (!offsets[item.edge.id]) offsets[item.edge.id] = {};
      offsets[item.edge.id].lane = (i - (n - 1) / 2) * LANE_GAP;
    });
  });

  return offsets;
}
