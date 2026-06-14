import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderSparkline, bucketBySecond } from '../src/charts.js';

describe('charts', () => {
  it('renderSparkline returns svg for samples', () => {
    const html = renderSparkline([{ t: 1, v: 10 }, { t: 2, v: 20 }, { t: 3, v: 15 }], { label: 'RT' });
    assert.match(html, /polyline/);
    assert.match(html, /RT/);
  });

  it('renderSparkline handles empty samples', () => {
    const html = renderSparkline([], { label: 'RT' });
    assert.match(html, /Sem dados/);
  });

  it('bucketBySecond aggregates events', () => {
    const now = Date.now();
    const samples = [
      { t: now - 500, v: 1 },
      { t: now - 400, v: 1 },
      { t: now - 1500, v: 1 },
    ];
    const buckets = bucketBySecond(samples, 30);
    const total = buckets.reduce((a, b) => a + b.v, 0);
    assert.equal(total, 3);
  });
});
