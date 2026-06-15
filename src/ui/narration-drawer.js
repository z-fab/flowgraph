/** Side drawer listing scenario steps for narrative / step modes. */

function formatKind(kind) {
  const map = {
    travel: 'Deslocamento',
    dwell: 'Processamento',
    setPill: 'Estado',
    setEffect: 'Efeito',
    narrate: 'Narração',
    focus: 'Foco',
  };
  return map[kind] || kind;
}

export function buildNarrationItems(steps) {
  const items = [];
  if (!steps) return items;

  steps.forEach((step, stepIndex) => {
    if (step.kind === 'parallel') {
      step.parallel.forEach((sub, subIndex) => {
        if (sub.kind === 'wait') return;
        items.push({
          key: `${stepIndex}:${subIndex}`,
          stepIndex,
          subIndex,
          title: sub.title || formatKind(sub.kind),
          description: sub.description || '',
        });
      });
      return;
    }
    if (step.kind === 'wait') return;
    items.push({
      key: String(stepIndex),
      stepIndex,
      subIndex: -1,
      title: step.title || formatKind(step.kind),
      description: step.description || '',
    });
  });
  return items;
}

export function mountNarrationDrawer(root, config) {
  const narr = config.scenario?.narration || {};
  if (!narr.showOnCanvas) return null;

  const side = narr.drawerSide || 'right';
  const el = document.createElement('aside');
  el.className = `fg-narration-drawer fg-narration-drawer-${side}`;
  el.setAttribute('aria-label', 'Roteiro da animação');
  el.hidden = true;

  const header = document.createElement('div');
  header.className = 'fg-narration-drawer-header';
  header.textContent = narr.drawerTitle || 'Roteiro';

  const list = document.createElement('div');
  list.className = 'fg-narration-drawer-list';
  list.setAttribute('role', 'list');

  el.appendChild(header);
  el.appendChild(list);
  root.appendChild(el);

  const state = {
    items: [],
    activeIndex: -1,
    rowEls: [],
  };

  function renderRows() {
    list.innerHTML = '';
    state.rowEls = state.items.map((item, i) => {
      const row = document.createElement('div');
      row.className = 'fg-narration-drawer-item';
      row.setAttribute('role', 'listitem');
      row.dataset.index = String(i);

      const title = document.createElement('div');
      title.className = 'fg-narration-drawer-item-title';
      title.textContent = item.title;

      const desc = document.createElement('div');
      desc.className = 'fg-narration-drawer-item-desc';
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
      row.classList.remove(
        'fg-narration-drawer-item--past',
        'fg-narration-drawer-item--active',
        'fg-narration-drawer-item--future',
      );
      if (state.activeIndex < 0) {
        row.classList.add('fg-narration-drawer-item--future');
      } else if (i < state.activeIndex) {
        row.classList.add('fg-narration-drawer-item--past');
      } else if (i === state.activeIndex) {
        row.classList.add('fg-narration-drawer-item--active');
      } else {
        row.classList.add('fg-narration-drawer-item--future');
      }
    });

    const activeRow = state.rowEls[state.activeIndex];
    if (activeRow) {
      activeRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  return {
    el,
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
    advance() {
      if (!state.items.length) return;
      state.activeIndex = Math.min(state.activeIndex + 1, state.items.length - 1);
      applyStates();
    },
    reset() {
      state.activeIndex = -1;
      applyStates();
    },
    show(visible) {
      el.hidden = !visible;
      root.classList.toggle('fg-narration-drawer-open', !!visible);
    },
    resolveIndex(step, meta) {
      if (meta?.parallelIndex != null && meta?.stepIndex != null) {
        const idx = state.items.findIndex(
          (it) => it.stepIndex === meta.stepIndex && it.subIndex === meta.parallelIndex,
        );
        if (idx >= 0) return idx;
      }
      if (meta?.stepIndex != null) {
        const idx = state.items.findIndex(
          (it) => it.stepIndex === meta.stepIndex && it.subIndex === -1,
        );
        if (idx >= 0) return idx;
      }
      const title = step?.title;
      if (title) {
        const idx = state.items.findIndex((it) => it.title === title);
        if (idx >= 0) return idx;
      }
      return Math.min(state.activeIndex + 1, state.items.length - 1);
    },
  };
}
