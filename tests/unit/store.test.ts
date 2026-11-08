import { describe, expect, test, vi } from 'vitest';
import { loadData } from '../../src/data/load';
import { buildLayout } from '../../src/model/layout';
import { centerChild, createStore, initialState, reduce, type Action, type State } from '../../src/state/store';

const layout = buildLayout(loadData().wheel);
const idx = (p: string): number => layout.byPath.get(p)!;
const run = (s: State, ...actions: Action[]): State => actions.reduce((acc, a) => reduce(layout, acc, a), s);
const wheel = { mode: 'wheel' } as const;
const ring = (r: number) => ({ mode: 'ring', ring: r }) as const;
const selected = (p: string, extra: Partial<State> = {}): State => ({ ...initialState, selected: idx(p), ...extra });
const opened = (p: string): State => ({ selected: idx(p), opened: true, view: ring(layout.segments[idx(p)]!.ring) });

describe('initial state', () => {
  test('nothing selected, whole wheel, hint showing', () => {
    expect(initialState).toEqual({ selected: null, opened: false, view: wheel });
  });
});

describe('select', () => {
  test('select on the wheel selects without opening or moving the view', () => {
    const s = run(initialState, { type: 'select', segment: idx('angry/aggressive') });
    expect(s).toEqual({ selected: idx('angry/aggressive'), opened: false, view: wheel });
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

});

describe('open / close / clear / escape', () => {
  test('open from nothing opens in the word ring', () => {
    expect(run(initialState, { type: 'open', segment: idx('angry/aggressive/hostile') })).toEqual(opened('angry/aggressive/hostile'));
  });

  test('close keeps the selection and returns to wheel', () => {
    const s = run(opened('angry/aggressive'), { type: 'close' });
    expect(s).toEqual({ selected: idx('angry/aggressive'), opened: false, view: wheel });
  });

  test('close when only selected is a no-op (same object)', () => {
    const s = selected('angry');
    expect(reduce(layout, s, { type: 'close' })).toBe(s);
  });

  test('clear drops the selection and returns to wheel', () => {
    expect(run(opened('angry'), { type: 'clear' })).toEqual({ ...initialState });
    expect(run(selected('angry'), { type: 'clear' })).toEqual({ ...initialState });
  });

  test('escape closes then clears', () => {
    const closed = run(opened('angry/aggressive'), { type: 'escape' });
    expect(closed).toEqual(selected('angry/aggressive'));
    expect(run(closed, { type: 'escape' })).toEqual({ ...initialState });
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
    const s = run({ ...initialState, selected: last }, { type: 'step', delta: 1 });
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

  test('stepOut while opened opens the parent; on an opened core it closes', () => {
    expect(run(opened('angry/aggressive/hostile'), { type: 'stepOut' })).toEqual(opened('angry/aggressive'));
    expect(run(opened('angry'), { type: 'stepOut' })).toEqual(selected('angry'));
  });

  test('stepOut while only selected is a no-op', () => {
    const s = selected('angry/aggressive');
    expect(reduce(layout, s, { type: 'stepOut' })).toBe(s);
    expect(reduce(layout, initialState, { type: 'stepOut' })).toBe(initialState);
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

  test('settled on the wheel is a no-op', () => {
    const s = selected('angry');
    expect(reduce(layout, s, { type: 'settled', segment: idx('sad') })).toBe(s);
    expect(reduce(layout, initialState, { type: 'settled', segment: idx('sad') })).toBe(initialState);
  });
});

describe('reachable states', () => {
  test('a word is only ever in a ring view while opened; otherwise the view is the whole wheel', () => {
    let seed = 7;
    const rand = (n: number): number => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed % n;
    };
    const n = layout.segments.length;
    const actions = (): Action => {
      const all: Action[] = [
        { type: 'select', segment: rand(n) }, { type: 'open', segment: rand(n) }, { type: 'close' }, { type: 'clear' },
        { type: 'step', delta: 1 }, { type: 'step', delta: -1 }, { type: 'toChild' }, { type: 'toParent' },
        { type: 'stepOut' }, { type: 'activate' }, { type: 'escape' }, { type: 'settled', segment: rand(n) },
      ];
      return all[rand(all.length)]!;
    };
    // Start states: the base URL, and every deep link.
    const starts: State[] = [initialState, ...layout.segments.map((g) => opened(g.path))];
    for (const start of starts) {
      let st = start;
      for (let k = 0; k < 60; k++) {
        const a = actions();
        st = reduce(layout, st, a);
        if (st.opened) {
          expect(st.view, a.type).toEqual(ring(layout.segments[st.selected!]!.ring));
        } else {
          expect(st.view, a.type).toEqual(wheel);
        }
      }
    }
  });
});

describe('restore', () => {
  test('restore replaces the state', () => {
    const target = opened('happy');
    expect(run(initialState, { type: 'restore', state: target })).toBe(target);
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
