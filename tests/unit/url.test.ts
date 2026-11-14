import { describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { buildLayout } from '../../src/model/layout';
import { allPaths, formatRoute, parsePath, pathOf, reservedClash, routeTable, stateFor, WORD_MAX, type Route } from '../../src/state/url';

const { wheel, wheels } = loadData();
const table = routeTable(wheels);

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
  test('segments are decoded before the wheel-name and About checks, so an escaped name means the same', () => {
    expect(parsePath(table, '/%62ody').route).toEqual(parsePath(table, '/body').route);
    expect(parsePath(table, '/%62ody').route).toEqual({ kind: 'wheel', wheel: 'body', path: null });
    expect(parsePath(table, '/%62ody/chest/tight-chest').route).toEqual({ kind: 'wheel', wheel: 'body', path: 'chest/tight-chest' });
    expect(parsePath(table, '/%62ody/chest/tight-chst').route).toEqual({ kind: 'notFound', wheel: 'body', word: 'tight-chst' });
    expect(parsePath(table, '/%61bout').route).toEqual({ kind: 'about' });
    expect(parsePath(table, '/%63ore/happy').route.kind).toBe('notFound');
    expect(parsePath(routeTable(wheels, ['es']), '/%65s/about')).toEqual({ lang: 'es', route: { kind: 'about' } });
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
