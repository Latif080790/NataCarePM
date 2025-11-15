/**
 * BreadcrumbPro - Professional Breadcrumb Component
 * 
 * Clean, accessible breadcrumb navigation with proper ARIA labels.
 * 
 * @component
 */

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface BreadcrumbProProps {
  items?: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  separator?: React.ReactNode;
}

/**
 * Professional Breadcrumb Component
 */
export function BreadcrumbPro({
  items,
  className = '',
  showHome = true,
  separator,
}: BreadcrumbProProps) {
  const location = useLocation();
  
  // Auto-generate breadcrumbs from current path if items not provided
  const breadcrumbItems = items || generateBreadcrumbsFromPath(location.pathname);

  const Separator = separator || <ChevronRight className="w-4 h-4 text-gray-400" />;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center space-x-2 text-sm ${className}`}
    >
      <ol className="flex items-center space-x-2">
        {/* Home Link */}
        {showHome && (
          <li className="flex items-center">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="sr-only">Home</span>
            </Link>
            {breadcrumbItems.length > 0 && (
              <span className="ml-2" aria-hidden="true">
                {Separator}
              </span>
            )}
          </li>
        )}

        {/* Breadcrumb Items */}
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const Icon = item.icon;

          return (
            <li key={index} className="flex items-center">
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className="flex items-center gap-1.5 text-gray-900 font-semibold"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </span>
              )}
              
              {!isLast && (
                <span className="ml-2" aria-hidden="true">
                  {Separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Generate breadcrumbs from current path
 */
function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  
  // Path name mapping
  const pathNameMap: Record<string, string> = {
    'dashboard': 'Dashboard',
    'tasks': 'Tasks',
    'kanban': 'Kanban Board',
    'finance': 'Finance',
    'cashflow': 'Cash Flow',
    'reports': 'Reports',
    'daily': 'Daily Reports',
    'analytics': 'Analytics',
    'settings': 'Settings',
    'profile': 'Profile',
    'logistics': 'Logistics',
    'documents': 'Documents',
    'rab': 'RAB & AHSP',
    'attendance': 'Attendance',
    'monitoring': 'Monitoring',
    'users': 'User Management',
    'master-data': 'Master Data',
    'audit-trail': 'Audit Trail',
    'advanced': 'Advanced Analytics',
    'ai': 'AI Features',
    'intelligent': 'Intelligent Documents',
  };

  return segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');
    const label = pathNameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    
    return {
      label,
      href: path,
    };
  });
}

/**
 * Breadcrumb Wrapper with Page Header
 */
export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-4">
            <BreadcrumbPro items={breadcrumbs} />
          </div>
        )}

        {/* Title & Actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-600 max-w-3xl">
                {subtitle}
              </p>
            )}
          </div>
          
          {actions && (
            <div className="flex items-center gap-3 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Example Usage:
 * 
 * // Basic breadcrumb
 * <BreadcrumbPro
 *   items={[
 *     { label: 'Dashboard', href: '/' },
 *     { label: 'Projects', href: '/projects' },
 *     { label: 'Project Detail' },
 *   ]}
 * />
 * 
 * // Auto-generated from path
 * <BreadcrumbPro />
 * 
 * // Page header with breadcrumbs
 * <PageHeader
 *   title="Project Dashboard"
 *   subtitle="Monitor your project progress and metrics"
 *   breadcrumbs={[
 *     { label: 'Projects', href: '/projects' },
 *     { label: 'Project Detail' },
 *   ]}
 *   actions={
 *     <>
 *       <ButtonPro variant="outline">Export</ButtonPro>
 *       <ButtonPro variant="primary">New Task</ButtonPro>
 *     </>
 *   }
 * />
 */

