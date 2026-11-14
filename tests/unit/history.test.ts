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
    w.push('/angry');
    now += 1000;
    w.push('/sad');
    expect(h.calls).toEqual(['push /angry', 'push /sad']);
  });

  test('a burst of rapid changes (held arrow key) becomes one entry', () => {
    let now = 0;
    const h = fakeHistory();
    const w = createHistoryWriter(h, () => now);
    for (let i = 0; i < 20; i++) {
      w.push(`/x${i}`);
      now += 30;
    }
    expect(h.calls.filter((c) => c.startsWith('push'))).toHaveLength(1);
    expect(h.calls.at(-1)).toBe('replace /x19');
  });

  test('replace always replaces the current entry', () => {
    let now = 0;
    const h = fakeHistory();
    const w = createHistoryWriter(h, () => now);
    w.push('/angry');
    now += 1000;
    w.replace('/sad');
    now += 1000;
    w.push('/happy');
    expect(h.calls).toEqual(['push /angry', 'replace /sad', 'push /happy']);
  });

  test('a push can carry entry state (About\'s { fwInApp: true }), and is then always its own entry', () => {
    let now = 0;
    const calls: unknown[] = [];
    const h = {
      pushState: (d: unknown, _t: string, url?: string | URL | null) => { calls.push(['push', url, d]); },
      replaceState: (d: unknown, _t: string, url?: string | URL | null) => { calls.push(['replace', url, d]); },
    };
    const w = createHistoryWriter(h, () => now);
    w.push('/body');
    now += 10;
    w.push('/about', { fwInApp: true });
    now += 10;
    w.push('/');
    expect(calls).toEqual([['push', '/body', null], ['push', '/about', { fwInApp: true }], ['replace', '/', null]]);
  });

  test('a throwing History API (Safari SecurityError) never throws out', () => {
    const throwing = {
      pushState: () => { throw new Error('SecurityError'); },
      replaceState: () => { throw new Error('SecurityError'); },
    };
    const w = createHistoryWriter(throwing, () => 0);
    expect(() => w.push('/angry')).not.toThrow();
  });

  test('replace never throws', () => {
    const throwing = {
      pushState: () => { throw new Error('SecurityError'); },
      replaceState: () => { throw new Error('SecurityError'); },
    };
    const w = createHistoryWriter(throwing, () => 0);
    expect(() => w.replace('/angry')).not.toThrow();
  });
});

describe('historyOp', () => {
  const sel: State = { ...initialState, selected: idx('angry') };
  const opn: State = { selected: idx('angry'), opened: true, view: { mode: 'ring', ring: 0 } };
  const outer: State = { selected: idx('angry/aggressive/hostile'), opened: true, view: { mode: 'ring', ring: 2 } };
  const op = (prev: State, a: Action) => historyOp(prev, reduce(layout, prev, a), a);

  test('restore and select-only changes leave history alone', () => {
    expect(op(initialState, { type: 'select', segment: idx('angry') })).toBe('none');
    expect(op(sel, { type: 'select', segment: idx('sad') })).toBe('none');
    expect(op(sel, { type: 'restore', state: opn })).toBe('none');
  });

  test('picking a word or a place adds an entry (history rule spec)', () => {
    expect(op(sel, { type: 'select', segment: idx('angry') })).toBe('push'); // a tap on the selected word opens it
    expect(op(sel, { type: 'open', segment: idx('sad') })).toBe('push');
    expect(op(opn, { type: 'open', segment: idx('sad') })).toBe('push'); // a tap on another word, or a card link
    expect(op(sel, { type: 'activate' })).toBe('push'); // Enter or +
    expect(op(opn, { type: 'close' })).toBe('push');
    expect(op(opn, { type: 'clear' })).toBe('push'); // Start over
    expect(op(opn, { type: 'escape' })).toBe('push');
    expect(op(opn, { type: 'toParent' })).toBe('push'); // ← on a core word closes it
  });

  test('moving by direction between open words replaces the entry (history rule spec)', () => {
    expect(op(opn, { type: 'settled', segment: idx('sad') })).toBe('replace'); // a spin
    expect(op(opn, { type: 'step', delta: 1 })).toBe('replace'); // ↑ ↓
    expect(op(opn, { type: 'toChild' })).toBe('replace'); // →, a swipe
    expect(op(outer, { type: 'toParent' })).toBe('replace'); // ←, a swipe, a small pinch out
    expect(op(outer, { type: 'stepOut' })).toBe('replace'); // −
  });
});
