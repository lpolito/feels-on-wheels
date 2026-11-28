// Which labels the settle frame renders on "out to core", in today's build: node .bench/settle-renders.mjs <base>
import { createRequire } from 'node:module';
const pw = createRequire(new URL('../package.json', import.meta.url))('@playwright/test');
const b = await pw.chromium.launch();
const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })).newPage();
page.on('pageerror', (x) => console.log('PAGEERROR', x.stack)); page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', m.text()));
await page.addInitScript(() => { globalThis.__lv = 'fix'; globalThis.__trace = []; });
await page.goto(process.argv[2] + '/angry/annoyed/irritable');
await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving());
await page.waitForTimeout(1500);
await page.evaluate(() => document.querySelector('#a11y-tree [role="treeitem"][tabindex="0"]').focus());
await page.keyboard.press('ArrowLeft');
await page.waitForFunction(() => !window.__fw.moving());
await page.waitForTimeout(800);
// Each frame: the renders and the camera's scale, for the last frames of the move to the core.
await page.evaluate(() => {
  globalThis.__trace.length = 0;
  const raf = requestAnimationFrame.bind(window);
  globalThis.__frames = [];
  const f = () => { globalThis.__frames.push({ t: performance.now(), log: globalThis.__renderLog.splice(0), drawList: globalThis.__drawLog.slice(), drawn: Object.fromEntries(globalThis.__drawLog.splice(0).map((l) => { const [t, px, c] = l.split('|'); return [t, px + ' ' + c]; })), state: JSON.stringify({ sel: window.__fw.pathOf(window.__fw.state().selected), opened: window.__fw.state().opened, mode: window.__fw.state().view.mode }), fade: null, moving: window.__fw.moving(), cam: JSON.stringify(window.__fw.camera()), scale: window.__fw.camera().scale }); raf(f); };
  globalThis.__renderLog = []; globalThis.__drawLog = []; raf(f);
});
await page.keyboard.press('ArrowLeft');
await page.waitForFunction(() => !window.__fw.moving());
await page.waitForTimeout(300);
const fr = await page.evaluate(() => globalThis.__frames);
const s = fr.findIndex((x, i) => i > 0 && !x.moving && fr[i - 1].moving);
for (const k of [s - 2, s - 1, s, s + 1]) console.log('Angry at', fr[k].moving ? 'moving' : 'settled', fr[k].drawList.filter((l) => l.startsWith('Angry|')), 'cam', fr[k].cam);
const a = fr[s - 1].drawn, z = fr[s].drawn;
const prevKeys = new Set(fr[s - 1].drawList.map((l) => { const [t, px, c] = l.split('|'); return `${t}|${Math.round(px * 2) / 2}|${c}`; }));
const r = fr[s].log;
console.log('settle renders drawn the frame before:', r.filter((k) => prevKeys.has(k)).length, 'of', r.length, '; draws before/at settle:', fr[s - 1].drawList.length, fr[s].drawList.length);
console.log('examples not drawn before:', r.filter((k) => !prevKeys.has(k)).slice(0, 5));
const changed = Object.keys(z).filter((k) => a[k] !== undefined && a[k] !== z[k]);
console.log('labels whose size changed in the settle frame:', changed.length, 'of', Object.keys(z).length);
const pairs = {}; for (const k of changed) { const p = `${a[k]} -> ${z[k]}`; pairs[p] = (pairs[p] ?? 0) + 1; }
console.log(pairs);
console.log('opened label and others, examples:', changed.slice(0, 6).map((k) => `${k} ${a[k]}->${z[k]}`).join('; '));
for (const x of fr.slice(Math.max(0, s - 4), s + 2)) console.log(x.moving ? 'moving ' : 'settled', x.state, x.scale.toFixed(6), x.log.length, [...new Set(x.log.map((l) => l.split('|')[1]))].join(','), x.log.slice(0, 4).join('  '));
await b.close();
