import { hydrateIcons, iconMarkup } from './icons.js';

function makeBtn(className, label, iconName) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className;
  btn.setAttribute('aria-label', label);
  btn.innerHTML = iconMarkup(iconName);
  return btn;
}

export function createChrome(root, instance, config) {
  const chrome = document.createElement('div');
  chrome.className = 'fg-chrome';
  const ctrls = config.controls || {};

  if (config.title && ctrls.title !== false) {
    const header = document.createElement('div');
    header.className = 'fg-chrome-header';
    const title = document.createElement('h2');
    title.className = 'fg-title';
    title.textContent = config.title;
    header.appendChild(title);
    chrome.appendChild(header);
  }

  const showToolbar = ctrls.toolbar !== false && (
    ctrls.playPause !== false
    || ctrls.zoomReset !== false
    || ctrls.reset !== false
    || ctrls.layout
    || (ctrls.metricsDrawer !== false && config.metrics?.globalDrawer !== false && config.metrics?.systemPanel !== false)
  );

  if (!showToolbar && !chrome.childElementCount) {
    instance._chrome = null;
    return null;
  }

  if (!showToolbar) {
    instance._chrome = chrome;
    root.appendChild(chrome);
    return chrome;
  }

  const bar = document.createElement('div');
  bar.className = 'fg-controls';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Controles do diagrama');

  const cluster = document.createElement('div');
  cluster.className = 'fg-controls-cluster';
  cluster.addEventListener('mousedown', (e) => e.stopPropagation());
  cluster.addEventListener('pointerdown', (e) => e.stopPropagation());

  if (ctrls.playPause !== false) {
    const playBtn = makeBtn('fg-btn', 'Play ou pausar simulação', 'pause');
    playBtn.setAttribute('aria-pressed', 'true');
    playBtn.dataset.iconPlay = 'play';
    playBtn.dataset.iconPause = 'pause';
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (instance.running) instance.pause();
      else instance.start();
    });
    cluster.appendChild(playBtn);
    instance._playBtn = playBtn;
  }

  if (ctrls.zoomReset !== false) {
    const fitBtn = makeBtn('fg-btn', 'Centralizar diagrama', 'crosshair');
    fitBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      instance.fit();
    });
    cluster.appendChild(fitBtn);
  }

  const metricsOn = ctrls.metricsDrawer !== false
    && config.metrics?.globalDrawer !== false
    && config.metrics?.systemPanel !== false;
  if (metricsOn) {
    const metricsBtn = makeBtn('fg-btn', 'Métricas globais', 'activity');
    metricsBtn.setAttribute('aria-pressed', 'false');
    metricsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      instance.toggleGlobalDrawer?.();
    });
    cluster.appendChild(metricsBtn);
    instance._metricsBtn = metricsBtn;
  }

  if (ctrls.layout) {
    const layoutBtn = makeBtn('fg-btn', 'Auto-layout', 'layout-grid');
    layoutBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      instance.applyAutoLayout?.();
    });
    cluster.appendChild(layoutBtn);
  }

  if (ctrls.reset !== false) {
    const resetBtn = makeBtn('fg-btn', 'Reiniciar simulação', 'rotate-ccw');
    resetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      instance.reset();
    });
    cluster.appendChild(resetBtn);
  }

  bar.appendChild(cluster);
  chrome.appendChild(bar);
  root.appendChild(chrome);

  instance._chrome = chrome;
  hydrateIcons(chrome);
  return chrome;
}

export function updatePlayButton(instance) {
  if (!instance._playBtn) return;
  const running = instance.running;
  const icon = running ? instance._playBtn.dataset.iconPause : instance._playBtn.dataset.iconPlay;
  instance._playBtn.innerHTML = iconMarkup(icon);
  hydrateIcons(instance._playBtn);
  instance._playBtn.setAttribute('aria-pressed', running ? 'true' : 'false');
  instance._playBtn.setAttribute('aria-label', running ? 'Pausar simulação' : 'Iniciar simulação');
}

/** aria-pressed só reflete o drawer global aberto */
export function syncGlobalMetricsButton(instance) {
  if (!instance._metricsBtn) return;
  const open = instance._globalDrawer?.isOpen() ?? false;
  instance._metricsBtn.setAttribute('aria-pressed', open ? 'true' : 'false');
}

/** Mantém chrome visível enquanto qualquer drawer estiver aberto */
export function syncChromePinned(instance) {
  const pinned = (instance._globalDrawer?.isOpen() ?? false)
    || (instance._nodeDrawer?.isOpen() ?? false);
  instance.root?.classList.toggle('fg-chrome-pinned', pinned);
}

export function setChromePinned(instance, pinned) {
  instance.root?.classList.toggle('fg-chrome-pinned', pinned);
}
