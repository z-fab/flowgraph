/** Visual scenario player — single track runner. */

const STEP_KINDS = ['travel', 'dwell', 'parallel', 'setPill', 'setEffect', 'wait', 'focus', 'narrate'];

export function parseStep(raw, index) {
  if (!raw || typeof raw !== 'object') throw new Error(`FlowGraph: invalid step at index ${index}`);
  const kind = STEP_KINDS.find((k) => raw[k] != null);
  if (!kind) throw new Error(`FlowGraph: unknown step at index ${index}`);
  const data = raw[kind];
  if (kind === 'parallel') {
    if (!Array.isArray(data)) throw new Error(`FlowGraph: parallel step at ${index} must be an array`);
    return {
      kind,
      parallel: data.map((s, i) => parseStep(s, index * 100 + i)),
      title: raw.title || null,
      description: raw.description || null,
    };
  }
  return {
    kind,
    ...data,
    title: data.title || raw.title || null,
    description: data.description || raw.description || null,
  };
}

function normalizeTrack(raw, index, defaults) {
  const steps = raw.steps?.map((s, i) => parseStep(s, i));
  if (!steps?.length) throw new Error(`FlowGraph: track "${raw.id || index}" needs steps`);
  return {
    id: raw.id || `track-${index}`,
    label: raw.label || raw.id || `Track ${index + 1}`,
    steps,
    loop: raw.loop ?? defaults.loop,
    playInterval: raw.playInterval ?? defaults.playInterval,
    offset: raw.offset ?? 0,
  };
}

export function normalizeScenario(raw) {
  const defaults = {
    loop: raw.loop !== false,
    playInterval: raw.playInterval ?? 400,
    defaultMode: raw.defaultMode || 'play',
    speed: raw.speed ?? 1,
    tracksPresentation: raw.tracksPresentation || 'parallel',
    narration: {
      showOnCanvas: raw.narration?.showOnCanvas === true,
      position: raw.narration?.position || 'top-left',
      maxWidth: raw.narration?.maxWidth ?? 320,
    },
  };

  let tracks;
  if (raw.tracks?.length) {
    tracks = raw.tracks.map((t, i) => normalizeTrack(t, i, defaults));
  } else if (raw.steps?.length) {
    tracks = [normalizeTrack({ id: 'main', label: 'Principal', steps: raw.steps }, 0, defaults)];
  } else {
    throw new Error('FlowGraph: scenario.steps or scenario.tracks is required');
  }

  return { ...defaults, tracks, steps: tracks[0].steps };
}

export class FlowPlayer {
  constructor(track, scenario, hooks = {}) {
    this.track = track;
    this.scenario = scenario;
    this.hooks = hooks;
    this.stepIndex = 0;
    this.playing = false;
    this._playTimer = null;
    this.atNodeId = null;
    this.speed = 1;
  }

  get trackId() {
    return this.track.id;
  }

  get steps() {
    return this.track.steps;
  }

  peek() {
    return this.steps[this.stepIndex] || null;
  }

  reset() {
    this.stepIndex = 0;
    this.atNodeId = null;
    this.stopPlay();
  }

  stopPlay() {
    this.playing = false;
    if (this._playTimer) clearTimeout(this._playTimer);
    this._playTimer = null;
  }

  startPlay(delayMs = 0) {
    if (this.playing) return;
    this.playing = true;
    this._playTimer = setTimeout(() => this._scheduleNextPlay(), this._scaled(delayMs));
  }

  _scaled(ms) {
    return Math.max(0, ms / (this.speed || 1));
  }

  _scheduleNextPlay() {
    if (!this.playing) return;
    this.runNext(false).then((step) => {
      if (!this.playing) return;
      if (!step) {
        const canLoop = this.track.loop && !this._forceNoLoop;
        if (canLoop) {
          this.stepIndex = 0;
          this._playTimer = setTimeout(
            () => this._scheduleNextPlay(),
            this._scaled(this.track.playInterval),
          );
        } else {
          this.playing = false;
          this.hooks.onTrackEnd?.(this.trackId);
        }
        return;
      }
      const extra = step.kind === 'wait' ? (step.ms || 0) : this.track.playInterval;
      this._playTimer = setTimeout(() => this._scheduleNextPlay(), this._scaled(extra));
    });
  }

  async runNext(manual = false) {
    if (this.stepIndex >= this.steps.length) {
      const canLoop = this.track.loop && !this._forceNoLoop && !manual;
      if (canLoop) {
        this.stepIndex = 0;
      } else {
        if (!manual) this.hooks.onTrackEnd?.(this.trackId);
        return null;
      }
    }
    const step = this.steps[this.stepIndex];
    this.stepIndex += 1;
    await this._execute(step, manual);
    this.hooks.onStep?.(step, this.trackId);
    return step;
  }

  async runPrev() {
    if (this.stepIndex <= 1) return null;
    this.stepIndex -= 2;
    return this.runNext(true);
  }

  async _execute(step, manual) {
    const stepIndex = this.stepIndex - 1;
    if (step.kind !== 'parallel') {
      this.hooks.onStepStart?.(step, manual, this.trackId, { stepIndex, subIndex: -1 });
    }
    await this._executeCore(step, manual);
    if (step.kind !== 'parallel') {
      this._emitNarration(step);
      this.hooks.onStep?.(step, this.trackId);
    }
  }

  _emitNarration(step) {
    if (!this.hooks.shouldNarrate?.()) return;
    if (!step.title && !step.description) return;
    this.hooks.onNarration?.(step.title, step.description, this.trackId);
  }

  async _executeCore(step, manual) {
    switch (step.kind) {
      case 'travel':
        await this.hooks.travel?.(step, manual, this.trackId);
        break;
      case 'dwell':
        await this.hooks.dwell?.(step, manual, this.trackId);
        break;
      case 'parallel':
        await this._executeParallel(step, manual);
        break;
      case 'setPill':
        this.hooks.setPill?.(step, this.trackId);
        break;
      case 'setEffect':
        this.hooks.setEffect?.(step, this.trackId);
        break;
      case 'wait':
        if (!manual && step.ms > 0) await this._sleep(step.ms);
        break;
      case 'focus':
        this.hooks.focus?.(step, this.trackId);
        break;
      case 'narrate':
        if (!manual && step.ms > 0 && !this.hooks.shouldSkipNarratePause?.()) {
          await this._sleep(step.ms);
        }
        break;
      default:
        break;
    }
  }

  async _executeParallel(step, manual) {
    const items = step.parallel;
    const sequential = this.hooks.shouldSequentialParallel?.();
    const stepIndex = this.stepIndex - 1;

    if (sequential) {
      for (let i = 0; i < items.length; i++) {
        const sub = items[i];
        if (sub.delay) await this._sleep(sub.delay);
        this.hooks.onStepStart?.(sub, manual, this.trackId, {
          stepIndex,
          subIndex: i,
          parallel: true,
        });
        await this._executeCore(sub, manual);
        this._emitNarration(sub);
        this.hooks.onStep?.(sub, this.trackId);
        if (!manual && i < items.length - 1) await this._sleep(220);
      }
      return;
    }

    await Promise.all(items.map(async (sub) => {
      const delay = sub.delay || 0;
      await this._sleep(delay);
      return this._execute(sub, manual);
    }));
  }

  _sleep(ms) {
    return new Promise((r) => setTimeout(r, this._scaled(ms)));
  }
}

/** Orchestrates multiple scenario tracks. */
export class MultiTrackPlayer {
  constructor(config, hooks) {
    this.config = config;
    this.scenario = config.scenario;
    this.hooks = {
      ...hooks,
      onTrackEnd: (trackId) => {
        if (this._narrativeSequential) this._advanceNarrativeTrack();
        hooks.onTrackEnd?.(trackId);
      },
    };
    this.players = this.scenario.tracks.map(
      (track) => new FlowPlayer(track, this.scenario, this.hooks),
    );
    this.activeTrackId = this.players[0]?.trackId || 'main';
    this.narrativeTrackIndex = 0;
    this.speed = this.scenario.speed || 1;
    this._narrativePlaying = false;
  }

  get tracks() {
    return this.scenario.tracks;
  }

  player(id) {
    return this.players.find((p) => p.trackId === id);
  }

  activePlayer() {
    return this.player(this.activeTrackId) || this.players[0];
  }

  setSpeed(s) {
    this.speed = s;
    this.players.forEach((p) => { p.speed = s; });
  }

  reset() {
    this.players.forEach((p) => p.reset());
    this.narrativeTrackIndex = 0;
    this._narrativeSequential = false;
    this.hooks.onReset?.();
  }

  stopAll() {
    this.players.forEach((p) => p.stopPlay());
    this._narrativeSequential = false;
  }

  startParallel() {
    this.stopAll();
    this.players.forEach((p) => {
      p.speed = this.speed;
      p.startPlay(p.track.offset || 0);
    });
  }

  startNarrativeSequential() {
    this.stopAll();
    this._narrativeSequential = true;
    this._narrativeTrackIndex = 0;
    this._startNarrativeTrack(0);
  }

  _startNarrativeTrack(index) {
    const p = this.players[index];
    if (!p) {
      if (this.scenario.loop) {
        this._startNarrativeTrack(0);
      } else {
        this._narrativeSequential = false;
      }
      return;
    }
    this.narrativeTrackIndex = index;
    this.activeTrackId = p.trackId;
    p.reset();
    p._forceNoLoop = true;
    p.speed = this.speed;
    p.startPlay(p.track.offset || 0);
  }

  _advanceNarrativeTrack() {
    if (!this._narrativeSequential) return;
    this._startNarrativeTrack(this.narrativeTrackIndex + 1);
  }

  async stepNext() {
    return this.activePlayer().runNext(true);
  }

  async stepPrev() {
    return this.activePlayer().runPrev();
  }
}
