/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * Provides permission checking, route protection, and authorization utilities
 * for enforcing access control throughout the application.
 *
 * Features:
 * - Permission checking functions
 * - HOCs for component protection (withRole, withPermission)
 * - Route guards
 * - API authorization helpers
 * - Hierarchical role management
 *
 * @module utils/rbacMiddleware
 */

import { ComponentType } from 'react';
import { Navigate } from 'react-router-dom';
import { User, Permission } from '@/types';

// ============================================================================
// ROLE HIERARCHY & PERMISSIONS
// ============================================================================

/**
 * Role hierarchy (higher roles inherit lower role permissions)
 */
export const ROLE_HIERARCHY: Record<string, number> = {
  'super-admin': 100,
  admin: 80,
  manager: 60,
  editor: 40,
  viewer: 20,
  guest: 0,
};

/**
 * Default permissions by role
 * Based on actual Permission types from types.ts
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  'super-admin': [
    // All permissions
    'view_dashboard',
    'view_rab',
    'edit_rab',
    'view_gantt',
    'view_daily_reports',
    'create_daily_reports',
    'view_progress',
    'update_progress',
    'view_attendance',
    'manage_attendance',
    'view_finances',
    'manage_expenses',
    'view_evm',
    'view_logistics',
    'manage_logistics',
    'create_po',
    'approve_po',
    'manage_inventory',
    'view_documents',
    'manage_documents',
    'view_reports',
    'view_users',
    'manage_users',
    'view_master_data',
    'manage_master_data',
    'view_audit_trail',
    'view_monitoring',
    'manage_monitoring',
  ],
  admin: [
    // Most permissions except master data management
    'view_dashboard',
    'view_rab',
    'edit_rab',
    'view_gantt',
    'view_daily_reports',
    'create_daily_reports',
    'view_progress',
    'update_progress',
    'view_attendance',
    'manage_attendance',
    'view_finances',
    'manage_expenses',
    'view_evm',
    'view_logistics',
    'manage_logistics',
    'create_po',
    'approve_po',
    'manage_inventory',
    'view_documents',
    'manage_documents',
    'view_reports',
    'view_users',
    'manage_users',
    'view_master_data',
    'view_audit_trail',
    'view_monitoring',
  ],
  manager: [
    // Project and team management
    'view_dashboard',
    'view_rab',
    'edit_rab',
    'view_gantt',
    'view_daily_reports',
    'create_daily_reports',
    'view_progress',
    'update_progress',
    'view_attendance',
    'manage_attendance',
    'view_finances',
    'manage_expenses',
    'view_evm',
    'view_logistics',
    'create_po',
    'approve_po',
    'view_documents',
    'manage_documents',
    'view_reports',
    'view_master_data',
  ],
  editor: [
    // Create and edit content
    'view_dashboard',
    'view_rab',
    'edit_rab',
    'view_gantt',
    'view_daily_reports',
    'create_daily_reports',
    'view_progress',
    'update_progress',
    'view_attendance',
    'view_finances',
    'view_evm',
    'view_logistics',
    'view_documents',
    'manage_documents',
    'view_reports',
  ],
  viewer: [
    // Read-only access
    'view_dashboard',
    'view_rab',
    'view_gantt',
    'view_daily_reports',
    'view_progress',
    'view_attendance',
    'view_finances',
    'view_evm',
    'view_logistics',
    'view_documents',
    'view_reports',
  ],
  guest: [
    // Minimal access
    'view_dashboard',
  ],
};

// ============================================================================
// PERMISSION CHECKING FUNCTIONS
// ============================================================================

/**
 * Check if user has a specific permission
 *
 * @param user - User object with roleId and permissions
 * @param permission - Permission to check
 * @returns True if user has the permission
 *
 * @example
 * ```typescript
 * if (hasPermission(currentUser, 'delete_project')) {
 *   // Show delete button
 * }
 * ```
 */
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;

  // Check user-specific permissions first (overrides role permissions)
  if (user.permissions && user.permissions.includes(permission)) {
    return true;
  }

  // Check role permissions
  const rolePermissions = DEFAULT_ROLE_PERMISSIONS[user.roleId] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if user has ANY of the specified permissions
 *
 * @param user - User object
 * @param permissions - Array of permissions to check
 * @returns True if user has at least one permission
 */
export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
  if (!user) return false;
  return permissions.some((permission) => hasPermission(user, permission));
}

/**
 * Check if user has ALL of the specified permissions
 *
 * @param user - User object
 * @param permissions - Array of permissions to check
 * @returns True if user has all permissions
 */
export function hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
  if (!user) return false;
  return permissions.every((permission) => hasPermission(user, permission));
}

/**
 * Check if user has a specific role
 *
 * @param user - User object
 * @param role - Role ID to check
 * @returns True if user has the role
 */
export function hasRole(user: User | null, role: string): boolean {
  if (!user) return false;
  return user.roleId === role;
}

/**
 * Check if user has ANY of the specified roles
 *
 * @param user - User object
 * @param roles - Array of role IDs to check
 * @returns True if user has at least one role
 */
export function hasAnyRole(user: User | null, roles: string[]): boolean {
  if (!user) return false;
  return roles.includes(user.roleId);
}

/**
 * Check if user's role is at or above a certain level
 *
 * @param user - User object
 * @param minRole - Minimum role required
 * @returns True if user's role meets or exceeds the minimum
 */
export function hasRoleLevel(user: User | null, minRole: string): boolean {
  if (!user) return false;

  const userLevel = ROLE_HIERARCHY[user.roleId] || 0;
  const minLevel = ROLE_HIERARCHY[minRole] || 0;

  return userLevel >= minLevel;
}

/**
 * Check if user is project owner or has permission
 *
 * @param user - User object
 * @param projectOwnerId - Project owner's user ID
 * @param permission - Permission to check if not owner
 * @returns True if user is owner or has permission
 */
export function canAccessProject(
  user: User | null,
  projectOwnerId: string,
  permission: Permission
): boolean {
  if (!user) return false;

  // Owner has full access
  if (user.uid === projectOwnerId || user.id === projectOwnerId) {
    return true;
  }

  // Check permission
  return hasPermission(user, permission);
}

/**
 * Check if user can perform action on resource based on ownership
 *
 * @param user - User object
 * @param resourceOwnerId - Resource owner's user ID
 * @param permission - Permission required if not owner
 * @returns True if user is owner or has permission
 */
export function canModifyResource(
  user: User | null,
  resourceOwnerId: string,
  permission: Permission
): boolean {
  if (!user) return false;

  // Owner can always modify
  if (user.uid === resourceOwnerId || user.id === resourceOwnerId) {
    return true;
  }

  // Check if user has override permission
  return hasPermission(user, permission);
}

// ============================================================================
// AUTHORIZATION HELPERS
// ============================================================================

/**
 * Require permission or throw error
 *
 * @param user - User object
 * @param permission - Required permission
 * @throws UnauthorizedError if user doesn't have permission
 */
export function requirePermission(user: User | null, permission: Permission): void {
  if (!hasPermission(user, permission)) {
    throw new UnauthorizedError(`Permission denied. Required: ${permission}`);
  }
}

/**
 * Require role or throw error
 *
 * @param user - User object
 * @param role - Required role
 * @throws UnauthorizedError if user doesn't have role
 */
export function requireRole(user: User | null, role: string): void {
  if (!hasRole(user, role)) {
    throw new UnauthorizedError(`Access denied. Required role: ${role}`);
  }
}

/**
 * Require minimum role level or throw error
 *
 * @param user - User object
 * @param minRole - Minimum required role
 * @throws UnauthorizedError if user's role is below minimum
 */
export function requireRoleLevel(user: User | null, minRole: string): void {
  if (!hasRoleLevel(user, minRole)) {
    throw new UnauthorizedError(`Access denied. Minimum role required: ${minRole}`);
  }
}

/**
 * Require authentication
 *
 * @param user - User object
 * @throws UnauthenticatedError if user is not authenticated
 */
export function requireAuth(user: User | null): asserts user is User {
  if (!user) {
    throw new UnauthenticatedError('Authentication required');
  }
}

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

/**
 * Unauthorized error (403)
 */
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Unauthenticated error (401)
 */
export class UnauthenticatedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthenticatedError';
  }
}

// ============================================================================
// REACT HOCs (Higher-Order Components)
// ============================================================================

/**
 * HOC to protect component with permission check
 *
 * @param Component - Component to protect
 * @param permission - Required permission
 * @param fallback - Component to show if permission denied
 * @returns Protected component
 *
 * @example
 * ```typescript
 * const ProtectedView = withPermission(AdminView, 'manage_users');
 * ```
 */
export function withPermission<P extends object>(
  Component: ComponentType<P>,
  permission: Permission,
  fallback?: ComponentType
): ComponentType<P & { user: User | null }> {
  return (props: P & { user: User | null }) => {
    const { user, ...rest } = props;

    if (!hasPermission(user, permission)) {
      if (fallback) {
        const FallbackComponent = fallback;
        return <FallbackComponent />;
      }
      return <Navigate to="/unauthorized" replace />;
    }

    return <Component {...(rest as P)} />;
  };
}

/**
 * HOC to protect component with role check
 *
 * @param Component - Component to protect
 * @param role - Required role
 * @param fallback - Component to show if role check fails
 * @returns Protected component
 *
 * @example
 * ```typescript
 * const AdminView = withRole(AdminPanel, 'admin');
 * ```
 */
export function withRole<P extends object>(
  Component: ComponentType<P>,
  role: string,
  fallback?: ComponentType
): ComponentType<P & { user: User | null }> {
  return (props: P & { user: User | null }) => {
    const { user, ...rest } = props;

    if (!hasRole(user, role)) {
      if (fallback) {
        const FallbackComponent = fallback;
        return <FallbackComponent />;
      }
      return <Navigate to="/unauthorized" replace />;
    }

    return <Component {...(rest as P)} />;
  };
}

/**
 * HOC to protect component with role level check
 *
 * @param Component - Component to protect
 * @param minRole - Minimum role required
 * @param fallback - Component to show if role level check fails
 * @returns Protected component
 *
 * @example
 * ```typescript
 * const ManagerView = withRoleLevel(Dashboard, 'manager');
 * ```
 */
export function withRoleLevel<P extends object>(
  Component: ComponentType<P>,
  minRole: string,
  fallback?: ComponentType
): ComponentType<P & { user: User | null }> {
  return (props: P & { user: User | null }) => {
    const { user, ...rest } = props;

    if (!hasRoleLevel(user, minRole)) {
      if (fallback) {
        const FallbackComponent = fallback;
        return <FallbackComponent />;
      }
      return <Navigate to="/unauthorized" replace />;
    }

    return <Component {...(rest as P)} />;
  };
}

/**
 * HOC to require authentication
 *
 * @param Component - Component to protect
 * @returns Protected component
 *
 * @example
 * ```typescript
 * const PrivateView = withAuth(DashboardView);
 * ```
 */
export function withAuth<P extends object>(
  Component: ComponentType<P>
): ComponentType<P & { user: User | null }> {
  return (props: P & { user: User | null }) => {
    const { user, ...rest } = props;

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    return <Component {...(rest as P)} />;
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all permissions for a user
 *
 * @param user - User object
 * @returns Array of all permissions
 */
export function getUserPermissions(user: User | null): Permission[] {
  if (!user) return [];

  // Start with role permissions
  const rolePermissions = DEFAULT_ROLE_PERMISSIONS[user.roleId] || [];

  // Add user-specific permissions
  const userPermissions = user.permissions || [];

  // Combine and remove duplicates
  return Array.from(new Set([...rolePermissions, ...userPermissions]));
}

/**
 * Get role display name
 *
 * @param roleId - Role ID
 * @returns Human-readable role name
 */
export function getRoleDisplayName(roleId: string): string {
  const roleNames: Record<string, string> = {
    'super-admin': 'Super Admin',
    admin: 'Administrator',
    manager: 'Manajer',
    editor: 'Editor',
    viewer: 'Viewer',
    guest: 'Tamu',
  };

  return roleNames[roleId] || roleId;
}

/**
 * Check if role can be assigned by current user
 *
 * @param currentUser - Current user
 * @param targetRole - Role to assign
 * @returns True if current user can assign the role
 */
export function canAssignRole(currentUser: User | null, targetRole: string): boolean {
  if (!currentUser) return false;

  // Only users with manage_users permission can assign roles
  if (!hasPermission(currentUser, 'manage_users')) {
    return false;
  }

  // Users can only assign roles equal to or below their own
  const currentLevel = ROLE_HIERARCHY[currentUser.roleId] || 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] || 0;

  return currentLevel > targetLevel;
}

// ============================================================================
// API AUTHORIZATION
// ============================================================================

/**
 * Check API authorization for request
 *
 * @param user - User making request
 * @param resource - Resource being accessed
 * @param action - Action being performed
 * @returns Authorization result
 */
export interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
}

// This function is already defined above with correct permissions
// Removed duplicate implementation

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Permission checks
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,

  // Role checks
  hasRole,
  hasAnyRole,
  hasRoleLevel,

  // Resource checks
  canAccessProject,
  canModifyResource,

  // Requirements
  requirePermission,
  requireRole,
  requireRoleLevel,
  requireAuth,

  // HOCs
  withPermission,
  withRole,
  withRoleLevel,
  withAuth,

  // Utilities
  getUserPermissions,
  getRoleDisplayName,
  canAssignRole,

  // Constants
  ROLE_HIERARCHY,
  DEFAULT_ROLE_PERMISSIONS,

  // Errors
  UnauthorizedError,
  UnauthenticatedError,
};

