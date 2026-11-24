import { createRequire } from 'node:module';
const pw = createRequire('/Users/lucas/dev/feels-on-wheels/.claude/worktrees/ff-canvas-perf/package.json')('@playwright/test');
const b = await pw.chromium.launch({ headless: false });
const ctx = await b.newContext({ viewport: { width: Number(process.env.VW || 390), height: Number(process.env.VH || 844) }, deviceScaleFactor: Number(process.env.DPR || 3) });
const page = await ctx.newPage();
await page.addInitScript(() => { window.__per = []; const raf = requestAnimationFrame.bind(window); let r = 0, d = 0; const f = () => { const R = globalThis.__renders ?? 0, D = globalThis.__draws ?? 0; if (D > d) window.__per.push([R - r, D - d]); r = R; d = D; raf(f); }; raf(f); });
const run = async (name, fn) => { await page.evaluate(() => { window.__per.length = 0; }); await fn(); await page.waitForFunction(() => !window.__fw.moving(), null, { timeout: 30000 }); await page.waitForTimeout(300);
  const per = await page.evaluate(() => window.__per); const rs = per.map((p) => p[0]).sort((a, b) => a - b); const ds = per.map((p) => p[1]);
  const ev = await page.evaluate(() => { const e = globalThis.__evicts ?? 0, d = e - (window.__ev0 ?? 0); window.__ev0 = e; return d; }); console.log(name.padEnd(28), 'evicts', ev, 'frames', per.length, 'renders/frame med', rs[rs.length >> 1], 'p90', rs[Math.floor(rs.length * 0.9)], 'max', rs.at(-1), 'total', rs.reduce((a, b) => a + b, 0), 'labels/frame med', ds.sort((a, b) => a - b)[ds.length >> 1]); };
await page.goto((process.argv[2] || 'http://localhost:4300') + '/angry/aggressive/hostile');
await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving(), null, { timeout: 20000 });
await page.evaluate(() => document.querySelector('#a11y-tree [role="treeitem"][tabindex="0"]').focus());
for (let i = 0; i < 2; i++) {
  await run('ArrowLeft (out a ring)', () => page.keyboard.press('ArrowLeft'));
  await run('ArrowLeft (out a ring)', () => page.keyboard.press('ArrowLeft'));
  await run('ArrowRight (in a ring)', () => page.keyboard.press('ArrowRight'));
  await run('ArrowRight (in a ring)', () => page.keyboard.press('ArrowRight'));
}
await run('spin 10 steps', async () => { for (let k = 0; k < 10; k++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(70); } });
await run('pinch 2.5 s', () => page.evaluate(async () => { const wheel = document.getElementById('wheel'); const rect = wheel.getBoundingClientRect(); const cam = window.__fw.camera(); let sign = -1; const end = performance.now() + 2500; while (performance.now() < end) { for (let k = 0; k < 8; k++) wheel.dispatchEvent(new WheelEvent('wheel', { deltaY: 30 * sign, ctrlKey: true, clientX: rect.left + cam.cx, clientY: rect.top + cam.cy, bubbles: true, cancelable: true })); sign = -sign; await new Promise((r) => setTimeout(r, 120)); } }));
await b.close();
