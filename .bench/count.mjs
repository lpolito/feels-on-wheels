// node .bench/count.mjs <baseUrl>  (env ENGINE, GLMODE, VW/VH/DPR, HEADLESS=0) — work per frame, independent of load:
// label renders (sprite renders in 2D count builds, atlas uploads in GL), labels drawn, GL draw calls, uploaded texels.
import { createRequire } from 'node:module';
const pw = createRequire(import.meta.url)('@playwright/test');
const base = process.argv[2];
const b = await pw[process.env.ENGINE || 'chromium'].launch({ headless: process.env.HEADLESS !== '0' });
const ctx = await b.newContext({ viewport: { width: Number(process.env.VW || 390), height: Number(process.env.VH || 844) }, deviceScaleFactor: Number(process.env.DPR || 3) });
const page = await ctx.newPage();
if (process.env.GLMODE) await page.addInitScript((m) => { globalThis.__glLabels = m; }, process.env.GLMODE);
await page.addInitScript(() => {
  window.__per = []; const raf = requestAnimationFrame.bind(window); let p = [0, 0, 0, 0];
  const keys = ['__renders', '__draws', '__glCalls', '__uploadBytes'];
  const f = () => { const v = keys.map((k) => globalThis[k] ?? 0); if (v[1] > p[1]) window.__per.push(v.map((x, i) => x - p[i])); p = v; raf(f); }; raf(f);
});
const q = (a, k) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * k))] ?? 0; };
const run = async (name, fn) => {
  await page.evaluate(() => { window.__per.length = 0; });
  await fn();
  await page.waitForFunction(() => !window.__fw.moving(), null, { timeout: 30000 });
  await page.waitForTimeout(400);
  const per = await page.evaluate(() => window.__per);
  const col = (i) => per.map((p) => p[i]);
  const r = col(0); const sum = r.reduce((a, b) => a + b, 0);
  console.log(name.padEnd(24), `frames ${String(per.length).padStart(3)}`, `renders/frame med ${q(r, 0.5)} p90 ${q(r, 0.9)} max ${q(r, 1)} total ${sum}`,
    `| labels/frame med ${q(col(1), 0.5)}`, col(2).some((x) => x) ? `| GL calls/frame med ${q(col(2), 0.5)} max ${q(col(2), 1)} | upload max ${(q(col(3), 1) / 1e6).toFixed(2)} MB/frame` : '');
};
await page.goto(base + '/angry/aggressive/hostile');
await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving(), null, { timeout: 20000 });
await page.waitForTimeout(500);
await page.evaluate(() => document.querySelector('#a11y-tree [role="treeitem"][tabindex="0"]').focus());
for (let i = 0; i < 2; i++) {
  await run('ArrowLeft (out a ring)', () => page.keyboard.press('ArrowLeft'));
  await run('ArrowLeft (out a ring)', () => page.keyboard.press('ArrowLeft'));
  await run('ArrowRight (in a ring)', () => page.keyboard.press('ArrowRight'));
  await run('ArrowRight (in a ring)', () => page.keyboard.press('ArrowRight'));
}
await run('spin 10 steps', async () => { for (let k = 0; k < 10; k++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(70); } });
await run('pinch 2.5 s', () => page.evaluate(async () => { const wheel = document.getElementById('wheel'); const rect = wheel.getBoundingClientRect(); const cam = window.__fw.camera(); let sign = -1; const end = performance.now() + 2500; while (performance.now() < end) { for (let k = 0; k < 8; k++) wheel.dispatchEvent(new WheelEvent('wheel', { deltaY: 30 * sign, ctrlKey: true, clientX: rect.left + cam.cx, clientY: rect.top + cam.cy, bubbles: true, cancelable: true })); sign = -sign; await new Promise((r) => setTimeout(r, 120)); } }));
await b.close();
