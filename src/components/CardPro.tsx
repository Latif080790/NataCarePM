/**
 * CardPro - Professional Card Component
 * 
 * Clean, enterprise-grade card component without glassmorphism effects.
 * Uses design tokens for consistency.
 * 
 * @component
 */

import React from 'react';
import { designTokens } from '@/styles/design-tokens';

export interface CardProProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outlined' | 'elevated' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  hoverable?: boolean;
}

export interface CardProHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardProContentProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardProFooterProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Main Card Component
 */
export function CardPro({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  onClick,
  hoverable = false,
}: CardProProps) {
  const baseStyles = 'rounded-lg transition-all duration-200';
  
  const variantStyles = {
    default: 'bg-white border border-gray-200',
    outlined: 'bg-transparent border-2 border-gray-300',
    elevated: 'bg-white shadow-md',
    flat: 'bg-gray-50',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverStyles = hoverable || onClick
    ? 'hover:shadow-lg hover:border-gray-300 cursor-pointer'
    : '';

  const combinedClassName = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${paddingStyles[padding]}
    ${hoverStyles}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={combinedClassName} onClick={onClick}>
      {children}
    </div>
  );
}

/**
 * Card Header
 */
export function CardProHeader({ children, className = '' }: CardProHeaderProps) {
  return (
    <div className={`border-b border-gray-200 pb-4 mb-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Card Content
 */
export function CardProContent({ children, className = '' }: CardProContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

/**
 * Card Footer
 */
export function CardProFooter({ children, className = '' }: CardProFooterProps) {
  return (
    <div className={`border-t border-gray-200 pt-4 mt-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Card Title (for use in header)
 */
export function CardProTitle({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <h3 
      className={`text-lg font-semibold text-gray-900 ${className}`}
      style={{
        fontSize: designTokens.typography.heading3.size,
        fontWeight: designTokens.typography.heading3.weight,
      }}
    >
      {children}
    </h3>
  );
}

/**
 * Card Description (for use in header or content)
 */
export function CardProDescription({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <p 
      className={`text-gray-600 ${className}`}
      style={{
        fontSize: designTokens.typography.body.size,
        fontWeight: designTokens.typography.body.weight,
      }}
    >
      {children}
    </p>
  );
}

/**
 * Example Usage:
 * 
 * // Basic card
 * <CardPro>
 *   <CardProTitle>Card Title</CardProTitle>
 *   <CardProDescription>Card description</CardProDescription>
 * </CardPro>
 * 
 * // Card with header, content, and footer
 * <CardPro variant="elevated">
 *   <CardProHeader>
 *     <CardProTitle>Dashboard</CardProTitle>
 *     <CardProDescription>Overview of your project</CardProDescription>
 *   </CardProHeader>
 *   <CardProContent>
 *     <p>Main content goes here</p>
 *   </CardProContent>
 *   <CardProFooter>
 *     <ButtonPro>Action</ButtonPro>
 *   </CardProFooter>
 * </CardPro>
 * 
 * // Clickable card
 * <CardPro hoverable onClick={() => navigate('/details')}>
 *   <h3>Click me</h3>
 * </CardPro>
 */

