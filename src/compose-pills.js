/** Estimate extra vertical space for static bottom pills (layout / bounds). */
export function estimateBottomPillHeight(node) {
  const pills = node?.pillBottom;
  if (!pills?.length) return 0;
  const pillH = 18;
  const gap = 3;
  const pad = 5;
  return pad + pillH * pills.length + gap * Math.max(0, pills.length - 1);
}
