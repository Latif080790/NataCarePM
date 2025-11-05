import { createRoot } from 'react-dom/client';
import Root from './Root';
import { registerServiceWorker } from '@/utils/pwa';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Root />);
} else {
  console.error('Fatal Error: Root element not found in the DOM.');
}

// Register Service Worker for PWA functionality
if (process.env.NODE_ENV === 'production') {
  registerServiceWorker({
    onSuccess: (_registration) => {
      console.log('[PWA] Service Worker registered successfully');
    },
    onUpdate: (registration) => {
      console.log('[PWA] New content available, please refresh.');
      // Notify user about update
      if (window.confirm('New version available! Click OK to update.')) {
        window.location.reload();
      }
    },
    onError: (error) => {
      console.error('[PWA] Service Worker registration failed:', error);
    },
  });
} else {
  console.log('[PWA] Service Worker registration skipped in development mode');
}
