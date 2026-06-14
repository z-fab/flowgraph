# Embedding FlowGraph (view-only)

Use this profile when FlowGraph appears inside documentation, slides, or textbooks and should not expose authoring chrome.

## Minimal embed config

```json
{
  "interaction": { "nodeDrag": false, "nodeSelect": false },
  "controls": { "toolbar": false, "title": false },
  "metrics": {
    "nodeDrawer": false,
    "globalDrawer": false,
    "nodePanel": false,
    "systemPanel": false
  }
}
```

Pan and zoom on the canvas **remain enabled** (scroll to zoom, drag background to pan).

## Loading assets

Copy these files into your static site (or install via npm):

```
flowgraph.css
dist/flowgraph.iife.min.js   # Dagre bundled; no extra deps
```

Lucide icons (optional but recommended for node icons):

```html
<script src="https://unpkg.com/lucide@latest"></script>
```

## IIFE example

```html
<link rel="stylesheet" href="/assets/flowgraph.css">
<div id="diagram"></div>
<script src="/assets/flowgraph.iife.min.js"></script>
<script>
  const FG = (window.FlowGraph && window.FlowGraph.create)
    ? window.FlowGraph
    : (window.FlowGraph.default || window.FlowGraph.FlowGraph);
  fetch('/configs/my-flow.json')
    .then(r => r.json())
    .then(cfg => FG.create('#diagram', Object.assign({
      interaction: { nodeDrag: false, nodeSelect: false },
      controls: { toolbar: false, title: false },
      metrics: { nodeDrawer: false, globalDrawer: false, nodePanel: false, systemPanel: false }
    }, cfg)));
</script>
```

## ESM example

```html
<link rel="stylesheet" href="/assets/flowgraph.css">
<div id="diagram"></div>
<script type="module">
  import { FlowGraph } from '/assets/flowgraph.js';
  const cfg = await fetch('/configs/my-flow.json').then(r => r.json());
  FlowGraph.create('#diagram', { /* embed flags above */, ...cfg });
</script>
```

## Reference demo

See [`demos/configs/27-embed-view.json`](../demos/configs/27-embed-view.json) and [`demos/27-embed-view.html`](../demos/27-embed-view.html).

## Authoring mode

For playgrounds or internal tools, enable full chrome:

```json
{
  "interaction": { "nodeDrag": true, "nodeSelect": true },
  "controls": { "toolbar": true, "playPause": true, "zoomReset": true, "reset": true },
  "metrics": { "nodeDrawer": true, "nodePanel": true }
}
```

Demo: [`demos/configs/25-playground.json`](../demos/configs/25-playground.json).
