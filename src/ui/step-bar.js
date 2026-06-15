import { hydrateIcons, iconMarkup } from './icons.js';

export function mountStepBar(parent, instance, config) {
  if (config.controls?.step === false) return null;

  const bar = document.createElement('div');
  bar.className = 'fg-step-bar';
  bar.style.display = 'none';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Navegação passo a passo');

  const trackWrap = document.createElement('div');
  trackWrap.className = 'fg-step-bar-tracks';
  trackWrap.hidden = true;

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'fg-btn fg-step-prev';
  prevBtn.setAttribute('aria-label', 'Passo anterior');
  prevBtn.innerHTML = `${iconMarkup('chevron-left')}<span>Voltar</span>`;
  prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    instance.stepPrev();
  });

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'fg-btn fg-step-next fg-step-next-btn';
  nextBtn.setAttribute('aria-label', 'Próximo passo');
  nextBtn.innerHTML = `<span>Próximo</span>${iconMarkup('chevron-right')}`;
  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    instance.stepNext();
  });

  bar.appendChild(trackWrap);
  bar.appendChild(prevBtn);
  bar.appendChild(nextBtn);
  parent.appendChild(bar);

  instance._stepBar = {
    el: bar,
    trackWrap,
    prevBtn,
    nextBtn,
    show() { bar.style.display = 'flex'; },
    hide() { bar.style.display = 'none'; },
    setTracks(tracks, activeId, onSelect) {
      if (!tracks || tracks.length < 2) {
        trackWrap.hidden = true;
        trackWrap.innerHTML = '';
        return;
      }
      trackWrap.hidden = false;
      trackWrap.innerHTML = '';
      tracks.forEach((t) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'fg-step-track-btn';
        btn.textContent = t.label;
        btn.setAttribute('aria-pressed', t.id === activeId ? 'true' : 'false');
        if (t.id === activeId) btn.classList.add('fg-step-track-active');
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelect(t.id);
        });
        trackWrap.appendChild(btn);
      });
    },
  };
  hydrateIcons(bar);
  return instance._stepBar;
}

export function updateStepBar(instance) {
  const bar = instance._stepBar;
  if (!bar) return;
  const player = instance.player;
  const active = player.activePlayer();
  const remaining = Math.max(0, active.steps.length - active.stepIndex);
  const animating = !!instance._stepping;

  bar.prevBtn.disabled = animating || active.stepIndex <= 1;
  bar.nextBtn.disabled = animating || (remaining <= 0 && !instance.config.scenario.loop);
  bar.nextBtn.classList.toggle('fg-step-next-busy', animating);

  bar.setTracks(
    player.tracks,
    player.activeTrackId,
    (id) => instance.setActiveTrack(id),
  );
}
