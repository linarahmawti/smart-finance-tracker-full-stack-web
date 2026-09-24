// Smart Finance - Service Worker (Safe & Production-Ready)
const CACHE_NAME = 'aloka-finance-v1';

// Static assets safe for pre-caching
const PRECACHE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/images/logoo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.ico',
  '/favicon.png',
];

// Helper: Check if request is safe for caching
function isCacheable(request) {
  const url = new URL(request.url);

  // 1. Only cache GET requests
  if (request.method !== 'GET') {
    return false;
  }

  // 2. NEVER cache Supabase API, Auth, Database, or Storage requests
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('/auth/v1') ||
    url.pathname.includes('/rest/v1') ||
    url.pathname.includes('/storage/v1') ||
    url.searchParams.has('apikey')
  ) {
    return false;
  }

  // 3. NEVER cache browser extension requests or non-http(s)
  if (!url.protocol.startsWith('http')) {
    return false;
  }

  return true;
}

// Install Event - Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[SW] Pre-cache partial fail (safe to ignore):', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event - Safe strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Skip non-cacheable requests (Supabase, Auth, Mutations) -> Directly Network
  if (!isCacheable(request)) {
    return;
  }

  const url = new URL(request.url);

  // Strategy 1: Static Assets (Images, Icons, Fonts, Next Static CSS/JS) -> Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.ico');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Strategy 2: HTML Page Navigations -> Network-First (Ensures fresh Supabase data and state)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // If offline, return cached page or fallback
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          return caches.match('/');
        })
    );
  }
});
