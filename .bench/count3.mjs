// Load-independent counts per label variant: labels rendered and bitmaps created in frames (per action, max per frame),
// work done in idle time (prewarm), cache memory, and labels drawn scaled up. Headless.
// usage: ENGINE=chromium VW=390 VH=844 DPR=3 node count3.mjs <vs2Base>
import { createRequire } from 'node:module';
const pw = createRequire('/Users/lucas/dev/feels-on-wheels/.claude/worktrees/ff-canvas-perf/package.json')('@playwright/test');
const base = process.argv[2]; const e = process.env.ENGINE || 'chromium';
const b = await pw[e].launch({ headless: process.env.HEADED !== '1' });
const MB = (x) => +(x / 2 ** 20).toFixed(1);
for (const lv of (process.env.LVS || 'fix v1 v12 v12f v123f v4 v5').split(' ')) {
  const page = await (await b.newContext({ viewport: { width: Number(process.env.VW || 390), height: Number(process.env.VH || 844) }, deviceScaleFactor: Number(process.env.DPR || 3) })).newPage();
  page.on('pageerror', (x) => console.log('PAGEERROR', x.message));
  await page.addInitScript((lv) => {
    globalThis.__lv = lv; window.__fr = [];
    const raf = requestAnimationFrame.bind(window); let r = 0, w = 0, bm = 0, bw = 0;
    const f = () => { const R = globalThis.__renders ?? 0, W = globalThis.__warmed ?? 0, B = globalThis.__bitmaps ?? 0; window.__fr.push([R - r, W - w, B - bm]); r = R; w = W; bm = B; raf(f); }; raf(f);
  }, lv);
  const snap = () => page.evaluate(() => ({ r: globalThis.__renders, w: globalThis.__warmed, b: globalThis.__bitmaps ?? 0, up: globalThis.__up, near: globalThis.__near, miss: globalThis.__nearMiss, bytes: globalThis.__sprites().bytes, size: globalThis.__sprites().size, peak: globalThis.__peakBytes }));
  // In-frame renders: render count minus warm renders in the same tick (sheets: renders on the sheet are warm work too).
  const act = async (name, fn, pause = 1200) => {
    const s0 = await snap();
    await page.evaluate(() => { window.__fr.length = 0; });
    await fn();
    await page.waitForTimeout(300); // a pinch's spring-back starts 150 ms after its last event
    await page.waitForFunction(() => !window.__fw.moving(), null, { timeout: 60000 });
    await page.waitForTimeout(pause);
    const fr = await page.evaluate(() => window.__fr.slice());
    const s1 = await snap();
    const inFrame = fr.map(([r, w]) => r - w);
    const frameBitmaps = fr.map(([, , bm]) => bm);
    const sheetsInIdle = 0;
    return { name, frames: fr.length, rendered: inFrame.reduce((a, x) => a + x, 0), maxPerFrame: Math.max(0, ...inFrame), maxBitmapsPerFrame: Math.max(0, ...frameBitmaps), idleRendered: s1.w - s0.w, bitmaps: s1.b - s0.b, upscaled: s1.up - s0.up, nearDraws: s1.near - s0.near, nothingCached: s1.miss - s0.miss, mb: MB(s1.bytes), labels: s1.size };
  };
  const res = [];
  await page.goto(base + '/angry/aggressive/hostile');
  await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving(), null, { timeout: 20000 });
  await page.waitForTimeout(2500);
  const s0 = await snap();
  res.push({ name: 'load (view + prewarm)', rendered: s0.r - s0.w, idleRendered: s0.w, bitmaps: s0.b, mb: MB(s0.bytes), labels: s0.size });
  await page.evaluate(() => document.querySelector('#a11y-tree [role="treeitem"][tabindex="0"]').focus());
  for (let i = 0; i < 2; i++) for (const [k, n] of [['ArrowLeft', 'out to middle'], ['ArrowLeft', 'out to core'], ['ArrowRight', 'in to middle'], ['ArrowRight', 'in to outer']]) res.push(await act(`${i ? 'again: ' : ''}${n}`, () => page.keyboard.press(k)));
  const zoom = (dy, n) => page.evaluate(async ([dy, n]) => { const wheel = document.getElementById('wheel'); const rect = wheel.getBoundingClientRect(); const cam = window.__fw.camera(); for (let k = 0; k < n; k++) { wheel.dispatchEvent(new WheelEvent('wheel', { deltaY: dy, ctrlKey: true, clientX: rect.left + cam.cx, clientY: rect.top + cam.cy, bubbles: true, cancelable: true })); await new Promise((r) => requestAnimationFrame(r)); } await new Promise((r) => setTimeout(r, 400)); }, [dy, n]);
  res.push(await act('pinch in and back (springs back)', () => zoom(-8, 25)));
  res.push(await act('pinch out and back (springs back)', () => zoom(8, 15)));
  res.push(await act('pinch wobble 2.5 s (as wk.mjs)', () => page.evaluate(async () => { const wheel = document.getElementById('wheel'); const rect = wheel.getBoundingClientRect(); const cam = window.__fw.camera(); let sign = -1; const end = performance.now() + 2500; while (performance.now() < end) { for (let k = 0; k < 8; k++) wheel.dispatchEvent(new WheelEvent('wheel', { deltaY: 30 * sign, ctrlKey: true, clientX: rect.left + cam.cx, clientY: rect.top + cam.cy, bubbles: true, cancelable: true })); sign = -sign; await new Promise((r) => setTimeout(r, 120)); } })));
  await page.goto(base + '/');
  await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving(), null, { timeout: 20000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => document.querySelector('#a11y-tree [role="treeitem"][tabindex="0"]').focus());
  res.push(await act('spin 10 steps (whole wheel)', async () => { for (let k = 0; k < 10; k++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(70); } }));
  const end = await snap();
  console.log(JSON.stringify({ engine: e, vw: Number(process.env.VW || 390), lv, peakMB: MB(end.peak), res }));
}
await b.close();
