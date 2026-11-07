import { label, t } from '../i18n';
import { keyToAction, type KeyAction } from '../input/keyboard';
import type { Layout } from '../model/layout';
import type { State } from '../state/store';

export interface A11yTree {
  update(s: State): void;
  hasFocus(): boolean;
  onFocusChange(fn: (focused: boolean) => void): void;
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

/** Spec §8: a visually hidden role="tree" mirroring the wheel, with roving tabindex. */
export function createA11yTree(root: HTMLElement, layout: Layout, dispatch: (a: KeyAction) => void): A11yTree {
  const els: HTMLLIElement[] = [];
  const focusSubs: ((focused: boolean) => void)[] = [];
  let state: State | null = null;
  let tabbable = -1;
  let selected: number | null = null;
  let focusedInside = false;

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
    if (!state) return;
    const cursor = state.focused ?? layout.rings[0]!.segments[0]!;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      dispatch({ type: 'select', segment: cursor });
      return;
    }
    const action = keyToAction(e.key);
    if (action) {
      e.preventDefault();
      dispatch(action);
    }
  });
  root.addEventListener('focusin', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>('[role="treeitem"]');
    if (!focusedInside) {
      focusedInside = true;
      for (const fn of focusSubs) fn(true);
    }
    if (li) {
      const i = Number(li.dataset['index']);
      if (state?.focused !== i) dispatch({ type: 'focus', segment: i });
    }
  });
  root.addEventListener('focusout', (e) => {
    const next = e.relatedTarget as Node | null;
    if (next && root.contains(next)) return;
    focusedInside = false;
    for (const fn of focusSubs) fn(false);
  });

  return {
    update(s) {
      state = s;
      const want = s.focused ?? layout.rings[0]!.segments[0]!;
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
      const open = new Set<number>();
      for (const start of [s.focused, s.selected]) {
        for (let p = start === null ? -1 : layout.segments[start]!.parent; p >= 0; p = layout.segments[p]!.parent) open.add(p);
      }
      for (const seg of layout.segments) {
        if (seg.children.length > 0) els[seg.index]!.setAttribute('aria-expanded', String(open.has(seg.index)));
      }
      if (focusedInside && document.activeElement !== els[want]) els[want]!.focus();
    },
    hasFocus: () => focusedInside,
    onFocusChange(fn) {
      focusSubs.push(fn);
    },
  };
}
