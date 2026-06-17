import { nodeShapePath, pillChrome } from './geometry.js';

const NS = 'http://www.w3.org/2000/svg';
const XHTML = 'http://www.w3.org/1999/xhtml';

function renderPillEl(pill, slot) {
  const el = document.createElement('span');
  el.className = `fg-pill fg-pill-${slot} fg-pill-${pill.tone || 'neutral'}`;
  if (pill.animated) el.classList.add('fg-pill-animated');

  if (pill.progress != null) {
    const bar = document.createElement('span');
    bar.className = 'fg-pill-progress';
    const fill = document.createElement('span');
    fill.className = 'fg-pill-progress-fill';
    fill.style.width = `${Math.round(Math.min(1, Math.max(0, pill.progress)) * 100)}%`;
    bar.appendChild(fill);
    el.appendChild(bar);
  }

  if (pill.icon && pill.icon !== '···') {
    const ic = document.createElement('span');
    ic.className = 'fg-pill-icon';
    ic.innerHTML = `<i data-lucide="${pill.icon}"></i>`;
    el.appendChild(ic);
  } else if (pill.icon === '···') {
    const dots = document.createElement('span');
    dots.className = 'fg-pill-dots';
    dots.innerHTML = '<i></i><i></i><i></i>';
    el.appendChild(dots);
  }

  if (pill.text) {
    const tx = document.createElement('span');
    tx.className = 'fg-pill-text';
    tx.textContent = pill.text;
    el.appendChild(tx);
  }

  return el;
}

function buildNodeContent(node) {
  const { w, h } = node.size;
  const chrome = pillChrome(node);
  const foW = w + chrome.left + chrome.right;
  const foH = h + chrome.top + chrome.bottom;

  const shell = document.createElement('div');
  shell.className = 'fg-node-shell';
  shell.setAttribute('xmlns', XHTML);
  shell.style.width = `${foW}px`;
  shell.style.height = `${foH}px`;
  if (chrome.top) shell.style.setProperty('--fg-chrome-top', `${chrome.top}px`);
  if (chrome.bottom) shell.style.setProperty('--fg-chrome-bottom', `${chrome.bottom}px`);

  const topSlot = document.createElement('div');
  topSlot.className = 'fg-node-slot fg-node-slot-top';
  (node.pillTop || []).forEach((p) => topSlot.appendChild(renderPillEl(p, 'top')));
  shell.appendChild(topSlot);

  const core = document.createElement('div');
  core.className = 'fg-node-core';
  core.style.width = `${w}px`;
  core.style.height = `${h}px`;

  if (node.icon) {
    const ic = document.createElement('span');
    ic.className = 'fg-node-icon';
    ic.innerHTML = `<i data-lucide="${node.icon}"></i>`;
    core.appendChild(ic);
  }

  if (node.label && node.shape !== 'circle') {
    const lbl = document.createElement('span');
    lbl.className = 'fg-node-label';
    lbl.textContent = node.label;
    core.appendChild(lbl);
  }

  shell.appendChild(core);

  const bottomSlot = document.createElement('div');
  bottomSlot.className = 'fg-node-slot fg-node-slot-bottom fg-node-bottom-pills';
  shell.appendChild(bottomSlot);

  return { shell, topSlot, bottomSlot };
}

export function renderNodes(nodesLayer, nodes, theme) {
  const nodeViews = {};

  nodes.forEach((node) => {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'fg-node');
    g.setAttribute('data-node-id', node.id);
    g.setAttribute('transform', `translate(${node.x},${node.y})`);
    if (node.tone) g.classList.add(`fg-tone-${node.tone}`);

    const shape = document.createElementNS(NS, 'path');
    shape.setAttribute('class', 'fg-node-shape');
    shape.setAttribute('d', nodeShapePath(node));
    shape.setAttribute('fill', node.style.fill || '#fff');
    shape.setAttribute('stroke', node.style.stroke || theme.border);
    shape.setAttribute('stroke-width', String(node.style.strokeWidth || 1.5));
    shape.setAttribute('stroke-linejoin', 'round');
    g.appendChild(shape);

    const { w, h } = node.size;
    const chrome = pillChrome(node);
    const { shell, topSlot, bottomSlot } = buildNodeContent(node);
    const fo = document.createElementNS(NS, 'foreignObject');
    fo.setAttribute('x', String(-w / 2 - chrome.left));
    fo.setAttribute('y', String(-h / 2 - chrome.top));
    fo.setAttribute('width', String(w + chrome.left + chrome.right));
    fo.setAttribute('height', String(h + chrome.top + chrome.bottom));
    fo.setAttribute('class', 'fg-node-fo');
    fo.appendChild(shell);
    g.appendChild(fo);

    nodesLayer.appendChild(g);
    nodeViews[node.id] = { g, shape, fo, node, topSlot, bottomSlot };
  });

  return {
    nodeViews,
    setPillsTop(nodeId, pills) {
      const view = nodeViews[nodeId];
      if (!view) return;
      view.topSlot.innerHTML = '';
      (pills || []).forEach((p) => view.topSlot.appendChild(renderPillEl(p, 'top')));
      if (typeof window !== 'undefined' && window.lucide) {
        window.lucide.createIcons({ nodes: view.topSlot.querySelectorAll('[data-lucide]') });
      }
    },
    setPillsBottom(nodeId, pills) {
      const view = nodeViews[nodeId];
      if (!view) return;
      view.bottomSlot.innerHTML = '';
      (pills || []).forEach((p) => view.bottomSlot.appendChild(renderPillEl(p, 'bottom')));
      if (typeof window !== 'undefined' && window.lucide) {
        window.lucide.createIcons({ nodes: view.bottomSlot.querySelectorAll('[data-lucide]') });
      }
    },
    appendPillBottom(nodeId, pill, key) {
      const view = nodeViews[nodeId];
      if (!view) return null;
      const el = renderPillEl(pill, 'bottom');
      if (key) el.dataset.fgPillKey = key;
      view.bottomSlot.appendChild(el);
      if (typeof window !== 'undefined' && window.lucide) {
        window.lucide.createIcons({ nodes: el.querySelectorAll('[data-lucide]') });
      }
      return el;
    },
    removePillBottomByKey(nodeId, key) {
      const view = nodeViews[nodeId];
      if (!view || !key) return;
      view.bottomSlot.querySelectorAll(`[data-fg-pill-key="${key}"]`).forEach((el) => el.remove());
    },
    setEffect(nodeId, effect) {
      const view = nodeViews[nodeId];
      if (!view) return;
      view.g.classList.remove('fg-effect-pulse', 'fg-effect-blink', 'fg-effect-processing', 'fg-effect-waiting', 'fg-effect-active', 'fg-effect-open');
      if (effect) view.g.classList.add(`fg-effect-${effect}`);
    },
    setActive(nodeId, active) {
      const view = nodeViews[nodeId];
      if (!view) return;
      view.g.classList.toggle('fg-node-active', !!active);
    },
    setStepActive(nodeId, active) {
      const view = nodeViews[nodeId];
      if (!view) return;
      view.g.classList.toggle('fg-node-step-active', !!active);
    },
    setSelected(nodeId, selected) {
      const view = nodeViews[nodeId];
      if (!view) return;
      view.g.classList.toggle('fg-node-selected', !!selected);
    },
    setPosition(nodeId, x, y) {
      const view = nodeViews[nodeId];
      if (!view) return;
      view.node.x = x;
      view.node.y = y;
      view.g.setAttribute('transform', `translate(${x},${y})`);
    },
    refreshIcons() {
      if (typeof window !== 'undefined' && window.lucide) {
        window.lucide.createIcons({ nodes: nodesLayer.querySelectorAll('[data-lucide]') });
      }
    },
  };
}
