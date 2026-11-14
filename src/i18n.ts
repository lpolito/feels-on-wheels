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

/** Replaces each `{name}` in a template with `vars[name]`, leaving unknown names as written. */
export function fill(template: string, vars?: Record<string, string>): string {
  return vars ? template.replace(/\{(\w+)\}/g, (m, name: string) => vars[name] ?? m) : template;
}

export function t(key: string, vars?: Record<string, string>): string {
  const s = active?.ui[key];
  if (s === undefined) return missing(key);
  return fill(s, vars);
}

export function label(id: FeelingId): string {
  return active?.feelings[id]?.label ?? missing(`feelings.${id}.label`);
}

export function definition(id: FeelingId): string {
  return active?.feelings[id]?.definition ?? missing(`feelings.${id}.definition`);
}

/** Spec v2.2 §4.4: a core feeling's "A {link} feeling.", split around its link text. */
export function coreKind(id: FeelingId): { before: string; label: string; after: string } {
  const f = active?.feelings[id];
  const kind = f?.kind ?? missing(`feelings.${id}.kind`);
  const [before = '', after = ''] = kind.split('{link}');
  return { before, label: f?.kindLink ?? missing(`feelings.${id}.kindLink`), after };
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
  return { switch: key, name: key, hintTitle: key, hint: key, hintLink: key };
}
