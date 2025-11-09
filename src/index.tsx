// ===================================
// POLYFILLS FOR MOBILE BROWSER COMPATIBILITY
// ===================================
// Import BEFORE any other code to ensure polyfills load first
import 'core-js/stable';
import 'regenerator-runtime/runtime';

import { createRoot } from 'react-dom/client';
import Root from './Root';
import { registerServiceWorker } from '@/utils/serviceWorkerRegistration';
import { initAppCheck, enableAppCheckDebugMode } from '@/appCheckConfig';
import { initCSPMonitoring } from '@/utils/cspMonitoring';

// Initialize Security Features
if (import.meta.env.DEV) {
  enableAppCheckDebugMode();
}
initAppCheck();
initCSPMonitoring();

// Global error handler for mobile debugging
window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error);
  // Show error in UI if root render fails
  const rootEl = document.getElementById('root');
  if (rootEl && rootEl.innerHTML.includes('Loading application')) {
    rootEl.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #dc2626;">
        <h2>Error Loading App</h2>
        <p style="font-size: 14px; color: #64748b; margin: 10px 0;">${event.error?.message || 'Unknown error'}</p>
        <button onclick="location.reload()" style="background: #0ea5e9; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin-top: 10px;">
          Reload App
        </button>
      </div>
    `;
  }
});

console.log('[App] Starting NataCarePM...');
console.log('[App] Environment:', import.meta.env.MODE);

const container = document.getElementById('root');
if (container) {
  try {
    console.log('[App] Root element found, creating React root...');
    const root = createRoot(container);
    console.log('[App] Rendering Root component...');
    root.render(<Root />);
    console.log('[App] ✅ Successfully mounted to #root');
  } catch (error) {
    console.error('[App] ❌ Fatal Error during render:', error);
    if (error instanceof Error) {
      console.error('[App] Error stack:', error.stack);
    }
    container.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #dc2626;">
        <h2>Failed to Start App</h2>
        <p style="font-size: 14px; color: #64748b; margin: 10px 0;">${error instanceof Error ? error.message : 'Unknown error'}</p>
        <details style="margin: 10px 0; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto;">
          <summary style="cursor: pointer;">Technical Details</summary>
          <pre style="background: #f3f4f6; padding: 10px; border-radius: 5px; overflow: auto; font-size: 12px;">${error instanceof Error ? error.stack : 'No stack trace'}</pre>
        </details>
        <button onclick="location.reload()" style="background: #0ea5e9; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin-top: 10px;">
          Reload App
        </button>
      </div>
    `;
  }
} else {
  console.error('[App] ❌ Fatal Error: Root element not found in the DOM.');
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; color: #dc2626;">
      <h2>Fatal Error</h2>
      <p>Root element not found. Please contact support.</p>
    </div>
  `;
}

// TEMPORARILY DISABLE SERVICE WORKER - CAUSES AGGRESSIVE CACHING ISSUES
// Service worker prevents new code from loading due to cache-first strategy
console.warn('[SW] Service Worker DISABLED for debugging cache issues');

// Unregister ALL existing service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
      console.log('[SW] ✅ Unregistered:', registration.scope);
    });
  });
  
  // Clear ALL caches
  caches.keys().then((names) => {
    names.forEach((name) => {
      caches.delete(name);
      console.log('[Cache] ✅ Deleted:', name);
    });
  });
}

// DISABLED: registerServiceWorker()
/*
registerServiceWorker()
  .then((registration) => {
    if (registration) {
      console.log('[PWA] Service Worker registered successfully');
    }
  })
  .catch((error) => {
    console.error('[PWA] Service Worker registration failed:', error);
  });
*/
