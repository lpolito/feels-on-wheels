import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  reporter: 'list',
  // On CI, retry a failed test once; Playwright then reports it as flaky rather than hiding it.
  retries: process.env['CI'] ? 1 : 0,
  use: { baseURL: 'http://localhost:4173' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'pixel', use: { ...devices['Pixel 7'] } },
    { name: 'iphone', use: { ...devices['iPhone 15'] } },
  ],
  // Cloudflare as it runs in production (URL redesign spec §10): the test build's files, and the Worker for paths with
  // no file. Wrangler is pinned here rather than as a dev dependency.
  webServer: {
    command: 'npm run build:test && npx -y wrangler@4.156.2 dev --assets dist-test --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
