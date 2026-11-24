// node micro.mjs <engine> <query...>  — headed; prints median/p90 frame and (firefox) GPU state
import { createRequire } from 'node:module';
const pw = createRequire(import.meta.url)('@playwright/test');
const [engine, ...queries] = process.argv.slice(2);
const b = await pw[engine].launch({ headless: false, ...(engine === 'firefox' ? { firefoxUserPrefs: { 'gfx.canvas.accelerated.debug': true, ...JSON.parse(process.env.PREFS || '{}') } } : {}) });
const ctx = await b.newContext({ viewport: { width: Number(process.env.VW || 390), height: Number(process.env.VH || 844) }, deviceScaleFactor: Number(process.env.DPR || 3) });
for (const qs of queries) {
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('PAGEERROR', e.message));
  await page.goto('http://localhost:4300/' + (process.env.PAGE || '') + '?' + qs);
  await page.waitForFunction(() => window.done, null, { timeout: 120000 });
  const d = await page.evaluate(() => window.done);
  let gpu = '';
  if (engine === 'firefox') {
    const r = await page.evaluate(() => { const c = document.getElementById('c').getBoundingClientRect(); return { x: c.right - 5, y: c.top + 3 }; });
    const shot = await page.screenshot({ clip: { x: r.x, y: r.y, width: 2, height: 2 } });
    const px = await page.evaluate(async (b64) => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = new OffscreenCanvas(4, 4); const x = c.getContext('2d'); x.drawImage(i, 0, 0); return Array.from(x.getImageData(0, 0, 1, 1).data); }, shot.toString('base64'));
    gpu = px[1] > 200 && px[0] < 60 && px[2] < 60 ? 'GPU' : 'sw';
  }
  console.log(engine.padEnd(8), qs.padEnd(26), `med ${d.med.toFixed(1)} p90 ${d.p90.toFixed(1)}`, gpu);
  await page.close();
}
await b.close();
