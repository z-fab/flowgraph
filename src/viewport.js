export function createViewport(svg, g, config, boundsRef) {
  const zoomCfg = config.zoom;

  function applyTransform(scale, tx, ty) {
    g.setAttribute('transform', `translate(${tx},${ty}) scale(${scale})`);
  }

  const state = { scale: 1, tx: 0, ty: 0 };

  function fit() {
    const rect = svg.getBoundingClientRect();
    const b = boundsRef;
    const bw = b.width;
    const bh = b.height;
    if (!rect.width || !rect.height || !bw || !bh) return;

    const sx = rect.width / bw;
    const sy = rect.height / bh;
    state.scale = Math.min(sx, sy, zoomCfg.max || 2.5);
    state.scale = Math.max(state.scale, zoomCfg.min || 0.4);
    state.tx = (rect.width - bw * state.scale) / 2 - b.x * state.scale;
    state.ty = (rect.height - bh * state.scale) / 2 - b.y * state.scale;
    applyTransform(state.scale, state.tx, state.ty);
  }

  function updateBounds(next) {
    Object.assign(boundsRef, next);
  }

  function resetZoom() {
    fit();
  }

  function screenToGraph(clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    return {
      x: (clientX - rect.left - state.tx) / state.scale,
      y: (clientY - rect.top - state.ty) / state.scale,
    };
  }

  if (zoomCfg.enabled !== false) {
    svg.addEventListener(
      'wheel',
      (e) => {
        if (zoomCfg.wheel === false) return;
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const next = Math.min(zoomCfg.max || 2.5, Math.max(zoomCfg.min || 0.4, state.scale * delta));
        const rect = svg.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        state.tx = mx - ((mx - state.tx) / state.scale) * next;
        state.ty = my - ((my - state.ty) / state.scale) * next;
        state.scale = next;
        applyTransform(state.scale, state.tx, state.ty);
      },
      { passive: false }
    );

    svg.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest?.('.fg-node')) return;
      state.dragging = true;
      state.lastX = e.clientX;
      state.lastY = e.clientY;
      svg.classList.add('fg-dragging');
    });

    window.addEventListener('mousemove', (e) => {
      if (!state.dragging) return;
      state.tx += e.clientX - state.lastX;
      state.ty += e.clientY - state.lastY;
      state.lastX = e.clientX;
      state.lastY = e.clientY;
      applyTransform(state.scale, state.tx, state.ty);
    });

    window.addEventListener('mouseup', () => {
      if (!state.dragging) return;
      state.dragging = false;
      svg.classList.remove('fg-dragging');
    });
  }

  return {
    fit,
    resetZoom,
    updateBounds,
    screenToGraph,
    getTransform: () => ({ scale: state.scale, tx: state.tx, ty: state.ty }),
  };
}
