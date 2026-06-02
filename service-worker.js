const CACHE_NAME = 'team-lucao-v19';
const ASSETS = [
  './',
  './index.html?v=20260602-mais',
  './styles.css?v=20260602-mais',
  './app.js?v=20260602-mais',
  './manifest.webmanifest?v=20260602-mais',
  './assets/team-lucao-logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).pathname.startsWith('/api/')) return;
  event.respondWith(
    fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      return response;
    }).catch(() => caches.match(request))
  );
});
