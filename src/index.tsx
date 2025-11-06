import { createRoot } from 'react-dom/client';
import Root from './Root';
import { registerServiceWorker } from '@/utils/serviceWorkerRegistration';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Root />);
} else {
  console.error('Fatal Error: Root element not found in the DOM.');
}

// Register Service Worker for PWA functionality
// Note: Service worker is registered in all environments for testing
// You can add environment check if needed: if (import.meta.env.PROD) { ... }
registerServiceWorker()
  .then((registration) => {
    if (registration) {
      console.log('[PWA] Service Worker registered successfully');
    }
  })
  .catch((error) => {
    console.error('[PWA] Service Worker registration failed:', error);
  });
