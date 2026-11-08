import { expect, test, type Page } from '@playwright/test';


test.use({ viewport: { width: 1280, height: 720 }, launchOptions: { args: ['--js-flags=--expose-gc', '--enable-precise-memory-info'] } });
test.skip(({ browserName }) => browserName !== 'chromium', 'heap and frame probes need Chromium');

const p95 = (xs: number[]): number => [...xs].sort((a, b) => a - b)[Math.floor(xs.length * 0.95)] ?? 0;

async function setup(page: Page, hash = '#/core/angry/aggressive/hostile'): Promise<void> {
  await page.addInitScript(() => {
    const raf = window.requestAnimationFrame.bind(window);
    window.__rafCount = 0;
    window.__probe = [];
    window.requestAnimationFrame = (cb) => {
      window.__rafCount++;
      return raf(cb);
    };
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

async function heap(page: Page): Promise<number> {
  return page.evaluate(() => {
    window.gc?.();
    return (performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize;
  });
}

test('spinning stays well inside the frame budget', async ({ page }) => {
  await setup(page);
  await page.evaluate(() => { window.__probe.length = 0; });
  await spin(page, 6000);
  const deltas = await page.evaluate(() => window.__probe.slice(1).map((t, i) => t - window.__probe[i]!));
  const draws = await page.evaluate(() => window.__fw.drawTimes());
  console.log(`draw p95 ${p95(draws).toFixed(2)} ms over ${draws.length} frames; frame delta p95 ${p95(deltas).toFixed(2)} ms`);
  expect(draws.length).toBeGreaterThan(100);
  expect(p95(draws)).toBeLessThanOrEqual(8);
  expect(p95(deltas)).toBeLessThanOrEqual(20);
});

test('v2: spinning the body wheel stays well inside the frame budget', async ({ page }) => {
  await setup(page, '#/body/chest/racing-heart');
  await page.evaluate(() => { window.__probe.length = 0; });
  await spin(page, 6000);
  const draws = await page.evaluate(() => window.__fw.drawTimes());
  console.log(`body wheel: draw p95 ${p95(draws).toFixed(2)} ms over ${draws.length} frames`);
  expect(await page.evaluate(() => window.__fw.wheel())).toBe('body');
  expect(draws.length).toBeGreaterThan(100);
  expect(p95(draws)).toBeLessThanOrEqual(8);
});

test('memory stays flat over a minute of spinning', async ({ page }) => {
  test.setTimeout(120_000);
  await setup(page);
  await spin(page, 5000);
  const early = await heap(page);
  await spin(page, 55_000);
  const late = await heap(page);
  console.log(`heap: ${(early / 1e6).toFixed(2)} MB → ${(late / 1e6).toFixed(2)} MB`);
  expect(late).toBeLessThanOrEqual(early * 1.1);
});

test('no animation frames are requested while idle', async ({ page }) => {
  await setup(page);
  await spin(page, 1500);
  await page.waitForFunction(() => !window.__fw.moving());
  await page.waitForTimeout(500);
  await page.evaluate(() => { window.__rafCount = 0; });
  await page.waitForTimeout(2000);
  expect(await page.evaluate(() => window.__rafCount)).toBe(0);
});

test('the canvas bitmap never exceeds viewport × devicePixelRatio, even at max zoom', async ({ page }) => {
  await setup(page);
  const box = (await page.locator('#wheel').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.keyboard.down('Control');
  for (let i = 0; i < 30; i++) await page.mouse.wheel(0, -200);
  await page.keyboard.up('Control');
  const { w, h, max } = await page.evaluate(() => {
    const c = document.querySelector('canvas')!;
    return { w: c.width, h: c.height, max: { w: Math.ceil(innerWidth * devicePixelRatio), h: Math.ceil(innerHeight * devicePixelRatio) } };
  });
  expect(w).toBeLessThanOrEqual(max.w);
  expect(h).toBeLessThanOrEqual(max.h);
});
