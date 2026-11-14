/**
 * Replaces each `{name}` in a template with `vars[name]`, leaving unknown names as written. On its own, away from
 * i18n.ts's DOM, so the Worker (src/worker) can use it through meta.ts.
 */
export function fill(template: string, vars?: Record<string, string>): string {
  return vars ? template.replace(/\{(\w+)\}/g, (m, name: string) => vars[name] ?? m) : template;
}
