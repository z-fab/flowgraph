import {
  admissionMode,
  admissionMax,
  hasCircuit,
  hasRetry,
  isJoinGate,
  estimateAdmissionPillHeight,
} from './admission.js';

/** Build runtime bottom pills for a node from sim state + optional metrics slice. */
export function buildPillsBottom(node, state, metrics = {}) {
  if (!node || !state) return [];

  const pills = [];
  const rejects = metrics.rejects ?? state.rejects ?? 0;

  if (node.type === 'port') {
    if (node.showReceived) pills.push({ text: String(state.received || 0) });
    return pills;
  }

  const mode = admissionMode(node);
  const rejectEdge = node.admission?.rejectEdge;

  if (mode === 'slot') {
    const cap = admissionMax(node) ?? 1;
    const slots = state.slots || 0;
    let tone = null;
    if (slots >= cap) tone = 'danger';
    else if (slots > 0) tone = 'warning';
    pills.push({ text: `${slots}/${cap}`, tone });
    if (state.processing) pills.push({ icon: '···', animated: true });
    if (rejectEdge) {
      pills.push({ icon: 'circle-x', text: String(rejects), tone: rejects > 0 ? 'danger' : null });
    }
    return pills;
  }

  if (mode === 'batch') {
    const max = admissionMax(node) ?? 10;
    if (state.flushing) pills.push({ text: 'flush', animated: true });
    else if (state.fill > 0) pills.push({ text: `${state.fill}/${max}`, progress: state.fill / max });
    if (state.processing) pills.push({ icon: '···', animated: true });
    return pills;
  }

  if (isJoinGate(node)) {
    if (state.waiting) pills.push({ text: 'waiting', tone: 'warning' });
    if (state.processing) pills.push({ icon: '···', animated: true });
    const gate = node.gate || { count: 1 };
    if (Array.isArray(gate.from) && state.waiting) {
      const ready = gate.from.filter((eid) => (state.bufferByEdge[eid] || 0) >= (gate.count || 1)).length;
      pills.push({ text: `${ready}/${gate.from.length}`, tone: 'primary' });
    }
    return pills;
  }

  if (hasRetry(node) && state.retries > 0) {
    pills.push({ text: `retry ${state.retries}/${node.retry.maxRetries || 3}`, tone: 'warning' });
  }

  if (hasCircuit(node)) {
    const st = state.circuitState || 'closed';
    if (st !== 'closed') {
      pills.push({ text: st.toUpperCase(), tone: st === 'open' ? 'danger' : 'warning' });
    }
    pills.push({ icon: 'circle-x', text: String(rejects), tone: rejects > 0 ? 'danger' : null });
  }

  const max = admissionMax(node);
  if (state.buffer > 0 || max != null) {
    const occ = state.buffer + (state.processing ? 1 : 0);
    const text = max != null ? `${occ}/${max}` : `queue ${state.buffer}`;
    pills.push({ text, tone: state.buffer > 0 ? 'warning' : null });
  }

  if (state.waiting) pills.push({ text: 'waiting', tone: 'warning' });
  if (state.processing) pills.push({ icon: '···', animated: true });

  if (rejectEdge && !hasCircuit(node)) {
    pills.push({ icon: 'circle-x', text: String(rejects), tone: rejects > 0 ? 'danger' : null });
  }

  return pills;
}

export function estimateBottomPillHeight(node) {
  return estimateAdmissionPillHeight(node);
}
