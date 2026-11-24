import { createRequire } from 'node:module';
const pw = createRequire('/Users/lucas/dev/feels-on-wheels/.claude/worktrees/ff-canvas-perf/package.json')('@playwright/test');
const b = await pw.chromium.launch();
for (const [vw, vh, d] of [[390, 844, 3], [1440, 900, 2]]) for (const lv of ['v12', 'v12f', 'v123f']) {
  const page = await (await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: d })).newPage();
  await page.addInitScript((lv) => { globalThis.__lv = lv; }, lv);
  await page.goto('http://localhost:4564/angry/aggressive/hostile');
  await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving()); await page.waitForTimeout(1500);
  await page.evaluate(() => document.querySelector('#a11y-tree [role="treeitem"][tabindex="0"]').focus());
  const z = await page.evaluate(() => [globalThis.__renders, globalThis.__restMiss ?? 0, globalThis.__restNear ?? 0, globalThis.__nearMiss]);
  for (const k of ['ArrowLeft', 'ArrowLeft', 'ArrowRight', 'ArrowRight', 'ArrowLeft', 'ArrowLeft', 'ArrowRight', 'ArrowRight']) { await page.keyboard.press(k); await page.waitForFunction(() => !window.__fw.moving()); await page.waitForTimeout(800); }
  const r = await page.evaluate(() => [globalThis.__renders, globalThis.__restMiss ?? 0, globalThis.__restNear ?? 0, globalThis.__nearMiss, globalThis.__warmed]);
  console.log(vw, lv, 'renders', r[0] - z[0], 'at-rest misses', r[1] - z[1], 'of which a size within 1px was cached', r[2] - z[2], 'motion misses (no size cached)', r[3] - z[3], 'warmed total', r[4]);
}
await b.close();
