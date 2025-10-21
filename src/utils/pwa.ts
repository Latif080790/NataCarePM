/**
 * PWA Utilities
 *
 * Features:
 * - Service Worker registration
 * - Update detection
 * - Push notification subscription
 * - Offline detection
 * - Install analytics
 * - Cache management
 */

// ============================================================================
// SERVICE WORKER REGISTRATION
// ============================================================================

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

/**
 * Register Service Worker
 */
export async function registerServiceWorker(
  config?: ServiceWorkerConfig
): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[PWA] Service Worker registered:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[PWA] New content available, please refresh');
          config?.onUpdate?.(registration);
        }
      });
    });

    // Handle successful registration
    if (registration.active) {
      config?.onSuccess?.(registration);
    }

    return registration;
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
    config?.onError?.(error as Error);
    return null;
  }
}

/**
 * Unregister Service Worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const success = await registration.unregister();
    console.log('[PWA] Service Worker unregistered:', success);
    return success;
  } catch (error) {
    console.error('[PWA] Service Worker unregistration failed:', error);
    return false;
  }
}

/**
 * Update Service Worker
 */
export async function updateServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    console.log('[PWA] Service Worker update checked');
  } catch (error) {
    console.error('[PWA] Service Worker update failed:', error);
  }
}

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[PWA] Notifications not supported');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[PWA] Notification permission:', permission);
    return permission;
  } catch (error) {
    console.error('[PWA] Notification permission request failed:', error);
    return 'denied';
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[PWA] Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('[PWA] Already subscribed to push notifications');
      return subscription;
    }

    // Request permission
    const permission = await requestNotificationPermission();

    if (permission !== 'granted') {
      console.log('[PWA] Notification permission denied');
      return null;
    }

    // Subscribe
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log('[PWA] Subscribed to push notifications');
    return subscription;
  } catch (error) {
    console.error('[PWA] Push subscription failed:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return false;
    }

    const success = await subscription.unsubscribe();
    console.log('[PWA] Unsubscribed from push notifications:', success);
    return success;
  } catch (error) {
    console.error('[PWA] Push unsubscription failed:', error);
    return false;
  }
}

/**
 * Get current push subscription
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('[PWA] Failed to get push subscription:', error);
    return null;
  }
}

// ============================================================================
// INSTALL DETECTION
// ============================================================================

/**
 * Check if app is installed (running as PWA)
 */
export function isAppInstalled(): boolean {
  // Check if running in standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // Check if running as iOS standalone
  if ((window.navigator as any).standalone === true) {
    return true;
  }

  return false;
}

/**
 * Get install prompt readiness
 */
export function canInstallApp(): boolean {
  // This will be set by beforeinstallprompt event
  return !!window.deferredPrompt;
}

// ============================================================================
// OFFLINE DETECTION
// ============================================================================

/**
 * Check if app is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function onConnectionChange(onOnline: () => void, onOffline: () => void): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log('[PWA] All caches cleared');
  } catch (error) {
    console.error('[PWA] Failed to clear caches:', error);
  }
}

/**
 * Get cache size
 */
export async function getCacheSize(): Promise<number> {
  if (!('caches' in window)) {
    return 0;
  }

  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const requests = await cache.keys();

      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }

    return totalSize;
  } catch (error) {
    console.error('[PWA] Failed to calculate cache size:', error);
    return 0;
  }
}

/**
 * Pre-cache URLs
 */
export async function precacheUrls(urls: string[]): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    if (registration.active) {
      registration.active.postMessage({
        type: 'CACHE_URLS',
        urls,
      });
    }
  } catch (error) {
    console.error('[PWA] Failed to precache URLs:', error);
  }
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Track PWA installation
 */
export function trackInstall(): void {
  if ((window as any).gtag) {
    (window as any).gtag('event', 'pwa_installed', {
      event_category: 'PWA',
      event_label: 'App Installed',
      value: 1,
    });
  }

  // Also track in local storage for internal metrics
  const installs = JSON.parse(localStorage.getItem('pwa_installs') || '[]');
  installs.push({
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    standalone: isAppInstalled(),
  });
  localStorage.setItem('pwa_installs', JSON.stringify(installs));
}

/**
 * Track offline usage
 */
export function trackOfflineUsage(action: string, details?: any): void {
  const offlineActions = JSON.parse(localStorage.getItem('pwa_offline_actions') || '[]');
  offlineActions.push({
    timestamp: Date.now(),
    action,
    details,
    online: navigator.onLine,
  });

  // Keep last 100 actions
  if (offlineActions.length > 100) {
    offlineActions.shift();
  }

  localStorage.setItem('pwa_offline_actions', JSON.stringify(offlineActions));

  // Also track with analytics if online
  if (navigator.onLine && (window as any).gtag) {
    (window as any).gtag('event', 'pwa_offline_usage', {
      event_category: 'PWA',
      event_label: action,
      value: 1,
    });
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// ============================================================================
// GLOBAL TYPES
// ============================================================================

declare global {
  interface Window {
    deferredPrompt: any;
  }
}
