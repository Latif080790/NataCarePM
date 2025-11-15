/**
 * EnterpriseLayout - Professional Page Layout Component
 * 
 * Standardized layout wrapper for all pages.
 * Ensures consistency across the application.
 * 
 * @component
 */

import React from 'react';
import { BreadcrumbItem, PageHeader } from './BreadcrumbPro';

export interface EnterpriseLayoutProps {
  children: React.ReactNode;
  
  // Page Header Props
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  
  // Layout Props
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  background?: 'white' | 'gray' | 'gradient';
  className?: string;
  
  // Features
  showHeader?: boolean;
  scrollable?: boolean;
}

/**
 * Enterprise Layout Component
 */
export function EnterpriseLayout({
  children,
  title,
  subtitle,
  breadcrumbs,
  actions,
  maxWidth = '7xl',
  padding = 'md',
  background = 'gray',
  className = '',
  showHeader = true,
  scrollable = true,
}: EnterpriseLayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    '2xl': 'max-w-screen-2xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'px-4 py-4',
    md: 'px-6 py-6',
    lg: 'px-8 py-8',
  };

  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    gradient: 'bg-gradient-to-br from-gray-50 to-white',
  };

  return (
    <div className={`min-h-screen ${backgroundClasses[background]} ${scrollable ? 'overflow-y-auto' : ''}`}>
      {/* Page Header */}
      {showHeader && (title || breadcrumbs) && (
        <PageHeader
          title={title || ''}
          subtitle={subtitle}
          breadcrumbs={breadcrumbs}
          actions={actions}
        />
      )}

      {/* Main Content */}
      <main className={`${maxWidthClasses[maxWidth]} mx-auto ${paddingClasses[padding]} ${className}`}>
        {children}
      </main>
    </div>
  );
}

/**
 * Section Layout - For content sections within a page
 */
export interface SectionLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  variant?: 'default' | 'bordered' | 'card';
  className?: string;
}

export function SectionLayout({
  children,
  title,
  description,
  actions,
  variant = 'default',
  className = '',
}: SectionLayoutProps) {
  const variantClasses = {
    default: '',
    bordered: 'border-t border-gray-200 pt-6',
    card: 'bg-white rounded-lg border border-gray-200 p-6 shadow-sm',
  };

  return (
    <section className={`${variantClasses[variant]} ${className}`}>
      {/* Section Header */}
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            {title && (
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-gray-600">
                {description}
              </p>
            )}
          </div>
          
          {actions && (
            <div className="flex items-center gap-3 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Section Content */}
      <div>{children}</div>
    </section>
  );
}

/**
 * Grid Layout - Responsive grid container
 */
export interface GridLayoutProps {
  children: React.ReactNode;
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function GridLayout({
  children,
  columns = {
    default: 1,
    sm: 1,
    md: 2,
    lg: 3,
  },
  gap = 'md',
  className = '',
}: GridLayoutProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  const responsiveClasses = [
    columns.default ? gridCols[columns.default as keyof typeof gridCols] : 'grid-cols-1',
    columns.sm ? `sm:${gridCols[columns.sm as keyof typeof gridCols]}` : '',
    columns.md ? `md:${gridCols[columns.md as keyof typeof gridCols]}` : '',
    columns.lg ? `lg:${gridCols[columns.lg as keyof typeof gridCols]}` : '',
    columns.xl ? `xl:${gridCols[columns.xl as keyof typeof gridCols]}` : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={`grid ${responsiveClasses} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Example Usage:
 * 
 * // Full page layout
 * <EnterpriseLayout
 *   title="Project Dashboard"
 *   subtitle="Monitor your project progress"
 *   breadcrumbs={[
 *     { label: 'Projects', href: '/projects' },
 *     { label: 'Dashboard' },
 *   ]}
 *   actions={
 *     <>
 *       <ButtonPro variant="outline">Export</ButtonPro>
 *       <ButtonPro variant="primary">New Task</ButtonPro>
 *     </>
 *   }
 * >
 *   <YourContent />
 * </EnterpriseLayout>
 * 
 * // Section within a page
 * <SectionLayout
 *   title="Key Metrics"
 *   description="Overview of project performance"
 *   variant="card"
 * >
 *   <StatCardGrid>...</StatCardGrid>
 * </SectionLayout>
 * 
 * // Grid layout
 * <GridLayout columns={{ default: 1, md: 2, lg: 3 }}>
 *   <CardPro>Card 1</CardPro>
 *   <CardPro>Card 2</CardPro>
 *   <CardPro>Card 3</CardPro>
 * </GridLayout>
 */

