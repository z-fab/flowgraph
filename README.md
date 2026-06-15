# FlowGraph

**Animated flow diagrams driven by explicit scenarios — configured entirely in JSON.**

FlowGraph renders directed graphs where particles travel along edges following a **scripted scenario** (`scenario.steps`). You define topology (`nodes`, `edges`), token types (`tokenTypes`), and a step-by-step walkthrough with `title` / `description` narration — ideal for textbooks, docs, and interactive explainers.

Zero framework dependency; ships as ESM or a single IIFE bundle with Dagre bundled in.

---

## Features

- **JSON-first** — topology + visual scenario in one config ([schema](schema/flowgraph-v2.json), [scenario guide](docs/SCENARIO.md))
- **Scenario steps** — `travel`, `dwell`, `parallel`, `setPill`, `setEffect`, `narrate`, `wait`, `focus`
- **Reverse travel** — `direction: "reverse"` on the same edge (backprop, feedback loops)
- **Step mode** — floating panel with script list, track picker, Voltar/Próximo
- **Narrative mode** — title/description overlay + track picker (one track at a time)
- **Orthogonal edges** — `routing: "orthogonal"` for Manhattan-style connectors
- **Auto-layout** — layered (default) or Dagre; omit `x`/`y` or drag nodes
- **33 demos** — ML serving, Kafka, RAG, saga, DLQ, circuit breaker, MLP ([gallery](demos/index.html))

---

## Quick start

```html
<link rel="stylesheet" href="flowgraph.css">
<script src="https://unpkg.com/lucide@latest"></script>
<div id="flow"></div>
<script type="module">
  import { FlowGraph } from './dist/flowgraph.js';

  FlowGraph.create('#flow', {
    tokenTypes: { default: { color: '#7C3AED', speed: 100 } },
    nodes: [
      { id: 'in', type: 'port', role: 'source', label: 'Client', icon: 'user', x: 0, y: 0 },
      { id: 'api', type: 'process', label: 'API', icon: 'server', x: 160, y: 0 },
      { id: 'out', type: 'port', role: 'terminal', label: 'Response', icon: 'circle-check', tone: 'success', x: 320, y: 0 },
    ],
    edges: [
      { id: 'e1', from: 'in', to: 'api' },
      { id: 'e2', from: 'api', to: 'out', stroke: { color: 'success' } },
    ],
    scenario: {
      loop: true,
      steps: [
        { travel: { edge: 'e1', token: 'default', title: 'Request', description: 'Client sends HTTP request.' } },
        { dwell: { node: 'api', effect: 'processing', ms: 500, title: 'API', description: 'Server processes.' } },
        { travel: { edge: 'e2', token: 'default', title: 'Response' } },
      ],
    },
  });
</script>
```

### npm

```bash
npm install flowgraph
```

```javascript
import { FlowGraph } from 'flowgraph';
import 'flowgraph/style.css';
```

---

## Configuration

| Layer | Keys |
|-------|------|
| **Graph** | `nodes[]`, `edges[]` |
| **Tokens** | `tokenTypes`, `tokens` (defaults) |
| **Scenario** | `scenario.steps[]` or `scenario.tracks[]`, `loop`, `narration` |
| **Edges** | `routing`: `bezier`, `straight`, `loopback`, `orthogonal` |
| **Layout** | `layout.direction` (`LR` \| `TB`), `layout.engine` (`layered` \| `dagre`) |
| **UX** | `controls`, `interaction`, `viewport`, `theme` |

See **[docs/SCENARIO.md](docs/SCENARIO.md)** for step types and examples.

---

## Demos

```bash
git clone git@github.com:z-fab/flowgraph.git
cd flowgraph
npm install && npm run build
python3 -m http.server 3456
# open http://localhost:3456/demos/
```

| Demo | Pattern |
|------|---------|
| [29-async-job-polling](demos/configs/29-async-job-polling.json) | Async job + polling |
| [30-visual-showcase](demos/configs/30-visual-showcase.json) | Tour de todos os tipos de passo |
| [39-checkout-saga](demos/configs/39-checkout-saga.json) | Saga com compensação |
| [40-dead-letter-queue](demos/configs/40-dead-letter-queue.json) | Retry → DLQ |
| [16-circuit-breaker](demos/configs/16-circuit-breaker.json) | Circuit open + fallback |
| [26-mlp-backprop](demos/configs/26-mlp-backprop.json) | Forward + reverse backprop |
| [11-fanout-fanin](demos/configs/11-fanout-fanin.json) | Parallel fan-out / fan-in |
| [27-embed-view](demos/configs/27-embed-view.json) | View-only embed |

---

## API

```javascript
const fg = FlowGraph.create(container, config);
await FlowGraph.createFromURL(container, './config.json');

fg.start();   // fg.pause(); fg.reset(); fg.destroy(); fg.fit();
fg.setPlaybackMode('step');   // 'play' | 'narrative' | 'step'
fg.stepNext();
fg.stepPrev();
fg.setPlaySpeed(2);
fg.setActiveTrack('worker');

await fg.applyAutoLayout('dagre');
fg.toJSON();
```

---

## Development

```bash
npm install
npm run build
npm test
node scripts/smoke-demos.mjs
npm run test:e2e
```

---

## License

[MIT](LICENSE)

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
