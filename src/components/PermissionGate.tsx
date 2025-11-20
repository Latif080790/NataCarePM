/**
 * RBAC React Components
 *
 * Declarative permission components for React
 * Easy permission checking in JSX
 *
 * @module components/PermissionGate
 */

import React, { ReactNode } from 'react';
import { usePermissions, useRequirePermission, useRoleCheck } from '@/hooks/usePermissions';
import { Permission } from '@/types';
import { ResourceType, Action } from '../middleware/rbac';
import { AlertCircle, Lock } from 'lucide-react';
import { Button } from './Button';

/**
 * Permission Gate Component
 * Shows children only if user has required permission
 *
 * @example
 * ```tsx
 * <PermissionGate permission="edit_rab">
 *   <EditRabButton />
 * </PermissionGate>
 * ```
 */
interface PermissionGateProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
  showMessage?: boolean;
}

export function PermissionGate({
  permission,
  children,
  fallback,
  showMessage = false,
}: PermissionGateProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    if (fallback) return <>{fallback}</>;
    if (showMessage) {
      return (
        <div className="text-center py-8 text-palladium">
          <Lock className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">You don't have permission to view this content</p>
          <p className="text-xs mt-1">Required: {permission}</p>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}

/**
 * Multiple Permissions Gate (OR logic)
 * Shows children if user has ANY of the specified permissions
 *
 * @example
 * ```tsx
 * <AnyPermissionGate permissions={['view_rab', 'edit_rab']}>
 *   <RabContent />
 * </AnyPermissionGate>
 * ```
 */
interface AnyPermissionGateProps {
  permissions: Permission[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function AnyPermissionGate({ permissions, children, fallback }: AnyPermissionGateProps) {
  const { hasAnyPermission } = usePermissions();

  if (!hasAnyPermission(permissions)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

/**
 * All Permissions Gate (AND logic)
 * Shows children only if user has ALL specified permissions
 *
 * @example
 * ```tsx
 * <AllPermissionsGate permissions={['view_finances', 'manage_expenses']}>
 *   <FinanceEditor />
 * </AllPermissionsGate>
 * ```
 */
interface AllPermissionsGateProps {
  permissions: Permission[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function AllPermissionsGate({ permissions, children, fallback }: AllPermissionsGateProps) {
  const { hasAllPermissions } = usePermissions();

  if (!hasAllPermissions(permissions)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

/**
 * Role Gate Component
 * Shows children only for specific roles
 *
 * @example
 * ```tsx
 * <RoleGate roles={['super_admin', 'project_manager']}>
 *   <AdminPanel />
 * </RoleGate>
 * ```
 */
interface RoleGateProps {
  roles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ roles, children, fallback }: RoleGateProps) {
  const { currentUser } = usePermissions();

  const hasRole = roles.some((role) => currentUser?.roleId.toLowerCase() === role.toLowerCase());

  if (!hasRole) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

/**
 * Min Role Gate Component
 * Shows children if user's role is at minimum level
 *
 * @example
 * ```tsx
 * <MinRoleGate minRole="project_manager">
 *   <ManagerTools />
 * </MinRoleGate>
 * ```
 */
interface MinRoleGateProps {
  minRole: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function MinRoleGate({ minRole, children, fallback }: MinRoleGateProps) {
  const { isMinRole } = useRoleCheck();

  if (!isMinRole(minRole)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

/**
 * Resource Action Gate
 * Shows children if user can perform action on resource
 *
 * @example
 * ```tsx
 * <ResourceActionGate resource="document" action="delete">
 *   <DeleteButton />
 * </ResourceActionGate>
 * ```
 */
interface ResourceActionGateProps {
  resource: ResourceType;
  action: Action;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ResourceActionGate({
  resource,
  action,
  children,
  fallback,
}: ResourceActionGateProps) {
  const { canPerform } = usePermissions();

  const allowed = canPerform(resource, action);
  if (!allowed) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

/**
 * Access Denied Component
 * Standard access denied message
 *
 * @example
 * ```tsx
 * <PermissionGate permission="edit_rab" fallback={<AccessDenied />}>
 *   <RabEditor />
 * </PermissionGate>
 * ```
 */
interface AccessDeniedProps {
  reason?: string;
  suggestedAction?: string;
  showContactSupport?: boolean;
}

export function AccessDenied({
  reason = 'You do not have permission to access this content',
  suggestedAction,
  showContactSupport = true,
}: AccessDeniedProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>

        <p className="text-gray-600 mb-4">{reason}</p>

        {suggestedAction && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Suggestion:</strong> {suggestedAction}
            </p>
          </div>
        )}

        {showContactSupport && (
          <div className="mt-6 space-y-3">
            <Button variant="outline" onClick={() => window.history.back()} className="w-full">
              Go Back
            </Button>
            <p className="text-sm text-gray-500">
              Need access? Contact your project manager or administrator
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Permission Required Page
 * Full page component for permission-protected routes
 *
 * @example
 * ```tsx
 * function ProtectedPage() {
 *   const { allowed, reason, suggestedAction } = useRequirePermission('edit_rab');
 *
 *   if (!allowed) {
 *     return <PermissionRequiredPage reason={reason} suggestedAction={suggestedAction} />;
 *   }
 *
 *   return <PageContent />;
 * }
 * ```
 */
interface PermissionRequiredPageProps {
  permission?: Permission;
  reason?: string;
  suggestedAction?: string;
}

export function PermissionRequiredPage({
  permission,
  reason,
  suggestedAction,
}: PermissionRequiredPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-yellow-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">Permission Required</h1>

          {permission && (
            <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 mb-4">
              Required: <code className="font-mono">{permission}</code>
            </div>
          )}

          <p className="text-gray-600 mb-6">
            {reason || 'You need additional permissions to view this page'}
          </p>

          {suggestedAction && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-left">
              <p className="text-sm text-blue-800">
                <strong className="block mb-1">💡 Suggested Action:</strong>
                {suggestedAction}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
            <Button
              onClick={() => (window.location.href = '/')}
              className="bg-violet-essence hover:bg-violet-essence/90"
            >
              Go to Dashboard
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">To request access, please contact:</p>
            <ul className="mt-2 text-sm text-gray-600 space-y-1">
              <li>• Your Project Manager</li>
              <li>• System Administrator</li>
              <li>• HR Department</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Protected Route Wrapper
 * HOC for protecting entire routes
 *
 * @example
 * ```tsx
 * export default withPermission(
 *   RabEditorPage,
 *   'edit_rab',
 *   <AccessDenied />
 * );
 * ```
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission,
  fallback?: ReactNode
) {
  return function ProtectedComponent(props: P) {
    const { allowed, reason, suggestedAction } = useRequirePermission(permission);

    if (!allowed) {
      return fallback ? (
        <>{fallback}</>
      ) : (
        <PermissionRequiredPage
          permission={permission}
          reason={reason}
          suggestedAction={suggestedAction}
        />
      );
    }

    return <Component {...props} />;
  };
}

/**
 * Conditional Render based on permission
 * Utility component for inline permission checks
 *
 * @example
 * ```tsx
 * <IfHasPermission permission="edit_rab" then={<EditButton />} else={<ViewOnlyBadge />} />
 * ```
 */
interface IfHasPermissionProps {
  permission: Permission;
  then: ReactNode;
  else?: ReactNode;
}

export function IfHasPermission({
  permission,
  then: thenNode,
  else: elseNode,
}: IfHasPermissionProps) {
  const { hasPermission } = usePermissions();

  return <>{hasPermission(permission) ? thenNode : elseNode}</>;
}

/**
 * Show for Admin Only
 * Convenience component for admin-only content
 */
interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminOnly({ children, fallback }: AdminOnlyProps) {
  const { isAdmin } = usePermissions();

  return <>{isAdmin ? children : fallback}</>;
}

/**
 * Show for Super Admin Only
 */
interface SuperAdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SuperAdminOnly({ children, fallback }: SuperAdminOnlyProps) {
  const { isSuperAdmin } = usePermissions();

  return <>{isSuperAdmin ? children : fallback}</>;
}

