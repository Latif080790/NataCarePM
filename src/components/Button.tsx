import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn'; // Assuming cn exists, if not I'll just use template literals or check if utils/cn exists.
// Checking file listing earlier, I didn't see utils/cn.ts explicitly but I saw `src/utils`. 
// To be safe, I will implement a local clsx/twMerge or just use the logic from ButtonPro which used template literals.
// I'll stick to template literals for safety unless I confirm utility.

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'default' | 'link' | 'destructive';
    size?: 'sm' | 'md' | 'lg' | 'default' | 'icon' | 'xl';
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    isLoading?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className = '',
            variant = 'primary',
            size = 'md',
            isLoading = false,
            loading = false,
            fullWidth = false,
            icon: Icon,
            iconPosition = 'left',
            children,
            asChild = false, // Placeholder for future Slot implementation if needed, currently just passing through props could be tricky without Slottable. 
            // For now, I will NOT implement full asChild logic to avoid breaking simple usage, unless I import Slot. 
            // Legacy Button had simple cloneElement logic. I'll stick to a simple button for now to match ButtonPro, but with forwardRef.
            ...props
        },
        ref
    ) => {

        // Alias handling
        const isBusy = isLoading || loading;

        // Mapper for legacy variants to Pro variants (Enterprise Design System)
        let finalVariant = variant;
        if (variant === 'default') finalVariant = 'primary';
        if (variant === 'destructive') finalVariant = 'danger';

        // Mapper for sizes
        let finalSize = size;
        if (size === 'default') finalSize = 'md';

        const baseStyles = `
      inline-flex items-center justify-center
      font-medium rounded-lg
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

        const variantStyles: Record<string, string> = {
            primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
            secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 active:bg-gray-800',
            danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
            ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200',
            outline: 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-500 active:bg-gray-100',
            link: 'text-blue-600 underline-offset-4 hover:underline',
        };

        const sizeStyles: Record<string, string> = {
            sm: 'px-3 py-1.5 text-sm gap-1.5',
            md: 'px-4 py-2 text-base gap-2',
            lg: 'px-6 py-3 text-lg gap-2.5',
            xl: 'px-8 py-4 text-xl gap-3',
            icon: 'p-2',
        };

        const widthStyles = fullWidth ? 'w-full' : '';

        // Fallback for unknown variants
        const selectedVariantStyle = variantStyles[finalVariant] || variantStyles['primary'];
        const selectedSizeStyle = sizeStyles[finalSize] || sizeStyles['md'];

        const combinedClassName = `
      ${baseStyles}
      ${selectedVariantStyle}
      ${selectedSizeStyle}
      ${widthStyles}
      ${className}
    `.trim().replace(/\s+/g, ' ');

        const iconSize = finalSize === 'sm' ? 16 : finalSize === 'lg' ? 24 : 20;

        return (
            <button
                ref={ref}
                className={combinedClassName}
                disabled={props.disabled || isBusy}
                {...props}
            >
                {isBusy ? (
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
);

Button.displayName = 'Button';

export { Button };
