import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface SafeViewWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class SafeViewWrapper extends React.Component<SafeViewWrapperProps, ErrorBoundaryState> {
  constructor(props: SafeViewWrapperProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SafeViewWrapper caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 p-6 flex items-center justify-center">
          <Card className="p-8 bg-white/80 backdrop-blur-sm border border-red-200 shadow-xl max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-red-800 mb-2">View Error</h2>
              <p className="text-red-600 mb-6">
                Something went wrong while rendering this view. Please try refreshing or contact
                support.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    this.setState({ hasError: false });
                    this.props.onRetry?.();
                  }}
                  className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg"
                >
                  Reload Page
                </Button>
              </div>
              {this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="text-sm text-gray-600 cursor-pointer">
                    Technical Details
                  </summary>
                  <pre className="mt-2 text-xs text-gray-800 bg-gray-100 p-3 rounded overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SafeViewWrapper;
