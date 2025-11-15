/**
 * AlertPro - Professional Alert Component
 * 
 * Clean, accessible alert messages with multiple variants.
 * Supports dismissible alerts and custom actions.
 * 
 * @component
 */

import React from 'react';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';

export interface AlertProProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

/**
 * Professional Alert Component
 */
export function AlertPro({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
}: AlertProProps) {
  const variantConfig = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: Info,
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      textColor: 'text-blue-800',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      textColor: 'text-green-800',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: AlertCircle,
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-900',
      textColor: 'text-yellow-800',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: XCircle,
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      textColor: 'text-red-800',
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={`
        ${config.bg} ${config.border}
        border rounded-lg p-4
        ${className}
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`text-sm font-semibold ${config.titleColor} mb-1`}>
              {title}
            </h4>
          )}
          <div className={`text-sm ${config.textColor}`}>
            {children}
          </div>
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className={`${config.iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
            aria-label="Close alert"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Empty State Component - For when there's no data
 */
export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {Icon && (
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Icon className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

/**
 * Error State Component - For error messages
 */
export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * Example Usage:
 * 
 * // Basic alerts
 * <AlertPro variant="info">
 *   This is an informational message.
 * </AlertPro>
 * 
 * <AlertPro variant="success" title="Success!">
 *   Your changes have been saved.
 * </AlertPro>
 * 
 * <AlertPro variant="warning" title="Warning">
 *   Please review before continuing.
 * </AlertPro>
 * 
 * <AlertPro variant="error" title="Error" onClose={() => console.log('closed')}>
 *   Something went wrong.
 * </AlertPro>
 * 
 * // Empty state
 * <EmptyState
 *   icon={Inbox}
 *   title="No messages"
 *   description="You don't have any messages yet."
 *   action={<ButtonPro variant="primary">Send Message</ButtonPro>}
 * />
 * 
 * // Error state
 * <ErrorState
 *   message="Failed to load data"
 *   onRetry={() => fetchData()}
 * />
 */

