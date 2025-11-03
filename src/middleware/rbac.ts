/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * Comprehensive permission system for NataCarePM
 * Provides fine-grained access control for routes, components, and API operations
 *
 * @module middleware/rbac
 */

import { Permission, Role, User } from '@/types';

/**
 * Resource types that can be protected by RBAC
 */
export type ResourceType =
  | 'project'
  | 'task'
  | 'document'
  | 'purchase_order'
  | 'expense'
  | 'rab_item'
  | 'user'
  | 'report'
  | 'attendance'
  | 'inventory';

/**
 * Action types for RBAC operations
 */
export type Action =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'export'
  | 'import'
  | 'share';

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  suggestedAction?: string;
}

/**
 * RBAC Context for permission checks
 */
export interface RBACContext {
  user: User;
  resource?: any;
  resourceType?: ResourceType;
  action?: Action;
  projectId?: string;
}

/**
 * Predefined role configurations
 * Based on enterprise project management hierarchy
 */
export const ROLE_DEFINITIONS: Record<string, Role> = {
  // Super Admin - Full system access
  SUPER_ADMIN: {
    id: 'super_admin',
    name: 'Super Admin',
    permissions: [
      'view_dashboard',
      'view_rab',
      'edit_rab',
      'approve_rab',  // Adding RAB approval permission
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
  },

  // Project Manager - Full project access
  PROJECT_MANAGER: {
    id: 'project_manager',
    name: 'Project Manager',
    permissions: [
      'view_dashboard',
      'view_rab',
      'edit_rab',
      'approve_rab',  // Adding RAB approval permission
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
      'view_master_data',
      'view_audit_trail',
    ],
  },

  // Site Engineer - Technical execution
  SITE_ENGINEER: {
    id: 'site_engineer',
    name: 'Site Engineer',
    permissions: [
      'view_dashboard',
      'view_rab',
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
  },

  // Finance Manager - Financial operations
  FINANCE_MANAGER: {
    id: 'finance_manager',
    name: 'Finance Manager',
    permissions: [
      'view_dashboard',
      'view_rab',
      'view_finances',
      'manage_expenses',
      'view_evm',
      'create_po',
      'approve_po',
      'manage_inventory',
      'view_documents',
      'view_reports',
      'view_audit_trail',
    ],
  },

  // Procurement Officer - Purchase operations
  PROCUREMENT_OFFICER: {
    id: 'procurement_officer',
    name: 'Procurement Officer',
    permissions: [
      'view_dashboard',
      'view_rab',
      'view_logistics',
      'manage_logistics',
      'create_po',
      'manage_inventory',
      'view_documents',
      'view_reports',
    ],
  },

  // Document Controller - Document management
  DOCUMENT_CONTROLLER: {
    id: 'document_controller',
    name: 'Document Controller',
    permissions: ['view_dashboard', 'view_documents', 'manage_documents', 'view_reports'],
  },

  // Team Member - Basic access
  TEAM_MEMBER: {
    id: 'team_member',
    name: 'Team Member',
    permissions: [
      'view_dashboard',
      'view_rab',
      'view_gantt',
      'view_daily_reports',
      'view_progress',
      'view_documents',
      'view_reports',
    ],
  },

  // Client/Viewer - Read-only access
  CLIENT: {
    id: 'client',
    name: 'Client',
    permissions: [
      'view_dashboard',
      'view_rab',
      'view_gantt',
      'view_progress',
      'view_evm',
      'view_documents',
      'view_reports',
    ],
  },
};

/**
 * Permission to Resource Action mapping
 * Maps Permission types to Resource + Action combinations
 */
export const PERMISSION_MAPPING: Record<Permission, { resource: ResourceType; action: Action }[]> =
  {
    view_dashboard: [{ resource: 'project', action: 'read' }],
    view_rab: [{ resource: 'rab_item', action: 'read' }],
    edit_rab: [
      { resource: 'rab_item', action: 'create' },
      { resource: 'rab_item', action: 'update' },
      { resource: 'rab_item', action: 'delete' },
    ],
    approve_rab: [
      { resource: 'rab_item', action: 'approve' },
      { resource: 'rab_item', action: 'update' },
    ],
    view_gantt: [{ resource: 'task', action: 'read' }],
    view_daily_reports: [{ resource: 'report', action: 'read' }],
    create_daily_reports: [{ resource: 'report', action: 'create' }],
    view_progress: [
      { resource: 'task', action: 'read' },
      { resource: 'project', action: 'read' },
    ],
    update_progress: [{ resource: 'task', action: 'update' }],
    view_attendance: [{ resource: 'attendance', action: 'read' }],
    manage_attendance: [
      { resource: 'attendance', action: 'create' },
      { resource: 'attendance', action: 'update' },
      { resource: 'attendance', action: 'delete' },
    ],
    view_finances: [{ resource: 'expense', action: 'read' }],
    manage_expenses: [
      { resource: 'expense', action: 'create' },
      { resource: 'expense', action: 'update' },
      { resource: 'expense', action: 'delete' },
      { resource: 'expense', action: 'approve' },
    ],
    view_evm: [{ resource: 'project', action: 'read' }],
    view_logistics: [{ resource: 'inventory', action: 'read' }],
    manage_logistics: [
      { resource: 'inventory', action: 'create' },
      { resource: 'inventory', action: 'update' },
    ],
    create_po: [{ resource: 'purchase_order', action: 'create' }],
    approve_po: [{ resource: 'purchase_order', action: 'approve' }],
    manage_inventory: [
      { resource: 'inventory', action: 'create' },
      { resource: 'inventory', action: 'update' },
      { resource: 'inventory', action: 'delete' },
    ],
    view_documents: [{ resource: 'document', action: 'read' }],
    manage_documents: [
      { resource: 'document', action: 'create' },
      { resource: 'document', action: 'update' },
      { resource: 'document', action: 'delete' },
      { resource: 'document', action: 'share' },
    ],
    view_reports: [
      { resource: 'report', action: 'read' },
      { resource: 'report', action: 'export' },
    ],
    view_users: [{ resource: 'user', action: 'read' }],
    manage_users: [
      { resource: 'user', action: 'create' },
      { resource: 'user', action: 'update' },
      { resource: 'user', action: 'delete' },
    ],
    view_master_data: [{ resource: 'project', action: 'read' }],
    manage_master_data: [
      { resource: 'project', action: 'create' },
      { resource: 'project', action: 'update' },
      { resource: 'project', action: 'delete' },
    ],
    view_audit_trail: [{ resource: 'project', action: 'read' }],
    view_monitoring: [{ resource: 'project', action: 'read' }],
    manage_monitoring: [{ resource: 'project', action: 'update' }],
  };

/**
 * RBAC Permission Engine
 */
export class RBACEngine {
  /**
   * Check if user has a specific permission
   */
  static hasPermission(user: User | null, permission: Permission): boolean {
    if (!user) return false;

    // Check if user has direct permission override
    if (user.permissions?.includes(permission)) return true;

    // Super admin has all permissions
    if (user.roleId === 'super_admin') return true;

    const userRole = ROLE_DEFINITIONS[user.roleId?.toUpperCase()];
    if (!userRole) return false;

    return userRole.permissions.includes(permission);
  }

  /**
   * Check if user can perform an action on a resource
   */
  static canPerformAction(
    user: User | null,
    resource: ResourceType,
    action: Action
  ): PermissionCheckResult {
    if (!user) {
      return {
        allowed: false,
        reason: 'User not authenticated',
        suggestedAction: 'Please log in to continue',
      };
    }

    // Super admin can do everything
    if (user.roleId === 'super_admin') {
      return { allowed: true };
    }

    const userRole = ROLE_DEFINITIONS[user.roleId?.toUpperCase()];
    if (!userRole) {
      return {
        allowed: false,
        reason: 'Invalid user role',
        suggestedAction: 'Please contact administrator',
      };
    }

    // Check if any of the user's permissions allow this action
    for (const permission of userRole.permissions) {
      const mappings = PERMISSION_MAPPING[permission];
      if (mappings) {
        const hasAccess = mappings.some(
          (mapping) => mapping.resource === resource && mapping.action === action
        );
        if (hasAccess) {
          return { allowed: true };
        }
      }
    }

    return {
      allowed: false,
      reason: `Insufficient permissions to ${action} ${resource}`,
      suggestedAction: `Contact your project manager to request ${action} access for ${resource}`,
    };
  }

  /**
   * Check multiple permissions at once
   */
  static hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
    if (!user) return false;
    return permissions.some((permission) => this.hasPermission(user, permission));
  }

  /**
   * Check if user has all specified permissions
   */
  static hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
    if (!user) return false;
    return permissions.every((permission) => this.hasPermission(user, permission));
  }

  /**
   * Get all permissions for a user
   */
  static getUserPermissions(user: User | null): Permission[] {
    if (!user) return [];

    // Include direct permissions
    const directPermissions = user.permissions || [];

    const userRole = ROLE_DEFINITIONS[user.roleId?.toUpperCase()];
    const rolePermissions = userRole?.permissions || [];

    // Combine and deduplicate
    return Array.from(new Set([...directPermissions, ...rolePermissions]));
  }

  /**
   * Check if user owns a resource
   */
  static isResourceOwner(user: User | null, resource: any): boolean {
    if (!user || !resource) return false;

    // Check common ownership patterns
    if (resource.createdBy === user.id) return true;
    if (resource.ownerId === user.id) return true;
    if (resource.userId === user.id) return true;
    if (resource.assignedTo?.includes(user.id)) return true;

    return false;
  }

  /**
   * Check if user is project member
   */
  static isProjectMember(user: User | null, projectId: string, projectMembers?: string[]): boolean {
    if (!user) return false;

    // Super admin has access to all projects
    if (user.roleId === 'super_admin') return true;

    // Check if user is in project members list
    if (projectMembers) {
      return projectMembers.includes(user.id);
    }

    return false;
  }

  /**
   * Enhanced permission check with context
   */
  static checkPermission(context: RBACContext): PermissionCheckResult {
    const { user, resource, resourceType, action, projectId } = context;

    if (!user) {
      return {
        allowed: false,
        reason: 'User not authenticated',
        suggestedAction: 'Please log in to continue',
      };
    }

    // Super admin bypass
    if (user.roleId === 'super_admin') {
      return { allowed: true };
    }

    // Resource ownership check
    if (resource && this.isResourceOwner(user, resource)) {
      return { allowed: true, reason: 'Resource owner' };
    }

    // Project membership check
    if (projectId && resource?.members) {
      if (!this.isProjectMember(user, projectId, resource.members)) {
        return {
          allowed: false,
          reason: 'Not a project member',
          suggestedAction: 'Request access from project manager',
        };
      }
    }

    // Action-based permission check
    if (resourceType && action) {
      return this.canPerformAction(user, resourceType, action);
    }

    return {
      allowed: false,
      reason: 'Insufficient context for permission check',
    };
  }

  /**
   * Filter items based on user permissions
   */
  static filterByPermission<T>(user: User | null, items: T[], permission: Permission): T[] {
    if (!user) return [];

    if (this.hasPermission(user, permission)) {
      return items;
    }

    return [];
  }

  /**
   * Get accessible resources for a user
   */
  static getAccessibleResources(user: User | null, resourceType: ResourceType): Action[] {
    if (!user) return [];

    const userRole = ROLE_DEFINITIONS[user.roleId?.toUpperCase()];
    if (!userRole) return [];

    const accessibleActions: Set<Action> = new Set();

    for (const permission of userRole.permissions) {
      const mappings = PERMISSION_MAPPING[permission];
      if (mappings) {
        mappings
          .filter((mapping) => mapping.resource === resourceType)
          .forEach((mapping) => accessibleActions.add(mapping.action));
      }
    }

    return Array.from(accessibleActions);
  }

  /**
   * Validate role assignment
   */
  static isValidRole(roleId: string): boolean {
    return Object.keys(ROLE_DEFINITIONS).includes(roleId.toUpperCase());
  }

  /**
   * Get role hierarchy level (for comparison)
   */
  static getRoleLevel(roleId: string): number {
    const hierarchy: Record<string, number> = {
      SUPER_ADMIN: 100,
      PROJECT_MANAGER: 80,
      FINANCE_MANAGER: 70,
      SITE_ENGINEER: 60,
      PROCUREMENT_OFFICER: 50,
      DOCUMENT_CONTROLLER: 40,
      TEAM_MEMBER: 20,
      CLIENT: 10,
    };

    return hierarchy[roleId.toUpperCase()] || 0;
  }

  /**
   * Check if user can manage another user (based on role hierarchy)
   */
  static canManageUser(manager: User | null, targetUser: User): boolean {
    if (!manager) return false;

    if (manager.roleId === 'super_admin') return true;

    const managerLevel = this.getRoleLevel(manager.roleId);
    const targetLevel = this.getRoleLevel(targetUser.roleId);

    return managerLevel > targetLevel;
  }

  /**
   * Log permission check for audit trail
   */
  static logPermissionCheck(
    user: User | null,
    action: string,
    resource: string,
    allowed: boolean
  ): void {
    if (process.env.NODE_ENV === 'development') {
      const status = allowed ? '✅ ALLOWED' : '❌ DENIED';
      console.log(
        `[RBAC] ${status} - User: ${user?.email || 'anonymous'} | Action: ${action} | Resource: ${resource}`
      );
    }

    // In production, send to audit log service
    // auditLogService.log({ user, action, resource, allowed, timestamp: new Date() });
  }
}

/**
 * Require permission decorator/helper
 * Usage: requirePermission('edit_rab', user)
 */
export function requirePermission(
  permission: Permission,
  user: User | null
): PermissionCheckResult {
  const allowed = RBACEngine.hasPermission(user, permission);

  RBACEngine.logPermissionCheck(user, permission, 'permission_check', allowed);

  if (!allowed) {
    return {
      allowed: false,
      reason: `Missing permission: ${permission}`,
      suggestedAction: 'Contact your administrator to request this permission',
    };
  }

  return { allowed: true };
}

/**
 * Require multiple permissions (AND logic)
 */
export function requireAllPermissions(
  permissions: Permission[],
  user: User | null
): PermissionCheckResult {
  const allowed = RBACEngine.hasAllPermissions(user, permissions);

  if (!allowed) {
    return {
      allowed: false,
      reason: `Missing one or more permissions: ${permissions.join(', ')}`,
      suggestedAction: 'Contact your administrator to request these permissions',
    };
  }

  return { allowed: true };
}

/**
 * Require any permission (OR logic)
 */
export function requireAnyPermission(
  permissions: Permission[],
  user: User | null
): PermissionCheckResult {
  const allowed = RBACEngine.hasAnyPermission(user, permissions);

  if (!allowed) {
    return {
      allowed: false,
      reason: `Missing all of: ${permissions.join(', ')}`,
      suggestedAction: 'Contact your administrator to request at least one of these permissions',
    };
  }

  return { allowed: true };
}

/**
 * Export default RBAC engine
 */
export default RBACEngine;
