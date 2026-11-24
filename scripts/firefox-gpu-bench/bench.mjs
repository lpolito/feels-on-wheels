// Spins the wheel with the keyboard in headed Firefox and reports frame times, and whether Firefox still draws the
// wheel's canvas on the GPU (gfx.canvas.accelerated.debug paints a green square in an accelerated canvas's corner).
// See docs/superpowers/specs/2026-11-24-firefox-gpu-canvas-design.md §6. Needs a GPU and a display: headless Firefox
// always draws canvases in software.
// usage: node bench.mjs <url> <label> [prefsJSON] [rounds] [spin|pinch]; VW, VH and DPR set the window.
import { firefox } from '@playwright/test';
const [url, label, prefsJSON = '{}', roundsArg = '6', mode = 'spin'] = process.argv.slice(2);
const prefs = { 'gfx.canvas.accelerated.debug': true, ...JSON.parse(prefsJSON) };
const b = await firefox.launch({ headless: false, firefoxUserPrefs: prefs });
const ctx = await b.newContext({ viewport: { width: Number(process.env.VW || 1440), height: Number(process.env.VH || 900) }, deviceScaleFactor: Number(process.env.DPR || 2) });
const page = await ctx.newPage(); page.on('pageerror', (e) => console.error('PAGEERROR', e.message)); page.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
await page.addInitScript(() => {
  const raf = window.requestAnimationFrame.bind(window); window.__probe = [];
  const probe = (t) => { window.__probe.push(t); raf(probe); }; raf(probe);
});
await page.goto(url);
await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving(), null, { timeout: 20000 });
await page.waitForTimeout(800);
const corner = async () => {
  const r = await page.evaluate(() => { const c = document.getElementById('wheel').getBoundingClientRect(); return { x: c.right - 5, y: c.top + 3 }; });
  const shot = await page.screenshot({ clip: { x: r.x, y: r.y, width: 2, height: 2 } });
  const px = await page.evaluate(async (b64) => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = new OffscreenCanvas(4, 4); const x = c.getContext('2d'); x.drawImage(i, 0, 0); return Array.from(x.getImageData(0, 0, 1, 1).data); }, shot.toString('base64'));
  return px[1] > 200 && px[0] < 60 && px[2] < 60 ? 'GPU' : 'sw';
};
const before = await corner();
await page.evaluate(() => document.querySelector('#a11y-tree [role="treeitem"][tabindex="0"]').focus());
const rounds = Number(roundsArg); const out = [];
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] ?? 0; };
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length * q)] ?? 0; };
for (let r = 0; r < rounds; r++) {
  await page.evaluate(() => { window.__probe.length = 0; window.__fwDraw0 = window.__fw.drawTimes().length; });
  if (mode === 'pinch') {
    await page.evaluate(async () => {
      const wheel = document.getElementById('wheel'); const rect = wheel.getBoundingClientRect(); const cam = window.__fw.camera();
      let sign = -1; const end = performance.now() + 2500;
      while (performance.now() < end) { for (let k = 0; k < 8; k++) wheel.dispatchEvent(new WheelEvent('wheel', { deltaY: 30 * sign, ctrlKey: true, clientX: rect.left + cam.cx, clientY: rect.top + cam.cy, bubbles: true, cancelable: true })); sign = -sign; await new Promise((r) => setTimeout(r, 120)); }
    });
  } else {
    for (let k = 0; k < 10; k++) { await page.keyboard.press(r % 2 ? 'ArrowUp' : 'ArrowDown'); await page.waitForTimeout(70); }
  }
  await page.waitForFunction(() => !window.__fw.moving(), null, { timeout: 60000 }).catch(async (e) => { console.error('STUCK', JSON.stringify(await page.evaluate(() => ({ cam: window.__fw.camera(), s: window.__fw.state().selected })))); throw e; });
  const { deltas, draws } = await page.evaluate(() => ({ deltas: window.__probe.slice(1).map((t, i) => t - window.__probe[i]), draws: window.__fw.drawTimes().slice(window.__fwDraw0) }));
  await page.waitForTimeout(400);
  out.push({ round: r + 1, frames: deltas.length, frameMed: +med(deltas).toFixed(1), frameP90: +pct(deltas, 0.9).toFixed(1), drawMed: +med(draws).toFixed(1), drawP90: +pct(draws, 0.9).toFixed(1), canvas: await corner(), view: await page.evaluate(() => { const s = window.__fw.state(); return { mode: s.view.mode, ring: s.view.ring, opened: s.opened, sel: window.__fw.pathOf(s.selected), labels: window.__fw.labelsByRing().reduce((a, b) => a + b, 0) }; }) });
}
console.log(JSON.stringify({ label, before, rounds: out }));
await b.close();
