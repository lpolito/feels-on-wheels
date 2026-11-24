import { createRequire } from 'node:module';
const pw = createRequire('/Users/lucas/dev/feels-on-wheels/.claude/worktrees/ff-canvas-perf/package.json')('@playwright/test');
const b = await pw.chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto(process.env.BASE + '/angry/aggressive/hostile');
await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving(), null, { timeout: 20000 });
await page.evaluate(() => document.querySelector('#a11y-tree [role="treeitem"][tabindex="0"]').focus());
for (const k of ['ArrowLeft', 'ArrowLeft', 'ArrowRight']) {
  await page.keyboard.press(k);
  for (let i = 0; i < 8; i++) { await page.waitForTimeout(500); console.log(k, i, await page.evaluate(() => JSON.stringify({ m: window.__fw.moving(), cam: window.__fw.camera(), r: globalThis.__renders, d: globalThis.__draws }))); if (!(await page.evaluate(() => window.__fw.moving()))) break; }
}
await b.close();
