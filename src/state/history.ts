import { shouldStartZoomed } from '../camera';
import type { Layout } from '../model/layout';
import type { Viewport } from '../model/geometry';
import { initialState, type Action, type State } from './store';

/**
 * The state at the base URL (spec §3.2): on phones a uniformly random core word, selected and centred in the core
 * ring view; on large screens the whole wheel with nothing selected.
 */
export function startState(layout: Layout, vp: Viewport, random: () => number): State {
  if (!shouldStartZoomed(layout, vp)) return initialState;
  const core = layout.rings[0]!.segments;
  const k = Math.min(core.length - 1, Math.floor(random() * core.length));
  return { selected: core[k]!, opened: false, view: { mode: 'ring', ring: 0 }, hinted: true };
}

const sameHash = (a: State, b: State): boolean =>
  a.opened === b.opened && (!a.opened || a.selected === b.selected);

/** How a transition writes history (spec §3.6). */
export function historyOp(prev: State, next: State, a: Action): 'push' | 'replace' | 'none' {
  if (a.type === 'restore' || sameHash(prev, next)) return 'none';
  if (a.type === 'settled' && prev.opened && next.opened) return 'replace';
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
