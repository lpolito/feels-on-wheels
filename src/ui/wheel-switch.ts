import { t } from '../i18n';

/**
 * Spec v2 §4.1: "Feelings | Body", one button per wheel in the wheel list's order, the current one pressed. A press on
 * another wheel dispatches 'fw-wheel' ({ wheel }); a press on the current one does nothing. Changing `current` only
 * moves aria-pressed, so focus stays on the pressed button.
 */
export class FwWheelSwitch extends HTMLElement {
  #buttons = new Map<string, HTMLButtonElement>();
  #current = '';

  set wheels(list: { id: string; label: string }[]) {
    this.#buttons.clear();
    const els = list.map(({ id, label }) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.addEventListener('click', () => {
        if (id === this.#current) return;
        this.dispatchEvent(new CustomEvent('fw-wheel', { detail: { wheel: id }, bubbles: true }));
      });
      this.#buttons.set(id, b);
      return b;
    });
    this.replaceChildren(...els);
    this.#sync();
  }

  set current(id: string) {
    this.#current = id;
    this.#sync();
  }

  connectedCallback(): void {
    this.setAttribute('role', 'group');
    this.setAttribute('aria-label', t('wheelSwitch'));
  }

  #sync(): void {
    for (const [id, b] of this.#buttons) b.setAttribute('aria-pressed', String(id === this.#current));
  }
}

if (!customElements.get('fw-wheel-switch')) customElements.define('fw-wheel-switch', FwWheelSwitch);
