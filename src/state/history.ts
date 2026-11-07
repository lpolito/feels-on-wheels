import { shouldStartZoomed } from '../camera';
import type { Layout } from '../model/layout';
import type { Viewport } from '../model/geometry';
import { initialState, type State } from './store';

/** The state with no URL: zoomed on the core ring when the overview's outer labels would be unreadable (spec §4.6). */
export function defaultState(layout: Layout, vp: Viewport): State {
  return shouldStartZoomed(layout, vp) ? { ...initialState, view: { mode: 'ring', ring: 0 } } : initialState;
}

const COALESCE_MS = 250;

/**
 * Writes the URL to history. Changes closer together than 250ms (a held arrow key) replace the entry
 * instead of pushing, and History API errors (Safari/Firefox throw past ~100 pushes per 10s) are swallowed.
 */
export function createHistoryWriter(
  h: Pick<History, 'pushState' | 'replaceState'>, now: () => number, coalesceMs = COALESCE_MS,
): (url: string) => void {
  let last = -Infinity;
  return (url) => {
    const t = now();
    try {
      if (t - last < coalesceMs) h.replaceState(null, '', url);
      else h.pushState(null, '', url);
    } catch {
      // The URL is a convenience; the app state is already correct.
    }
    last = t;
  };
}
