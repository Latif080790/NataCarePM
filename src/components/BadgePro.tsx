/**
 * BadgePro - Professional Badge Component
 * 
 * Clean, accessible badge component for status indicators, labels, and counts.
 * Supports multiple variants and sizes.
 * 
 * @component
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface BadgeProProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  dot?: boolean;
  outline?: boolean;
  className?: string;
}

/**
 * Professional Badge Component
 */
export function BadgePro({
  children,
  variant = 'default',
  size = 'md',
  icon: Icon,
  dot = false,
  outline = false,
  className = '',
}: BadgeProProps) {
  const baseStyles = `
    inline-flex items-center justify-center
    font-medium rounded-full
    transition-all duration-200
  `;

  const variantStyles = outline
    ? {
        default: 'bg-transparent border border-gray-400 text-gray-700',
        primary: 'bg-transparent border border-blue-500 text-blue-700',
        success: 'bg-transparent border border-green-500 text-green-700',
        warning: 'bg-transparent border border-yellow-500 text-yellow-700',
        error: 'bg-transparent border border-red-500 text-red-700',
        info: 'bg-transparent border border-cyan-500 text-cyan-700',
      }
    : {
        default: 'bg-gray-100 text-gray-700',
        primary: 'bg-blue-100 text-blue-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-yellow-100 text-yellow-700',
        error: 'bg-red-100 text-red-700',
        info: 'bg-cyan-100 text-cyan-700',
      };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  };

  const dotColors = {
    default: 'bg-gray-500',
    primary: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-cyan-500',
  };

  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 18 : 14;
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-2.5 h-2.5' : 'w-2 h-2';

  const combinedClassName = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <span className={combinedClassName}>
      {dot && (
        <span className={`${dotSize} rounded-full ${dotColors[variant]}`} />
      )}
      {Icon && <Icon size={iconSize} />}
      {children}
    </span>
  );
}

/**
 * Badge with count (for notifications, etc)
 */
export function BadgeCount({
  count,
  max = 99,
  variant = 'error',
  className = '',
}: {
  count: number;
  max?: number;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}) {
  const displayCount = count > max ? `${max}+` : count.toString();
  
  if (count === 0) return null;

  return (
    <BadgePro variant={variant} size="sm" className={className}>
      {displayCount}
    </BadgePro>
  );
}

/**
 * Status Badge (with pulsing dot)
 */
export function BadgeStatus({
  children,
  variant = 'success',
  pulse = false,
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'default';
  pulse?: boolean;
  className?: string;
}) {
  const dotColors = {
    default: 'bg-gray-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative flex items-center justify-center">
        <span className={`w-2 h-2 rounded-full ${dotColors[variant]}`} />
        {pulse && (
          <span
            className={`absolute w-2 h-2 rounded-full ${dotColors[variant]} animate-ping opacity-75`}
          />
        )}
      </span>
      <span className="text-sm font-medium text-gray-700">{children}</span>
    </span>
  );
}

/**
 * Example Usage:
 * 
 * // Basic badge
 * <BadgePro>Default</BadgePro>
 * 
 * // Variant badges
 * <BadgePro variant="primary">Primary</BadgePro>
 * <BadgePro variant="success">Success</BadgePro>
 * <BadgePro variant="warning">Warning</BadgePro>
 * <BadgePro variant="error">Error</BadgePro>
 * 
 * // Badge with icon
 * <BadgePro variant="primary" icon={Star}>Featured</BadgePro>
 * 
 * // Badge with dot
 * <BadgePro variant="success" dot>Online</BadgePro>
 * 
 * // Outline badge
 * <BadgePro variant="primary" outline>Outlined</BadgePro>
 * 
 * // Count badge
 * <BadgeCount count={5} variant="error" />
 * <BadgeCount count={150} max={99} />
 * 
 * // Status badge
 * <BadgeStatus variant="success" pulse>Active</BadgeStatus>
 * <BadgeStatus variant="warning">Pending</BadgeStatus>
 */

