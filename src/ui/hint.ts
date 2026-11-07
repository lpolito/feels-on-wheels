/** The floating hint above the card (spec §5.1). `null` hides it. */
export class FwHint extends HTMLElement {
  #text: string | null = null;

  get text(): string | null {
    return this.#text;
  }

  set text(v: string | null) {
    this.#text = v;
    this.#sync();
  }

  connectedCallback(): void {
    this.setAttribute('aria-live', 'polite');
    this.#sync();
  }

  #sync(): void {
    this.setAttribute('aria-live', 'polite');
    this.hidden = this.#text === null;
    if (this.textContent !== (this.#text ?? '')) this.textContent = this.#text ?? '';
  }
}

if (!customElements.get('fw-hint')) customElements.define('fw-hint', FwHint);
