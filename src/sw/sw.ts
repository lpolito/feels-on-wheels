/// <reference lib="webworker" />
// Offline support (spec §6.5). __PRECACHE__ and __VERSION__ are injected by build/sw-plugin.ts.
// A new worker takes over as soon as it's installed: it skips waiting once its precache is complete and claims open
// pages once the old caches are gone, so the next page load is served by the new deploy. Taking over at once matters
// because an older worker's shell can't load nested paths like /happy/playful (its relative asset links 404 there).
import { canonicalPage, navigationResponse, navigationUrls, precacheResponse } from './strategy';

declare const self: ServiceWorkerGlobalScope;
declare const __PRECACHE__: string[];
declare const __VERSION__: string;

const CACHE = `fw-${__VERSION__}`;
const INDEX = self.registration.scope;
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const responses = await Promise.all(PRECACHE.map((url) => precacheResponse(url, fetch)));
      const cache = await caches.open(CACHE);
      await Promise.all(PRECACHE.map((url, i) => cache.put(url, responses[i]!)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('fw-') && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    const clean = canonicalPage(req.url, INDEX);
    if (clean) {
      event.respondWith(Response.redirect(clean, 301));
      return;
    }
    event.respondWith(caches.open(CACHE).then((cache) => navigationResponse(cache, navigationUrls(req.url, INDEX), () => fetch(req))));
    return;
  }

  // Hashed build files never change: cache first, fall back to the network. ignoreVary because module
  // scripts are requested with an Origin header (crossorigin) that the precache requests did not send.
  event.respondWith(caches.match(req, { ignoreVary: true }).then((hit) => hit ?? fetch(req)));
});
