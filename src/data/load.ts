import feelingsJson from './feelings.json';
import en from './locales/en.json';
import { wheelSources } from './wheels/index';
import { KINDS, nodeRef } from './node';
import type { FeelingsDict, Locale, NodeRef, Wheel, WheelNode } from './types';

export { nodeRef };

export class DataError extends Error {
  override name = 'DataError';
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

function fail(msg: string): never {
  throw new DataError(msg);
}

export function validateWheel(
  w: unknown, dict: FeelingsDict, ids: { sensations: Set<string>; areas: Set<string> },
): Wheel {
  if (!isObj(w) || typeof w.id !== 'string' || !Array.isArray(w.rings) || !Array.isArray(w.children)) {
    fail('wheel: expected { id, rings, children }');
  }
  const rings = w.rings as Wheel['rings'];
  rings.forEach((r, i) => {
    if (!(r.inner >= 0 && r.outer > r.inner && r.outer <= 1)) fail(`wheel ${w.id}: ring ${i} has invalid radii`);
    if (i > 0 && r.inner !== rings[i - 1]!.outer) fail(`wheel ${w.id}: ring ${i} is not contiguous with ring ${i - 1}`);
  });
  const known = { feeling: (id: string) => dict[id] !== undefined, sensation: (id: string) => ids.sensations.has(id), area: (id: string) => ids.areas.has(id) };
  const visit = (nodes: unknown[], depth: number): void => {
    if (depth >= rings.length) fail(`wheel ${w.id}: tree is deeper than its ${rings.length} rings`);
    for (const n of nodes) {
      if (!isObj(n)) fail(`wheel ${w.id}: node is not an object`);
      const kinds = KINDS.filter((k) => n[k] !== undefined);
      if (kinds.length !== 1 || typeof n[kinds[0]!] !== 'string') fail(`wheel ${w.id}: node needs exactly one of ${KINDS.join(', ')}`);
      const kind = kinds[0]!;
      const id = n[kind] as string;
      if (!known[kind](id)) fail(`wheel ${w.id}: unknown ${kind} "${id}"`);
      if (depth === 0 && typeof n.hue !== 'string') fail(`wheel ${w.id}: centre "${id}" needs a hue`);
      if (depth > 0 && n.hue !== undefined) fail(`wheel ${w.id}: only centre nodes may set hue ("${id}")`);
      if (n.children !== undefined) {
        if (!Array.isArray(n.children) || n.children.length === 0) fail(`wheel ${w.id}: "${id}" has empty children`);
        visit(n.children, depth + 1);
      }
    }
  };
  visit(w.children as WheelNode[], 0);
  return w as unknown as Wheel;
}

function refsOf(nodes: WheelNode[], out: NodeRef[] = []): NodeRef[] {
  for (const n of nodes) {
    out.push(nodeRef(n));
    if (n.children) refsOf(n.children, out);
  }
  return out;
}

export function validateLocale(l: unknown, dict: FeelingsDict, wheels: Wheel[]): Locale {
  if (!isObj(l) || !isObj(l.meta) || !isObj(l.ui) || !isObj(l.feelings) || !isObj(l.sensations) || !isObj(l.areas) || !isObj(l.wheels)) {
    fail('locale: expected { meta, ui, feelings, sensations, areas, wheels }');
  }
  const loc = l as unknown as Locale;
  const lang = loc.meta.lang;
  for (const [id, f] of Object.entries(dict)) {
    if (!loc.feelings[id]?.label) fail(`locale ${lang}: missing label for "${id}"`);
    for (const s of f.sensations) {
      if (!loc.sensations[s]) fail(`locale ${lang}: missing sensation "${s}"`);
    }
  }
  for (const w of wheels) {
    const text = loc.wheels[w.id];
    for (const key of ['switch', 'name', 'hint', 'hintLink'] as const) {
      if (!text?.[key]) fail(`locale ${lang}: wheel "${w.id}" is missing "${key}"`);
    }
    if (text && 'switchName' in text && !text.switchName) fail(`locale ${lang}: wheel "${w.id}" has an empty "switchName"`);
    for (const r of refsOf(w.children)) {
      if (r.kind === 'sensation' && !loc.sensations[r.id]) fail(`locale ${lang}: missing sensation "${r.id}"`);
      if (r.kind === 'area' && !loc.areas[r.id]) fail(`locale ${lang}: missing area "${r.id}"`);
    }
  }
  return loc;
}

export function loadData(sources = wheelSources): {
  wheels: Wheel[];
  suggests: Record<string, string>;
  wheel: Wheel;
  feelings: FeelingsDict;
  locale: Locale;
} {
  const feelings = feelingsJson as FeelingsDict;
  const raw = en as unknown as Locale;
  const ids = { sensations: new Set(Object.keys(raw.sensations ?? {})), areas: new Set(Object.keys(raw.areas ?? {})) };
  const wheels = sources.map((s) => validateWheel(s.wheel, feelings, ids));
  const seen = new Set<string>();
  for (const w of wheels) {
    if (seen.has(w.id)) fail(`wheels: duplicate id "${w.id}"`);
    seen.add(w.id);
  }
  const suggests = Object.fromEntries(sources.map((s, i) => [wheels[i]!.id, s.suggests]));
  const locale = validateLocale(en, feelings, wheels);
  return { wheels, suggests, wheel: wheels[0]!, feelings, locale };
}
