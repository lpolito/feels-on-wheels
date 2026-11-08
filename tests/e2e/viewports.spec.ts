import { expect, test, type Locator, type Page } from '@playwright/test';
import { hint, open, state } from './helpers';

/**
 * Spec v2.1 §6 and plan Task 7: existing views mustn't break and every odd viewport is accounted for. One sweep pins
 * layout invariants from 320px phones to 1920px desktops, at rest and with a word opened, on both wheels.
 */
const SIZES: [number, number][] = [
  // Portrait phones
  [320, 568], [360, 640], [375, 667], [390, 844], [393, 851], [430, 932],
  // Sideways phones
  [568, 320], [640, 360], [667, 375], [740, 360], [844, 390], [851, 393], [896, 414], [932, 430],
  // Tablets
  [768, 1024], [1024, 768], [820, 1180], [1180, 820],
  // Desktops
  [1280, 800], [1440, 900], [1920, 1080],
  // The edges of the rules
  [600, 500], [700, 700], [719, 480], [720, 479], [1000, 400], [500, 300],
  // Extremes: a folded Galaxy Fold, iPad Pro sideways, a large monitor
  [280, 653], [1366, 1024], [2560, 1440],
];

/** Spec v2.1 §6.1, as camera.ts isPortrait (the app fills the viewport). */
const portrait = (w: number, h: number) => h >= w || (w < 720 && h >= 480);

type Box = { x: number; y: number; width: number; height: number };
const box = async (l: Locator): Promise<Box> => (await l.boundingBox())!;
const overlaps = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const inside = (a: Box, w: number, h: number) => a.x >= -0.5 && a.y >= -0.5 && a.x + a.width <= w + 0.5 && a.y + a.height <= h + 0.5;
const contains = (b: Box, p: { x: number; y: number }) => p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height;

async function controls(page: Page, w: number, h: number): Promise<void> {
  const sw = await box(page.locator('fw-wheel-switch'));
  const tb = await box(page.locator('fw-toolbar'));
  expect(overlaps(sw, tb), 'switch overlaps toolbar').toBe(false);
  expect(inside(sw, w, h), 'switch inside viewport').toBe(true);
  expect(inside(tb, w, h), 'toolbar inside viewport').toBe(true);
}

test.describe('viewport sweep', () => {
  test.beforeEach(({ browserName, isMobile }) => test.skip(browserName !== 'chromium' || Boolean(isMobile), 'one engine, own viewports'));

  for (const [w, h] of SIZES) {
    for (const hash of ['', '#/body']) {
      test(`${w}×${h} ${hash || '#/'} at rest`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: h });
        await open(page, hash);
        await controls(page, w, h);
        expect(inside(await box(hint(page)), w, h), 'message inside viewport').toBe(true);
        expect((await page.evaluate(() => window.__fw.labelsByRing()))[0], 'core labels').toBeGreaterThan(0);
        expect((await state(page)).view.mode).toBe('wheel');
        const app = await box(page.locator('#app'));
        const stage = await box(page.locator('#stage'));
        const scale = (await page.evaluate(() => window.__fw.camera())).scale;
        if (portrait(w, h)) {
          expect(Math.abs(stage.width - app.width), 'portrait: the stage is the whole app').toBeLessThanOrEqual(1);
        } else {
          expect((await box(hint(page))).x, 'sideways: message beside the wheel').toBeGreaterThanOrEqual(stage.x + stage.width - 1);
          if (h < 480) expect(scale, 'short sideways: side view').toBeGreaterThan(1.5);
          else expect(scale, 'tall sideways: whole wheel').toBeLessThanOrEqual(1.5);
        }
      });
    }

    for (const [hash, path] of [['#/core/happy/content/joyful', 'happy/content/joyful'], ['#/body/head/headache', 'head/headache']] as const) {
      test(`${w}×${h} ${hash} opened`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: h });
        await open(page, hash);
        await controls(page, w, h);
        const card = await box(page.locator('fw-card'));
        expect(inside(card, w, h), 'card inside viewport').toBe(true);
        const p = await page.evaluate((x) => window.__fw.segmentScreenPoint(x), path);
        expect(contains(await box(page.locator('#stage')), p), 'opened word on the stage').toBe(true);
        expect(contains(card, p), 'opened word under the card').toBe(false);
        expect(contains(await box(page.locator('fw-wheel-switch')), p), 'opened word under the switch').toBe(false);
        expect(contains(await box(page.locator('fw-toolbar')), p), 'opened word under the toolbar').toBe(false);
      });
    }
  }
});
