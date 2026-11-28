// node .bench/diffview.mjs <a.png> <b.png> <out.png> : a, b and their difference (pixels over 64 in red), side by side at 1/3 size
import { createRequire } from 'node:module'; import fs from 'node:fs';
const pw = createRequire(new URL('../package.json', import.meta.url))('@playwright/test');
const [a, b, out] = process.argv.slice(2);
const br = await pw.chromium.launch(); const p = await br.newPage();
const b64 = await p.evaluate(async ([a, b]) => {
  const load = async (s) => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); return i; };
  const [ia, ib] = [await load(a), await load(b)]; const W = ia.width, H = ia.height;
  const c = new OffscreenCanvas(W, H); const x = c.getContext('2d');
  x.drawImage(ia, 0, 0); const da = x.getImageData(0, 0, W, H); x.drawImage(ib, 0, 0); const db = x.getImageData(0, 0, W, H);
  const d = new ImageData(W, H);
  for (let i = 0; i < da.data.length; i += 4) {
    const m = Math.max(Math.abs(da.data[i] - db.data[i]), Math.abs(da.data[i + 1] - db.data[i + 1]), Math.abs(da.data[i + 2] - db.data[i + 2]));
    const v = da.data[i] * 0.3;
    d.data[i] = m > 64 ? 255 : v; d.data[i + 1] = m > 64 ? 0 : v; d.data[i + 2] = m > 64 ? 0 : v; d.data[i + 3] = 255;
  }
  // Grow the red so single pixels show at 1/3 size.
  const dc = new OffscreenCanvas(W, H); const dg = dc.getContext('2d'); dg.putImageData(d, 0, 0);
  const S = 3, o = new OffscreenCanvas(3 * Math.ceil(W / S) + 20, Math.ceil(H / S)); const og = o.getContext('2d');
  og.fillStyle = '#f0f'; og.fillRect(0, 0, o.width, o.height);
  og.drawImage(ia, 0, 0, W / S, H / S); og.drawImage(ib, W / S + 10, 0, W / S, H / S); og.drawImage(dc, 2 * (W / S + 10), 0, W / S, H / S);
  og.fillStyle = '#f00';
  for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) { const i = (y * W + xx) * 4; if (d.data[i] === 255 && d.data[i + 1] === 0) og.fillRect(2 * (W / S + 10) + xx / S - 1, y / S - 1, 3, 3); }
  const blob = await o.convertToBlob(); const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (const v of buf) s += String.fromCharCode(v); return btoa(s);
}, [fs.readFileSync(a).toString('base64'), fs.readFileSync(b).toString('base64')]);
fs.writeFileSync(out, Buffer.from(b64, 'base64')); await br.close();
