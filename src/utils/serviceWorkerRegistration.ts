/**
 * Service Worker Registration Utility
 * Handles service worker lifecycle and updates
 */

/**
 * Register service worker
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service workers are not supported');
    return null;
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });

    console.log('[SW] Service worker registered successfully:', registration.scope);

    // Check for updates on page load
    registration.update();

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (!newWorker) return;

      console.log('[SW] New service worker installing...');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available
          console.log('[SW] New content available, please refresh');
          notifyUserOfUpdate(registration);
        }

        if (newWorker.state === 'activated') {
          console.log('[SW] New service worker activated');
        }
      });
    });

    // Listen for controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Controller changed, reloading page...');
      window.location.reload();
    });

    return registration;
  } catch (error) {
    console.error('[SW] Service worker registration failed:', error);
    return null;
  }
};

/**
 * Unregister service worker
 */
export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (registration) {
      const success = await registration.unregister();
      console.log('[SW] Service worker unregistered:', success);
      return success;
    }

    return false;
  } catch (error) {
    console.error('[SW] Service worker unregister failed:', error);
    return false;
  }
};

/**
 * Check for service worker updates manually
 */
export const checkForUpdates = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (registration) {
      console.log('[SW] Checking for updates...');
      await registration.update();
    }
  } catch (error) {
    console.error('[SW] Check for updates failed:', error);
  }
};

/**
 * Skip waiting and activate new service worker
 */
export const skipWaitingAndActivate = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (registration && registration.waiting) {
      // Send skip waiting message
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      console.log('[SW] Sent SKIP_WAITING message to service worker');
    }
  } catch (error) {
    console.error('[SW] Skip waiting failed:', error);
  }
};

/**
 * Notify user of available update
 */
const notifyUserOfUpdate = (registration: ServiceWorkerRegistration): void => {
  // Create update notification
  const updateMessage = document.createElement('div');
  updateMessage.className = 'fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm';
  updateMessage.innerHTML = `
    <div class="flex items-start space-x-3">
      <div class="flex-shrink-0">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
      </div>
      <div class="flex-1">
        <p class="font-semibold mb-1">Update Tersedia</p>
        <p class="text-sm opacity-90 mb-3">Versi baru dari aplikasi tersedia.</p>
        <div class="flex space-x-2">
          <button
            id="sw-update-btn"
            class="px-4 py-2 bg-white text-blue-600 rounded font-medium text-sm hover:bg-blue-50 transition-colors"
          >
            Update Sekarang
          </button>
          <button
            id="sw-dismiss-btn"
            class="px-4 py-2 bg-blue-700 text-white rounded font-medium text-sm hover:bg-blue-800 transition-colors"
          >
            Nanti
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(updateMessage);

  // Handle update button click
  const updateBtn = document.getElementById('sw-update-btn');
  if (updateBtn) {
    updateBtn.addEventListener('click', () => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      document.body.removeChild(updateMessage);
    });
  }

  // Handle dismiss button click
  const dismissBtn = document.getElementById('sw-dismiss-btn');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      document.body.removeChild(updateMessage);
    });
  }

  // Auto-dismiss after 30 seconds
  setTimeout(() => {
    if (document.body.contains(updateMessage)) {
      document.body.removeChild(updateMessage);
    }
  }, 30000);
};

/**
 * Get service worker state
 */
export const getServiceWorkerState = async (): Promise<{
  supported: boolean;
  registered: boolean;
  active: boolean;
  waiting: boolean;
}> => {
  const supported = 'serviceWorker' in navigator;

  if (!supported) {
    return {
      supported: false,
      registered: false,
      active: false,
      waiting: false,
    };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();

    return {
      supported: true,
      registered: !!registration,
      active: !!registration?.active,
      waiting: !!registration?.waiting,
    };
  } catch (error) {
    return {
      supported: true,
      registered: false,
      active: false,
      waiting: false,
    };
  }
};

/**
 * Send message to service worker
 */
export const sendMessageToSW = async (message: any): Promise<void> => {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    console.warn('[SW] No service worker controller available');
    return;
  }

  try {
    navigator.serviceWorker.controller.postMessage(message);
    console.log('[SW] Message sent to service worker:', message);
  } catch (error) {
    console.error('[SW] Failed to send message to service worker:', error);
  }
};

/**
 * Clear service worker cache
 */
export const clearServiceWorkerCache = async (): Promise<void> => {
  await sendMessageToSW({ type: 'CLEAR_CACHE' });
  console.log('[SW] Cache clear requested');
};

/**
 * Precache specific URLs
 */
export const precacheUrls = async (urls: string[]): Promise<void> => {
  await sendMessageToSW({ type: 'CACHE_URLS', urls });
  console.log('[SW] Precache requested for URLs:', urls);
};

/**
 * Request background sync
 */
export const requestBackgroundSync = async (tag: string = 'sync-data'): Promise<void> => {
  if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
    console.warn('[SW] Background sync is not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // @ts-ignore - sync might not be in types yet
    await registration.sync.register(tag);
    console.log('[SW] Background sync registered:', tag);
  } catch (error) {
    console.error('[SW] Background sync registration failed:', error);
  }
};

/**
 * Request persistent storage permission
 */
export const requestPersistentStorage = async (): Promise<boolean> => {
  if (!('storage' in navigator) || !('persist' in navigator.storage)) {
    console.warn('[SW] Persistent storage is not supported');
    return false;
  }

  try {
    const isPersisted = await navigator.storage.persist();
    console.log('[SW] Persistent storage granted:', isPersisted);
    return isPersisted;
  } catch (error) {
    console.error('[SW] Persistent storage request failed:', error);
    return false;
  }
};

/**
 * Check if storage is persisted
 */
export const isStoragePersisted = async (): Promise<boolean> => {
  if (!('storage' in navigator) || !('persisted' in navigator.storage)) {
    return false;
  }

  try {
    return await navigator.storage.persisted();
  } catch (error) {
    return false;
  }
};

/**
 * Get storage quota
 */
export const getStorageQuota = async (): Promise<{
  usage: number;
  quota: number;
  percentUsed: number;
} | null> => {
  if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

    return {
      usage,
      quota,
      percentUsed,
    };
  } catch (error) {
    console.error('[SW] Get storage quota failed:', error);
    return null;
  }
};

export default {
  registerServiceWorker,
  unregisterServiceWorker,
  checkForUpdates,
  skipWaitingAndActivate,
  getServiceWorkerState,
  sendMessageToSW,
  clearServiceWorkerCache,
  precacheUrls,
  requestBackgroundSync,
  requestPersistentStorage,
  isStoragePersisted,
  getStorageQuota,
};
