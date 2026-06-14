import { createDrawer } from './drawer.js';
import { syncGlobalMetricsButton, syncChromePinned } from './controls.js';
import { renderSparkline, bucketBySecond } from '../charts.js';
import { buildNodeInfoRows, buildNodeMetricRows, buildNodeCharts } from './node-metrics.js';
import { renderInspectorForm, bindInspectorForm } from './inspector.js';

function statCard(label, value) {
  return `<div class="fg-stat-card"><span class="fg-stat-label">${label}</span><span class="fg-stat-value">${value}</span></div>`;
}

function statsGrid(rows) {
  if (!rows.length) return '<p class="fg-muted fg-panel-placeholder">Sem métricas para este nó.</p>';
  return `<div class="fg-stat-grid">${rows.map(([l, v]) => statCard(l, v)).join('')}</div>`;
}

function fmtMs(v) {
  return v != null && v !== '' ? `${v} ms` : '—';
}

function renderConfigTab(instance, nodeId) {
  const drawer = instance._nodeDrawer;
  if (!drawer) return;
  const configTab = drawer.panel('config');
  const node = instance.config.nodesById[nodeId];
  if (!configTab || !node) return;
  configTab.innerHTML = renderInspectorForm(node, instance.config);
  const form = configTab.querySelector('.fg-inspector-form');
  if (form) bindInspectorForm(form, instance, nodeId, () => renderConfigTab(instance, nodeId));
}

function renderNodePanelContent(instance, nodeId, options = {}) {
  const { refreshConfig = true } = options;
  const drawer = instance._nodeDrawer;
  if (!drawer || !instance.metrics) return;

  const node = instance.config.nodesById[nodeId];
  const stats = instance.metrics.nodeStats(nodeId);
  if (!node || !stats) return;

  const cfg = instance.config;

  drawer.setTitle(node.label || node.id);

  const info = drawer.panel('info');
  if (info) {
    info.innerHTML = `
      <p class="fg-muted fg-drawer-subtitle">${node.type}${node.role ? ` · ${node.role}` : ''}</p>
      ${statsGrid(buildNodeInfoRows(node, stats, cfg))}
    `;
  }

  const metricsTab = drawer.panel('metrics');
  if (metricsTab) {
    const rows = buildNodeMetricRows(node, stats, cfg);
    metricsTab.innerHTML = statsGrid(rows) + buildNodeCharts(node, stats, cfg);
  }

  if (refreshConfig) renderConfigTab(instance, nodeId);
}

export function mountGlobalDrawer(root, instance, config) {
  if (config.metrics?.globalDrawer === false || config.metrics?.systemPanel === false) return null;

  const drawer = createDrawer(root, {
    id: 'fg-global-drawer',
    title: 'Métricas globais',
    tabs: [
      { id: 'overview', label: 'Overview' },
      { id: 'charts', label: 'Charts' },
    ],
    onClose: () => {
      syncGlobalMetricsButton(instance);
      syncChromePinned(instance);
    },
    onOpen: () => {
      syncGlobalMetricsButton(instance);
      syncChromePinned(instance);
    },
  });

  instance._globalDrawer = drawer;
  return drawer;
}

export function updateGlobalPanel(instance) {
  const drawer = instance._globalDrawer;
  if (!drawer || !instance.metrics) return;

  const cfg = instance.config;
  const chartsOn = cfg.metrics?.charts !== false;
  const windowSec = cfg.metrics?.windowSec ?? 30;
  const primary = cfg.theme?.primary ?? '#7C3AED';
  const s = instance.metrics.systemStats();
  const sys = instance.metrics.system;

  const overview = drawer.panel('overview');
  if (overview) {
    overview.innerHTML = statsGrid([
      ['RT', s.lastRt != null ? `${s.lastRt} ms` : '—'],
      ['Throughput', `${s.throughput}/s`],
      ['p50 RT', fmtMs(s.p50Rt)],
      ['p90 RT', fmtMs(s.p90Rt)],
      ['Rejects', String(s.rejects)],
      ['Completed', String(s.completed)],
    ]);
  }

  const charts = drawer.panel('charts');
  if (charts) {
    if (!chartsOn) {
      charts.innerHTML = '<p class="fg-muted fg-panel-placeholder">Charts desativados (metrics.charts: false).</p>';
      return;
    }
    const rtSeries = sys.rtSamples || [];
    const tpSeries = bucketBySecond(sys.throughput || [], windowSec);
    charts.innerHTML = `
      <div class="fg-panel-section">
        ${renderSparkline(rtSeries, { label: 'Response time', unit: 'ms', color: primary, width: 268, height: 52 })}
      </div>
      <div class="fg-panel-section">
        ${renderSparkline(tpSeries, { label: 'Throughput / s', unit: '/s', color: cfg.theme?.success ?? '#3D6B52', width: 268, height: 52 })}
      </div>`;
  }
}

export function mountNodeDrawer(root, instance, config) {
  if (config.metrics?.nodeDrawer === false && config.metrics?.nodePanel === false) return null;

  const drawer = createDrawer(root, {
    id: 'fg-node-drawer',
    side: 'left',
    title: 'Nó',
    tabs: [
      { id: 'info', label: 'Info' },
      { id: 'metrics', label: 'Metrics' },
      { id: 'config', label: 'Config' },
    ],
    onClose: () => {
      if (instance._selectedNode) {
        instance.nodeRenderer.setSelected(instance._selectedNode, false);
        instance._selectedNode = null;
        instance._clearEdgeHighlight();
      }
      syncChromePinned(instance);
    },
    onOpen: () => {
      syncChromePinned(instance);
    },
  });

  instance._nodeDrawer = drawer;
  return drawer;
}

export function updateNodePanel(instance, nodeId) {
  const drawer = instance._nodeDrawer;
  if (!drawer || !instance.metrics) return;

  renderNodePanelContent(instance, nodeId);

  if (!drawer.isOpen()) drawer.open();
}

export function refreshOpenPanels(instance) {
  if (instance._globalDrawer?.isOpen()) updateGlobalPanel(instance);
  if (instance._nodeDrawer?.isOpen() && instance._selectedNode) {
    const onConfig = instance._nodeDrawer.getActiveTab() === 'config';
    renderNodePanelContent(instance, instance._selectedNode, { refreshConfig: !onConfig });
  }
}

export function closeNodeDrawer(instance) {
  instance._nodeDrawer?.close();
}

export { renderConfigTab };
