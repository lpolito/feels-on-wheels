import { createRequire } from 'node:module';
const pw = createRequire('/Users/lucas/dev/feels-on-wheels/.claude/worktrees/ff-canvas-perf/package.json')('@playwright/test');
const b = await pw.webkit.launch({ headless: false });
const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })).newPage();
page.on('pageerror', (e) => console.log('ERR', e.message)); page.on('console', (m) => console.log('LOG', m.text()));
await page.addInitScript(() => { globalThis.__lv = 'v123f'; });
await page.goto('http://localhost:4564/angry/aggressive/hostile');
await page.waitForTimeout(4000);
console.log(await page.evaluate(() => ({ fw: !!window.__fw, moving: window.__fw?.moving(), cam: window.__fw?.camera(), warmed: globalThis.__warmed, renders: globalThis.__renders })));
await page.evaluate(() => document.querySelector("#a11y-tree [role=\"treeitem\"][tabindex=\"0\"]").focus()); for (const k of ["ArrowLeft","ArrowLeft","ArrowRight"]) { const t=Date.now(); await page.keyboard.press(k); try { await page.waitForFunction(() => !window.__fw.moving(), null, {timeout: 8000}); } catch (e) { console.log("stuck", k); } console.log(k, Date.now()-t, await page.evaluate(() => ({ cam: window.__fw.camera(), t: globalThis.__warmTimes.slice(-5).map(Math.round) }))); await page.waitForTimeout(1500); }
console.log(await page.evaluate(() => ({ moving: window.__fw?.moving(), cam: window.__fw?.camera() })));
await b.close();
