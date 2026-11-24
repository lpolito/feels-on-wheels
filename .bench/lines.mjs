import { createRequire } from 'node:module';
const pw = createRequire('/Users/lucas/dev/feels-on-wheels/.claude/worktrees/ff-canvas-perf/package.json')('@playwright/test');
const b = await pw.chromium.launch({ headless: true });
for (const [vw, vh, d] of [[390, 844, 3], [1440, 900, 2]]) {
  const page = await (await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: d })).newPage();
  for (const v of ['/', '/angry', '/angry/aggressive', '/body/chest', '/body/chest/racing-heart']) {
    await page.goto('http://localhost:4564' + v);
    await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving());
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => globalThis.__viewFits().map((x) => { const two = x.items.filter((i) => i.lines === 2); return `${x.selected ?? 'wheel'}: ${x.items.length} lines, ${two.length / 2} two-line [${[...new Set(two.map((i) => i.text))].slice(0, 4).join(', ')}]`; }));
    console.log(vw, v, '\n  ' + r.slice(0, 4).join('\n  '));
  }
}
await b.close();
