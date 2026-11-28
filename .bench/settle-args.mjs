// What the renderer is given in the frames around the settle of "out to core", in today's build.
import { createRequire } from 'node:module';
const pw = createRequire(new URL('../package.json', import.meta.url))('@playwright/test');
const b = await pw.chromium.launch();
const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })).newPage();
await page.addInitScript(() => { globalThis.__lv = 'fix'; });
await page.goto(process.argv[2] + '/angry/annoyed/irritable');
await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving());
await page.waitForTimeout(1500);
await page.evaluate(() => document.querySelector('#a11y-tree [role="treeitem"][tabindex="0"]').focus());
await page.keyboard.press('ArrowLeft');
await page.waitForFunction(() => !window.__fw.moving());
await page.waitForTimeout(800);
await page.evaluate(() => { globalThis.__args = []; globalThis.__boldLog = []; const raf = requestAnimationFrame.bind(window); globalThis.__bold = []; const f = () => { globalThis.__bold.push(globalThis.__boldLog.splice(0)); raf(f); }; raf(f); });
await page.keyboard.press('ArrowLeft');
await page.waitForFunction(() => !window.__fw.moving());
await page.waitForTimeout(300);
const args = (await page.evaluate(() => globalThis.__args)).map((x) => JSON.parse(x));
const s = args.findIndex((x, i) => i > 0 && !x.moving && args[i - 1].moving);
const keys = Object.keys(args[0]);
for (let i = Math.max(1, s - 3); i <= Math.min(args.length - 1, s + 1); i++) {
  const d = keys.filter((k) => JSON.stringify(args[i][k]) !== JSON.stringify(args[i - 1][k]));
  console.log(i - s, args[i].moving ? 'moving' : 'settled', d.map((k) => `${k}: ${String(JSON.stringify(args[i - 1][k])).slice(0, 60)} -> ${String(JSON.stringify(args[i][k])).slice(0, 60)}`).join(' | '));
}
console.log('frames', args.length, 'settle at', s);
const bold = await page.evaluate(() => globalThis.__bold);
const nonEmpty = bold.filter((x) => x.length);
for (const x of nonEmpty.slice(-4)) console.log(x.join(' '));
await b.close();
