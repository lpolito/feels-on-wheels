// node .bench/micro.mjs <engine> <page> <query...>  — headed; prints median/p90 frame and share of frames > 25 ms
import { createRequire } from 'node:module';
const pw = createRequire(import.meta.url)('@playwright/test');
const [engine, pageName, ...queries] = process.argv.slice(2);
const b = await pw[engine].launch({ headless: false });
const ctx = await b.newContext({ viewport: { width: Number(process.env.VW || 390), height: Number(process.env.VH || 844) }, deviceScaleFactor: Number(process.env.DPR || 3) });
for (const qs of queries) {
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('PAGEERROR', e.message));
  await page.goto(`http://localhost:4914/${pageName}?${qs}`);
  await page.waitForFunction(() => window.done, null, { timeout: 60000 });
  const d = await page.evaluate(() => window.done);
  console.log(engine.padEnd(8), qs.padEnd(26), `med ${d.med.toFixed(1)} p90 ${d.p90.toFixed(1)} >25ms ${(100 * d.drop).toFixed(0)}%`);
  await page.close();
}
await b.close();
