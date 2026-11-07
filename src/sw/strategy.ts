/**
 * Navigation strategy (spec §6.5), kept pure for testing.
 * Serve the shell this worker cached at install. Never write a newer index into this worker's cache:
 * a newer index references newer hashed assets that only the next worker's install caches, atomically.
 * The browser checks sw.js for updates on navigation, so new deploys still arrive (on next launch).
 */
export async function navigationResponse(
  cache: { match(req: string, options?: CacheQueryOptions): Promise<Response | undefined> },
  indexUrl: string,
  network: () => Promise<Response>,
): Promise<Response> {
  const cached = await cache.match(indexUrl, { ignoreVary: true });
  if (cached) return cached;
  try {
    return await network();
  } catch {
    return Response.error();
  }
}
