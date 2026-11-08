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
