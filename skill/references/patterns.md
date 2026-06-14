# FlowGraph patterns — recipes for agents

Each pattern links to a working demo in `demos/configs/`. Copy the JSON, rename ids, adjust intervals/durations.

---

## Sync online request

Linear chain: client → gateway → features → model → response terminal.

**Demo:** `05-request-online.json`

```json
{
  "layout": { "direction": "LR" },
  "nodes": [
    { "id": "client", "type": "port", "role": "source", "label": "Client", "icon": "user" },
    { "id": "gw", "type": "process", "label": "Gateway", "icon": "server", "duration": 350 },
    { "id": "model", "type": "process", "label": "Model", "icon": "cpu", "duration": 1500, "tone": "warning" },
    { "id": "resp", "type": "port", "role": "terminal", "label": "Response", "icon": "circle-check", "tone": "success" }
  ],
  "edges": [
    { "id": "e1", "from": "client", "to": "gw" },
    { "id": "e2", "from": "gw", "to": "model" },
    { "id": "e3", "from": "model", "to": "resp", "stroke": { "color": "success" } }
  ],
  "sources": [{ "edge": "e1", "interval": 4500, "jitter": 400 }]
}
```

---

## Batch vs online (dual rail)

Two `sources` on separate entry edges; batch rail uses `admission.batch`.

**Demo:** `06-batch-vs-online.json`

Key batch node:

```json
{
  "id": "batch", "type": "process", "label": "Batch job", "icon": "layers",
  "admission": { "mode": "batch", "max": 5, "step": 1 },
  "duration": 200,
  "pillTop": [{ "text": "batch", "tone": "primary" }]
}
```

---

## Micro-batching

Requests accumulate; GPU sees batches.

**Demo:** `19-micro-batching.json`

```json
{
  "admission": { "mode": "batch", "max": 8, "step": 1 },
  "duration": 200
}
```

Fast `sources[].interval` (400–500ms) + slower GPU `duration` (1500ms+) shows window filling.

---

## Streaming / SSE

LLM emits multiple tokens per request; sink counts received.

**Demo:** `08-streaming-sse.json`

```json
{
  "id": "llm", "type": "process", "label": "LLM", "icon": "brain", "duration": 800,
  "emit": { "mode": "all", "count": 4 }
}
```

Sink: `{ "type": "port", "role": "sink", "showReceived": true }`.

Outbound edge token: `{ "shape": "rect", "color": "success" }`.

---

## Agent ReAct loop

Orchestrator routes to LLM and tool; tool → LLM uses loopback.

**Demo:** `10-agent-react.json`

```json
{ "id": "tl", "from": "tool", "to": "llm", "routing": "loopback", "stroke": { "color": "warning", "dash": "dash" } }
```

---

## Fan-in (join)

Wait for tokens from all incoming edges.

**Demo:** `04-gate-merge.json`

```json
{ "gate": { "count": 1, "from": "all-edges" } }
```

---

## Fan-out (broadcast)

Emit to every outgoing edge.

**Demo:** `11-fanout-fanin.json`

```json
{ "emit": { "mode": "all" } }
```

---

## Weighted routing / canary

**Demo:** `18-multi-model-routing.json`

```json
{ "emit": { "mode": "weighted" } }
```

Set `weight` on outgoing edges (higher = more traffic).

---

## Semaphore / 429 reject

Limited slots; overflow routed to reject edge.

**Demo:** `20-semaphore.json`

```json
{
  "admission": { "mode": "slot", "max": 2, "rejectEdge": "reject" },
  "emit": { "mode": "map", "map": { "accept": 1 } }
}
```

---

## Retry loop

**Demo:** `23-feedback-loop.json`

```json
{ "retry": { "backEdge": "retry-edge", "maxRetries": 3 } }
```

---

## Circuit breaker

**Demo:** `16-circuit-breaker.json`

```json
{
  "circuit": {
    "acceptEdge": "ok",
    "fallbackEdge": "fallback",
    "failureRate": 0.25,
    "failureThreshold": 5,
    "recoveryMs": 8000
  }
}
```

---

## Neural network (forward)

Circular nodes, straight edges, manual or semi-manual layout.

**Demo:** `21-mlp-forward.json`

- `shape: "circle"` on hidden layers
- `routing: "straight"` on edges
- Fixed `x`/`y` or run layout then tweak

---

## MLP forward + backprop

Two sources: forward on input edge; backprop source with `delay` on gradient edge.

**Demo:** `26-mlp-backprop.json`

```json
"sources": [
  { "edge": "forward-edge", "interval": 3000 },
  { "edge": "backprop-edge", "interval": 3000, "delay": 1500, "token": { "color": "danger" } }
]
```

---

## Kafka / event pipeline

**Demo:** `12-kafka-pipeline.json`

Multiple processes with queue admission; sink with `showReceived: true`.

---

## View-only embed

**Demo:** `27-embed-view.json`

Merge embed flags from [`docs/EMBED.md`](../../docs/EMBED.md) into any config.

---

## Anti-patterns

| Don't | Do instead |
|-------|------------|
| Mix unrelated flows in one graph | Separate configs or UI tabs |
| Omit edges on intended paths | Declare every hop explicitly |
| Use custom node `type` values | Only `port` and `process` |
| Rely on `steps[]` (legacy APIs) | Continuous `sources` + prose captions |
| Set `x,y` on every node unless needed | Omit for auto-layout |
