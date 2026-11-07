// @vitest-environment happy-dom
import { beforeAll, describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { setLocale } from '../../src/i18n';
import { buildLayout } from '../../src/model/layout';
import { initialState, type Action, type State } from '../../src/state/store';
import { cardModel, type FwCard } from '../../src/ui/card';
import '../../src/ui/toolbar';
import type { FwToolbar } from '../../src/ui/toolbar';

const { wheel, feelings, locale } = loadData();
const layout = buildLayout(wheel);
const idx = (p: string): number => layout.byPath.get(p)!;
const selected = (p: string): State => ({ ...initialState, selected: idx(p), hinted: false });
const opened = (p: string): State => ({ selected: idx(p), opened: true, view: { mode: 'ring', ring: layout.segments[idx(p)]!.ring }, hinted: false });
beforeAll(() => setLocale(locale));

describe('cardModel', () => {
  test('cardModel: none / selected / opened', () => {
    expect(cardModel(layout, feelings, initialState)).toEqual({ kind: 'none' });
    expect(cardModel(layout, feelings, selected('angry/aggressive'))).toEqual({
      kind: 'selected', index: idx('angry/aggressive'), title: 'Aggressive', hue: 'angry',
    });
    const m = cardModel(layout, feelings, opened('angry/aggressive/hostile'));
    if (m.kind !== 'opened') throw new Error('expected opened');
    expect(m.title).toBe('Hostile');
    expect(m.hue).toBe('angry');
    expect(m.crumbs).toEqual([{ index: idx('angry'), label: 'Angry' }, { index: idx('angry/aggressive'), label: 'Aggressive' }]);
    expect(m.children).toEqual([]);
    expect(m.closeTo).toEqual([{ index: idx('angry/aggressive/provoked'), label: 'Provoked' }]);
    expect(m.definition).toBe(locale.feelings['hostile']!.definition);
    expect(m.sensations).toEqual((feelings['hostile']?.sensations ?? []).map((s) => locale.sensations[s]));
  });

  test('opened core: no crumbs, 8 children, no closeTo', () => {
    const m = cardModel(layout, feelings, opened('angry'));
    if (m.kind !== 'opened') throw new Error('expected opened');
    expect(m.crumbs).toEqual([]);
    expect(m.children.map((c) => c.label)).toEqual(['Let Down', 'Humiliated', 'Bitter', 'Mad', 'Aggressive', 'Frustrated', 'Distant', 'Critical']);
    expect(m.closeTo).toEqual([]);
  });
});

describe('<fw-card>', () => {
  const mount = (): { el: FwCard; actions: Action[] } => {
    document.body.innerHTML = '<button id="outside">x</button><fw-card></fw-card>';
    const el = document.querySelector<FwCard>('fw-card')!;
    const actions: Action[] = [];
    el.addEventListener('fw-action', (e) => actions.push((e as CustomEvent<Action>).detail));
    return { el, actions };
  };
  const head = (el: FwCard) => el.querySelector<HTMLButtonElement>('button.fw-card-head')!;

  test('none is hidden', () => {
    const { el } = mount();
    el.model = { kind: 'none' };
    expect(el.hidden).toBe(true);
  });

  test('header is a button with aria-expanded false when selected and true when opened', () => {
    const { el } = mount();
    el.model = cardModel(layout, feelings, selected('angry'));
    expect(el.hidden).toBe(false);
    expect(head(el).getAttribute('aria-expanded')).toBe('false');
    expect(head(el).textContent).toContain('Angry');
    expect(el.querySelector('.fw-card-body')).toBeNull();
    el.model = cardModel(layout, feelings, opened('angry'));
    expect(head(el).getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('.fw-card-body')).not.toBeNull();
  });

  test('header click emits activate when selected and close when opened', () => {
    const { el, actions } = mount();
    el.model = cardModel(layout, feelings, selected('angry'));
    head(el).click();
    el.model = cardModel(layout, feelings, opened('angry'));
    head(el).click();
    expect(actions).toEqual([{ type: 'activate' }, { type: 'close' }]);
  });

  test('crumb, row and close-to buttons emit open(index)', () => {
    const { el, actions } = mount();
    el.model = cardModel(layout, feelings, opened('angry/aggressive/hostile'));
    const crumbs = [...el.querySelectorAll<HTMLButtonElement>('.fw-crumbs button')];
    expect(crumbs.map((b) => b.textContent)).toEqual(['Angry', 'Aggressive']);
    expect(el.querySelector('.fw-crumbs')!.getAttribute('aria-label')).toBe(locale.ui['path']);
    crumbs[1]!.click();
    const close = el.querySelector<HTMLButtonElement>('.fw-close-to button')!;
    expect(close.textContent).toBe('Provoked');
    close.click();
    el.model = cardModel(layout, feelings, opened('angry'));
    const rows = [...el.querySelectorAll<HTMLButtonElement>('ul.fw-rows button')];
    expect(rows).toHaveLength(8);
    rows[4]!.click();
    expect(actions).toEqual([
      { type: 'open', segment: idx('angry/aggressive') },
      { type: 'open', segment: idx('angry/aggressive/provoked') },
      { type: 'open', segment: idx('angry/aggressive') },
    ]);
  });

  test('same model does not rebuild; rebuild with focus inside moves focus to the header', () => {
    const { el } = mount();
    el.model = cardModel(layout, feelings, opened('angry'));
    const row = el.querySelector<HTMLButtonElement>('ul.fw-rows button')!;
    row.focus();
    el.model = cardModel(layout, feelings, opened('angry'));
    expect(document.activeElement).toBe(row);
    el.model = cardModel(layout, feelings, opened('angry/let-down'));
    expect(document.activeElement).toBe(head(el));
    expect(head(el).textContent).toContain('Let Down');
  });

  test('re-rendering does not steal focus that is outside the card', () => {
    const { el } = mount();
    const outside = document.getElementById('outside')!;
    outside.focus();
    el.model = cardModel(layout, feelings, opened('angry'));
    el.model = cardModel(layout, feelings, opened('sad'));
    expect(document.activeElement).toBe(outside);
  });

  test('hiding the card with focus inside emits fw-focus-lost', () => {
    const { el } = mount();
    let lost = 0;
    el.addEventListener('fw-focus-lost', () => lost++);
    el.model = cardModel(layout, feelings, selected('angry'));
    head(el).focus();
    el.model = { kind: 'none' };
    expect(el.hidden).toBe(true);
    expect(lost).toBe(1);
  });

  test('no pill classes remain', () => {
    const { el } = mount();
    el.model = cardModel(layout, feelings, opened('angry/aggressive/hostile'));
    expect(el.querySelector('.fw-chip, .fw-chips')).toBeNull();
    for (const b of el.querySelectorAll('button')) expect(b.type).toBe('button');
  });
});

describe('<fw-toolbar>', () => {
  test('toolbar shows Zoom out only when opened, emits close then fw-focus-lost', () => {
    document.body.innerHTML = '<fw-toolbar></fw-toolbar>';
    const el = document.querySelector<FwToolbar>('fw-toolbar')!;
    const actions: unknown[] = [];
    const themes: unknown[] = [];
    el.addEventListener('fw-action', (e) => actions.push((e as CustomEvent).detail));
    el.addEventListener('fw-focus-lost', () => actions.push('fw-focus-lost'));
    el.addEventListener('fw-theme', (e) => themes.push((e as CustomEvent).detail));
    el.opened = false;
    const btn = el.querySelector<HTMLButtonElement>('button.fw-zoom-out')!;
    expect(btn.hidden).toBe(true);
    el.opened = true;
    expect(btn.hidden).toBe(false);
    expect(btn.textContent).toBe('Zoom out');
    expect(btn.hasAttribute('aria-pressed')).toBe(false);
    btn.click();
    expect(actions).toEqual([{ type: 'close' }, 'fw-focus-lost']);
    const select = el.querySelector('select')!;
    el.theme = 'dark';
    expect(select.value).toBe('dark');
    select.value = 'light';
    select.dispatchEvent(new Event('change'));
    expect(themes).toEqual(['light']);
  });
});
