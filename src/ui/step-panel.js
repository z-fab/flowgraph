import { hydrateIcons, iconMarkup } from './icons.js';
import { nodeLabel } from '../scenario-labels.js';

const CORNERS = ['br', 'bl', 'tr', 'tl'];

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function clearCornerClasses(panel) {
  CORNERS.forEach((c) => panel.classList.remove(`fg-step-dock-${c}`));
}

function snapToCorner(panel, root) {
  const pr = panel.getBoundingClientRect();
  const rr = root.getBoundingClientRect();
  const cx = pr.left + pr.width / 2 - rr.left;
  const cy = pr.top + pr.height / 2 - rr.top;
  const corner = `${cy < rr.height / 2 ? 't' : 'b'}${cx < rr.width / 2 ? 'l' : 'r'}`;
  panel.style.left = '';
  panel.style.top = '';
  panel.style.right = '';
  panel.style.bottom = '';
  clearCornerClasses(panel);
  panel.classList.add(`fg-step-dock-${corner}`);
}

function attachDrag(panel, root, handle) {
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  handle.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('button')) return;
    dragging = true;
    handle.setPointerCapture(e.pointerId);
    const pr = panel.getBoundingClientRect();
    const rr = root.getBoundingClientRect();
    clearCornerClasses(panel);
    panel.style.left = `${pr.left - rr.left}px`;
    panel.style.top = `${pr.top - rr.top}px`;
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    offsetX = e.clientX - pr.left;
    offsetY = e.clientY - pr.top;
    e.preventDefault();
  });

  handle.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rr = root.getBoundingClientRect();
    const maxLeft = Math.max(8, rr.width - panel.offsetWidth - 8);
    const maxTop = Math.max(8, rr.height - panel.offsetHeight - 8);
    panel.style.left = `${Math.min(maxLeft, Math.max(8, e.clientX - rr.left - offsetX))}px`;
    panel.style.top = `${Math.min(maxTop, Math.max(8, e.clientY - rr.top - offsetY))}px`;
  });

  const finish = (e) => {
    if (!dragging) return;
    dragging = false;
    if (handle.hasPointerCapture?.(e.pointerId)) handle.releasePointerCapture(e.pointerId);
    snapToCorner(panel, root);
  };
  handle.addEventListener('pointerup', finish);
  handle.addEventListener('pointercancel', finish);
}

export function mountStepPanel(root, instance, config) {
  const ctrls = config.controls || {};
  if (!root || ctrls.stepLog === false) return null;

  const panel = document.createElement('div');
  panel.className = 'fg-step-panel fg-step-dock-br';
  panel.hidden = true;

  const header = document.createElement('div');
  header.className = 'fg-step-header';
  header.innerHTML = `<span class="fg-step-grip">${iconMarkup('grip-horizontal')}</span><span class="fg-step-header-title">Passo a passo</span>`;
  const exitBtn = document.createElement('button');
  exitBtn.type = 'button';
  exitBtn.className = 'fg-btn fg-btn-ghost fg-step-exit';
  exitBtn.setAttribute('aria-label', 'Sair do modo passo a passo');
  exitBtn.innerHTML = iconMarkup('x');
  exitBtn.addEventListener('click', (e) => { e.stopPropagation(); instance.disableStepMode(); });
  header.appendChild(exitBtn);
  header.setAttribute('title', 'Arraste para reposicionar');

  const story = document.createElement('div');
  story.className = 'fg-step-story';

  const cta = document.createElement('button');
  cta.type = 'button';
  cta.className = 'fg-step-cta';
  cta.innerHTML = '<span class="fg-step-cta-label">Próximo passo</span><span class="fg-step-cta-peek"></span>';
  cta.addEventListener('click', (e) => { e.stopPropagation(); instance.stepNext(); });

  const meta = document.createElement('div');
  meta.className = 'fg-step-meta';
  meta.innerHTML = '<span class="fg-step-queue-badge">0</span><span class="fg-step-hint"></span>';

  const logToggle = document.createElement('button');
  logToggle.type = 'button';
  logToggle.className = 'fg-step-log-toggle';
  logToggle.textContent = 'Histórico';

  const list = document.createElement('ol');
  list.className = 'fg-step-log';

  panel.append(header, story, cta, meta, logToggle, list);
  root.appendChild(panel);
  attachDrag(panel, root, header);

  const queueBadge = meta.querySelector('.fg-step-queue-badge');
  const hintEl = meta.querySelector('.fg-step-hint');
  const peekEl = cta.querySelector('.fg-step-cta-peek');

  let logOpen = false;
  const setLogOpen = (v) => {
    logOpen = v;
    panel.classList.toggle('fg-step-log-open', logOpen);
    logToggle.textContent = logOpen ? 'Ocultar histórico' : 'Histórico';
  };
  logToggle.addEventListener('click', (e) => { e.stopPropagation(); setLogOpen(!logOpen); });

  const renderLog = (log) => {
    list.innerHTML = '';
    if (!log?.length) {
      const empty = document.createElement('li');
      empty.className = 'fg-step-log-empty';
      empty.textContent = 'Passos executados aparecem aqui.';
      list.appendChild(empty);
      return;
    }
    log.slice(0, 25).forEach((entry) => {
      const li = document.createElement('li');
      li.className = 'fg-step-log-item';
      li.innerHTML = `<span class="fg-step-log-type">${entry.kind || ''}</span><span class="fg-step-log-label">${entry.title || ''}</span><span class="fg-step-log-meta">${formatTime(entry.at)}</span>`;
      list.appendChild(li);
    });
  };

  instance._stepPanel = {
    cta,
    setLogOpen,
    renderLog,
    setQueue(n) { queueBadge.textContent = String(n); },
    setPeek(t) { if (peekEl) peekEl.textContent = t || ''; },
    setHint(t) { if (hintEl) hintEl.textContent = t || ''; },
    setStory(t) { story.textContent = t || ''; },
    show() { panel.hidden = false; instance.root?.classList.add('fg-step-mode'); },
    hide() { panel.hidden = true; setLogOpen(false); instance.root?.classList.remove('fg-step-mode'); },
  };

  hydrateIcons(panel);
  return instance._stepPanel;
}

export function updateStepPanel(instance) {
  const p = instance._stepPanel;
  const player = instance.player;
  if (!p || !player) return;

  const total = player.steps.length;
  const remaining = Math.max(0, total - player.stepIndex);
  const peek = player.peek();
  const animating = !!instance._stepping;
  const atLabel = instance._atNodeId ? nodeLabel(instance.config, instance._atNodeId) : null;

  p.setQueue(remaining);
  p.setStory(animating ? 'Pacote em trânsito…' : atLabel ? `Token em ${atLabel}` : `Passo ${player.stepIndex + 1} de ${total}`);
  p.setPeek(peek?.title || peek?.description || (remaining > 0 ? 'Próximo passo do roteiro' : 'Fim do ciclo'));
  p.setHint(animating ? 'Acompanhe a aresta destacada' : `${remaining} passo${remaining === 1 ? '' : 's'} restante${remaining === 1 ? '' : 's'}`);
  p.renderLog(player.log);
  if (p.cta) {
    p.cta.disabled = !instance.stepMode || animating;
    p.cta.classList.toggle('fg-step-cta-ready', instance.stepMode && remaining > 0 && !animating);
    p.cta.classList.toggle('fg-step-cta-busy', animating);
  }
}
