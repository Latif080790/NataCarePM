/**
 * IconButtonPro - Accessible Icon Button Component
 * 
 * WCAG 2.1 AA compliant icon button with:
 * - Required aria-label for screen readers
 * - Focus management
 * - Keyboard navigation
 * - Tooltip support
 * 
 * @component
 */

import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

export interface IconButtonProProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** The icon component from lucide-react */
  icon: LucideIcon;
  /** Required: Accessible label for screen readers */
  'aria-label': string;
  /** Optional: Visual tooltip on hover */
  tooltip?: string;
  /** Button variant */
  variant?: 'default' | 'ghost' | 'danger' | 'primary';
  /** Button size */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Loading state */
  isLoading?: boolean;
  /** Active/pressed state */
  isActive?: boolean;
}

const sizeMap = {
  xs: { button: 'w-6 h-6', icon: 12 },
  sm: { button: 'w-8 h-8', icon: 16 },
  md: { button: 'w-10 h-10', icon: 20 },
  lg: { button: 'w-12 h-12', icon: 24 },
};

const variantStyles = {
  default: `
    text-gray-600 hover:text-gray-900
    hover:bg-gray-100 active:bg-gray-200
    focus:ring-gray-500
  `,
  ghost: `
    text-gray-500 hover:text-gray-700
    hover:bg-gray-50 active:bg-gray-100
    focus:ring-gray-400
  `,
  danger: `
    text-red-600 hover:text-red-700
    hover:bg-red-50 active:bg-red-100
    focus:ring-red-500
  `,
  primary: `
    text-blue-600 hover:text-blue-700
    hover:bg-blue-50 active:bg-blue-100
    focus:ring-blue-500
  `,
};

/**
 * Accessible Icon Button
 * 
 * @example
 * <IconButtonPro
 *   icon={X}
 *   aria-label="Close dialog"
 *   onClick={handleClose}
 * />
 * 
 * @example
 * <IconButtonPro
 *   icon={Trash2}
 *   aria-label="Delete item"
 *   variant="danger"
 *   tooltip="Delete this item"
 * />
 */
export const IconButtonPro = forwardRef<HTMLButtonElement, IconButtonProProps>(
  (
    {
      icon: Icon,
      'aria-label': ariaLabel,
      tooltip,
      variant = 'default',
      size = 'md',
      isLoading = false,
      isActive = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const { button: buttonSize, icon: iconSize } = sizeMap[size];

    const baseStyles = `
      inline-flex items-center justify-center
      rounded-lg
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const activeStyles = isActive ? 'bg-gray-100 ring-2 ring-blue-500 ring-offset-1' : '';

    const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${buttonSize}
      ${activeStyles}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <button
        ref={ref}
        type="button"
        className={combinedClassName}
        disabled={disabled || isLoading}
        aria-label={ariaLabel}
        aria-pressed={isActive}
        aria-busy={isLoading}
        title={tooltip || ariaLabel}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin"
            width={iconSize}
            height={iconSize}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <Icon size={iconSize} aria-hidden="true" />
        )}
      </button>
    );
  }
);

IconButtonPro.displayName = 'IconButtonPro';

export default IconButtonPro;
