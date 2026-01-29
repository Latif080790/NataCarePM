import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn'; // Assuming

export interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'secondary' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
    icon?: LucideIcon;
    dot?: boolean;
    outline?: boolean;
    className?: string;
    pulse?: boolean; // From BadgeStatus
}

export function Badge({
    children,
    variant = 'default',
    size = 'md',
    icon: Icon,
    dot = false,
    outline = false,
    pulse = false,
    className = '',
}: BadgeProps) {
    // Alias mapping
    let finalVariant = variant;
    if (variant === 'secondary') finalVariant = 'default';
    if (variant === 'destructive') finalVariant = 'error';

    const baseStyles = `
    inline-flex items-center justify-center
    font-medium rounded-full
    transition-all duration-200
  `;

    // Explicit mapping or cleaner object
    const variantStyles: Record<string, string> = outline
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

    const dotColors: Record<string, string> = {
        default: 'bg-gray-500',
        primary: 'bg-blue-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        error: 'bg-red-500',
        info: 'bg-cyan-500',
    };

    const iconSize = size === 'sm' ? 12 : size === 'lg' ? 18 : 14;
    const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-2.5 h-2.5' : 'w-2 h-2';

    const selectedVariantStyle = variantStyles[finalVariant] || variantStyles['default'];

    const combinedClassName = `
    ${baseStyles}
    ${selectedVariantStyle}
    ${sizeStyles[size]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

    return (
        <span className={combinedClassName}>
            {dot && (
                <span className={`${dotSize} rounded-full ${dotColors[finalVariant] || dotColors.default}`} />
            )}
            {pulse && (
                <span className={`relative flex h-2 w-2 mr-1`}>
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[finalVariant] || 'bg-green-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColors[finalVariant] || 'bg-green-500'}`}></span>
                </span>
            )}
            {Icon && <Icon size={iconSize} />}
            {children}
        </span>
    );
}
