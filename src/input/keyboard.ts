import type { Action } from '../state/store';

export type KeyAction = Action | { type: 'zoomToggle' };

/** Spec §4.5. Enter/Space need the focused segment, so the tree handles them. */
export function keyToAction(key: string): KeyAction | null {
  switch (key) {
    case 'ArrowUp': return { type: 'step', delta: -1 };
    case 'ArrowDown': return { type: 'step', delta: 1 };
    case 'ArrowRight': return { type: 'toChild' };
    case 'ArrowLeft': return { type: 'toParent' };
    case 'Escape': return { type: 'escape' };
    case '+':
    case '=': return { type: 'zoomIn' };
    case '-': return { type: 'zoomOut' };
    default: return null;
  }
}
