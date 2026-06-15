# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-06-14

### Changed (breaking)

- **Pivot to visual scenario model** — simulation engine, metrics store, admission, gates, and emit blocks removed.
- Config now requires `scenario.steps` (or `scenario.tracks`) with explicit `travel`, `dwell`, `parallel`, `setPill`, `setEffect`, `narrate`, etc.
- **Reverse travel** — `direction: "reverse"` animates tokens backward along the same edge (backprop, feedback).
- **Playback modes** — `play` (continuous), `narrative` (overlay + track picker), `step` (floating panel with script + nav).

### Added

- `FlowPlayer` scenario executor ([`src/flow-player.js`](src/flow-player.js))
- **Orthogonal edge routing** (`routing: "orthogonal"`) with lane separation for parallel edges
- **Floating scenario panel** (step mode): draggable script list, track select, Voltar/Próximo
- **Narration overlay** (narrative mode): title + description in corner + track select
- `countMetrics: false` on tokens/steps to skip queue/counter pills (e.g. read-only SELECT)
- Processing pill (`running`) during `dwell` with `effect: "processing"`
- [`docs/SCENARIO.md`](docs/SCENARIO.md) and [`schema/flowgraph-v2.json`](schema/flowgraph-v2.json)
- 40 demos migrated to scenario format; demo 29 async job polling as reference architecture

### Removed

- `SimulationEngine`, `MetricsStore`, `sources[]`, admission/gate/emit simulation blocks, metric drawers

## [1.0.0] - 2026-06-14

### Added

- **FlowGraph v1** — JSON-configured animated flow diagrams with token simulation.
- **Node primitives** — `port` (`source` | `sink` | `terminal`) and `process` with composable blocks:
  - `admission` (queue, slot, batch)
  - `gate` (fan-in / join)
  - `emit` (fan-out routing)
  - `retry` and `circuit` (circuit breaker)
- **Auto-layout** — layered (default) and Dagre (`layout.engine: "dagre"`).
- **Runtime API** — `create`, `createFromURL`, `start`/`pause`/`reset`, `emit`, `updateNode`, `applyAutoLayout`, `toJSON`, events.
- **Bundles** — ESM (`dist/flowgraph.js`) and IIFE with Dagre embedded (`dist/flowgraph.iife.min.js`).
- **27 demos** — serving, streaming, micro-batching, Kafka, RAG, ReAct agents, MLP forward/backprop, embed view, playground.
- **Documentation** — `README.md`, `docs/SPEC.md`, `docs/EMBED.md`, `docs/layout-spike.md`.
- **JSON Schema** — `schema/flowgraph-v1.json`.
- **AI agent skill** — `skill/SKILL.md` with config reference and pattern recipes.
- **Embed mode** — disable toolbar, drag, and metric drawers for read-only docs (demo #27).

### Changed

- Canonical config model: only `port` + `process` (legacy aliases removed).
- IIFE build uses dedicated entry (`src/iife.js`) for correct global export.

[1.0.0]: https://github.com/z-fab/flowgraph/releases/tag/v1.0.0
