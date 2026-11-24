import { createRequire } from 'node:module'; import fs from 'node:fs';
const pw = createRequire(import.meta.url)('@playwright/test');
const br = await pw.chromium.launch(); const p = await br.newPage();
for (const t of process.argv.slice(2)) {
  const r = await p.evaluate(async ([a, b]) => {
    const load = async (s) => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); return i; };
    const ink = async (s) => { const i = await load(s); const c = new OffscreenCanvas(i.width, i.height); const x = c.getContext('2d'); x.drawImage(i, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let k = 0; for (let j = 0; j < d.length; j += 4) k += 255 - (d[j] + d[j + 1] + d[j + 2]) / 3; return k / 255; };
    return [await ink(a), await ink(b)];
  }, [fs.readFileSync(`${t}-a.png`).toString('base64'), fs.readFileSync(`${t}-b.png`).toString('base64')]);
  console.log(t.padEnd(50), 'dark px-equivalents main', r[0].toFixed(0), 'new', r[1].toFixed(0), 'diff', (r[1] - r[0]).toFixed(0), ((r[1] / r[0] - 1) * 100).toFixed(2) + '%');
}
await br.close();
