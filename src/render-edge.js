import { buildEdgePath, computeEdgeAnchorOffsets, createPathElement, labelPosition } from './geometry.js';

const NS = 'http://www.w3.org/2000/svg';

function applyPathStroke(path, stroke, theme) {
  const color = stroke.color || theme.border;
  const width = stroke.width ?? 2;
  path.style.setProperty('--fg-edge-color', color);
  path.style.setProperty('--fg-edge-width-custom', String(width));
  path.setAttribute('stroke', color);
  path.setAttribute('stroke-width', String(width));
}

function estimateLabelSize(text) {
  const len = (text || '').length;
  const charW = /[\d]/.test(text || '') ? 6.2 : 5.8;
  return { w: Math.max(52, len * charW + 20), h: 20 };
}

function createLabelGroup(text, labelCfg, theme) {
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'fg-edge-label-group');

  const { w, h } = estimateLabelSize(text);
  const fill = labelCfg.background || labelCfg.fill || theme.pillSurface || '#FFFFFF';
  const color = labelCfg.color || theme.textMuted || '#57534E';

  const rect = document.createElementNS(NS, 'rect');
  rect.setAttribute('class', 'fg-edge-label-bg');
  rect.setAttribute('x', String(-w / 2));
  rect.setAttribute('y', String(-h / 2));
  rect.setAttribute('width', String(w));
  rect.setAttribute('height', String(h));
  rect.setAttribute('rx', String(h / 2));
  rect.setAttribute('fill', fill);

  const labelEl = document.createElementNS(NS, 'text');
  labelEl.setAttribute('class', 'fg-edge-label');
  labelEl.setAttribute('text-anchor', 'middle');
  labelEl.setAttribute('dominant-baseline', 'middle');
  labelEl.setAttribute('fill', color);
  if (theme.font) labelEl.setAttribute('font-family', theme.font);
  labelEl.textContent = text;

  g.appendChild(rect);
  g.appendChild(labelEl);
  return { g, labelEl, rect, w, h, labelCfg, baseText: text };
}

export function renderEdges(edgesLayer, labelsLayer, edges, nodesById, theme) {
  const anchorOffsets = computeEdgeAnchorOffsets(edges, nodesById);
  const edgeViews = {};

  edges.forEach((edge) => {
    const fromNode = nodesById[edge.from];
    const toNode = nodesById[edge.to];
    if (!fromNode || !toNode) return;

    const off = anchorOffsets[edge.id] || { fromAngle: 0, toAngle: 0, labelT: 0.5 };
    const d = buildEdgePath(fromNode, toNode, edge.routing, off, edge.loopSide);
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'fg-edge');
    g.setAttribute('data-edge-id', edge.id);

    const path = createPathElement(d, 'fg-edge-path');
    const stroke = edge.stroke || {};
    applyPathStroke(path, stroke, theme);
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    if (stroke.dash) path.setAttribute('stroke-dasharray', stroke.dash);
    if (edge.animated) g.classList.add('fg-edge-animated');
    g.appendChild(path);
    edgesLayer.appendChild(g);

    let labelGroup = null;
    if (edge.label && edge.label.text) {
      labelGroup = createLabelGroup(edge.label.text, edge.label, theme);
      labelsLayer.appendChild(labelGroup.g);
    }

    edgeViews[edge.id] = { g, path, labelGroup, edge, anchorOff: off };
  });

  function updateLabels() {
    Object.values(edgeViews).forEach(({ path, labelGroup, edge, anchorOff }) => {
      if (!labelGroup || !edge.label) return;
      const rawT = anchorOff?.labelT ?? 0.5;
      const t = Math.max(0.34, Math.min(0.66, rawT));
      const baseOff = edge.label.offset != null ? edge.label.offset : 20;
      const pos = labelPosition(path, edge.label.position, baseOff, t);
      labelGroup.g.setAttribute('transform', `translate(${pos.x},${pos.y})`);
    });
  }

  updateLabels();

  return {
    edgeViews,
    anchorOffsets,
    updateLabels,
    updatePaths(nodesById) {
      const offsets = computeEdgeAnchorOffsets(
        Object.values(edgeViews).map((v) => v.edge),
        nodesById
      );
      Object.values(edgeViews).forEach((view) => {
        const { path, edge } = view;
        const fromNode = nodesById[edge.from];
        const toNode = nodesById[edge.to];
        if (!fromNode || !toNode) return;
        const off = offsets[edge.id] || view.anchorOff;
        view.anchorOff = off;
        const d = buildEdgePath(fromNode, toNode, edge.routing, off, edge.loopSide);
        path.setAttribute('d', d);
      });
      updateLabels();
    },
    setActive(edgeId, active, color) {
      const view = edgeViews[edgeId];
      if (!view) return;
      view.g.classList.toggle('fg-edge-active', !!active);
      if (active && color) applyPathStroke(view.path, { color, width: view.edge.stroke?.width }, theme);
      else applyPathStroke(view.path, view.edge.stroke || {}, theme);
    },
    setDimmed(edgeId, dimmed) {
      const view = edgeViews[edgeId];
      if (!view) return;
      view.path.classList.toggle('fg-edge-dimmed', !!dimmed);
    },
    getPath(edgeId) {
      return edgeViews[edgeId]?.path || null;
    },
  };
}
