// At-rest exactness after motion, and held mid-pinch frames, per label variant. usage: node shots2.mjs <vsBase> <fixRefBase> <outDir>
import { createRequire } from 'node:module';
import fs from 'node:fs';
const pw = createRequire('/Users/lucas/dev/feels-on-wheels/.claude/worktrees/ff-canvas-perf/package.json')('@playwright/test');
const [VS, REF, outDir] = process.argv.slice(2);
const variants = [['fixref', REF, null], ['fix', VS, 'fix'], ['v1', VS, 'v1'], ['v12', VS, 'v12'], ['v123', VS, 'v123'], ['v4', VS, 'v4'], ['v5', VS, 'v5']];
const sizes = [['phone', 390, 844, 3], ['desktop', 1440, 900, 2]];
const settle = (page) => page.waitForFunction(() => !window.__fw.moving(), null, { timeout: 20000 });
const zoomBy = (page, dy, n) => page.evaluate(async ([dy, n]) => {
  const wheel = document.getElementById('wheel'); const rect = wheel.getBoundingClientRect(); const cam = window.__fw.camera();
  for (let k = 0; k < n; k++) { wheel.dispatchEvent(new WheelEvent('wheel', { deltaY: dy, ctrlKey: true, clientX: rect.left + cam.cx, clientY: rect.top + cam.cy, bubbles: true, cancelable: true })); await new Promise((r) => requestAnimationFrame(r)); }
  await new Promise((r) => setTimeout(r, 200));
}, [dy, n]);
const diff = async (cmp, a, b) => cmp.evaluate(async ([a, b]) => {
  const load = async (s) => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); return i; };
  const [ia, ib] = [await load(a), await load(b)];
  const c = new OffscreenCanvas(ia.width, ia.height); const x = c.getContext('2d');
  x.drawImage(ia, 0, 0); const da = x.getImageData(0, 0, c.width, c.height).data; x.drawImage(ib, 0, 0); const db = x.getImageData(0, 0, c.width, c.height).data;
  let n8 = 0, n64 = 0, max = 0;
  for (let i = 0; i < da.length; i += 4) { const m = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2])); if (m > 8) n8++; if (m > 64) n64++; if (m > max) max = m; }
  return `>8: ${n8}  >64: ${n64}  max ${max}`;
}, [a.toString('base64'), b.toString('base64')]);
for (const e of (process.env.ENGINES || 'chromium webkit firefox').split(' ')) {
  const b = await pw[e].launch();
  const cmp = await (await b.newContext()).newPage();
  for (const [sn, w, h, d] of sizes) {
    const shots = {};
    for (const [name, base, lv] of variants) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: d });
      const page = await ctx.newPage();
      await page.addInitScript((lv) => {
        if (lv) globalThis.__lv = lv;
        // Hold a ctrl-wheel zoom open: the 150 ms idle timer that ends it never fires.
        const st = window.setTimeout; window.setTimeout = (f, ms, ...a) => (ms === 150 ? 0 : st(f, ms, ...a));
      }, lv);
      await page.goto(base + '/angry/aggressive');
      await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving(), null, { timeout: 20000 });
      await page.waitForTimeout(1500);
      await page.evaluate(() => document.querySelector('#a11y-tree [role="treeitem"][tabindex="0"]').focus());
      // Motion first: out to the core view and the wheel, back in, so caches hold nearby sizes.
      for (const k of ['ArrowLeft', 'ArrowLeft', 'ArrowRight', 'ArrowRight']) { await page.keyboard.press(k); await settle(page); await page.waitForTimeout(600); }
      await page.waitForTimeout(1500);
      const s = shots[name] = {};
      s.rest = await page.locator('#wheel').screenshot();
      await zoomBy(page, -40, 6); // pinch in a little past the view
      s.pinchIn = await page.locator('#wheel').screenshot();
      await zoomBy(page, 40, 14); // and out below it
      s.pinchOut = await page.locator('#wheel').screenshot();
      await ctx.close();
    }
    for (const [name] of variants) for (const k of ['rest', 'pinchIn', 'pinchOut']) {
      fs.writeFileSync(`${outDir}/${e}-${sn}-${k}-${name}.png`, shots[name][k]);
      if (name !== 'fixref') console.log(`${e} ${sn} ${k.padEnd(8)} ${name.padEnd(5)} vs fixref`, await diff(cmp, shots.fixref[k], shots[name][k]));
    }
  }
  await b.close();
}
