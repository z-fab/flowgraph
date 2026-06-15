import { mountTrackSelect } from './track-select.js';
import { buildNarrationItems } from './narration-drawer.js';
import { hydrateIcons, iconMarkup } from './icons.js';

function attachDrag(panel, handle) {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let origX = 0;
  let origY = 0;

  handle.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, select, label')) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = panel.getBoundingClientRect();
    const parent = panel.offsetParent?.getBoundingClientRect() || { left: 0, top: 0 };
    origX = rect.left - parent.left;
    origY = rect.top - parent.top;
    handle.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  handle.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    panel.style.left = `${origX + dx}px`;
    panel.style.top = `${origY + dy}px`;
    panel.style.right = 'auto';
  });

  handle.addEventListener('pointerup', () => { dragging = false; });
  handle.addEventListener('pointercancel', () => { dragging = false; });
}

/** Floating scenario panel: script + step controls (narrative / step modes). */
export function mountScenarioPanel(root, instance, config) {
  const narr = config.scenario?.narration || {};
  if (!narr.showOnCanvas) return null;

  const panel = document.createElement('aside');
  panel.className = 'fg-scenario-panel';
  panel.setAttribute('aria-label', 'Painel do cenário');
  panel.hidden = true;
  panel.style.top = '12px';
  panel.style.right = '12px';

  const header = document.createElement('div');
  header.className = 'fg-scenario-panel-header';
  header.innerHTML = `
    <span class="fg-scenario-panel-grip" aria-hidden="true">${iconMarkup('grip-horizontal')}</span>
    <div class="fg-scenario-panel-heading">
      <div class="fg-scenario-panel-title"></div>
      <div class="fg-scenario-panel-sub">Roteiro</div>
    </div>
  `;

  const list = document.createElement('div');
  list.className = 'fg-scenario-panel-list';
  list.setAttribute('role', 'list');

  const footer = document.createElement('div');
  footer.className = 'fg-scenario-panel-footer';

  const trackWrap = document.createElement('div');
  trackWrap.className = 'fg-scenario-panel-tracks';

  let trackSelect = mountTrackSelect(trackWrap, instance, {
    onSelect: (id) => instance.setActiveTrack(id),
  });

  const nav = document.createElement('div');
  nav.className = 'fg-scenario-panel-nav';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'fg-scenario-nav-btn';
  prevBtn.innerHTML = `${iconMarkup('chevron-left')} Voltar`;
  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); instance.stepPrev(); });

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'fg-scenario-nav-btn fg-scenario-nav-next';
  nextBtn.innerHTML = `Próximo ${iconMarkup('chevron-right')}`;
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); instance.stepNext(); });

  nav.appendChild(prevBtn);
  nav.appendChild(nextBtn);
  footer.appendChild(trackWrap);
  footer.appendChild(nav);

  panel.appendChild(header);
  panel.appendChild(list);
  panel.appendChild(footer);
  root.appendChild(panel);

  const titleEl = header.querySelector('.fg-scenario-panel-title');
  titleEl.textContent = config.title || 'Cenário';

  attachDrag(panel, header);
  hydrateIcons(panel);

  const state = { items: [], activeIndex: -1, rowEls: [] };

  function renderRows() {
    list.innerHTML = '';
    state.rowEls = state.items.map((item, i) => {
      const row = document.createElement('div');
      row.className = 'fg-scenario-panel-item';
      row.setAttribute('role', 'listitem');

      const title = document.createElement('div');
      title.className = 'fg-scenario-panel-item-title';
      title.textContent = item.title;

      const desc = document.createElement('div');
      desc.className = 'fg-scenario-panel-item-desc';
      desc.textContent = item.description;

      row.appendChild(title);
      if (item.description) row.appendChild(desc);
      list.appendChild(row);
      return row;
    });
    applyStates();
  }

  function applyStates() {
    state.rowEls.forEach((row, i) => {
      row.classList.remove('fg-scenario-panel-item--past', 'fg-scenario-panel-item--active', 'fg-scenario-panel-item--future');
      if (state.activeIndex < 0) row.classList.add('fg-scenario-panel-item--future');
      else if (i < state.activeIndex) row.classList.add('fg-scenario-panel-item--past');
      else if (i === state.activeIndex) row.classList.add('fg-scenario-panel-item--active');
      else row.classList.add('fg-scenario-panel-item--future');
    });
    const activeRow = state.rowEls[state.activeIndex];
    if (activeRow) activeRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  const api = {
    el: panel,
    footer,
    prevBtn,
    nextBtn,
    trackWrap,
    trackSelect,
    setTrackSteps(steps) {
      state.items = buildNarrationItems(steps);
      state.activeIndex = -1;
      renderRows();
    },
    setActiveIndex(index) {
      if (!state.items.length) return;
      state.activeIndex = Math.max(-1, Math.min(index, state.items.length - 1));
      applyStates();
    },
    reset() {
      state.activeIndex = -1;
      applyStates();
    },
    show(visible, { stepMode = false } = {}) {
      panel.hidden = !visible;
      root.classList.toggle('fg-scenario-panel-open', !!visible && stepMode);
      footer.hidden = !stepMode;
      const chromeTitle = root.querySelector('.fg-chrome-header');
      if (chromeTitle) chromeTitle.hidden = !!visible && stepMode;
    },
    setTracks() {
      trackSelect.sync();
    },
    updateNav({ prevDisabled, nextDisabled, busy }) {
      prevBtn.disabled = !!prevDisabled;
      nextBtn.disabled = !!nextDisabled;
      nextBtn.classList.toggle('fg-scenario-nav-busy', !!busy);
    },
    resolveIndex(step, meta) {
      if (meta?.parallelIndex != null && meta?.stepIndex != null) {
        const idx = state.items.findIndex(
          (it) => it.stepIndex === meta.stepIndex && it.subIndex === meta.parallelIndex,
        );
        if (idx >= 0) return idx;
      }
      if (meta?.stepIndex != null) {
        const idx = state.items.findIndex((it) => it.stepIndex === meta.stepIndex && it.subIndex === -1);
        if (idx >= 0) return idx;
      }
      if (step?.title) {
        const idx = state.items.findIndex((it) => it.title === step.title);
        if (idx >= 0) return idx;
      }
      return Math.min(state.activeIndex + 1, state.items.length - 1);
    },
  };

  return api;
}

export function updateScenarioPanel(instance) {
  const panel = instance._scenarioPanel;
  if (!panel) return;
  const player = instance.player;
  const active = player.activePlayer();
  const remaining = Math.max(0, active.steps.length - active.stepIndex);
  const animating = !!instance._stepping;

  panel.updateNav({
    prevDisabled: animating || active.stepIndex <= 1,
    nextDisabled: animating || (remaining <= 0 && !instance.config.scenario.loop),
    busy: animating,
  });

  panel.setTracks();
}
