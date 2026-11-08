import type { FeelingId, Locale, NodeRef, SensationId, WheelText } from './data/types';

let active: Locale | null = null;
const warned = new Set<string>();

export function setLocale(l: Locale): void {
  active = l;
  if (typeof document !== 'undefined') {
    document.documentElement.lang = l.meta.lang;
    document.documentElement.dir = l.meta.dir;
  }
}

function missing(key: string): string {
  if (!warned.has(key)) {
    warned.add(key);
    console.warn(`i18n: missing string "${key}"`);
  }
  return key;
}

export function t(key: string, vars?: Record<string, string>): string {
  const s = active?.ui[key];
  if (s === undefined) return missing(key);
  return vars ? s.replace(/\{(\w+)\}/g, (m, name: string) => vars[name] ?? m) : s;
}

export function label(id: FeelingId): string {
  return active?.feelings[id]?.label ?? missing(`feelings.${id}.label`);
}

export function definition(id: FeelingId): string {
  return active?.feelings[id]?.definition ?? missing(`feelings.${id}.definition`);
}

export function sensationLabel(id: SensationId): string {
  return active?.sensations[id] ?? missing(`sensations.${id}`);
}

/** The label of any wheel cell (spec v2 §7.2). */
export function nodeLabel(n: NodeRef): string {
  if (n.kind === 'feeling') return label(n.id);
  if (n.kind === 'sensation') return sensationLabel(n.id);
  return active?.areas[n.id] ?? missing(`areas.${n.id}`);
}

/** A wheel's switch label, name and start message (spec v2 §4.1). */
export function wheelText(id: string): WheelText {
  const w = active?.wheels[id];
  if (w) return w;
  const key = missing(`wheels.${id}`);
  return { switch: key, name: key, hint: key, hintLink: key };
}
