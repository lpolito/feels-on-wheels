// Spec §9 budgets: app JS ≤ 25 KB gzipped; first load (HTML + CSS + all JS incl. data) ≤ 60 KB gzipped.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = new URL('../dist/', import.meta.url).pathname;
const KB = 1024;
const BUDGET = { appJs: 25 * KB, firstLoad: 60 * KB };

const walk = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
const files = walk(DIST)
  .filter((f) => /\.(html|css|js)$/.test(f))
  .map((f) => ({ name: relative(DIST, f), gz: gzipSync(readFileSync(f), { level: 9 }).length }));

const isData = (n) => /(^|\/)data-[^/]*\.js$/.test(n);
const appJs = files.filter((f) => f.name.endsWith('.js') && !isData(f.name)).reduce((s, f) => s + f.gz, 0);
const firstLoad = files.reduce((s, f) => s + f.gz, 0);

for (const f of files) console.log(`${(f.gz / KB).toFixed(2).padStart(7)} KB  ${f.name}`);
console.log(`app JS     ${(appJs / KB).toFixed(2)} KB / ${BUDGET.appJs / KB} KB`);
console.log(`first load ${(firstLoad / KB).toFixed(2)} KB / ${BUDGET.firstLoad / KB} KB`);

if (files.length === 0) {
  console.error('dist/ is empty: run npm run build first');
  process.exit(1);
}
if (appJs > BUDGET.appJs || firstLoad > BUDGET.firstLoad) {
  console.error('Over budget');
  process.exit(1);
}
