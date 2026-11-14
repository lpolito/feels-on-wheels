import type { Action, State } from './store';

const sameUrl = (a: State, b: State): boolean =>
  a.opened === b.opened && (!a.opened || a.selected === b.selected);

/** Moving by direction between open words: spins settling, arrow keys, swipes, `−` and small pinches out. */
const MOVES = new Set<Action['type']>(['settled', 'step', 'toChild', 'toParent', 'stepOut']);

/**
 * How a transition writes history (history rule spec, 2026-11-14, which replaces the URL redesign's §4 with main's
 * v1.3.1 rule). Moving by direction from one open word to the next replaces the entry; picking a word or a place
 * (a tap, Enter, a pinch in, a card link) and closing push. Switching wheels and About push from the router.
 */
export function historyOp(prev: State, next: State, a: Action): 'push' | 'replace' | 'none' {
  if (a.type === 'restore' || sameUrl(prev, next)) return 'none';
  if (prev.opened && next.opened && MOVES.has(a.type)) return 'replace';
  return 'push';
}

const COALESCE_MS = 250;

export interface HistoryWriter {
  /**
   * `state` is the entry's `history.state` (About's `{ fwInApp: true }`, URL redesign spec §3). A push with state is
   * always its own entry, never coalesced: replacing the entry before it would lose the page its state points back to.
   */
  push(url: string, state?: unknown): void;
  replace(url: string): void;
}

/**
 * Writes the URL to history. Pushes closer together than 250ms (a held arrow key) replace the entry instead, and
 * History API errors (Safari/Firefox throw past ~100 pushes per 10s) are swallowed.
 */
export function createHistoryWriter(
  h: Pick<History, 'pushState' | 'replaceState'>, now: () => number, coalesceMs = COALESCE_MS,
): HistoryWriter {
  let last = -Infinity;
  return {
    push(url, state = null) {
      const t = now();
      try {
        if (state === null && t - last < coalesceMs) h.replaceState(null, '', url);
        else h.pushState(state, '', url);
      } catch {
        // The URL is a convenience; the app state is already correct.
      }
      last = t;
    },
    replace(url) {
      try {
        h.replaceState(null, '', url);
      } catch {
        // As above.
      }
    },
  };
}
