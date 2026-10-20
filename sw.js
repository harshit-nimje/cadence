/* Cadence service worker: cache the same-origin app shell for offline launch.
 * Third-party APIs, Spotify, Supabase, audio previews, and fonts stay network-only.
 */
const CACHE_NAME = "cadence-shell-v2";
const SHELL = ["/", "/manifest.webmanifest", "/icons/icon.svg", "/icons/icon-192.png"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const copy = response.clone();
          const cache = await caches.open(CACHE_NAME);
          await cache.put("/", copy);
        }
        return response;
      } catch (_) {
        return (await caches.match(request, { ignoreSearch: true }))
          || (await caches.match("/", { ignoreSearch: true }))
          || Response.error();
      }
    })());
    return;
  }

  const path = url.pathname;
  if (!["/manifest.webmanifest", "/icons/icon.svg", "/icons/icon-192.png"].includes(path)) return;
  event.respondWith(
    caches.match(request).then(hit => hit || fetch(request))
  );
});
