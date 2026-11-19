import { defineConfig } from '@playwright/test';
import base from './playwright.config';

/**
 * The screenshot suite for Chromatic (screenshots spec): every screen on every device in tests/screenshots, Chromium
 * only, on the end-to-end tests' server. `npm run screenshots`, then `npx chromatic --playwright` uploads it.
 */
export default defineConfig({
  ...base,
  testDir: 'tests/screenshots',
  testIgnore: [],
  retries: 0,
  projects: [{ name: 'chromium' }],
});
