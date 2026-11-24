// Line breaks and prewarm memory across views. usage: VW VH DPR node analyze.mjs <base>
import { createRequire } from 'node:module';
const pw = createRequire('/Users/lucas/dev/feels-on-wheels/.claude/worktrees/ff-canvas-perf/package.json')('@playwright/test');
const base = process.argv[2];
const views = ['/', '/angry', '/angry/aggressive', '/angry/aggressive/hostile', '/happy', '/happy/playful', '/sad/lonely', '/fearful/scared/helpless', '/body', '/body/chest', '/body/chest/racing-heart'];
const b = await pw.chromium.launch({ headless: true });
const vw = Number(process.env.VW || 390), vh = Number(process.env.VH || 844), dpr = Number(process.env.DPR || 3);
const rows = [];
for (const v of views) {
  const res = {};
  for (const lv of ['fix', 'v12']) {
    const ctx = await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: dpr });
    const page = await ctx.newPage();
    await page.addInitScript(([lv]) => { globalThis.__lv = lv; globalThis.__lvBytes = 2 ** 31; }, [lv]);
    await page.goto(base + v);
    await page.waitForFunction(() => window.__fw !== undefined && !window.__fw.moving(), null, { timeout: 20000 });
    await page.waitForTimeout(lv === 'v12' ? 4000 : 800);
    const r = await page.evaluate(() => ({ s: globalThis.__sprites(), fits: globalThis.__viewFits(), warmed: globalThis.__warmed }));
    res[lv] = r;
    await ctx.close();
  }
  const [cur, ...next] = res.fix.fits;
  const bySeg = (items) => { const m = new Map(); for (const it of items) if (!m.has(it.seg)) m.set(it.seg, it); return m; };
  const c = bySeg(cur.items);
  let both = 0, linesDiffer = 0, newLabels = 0; const ex = [];
  for (const n of next) {
    for (const [seg, it] of bySeg(n.items)) {
      const o = c.get(seg);
      if (!o) { newLabels++; continue; }
      both++;
      if (o.lines !== it.lines) { linesDiffer++; if (ex.length < 3) ex.push(`${o.text}${o.lines === 2 ? '…' : ''} ${o.lines}→${it.lines} (${n.selected ?? 'wheel'})`); }
    }
  }
  rows.push({ view: v, nextViews: next.length, restMB: +(res.fix.s.bytes / 2 ** 20).toFixed(1), restLabels: res.fix.s.size, prewarmMB: +(res.v12.s.bytes / 2 ** 20).toFixed(1), prewarmLabels: res.v12.s.size, sharedLabelViews: both, linesDiffer, newLabels, ex: ex.join('; ') });
  console.log(JSON.stringify(rows.at(-1)));
}
await b.close();
