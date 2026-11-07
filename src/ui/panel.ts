import type { FeelingsDict } from '../data/types';
import { definition, label, sensationLabel, t } from '../i18n';
import { siblings, type Layout } from '../model/layout';
import type { Action, State } from '../state/store';

interface Item { index: number; label: string }

export type PanelModel =
  | { kind: 'empty'; prompt: string }
  | {
      kind: 'feeling';
      index: number;
      title: string;
      definition: string;
      sensations: string[];
      /** Root → selected, inclusive. */
      path: (Item & { hue: string })[];
      /** "Narrow it down"; empty for outer words. */
      children: Item[];
      /** Siblings, only for outer words. */
      closeTo: Item[];
    };

export function panelModel(layout: Layout, feelings: FeelingsDict, s: State): PanelModel {
  if (s.selected === null) return { kind: 'empty', prompt: t('prompt') };
  const seg = layout.segments[s.selected]!;
  const item = (i: number): Item => ({ index: i, label: label(layout.segments[i]!.feelingId) });
  const path: (Item & { hue: string })[] = [];
  for (let i = seg.index; i >= 0; i = layout.segments[i]!.parent) path.unshift({ ...item(i), hue: layout.segments[i]!.hue });
  const isLeaf = seg.children.length === 0;
  return {
    kind: 'feeling',
    index: seg.index,
    title: label(seg.feelingId),
    definition: definition(seg.feelingId),
    sensations: (feelings[seg.feelingId]?.sensations ?? []).map(sensationLabel),
    path,
    children: seg.children.map(item),
    closeTo: isLeaf ? siblings(layout, seg.index).map(item) : [],
  };
}

const h = <K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}, ...kids: (Node | string)[]) => {
  const el = Object.assign(document.createElement(tag), props);
  el.append(...kids);
  return el;
};

function emit(from: HTMLElement, action: Action): void {
  from.dispatchEvent(new CustomEvent<Action>('fw-action', { detail: action, bubbles: true }));
}

function chips(host: HTMLElement, path: (Item & { hue: string })[]): HTMLElement {
  const list = h('ol', { className: 'fw-chips' });
  path.forEach((p, k) => {
    const b = h('button', { type: 'button', className: 'fw-chip' }, p.label);
    b.style.setProperty('--chip-hue', `var(--hue-${p.hue})`);
    if (k === path.length - 1) b.setAttribute('aria-current', 'true');
    b.addEventListener('click', () => emit(host, { type: 'select', segment: p.index }));
    list.append(h('li', {}, b));
  });
  const nav = h('nav', {}, list);
  nav.setAttribute('aria-label', t('path'));
  return nav;
}

function buttons(host: HTMLElement, heading: string, items: Item[]): HTMLElement[] {
  if (items.length === 0) return [];
  const list = h('ul', { className: 'fw-options' });
  for (const it of items) {
    const b = h('button', { type: 'button' }, it.label);
    b.addEventListener('click', () => emit(host, { type: 'select', segment: it.index }));
    list.append(h('li', {}, b));
  }
  return [h('h3', {}, heading), list];
}

/** The definition card / side panel / bottom sheet. Spec §6.2. */
export class FwPanel extends HTMLElement {
  #model: PanelModel | null = null;

  get model(): PanelModel | null {
    return this.#model;
  }

  set model(m: PanelModel | null) {
    const prev = this.#model;
    this.#model = m;
    // Focus-only and settle changes produce an equal model: keep the DOM (and the user's focus) as it is.
    if (prev && m && prev.kind === m.kind && (m.kind === 'empty' || (prev.kind === 'feeling' && prev.index === m.index))) return;
    const hadFocus = this.contains(document.activeElement);
    this.render();
    if (hadFocus) this.querySelector<HTMLElement>('h2, .fw-prompt')?.focus();
  }

  connectedCallback(): void {
    this.setAttribute('role', 'region');
    this.setAttribute('aria-live', 'off');
    this.render();
  }

  render(): void {
    const m = this.#model;
    if (!m) {
      this.replaceChildren();
      return;
    }
    if (m.kind === 'empty') {
      this.setAttribute('aria-label', m.prompt);
      this.replaceChildren(h('p', { className: 'fw-prompt', tabIndex: -1 }, m.prompt));
      return;
    }
    this.setAttribute('aria-label', m.title);
    const close = h('button', { type: 'button', className: 'fw-close' }, '✕');
    close.setAttribute('aria-label', t('close'));
    close.addEventListener('click', () => emit(this, { type: 'clear' }));
    const sensations = m.sensations.length === 0 ? [] : [
      h('h3', {}, t('youMightNotice')),
      h('ul', { className: 'fw-sensations' }, ...m.sensations.map((s) => h('li', {}, s))),
    ];
    this.style.setProperty('--panel-hue', `var(--hue-${m.path[0]!.hue})`);
    this.replaceChildren(
      h('header', {}, chips(this, m.path), close),
      h('h2', { tabIndex: -1 }, m.title),
      h('p', { className: 'fw-definition' }, m.definition),
      ...sensations,
      ...buttons(this, t('narrowDown'), m.children),
      ...buttons(this, t('closeTo'), m.closeTo),
    );
  }
}

/** Path chips shown above the wheel on narrow layouts. */
export class FwPath extends HTMLElement {
  #model: PanelModel | null = null;

  set model(m: PanelModel | null) {
    this.#model = m;
    this.replaceChildren(...(m?.kind === 'feeling' ? [chips(this, m.path)] : []));
  }

  get model(): PanelModel | null {
    return this.#model;
  }
}

if (!customElements.get('fw-panel')) customElements.define('fw-panel', FwPanel);
if (!customElements.get('fw-path')) customElements.define('fw-path', FwPath);
