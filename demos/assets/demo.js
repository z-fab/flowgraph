import { FlowGraph } from '../../dist/flowgraph.js';

function initIcons() {
  if (window.lucide) window.lucide.createIcons();
}

export async function mountFromURL(selector, url) {
  initIcons();
  return FlowGraph.createFromURL(selector, url);
}
