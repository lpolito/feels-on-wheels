/** The message in the card's place while nothing is selected (spec v1.3 §3.1, §4.1). Plain text; `null` hides it. */
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
    this.#sync();
  }

  #sync(): void {
    this.hidden = this.#text === null;
    if (this.textContent !== (this.#text ?? '')) this.textContent = this.#text ?? '';
  }
}

if (!customElements.get('fw-hint')) customElements.define('fw-hint', FwHint);
