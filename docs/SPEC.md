# FlowGraph Spec v1

JSON-only configuration for animated flow diagrams with token simulation.

## Node primitives

| Type | Purpose |
|------|---------|
| `port` | Source, sink, or terminal (`role`: `source` \| `sink` \| `terminal`) |
| `process` | Worker with `duration` (ms). Behavior is composed from optional config blocks below. |

## Process config blocks

| Block | Purpose |
|-------|---------|
| `admission` | How tokens enter the node |
| `gate` | Fan-in / join synchronization |
| `emit` | Fan-out routing |
| `retry` | Loop back on failure |
| `circuit` | Circuit breaker routing |

### `admission`

```json
{ "mode": "queue", "max": null, "step": 1, "rejectEdge": "rej" }
```

| mode | Behavior |
|------|----------|
| `queue` (default) | FIFO wait while busy. `max` caps tokens in node (processing + waiting); overflow → `rejectEdge`. |
| `slot` | Semaphore — rejects immediately when `max` slots are taken. |
| `batch` | Accumulates until `max` tokens, then processes in steps of `step`. |

### `gate`

```json
{ "count": 2, "from": "all-edges" }
```

| `from` | Behavior |
|--------|----------|
| `any` (default) | Any `count` tokens trigger processing |
| `all-edges` | Requires ≥1 token per sync edge (loopback excluded unless listed) |
| `["e1", "e2"]` | Requires tokens from listed edge ids |

### `emit`

```json
{ "mode": "weighted" }
```

| mode | Behavior |
|------|----------|
| `all` (default) | Fan-out to every outgoing edge |
| `map` | Pick edge by name, e.g. `{ "mode": "map", "map": { "accept": 1 } }` |
| `weighted` | Pick one edge by `weight` |
| `round-robin` | Cycle outgoing edges |
| `excludeReject` | All edges except `admission.rejectEdge` |

### `retry`

```json
{ "backEdge": "back", "maxRetries": 3 }
```

### `circuit`

```json
{
  "acceptEdge": "ok",
  "fallbackEdge": "fb",
  "failureRate": 0.25,
  "failureThreshold": 5,
  "recoveryMs": 8000
}
```

Routes via `acceptEdge` when closed, `fallbackEdge` when open.

## Visual rules

- `shape: "circle"` — icon only (no label in core)
- `shape: "rect"` — icon + label
- `pillTop[]` — author config (static)
- `pillBottom[]` — runtime state (library fills)
- Pill modes: text, icon, both, progress (`progress: 0..1`)

## Edges

No edge types. Customizations:

```json
{
  "stroke": { "color": "danger", "width": 2, "dash": "dash" },
  "label": { "text": "429", "icon": null },
  "weight": 3,
  "speed": 80,
  "routing": "bezier",
  "animated": true,
  "token": { "shape": "rect", "color": "danger" }
}
```

`dash`: `solid` \| `dash` \| `dot`

## Tokens (cascade)

`global.tokens` → `node.emit.token` → `edge.token` → spawn

## Metrics

- System panel: RT, throughput, p50/p90, rejects
- Node panel (click): state, in/out, queue, rejects, p50/p90/p99 process
- `randomness.enabled` + jitter drives percentile spread

## Layout & authoring

- `interaction.nodeDrag` — drag nodes; emits `layout:change` (default `true`)
- `interaction.nodeSelect` — click to select and open node drawer (default `true`)
- `controls.toolbar` — bottom control bar (default `true`); set `false` to hide all buttons
- `controls.title` — title header in chrome (default `true` when `title` is set)
- `controls.playPause`, `zoomReset`, `reset`, `metricsDrawer`, `layout` — toggle individual buttons
- `metrics.nodeDrawer` / `globalDrawer` — enable/disable metric drawers
- Node drawer tab **Config** — edit duration, admission, gate, weights, circuit params
- `controls.layout: true` — toolbar button runs `applyAutoLayout()` using `layout.engine`
- `layout.engine`: `"layered"` (default) or `"dagre"` (via `@dagrejs/dagre`)
- Omit `x`/`y` for auto layout on load; explicit coordinates preserved until **Auto-layout** (`force`)

See [`docs/layout-spike.md`](layout-spike.md).

### View-only / embed

For documentation, slides, or textbooks — hide authoring UI but keep pan/zoom:

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

See [`docs/EMBED.md`](EMBED.md) and [`demos/configs/27-embed-view.json`](../demos/configs/27-embed-view.json).

## Recipes

| Pattern | Config |
|---------|--------|
| Semaphore / 429 | `admission: { mode: "slot", max: 2, rejectEdge: "reject" }` + `emit: { mode: "map", map: { accept: 1 } }` |
| Micro-batch | `admission: { mode: "batch", max: 4, step: 1 }` |
| Fan-in | `gate: { from: "all-edges", count: 1 }` |
| Fan-out | `emit: { mode: "all" }` |
| Canary / router | `emit: { mode: "weighted" }` + edge `weight` |
| Retry loop | `retry: { backEdge: "back", maxRetries: 2 }` |
| Circuit breaker | `circuit: { acceptEdge, fallbackEdge, failureRate, ... }` |
| Kafka sink | `port` sink + `showReceived: true` |

## Example (semaphore)

See [`demos/configs/20-semaphore.json`](../demos/configs/20-semaphore.json).

## API

```js
import { FlowGraph } from './dist/flowgraph.js';

FlowGraph.create('#el', json);
await FlowGraph.createFromURL('#el', './config.json');
await fg.applyAutoLayout(); // or fg.applyAutoLayout('layered')
fg.updateNode('proc', { duration: 900, admission: { mode: 'slot', max: 3 } });
```

Validate against [`schema/flowgraph-v1.json`](../schema/flowgraph-v1.json).
