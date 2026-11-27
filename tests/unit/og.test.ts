import { existsSync, readdirSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { OG_SIZE, ogImage, ogImagePath, ogWedge } from '../../src/og';
import { parsePath, routeTable } from '../../src/state/url';

const { wheels, locale } = loadData();
const table = routeTable(wheels);
const route = (p: string) => parsePath(table, p).route;
const ALT = 'The {wheel} with its {wedge} wedges in front, beside the words "Feels on Wheels: Find the word for what you feel".';

describe('preview image per route (share and preview spec §5)', () => {
  test('every body area has its image on disk, and no other body image is left', () => {
    const body = wheels.find((w) => w.id === 'body')!;
    const want = body.children.map((a) => `body-${a.area}.png`).sort();
    for (const f of want) expect(existsSync(`public/og/${f}`), f).toBe(true);
    expect(readdirSync('public/og').filter((f) => f.startsWith('body-')).sort()).toEqual(want);
  });

  test.each([
    ['/', 'og/core-happy.png'],
    ['/love/attracted/aroused', 'og/core-love.png'],
    ['/sad/lonely', 'og/core-sad.png'],
    ['/body', 'og/body-whole-body.png'],
    ['/body/chest/racing-heart', 'og/body-chest.png'],
    ['/body/urges', 'og/body-urges.png'],
    ['/body/hands/sweaty-palms', 'og/body-hands.png'],
    ['/body/throat/lump-in-throat/grief', 'og/body-throat.png'],
    ['/about', 'og/core-happy.png'],
    ['/nope', 'og/core-happy.png'],
    ['/body/nope', 'og/core-happy.png'],
  ])('%s has %s', (path, file) => {
    expect(ogImage(route(path), table, locale, ALT).path).toBe(file);
  });

  test('ogWedge and ogImagePath', () => {
    expect(ogWedge(route('/sad/lonely'), table)).toEqual({ wheel: 'core', wedge: 'sad' });
    expect(ogImagePath({ wheel: 'body', wedge: 'chest' })).toBe('og/body-chest.png');
  });

  test('a wheel at rest with no base wedge shows the first wheel and its base, together', () => {
    expect(ogWedge({ kind: 'wheel', wheel: 'other', path: null }, table)).toEqual({ wheel: table.first, wedge: 'happy' });
  });

  test('every wheel at rest and every ring-0 wedge of every wheel has an image in public/og/', () => {
    const exists = (w: { wheel: string; wedge: string }) => existsSync(new URL(`../../public/${ogImagePath(w)}`, import.meta.url));
    for (const [wheel, paths] of table.wheels) {
      const atRest = ogWedge({ kind: 'wheel', wheel, path: null }, table);
      expect(exists(atRest), `${wheel} at rest → ${ogImagePath(atRest)}`).toBe(true);
      for (const path of [...paths.keys()].filter((p) => !p.includes('/'))) {
        const w = ogWedge({ kind: 'wheel', wheel, path }, table);
        expect(exists(w), `${wheel}/${path} → ${ogImagePath(w)}`).toBe(true);
      }
    }
  });

  test('the size is 1200 by 630', () => {
    expect(OG_SIZE).toEqual({ width: 1200, height: 630 });
  });

  test('alt text names the wheel and the wedge', () => {
    expect(ogImage(route('/sad'), table, locale, ALT).alt).toBe('The feelings wheel with its Sad wedges in front, beside the words "Feels on Wheels: Find the word for what you feel".');
    expect(ogImage(route('/body/chest'), table, locale, ALT).alt.startsWith('The body sensations wheel with its Chest wedges in front')).toBe(true);
  });
});
