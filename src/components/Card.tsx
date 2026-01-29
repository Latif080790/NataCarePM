import React from 'react';
import { cn } from '@/utils/cn'; // Assuming we will fix utils later if missing, or I'll implement inline for now. 
// Actually I'll use template literals to be safe as I did in Button.

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'outlined' | 'elevated' | 'flat';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hoverable?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', variant = 'elevated', padding = 'md', hoverable = false, ...props }, ref) => {

        const baseStyles = 'rounded-lg transition-all duration-200 text-slate-800';

        const variantStyles: Record<string, string> = {
            default: 'bg-white border border-gray-200',
            outlined: 'bg-transparent border-2 border-gray-300',
            elevated: 'bg-white shadow-md',
            flat: 'bg-gray-50',
        };

        const paddingStyles: Record<string, string> = {
            none: 'p-0',
            sm: 'p-3',
            md: 'p-6',
            lg: 'p-8',
        };

        const hoverStyles = (hoverable || props.onClick)
            ? 'hover:shadow-lg hover:border-gray-300 cursor-pointer'
            : '';

        const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant] || variantStyles.default}
      ${paddingStyles[padding] || paddingStyles.md}
      ${hoverStyles}
      ${className}
    `.trim().replace(/\s+/g, ' ');

        return <div ref={ref} className={combinedClassName} {...props} />;
    }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className = '', ...props }, ref) => (
        <div
            ref={ref}
            className={`flex flex-col space-y-1.5 mb-4 ${className}`}
            {...props}
        />
    )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className = '', ...props }, ref) => (
        <h3
            ref={ref}
            className={`text-lg font-semibold text-gray-900 leading-none tracking-tight ${className}`}
            {...props}
        />
    )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className = '', ...props }, ref) => (
        <p
            ref={ref}
            className={`text-sm text-gray-500 ${className}`}
            {...props}
        />
    )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className = '', ...props }, ref) => (
        <div ref={ref} className={`${className}`} {...props} />
    )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className = '', ...props }, ref) => (
        <div
            ref={ref}
            className={`flex items-center pt-4 mt-4 border-t border-gray-100 ${className}`}
            {...props}
        />
    )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
