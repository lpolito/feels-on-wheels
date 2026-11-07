import { describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { buildLayout } from '../../src/model/layout';
import { createHistoryWriter, defaultState } from '../../src/state/history';
import { initialState } from '../../src/state/store';

const layout = buildLayout(loadData().wheel);

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
    const write = createHistoryWriter(h, () => now);
    write('#/core/angry');
    now += 1000;
    write('#/core/sad');
    expect(h.calls).toEqual(['push #/core/angry', 'push #/core/sad']);
  });

  test('a burst of rapid changes (held arrow key) becomes one entry', () => {
    let now = 0;
    const h = fakeHistory();
    const write = createHistoryWriter(h, () => now);
    for (let i = 0; i < 20; i++) {
      write(`#/core/x${i}`);
      now += 30;
    }
    expect(h.calls.filter((c) => c.startsWith('push'))).toHaveLength(1);
    expect(h.calls.at(-1)).toBe('replace #/core/x19');
  });

  test('a throwing History API (Safari SecurityError) never throws out', () => {
    const throwing = {
      pushState: () => { throw new Error('SecurityError'); },
      replaceState: () => { throw new Error('SecurityError'); },
    };
    const write = createHistoryWriter(throwing, () => 0);
    expect(() => write('#/core/angry')).not.toThrow();
  });
});

describe('defaultState', () => {
  test('phones start zoomed on the core ring; desktops on the overview', () => {
    expect(defaultState(layout, { width: 375, height: 400, radius: 179.5 })).toEqual({ ...initialState, view: { mode: 'ring', ring: 0 } });
    expect(defaultState(layout, { width: 1440, height: 900, radius: 442 })).toEqual(initialState);
  });
});
