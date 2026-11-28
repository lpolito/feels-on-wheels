// Where the sharpening after the wheel stops comes from, and what skipping the exact-size render at rest costs.
// Counts only (no frame times), headless. Per move: when the motion stopped being visible, when the camera settled,
// what the settle frame changed, and how far the resting labels are from a fresh load of the same URL.
// usage: ENGINE=chromium VW=390 VH=844 DPR=3 LVS="fix v1 v12f v1s v12s" node .bench/sharpen.mjs http://localhost:4610
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const pw = createRequire(new URL('../package.json', import.meta.url))('@playwright/test');
const base = process.argv[2];
const e = process.env.ENGINE || 'chromium';
const VW = Number(process.env.VW || 390), VH = Number(process.env.VH || 844), DPR = Number(process.env.DPR || 3);
const OUT = new URL(`./sharpen-shots/${e}-${VW}/`, import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const b = await pw[e].launch();
const ctxOpts = { viewport: { width: VW, height: VH }, deviceScaleFactor: DPR };

const MOVES = [['ArrowLeft', 'out to middle'], ['ArrowLeft', 'out to core'], ['ArrowRight', 'in to middle'], ['ArrowRight', 'in to outer']];
const START = '/angry/annoyed/irritable';

async function open(lv, url, trace) {
  const page = await (await b.newContext(ctxOpts)).newPage();
  page.on('pageerror', (x) => console.error('PAGEERROR', x.message));
  await page.addInitScript(([lv, trace]) => { globalThis.__lv = lv; if (trace) { globalThis.__trace = []; globalThis.__traceDiff = true; } }, [lv, trace]);
  await page.goto(base + url);
  await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving(), null, { timeout: 20000 });
  await page.waitForTimeout(2000);
  return page;
}

const shot = (page) => page.locator('#wheel').screenshot();

/** Pixels differing by more than 8 and by more than 64 in any channel, between two PNG screenshots (decoded in a page). */
let diffPage;
async function diff(a, c) {
  diffPage ??= await (await b.newContext()).newPage();
  return diffPage.evaluate(async ([a, c]) => {
    const load = async (s) => { const im = await createImageBitmap(await (await fetch('data:image/png;base64,' + s)).blob()); const cv = new OffscreenCanvas(im.width, im.height); const g = cv.getContext('2d'); g.drawImage(im, 0, 0); return g.getImageData(0, 0, im.width, im.height).data; };
    const x = await load(a), y = await load(c);
    let n = 0, hard = 0;
    for (let i = 0; i < x.length; i += 4) {
      const d = Math.max(Math.abs(x[i] - y[i]), Math.abs(x[i + 1] - y[i + 1]), Math.abs(x[i + 2] - y[i + 2]));
      if (d > 8) n++; if (d > 64) hard++;
    }
    return { n, hard };
  }, [a.toString('base64'), c.toString('base64')]);
}

const today = [];
const refs = new Map();
async function reference(url) {
  if (!refs.has(url)) { const p = await open('fix', url, false); await p.evaluate(() => document.querySelector('#a11y-tree [role="treeitem"][tabindex="0"]').focus()); await p.waitForTimeout(300); refs.set(url, await shot(p)); await p.context().close(); }
  return refs.get(url);
}

for (const lv of (process.env.LVS || 'fix v1 v12f v1s v12s').split(' ')) {
  const page = await open(lv, START, true);
  const radius = (await page.evaluate(() => window.__fw.viewport())).radius;
  await page.evaluate(() => document.querySelector('#a11y-tree [role="treeitem"][tabindex="0"]').focus());
  const rows = [];
  const tapUnpredicted = () => page.evaluate(() => {
    const fw = window.__fw;
    const s = fw.state();
    const predicted = new Set(globalThis.__viewFits().map((v) => v.selected));
    const here = fw.pathOf(s.selected);
    const canvas = document.getElementById('wheel');
    for (let i = 0; i < 1000; i++) {
      let path; try { path = fw.pathOf(i); } catch { break; }
      if (!path || path === here || predicted.has(path) || path.split('/').length !== here.split('/').length) continue;
      const p = fw.segmentScreenPoint(path);
      if (p.x < 30 || p.y < 30 || p.x > innerWidth - 30 || p.y > innerHeight * 0.55) continue;
      if (document.elementFromPoint(p.x, p.y) !== canvas) continue;
      return { path, ...p };
    }
    return null;
  });
  const SCENARIOS = [
    ...[0, 1].flatMap((round) => MOVES.map(([key, name]) => [`${round ? 'again: ' : ''}${name}`, () => page.keyboard.press(key)])),
    ['quick: out twice, 150 ms apart', async () => { await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(150); await page.keyboard.press('ArrowLeft'); }],
    ['quick: in twice, 150 ms apart', async () => { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(150); await page.keyboard.press('ArrowRight'); }],
    ['out to middle (to set up a tap)', () => page.keyboard.press('ArrowLeft')],
    ['tap a middle word prewarm skipped', async () => { const t = await tapUnpredicted(); if (!t) throw new Error('no unpredicted target'); await page.mouse.click(t.x, t.y); }],
    ['tap another one', async () => { const t = await tapUnpredicted(); if (!t) throw new Error('no unpredicted target'); await page.mouse.click(t.x, t.y); }],
  ];
  for (const [name, fn] of SCENARIOS) {
    await page.evaluate(() => { globalThis.__trace.length = 0; });
    await fn();
    await page.waitForFunction(() => !window.__fw.moving(), null, { timeout: 20000 });
    await page.waitForTimeout(1500); // prewarm runs in idle time after settling
    const tr = await page.evaluate(() => globalThis.__trace.slice());
    const t0 = tr[0]?.t ?? 0;
    // Rim motion per frame, in CSS px: how far a point on the wheel's edge moved since the frame before.
    const motion = tr.map((r, i) => (i === 0 ? Infinity : Math.abs(r.scale - tr[i - 1].scale) * radius + Math.abs(r.rotation - tr[i - 1].rotation) * radius * r.scale + Math.abs(r.cx - tr[i - 1].cx) + Math.abs(r.cy - tr[i - 1].cy)));
    const settleAt = tr.findIndex((r, i) => r.exact && i > 0 && !tr[i - 1].exact);
    const lastOver = (px) => { let k = -1; for (let i = 0; i < (settleAt < 0 ? tr.length : settleAt); i++) if (motion[i] > px) k = i; return k; };
    const s = tr[settleAt] ?? {};
    const before = tr[settleAt - 1] ?? {};
    const url = await page.evaluate(() => location.pathname);
    const here = await shot(page);
    const ref = await reference(url);
    const vsFresh = await diff(here, ref);
    const idx = rows.length;
    if (lv === 'fix') today[idx] = here;
    const vsToday = today[idx] ? await diff(here, today[idx]) : { n: null, hard: null };
    const imgs = await page.evaluate(async () => (globalThis.__settleImgs ? await globalThis.__settleImgs : null));
    await page.evaluate(() => { globalThis.__settleImgs = undefined; });
    const slug = `${lv}-${String(rows.length).padStart(2, '0')}-${name.replace(/[^a-z0-9]+/gi, '-')}`;
    writeFileSync(OUT + slug + '.png', here);
    if (imgs) imgs.forEach((d, k) => writeFileSync(OUT + slug + (k ? '-settle' : '-before') + '.png', Buffer.from(d.split(',')[1], 'base64')));
    writeFileSync(OUT + 'fresh-' + url.slice(1).replaceAll('/', '_') + '.png', ref);
    rows.push({
      move: name, at: url,
      springSettled: Math.round((tr.find((r, i) => i > 0 && !r.moving && tr[i - 1].moving)?.t ?? NaN) - t0),
      // ms from the move's first frame
      visibleUntil05: Math.round(tr[lastOver(0.5)]?.t - t0), visibleUntil01: Math.round(tr[lastOver(0.1)]?.t - t0), settled: Math.round(s.t - t0),
      offSizeLastMovingFrame: before.off ?? null, offMaxLastMovingFrame: before.offMax ? +before.offMax.toFixed(3) : null,
      settleRenders: s.renders ?? null, settleFreshRing: s.freshRing ?? null,
      settleChanged: s.changed ?? null, settleChangedHard: s.changedHard ?? null,
      restVsFresh: vsFresh.n, restVsFreshHard: vsFresh.hard,
      restVsToday: vsToday.n, restVsTodayHard: vsToday.hard,
      laterRenders: tr.slice(settleAt + 1).reduce((a, r) => a + r.renders, 0),
    });
  }
  console.log(JSON.stringify({ engine: e, vw: VW, dpr: DPR, lv, rows }));
  await page.context().close();
}
await b.close();
