import { hydrateIcons, iconMarkup } from './icons.js';

/** Block canvas pan/zoom from stealing pointer events on overlay UI. */
function blockCanvasPointer(el) {
  el.addEventListener('mousedown', (e) => e.stopPropagation());
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
}

export function createDrawer(root, options = {}) {
  const {
    id,
    side = 'right',
    width = 300,
    title = '',
    tabs = [],
    onClose,
    onOpen,
  } = options;

  const backdrop = document.createElement('div');
  backdrop.className = 'fg-drawer-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');

  const drawer = document.createElement('aside');
  drawer.className = `fg-drawer fg-drawer-${side}`;
  drawer.style.setProperty('--fg-drawer-width', `${width}px`);
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-hidden', 'true');
  if (id) drawer.id = id;

  const header = document.createElement('div');
  header.className = 'fg-drawer-header';

  const titleEl = document.createElement('h3');
  titleEl.className = 'fg-drawer-title';
  titleEl.textContent = title;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'fg-btn fg-btn-ghost fg-drawer-close';
  closeBtn.setAttribute('aria-label', 'Fechar painel');
  closeBtn.innerHTML = iconMarkup('x');

  header.appendChild(titleEl);
  header.appendChild(closeBtn);

  const tabBar = document.createElement('div');
  tabBar.className = 'fg-drawer-tabs';
  tabBar.setAttribute('role', 'tablist');

  const bodies = {};
  tabs.forEach((tab, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fg-drawer-tab';
    btn.setAttribute('role', 'tab');
    btn.dataset.tab = tab.id;
    btn.textContent = tab.label;
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    tabBar.appendChild(btn);

    const panel = document.createElement('div');
    panel.className = 'fg-drawer-panel';
    panel.dataset.tab = tab.id;
    panel.setAttribute('role', 'tabpanel');
    panel.hidden = i !== 0;
    bodies[tab.id] = panel;
  });

  const bodyWrap = document.createElement('div');
  bodyWrap.className = 'fg-drawer-body';
  Object.values(bodies).forEach((p) => bodyWrap.appendChild(p));

  drawer.appendChild(header);
  if (tabs.length > 1) drawer.appendChild(tabBar);
  drawer.appendChild(bodyWrap);

  root.appendChild(backdrop);
  root.appendChild(drawer);

  blockCanvasPointer(drawer);
  blockCanvasPointer(backdrop);

  let activeTab = tabs[0]?.id || null;
  let openState = false;

  function setTab(tabId) {
    activeTab = tabId;
    tabBar.querySelectorAll('.fg-drawer-tab').forEach((b) => {
      const on = b.dataset.tab === tabId;
      b.classList.toggle('fg-drawer-tab-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    Object.entries(bodies).forEach(([tid, panel]) => {
      panel.hidden = tid !== tabId;
    });
  }

  tabBar.querySelectorAll('.fg-drawer-tab').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setTab(btn.dataset.tab);
    });
  });
  if (tabs[0]) {
    tabBar.querySelector('.fg-drawer-tab')?.classList.add('fg-drawer-tab-active');
  }

  function open() {
    if (openState) return;
    openState = true;
    backdrop.setAttribute('aria-hidden', 'false');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.classList.add('fg-drawer-open');
    drawer.classList.add('fg-drawer-open');
    hydrateIcons(drawer);
    if (onOpen) onOpen();
  }

  function close() {
    if (!openState) return;
    openState = false;
    backdrop.classList.remove('fg-drawer-open');
    drawer.classList.remove('fg-drawer-open');
    backdrop.setAttribute('aria-hidden', 'true');
    drawer.setAttribute('aria-hidden', 'true');
    if (onClose) onClose();
  }

  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    close();
  });

  backdrop.addEventListener('click', (e) => {
    if (e.target !== backdrop) return;
    e.stopPropagation();
    close();
  });

  return {
    el: drawer,
    backdrop,
    open,
    close,
    setTitle(text) { titleEl.textContent = text; },
    setTab,
    getActiveTab: () => activeTab,
    panel(tabId) { return bodies[tabId]; },
    isOpen: () => openState,
  };
}
