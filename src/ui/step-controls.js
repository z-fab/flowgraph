import { hydrateIcons, iconMarkup } from './icons.js';

const SPEEDS = [1, 1.5, 2, 3, 5];

export function updateModeButtons(instance) {
  const mode = instance.playbackMode || 'play';
  instance._modeBtns?.forEach((btn) => {
    const active = btn.dataset.mode === mode;
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.classList.toggle('fg-btn-mode-active', active);
  });
  if (instance._speedWrap) {
    instance._speedWrap.hidden = mode === 'narrative';
  }
}

export function mountModeControls(cluster, instance, config) {
  if (config.controls?.step === false) return;

  const wrap = document.createElement('div');
  wrap.className = 'fg-mode-switch';
  wrap.setAttribute('role', 'group');
  wrap.setAttribute('aria-label', 'Modo de reprodução');

  const modes = [
    { id: 'play', label: 'Animação contínua', icon: 'play' },
    { id: 'narrative', label: 'Modo narrativa', icon: 'book-open' },
    { id: 'step', label: 'Passo a passo', icon: 'footprints' },
  ];

  instance._modeBtns = [];
  modes.forEach((m) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fg-btn fg-btn-mode';
    btn.dataset.mode = m.id;
    btn.setAttribute('aria-label', m.label);
    btn.innerHTML = iconMarkup(m.icon);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (instance.playbackMode === m.id) return;
      instance.setPlaybackMode(m.id);
      if (m.id === 'step' && !instance.running) instance.start();
      if (m.id !== 'step' && instance.running && !instance.player.players.some((p) => p.playing)) {
        instance._startAutoPlayback();
      }
    });
    wrap.appendChild(btn);
    instance._modeBtns.push(btn);
  });

  cluster.appendChild(wrap);

  if (config.controls?.speed !== false) {
    const speedWrap = document.createElement('div');
    speedWrap.className = 'fg-speed-wrap';
    const sel = document.createElement('select');
    sel.className = 'fg-speed-select';
    sel.setAttribute('aria-label', 'Velocidade da animação');
    SPEEDS.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = String(s);
      opt.textContent = `${s}×`;
      sel.appendChild(opt);
    });
    sel.value = String(instance.playSpeed || 1);
    sel.addEventListener('change', (e) => {
      e.stopPropagation();
      instance.setPlaySpeed(parseFloat(sel.value, 10));
    });
    speedWrap.appendChild(sel);
    cluster.appendChild(speedWrap);
    instance._speedWrap = speedWrap;
    instance._speedSelect = sel;
  }

  hydrateIcons(wrap);
  updateModeButtons(instance);
}
