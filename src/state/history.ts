import type { Action, State } from './store';

const sameHash = (a: State, b: State): boolean =>
  a.opened === b.opened && (!a.opened || a.selected === b.selected);

/** Stepping through words rather than choosing one: arrow keys, swipes, a spin settling. */
const MOVES = new Set<Action['type']>(['settled', 'step', 'toChild', 'toParent', 'stepOut']);

/**
 * How a transition writes history (spec §3.6, changed in v1.3.1). Moving from one opened word to the next replaces
 * the entry, so browsing by keys or spins doesn't fill the history; opening a word by tap, link or Enter, and
 * closing, push. Back steps through the words chosen, then to the whole wheel.
 */
export function historyOp(prev: State, next: State, a: Action): 'push' | 'replace' | 'none' {
  if (a.type === 'restore' || sameHash(prev, next)) return 'none';
  if (prev.opened && next.opened && MOVES.has(a.type)) return 'replace';
  return 'push';
}

const COALESCE_MS = 250;

export interface HistoryWriter {
  push(url: string): void;
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
    push(url) {
      const t = now();
      try {
        if (t - last < coalesceMs) h.replaceState(null, '', url);
        else h.pushState(null, '', url);
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
