import { pathPointAt } from './geometry.js';

const NS = 'http://www.w3.org/2000/svg';

let nextTokenId = 1;

function applyTokenColor(shapeEl, tokenCfg) {
  shapeEl.setAttribute('fill', tokenCfg.color || '#7C3AED');
}

function addTokenLabel(inner, text, size) {
  let labelEl = inner.querySelector('.fg-token-label');
  if (!labelEl) {
    labelEl = document.createElementNS(NS, 'text');
    labelEl.setAttribute('class', 'fg-token-label');
    labelEl.setAttribute('text-anchor', 'middle');
    labelEl.setAttribute('dominant-baseline', 'central');
    inner.appendChild(labelEl);
  }
  const fontSize = Math.max(6, Math.round(size * 0.85));
  labelEl.setAttribute('font-size', String(fontSize));
  labelEl.setAttribute('fill', '#fff');
  labelEl.textContent = text;
}

function createTokenShape(tokenCfg) {
  const shape = tokenCfg.shape || 'circle';
  const size = tokenCfg.size || 7;
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'fg-token');

  const inner = document.createElementNS(NS, 'g');
  inner.setAttribute('class', 'fg-token-inner');
  if (tokenCfg.effect) inner.classList.add(`fg-token-${tokenCfg.effect}`);

  let shapeEl;
  if (shape === 'rect' || shape === 'roundedRect') {
    shapeEl = document.createElementNS(NS, 'rect');
    const s = size * 2;
    shapeEl.setAttribute('class', 'fg-token-shape');
    shapeEl.setAttribute('x', String(-size));
    shapeEl.setAttribute('y', String(-size));
    shapeEl.setAttribute('width', String(s));
    shapeEl.setAttribute('height', String(s));
    if (shape === 'roundedRect') shapeEl.setAttribute('rx', String(size * 0.35));
  } else {
    shapeEl = document.createElementNS(NS, 'circle');
    shapeEl.setAttribute('class', 'fg-token-shape');
    shapeEl.setAttribute('r', String(size));
  }
  applyTokenColor(shapeEl, tokenCfg);
  inner.appendChild(shapeEl);

  if (tokenCfg.label) {
    addTokenLabel(inner, tokenCfg.label, size);
  }

  g.appendChild(inner);
  g._fgInner = inner;
  g._fgShape = shapeEl;
  return g;
}

function updateTokenElement(el, tokenCfg) {
  const inner = el._fgInner || el.querySelector('.fg-token-inner');
  const shapeEl = el._fgShape || el.querySelector('.fg-token-shape');
  if (!inner || !shapeEl) return;
  inner.className.baseVal = 'fg-token-inner';
  if (tokenCfg.effect) inner.classList.add(`fg-token-${tokenCfg.effect}`);
  applyTokenColor(shapeEl, tokenCfg);

  const label = inner.querySelector('.fg-token-label');
  if (tokenCfg.label) {
    addTokenLabel(inner, tokenCfg.label, tokenCfg.size || 7);
  } else if (label) {
    label.remove();
  }
}

function placeTokenAt(token, t) {
  const progress = token.reverse ? (1 - t) : t;
  const pt = pathPointAt(token.path, progress);
  let angle = pt.angle;
  if (token.reverse) angle += Math.PI;
  token.el.setAttribute('transform', `translate(${pt.x},${pt.y}) rotate(${(angle * 180) / Math.PI})`);
}

export class ParticleSystem {
  constructor(layer, edgeRenderer, config) {
    this.layer = layer;
    this.edgeRenderer = edgeRenderer;
    this.config = config;
    this.pool = [];
    this.active = [];
    this.maxParticles = config.maxParticles || 200;
    this.speedMultiplier = 1;
  }

  setSpeedMultiplier(m) {
    this.speedMultiplier = m || 1;
  }

  spawn(options) {
    const { edgeId, tokenCfg, onArrive, delay = 0, reverse = false } = options;
    if (this.active.length >= this.maxParticles) return null;

    const path = this.edgeRenderer.getPath(edgeId);
    if (!path) return null;

    const id = nextTokenId++;
    const cfg = { ...this.config.tokenDefault, ...tokenCfg };
    const el = this._acquireElement(cfg);
    el.setAttribute('data-token-id', String(id));
    el.style.opacity = '0';
    this.layer.appendChild(el);

    const edge = this.config.edgesById[edgeId];
    const speed = (tokenCfg && tokenCfg.speed) || edge?.speed || this.config.tokenDefault.speed || 120;

    const token = {
      id,
      edgeId,
      el,
      tokenCfg: cfg,
      progress: 0,
      delay,
      delayLeft: delay,
      onArrive,
      path,
      done: false,
      speed,
      reverse: !!reverse,
    };
    placeTokenAt(token, 0);
    this.active.push(token);
    this.edgeRenderer.setActive(edgeId, true, token.tokenCfg.color);
    return token;
  }

  _acquireElement(tokenCfg) {
    if (this.pool.length) {
      const el = this.pool.pop();
      el.className.baseVal = 'fg-token';
      updateTokenElement(el, tokenCfg);
      return el;
    }
    return createTokenShape(tokenCfg);
  }

  _release(token) {
    token.el.remove();
    token.el.className.baseVal = 'fg-token';
    this.pool.push(token.el);
  }

  update(dt) {
    const edgeCounts = {};
    const toRemove = [];
    const speedMul = this.speedMultiplier || 1;

    this.active.forEach((token) => {
      if (token.delayLeft > 0) {
        token.delayLeft -= dt;
        return;
      }

      token.el.style.opacity = '1';
      const pathLen = token.path.getTotalLength() || 1;
      const dist = token.speed * speedMul * (dt / 1000);
      token.progress += dist / pathLen;

      if (token.progress >= 1) {
        token.progress = 1;
        token.done = true;
        toRemove.push(token);
        if (token.onArrive) token.onArrive(token);
      }

      placeTokenAt(token, token.progress);
      edgeCounts[token.edgeId] = (edgeCounts[token.edgeId] || 0) + 1;
    });

    toRemove.forEach((token) => {
      const idx = this.active.indexOf(token);
      if (idx >= 0) this.active.splice(idx, 1);
      this._release(token);
    });

    Object.keys(this.edgeRenderer.edgeViews || {}).forEach((edgeId) => {
      if (!edgeCounts[edgeId]) {
        this.edgeRenderer.setActive(edgeId, false);
      }
    });
  }

  clear() {
    this.active.slice().forEach((t) => {
      t.el.remove();
      this.pool.push(t.el);
    });
    this.active = [];
    Object.keys(this.edgeRenderer.edgeViews || {}).forEach((edgeId) => {
      this.edgeRenderer.setActive(edgeId, false);
    });
  }

  travel(edgeId, tokenCfg, reverse = false) {
    return new Promise((resolve) => {
      this.spawn({
        edgeId,
        tokenCfg,
        reverse,
        onArrive: () => resolve(),
      });
    });
  }
}
