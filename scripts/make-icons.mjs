// Draws the icons from the feelings wheel and the color tokens (opinionated wheel spec §4), then renders the app
// icon to the PNG icon set with Playwright's Chromium (no extra dependency):
//   public/icons/icon.svg, in the light theme's colors, and its PNGs;
//   docs/website-icon/feels-on-wheels.svg and .css, the link icon for lucaspolito.dev, in the dark theme's colors.
// Run and commit both folders when the cores, their order, or their colors change: node scripts/make-icons.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({ root, configFile: false, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { loadData } = await vite.ssrLoadModule('/src/data/load.ts');
const { appIconSvg, iconWedges, siteContrasts, siteIconCss, siteIconSvg } = await vite.ssrLoadModule('/scripts/icon-wedges.ts');
await vite.close();

const { wheel, locale } = loadData();
const wedges = iconWedges(wheel);
const names = Object.fromEntries(wedges.map((w) => [w.id, locale.feelings[w.id].label]));

const browser = await chromium.launch();
// Each theme's hues, read the way readPalette (src/render/colors.ts) reads them.
const tokens = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const huesFor = async (theme) => {
  const tab = await browser.newPage();
  await tab.setContent(`<html data-theme="${theme}"><head><style>${tokens}</style></head></html>`);
  const out = await tab.evaluate((hs) => {
    const cs = getComputedStyle(document.documentElement);
    return Object.fromEntries(hs.map((h) => [h, cs.getPropertyValue(`--hue-${h}`).trim().toLowerCase()]));
  }, wedges.map((w) => w.hue));
  await tab.close();
  return out;
};
const light = await huesFor('light');
const dark = await huesFor('dark');

const low = siteContrasts(wedges, dark).map((r, i) => [names[wedges[i].id], r]).filter(([, r]) => r < 3);
if (low.length > 0) {
  await browser.close();
  console.error(`Under lucaspolito.dev's 3:1 rule on its background: ${low.map(([n, r]) => `${n} ${r.toFixed(2)}`).join(', ')}`);
  process.exit(1);
}

const write = (path, text) => writeFileSync(new URL(`../${path}`, import.meta.url), text);
const svg = appIconSvg(wedges, light);
write('public/icons/icon.svg', svg);
write('docs/website-icon/feels-on-wheels.svg', siteIconSvg(wedges));
write('docs/website-icon/feels-on-wheels.css', siteIconCss(wedges, dark, names));
const out = (name) => new URL(`../public/icons/${name}`, import.meta.url).pathname;
const targets = [
  { name: 'icon-192.png', size: 192, inset: 0, bg: 'transparent' },
  { name: 'icon-512.png', size: 512, inset: 0, bg: 'transparent' },
  // Maskable: keep the mark inside the 80% safe zone on a full-bleed background.
  { name: 'icon-maskable-512.png', size: 512, inset: 0.14, bg: '#ffffff' },
  // Apple touch icons must be opaque.
  { name: 'apple-touch-icon.png', size: 180, inset: 0.06, bg: '#ffffff' },
];

for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: t.size, height: t.size } });
  const pad = Math.round(t.size * t.inset);
  await page.setContent(`<html><body style="margin:0;background:${t.bg}">
    <div style="width:${t.size}px;height:${t.size}px;box-sizing:border-box;padding:${pad}px">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div>
  </body></html>`);
  await page.screenshot({ path: out(t.name), omitBackground: t.bg === 'transparent' });
  await page.close();
}
await browser.close();
