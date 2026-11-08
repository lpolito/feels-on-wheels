import type { Layout } from './layout';
import type { Action, State } from '../state/store';

/** Spec v1.2 §3.4: each relative to the scale when the gesture started. */
export const PINCH_IN = 1.35;
export const PINCH_STEP_OUT = 0.8;
export const PINCH_CLOSE = 0.55;

/**
 * Spec §3.4: what a pinch does when it ends. Always resolves to the word under the fingers, the selection's parent,
 * the whole wheel, or nothing — never whatever sits at 3 o'clock. Pinching in on the opened word itself does nothing
 * (spec v1.3 §3.3); drilling down means aiming at a child.
 * @param ratio release scale / scale at gesture start
 * @param hit segment under the pinch midpoint, or null over the hole / outside the wheel
 */
export function resolvePinch(_layout: Layout, s: State, ratio: number, hit: number | null): Action | null {
  if (ratio > PINCH_IN) {
    if (hit === null || (s.opened && hit === s.selected)) return null;
    return { type: 'open', segment: hit };
  }
  // Pinching out of the whole wheel springs back (spec v1.2 §3.1: there is no zoomed start view to leave).
  if (ratio < PINCH_STEP_OUT && s.opened) return ratio < PINCH_CLOSE ? { type: 'close' } : { type: 'toParent' };
  return null;
}
