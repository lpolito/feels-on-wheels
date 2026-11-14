import { headTags, type PageStrings } from '../../build/site.ts';
import type { SiteConfig } from '../../site.config.ts';
import type { Locale } from '../data/types.ts';
import { routeMeta } from '../meta.ts';
import { canonicalPage } from '../sw/strategy.ts';
import { formatRoute, parsePath, type RouteTable } from '../state/url.ts';

/**
 * The Worker's core (URL redesign spec §5), pure so it's unit-tested without Cloudflare. Cloudflare serves every real
 * file itself; this only sees paths with no file. A real route gets the shell with that route's head tags (§6), and
 * About's view for `/about` (§3); a non-canonical form of a real route gets a 301; anything else gets the shell with
 * the not-found head and a 404, and the app shows not found (§7).
 */

/** The `ASSETS` binding: Cloudflare's static assets, fetched like the network. */
export interface AssetsBinding {
  fetch(input: Request | URL | string): Promise<Response>;
}

export interface WorkerContext {
  table: RouteTable;
  locale: Locale;
  site: SiteConfig;
  strings: PageStrings;
}

const OPEN = '<!--head-->';
const CLOSE = '<!--/head-->';

/** Replaces the shell's head tags, markers included, with `tags` (which carry their own markers). */
export function replaceHead(html: string, tags: string): string {
  const start = html.indexOf(OPEN);
  const end = html.indexOf(CLOSE, start);
  if (start < 0 || end < 0) throw new Error('worker: the shell is missing its <!--head--> or <!--/head--> marker');
  return html.slice(0, start) + tags + html.slice(end + CLOSE.length);
}

export async function handle(req: Request, assets: AssetsBinding, ctx: WorkerContext): Promise<Response> {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } });
  }
  const url = new URL(req.url);
  const { table } = ctx;

  // Only a form of a real route redirects; `/nope/` is a 404 at once, with no hop to `/nope` first.
  const canonical = canonicalPage(req.url, `${url.origin}/`);
  if (canonical !== null && parsePath(table, new URL(canonical).pathname).route.kind !== 'notFound') {
    return new Response(null, { status: 301, headers: { location: canonical } });
  }

  const { lang, route } = parsePath(table, url.pathname);
  const found = route.kind !== 'notFound';
  const { title, description } = routeMeta(route, table, ctx.locale);
  const path = found ? formatRoute(table, route, lang).slice(1) : '';
  const atRoot = route.kind === 'wheel' && route.wheel === table.first && route.path === null;
  const tags = headTags({ title, description, path, jsonLd: atRoot, noindex: !found }, ctx.site, ctx.strings);

  const shell = await assets.fetch(new URL('/', req.url));
  if (!shell.ok) return shell;
  let html = replaceHead(await shell.text(), tags);
  if (route.kind === 'about') html = html.replace('data-route="wheel"', 'data-route="about"');

  // The shell's caching headers, so a new deploy is seen as soon as the shell is; its etag and length describe
  // the shell's own bytes, not these.
  const headers = new Headers(shell.headers);
  headers.delete('etag');
  headers.delete('content-length');
  return new Response(req.method === 'HEAD' ? null : html, { status: found ? 200 : 404, headers });
}
