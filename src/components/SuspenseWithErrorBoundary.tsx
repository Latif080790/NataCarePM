import * as React from 'react';
import { Component, ReactNode, Suspense } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface SuspenseErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class SuspenseErrorBoundary extends Component<SuspenseErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: SuspenseErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Defer all side effects to avoid React reconciliation conflicts
    setTimeout(() => {
      try {
        console.error('[SuspenseErrorBoundary] Caught error:', error, errorInfo);
        
        // Log to Sentry if available
        if (typeof window !== 'undefined' && window.Sentry) {
          window.Sentry.captureMessage(error.message, {
            contexts: {
              react: {
                componentStack: errorInfo.componentStack,
              },
            },
          });
        }

        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo);
      } catch (e) {
        console.error('Error in SuspenseErrorBoundary handler:', e);
      }
    }, 0);

    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 border border-red-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Component Load Failed</h3>
                <p className="text-sm text-gray-600">Unable to load this section</p>
              </div>
            </div>

            {this.state.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-xs font-mono text-red-700 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={this.handleRetry}
                className="w-full px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors font-medium"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
              >
                Reload Page
              </button>
            </div>

            {import.meta.env.DEV && this.state.errorInfo && (
              <details className="mt-4">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  View Details (Dev Only)
                </summary>
                <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-auto max-h-32 text-gray-700">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wraps Suspense with ErrorBoundary for safe lazy loading
 * 
 * @example
 * <SuspenseWithErrorBoundary fallback={<Spinner />}>
 *   <LazyComponent />
 * </SuspenseWithErrorBoundary>
 */
export function SuspenseWithErrorBoundary({ 
  children, 
  fallback = null,
  onError,
}: SuspenseErrorBoundaryProps) {
  return (
    <SuspenseErrorBoundary onError={onError}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </SuspenseErrorBoundary>
  );
}

export default SuspenseWithErrorBoundary;

