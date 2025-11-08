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

console.log('[Root] Initializing Root component...');

function Root() {
  console.log('[Root] Rendering Root component with all providers...');
  
  return (
    <ToastProvider>
      <AuthProvider>
        <EnhancedErrorBoundary>
          <ProjectProvider>
            <AIResourceProvider>
              <PredictiveAnalyticsProvider>
                <RealtimeCollaborationProvider>
                  <MessageProvider>
                    <BrowserRouter>
                      <App />
                    </BrowserRouter>
                  </MessageProvider>
                </RealtimeCollaborationProvider>
              </PredictiveAnalyticsProvider>
            </AIResourceProvider>
          </ProjectProvider>
        </EnhancedErrorBoundary>
      </AuthProvider>
    </ToastProvider>
  );
}

export default Root;