// @vitest-environment happy-dom
import { beforeAll, beforeEach, describe, expect, test, vi, type Mock } from 'vitest';
import type { KeyAction } from '../../src/input/keyboard';
import { loadData } from '../../src/data/load';
import { setLocale } from '../../src/i18n';
import { buildLayout } from '../../src/model/layout';
import { initialState, type State } from '../../src/state/store';
import { createA11yTree, describe as describeSeg } from '../../src/a11y/tree';
import { createAnnouncer } from '../../src/a11y/announce';

const { wheel, locale } = loadData();
const layout = buildLayout(wheel);
const idx = (p: string): number => layout.byPath.get(p)!;
beforeAll(() => setLocale(locale));

let root: HTMLElement;
let dispatch: Mock<(a: KeyAction) => void>;
beforeEach(() => {
  document.body.innerHTML = '<div id="tree"></div>';
  root = document.getElementById('tree')!;
  dispatch = vi.fn<(a: KeyAction) => void>();
});

const items = () => [...root.querySelectorAll<HTMLElement>('[role="treeitem"]')];
const item = (i: number) => document.getElementById(`fw-node-${i}`)!;

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

  test('exactly one tabindex=0, on focused or else the first core', () => {
    const tree = createA11yTree(root, layout, dispatch);
    tree.update(initialState);
    let tabbable = items().filter((el) => el.tabIndex === 0);
    expect(tabbable).toEqual([item(layout.rings[0]!.segments[0]!)]);
    tree.update({ ...initialState, focused: idx('sad/lonely') });
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

  test('Enter and Space dispatch select of focused', () => {
    const tree = createA11yTree(root, layout, dispatch);
    tree.update({ ...initialState, focused: idx('angry') });
    item(idx('angry')).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    item(idx('angry')).dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(dispatch.mock.calls).toEqual([[{ type: 'select', segment: idx('angry') }], [{ type: 'select', segment: idx('angry') }]]);
  });

  test('focusing an item dispatches focus for it', () => {
    createA11yTree(root, layout, dispatch).update(initialState);
    item(idx('sad')).focus();
    expect(dispatch).toHaveBeenCalledWith({ type: 'focus', segment: idx('sad') });
  });

  test('update moves DOM focus to the focused item when tree has focus', () => {
    const tree = createA11yTree(root, layout, dispatch);
    tree.update(initialState);
    item(layout.rings[0]!.segments[0]!).focus();
    expect(tree.hasFocus()).toBe(true);
    tree.update({ ...initialState, focused: idx('sad') });
    expect(document.activeElement).toBe(item(idx('sad')));
  });

  test('update does not steal focus when the tree is not focused', () => {
    document.body.insertAdjacentHTML('beforeend', '<button id="other">x</button>');
    const tree = createA11yTree(root, layout, dispatch);
    tree.update(initialState);
    document.getElementById('other')!.focus();
    tree.update({ ...initialState, focused: idx('sad') });
    expect(document.activeElement!.id).toBe('other');
  });

  test('aria-selected only on selected; aria-expanded on its ancestors', () => {
    const tree = createA11yTree(root, layout, dispatch);
    const s: State = { ...initialState, selected: idx('angry/aggressive/hostile'), focused: idx('angry/aggressive/hostile') };
    tree.update(s);
    expect(items().filter((el) => el.getAttribute('aria-selected') === 'true')).toEqual([item(idx('angry/aggressive/hostile'))]);
    expect(item(idx('angry')).getAttribute('aria-expanded')).toBe('true');
    expect(item(idx('angry/aggressive')).getAttribute('aria-expanded')).toBe('true');
    expect(item(idx('sad')).getAttribute('aria-expanded')).toBe('false');
  });

  test('onFocusChange reports entering and leaving the tree', () => {
    document.body.insertAdjacentHTML('beforeend', '<button id="other">x</button>');
    const tree = createA11yTree(root, layout, dispatch);
    tree.update(initialState);
    const seen: boolean[] = [];
    tree.onFocusChange((f) => seen.push(f));
    item(idx('sad')).focus();
    document.getElementById('other')!.focus();
    expect(seen).toEqual([true, false]);
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
