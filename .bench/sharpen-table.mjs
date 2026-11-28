// node .bench/sharpen-table.mjs <file.jsonl> : one row per variant and move
import fs from 'node:fs';
const rows = fs.readFileSync(process.argv[2], 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const k = ['at', 'visibleUntil05', 'visibleUntil01', 'settled', 'springSettled', 'offSizeLastMovingFrame', 'offMaxLastMovingFrame', 'settleRenders', 'settleChangedHard', 'restVsTodayHard', 'laterRenders'];
console.log(['lv', 'move', ...k].join('\t'));
for (const r of rows) for (const x of r.rows) console.log([r.lv, x.move, ...k.map((c) => x[c])].join('\t'));
