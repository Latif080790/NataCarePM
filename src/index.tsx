// ===================================
// PRODUCTION-READY INDEX FILE
// ===================================

// Critical: Import React first to ensure it's available globally
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import Root from './Root';
import { initCSPMonitoring } from '@/utils/cspMonitoring';
import { initGA4 } from '@/utils/analytics';
import { onCLS, onFID, onLCP, onTTFB, onINP } from 'web-vitals';

// Make React available globally for classic JSX
(window as any).React = React;

// Initialize Security Features
initCSPMonitoring();

// Initialize Analytics
initGA4();

// ===================================
// WEB VITALS MONITORING (CRITICAL)
// ===================================
function sendToAnalytics(metric: any) {
  const body = JSON.stringify(metric);
  
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log('[Web Vitals]', metric.name, metric.value, metric);
  }
  
  // Send to analytics in production
  if (import.meta.env.PROD && typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: metric.rating,
    });
  }
  
  // Send to performance API if available
  if (navigator.sendBeacon) {
    // You can send to your analytics endpoint
    // navigator.sendBeacon('/analytics', body);
  }
}

// Track Core Web Vitals
onCLS(sendToAnalytics);  // Cumulative Layout Shift
onFID(sendToAnalytics);  // First Input Delay
onLCP(sendToAnalytics);  // Largest Contentful Paint
onTTFB(sendToAnalytics); // Time to First Byte
onINP(sendToAnalytics);  // Interaction to Next Paint (new in 2024)

// ===================================
// GLOBAL ERROR HANDLERS
// ===================================

// Track error count for retry logic
let errorCount = 0;
const MAX_ERRORS = 3;

// Global error handler with retry mechanism
window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error);
  errorCount++;
  
  // Send to Sentry if available
  if ((window as any).Sentry) {
    (window as any).Sentry.captureException(event.error);
  }
  
  // If too many errors, show recovery UI
  if (errorCount > MAX_ERRORS) {
    const container = document.getElementById('root');
    if (container) {
      container.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #dc2626;">
          <h2>⚠️ Too Many Errors Detected</h2>
          <p style="font-size: 14px; color: #64748b;">The app encountered multiple errors. Please try:</p>
          <ul style="list-style: none; padding: 0; margin: 20px 0;">
            <li>✓ Clear browser cache</li>
            <li>✓ Refresh the page</li>
            <li>✓ Use incognito mode</li>
          </ul>
          <button onclick="location.reload()" style="background: #0ea5e9; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 10px;">
            Reload Now
          </button>
          <button onclick="localStorage.clear(); sessionStorage.clear(); location.reload()" style="background: #dc2626; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 10px;">
            Clear Cache & Reload
          </button>
        </div>
      `;
    }
  }
});

// Promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', event.reason);
  
  if ((window as any).Sentry) {
    (window as any).Sentry.captureException(event.reason);
  }
});

console.log('[App] Starting NataCarePM...');
console.log('[App] Environment:', import.meta.env.MODE);

const container = document.getElementById('root');
if (container) {
  try {
    console.log('[App] Creating React root...');
    const root = createRoot(container);
    console.log('[App] Rendering Root component...');
    root.render(<Root />);
    console.log('[App] ✅ Successfully mounted');
  } catch (error) {
    console.error('[App] ❌ Fatal Error:', error);
    container.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #dc2626;">
        <h2>Failed to Start App</h2>
        <p style="font-size: 14px; color: #64748b;">${error instanceof Error ? error.message : 'Unknown error'}</p>
        <button onclick="location.reload()" style="background: #0ea5e9; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin-top: 10px;">
          Reload App
        </button>
      </div>
    `;
  }
} else {
  console.error('[App] ❌ Root element not found');
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; color: #dc2626;">
      <h2>Fatal Error</h2>
      <p>Root element not found. Please contact support.</p>
    </div>
  `;
}

// Clear service workers and caches
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
  
  caches.keys().then((names) => {
    names.forEach((name) => caches.delete(name));
  });
}
