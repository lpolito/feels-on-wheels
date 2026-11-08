import type { Layout } from '../model/layout';
import type { State } from './store';

/**
 * Only opened states name a word (spec §3.6). With nothing opened, the first wheel's URL is empty and any other
 * wheel's is `#/<wheel id>` (spec v2 §4.3).
 */
export function toHash(layout: Layout, s: State, first = true): string {
  if (!s.opened || s.selected === null) return first ? '' : `#/${layout.wheelId}`;
  return `#/${layout.wheelId}/${layout.segments[s.selected]!.path}`;
}

/** The wheel id a hash names, when it's one of `ids`; otherwise null (spec v2 §4.3). */
export function hashWheel(hash: string, ids: readonly string[]): string | null {
  const m = /^#\/([^/?]+)/.exec(hash);
  if (!m) return null;
  let id: string;
  try {
    id = decodeURIComponent(m[1]!);
  } catch {
    return null;
  }
  return ids.includes(id) ? id : null;
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
  return { selected: i, opened: true, view: { mode: 'ring', ring: layout.segments[i]!.ring } };
}
