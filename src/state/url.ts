import type { Layout } from '../model/layout';
import type { State } from './store';

/** Only opened states have a hash (spec §3.6). */
export function toHash(layout: Layout, s: State): string {
  if (!s.opened || s.selected === null) return '';
  return `#/${layout.wheelId}/${layout.segments[s.selected]!.path}`;
}

/** Parses a location hash into an opened state. Null for anything that isn't a feeling of this wheel. Any query is ignored. */
export function fromHash(layout: Layout, hash: string): State | null {
  const m = /^#\/([^?]+)(?:\?.*)?$/.exec(hash);
  if (!m) return null;
  let parts: string[];
  try {
    parts = decodeURIComponent(m[1]!).split('/');
  } catch {
    return null;
  }
  if (parts[0] !== layout.wheelId) return null;
  const i = layout.byPath.get(parts.slice(1).join('/'));
  if (i === undefined) return null;
  return { selected: i, opened: true, view: { mode: 'ring', ring: layout.segments[i]!.ring }, hinted: false };
}
