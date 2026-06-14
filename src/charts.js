/** SVG sparkline from time-series samples [{t, v}]. */
export function renderSparkline(samples, options = {}) {
  const width = options.width ?? 280;
  const height = options.height ?? 48;
  const color = options.color ?? '#7C3AED';
  const fill = options.fill ?? `color-mix(in srgb, ${color} 12%, transparent)`;
  const label = options.label ?? '';
  const unit = options.unit ?? '';

  if (!samples?.length) {
    return `
      <div class="fg-sparkline-wrap">
        ${label ? `<div class="fg-sparkline-label">${label}</div>` : ''}
        <svg class="fg-sparkline fg-sparkline-empty" width="${width}" height="${height}" aria-hidden="true">
          <line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}" stroke="currentColor" stroke-opacity="0.15"/>
        </svg>
        <span class="fg-sparkline-empty-text">Sem dados ainda</span>
      </div>`;
  }

  const values = samples.map((s) => s.v);
  let min = options.min ?? Math.min(...values);
  let max = options.max ?? Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = 4;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const pts = values.map((v, i) => {
    const x = pad + (i / Math.max(1, values.length - 1)) * innerW;
    const y = pad + innerH - ((v - min) / (max - min)) * innerH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const last = values[values.length - 1];
  const area = `${pad},${height - pad} ${pts.join(' ')} ${width - pad},${height - pad}`;

  return `
    <div class="fg-sparkline-wrap">
      ${label ? `<div class="fg-sparkline-label">${label}<span class="fg-sparkline-last">${last}${unit ? ` ${unit}` : ''}</span></div>` : ''}
      <svg class="fg-sparkline" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label || 'sparkline'}">
        <polygon class="fg-sparkline-area" points="${area}" fill="${fill}" />
        <polyline class="fg-sparkline-line" points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="1.75" stroke-linejoin="round" stroke-linecap="round"/>
      </svg>
    </div>`;
}

/** Bucket point events [{t,v}] into per-second sums for throughput display. */
export function bucketBySecond(samples, windowSec = 30) {
  if (!samples?.length) return [];
  const now = Date.now();
  const start = now - windowSec * 1000;
  const buckets = {};
  samples.forEach((s) => {
    if (s.t < start) return;
    const sec = Math.floor((s.t - start) / 1000);
    buckets[sec] = (buckets[sec] || 0) + (s.v ?? 1);
  });
  const maxSec = Math.floor((now - start) / 1000);
  const out = [];
  for (let i = 0; i <= maxSec; i += 1) {
    out.push({ t: start + i * 1000, v: buckets[i] || 0 });
  }
  return out;
}
