/**
 * Form Components - Professional Input Components
 * 
 * Clean, accessible form components using design tokens.
 * Includes: Input, Select, Textarea, Label, FormGroup
 * 
 * @component
 */

import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

// ============================================================================
// Input Component
// ============================================================================

export interface InputProProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

export const InputPro = forwardRef<HTMLInputElement, InputProProps>(
  ({ error, icon: Icon, iconPosition = 'left', className = '', ...props }, ref) => {
    const baseStyles = `
      w-full px-4 py-2 
      bg-white border rounded-lg
      text-gray-900 placeholder-gray-400
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      disabled:bg-gray-100 disabled:cursor-not-allowed
    `;

    const errorStyles = error
      ? 'border-red-500 focus:ring-red-500'
      : 'border-gray-300 hover:border-gray-400';

    const iconPaddingStyles = Icon
      ? iconPosition === 'left'
        ? 'pl-11'
        : 'pr-11'
      : '';

    const combinedClassName = `
      ${baseStyles}
      ${errorStyles}
      ${iconPaddingStyles}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <div className="relative">
        {Icon && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${
              iconPosition === 'left' ? 'left-3' : 'right-3'
            }`}
          >
            <Icon size={20} />
          </div>
        )}
        <input ref={ref} className={combinedClassName} {...props} />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

InputPro.displayName = 'InputPro';

// ============================================================================
// Select Component
// ============================================================================

export interface SelectProProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const SelectPro = forwardRef<HTMLSelectElement, SelectProProps>(
  ({ error, options, className = '', children, ...props }, ref) => {
    const baseStyles = `
      w-full px-4 py-2
      bg-white border rounded-lg
      text-gray-900
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      disabled:bg-gray-100 disabled:cursor-not-allowed
      appearance-none
      cursor-pointer
    `;

    const errorStyles = error
      ? 'border-red-500 focus:ring-red-500'
      : 'border-gray-300 hover:border-gray-400';

    const combinedClassName = `
      ${baseStyles}
      ${errorStyles}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <div className="relative">
        <select ref={ref} className={combinedClassName} {...props}>
          {children ||
            options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
        </select>
        {/* Dropdown arrow icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

SelectPro.displayName = 'SelectPro';

// ============================================================================
// Textarea Component
// ============================================================================

export interface TextareaProProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const TextareaPro = forwardRef<HTMLTextAreaElement, TextareaProProps>(
  ({ error, resize = 'vertical', className = '', ...props }, ref) => {
    const baseStyles = `
      w-full px-4 py-2
      bg-white border rounded-lg
      text-gray-900 placeholder-gray-400
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      disabled:bg-gray-100 disabled:cursor-not-allowed
    `;

    const errorStyles = error
      ? 'border-red-500 focus:ring-red-500'
      : 'border-gray-300 hover:border-gray-400';

    const resizeStyles = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    }[resize];

    const combinedClassName = `
      ${baseStyles}
      ${errorStyles}
      ${resizeStyles}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <div>
        <textarea ref={ref} className={combinedClassName} {...props} />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

TextareaPro.displayName = 'TextareaPro';

// ============================================================================
// Label Component
// ============================================================================

export interface LabelProProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function LabelPro({ required, children, className = '', ...props }: LabelProProps) {
  return (
    <label
      className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

// ============================================================================
// Form Group Component
// ============================================================================

export interface FormGroupProProps {
  label?: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormGroupPro({
  label,
  error,
  required,
  helpText,
  children,
  className = '',
}: FormGroupProProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <LabelPro required={required}>
          {label}
        </LabelPro>
      )}
      {children}
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
}

// ============================================================================
// Checkbox Component
// ============================================================================

export interface CheckboxProProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const CheckboxPro = forwardRef<HTMLInputElement, CheckboxProProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <label className="flex items-center cursor-pointer group">
        <input
          ref={ref}
          type="checkbox"
          className={`
            w-5 h-5 text-blue-600 
            border-gray-300 rounded
            focus:ring-2 focus:ring-blue-500
            transition-all duration-200
            cursor-pointer
            ${className}
          `}
          {...props}
        />
        {label && (
          <span className="ml-2 text-gray-700 group-hover:text-gray-900">
            {label}
          </span>
        )}
      </label>
    );
  }
);

CheckboxPro.displayName = 'CheckboxPro';

// ============================================================================
// Radio Component
// ============================================================================

export interface RadioProProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const RadioPro = forwardRef<HTMLInputElement, RadioProProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <label className="flex items-center cursor-pointer group">
        <input
          ref={ref}
          type="radio"
          className={`
            w-5 h-5 text-blue-600
            border-gray-300
            focus:ring-2 focus:ring-blue-500
            transition-all duration-200
            cursor-pointer
            ${className}
          `}
          {...props}
        />
        {label && (
          <span className="ml-2 text-gray-700 group-hover:text-gray-900">
            {label}
          </span>
        )}
      </label>
    );
  }
);

RadioPro.displayName = 'RadioPro';

/**
 * Example Usage:
 * 
 * // Input with label and error
 * <FormGroupPro label="Email" required error="Invalid email">
 *   <InputPro 
 *     type="email" 
 *     placeholder="Enter your email"
 *     icon={Mail}
 *   />
 * </FormGroupPro>
 * 
 * // Select dropdown
 * <FormGroupPro label="Status">
 *   <SelectPro
 *     options={[
 *       { value: 'pending', label: 'Pending' },
 *       { value: 'completed', label: 'Completed' },
 *     ]}
 *   />
 * </FormGroupPro>
 * 
 * // Textarea
 * <FormGroupPro label="Description" helpText="Max 500 characters">
 *   <TextareaPro 
 *     rows={4}
 *     placeholder="Enter description"
 *   />
 * </FormGroupPro>
 * 
 * // Checkbox
 * <CheckboxPro label="I agree to the terms and conditions" />
 * 
 * // Radio group
 * <FormGroupPro label="Priority">
 *   <div className="space-y-2">
 *     <RadioPro name="priority" value="low" label="Low" />
 *     <RadioPro name="priority" value="medium" label="Medium" />
 *     <RadioPro name="priority" value="high" label="High" />
 *   </div>
 * </FormGroupPro>
 */
