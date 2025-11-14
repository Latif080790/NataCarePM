// ===================================
// PRODUCTION-READY INDEX FILE
// ===================================

import React from 'react';
// Explicitly import jsx-runtime to ensure it's loaded before any JSX
import 'react/jsx-runtime';
import { createRoot } from 'react-dom/client';
import Root from './Root';
import { initCSPMonitoring } from '@/utils/cspMonitoring';
import { initGA4 } from '@/utils/analytics';

// Initialize Security Features
initCSPMonitoring();

// Initialize Analytics
initGA4();

// Global error handler
window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error);
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
