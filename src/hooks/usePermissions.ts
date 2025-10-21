/**
 * RBAC React Hooks
 *
 * Custom hooks for integrating Role-Based Access Control into React components
 * Provides easy-to-use permission checking within components
 *
 * @module hooks/usePermissions
 */

import { useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  RBACEngine,
  ResourceType,
  Action,
  PermissionCheckResult,
  RBACContext,
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
} from '../middleware/rbac';
import { Permission } from '@/types';

/**
 * Main RBAC hook
 * Provides comprehensive permission checking functionality
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { hasPermission, canPerform, checkContext } = usePermissions();
 *
 *   if (!hasPermission('edit_rab')) {
 *     return <AccessDenied />;
 *   }
 *
 *   return <RabEditor />;
 * }
 * ```
 */
export function usePermissions() {
  const { currentUser } = useAuth();

  /**
   * Check if current user has a specific permission
   */
  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return RBACEngine.hasPermission(currentUser, permission);
    },
    [currentUser]
  );

  /**
   * Check if user has any of the specified permissions (OR logic)
   */
  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      return RBACEngine.hasAnyPermission(currentUser, permissions);
    },
    [currentUser]
  );

  /**
   * Check if user has all specified permissions (AND logic)
   */
  const hasAllPermissions = useCallback(
    (permissions: Permission[]): boolean => {
      return RBACEngine.hasAllPermissions(currentUser, permissions);
    },
    [currentUser]
  );

  /**
   * Check if user can perform an action on a resource
   */
  const canPerform = useCallback(
    (resource: ResourceType, action: Action): PermissionCheckResult => {
      return RBACEngine.canPerformAction(currentUser, resource, action);
    },
    [currentUser]
  );

  /**
   * Enhanced permission check with full context
   */
  const checkContext = useCallback(
    (context: Omit<RBACContext, 'user'>): PermissionCheckResult => {
      return RBACEngine.checkPermission({
        ...context,
        user: currentUser!,
      });
    },
    [currentUser]
  );

  /**
   * Check if current user owns a resource
   */
  const isOwner = useCallback(
    (resource: any): boolean => {
      return RBACEngine.isResourceOwner(currentUser, resource);
    },
    [currentUser]
  );

  /**
   * Check if user is project member
   */
  const isProjectMember = useCallback(
    (projectId: string, projectMembers?: string[]): boolean => {
      return RBACEngine.isProjectMember(currentUser, projectId, projectMembers);
    },
    [currentUser]
  );

  /**
   * Get all permissions for current user
   */
  const permissions = useMemo(() => {
    return RBACEngine.getUserPermissions(currentUser);
  }, [currentUser]);

  /**
   * Get accessible actions for a resource type
   */
  const getAccessibleActions = useCallback(
    (resourceType: ResourceType): Action[] => {
      return RBACEngine.getAccessibleResources(currentUser, resourceType);
    },
    [currentUser]
  );

  /**
   * Check if user can manage another user
   */
  const canManageUser = useCallback(
    (targetUser: any): boolean => {
      return RBACEngine.canManageUser(currentUser, targetUser);
    },
    [currentUser]
  );

  /**
   * Get user's role level
   */
  const roleLevel = useMemo(() => {
    return currentUser ? RBACEngine.getRoleLevel(currentUser.roleId) : 0;
  }, [currentUser]);

  /**
   * Check if user is admin or super admin
   */
  const isAdmin = useMemo(() => {
    return currentUser?.roleId === 'super_admin' || currentUser?.roleId === 'project_manager';
  }, [currentUser]);

  /**
   * Check if user is super admin
   */
  const isSuperAdmin = useMemo(() => {
    return currentUser?.roleId === 'super_admin';
  }, [currentUser]);

  return {
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canPerform,
    checkContext,

    // Resource checks
    isOwner,
    isProjectMember,
    canManageUser,

    // User info
    permissions,
    getAccessibleActions,
    roleLevel,
    isAdmin,
    isSuperAdmin,

    // Current user
    currentUser,
  };
}

/**
 * Hook for requiring a specific permission
 * Throws error or shows message if permission is missing
 *
 * @example
 * ```tsx
 * function RabEditor() {
 *   const { allowed, reason } = useRequirePermission('edit_rab');
 *
 *   if (!allowed) {
 *     return <AccessDenied reason={reason} />;
 *   }
 *
 *   return <RabForm />;
 * }
 * ```
 */
export function useRequirePermission(permission: Permission): PermissionCheckResult {
  const { currentUser } = useAuth();

  return useMemo(() => {
    return requirePermission(permission, currentUser);
  }, [permission, currentUser]);
}

/**
 * Hook for requiring multiple permissions (AND logic)
 */
export function useRequireAllPermissions(permissions: Permission[]): PermissionCheckResult {
  const { currentUser } = useAuth();

  return useMemo(() => {
    return requireAllPermissions(permissions, currentUser);
  }, [permissions, currentUser]);
}

/**
 * Hook for requiring any permission (OR logic)
 */
export function useRequireAnyPermission(permissions: Permission[]): PermissionCheckResult {
  const { currentUser } = useAuth();

  return useMemo(() => {
    return requireAnyPermission(permissions, currentUser);
  }, [permissions, currentUser]);
}

/**
 * Hook for permission-based UI rendering
 * Returns conditional render helpers
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { canView, canEdit, canDelete } = usePermissionUI();
 *
 *   return (
 *     <>
 *       {canView('rab') && <RabList />}
 *       {canEdit('rab') && <EditButton />}
 *       {canDelete('rab') && <DeleteButton />}
 *     </>
 *   );
 * }
 * ```
 */
export function usePermissionUI() {
  const { hasPermission, canPerform } = usePermissions();

  const canView = useCallback(
    (feature: string): boolean => {
      const permission = `view_${feature}` as Permission;
      return hasPermission(permission);
    },
    [hasPermission]
  );

  const canEdit = useCallback(
    (feature: string): boolean => {
      const permission = `edit_${feature}` as Permission;
      return hasPermission(permission) || hasPermission(`manage_${feature}` as Permission);
    },
    [hasPermission]
  );

  const canCreate = useCallback(
    (feature: string): boolean => {
      const permission = `create_${feature}` as Permission;
      return hasPermission(permission) || hasPermission(`manage_${feature}` as Permission);
    },
    [hasPermission]
  );

  const canDelete = useCallback(
    (feature: string): boolean => {
      const permission = `manage_${feature}` as Permission;
      return hasPermission(permission);
    },
    [hasPermission]
  );

  const canManage = useCallback(
    (feature: string): boolean => {
      const permission = `manage_${feature}` as Permission;
      return hasPermission(permission);
    },
    [hasPermission]
  );

  const canPerformAction = useCallback(
    (resource: ResourceType, action: Action): boolean => {
      const result = canPerform(resource, action);
      return result.allowed;
    },
    [canPerform]
  );

  return {
    canView,
    canEdit,
    canCreate,
    canDelete,
    canManage,
    canPerformAction,
  };
}

/**
 * Hook for role-based rendering
 *
 * @example
 * ```tsx
 * function AdminPanel() {
 *   const { isRole, isMinRole } = useRoleCheck();
 *
 *   if (!isMinRole('project_manager')) {
 *     return <AccessDenied />;
 *   }
 *
 *   return <AdminContent />;
 * }
 * ```
 */
export function useRoleCheck() {
  const { currentUser } = useAuth();

  const isRole = useCallback(
    (roleName: string): boolean => {
      return currentUser?.roleId.toLowerCase() === roleName.toLowerCase();
    },
    [currentUser]
  );

  const isMinRole = useCallback(
    (minRoleName: string): boolean => {
      if (!currentUser) return false;

      const userLevel = RBACEngine.getRoleLevel(currentUser.roleId);
      const minLevel = RBACEngine.getRoleLevel(minRoleName);

      return userLevel >= minLevel;
    },
    [currentUser]
  );

  const isMaxRole = useCallback(
    (maxRoleName: string): boolean => {
      if (!currentUser) return false;

      const userLevel = RBACEngine.getRoleLevel(currentUser.roleId);
      const maxLevel = RBACEngine.getRoleLevel(maxRoleName);

      return userLevel <= maxLevel;
    },
    [currentUser]
  );

  return {
    isRole,
    isMinRole,
    isMaxRole,
    currentRole: currentUser?.roleId,
  };
}

/**
 * Hook for project-specific permissions
 *
 * @example
 * ```tsx
 * function ProjectSettings({ projectId }) {
 *   const { canAccessProject, canEditProject } = useProjectPermissions(projectId);
 *
 *   if (!canAccessProject) {
 *     return <AccessDenied />;
 *   }
 *
 *   return <ProjectForm editable={canEditProject} />;
 * }
 * ```
 */
export function useProjectPermissions(projectId?: string, projectMembers?: string[]) {
  const { currentUser } = useAuth();
  const { hasPermission, canPerform } = usePermissions();

  const canAccessProject = useMemo(() => {
    if (!projectId || !currentUser) return false;

    // Super admin can access all projects
    if (currentUser.roleId === 'super_admin') return true;

    // Check if user is project member
    return RBACEngine.isProjectMember(currentUser, projectId, projectMembers);
  }, [projectId, currentUser, projectMembers]);

  const canEditProject = useMemo(() => {
    return canAccessProject && hasPermission('manage_master_data');
  }, [canAccessProject, hasPermission]);

  const canDeleteProject = useMemo(() => {
    return currentUser?.roleId === 'super_admin';
  }, [currentUser]);

  const canManageTeam = useMemo(() => {
    return canAccessProject && hasPermission('manage_users');
  }, [canAccessProject, hasPermission]);

  const canViewFinances = useMemo(() => {
    return canAccessProject && hasPermission('view_finances');
  }, [canAccessProject, hasPermission]);

  const canManageFinances = useMemo(() => {
    return canAccessProject && hasPermission('manage_expenses');
  }, [canAccessProject, hasPermission]);

  return {
    canAccessProject,
    canEditProject,
    canDeleteProject,
    canManageTeam,
    canViewFinances,
    canManageFinances,
    isProjectMember: canAccessProject,
  };
}

/**
 * Hook for resource-specific permissions
 * Generic hook for checking permissions on any resource
 *
 * @example
 * ```tsx
 * function DocumentViewer({ document }) {
 *   const { canRead, canUpdate, canDelete } = useResourcePermissions(
 *     'document',
 *     document
 *   );
 *
 *   return (
 *     <>
 *       {canRead && <DocumentContent />}
 *       {canUpdate && <EditButton />}
 *       {canDelete && <DeleteButton />}
 *     </>
 *   );
 * }
 * ```
 */
export function useResourcePermissions(resourceType: ResourceType, resource?: any) {
  const { canPerform, isOwner } = usePermissions();

  const canRead = useMemo(() => {
    return canPerform(resourceType, 'read').allowed;
  }, [resourceType, canPerform]);

  const canCreate = useMemo(() => {
    return canPerform(resourceType, 'create').allowed;
  }, [resourceType, canPerform]);

  const canUpdate = useMemo(() => {
    if (!resource) return canPerform(resourceType, 'update').allowed;

    // Owner can always update
    if (isOwner(resource)) return true;

    return canPerform(resourceType, 'update').allowed;
  }, [resourceType, resource, canPerform, isOwner]);

  const canDelete = useMemo(() => {
    if (!resource) return canPerform(resourceType, 'delete').allowed;

    // Owner can delete own resources
    if (isOwner(resource)) return true;

    return canPerform(resourceType, 'delete').allowed;
  }, [resourceType, resource, canPerform, isOwner]);

  const canApprove = useMemo(() => {
    return canPerform(resourceType, 'approve').allowed;
  }, [resourceType, canPerform]);

  const canShare = useMemo(() => {
    return canPerform(resourceType, 'share').allowed;
  }, [resourceType, canPerform]);

  const canExport = useMemo(() => {
    return canPerform(resourceType, 'export').allowed;
  }, [resourceType, canPerform]);

  return {
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    canApprove,
    canShare,
    canExport,
    isOwner: resource ? isOwner(resource) : false,
  };
}

/**
 * Hook for bulk permission checks
 * Optimized for checking multiple permissions at once
 */
export function useBulkPermissions(permissions: Permission[]) {
  const { currentUser } = useAuth();

  const results = useMemo(() => {
    const map: Record<Permission, boolean> = {} as Record<Permission, boolean>;

    permissions.forEach((permission) => {
      map[permission] = RBACEngine.hasPermission(currentUser, permission);
    });

    return map;
  }, [permissions, currentUser]);

  const hasAll = useMemo(() => {
    return Object.values(results).every((allowed) => allowed);
  }, [results]);

  const hasAny = useMemo(() => {
    return Object.values(results).some((allowed) => allowed);
  }, [results]);

  return {
    results,
    hasAll,
    hasAny,
  };
}

/**
 * Default export
 */
export default usePermissions;
