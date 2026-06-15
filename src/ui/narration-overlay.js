import { mountTrackSelect } from './track-select.js';

export function mountNarrationOverlay(root, config, instance) {
  const narr = config.scenario?.narration || {};
  const el = document.createElement('div');
  el.className = `fg-narration fg-narration-${narr.position || 'top-left'}`;
  el.hidden = true;

  const titleEl = document.createElement('div');
  titleEl.className = 'fg-narration-title';

  const descEl = document.createElement('div');
  descEl.className = 'fg-narration-desc';

  const trackSlot = document.createElement('div');
  trackSlot.className = 'fg-narration-track-slot';

  el.appendChild(titleEl);
  el.appendChild(descEl);
  el.appendChild(trackSlot);
  root.appendChild(el);

  if (narr.maxWidth) el.style.maxWidth = `${narr.maxWidth}px`;

  let trackSelect = null;
  if (instance) {
    trackSelect = mountTrackSelect(trackSlot, instance, {
      onSelect: (id) => instance.setActiveTrack(id),
    });
    trackSlot.hidden = true;
  }

  return {
    el,
    trackSelect,
    set(title, description) {
      titleEl.textContent = title || '';
      descEl.textContent = description || '';
      const hasText = !!(title || description);
      const hasTracks = trackSelect && !trackSelect.wrap.hidden;
      el.hidden = !hasText && !hasTracks;
    },
    show(v) {
      if (!v) {
        el.hidden = true;
        return;
      }
      const hasText = !!(titleEl.textContent || descEl.textContent);
      const hasTracks = trackSelect && !trackSelect.wrap.hidden;
      el.hidden = !hasText && !hasTracks;
    },
    setTrackPickerVisible(visible) {
      if (!trackSelect) return;
      trackSlot.hidden = !visible;
      trackSelect.sync();
      const hasText = !!(titleEl.textContent || descEl.textContent);
      el.hidden = !visible && !hasText;
    },
    syncTracks() {
      trackSelect?.sync();
    },
  };
}
