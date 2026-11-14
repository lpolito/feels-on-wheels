import type { Locale } from './data/types';
import { fill } from './i18n';
import type { Route, RouteTable } from './state/url';

/** The document title and meta description for a route (spec 2026-11-13 §6). Pure: takes the locale, not the active one. */
export function routeMeta(route: Route, table: RouteTable, locale: Locale): { title: string; description: string } {
  const { titles } = locale;
  const named = (name: string): string => fill(titles.route, { name });
  switch (route.kind) {
    case 'about':
      return { title: titles.about, description: titles.aboutDescription };
    case 'notFound':
      return { title: named(titles.notFound), description: titles.homeDescription };
    case 'wheel': {
      const ref = route.path === null ? undefined : table.wheels.get(route.wheel)?.get(route.path);
      if (!ref) {
        if (route.wheel === table.first) return { title: titles.home, description: titles.homeDescription };
        return { title: named(locale.wheels[route.wheel]?.name ?? route.wheel), description: titles.wheelDescriptions[route.wheel] ?? titles.homeDescription };
      }
      if (ref.kind === 'feeling') {
        const f = locale.feelings[ref.id];
        return { title: named(f?.label ?? ref.id), description: f?.definition ?? titles.homeDescription };
      }
      if (ref.kind === 'sensation') {
        const sensation = locale.sensations[ref.id] ?? ref.id;
        return { title: named(sensation), description: fill(titles.sensationDescription, { sensation }) };
      }
      const area = locale.areas[ref.id] ?? ref.id;
      return { title: named(area), description: fill(titles.areaDescription, { area }) };
    }
  }
}
