import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { AIResourceProvider } from '@/contexts/AIResourceContext';
import { PredictiveAnalyticsProvider } from '@/contexts/PredictiveAnalyticsContext';
import { RealtimeCollaborationProvider } from '@/contexts/RealtimeCollaborationContext';
import { MessageProvider } from '@/contexts/MessageContext';
import EnhancedErrorBoundary from '@/components/EnhancedErrorBoundary';
import App from './App';

function Root() {
  return (
    <React.StrictMode>
      <MessageProvider>
        <ToastProvider>
          <AuthProvider>
            <EnhancedErrorBoundary>
              <ProjectProvider>
                <AIResourceProvider>
                  <PredictiveAnalyticsProvider>
                    <RealtimeCollaborationProvider>
                      <BrowserRouter>
                        <App />
                      </BrowserRouter>
                    </RealtimeCollaborationProvider>
                  </PredictiveAnalyticsProvider>
                </AIResourceProvider>
              </ProjectProvider>
            </EnhancedErrorBoundary>
          </AuthProvider>
        </ToastProvider>
      </MessageProvider>
    </React.StrictMode>
  );
}

export default Root;
