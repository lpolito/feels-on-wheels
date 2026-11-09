/**
 * Spec v2 §4.1: the start message, with an optional link to another wheel where `text` has "{link}". Spec v2.2 §5:
 * `title`, the wheel's question, heads it.
 */
export type HintContent = { title: string; text: string; link?: { label: string; wheel: string; href: string } } | null;

const same = (a: HintContent, b: HintContent): boolean =>
  a === b || (a !== null && b !== null && a.title === b.title && a.text === b.text
    && a.link?.label === b.link?.label && a.link?.wheel === b.link?.wheel && a.link?.href === b.link?.href);

/**
 * The message in the card's place while nothing is selected (spec v1.3 §3.1, §4.1). `null` hides it. Not a live
 * region. Its link dispatches 'fw-wheel' ({ wheel }) on a plain click; spec v2.1 §6.3: it's an <a> to the other
 * wheel's URL, so it wraps with the sentence, and a modified click is left to the browser.
 */
export class FwHint extends HTMLElement {
  #content: HintContent = null;
  #link: HTMLAnchorElement | null = null;

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
    const title = document.createElement('h2');
    title.className = 'fw-hint-title';
    title.textContent = c.title;
    const line = document.createElement('p');
    line.className = 'fw-hint-text';
    const [before, after = ''] = c.link ? c.text.split('{link}') : [c.text];
    if (!c.link) {
      line.append(before!);
      this.replaceChildren(title, line);
      return;
    }
    const { label, wheel, href } = c.link;
    const link = document.createElement('a');
    link.href = href;
    link.className = 'fw-hint-link';
    link.textContent = label;
    link.addEventListener('click', (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      this.dispatchEvent(new CustomEvent('fw-wheel', { detail: { wheel }, bubbles: true }));
    });
    this.#link = link;
    // One inline run, so the link wraps with the sentence.
    line.append(before!, link, after);
    this.replaceChildren(title, line);
  }
}

if (!customElements.get('fw-hint')) customElements.define('fw-hint', FwHint);
