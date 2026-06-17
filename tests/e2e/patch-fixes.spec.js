import { test, expect } from '@playwright/test';

test.describe('patch 2.0.1 — token pool e processing pill', () => {
  test('edge rect tokens render com tamanho correto (sem pool bug)', async ({ page }) => {
    await page.goto('/demos/08-streaming-sse.html');
    await page.locator('.fg-root').waitFor({ state: 'visible' });
    await page.locator('.fg-particles .fg-token').first().waitFor({ state: 'visible', timeout: 20000 });

    await expect.poll(async () => {
      const dims = await page.locator('.fg-particles .fg-token-shape').evaluateAll((els) =>
        els.map((el) => ({
          tag: el.tagName.toLowerCase(),
          w: el.getAttribute('width'),
        })),
      );
      return dims.filter((d) => d.tag === 'rect' && d.w === '10').length;
    }, { timeout: 25000 }).toBeGreaterThan(0);
  });

  test('pill running fica no slot inferior em node sem pillTop', async ({ page }) => {
    await page.goto('/demos/08-streaming-sse.html');
    await page.locator('.fg-root').waitFor({ state: 'visible' });

    const llm = page.locator('[data-node-id="llm"]');
    await expect(llm.locator('.fg-node-slot-bottom [data-fg-pill-key="running"]')).toBeVisible({
      timeout: 20000,
    });
    await expect(llm.locator('.fg-node-slot-top .fg-pill')).toHaveCount(0);
  });

  test('pillTop estático coexiste com running durante dwell', async ({ page }) => {
    await page.goto('/demos/35-llm-inference.html');
    await page.locator('.fg-root').waitFor({ state: 'visible' });

    const decode = page.locator('[data-node-id="decode"]');
    await expect(decode.locator('.fg-node-slot-top .fg-pill-text', { hasText: '6× tokens' })).toBeVisible({
      timeout: 25000,
    });
    await expect(decode.locator('.fg-node-slot-bottom [data-fg-pill-key="running"]')).toBeVisible({
      timeout: 25000,
    });
  });
});
