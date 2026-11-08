import { describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { buildLayout, homes } from '../../src/model/layout';
import { initialState, type State } from '../../src/state/store';
import { fromHash, hashWheel, toHash } from '../../src/state/url';

const { wheel, wheels } = loadData();
const layout = buildLayout(wheel);
const body = buildLayout(wheels[1]!, homes(layout));
const ids = ['core', 'body'];
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
