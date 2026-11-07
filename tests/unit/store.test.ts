import { describe, expect, test, vi } from 'vitest';
import { loadData } from '../../src/data/load';
import { buildLayout } from '../../src/model/layout';
import { centerChild, createStore, initialState, reduce, type Action, type State } from '../../src/state/store';

const layout = buildLayout(loadData().wheel);
const idx = (p: string): number => layout.byPath.get(p)!;
const run = (s: State, ...actions: Action[]): State => actions.reduce((acc, a) => reduce(layout, acc, a), s);
const wheel = { mode: 'wheel' } as const;
const ring = (r: number) => ({ mode: 'ring', ring: r }) as const;
const selected = (p: string, extra: Partial<State> = {}): State => ({ ...initialState, selected: idx(p), hinted: false, ...extra });
const opened = (p: string): State => ({ selected: idx(p), opened: true, view: ring(layout.segments[idx(p)]!.ring), hinted: false });
const phoneStart = (p: string): State => ({ selected: idx(p), opened: false, view: ring(0), hinted: true });

describe('initial state', () => {
  test('nothing selected, whole wheel, hint showing', () => {
    expect(initialState).toEqual({ selected: null, opened: false, view: wheel, hinted: true });
  });
});

describe('select', () => {
  test('select on the wheel selects without opening or moving the view', () => {
    const s = run(initialState, { type: 'select', segment: idx('angry/aggressive') });
    expect(s).toEqual({ selected: idx('angry/aggressive'), opened: false, view: wheel, hinted: false });
  });

  test('select another word moves the selection', () => {
    const s = run(selected('angry'), { type: 'select', segment: idx('sad') });
    expect(s.selected).toBe(idx('sad'));
    expect(s.opened).toBe(false);
  });

  test('select same word opens it', () => {
    const s = run(selected('angry/aggressive'), { type: 'select', segment: idx('angry/aggressive') });
    expect(s).toEqual(opened('angry/aggressive'));
  });

  test('select while opened opens the new word in its ring', () => {
    const s = run(opened('angry/aggressive'), { type: 'select', segment: idx('sad/hurt/embarrassed') });
    expect(s).toEqual(opened('sad/hurt/embarrassed'));
  });

  test('select in phone-start ring view keeps it selected, not opened', () => {
    const s = run(phoneStart('angry'), { type: 'select', segment: idx('sad') });
    expect(s).toEqual({ selected: idx('sad'), opened: false, view: ring(0), hinted: false });
  });

  test('select a word outside the phone-start ring follows it to its ring, still not opened', () => {
    const s = run(phoneStart('angry'), { type: 'select', segment: idx('angry/aggressive') });
    expect(s).toEqual({ selected: idx('angry/aggressive'), opened: false, view: ring(1), hinted: false });
  });
});

describe('open / close / clear / escape', () => {
  test('open from nothing opens in the word ring', () => {
    expect(run(initialState, { type: 'open', segment: idx('angry/aggressive/hostile') })).toEqual(opened('angry/aggressive/hostile'));
  });

  test('close keeps the selection and returns to wheel', () => {
    const s = run(opened('angry/aggressive'), { type: 'close' });
    expect(s).toEqual({ selected: idx('angry/aggressive'), opened: false, view: wheel, hinted: false });
  });

  test('close when only selected is a no-op (same object)', () => {
    const s = selected('angry');
    expect(reduce(layout, s, { type: 'close' })).toBe(s);
  });

  test('clear drops the selection and returns to wheel', () => {
    expect(run(opened('angry'), { type: 'clear' })).toEqual({ ...initialState, hinted: false });
    expect(run(selected('angry'), { type: 'clear' })).toEqual({ ...initialState, hinted: false });
  });

  test('escape closes then clears', () => {
    const closed = run(opened('angry/aggressive'), { type: 'escape' });
    expect(closed).toEqual(selected('angry/aggressive'));
    expect(run(closed, { type: 'escape' })).toEqual({ ...initialState, hinted: false });
  });
});

describe('step', () => {
  test('step with nothing selected selects the first core', () => {
    const s = run(initialState, { type: 'step', delta: 1 });
    expect(s.selected).toBe(layout.rings[0]!.segments[0]);
    expect(s.opened).toBe(false);
  });

  test('step while selected selects the ring neighbour, wrapping', () => {
    const last = layout.rings[0]!.segments[6]!;
    const s = run({ ...initialState, selected: last, hinted: false }, { type: 'step', delta: 1 });
    expect(s).toEqual(selected('fearful'));
    expect(run(selected('angry'), { type: 'step', delta: 1 }).selected).toBe(idx('disgusted'));
  });

  test('step while opened opens the ring neighbour', () => {
    expect(run(opened('angry'), { type: 'step', delta: -1 })).toEqual(opened('fearful'));
  });
});

describe('toChild / toParent', () => {
  test('toChild while selected selects the first child', () => {
    expect(run(selected('angry'), { type: 'toChild' })).toEqual(selected('angry/let-down'));
  });

  test('toChild while opened opens the centre child', () => {
    expect(run(opened('angry/aggressive'), { type: 'toChild' })).toEqual(opened('angry/aggressive/hostile'));
  });

  test('toChild on an opened leaf is a no-op (same object)', () => {
    const s = opened('angry/aggressive/hostile');
    expect(reduce(layout, s, { type: 'toChild' })).toBe(s);
  });

  test('toChild on a selected leaf is a no-op (same object)', () => {
    const s = selected('angry/aggressive/hostile');
    expect(reduce(layout, s, { type: 'toChild' })).toBe(s);
  });

  test('toParent while selected selects the parent; at the core it is a no-op', () => {
    expect(run(selected('angry/aggressive'), { type: 'toParent' })).toEqual(selected('angry'));
    const core = selected('angry');
    expect(reduce(layout, core, { type: 'toParent' })).toBe(core);
  });

  test('toParent while opened opens the parent', () => {
    expect(run(opened('angry/aggressive/hostile'), { type: 'toParent' })).toEqual(opened('angry/aggressive'));
  });

  test('toParent on an opened core closes', () => {
    expect(run(opened('angry'), { type: 'toParent' })).toEqual(selected('angry'));
  });

  test('centerChild(angry/aggressive) is hostile', () => {
    expect(centerChild(layout, idx('angry/aggressive'))).toBe(idx('angry/aggressive/hostile'));
    expect(centerChild(layout, idx('angry/aggressive/hostile'))).toBeNull();
  });
});

describe('activate', () => {
  test('activate with nothing selected selects the first core', () => {
    expect(run(initialState, { type: 'activate' }).selected).toBe(layout.rings[0]!.segments[0]);
  });

  test('activate while selected opens', () => {
    expect(run(selected('sad'), { type: 'activate' })).toEqual(opened('sad'));
  });

  test('activate while opened is a no-op (same object)', () => {
    const s = opened('sad');
    expect(reduce(layout, s, { type: 'activate' })).toBe(s);
  });
});

describe('settled', () => {
  test('settled while opened opens the word in the opened ring', () => {
    expect(run(opened('angry/aggressive'), { type: 'settled', segment: idx('angry/mad') })).toEqual(opened('angry/mad'));
  });

  test('settled while opened ignores a word from another ring', () => {
    const s = opened('angry/aggressive');
    expect(reduce(layout, s, { type: 'settled', segment: idx('sad') })).toBe(s);
  });

  test('settled in phone-start ring view selects without opening', () => {
    const s = run(phoneStart('angry'), { type: 'settled', segment: idx('sad') });
    expect(s).toEqual({ ...phoneStart('sad') });
  });

  test('settled on the wheel is a no-op', () => {
    const s = selected('angry');
    expect(reduce(layout, s, { type: 'settled', segment: idx('sad') })).toBe(s);
    expect(reduce(layout, initialState, { type: 'settled', segment: idx('sad') })).toBe(initialState);
  });
});

describe('hint and restore', () => {
  test('every user action clears hinted; restore and settled keep it', () => {
    const user: Action[] = [
      { type: 'select', segment: idx('sad') }, { type: 'open', segment: idx('sad') }, { type: 'close' }, { type: 'clear' },
      { type: 'step', delta: 1 }, { type: 'toChild' }, { type: 'toParent' }, { type: 'activate' }, { type: 'escape' },
      { type: 'dismissHint' },
    ];
    for (const a of user) expect(run(phoneStart('angry'), a).hinted, a.type).toBe(false);
    expect(run(phoneStart('angry'), { type: 'settled', segment: idx('sad') }).hinted).toBe(true);
    const target = phoneStart('happy');
    expect(run(initialState, { type: 'restore', state: target })).toBe(target);
  });

  test('dismissHint twice is a no-op the second time', () => {
    const s = run(initialState, { type: 'dismissHint' });
    expect(reduce(layout, s, { type: 'dismissHint' })).toBe(s);
  });

  test('restore of an equal state keeps identity', () => {
    const s = opened('angry');
    expect(reduce(layout, s, { type: 'restore', state: { ...s, view: { ...s.view } } })).toBe(s);
  });
});

describe('store', () => {
  test('subscribe receives the action as third argument', () => {
    const store = createStore(layout);
    const fn = vi.fn();
    store.subscribe(fn);
    const a: Action = { type: 'select', segment: idx('sad') };
    store.dispatch(a);
    expect(fn).toHaveBeenCalledWith(store.get(), initialState, a);
  });

  test('no-op dispatches do not notify', () => {
    const store = createStore(layout, selected('angry'));
    const fn = vi.fn();
    store.subscribe(fn);
    store.dispatch({ type: 'close' });
    expect(fn).not.toHaveBeenCalled();
  });
});
