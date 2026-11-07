import { t } from '../i18n';
import type { ThemePref } from './theme';

/** Zoom toggle and theme picker. Emits 'fw-action' ({type:'zoomToggle'}) and 'fw-theme' (ThemePref). */
export class FwToolbar extends HTMLElement {
  #zoom: HTMLButtonElement | null = null;
  #select: HTMLSelectElement | null = null;
  #zoomed = false;
  #theme: ThemePref = 'system';

  set zoomed(z: boolean) {
    this.#zoomed = z;
    this.#sync();
  }

  set theme(p: ThemePref) {
    this.#theme = p;
    this.#sync();
  }

  connectedCallback(): void {
    if (this.#zoom) return;
    this.setAttribute('role', 'toolbar');
    const zoom = document.createElement('button');
    zoom.type = 'button';
    zoom.className = 'fw-zoom';
    zoom.addEventListener('click', () =>
      this.dispatchEvent(new CustomEvent('fw-action', { detail: { type: 'zoomToggle' }, bubbles: true })));
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
    this.#zoom = zoom;
    this.#select = select;
    this.append(zoom, select);
    this.#sync();
  }

  #sync(): void {
    if (!this.#zoom || !this.#select) return;
    const label = t(this.#zoomed ? 'zoomOut' : 'zoomIn');
    this.#zoom.setAttribute('aria-pressed', String(this.#zoomed));
    this.#zoom.setAttribute('aria-label', label);
    this.#zoom.textContent = this.#zoomed ? '−' : '+';
    this.#select.value = this.#theme;
  }
}

if (!customElements.get('fw-toolbar')) customElements.define('fw-toolbar', FwToolbar);
