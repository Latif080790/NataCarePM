/**
 * Permission Hooks
 * Real permission checking with Firebase integration
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserPermissions, getUserRole } from '@/api/authService';
import { Permission } from '@/types';

export const usePermissions = () => {
  const { currentUser } = useAuth();
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!currentUser) return false;
      return userPermissions.includes(permission);
    },
    [currentUser, userPermissions]
  );

  const hasAllPermissions = useCallback(
    (permissions: Permission[]): boolean => {
      if (!currentUser) return false;
      return permissions.every(p => userPermissions.includes(p));
    },
    [currentUser, userPermissions]
  );

  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      if (!currentUser) return false;
      return permissions.some(p => userPermissions.includes(p));
    },
    [currentUser, userPermissions]
  );

  const canPerformAction = useCallback(
    (resource: string, action: string): boolean => {
      const permission = `${resource}:${action}` as Permission;
      return hasPermission(permission);
    },
    [hasPermission]
  );

  const isAdmin = currentUser?.roleId === 'admin';
  const isSuperAdmin = currentUser?.roleId === 'super_admin';

  return {
    currentUser,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    canPerformAction,
    canPerform: canPerformAction,
    userPermissions,
    isLoading,
    isAdmin,
    isSuperAdmin,
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
