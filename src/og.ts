import type { Locale } from './data/types';
import { fill } from './fill';
import type { Route, RouteTable } from './state/url';

/** Link-preview image size (share and preview spec §5). */
export const OG_SIZE = { width: 1200, height: 630 } as const;

/** The wedge in front for a wheel at rest. */
export const OG_BASE: Readonly<Record<string, string>> = { core: 'happy', body: 'whole-body' };

/**
 * Which wheel and wedge a route's preview image shows. Pure, like routeMeta. Anything else, including a wheel at rest
 * with no base wedge, shows the first wheel at rest.
 */
export function ogWedge(route: Route, table: RouteTable): { wheel: string; wedge: string } {
  if (route.kind === 'wheel') {
    const wedge = route.path === null ? OG_BASE[route.wheel] : route.path.split('/')[0];
    if (wedge !== undefined) return { wheel: route.wheel, wedge };
  }
  return { wheel: table.first, wedge: OG_BASE[table.first]! };
}

export function ogImagePath(w: { wheel: string; wedge: string }): string {
  return `og/${w.wheel}-${w.wedge}.png`;
}

/** A route's preview image path (no leading "/") and its alt text, filled into `altTemplate` ({wheel}, {wedge}). */
export function ogImage(route: Route, table: RouteTable, locale: Locale, altTemplate: string): { path: string; alt: string } {
  const w = ogWedge(route, table);
  const wheel = (locale.wheels[w.wheel]?.name ?? w.wheel).toLowerCase();
  const wedge = locale.feelings[w.wedge]?.label ?? locale.areas[w.wedge] ?? w.wedge;
  return { path: ogImagePath(w), alt: fill(altTemplate, { wheel, wedge }) };
}
