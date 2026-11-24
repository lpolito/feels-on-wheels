// Runs wk.mjs jobs one at a time, only while no other Playwright browser runs on this Mac; a run during which a
// foreign Playwright process appears is thrown away and retried. node .bench/run.mjs <out.txt>  (jobs below)
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
const out = process.argv[2];
const ports = { main: 4912, fix: 4913, gl: 4910, 'gl-noaa': 4910, 'gl-rerender': 4910, 'gl-scale': 4910 };
const env = { 'gl-noaa': { GLAA: '0' }, 'gl-rerender': { GLMODE: 'rerender' }, 'gl-scale': { GLMODE: 'scale' } };
const sizes = { phone: { VW: '390', VH: '844', DPR: '3' }, desktop: { VW: '1440', VH: '900', DPR: '2' } };
const jobs = [];
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
for (const e of ['webkit', 'chromium', 'firefox']) for (const s of ['phone', 'desktop']) for (const m of ['spin', 'inout', 'pinch']) {
  for (const b of ['main', 'fix', 'gl', 'gl-noaa', ...(m !== 'spin' ? ['gl-rerender', 'gl-scale'] : [])]) jobs.push({ e, s, m, b });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function foreign(mine) {
  const rows = execSync('ps -Ao pid=,ppid=,command=').toString().trim().split('\n').map((l) => { const m = l.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/); return { pid: +m[1], ppid: +m[2], cmd: m[3] }; });
  const parent = new Map(rows.map((r) => [r.pid, r.ppid]));
  const ours = (pid) => { for (let p = pid, k = 0; p > 1 && k < 50; p = parent.get(p) ?? 0, k++) if (p === mine) return true; return false; };
  return rows.filter((r) => /ms-playwright/.test(r.cmd) && !(mine && ours(r.pid))).length;
}
async function quiet() { let calm = 0; while (calm < 6) { calm = foreign(0) === 0 ? calm + 1 : 0; await sleep(1000); } }
for (const j of jobs) {
  if (only && !only.some((o) => `${j.e}/${j.s}/${j.m}/${j.b}`.includes(o))) continue;
  for (let attempt = 0; attempt < 8; attempt++) {
    await quiet();
    const child = spawn('node', ['.bench/wk.mjs', `http://localhost:${ports[j.b]}`, j.b, j.m, process.env.ROUNDS || '4'], { env: { ...process.env, ENGINE: j.e, ...sizes[j.s], ...(env[j.b] || {}) } });
    let text = '';
    child.stdout.on('data', (d) => { text += d; });
    child.stderr.on('data', (d) => { text += d; });
    let dirty = false;
    const timer = setInterval(() => { try { if (foreign(child.pid) > 0) dirty = true; } catch {} }, 700);
    await new Promise((r) => child.on('close', r));
    clearInterval(timer);
    const line = text.trim().split('\n').at(-1);
    if (dirty) { fs.appendFileSync(out + '.discarded', `${j.s} ${line}\n`); continue; }
    fs.appendFileSync(out, `${j.s.padEnd(8)}${line}\n`);
    break;
  }
}
fs.appendFileSync(out, 'DONE\n');
