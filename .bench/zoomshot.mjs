// node .bench/zoomshot.mjs <engine> <baseUrl> <outPrefix>  (env GLMODE) — screenshots mid-zoom and at rest after ring changes
import { createRequire } from 'node:module';
const pw = createRequire(import.meta.url)('@playwright/test');
const [engine, base, out] = process.argv.slice(2);
const b = await pw[engine].launch({ headless: process.env.HEADLESS !== '0' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();
if (process.env.GLMODE) await page.addInitScript((m) => { globalThis.__glLabels = m; }, process.env.GLMODE);
await page.goto(base + (process.env.START || '/angry/aggressive/hostile'));
await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving(), null, { timeout: 20000 });
await page.waitForTimeout(800);
await page.evaluate(() => document.querySelector('#a11y-tree [role="treeitem"][tabindex="0"]').focus());
const stats = () => page.evaluate(() => (globalThis.__glStats ? globalThis.__glStats() : {}));
const keys = (process.env.KEYS || 'ArrowLeft ArrowLeft ArrowRight ArrowRight').split(' ');
for (let step = 1; step <= keys.length; step++) {
  await page.keyboard.press(keys[step - 1]);
  await page.waitForTimeout(Number(process.env.MID || 180));
  await page.screenshot({ path: `${out}-step${step}-mid.png` });
  const cam = await page.evaluate(() => window.__fw.camera().scale);
  await page.waitForFunction(() => !window.__fw.moving(), null, { timeout: 20000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}-step${step}-rest.png` });
  console.log(out, step, 'mid scale', cam.toFixed(2), 'rest scale', (await page.evaluate(() => window.__fw.camera().scale)).toFixed(2), JSON.stringify(await stats()));
}
await b.close();
