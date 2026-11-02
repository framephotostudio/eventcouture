/* Event Couture service worker: lets people install the site as an app (home screen or desktop) and opens the last
   version they saw when they're offline. Always tries the network first, so visitors never get stale pages.
   Only this site's own files are kept; the server (AI, venues, invitations) is never cached. */
const CACHE = 'ec-shell-v1';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', 'manifest.json', 'img/brand/web/icon-192.png']).catch(() => {}))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { if (res.ok && (r.mode === 'navigate' || /\.(css|js|png|jpg|webp|woff2|json)$/.test(u.pathname))) { const copy = res.clone(); caches.open(CACHE).then(c => c.keys().then(ks => Promise.all(ks.filter(k => new URL(k.url).pathname === u.pathname && k.url !== r.url).map(k => c.delete(k)))).then(() => c.put(r, copy))).catch(() => {});   /* one copy per file: older versions are removed */ } return res; })
    .catch(() => caches.match(r).then(m => m || (r.mode === 'navigate' ? caches.match('./') : Response.error()))));
});
