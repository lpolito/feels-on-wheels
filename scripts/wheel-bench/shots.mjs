import { createRequire } from 'node:module';
import fs from 'node:fs';
const pw = createRequire(import.meta.url)('@playwright/test');
const [A, B, outDir] = process.argv.slice(2);
const views = ['/', '/angry', '/angry/aggressive', '/angry/aggressive/hostile', '/body', '/body/chest/racing-heart', '/happy/playful'];
const sizes = [['phone', 390, 844, 3], ['desktop', 1440, 900, 2], ['small', 800, 600, 1]];
const extras = [['plain', {}], ['dark', { colorScheme: 'dark' }], ['contrast', { contrast: 'more' }], ['forced', { forcedColors: 'active' }]];
const shot = async (page, base, v) => { await page.goto(base + v); await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving(), null, { timeout: 20000 }); await page.waitForTimeout(1200); return page.locator('#wheel').screenshot({ animations: 'disabled' }); };
for (const e of (process.env.ENGINES || 'chromium webkit firefox').split(' ')) {
  const b = await pw[e].launch();
  const cmp = await (await b.newContext()).newPage();
  for (const [sn, w, h, d] of sizes) for (const [xn, x] of extras) {
    if (process.env.SIZES && !process.env.SIZES.split(' ').includes(sn)) continue;
    if (process.env.EXTRAS && !process.env.EXTRAS.split(' ').includes(xn)) continue;
    if (xn === 'forced' && e === 'webkit') continue;
    if ((xn === 'contrast' || xn === 'forced' || xn === 'dark') && sn === 'small') continue;
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: d, ...x });
    const page = await ctx.newPage();
    for (const v of views) {
      const [pa, pb] = [await shot(page, A, v), await shot(page, B, v)];
      const r = await cmp.evaluate(async ([a, b]) => {
        const load = async (s) => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); return i; };
        const [ia, ib] = [await load(a), await load(b)];
        if (ia.width !== ib.width || ia.height !== ib.height) return { size: true };
        const c = new OffscreenCanvas(ia.width, ia.height); const x = c.getContext('2d');
        x.drawImage(ia, 0, 0); const da = x.getImageData(0, 0, c.width, c.height).data; x.drawImage(ib, 0, 0); const db = x.getImageData(0, 0, c.width, c.height).data;
        let n8 = 0, n64 = 0, n128 = 0, max = 0;
        for (let i = 0; i < da.length; i += 4) { const m = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2])); if (m > 8) n8++; if (m > 64) n64++; if (m > 128) n128++; if (m > max) max = m; }
        return { px: c.width * c.height, n8, n64, n128, max };
      }, [pa.toString('base64'), pb.toString('base64')]);
      const tag = `${e}-${sn}-${xn}-${v.replaceAll('/', '_') || '_'}`;
      if (r.n64 > 0 || r.size) { fs.writeFileSync(`${outDir}/${tag}-a.png`, pa); fs.writeFileSync(`${outDir}/${tag}-b.png`, pb); }
      console.log(tag.padEnd(58), r.size ? 'SIZE DIFFERS' : `>8: ${(100 * r.n8 / r.px).toFixed(3)}%  >64: ${r.n64}  >128: ${r.n128}  max ${r.max}`);
    }
    await ctx.close();
  }
  await b.close();
}
