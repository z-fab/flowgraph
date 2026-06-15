/** Fallback titles/descriptions for scenario steps. */

export function nodeLabel(config, nodeId) {
  if (!nodeId) return '';
  return config.nodesById[nodeId]?.label || nodeId;
}

export function travelTitle(config, edgeId) {
  const e = config.edgesById[edgeId];
  if (!e) return edgeId;
  const from = nodeLabel(config, e.from);
  const to = nodeLabel(config, e.to);
  const el = e.label?.text;
  return el ? `${from} → ${to} · ${el}` : `${from} → ${to}`;
}

export function travelDescription(config, edgeId, direction = 'forward') {
  const e = config.edgesById[edgeId];
  if (!e) return '';
  const from = nodeLabel(config, direction === 'reverse' ? e.to : e.from);
  const to = nodeLabel(config, direction === 'reverse' ? e.from : e.to);
  const el = e.label?.text;
  return el
    ? `Pacote viaja de ${from} para ${to} pela aresta «${el}».`
    : `Pacote viaja de ${from} para ${to}.`;
}

export function dwellTitle(config, nodeId) {
  return `Em ${nodeLabel(config, nodeId)}`;
}

export function dwellDescription(config, nodeId, effect) {
  const name = nodeLabel(config, nodeId);
  if (effect === 'processing') return `Processando em ${name}.`;
  if (effect === 'waiting') return `Aguardando em ${name}.`;
  if (effect === 'open') return `Circuit breaker aberto em ${name}.`;
  return `Ativo em ${name}.`;
}
