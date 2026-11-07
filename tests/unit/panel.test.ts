// @vitest-environment happy-dom
import { beforeAll, describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { setLocale } from '../../src/i18n';
import { buildLayout } from '../../src/model/layout';
import { initialState, type Action, type State } from '../../src/state/store';
import { panelModel, type FwPanel, type FwPath } from '../../src/ui/panel';
import '../../src/ui/toolbar';
import type { FwToolbar } from '../../src/ui/toolbar';

const { wheel, feelings, locale } = loadData();
const layout = buildLayout(wheel);
const idx = (p: string): number => layout.byPath.get(p)!;
const sel = (p: string): State => ({ ...initialState, selected: idx(p), focused: idx(p) });
beforeAll(() => setLocale(locale));

describe('panelModel', () => {
  test('no selection → empty with the prompt', () => {
    expect(panelModel(layout, feelings, initialState)).toEqual({ kind: 'empty', prompt: 'How are you feeling? Spin to explore, tap to choose.' });
  });

  test('angry → children are its 8 middles, closeTo empty', () => {
    const m = panelModel(layout, feelings, sel('angry'));
    if (m.kind !== 'feeling') throw new Error('expected feeling');
    expect(m.title).toBe('Angry');
    expect(m.definition).toBe(locale.feelings['angry']!.definition);
    expect(m.children.map((c) => c.label)).toEqual(['Let Down', 'Humiliated', 'Bitter', 'Mad', 'Aggressive', 'Frustrated', 'Distant', 'Critical']);
    expect(m.closeTo).toEqual([]);
    expect(m.sensations).toEqual(feelings['angry']!.sensations.map((s) => locale.sensations[s]));
  });

  test('hostile → no children, closeTo provoked, path angry→aggressive→hostile', () => {
    const m = panelModel(layout, feelings, sel('angry/aggressive/hostile'));
    if (m.kind !== 'feeling') throw new Error('expected feeling');
    expect(m.children).toEqual([]);
    expect(m.closeTo).toEqual([{ index: idx('angry/aggressive/provoked'), label: 'Provoked' }]);
    expect(m.path).toEqual([
      { index: idx('angry'), label: 'Angry', hue: 'angry' },
      { index: idx('angry/aggressive'), label: 'Aggressive', hue: 'angry' },
      { index: idx('angry/aggressive/hostile'), label: 'Hostile', hue: 'angry' },
    ]);
  });
});

describe('<fw-panel> and <fw-path>', () => {
  const mount = <T extends HTMLElement>(tag: string): { el: T; actions: Action[] } => {
    document.body.innerHTML = `<${tag}></${tag}>`;
    const el = document.querySelector<T>(tag)!;
    const actions: Action[] = [];
    el.addEventListener('fw-action', (e) => actions.push((e as CustomEvent<Action>).detail));
    return { el, actions };
  };

  test('chip click emits select of that ancestor', () => {
    const { el, actions } = mount<FwPanel>('fw-panel');
    el.model = panelModel(layout, feelings, sel('angry/aggressive/hostile'));
    const chip = [...el.querySelectorAll('button')].find((b) => b.textContent === 'Aggressive')!;
    chip.click();
    expect(actions).toEqual([{ type: 'select', segment: idx('angry/aggressive') }]);
  });

  test('narrow-it-down button emits select of the child', () => {
    const { el, actions } = mount<FwPanel>('fw-panel');
    el.model = panelModel(layout, feelings, sel('angry'));
    expect(el.textContent).toContain('Narrow it down');
    [...el.querySelectorAll('button')].find((b) => b.textContent === 'Mad')!.click();
    expect(actions).toEqual([{ type: 'select', segment: idx('angry/mad') }]);
  });

  test('✕ emits clear', () => {
    const { el, actions } = mount<FwPanel>('fw-panel');
    el.model = panelModel(layout, feelings, sel('sad'));
    el.querySelector<HTMLButtonElement>('button[aria-label="Clear selection"]')!.click();
    expect(actions).toEqual([{ type: 'clear' }]);
  });

  test('empty model renders the prompt and no buttons', () => {
    const { el } = mount<FwPanel>('fw-panel');
    el.model = panelModel(layout, feelings, initialState);
    expect(el.textContent).toContain('How are you feeling?');
    expect(el.querySelectorAll('button')).toHaveLength(0);
  });

  test('<fw-path> renders chips only, last chip is aria-current', () => {
    const { el, actions } = mount<FwPath>('fw-path');
    el.model = panelModel(layout, feelings, sel('angry/aggressive/hostile'));
    const chips = [...el.querySelectorAll('button')];
    expect(chips.map((c) => c.textContent)).toEqual(['Angry', 'Aggressive', 'Hostile']);
    expect(chips[2]!.getAttribute('aria-current')).toBe('true');
    chips[0]!.click();
    expect(actions).toEqual([{ type: 'select', segment: idx('angry') }]);
  });
});

describe('<fw-toolbar>', () => {
  test('zoom button reflects state and emits zoomToggle; theme select emits fw-theme', () => {
    document.body.innerHTML = '<fw-toolbar></fw-toolbar>';
    const el = document.querySelector<FwToolbar>('fw-toolbar')!;
    const actions: unknown[] = [];
    const themes: unknown[] = [];
    el.addEventListener('fw-action', (e) => actions.push((e as CustomEvent).detail));
    el.addEventListener('fw-theme', (e) => themes.push((e as CustomEvent).detail));
    el.zoomed = false;
    const btn = el.querySelector<HTMLButtonElement>('button')!;
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    expect(btn.getAttribute('aria-label')).toBe('Zoom in');
    el.zoomed = true;
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(btn.getAttribute('aria-label')).toBe('Zoom out');
    btn.click();
    expect(actions).toEqual([{ type: 'zoomToggle' }]);
    const select = el.querySelector('select')!;
    el.theme = 'dark';
    expect(select.value).toBe('dark');
    select.value = 'light';
    select.dispatchEvent(new Event('change'));
    expect(themes).toEqual(['light']);
  });
});
