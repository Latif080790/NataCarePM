/**
 * ENTERPRISE PERMISSIONS HOOK
 * Real permission checking with Firebase integration + RBAC matrix
 * Last Updated: December 16, 2025
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext.minimal';
import { useProject } from '@/contexts/ProjectContext';
import { getUserPermissions, getUserRole } from '@/api/authService';
import { Permission } from '@/types';
import { PERMISSION_MATRIX, UserRole, ROLE_DISPLAY_NAMES } from '@/types/permissions.enhanced';
import { logger } from '@/utils/logger.enhanced';

export const usePermissions = () => {
  const { currentUser } = useAuth();
  const { currentProject } = useProject();
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get current role from project membership
  const currentRole = useMemo((): UserRole | null => {
    if (!currentUser || !currentProject) {
      return null;
    }

    const member = currentProject.members?.find(
      (m) => m.uid === currentUser.uid || m.id === currentUser.id
    );

    if (!member) {
      logger.warn('User is not a member of current project', {
        userId: currentUser.id,
        projectId: currentProject.id,
      });
      return null;
    }

    const role = member.roleId as UserRole;
    if (!PERMISSION_MATRIX[role]) {
      logger.error('Invalid role detected', new Error(`Invalid role: ${role}`), { userId: currentUser.id });
      return null;
    }

    return role;
  }, [currentUser, currentProject]);

  useEffect(() => {
    if (currentUser?.uid) {
      loadPermissions(currentUser.uid);
    } else {
      setUserPermissions([]);
      setIsLoading(false);
    }
  }, [currentUser?.uid]);

  const loadPermissions = async (userId: string) => {
    try {
      setIsLoading(true);
      const permissions = await getUserPermissions(userId);
      setUserPermissions(permissions);
    } catch (error) {
      console.error('Failed to load permissions:', error);
      setUserPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced permission check with RBAC matrix
  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!currentUser) return false;

      // Check RBAC matrix if user has role in current project
      if (currentRole && PERMISSION_MATRIX[currentRole]) {
        const hasAccess = PERMISSION_MATRIX[currentRole][permission] ?? false;

        // Log access denied for critical operations
        if (!hasAccess && ['edit_rab', 'approve_rab', 'manage_expenses', 'view_finances'].includes(permission)) {
          logger.warn('Permission denied', {
            userId: currentUser.id,
            role: currentRole,
            permission,
            projectId: currentProject?.id,
          });
        }

        return hasAccess;
      }

      // Fallback to user-level permissions
      return userPermissions.includes(permission);
    },
    [currentUser, currentRole, currentProject, userPermissions]
  );

  const hasAllPermissions = useCallback(
    (permissions: Permission[]): boolean => {
      if (!currentUser) return false;
      return permissions.every(p => hasPermission(p));
    },
    [currentUser, hasPermission]
  );

  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      if (!currentUser) return false;
      return permissions.some(p => hasPermission(p));
    },
    [currentUser, hasPermission]
  );

  const canPerformAction = useCallback(
    (resource: string, action: string): boolean => {
      const permission = `${resource}:${action}` as Permission;
      return hasPermission(permission);
    },
    [hasPermission]
  );

  // Role checks
  const isOwner = currentRole === 'owner';
  const isPM = currentRole === 'pm';
  const isSiteManager = currentRole === 'siteManager';
  const isLogisticsManager = currentRole === 'logisticsManager';
  const isAccountant = currentRole === 'accountant';
  const isAdmin = currentUser?.roleId === 'admin';
  const isSuperAdmin = currentUser?.roleId === 'super_admin';

  // Common permission shortcuts
  const canViewFinancials = hasPermission('view_finances');
  const canEditRAB = hasPermission('edit_rab');
  const canApprove = hasPermission('approve_rab') || hasPermission('approve_po');

  const roleName = currentRole ? ROLE_DISPLAY_NAMES[currentRole] : 'No Role';

  return {
    currentUser,
    currentRole,
    roleName,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    canPerformAction,
    canPerform: canPerformAction,
    userPermissions,
    isLoading,
    // Role checks
    isOwner,
    isPM,
    isSiteManager,
    isLogisticsManager,
    isAccountant,
    isAdmin,
    isSuperAdmin,
    // Common permission shortcuts
    canViewFinancials,
    canEditRAB,
    canApprove,
  };
};

export const useRequirePermission = (permission: Permission) => {
  const { hasPermission, isLoading } = usePermissions();
  const allowed = hasPermission(permission);

  return {
    allowed,
    reason: allowed ? '' : 'Insufficient permissions',
    suggestedAction: allowed ? '' : 'Contact your administrator for access',
    isLoading,
  };
};

export const useRoleCheck = () => {
  const { currentUser } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.uid) {
      loadRole(currentUser.uid);
    } else {
      setRole(null);
      setIsLoading(false);
    }
  }, [currentUser?.uid]);

  const loadRole = async (userId: string) => {
    try {
      setIsLoading(true);
      const userRole = await getUserRole(userId);
      setRole(userRole);
    } catch (error) {
      console.error('Failed to load role:', error);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  const isMinRole = useCallback((minRole: string) => {
    const roles = ['user', 'pm', 'manager', 'admin', 'super_admin'];
    const userRoleIndex = roles.indexOf(role || '');
    const minRoleIndex = roles.indexOf(minRole);
    
    if (userRoleIndex === -1 || minRoleIndex === -1) return false;
    return userRoleIndex >= minRoleIndex;
  }, [role]);

  return {
    isAdmin: role === 'admin',
    isManager: role === 'pm' || role === 'manager',
    isUser: role === 'user',
    role: role as 'admin' | 'pm' | 'user' | null,
    isLoading,
    isMinRole,
  };
};

export const useProjectPermissions = (_projectId: string) => {
  const { hasPermission, isLoading } = usePermissions();

  return {
    hasPermission,
    canView: hasPermission('view_dashboard'),
    canEdit: hasPermission('edit_rab'),
    canDelete: hasPermission('view_dashboard'), // TODO: add specific delete permission
    isLoading,
  };
};

export const useResourceAccess = (_resourceType: string, _resourceId: string) => {
  return {
    canView: true,
    canEdit: true,
    canDelete: true,
    isLoading: false,
  };
};
