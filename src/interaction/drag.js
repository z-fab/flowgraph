const THRESHOLD = 4;

export function attachNodeDrag(instance) {
  if (instance.config.interaction?.nodeDrag === false) return;

  instance.config.nodes.forEach((node) => {
    const g = instance.nodeRenderer.nodeViews[node.id]?.g;
    if (!g) return;

    let dragging = null;

    g.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      dragging = {
        id: node.id,
        sx: e.clientX,
        sy: e.clientY,
        ox: node.x,
        oy: node.y,
        moved: false,
      };
    });

    const onMove = (e) => {
      if (!dragging || dragging.id !== node.id) return;
      const dx = e.clientX - dragging.sx;
      const dy = e.clientY - dragging.sy;
      if (!dragging.moved && Math.hypot(dx, dy) < THRESHOLD) return;
      dragging.moved = true;
      const t0 = instance.viewport.screenToGraph(dragging.sx, dragging.sy);
      const t1 = instance.viewport.screenToGraph(e.clientX, e.clientY);
      node.x = dragging.ox + (t1.x - t0.x);
      node.y = dragging.oy + (t1.y - t0.y);
      instance.nodeRenderer.setPosition(node.id, node.x, node.y);
      instance.edgeRenderer.updatePaths(instance.config.nodesById);
    };

    const onUp = () => {
      if (!dragging || dragging.id !== node.id) return;
      if (dragging.moved) {
        instance._nodeJustDragged = true;
        instance._emit('layout:change', { nodeId: node.id, x: node.x, y: node.y });
      }
      dragging = null;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });
}
