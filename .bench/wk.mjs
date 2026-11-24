// usage: node wk.mjs <baseUrl> <label> <mode: pinch|inout|spin> [rounds]
import { createRequire } from 'node:module';
const require = createRequire('/Users/lucas/dev/feels-on-wheels/.claude/worktrees/ff-canvas-perf/package.json');
const pw = require('@playwright/test');
const engine = process.env.ENGINE || 'webkit';
const [base, label, mode = 'pinch', roundsArg = '4'] = process.argv.slice(2);
const b = await pw[engine].launch({ headless: process.env.HEADLESS === '1', ...(engine === 'firefox' ? { firefoxUserPrefs: { 'gfx.canvas.accelerated.debug': true, ...JSON.parse(process.env.PREFS || '{}') } } : {}) });
const ctx = await b.newContext({ viewport: { width: Number(process.env.VW || 390), height: Number(process.env.VH || 844) }, deviceScaleFactor: Number(process.env.DPR || 3) });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.error('PAGEERROR', e.message));
if (process.env.PROMOTE) await page.addInitScript((k) => { globalThis.__promoteAfter = k; }, Number(process.env.PROMOTE));
if (process.env.CELLS) await page.addInitScript((k) => { globalThis.__cells = k; }, process.env.CELLS);
await page.addInitScript(() => {
  const raf = window.requestAnimationFrame.bind(window); window.__probe = [];
  const probe = (t) => { window.__probe.push(t); raf(probe); }; raf(probe);
});
await page.goto(base + (mode === 'inout' ? '/angry/aggressive/hostile' : '/'));
await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving(), null, { timeout: 20000 });
await page.waitForTimeout(800);
await page.evaluate(() => document.querySelector('#a11y-tree [role="treeitem"][tabindex="0"]').focus());
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] ?? 0; };
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length * q)] ?? 0; };
const out = [];
for (let r = 0; r < Number(roundsArg); r++) {
  await page.evaluate(() => { window.__probe.length = 0; window.__fwDraw0 = window.__fw.drawTimes().length; });
  if (mode === 'pinch') {
    await page.evaluate(async () => {
      const wheel = document.getElementById('wheel'); const rect = wheel.getBoundingClientRect(); const cam = window.__fw.camera();
      let sign = -1; const end = performance.now() + 2500;
      while (performance.now() < end) { for (let k = 0; k < 8; k++) wheel.dispatchEvent(new WheelEvent('wheel', { deltaY: 30 * sign, ctrlKey: true, clientX: rect.left + cam.cx, clientY: rect.top + cam.cy, bubbles: true, cancelable: true })); sign = -sign; await new Promise((r) => setTimeout(r, 120)); }
    });
  } else if (mode === 'inout') {
    const k = r % 2 ? 'ArrowRight' : 'ArrowLeft';
    for (let i = 0; i < 2; i++) { await page.keyboard.press(k); await page.waitForFunction(() => !window.__fw.moving(), null, { timeout: 20000 }); }
  } else {
    for (let k = 0; k < 10; k++) { await page.keyboard.press(r % 2 ? 'ArrowUp' : 'ArrowDown'); await page.waitForTimeout(70); }
  }
  await page.waitForFunction(() => !window.__fw.moving(), null, { timeout: 60000 });
  const { deltas, draws } = await page.evaluate(() => ({ deltas: window.__probe.slice(1).map((t, i) => t - window.__probe[i]), draws: window.__fw.drawTimes().slice(window.__fwDraw0) }));
  out.push({ janky: deltas.filter((d) => d > 25).length, worst: Math.max(...deltas), frames: deltas.length, frameMed: +med(deltas).toFixed(1), frameP90: +pct(deltas, 0.9).toFixed(1), drawMed: +med(draws).toFixed(1), drawP90: +pct(draws, 0.9).toFixed(1), drawMax: +Math.max(...draws).toFixed(1) });
  await page.waitForTimeout(400);
}
let gpu = '';
if (engine === 'firefox') {
  const r = await page.evaluate(() => { const c = document.getElementById('wheel').getBoundingClientRect(); return { x: c.right - 5, y: c.top + 3 }; });
  const shot = await page.screenshot({ clip: { x: r.x, y: r.y, width: 2, height: 2 } });
  const px = await page.evaluate(async (b64) => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = new OffscreenCanvas(4, 4); const x = c.getContext('2d'); x.drawImage(i, 0, 0); return Array.from(x.getImageData(0, 0, 1, 1).data); }, shot.toString('base64'));
  gpu = px[1] > 200 && px[0] < 60 && px[2] < 60 ? 'GPU' : 'sw';
}
const sum = (k) => out.reduce((t, o) => t + o[k], 0);
const sorted = (k) => out.map((o) => o[k]).sort((x, y) => x - y);
console.log(engine.padEnd(8), label.padEnd(13), mode.padEnd(6), gpu.padEnd(3), `dropped ${sum('janky')}/${sum('frames')} (${(100 * sum('janky') / sum('frames')).toFixed(1)}%)`, `worst med ${sorted('worst')[out.length >> 1].toFixed(0)} max ${sorted('worst').at(-1).toFixed(0)}`, `draw med ${sorted('drawMed')[out.length >> 1]} p90 ${sorted('drawP90')[out.length >> 1]}`);
await b.close();
