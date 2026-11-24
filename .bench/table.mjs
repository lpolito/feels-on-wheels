import fs from 'node:fs';
const rows = fs.readFileSync(process.argv[2], 'utf8').trim().split('\n').filter((l) => !l.includes("Node.js")).map((l) => JSON.parse(l));
const vs = ['main', 'fix', 'v1', 'v12', 'v123', 'v4', 'v5'];
const name = { main: 'main', fix: 'branch', v1: '1 rest', v12: '1+2', v123: '1+2+3', v4: '4 mip', v5: '5 budget' };
for (const e of ['webkit', 'chromium', 'firefox']) for (const sz of ['phone', 'desktop']) {
  const sub = rows.filter((x) => x.r.engine === e && x.size === sz);
  if (!sub.length) continue;
  console.log(`\n**${e}, ${sz === 'phone' ? '390×844 @3x' : '1440×900 @2x'}** — dropped frames (>25 ms) / worst frame ms (median of rounds) / label renders per round${e === 'firefox' ? ' / GPU' : ''}\n`);
  console.log(`| mode | ${vs.map((v) => name[v]).join(' | ')} |`);
  console.log(`|---|${vs.map(() => '---').join('|')}|`);
  for (const m of ['inout', 'pinch', 'spin']) {
    const cells = vs.map((v) => { const x = sub.find((y) => y.r.mode === m && y.r.label === v)?.r; if (!x) return '–'; const pct = (100 * x.dropped / x.frames).toFixed(0); return `${pct}% / ${x.worstMed} / ${v === 'main' ? '–' : x.rendersPerRound}${e === 'firefox' ? ' / ' + x.gpu : ''}`; });
    console.log(`| ${m === 'inout' ? 'ring change' : m} | ${cells.join(' | ')} |`);
  }
}
