// @vitest-environment happy-dom
import { beforeAll, describe, expect, test, vi } from 'vitest';
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
const selected = (p: string): State => ({ ...initialState, selected: idx(p) });
const opened = (p: string): State => ({ selected: idx(p), opened: true, view: { mode: 'ring', ring: layout.segments[idx(p)]!.ring } });
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
  const head = (el: FwCard) => el.querySelector<HTMLButtonElement>('button.fw-card-toggle')!;

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

  test('breadcrumb links sit outside the toggle button', () => {
    const { el } = mount();
    el.model = cardModel(layout, feelings, opened('angry/aggressive/hostile'));
    expect(head(el).querySelector('button, a')).toBeNull();
    const nav = el.querySelector('.fw-card-head > nav.fw-crumbs')!;
    expect([...nav.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Angry', 'Aggressive']);
    expect(el.querySelector('.fw-card-body .fw-crumbs')).toBeNull();
    // Core words have none.
    el.model = cardModel(layout, feelings, opened('sad'));
    expect(el.querySelector('nav.fw-crumbs')).toBeNull();
  });

  test('toggle is a button with aria-expanded inside an h2', () => {
    const { el } = mount();
    el.model = cardModel(layout, feelings, selected('angry/aggressive'));
    const toggle = head(el);
    expect(toggle.type).toBe('button');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.parentElement!.matches('.fw-card-head > h2.fw-card-heading')).toBe(true);
    expect(toggle.querySelector('.fw-dot')).not.toBeNull();
    expect(toggle.querySelector('.fw-card-title')!.textContent).toBe('Aggressive');
    expect(toggle.querySelector('.fw-card-chevron')).not.toBeNull();
  });

  test('selected → opened on the same word keeps the toggle element and sets data-open', () => {
    const { el } = mount();
    el.model = cardModel(layout, feelings, selected('angry/aggressive/hostile'));
    const toggle = head(el);
    const dot = toggle.querySelector('.fw-dot');
    toggle.focus();
    el.model = cardModel(layout, feelings, opened('angry/aggressive/hostile'));
    expect(head(el)).toBe(toggle);
    expect(toggle.querySelector('.fw-dot')).toBe(dot);
    expect(document.activeElement).toBe(toggle);
    expect(el.hasAttribute('data-open')).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelectorAll('.fw-card-head > nav.fw-crumbs button')).toHaveLength(2);
    expect(el.querySelector('.fw-card-body .fw-definition')).not.toBeNull();
    expect(el.querySelector<HTMLElement>('.fw-card-body')!.inert).toBe(false);
  });

  test('opened → selected on the same word keeps the body until another word renders', () => {
    const { el, actions } = mount();
    el.model = cardModel(layout, feelings, opened('angry'));
    const toggle = head(el);
    const body = el.querySelector<HTMLElement>('.fw-card-body')!;
    el.model = cardModel(layout, feelings, selected('angry'));
    expect(head(el)).toBe(toggle);
    expect(el.querySelector('.fw-card-body')).toBe(body);
    expect(body.querySelectorAll('ul.fw-rows button')).toHaveLength(8);
    // Folded away: out of reach of the keyboard and assistive tech.
    expect(body.inert).toBe(true);
    expect(el.hasAttribute('data-open')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    expect(actions).toEqual([{ type: 'activate' }]);
    el.model = cardModel(layout, feelings, selected('sad'));
    expect(el.querySelector('.fw-card-body')).toBeNull();
  });

  test('closing in place with focus in the body or crumbs moves focus to the toggle', () => {
    const { el } = mount();
    el.model = cardModel(layout, feelings, opened('angry'));
    el.querySelector<HTMLButtonElement>('ul.fw-rows button')!.focus();
    el.model = cardModel(layout, feelings, selected('angry'));
    expect(document.activeElement).toBe(head(el));
    el.model = cardModel(layout, feelings, opened('angry/aggressive/hostile'));
    el.querySelector<HTMLButtonElement>('nav.fw-crumbs button')!.focus();
    el.model = cardModel(layout, feelings, selected('angry/aggressive/hostile'));
    expect(document.activeElement).toBe(head(el));
  });

  test('a rebuild for another word scrolls the card back to the top', () => {
    const { el } = mount();
    el.model = cardModel(layout, feelings, opened('angry'));
    el.scrollTop = 120;
    expect(el.scrollTop).toBe(120);
    el.model = cardModel(layout, feelings, opened('sad'));
    expect(el.scrollTop).toBe(0);
  });

  test('an in-place close keeps the scroll position', () => {
    const { el } = mount();
    el.model = cardModel(layout, feelings, opened('angry'));
    el.scrollTop = 120;
    el.model = cardModel(layout, feelings, selected('angry'));
    expect(el.scrollTop).toBe(120);
  });

  test('rapid open/close/open leaves data-open and aria-expanded matching the last model', () => {
    const { el } = mount();
    const sel = cardModel(layout, feelings, selected('angry/aggressive'));
    const opn = cardModel(layout, feelings, opened('angry/aggressive'));
    el.model = sel;
    const toggle = head(el);
    for (const m of [opn, sel, opn, sel, opn, opn, sel]) {
      el.model = m;
      const open = m.kind === 'opened';
      expect(head(el)).toBe(toggle);
      expect(el.hasAttribute('data-open')).toBe(open);
      expect(toggle.getAttribute('aria-expanded')).toBe(String(open));
      expect(el.querySelectorAll('.fw-card-body')).toHaveLength(1);
      expect(el.querySelectorAll('nav.fw-crumbs')).toHaveLength(1);
      expect(el.querySelector<HTMLElement>('.fw-card-body')!.inert).toBe(!open);
      expect(el.querySelector<HTMLElement>('nav.fw-crumbs')!.inert).toBe(!open);
    }
  });

  test('--ink is set from inks[hue]', () => {
    const { el } = mount();
    el.inks = { angry: '#7a1018', sad: '#2a2450' };
    el.model = cardModel(layout, feelings, selected('angry'));
    expect(el.style.getPropertyValue('--ink')).toBe('#7a1018');
    el.model = cardModel(layout, feelings, opened('sad'));
    expect(el.style.getPropertyValue('--ink')).toBe('#2a2450');
    el.inks = { sad: '#111111' };
    expect(el.style.getPropertyValue('--ink')).toBe('#111111');
  });

  test('no pill classes remain', () => {
    const { el } = mount();
    el.model = cardModel(layout, feelings, opened('angry/aggressive/hostile'));
    expect(el.querySelector('.fw-chip, .fw-chips')).toBeNull();
    for (const b of el.querySelectorAll('button')) expect(b.type).toBe('button');
  });
});

describe('<fw-toolbar>', () => {
  test('hiding Start over while it has focus emits fw-focus-lost', () => {
    document.body.innerHTML = '<fw-toolbar></fw-toolbar>';
    const el = document.querySelector<FwToolbar>('fw-toolbar')!;
    let lost = 0;
    el.addEventListener('fw-focus-lost', () => lost++);
    el.selected = true;
    el.selected = false;
    expect(lost).toBe(0);
    el.selected = true;
    el.querySelector<HTMLButtonElement>('button.fw-start-over')!.focus();
    el.selected = false;
    expect(lost).toBe(1);
  });

  test('toolbar shows Start over only when something is selected, emits clear then fw-focus-lost', () => {
    document.body.innerHTML = '<fw-toolbar></fw-toolbar>';
    const el = document.querySelector<FwToolbar>('fw-toolbar')!;
    const actions: unknown[] = [];
    el.addEventListener('fw-action', (e) => actions.push((e as CustomEvent).detail));
    el.addEventListener('fw-focus-lost', () => actions.push('fw-focus-lost'));
    el.selected = false;
    const btn = el.querySelector<HTMLButtonElement>('button.fw-start-over')!;
    expect(btn.hidden).toBe(true);
    el.selected = true;
    expect(btn.hidden).toBe(false);
    expect(btn.textContent).toBe('Start over');
    expect(btn.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
    btn.click();
    expect(actions).toEqual([{ type: 'clear' }, 'fw-focus-lost']);
  });

  test('theme toggle shows the current choice as its icon and name', () => {
    document.body.innerHTML = '<fw-toolbar></fw-toolbar>';
    const el = document.querySelector<FwToolbar>('fw-toolbar')!;
    const btn = el.querySelector<HTMLButtonElement>('button.fw-theme-toggle')!;
    const shown = () => [...btn.querySelectorAll<SVGElement>('svg[data-theme]')].filter((i) => !i.hasAttribute('hidden')).map((i) => i.dataset['theme']);
    for (const [p, name] of [['system', 'Match system'], ['light', 'Light'], ['dark', 'Dark']] as const) {
      el.theme = p;
      expect(btn.getAttribute('aria-label')).toBe(`Theme: ${name}`);
      expect(shown()).toEqual([p]);
      expect(el.querySelector('.fw-theme-label')!.textContent).toBe(name);
      expect(el.querySelector('.fw-theme-label')!.getAttribute('aria-hidden')).toBe('true');
    }
    expect(el.querySelector('select')).toBeNull();
  });

  test('clicking the theme toggle emits the next choice and shows the label for 1.5 s', () => {
    vi.useFakeTimers();
    try {
      document.body.innerHTML = '<fw-toolbar></fw-toolbar>';
      const el = document.querySelector<FwToolbar>('fw-toolbar')!;
      const themes: unknown[] = [];
      el.addEventListener('fw-theme', (e) => themes.push((e as CustomEvent).detail));
      el.theme = 'system';
      const label = el.querySelector<HTMLElement>('.fw-theme-label')!;
      expect(label.hasAttribute('data-show')).toBe(false);
      el.querySelector<HTMLButtonElement>('button.fw-theme-toggle')!.click();
      expect(themes).toEqual(['light']);
      expect(label.hasAttribute('data-show')).toBe(true);
      vi.advanceTimersByTime(1400);
      expect(label.hasAttribute('data-show')).toBe(true);
      vi.advanceTimersByTime(200);
      expect(label.hasAttribute('data-show')).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  test('clicking quickly restarts the label timer', () => {
    vi.useFakeTimers();
    try {
      document.body.innerHTML = '<fw-toolbar></fw-toolbar>';
      const el = document.querySelector<FwToolbar>('fw-toolbar')!;
      const btn = el.querySelector<HTMLButtonElement>('button.fw-theme-toggle')!;
      const label = el.querySelector<HTMLElement>('.fw-theme-label')!;
      for (let k = 0; k < 3; k++) {
        btn.click();
        vi.advanceTimersByTime(1000);
      }
      vi.advanceTimersByTime(400); // 1.4 s after the last click
      expect(label.hasAttribute('data-show')).toBe(true);
      vi.advanceTimersByTime(200);
      expect(label.hasAttribute('data-show')).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

});

