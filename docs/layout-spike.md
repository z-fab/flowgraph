# Layout spike — layered vs dagre

Status: **dagre implemented (opt-in)**. Default remains layered (`layout.js`).

## Current approach (layered)

- **Algorithm:** topological layers left-to-right; nodes sorted within layer by index.
- **Trigger:** `parseConfig` calls `autoLayout` when any node lacks `x`/`y` (`needsLayout`).
- **Force:** `applyAutoLayout('layered')` or `{ force: true }` overwrites manual positions.

## Dagre adapter

- **Module:** `src/layout-dagre.js` (bundled; loaded dynamically on `applyAutoLayout('dagre')`).
- **Config:** `layout.engine: "dagre"`, optional `rankGap`, `nodeGap`, `direction`.
- **Toolbar:** `controls.layout: true` → button calls `instance.applyAutoLayout()`.

## Recommendation

| Scenario | Layout |
|----------|--------|
| Demos / textbooks | layered (default) |
| Playground | dagre + Auto-layout button |
| Large imported JSON | dagre opt-in |

## Authoring interaction (v1)

- **Drag:** `interaction/nodeDrag` — updates `x`/`y`, `edgeRenderer.updatePaths`, event `layout:change`.
- **Inspector:** node drawer tab Config — `applyNodePatch` + `sim.patchNode` (form preserved while tab active).
- **Metrics:** zero values always shown (no flicker on rejects/queue).
