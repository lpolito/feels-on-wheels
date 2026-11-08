import { describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { buildLayout } from '../../src/model/layout';
import { createHistoryWriter, historyOp } from '../../src/state/history';
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

describe('historyOp', () => {
  const sel: State = { ...initialState, selected: idx('angry') };
  const opn: State = { selected: idx('angry'), opened: true, view: { mode: 'ring', ring: 0 } };
  const op = (prev: State, a: Action) => historyOp(prev, reduce(layout, prev, a), a);

  test('historyOp table: select → none; open → push; settled while opened → replace; close → push; restore → none', () => {
    expect(op(initialState, { type: 'select', segment: idx('angry') })).toBe('none');
    expect(op(sel, { type: 'select', segment: idx('angry') })).toBe('push');
    expect(op(sel, { type: 'open', segment: idx('sad') })).toBe('push');
    expect(op(opn, { type: 'settled', segment: idx('sad') })).toBe('replace');
    expect(op(opn, { type: 'close' })).toBe('push');
    expect(op(sel, { type: 'restore', state: opn })).toBe('none');
  });

  test('moving between opened words by keys, swipes or spins replaces; deliberate opens push', () => {
    const outer: State = { selected: idx('angry/aggressive/hostile'), opened: true, view: { mode: 'ring', ring: 2 } };
    expect(op(opn, { type: 'step', delta: 1 })).toBe('replace');
    expect(op(opn, { type: 'toChild' })).toBe('replace');
    expect(op(outer, { type: 'toParent' })).toBe('replace');
    expect(op(outer, { type: 'stepOut' })).toBe('replace');
    // Tapping another word or following a card link is a deliberate jump.
    expect(op(opn, { type: 'open', segment: idx('sad') })).toBe('push');
    // Opening from the wheel (Enter) and closing (← on a core word) still push.
    expect(op(sel, { type: 'activate' })).toBe('push');
    expect(op(opn, { type: 'toParent' })).toBe('push');
  });
});
