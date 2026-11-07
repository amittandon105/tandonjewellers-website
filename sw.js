// Caches the shop homepage and same-origin files so the site can open offline after the first visit.
// Remote photos (Unsplash) and WhatsApp/Maps links still need internet.
const CACHE = 'tj-site-v1';
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/images/tj-logo.png',
  '/images/favicon.png',
  '/images/apple-touch-icon.png',
  '/images/icon-192.png',
  '/images/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()).catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  const u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;

  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => {
            c.put('/', copy.clone());
            c.put('/index.html', copy);
          });
        }
        return res;
      }).catch(() =>
        caches.match('/index.html').then(hit =>
          hit || caches.match('/').then(h2 =>
            h2 || new Response('You are offline. Open the site once with internet, then try again.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            })
          )
        )
      )
    );
    return;
  }

  e.respondWith(
    fetch(r).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(r, copy));
      }
      return res;
    }).catch(() => caches.match(r))
  );
});
