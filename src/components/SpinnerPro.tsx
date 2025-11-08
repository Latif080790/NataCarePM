/**
 * SpinnerPro - Professional Loading Spinner Component
 * 
 * Clean, accessible loading indicators with multiple variants.
 * 
 * @component
 */

export interface SpinnerProProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'white';
  className?: string;
}

/**
 * Spinner Component
 */
export function SpinnerPro({
  size = 'md',
  variant = 'primary',
  className = '',
}: SpinnerProProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  };

  const variantClasses = {
    primary: 'border-gray-300 border-t-blue-600',
    secondary: 'border-gray-200 border-t-gray-600',
    white: 'border-white/30 border-t-white',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-full animate-spin
        ${className}
      `}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Loading Overlay - Full screen or container overlay
 */
export interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingOverlay({
  isLoading,
  message = 'Loading...',
  fullScreen = false,
  className = '',
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  const containerClass = fullScreen
    ? 'fixed inset-0 z-50'
    : 'absolute inset-0 z-10';

  return (
    <div
      className={`
        ${containerClass}
        bg-white/80 backdrop-blur-sm
        flex flex-col items-center justify-center
        ${className}
      `}
    >
      <SpinnerPro size="lg" />
      {message && (
        <p className="mt-4 text-sm font-medium text-gray-700">{message}</p>
      )}
    </div>
  );
}

/**
 * Loading Skeleton - For content placeholders
 */
export interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({
  width = 'w-full',
  height = 'h-4',
  className = '',
  variant = 'rectangular',
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  return (
    <div
      className={`
        ${width} ${height}
        ${variantClasses[variant]}
        bg-gray-200 animate-pulse
        ${className}
      `}
      role="status"
      aria-label="Loading content"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Loading State Component - Reusable loading UI
 */
export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingState({
  message = 'Loading...',
  size = 'md',
  className = '',
}: LoadingStateProps) {
  const containerSizes = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerSizes[size]} ${className}`}>
      <SpinnerPro size={size} />
      <p className="mt-4 text-sm text-gray-600">{message}</p>
    </div>
  );
}

/**
 * Example Usage:
 * 
 * // Basic spinner
 * <SpinnerPro />
 * 
 * // Different sizes
 * <SpinnerPro size="sm" />
 * <SpinnerPro size="lg" />
 * 
 * // Different variants
 * <SpinnerPro variant="secondary" />
 * <SpinnerPro variant="white" />
 * 
 * // Loading overlay
 * <div className="relative">
 *   <LoadingOverlay isLoading={isLoading} message="Saving..." />
 *   <YourContent />
 * </div>
 * 
 * // Full screen loading
 * <LoadingOverlay isLoading={isLoading} fullScreen message="Please wait..." />
 * 
 * // Skeleton loaders
 * <Skeleton width="w-full" height="h-4" />
 * <Skeleton width="w-24" height="h-24" variant="circular" />
 * 
 * // Loading state
 * <LoadingState message="Loading projects..." size="lg" />
 */
