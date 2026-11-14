import { describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { routeMeta } from '../../src/meta';
import { parsePath, routeTable } from '../../src/state/url';

const { wheels, locale } = loadData();
const table = routeTable(wheels);
const m = (p: string) => routeMeta(parsePath(table, p).route, table, locale);

describe('route meta (§6)', () => {
  test('§6 table', () => {
    expect(m('/')).toEqual({ title: 'Feels on Wheels: name what you feel', description: locale.titles.homeDescription });
    expect(m('/happy/playful')).toEqual({ title: 'Playful · Feels on Wheels', description: 'In the mood for fun and lightheartedness.' });
    expect(m('/body/chest/tight-chest/anxious').title).toBe('Anxious · Feels on Wheels');
    expect(m('/body')).toEqual({ title: 'Body sensations wheel · Feels on Wheels', description: locale.titles.wheelDescriptions['body'] });
    expect(m('/body/chest/tight-chest')).toEqual({ title: 'Tight chest · Feels on Wheels', description: 'Tight chest: the feelings it can come with, on the body sensations wheel.' });
    expect(m('/body/chest').description).toBe(`${locale.areas['chest']}: what you might notice there, and the feelings it can come with.`);
    expect(m('/about').title).toBe('About Feels on Wheels');
    expect(m('/nope')).toEqual({ title: 'Not found · Feels on Wheels', description: locale.titles.homeDescription });
  });
});
