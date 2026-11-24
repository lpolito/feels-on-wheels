// node .bench/shot.mjs <engine> <baseUrl> <outPrefix> <VWxVHxDPR> <route...>   (env GLMODE, SCHEME=dark, FORCED=1)
import { createRequire } from 'node:module';
const pw = createRequire(import.meta.url)('@playwright/test');
const [engine, base, out, size, ...routes] = process.argv.slice(2);
const [w, h, d] = size.split('x').map(Number);
const b = await pw[engine].launch({ headless: process.env.HEADLESS !== '0' });
const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: d, colorScheme: process.env.SCHEME || 'light', ...(process.env.FORCED ? { forcedColors: 'active' } : {}) });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.error('PAGEERROR', e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('CONSOLE', m.text()); });
if (process.env.GLMODE) await page.addInitScript((m) => { globalThis.__glLabels = m; }, process.env.GLMODE);
for (const r of routes) {
  await page.goto(base + r);
  await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving(), null, { timeout: 20000 });
  await page.waitForTimeout(1000);
  const name = `${out}${r.replaceAll('/', '_') || '_'}.png`;
  await page.screenshot({ path: name });
  console.log(name, await page.evaluate(() => (globalThis.__glStats ? JSON.stringify(globalThis.__glStats()) : '')));
}
await b.close();
