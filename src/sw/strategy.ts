/**
 * Navigation strategy (spec §6.5; going-public spec §8.5; URL redesign spec §8), kept pure for testing.
 * Serve the first response this worker cached at install among `candidates` (the file itself, then the shell). Never
 * write a newer page into this worker's cache: a newer page references newer hashed assets that only the next worker's
 * install caches, atomically. The browser checks sw.js for updates on navigation, and a new worker takes over as soon
 * as it's installed (`skipWaiting`, `clients.claim`), so the next page load gets the new deploy.
 */
export async function navigationResponse(
  cache: { match(req: string, options?: CacheQueryOptions): Promise<Response | undefined> },
  candidates: readonly string[],
  network: () => Promise<Response>,
): Promise<Response> {
  for (const url of candidates) {
    const cached = await cache.match(url, { ignoreVary: true });
    if (cached) return cached;
  }
  try {
    return await network();
  } catch {
    return Response.error();
  }
}

/**
 * The clean address for a page requested as `about.html`, `about/` or `index.html`, or null when it's already clean.
 * Cloudflare redirects these too, but an installed worker answers page loads first, and serving a page at the wrong
 * address breaks its relative links (`/about/` would load `/about/assets/…`). The query is kept; the hash never
 * reaches the worker.
 */
export function canonicalPage(requestUrl: string, scope: string): string | null {
  const url = new URL(requestUrl);
  url.hash = '';
  const base = new URL(scope).pathname;
  let path = url.pathname;
  if (path.endsWith('/index.html')) path = path.slice(0, -'index.html'.length);
  else if (path.endsWith('.html')) path = path.slice(0, -'.html'.length);
  if (path.endsWith('/') && path !== base) path = path.slice(0, -1);
  if (path === url.pathname) return null;
  url.pathname = path;
  return url.href;
}

/**
 * The cache keys to try for a navigation: the requested address without its query or hash, so opening a precached
 * file that isn't a page (`/robots.txt`, `/manifest.webmanifest`) gets that file; then the shell, for every page load
 * in scope, real or not (URL redesign spec §7, §8). No page address is precached, so pages always get the shell: the
 * app reads the path and shows the route or "not found", and the worker needs no copy of the route table.
 */
export function navigationUrls(requestUrl: string, indexUrl: string): string[] {
  const url = new URL(requestUrl);
  url.search = '';
  url.hash = '';
  return url.href === indexUrl ? [indexUrl] : [url.href, indexUrl];
}

/**
 * Fetches one precache URL, refusing anything that isn't a plain 200: a response that followed a redirect can't
 * answer a page load, so caching one would break that page. Throwing fails the install, and the previous worker
 * keeps serving.
 */
export async function precacheResponse(url: string, fetcher: (url: string) => Promise<Response>): Promise<Response> {
  const res = await fetcher(url);
  if (res.redirected) throw new Error(`precache: ${url} redirected to ${res.url}`);
  if (!res.ok) throw new Error(`precache: ${url} answered ${res.status}`);
  return res;
}
