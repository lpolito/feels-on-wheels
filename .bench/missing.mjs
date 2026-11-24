import fs from 'node:fs';
const rows = fs.readFileSync(process.argv[2], 'utf8').trim().split('\n').filter((l) => !l.includes('Node.js')).map((l) => JSON.parse(l));
for (const e of ['webkit', 'chromium', 'firefox']) for (const sz of ['phone', 'desktop']) for (const m of ['inout', 'pinch', 'spin']) for (const v of (process.argv[3] || 'main fix v1 v12 v123 v4 v5').split(' '))
  if (!rows.some((x) => x.r.engine === e && x.size === sz && x.r.mode === m && x.r.label === v)) console.log(e, sz, m, v);
