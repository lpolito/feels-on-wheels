// usage: node shots-p3.mjs <outDir> name=url ... ; first build is the reference (main).
// Per engine/size/view: saves each build's wheel PNG, pixel diff counts against the first,
// and a side-by-side sheet: a crop of labels at 1:1 device pixels, magnified 3x, one column per build.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const pw = createRequire('/Users/lucas/dev/feels-on-wheels/.claude/worktrees/ff-canvas-perf/package.json')('@playwright/test');
const [outDir, ...specs] = process.argv.slice(2);
const builds = specs.map((s) => s.split('='));
const views = [['wheel', '/'], ['outer-open', '/angry/aggressive/hostile'], ['body', '/body']];
const sizes = [['phone', 390, 844, 3], ['desktop', 1440, 900, 2], ['small', 800, 600, 1]];
fs.mkdirSync(outDir, { recursive: true });
const shot = async (page, base, v) => {
  await page.goto(base + v);
  await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving(), null, { timeout: 20000 });
  await page.waitForTimeout(1200);
  return page.locator('#wheel').screenshot({ animations: 'disabled' });
};
for (const e of (process.env.ENGINES || 'chromium webkit firefox').split(' ')) {
  const b = await pw[e].launch({ headless: process.env.HEADED !== '1' });
  const cmp = await (await b.newContext()).newPage();
  for (const [sn, w, h, d] of sizes) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: d });
    const page = await ctx.newPage();
    for (const [vn, v] of views) {
      const pngs = [];
      for (const [name, url] of builds) {
        const p = await shot(page, url, v);
        fs.writeFileSync(`${outDir}/${e}-${sn}-${vn}-${name}.png`, p);
        pngs.push(p.toString('base64'));
      }
      const r = await cmp.evaluate(async ([list, names, crops, d]) => {
        const load = async (s) => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); return i; };
        const imgs = await Promise.all(list.map(load));
        const W = imgs[0].width, H = imgs[0].height;
        const c = new OffscreenCanvas(W, H); const x = c.getContext('2d', { willReadFrequently: true });
        x.drawImage(imgs[0], 0, 0); const ref = x.getImageData(0, 0, W, H).data;
        const stats = [];
        for (const im of imgs.slice(1)) {
          if (im.width !== W || im.height !== H) { stats.push('size differs'); continue; }
          x.clearRect(0, 0, W, H); x.drawImage(im, 0, 0); const o = x.getImageData(0, 0, W, H).data;
          let n8 = 0, n64 = 0;
          for (let i = 0; i < o.length; i += 4) { const m = Math.max(Math.abs(o[i] - ref[i]), Math.abs(o[i + 1] - ref[i + 1]), Math.abs(o[i + 2] - ref[i + 2])); if (m > 8) n8++; if (m > 64) n64++; }
          stats.push(`>8 ${(100 * n8 / (W * H)).toFixed(2)}% >64 ${n64}`);
        }
        // Sheet: one row per crop, one column per build; each crop is cw×ch device px magnified by Z.
        const Z = 3, cw = Math.round(Math.min(W / 3, 260)), ch = Math.round(Math.min(H / 4, 120)), gap = 8, top = 18;
        const sheet = new OffscreenCanvas(imgs.length * (cw * Z + gap), crops.length * (ch * Z + gap + top));
        const sx = sheet.getContext('2d'); sx.fillStyle = '#888'; sx.fillRect(0, 0, sheet.width, sheet.height); sx.imageSmoothingEnabled = false;
        sx.font = '14px sans-serif';
        crops.forEach(([fx, fy], row) => {
          const x0 = Math.round(fx * W - cw / 2), y0 = Math.round(fy * H - ch / 2);
          imgs.forEach((im, col) => {
            const ox = col * (cw * Z + gap), oy = row * (ch * Z + gap + top);
            sx.fillStyle = '#000'; sx.fillText(names[col], ox + 4, oy + 14);
            sx.drawImage(im, x0, y0, cw, ch, ox, oy + top, cw * Z, ch * Z);
          });
        });
        const blob = await sheet.convertToBlob();
        const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
        return { stats, sheet: btoa(s) };
      }, [pngs, builds.map((b) => b[0]), JSON.parse(process.env.CROPS || '[[0.5,0.5],[0.7,0.35]]'), d]);
      fs.writeFileSync(`${outDir}/${e}-${sn}-${vn}-SHEET.png`, Buffer.from(r.sheet, 'base64'));
      console.log(`${e}-${sn}-${vn}`.padEnd(30), builds.slice(1).map((bb, i) => `${bb[0]}: ${r.stats[i]}`).join('  |  '));
    }
    await ctx.close();
  }
  await b.close();
}
