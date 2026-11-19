import { takeSnapshot, test } from '@chromatic-com/playwright';
import { open, settled } from '../e2e/helpers';
import { DEVICES, SCREENS } from './devices';

/**
 * Every screen on every device, for Chromatic (screenshots spec). Chromatic's sidebar groups by screen, and each
 * snapshot's header reads "<device, orientation, size> : <screen>", so a picture says what it is.
 * Two of the spike's lessons are applied here, the third in the archive check (scripts/check-screenshots.mjs):
 *   - one test per device, so each Chromatic test holds one size. With one test name at several sizes, Chromatic's
 *     loader (1.0.0) misses the size it's asked for and shows the default size's capture, squeezed. The device's
 *     options sit in an untitled describe, which doesn't add to the title Chromatic shows;
 *   - deviceScaleFactor 2: Chromatic draws its pictures at 2x, so the wheel's canvas is captured at 2x to stay sharp.
 */
test.use({ disableAutoSnapshot: true });

for (const screen of SCREENS) {
  test.describe(screen.name, () => {
    for (const device of DEVICES.filter((d) => !screen.only || screen.only.includes(d.name))) {
      test.describe(() => {
        test.use({
          viewport: { width: device.width, height: device.height },
          deviceScaleFactor: 2,
          isMobile: device.touch,
          hasTouch: device.touch,
        });

        test(device.name, async ({ page }, testInfo) => {
          if (screen.path === '/about') await page.goto(screen.path);
          else await open(page, screen.path);
          await settled(page);
          await page.evaluate(() => document.fonts.ready);
          // Chromatic stores the page and draws it again in its own browser. Left in, the app's script would start the
          // app again there, mid-resize, and draw a different wheel. Removed after the app has settled, the page stays
          // as captured here.
          await page.evaluate(() => document.querySelectorAll('script').forEach((s) => s.remove()));
          await takeSnapshot(page, screen.name, testInfo);
        });
      });
    }
  });
}
