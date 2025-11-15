import React from 'react';
import * as Sentry from '@sentry/react';

/**
 * SentryTestButton - Component for testing Sentry error tracking
 * 
 * This button triggers various types of errors to verify Sentry integration:
 * - Thrown errors (for error boundaries)
 * - Captured messages (for logging)
 * - Captured exceptions (for manual error reporting)
 * 
 * Only visible in development/testing environments
 */

interface SentryTestButtonProps {
  variant?: 'throw' | 'capture' | 'message';
  className?: string;
}

export const SentryTestButton: React.FC<SentryTestButtonProps> = ({ 
  variant = 'throw',
  className = ''
}) => {
  const handleThrowError = () => {
    throw new Error('🔴 Test Error: This is your first error from NataCarePM!');
  };

  const handleCaptureException = () => {
    try {
      throw new Error('🟠 Captured Exception: Manual error reporting test');
    } catch (error) {
      Sentry.captureException(error);
      alert('Exception captured and sent to Sentry! Check your dashboard.');
    }
  };

  const handleCaptureMessage = () => {
    Sentry.captureMessage('🟢 Test Message: Sentry integration working! - ' + new Date().toISOString(), 'info');
    alert('Message sent to Sentry! Check your dashboard.');
  };

  const getButtonContent = () => {
    switch (variant) {
      case 'capture':
        return {
          text: '🟠 Capture Exception',
          handler: handleCaptureException,
          title: 'Capture and send exception to Sentry'
        };
      case 'message':
        return {
          text: '🟢 Send Message',
          handler: handleCaptureMessage,
          title: 'Send info message to Sentry'
        };
      case 'throw':
      default:
        return {
          text: '🔴 Break the World',
          handler: handleThrowError,
          title: 'Throw error to test error boundary'
        };
    }
  };

  const { text, handler, title } = getButtonContent();

  // Only show in development or if explicitly enabled
  if (import.meta.env.PROD && !import.meta.env.VITE_ENABLE_DEBUG_LOGS) {
    return null;
  }

  return (
    <button
      onClick={handler}
      title={title}
      className={`
        px-4 py-2 rounded-lg font-medium transition-all duration-200
        bg-red-500 hover:bg-red-600 text-white
        shadow-md hover:shadow-lg
        border-2 border-red-600
        ${className}
      `}
    >
      {text}
    </button>
  );
};

/**
 * SentryTestPanel - Complete testing panel with all Sentry test options
 */
export const SentryTestPanel: React.FC = () => {
  // Only show in development or if explicitly enabled
  if (import.meta.env.PROD && !import.meta.env.VITE_ENABLE_DEBUG_LOGS) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-gray-300 dark:border-gray-700 p-4 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          🧪 Sentry Testing
        </h3>
        <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
          DEV ONLY
        </span>
      </div>
      
      <div className="space-y-2">
        <SentryTestButton variant="message" className="w-full" />
        <SentryTestButton variant="capture" className="w-full" />
        <SentryTestButton variant="throw" className="w-full" />
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Test Sentry error tracking integration
        </p>
      </div>
    </div>
  );
};

// Default export for easy import
export default SentryTestButton;

