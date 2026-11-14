import { nodeRef } from '../data/node';
import type { NodeRef, Wheel, WheelNode } from '../data/types';
import type { Layout, Path } from '../model/layout';
import type { State } from './store';

export type Route =
  | { kind: 'wheel'; wheel: string; path: Path | null } // null: the wheel at rest
  | { kind: 'about' }
  | { kind: 'notFound'; wheel: string; word: string };

export interface RouteTable {
  first: string; // the first wheel's id, served at the root
  wheels: ReadonlyMap<string, ReadonlyMap<Path, NodeRef>>; // in wheel order
  langs: readonly string[]; // prefixed languages; [] today (§9)
}

/** The longest word the not-found page echoes back. */
export const WORD_MAX = 40;

/** Every path of a wheel, built like `buildLayout` builds `Segment.path`: ids joined with `/`, center outward. */
function wheelPaths(wheel: Wheel): Map<Path, NodeRef> {
  const out = new Map<Path, NodeRef>();
  const walk = (nodes: readonly WheelNode[], prefix: string): void => {
    for (const n of nodes) {
      const ref = nodeRef(n);
      const path = prefix ? `${prefix}/${ref.id}` : ref.id;
      out.set(path, ref);
      if (n.children) walk(n.children, path);
    }
  };
  walk(wheel.children, '');
  return out;
}

export function routeTable(wheels: readonly Wheel[], langs: readonly string[] = []): RouteTable {
  return { first: wheels[0]!.id, wheels: new Map(wheels.map((w) => [w.id, wheelPaths(w)])), langs };
}

function clip(word: string): string {
  const chars = Array.from(word);
  return chars.length > WORD_MAX ? `${chars.slice(0, WORD_MAX).join('')}…` : word;
}

function decode(seg: string): string | null {
  try {
    const d = decodeURIComponent(seg);
    return d.includes('/') ? null : d;
  } catch {
    return null;
  }
}

export function parsePath(table: RouteTable, pathname: string): { lang: string | null; route: Route } {
  const raw = pathname === '/' ? [] : pathname.startsWith('/') ? pathname.slice(1).split('/') : [''];
  const word = (): string => {
    const last = [...raw].reverse().find((r) => r !== '');
    if (last === undefined) return clip(pathname);
    try {
      return clip(decodeURIComponent(last));
    } catch {
      return clip(last);
    }
  };
  let lang: string | null = null;
  let rest = raw;
  if (raw.length > 0 && table.langs.includes(raw[0]!)) {
    lang = raw[0]!;
    rest = raw.slice(1);
  }
  const named = rest[0] !== undefined && rest[0] !== table.first && table.wheels.has(rest[0]) ? rest[0] : null;
  const notFound = (): { lang: string | null; route: Route } => ({ lang, route: { kind: 'notFound', wheel: named ?? table.first, word: word() } });
  const segs: string[] = [];
  for (const r of rest) {
    const d = r === '' ? null : decode(r);
    if (d === null) return notFound();
    segs.push(d);
  }
  if (segs.length === 0) return { lang, route: { kind: 'wheel', wheel: table.first, path: null } };
  if (segs.length === 1 && segs[0] === 'about') return { lang, route: { kind: 'about' } };
  if (named !== null) {
    if (segs.length === 1) return { lang, route: { kind: 'wheel', wheel: named, path: null } };
    const path = segs.slice(1).join('/');
    return table.wheels.get(named)!.has(path) ? { lang, route: { kind: 'wheel', wheel: named, path } } : notFound();
  }
  const path = segs.join('/');
  return table.wheels.get(table.first)!.has(path) ? { lang, route: { kind: 'wheel', wheel: table.first, path } } : notFound();
}

export function formatRoute(table: RouteTable, route: Exclude<Route, { kind: 'notFound' }>, lang: string | null = null): string {
  const prefix = lang ? `/${lang}` : '';
  if (route.kind === 'about') return `${prefix}/about`;
  const head = route.wheel === table.first ? prefix : `${prefix}/${route.wheel}`;
  if (route.path === null) return head || '/';
  return `${head}/${route.path}`;
}

/** '/', '/about', then every wheel route in wheel order. */
export function allPaths(table: RouteTable): string[] {
  const out = ['/', '/about'];
  for (const [id, paths] of table.wheels) {
    if (id !== table.first) out.push(formatRoute(table, { kind: 'wheel', wheel: id, path: null }));
    for (const p of paths.keys()) out.push(formatRoute(table, { kind: 'wheel', wheel: id, path: p }));
  }
  return out;
}

/** The first wheel's top-level ids that collide with another wheel's id, `about`, a locale code or an output name. */
export function reservedClash(table: RouteTable, outputNames: readonly string[], localeCodes: readonly string[]): string[] {
  const reserved = new Set<string>(['about', ...[...table.wheels.keys()].filter((id) => id !== table.first), ...localeCodes, ...outputNames]);
  const tops = [...table.wheels.get(table.first)!.keys()].filter((p) => !p.includes('/'));
  return tops.filter((id) => reserved.has(id));
}

/** The opened state for a path of this layout; null when the path isn't one. */
export function stateFor(layout: Layout, path: Path): State | null {
  const i = layout.byPath.get(path);
  if (i === undefined) return null;
  return { selected: i, opened: true, view: { mode: 'ring', ring: layout.segments[i]!.ring } };
}

/** The opened segment's path, else null. */
export function pathOf(layout: Layout, s: State): Path | null {
  return s.opened && s.selected !== null ? layout.segments[s.selected]!.path : null;
}
