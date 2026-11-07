import { describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { buildLayout } from '../../src/model/layout';
import { createHistoryWriter, historyOp, startState } from '../../src/state/history';
import { initialState, reduce, type Action, type State } from '../../src/state/store';

const layout = buildLayout(loadData().wheel);
const idx = (p: string): number => layout.byPath.get(p)!;

function fakeHistory() {
  const calls: string[] = [];
  return {
    calls,
    pushState: (_d: unknown, _t: string, url?: string | URL | null) => { calls.push(`push ${url}`); },
    replaceState: (_d: unknown, _t: string, url?: string | URL | null) => { calls.push(`replace ${url}`); },
  };
}

describe('history writer', () => {
  test('separate changes push separate entries', () => {
    let now = 0;
    const h = fakeHistory();
    const w = createHistoryWriter(h, () => now);
    w.push('#/core/angry');
    now += 1000;
    w.push('#/core/sad');
    expect(h.calls).toEqual(['push #/core/angry', 'push #/core/sad']);
  });

  test('a burst of rapid changes (held arrow key) becomes one entry', () => {
    let now = 0;
    const h = fakeHistory();
    const w = createHistoryWriter(h, () => now);
    for (let i = 0; i < 20; i++) {
      w.push(`#/core/x${i}`);
      now += 30;
    }
    expect(h.calls.filter((c) => c.startsWith('push'))).toHaveLength(1);
    expect(h.calls.at(-1)).toBe('replace #/core/x19');
  });

  test('replace always replaces the current entry', () => {
    let now = 0;
    const h = fakeHistory();
    const w = createHistoryWriter(h, () => now);
    w.push('#/core/angry');
    now += 1000;
    w.replace('#/core/sad');
    now += 1000;
    w.push('#/core/happy');
    expect(h.calls).toEqual(['push #/core/angry', 'replace #/core/sad', 'push #/core/happy']);
  });

  test('a throwing History API (Safari SecurityError) never throws out', () => {
    const throwing = {
      pushState: () => { throw new Error('SecurityError'); },
      replaceState: () => { throw new Error('SecurityError'); },
    };
    const w = createHistoryWriter(throwing, () => 0);
    expect(() => w.push('#/core/angry')).not.toThrow();
  });

  test('replace never throws', () => {
    const throwing = {
      pushState: () => { throw new Error('SecurityError'); },
      replaceState: () => { throw new Error('SecurityError'); },
    };
    const w = createHistoryWriter(throwing, () => 0);
    expect(() => w.replace('#/core/angry')).not.toThrow();
  });
});

describe('startState', () => {
  const phone = { width: 375, height: 400, radius: 179.5 };
  const desktop = { width: 1440, height: 900, radius: 442 };

  test('startState: phone picks a core word via random(), selected not opened, ring 0', () => {
    expect(startState(layout, phone, () => 0.99)).toEqual({
      selected: layout.rings[0]!.segments[6], opened: false, view: { mode: 'ring', ring: 0 }, hinted: true,
    });
    expect(startState(layout, phone, () => 0).selected).toBe(layout.rings[0]!.segments[0]);
  });

  test('startState: desktop is initialState', () => {
    expect(startState(layout, desktop, () => 0.5)).toBe(initialState);
  });
});

describe('historyOp', () => {
  const sel: State = { ...initialState, selected: idx('angry'), hinted: false };
  const opn: State = { selected: idx('angry'), opened: true, view: { mode: 'ring', ring: 0 }, hinted: false };
  const op = (prev: State, a: Action) => historyOp(prev, reduce(layout, prev, a), a);

  test('historyOp table: select → none; open → push; settled while opened → replace; close → push; restore → none', () => {
    expect(op(initialState, { type: 'select', segment: idx('angry') })).toBe('none');
    expect(op(sel, { type: 'select', segment: idx('angry') })).toBe('push');
    expect(op(sel, { type: 'open', segment: idx('sad') })).toBe('push');
    expect(op(opn, { type: 'settled', segment: idx('sad') })).toBe('replace');
    expect(op(opn, { type: 'close' })).toBe('push');
    expect(op(sel, { type: 'restore', state: opn })).toBe('none');
    expect(op(opn, { type: 'step', delta: 1 })).toBe('push');
  });
});
