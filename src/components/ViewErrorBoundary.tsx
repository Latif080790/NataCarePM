/**
 * ViewErrorBoundary Component
 * Granular error boundary for individual views with monitoring integration
 * 
 * Features:
 * - Automatic error reporting to monitoring service
 * - User-friendly error messages
 * - Retry functionality
 * - Error recovery options
 * - Development vs Production modes
 * - Error logging with context
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { logger } from '@/utils/logger.enhanced';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  viewName?: string;
  showReportButton?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

/**
 * Enhanced Error Boundary for Views
 * Provides granular error catching and recovery for individual views
 */
export class ViewErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, viewName } = this.props;

    // Increment error count
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Log error with context
    logger.error(`View error in ${viewName || 'Unknown View'}`, error, {
      errorInfo,
      componentStack: errorInfo.componentStack,
      errorCount: this.state.errorCount + 1,
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Report to monitoring service if available
    if (typeof window !== 'undefined' && (window as any).monitoringService) {
      try {
        (window as any).monitoringService.captureException(error, {
          tags: {
            boundary: 'view',
            viewName: viewName || 'unknown',
          },
          extra: {
            errorInfo,
            componentStack: errorInfo.componentStack,
          },
        });
      } catch (reportError) {
        console.error('Failed to report error to monitoring service:', reportError);
      }
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/dashboard';
  };

  handleReportIssue = (): void => {
    const { error, errorInfo } = this.state;
    const { viewName } = this.props;

    const issueBody = encodeURIComponent(
      `**View:** ${viewName || 'Unknown'}\n\n` +
      `**Error:** ${error?.message}\n\n` +
      `**Stack:**\n\`\`\`\n${error?.stack}\n\`\`\`\n\n` +
      `**Component Stack:**\n\`\`\`\n${errorInfo?.componentStack}\n\`\`\``
    );

    window.open(
      `https://github.com/your-repo/issues/new?title=Error in ${viewName}&body=${issueBody}`,
      '_blank'
    );
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const { children, fallback, viewName, showReportButton = true } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6 bg-gradient-to-br from-red-50 to-orange-50">
          <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4">
              <div className="flex items-center space-x-3 text-white">
                <AlertTriangle size={28} />
                <div>
                  <h2 className="text-xl font-bold">Something Went Wrong</h2>
                  <p className="text-sm text-red-100 mt-1">
                    {viewName ? `Error in ${viewName}` : 'An unexpected error occurred'}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Error Message */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Error Message:</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 font-medium">{error.message}</p>
                </div>
              </div>

              {/* Error Count Warning */}
              {errorCount > 1 && (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ This error has occurred {errorCount} times. Consider refreshing the page.
                  </p>
                </div>
              )}

              {/* Development Info */}
              {isDevelopment && (
                <details className="mb-6">
                  <summary className="text-sm font-semibold text-gray-700 cursor-pointer hover:text-gray-900 mb-2">
                    Technical Details (Development Only)
                  </summary>
                  <div className="space-y-4">
                    {/* Stack Trace */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-600 mb-2">Stack Trace:</h4>
                      <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                          {error.stack}
                        </pre>
                      </div>
                    </div>

                    {/* Component Stack */}
                    {errorInfo?.componentStack && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-600 mb-2">Component Stack:</h4>
                        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                          <pre className="text-xs font-mono whitespace-pre-wrap">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* User Instructions */}
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">What can you do?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Try again - The issue might be temporary</li>
                  <li>• Go to homepage and navigate back</li>
                  <li>• Refresh the page if the error persists</li>
                  <li>• Contact support if the problem continues</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <RefreshCw size={18} />
                  <span>Try Again</span>
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
                >
                  <Home size={18} />
                  <span>Go to Dashboard</span>
                </button>

                {errorCount > 2 && (
                  <button
                    onClick={this.handleReload}
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
                  >
                    <RefreshCw size={18} />
                    <span>Reload Page</span>
                  </button>
                )}

                {showReportButton && isDevelopment && (
                  <button
                    onClick={this.handleReportIssue}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                  >
                    <Bug size={18} />
                    <span>Report Issue</span>
                  </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                Error ID: {Date.now().toString(36)}
                {viewName && ` • View: ${viewName}`}
                {isDevelopment && ' • Development Mode'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Hook for using error boundary with monitoring
 */
export const useErrorHandler = (viewName?: string) => {
  return (error: Error, errorInfo: ErrorInfo) => {
    logger.error(`Error in ${viewName || 'Unknown View'}`, error, { errorInfo });
    
    // Report to monitoring service
    if (typeof window !== 'undefined' && (window as any).monitoringService) {
      try {
        (window as any).monitoringService.captureException(error, {
          tags: { viewName: viewName || 'unknown' },
          extra: { errorInfo },
        });
      } catch (reportError) {
        console.error('Failed to report error:', reportError);
      }
    }
  };
};

/**
 * Simple error fallback component
 */
export const SimpleErrorFallback = ({ error, viewName }: { error?: Error; viewName?: string }) => (
  <div className="flex items-center justify-center min-h-[300px] p-6">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="text-red-600" size={32} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {viewName ? `Error in ${viewName}` : 'Something went wrong'}
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        {error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Refresh Page
      </button>
    </div>
  </div>
);

