const CACHE_NAME = 'rpm-generator-v2';
const STATIC_CACHE = 'rpm-static-v2';
const API_CACHE = 'rpm-api-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

const API_CACHE_URLS = [
  '/api/generate',
  '/api/pdf',
  '/api/revise'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('rpm-') && name !== STATIC_CACHE;
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests - network first, cache fallback
  if (API_CACHE_URLS.some((path) => url.pathname.startsWith(path))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - cache first
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Navigation - network first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Default - network only
  event.respondWith(fetch(request).catch(() => {
    return new Response('Offline', { status: 503 });
  }));
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-rpm-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    const cache = await caches.open('rpm-pending');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (e) {
        console.warn('Failed to sync:', request.url);
      }
    }
  } catch (e) {
    console.error('Sync error:', e);
  }
}
