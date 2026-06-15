import { hydrateIcons, iconMarkup } from './icons.js';

function onEsc(instance, e) {
  if (e.key === 'Escape') closeFullscreen(instance);
}

export function openFullscreen(instance) {
  if (instance._fullscreenOpen) return;
  const { container, root } = instance;

  const overlay = document.createElement('div');
  overlay.className = 'fg-fullscreen-overlay';

  const shell = document.createElement('div');
  shell.className = 'fg-fullscreen-shell';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'fg-btn fg-fullscreen-close';
  closeBtn.setAttribute('aria-label', 'Fechar tela cheia');
  closeBtn.innerHTML = iconMarkup('circle-x');
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeFullscreen(instance);
  });

  const placeholder = document.createElement('div');
  placeholder.className = 'fg-fullscreen-placeholder';
  placeholder.hidden = true;
  container.insertBefore(placeholder, root);

  shell.appendChild(closeBtn);
  shell.appendChild(root);
  overlay.appendChild(shell);
  document.body.appendChild(overlay);

  const prevHeight = root.style.height;
  const prevMinHeight = root.style.minHeight;
  root.style.height = '100%';
  root.style.minHeight = '0';
  root.classList.add('fg-fullscreen-root');
  document.body.classList.add('fg-fullscreen-active');

  instance._fullscreenOpen = true;
  instance._fullscreenState = { overlay, shell, placeholder, prevHeight, prevMinHeight };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeFullscreen(instance);
  });
  document.addEventListener('keydown', instance._fsEsc = (e) => onEsc(instance, e));

  if (instance._fullscreenBtn) {
    instance._fullscreenBtn.innerHTML = iconMarkup('minimize-2');
    hydrateIcons(instance._fullscreenBtn);
    instance._fullscreenBtn.setAttribute('aria-label', 'Fechar tela cheia');
  }

  requestAnimationFrame(() => instance.fit());
  hydrateIcons(closeBtn);
}

export function closeFullscreen(instance) {
  const state = instance._fullscreenState;
  if (!state) return;

  const { overlay, placeholder, prevHeight, prevMinHeight } = state;
  const { root, container } = instance;

  container.insertBefore(root, placeholder);
  placeholder.remove();
  overlay.remove();

  root.style.height = prevHeight;
  root.style.minHeight = prevMinHeight;
  root.classList.remove('fg-fullscreen-root');
  document.body.classList.remove('fg-fullscreen-active');

  if (instance._fsEsc) {
    document.removeEventListener('keydown', instance._fsEsc);
    instance._fsEsc = null;
  }

  instance._fullscreenOpen = false;
  instance._fullscreenState = null;

  if (instance._fullscreenBtn) {
    instance._fullscreenBtn.innerHTML = iconMarkup('maximize-2');
    hydrateIcons(instance._fullscreenBtn);
    instance._fullscreenBtn.setAttribute('aria-label', 'Expandir diagrama');
  }

  requestAnimationFrame(() => instance.fit());
}

export function toggleFullscreen(instance) {
  if (instance._fullscreenOpen) closeFullscreen(instance);
  else openFullscreen(instance);
}
