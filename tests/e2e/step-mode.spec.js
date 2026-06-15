import { test, expect } from '@playwright/test';

test.describe('modos de reprodução v2', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/29-async-job-polling.html');
    await page.locator('.fg-root').waitFor({ state: 'visible' });
  });

  test('modo play anima sem overlay de narração', async ({ page }) => {
    await expect(page.locator('.fg-btn-mode[data-mode="play"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.fg-narration')).toBeHidden();
    await expect(page.locator('.fg-particles .fg-token').first()).toBeVisible({ timeout: 15000 });
  });

  test('modo narrativa mostra overlay', async ({ page }) => {
    await page.locator('.fg-btn-mode[data-mode="narrative"]').click();
    await expect(page.locator('.fg-narration')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.fg-scenario-panel')).toBeHidden();
  });

  test('modo passo a passo com painel flutuante', async ({ page }) => {
    await page.locator('.fg-btn-mode[data-mode="step"]').click();
    await expect(page.locator('.fg-step-bar')).toBeHidden();
    await expect(page.locator('.fg-scenario-panel')).toBeVisible();
    await expect(page.locator('.fg-step-panel')).toHaveCount(0);
    await page.locator('.fg-scenario-nav-next').click();
    await expect(page.locator('.fg-scenario-panel-item--active')).toBeVisible({ timeout: 8000 });
  });

  test('fullscreen abre modal', async ({ page }) => {
    await page.getByRole('button', { name: /expandir diagrama/i }).click();
    await expect(page.locator('.fg-fullscreen-overlay')).toBeVisible();
  });
});
