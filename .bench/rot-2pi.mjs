// "Annoyed" drawn with fillText at rotation 0, 2π (as the settle frame draws it) and 1e-5, per engine, at 3x.
// Writes a 4x crop of the three side by side for each engine.
import { createRequire } from 'node:module'; import fs from 'node:fs';
const pw = createRequire(new URL('../package.json', import.meta.url))('@playwright/test');
const out = process.argv[2];
for (const e of ['webkit', 'chromium', 'firefox']) {
  const b = await pw[e].launch();
  const page = await (await b.newContext({ deviceScaleFactor: 3 })).newPage();
  await page.setContent('<body style="margin:0"></body>');
  const r = await page.evaluate(() => {
    const dpr = 3, W = 140, H = 40;
    const draw = (rot) => {
      const c = Object.assign(document.createElement('canvas'), { width: W * dpr, height: H * dpr }); document.body.append(c);
      const g = c.getContext('2d', { alpha: false });
      g.fillStyle = '#b5192b'; g.fillRect(0, 0, c.width, c.height);
      g.setTransform(dpr * Math.cos(rot), dpr * Math.sin(rot), -dpr * Math.sin(rot), dpr * Math.cos(rot), dpr * 70, dpr * 20);
      g.font = '800 27.6px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
      g.fillText('Annoyed', 0, 0);
      return c;
    };
    const cs = [0, 2 * Math.PI, 1e-5].map(draw);
    const px = (c) => c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const cmp = (a, b) => { let hard = 0; for (let i = 0; i < a.length; i += 4) if (Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])) > 64) hard++; return hard; };
    const [p0, p2, p5] = cs.map(px);
    // The whole word at 2x its device pixels, at 0 above 2π, with the difference (over 64) in black below.
    const o = document.createElement('canvas'); const Z = 2, w = cs[0].width, h = cs[0].height; o.width = w * Z; o.height = 3 * h * Z + 20; const og = o.getContext('2d'); og.imageSmoothingEnabled = false; og.fillStyle = '#f0f'; og.fillRect(0, 0, o.width, o.height);
    og.drawImage(cs[0], 0, 0, w * Z, h * Z); og.drawImage(cs[1], 0, h * Z + 10, w * Z, h * Z);
    const d = new ImageData(w, h); for (let i = 0; i < p0.length; i += 4) { const m = Math.max(Math.abs(p0[i] - p2[i]), Math.abs(p0[i + 1] - p2[i + 1]), Math.abs(p0[i + 2] - p2[i + 2])) > 64 ? 0 : 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = m; d.data[i + 3] = 255; }
    const dc = document.createElement('canvas'); dc.width = w; dc.height = h; dc.getContext('2d').putImageData(d, 0, 0); og.drawImage(dc, 0, 2 * (h * Z + 10), w * Z, h * Z);
    return { '2π vs 0': cmp(p2, p0), '1e-5 vs 0': cmp(p5, p0), '2π vs 1e-5': cmp(p2, p5), png: o.toDataURL() };
  });
  fs.writeFileSync(`${out}-${e}.png`, Buffer.from(r.png.split(',')[1], 'base64'));
  delete r.png;
  console.log(e, JSON.stringify(r));
  await b.close();
}
