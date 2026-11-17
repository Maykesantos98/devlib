import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for DEVLIB smoke tests.
 *
 * Browsers are not bundled by default — run once locally:
 *   npx playwright install chromium
 *
 * Spec files live in tests/e2e/. CI matrix is opt-in via the
 * `CI=true` env var; locally we just run chromium for speed.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    reducedMotion: 'reduce',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    /*
     * Firefox roda sempre, não só no CI. Ele é o único motor sem
     * `animation-timeline`, então é o único que exercita o caminho de fallback
     * do motion.css. Um bug que apagou o índice inteiro passou despercebido
     * justamente porque só o Chromium era testado localmente.
     */
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    ...(process.env.CI
      ? [{ name: 'webkit', use: { ...devices['Desktop Safari'] } }]
      : []),
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
