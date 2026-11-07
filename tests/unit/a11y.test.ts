// @vitest-environment happy-dom
import { beforeAll, beforeEach, describe, expect, test, vi, type Mock } from 'vitest';
import { loadData } from '../../src/data/load';
import { setLocale } from '../../src/i18n';
import { buildLayout } from '../../src/model/layout';
import { initialState, type Action, type State } from '../../src/state/store';
import { announceFor, createA11yTree, describe as describeSeg } from '../../src/a11y/tree';
import { createAnnouncer } from '../../src/a11y/announce';

const { wheel, locale } = loadData();
const layout = buildLayout(wheel);
const idx = (p: string): number => layout.byPath.get(p)!;
beforeAll(() => setLocale(locale));

let root: HTMLElement;
let dispatch: Mock<(a: Action) => void>;
beforeEach(() => {
  document.body.innerHTML = '<div id="tree"></div>';
  root = document.getElementById('tree')!;
  dispatch = vi.fn<(a: Action) => void>();
});

const items = () => [...root.querySelectorAll<HTMLElement>('[role="treeitem"]')];
const item = (i: number) => document.getElementById(`fw-node-${i}`)!;
const sel = (p: string): State => ({ ...initialState, selected: idx(p), hinted: false });
const opened = (p: string): State => ({ selected: idx(p), opened: true, view: { mode: 'ring', ring: layout.segments[idx(p)]!.ring }, hinted: false });

describe('a11y tree', () => {
  test('renders 130 treeitems with correct aria-level inside a labelled tree', () => {
    const tree = createA11yTree(root, layout, dispatch);
    tree.update(initialState);
    expect(root.getAttribute('role')).toBe('tree');
    expect(root.getAttribute('aria-label')).toBe('Feelings wheel');
    expect(items()).toHaveLength(130);
    expect(item(idx('angry')).getAttribute('aria-level')).toBe('1');
    expect(item(idx('angry/aggressive/hostile')).getAttribute('aria-level')).toBe('3');
    expect(item(idx('angry/aggressive/hostile')).hasAttribute('aria-expanded')).toBe(false);
    expect(item(idx('angry')).querySelector(':scope > [role="group"]')).not.toBeNull();
  });

  test('exactly one tabindex=0, on the selection or else the first core', () => {
    const tree = createA11yTree(root, layout, dispatch);
    tree.update(initialState);
    let tabbable = items().filter((el) => el.tabIndex === 0);
    expect(tabbable).toEqual([item(layout.rings[0]!.segments[0]!)]);
    tree.update(sel('sad/lonely'));
    tabbable = items().filter((el) => el.tabIndex === 0);
    expect(tabbable).toEqual([item(idx('sad/lonely'))]);
  });

  test('ArrowDown dispatches step +1 and prevents scrolling', () => {
    createA11yTree(root, layout, dispatch).update(initialState);
    const ev = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
    item(idx('angry')).dispatchEvent(ev);
    expect(dispatch).toHaveBeenCalledWith({ type: 'step', delta: 1 });
    expect(ev.defaultPrevented).toBe(true);
  });

  test('Enter and Space dispatch activate', () => {
    const tree = createA11yTree(root, layout, dispatch);
    tree.update(sel('angry'));
    item(idx('angry')).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    item(idx('angry')).dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(dispatch.mock.calls).toEqual([[{ type: 'activate' }], [{ type: 'activate' }]]);
  });

  test('tabbing into the tree does not change the selection', () => {
    createA11yTree(root, layout, dispatch).update(initialState);
    item(idx('sad')).focus();
    expect(dispatch).not.toHaveBeenCalled();
  });

  test('update moves DOM focus to the selected item when the tree has focus', () => {
    const tree = createA11yTree(root, layout, dispatch);
    tree.update(initialState);
    item(layout.rings[0]!.segments[0]!).focus();
    tree.update(sel('sad'));
    expect(document.activeElement).toBe(item(idx('sad')));
  });

  test('update does not steal focus when the tree is not focused', () => {
    document.body.insertAdjacentHTML('beforeend', '<button id="other">x</button>');
    const tree = createA11yTree(root, layout, dispatch);
    tree.update(initialState);
    document.getElementById('other')!.focus();
    tree.update(sel('sad'));
    expect(document.activeElement!.id).toBe('other');
  });

  test('focusSelected moves DOM focus to the selection without scrolling', () => {
    const tree = createA11yTree(root, layout, dispatch);
    tree.update(sel('happy'));
    const spy = vi.spyOn(item(idx('happy')), 'focus');
    tree.focusSelected();
    expect(spy).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement).toBe(item(idx('happy')));
    expect(dispatch).not.toHaveBeenCalled();
  });

  test('aria-selected only on selected; aria-current only when opened; aria-expanded on ancestors', () => {
    const tree = createA11yTree(root, layout, dispatch);
    tree.update(sel('angry/aggressive/hostile'));
    expect(items().filter((el) => el.getAttribute('aria-selected') === 'true')).toEqual([item(idx('angry/aggressive/hostile'))]);
    expect(items().filter((el) => el.hasAttribute('aria-current'))).toEqual([]);
    expect(item(idx('angry')).getAttribute('aria-expanded')).toBe('true');
    expect(item(idx('angry/aggressive')).getAttribute('aria-expanded')).toBe('true');
    expect(item(idx('sad')).getAttribute('aria-expanded')).toBe('false');
    tree.update(opened('angry/aggressive/hostile'));
    expect(items().filter((el) => el.getAttribute('aria-current') === 'true')).toEqual([item(idx('angry/aggressive/hostile'))]);
    expect(items().filter((el) => el.getAttribute('aria-selected') === 'true')).toEqual([item(idx('angry/aggressive/hostile'))]);
    tree.update(sel('angry/aggressive/hostile'));
    expect(items().filter((el) => el.hasAttribute('aria-current'))).toEqual([]);
  });
});

describe('announceFor', () => {
  test('selecting announces the description', () => {
    expect(announceFor(layout, initialState, sel('angry/aggressive/hostile'))).toBe('Hostile. In Angry, Aggressive.');
  });

  test('opening announces opened, with the path for non-core words', () => {
    expect(announceFor(layout, sel('angry/aggressive/hostile'), opened('angry/aggressive/hostile'))).toBe('Hostile, opened. In Angry, Aggressive.');
    expect(announceFor(layout, opened('angry/aggressive/hostile'), opened('angry/aggressive'))).toBe('Aggressive, opened. In Angry.');
    expect(announceFor(layout, initialState, opened('angry'))).toBe('Angry, opened.');
  });

  test('closing announces closed', () => {
    expect(announceFor(layout, opened('angry/aggressive/hostile'), sel('angry/aggressive/hostile'))).toBe('Hostile, closed.');
  });

  test('nothing to say: null', () => {
    expect(announceFor(layout, sel('angry'), { ...sel('angry'), hinted: true })).toBeNull();
    expect(announceFor(layout, sel('angry'), initialState)).toBeNull();
  });
});

describe('describe + announcer', () => {
  test('describe(hostile) reads its path', () => {
    expect(describeSeg(layout, idx('angry/aggressive/hostile'))).toBe('Hostile. In Angry, Aggressive.');
    expect(describeSeg(layout, idx('angry'))).toBe('Angry.');
  });

  test('announcer re-announces identical text', async () => {
    const el = document.createElement('div');
    const announce = createAnnouncer(el);
    announce('Hostile.');
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(el.textContent).toBe('Hostile.');
    announce('Hostile.');
    expect(el.textContent).toBe('');
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(el.textContent).toBe('Hostile.');
  });
});
