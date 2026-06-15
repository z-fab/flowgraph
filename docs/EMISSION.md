# Emission rates and timing

How to control token emission frequency and patterns in FlowGraph.

## Source fields

| Field | Default | Description |
|-------|---------|-------------|
| `interval` | 1400 | ms between emission cycles |
| `delay` | 0 | ms before first emission |
| `jitter` | 0 | Randomness (see below) |
| `burst.count` | 1 | Tokens per cycle |
| `burst.spacing` | 60 | ms between burst tokens |
| `burst.mode` | `single` | `single` \| `burst` \| `grouped` |
| `enabled` | true | Disable emitter |

## Jitter

- **`jitter <= 1`** — fraction of interval: ±20% with `jitter: 0.2` on `interval: 5000` → 4000–6000 ms
- **`jitter > 1`** — absolute ms: `jitter: 400` → ±400 ms around interval

## Recipes

### One request every 3 seconds

```json
"sources": [{ "edge": "e1", "interval": 3000 }]
```

### Continuous stream (always active canvas)

```json
"sources": [{ "edge": "e1", "interval": 400 }]
```

### Burst every 5 seconds (N visible tokens)

```json
"sources": [{
  "edge": "e1",
  "interval": 5000,
  "burst": { "count": 10, "mode": "burst", "spacing": 30 }
}]
```

### Grouped batch (1 token labeled 8×)

```json
"sources": [{
  "edge": "e1",
  "interval": 2000,
  "burst": { "count": 8, "mode": "grouped" }
}]
```

### Irregular load

```json
"sources": [{ "edge": "e1", "interval": 4500, "jitter": 0.2 }]
```

### Delayed start (e.g. backprop after forward)

```json
"sources": [{ "edge": "e-back", "interval": 12000, "delay": 3000 }]
```

### Parallel pipelines

```json
"sources": [
  { "edge": "batch-rail", "interval": 4000 },
  { "edge": "online-rail", "interval": 2200, "jitter": 300 }
]
```

### Manual emit (API)

```js
fg.emit('edge-id', { payload: { status: 'pending' } });
```

## Formulas

- **Effective rate:** `tokens/s ≈ (burst.count × sources.length) / (interval / 1000)`
- **Burst duration:** `(count - 1) × spacing` ms
- **Minimum interval:** engine floor 50 ms

## Node emit count

Process nodes can emit multiple tokens after completion:

```json
"emit": { "mode": "all", "count": 4, "emission": "burst", "spacing": 50 }
```

Use `emission: "grouped"` for one visual token representing N chunks (SSE / streaming).
