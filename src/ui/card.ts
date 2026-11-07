import type { FeelingsDict } from '../data/types';
import { definition, label, sensationLabel, t } from '../i18n';
import { siblings, type Layout } from '../model/layout';
import type { Action, State } from '../state/store';

type Row = { index: number; label: string };

export type CardModel =
  | { kind: 'none' }
  | { kind: 'selected'; index: number; title: string; hue: string }
  | {
      kind: 'opened';
      index: number;
      title: string;
      hue: string;
      /** Ancestors, root first. */
      crumbs: Row[];
      definition: string;
      sensations: string[];
      /** "Narrow it down"; empty for outer words. */
      children: Row[];
      /** Siblings, outer words only. */
      closeTo: Row[];
    };

export function cardModel(layout: Layout, feelings: FeelingsDict, s: State): CardModel {
  if (s.selected === null) return { kind: 'none' };
  const seg = layout.segments[s.selected]!;
  const title = label(seg.feelingId);
  if (!s.opened) return { kind: 'selected', index: seg.index, title, hue: seg.hue };
  const row = (i: number): Row => ({ index: i, label: label(layout.segments[i]!.feelingId) });
  const crumbs: Row[] = [];
  for (let i = seg.parent; i >= 0; i = layout.segments[i]!.parent) crumbs.unshift(row(i));
  return {
    kind: 'opened',
    index: seg.index,
    title,
    hue: seg.hue,
    crumbs,
    definition: definition(seg.feelingId),
    sensations: (feelings[seg.feelingId]?.sensations ?? []).map(sensationLabel),
    children: seg.children.map(row),
    closeTo: seg.children.length === 0 ? siblings(layout, seg.index).map(row) : [],
  };
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

/** The floating accordion card (spec §5.1). Emits 'fw-action' (Action) and 'fw-focus-lost'. */
export class FwCard extends HTMLElement {
  #model: CardModel = { kind: 'none' };

  get model(): CardModel {
    return this.#model;
  }

  set model(m: CardModel) {
    const prev = this.#model;
    this.#model = m;
    // Same feeling in the same state: keep the DOM (and the user's focus) as it is.
    if (prev.kind === m.kind && (m.kind === 'none' || (prev as { index: number }).index === m.index)) return;
    const hadFocus = this.contains(document.activeElement);
    this.render();
    if (!hadFocus) return;
    if (m.kind === 'none') this.dispatchEvent(new CustomEvent('fw-focus-lost', { bubbles: true }));
    else this.querySelector<HTMLElement>('.fw-card-head')?.focus();
  }

  connectedCallback(): void {
    this.render();
  }

  #emit(action: Action): void {
    this.dispatchEvent(new CustomEvent<Action>('fw-action', { detail: action, bubbles: true }));
  }

  #link(r: Row, trailing = ''): HTMLButtonElement {
    const b = h('button', { type: 'button', className: 'fw-link' }, r.label + trailing);
    b.addEventListener('click', () => this.#emit({ type: 'open', segment: r.index }));
    return b;
  }

  render(): void {
    const m = this.#model;
    this.hidden = m.kind === 'none';
    if (m.kind === 'none') {
      this.replaceChildren();
      return;
    }
    const isOpen = m.kind === 'opened';
    const head = h('button', { type: 'button', className: 'fw-card-head' },
      dot(m.hue), h('span', { className: 'fw-card-title' }, m.title), chevronIcon());
    head.setAttribute('aria-expanded', String(isOpen));
    head.addEventListener('click', () => this.#emit(isOpen ? { type: 'close' } : { type: 'activate' }));
    this.toggleAttribute('data-open', isOpen);
    if (!isOpen) {
      this.replaceChildren(head);
      return;
    }

    const body = h('div', { className: 'fw-card-body' });
    if (m.crumbs.length > 0) {
      const nav = h('nav', { className: 'fw-crumbs' }, dot(m.hue));
      nav.setAttribute('aria-label', t('path'));
      for (const c of m.crumbs) nav.append(this.#link(c), h('span', { className: 'fw-sep' }, '›'));
      body.append(nav);
    }
    body.append(h('p', { className: 'fw-definition' }, m.definition));
    if (m.sensations.length > 0) {
      body.append(
        h('h3', {}, t('youMightNotice')),
        h('ul', { className: 'fw-sensations' }, ...m.sensations.map((s) => h('li', {}, s))),
      );
    }
    if (m.children.length > 0) {
      body.append(
        h('h3', {}, t('narrowDown')),
        h('ul', { className: 'fw-rows' }, ...m.children.map((c) => h('li', {}, this.#link(c, ' ›')))),
      );
    }
    if (m.closeTo.length > 0) {
      body.append(
        h('h3', {}, t('closeTo')),
        h('p', { className: 'fw-close-to' }, ...m.closeTo.map((c) => this.#link(c))),
      );
    }
    this.replaceChildren(head, body);
  }
}

if (!customElements.get('fw-card')) customElements.define('fw-card', FwCard);
