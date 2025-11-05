/**
 * Role-Based Access Control (RBAC) Middleware
 * Implements comprehensive permission checking and access control
 */

import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import type { APIResponse } from '@/types/userProfile';

// ========================================
// TYPES
// ========================================

export interface UserPermissions {
  role: UserRole;
  permissions: Permission[];
  restrictions: Restriction[];
}

export type UserRole = 'admin' | 'manager' | 'user' | 'viewer';

export type Permission =
  // Project permissions
  | 'project:create'
  | 'project:read'
  | 'project:update'
  | 'project:delete'
  | 'project:manage_members'

  // Task permissions
  | 'task:create'
  | 'task:read'
  | 'task:update'
  | 'task:delete'
  | 'task:assign'

  // Finance permissions
  | 'finance:read'
  | 'finance:create'
  | 'finance:update'
  | 'finance:approve'
  | 'finance:delete'

  // Logistics permissions
  | 'logistics:read'
  | 'logistics:create'
  | 'logistics:update'
  | 'logistics:approve'
  | 'logistics:delete'

  // Document permissions
  | 'document:read'
  | 'document:create'
  | 'document:update'
  | 'document:delete'
  | 'document:approve'

  // User management permissions
  | 'user:read'
  | 'user:create'
  | 'user:update'
  | 'user:delete'
  | 'user:manage_roles'

  // System permissions
  | 'system:read'
  | 'system:configure'
  | 'system:backup'
  | 'system:audit';

export type Restriction =
  | 'budget_limit'
  | 'department_restriction'
  | 'time_restriction'
  | 'ip_restriction';

export interface ResourceAccess {
  resourceType: string;
  resourceId: string;
  requiredPermission: Permission;
  ownerId?: string;
  departmentId?: string;
}

// ========================================
// ROLE DEFINITIONS
// ========================================

/**
 * Define permissions for each role
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // All permissions
    'project:create', 'project:read', 'project:update', 'project:delete', 'project:manage_members',
    'task:create', 'task:read', 'task:update', 'task:delete', 'task:assign',
    'finance:read', 'finance:create', 'finance:update', 'finance:approve', 'finance:delete',
    'logistics:read', 'logistics:create', 'logistics:update', 'logistics:approve', 'logistics:delete',
    'document:read', 'document:create', 'document:update', 'document:delete', 'document:approve',
    'user:read', 'user:create', 'user:update', 'user:delete', 'user:manage_roles',
    'system:read', 'system:configure', 'system:backup', 'system:audit',
  ],

  manager: [
    // Project and team management
    'project:create', 'project:read', 'project:update', 'project:manage_members',
    'task:create', 'task:read', 'task:update', 'task:delete', 'task:assign',
    'finance:read', 'finance:create', 'finance:update',
    'logistics:read', 'logistics:create', 'logistics:update',
    'document:read', 'document:create', 'document:update',
    'user:read',
  ],

  user: [
    // Basic operational permissions
    'project:read',
    'task:create', 'task:read', 'task:update',
    'finance:read',
    'logistics:read',
    'document:read', 'document:create',
  ],

  viewer: [
    // Read-only permissions
    'project:read',
    'task:read',
    'finance:read',
    'logistics:read',
    'document:read',
  ],
};

// ========================================
// RBAC MIDDLEWARE
// ========================================

/**
 * Check if user has required permission
 */
export const requirePermission = (requiredPermission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = await getCurrentUserId(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          },
        });
      }

      const userPermissions = await getUserPermissions(userId);

      if (!hasPermission(userPermissions.permissions, requiredPermission)) {
        logAccessDenied(req, userId, requiredPermission);
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions',
          },
        });
      }

      // Attach user permissions to request for later use
      (req as any).userPermissions = userPermissions;
      next();
    } catch (error: any) {
      console.error('RBAC middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'RBAC_ERROR',
          message: 'Access control error',
          details: error,
        },
      });
    }
  };
};

/**
 * Check resource ownership and permissions
 */
export const requireResourceAccess = (access: ResourceAccess) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = await getCurrentUserId(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          },
        });
      }

      const userPermissions = await getUserPermissions(userId);

      // Check basic permission
      if (!hasPermission(userPermissions.permissions, access.requiredPermission)) {
        logAccessDenied(req, userId, access.requiredPermission);
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions',
          },
        });
      }

      // Check resource ownership (if applicable)
      if (access.ownerId && access.ownerId !== userId && !isAdmin(userPermissions.role)) {
        // Check if user has access to this resource
        const hasResourceAccess = await checkResourceAccess(userId, access);

        if (!hasResourceAccess) {
          logAccessDenied(req, userId, access.requiredPermission, `Resource: ${access.resourceId}`);
          return res.status(403).json({
            success: false,
            error: {
              code: 'RESOURCE_ACCESS_DENIED',
              message: 'Access denied to this resource',
            },
          });
        }
      }

      // Check restrictions
      const restrictionCheck = await checkRestrictions(userId, userPermissions.restrictions, access);
      if (!restrictionCheck.allowed) {
        logAccessDenied(req, userId, access.requiredPermission, restrictionCheck.reason);
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_RESTRICTED',
            message: restrictionCheck.reason || 'Access restricted',
          },
        });
      }

      (req as any).userPermissions = userPermissions;
      next();
    } catch (error: any) {
      console.error('Resource access middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'RESOURCE_ACCESS_ERROR',
          message: 'Resource access control error',
          details: error,
        },
      });
    }
  };
};

/**
 * Check if user is admin
 */
export const requireAdmin = requirePermission('system:configure');

/**
 * Check if user can manage users
 */
export const requireUserManager = requirePermission('user:manage_roles');

// ========================================
// PERMISSION CHECKING FUNCTIONS
// ========================================

/**
 * Check if user has specific permission
 */
export const hasPermission = (userPermissions: Permission[], requiredPermission: Permission): boolean => {
  return userPermissions.includes(requiredPermission);
};

/**
 * Check if user has any of the permissions
 */
export const hasAnyPermission = (userPermissions: Permission[], requiredPermissions: Permission[]): boolean => {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
};

/**
 * Check if user has all permissions
 */
export const hasAllPermissions = (userPermissions: Permission[], requiredPermissions: Permission[]): boolean => {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
};

/**
 * Check if user is admin
 */
export const isAdmin = (role: UserRole): boolean => {
  return role === 'admin';
};

/**
 * Check if user is manager or admin
 */
export const isManagerOrAdmin = (role: UserRole): boolean => {
  return role === 'admin' || role === 'manager';
};

// ========================================
// USER PERMISSION MANAGEMENT
// ========================================

/**
 * Get user permissions from database
 */
export const getUserPermissions = async (userId: string): Promise<UserPermissions> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      // Default to user role
      return {
        role: 'user',
        permissions: ROLE_PERMISSIONS.user,
        restrictions: [],
      };
    }

    const userData = userDoc.data();
    const role: UserRole = userData.role || 'user';

    return {
      role,
      permissions: ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user,
      restrictions: userData.restrictions || [],
    };
  } catch (error) {
    console.error('Error getting user permissions:', error);
    // Return minimal permissions on error
    return {
      role: 'user',
      permissions: ROLE_PERMISSIONS.user,
      restrictions: [],
    };
  }
};

/**
 * Update user role
 */
export const updateUserRole = async (
  userId: string,
  newRole: UserRole,
  updatedBy: string
): Promise<APIResponse<boolean>> => {
  try {
    await setDoc(doc(db, 'users', userId), {
      role: newRole,
      updatedBy,
      updatedAt: new Date(),
    }, { merge: true });

    // Log role change
    await logRoleChange(userId, newRole, updatedBy);

    return {
      success: true,
      data: true,
    };
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return {
      success: false,
      error: {
        code: 'ROLE_UPDATE_ERROR',
        message: 'Failed to update user role',
        details: error,
      },
    };
  }
};

// ========================================
// RESOURCE ACCESS CHECKING
// ========================================

/**
 * Check if user has access to specific resource
 */
const checkResourceAccess = async (userId: string, access: ResourceAccess): Promise<boolean> => {
  try {
    // Check project membership
    if (access.resourceType === 'project') {
      const projectDoc = await getDoc(doc(db, 'projects', access.resourceId));
      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        const members = projectData.members || [];
        return members.includes(userId) || projectData.ownerId === userId;
      }
    }

    // Check task assignment
    if (access.resourceType === 'task') {
      const taskDoc = await getDoc(doc(db, 'tasks', access.resourceId));
      if (taskDoc.exists()) {
        const taskData = taskDoc.data();
        return taskData.assigneeId === userId || taskData.createdBy === userId;
      }
    }

    // Default: allow access if basic permission check passed
    return true;
  } catch (error) {
    console.error('Error checking resource access:', error);
    return false;
  }
};

/**
 * Check user restrictions
 */
const checkRestrictions = async (
  userId: string,
  restrictions: Restriction[],
  access: ResourceAccess
): Promise<{ allowed: boolean; reason?: string }> => {
  // Check budget limits
  if (restrictions.includes('budget_limit') && access.resourceType === 'finance') {
    // TODO: Implement budget limit checking
    // This would check user's budget approval limits
  }

  // Check department restrictions
  if (restrictions.includes('department_restriction')) {
    // TODO: Implement department restriction checking
    // This would check if user can access resources from other departments
  }

  // Check time restrictions
  if (restrictions.includes('time_restriction')) {
    const now = new Date();
    const hour = now.getHours();

    // Example: restrict access outside business hours
    if (hour < 8 || hour > 18) {
      return {
        allowed: false,
        reason: 'Access restricted outside business hours',
      };
    }
  }

  // Check IP restrictions
  if (restrictions.includes('ip_restriction')) {
    // TODO: Implement IP restriction checking
    // This would check user's IP against allowed ranges
  }

  return { allowed: true };
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Get current user ID from request
 */
const getCurrentUserId = async (req: Request): Promise<string | null> => {
  // Try to get from Firebase Auth
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    return user.uid;
  }

  // Try to get from session or JWT token
  // TODO: Implement JWT token validation
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    // TODO: Decode and validate JWT token
    // return decoded.userId;
  }

  return null;
};

/**
 * Log access denied events
 */
const logAccessDenied = (
  req: Request,
  userId: string,
  permission: Permission,
  details?: string
) => {
  console.warn('Access denied:', {
    userId,
    permission,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    details,
  });

  // TODO: Send to audit log
};

/**
 * Log role changes
 */
const logRoleChange = async (
  userId: string,
  newRole: UserRole,
  changedBy: string
) => {
  // TODO: Implement audit logging for role changes
  console.log(`Role changed for user ${userId}: ${newRole} by ${changedBy}`);
};

// ========================================
// EXPORT
// ========================================

export const rbac = {
  requirePermission,
  requireResourceAccess,
  requireAdmin,
  requireUserManager,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAdmin,
  isManagerOrAdmin,
  getUserPermissions,
  updateUserRole,
};
