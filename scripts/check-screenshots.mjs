// Checks the screenshot suite's archives before they go to Chromatic (screenshots spec, "What the spike taught").
// Each mistake below gives pictures that look plausible but are wrong, so this fails the run instead:
//   - more than one size under one test name: Chromatic shows the default size's capture, squeezed;
//   - a script left in the page: Chromatic starts the app again in its own browser and draws a different wheel;
//   - a canvas not captured at 2x: Chromatic draws at 2x, so the wheel comes out blurry.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'test-results/chromatic-archives';
const ARCHIVE = join(ROOT, 'archive');
/** Screens spec: 19 devices × 6 wheel screens + About and not found on 3 devices each. */
const EXPECTED = 120;

const problems = [];

if (!existsSync(ARCHIVE)) {
  console.error('No screenshots: run npm run screenshots first');
  process.exit(1);
}

const snapshots = readdirSync(ARCHIVE).filter((f) => f.endsWith('.snapshot.json'));
if (snapshots.length !== EXPECTED) problems.push(`${snapshots.length} snapshots, expected ${EXPECTED}`);

// Each archive is <snapshot id>.w<width>h<height>.snapshot.json. Chromatic merges one id's sizes into one test only at
// upload, so here an id with two sizes means two devices ended up under one test name (a device added as a Playwright
// project rather than a describe, say).
const sizesById = new Map();
for (const file of snapshots) {
  const [, id, size] = file.match(/^(.*)\.(w\d+h\d+)\.snapshot\.json$/) ?? [];
  if (id) sizesById.set(id, [...(sizesById.get(id) ?? []), size]);
}
for (const [id, sizes] of sizesById) {
  if (sizes.length > 1) problems.push(`${id}: more than one size under one test name (${sizes.join(', ')})`);
}

/** Every serialized element in an rrweb snapshot, depth first. */
function* elements(node) {
  if (node.tagName) yield node;
  for (const child of node.childNodes ?? []) yield* elements(child);
}

for (const file of snapshots) {
  const size = file.match(/\.w(\d+)h(\d+)\.snapshot\.json$/);
  const { snapshot } = JSON.parse(readFileSync(join(ARCHIVE, file), 'utf8'));
  for (const el of elements(snapshot)) {
    if (el.tagName === 'script') problems.push(`${file}: has a script`);
    // About hides the wheel, so its canvas keeps whatever size it had; only the wheel screens need it sharp.
    if (el.tagName === 'canvas' && size && !file.includes('-about-')) {
      const [w, h] = [Number(size[1]), Number(size[2])];
      const { width, height } = el.attributes;
      if (Number(width) !== 2 * w || Number(height) !== 2 * h) {
        problems.push(`${file}: canvas ${width}×${height}, expected 2× ${w}×${h}`);
      }
    }
  }
}

for (const p of [...new Set(problems)]) console.error(p);
process.exit(problems.length ? 1 : 0);
