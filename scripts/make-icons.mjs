// Renders public/icons/icon.svg to the PNG icon set with Playwright's Chromium (no extra dependency).
// Run once after changing the SVG: node scripts/make-icons.mjs
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const svg = readFileSync(new URL('../public/icons/icon.svg', import.meta.url), 'utf8');
const out = (name) => new URL(`../public/icons/${name}`, import.meta.url).pathname;
const targets = [
  { name: 'icon-192.png', size: 192, inset: 0, bg: 'transparent' },
  { name: 'icon-512.png', size: 512, inset: 0, bg: 'transparent' },
  // Maskable: keep the mark inside the 80% safe zone on a full-bleed background.
  { name: 'icon-maskable-512.png', size: 512, inset: 0.14, bg: '#ffffff' },
  // Apple touch icons must be opaque.
  { name: 'apple-touch-icon.png', size: 180, inset: 0.06, bg: '#ffffff' },
];

const browser = await chromium.launch();
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
