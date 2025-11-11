/**
 * Typography Components
 * Consistent text styling using NataCarePM Design System
 * 
 * @module Typography
 * @author NataCarePM Team
 * @date 2025-11-12
 * 
 * Design Tokens:
 * - Primary: night-black (#2f3035)
 * - Secondary: palladium (#b1b1b1)
 * - Accent: persimmon (#f87941)
 */

import React, { HTMLAttributes } from 'react';

interface TypographyProps extends HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * H1 - Page Title
 * Usage: Main page headings
 * 
 * @example
 * ```tsx
 * <H1>Dashboard Overview</H1>
 * <H1 className="mb-4">Custom Styling</H1>
 * ```
 */
export const H1: React.FC<TypographyProps> = ({ children, className = '', ...props }) => (
  <h1 
    className={`text-3xl font-bold text-night-black leading-tight ${className}`}
    {...props}
  >
    {children}
  </h1>
);

/**
 * H2 - Section Title
 * Usage: Major section headings
 * 
 * @example
 * ```tsx
 * <H2>Key Metrics</H2>
 * <H2 className="mb-4">Budget Overview</H2>
 * ```
 */
export const H2: React.FC<TypographyProps> = ({ children, className = '', ...props }) => (
  <h2 
    className={`text-2xl font-bold text-night-black leading-tight ${className}`}
    {...props}
  >
    {children}
  </h2>
);

/**
 * H3 - Subsection Title
 * Usage: Subsection headings, card titles
 * 
 * @example
 * ```tsx
 * <H3>Purchase Orders</H3>
 * <H3 className="mb-2">Recent Activity</H3>
 * ```
 */
export const H3: React.FC<TypographyProps> = ({ children, className = '', ...props }) => (
  <h3 
    className={`text-xl font-semibold text-night-black leading-snug ${className}`}
    {...props}
  >
    {children}
  </h3>
);

/**
 * H4 - Minor Heading
 * Usage: Card subtitles, form sections
 * 
 * @example
 * ```tsx
 * <H4>Project Details</H4>
 * ```
 */
export const H4: React.FC<TypographyProps> = ({ children, className = '', ...props }) => (
  <h4 
    className={`text-lg font-semibold text-night-black ${className}`}
    {...props}
  >
    {children}
  </h4>
);

/**
 * BodyText - Primary Text
 * Usage: Main content, descriptions
 * 
 * @example
 * ```tsx
 * <BodyText>This is the main content of the page.</BodyText>
 * <BodyText className="mb-4">Custom spacing</BodyText>
 * ```
 */
export const BodyText: React.FC<TypographyProps> = ({ children, className = '', ...props }) => (
  <p 
    className={`text-base text-night-black leading-relaxed ${className}`}
    {...props}
  >
    {children}
  </p>
);

/**
 * SecondaryText - Muted Text
 * Usage: Labels, metadata, less important info
 * 
 * @example
 * ```tsx
 * <SecondaryText>Last updated: 2 hours ago</SecondaryText>
 * <SecondaryText>Created by: John Doe</SecondaryText>
 * ```
 */
export const SecondaryText: React.FC<TypographyProps> = ({ children, className = '', ...props }) => (
  <p 
    className={`text-sm text-palladium ${className}`}
    {...props}
  >
    {children}
  </p>
);

/**
 * Label - Form Labels
 * Usage: Input labels, field names
 * 
 * @example
 * ```tsx
 * <Label htmlFor="email">Email Address</Label>
 * ```
 */
export const Label: React.FC<TypographyProps & { htmlFor?: string }> = ({ 
  children, 
  className = '', 
  htmlFor,
  ...props 
}) => (
  <label 
    htmlFor={htmlFor}
    className={`block text-sm font-medium text-night-black mb-1 ${className}`}
    {...props}
  >
    {children}
  </label>
);

/**
 * Caption - Very Small Text
 * Usage: Image captions, fine print
 * 
 * @example
 * ```tsx
 * <Caption>*Required field</Caption>
 * ```
 */
export const Caption: React.FC<TypographyProps> = ({ children, className = '', ...props }) => (
  <span 
    className={`text-xs text-palladium ${className}`}
    {...props}
  >
    {children}
  </span>
);

/**
 * Highlight - Emphasized Text
 * Usage: Important numbers, key information
 * 
 * @example
 * ```tsx
 * <Highlight>Rp 1.500.000</Highlight>
 * <Highlight className="text-2xl">Critical Alert</Highlight>
 * ```
 */
export const Highlight: React.FC<TypographyProps> = ({ children, className = '', ...props }) => (
  <span 
    className={`font-bold text-persimmon ${className}`}
    {...props}
  >
    {children}
  </span>
);

/**
 * Success Text - Positive States
 * Usage: Success messages, positive metrics
 * 
 * @example
 * ```tsx
 * <SuccessText>Project completed on time!</SuccessText>
 * ```
 */
export const SuccessText: React.FC<TypographyProps> = ({ children, className = '', ...props }) => (
  <span 
    className={`text-success font-medium ${className}`}
    {...props}
  >
    {children}
  </span>
);

/**
 * ErrorText - Error States
 * Usage: Error messages, warnings
 * 
 * @example
 * ```tsx
 * <ErrorText>Budget exceeded by 20%</ErrorText>
 * ```
 */
export const ErrorText: React.FC<TypographyProps> = ({ children, className = '', ...props }) => (
  <span 
    className={`text-error font-medium ${className}`}
    {...props}
  >
    {children}
  </span>
);

/**
 * InfoText - Informational
 * Usage: Hints, helpful info
 * 
 * @example
 * ```tsx
 * <InfoText>This action cannot be undone</InfoText>
 * ```
 */
export const InfoText: React.FC<TypographyProps> = ({ children, className = '', ...props }) => (
  <span 
    className={`text-info font-medium ${className}`}
    {...props}
  >
    {children}
  </span>
);

/**
 * Link Text - Clickable Links
 * Usage: Navigation links, external links
 * 
 * @example
 * ```tsx
 * <LinkText href="/dashboard">Go to Dashboard</LinkText>
 * ```
 */
export const LinkText: React.FC<TypographyProps & { href?: string }> = ({ 
  children, 
  className = '', 
  href,
  ...props 
}) => (
  <a 
    href={href}
    className={`text-persimmon hover:text-persimmon-200 underline cursor-pointer transition-colors ${className}`}
    {...props}
  >
    {children}
  </a>
);

/**
 * Metric Display - Large Numbers
 * Usage: KPI displays, dashboard metrics
 * 
 * @example
 * ```tsx
 * <MetricValue>Rp 15.000.000</MetricValue>
 * <MetricValue className="text-success">85%</MetricValue>
 * ```
 */
export const MetricValue: React.FC<TypographyProps> = ({ children, className = '', ...props }) => (
  <div 
    className={`text-2xl font-bold text-night-black ${className}`}
    {...props}
  >
    {children}
  </div>
);

/**
 * Metric Label - Metric Descriptions
 * Usage: Paired with MetricValue
 * 
 * @example
 * ```tsx
 * <div>
 *   <MetricLabel>Total Budget</MetricLabel>
 *   <MetricValue>Rp 15.000.000</MetricValue>
 * </div>
 * ```
 */
export const MetricLabel: React.FC<TypographyProps> = ({ children, className = '', ...props }) => (
  <div 
    className={`text-sm font-medium text-palladium uppercase tracking-wide ${className}`}
    {...props}
  >
    {children}
  </div>
);
