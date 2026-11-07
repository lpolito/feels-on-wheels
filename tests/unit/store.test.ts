import { describe, expect, test, vi } from 'vitest';
import { loadData } from '../../src/data/load';
import { buildLayout } from '../../src/model/layout';
import { createStore, initialState, reduce, type Action, type State } from '../../src/state/store';

const layout = buildLayout(loadData().wheel);
const idx = (p: string): number => layout.byPath.get(p)!;
const run = (s: State, ...actions: Action[]): State => actions.reduce((acc, a) => reduce(layout, acc, a), s);
const ring = (r: number, extra: Partial<State> = {}): State => ({ ...initialState, view: { mode: 'ring', ring: r }, ...extra });

describe('selection in overview', () => {
  test('select in overview sets selected and focused', () => {
    const s = run(initialState, { type: 'select', segment: idx('angry') });
    expect(s.selected).toBe(idx('angry'));
    expect(s.focused).toBe(idx('angry'));
    expect(s.view).toEqual({ mode: 'overview' });
  });

  test('select same again clears', () => {
    const s = run(initialState, { type: 'select', segment: idx('angry') }, { type: 'select', segment: idx('angry') });
    expect(s.selected).toBeNull();
    expect(s.focused).toBe(idx('angry'));
  });

  test('step in overview moves focus only, wrapping', () => {
    const lastCore = layout.rings[0]!.segments[6]!;
    const s = run({ ...initialState, focused: lastCore }, { type: 'step', delta: 1 });
    expect(s.focused).toBe(layout.rings[0]!.segments[0]);
    expect(s.selected).toBeNull();
  });

  test('escape in overview clears', () => {
    const s = run(initialState, { type: 'select', segment: idx('sad') }, { type: 'escape' });
    expect(s.selected).toBeNull();
  });

  test('toChild / toParent move focus structurally', () => {
    const s = run({ ...initialState, focused: idx('angry') }, { type: 'toChild' });
    expect(s.focused).toBe(idx('angry/let-down'));
    expect(run(s, { type: 'toParent' }).focused).toBe(idx('angry'));
  });

  test('toChild from a leaf is a no-op; toParent from a core is a no-op', () => {
    const leaf = { ...initialState, focused: idx('angry/aggressive/hostile') };
    expect(reduce(layout, leaf, { type: 'toChild' })).toBe(leaf);
    const core = { ...initialState, focused: idx('angry') };
    expect(reduce(layout, core, { type: 'toParent' })).toBe(core);
  });
});

describe('ring mode (picker)', () => {
  test('select in ring mode sets interacted and moves view.ring to the segment ring', () => {
    const s = run(ring(1), { type: 'select', segment: idx('angry/aggressive/hostile') });
    expect(s.view).toEqual({ mode: 'ring', ring: 2 });
    expect(s.interacted).toBe(true);
    expect(s.selected).toBe(idx('angry/aggressive/hostile'));
  });

  test('settled before interaction only moves focus', () => {
    const s = run(ring(0), { type: 'settled', segment: idx('sad') });
    expect(s.focused).toBe(idx('sad'));
    expect(s.selected).toBeNull();
  });

  test('settled after interaction selects', () => {
    const s = run(ring(0), { type: 'interact' }, { type: 'settled', segment: idx('sad') });
    expect(s.selected).toBe(idx('sad'));
    expect(s.focused).toBe(idx('sad'));
  });

  test('clear in ring mode resets interacted but keeps view and focus', () => {
    const s = run(ring(0), { type: 'select', segment: idx('sad') }, { type: 'clear' });
    expect(s.selected).toBeNull();
    expect(s.interacted).toBe(false);
    expect(s.focused).toBe(idx('sad'));
    expect(s.view).toEqual({ mode: 'ring', ring: 0 });
  });

  test('select same in ring mode clears like clear', () => {
    const s = run(ring(0), { type: 'select', segment: idx('sad') }, { type: 'select', segment: idx('sad') });
    expect(s.selected).toBeNull();
    expect(s.interacted).toBe(false);
  });

  test('step in ring mode selects the neighbor', () => {
    const s = run(ring(0, { focused: idx('angry') }), { type: 'step', delta: 1 });
    expect(s.selected).toBe(idx('disgusted'));
    expect(s.focused).toBe(idx('disgusted'));
    expect(s.interacted).toBe(true);
  });

  test('toChild in ring mode moves view.ring + 1 and selects the child', () => {
    const s = run(ring(0, { focused: idx('angry') }), { type: 'toChild' });
    expect(s.view).toEqual({ mode: 'ring', ring: 1 });
    expect(s.selected).toBe(idx('angry/let-down'));
  });

  test('setRing changes the focused ring and ignores invalid rings', () => {
    expect(run(ring(2), { type: 'setRing', ring: 1 }).view).toEqual({ mode: 'ring', ring: 1 });
    const r = ring(2);
    expect(reduce(layout, r, { type: 'setRing', ring: 3 })).toBe(r);
    expect(reduce(layout, initialState, { type: 'setRing', ring: 1 })).toBe(initialState);
  });

  test('escape in ring → overview with selection kept', () => {
    const s = run(ring(0), { type: 'select', segment: idx('sad') }, { type: 'escape' });
    expect(s.view).toEqual({ mode: 'overview' });
    expect(s.selected).toBe(idx('sad'));
  });
});

describe('zoom', () => {
  test('zoomIn with segment selects it and uses its ring', () => {
    const s = run(initialState, { type: 'zoomIn', segment: idx('angry/aggressive') });
    expect(s.view).toEqual({ mode: 'ring', ring: 1 });
    expect(s.selected).toBe(idx('angry/aggressive'));
    expect(s.interacted).toBe(true);
  });

  test('zoomIn without one uses the selected ring, else 0', () => {
    expect(run(initialState, { type: 'zoomIn' }).view).toEqual({ mode: 'ring', ring: 0 });
    const s = run(initialState, { type: 'select', segment: idx('angry/aggressive/hostile') }, { type: 'zoomIn' });
    expect(s.view).toEqual({ mode: 'ring', ring: 2 });
    expect(s.interacted).toBe(true);
  });

  test('zoomOut returns to overview', () => {
    expect(run(ring(1), { type: 'zoomOut' }).view).toEqual({ mode: 'overview' });
  });
});

describe('store', () => {
  test('reduce returns the same object for no-op actions', () => {
    expect(reduce(layout, initialState, { type: 'clear' })).toBe(initialState);
    expect(reduce(layout, initialState, { type: 'zoomOut' })).toBe(initialState);
    expect(reduce(layout, initialState, { type: 'interact' })).toBe(initialState);
  });

  test('restore replaces state', () => {
    const target = ring(2, { selected: idx('sad/lonely/isolated') });
    expect(reduce(layout, initialState, { type: 'restore', state: target })).toEqual(target);
  });

  test('subscribe fires with (state, prev) only on change', () => {
    const store = createStore(layout);
    const fn = vi.fn();
    const off = store.subscribe(fn);
    store.dispatch({ type: 'clear' });
    expect(fn).not.toHaveBeenCalled();
    store.dispatch({ type: 'select', segment: idx('sad') });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn.mock.calls[0]![0].selected).toBe(idx('sad'));
    expect(fn.mock.calls[0]![1]).toBe(initialState);
    off();
    store.dispatch({ type: 'clear' });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
