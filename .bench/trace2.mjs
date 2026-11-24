// Per-frame draw time, in-frame renders and first draws during ring changes. usage: ENGINE LV VW VH DPR WAIT node trace2.mjs <base>
import { createRequire } from 'node:module';
const pw = createRequire('/Users/lucas/dev/feels-on-wheels/.claude/worktrees/ff-canvas-perf/package.json')('@playwright/test');
const e = process.env.ENGINE || 'webkit'; const WAIT = Number(process.env.WAIT ?? 1500);
const b = await pw[e].launch({ headless: false });
for (const lv of (process.env.LVS || 'fix v1 v12f').split(' ')) {
  const page = await (await b.newContext({ viewport: { width: Number(process.env.VW || 390), height: Number(process.env.VH || 844) }, deviceScaleFactor: Number(process.env.DPR || 3) })).newPage();
  await page.addInitScript((lv) => { globalThis.__lv = lv; window.__fr = []; const raf = requestAnimationFrame.bind(window); let r = 0, w = 0, f1 = 0, t = 0; const f = (now) => { const R = globalThis.__renders ?? 0, W = globalThis.__warmed ?? 0, F = globalThis.__firstDraws ?? 0; window.__fr.push([+(now - t).toFixed(1), R - r - (W - w), F - f1]); r = R; w = W; f1 = F; t = now; raf(f); }; raf(f); }, lv);
  await page.goto(process.argv[2] + '/angry/aggressive/hostile');
  await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving()); await page.waitForTimeout(2000);
  await page.evaluate(() => document.querySelector('#a11y-tree [role="treeitem"][tabindex="0"]').focus());
  const steps = [];
  for (const k of ['ArrowLeft', 'ArrowLeft', 'ArrowRight', 'ArrowRight']) {
    await page.evaluate(() => { window.__fr.length = 0; window.__d0 = window.__fw.drawTimes().length; });
    await page.keyboard.press(k); await page.waitForFunction(() => !window.__fw.moving(), null, { timeout: 60000 }); await page.waitForTimeout(100);
    const { fr, dt } = await page.evaluate(() => ({ fr: window.__fr.slice(1), dt: window.__fw.drawTimes().slice(window.__d0) }));
    const worst = fr.reduce((a, x) => (x[0] > a[0] ? x : a), [0, 0, 0]);
    steps.push(`${k === 'ArrowLeft' ? 'out' : 'in'}: frames ${fr.length}, >25ms ${fr.filter((x) => x[0] > 25).length}, worst ${worst[0]}ms (renders ${worst[1]}, first draws ${worst[2]}), renders ${fr.reduce((a, x) => a + x[1], 0)}, first draws ${fr.reduce((a, x) => a + x[2], 0)}, draw max ${Math.max(...dt).toFixed(0)}ms`);
    await page.waitForTimeout(WAIT);
  }
  console.log(e, process.env.VW || 390, lv, '\n  ' + steps.join('\n  '));
}
await b.close();
