/**
 * InputPro - Professional Input Component
 * 
 * Enterprise-grade input field with:
 * - Built-in validation
 * - Error states
 * - Helper text
 * - Icons (left/right)
 * - Different sizes
 * - Loading state
 * - Disabled state
 * - Clear button
 * - Character counter
 * 
 * @component
 */

import { forwardRef, InputHTMLAttributes } from 'react';
import { LucideIcon, X, AlertCircle } from 'lucide-react';

export interface InputProProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input label */
  label?: string;
  
  /** Helper text below input */
  helperText?: string;
  
  /** Error message (shows error state) */
  error?: string;
  
  /** Success state */
  success?: boolean;
  
  /** Left icon */
  leftIcon?: LucideIcon;
  
  /** Right icon */
  rightIcon?: LucideIcon;
  
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  
  /** Loading state */
  loading?: boolean;
  
  /** Show clear button when value exists */
  clearable?: boolean;
  
  /** On clear callback */
  onClear?: () => void;
  
  /** Show character counter */
  showCounter?: boolean;
  
  /** Maximum length for counter */
  maxLength?: number;
  
  /** Full width */
  fullWidth?: boolean;
}

/**
 * Professional Input Component
 */
export const InputPro = forwardRef<HTMLInputElement, InputProProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      size = 'md',
      loading = false,
      clearable = false,
      onClear,
      showCounter = false,
      maxLength,
      fullWidth = false,
      className = '',
      value,
      onChange,
      disabled,
      ...props
    },
    ref
  ) => {
    const hasError = Boolean(error);
    const hasValue = Boolean(value);

    const sizeStyles = {
      sm: {
        input: 'px-3 py-1.5 text-sm',
        icon: 'w-4 h-4',
        iconPadding: 'pl-9',
      },
      md: {
        input: 'px-4 py-2 text-base',
        icon: 'w-5 h-5',
        iconPadding: 'pl-11',
      },
      lg: {
        input: 'px-5 py-3 text-lg',
        icon: 'w-6 h-6',
        iconPadding: 'pl-13',
      },
    };

    const currentSize = sizeStyles[size];

    const inputBaseStyles = `
      w-full rounded-lg
      border transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-1
      disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50
      dark:disabled:bg-gray-800
    `;

    const inputStateStyles = hasError
      ? `
        border-red-300 dark:border-red-700
        focus:border-red-500 dark:focus:border-red-500
        focus:ring-red-500/20
        bg-red-50/50 dark:bg-red-900/10
      `
      : success
        ? `
          border-green-300 dark:border-green-700
          focus:border-green-500 dark:focus:border-green-500
          focus:ring-green-500/20
          bg-green-50/50 dark:bg-green-900/10
        `
        : `
          border-gray-300 dark:border-gray-600
          focus:border-primary-500 dark:focus:border-primary-400
          focus:ring-primary-500/20
          bg-white dark:bg-gray-800
        `;

    const textColor = disabled
      ? 'text-gray-400 dark:text-gray-500'
      : 'text-gray-900 dark:text-gray-100';

    const handleClear = () => {
      if (onClear) {
        onClear();
      } else if (onChange) {
        // Create a synthetic event
        const syntheticEvent = {
          target: { value: '' },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    const currentLength = value ? String(value).length : 0;

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {LeftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <LeftIcon className={`${currentSize.icon} text-gray-400 dark:text-gray-500`} />
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            value={value}
            onChange={onChange}
            disabled={disabled || loading}
            maxLength={maxLength}
            className={`
              ${inputBaseStyles}
              ${inputStateStyles}
              ${currentSize.input}
              ${textColor}
              ${LeftIcon ? currentSize.iconPadding : ''}
              ${clearable || RightIcon ? 'pr-10' : ''}
            `}
            {...props}
          />

          {/* Right Side Icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Loading Spinner */}
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary-600" />
            )}

            {/* Clear Button */}
            {clearable && hasValue && !loading && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
                aria-label="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Right Icon */}
            {RightIcon && !loading && !clearable && (
              <RightIcon className={`${currentSize.icon} text-gray-400 dark:text-gray-500`} />
            )}

            {/* Error Icon */}
            {hasError && !loading && (
              <AlertCircle className={`${currentSize.icon} text-red-500`} />
            )}
          </div>
        </div>

        {/* Helper Text / Error / Counter */}
        <div className="flex items-start justify-between mt-1.5 min-h-[20px]">
          <div className="flex-1">
            {error ? (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-start gap-1">
                {error}
              </p>
            ) : helperText ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">{helperText}</p>
            ) : null}
          </div>

          {/* Character Counter */}
          {showCounter && maxLength && (
            <span
              className={`text-xs ml-2 flex-shrink-0 ${
                currentLength > maxLength * 0.9
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

InputPro.displayName = 'InputPro';

export default InputPro;
