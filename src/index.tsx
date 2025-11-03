import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { AIResourceProvider } from '@/contexts/AIResourceContext';
import { PredictiveAnalyticsProvider } from '@/contexts/PredictiveAnalyticsContext';
import { RealtimeCollaborationProvider } from '@/contexts/RealtimeCollaborationContext';
import EnhancedErrorBoundary from '@/components/EnhancedErrorBoundary';
import { registerServiceWorker } from '@/utils/pwa';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <EnhancedErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <ProjectProvider>
              <AIResourceProvider>
                <PredictiveAnalyticsProvider>
                  {/* Urutan sangat penting:
                      Pastikan provider yang dibutuhkan (misalnya Auth/Project)
                      sudah di atas RealtimeCollaborationProvider jika ia memerlukannya.
                      Saya berasumsi RealtimeCollaboration bisa memerlukan Auth/Project data.
                  */}
                  <RealtimeCollaborationProvider>
                    <BrowserRouter>
                      <App />
                    </BrowserRouter>
                  </RealtimeCollaborationProvider>
                </PredictiveAnalyticsProvider>
              </AIResourceProvider>
            </ProjectProvider>
          </AuthProvider>
        </ToastProvider>
      </EnhancedErrorBoundary>
    </React.StrictMode>
  );
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