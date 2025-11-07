/**
 * ButtonPro - Professional Button Component
 * 
 * Clean, accessible button component using design tokens.
 * Supports multiple variants and sizes.
 * 
 * @component
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface ButtonProProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  isLoading?: boolean;
  children?: React.ReactNode;
}

/**
 * Professional Button Component
 */
export function ButtonPro({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProProps) {
  const baseStyles = `
    inline-flex items-center justify-center
    font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantStyles = {
    primary: `
      bg-blue-600 text-white
      hover:bg-blue-700
      focus:ring-blue-500
      active:bg-blue-800
    `,
    secondary: `
      bg-gray-600 text-white
      hover:bg-gray-700
      focus:ring-gray-500
      active:bg-gray-800
    `,
    danger: `
      bg-red-600 text-white
      hover:bg-red-700
      focus:ring-red-500
      active:bg-red-800
    `,
    ghost: `
      bg-transparent text-gray-700
      hover:bg-gray-100
      focus:ring-gray-500
      active:bg-gray-200
    `,
    outline: `
      bg-transparent text-gray-700
      border border-gray-300
      hover:bg-gray-50 hover:border-gray-400
      focus:ring-gray-500
      active:bg-gray-100
    `,
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
  };

  const widthStyles = fullWidth ? 'w-full' : '';

  const combinedClassName = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${widthStyles}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;

  return (
    <button
      className={combinedClassName}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin"
            width={iconSize}
            height={iconSize}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
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
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={iconSize} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={iconSize} />}
        </>
      )}
    </button>
  );
}

/**
 * Button Group - for grouping buttons together
 */
export function ButtonProGroup({
  children,
  className = '',
  orientation = 'horizontal',
}: {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}) {
  const orientationStyles =
    orientation === 'horizontal'
      ? 'flex flex-row gap-2'
      : 'flex flex-col gap-2';

  return (
    <div className={`${orientationStyles} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Example Usage:
 * 
 * // Primary button
 * <ButtonPro variant="primary">
 *   Save Changes
 * </ButtonPro>
 * 
 * // Button with icon
 * <ButtonPro variant="primary" icon={Plus} iconPosition="left">
 *   Add New
 * </ButtonPro>
 * 
 * // Loading state
 * <ButtonPro variant="primary" isLoading={true}>
 *   Saving...
 * </ButtonPro>
 * 
 * // Danger button
 * <ButtonPro variant="danger" icon={Trash2}>
 *   Delete
 * </ButtonPro>
 * 
 * // Ghost button
 * <ButtonPro variant="ghost">
 *   Cancel
 * </ButtonPro>
 * 
 * // Full width button
 * <ButtonPro variant="primary" fullWidth>
 *   Submit
 * </ButtonPro>
 * 
 * // Button group
 * <ButtonProGroup>
 *   <ButtonPro variant="outline">Cancel</ButtonPro>
 *   <ButtonPro variant="primary">Save</ButtonPro>
 * </ButtonProGroup>
 */
