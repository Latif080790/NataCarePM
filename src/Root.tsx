import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthProvider } from '@/contexts/AuthContext.minimal'; // MINIMAL VERSION
import EnhancedErrorBoundary from '@/components/EnhancedErrorBoundary';
import App from './App';
import { logger } from '@/utils/logger.enhanced';

logger.debug('[Root] Initializing Root component - MINIMAL MODE');

function Root() {
  logger.debug('[Root] Rendering Root component - MINIMAL AUTH');
  
  return (
    <EnhancedErrorBoundary>
      <BrowserRouter>
        <EnhancedErrorBoundary>
          <ToastProvider>
            <EnhancedErrorBoundary>
              <AuthProvider>
                <App />
              </AuthProvider>
            </EnhancedErrorBoundary>
          </ToastProvider>
        </EnhancedErrorBoundary>
      </BrowserRouter>
    </EnhancedErrorBoundary>
  );
}

export default Root;
