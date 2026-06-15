# Embedding FlowGraph (view-only)

Use this profile when FlowGraph appears inside documentation, slides, or textbooks and should not expose authoring chrome.

## Minimal embed config

```json
{
  "interaction": { "nodeDrag": false, "nodeSelect": false },
  "controls": { "toolbar": false, "title": false, "step": false },
  "scenario": {
    "loop": true,
    "defaultMode": "play",
    "steps": [ ... ]
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
      controls: { toolbar: false, title: false, step: false }
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
  FlowGraph.create('#diagram', {
    ...cfg,
    interaction: { nodeDrag: false, nodeSelect: false },
    controls: { toolbar: false, title: false, step: false },
  });
</script>
```

## Textbook kit (`tbFlow`)

The textbook skill wraps FlowGraph v2 via `tbFlow(selector, config)` — see [skill-textbook `flowgraph.md`](https://github.com/z-fab/skill-textbook/blob/main/skill/references/flowgraph.md).

Bundle path inside the kit: `textbook/assets/vendor/flowgraph/`.
