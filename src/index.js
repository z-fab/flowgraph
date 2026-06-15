import { parseConfig, resolveTokenType, autoLayout, needsLayout } from './config.js';
import { graphBoundsWithEdges, graphBounds } from './geometry.js';
import { createViewport } from './viewport.js';
import { renderEdges } from './render-edge.js';
import { renderNodes } from './render-node.js';
import { ParticleSystem } from './particles.js';
import { MultiTrackPlayer, FlowPlayer } from './flow-player.js';
import { NodeStats } from './node-stats.js';
import { applyCanvasBackground } from './ui/canvas-bg.js';
import { createChrome, updatePlayButton, syncChromePinned } from './ui/controls.js';
import { toggleFullscreen, closeFullscreen } from './ui/fullscreen.js';
import { updateModeButtons } from './ui/step-controls.js';
import { mountStepBar, updateStepBar } from './ui/step-bar.js';
import { mountNarrationOverlay } from './ui/narration-overlay.js';
import { mountScenarioPanel, updateScenarioPanel } from './ui/scenario-panel.js';
import { travelTitle, travelDescription, dwellTitle, dwellDescription } from './scenario-labels.js';
import { attachNodeDrag } from './interaction/drag.js';

const NS = 'http://www.w3.org/2000/svg';
const CSS_HREF = 'flowgraph.css';
const PLAYBACK_MODES = ['play', 'narrative', 'step'];

function resolveTarget(target) {
  if (typeof target === 'string') return document.querySelector(target);
  return target;
}

function injectStylesheet() {
  if (document.querySelector('link[data-flowgraph-css]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = CSS_HREF;
  link.setAttribute('data-flowgraph-css', '1');
  document.head.appendChild(link);
}

class FlowGraphInstance {
  constructor(container, rawConfig) {
    this.container = container;
    this.config = parseConfig(rawConfig);
    this.listeners = {};
    this.running = false;
    this._raf = null;
    this._lastTs = 0;
    this.playbackMode = this.config.scenario.defaultMode || 'play';
    if (!PLAYBACK_MODES.includes(this.playbackMode)) this.playbackMode = 'play';
    this.playSpeed = this.config.scenario.speed || 1;
    this._stepping = false;
    this._atNodeId = null;
    this._stepHighlight = { nodeId: null, edgeId: null, edgeIds: [] };
    this.nodeStats = new NodeStats(this.config.nodes);

    if (this.config.injectStyles) injectStylesheet();

    this._mount();
    this._bindPlayer();
    this._applyPlaybackMode(this.playbackMode, { initial: true });

    if (this.config.autoStart) this.start();
  }

  _mount() {
    const cfg = this.config;
    this.container.innerHTML = '';
    this.container.classList.add('fg-container');

    const root = document.createElement('div');
    root.className = 'fg-root';
    root.style.setProperty('--fg-bg', cfg.theme.background);
    root.style.setProperty('--fg-font', cfg.theme.font);
    root.style.setProperty('--fg-primary', cfg.theme.primary);
    root.style.setProperty('--fg-border', cfg.theme.border);
    root.style.setProperty('--fg-text', cfg.theme.text);
    root.style.setProperty('--fg-text-muted', cfg.theme.textMuted);
    root.style.setProperty('--fg-edge-label-bg', cfg.theme.pillSurface || '#FFFFFF');
    applyCanvasBackground(root, cfg.viewport, cfg.theme);

    if (cfg.viewport.height) {
      root.style.height = typeof cfg.viewport.height === 'number' ? `${cfg.viewport.height}px` : cfg.viewport.height;
    }
    if (cfg.viewport.width) {
      root.style.width = typeof cfg.viewport.width === 'number' ? `${cfg.viewport.width}px` : cfg.viewport.width;
    }

    const canvasBg = document.createElement('div');
    canvasBg.className = 'fg-canvas-bg';
    canvasBg.setAttribute('aria-hidden', 'true');

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'fg-svg');
    svg.setAttribute('xmlns', NS);

    const viewportG = document.createElementNS(NS, 'g');
    viewportG.setAttribute('class', 'fg-viewport');

    const edgesLayer = document.createElementNS(NS, 'g');
    edgesLayer.setAttribute('class', 'fg-edges');
    const particlesLayer = document.createElementNS(NS, 'g');
    particlesLayer.setAttribute('class', 'fg-particles');
    const labelsLayer = document.createElementNS(NS, 'g');
    labelsLayer.setAttribute('class', 'fg-labels');
    const nodesLayer = document.createElementNS(NS, 'g');
    nodesLayer.setAttribute('class', 'fg-nodes');

    viewportG.appendChild(edgesLayer);
    viewportG.appendChild(particlesLayer);
    viewportG.appendChild(labelsLayer);
    viewportG.appendChild(nodesLayer);
    svg.appendChild(viewportG);
    root.appendChild(canvasBg);
    root.appendChild(svg);

    this.root = root;
    this.svg = svg;
    this.viewportG = viewportG;

    this.bounds = graphBoundsWithEdges(cfg.nodes, cfg.edges, cfg.nodesById, cfg.viewport.padding);
    this.edgeRenderer = renderEdges(edgesLayer, labelsLayer, cfg.edges, cfg.nodesById, cfg.theme);
    this.nodeRenderer = renderNodes(nodesLayer, cfg.nodes, cfg.theme);
    this.particles = new ParticleSystem(particlesLayer, this.edgeRenderer, cfg);
    this.viewport = createViewport(svg, viewportG, cfg, this.bounds);

    this._narration = mountNarrationOverlay(root, cfg, this);
    createChrome(root, this, cfg);
    this._scenarioPanel = mountScenarioPanel(root, this, cfg);
    if (!this._scenarioPanel) {
      mountStepBar(this._chromeDock || root, this, cfg);
    }
    this.container.appendChild(root);

    const nodeDrag = cfg.interaction?.nodeDrag !== false;
    if (nodeDrag) attachNodeDrag(this);

    this.nodeRenderer.refreshIcons();
    requestAnimationFrame(() => {
      this.edgeRenderer.updateLabels();
      this.viewport.fit();
    });

    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(() => this.viewport.fit());
      this._ro.observe(svg);
    }
  }

  _shouldNarrate() {
    return this.playbackMode === 'narrative' || this.playbackMode === 'step';
  }

  _shouldHighlight() {
    return this.playbackMode === 'narrative';
  }

  _isManual() {
    return this.playbackMode === 'step';
  }

  _refreshNodeMetrics(nodeId) {
    const node = this.config.nodesById[nodeId];
    if (!node?.metrics) return;
    const auto = this.nodeStats.pillsFor(nodeId, node);
    if (auto.length) this.nodeRenderer.setPillsBottom(nodeId, auto);
  }

  _syncScenarioPanel() {
    const narr = this.config.scenario?.narration?.showOnCanvas;
    const stepMode = this.playbackMode === 'step';
    const narrativeMode = this.playbackMode === 'narrative';

    this._scenarioPanel?.show(!!(narr && stepMode), { stepMode });

    if (narrativeMode && narr) {
      this._narration?.setTrackPickerVisible(true);
      this._narration?.syncTracks();
    } else {
      this._narration?.setTrackPickerVisible(false);
    }

    if (stepMode && narr) {
      this._scenarioPanel?.setTrackSteps(this.player.activePlayer().steps);
      updateScenarioPanel(this);
    }
    this._stepBar?.hide();
  }

  _bindPlayer() {
    const cfg = this.config;
    const hooks = {
      shouldNarrate: () => this._shouldNarrate(),
      shouldSkipNarratePause: () => this.playbackMode === 'play',
      shouldSequentialParallel: () => this.playbackMode !== 'play',
      onReset: () => {
        this.particles.clear();
        this.particles.setSpeedMultiplier(this.playSpeed);
        this._applyStepHighlight(null);
        this.nodeStats.reset();
        cfg.nodes.forEach((n) => {
          this.nodeRenderer.setEffect(n.id, null);
          this.nodeRenderer.setActive(n.id, false);
          if (n.metrics) this._refreshNodeMetrics(n.id);
        });
        this._atNodeId = null;
        this._narration?.set('', '');
        this._scenarioPanel?.reset();
        this._syncScenarioPanel();
      },
      onStepStart: (step, _manual, _trackId, meta) => {
        if (this.playbackMode !== 'step' || !this._scenarioPanel) return;
        const idx = this._scenarioPanel.resolveIndex(step, meta);
        if (idx >= 0) this._scenarioPanel.setActiveIndex(idx);
      },
      onNarration: () => {
        updateScenarioPanel(this);
        updateStepBar(this);
      },
      onStep: () => {
        updateScenarioPanel(this);
        updateStepBar(this);
      },
      travel: (step, manual, trackId) => this._runTravel(step, manual, trackId),
      dwell: (step, manual) => this._runDwell(step, manual),
      setPill: (step) => {
        const node = cfg.nodesById[step.node];
        if (!node) return;
        if (step.pill != null) {
          node.pillTop = [{ text: String(step.pill), tone: step.tone || 'primary' }];
        }
        this.nodeRenderer.setPillsTop(step.node, node.pillTop);
      },
      setEffect: (step) => {
        const effect = step.effect || null;
        this.nodeRenderer.setEffect(step.node, effect);
        this.nodeRenderer.setActive(step.node, !!effect);
        if (effect === 'open') {
          const node = cfg.nodesById[step.node];
          if (node) {
            node.pillTop = [{ text: 'open', tone: 'danger' }];
            this.nodeRenderer.setPillsTop(step.node, node.pillTop);
          }
        }
      },
      focus: (step) => {
        if (!this._shouldHighlight()) return;
        if (step.edge) {
          const e = cfg.edgesById[step.edge];
          this.viewport.focusOnNodes?.(e?.from, e?.to, cfg.nodesById);
        } else if (step.node) {
          this.viewport.focusOnNodes?.(step.node, step.node, cfg.nodesById);
        }
      },
    };
    this.player = new MultiTrackPlayer(cfg, hooks);
    this.player.setSpeed(this.playSpeed);
    this._syncScenarioPanel();
  }

  _scaled(ms) {
    return Math.max(0, ms / (this.playSpeed || 1));
  }

  _stepBeat(ms) {
    return new Promise((r) => setTimeout(r, this._scaled(ms)));
  }

  _applyStepHighlight(highlight) {
    if (!this._shouldHighlight()) {
      this.root?.classList.remove('fg-step-focus', 'fg-narrative-focus');
      const prev = this._stepHighlight;
      if (prev.nodeId) this.nodeRenderer.setStepActive(prev.nodeId, false);
      if (prev.edgeId) this.edgeRenderer.setStepActive(prev.edgeId, false);
      this._stepHighlight = { nodeId: null, edgeId: null, edgeIds: [] };
      return;
    }

    const prev = this._stepHighlight;
    if (prev.nodeId) this.nodeRenderer.setStepActive(prev.nodeId, false);
    if (prev.edgeId) this.edgeRenderer.setStepActive(prev.edgeId, false);

    this._stepHighlight = { nodeId: null, edgeId: null, edgeIds: [] };
    this.root?.classList.remove('fg-step-focus', 'fg-narrative-focus');
    if (!highlight) return;

    const focusClass = this.playbackMode === 'step' ? 'fg-step-focus' : 'fg-narrative-focus';
    this.root?.classList.add(focusClass);

    const phase = highlight.phase || 'default';
    if (phase === 'depart' || phase === 'origin') {
      const fromId = highlight.fromNodeId || highlight.nodeId;
      if (fromId) {
        this.nodeRenderer.setStepActive(fromId, true);
        this._stepHighlight.nodeId = fromId;
      }
      if (highlight.edgeId) {
        this.edgeRenderer.setStepActive(highlight.edgeId, true);
        this._stepHighlight.edgeId = highlight.edgeId;
      }
      return;
    }
    if (phase === 'moving' && highlight.edgeId) {
      this.edgeRenderer.setStepActive(highlight.edgeId, true);
      this._stepHighlight.edgeId = highlight.edgeId;
      return;
    }
    if (phase === 'arrive') {
      const toId = highlight.toNodeId || highlight.nodeId;
      if (toId) {
        this.nodeRenderer.setStepActive(toId, true);
        this._stepHighlight.nodeId = toId;
      }
      return;
    }
    if (highlight.nodeId) {
      this.nodeRenderer.setStepActive(highlight.nodeId, true);
      this._stepHighlight.nodeId = highlight.nodeId;
    }
    if (highlight.edgeId) {
      this.edgeRenderer.setStepActive(highlight.edgeId, true);
      this._stepHighlight.edgeId = highlight.edgeId;
    }
  }

  async _runTravel(step, manual) {
    const cfg = this.config;
    const edge = cfg.edgesById[step.edge];
    if (!edge) return;

    const reverse = step.direction === 'reverse';
    const fromId = reverse ? edge.to : edge.from;
    const toId = reverse ? edge.from : edge.to;
    const tokenCfg = resolveTokenType(cfg, step.token || 'default', edge);

    step.title = step.title || travelTitle(cfg, step.edge);
    step.description = step.description || travelDescription(cfg, step.edge, step.direction || 'forward');

    if (this._shouldNarrate()) {
      if (this.playbackMode === 'narrative' || !this._scenarioPanel?.el || this._scenarioPanel.el.hidden) {
        this._narration?.set(step.title, step.description);
      }
    }

    const skipMetrics = step.countMetrics === false || tokenCfg.countMetrics === false;

    const fromNode = cfg.nodesById[fromId];
    if (fromNode?.metrics && !skipMetrics) {
      this.nodeStats.onDepart(fromId);
      this._refreshNodeMetrics(fromId);
    }

    this._atNodeId = fromId;
    this.player.activePlayer().atNodeId = fromId;

    if (this._shouldHighlight()) {
      this._applyStepHighlight({ phase: 'depart', fromNodeId: fromId, edgeId: step.edge });
      this.viewport.focusOnNodes?.(fromId, toId, cfg.nodesById);
      if (!manual) await this._stepBeat(120);
    }

    if (this._shouldHighlight()) {
      this._applyStepHighlight({ phase: 'moving', edgeId: step.edge });
    }

    await this.particles.travel(step.edge, tokenCfg, reverse);

    const toNode = cfg.nodesById[toId];
    if (toNode?.metrics && !skipMetrics) {
      this.nodeStats.onArrive(toId);
      this._refreshNodeMetrics(toId);
    }

    this._atNodeId = toId;
    this.player.activePlayer().atNodeId = toId;

    if (this._shouldHighlight()) {
      this._applyStepHighlight({ phase: 'arrive', toNodeId: toId });
      if (!manual) await this._stepBeat(150);
    } else {
      this._applyStepHighlight(null);
    }
  }

  async _runDwell(step, manual) {
    const cfg = this.config;
    step.title = step.title || dwellTitle(cfg, step.node);
    step.description = step.description || dwellDescription(cfg, step.node, step.effect);

    if (this._shouldNarrate()) {
      if (this.playbackMode === 'narrative' || !this._scenarioPanel?.el || this._scenarioPanel.el.hidden) {
        this._narration?.set(step.title, step.description);
      }
    }

    this._atNodeId = step.node;
    this.player.activePlayer().atNodeId = step.node;

    if (this._shouldHighlight()) {
      this._applyStepHighlight({ nodeId: step.node, phase: 'default' });
    }

    const node = cfg.nodesById[step.node];
    const effect = step.effect || 'processing';
    const savedPillTop = node?.pillTop ? [...node.pillTop] : [];
    this.nodeRenderer.setEffect(step.node, effect);
    this.nodeRenderer.setActive(step.node, true);
    if (effect === 'processing') {
      this.nodeRenderer.setPillsTop(step.node, [
        { text: 'running', tone: 'warning', animated: true, icon: '···' },
      ]);
    }

    const base = manual ? 280 : (step.ms || 500);
    const ms = this.playbackMode === 'play' ? base * 0.55 : base;
    await this._stepBeat(ms);

    this.nodeRenderer.setEffect(step.node, null);
    this.nodeRenderer.setActive(step.node, false);
    if (effect === 'processing' && node) {
      this.nodeRenderer.setPillsTop(step.node, savedPillTop);
    }
    if (!this._shouldHighlight()) this._applyStepHighlight(null);
  }

  setPlaybackMode(mode) {
    if (!PLAYBACK_MODES.includes(mode) || mode === this.playbackMode) return;
    const keepRunning = this.running;
    this._resetPlaybackState();
    this._applyPlaybackMode(mode);
    if (keepRunning) {
      this.running = true;
      if (!this._raf) {
        this._lastTs = 0;
        this._raf = requestAnimationFrame((t) => this._tick(t));
      }
      if (mode !== 'step') this._startAutoPlayback();
    }
    updatePlayButton(this);
  }

  _resetPlaybackState() {
    this.player.stopAll();
    this.player.reset();
    this._applyStepHighlight(null);
    this._atNodeId = null;
    this._narration?.set('', '');
    this._scenarioPanel?.reset();
    requestAnimationFrame(() => this.viewport.fit());
  }

  setPlaySpeed(speed) {
    this.playSpeed = speed;
    this.player.setSpeed(speed);
    this.particles.setSpeedMultiplier(speed);
    if (this._speedSelect) this._speedSelect.value = String(speed);
    updateScenarioPanel(this);
  }

  setActiveTrack(trackId) {
    this.player.activeTrackId = trackId;
    updateStepBar(this);
    this._syncScenarioPanel();
    const peek = this.player.activePlayer().peek();
    if (peek && this._shouldNarrate()) {
      this._narration?.set(peek.title || '', peek.description || '');
    }
    if (this.running && this.playbackMode === 'narrative') {
      this._startNarrativeTrack();
    }
  }

  _applyPlaybackMode(mode, { initial = false } = {}) {
    this.playbackMode = mode;
    PLAYBACK_MODES.forEach((m) => this.root?.classList.remove(`fg-mode-${m}`));
    this.root?.classList.add(`fg-mode-${mode}`);

    if (mode === 'play') {
      this._stepBar?.hide();
      this._narration?.set('', '');
      this._applyStepHighlight(null);
    } else if (mode === 'narrative') {
      this._stepBar?.hide();
      const peek = this.player.activePlayer().peek();
      if (peek) this._narration?.set(peek.title || '', peek.description || '');
    } else if (mode === 'step') {
      const peek = this.player.activePlayer().peek();
      if (peek && !this._scenarioPanel) this._narration?.set(peek.title || '', peek.description || '');
    }

    syncChromePinned(this);
    updateModeButtons(this);
    updateStepBar(this);
    updatePlayButton(this);
    this._syncScenarioPanel();

    if (!initial && mode !== 'step' && this.running) {
      this._startAutoPlayback();
    }
  }

  _startAutoPlayback() {
    this.player.stopAll();
    if (this.playbackMode === 'play') {
      this.player.startParallel();
    } else if (this.playbackMode === 'narrative') {
      this._startNarrativeTrack();
    }
  }

  _startNarrativeTrack() {
    const p = this.player.activePlayer();
    if (!p) return;
    this.player.stopAll();
    p.reset();
    p._forceNoLoop = true;
    p.speed = this.player.speed;
    p.startPlay(p.track.offset || 0);
  }

  async stepNext() {
    if (this.playbackMode !== 'step' || this._stepping) return null;
    this._stepping = true;
    updateStepBar(this);
    updateScenarioPanel(this);
    try {
      return await this.player.stepNext();
    } finally {
      this._stepping = false;
      updateStepBar(this);
      updateScenarioPanel(this);
    }
  }

  async stepPrev() {
    if (this.playbackMode !== 'step' || this._stepping) return null;
    this._stepping = true;
    updateStepBar(this);
    updateScenarioPanel(this);
    try {
      return await this.player.stepPrev();
    } finally {
      this._stepping = false;
      updateStepBar(this);
      updateScenarioPanel(this);
    }
  }

  /** @deprecated use setPlaybackMode('step') */
  enableStepMode() { this.setPlaybackMode('step'); }
  /** @deprecated use setPlaybackMode('play') */
  disableStepMode() { this.setPlaybackMode('play'); }

  _tick(ts) {
    if (!this._lastTs) this._lastTs = ts;
    const dt = ts - this._lastTs;
    this._lastTs = ts;
    this.particles.update(dt);
    this._raf = requestAnimationFrame((t) => this._tick(t));
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._lastTs = 0;
    this.particles.setSpeedMultiplier(this.playSpeed);
    this._raf = requestAnimationFrame((t) => this._tick(t));
    if (this.playbackMode !== 'step') this._startAutoPlayback();
    updatePlayButton(this);
  }

  pause() {
    this.running = false;
    this.player.stopAll();
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
    updatePlayButton(this);
  }

  reset() {
    const mode = this.playbackMode;
    this.pause();
    this.player.reset();
    this._applyStepHighlight(null);
    this._atNodeId = null;
    this.running = true;
    this._lastTs = 0;
    this._raf = requestAnimationFrame((t) => this._tick(t));
    if (mode !== 'step') this._startAutoPlayback();
    updatePlayButton(this);
    updateModeButtons(this);
    updateStepBar(this);
  }

  destroy() {
    this.pause();
    closeFullscreen(this);
    if (this._ro) this._ro.disconnect();
    this.container.innerHTML = '';
    this.container.classList.remove('fg-container');
  }

  fit() {
    this.viewport.fit();
  }

  getConfig() {
    return this.config;
  }

  async applyAutoLayout(engine) {
    const layoutCfg = this.config.layout || {};
    const eng = engine || layoutCfg.engine || 'layered';

    if (eng === 'dagre') {
      const { dagreLayout } = await import('./layout-dagre.js');
      dagreLayout(this.config.nodes, this.config.edges, { ...layoutCfg, force: true });
    } else {
      autoLayout(this.config.nodes, this.config.edges, { ...layoutCfg, force: true });
    }

    this.config.nodes.forEach((n) => {
      this.nodeRenderer.setPosition(n.id, n.x, n.y);
    });
    this.edgeRenderer.updatePaths(this.config.nodesById);
    this.viewport.updateBounds(graphBoundsWithEdges(
      this.config.nodes,
      this.config.edges,
      this.config.nodesById,
      this.config.viewport.padding,
    ));
    requestAnimationFrame(() => this.viewport.fit());
  }
}

function create(target, config) {
  const container = resolveTarget(target);
  if (!container) throw new Error('FlowGraph: container not found');
  return new FlowGraphInstance(container, config);
}

async function createFromURL(target, url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FlowGraph: failed to load ${url}`);
  return create(target, await res.json());
}

export const FlowGraph = { create, createFromURL, parseConfig, autoLayout, needsLayout };
export { parseConfig, graphBounds, graphBoundsWithEdges, FlowPlayer, MultiTrackPlayer };

if (typeof window !== 'undefined') {
  window.FlowGraph = FlowGraph;
}

export default FlowGraph;
