// Labels rendered per frame during ring changes, per variant (vs build's __renders counter). usage: VW VH DPR WAIT node count2.mjs <vsBase>
import { createRequire } from 'node:module';
const pw = createRequire('/Users/lucas/dev/feels-on-wheels/.claude/worktrees/ff-canvas-perf/package.json')('@playwright/test');
const base = process.argv[2]; const WAIT = Number(process.env.WAIT ?? 600);
const b = await pw.chromium.launch({ headless: false });
for (const lv of (process.env.LVS || 'fix v1 v12 v12f v123f v4 v5').split(' ')) {
  const ctx = await b.newContext({ viewport: { width: Number(process.env.VW || 390), height: Number(process.env.VH || 844) }, deviceScaleFactor: Number(process.env.DPR || 3) });
  const page = await ctx.newPage();
  await page.addInitScript((lv) => { globalThis.__lv = lv; window.__per = []; const raf = requestAnimationFrame.bind(window); let r = 0, d = 0, w = 0; const f = () => { const R = globalThis.__renders ?? 0, D = globalThis.__draws ?? 0, W = globalThis.__warmed ?? 0; if (D > d) window.__per.push((R - r) - (W - w)); r = R; d = D; w = W; raf(f); }; raf(f); }, lv);
  await page.goto(base + '/angry/aggressive/hostile');
  await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving(), null, { timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.querySelector('#a11y-tree [role="treeitem"][tabindex="0"]').focus());
  const all = [];
  for (let i = 0; i < 2; i++) for (const k of ['ArrowLeft', 'ArrowLeft', 'ArrowRight', 'ArrowRight']) {
    await page.evaluate(() => { window.__per.length = 0; });
    await page.keyboard.press(k); await page.waitForFunction(() => !window.__fw.moving(), null, { timeout: 30000 }); await page.waitForTimeout(50);
    all.push(...await page.evaluate(() => window.__per));
    await page.waitForTimeout(WAIT);
  }
  const s = [...all].sort((a, b) => a - b);
  console.log(JSON.stringify({ lv, frames: all.length, med: s[s.length >> 1], p90: s[Math.floor(s.length * 0.9)], max: s.at(-1), perStep: +(all.reduce((a, x) => a + x, 0) / 8).toFixed(1) }));
  await ctx.close();
}
await b.close();
