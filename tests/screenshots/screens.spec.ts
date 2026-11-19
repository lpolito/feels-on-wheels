import { takeSnapshot, test } from '@chromatic-com/playwright';
import { open, settled } from '../e2e/helpers';
import { DEVICES, SCREENS } from './devices';

/**
 * Every screen on every device, for Chromatic (screenshots spec). Chromatic's sidebar groups by screen, and each
 * snapshot's header reads "<device, orientation, size> : <screen>", so a picture says what it is.
 * Chromatic redraws the saved page (HTML, CSS, and the canvas as an image) and never runs the app, so what's measured
 * here, in Chromium on macOS, is what it shows; text it redraws in its own fonts can sit off from boxes measured here.
 * The spike's two lessons, which the archive check (scripts/check-screenshots.mjs) also guards:
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
          await takeSnapshot(page, screen.name, testInfo);
        });
      });
    }
  });
}
