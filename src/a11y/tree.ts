import { label, t } from '../i18n';
import { keyToAction } from '../input/keyboard';
import type { Layout } from '../model/layout';
import type { Action, State } from '../state/store';

export interface A11yTree {
  update(s: State): void;
  /** Moves DOM focus into the tree (the selection, or the first core word) without scrolling. */
  focusSelected(): void;
}

/** "Hostile. In Angry, Aggressive." — or "Angry." for a core word. */
export function describe(layout: Layout, i: number): string {
  const ancestors: string[] = [];
  for (let p = layout.segments[i]!.parent; p >= 0; p = layout.segments[p]!.parent) {
    ancestors.unshift(label(layout.segments[p]!.feelingId));
  }
  const own = label(layout.segments[i]!.feelingId);
  return ancestors.length === 0 ? t('labelOnly', { label: own }) : t('inPath', { label: own, path: ancestors.join(', ') });
}

function ancestorLabels(layout: Layout, i: number): string[] {
  const out: string[] = [];
  for (let p = layout.segments[i]!.parent; p >= 0; p = layout.segments[p]!.parent) out.unshift(label(layout.segments[p]!.feelingId));
  return out;
}

/** Spec §6: what to announce for a transition, or null. */
export function announceFor(layout: Layout, prev: State, next: State): string | null {
  const own = (i: number) => label(layout.segments[i]!.feelingId);
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

/** Spec §8: a visually hidden role="tree" mirroring the wheel, with roving tabindex. */
export function createA11yTree(root: HTMLElement, layout: Layout, dispatch: (a: Action) => void): A11yTree {
  const els: HTMLLIElement[] = [];
  let tabbable = -1;
  let selected: number | null = null;
  let current: number | null = null;
  let focusingProgrammatically = false;

  root.setAttribute('role', 'tree');
  root.setAttribute('aria-label', t('wheelLabel'));
  root.classList.add('visually-hidden');
  root.replaceChildren();

  const build = (indices: number[], parent: HTMLElement): void => {
    for (const i of indices) {
      const s = layout.segments[i]!;
      const li = document.createElement('li');
      li.id = `fw-node-${i}`;
      li.setAttribute('role', 'treeitem');
      li.setAttribute('aria-level', String(s.ring + 1));
      li.setAttribute('aria-label', label(s.feelingId));
      li.tabIndex = -1;
      li.dataset['index'] = String(i);
      const name = document.createElement('span');
      name.textContent = label(s.feelingId);
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

  root.addEventListener('keydown', (e) => {
    // Browser zoom (Ctrl/Cmd +/−) and Back (Alt/Cmd+Left) stay with the browser.
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const action = keyToAction(e.key);
    if (action) {
      e.preventDefault();
      e.stopPropagation();
      dispatch(action);
    }
  });

  // Spec §3.1: keyboard focus is the selection. Tabbing in with nothing selected selects the first core word,
  // so the outline shows where focus is (WCAG 2.4.7). Our own focusSelected() never selects.
  root.addEventListener('focusin', (e) => {
    const from = e.relatedTarget as Node | null;
    if (focusingProgrammatically || selected !== null || (from && root.contains(from))) return;
    dispatch({ type: 'select', segment: layout.rings[0]!.segments[0]! });
  });

  return {
    update(s) {
      const want = s.selected ?? layout.rings[0]!.segments[0]!;
      const hadFocus = root.contains(document.activeElement);
      if (want !== tabbable) {
        if (tabbable >= 0) els[tabbable]!.tabIndex = -1;
        els[want]!.tabIndex = 0;
        tabbable = want;
      }
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
      if (hadFocus && document.activeElement !== els[want]) els[want]!.focus({ preventScroll: true });
    },
    focusSelected() {
      const el = els[tabbable >= 0 ? tabbable : layout.rings[0]!.segments[0]!]!;
      if (document.activeElement === el) return;
      focusingProgrammatically = true;
      try {
        el.focus({ preventScroll: true });
      } finally {
        focusingProgrammatically = false;
      }
    },
  };
}
