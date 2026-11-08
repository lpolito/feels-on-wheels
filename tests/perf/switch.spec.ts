import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 720 }, launchOptions: { args: ['--js-flags=--expose-gc'] } });
test.skip(({ browserName }) => browserName !== 'chromium', 'forced GC needs Chromium');

const idle = (page: import('@playwright/test').Page) => page.waitForFunction(() => !window.__fw.moving());

test('Review Focus 6: 20 switches leave only the current wheel alive', async ({ page }) => {
  await page.goto('/#/body/chest/racing-heart');
  await page.waitForFunction(() => window.__fw !== undefined);
  await idle(page);
  for (let i = 0; i < 20; i++) {
    const label = i % 2 === 0 ? 'Feelings' : 'Body';
    await page.locator('fw-wheel-switch button', { hasText: label }).click();
    await idle(page);
  }
  expect(await page.evaluate(() => window.__fw.wheel())).toBe('body');
  // Two separate turns: WeakRefs created in a job stay alive until that job ends.
  await page.evaluate(() => window.gc?.());
  await page.waitForTimeout(50);
  await page.evaluate(() => window.gc?.());
  await page.waitForTimeout(50);
  // The current layout and its store.
  expect(await page.evaluate(() => window.__fw.liveWheels())).toBe(2);
});
