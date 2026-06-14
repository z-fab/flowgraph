/** Unified token admission for process nodes. */

export function admissionMode(node) {
  return node.admission?.mode || 'queue';
}

export function admissionMax(node) {
  return node.admission?.max ?? null;
}

export function hasCircuit(node) {
  return node.circuit != null;
}

export function hasRetry(node) {
  return node.retry?.backEdge != null;
}

export function isJoinGate(node) {
  const from = node.gate?.from;
  return from === 'all-edges' || Array.isArray(from);
}

/** Try to accept an arriving token. Returns { accepted, accumulating } or { accepted: false, overflow: true }. */
export function tryAdmit(node, state, inEdgeId) {
  const mode = admissionMode(node);
  const max = admissionMax(node);

  if (mode === 'slot') {
    const cap = max ?? 1;
    if (state.slots >= cap) return { accepted: false, overflow: true };
    state.slots += 1;
    state.buffer += 1;
    state.bufferByEdge[inEdgeId] = (state.bufferByEdge[inEdgeId] || 0) + 1;
    return { accepted: true, slots: state.slots };
  }

  if (mode === 'batch') {
    const batchMax = max ?? 10;
    const step = node.admission?.step ?? 1;
    state.fill = Math.min(batchMax, state.fill + step);
    state.flushing = false;
    if (state.fill < batchMax) {
      return { accepted: false, accumulating: true };
    }
    state.fill = 0;
    state.buffer += 1;
    state.flushing = true;
    return { accepted: true, flush: true };
  }

  // queue (default)
  const occ = state.buffer + (state.processing ? 1 : 0);
  if (max != null && occ >= max) return { accepted: false, overflow: true };
  state.buffer += 1;
  state.bufferByEdge[inEdgeId] = (state.bufferByEdge[inEdgeId] || 0) + 1;
  return { accepted: true };
}

export function releaseSlot(state) {
  state.slots = Math.max(0, state.slots - 1);
}

export function estimateAdmissionPillHeight(node) {
  const mode = admissionMode(node);
  const pillH = 18;
  const gap = 3;
  const pad = 5;
  if (mode === 'slot') return pad + pillH * 3 + gap * 2;
  if (isJoinGate(node)) return pad + pillH * 2 + gap;
  if (hasCircuit(node) || node.admission?.rejectEdge) return pad + pillH * 2 + gap;
  return pad + pillH;
}
