import { describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { buildLayout } from '../../src/model/layout';
import { initialState, type State } from '../../src/state/store';
import { fromHash, toHash } from '../../src/state/url';

const layout = buildLayout(loadData().wheel);
const idx = (p: string): number => layout.byPath.get(p)!;

describe('url hash', () => {
  test('initial state has an empty hash', () => {
    expect(toHash(layout, initialState)).toBe('');
  });

  test('round-trip overview with selection', () => {
    const s: State = { ...initialState, selected: idx('angry'), focused: idx('angry') };
    expect(toHash(layout, s)).toBe('#/core/angry');
    expect(fromHash(layout, '#/core/angry')).toEqual(s);
  });

  test('round-trip ring mode with selection', () => {
    const s: State = { selected: idx('angry/aggressive/hostile'), focused: idx('angry/aggressive/hostile'), view: { mode: 'ring', ring: 2 }, interacted: true };
    const hash = toHash(layout, s);
    expect(hash).toBe('#/core/angry/aggressive/hostile?ring=2');
    expect(fromHash(layout, hash)).toEqual(s);
  });

  test('ring mode without selection', () => {
    const s: State = { ...initialState, view: { mode: 'ring', ring: 0 } };
    expect(toHash(layout, s)).toBe('#/core?ring=0');
    expect(fromHash(layout, '#/core?ring=0')).toEqual(s);
  });

  test('malformed or unknown hashes return null', () => {
    for (const h of ['', '#', '#/core/angry/nope', '#/other/angry', '#%%%', 'garbage']) {
      expect(fromHash(layout, h), h).toBeNull();
    }
  });

  test('a valid path with an invalid ring gives overview', () => {
    for (const h of ['#/core/angry?ring=x', '#/core/angry?ring=9', '#/core/angry?ring=-1']) {
      expect(fromHash(layout, h), h).toEqual({ ...initialState, selected: idx('angry'), focused: idx('angry') });
    }
  });
});
