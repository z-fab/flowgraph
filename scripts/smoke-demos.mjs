#!/usr/bin/env node
/** Smoke test: parse all v2 demo configs + run FlowPlayer through first steps. */
import { readFileSync, readdirSync } from 'fs';
import { parseConfig } from '../src/config.js';
import { FlowPlayer } from '../src/flow-player.js';

const CONFIG_DIR = './demos/configs';
const files = readdirSync(CONFIG_DIR).filter((f) => f.endsWith('.json'));

let failed = 0;

for (const file of files) {
  try {
    const cfg = parseConfig(JSON.parse(readFileSync(`${CONFIG_DIR}/${file}`, 'utf8')));
    if (!cfg.scenario?.tracks?.length && !cfg.scenario?.steps?.length) throw new Error('missing scenario steps');
    process.stdout.write(`✓ parse ${file}\n`);
  } catch (err) {
    failed += 1;
    console.error(`✗ parse ${file}:`, err.message);
  }
}

// Run first 3 steps of demo 29 without DOM
try {
  const cfg = parseConfig(JSON.parse(readFileSync(`${CONFIG_DIR}/29-async-job-polling.json`, 'utf8')));
  const scenario = cfg.scenario;
  const track = scenario.tracks[0];
  const player = new FlowPlayer(track, scenario, {
    shouldNarrate: () => false,
    onNarration: () => {},
    travel: async () => {},
    dwell: async () => {},
    setPill: () => {},
    setEffect: () => {},
    focus: () => {},
  });
  for (let i = 0; i < 3; i++) await player.runNext(true);
  if (player.stepIndex < 3) throw new Error('steps did not advance');
  process.stdout.write('✓ flow-player 29 first steps\n');
} catch (err) {
  failed += 1;
  console.error('✗ flow-player 29:', err.message);
}

process.exit(failed > 0 ? 1 : 0);
