import { describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { buildLayout, homes } from '../../src/model/layout';
import { initialState, type State } from '../../src/state/store';
import { allPaths, formatRoute, fromHash, hashWheel, parsePath, pathOf, reservedClash, routeTable, stateFor, toHash, WORD_MAX, type Route } from '../../src/state/url';

const { wheel, wheels } = loadData();
const layout = buildLayout(wheel);
const body = buildLayout(wheels[1]!, homes(layout));
const ids = ['core', 'body'];
const table = routeTable(wheels);
const idx = (p: string): number => layout.byPath.get(p)!;

describe('paths', () => {
  test('every layout path is a route, and nothing else', () => {
    for (const w of wheels) expect([...table.wheels.get(w.id)!.keys()].sort()).toEqual([...buildLayout(w).byPath.keys()].sort());
  });
  test('round-trips every real path', () => {
    for (const p of allPaths(table)) {
      const { lang, route } = parsePath(table, p);
      expect(lang).toBeNull();
      expect(route.kind).not.toBe('notFound');
      expect(formatRoute(table, route as Exclude<Route, { kind: 'notFound' }>)).toBe(p);
    }
  });
  test('shapes (§1)', () => {
    expect(parsePath(table, '/').route).toEqual({ kind: 'wheel', wheel: 'core', path: null });
    expect(parsePath(table, '/happy/playful').route).toEqual({ kind: 'wheel', wheel: 'core', path: 'happy/playful' });
    expect(parsePath(table, '/body').route).toEqual({ kind: 'wheel', wheel: 'body', path: null });
    expect(parsePath(table, '/body/chest/tight-chest').route).toEqual({ kind: 'wheel', wheel: 'body', path: 'chest/tight-chest' });
    expect(parsePath(table, '/about').route).toEqual({ kind: 'about' });
    expect(allPaths(table).slice(0, 2)).toEqual(['/', '/about']);
    expect(allPaths(table)).toContain('/body');
  });
  test('not found, with the word as typed (§7)', () => {
    expect(parsePath(table, '/happy/plaful').route).toEqual({ kind: 'notFound', wheel: 'core', word: 'plaful' });
    expect(parsePath(table, '/body/chest/tight-chst').route).toEqual({ kind: 'notFound', wheel: 'body', word: 'tight-chst' });
    for (const p of ['/Happy', '/core/happy', '/en/happy', '/about/x', '/happy/', '//happy', '/happy//playful', '/happy%2Fplayful', '/%E0%A4%A', '/index.html'])
      expect(parsePath(table, p).route.kind, p).toBe('notFound');
    expect((parsePath(table, '/%E0%A4%A').route as { word: string }).word).toBe('%E0%A4%A');
    const long = parsePath(table, `/${'x'.repeat(500)}`).route as { word: string };
    expect(long.word).toBe(`${'x'.repeat(WORD_MAX)}…`);
  });
  test('a known language prefix is stripped; English is never prefixed (§9)', () => {
    const t2 = routeTable(wheels, ['es']);
    expect(parsePath(t2, '/es/happy')).toEqual({ lang: 'es', route: { kind: 'wheel', wheel: 'core', path: 'happy' } });
    expect(formatRoute(t2, { kind: 'about' }, 'es')).toBe('/es/about');
    expect(formatRoute(t2, { kind: 'wheel', wheel: 'core', path: null }, 'es')).toBe('/es');
  });
  test('reserved names (§1)', () => {
    expect(reservedClash(table, ['assets', 'icons', 'sw.js', 'index.html'], ['en'])).toEqual([]);
    expect(reservedClash(table, ['happy'], ['en'])).toEqual(['happy']);
    expect(reservedClash(table, [], ['sad'])).toEqual(['sad']);
  });
  test('stateFor / pathOf', () => {
    const l = buildLayout(wheel);
    const s = stateFor(l, 'angry/aggressive/hostile')!;
    expect(s).toEqual({ selected: l.byPath.get('angry/aggressive/hostile'), opened: true, view: { mode: 'ring', ring: 2 } });
    expect(pathOf(l, s)).toBe('angry/aggressive/hostile');
    expect(pathOf(l, { ...s, opened: false })).toBeNull();
    expect(stateFor(l, 'angry/nope')).toBeNull();
  });
});

describe('legacy hash (removed in Task 5)', () => {
describe('url hash', () => {
  test('initial state has an empty hash', () => {
    expect(toHash(layout, initialState)).toBe('');
  });

  test('selected-only state has empty hash', () => {
    expect(toHash(layout, { ...initialState, selected: idx('angry') })).toBe('');
    expect(toHash(layout, { selected: idx('angry'), opened: false, view: { mode: 'ring', ring: 0 } })).toBe('');
  });

  test('opened round-trip', () => {
    const s: State = { selected: idx('angry/aggressive/hostile'), opened: true, view: { mode: 'ring', ring: 2 } };
    expect(toHash(layout, s)).toBe('#/core/angry/aggressive/hostile');
    expect(fromHash(layout, '#/core/angry/aggressive/hostile')).toEqual(s);
    expect(fromHash(layout, '#/core/angry')).toEqual({ selected: idx('angry'), opened: true, view: { mode: 'ring', ring: 0 } });
  });

  test('legacy ?ring= query is ignored', () => {
    for (const h of ['#/core/angry?ring=2', '#/core/angry?ring=x', '#/core/angry?ring=0']) {
      expect(fromHash(layout, h), h).toEqual({ selected: idx('angry'), opened: true, view: { mode: 'ring', ring: 0 } });
    }
  });

  test('malformed, unknown or path-less hashes return null', () => {
    for (const h of ['', '#', '#/core', '#/core?ring=0', '#/core/angry/nope', '#/other/angry', '#%%%', 'garbage']) {
      expect(fromHash(layout, h), h).toBeNull();
    }
  });
});

describe('url hash: more than one wheel (v2 §4.3)', () => {
  test('body base URL is #/body', () => {
    expect(toHash(body, initialState, false)).toBe('#/body');
    expect(toHash(body, { ...initialState, selected: body.byPath.get('chest')! }, false)).toBe('#/body');
  });

  test('body opened round-trip', () => {
    const i = body.byPath.get('chest/racing-heart/scared')!;
    const s: State = { selected: i, opened: true, view: { mode: 'ring', ring: 2 } };
    expect(toHash(body, s, false)).toBe('#/body/chest/racing-heart/scared');
    expect(fromHash(body, '#/body/chest/racing-heart/scared')).toEqual(s);
    expect(fromHash(body, '#/body')).toBeNull();
  });

  test('the core base URL stays empty', () => {
    expect(toHash(layout, initialState, true)).toBe('');
    expect(toHash(layout, initialState)).toBe('');
  });

  test('hashWheel names a known wheel or null', () => {
    expect(hashWheel('#/body', ids)).toBe('body');
    expect(hashWheel('#/body/chest/racing-heart', ids)).toBe('body');
    expect(hashWheel('#/core/angry', ids)).toBe('core');
    expect(hashWheel('#/nowhere', ids)).toBeNull();
    expect(hashWheel('', ids)).toBeNull();
    expect(hashWheel('#%%%', ids)).toBeNull();
  });
});
});
