import type { Layout } from '../model/layout';
import { initialState, type State } from './store';

export function toHash(layout: Layout, s: State): string {
  if (s.selected === null && s.view.mode === 'overview') return '';
  let hash = `#/${layout.wheelId}`;
  if (s.selected !== null) hash += `/${layout.segments[s.selected]!.path}`;
  if (s.view.mode === 'ring') hash += `?ring=${s.view.ring}`;
  return hash;
}

/** Parses a location hash. Returns null for anything that doesn't match this wheel's data. */
export function fromHash(layout: Layout, hash: string): State | null {
  const m = /^#\/([^?]+)(?:\?(.*))?$/.exec(hash);
  if (!m) return null;
  let parts: string[];
  try {
    parts = decodeURIComponent(m[1]!).split('/');
  } catch {
    return null;
  }
  if (parts[0] !== layout.wheelId) return null;
  const path = parts.slice(1).join('/');
  let selected: number | null = null;
  if (path !== '') {
    const i = layout.byPath.get(path);
    if (i === undefined) return null;
    selected = i;
  }
  const ringParam = new URLSearchParams(m[2] ?? '').get('ring');
  const ring = ringParam !== null && /^\d+$/.test(ringParam) ? Number(ringParam) : -1;
  const zoomed = ring >= 0 && ring < layout.rings.length;
  return {
    ...initialState,
    selected,
    focused: selected,
    view: zoomed ? { mode: 'ring', ring } : initialState.view,
    interacted: zoomed && selected !== null,
  };
}
