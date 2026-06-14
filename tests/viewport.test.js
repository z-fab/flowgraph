import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createViewport } from '../src/viewport.js';

describe('viewport bounds', () => {
  it('fit uses updated bounds after layout change', () => {
    const svg = {
      getBoundingClientRect: () => ({ width: 400, height: 400, left: 0, top: 0 }),
      classList: { add() {}, remove() {} },
      addEventListener() {},
    };
    const g = { setAttribute() {} };
    const bounds = { x: 0, y: 0, width: 800, height: 400 };
    const vp = createViewport(svg, g, { zoom: { enabled: false } }, bounds);

    let transform = '';
    g.setAttribute = (_k, v) => { transform = v; };

    vp.fit();
    const tyBefore = Number(transform.match(/translate\([^,]+,([^)]+)/)?.[1] || 0);

    vp.updateBounds({ x: 0, y: 200, width: 200, height: 100 });
    vp.fit();
    const tyAfter = Number(transform.match(/translate\([^,]+,([^)]+)/)?.[1] || 0);

    assert.notEqual(tyBefore, tyAfter);
  });
});
