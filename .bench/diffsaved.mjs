import { createRequire } from 'node:module';
import fs from 'node:fs';
const pw = createRequire('/Users/lucas/dev/feels-on-wheels/.claude/worktrees/ff-canvas-perf/package.json')('@playwright/test');
const [dir, prefix] = process.argv.slice(2);
const b = await pw.chromium.launch(); const p = await b.newPage();
for (const k of ['rest', 'pinchIn', 'pinchOut']) for (const v of ['fix', 'v1', 'v12', 'v123', 'v4', 'v5']) {
  const a = fs.readFileSync(`${dir}/${prefix}-${k}-fixref.png`).toString('base64'), c = fs.readFileSync(`${dir}/${prefix}-${k}-${v}.png`).toString('base64');
  const r = await p.evaluate(async ([a, b]) => { const load = async (s) => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); return i; }; const [ia, ib] = [await load(a), await load(b)]; const c = new OffscreenCanvas(ia.width, ia.height); const x = c.getContext('2d'); x.drawImage(ia, 0, 0); const da = x.getImageData(0, 0, c.width, c.height).data; x.drawImage(ib, 0, 0); const db = x.getImageData(0, 0, c.width, c.height).data; let n8 = 0, n64 = 0, max = 0; for (let i = 0; i < da.length; i += 4) { const m = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2])); if (m > 8) n8++; if (m > 64) n64++; if (m > max) max = m; } return `>8: ${n8}  >64: ${n64}  max ${max}`; }, [a, c]);
  console.log(prefix, k.padEnd(8), v.padEnd(5), r);
}
await b.close();
