// usage: ENGINE=... VW VH DPR node midshots.mjs <outPrefix> <label=url> ...  — freezes rAF mid ring change and screenshots the wheel
import { createRequire } from 'node:module';
const pw = createRequire('/Users/lucas/dev/feels-on-wheels/.claude/worktrees/ff-canvas-perf/package.json')('@playwright/test');
const engine = process.env.ENGINE || 'chromium';
const [prefix, ...targets] = process.argv.slice(2);
const b = await pw[engine].launch({ headless: false });
for (const t of targets) {
  const [label, base] = t.split('=');
  for (const [step, path, key, ms] of [['out', '/angry/aggressive', 'ArrowLeft', Number(process.env.OUT_MS || 140)], ['in', '/angry', 'ArrowRight', Number(process.env.IN_MS || 140)]]) {
    const ctx = await b.newContext({ viewport: { width: Number(process.env.VW || 390), height: Number(process.env.VH || 844) }, deviceScaleFactor: Number(process.env.DPR || 3) });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      const raf = window.requestAnimationFrame.bind(window); window.__freeze = false;
      window.requestAnimationFrame = (cb) => raf((ts) => { if (!window.__freeze) cb(ts); });
    });
    await page.goto(base + path);
    await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving(), null, { timeout: 20000 });
    await page.waitForTimeout(800);
    await page.evaluate(() => document.querySelector('#a11y-tree [role="treeitem"][tabindex="0"]').focus());
    await page.evaluate((ms) => { setTimeout(() => { window.__freeze = true; window.__frozenCam = window.__fw.camera(); window.__frozenSd = globalThis.__sd; }, ms); }, ms);
    await page.keyboard.press(key);
    await page.waitForTimeout(ms + 300);
    const [cam, sd] = await page.evaluate(() => [window.__frozenCam, window.__frozenSd]);
    await page.locator('#wheel').screenshot({ path: `${prefix}-${step}-${label}.png` });
    console.log(engine, step, label, 'scale', cam.scale.toFixed(3), sd ? `stand-ins ${sd.n}/${sd.all} smallest scale ${sd.min.toFixed(3)}` : '');
    await ctx.close();
  }
}
await b.close();
