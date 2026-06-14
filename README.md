# FlowGraph

**Animated flow diagrams with token simulation — configured entirely in JSON.**

FlowGraph renders directed graphs where particles (tokens) travel along edges, queue at nodes, batch, retry, and route through circuit breakers. Two node primitives (`port`, `process`) and composable config blocks (`admission`, `gate`, `emit`, `retry`, `circuit`) cover serving pipelines, streaming, micro-batching, agents, and neural-network sketches without custom code.

Built for documentation, textbooks, and interactive explainers. Zero framework dependency; ships as ESM or a single IIFE bundle with Dagre bundled in.

---

## Features

- **JSON-first** — full diagram + simulation spec in one config object ([schema](schema/flowgraph-v1.json))
- **Auto-layout** — layered (default) or Dagre; omit `x`/`y` or drag nodes in authoring mode
- **Simulation** — periodic sources, processing duration, queues, batch windows, fan-in/out, retries, circuit breaker
- **Runtime metrics** — throughput, latency percentiles, queue depth (optional panels/drawers)
- **Embed-friendly** — disable toolbar, drag, and drawers for read-only docs ([embed guide](docs/EMBED.md))
- **27 demos** — ML serving, Kafka, RAG, ReAct agents, MLP forward/backprop ([gallery](demos/index.html))

---

## Quick start

### ESM (module)

```html
<link rel="stylesheet" href="flowgraph.css">
<script src="https://unpkg.com/lucide@latest"></script>
<div id="flow"></div>
<script type="module">
  import { FlowGraph } from './dist/flowgraph.js';

  FlowGraph.create('#flow', {
    layout: { direction: 'LR' },
    nodes: [
      { id: 'in', type: 'port', role: 'source', label: 'Client', icon: 'user' },
      { id: 'api', type: 'process', label: 'API', icon: 'server', duration: 400 },
      { id: 'out', type: 'port', role: 'terminal', label: 'Response', icon: 'circle-check', tone: 'success' },
    ],
    edges: [
      { id: 'e1', from: 'in', to: 'api' },
      { id: 'e2', from: 'api', to: 'out', stroke: { color: 'success' } },
    ],
    sources: [{ edge: 'e1', interval: 3000 }],
  });
</script>
```

### Script tag (IIFE, no bundler)

```html
<link rel="stylesheet" href="flowgraph.css">
<script src="https://unpkg.com/lucide@latest"></script>
<div id="flow"></div>
<script src="dist/flowgraph.iife.min.js"></script>
<script>
  const api = window.FlowGraph.default || window.FlowGraph;
  fetch('./demos/configs/05-request-online.json')
    .then(r => r.json())
    .then(cfg => api.create('#flow', cfg));
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

## Configuration at a glance

| Layer | Keys |
|-------|------|
| **Graph** | `nodes[]`, `edges[]`, `sources[]` |
| **Layout** | `layout.direction` (`LR` \| `TB`), `layout.engine` (`layered` \| `dagre`) |
| **Look** | `tokens`, `viewport`, `theme` |
| **Process blocks** | `admission`, `gate`, `emit`, `retry`, `circuit` on `process` nodes |
| **UX** | `controls`, `interaction`, `metrics` |

**Node types**

| Type | Role | Purpose |
|------|------|---------|
| `port` | `source` \| `sink` \| `terminal` | Visual endpoint; does not process |
| `process` | — | Waits, processes (`duration` ms), emits tokens |

See **[docs/SPEC.md](docs/SPEC.md)** for the full reference and **[skill/references/config.md](skill/references/config.md)** for agent-oriented authoring.

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
| [05-request-online](demos/configs/05-request-online.json) | Sync HTTP path |
| [06-batch-vs-online](demos/configs/06-batch-vs-online.json) | Two parallel pipelines |
| [08-streaming-sse](demos/configs/08-streaming-sse.json) | Multi-token emit |
| [10-agent-react](demos/configs/10-agent-react.json) | Tool loop + stream |
| [19-micro-batching](demos/configs/19-micro-batching.json) | Batch admission |
| [26-mlp-backprop](demos/configs/26-mlp-backprop.json) | Forward + backprop |
| [27-embed-view](demos/configs/27-embed-view.json) | View-only embed |

---

## API

```javascript
const fg = FlowGraph.create(container, config);
await FlowGraph.createFromURL(container, './config.json');

fg.start();   // fg.pause(); fg.reset(); fg.destroy(); fg.fit();
fg.emit('edge-id', { color: 'primary' });
fg.updateNode('node-id', { duration: 900 });
await fg.applyAutoLayout('dagre');

fg.on('token:arrive', (p) => { /* … */ });
fg.toJSON(); // serialize current config (includes dragged positions)
```

**Interaction:** pan canvas · zoom wheel · click node → drawer (when enabled)

---

## Development

```bash
npm install
npm run build    # dist/flowgraph.{js,min.js,iife.js,iife.min.js}
npm test         # 27 tests (node:test)
```

Project layout:

```
flowgraph/
  src/           # library source
  dist/          # build output (committed for CDN/script-tag use)
  demos/         # gallery + JSON configs
  docs/          # SPEC, embed guide, layout notes
  schema/        # JSON Schema v1
  skill/         # AI agent skill for authoring configs
  tests/
```

---

## AI agents

The **[skill/](skill/)** folder contains a Cursor/Claude-compatible skill that teaches coding agents how to design FlowGraph configs: node types, sources, recipes, and validation against the schema. Point agents at `skill/SKILL.md` when generating or migrating diagrams.

---

## License

[MIT](LICENSE) © Fabrício
