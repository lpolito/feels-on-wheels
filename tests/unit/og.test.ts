import { describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { OG_SIZE, ogImage, ogImagePath, ogWedge } from '../../src/og';
import { parsePath, routeTable } from '../../src/state/url';

const { wheels, locale } = loadData();
const table = routeTable(wheels);
const route = (p: string) => parsePath(table, p).route;
const ALT = 'The {wheel} with its {wedge} wedges in front, beside the words "Feels on Wheels: Find the word for what you feel".';

describe('preview image per route (share and preview spec §5)', () => {
  test.each([
    ['/', 'og/core-happy.png'],
    ['/happy/playful/aroused', 'og/core-happy.png'],
    ['/sad/lonely', 'og/core-sad.png'],
    ['/body', 'og/body-whole-body.png'],
    ['/body/chest/racing-heart', 'og/body-chest.png'],
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

  test('the size is 1200 by 630', () => {
    expect(OG_SIZE).toEqual({ width: 1200, height: 630 });
  });

  test('alt text names the wheel and the wedge', () => {
    expect(ogImage(route('/sad'), table, locale, ALT).alt).toBe('The feelings wheel with its Sad wedges in front, beside the words "Feels on Wheels: Find the word for what you feel".');
    expect(ogImage(route('/body/chest'), table, locale, ALT).alt.startsWith('The body sensations wheel with its Chest wedges in front')).toBe(true);
  });
});
