import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthProvider } from '@/contexts/AuthContext.minimal'; // MINIMAL VERSION
import EnhancedErrorBoundary from '@/components/EnhancedErrorBoundary';
import { A11yAnnouncerProvider } from '@/components/A11yAnnouncer'; // Phase 1.4: Accessibility
import { getQueryClient } from '@/config/queryClient'; // Phase 5: React Query
import App from './App';
import { logger } from '@/utils/logger.enhanced';

logger.debug('[Root] Initializing Root component - MINIMAL MODE');

// Get or create QueryClient singleton
const queryClient = getQueryClient();

function Root() {
  logger.debug('[Root] Rendering Root component - MINIMAL AUTH');
  
  return (
    <EnhancedErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <EnhancedErrorBoundary>
            <A11yAnnouncerProvider>
              <ToastProvider>
                <EnhancedErrorBoundary>
                  <AuthProvider>
                    <App />
                  </AuthProvider>
                </EnhancedErrorBoundary>
              </ToastProvider>
            </A11yAnnouncerProvider>
          </EnhancedErrorBoundary>
        </BrowserRouter>
        {/* React Query Devtools - only in development */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </EnhancedErrorBoundary>
  );
}

export default Root;
