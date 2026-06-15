import { hydrateIcons, iconMarkup } from './icons.js';
import { updateModeButtons, mountModeControls } from './step-controls.js';
import { toggleFullscreen } from './fullscreen.js';

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
    || ctrls.step !== false
    || ctrls.fullscreen !== false
    || ctrls.zoomReset !== false
    || ctrls.reset !== false
    || ctrls.layout
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

  const modeWrap = document.createElement('div');
  modeWrap.className = 'fg-controls-group fg-controls-group-mode';
  cluster.appendChild(modeWrap);
  mountModeControls(modeWrap, instance, config);

  const transportWrap = document.createElement('div');
  transportWrap.className = 'fg-controls-group fg-controls-group-transport';

  const viewWrap = document.createElement('div');
  viewWrap.className = 'fg-controls-group fg-controls-group-view';

  if (ctrls.playPause !== false) {
    const playBtn = makeBtn('fg-btn', 'Play ou pausar animação', 'pause');
    playBtn.setAttribute('aria-pressed', 'true');
    playBtn.dataset.iconPlay = 'play';
    playBtn.dataset.iconPause = 'pause';
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (instance.running) instance.pause();
      else instance.start();
    });
    transportWrap.appendChild(playBtn);
    instance._playBtn = playBtn;
  }

  if (ctrls.reset !== false) {
    const resetBtn = makeBtn('fg-btn', 'Reiniciar animação', 'rotate-ccw');
    resetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      instance.reset();
    });
    transportWrap.appendChild(resetBtn);
  }

  if (transportWrap.childElementCount) cluster.appendChild(transportWrap);

  if (ctrls.zoomReset !== false) {
    const fitBtn = makeBtn('fg-btn', 'Centralizar diagrama', 'crosshair');
    fitBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      instance.fit();
    });
    viewWrap.appendChild(fitBtn);
  }

  if (ctrls.fullscreen !== false) {
    const fsBtn = makeBtn('fg-btn', 'Expandir diagrama', 'maximize-2');
    fsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFullscreen(instance);
    });
    viewWrap.appendChild(fsBtn);
    instance._fullscreenBtn = fsBtn;
  }

  if (ctrls.layout) {
    const layoutBtn = makeBtn('fg-btn', 'Auto-layout', 'layout-grid');
    layoutBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      instance.applyAutoLayout?.();
    });
    viewWrap.appendChild(layoutBtn);
  }

  if (viewWrap.childElementCount) cluster.appendChild(viewWrap);

  bar.appendChild(cluster);

  const dock = document.createElement('div');
  dock.className = 'fg-chrome-dock';
  dock.appendChild(bar);
  chrome.appendChild(dock);
  root.appendChild(chrome);

  instance._chrome = chrome;
  instance._chromeDock = dock;
  hydrateIcons(chrome);
  updateModeButtons(instance);
  return chrome;
}

export function updatePlayButton(instance) {
  if (!instance._playBtn) return;
  const running = instance.running;
  const icon = running ? instance._playBtn.dataset.iconPause : instance._playBtn.dataset.iconPlay;
  instance._playBtn.innerHTML = iconMarkup(icon);
  hydrateIcons(instance._playBtn);
  instance._playBtn.setAttribute('aria-pressed', running ? 'true' : 'false');
  instance._playBtn.setAttribute('aria-label', running ? 'Pausar animação' : 'Iniciar animação');
}

export function syncChromePinned(instance) {
  instance.root?.classList.toggle('fg-chrome-pinned', instance.playbackMode === 'step');
}

export function setChromePinned(instance, pinned) {
  instance.root?.classList.toggle('fg-chrome-pinned', pinned);
}
