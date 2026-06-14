import { renderSparkline, bucketBySecond } from '../charts.js';
import { admissionMode, admissionMax, hasCircuit, hasRetry, isJoinGate } from '../admission.js';

function emitModeLabel(node) {
  const emit = node.emit || { mode: 'all' };
  if (emit.mode === 'weighted') return 'weighted';
  if (emit.mode === 'round-robin') return 'round-robin';
  if (emit.mode === 'map') return 'map';
  if (emit.mode === 'excludeReject') return 'exclude reject';
  return emit.mode || 'all';
}

function gateLabel(node) {
  const gate = node.gate || {};
  if (Array.isArray(gate.from)) return `${gate.from.length} edges`;
  if (gate.from === 'all-edges') return `all edges ×${gate.count || 1}`;
  return `count ×${gate.count || 1}`;
}

function ratePerSec(samples, windowSec) {
  if (!samples?.length) return 0;
  return Math.round((samples.length / (windowSec || 30)) * 10) / 10;
}

function fmtMs(v) {
  return v != null && v !== '' ? `${v} ms` : '—';
}

/** Info tab rows: [label, value][] */
export function buildNodeInfoRows(node, stats, config) {
  if (!node || !stats) return [];

  const rows = [['Estado', stats.state]];

  if (node.type === 'port') {
    if (node.role === 'source') {
      const src = config.sources?.find((s) => {
        const edge = config.edgesById[s.edgeId];
        return edge?.from === node.id;
      });
      rows.push(['Emitidos', String(stats.tokensOut)]);
      if (src) {
        rows.push(['Intervalo', `${src.interval} ms`]);
        if (src.burst?.count > 1) {
          rows.push(['Burst', `${src.burst.count} / ${src.burst.spacing}ms`]);
        }
      }
    } else {
      rows.push(['Recebidos', String(stats.received ?? stats.tokensIn)]);
      rows.push(['Entrada', String(stats.tokensIn)]);
    }
    return rows;
  }

  const mode = admissionMode(node);
  if (mode === 'slot') {
    rows.push(['Ocupação', `${stats.queueDepth} / ${admissionMax(node)}`]);
    rows.push(['Entrada / Saída', `${stats.tokensIn} / ${stats.tokensOut}`]);
    if (node.admission?.rejectEdge) rows.push(['Rejeitados', String(stats.rejects)]);
  } else if (mode === 'batch') {
    rows.push(['Batch max', String(admissionMax(node) ?? '—')]);
    rows.push(['Entrada / Saída', `${stats.tokensIn} / ${stats.tokensOut}`]);
  } else if (isJoinGate(node)) {
    rows.push(['Gate', gateLabel(node)]);
    rows.push(['Entrada / Saída', `${stats.tokensIn} / ${stats.tokensOut}`]);
    rows.push(['Aguardando', String(stats.queueDepth)]);
  } else {
    rows.push(['Entrada / Saída', `${stats.tokensIn} / ${stats.tokensOut}`]);
    rows.push(['Fila', String(stats.queueDepth)]);
    const max = admissionMax(node);
    if (max != null) rows.push(['Queue max', String(max)]);
    if (node.admission?.rejectEdge) rows.push(['Rejeitados', String(stats.rejects)]);
  }

  if (hasCircuit(node)) {
    rows.push(['Circuito', (stats.circuitState || 'closed').toUpperCase()]);
    rows.push(['Falhas', String(stats.rejects)]);
  }

  if (hasRetry(node)) {
    rows.push(['Max retries', String(node.retry.maxRetries ?? 3)]);
  }

  if (emitModeLabel(node) !== 'all') {
    rows.push(['Emit', emitModeLabel(node)]);
  }

  return rows;
}

/** Metrics tab stat rows */
export function buildNodeMetricRows(node, stats, config) {
  if (!node || !stats) return [];
  const windowSec = config.metrics?.windowSec ?? 30;
  const rows = [];

  if (node.type === 'port' && node.role === 'source') {
    rows.push(['Taxa emit', `${ratePerSec(stats.emitSamples, windowSec)}/s`]);
    rows.push(['Total emit', String(stats.tokensOut)]);
    return rows;
  }

  if (node.type === 'port') {
    rows.push(['Taxa receb', `${ratePerSec(stats.arriveSamples, windowSec)}/s`]);
    rows.push(['Total receb', String(stats.received ?? stats.tokensIn)]);
    return rows;
  }

  rows.push(['p50 process', fmtMs(stats.p50Process)]);
  rows.push(['p90 process', fmtMs(stats.p90Process)]);
  rows.push(['p50 wait', fmtMs(stats.p50Wait)]);

  if (admissionMode(node) === 'slot') {
    rows.push(['Rejeitados', String(stats.rejects)]);
  }

  rows.push(['Taxa saída', `${ratePerSec(stats.emitSamples, windowSec)}/s`]);
  rows.push(['Emit mode', emitModeLabel(node)]);

  return rows;
}

/** Metrics tab sparkline sections HTML */
export function buildNodeCharts(node, stats, config) {
  if (config.metrics?.charts === false || !stats) return '';

  const windowSec = config.metrics?.windowSec ?? 30;
  const primary = config.theme?.primary ?? '#7C3AED';
  const success = config.theme?.success ?? '#3D6B52';
  const warning = config.theme?.warning ?? '#D97706';
  const danger = config.theme?.danger ?? '#9B1C1C';
  const parts = [];

  if (node.type === 'port' && node.role === 'source') {
    parts.push(renderSparkline(
      bucketBySecond(stats.emitSamples || [], windowSec),
      { label: 'Emissões / s', unit: '/s', color: primary, width: 268, height: 52 }
    ));
    return parts.map((p) => `<div class="fg-panel-section">${p}</div>`).join('');
  }

  if (node.type === 'port') {
    parts.push(renderSparkline(
      bucketBySecond(stats.arriveSamples || [], windowSec),
      { label: 'Recebidos / s', unit: '/s', color: success, width: 268, height: 52 }
    ));
    return parts.map((p) => `<div class="fg-panel-section">${p}</div>`).join('');
  }

  parts.push(renderSparkline(stats.processTimes || [], {
    label: 'Process time', unit: 'ms', color: primary, width: 268, height: 52,
  }));
  parts.push(renderSparkline(stats.waitTimes || [], {
    label: 'Wait time', unit: 'ms', color: warning, width: 268, height: 52,
  }));
  parts.push(renderSparkline(
    bucketBySecond(stats.emitSamples || [], windowSec),
    { label: 'Emissões / s', unit: '/s', color: success, width: 268, height: 52 }
  ));

  if (admissionMode(node) === 'slot') {
    parts.push(renderSparkline(
      bucketBySecond(stats.rejectSamples || [], windowSec),
      { label: 'Rejeições / s', unit: '/s', color: danger, width: 268, height: 52 }
    ));
  }

  return parts.map((p) => `<div class="fg-panel-section">${p}</div>`).join('');
}
