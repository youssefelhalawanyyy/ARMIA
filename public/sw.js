// ARMIA Boutique Service Worker
// Cache Version: v7-live (Bypasses /_next/ & HMR chunks)

const CACHE_NAME = 'armia-boutique-v7-live';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Cache addAll warning:', err);
      });
    })
  );
});

// Activate & Clean Old Caches Immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        );
      }),
    ])
  );
});

// Fetch Strategy: Network-First for HTML/Navigation, bypass all Next.js internal router requests
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // NEVER intercept Next.js RSC requests, router transitions, chunks, APIs, or external services
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/admin') ||
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('googleapis') ||
    event.request.headers.get('RSC') ||
    event.request.headers.get('Next-Router-State-Tree') ||
    event.request.headers.get('Next-Router-Prefetch') ||
    event.request.headers.get('Next-Url')
  ) {
    return;
  }

  // Network-First for full page navigation
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const rootCached = await caches.match('/');
          if (rootCached) return rootCached;
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>ARMIA Boutique</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="background:#141414;color:#F6F3EE;font-family:sans-serif;text-align:center;padding:50px 20px;"><h2 style="color:#DCC9A6;">ARMIA BOUTIQUE</h2><p>Please check your connection and tap reload.</p><button onclick="window.location.reload()" style="background:#B67355;color:white;border:none;padding:10px 24px;margin-top:16px;cursor:pointer;">Reload</button></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // Only intercept known static assets (icons, images, fonts)
  const isStaticAsset =
    STATIC_ASSETS.includes(url.pathname) ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    /\.(png|jpg|jpeg|svg|webp|ico|woff2?|css)$/i.test(url.pathname);

  if (!isStaticAsset) {
    return; // Pass through dynamic requests to the browser
  }

  // Cache-First with Network fallback for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return new Response('', { status: 408, statusText: 'Request timed out' });
        });
    })
  );
});

// Push Notification Listener for Mobile Lock Screens (Runs when browser/app is closed)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'ARMIA BOUTIQUE', body: event.data.text() };
    }
  }

  const title = data.title || '✨ ARMIA Boutique';
  const tag = 'armia_' + (data.id || data.broadcastId || Date.now());
  const options = {
    body: data.body || 'New exclusive piece added to collection.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    image: data.imageUrl || undefined,
    tag: tag,
    renotify: true,
    data: {
      url: data.targetUrl || data.url || '/',
    },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle Push Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
