/// <reference lib="webworker" />
// Offline support (spec §6.5). __PRECACHE__ and __VERSION__ are injected by build/sw-plugin.ts.
export type {};
declare const self: ServiceWorkerGlobalScope;
declare const __PRECACHE__: string[];
declare const __VERSION__: string;

const CACHE = `fw-${__VERSION__}`;
const INDEX = new URL('./index.html', self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(__PRECACHE__)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('fw-') && k !== CACHE).map((k) => caches.delete(k)))),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    // Serve the cached shell immediately; refresh it in the background for next launch.
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(INDEX, { ignoreVary: true });
        const fresh = fetch(req)
          .then((res) => {
            if (res.ok) void cache.put(INDEX, res.clone());
            return res;
          })
          .catch(() => undefined);
        if (cached) {
          event.waitUntil(fresh);
          return cached;
        }
        return (await fresh) ?? Response.error();
      }),
    );
    return;
  }

  // Hashed build files never change: cache first, fall back to the network. ignoreVary because module
  // scripts are requested with an Origin header (crossorigin) that the precache requests did not send.
  event.respondWith(caches.match(req, { ignoreVary: true }).then((hit) => hit ?? fetch(req)));
});
