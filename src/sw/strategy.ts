/**
 * Navigation strategy (spec §6.5; going-public spec §8.5), kept pure for testing.
 * Serve the first page this worker cached at install among `candidates`: the navigated page itself if it was
 * precached (About), else the shell. Never write a newer page into this worker's cache: a newer page references
 * newer hashed assets that only the next worker's install caches, atomically. The browser checks sw.js for updates
 * on navigation, so new deploys still arrive (on next launch).
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

/** The cache keys to try for a navigation: the page itself (without search or hash), then the shell. */
export function navigationUrls(requestUrl: string, indexUrl: string): string[] {
  const page = new URL(requestUrl);
  page.search = '';
  page.hash = '';
  return [page.href, indexUrl];
}
