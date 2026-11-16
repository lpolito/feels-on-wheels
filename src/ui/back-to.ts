import { isPlainClick } from '../router';

const SVG = 'http://www.w3.org/2000/svg';

/** The card's fold arrow, mirrored: "back". */
function backIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'fw-back-to-icon');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG, 'path');
  path.setAttribute('d', 'M10 3L5 8l5 5');
  svg.append(path);
  return svg;
}

/**
 * Wheel and card spec §2: after a jump from another wheel, a pill above the card goes back to the word you came from.
 * A real link to that word's address, so ⌘-click and Copy Link work; a plain click emits 'fw-back' for main.ts, which
 * goes back in history. Null hides it.
 */
export class FwBackTo extends HTMLElement {
  #target: { href: string; label: string } | null = null;

  set target(t: { href: string; label: string } | null) {
    // The same target again keeps the link, so focus on it stays (main.ts sets it on every render).
    const was = this.#target;
    if (was === t || (was && t && was.href === t.href && was.label === t.label)) return;
    this.#target = t;
    this.#render();
  }

  get target(): { href: string; label: string } | null {
    return this.#target;
  }

  #render(): void {
    const t = this.#target;
    this.hidden = t === null;
    if (t === null) {
      this.replaceChildren();
      return;
    }
    const a = document.createElement('a');
    a.className = 'fw-back-to';
    a.href = t.href;
    a.append(backIcon(), t.label);
    a.addEventListener('click', (e) => {
      if (!isPlainClick(e)) return;
      e.preventDefault();
      this.dispatchEvent(new CustomEvent('fw-back', { bubbles: true }));
    });
    this.replaceChildren(a);
  }
}

if (!customElements.get('fw-back-to')) customElements.define('fw-back-to', FwBackTo);
