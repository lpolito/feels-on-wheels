import type { FeelingId, FeelingsDict } from '../data/types';
import { definition, nodeLabel, sensationLabel, t } from '../i18n';
import { siblings, type Home, type Layout, type Path } from '../model/layout';
import type { Action, State } from '../state/store';

export type Row = { index: number; label: string; hue: string };

/** One block of an opened card (spec v2 §6.1). `inline` links sit in a row of words; the others are one per line. */
export type Section =
  | { kind: 'text'; text: string }
  | { kind: 'list'; heading: string; items: string[] }
  | { kind: 'links'; heading: string; inline: boolean; rows: Row[] }
  | { kind: 'jump'; label: string; wheel: string; path: Path };

export type CardModel =
  | { kind: 'none' }
  /** `wheel` + `index` identify the word: indices are per wheel (final review #1). */
  | { kind: 'selected'; wheel: string; index: number; title: string; hue: string }
  | {
      kind: 'opened';
      wheel: string;
      index: number;
      title: string;
      hue: string;
      /** Ancestors, root first. */
      crumbs: Row[];
      sections: Section[];
    };

/** Where a feeling on another wheel jumps to: the first wheel's id and each feeling's place on it. */
export interface JumpContext { wheel: string; home: Map<FeelingId, Home> }

/**
 * Spec v2 §6.2: the sections follow the node's kind and its parent's kind, never the wheel. `jump` is given only on
 * wheels other than the first.
 */
export function cardModel(layout: Layout, feelings: FeelingsDict, s: State, jump?: JumpContext): CardModel {
  if (s.selected === null) return { kind: 'none' };
  const seg = layout.segments[s.selected]!;
  const title = nodeLabel(seg.node);
  if (!s.opened) return { kind: 'selected', wheel: layout.wheelId, index: seg.index, title, hue: seg.hue };
  const row = (i: number): Row => {
    const x = layout.segments[i]!;
    return { index: i, label: nodeLabel(x.node), hue: x.hue };
  };
  const crumbs: Row[] = [];
  for (let i = seg.parent; i >= 0; i = layout.segments[i]!.parent) crumbs.unshift(row(i));
  const children = seg.children.map(row);
  const sections: Section[] = [];
  if (seg.node.kind === 'feeling') {
    const id = seg.node.id;
    sections.push({ kind: 'text', text: definition(id) });
    const notice = (feelings[id]?.sensations ?? []).map(sensationLabel);
    if (notice.length > 0) sections.push({ kind: 'list', heading: t('youMightNotice'), items: notice });
    if (children.length > 0) {
      sections.push({ kind: 'links', heading: t('narrowDown'), inline: false, rows: children });
    } else {
      const parent = seg.parent >= 0 ? layout.segments[seg.parent]!.node.kind : null;
      const rows = siblings(layout, seg.index).map(row);
      const heading = parent === 'sensation' ? t('couldAlsoBe') : t('closeTo');
      if (rows.length > 0) sections.push({ kind: 'links', heading, inline: true, rows });
    }
    const home = jump?.home.get(id);
    if (jump && home) sections.push({ kind: 'jump', label: t('seeOnWheel', { label: title }), wheel: jump.wheel, path: home.path });
  } else if (children.length > 0) {
    const heading = seg.node.kind === 'sensation' ? t('couldBe') : t('narrowDown');
    sections.push({ kind: 'links', heading, inline: false, rows: children });
  }
  return { kind: 'opened', wheel: layout.wheelId, index: seg.index, title, hue: seg.hue, crumbs, sections };
}

const h = <K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}, ...kids: (Node | string)[]) => {
  const el = Object.assign(document.createElement(tag), props);
  el.append(...kids);
  return el;
};

const SVG = 'http://www.w3.org/2000/svg';

function chevronIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'fw-card-chevron');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG, 'path');
  path.setAttribute('d', 'M6 3l5 5-5 5');
  svg.append(path);
  return svg;
}

function dot(hue: string): HTMLSpanElement {
  const d = h('span', { className: 'fw-dot' });
  d.style.setProperty('--dot-hue', `var(--hue-${hue})`);
  d.setAttribute('aria-hidden', 'true');
  return d;
}

type Shown = Exclude<CardModel, { kind: 'none' }>;

/**
 * The floating accordion card (spec v1.2 §5). Emits 'fw-action' (Action) and 'fw-focus-lost'.
 *
 * The same word going between selected and opened updates in place, so the CSS unfold can run and focus stays put;
 * any other change rebuilds.
 */
export class FwCard extends HTMLElement {
  #model: CardModel = { kind: 'none' };
  #inks: Record<string, string> = {};
  #toggle: HTMLButtonElement | null = null;
  #head: HTMLDivElement | null = null;
  #crumbs: HTMLElement | null = null;
  #body: HTMLDivElement | null = null;

  get model(): CardModel {
    return this.#model;
  }

  set model(m: CardModel) {
    const prev = this.#model;
    this.#model = m;
    // Same feeling in the same state: keep the DOM (and the user's focus) as it is.
    const sameWord = prev.kind !== 'none' && m.kind !== 'none' && prev.wheel === m.wheel && prev.index === m.index;
    if (prev.kind === m.kind && (m.kind === 'none' || sameWord)) return;
    if (sameWord && this.#toggle) {
      this.#update(m);
      return;
    }
    const hadFocus = this.contains(document.activeElement);
    this.render();
    if (!hadFocus) return;
    if (m.kind === 'none') this.dispatchEvent(new CustomEvent('fw-focus-lost', { bubbles: true }));
    else this.#toggle?.focus();
  }

  /** Hue → hover ink (spec v1.2 §5.2), from colors.ts inkFor. */
  set inks(map: Record<string, string>) {
    this.#inks = map;
    this.#applyInk();
  }

  connectedCallback(): void {
    this.render();
  }

  #emit(action: Action): void {
    this.dispatchEvent(new CustomEvent<Action>('fw-action', { detail: action, bubbles: true }));
  }

  /** A row link in its own feeling's ink (spec v2 §6.1); falls back to the card's ink. */
  #inkedLink(r: Row, trailing = ''): HTMLButtonElement {
    const b = this.#link(r, trailing);
    const ink = this.#inks[r.hue];
    if (ink) b.style.setProperty('--ink', ink);
    return b;
  }

  #link(r: Row, trailing = ''): HTMLButtonElement {
    const b = h('button', { type: 'button', className: 'fw-link' }, r.label + trailing);
    b.addEventListener('click', () => this.#emit({ type: 'open', segment: r.index }));
    return b;
  }

  #headingObserver: ResizeObserver | null = null;

  /**
   * Spec v1.3 §5.2 (WCAG 2.4.11): keep `scroll-padding-top` at the sticky row's height, so an element focused while
   * scrolling up lands below the row, not under it.
   */
  #watchHeading(heading: HTMLElement): void {
    if (typeof ResizeObserver === 'undefined') return;
    this.#headingObserver?.disconnect();
    this.#headingObserver = new ResizeObserver(() => {
      this.style.scrollPaddingTop = `${heading.offsetHeight}px`;
    });
    this.#headingObserver.observe(heading);
  }

  /**
   * Spec v1.3 §4.2: the card's height once fully unfolded (the heading, the crumbs' and the body's natural heights),
   * measurable as soon as it renders, before the unfold has run. 0 while hidden.
   */
  unfoldedHeight(): number {
    if (this.#model.kind === 'none' || !this.#toggle) return 0;
    const heading = this.#toggle.parentElement as HTMLElement;
    const crumbs = this.#crumbs?.querySelector<HTMLElement>('.fw-crumbs-inner')?.scrollHeight ?? 0;
    const body = this.#body?.querySelector<HTMLElement>('.fw-card-body-inner')?.scrollHeight ?? 0;
    return heading.offsetHeight + crumbs + body;
  }

  /**
   * The unfolded height `m`'s card would have (spec v1.3 §4.2), without touching this card: a hidden copy is laid out
   * beside it at the same width, measured and removed. Used to aim a spin at the card it will land on.
   */
  unfoldedHeightFor(m: CardModel): number {
    if (m.kind !== 'opened' || !this.parentElement) return 0;
    const probe = document.createElement('fw-card') as FwCard;
    probe.setAttribute('aria-hidden', 'true');
    probe.inert = true;
    Object.assign(probe.style, { position: 'absolute', visibility: 'hidden', pointerEvents: 'none', width: `${this.offsetWidth}px` });
    probe.model = m;
    this.parentElement.append(probe);
    const height = probe.unfoldedHeight();
    probe.remove();
    return height;
  }

  #applyInk(): void {
    const m = this.#model;
    const ink = m.kind === 'none' ? undefined : this.#inks[m.hue];
    if (ink) this.style.setProperty('--ink', ink);
    else this.style.removeProperty('--ink');
  }

  /** Same word, selected ↔ opened: fill (or keep) the crumbs and body, then flip the open state. */
  #update(m: Shown): void {
    if (m.kind === 'opened') {
      if (!this.#body) {
        if (m.crumbs.length > 0) {
          this.#crumbs = this.#crumbsNav(m.crumbs);
          this.#head!.prepend(this.#crumbs);
        }
        this.#body = this.#bodyFor(m);
        this.append(this.#body);
        // Lay out the folded state first, so the unfold transitions from it.
        void this.#body.offsetHeight;
      }
    }
    this.#setOpen(m.kind === 'opened');
  }

  #setOpen(open: boolean): void {
    this.toggleAttribute('data-open', open);
    this.#toggle!.setAttribute('aria-expanded', String(open));
    // A folded body stays for its fold-away animation, out of reach of the keyboard and assistive tech. Focus inside
    // it would drop to <body> once it's inert, so it moves to the toggle first (v1.1 §5.2's rule for rebuilds).
    const active = document.activeElement;
    if (!open && active && (this.#body?.contains(active) || this.#crumbs?.contains(active))) this.#toggle!.focus();
    if (this.#body) this.#body.inert = !open;
    if (this.#crumbs) this.#crumbs.inert = !open;
  }

  /** Ancestors, root first, each a link, then "›". The nav is also the row that grows open (a 0fr → 1fr grid). */
  #crumbsNav(crumbs: Row[]): HTMLElement {
    // The padding lives on the row, not the clipped grid item, so the folded 0fr track really is 0 high.
    const row = h('div', { className: 'fw-crumbs-row' });
    for (const c of crumbs) row.append(this.#link(c), h('span', { className: 'fw-sep' }, '›'));
    const nav = h('nav', { className: 'fw-crumbs fw-crumbs-wrap' }, h('div', { className: 'fw-crumbs-inner' }, row));
    nav.setAttribute('aria-label', t('path'));
    return nav;
  }

  #bodyFor(m: Extract<CardModel, { kind: 'opened' }>): HTMLDivElement {
    const content = h('div', { className: 'fw-card-content' });
    // Spec v2 §6.1: draw whatever sections the model holds, in order. No wheel or ring checks here.
    for (const s of m.sections) {
      if (s.kind === 'text') {
        content.append(h('p', { className: 'fw-definition' }, s.text));
      } else if (s.kind === 'list') {
        content.append(h('h3', {}, s.heading), h('ul', { className: 'fw-sensations' }, ...s.items.map((i) => h('li', {}, i))));
      } else if (s.kind === 'links') {
        content.append(h('h3', {}, s.heading), s.inline
          ? h('p', { className: 'fw-close-to' }, ...s.rows.map((r) => this.#inkedLink(r)))
          : h('ul', { className: 'fw-rows' }, ...s.rows.map((r) => h('li', {}, this.#inkedLink(r, '\u00A0›')))));
      } else {
        const jump = h('button', { type: 'button', className: 'fw-link fw-jump' }, `${s.label}\u00A0›`);
        jump.addEventListener('click', () => {
          this.dispatchEvent(new CustomEvent('fw-wheel', { detail: { wheel: s.wheel, path: s.path }, bubbles: true }));
        });
        content.append(h('p', { className: 'fw-jump-row' }, jump));
      }
    }
    return h('div', { className: 'fw-card-body' }, h('div', { className: 'fw-card-body-inner' }, content));
  }

  render(): void {
    const m = this.#model;
    this.hidden = m.kind === 'none';
    this.#toggle = this.#head = this.#crumbs = this.#body = null;
    // Another word: start at the top, with its breadcrumbs showing (spec v1.3 §5.2).
    this.scrollTop = 0;
    this.#applyInk();
    if (m.kind === 'none') {
      this.removeAttribute('data-open');
      this.replaceChildren();
      return;
    }
    const toggle = h('button', { type: 'button', className: 'fw-card-toggle' },
      dot(m.hue), h('span', { className: 'fw-card-title' }, m.title), chevronIcon());
    toggle.addEventListener('click', () => this.#emit(this.#model.kind === 'opened' ? { type: 'close' } : { type: 'activate' }));
    // Accordion pattern: the toggle sits inside a heading, so the sections below have a parent.
    const heading = h('h2', { className: 'fw-card-heading' }, toggle);
    const head = h('div', { className: 'fw-card-head' }, heading);
    this.#watchHeading(heading);
    this.#toggle = toggle;
    this.#head = head;
    if (m.kind === 'opened') {
      if (m.crumbs.length > 0) {
        this.#crumbs = this.#crumbsNav(m.crumbs);
        head.prepend(this.#crumbs);
      }
      this.#body = this.#bodyFor(m);
      this.replaceChildren(head, this.#body);
    } else {
      this.replaceChildren(head);
    }
    this.#setOpen(m.kind === 'opened');
  }
}

if (!customElements.get('fw-card')) customElements.define('fw-card', FwCard);
