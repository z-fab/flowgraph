import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:3456',
    headless: true,
  },
  webServer: {
    command: 'npx serve -l 3456',
    url: 'http://127.0.0.1:3456',
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
