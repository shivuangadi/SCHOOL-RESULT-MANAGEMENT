/**
 * ============================================================================
 * SRMS Progressive Web App Service Worker
 * Project: School Result Management System by Shri S. R. Angadi
 * Supports complete offline startup, shell precaching, and asset caching.
 * ============================================================================
 */

const CACHE_NAME = 'srms-app-cache-v2';
const CORE_PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.png',
];

// Install: Precaches the application shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        await cache.addAll(CORE_PRECACHE_URLS);
      } catch (err) {
        console.warn('[SRMS SW] Precache partial error:', err);
      }
    })
  );
});

// Activate: Clean up old cache versions and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: Strategy dispatch
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. NEVER intercept Firebase API/Auth/Firestore, HMR/Vite dev internals, or non-GET requests
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firebasestorage.app') ||
    url.hostname.includes('cloudfunctions.net') ||
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/@fs') ||
    request.method !== 'GET'
  ) {
    return;
  }

  // 2. Manifest & Navigation (HTML pages): Network-First with Cache Fallback
  if (request.mode === 'navigate' || url.pathname === '/manifest.json') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          if (request.mode === 'navigate') {
            const fallback = await caches.match('/');
            if (fallback) return fallback;
            return caches.match('/index.html');
          }
          return new Response('', { status: 404 });
        })
    );
    return;
  }

  // 3. Static Assets (Scripts, CSS, Fonts, Images): Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.hostname.includes('fonts.gstatic.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 4. Default: Network with Cache Fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});

// Background Sync Event (Supported by Chromium/Android)
self.addEventListener('sync', (event) => {
  if (event.tag === 'srms-sync-queue') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SRMS_TRIGGER_BACKGROUND_SYNC' });
        });
      })
    );
  }
});
