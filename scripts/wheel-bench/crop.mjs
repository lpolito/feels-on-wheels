// node crop.mjs <a.png> <b.png> <out.png> : finds the 3 densest diff regions and writes a+b+diff crops, 4x
import { createRequire } from 'node:module'; import fs from 'node:fs';
const pw = createRequire(import.meta.url)('@playwright/test');
const [a, b, out] = process.argv.slice(2);
const br = await pw.chromium.launch(); const p = await br.newPage();
const data = await p.evaluate(async ([a, b]) => {
  const load = async (s) => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); return i; };
  const [ia, ib] = [await load(a), await load(b)]; const W = ia.width, H = ia.height;
  const c = new OffscreenCanvas(W, H); const x = c.getContext('2d');
  x.drawImage(ia, 0, 0); const da = x.getImageData(0, 0, W, H).data; x.drawImage(ib, 0, 0); const db = x.getImageData(0, 0, W, H).data;
  const T = 40; let best = []; 
  for (let ty = 0; ty + T <= H; ty += T) for (let tx = 0; tx + T <= W; tx += T) { let s = 0; for (let y = ty; y < ty + T; y++) for (let xx = tx; xx < tx + T; xx++) { const i = (y * W + xx) * 4; s += Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2])); } best.push([s, tx, ty]); }
  best.sort((p, q) => q[0] - p[0]); best = best.slice(0, 3); globalThis.__best = best;
  const Z = 6, out = new OffscreenCanvas(3 * T * Z + 20, best.length * (T * Z + 10)); const o = out.getContext('2d'); o.imageSmoothingEnabled = false; o.fillStyle = '#f0f'; o.fillRect(0, 0, out.width, out.height);
  const d = new ImageData(W, H); for (let i = 0; i < da.length; i += 4) { const m = Math.min(255, 3 * Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]))); d.data[i] = m; d.data[i + 1] = m; d.data[i + 2] = m; d.data[i + 3] = 255; }
  const dc = new OffscreenCanvas(W, H); dc.getContext('2d').putImageData(d, 0, 0);
  best.forEach(([, tx, ty], k) => { [ia, ib, dc].forEach((img, j) => o.drawImage(img, tx, ty, T, T, j * (T * Z + 10), k * (T * Z + 10), T * Z, T * Z)); });
  const blob = await out.convertToBlob(); const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (const v of buf) s += String.fromCharCode(v); return JSON.stringify(best) + '|' + btoa(s);
}, [fs.readFileSync(a).toString('base64'), fs.readFileSync(b).toString('base64')]);
const [bj, b64] = data.split('|'); console.log('tiles (sum,x,y)', bj); fs.writeFileSync(out, Buffer.from(b64, 'base64')); await br.close();
