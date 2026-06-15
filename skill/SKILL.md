---
name: flowgraph-author
description: >
  Author FlowGraph v2 JSON configs for scripted animated flow diagrams.
  Use when the user asks to create, edit, or migrate a FlowGraph diagram, animated pipeline,
  serving architecture visualization, async job flow, agent loop, or any flowgraph.json config.
  Covers nodes (port/process), edges (bezier/orthogonal/loopback), scenario steps (travel/dwell/parallel),
  multi-track scenarios, playback modes, and validation against schema/flowgraph-v2.json.
---

# FlowGraph Author

Teach coding agents to **author JSON configs** for [FlowGraph](../README.md) v2 — animated directed graphs driven by explicit `scenario` scripts. Agents produce **config data only**; they do not edit library source unless explicitly asked.

## When to use FlowGraph

| Use FlowGraph | Use something else |
|---------------|-------------------|
| Animated walkthrough with narration in docs | Static architecture → Mermaid |
| Step-by-step explainer (play / narrative / step modes) | Tabular metrics → tables |
| Multi-track stories on one canvas (predict + worker + poll) | Slides without motion → prose |

## Mental model

1. Define **topology** (`nodes`, `edges`).
2. Define **token types** (`tokenTypes`) for visual variety.
3. Write **`scenario.steps`** (or `scenario.tracks[]`) — the script the player follows.
4. **`travel`** moves tokens; **`dwell`** shows processing; **`parallel`** groups simultaneous paths (parallel only in play mode).

**Layout:** omit `x`/`y` for auto-layout. Fixed coords for neural nets / precise diagrams.

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

## Authoring workflow

1. **Clarify the story** — one coherent flow per diagram (variants → tracks or separate configs).
2. **List nodes** — `port` vs `process`, Lucide icons, optional `metrics` / `pillTop`.
3. **Wire edges** — explicit paths; `routing: "loopback"` for returns; `orthogonal` for infra diagrams.
4. **Write scenario** — `travel` / `dwell` / `parallel` with `title` + `description` for narration.
5. **Set embed flags** if for docs ([embed guide](../docs/EMBED.md)).
6. **Validate** against [`schema/flowgraph-v2.json`](../schema/flowgraph-v2.json).

## Golden rules

1. **One diagram = one story.** Use `tracks` for parallel stories on shared topology.
2. **Tokens only move on declared edges** — use `travel` steps.
3. **HTTP responses** go back to client via `travel` or terminal `port`.
4. **Read-only DB queries** — `countMetrics: false` on token or travel step.
5. **Backprop / feedback** — `direction: "reverse"` on `travel`.

## Reference docs

- [`docs/SCENARIO.md`](../docs/SCENARIO.md) — step types, modes, tracks
- [`docs/SPEC.md`](../docs/SPEC.md) — spec summary
- [`skill/references/config.md`](references/config.md) — field reference
- [`skill/references/patterns.md`](references/patterns.md) — recipe patterns
- Demos: [`demos/configs/`](../demos/configs/) — especially `29-async-job-polling.json`

## Playback API

```javascript
fg.setPlaybackMode('play');      // 'narrative' | 'step'
fg.setPlaySpeed(2);
fg.setActiveTrack('worker');
fg.stepNext(); fg.stepPrev();
```

## v1 migration

| v1 | v2 |
|----|-----|
| `sources[]` | `scenario` loop with `travel` steps |
| `process.duration` | `dwell` step |
| `admission` / `gate` / `emit` | explicit scenario + optional `metrics` |

See [`CHANGELOG.md`](../CHANGELOG.md).
