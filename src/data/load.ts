import coreWheel from './wheels/core.json';
import feelingsJson from './feelings.json';
import en from './locales/en.json';
import type { FeelingsDict, Locale, Wheel, WheelNode } from './types';

export class DataError extends Error {
  override name = 'DataError';
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

function fail(msg: string): never {
  throw new DataError(msg);
}

export function validateWheel(w: unknown, dict: FeelingsDict): Wheel {
  if (!isObj(w) || typeof w.id !== 'string' || !Array.isArray(w.rings) || !Array.isArray(w.children)) {
    fail('wheel: expected { id, rings, children }');
  }
  const rings = w.rings as Wheel['rings'];
  rings.forEach((r, i) => {
    if (!(r.inner >= 0 && r.outer > r.inner && r.outer <= 1)) fail(`wheel ${w.id}: ring ${i} has invalid radii`);
    if (i > 0 && r.inner !== rings[i - 1]!.outer) fail(`wheel ${w.id}: ring ${i} is not contiguous with ring ${i - 1}`);
  });
  const visit = (nodes: unknown[], depth: number): void => {
    if (depth >= rings.length) fail(`wheel ${w.id}: tree is deeper than its ${rings.length} rings`);
    for (const n of nodes) {
      if (!isObj(n) || typeof n.feeling !== 'string') fail(`wheel ${w.id}: node without feeling id`);
      if (!dict[n.feeling]) fail(`wheel ${w.id}: unknown feeling "${n.feeling}"`);
      if (depth === 0 && typeof n.hue !== 'string') fail(`wheel ${w.id}: core "${n.feeling}" needs a hue`);
      if (depth > 0 && n.hue !== undefined) fail(`wheel ${w.id}: only core nodes may set hue ("${n.feeling}")`);
      if (n.children !== undefined) {
        if (!Array.isArray(n.children) || n.children.length === 0) fail(`wheel ${w.id}: "${n.feeling}" has empty children`);
        visit(n.children, depth + 1);
      }
    }
  };
  visit(w.children as WheelNode[], 0);
  return w as unknown as Wheel;
}

export function validateLocale(l: unknown, dict: FeelingsDict, _wheel: Wheel): Locale {
  if (!isObj(l) || !isObj(l.meta) || !isObj(l.ui) || !isObj(l.feelings) || !isObj(l.sensations)) {
    fail('locale: expected { meta, ui, feelings, sensations }');
  }
  const loc = l as unknown as Locale;
  for (const [id, f] of Object.entries(dict)) {
    if (!loc.feelings[id]?.label) fail(`locale ${loc.meta.lang}: missing label for "${id}"`);
    for (const s of f.sensations) {
      if (!loc.sensations[s]) fail(`locale ${loc.meta.lang}: missing sensation "${s}"`);
    }
  }
  return loc;
}

export function loadData(): { wheel: Wheel; feelings: FeelingsDict; locale: Locale } {
  const feelings = feelingsJson as FeelingsDict;
  const wheel = validateWheel(coreWheel, feelings);
  const locale = validateLocale(en, feelings, wheel);
  return { wheel, feelings, locale };
}
