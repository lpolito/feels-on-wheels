// The feelings wheel's content rules that need only the wheel files (src/data/README.md, opinionated wheel spec §3).
// Each check returns one message per fault, naming the word and the rule; an empty list passes.
import { nodeRef } from '../../src/data/load';
import type { FeelingsDict, Locale, Wheel, WheelNode } from '../../src/data/types';

interface Position { id: string; path: string[]; core: string; ring: number }

function positions(wheel: Wheel): Position[] {
  const out: Position[] = [];
  const visit = (n: WheelNode, above: string[]) => {
    const path = [...above, nodeRef(n).id];
    out.push({ id: path.at(-1)!, path, core: path[0]!, ring: path.length - 1 });
    for (const c of n.children ?? []) visit(c, path);
  };
  for (const c of wheel.children) visit(c, []);
  return out;
}

/** Love and Loved are the same word: a final "ed" or "d" goes when the rest is another label (as check.py's base_key). */
export function baseForm(word: string, others: ReadonlySet<string>): string {
  const w = word.toLowerCase();
  for (const suffix of ['d', 'ed']) {
    if (w.endsWith(suffix) && others.has(w.slice(0, -suffix.length))) return w.slice(0, -suffix.length);
  }
  return w;
}

/**
 * Each label once, comparing base forms. A word may be in more than one place only when every place is under a
 * different core: one feeling people split on (the same id) or two meanings (different ids, one label).
 */
export function onceFaults(wheel: Wheel, labels: Record<string, string>): string[] {
  const all = new Set(Object.values(labels).map((l) => l.toLowerCase()));
  const byBase = new Map<string, Position[]>();
  for (const p of positions(wheel)) {
    const base = baseForm(labels[p.id] ?? p.id, all);
    byBase.set(base, [...(byBase.get(base) ?? []), p]);
  }
  const faults: string[] = [];
  for (const ps of byBase.values()) {
    if (ps.length > 1 && new Set(ps.map((p) => p.core)).size < ps.length) {
      faults.push(`once: ${ps.map((p) => `${labels[p.id] ?? p.id} (${p.path.join(' > ')})`).join(' and ')} share a label under one core`);
    }
  }
  return faults;
}

/** Every middle word has 2 or 3 outer words. */
export function layoutFaults(wheel: Wheel): string[] {
  const faults: string[] = [];
  for (const core of wheel.children) {
    for (const mid of core.children ?? []) {
      const n = (mid.children ?? []).length;
      if (n < 2 || n > 3) faults.push(`layout: ${nodeRef(core).id} > ${nodeRef(mid).id} has ${n} outer words, not 2 or 3`);
    }
  }
  return faults;
}

/** Every feeling tagged as what happened to you is on the outer ring, wherever it is. */
export function happenedFaults(wheel: Wheel, feelings: FeelingsDict): string[] {
  return positions(wheel)
    .filter((p) => feelings[p.id]?.whatHappened && p.ring !== 2)
    .map((p) => `what happened: ${p.path.join(' > ')} is tagged as what happened to you but isn't on the outer ring`);
}

const stem = (w: string): string => {
  for (const suffix of ['ing', 'ed', 'd', 's']) {
    if (w.endsWith(suffix) && w.length - suffix.length >= 3) return w.slice(0, -suffix.length);
  }
  return w;
};

/** No card uses its own label or a sibling's (the cores are siblings too), comparing base forms of whole words. */
export function definitionFaults(wheel: Wheel, locale: Locale): string[] {
  const labelOf = (id: string) => locale.feelings[id]?.label ?? id;
  const all = new Set(Object.values(locale.feelings).map((f) => f.label.toLowerCase()));
  const words = (text: string) => (text.toLowerCase().match(/[a-z]+/g) ?? []).map((w) => stem(baseForm(w, all)));
  const uses = (definition: string, label: string) => {
    const d = words(definition);
    const l = words(label);
    return d.some((_, i) => l.every((w, k) => d[i + k] === w));
  };
  const faults: string[] = [];
  const check = (group: WheelNode[], above: string[]) => {
    for (const n of group) {
      const id = nodeRef(n).id;
      const def = locale.feelings[id]?.definition ?? '';
      for (const other of group) {
        const o = nodeRef(other).id;
        if (uses(def, labelOf(o))) {
          const what = o === id ? 'its own label' : `its sibling's label "${labelOf(o)}"`;
          faults.push(`definitions: ${[...above, id].join(' > ')} uses ${what}: ${def}`);
        }
      }
      if (n.children) check(n.children, [...above, id]);
    }
  };
  check(wheel.children, []);
  return faults;
}
