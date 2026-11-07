import type { Action } from '../state/store';

/** Spec §3.5. */
export function keyToAction(key: string): Action | null {
  switch (key) {
    case 'ArrowUp': return { type: 'step', delta: -1 };
    case 'ArrowDown': return { type: 'step', delta: 1 };
    case 'ArrowRight': return { type: 'toChild' };
    case 'ArrowLeft':
    case '-': return { type: 'toParent' };
    case 'Enter':
    case ' ':
    case '+':
    case '=': return { type: 'activate' };
    case 'Escape': return { type: 'escape' };
    default: return null;
  }
}
