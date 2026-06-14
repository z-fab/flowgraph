---
name: flowgraph-author
description: >
  Author FlowGraph v1 JSON configs for animated flow diagrams with token simulation.
  Use when the user asks to create, edit, or migrate a FlowGraph diagram, animated pipeline,
  serving architecture visualization, micro-batching flow, agent loop, or any flowgraph.json config.
  Covers nodes (port/process), edges, sources, admission/gate/emit/retry/circuit blocks, embed mode,
  and validation against schema/flowgraph-v1.json. Also use when integrating FlowGraph in HTML
  or explaining how AI agents should build flow diagrams.
---

# FlowGraph Author

Teach coding agents to **author JSON configs** for [FlowGraph](../README.md) v1 — animated directed graphs with token simulation. Agents produce **config data only**; they do not edit library source unless explicitly asked.

## When to use FlowGraph

| Use FlowGraph | Use something else |
|---------------|-------------------|
| Animated tokens, queues, batching, retries | Static architecture → Mermaid / draw.io |
| Latency/throughput intuition in docs | Tabular data → tables |
| Looping agent/tool flows with motion | Step-by-step slides without motion → prose + static diagram |

## Mental model

1. **`sources[]`** spawn tokens on an **edge** on an interval.
2. Tokens travel along edges to the target node.
3. **`process`** nodes: admit (`admission`), wait for inputs (`gate`), work (`duration`), route out (`emit`), optionally `retry` or `circuit`.
4. **`port`** nodes: visual endpoints (`source`, `sink`, `terminal`) — no processing.

**Layout:** omit `x`/`y` for auto-layout. Set coordinates only for fixed layouts (e.g. neural nets).

## Required structure

Every config **must** have:

```json
{
  "nodes": [ { "id": "a", "type": "port", "role": "source", "icon": "user" } ],
  "edges": [ { "id": "e1", "from": "a", "to": "b" } ],
  "sources": [ { "edge": "e1", "interval": 3000 } ]
}
```

Without `sources`, the graph is static until manual `fg.emit()`.

## Authoring workflow

1. **Clarify the story** — one coherent flow per diagram (variants → separate configs or tabs).
2. **List nodes** — assign `port` vs `process`, icons (Lucide names), `duration` on processes.
3. **Wire edges** — every path must be explicit; use `routing: "loopback"` for return paths.
4. **Add behavior blocks** — batching, fan-in, fan-out, circuit breaker as needed.
5. **Add sources** — at least one emitter on the entry edge.
6. **Set embed flags** if for docs ([embed guide](../docs/EMBED.md)).
7. **Validate** against [`schema/flowgraph-v1.json`](../schema/flowgraph-v1.json).

## Golden rules

1. **One diagram = one flow.** Do not mix online/batch/streaming variants in one graph.
2. **Tokens only move on declared edges** — never teleport.
3. **HTTP response** → forward path to `port` `role: "terminal"`, not an implicit return edge (unless the concept needs a visible loop).
4. **Micro-batching** → `admission: { mode: "batch", max: N }`.
5. **Streaming** → `emit: { mode: "all", count: K }` on the producer node.
6. **Agent tool loop** → `routing: "loopback"` on tool → LLM edge.
7. **Icons** — Lucide names (`user`, `cpu`, `database`, `brain`, `server`, …).

## Node quick reference

### `port`

```json
{ "id": "cli", "type": "port", "role": "source", "label": "Client", "icon": "smartphone", "shape": "circle" }
```

| `role` | Meaning |
|--------|---------|
| `source` | Origin (circle by default) |
| `sink` | Absorbs tokens; use `showReceived: true` for counters |
| `terminal` | Final destination |

### `process`

```json
{
  "id": "api", "type": "process", "label": "API", "icon": "server",
  "duration": 400,
  "admission": { "mode": "queue", "max": null },
  "gate": { "count": 1, "from": "any" },
  "emit": { "mode": "all", "count": 1 }
}
```

| Block | Purpose |
|-------|---------|
| `admission` | `queue` \| `slot` \| `batch` — how tokens enter |
| `gate` | Fan-in sync (`from`: `any` \| `all-edges` \| `[edgeIds]`) |
| `emit` | Fan-out (`all` \| `map` \| `weighted` \| `round-robin` \| `excludeReject`) |
| `retry` | `{ backEdge, maxRetries }` |
| `circuit` | `{ acceptEdge, fallbackEdge, failureRate, failureThreshold, recoveryMs }` |

Full field list: [`references/config.md`](references/config.md).

## Edge quick reference

```json
{
  "id": "e2", "from": "api", "to": "model",
  "stroke": { "color": "success", "dash": "dash" },
  "label": { "text": "batch" },
  "routing": "bezier",
  "speed": 120,
  "token": { "shape": "rect", "color": "primary" }
}
```

`routing`: `bezier` (default) | `straight` | `loopback`.

## Source quick reference

```json
{
  "edge": "e1",
  "interval": 4000,
  "delay": 0,
  "jitter": 300,
  "burst": { "count": 3, "spacing": 80 },
  "token": { "color": "#7C3AED", "size": 7 }
}
```

Multiple sources = parallel pipelines on the same canvas.

## Copy-paste recipes

See [`references/patterns.md`](references/patterns.md). Starter configs live in [`demos/configs/`](../demos/configs/):

| File | Pattern |
|------|---------|
| `05-request-online.json` | Sync request chain |
| `06-batch-vs-online.json` | Two rails, two sources |
| `08-streaming-sse.json` | Multi-token emit |
| `10-agent-react.json` | Orchestrator + tool loop |
| `16-circuit-breaker.json` | Failure routing |
| `19-micro-batching.json` | Batch admission |
| `20-semaphore.json` | Slot limit + reject edge |
| `26-mlp-backprop.json` | Forward + delayed backprop source |

## Embed mode (docs / textbooks)

```json
{
  "interaction": { "nodeDrag": false, "nodeSelect": false },
  "controls": { "toolbar": false, "title": false },
  "metrics": { "nodeDrawer": false, "globalDrawer": false, "nodePanel": false, "systemPanel": false }
}
```

Details: [`../docs/EMBED.md`](../docs/EMBED.md).

## HTML integration snippet

```html
<link rel="stylesheet" href="flowgraph.css">
<script src="https://unpkg.com/lucide@latest"></script>
<div id="flow"></div>
<script type="module">
  import { FlowGraph } from './dist/flowgraph.js';
  FlowGraph.create('#flow', { /* your config */ });
</script>
```

IIFE: load `dist/flowgraph.iife.min.js`; resolve API via `FlowGraph.create` or `FlowGraph.default.create`.

## Output expectations

When asked to create a diagram, deliver:

1. **Complete JSON config** (valid v1, with `sources` if animated).
2. **Brief rationale** — which blocks implement which behavior.
3. **Demo reference** — closest file in `demos/configs/` if applicable.
4. **Embed flags** when the target is documentation.

Do **not** invent node types or config keys outside the schema.

## References

- [`references/config.md`](references/config.md) — exhaustive config tables
- [`references/patterns.md`](references/patterns.md) — scenario recipes
- [`../docs/SPEC.md`](../docs/SPEC.md) — canonical spec
- [`../schema/flowgraph-v1.json`](../schema/flowgraph-v1.json) — JSON Schema
