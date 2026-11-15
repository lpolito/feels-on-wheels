import { nodeLabel, t, wheelText } from '../i18n';
import { moveFocus } from './focus';
import { keyToAction } from '../input/keyboard';
import type { Layout } from '../model/layout';
import { withFrom, type Action, type State } from '../state/store';

export interface A11yTree {
  update(s: State): void;
  /** Moves DOM focus into the tree (the selection, or else the tabbable word) without scrolling. */
  focusSelected(): void;
  /**
   * The wheel came to rest (question-first spec §3): with nothing selected, the word at 3 o'clock becomes tabbable,
   * and takes focus only from the word that was.
   */
  rest(): void;
}

/** "Hostile. In Angry, Aggressive." — or "Angry." for a core word. */
export function describe(layout: Layout, i: number): string {
  const ancestors: string[] = [];
  for (let p = layout.segments[i]!.parent; p >= 0; p = layout.segments[p]!.parent) {
    ancestors.unshift(nodeLabel(layout.segments[p]!.node));
  }
  const own = nodeLabel(layout.segments[i]!.node);
  return ancestors.length === 0 ? t('labelOnly', { label: own }) : t('inPath', { label: own, path: ancestors.join(', ') });
}

function ancestorLabels(layout: Layout, i: number): string[] {
  const out: string[] = [];
  for (let p = layout.segments[i]!.parent; p >= 0; p = layout.segments[p]!.parent) out.unshift(nodeLabel(layout.segments[p]!.node));
  return out;
}

/** Spec §6: what to announce for a transition, or null. */
export function announceFor(layout: Layout, prev: State, next: State): string | null {
  const own = (i: number) => nodeLabel(layout.segments[i]!.node);
  if (next.opened && next.selected !== null && (!prev.opened || prev.selected !== next.selected)) {
    const path = ancestorLabels(layout, next.selected);
    return path.length === 0
      ? t('openedCore', { label: own(next.selected) })
      : t('opened', { label: own(next.selected), path: path.join(', ') });
  }
  if (prev.opened && !next.opened && prev.selected !== null) return t('closed', { label: own(prev.selected) });
  if (next.selected !== null && next.selected !== prev.selected) return describe(layout, next.selected);
  return null;
}

/**
 * Spec §8: a visually hidden role="tree" mirroring the wheel, with roving tabindex. Question-first spec §3: focus
 * never selects. With nothing selected, the tabbable word is `startWord()` (the word at 3 o'clock), and the tree moves
 * focus between words on its own only when a selection clears and from the old tabbable word in `rest()`.
 */
export function createA11yTree(root: HTMLElement, layout: Layout, dispatch: (a: Action) => void, startWord: () => number): A11yTree {
  const els: HTMLLIElement[] = [];
  let tabbable = -1;
  let selected: number | null = null;
  let current: number | null = null;

  root.setAttribute('role', 'tree');
  root.setAttribute('aria-label', wheelText(layout.wheelId).name);
  root.classList.add('visually-hidden');
  root.replaceChildren();

  const build = (indices: number[], parent: HTMLElement): void => {
    for (const i of indices) {
      const s = layout.segments[i]!;
      const li = document.createElement('li');
      li.id = `fw-node-${i}`;
      li.setAttribute('role', 'treeitem');
      li.setAttribute('aria-level', String(s.ring + 1));
      li.setAttribute('aria-label', nodeLabel(s.node));
      li.tabIndex = -1;
      li.dataset['index'] = String(i);
      const name = document.createElement('span');
      name.textContent = nodeLabel(s.node);
      li.append(name);
      if (s.children.length > 0) {
        li.setAttribute('aria-expanded', 'false');
        const group = document.createElement('ul');
        group.setAttribute('role', 'group');
        build(s.children, group);
        li.append(group);
      }
      els[i] = li;
      parent.append(li);
    }
  };
  const top = document.createElement('ul');
  top.setAttribute('role', 'none');
  build(layout.rings[0]!.segments, top);
  root.append(top);

  const makeTabbable = (i: number): void => {
    if (i === tabbable) return;
    if (tabbable >= 0) els[tabbable]!.tabIndex = -1;
    els[i]!.tabIndex = 0;
    tabbable = i;
  };

  root.addEventListener('keydown', (e) => {
    // Browser zoom (Ctrl/Cmd +/−) and Back (Alt/Cmd+Left) stay with the browser.
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const action = keyToAction(e.key);
    if (!action) return;
    e.preventDefault();
    e.stopPropagation();
    // Question-first spec §3: from nothing, a key selects the word with focus (a screen reader's cursor may be on any).
    const li = (e.target as Element).closest<HTMLElement>('[role="treeitem"]');
    dispatch(li ? withFrom(action, Number(li.dataset['index'])) : action);
  });

  return {
    update(s) {
      const hadFocus = root.contains(document.activeElement);
      // With nothing selected and nothing just cleared, leave the tabbable word and focus where they are.
      const want = s.selected ?? (tabbable < 0 || selected !== null ? startWord() : null);
      if (want !== null) makeTabbable(want);
      if (s.selected !== selected) {
        if (selected !== null) els[selected]!.removeAttribute('aria-selected');
        if (s.selected !== null) els[s.selected]!.setAttribute('aria-selected', 'true');
        selected = s.selected;
      }
      const cur = s.opened ? s.selected : null;
      if (cur !== current) {
        if (current !== null) els[current]!.removeAttribute('aria-current');
        if (cur !== null) els[cur]!.setAttribute('aria-current', 'true');
        current = cur;
      }
      const open = new Set<number>();
      for (let p = s.selected === null ? -1 : layout.segments[s.selected]!.parent; p >= 0; p = layout.segments[p]!.parent) open.add(p);
      for (const seg of layout.segments) {
        if (seg.children.length > 0) els[seg.index]!.setAttribute('aria-expanded', String(open.has(seg.index)));
      }
      if (want !== null && hadFocus && document.activeElement !== els[want]) moveFocus(els[want]!, { preventScroll: true });
    },
    focusSelected() {
      if (tabbable < 0) makeTabbable(startWord());
      const el = els[tabbable]!;
      if (document.activeElement !== el) moveFocus(el, { preventScroll: true });
    },
    rest() {
      if (selected !== null || tabbable < 0) return;
      const old = els[tabbable]!;
      makeTabbable(startWord());
      if (document.activeElement === old && old !== els[tabbable]) moveFocus(els[tabbable]!, { preventScroll: true });
    },
  };
}
