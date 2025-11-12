import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { RealtimeCollaborationProvider } from '@/contexts/RealtimeCollaborationContext';
import { MessageProvider } from '@/contexts/MessageContext';
import EnhancedErrorBoundary from '@/components/EnhancedErrorBoundary';
import App from './App';

console.log('[Root] Initializing Root component...');

function Root() {
  console.log('[Root] Rendering Root component with all providers...');
  
  return (
    <React.StrictMode>
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
    </React.StrictMode>
  );
}

export default Root;