import { createRequire } from 'node:module';
const pw = createRequire('/Users/lucas/dev/feels-on-wheels/.claude/worktrees/ff-canvas-perf/package.json')('@playwright/test');
for (const e of (process.env.ENGINES || 'webkit').split(' ')) {
const b = await pw[e].launch({ headless: false });
for (const [vw, vh, d] of [[390, 844, 3], [1440, 900, 2]]) for (const lv of ['v12f', 'v123f']) {
  const page = await (await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: d })).newPage();
  await page.addInitScript((lv) => { globalThis.__lv = lv; }, lv);
  await page.goto('http://localhost:4564/angry/aggressive/hostile');
  await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving()); await page.waitForTimeout(2500);
  await page.evaluate(() => document.querySelector('#a11y-tree [role="treeitem"][tabindex="0"]').focus());
  const out = [];
  for (const k of ['ArrowLeft', 'ArrowLeft', 'ArrowRight', 'ArrowRight']) {
    await page.evaluate(() => { globalThis.__warmTimes.length = 0; globalThis.__w0 = globalThis.__warmed; });
    await page.keyboard.press(k); await page.waitForFunction(() => !window.__fw.moving(), null, { timeout: 60000 }).catch(() => console.log("slow settle")); await page.waitForTimeout(2500);
    out.push(await page.evaluate(() => { const t = globalThis.__warmTimes; return { n: globalThis.__warmed - globalThis.__w0, slices: t.length, total: Math.round(t.reduce((a, x) => a + x, 0)), maxSlice: Math.round(Math.max(0, ...t)), wall: Math.round((globalThis.__warmDone ?? 0) - (globalThis.__warmStart ?? 0)), mb: +(globalThis.__sprites().bytes / 2 ** 20).toFixed(1) }; }));
  }
  console.log(e, vw, lv, JSON.stringify(out));
}
await b.close();
}
