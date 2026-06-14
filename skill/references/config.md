# FlowGraph v1 — configuration reference

Canonical spec: [`docs/SPEC.md`](../../docs/SPEC.md) · JSON Schema: [`schema/flowgraph-v1.json`](../../schema/flowgraph-v1.json)

## Root config

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nodes` | `Node[]` | yes | Graph nodes |
| `edges` | `Edge[]` | yes | Directed edges |
| `sources` | `Source[]` | no* | Periodic token emitters |
| `title` | string | no | Chrome title |
| `viewport` | object | no | Canvas size and background |
| `layout` | object | no | Auto-layout engine and gaps |
| `tokens` | object | no | Default token appearance |
| `randomness` | object | no | Jitter on duration, speed, sources |
| `controls` | object | no | Toolbar buttons |
| `interaction` | object | no | Drag and node selection |
| `metrics` | object | no | Metric panels and drawers |
| `theme` | object | no | Color overrides |
| `zoom` | object | no | Zoom limits |
| `maxParticles` | number | no | Cap simultaneous tokens (default 200) |
| `autoStart` | boolean | no | Start simulation on mount (default true) |

\*Always include `sources` for animated diagrams.

### `viewport`

```json
{
  "width": "100%",
  "height": 420,
  "padding": 40,
  "background": {
    "color": "#FAFAF8",
    "pattern": "none",
    "patternColor": "#E2DDD4",
    "patternSize": 12,
    "patternOpacity": 0.4
  }
}
```

`pattern`: `none` | `dots` | `grid` | `cross`.

### `layout`

| Field | Default | Values |
|-------|---------|--------|
| `engine` | `layered` | `layered` \| `dagre` |
| `direction` | `LR` | `LR` \| `TB` |
| `rankGap` | 140 | px between ranks |
| `nodeGap` | 100 | px between siblings |

### `tokens`

```json
{ "shape": "circle", "size": 7, "speed": 120, "color": "#7C3AED" }
```

Shapes: `circle` | `rect` | `roundedRect`.

### `controls`

| Field | Default | Description |
|-------|---------|-------------|
| `toolbar` | true | Bottom control bar |
| `title` | true if `title` set | Header in chrome |
| `playPause` | true | Play/pause button |
| `zoomReset` | true | Fit-to-view button |
| `reset` | true | Reset simulation |
| `metricsDrawer` | true | Global metrics toggle |
| `layout` | false | Auto-layout button |

### `interaction`

| Field | Default | Description |
|-------|---------|-------------|
| `nodeDrag` | true | Reposition nodes |
| `nodeSelect` | true | Click opens node drawer |

### `metrics`

| Field | Description |
|-------|-------------|
| `nodePanel` | Side panel for selected node |
| `nodeDrawer` | Info / Metrics / Config drawer |
| `systemPanel` | Global system panel |
| `globalDrawer` | Global metrics drawer |
| `charts` | Time-series charts |
| `windowSec` | Chart window (default 30) |

---

## Nodes

Shared fields: `id`, `type`, `label`, `icon`, `tone`, `shape`, `x`, `y`, `pillTop`, `showReceived`.

`tone`: `primary` | `success` | `warning` | `danger`.

### `port`

Requires `role`: `source` | `sink` | `terminal`.

### `process`

| Field | Default | Description |
|-------|---------|-------------|
| `duration` | 800 | Processing time (ms) |
| `admission` | queue | Entry policy |
| `gate` | any, count 1 | Input synchronization |
| `emit` | all | Output routing |
| `retry` | — | Retry on failure |
| `circuit` | — | Circuit breaker |

#### `admission`

```json
{ "mode": "queue", "max": null, "step": 1, "rejectEdge": null }
```

| mode | Behavior |
|------|----------|
| `queue` | FIFO while busy; `max` caps total in node |
| `slot` | Reject when `max` slots taken |
| `batch` | Accumulate until `max`, release in steps of `step` |

#### `gate`

```json
{ "count": 2, "from": "all-edges" }
```

| `from` | Waits for |
|--------|-----------|
| `any` | Any incoming edge |
| `all-edges` | One token per sync edge |
| `["e1","e2"]` | Listed edges only |

#### `emit`

| mode | Behavior |
|------|----------|
| `all` | All outgoing edges |
| `map` | Named edge from `map: { edgeId: 1 }` |
| `weighted` | Pick by `edge.weight` |
| `round-robin` | Rotate outputs |
| `excludeReject` | All except `admission.rejectEdge` |

`count`: tokens emitted per firing (streaming).

#### `retry`

```json
{ "backEdge": "e-back", "maxRetries": 3 }
```

#### `circuit`

```json
{
  "acceptEdge": "e-ok",
  "fallbackEdge": "e-fallback",
  "failureRate": 0.25,
  "failureThreshold": 5,
  "recoveryMs": 8000
}
```

#### `pillTop`

```json
{ "text": "queue: 2", "icon": "layers", "tone": "warning", "animated": true, "progress": 0.5 }
```

---

## Edges

| Field | Description |
|-------|-------------|
| `id` | Default `{from}-{to}` |
| `from`, `to` | Node ids |
| `weight` | For `emit.weighted` |
| `speed` | px/s override |
| `routing` | `bezier` \| `straight` \| `loopback` |
| `loopSide` | Loopback side hint |
| `animated` | Animated dash on stroke |
| `stroke` | `{ color, width, dash }` — dash: `solid` \| `dash` \| `dot` |
| `label` | string or `{ text, icon, animated, progress }` |
| `token` | Per-edge token override |

Colors: hex or tone name (`primary`, `success`, …).

---

## Sources

| Field | Description |
|-------|-------------|
| `edge` | **Required** — edge id where token spawns |
| `interval` | ms between emissions (default 1400) |
| `delay` | ms before first emission |
| `jitter` | Interval randomness |
| `burst` | `{ count, spacing }` — burst emission |
| `token` | Appearance override |
| `enabled` | false disables emitter |

Legacy: `from` + `to` instead of `edge` (id inferred).

---

## Token cascade

Priority (later wins): `tokens` (global) → `node.emit.token` → `edge.token` → source spawn config.

---

## Events (runtime API)

Subscribe via `fg.on(event, fn)`:

- `token:spawn`, `token:arrive`, `flow:complete`
- `node:process:start`, `node:process:end`
- `layout:change`
