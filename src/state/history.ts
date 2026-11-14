import type { Action, State } from './store';

const sameUrl = (a: State, b: State): boolean =>
  a.opened === b.opened && (!a.opened || a.selected === b.selected);

/**
 * How a transition writes history (URL redesign spec §4). Within one wheel every URL change replaces the entry:
 * opening, moving between words, closing and Start over. Only switching wheels and opening About push, and the
 * router does that, not this function.
 */
export function historyOp(prev: State, next: State, a: Action): 'replace' | 'none' {
  if (a.type === 'restore' || sameUrl(prev, next)) return 'none';
  return 'replace';
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
