/// <reference lib="webworker" />
// Offline support (spec §6.5). __PRECACHE__ and __VERSION__ are injected by build/sw-plugin.ts.
import { navigationResponse, navigationUrls } from './strategy';

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
    event.respondWith(caches.open(CACHE).then((cache) => navigationResponse(cache, navigationUrls(req.url, INDEX), () => fetch(req))));
    return;
  }

  // Hashed build files never change: cache first, fall back to the network. ignoreVary because module
  // scripts are requested with an Origin header (crossorigin) that the precache requests did not send.
  event.respondWith(caches.match(req, { ignoreVary: true }).then((hit) => hit ?? fetch(req)));
});
