export function applyCanvasBackground(root, viewport, theme) {
  const bg = viewport?.background || {};
  const color = bg.color || theme.background || '#FAFAF8';
  const pattern = bg.pattern || 'none';
  const patternColor = bg.patternColor || '#E8E4DC';
  const size = bg.patternSize ?? 20;
  const opacity = bg.patternOpacity ?? 0.55;

  root.style.setProperty('--fg-canvas-bg', color);
  root.style.setProperty('--fg-canvas-pattern-color', patternColor);
  root.style.setProperty('--fg-canvas-pattern-size', `${size}px`);
  root.style.setProperty('--fg-canvas-pattern-opacity', String(opacity));

  root.classList.remove('fg-canvas-dots', 'fg-canvas-grid', 'fg-canvas-cross');
  if (pattern && pattern !== 'none') {
    root.classList.add(`fg-canvas-${pattern}`);
  }
}
