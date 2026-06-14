const NS = 'http://www.w3.org/2000/svg';

const ANGLE_SPREAD = 0.14;
const LABEL_T_SPREAD = 0.12;

export function nodeBounds(node) {
  const { w, h } = node.size;
  const hw = w / 2;
  const hh = h / 2;
  if (node.shape === 'circle') return { hw, hh: hw };
  return { hw, hh };
}

function rayRectIntersect(cx, cy, cos, sin, hw, hh) {
  let t = Infinity;
  if (cos > 1e-9) t = Math.min(t, hw / cos);
  if (cos < -1e-9) t = Math.min(t, -hw / cos);
  if (sin > 1e-9) t = Math.min(t, hh / sin);
  if (sin < -1e-9) t = Math.min(t, -hh / sin);
  if (!Number.isFinite(t) || t <= 0) t = Math.max(hw, hh);
  return { x: cx + cos * t, y: cy + sin * t };
}

export function boundaryPointAtAngle(node, angleRad) {
  const { hw, hh } = nodeBounds(node);
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  if (node.shape === 'circle') {
    return { x: node.x + cos * hw, y: node.y + sin * hw };
  }
  return rayRectIntersect(node.x, node.y, cos, sin, hw, hh);
}

function angleToSide(angle) {
  const a = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  if (a >= Math.PI * 0.25 && a < Math.PI * 0.75) return 'bottom';
  if (a >= Math.PI * 0.75 && a < Math.PI * 1.25) return 'left';
  if (a >= Math.PI * 1.25 && a < Math.PI * 1.75) return 'top';
  return 'right';
}

export function isLoopbackEdge(fromNode, toNode, routing) {
  if (routing === 'loopback') return true;
  if (routing === 'straight') return false;
  return toNode.x < fromNode.x - 20;
}

export function computeEdgeAnchorOffsets(edges, nodesById) {
  const fromGroups = {};
  const toGroups = {};
  const offsets = {};

  edges.forEach((edge) => {
    const fromNode = nodesById[edge.from];
    const toNode = nodesById[edge.to];
    if (!fromNode || !toNode) return;
    const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
    const kf = `${edge.from}:out`;
    const kt = `${edge.to}:in`;
    if (!fromGroups[kf]) fromGroups[kf] = [];
    if (!toGroups[kt]) toGroups[kt] = [];
    fromGroups[kf].push({ edge, angle });
    toGroups[kt].push({ edge, angle });
    offsets[edge.id] = { fromAngle: 0, toAngle: 0, labelT: 0.5 };
  });

  function spreadAngle(groups, field) {
    Object.values(groups).forEach((group) => {
      if (group.length <= 1) return;
      group.sort((a, b) => a.angle - b.angle);
      group.forEach((item, i) => {
        const delta = (i - (group.length - 1) / 2) * ANGLE_SPREAD;
        offsets[item.edge.id][field] = delta;
        if (field === 'fromAngle') {
          offsets[item.edge.id].labelT = 0.38 + (i / Math.max(1, group.length - 1)) * LABEL_T_SPREAD;
        }
      });
    });
  }

  spreadAngle(fromGroups, 'fromAngle');
  spreadAngle(toGroups, 'toAngle');
  return offsets;
}

function cubicAt(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

function sampleCubic(p0, p1, p2, p3, steps = 24) {
  const pts = [];
  for (let i = 0; i <= steps; i++) pts.push(cubicAt(p0, p1, p2, p3, i / steps));
  return pts;
}

function loopSidePreference(fromNode, toNode, loopSide) {
  if (loopSide === 'above' || loopSide === 'below') return loopSide;
  const goingBack = toNode.x < fromNode.x - 8;
  return goingBack ? 'below' : 'above';
}

function loopbackControls(p0, p3, fromNode, toNode, loopSide) {
  const dx = p3.x - p0.x;
  const dy = p3.y - p0.y;
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len;
  let ny = dx / len;
  const side = loopSidePreference(fromNode, toNode, loopSide);
  const wantDown = side === 'below';
  if (wantDown && ny < 0) { nx = -nx; ny = -ny; }
  if (!wantDown && ny > 0) { nx = -nx; ny = -ny; }

  const bulge = Math.max(52, len * 0.32 + 42);
  const p1 = { x: p0.x + nx * bulge * 0.55 + dx * 0.12, y: p0.y + ny * bulge * 0.55 + dy * 0.12 };
  const p2 = { x: p3.x + nx * bulge * 0.55 - dx * 0.12, y: p3.y + ny * bulge * 0.55 - dy * 0.12 };
  return { p0, p1, p2, p3 };
}

function forwardControls(p0, p3, angleOut, angleIn) {
  const dx = p3.x - p0.x;
  const dy = p3.y - p0.y;
  const dist = Math.hypot(dx, dy) || 1;
  const cpOffset = Math.min(dist * 0.45, 90);
  return {
    p0,
    p1: { x: p0.x + Math.cos(angleOut) * cpOffset, y: p0.y + Math.sin(angleOut) * cpOffset },
    p2: { x: p3.x + Math.cos(angleIn) * cpOffset, y: p3.y + Math.sin(angleIn) * cpOffset },
    p3,
  };
}

export function edgePathControls(fromNode, toNode, routing, anchorOffsets, loopSide) {
  const baseAngle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
  const off = anchorOffsets || { fromAngle: 0, toAngle: 0 };
  const angleOut = baseAngle + (off.fromAngle || 0);
  const angleIn = baseAngle + Math.PI + (off.toAngle || 0);
  const p0 = boundaryPointAtAngle(fromNode, angleOut);
  const p3 = boundaryPointAtAngle(toNode, angleIn);

  if (routing === 'straight') {
    return { kind: 'line', p0, p3 };
  }
  if (routing === 'loopback' || isLoopbackEdge(fromNode, toNode, routing)) {
    return { kind: 'cubic', ...loopbackControls(p0, p3, fromNode, toNode, loopSide) };
  }
  return { kind: 'cubic', ...forwardControls(p0, p3, angleOut, angleIn) };
}

export function buildEdgePath(fromNode, toNode, routing, anchorOffsets, loopSide) {
  const ctrl = edgePathControls(fromNode, toNode, routing, anchorOffsets, loopSide);
  if (ctrl.kind === 'line') return `M ${ctrl.p0.x} ${ctrl.p0.y} L ${ctrl.p3.x} ${ctrl.p3.y}`;
  return `M ${ctrl.p0.x} ${ctrl.p0.y} C ${ctrl.p1.x} ${ctrl.p1.y}, ${ctrl.p2.x} ${ctrl.p2.y}, ${ctrl.p3.x} ${ctrl.p3.y}`;
}

export function edgePathSamplePoints(fromNode, toNode, routing, anchorOffsets, loopSide) {
  const ctrl = edgePathControls(fromNode, toNode, routing, anchorOffsets, loopSide);
  if (ctrl.kind === 'line') return [ctrl.p0, ctrl.p3];
  return sampleCubic(ctrl.p0, ctrl.p1, ctrl.p2, ctrl.p3);
}

export function createPathElement(d, className) {
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'none');
  if (className) path.setAttribute('class', className);
  return path;
}

export function pathPointAt(pathEl, t) {
  const len = pathEl.getTotalLength();
  const clamped = Math.max(0, Math.min(1, t));
  const pt = pathEl.getPointAtLength(clamped * len);
  const pt2 = pathEl.getPointAtLength(Math.min(len, clamped * len + 1));
  const angle = Math.atan2(pt2.y - pt.y, pt2.x - pt.x);
  return { x: pt.x, y: pt.y, angle, length: len };
}

export function labelPosition(pathEl, position, offset, t) {
  const at = t != null ? t : 0.5;
  const len = pathEl.getTotalLength();
  const pt = pathEl.getPointAtLength(at * len);
  const pt2 = pathEl.getPointAtLength(Math.min(len, at * len + 1));
  const dx = pt2.x - pt.x;
  const dy = pt2.y - pt.y;
  const mag = Math.hypot(dx, dy) || 1;
  const nx = -dy / mag;
  const ny = dx / mag;
  let off = offset != null ? offset : 20;
  if (len < 70) off = Math.max(off, 26);
  else if (len < 120) off = Math.max(off, 22);

  switch (position) {
    case 'below':
      return { x: pt.x - nx * off, y: pt.y - ny * off, angle: Math.atan2(dy, dx) };
    case 'left':
      return { x: pt.x - (dx / mag) * off, y: pt.y - (dy / mag) * off, angle: Math.atan2(dy, dx) };
    case 'right':
      return { x: pt.x + (dx / mag) * off, y: pt.y + (dy / mag) * off, angle: Math.atan2(dy, dx) };
    case 'center':
      return { x: pt.x, y: pt.y, angle: Math.atan2(dy, dx) };
    case 'above':
    default:
      return { x: pt.x + nx * off, y: pt.y + ny * off, angle: Math.atan2(dy, dx) };
  }
}

import { estimateBottomPillHeight } from './compose-pills.js';

export function pillChrome(node) {
  const top = (node.pillTop?.length || 0) > 0 ? 24 : 0;
  const bottom = estimateBottomPillHeight(node);
  return { top, bottom, left: 0, right: 0 };
}

export function graphBounds(nodes, padding) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  nodes.forEach((n) => {
    const { hw, hh } = nodeBounds(n);
    const chrome = pillChrome(n);
    minX = Math.min(minX, n.x - hw - chrome.left);
    minY = Math.min(minY, n.y - hh - chrome.top);
    maxX = Math.max(maxX, n.x + hw + chrome.right);
    maxY = Math.max(maxY, n.y + hh + chrome.bottom);
  });
  const pad = padding || 40;
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  };
}

export function graphBoundsWithEdges(nodes, edges, nodesById, padding) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((n) => {
    const { hw, hh } = nodeBounds(n);
    const chrome = pillChrome(n);
    minX = Math.min(minX, n.x - hw - chrome.left);
    minY = Math.min(minY, n.y - hh - chrome.top);
    maxX = Math.max(maxX, n.x + hw + chrome.right);
    maxY = Math.max(maxY, n.y + hh + chrome.bottom);
  });

  const anchorOffsets = computeEdgeAnchorOffsets(edges, nodesById);
  edges.forEach((edge) => {
    const fromNode = nodesById[edge.from];
    const toNode = nodesById[edge.to];
    if (!fromNode || !toNode) return;
    const pts = edgePathSamplePoints(fromNode, toNode, edge.routing, anchorOffsets[edge.id], edge.loopSide);
    pts.forEach((p) => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });
  });

  const pad = padding || 40;
  if (!Number.isFinite(minX)) return graphBounds(nodes, padding);
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  };
}

export function nodeShapePath(node) {
  const { w, h } = node.size;
  const hw = w / 2;
  const hh = h / 2;
  const x = -hw;
  const y = -hh;

  if (node.shape === 'circle') {
    return `M 0 ${-hw} A ${hw} ${hw} 0 1 1 0 ${hw} A ${hw} ${hw} 0 1 1 0 ${-hw} Z`;
  }

  const r = node.style.radius || 8;
  return `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
}
