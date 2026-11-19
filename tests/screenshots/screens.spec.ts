import { test } from '@chromatic-com/playwright';
import { open, settled } from '../e2e/helpers';
import { DEVICES, SCREENS } from './devices';

/**
 * Every screen on every device, for Chromatic (screenshots spec). Chromatic snapshots the page when each test ends.
 * Two of the spike's lessons are applied here, the third in the archive check (scripts/check-screenshots.mjs):
 *   - one describe per device, so each Chromatic test holds one size. With one test name at several sizes, Chromatic's
 *     loader (1.0.0) misses the size it's asked for and shows the default size's capture, squeezed;
 *   - deviceScaleFactor 2: Chromatic draws its pictures at 2x, so the wheel's canvas is captured at 2x to stay sharp.
 */
for (const device of DEVICES) {
  test.describe(device.name, () => {
    test.use({
      viewport: { width: device.width, height: device.height },
      deviceScaleFactor: 2,
      isMobile: device.touch,
      hasTouch: device.touch,
    });

    for (const screen of SCREENS.filter((s) => !s.only || s.only.includes(device.name))) {
      test(screen.name, async ({ page }) => {
        if (screen.path === '/about') await page.goto(screen.path);
        else await open(page, screen.path);
        await settled(page);
        await page.evaluate(() => document.fonts.ready);
        // Chromatic stores the page and draws it again in its own browser. Left in, the app's script would start the
        // app again there, mid-resize, and draw a different wheel. Removed after the app has settled, the page stays
        // as captured here.
        await page.evaluate(() => document.querySelectorAll('script').forEach((s) => s.remove()));
      });
    }
  });
}
