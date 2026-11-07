import { ringNeighbor, type Layout } from '../model/layout';

export type View = { mode: 'overview' } | { mode: 'ring'; ring: number };

export interface State {
  selected: number | null;
  focused: number | null;
  view: View;
  /** In ring mode: the user has spun or tapped, so the centered segment is the selection. */
  interacted: boolean;
}

export type Action =
  | { type: 'select'; segment: number }
  | { type: 'clear' }
  | { type: 'focus'; segment: number }
  | { type: 'step'; delta: 1 | -1 }
  | { type: 'toChild' }
  | { type: 'toParent' }
  | { type: 'setRing'; ring: number }
  | { type: 'settled'; segment: number }
  | { type: 'interact' }
  | { type: 'zoomIn'; segment?: number }
  | { type: 'zoomOut' }
  | { type: 'escape' }
  | { type: 'restore'; state: State };

export const initialState: State = Object.freeze({
  selected: null,
  focused: null,
  view: Object.freeze({ mode: 'overview' }) as View,
  interacted: false,
}) as State;

const ringView = (ring: number): View => ({ mode: 'ring', ring });

function sameView(a: View, b: View): boolean {
  return a.mode === b.mode && (a.mode === 'overview' || a.ring === (b as { ring: number }).ring);
}

function sameState(a: State, b: State): boolean {
  return a.selected === b.selected && a.focused === b.focused && a.interacted === b.interacted && sameView(a.view, b.view);
}

/** Move keyboard/picker focus to `to`; in ring mode that also selects it. */
function moveTo(layout: Layout, s: State, to: number): State {
  if (s.view.mode === 'overview') return { ...s, focused: to };
  return { ...s, focused: to, selected: to, interacted: true, view: ringView(layout.segments[to]!.ring) };
}

function next(layout: Layout, s: State, a: Action): State {
  const seg = (i: number) => layout.segments[i]!;
  const cursor = s.focused ?? s.selected;
  switch (a.type) {
    case 'select': {
      if (s.selected === a.segment) return { ...s, selected: null, interacted: false };
      if (s.view.mode === 'overview') return { ...s, selected: a.segment, focused: a.segment };
      return { ...s, selected: a.segment, focused: a.segment, interacted: true, view: ringView(seg(a.segment).ring) };
    }
    case 'clear':
      return { ...s, selected: null, interacted: false };
    case 'focus':
      return { ...s, focused: a.segment };
    case 'step': {
      const ring = s.view.mode === 'ring' ? s.view.ring : 0;
      const from = cursor ?? layout.rings[ring]!.segments[0]!;
      return moveTo(layout, s, ringNeighbor(layout, from, a.delta));
    }
    case 'toChild': {
      const child = cursor === null ? undefined : seg(cursor).children[0];
      return child === undefined ? s : moveTo(layout, s, child);
    }
    case 'toParent': {
      const parent = cursor === null ? -1 : seg(cursor).parent;
      return parent < 0 ? s : moveTo(layout, s, parent);
    }
    case 'setRing':
      if (s.view.mode !== 'ring' || a.ring < 0 || a.ring >= layout.rings.length) return s;
      return { ...s, view: ringView(a.ring) };
    case 'settled':
      if (s.view.mode !== 'ring') return s;
      return s.interacted ? { ...s, focused: a.segment, selected: a.segment } : { ...s, focused: a.segment };
    case 'interact':
      return s.view.mode === 'ring' ? { ...s, interacted: true } : s;
    case 'zoomIn': {
      if (a.segment !== undefined) {
        return { ...s, selected: a.segment, focused: a.segment, interacted: true, view: ringView(seg(a.segment).ring) };
      }
      const ring = s.selected === null ? 0 : seg(s.selected).ring;
      return { ...s, view: ringView(ring), interacted: s.selected !== null };
    }
    case 'zoomOut':
      return { ...s, view: initialState.view };
    case 'escape':
      return s.view.mode === 'ring' ? next(layout, s, { type: 'zoomOut' }) : next(layout, s, { type: 'clear' });
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
  subscribe(fn: (s: State, prev: State) => void): () => void;
}

export function createStore(layout: Layout, initial: State = initialState): Store {
  let state = initial;
  const subs = new Set<(s: State, prev: State) => void>();
  return {
    get: () => state,
    dispatch(a) {
      const prev = state;
      state = reduce(layout, state, a);
      if (state !== prev) for (const fn of subs) fn(state, prev);
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}
