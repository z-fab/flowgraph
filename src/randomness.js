export function applyJitter(base, jitter, enabled) {
  if (!enabled || !jitter) return base;
  const factor = 1 + (Math.random() * 2 - 1) * jitter;
  return Math.max(1, Math.round(base * factor));
}

export function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}
