// usage: node crop.mjs <out.png> <x> <y> <w> <h> <zoom> <a.png> <b.png> ...  (region in device px; columns side by side, nearest-neighbor)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const pw = createRequire('/Users/lucas/dev/feels-on-wheels/.claude/worktrees/ff-canvas-perf/package.json')('@playwright/test');
const [out, x, y, w, h, z, ...files] = process.argv.slice(2);
const b = await pw.chromium.launch();
const page = await b.newPage();
const data = await page.evaluate(async ([list, names, x, y, w, h, z]) => {
  const imgs = await Promise.all(list.map(async (s) => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); return i; }));
  const top = 20, gap = 6;
  const c = new OffscreenCanvas(imgs.length * (w * z + gap), h * z + top);
  const g = c.getContext('2d'); g.fillStyle = '#777'; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingEnabled = false; g.font = '15px sans-serif';
  imgs.forEach((im, i) => { const ox = i * (w * z + gap); g.fillStyle = '#000'; g.fillText(names[i], ox + 4, 15); g.drawImage(im, x, y, w, h, ox, top, w * z, h * z); });
  const buf = new Uint8Array(await (await c.convertToBlob()).arrayBuffer()); let s = ''; for (const v of buf) s += String.fromCharCode(v); return btoa(s);
}, [files.map((f) => fs.readFileSync(f).toString('base64')), files.map((f) => path.basename(f, '.png').split('-').at(-1).replace(/^(10|15|20)$/, 'p3-$1')), +x, +y, +w, +h, +z]);
fs.writeFileSync(out, Buffer.from(data, 'base64'));
await b.close();
