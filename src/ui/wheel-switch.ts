import { t } from '../i18n';

/**
 * Spec v2 §4.1: "Feelings | Body", one button per wheel in the wheel list's order, the current one pressed. A press on
 * another wheel dispatches 'fw-wheel' ({ wheel }); a press on the current one does nothing. Changing `current` only
 * moves aria-pressed, so focus stays on the pressed button.
 *
 * Spec v2.1 §4: the pressed fill is one highlight behind the buttons that slides to the pressed one, measured from it,
 * so any number of options and label widths work. A wheel with `name` shows `label` and is named `name`.
 */
export class FwWheelSwitch extends HTMLElement {
  #buttons = new Map<string, HTMLButtonElement>();
  #current = '';
  #thumb: HTMLSpanElement;
  #placed = false;
  #resize: ResizeObserver | null = null;
  #frame = 0;

  constructor() {
    super();
    this.#thumb = document.createElement('span');
    this.#thumb.className = 'fw-switch-thumb';
    this.#thumb.setAttribute('aria-hidden', 'true');
  }

  set wheels(list: { id: string; label: string; name?: string }[]) {
    this.#buttons.clear();
    const els = list.map(({ id, label, name }) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      if (name) b.setAttribute('aria-label', name);
      b.addEventListener('click', () => {
        if (id === this.#current) return;
        this.dispatchEvent(new CustomEvent('fw-wheel', { detail: { wheel: id }, bubbles: true }));
      });
      this.#buttons.set(id, b);
      return b;
    });
    this.replaceChildren(this.#thumb, ...els);
    this.#sync();
    this.#place(false);
  }

  set current(id: string) {
    this.#current = id;
    this.#sync();
    this.#place(this.#placed);
  }

  connectedCallback(): void {
    this.setAttribute('role', 'group');
    this.setAttribute('aria-label', t('wheelSwitch'));
    if (typeof ResizeObserver !== 'undefined') {
      this.#resize = new ResizeObserver(() => this.#place(false));
      this.#resize.observe(this);
    }
  }

  disconnectedCallback(): void {
    this.#resize?.disconnect();
    this.#resize = null;
  }

  #sync(): void {
    for (const [id, b] of this.#buttons) b.setAttribute('aria-pressed', String(id === this.#current));
  }

  /** Moves the highlight under the pressed button; without `animate` it jumps there. */
  #place(animate: boolean): void {
    const b = this.#buttons.get(this.#current);
    if (!b) return;
    if (!animate) this.setAttribute('data-instant', '');
    this.#thumb.style.translate = `${b.offsetLeft}px 0`;
    this.#thumb.style.width = `${b.offsetWidth}px`;
    this.#placed = true;
    if (!animate) {
      // Commit the jump before transitions come back.
      void this.offsetWidth;
      cancelAnimationFrame(this.#frame);
      this.#frame = requestAnimationFrame(() => this.removeAttribute('data-instant'));
    }
  }
}

if (!customElements.get('fw-wheel-switch')) customElements.define('fw-wheel-switch', FwWheelSwitch);
