/**
 * Service Worker for NataCarePM PWA
 * 
 * Features:
 * - Offline caching with Workbox strategies
 * - Background sync for offline operations
 * - Push notifications
 * - Install/Update lifecycle management
 * - Performance optimization with cache-first strategies
 * 
 * Version: 1.0.0
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `natacare-pm-${CACHE_VERSION}`;
const OFFLINE_PAGE = '/offline.html';

// Resources to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/styles/enterprise-design-system.css',
  '/styles/mobile-responsive.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Network timeout for fetch requests
const NETWORK_TIMEOUT = 5000;

// ============================================================================
// INSTALL EVENT - Cache static assets
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation complete, skipping waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// ============================================================================
// ACTIVATE EVENT - Clean old caches
// ============================================================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old caches that don't match current version
              return cacheName.startsWith('natacare-pm-') && cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete, claiming clients');
        return self.clients.claim();
      })
  );
});

// ============================================================================
// FETCH EVENT - Network with cache fallback strategy
// ============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Handle different request types with appropriate strategies
  
  // 1. API requests - Network first, cache fallback
  if (request.url.includes('/api/') || request.url.includes('firebaseio.com')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // 2. Navigation requests - Network first with timeout, then cache
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request));
    return;
  }
  
  // 3. Static assets (JS, CSS, images) - Cache first, network fallback
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }
  
  // 4. Everything else - Network first with timeout
  event.respondWith(networkFirstStrategy(request));
});

// ============================================================================
// CACHING STRATEGIES
// ============================================================================

/**
 * Cache First Strategy
 * Best for: Static assets (JS, CSS, images, fonts)
 */
async function cacheFirstStrategy(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Cache hit:', request.url);
      
      // Update cache in background (stale-while-revalidate)
      fetch(request).then((response) => {
        if (response && response.status === 200) {
          cache.put(request, response.clone());
        }
      }).catch(() => {
        // Network error, ignore
      });
      
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    console.log('[SW] Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Cache-first strategy failed:', error);
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Network First Strategy
 * Best for: API calls, dynamic content
 */
async function networkFirstStrategy(request) {
  try {
    // Try network with timeout
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);
    
    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    // Network failed, try cache
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving from cache (offline):', request.url);
      return cachedResponse;
    }
    
    // No cache available
    console.error('[SW] No cache available for:', request.url);
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'You are offline and this resource is not cached'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Navigation Strategy
 * Best for: Page navigation
 */
async function navigationStrategy(request) {
  try {
    // Try network with timeout
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);
    return networkResponse;
    
  } catch (error) {
    console.log('[SW] Navigation offline, serving offline page');
    
    // Serve offline page
    const cache = await caches.open(CACHE_NAME);
    const offlinePage = await cache.match(OFFLINE_PAGE);
    
    if (offlinePage) {
      return offlinePage;
    }
    
    // Fallback offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - NataCarePM</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
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
              margin: 0 0 20px;
            }
            p {
              font-size: 1.2em;
              line-height: 1.6;
              margin: 0 0 30px;
            }
            button {
              background: white;
              color: #667eea;
              border: none;
              padding: 15px 30px;
              font-size: 1em;
              border-radius: 8px;
              cursor: pointer;
              font-weight: bold;
            }
            button:hover {
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📡</h1>
            <h2>You're Offline</h2>
            <p>It looks like you've lost your internet connection. Some features may not be available until you're back online.</p>
            <button onclick="location.reload()">Try Again</button>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

/**
 * Fetch with timeout
 */
function fetchWithTimeout(request, timeout) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    )
  ]);
}

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {};
  
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('[SW] Error parsing push data:', error);
    data = { title: 'NataCarePM', body: 'You have a new notification' };
  }
  
  const title = data.title || 'NataCarePM';
  const options = {
    body: data.body || 'New notification',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-96x96.png',
    image: data.image,
    data: data.data || {},
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [
      { action: 'view', title: 'View', icon: '/icons/action-view.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/action-dismiss.png' }
    ],
    vibrate: data.vibrate || [200, 100, 200],
    silent: data.silent || false
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ============================================================================
// NOTIFICATION CLICK
// ============================================================================

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // No window open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ============================================================================
// BACKGROUND SYNC
// ============================================================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    // Get pending sync operations from IndexedDB
    // This is a placeholder - implement based on your app's needs
    console.log('[SW] Syncing pending operations...');
    
    // Example: Sync offline form submissions, updates, etc.
    const pendingOperations = await getPendingOperations();
    
    for (const operation of pendingOperations) {
      try {
        await fetch(operation.url, {
          method: operation.method,
          headers: operation.headers,
          body: operation.body
        });
        
        // Mark as synced
        await markOperationAsSynced(operation.id);
        
      } catch (error) {
        console.error('[SW] Failed to sync operation:', error);
      }
    }
    
    console.log('[SW] Sync complete');
    
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error; // Retry
  }
}

// Placeholder functions - implement based on your app's needs
async function getPendingOperations() {
  // Implement IndexedDB read
  return [];
}

async function markOperationAsSynced(id) {
  // Implement IndexedDB update
  console.log('[SW] Marked operation as synced:', id);
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLIENTS_CLAIM') {
    self.clients.claim();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(event.data.urls))
    );
  }
});

// ============================================================================
// PERIODIC BACKGROUND SYNC (Experimental)
// ============================================================================

self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync triggered:', event.tag);
  
  if (event.tag === 'update-data') {
    event.waitUntil(updateData());
  }
});

async function updateData() {
  try {
    // Fetch latest data in background
    console.log('[SW] Updating data in background...');
    
    // Example: Update dashboard data, notifications, etc.
    const response = await fetch('/api/updates');
    const data = await response.json();
    
    // Store in cache or IndexedDB
    const cache = await caches.open(CACHE_NAME);
    await cache.put('/api/updates', new Response(JSON.stringify(data)));
    
    console.log('[SW] Data updated successfully');
    
  } catch (error) {
    console.error('[SW] Failed to update data:', error);
  }
}

console.log('[SW] Service Worker loaded');
