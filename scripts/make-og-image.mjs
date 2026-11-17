// Renders the 1200×630 link-preview images (share and preview spec §5), one per core feeling and body area,
// to public/og/<wheel>-<wedge>.png: a chunky wheel turned so that wedge points right, beside the name and tagline.
// Run: node scripts/make-og-image.mjs
// Rerun and commit public/og/ when a wheel file, the color tokens, the color code, the layout code, the app's name
// or the tagline changes.
// Font: Inter 4.1 (InterVariable.woff2), by Rasmus Andersson and the Inter Project Authors,
// from https://github.com/rsms/inter/releases/tag/v4.1, under the SIL Open Font License 1.1 (scripts/fonts/OFL.txt).
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p, enc = 'utf8') => readFileSync(new URL(`../${p}`, import.meta.url), enc);

// The app's own TypeScript modules, loaded through Vite without starting a dev server.
const vite = await createServer({ root, configFile: false, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { loadData } = await vite.ssrLoadModule('/src/data/load.ts');
const { buildLayout, homes } = await vite.ssrLoadModule('/src/model/layout.ts');
const { buildFillTable } = await vite.ssrLoadModule('/src/render/colors.ts');
const { OG_SIZE, ogImagePath } = await vite.ssrLoadModule('/src/og.ts');

const { wheels } = loadData();
const core = buildLayout(wheels[0]);
const home = homes(core);
const layouts = wheels.map((w, i) => ({ wheel: w, layout: i === 0 ? core : buildLayout(w, home) }));
const hueNames = wheels.flatMap((w) => w.children.map((n) => n.hue));

const { page: pageText, titles } = JSON.parse(read('src/data/locales/en.json'));
const after = titles.home.split(': ')[1] ?? '';
const tagline = after.charAt(0).toUpperCase() + after.slice(1);
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: OG_SIZE, deviceScaleFactor: 1 });

// The dark theme's colors, read the way readPalette (src/render/colors.ts) reads them.
await tab.setContent(`<html data-theme="dark"><head><style>${read('src/styles/tokens.css')}</style></head></html>`);
const tokens = await tab.evaluate((hueNames) => {
  const cs = getComputedStyle(document.documentElement);
  const v = (name) => cs.getPropertyValue(name).trim().toLowerCase();
  return {
    bg: v('--bg'), fg: v('--fg'), muted: v('--muted'), gap: v('--gap'), focus: v('--focus'), outline: v('--outline'), surface: v('--surface'),
    hues: Object.fromEntries(hueNames.map((h) => [h, v(`--hue-${h}`)])),
  };
}, hueNames);
const { muted, ...palette } = tokens;
const fills = buildFillTable(palette, 3, 'dark');

// Geometry, pinned from the approved mock: the wheel's center sits just off the left edge.
const TAU = Math.PI * 2;
const R = 590;
const CX = -12.8;
const CY = 315;
/** Cells per full turn on rings 1 and 2: each ring-0 wedge is cut into about equal-width cells. */
const PER_TURN = [null, 21, 42];
const STROKE = 5;
const TEXT_LEFT = CX + R + 70;
const TEXT_RIGHT = 60;
const NAME_MAX = 100;
const TAGLINE_RATIO = 0.55;

const pt = (r, a) => `${(CX + r * Math.cos(a)).toFixed(2)} ${(CY + r * Math.sin(a)).toFixed(2)}`;
/** An annular sector, clockwise from a0 to a1 on screen (y down). */
function cellPath(r0, r1, a0, a1) {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${pt(r1, a0)} A${r1} ${r1} 0 ${large} 1 ${pt(r1, a1)} L${pt(r0, a1)} A${r0} ${r0} 0 ${large} 0 ${pt(r0, a0)}Z`;
}

/** The segment on `ring` covering wheel angle `a`, or undefined where that ring has none. */
function segmentAt(layout, ring, a) {
  const { segments, starts } = layout.rings[ring];
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const m = (lo + hi + 1) >> 1;
    if (starts[m] <= a) lo = m;
    else hi = m - 1;
  }
  const s = layout.segments[segments[lo]];
  return s && s.start <= a && a < s.end ? s : undefined;
}

/** SVG paths for a wheel turned so `featured`'s middle points at 3 o'clock. */
function wheelSvg(wheel, layout, featured) {
  const turn = -featured.mid;
  const radii = wheel.rings.map((r) => [r.inner * R, r.outer * R]);
  const cell = (ring, a0, a1, seg) =>
    `<path d="${cellPath(radii[ring][0], radii[ring][1], a0 + turn, a1 + turn)}" fill="${fills.fill(seg.hue, ring, true)}"/>`;
  let out = '';
  for (const i of layout.rings[0].segments) {
    const wedge = layout.segments[i];
    out += cell(0, wedge.start, wedge.end, wedge);
    const width = wedge.end - wedge.start;
    // Each outer ring splits every cell of the ring inside it evenly, so the cells line up from ring to ring.
    const middle = Math.max(1, Math.round(width / (TAU / PER_TURN[1])));
    for (let ring = 1; ring < layout.rings.length; ring++) {
      const n = middle * (PER_TURN[ring] / PER_TURN[1]);
      for (let j = 0; j < n; j++) {
        const a0 = wedge.start + (width * j) / n;
        const a1 = wedge.start + (width * (j + 1)) / n;
        const seg = segmentAt(layout, ring, (a0 + a1) / 2);
        if (seg) out += cell(ring, a0, a1, seg);
      }
    }
  }
  return `<g stroke="${palette.bg}" stroke-width="${STROKE}" stroke-linejoin="round">${out}</g>`;
}

const inter = read('scripts/fonts/InterVariable.woff2', null).toString('base64');
await tab.setContent(`<html><head><style>
  @font-face { font-family: Inter; src: url(data:font/woff2;base64,${inter}) format('woff2'); font-weight: 100 900; font-display: block; }
  body { margin: 0; width: ${OG_SIZE.width}px; height: ${OG_SIZE.height}px; background: ${palette.bg}; position: relative; overflow: hidden;
    font-family: Inter; font-optical-sizing: auto; }
  svg { position: absolute; inset: 0; }
  #text { position: absolute; left: ${TEXT_LEFT}px; top: 50%; translate: 0 -50%; }
  #text div { white-space: nowrap; width: max-content; }
  #name { color: ${palette.fg}; font-weight: 700; line-height: 1.1; }
  #tagline { color: ${muted}; font-weight: 500; margin-top: 0.4em; }
</style></head><body>
  <svg viewBox="0 0 ${OG_SIZE.width} ${OG_SIZE.height}" width="${OG_SIZE.width}" height="${OG_SIZE.height}"></svg>
  <div id="text"><div id="name">${esc(pageText.name)}</div><div id="tagline">${esc(tagline)}</div></div>
</body></html>`);
const sizes = await tab.evaluate(async ({ avail, nameMax, ratio }) => {
  await Promise.all([document.fonts.load('700 100px Inter'), document.fonts.load('500 50px Inter')]);
  await document.fonts.ready;
  if (!document.fonts.check('700 100px Inter') || !document.fonts.check('500 50px Inter')) throw new Error('Inter did not load');
  /** The largest whole px size ≤ max at which el fits on one line in `avail`. */
  const fit = (el, max) => {
    let px = max;
    for (el.style.fontSize = `${px}px`; el.getBoundingClientRect().width > avail && px > 1; ) el.style.fontSize = `${--px}px`;
    return px;
  };
  const name = fit(document.getElementById('name'), nameMax);
  const tagline = fit(document.getElementById('tagline'), Math.round(ratio * name));
  return { name, tagline };
}, { avail: OG_SIZE.width - TEXT_RIGHT - TEXT_LEFT, nameMax: NAME_MAX, ratio: TAGLINE_RATIO });

const outDir = new URL('../public/og/', import.meta.url);
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
let count = 0;
for (const { wheel, layout } of layouts) {
  for (const i of layout.rings[0].segments) {
    const featured = layout.segments[i];
    await tab.evaluate((svg) => { document.querySelector('svg').innerHTML = svg; }, wheelSvg(wheel, layout, featured));
    const file = ogImagePath({ wheel: wheel.id, wedge: featured.node.id });
    await tab.screenshot({ path: fileURLToPath(new URL(`../public/${file}`, import.meta.url)) });
    count++;
  }
}
console.log(`${count} images in public/og/ (name ${sizes.name}px, tagline ${sizes.tagline}px)`);

await browser.close();
await vite.close();
