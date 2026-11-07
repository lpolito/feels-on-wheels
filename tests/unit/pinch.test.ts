import { describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { buildLayout } from '../../src/model/layout';
import { PINCH_CLOSE, PINCH_IN, PINCH_STEP_OUT, resolvePinch } from '../../src/model/pinch';
import { initialState, reduce, type State } from '../../src/state/store';

const layout = buildLayout(loadData().wheel);
const idx = (p: string): number => layout.byPath.get(p)!;
const opened = (p: string): State => ({ selected: idx(p), opened: true, view: { mode: 'ring', ring: layout.segments[idx(p)]!.ring }, hinted: false });
const phoneStart: State = { selected: idx('angry'), opened: false, view: { mode: 'ring', ring: 0 }, hinted: true };

describe('resolvePinch', () => {
  test('thresholds match the spec', () => {
    expect([PINCH_IN, PINCH_STEP_OUT, PINCH_CLOSE]).toEqual([1.15, 0.87, 0.6]);
  });

  test('pinch in on the whole wheel opens the word under the fingers', () => {
    expect(resolvePinch(layout, initialState, 1.5, idx('sad'))).toEqual({ type: 'open', segment: idx('sad') });
    const sel = { ...initialState, selected: idx('angry'), hinted: false };
    expect(resolvePinch(layout, sel, 1.2, idx('sad/hurt'))).toEqual({ type: 'open', segment: idx('sad/hurt') });
  });

  test('pinch in over the hole or outside the wheel does nothing', () => {
    expect(resolvePinch(layout, initialState, 2, null)).toBeNull();
    expect(resolvePinch(layout, opened('angry'), 2, null)).toBeNull();
  });

  test('pinch in on the opened word goes to its centre child', () => {
    expect(resolvePinch(layout, opened('angry/aggressive'), 1.3, idx('angry/aggressive'))).toEqual({ type: 'toChild' });
    const s = opened('angry/aggressive');
    expect(reduce(layout, s, { type: 'toChild' })).toEqual(opened('angry/aggressive/hostile'));
  });

  test('pinch in on another word while opened opens it', () => {
    expect(resolvePinch(layout, opened('angry/aggressive'), 1.3, idx('angry/mad'))).toEqual({ type: 'open', segment: idx('angry/mad') });
  });

  test('pinch in on an opened leaf yields toChild, which the reducer ignores', () => {
    const s = opened('angry/aggressive/hostile');
    const a = resolvePinch(layout, s, 1.4, idx('angry/aggressive/hostile'));
    expect(a).toEqual({ type: 'toChild' });
    expect(reduce(layout, s, a!)).toBe(s);
  });

  test('small pinch out while opened opens the parent', () => {
    expect(resolvePinch(layout, opened('angry/aggressive'), 0.8, idx('sad'))).toEqual({ type: 'toParent' });
    expect(resolvePinch(layout, opened('angry/aggressive'), 0.6, null)).toEqual({ type: 'toParent' });
  });

  test('big pinch out while opened closes', () => {
    expect(resolvePinch(layout, opened('angry/aggressive'), 0.59, null)).toEqual({ type: 'close' });
  });

  test('pinch out in phone-start view returns to the wheel keeping the selection', () => {
    for (const ratio of [0.8, 0.3]) {
      const a = resolvePinch(layout, phoneStart, ratio, null);
      expect(a).toEqual({ type: 'restore', state: { ...phoneStart, view: { mode: 'wheel' } } });
    }
  });

  test('pinch out on the whole wheel does nothing (snap back)', () => {
    expect(resolvePinch(layout, initialState, 0.5, null)).toBeNull();
    expect(resolvePinch(layout, { ...initialState, selected: idx('angry') }, 0.8, idx('angry'))).toBeNull();
  });

  test('ratios between thresholds do nothing', () => {
    for (const r of [0.87, 0.95, 1, 1.1, 1.15]) {
      expect(resolvePinch(layout, opened('angry/aggressive'), r, idx('angry/aggressive')), String(r)).toBeNull();
      expect(resolvePinch(layout, initialState, r, idx('sad')), String(r)).toBeNull();
    }
  });
});
