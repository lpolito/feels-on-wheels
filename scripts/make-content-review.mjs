// Rebuilds docs/content-review.md from the wheel data: every feeling's definition and "You might notice", then the
// body wheel. Run after changing anything under src/data/: node scripts/make-content-review.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({ root, configFile: false, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { loadData, nodeRef } = await vite.ssrLoadModule('/src/data/load.ts');
await vite.close();

const { wheels, feelings, locale } = loadData();
const [core, body] = wheels;
const label = (id) => locale.feelings[id].label;
const phrases = (id) => feelings[id].sensations.map((s) => locale.sensationPhrases[s]).join(' · ');

const out = [
  '# v1 content review',
  '',
  'One entry per word. A word in two places on the wheel is listed once, where it first appears. Edit freely: definitions live in `src/data/locales/en.json`, and each feeling\'s sensations in `src/data/feelings.json`. The italic lines are what a feeling\'s card shows under "You might notice" (`en.json` → `sensationPhrases`); the wheel shows shorter labels (`en.json` → `sensations`).',
  '',
];

// A word in two places with one id is listed in full once; the other place says "see above".
const seen = new Set();
const entry = (node, depth) => {
  const id = nodeRef(node).id;
  const pad = '  '.repeat(depth);
  if (seen.has(id)) {
    out.push(`${pad}- **${label(id)}**: see above`);
  } else {
    seen.add(id);
    out.push(`${pad}- **${label(id)}**: ${locale.feelings[id].definition}  `);
    if (feelings[id].sensations.length > 0) out.push(`${pad}  _${phrases(id)}_`);
  }
  for (const child of node.children ?? []) entry(child, depth + 1);
};
for (const c of core.children) {
  out.push('', `## ${label(nodeRef(c).id)}`, '');
  entry(c, 0);
}

out.push(
  '',
  '## Body wheel',
  '',
  'The body sensations wheel after the [body wheel rework](superpowers/specs/2026-11-15-feels-on-wheels-body-wheel-rework-design.md) (with its [changes](superpowers/specs/2026-11-15-feels-on-wheels-body-wheel-rework-changes.md)), repaired to the opinionated feelings wheel\'s words ([research/16](opinionated-wheel/research/16-body-wheel-repair.md)): body areas, the sensations under each, and the 2–3 feelings each sensation leads to. These are drafted to agree with each feeling\'s "You might notice" above, though nothing enforces it. The wheel shows the short labels below; cards show the phrases above.',
);
const onWheel = new Set();
for (const area of body.children) {
  const aid = nodeRef(area).id;
  const drawn = locale.areaWheelLabels[aid];
  out.push('', `### ${locale.areas[aid]}${drawn ? ` (on the wheel: "${drawn}")` : ''}`, '');
  for (const s of area.children ?? []) {
    const id = nodeRef(s).id;
    onWheel.add(id);
    out.push(`- **${locale.sensations[id]}**: ${(s.children ?? []).map((f) => label(nodeRef(f).id)).join(', ')}`);
  }
}
const cardsOnly = Object.keys(locale.sensationPhrases)
  .filter((s) => !onWheel.has(s) && Object.values(feelings).some((f) => f.sensations.includes(s)));
out.push('', `On cards only, not on the wheel: ${cardsOnly.map((s) => locale.sensationPhrases[s]).join(', ')}.`, '');

writeFileSync(new URL('../docs/content-review.md', import.meta.url), out.join('\n'));
