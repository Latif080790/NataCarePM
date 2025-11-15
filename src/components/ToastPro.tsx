/**
 * ToastPro - Professional Toast Notification System
 * 
 * Enterprise-grade toast notification system with:
 * - Queue management
 * - Multiple variants (success, error, warning, info)
 * - Auto-dismiss with custom duration
 * - Action buttons
 * - Progress indicator
 * - Stack positioning
 * - Accessible (ARIA live regions)
 * 
 * @component
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

export interface Toast {
  id: string;
  title?: string;
  message: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  duration?: number; // milliseconds, 0 for persistent
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => string;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Toast Provider Component
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = {
      id,
      variant: 'info',
      duration: 5000, // default 5 seconds
      ...toast,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss if duration is set
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id);
      if (toast?.onClose) {
        toast.onClose();
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const hideAllToasts = useCallback(() => {
    toasts.forEach((toast) => {
      if (toast.onClose) {
        toast.onClose();
      }
    });
    setToasts([]);
  }, [toasts]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast, hideAllToasts }}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
}

/**
 * Hook to use toast notifications
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

/**
 * Toast Container Component
 */
function ToastContainer({
  toasts,
  onClose,
}: {
  toasts: Toast[];
  onClose: (id: string) => void;
}) {
  return (
    <div
      className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => onClose(toast.id)} />
      ))}
    </div>
  );
}

/**
 * Individual Toast Item Component
 */
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!toast.duration || toast.duration === 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration!) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.duration]);

  const variantConfig = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-600 dark:text-green-400',
      titleColor: 'text-green-900 dark:text-green-100',
      textColor: 'text-green-800 dark:text-green-200',
      progressColor: 'bg-green-600',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: XCircle,
      iconColor: 'text-red-600 dark:text-red-400',
      titleColor: 'text-red-900 dark:text-red-100',
      textColor: 'text-red-800 dark:text-red-200',
      progressColor: 'bg-red-600',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      titleColor: 'text-yellow-900 dark:text-yellow-100',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      progressColor: 'bg-yellow-600',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400',
      titleColor: 'text-blue-900 dark:text-blue-100',
      textColor: 'text-blue-800 dark:text-blue-200',
      progressColor: 'bg-blue-600',
    },
  };

  const config = variantConfig[toast.variant || 'info'];
  const Icon = config.icon;

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  return (
    <div
      className={`
        pointer-events-auto
        w-96 max-w-full
        ${config.bg} ${config.border}
        border rounded-lg shadow-lg
        transform transition-all duration-300 ease-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />

          {/* Content */}
          <div className="flex-1 min-w-0">
            {toast.title && (
              <h4 className={`font-semibold ${config.titleColor} mb-1`}>{toast.title}</h4>
            )}
            <p className={`text-sm ${config.textColor}`}>{toast.message}</p>

            {/* Action Button */}
            {toast.action && (
              <button
                onClick={() => {
                  toast.action!.onClick();
                  handleClose();
                }}
                className={`
                  mt-3 text-sm font-medium ${config.titleColor}
                  hover:underline focus:outline-none focus:underline
                `}
              >
                {toast.action.label}
              </button>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className={`
              flex-shrink-0 p-1 rounded-lg
              ${config.iconColor} hover:bg-black/5 dark:hover:bg-white/5
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current
            `}
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="h-1 bg-black/10 dark:bg-white/10 rounded-b-lg overflow-hidden">
          <div
            className={`h-full ${config.progressColor} transition-all ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Helper function to show toasts outside React components
 */
let globalShowToast: ((toast: Omit<Toast, 'id'>) => string) | null = null;

export function setGlobalToastHandler(handler: (toast: Omit<Toast, 'id'>) => string) {
  globalShowToast = handler;
}

export function toast(message: string, options?: Partial<Omit<Toast, 'id' | 'message'>>) {
  if (!globalShowToast) {
    console.warn('Toast handler not initialized. Wrap your app with ToastProvider.');
    return '';
  }
  return globalShowToast({ message, ...options });
}

toast.success = (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'variant'>>) => {
  return toast(message, { ...options, variant: 'success' });
};

toast.error = (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'variant'>>) => {
  return toast(message, { ...options, variant: 'error' });
};

toast.warning = (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'variant'>>) => {
  return toast(message, { ...options, variant: 'warning' });
};

toast.info = (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'variant'>>) => {
  return toast(message, { ...options, variant: 'info' });
};

export default ToastProvider;

