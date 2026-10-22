/* Cadence v1.1.0 service worker: offline shell + runtime caching. VERSION is stamped from shell contents by `node stamp.js`. */
const VERSION = 'cadence-cssfallback-20261022';
const SHELL = ['./', './index.html', './app.css', './core.js', './extras.js', './manifest.webmanifest', './icons/icon-96.png', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png'];
const CDN_HOSTS = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('cadence-') && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never touch auth, API or audio traffic.
  if (/spotify\.com$|supabase\.co$|itunes\.apple\.com$/.test(url.hostname)) return;
  if (req.headers.has('range')) return;
  // App shell: serve instantly from cache, refresh in the background (also covers the ?code= OAuth return).
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then(hit => {
        const net = fetch(req).then(r => {
          if (r && r.ok && r.type === 'basic') caches.open(VERSION).then(c => c.put('./index.html', r.clone()));
          return r;
        }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  const sameOrigin = url.origin === location.origin;
  const cdn = CDN_HOSTS.includes(url.hostname);
  if (!sameOrigin && !cdn) return; // album art stays network-only: opaque responses are padded heavily in cache quota

  // Stale-while-revalidate for static assets, fonts and scripts.
  e.respondWith(
    caches.open(VERSION).then(async cache => {
      const hit = await cache.match(req);
      const net = fetch(req).then(r => {
        if (r && (r.ok || r.type === 'opaque')) cache.put(req, r.clone());
        return r;
      }).catch(() => hit);
      return hit || net;
    })
  );
});