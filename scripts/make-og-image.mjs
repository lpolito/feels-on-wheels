// Renders public/og-image.png, the 1200×630 social preview (going-public spec §7.3), with Playwright's Chromium.
// Rerun by hand when the name, tagline or icon changes: node scripts/make-og-image.mjs
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const svg = read('public/icons/icon.svg');
const { page } = JSON.parse(read('src/data/locales/en.json'));
const after = page.title.split(': ')[1] ?? '';
const tagline = after.charAt(0).toUpperCase() + after.slice(1);
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await tab.setContent(`<html><body style="margin:0;width:1200px;height:630px;background:#121114;display:flex;align-items:center;
  font-family:system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
  <div style="width:420px;height:420px;margin-left:80px;flex:none">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div>
  <div style="margin-left:64px;margin-right:64px">
    <div style="color:#ecebf0;font-size:88px;font-weight:700;line-height:1.05">${esc(page.name)}</div>
    <div style="color:#a9a6b2;font-size:52px;font-weight:500;margin-top:24px">${esc(tagline)}</div>
  </div>
</body></html>`);
await tab.screenshot({ path: new URL('../public/og-image.png', import.meta.url).pathname });
await browser.close();
