/**
 * Service Worker for NataCarePM
 * Implements offline-first PWA capabilities with intelligent caching strategies
  */

const CACHE_VERSION = 'v1.1.1'; // Bumped for mobile fixes
const CACHE_NAME = `natacare-${CACHE_VERSION}`;

// Cache strategies
const CACHE_FIRST = 'cache-first'; // Static assets (JS, CSS, images)
const NETWORK_FIRST = 'network-first'; // API calls, dynamic content
const STALE_WHILE_REVALIDATE = 'stale-while-revalidate'; // For semi-static content

// Cache duration (in seconds)
const CACHE_DURATION = {
  static: 7 * 24 * 60 * 60, // 7 days
  dynamic: 1 * 24 * 60 * 60, // 1 day
  api: 5 * 60, // 5 minutes
};

// Assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Routes for different caching strategies
const CACHE_STRATEGIES = {
  // Cache-first for static assets
  static: [
    /\.(js|css|woff2?|ttf|eot|otf)$/,
    /\/icons\//,
    /\/images\//,
    /\/fonts\//,
  ],
  // Network-first for API calls
  api: [
    /\/api\//,
    /firestore\.googleapis\.com/,
    /firebasestorage\.googleapis\.com/,
  ],
  // Stale-while-revalidate for HTML pages
  pages: [
    /\.html$/,
    /\/$/,
  ],
};

/**
 * Install event - precache essential assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching app shell');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      console.log('[SW] Service worker installed successfully');
      return self.skipWaiting();
    })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim();
    })
  );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin && !url.origin.includes('firebase')) {
    return;
  }

  // Determine caching strategy
  const strategy = getCachingStrategy(request.url);

  event.respondWith(
    handleFetchWithStrategy(request, strategy)
  );
});

/**
 * Determine caching strategy for a URL
 */
function getCachingStrategy(url) {
  // Check static assets
  for (const pattern of CACHE_STRATEGIES.static) {
    if (pattern.test(url)) {
      return CACHE_FIRST;
    }
  }

  // Check API calls
  for (const pattern of CACHE_STRATEGIES.api) {
    if (pattern.test(url)) {
      return NETWORK_FIRST;
    }
  }

  // Check HTML pages
  for (const pattern of CACHE_STRATEGIES.pages) {
    if (pattern.test(url)) {
      return STALE_WHILE_REVALIDATE;
    }
  }

  // Default to network first
  return NETWORK_FIRST;
}

/**
 * Handle fetch with specific caching strategy
 */
async function handleFetchWithStrategy(request, strategy) {
  switch (strategy) {
    case CACHE_FIRST:
      return cacheFirst(request);
    case NETWORK_FIRST:
      return networkFirst(request);
    case STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request);
    default:
      return fetch(request);
  }
}

/**
 * Cache-first strategy
 * Try cache first, fallback to network
 */
async function cacheFirst(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Check if cached response is still fresh
      const cacheTime = cachedResponse.headers.get('sw-cache-time');
      if (cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        if (age < CACHE_DURATION.static * 1000) {
          return cachedResponse;
        }
      } else {
        // No cache time header, assume fresh
        return cachedResponse;
      }
    }

    // Fetch from network
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const clonedResponse = networkResponse.clone();
      const responseToCache = new Response(clonedResponse.body, clonedResponse);
      responseToCache.headers.append('sw-cache-time', Date.now().toString());
      cache.put(request, responseToCache);
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first error:', error);
    
    // Try cache as fallback
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page if available
    return getOfflinePage();
  }
}

/**
 * Network-first strategy
 * Try network first, fallback to cache
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      const clonedResponse = networkResponse.clone();
      const responseToCache = new Response(clonedResponse.body, clonedResponse);
      responseToCache.headers.append('sw-cache-time', Date.now().toString());
      cache.put(request, responseToCache);
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);

    // Fallback to cache
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'You are currently offline. Please check your connection.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Stale-while-revalidate strategy
 * Return cached response immediately, update cache in background
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Fetch from network in background
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const clonedResponse = networkResponse.clone();
      const responseToCache = new Response(clonedResponse.body, clonedResponse);
      responseToCache.headers.append('sw-cache-time', Date.now().toString());
      cache.put(request, responseToCache);
    }
    return networkResponse;
  }).catch(() => {
    // Network failed, cache will be used
    console.log('[SW] Network failed for:', request.url);
  });

  // Return cache immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // Wait for network if no cache
  return fetchPromise;
}

/**
 * Get offline page
 */
async function getOfflinePage() {
  const cache = await caches.open(CACHE_NAME);
  const offlinePage = await cache.match('/offline.html');

  if (offlinePage) {
    return offlinePage;
  }

  // Return basic offline response
  return new Response(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Offline - NataCarePM</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 20px;
          }
          .container {
            max-width: 500px;
          }
          h1 {
            font-size: 3em;
            margin: 0 0 20px 0;
          }
          p {
            font-size: 1.2em;
            margin: 0 0 30px 0;
            opacity: 0.9;
          }
          button {
            background: white;
            color: #667eea;
            border: none;
            padding: 15px 30px;
            font-size: 1em;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          }
          button:hover {
            transform: scale(1.05);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📡</h1>
          <h1>You're Offline</h1>
          <p>It looks like you've lost your internet connection. Check your network settings and try again.</p>
          <button onclick="window.location.reload()">Try Again</button>
        </div>
      </body>
    </html>
    `,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    }
  );
}

/**
 * Background sync event
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

/**
 * Sync data when back online
 */
async function syncData() {
  try {
    // Sync pending data with server
    console.log('[SW] Syncing data with server...');
    
    // This would integrate with your app's data sync logic
    // For now, just log
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_DATA',
        payload: { synced: true },
      });
    });

    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Sync error:', error);
    return Promise.reject(error);
  }
}

/**
 * Push notification event
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const timestamp = Date.now();
  const options = {
    body: data.body || 'New notification from NataCarePM',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      sentTimestamp: timestamp,
      notificationType: data.type || 'generic',
    },
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'NataCarePM',
      options
    )
  );
});

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);

  event.notification.close();

  const clickTimestamp = Date.now();
  const sentTimestamp = event.notification.data?.sentTimestamp || clickTimestamp;
  const notificationType = event.notification.data?.notificationType || 'generic';
  const timeToOpen = clickTimestamp - sentTimestamp;

  // Track notification click
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Send tracking data to any open client
      if (clientList.length > 0) {
        clientList[0].postMessage({
          type: 'NOTIFICATION_CLICKED',
          payload: {
            timestamp: clickTimestamp,
            notificationType,
            delivered: true,
            opened: true,
            timeToOpen,
          },
        });
      }
      
      // Open or focus window
      const urlToOpen = event.notification.data?.url || '/';
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

/**
 * Message event - handle messages from clients
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(urls))
    );
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        return caches.open(CACHE_NAME);
      })
    );
  }
});

console.log('[SW] Service worker loaded');
