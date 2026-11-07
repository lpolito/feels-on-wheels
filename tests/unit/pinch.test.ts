import { describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { buildLayout } from '../../src/model/layout';
import { PINCH_CLOSE, PINCH_IN, PINCH_STEP_OUT, resolvePinch } from '../../src/model/pinch';
import { initialState, reduce, type State } from '../../src/state/store';

const layout = buildLayout(loadData().wheel);
const idx = (p: string): number => layout.byPath.get(p)!;
const opened = (p: string): State => ({ selected: idx(p), opened: true, view: { mode: 'ring', ring: layout.segments[idx(p)]!.ring }, hinted: false });

describe('resolvePinch', () => {
  test('thresholds match the spec', () => {
    expect([PINCH_IN, PINCH_STEP_OUT, PINCH_CLOSE]).toEqual([1.35, 0.8, 0.55]);
  });

  test('pinch in on the whole wheel opens the word under the fingers', () => {
    expect(resolvePinch(layout, initialState, 1.5, idx('sad'))).toEqual({ type: 'open', segment: idx('sad') });
    const sel = { ...initialState, selected: idx('angry'), hinted: false };
    expect(resolvePinch(layout, sel, 1.4, idx('sad/hurt'))).toEqual({ type: 'open', segment: idx('sad/hurt') });
  });

  test('pinch in over the hole or outside the wheel does nothing', () => {
    expect(resolvePinch(layout, initialState, 2, null)).toBeNull();
    expect(resolvePinch(layout, opened('angry'), 2, null)).toBeNull();
  });

  test('pinch in on the opened word goes to its centre child', () => {
    expect(resolvePinch(layout, opened('angry/aggressive'), 1.4, idx('angry/aggressive'))).toEqual({ type: 'toChild' });
    const s = opened('angry/aggressive');
    expect(reduce(layout, s, { type: 'toChild' })).toEqual(opened('angry/aggressive/hostile'));
  });

  test('pinch in on another word while opened opens it', () => {
    expect(resolvePinch(layout, opened('angry/aggressive'), 1.4, idx('angry/mad'))).toEqual({ type: 'open', segment: idx('angry/mad') });
  });

  test('pinch in on an opened leaf yields toChild, which the reducer ignores', () => {
    const s = opened('angry/aggressive/hostile');
    const a = resolvePinch(layout, s, 1.4, idx('angry/aggressive/hostile'));
    expect(a).toEqual({ type: 'toChild' });
    expect(reduce(layout, s, a!)).toBe(s);
  });

  test('small pinch out while opened opens the parent', () => {
    expect(resolvePinch(layout, opened('angry/aggressive'), 0.7, idx('sad'))).toEqual({ type: 'toParent' });
    expect(resolvePinch(layout, opened('angry/aggressive'), 0.55, null)).toEqual({ type: 'toParent' });
  });

  test('big pinch out while opened closes', () => {
    expect(resolvePinch(layout, opened('angry/aggressive'), 0.54, null)).toEqual({ type: 'close' });
  });

  test('pinch out on the whole wheel with a selection does nothing', () => {
    const sel: State = { ...initialState, selected: idx('angry'), hinted: false };
    for (const ratio of [0.7, 0.3]) expect(resolvePinch(layout, sel, ratio, null), String(ratio)).toBeNull();
    // A ring view that isn't opened no longer occurs; even so, pinching out of it does nothing.
    expect(resolvePinch(layout, { ...sel, view: { mode: 'ring', ring: 0 } }, 0.5, null)).toBeNull();
  });

  test('pinch out on the whole wheel does nothing (snap back)', () => {
    expect(resolvePinch(layout, initialState, 0.5, null)).toBeNull();
    expect(resolvePinch(layout, { ...initialState, selected: idx('angry') }, 0.8, idx('angry'))).toBeNull();
  });

  test('pinch in just either side of PINCH_IN', () => {
    expect(resolvePinch(layout, initialState, 1.34, idx('sad'))).toBeNull();
    expect(resolvePinch(layout, initialState, 1.36, idx('sad'))).toEqual({ type: 'open', segment: idx('sad') });
  });

  test('ratios between thresholds do nothing', () => {
    for (const r of [0.8, 0.95, 1, 1.2, 1.35]) {
      expect(resolvePinch(layout, opened('angry/aggressive'), r, idx('angry/aggressive')), String(r)).toBeNull();
      expect(resolvePinch(layout, initialState, r, idx('sad')), String(r)).toBeNull();
    }
  });
});
