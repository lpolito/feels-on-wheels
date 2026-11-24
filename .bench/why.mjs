import { createRequire } from 'node:module';
const pw = createRequire('/Users/lucas/dev/feels-on-wheels/.claude/worktrees/ff-canvas-perf/package.json')('@playwright/test');
const b = await pw.chromium.launch({ headless: false });
const ctx = await b.newContext({ viewport: { width: Number(process.env.VW || 390), height: Number(process.env.VH || 844) }, deviceScaleFactor: Number(process.env.DPR || 3) });
const page = await ctx.newPage();
await page.goto(process.env.BASE + '/angry/aggressive/hostile');
await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving(), null, { timeout: 20000 });
await page.evaluate(() => document.querySelector('#a11y-tree [role="treeitem"][tabindex="0"]').focus());
for (const k of ['ArrowLeft', 'ArrowLeft', 'ArrowRight', 'ArrowRight']) {
  await page.evaluate(() => { globalThis.__why = {}; globalThis.__renders = 0; });
  await page.keyboard.press(k); await page.waitForFunction(() => !window.__fw.moving(), null, { timeout: 30000 }); await page.waitForTimeout(300);
  console.log(k, await page.evaluate(() => JSON.stringify({ renders: globalThis.__renders, ...globalThis.__why })));
}
await b.close();
