# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
