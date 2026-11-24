// Copy of .bench/explore/wk.mjs for the view-size session. Adds: LV (label variant, sets globalThis.__lv), WAIT (ms
// between ring changes in inout, to give prewarm idle time), and per-run label renders (needs the vs build's counters).
// usage: LV=v12 ENGINE=webkit VW=390 VH=844 DPR=3 node wk2.mjs <baseUrl> <label> <pinch|inout|spin> [rounds]
import { createRequire } from 'node:module';
const require = createRequire('/Users/lucas/dev/feels-on-wheels/.claude/worktrees/ff-canvas-perf/package.json');
const pw = require('@playwright/test');
const engine = process.env.ENGINE || 'webkit';
const WAIT = Number(process.env.WAIT || 0);
const [base, label, mode = 'pinch', roundsArg = '4'] = process.argv.slice(2);
const b = await pw[engine].launch({ headless: process.env.HEADLESS === '1', ...(engine === 'firefox' ? { firefoxUserPrefs: { 'gfx.canvas.accelerated.debug': true, ...JSON.parse(process.env.PREFS || '{}') } } : {}) });
const ctx = await b.newContext({ viewport: { width: Number(process.env.VW || 390), height: Number(process.env.VH || 844) }, deviceScaleFactor: Number(process.env.DPR || 3) });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.error('PAGEERROR', e.message));
if (process.env.LV) await page.addInitScript((v) => { globalThis.__lv = v; }, process.env.LV);
if (process.env.LVBYTES) await page.addInitScript((v) => { globalThis.__lvBytes = v; }, Number(process.env.LVBYTES));
await page.addInitScript(() => {
  const raf = window.requestAnimationFrame.bind(window); window.__probe = []; window.__rp = [];
  let r0 = 0;
  const probe = (t) => { window.__probe.push(t); const r = globalThis.__renders ?? 0; window.__rp.push(r - r0); r0 = r; raf(probe); }; raf(probe);
});
await page.goto(base + (mode === 'inout' ? '/angry/aggressive/hostile' : '/'));
await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving(), null, { timeout: 20000 });
await page.waitForTimeout(1500);
await page.evaluate(() => document.querySelector('#a11y-tree [role="treeitem"][tabindex="0"]').focus());
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] ?? 0; };
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length * q)] ?? 0; };
const out = [];
for (let r = 0; r < Number(roundsArg); r++) {
  await page.evaluate(() => { window.__probe.length = 0; window.__rp.length = 0; window.__fwDraw0 = window.__fw.drawTimes().length; });
  if (mode === 'pinch') {
    await page.evaluate(async () => {
      const wheel = document.getElementById('wheel'); const rect = wheel.getBoundingClientRect(); const cam = window.__fw.camera();
      let sign = -1; const end = performance.now() + 2500;
      while (performance.now() < end) { for (let k = 0; k < 8; k++) wheel.dispatchEvent(new WheelEvent('wheel', { deltaY: 30 * sign, ctrlKey: true, clientX: rect.left + cam.cx, clientY: rect.top + cam.cy, bubbles: true, cancelable: true })); sign = -sign; await new Promise((r) => setTimeout(r, 120)); }
    });
  } else if (mode === 'inout') {
    const k = r % 2 ? 'ArrowRight' : 'ArrowLeft';
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press(k); await page.waitForFunction(() => !window.__fw.moving(), null, { timeout: 20000 });
      if (WAIT && i === 0) await page.waitForTimeout(WAIT);
    }
  } else {
    for (let k = 0; k < 10; k++) { await page.keyboard.press(r % 2 ? 'ArrowUp' : 'ArrowDown'); await page.waitForTimeout(70); }
  }
  await page.waitForFunction(() => !window.__fw.moving(), null, { timeout: 60000 });
  const { deltas, draws, rp } = await page.evaluate(() => ({ deltas: window.__probe.slice(1).map((t, i) => t - window.__probe[i]), draws: window.__fw.drawTimes().slice(window.__fwDraw0), rp: window.__rp.slice(1) }));
  out.push({ janky: deltas.filter((d) => d > 25).length, worst: Math.max(...deltas), frames: deltas.length, drawMed: +med(draws).toFixed(1), drawP90: +pct(draws, 0.9).toFixed(1), renders: rp.reduce((a, x) => a + x, 0), rMax: Math.max(0, ...rp) });
  await page.waitForTimeout(WAIT || 400);
}
let gpu = '';
if (engine === 'firefox') {
  const r = await page.evaluate(() => { const c = document.getElementById('wheel').getBoundingClientRect(); return { x: c.right - 5, y: c.top + 3 }; });
  const shot = await page.screenshot({ clip: { x: r.x, y: r.y, width: 2, height: 2 } });
  const px = await page.evaluate(async (b64) => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = new OffscreenCanvas(4, 4); const x = c.getContext('2d'); x.drawImage(i, 0, 0); return Array.from(x.getImageData(0, 0, 1, 1).data); }, shot.toString('base64'));
  gpu = px[1] > 200 && px[0] < 60 && px[2] < 60 ? 'GPU' : 'sw';
}
const extra = await page.evaluate(() => ({ peak: globalThis.__peakBytes ?? 0, up: globalThis.__up ?? 0, near: globalThis.__near ?? 0, upMax: globalThis.__upMax ?? 1, miss: globalThis.__nearMiss ?? 0 }));
const sum = (k) => out.reduce((t, o) => t + o[k], 0);
const sorted = (k) => out.map((o) => o[k]).sort((x, y) => x - y);
const res = { engine, label, mode, gpu, dropped: sum('janky'), frames: sum('frames'), worstMed: Math.round(sorted('worst')[out.length >> 1]), worstMax: Math.round(sorted('worst').at(-1)), drawMed: sorted('drawMed')[out.length >> 1], drawP90: sorted('drawP90')[out.length >> 1], rendersPerRound: Math.round(sum('renders') / out.length), rMax: Math.max(...out.map((o) => o.rMax)), peakMB: +(extra.peak / 2 ** 20).toFixed(1), up: extra.up, near: extra.near, upMax: +extra.upMax.toFixed(2), miss: extra.miss };
console.log(JSON.stringify(res));
await b.close();
