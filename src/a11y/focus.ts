/**
 * Keys and focus spec: the one way the app moves focus. iPhone Safari doesn't focus what you tap, so it counts the
 * app's own focus moves as keyboard focus and draws a ring. After a pointer press (finger, mouse, pen) the element
 * moved to is marked `data-quiet-focus`, which hides its ring (app.css); the next key or blur clears it. With no
 * input seen, nothing is marked, so a missed interaction can only bring back the ring, never hide it from a keyboard.
 */
let last: 'pointer' | 'key' | null = null;
const QUIET = 'data-quiet-focus';

function onPointer(): void {
  last = 'pointer';
}

function onKey(e: Event): void {
  last = 'key';
  for (const el of (e.currentTarget as Document).querySelectorAll(`[${QUIET}]`)) el.removeAttribute(QUIET);
}

/** Watches `doc` for pointer presses and keys, in the capture phase. Returns a function that stops watching. */
export function installFocusTracking(doc: Document = document): () => void {
  doc.addEventListener('pointerdown', onPointer, true);
  doc.addEventListener('keydown', onKey, true);
  return () => {
    doc.removeEventListener('pointerdown', onPointer, true);
    doc.removeEventListener('keydown', onKey, true);
    last = null;
  };
}

/** Focuses `el`; after a pointer press, marks it so its ring stays hidden until the next key or blur. */
export function moveFocus(el: HTMLElement, opts?: FocusOptions): void {
  el.focus(opts);
  if (last !== 'pointer' || el.ownerDocument.activeElement !== el) return;
  el.setAttribute(QUIET, '');
  el.addEventListener('blur', () => el.removeAttribute(QUIET), { once: true });
}
