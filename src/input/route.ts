import type { Action } from '../state/store';
import { keyToAction } from './keyboard';

export type KeyTarget = 'field' | 'button' | 'other';

/**
 * '+', '=' and '−' are single-character shortcuts: WCAG 2.1.4 allows them only while their component has focus, so
 * speech input can't trigger them by accident. The wheel's tree handles them itself (src/a11y/tree.ts).
 */
const CHARACTER_KEYS = new Set(['+', '=', '-']);

/** 'field': input, select, textarea. 'button': any <button> (card, toolbar). */
export function keyTarget(el: Element | null): KeyTarget {
  if (!el || typeof el.closest !== 'function') return 'other';
  if (el.closest('input, select, textarea')) return 'field';
  if (el.closest('button')) return 'button';
  return 'other';
}

/**
 * The action for a document-level keydown (focus is not on the wheel), or null to leave it to the browser
 * (spec v1.2 §3.6). Fields keep every key but Escape; buttons keep Enter and Space; character shortcuts stay with the
 * wheel.
 */
export function routeKey(key: string, where: KeyTarget, modified: boolean): Action | null {
  if (modified || CHARACTER_KEYS.has(key)) return null;
  if (where === 'field' && key !== 'Escape') return null;
  if (where === 'button' && (key === 'Enter' || key === ' ')) return null;
  return keyToAction(key);
}
