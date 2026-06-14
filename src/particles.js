import { pathPointAt } from './geometry.js';

const NS = 'http://www.w3.org/2000/svg';

let nextTokenId = 1;

function applyTokenColor(shapeEl, tokenCfg) {
  const color = tokenCfg.color || '#7C3AED';
  shapeEl.setAttribute('fill', color);
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
}

function placeTokenAt(token, t) {
  const pt = pathPointAt(token.path, t);
  token.el.setAttribute('transform', `translate(${pt.x},${pt.y}) rotate(${(pt.angle * 180) / Math.PI})`);
}

export class ParticleSystem {
  constructor(layer, edgeRenderer, config) {
    this.layer = layer;
    this.edgeRenderer = edgeRenderer;
    this.config = config;
    this.pool = [];
    this.active = [];
    this.maxParticles = config.maxParticles || 200;
  }

  spawn(options) {
    const { edgeId, tokenCfg, onArrive, delay = 0 } = options;
    if (this.active.length >= this.maxParticles) return null;

    const path = this.edgeRenderer.getPath(edgeId);
    if (!path) return null;

    const id = nextTokenId++;
    const el = this._acquireElement(tokenCfg);
    el.setAttribute('data-token-id', String(id));
    el.style.opacity = '0';
    this.layer.appendChild(el);

    const token = {
      id,
      edgeId,
      el,
      tokenCfg: { ...this.config.tokenDefault, ...tokenCfg },
      progress: 0,
      delay,
      delayLeft: delay,
      onArrive,
      onSpawn: options.onSpawn || null,
      path,
      done: false,
      speed: (tokenCfg && tokenCfg.speed) || this.config.tokenDefault.speed || 120,
    };
    placeTokenAt(token, 0);
    if (token.onSpawn) token.onSpawn(token);
    this.active.push(token);
    this.edgeRenderer.setActive(edgeId, true, token.tokenCfg.color);
    return token;
  }

  _acquireElement(tokenCfg) {
    const cfg = { ...this.config.tokenDefault, ...tokenCfg };
    if (this.pool.length) {
      const el = this.pool.pop();
      el.className.baseVal = 'fg-token';
      updateTokenElement(el, cfg);
      return el;
    }
    return createTokenShape(cfg);
  }

  _release(token) {
    token.el.remove();
    token.el.className.baseVal = 'fg-token';
    this.pool.push(token.el);
  }

  update(dt) {
    const edgeCounts = {};
    const toRemove = [];

    this.active.forEach((token) => {
      if (token.delayLeft > 0) {
        token.delayLeft -= dt;
        return;
      }

      token.el.style.opacity = '1';
      const pathLen = token.path.getTotalLength() || 1;
      const dist = token.speed * (dt / 1000);
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
    this.active.slice().forEach((t) => this._release(t));
    this.active = [];
    Object.keys(this.edgeRenderer.edgeViews || {}).forEach((edgeId) => {
      this.edgeRenderer.setActive(edgeId, false);
    });
  }

  countOnEdge(edgeId) {
    return this.active.filter((t) => t.edgeId === edgeId).length;
  }
}

export function spawnBurst(particles, edgeId, burst, tokenCfg, onArrive, onSpawn) {
  const count = burst?.count || 1;
  const spacing = burst?.spacing || 60;
  for (let i = 0; i < count; i++) {
    particles.spawn({
      edgeId,
      tokenCfg,
      onArrive,
      onSpawn,
      delay: i * spacing,
    });
  }
}
