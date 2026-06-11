// Service worker minimaliste — cache stale-while-revalidate pour assets statiques
const CACHE = 'moneglise-v1';
const STATIC_ASSETS = ['/icons/icon-192.png', '/icons/apple-touch-icon.png', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cache uniquement images (Cloudinary + locales) — pas les API ni le HTML
  const isImage =
    url.hostname === 'res.cloudinary.com' ||
    /\.(png|jpg|jpeg|svg|webp|ico)$/i.test(url.pathname);

  if (!isImage) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(event.request);
      const network = fetch(event.request)
        .then((resp) => {
          if (resp && resp.status === 200) cache.put(event.request, resp.clone());
          return resp;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
