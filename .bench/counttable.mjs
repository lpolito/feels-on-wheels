import fs from 'node:fs';
const name = { fix: 'branch (today)', v1: '1 rest sizes', v12: '1+2 prewarm', v12f: '1+2, fresh fit at rest', v123f: '1+2+3 sheets', v4: '4 mip chain', v5: '5 budget × dpr²' };
const cols = [['out to core', 'out to core'], ['in to middle', 'in to middle'], ['again: out to core', 'out again'], ['pinch out and back (springs back)', 'pinch out + back'], ['pinch wobble 2.5 s (as wk.mjs)', 'pinch wobble'], ['spin 10 steps (whole wheel)', 'spin']];
for (const [f, title] of [['chromium-phone', 'Chromium, 390×844 @3x'], ['webkit-phone', 'WebKit, 390×844 @3x'], ['chromium-desktop', 'Chromium, 1440×900 @2x']]) {
  const rows = fs.readFileSync(`.bench/count-${f}.jsonl`, 'utf8').trim().split('\n').filter((l) => l.startsWith('{')).map((l) => JSON.parse(l));
  console.log(`\n**${title}**: labels rendered in frames (most in one frame), and largest cache size\n`);
  console.log(`| variant | ${cols.map((c) => c[1]).join(' | ')} | idle renders | cache max |`);
  console.log(`|---|${cols.map(() => '---:').join('|')}|---:|---:|`);
  for (const j of rows) {
    const cell = (k) => { const r = j.res.find((x) => x.name === k); return r ? `${r.rendered} (${r.maxPerFrame})` : '–'; };
    const idle = j.res.reduce((a, r) => a + (r.idleRendered || 0), 0);
    const mb = Math.max(...j.res.map((r) => r.mb));
    console.log(`| ${name[j.lv]} | ${cols.map((c) => cell(c[0])).join(' | ')} | ${idle} | ${mb} MB |`);
  }
}
