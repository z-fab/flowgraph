/** Compact track picker (select) for narrative / step modes. */

export function mountTrackSelect(container, instance, { onSelect } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'fg-track-select-wrap';

  const label = document.createElement('label');
  label.className = 'fg-track-select-label';
  label.textContent = 'Cenário';

  const sel = document.createElement('select');
  sel.className = 'fg-track-select';
  sel.setAttribute('aria-label', 'Selecionar cenário');

  label.appendChild(sel);
  wrap.appendChild(label);

  sel.addEventListener('change', (e) => {
    e.stopPropagation();
    onSelect?.(sel.value);
  });

  container.appendChild(wrap);

  function sync() {
    const tracks = instance.player?.tracks || [];
    const activeId = instance.player?.activeTrackId;
    const prev = sel.value;
    sel.innerHTML = '';
    tracks.forEach((t) => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.label;
      sel.appendChild(opt);
    });
    if (tracks.length < 2) {
      wrap.hidden = true;
      return;
    }
    wrap.hidden = false;
    sel.value = tracks.some((t) => t.id === prev) ? prev : activeId;
  }

  return { wrap, sel, sync };
}
