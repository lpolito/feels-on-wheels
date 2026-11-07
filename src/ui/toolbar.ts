import { t } from '../i18n';
import type { ThemePref } from './theme';

/** "Whole wheel" button (while opened) and theme picker. Emits 'fw-action' ({type:'close'}) and 'fw-theme' (ThemePref). */
export class FwToolbar extends HTMLElement {
  #whole: HTMLButtonElement | null = null;
  #select: HTMLSelectElement | null = null;
  #opened = false;
  #theme: ThemePref = 'system';

  set opened(o: boolean) {
    this.#opened = o;
    this.#sync();
  }

  set theme(p: ThemePref) {
    this.#theme = p;
    this.#sync();
  }

  connectedCallback(): void {
    if (this.#whole) return;
    this.setAttribute('role', 'toolbar');
    const whole = document.createElement('button');
    whole.type = 'button';
    whole.className = 'fw-whole';
    whole.textContent = t('wholeWheel');
    whole.addEventListener('click', () =>
      this.dispatchEvent(new CustomEvent('fw-action', { detail: { type: 'close' }, bubbles: true })));
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
    this.#whole = whole;
    this.#select = select;
    this.append(whole, select);
    this.#sync();
  }

  #sync(): void {
    if (!this.#whole || !this.#select) return;
    this.#whole.hidden = !this.#opened;
    this.#select.value = this.#theme;
  }
}

if (!customElements.get('fw-toolbar')) customElements.define('fw-toolbar', FwToolbar);
