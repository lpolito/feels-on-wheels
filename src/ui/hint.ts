/** Spec v2 §4.1: the start message, with an optional link to another wheel where `text` has "{link}". */
export type HintContent = { text: string; link?: { label: string; wheel: string } } | null;

const same = (a: HintContent, b: HintContent): boolean =>
  a === b || (a !== null && b !== null && a.text === b.text && a.link?.label === b.link?.label && a.link?.wheel === b.link?.wheel);

/**
 * The message in the card's place while nothing is selected (spec v1.3 §3.1, §4.1). `null` hides it. Not a live
 * region. Its link button dispatches 'fw-wheel' ({ wheel }).
 */
export class FwHint extends HTMLElement {
  #content: HintContent = null;
  #link: HTMLButtonElement | null = null;

  get content(): HintContent {
    return this.#content;
  }

  set content(v: HintContent) {
    if (same(this.#content, v) && this.isConnected) return;
    this.#content = v;
    this.#render();
  }

  /** Focus the link (after it switched wheels, the new wheel's link takes its place). */
  focusLink(): void {
    this.#link?.focus();
  }

  connectedCallback(): void {
    this.#render();
  }

  #render(): void {
    const c = this.#content;
    this.hidden = c === null;
    this.#link = null;
    if (c === null) {
      this.replaceChildren();
      return;
    }
    const [before, after = ''] = c.link ? c.text.split('{link}') : [c.text];
    if (!c.link) {
      this.replaceChildren(before!);
      return;
    }
    const { label, wheel } = c.link;
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'fw-hint-link';
    link.textContent = label;
    link.addEventListener('click', () => this.dispatchEvent(new CustomEvent('fw-wheel', { detail: { wheel }, bubbles: true })));
    this.#link = link;
    // One inline run, so the link wraps with the sentence inside the flex panel.
    const line = document.createElement('span');
    line.append(before!, link, after);
    this.replaceChildren(line);
  }
}

if (!customElements.get('fw-hint')) customElements.define('fw-hint', FwHint);
