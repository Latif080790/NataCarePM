import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { RealtimeCollaborationProvider } from '@/contexts/RealtimeCollaborationContext';
import { MessageProvider } from '@/contexts/MessageContext';
import EnhancedErrorBoundary from '@/components/EnhancedErrorBoundary';
import App from './App';
import { validateEnv } from '@/config/envValidation';
import { logger } from '@/utils/logger.enhanced';

// Validate environment variables on app startup
try {
  validateEnv();
  logger.info('[Root] Environment validation passed');
} catch (error) {
  logger.error('[Root] Environment validation failed', error instanceof Error ? error : new Error(String(error)));
  // In production, log but don't throw to prevent app crash
  if (!import.meta.env.PROD) {
    throw error;
  }
  // Continue loading in production mode
  logger.warn('[Root] Continuing despite validation errors in production');
}

logger.debug('[Root] Initializing Root component');

function Root() {
  logger.debug('[Root] Rendering Root component with all providers');
  
  return (
    <EnhancedErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <RealtimeCollaborationProvider>
              <MessageProvider>
                <App />
              </MessageProvider>
            </RealtimeCollaborationProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </EnhancedErrorBoundary>
  );
}

export default Root;
