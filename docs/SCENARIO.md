# FlowGraph — Cenários visuais (v2)

FlowGraph v2 é um **animador de diagramas por roteiro**: você define topologia (`nodes`, `edges`), tipos de pacote (`tokenTypes`) e um **`scenario`** com passos explícitos.

## Estrutura do JSON

```json
{
  "title": "Meu fluxo",
  "tokenTypes": {
    "default": { "color": "#7C3AED", "speed": 100 },
    "jobId": { "shape": "rect", "color": "#3D6B52" }
  },
  "nodes": [ ... ],
  "edges": [ ... ],
  "scenario": {
    "loop": true,
    "playInterval": 600,
    "narration": { "showOnCanvas": true, "position": "top-left" },
    "steps": [ ... ]
  }
}
```

## Tipos de passo

| Passo | Campos | Descrição |
|-------|--------|-----------|
| `travel` | `edge`, `token`, `direction` (`forward`/`reverse`), `title`, `description` | Pacote percorre a aresta |
| `dwell` | `node`, `effect`, `ms`, `title`, `description` | Efeito visual no nó |
| `parallel` | array de passos, `delay` opcional | Vários travels em paralelo |
| `setPill` | `node`, `pill`, `tone` | Atualiza pill do nó |
| `setEffect` | `node`, `effect` | `processing`, `waiting`, `open` |
| `wait` | `ms` | Pausa (ignorada no modo step) |
| `focus` | `node` ou `edge` | Pan/zoom |
| `narrate` | `title`, `description`, `ms` | Só narração |

## Arestas

- `routing`: `bezier` (padrão), `straight`, `loopback`, `orthogonal`
- `loopSide`: `above` | `below` para loopbacks
- Viagem reversa: `{ "travel": { "edge": "e1", "direction": "reverse" } }` — útil para backprop em MLP

## Modos de reprodução

| Modo | Comportamento |
|------|----------------|
| `play` (padrão) | Animação contínua; trilhas em paralelo; passos `parallel` simultâneos |
| `narrative` | Auto-play da trilha selecionada; overlay título/descrição + seletor de cenário |
| `step` | Manual: painel flutuante com roteiro, seletor de trilha, Voltar/Próximo |

Toolbar: três modos (▶ livro 👣) + velocidade (play e step).

## Trilhas (`scenario.tracks`)

Múltiplos roteiros no mesmo diagrama — ex.: predict, worker e polling em paralelo:

```json
"scenario": {
  "defaultMode": "play",
  "tracks": [
    { "id": "predict", "label": "POST", "offset": 0, "steps": [...] },
    { "id": "worker", "label": "Orchestrator", "offset": 800, "steps": [...] }
  ]
}
```

- **play**: todas as trilhas rodam em paralelo (`offset` atrasa o início); passos `parallel` simultâneos
- **narrative** / **step**: uma trilha por vez (seletor); passos `parallel` em sequência

## Métricas automáticas no nó

```json
{ "id": "jobDb", "metrics": { "queue": { "max": 8 }, "count": true } }
```

- `queue`: +1 quando token chega, −1 quando sai; pill com barra de progresso
- `count`: total de tokens que passaram pelo nó

Opt-out em consultas/leituras: `countMetrics: false` no `tokenTypes` ou no passo `travel`.

## API

```javascript
fg.setPlaybackMode('play');      // 'narrative' | 'step'
fg.setPlaySpeed(2);
fg.setActiveTrack('worker');     // multi-track
fg.stepNext();
fg.stepPrev();
```
