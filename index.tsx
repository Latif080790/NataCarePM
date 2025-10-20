
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { AIResourceProvider } from './contexts/AIResourceContext';
import { PredictiveAnalyticsProvider } from './contexts/PredictiveAnalyticsContext';
import EnterpriseErrorBoundary from './components/EnterpriseErrorBoundary';
import { registerServiceWorker } from './src/utils/pwa';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <EnterpriseErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <ProjectProvider>
              <AIResourceProvider>
                <PredictiveAnalyticsProvider>
                  <App />
                </PredictiveAnalyticsProvider>
              </AIResourceProvider>
            </ProjectProvider>
          </AuthProvider>
        </ToastProvider>
      </EnterpriseErrorBoundary>
    </React.StrictMode>
  );
} else {
  console.error('Fatal Error: Root element not found in the DOM.');
}

// Register Service Worker for PWA functionality
if (process.env.NODE_ENV === 'production') {
  registerServiceWorker({
    onSuccess: (registration) => {
      console.log('[PWA] Service Worker registered successfully:', registration.scope);
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
    }
  });
} else {
  console.log('[PWA] Service Worker registration skipped in development mode');
}
