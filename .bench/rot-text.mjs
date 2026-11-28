// Does text drawn at rotation 0 look different from text at a rotation of about 1e-5 rad? Per engine, at 3x:
// fillText (how the opened word is drawn) and drawImage of a cached label bitmap (how other labels are drawn).
import { createRequire } from 'node:module';
const pw = createRequire(new URL('../package.json', import.meta.url))('@playwright/test');
for (const e of ['chromium', 'webkit', 'firefox']) {
  const b = await pw[e].launch();
  const page = await (await b.newContext({ deviceScaleFactor: 3 })).newPage();
  await page.setContent('<canvas id=c width=600 height=300></canvas>');
  for (const onPage of [false, true]) {
  const r = await page.evaluate((onPage) => {
    window.__onPage = onPage;
    const dpr = 3, W = 600, H = 300;
    const draw = (rot, dx, how) => {
      const c = window.__onPage ? Object.assign(document.createElement('canvas'), { width: W, height: H }) : new OffscreenCanvas(W, H);
      if (window.__onPage) { c.style.width = W / dpr + 'px'; document.body.append(c); }
      const g = c.getContext('2d', { alpha: false });
      g.fillStyle = '#b00020'; g.fillRect(0, 0, W, H);
      const x = 60 + dx, y = 50;
      if (how === 'text') {
        g.setTransform(dpr * Math.cos(rot), dpr * Math.sin(rot), -dpr * Math.sin(rot), dpr * Math.cos(rot), dpr * x, dpr * y);
        g.font = '800 18.5px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
        g.fillText('Angry', 0, 0);
      } else {
        const s = new OffscreenCanvas(60 * dpr, 30 * dpr); const sg = s.getContext('2d');
        sg.scale(dpr, dpr); sg.font = '600 10.5px system-ui, sans-serif'; sg.textAlign = 'center'; sg.textBaseline = 'middle'; sg.fillStyle = '#fff'; sg.fillText('Furious', 30, 15);
        const bm = s.transferToImageBitmap();
        g.setTransform(dpr * Math.cos(rot), dpr * Math.sin(rot), -dpr * Math.sin(rot), dpr * Math.cos(rot), dpr * x, dpr * y);
        g.drawImage(bm, -30, -15, 60, 30);
      }
      return g.getImageData(0, 0, W, H).data;
    };
    const cmp = (a, b) => { let n = 0, hard = 0; for (let i = 0; i < a.length; i += 4) { const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])); if (d > 8) n++; if (d > 64) hard++; } return `${n}/${hard}`; };
    const out = {};
    for (const how of ['text', 'bitmap']) {
      const zero = draw(0, 0, how);
      out[how] = {
        'rot 1e-5 vs 0': cmp(draw(1.2e-5, 0, how), zero),
        'rot 1e-3 vs 0': cmp(draw(1e-3, 0, how), zero),
        'move 0.01px vs 0 (rot 0)': cmp(draw(0, 0.0076, how), zero),
        'rot 1e-5 vs rot 2e-5': cmp(draw(1.2e-5, 0, how), draw(2.4e-5, 0, how)),
      };
    }
    return out;
  }, onPage);
  console.log(e, onPage ? 'page canvas' : 'offscreen', JSON.stringify(r.text));
  }
  await b.close();
}
