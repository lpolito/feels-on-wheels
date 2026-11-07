import { expect, test, type Page } from '@playwright/test';

// Spec §7: Firefox frame-time gate. Heap can't be read in Firefox; the 10-minute manual check stays a human step.
test.use({ viewport: { width: 1280, height: 720 } });
test.skip(({ browserName }) => browserName !== 'firefox', 'Firefox gate');

const p95 = (xs: number[]): number => [...xs].sort((a, b) => a - b)[Math.floor(xs.length * 0.95)] ?? 0;

async function setup(page: Page, hash: string): Promise<void> {
  await page.addInitScript(() => {
    const raf = window.requestAnimationFrame.bind(window);
    window.__probe = [];
    const probe = (t: number) => {
      window.__probe.push(t);
      if (window.__probe.length > 20000) window.__probe.splice(0, 10000);
      raf(probe);
    };
    raf(probe);
  });
  await page.goto(`/${hash}`);
  await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving());
}

/** The same scripted spin as the Chromium perf test. */
async function spin(page: Page, ms: number): Promise<void> {
  const box = (await page.locator('#wheel').boundingBox())!;
  const x = box.x + box.width * 0.4;
  const end = Date.now() + ms;
  let down = true;
  while (Date.now() < end) {
    const [from, to] = down ? [0.2, 0.8] : [0.8, 0.2];
    await page.mouse.move(x, box.y + box.height * from);
    await page.mouse.down();
    await page.mouse.move(x, box.y + box.height * to, { steps: 6 });
    await page.mouse.up();
    down = !down;
    await page.waitForTimeout(120);
  }
}

/**
 * Spec v1.2 §7: ctrl+wheel bursts at the wheel's centre, 8 zooming in then 8 zooming out every 120 ms. Each burst is
 * synthetic WheelEvents in one task: Playwright's Firefox delays its first real wheel event by about 380 ms.
 */
async function pinch(page: Page, ms: number): Promise<void> {
  await page.evaluate(async (duration) => {
    const wheel = document.getElementById('wheel')!;
    const rect = wheel.getBoundingClientRect();
    const cam = window.__fw.camera();
    const x = rect.left + cam.cx;
    const y = rect.top + cam.cy;
    let sign = -1;
    const end = performance.now() + duration;
    while (performance.now() < end) {
      for (let k = 0; k < 8; k++) {
        wheel.dispatchEvent(new WheelEvent('wheel', {
          deltaY: 30 * sign, ctrlKey: true, clientX: x, clientY: y, bubbles: true, cancelable: true,
        }));
      }
      sign = -sign;
      await new Promise((r) => setTimeout(r, 120));
    }
  }, ms);
}

test('Firefox: pinching the whole wheel keeps frame delta p95 ≤ 20 ms', async ({ page }) => {
  await setup(page, '#/core');
  await page.evaluate(() => { window.__probe.length = 0; });
  await pinch(page, 6000);
  const deltas = await page.evaluate(() => window.__probe.slice(1).map((t, i) => t - window.__probe[i]!));
  const draws = await page.evaluate(() => window.__fw.drawTimes());
  console.log(`firefox pinch: frame delta p95 ${p95(deltas).toFixed(2)} ms over ${deltas.length} frames; draw p95 ${p95(draws).toFixed(2)} ms`);
  expect(deltas.length).toBeGreaterThan(100);
  expect(p95(deltas)).toBeLessThanOrEqual(20);
});

for (const [name, hash] of [['whole wheel', '#/core'], ['opened', '#/core/angry/aggressive/hostile']] as const) {
  test(`Firefox: spinning the ${name} keeps frame delta p95 ≤ 20 ms`, async ({ page }) => {
    await setup(page, hash);
    await page.evaluate(() => { window.__probe.length = 0; });
    await spin(page, 6000);
    const deltas = await page.evaluate(() => window.__probe.slice(1).map((t, i) => t - window.__probe[i]!));
    const draws = await page.evaluate(() => window.__fw.drawTimes());
    console.log(`firefox ${name}: frame delta p95 ${p95(deltas).toFixed(2)} ms over ${deltas.length} frames; draw p95 ${p95(draws).toFixed(2)} ms`);
    expect(deltas.length).toBeGreaterThan(100);
    expect(p95(deltas)).toBeLessThanOrEqual(20);
  });
}
