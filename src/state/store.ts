import { ringNeighbor, type Layout } from '../model/layout';

export type View = { mode: 'wheel' } | { mode: 'ring'; ring: number };

/**
 * Spec §3.1. `opened` implies `selected !== null` and `view` is the selection's ring; otherwise `view` is the whole
 * wheel (v1.2 removed the phone's zoomed start, the one ring view that wasn't opened).
 */
export interface State {
  selected: number | null;
  opened: boolean;
  view: View;
}

export type Action =
  /** Tap: opens instead when already opened, or when `segment` is the selection. */
  | { type: 'select'; segment: number }
  | { type: 'open'; segment: number }
  | { type: 'close' }
  | { type: 'clear' }
  | { type: 'step'; delta: 1 | -1 }
  | { type: 'toChild' }
  | { type: 'toParent' }
  /** '−' (spec v1.2 §3.6): like toParent while opened; otherwise nothing. */
  | { type: 'stepOut' }
  /** Enter / Space / '+'. */
  | { type: 'activate' }
  | { type: 'escape' }
  /** The camera came to rest in a ring view with `segment` at 3 o'clock. */
  | { type: 'settled'; segment: number }
  | { type: 'restore'; state: State };

const WHEEL: View = Object.freeze({ mode: 'wheel' }) as View;

export const initialState: State = Object.freeze({
  selected: null,
  opened: false,
  view: WHEEL,
}) as State;

const ringView = (ring: number): View => ({ mode: 'ring', ring });

function sameView(a: View, b: View): boolean {
  return a.mode === b.mode && (a.mode === 'wheel' || a.ring === (b as { ring: number }).ring);
}

function sameState(a: State, b: State): boolean {
  return a.selected === b.selected && a.opened === b.opened && sameView(a.view, b.view);
}

/** The child whose [start, end) contains the parent's mid: the one at 3 o'clock once the parent is centred. */
export function centerChild(layout: Layout, i: number): number | null {
  const seg = layout.segments[i]!;
  for (const c of seg.children) {
    const child = layout.segments[c]!;
    if (child.start <= seg.mid && seg.mid < child.end) return c;
  }
  return seg.children.length > 0 ? seg.children[seg.children.length - 1]! : null;
}

function open(layout: Layout, s: State, i: number): State {
  return { ...s, selected: i, opened: true, view: ringView(layout.segments[i]!.ring) };
}

/** Select without opening, on the whole wheel. */
function selectOnly(s: State, i: number): State {
  return { ...s, selected: i, opened: false, view: WHEEL };
}

const firstCore = (layout: Layout): number => layout.rings[0]!.segments[0]!;

function next(layout: Layout, s: State, a: Action): State {
  const seg = (i: number) => layout.segments[i]!;
  const sel = s.selected;
  switch (a.type) {
    case 'select':
      if (s.opened || a.segment === sel) return open(layout, s, a.segment);
      return selectOnly(s, a.segment);
    case 'open':
      return open(layout, s, a.segment);
    case 'close':
      return s.opened ? { ...s, opened: false, view: WHEEL } : s;
    case 'clear':
      return { ...s, selected: null, opened: false, view: WHEEL };
    case 'step': {
      if (sel === null) return selectOnly(s, firstCore(layout));
      const to = ringNeighbor(layout, sel, a.delta);
      return s.opened ? open(layout, s, to) : selectOnly(s, to);
    }
    case 'toChild': {
      if (sel === null) return s;
      if (s.opened) {
        const c = centerChild(layout, sel);
        return c === null ? s : open(layout, s, c);
      }
      const c = seg(sel).children[0];
      return c === undefined ? s : selectOnly(s, c);
    }
    case 'toParent': {
      if (sel === null) return s;
      const p = seg(sel).parent;
      if (s.opened) return p < 0 ? next(layout, s, { type: 'close' }) : open(layout, s, p);
      return p < 0 ? s : selectOnly(s, p);
    }
    case 'stepOut':
      return s.opened ? next(layout, s, { type: 'toParent' }) : s;
    case 'activate':
      if (sel === null) return selectOnly(s, firstCore(layout));
      return s.opened ? s : open(layout, s, sel);
    case 'escape':
      if (s.opened) return next(layout, s, { type: 'close' });
      return sel === null ? s : next(layout, s, { type: 'clear' });
    case 'settled': {
      // A spin settled while opened: open the word it stopped on, if it's in the opened ring.
      if (!s.opened || s.view.mode !== 'ring' || seg(a.segment).ring !== s.view.ring) return s;
      return open(layout, s, a.segment);
    }
    case 'restore':
      return a.state;
  }
}

/** Pure transition. Returns `s` itself when nothing changed. */
export function reduce(layout: Layout, s: State, a: Action): State {
  const n = next(layout, s, a);
  return n === s || sameState(n, s) ? s : n;
}

export interface Store {
  get(): State;
  dispatch(a: Action): void;
  subscribe(fn: (s: State, prev: State, a: Action) => void): () => void;
}

export function createStore(layout: Layout, initial: State = initialState): Store {
  let state = initial;
  const subs = new Set<(s: State, prev: State, a: Action) => void>();
  return {
    get: () => state,
    dispatch(a) {
      const prev = state;
      state = reduce(layout, state, a);
      if (state !== prev) for (const fn of subs) fn(state, prev, a);
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}
