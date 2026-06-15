# FlowGraph Spec v2

JSON-only configuration for **scripted visual flow animation**. See also [`SCENARIO.md`](SCENARIO.md) and [`schema/flowgraph-v2.json`](../schema/flowgraph-v2.json).

> **v1 (simulation engine)** is deprecated. See [`CHANGELOG.md`](../CHANGELOG.md) and tag `v1.0.0` for the old model (`sources`, `admission`, `gate`, `emit`).

## Required structure

```json
{
  "nodes": [ { "id": "a", "type": "port", "role": "source", "icon": "user" } ],
  "edges": [ { "id": "e1", "from": "a", "to": "b" } ],
  "scenario": {
    "loop": true,
    "steps": [
      { "travel": { "edge": "e1", "token": "default" } },
      { "dwell": { "node": "b", "effect": "processing", "ms": 500 } }
    ]
  }
}
```

## Node types

| Type | Purpose |
|------|---------|
| `port` | Visual endpoint (`role`: `source` \| `sink` \| `terminal`) |
| `process` | Labeled box with optional `metrics`, `pillTop`, icons |

Process nodes no longer simulate queues internally — use `scenario` steps + optional `metrics` on nodes for visual counters.

## Scenario steps

| Step | Purpose |
|------|---------|
| `travel` | Token moves along `edge`; optional `direction: "reverse"` |
| `dwell` | Visual effect on `node` (`processing`, `waiting`, `open`) |
| `parallel` | Multiple sub-steps (parallel in play; sequential in narrative/step) |
| `setPill` / `setEffect` | Update node chrome |
| `wait` / `narrate` / `focus` | Timing and camera |

## Edges

| Field | Values |
|-------|--------|
| `routing` | `bezier` (default), `straight`, `loopback`, `orthogonal` |
| `loopSide` | `above` \| `below` for loopbacks |
| `stroke` | `{ color, width, dash }` — colors accept tone names |
| `label` | string or `{ text, position }` |

## Multi-track scenarios

```json
"scenario": {
  "tracks": [
    { "id": "predict", "label": "POST", "offset": 0, "steps": [ ... ] },
    { "id": "worker", "label": "Worker", "offset": 900, "steps": [ ... ] }
  ]
}
```

- **play**: all tracks in parallel (`offset` delays start)
- **narrative**: one selected track auto-plays; overlay title/description + track picker
- **step**: floating panel with script list, track picker, Voltar/Próximo

## Metrics (visual only)

```json
{ "metrics": { "queue": { "max": 8 }, "count": true } }
```

Increment on token arrive/depart during `travel` steps. Opt out per token or step:

```json
"tokenTypes": { "poll": { "countMetrics": false } }
"travel": { "edge": "e-read", "countMetrics": false }
```

## Controls & embed

| Key | Default | Embed (textbook) |
|-----|---------|------------------|
| `controls.toolbar` | true | false |
| `controls.title` | true if `title` | false |
| `controls.step` | true | false |
| `controls.layout` | false | false |
| `interaction.nodeDrag` | true | false |

See [`EMBED.md`](EMBED.md).

## API

```javascript
fg.setPlaybackMode('play');   // 'narrative' | 'step'
fg.setPlaySpeed(2);
fg.setActiveTrack('worker');
fg.stepNext(); fg.stepPrev();
await fg.applyAutoLayout('dagre');
```
