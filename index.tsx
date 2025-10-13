
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import EnterpriseErrorBoundary from './components/EnterpriseErrorBoundary';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <EnterpriseErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <ProjectProvider>
              <App />
            </ProjectProvider>
          </AuthProvider>
        </ToastProvider>
      </EnterpriseErrorBoundary>
    </React.StrictMode>
  );
} else {
    console.error("Fatal Error: Root element not found in the DOM.");
}
