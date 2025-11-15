// 🚀 ENHANCED ENTERPRISE ERROR BOUNDARY - ACCESSIBILITY & I18N READY
// Sophisticated error recovery with WCAG 2.1 compliance and internationalization

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCcw, Home, Mail, Shield, Code, AlertCircle, Volume2 } from 'lucide-react';
import { Button } from './Button';
import { monitoringService } from '@/api/monitoringService';
import { i18n, useTranslation } from '@/i18n';
import { logger } from '@/utils/logger.enhanced';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Enhanced error logging for enterprise
    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: 'current_user_id', // Get from auth context
      language: i18n.getCurrentLanguage(),
    };

    // Log to console for development
    logger.error('🚨 ENTERPRISE ERROR BOUNDARY TRIGGERED', error, { errorReport });

    // 📊 Log error to monitoring service
    this.logToMonitoringService(error, errorInfo);

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendErrorReport(errorReport);
    }

    // Announce error to screen readers
    this.announceErrorToScreenReader(error.message);

    this.setState({
      error,
      errorInfo,
    });
  }

  private logToMonitoringService = async (error: Error, _errorInfo: ErrorInfo) => {
    try {
      await monitoringService.logError({
        message: error.message,
        stack: error.stack,
        severity: 'critical',
        component: 'ErrorBoundary',
        action: 'componentDidCatch',
      });
    } catch (e) {
      logger.error('Failed to log error to monitoring service', e instanceof Error ? e : new Error(String(e)));
    }
  };

  private sendErrorReport = async (errorReport: any) => {
    try {
      // Send to your error tracking service
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport),
      });
    } catch (e) {
      logger.error('Failed to send error report', e instanceof Error ? e : new Error(String(e)));
    }
  };

  private announceErrorToScreenReader = (message: string) => {
    // Create an aria-live region to announce errors to screen readers
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'assertive');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = `Error: ${message}`;
    document.body.appendChild(liveRegion);
    
    // Remove after announcement
    setTimeout(() => {
      if (liveRegion.parentNode) {
        liveRegion.parentNode.removeChild(liveRegion);
      }
    }, 1000);
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: '',
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleSpeakError = () => {
    if ('speechSynthesis' in window && this.state.error?.message) {
      const utterance = new SpeechSynthesisUtterance(this.state.error.message);
      utterance.lang = i18n.getCurrentLanguage() === 'id' ? 'id-ID' : 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback component if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Enterprise-level error page with accessibility features
      return (
        <div 
          className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-800 flex items-center justify-center p-8 relative overflow-hidden"
          role="main"
          aria-label={i18n.t('errors.serverError')}
        >
          {/* Animated background */}
          <div className="absolute top-20 left-20 w-96 h-96 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-20 right-20 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1s' }}
          ></div>

          <div className="relative z-10 max-w-2xl mx-auto text-center">
            {/* Error Icon */}
            <div className="mb-8">
              <div 
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg mx-auto mb-4 animate-pulse"
                role="img"
                aria-label={i18n.t('common.error')}
              >
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">{i18n.t('errors.serverError')}</h1>
              <p className="text-lg text-white/70">
                {i18n.t('errors.serverError')}
              </p>
            </div>

            {/* Error Details Card */}
            <div 
              className="glass-card p-8 rounded-3xl backdrop-blur-xl border border-white/20 mb-8 text-left"
              role="region"
              aria-labelledby="error-report-title"
            >
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-red-400" />
                <h2 id="error-report-title" className="text-xl font-semibold text-white">
                  {i18n.t('errors.errorReport')}
                </h2>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <label className="text-white/70 font-medium">{i18n.t('errors.errorId')}:</label>
                  <div 
                    className="mt-1 p-3 bg-white/10 rounded-lg font-mono text-white break-all"
                    aria-label={`${i18n.t('errors.errorId')}: ${this.state.errorId}`}
                  >
                    {this.state.errorId}
                  </div>
                </div>

                <div>
                  <label className="text-white/70 font-medium">{i18n.t('errors.errorMessage')}:</label>
                  <div 
                    className="mt-1 p-3 bg-white/10 rounded-lg text-white"
                    aria-label={`${i18n.t('errors.errorMessage')}: ${this.state.error?.message || i18n.t('errors.unknownError')}`}
                  >
                    {this.state.error?.message || i18n.t('errors.unknownError')}
                  </div>
                </div>

                <div>
                  <label className="text-white/70 font-medium">{i18n.t('errors.timestamp')}:</label>
                  <div 
                    className="mt-1 p-3 bg-white/10 rounded-lg text-white"
                    aria-label={`${i18n.t('errors.timestamp')}: ${new Date().toLocaleString()}`}
                  >
                    {new Date().toLocaleString()}
                  </div>
                </div>

                {/* Development-only stack trace */}
                {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                  <details className="mt-4">
                    <summary className="text-white/70 font-medium cursor-pointer hover:text-white focus:outline-none focus:ring-2 focus:ring-white rounded">
                      <Code className="w-4 h-4 inline mr-2" />
                      {i18n.t('errors.stackTrace')} (Development Mode)
                    </summary>
                    <div 
                      className="mt-2 p-3 bg-black/30 rounded-lg font-mono text-xs text-white overflow-auto max-h-40"
                      aria-label={i18n.t('errors.stackTrace')}
                    >
                      <pre>{this.state.error.stack}</pre>
                    </div>
                  </details>
                )}
              </div>
            </div>

            {/* Recovery Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Button
                onClick={this.handleRetry}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                aria-label={i18n.t('errors.tryAgain')}
              >
                <RefreshCcw className="w-5 h-5" />
                {i18n.t('errors.tryAgain')}
              </Button>

              <Button
                onClick={this.handleReload}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                aria-label={i18n.t('errors.reloadPage')}
              >
                <RefreshCcw className="w-5 h-5" />
                {i18n.t('errors.reloadPage')}
              </Button>

              <Button
                onClick={this.handleGoHome}
                className="w-full py-3 bg-gradient-to-r from-slate-500 to-slate-600 text-white font-semibold rounded-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                aria-label={i18n.t('errors.goHome')}
              >
                <Home className="w-5 h-5" />
                {i18n.t('errors.goHome')}
              </Button>

              <Button
                onClick={this.handleSpeakError}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                aria-label={i18n.t('errors.speakError')}
              >
                <Volume2 className="w-5 h-5" />
                {i18n.t('errors.speakError')}
              </Button>
            </div>

            {/* Support Information */}
            <div 
              className="glass p-6 rounded-2xl border border-white/10"
              role="region"
              aria-labelledby="support-info-title"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-blue-400" />
                <h3 id="support-info-title" className="text-lg font-semibold text-white">
                  {i18n.t('errors.needSupport')}
                </h3>
              </div>

              <p className="text-white/70 text-sm mb-4">
                {i18n.t('errors.supportDescription')}
              </p>

              <div className="flex items-center justify-center gap-6 text-sm">
                <a
                  href="mailto:support@natacara.dev"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1"
                  aria-label={`${i18n.t('errors.contactSupport')} support@natacara.dev`}
                >
                  <Mail className="w-4 h-4" />
                  support@natacara.dev
                </a>

                <div className="flex items-center gap-2 text-white/60">
                  <Shield className="w-4 h-4" />
                  {i18n.t('errors.enterpriseSupport')}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-white/50 text-xs">
              © 2025 NATA'CARA Enterprise Platform. All rights reserved.
              <br />
              <span className="text-red-400">{i18n.t('errors.advancedRecovery')}</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <EnhancedErrorBoundary fallback={fallback}>
        <Component {...props} />
      </EnhancedErrorBoundary>
    );
  };
}

// Hook for programmatic error throwing (for testing)
export function useThrowError() {
  return (error: string | Error) => {
    throw error instanceof Error ? error : new Error(error);
  };
}

// Enhanced hook with translation support
export function useEnhancedErrorBoundary() {
  const { t } = useTranslation();
  
  return {
    t,
    throwError: (error: string | Error) => {
      throw error instanceof Error ? error : new Error(error);
    }
  };
}

export default EnhancedErrorBoundary;
