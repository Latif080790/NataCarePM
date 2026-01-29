import React, { forwardRef, InputHTMLAttributes } from 'react';
import { LucideIcon, X, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn'; // Assuming

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    helperText?: string;
    error?: string;
    success?: boolean;
    leftIcon?: LucideIcon;
    rightIcon?: LucideIcon;
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    clearable?: boolean;
    onClear?: () => void;
    showCounter?: boolean;
    maxLength?: number;
    fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
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

        const currentSize = sizeStyles[size] || sizeStyles.md;

        const inputBaseStyles = `
      w-full rounded-lg
      border transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-1
      disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50
    `;

        const inputStateStyles = hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50/50'
            : success
                ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-green-50/50'
                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500/20 bg-white';

        const textColor = disabled ? 'text-gray-400' : 'text-gray-900';

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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}

                {/* Input Container */}
                <div className="relative">
                    {/* Left Icon */}
                    {LeftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <LeftIcon className={`${currentSize.icon} text-gray-400`} />
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
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600" />
                        )}

                        {/* Clear Button */}
                        {clearable && hasValue && !loading && !disabled && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                aria-label="Clear input"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}

                        {/* Right Icon */}
                        {RightIcon && !loading && !clearable && (
                            <RightIcon className={`${currentSize.icon} text-gray-400`} />
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
                            <p className="text-sm text-red-600 flex items-start gap-1">
                                {error}
                            </p>
                        ) : helperText ? (
                            <p className="text-sm text-gray-600">{helperText}</p>
                        ) : null}
                    </div>

                    {/* Character Counter */}
                    {showCounter && maxLength && (
                        <span
                            className={`text-xs ml-2 flex-shrink-0 ${currentLength > maxLength * 0.9
                                    ? 'text-red-600'
                                    : 'text-gray-500'
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

Input.displayName = 'Input';
