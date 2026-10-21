/* Cadence v1.0.1 service worker: app shell + safe runtime caching. Bump VERSION on every deploy. */
const VERSION = 'cadence-v22';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon.svg', './icons/icon-96.png', './icons/apple-touch-icon.png',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png'
];
const CDN_HOSTS = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('cadence-') && key !== VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (/spotify\\.com$|supabase\\.co$|itunes\\.apple\\.com$/.test(url.hostname)) return;
  if (request.headers.has('range')) return;
  if (request.mode === 'navigate') {
    event.respondWith(caches.match('./index.html').then(hit => {
      const network = fetch(request).then(response => {
        if (response && response.ok && response.type === 'basic') {
          caches.open(VERSION).then(cache => cache.put('./index.html', response.clone()));
        }
        return response;
      }).catch(() => hit || caches.match('./'));
      return hit || network;
    }));
    return;
  }
  const sameOrigin = url.origin === self.location.origin;
  const cdn = CDN_HOSTS.includes(url.hostname);
  if (!sameOrigin && !cdn) return;
  event.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(request);
    const network = fetch(request).then(response => {
      if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone());
      return response;
    }).catch(() => hit);
    return hit || network;
  }));
});
