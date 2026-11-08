import { t } from '../i18n';
import type { ThemePref } from './theme';

const SVG = 'http://www.w3.org/2000/svg';

/** A circular arrow: "back to the start". */
function restartIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'fw-icon');
  const path = document.createElementNS(SVG, 'path');
  path.setAttribute('d', 'M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5');
  svg.append(path);
  return svg;
}

/**
 * "Start over" (while a word is selected) and the theme control. "Start over" emits 'fw-action' ({type:'clear'})
 * then 'fw-focus-lost' (spec v1.3 §3.2); the theme control emits 'fw-theme' (ThemePref).
 */
export class FwToolbar extends HTMLElement {
  #startOver: HTMLButtonElement | null = null;
  #select: HTMLSelectElement | null = null;
  #selected = false;
  #theme: ThemePref = 'system';

  /** A word is selected (or opened): "Start over" shows. */
  set selected(v: boolean) {
    this.#selected = v;
    this.#sync();
  }

  set theme(p: ThemePref) {
    this.#theme = p;
    this.#sync();
  }

  connectedCallback(): void {
    if (this.#startOver) return;
    this.setAttribute('role', 'toolbar');
    const startOver = document.createElement('button');
    startOver.type = 'button';
    startOver.className = 'fw-start-over';
    startOver.append(restartIcon(), t('startOver'));
    startOver.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('fw-action', { detail: { type: 'clear' }, bubbles: true }));
      // The button hides once nothing is selected, so focus goes to the wheel's tree, not <body>.
      this.dispatchEvent(new CustomEvent('fw-focus-lost', { bubbles: true }));
    });
    const select = document.createElement('select');
    select.setAttribute('aria-label', t('theme'));
    for (const [value, key] of [['system', 'themeSystem'], ['light', 'themeLight'], ['dark', 'themeDark']] as const) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = t(key);
      select.append(option);
    }
    select.addEventListener('change', () =>
      this.dispatchEvent(new CustomEvent<ThemePref>('fw-theme', { detail: select.value as ThemePref, bubbles: true })));
    this.#startOver = startOver;
    this.#select = select;
    this.append(startOver, select);
    this.#sync();
  }

  #sync(): void {
    if (!this.#startOver || !this.#select) return;
    // Hiding the focused button (Escape, Back) would drop focus to <body>: hand it to the wheel instead.
    const hadFocus = !this.#selected && !this.#startOver.hidden && document.activeElement === this.#startOver;
    this.#startOver.hidden = !this.#selected;
    if (hadFocus) this.dispatchEvent(new CustomEvent('fw-focus-lost', { bubbles: true }));
    this.#select.value = this.#theme;
  }
}

if (!customElements.get('fw-toolbar')) customElements.define('fw-toolbar', FwToolbar);
