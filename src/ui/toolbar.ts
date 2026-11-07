import { t } from '../i18n';
import type { ThemePref } from './theme';

/**
 * "Zoom out" button (while opened) and theme picker. Emits 'fw-action' ({type:'close'}) then 'fw-focus-lost' from
 * the button, and 'fw-theme' (ThemePref) from the picker.
 */
export class FwToolbar extends HTMLElement {
  #zoomOut: HTMLButtonElement | null = null;
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
    if (this.#zoomOut) return;
    this.setAttribute('role', 'toolbar');
    const zoomOut = document.createElement('button');
    zoomOut.type = 'button';
    zoomOut.className = 'fw-zoom-out';
    zoomOut.textContent = t('zoomOut');
    zoomOut.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('fw-action', { detail: { type: 'close' }, bubbles: true }));
      // Spec v1.2 §5.4: the button hides once closed, so focus goes to the wheel's tree, not <body>.
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
    this.#zoomOut = zoomOut;
    this.#select = select;
    this.append(zoomOut, select);
    this.#sync();
  }

  #sync(): void {
    if (!this.#zoomOut || !this.#select) return;
    this.#zoomOut.hidden = !this.#opened;
    this.#select.value = this.#theme;
  }
}

if (!customElements.get('fw-toolbar')) customElements.define('fw-toolbar', FwToolbar);
