/**
 * ENTERPRISE-GRADE RBAC PERMISSION SYSTEM
 * Granular permission matrix for construction project management
 * Last Updated: December 16, 2025
 */

import { Permission } from '@/types';

export type UserRole = 
  | 'owner'           // Project Owner - Full access
  | 'pm'              // Project Manager - Manage operations
  | 'siteManager'     // Site Manager - Field operations only
  | 'logisticsManager'// Logistics Manager - Inventory & procurement
  | 'accountant'      // Accountant - Financial reports only
  | 'viewer';         // Viewer - Read-only access

/**
 * PERMISSION MATRIX
 * Defines what each role can do in the system
 * ✅ = true, ❌ = false
 */
export const PERMISSION_MATRIX: Record<UserRole, Record<Permission, boolean>> = {
  owner: {
    // Dashboard & Overview
    view_dashboard: true,
    
    // RAB (Budget)
    view_rab: true,
    edit_rab: true,
    approve_rab: true,
    
    // Schedule & Gantt
    view_gantt: true,
    
    // Daily Reports & Progress
    view_daily_reports: true,
    create_daily_reports: true,
    view_progress: true,
    update_progress: true,
    
    // Attendance
    view_attendance: true,
    manage_attendance: true,
    
    // Finances (CRITICAL - Only owner can see profit margin)
    view_finances: true,
    manage_expenses: true,
    view_evm: true,
    
    // Logistics & Inventory
    view_logistics: true,
    manage_logistics: true,
    create_po: true,
    approve_po: true,
    manage_inventory: true,
    
    // Documents
    view_documents: true,
    manage_documents: true,
    view_reports: true,
    
    // User Management
    view_users: true,
    manage_users: true,
    
    // Master Data
    view_master_data: true,
    manage_master_data: true,
    
    // System
    view_audit_trail: true,
    view_monitoring: true,
    manage_monitoring: true,
  },

  pm: {
    // Dashboard & Overview
    view_dashboard: true,
    
    // RAB (Budget)
    view_rab: true,
    edit_rab: true,
    approve_rab: true,
    
    // Schedule & Gantt
    view_gantt: true,
    
    // Daily Reports & Progress
    view_daily_reports: true,
    create_daily_reports: true,
    view_progress: true,
    update_progress: true,
    
    // Attendance
    view_attendance: true,
    manage_attendance: true,
    
    // Finances (Can see financials but not modify critical data)
    view_finances: true,
    manage_expenses: true,
    view_evm: true,
    
    // Logistics & Inventory
    view_logistics: true,
    manage_logistics: true,
    create_po: true,
    approve_po: true,
    manage_inventory: true,
    
    // Documents
    view_documents: true,
    manage_documents: true,
    view_reports: true,
    
    // User Management (Limited)
    view_users: true,
    manage_users: false, // Cannot add/remove users
    
    // Master Data
    view_master_data: true,
    manage_master_data: true,
    
    // System
    view_audit_trail: true,
    view_monitoring: true,
    manage_monitoring: false,
  },

  siteManager: {
    // Dashboard & Overview
    view_dashboard: true,
    
    // RAB (Budget) - ❌ NO FINANCIAL ACCESS
    view_rab: false,
    edit_rab: false,
    approve_rab: false,
    
    // Schedule & Gantt
    view_gantt: true,
    
    // Daily Reports & Progress (PRIMARY FUNCTION)
    view_daily_reports: true,
    create_daily_reports: true,
    view_progress: true,
    update_progress: true,
    
    // Attendance
    view_attendance: true,
    manage_attendance: true,
    
    // Finances - ❌ CANNOT SEE PROFIT MARGINS
    view_finances: false,
    manage_expenses: false,
    view_evm: false,
    
    // Logistics & Inventory (Can request only)
    view_logistics: true,
    manage_logistics: false, // Cannot approve
    create_po: false,
    approve_po: false,
    manage_inventory: true, // Can update quantities
    
    // Documents
    view_documents: true,
    manage_documents: false, // Can upload photos, cannot delete
    view_reports: true,
    
    // User Management
    view_users: true,
    manage_users: false,
    
    // Master Data
    view_master_data: true,
    manage_master_data: false,
    
    // System
    view_audit_trail: false,
    view_monitoring: false,
    manage_monitoring: false,
  },

  logisticsManager: {
    // Dashboard & Overview
    view_dashboard: true,
    
    // RAB (Budget)
    view_rab: false,
    edit_rab: false,
    approve_rab: false,
    
    // Schedule & Gantt
    view_gantt: true,
    
    // Daily Reports & Progress
    view_daily_reports: true,
    create_daily_reports: false,
    view_progress: true,
    update_progress: false,
    
    // Attendance
    view_attendance: false,
    manage_attendance: false,
    
    // Finances
    view_finances: false,
    manage_expenses: false,
    view_evm: false,
    
    // Logistics & Inventory (PRIMARY FUNCTION)
    view_logistics: true,
    manage_logistics: true,
    create_po: true,
    approve_po: false, // Cannot approve own POs
    manage_inventory: true,
    
    // Documents
    view_documents: true,
    manage_documents: true,
    view_reports: true,
    
    // User Management
    view_users: true,
    manage_users: false,
    
    // Master Data
    view_master_data: true,
    manage_master_data: false,
    
    // System
    view_audit_trail: false,
    view_monitoring: false,
    manage_monitoring: false,
  },

  accountant: {
    // Dashboard & Overview
    view_dashboard: true,
    
    // RAB (Budget)
    view_rab: true,
    edit_rab: false,
    approve_rab: false,
    
    // Schedule & Gantt
    view_gantt: false,
    
    // Daily Reports & Progress
    view_daily_reports: true,
    create_daily_reports: false,
    view_progress: true,
    update_progress: false,
    
    // Attendance
    view_attendance: false,
    manage_attendance: false,
    
    // Finances (PRIMARY FUNCTION - Read only)
    view_finances: true,
    manage_expenses: false, // Cannot modify, only record
    view_evm: true,
    
    // Logistics & Inventory
    view_logistics: true,
    manage_logistics: false,
    create_po: false,
    approve_po: false,
    manage_inventory: false,
    
    // Documents
    view_documents: true,
    manage_documents: false,
    view_reports: true,
    
    // User Management
    view_users: false,
    manage_users: false,
    
    // Master Data
    view_master_data: true,
    manage_master_data: false,
    
    // System
    view_audit_trail: true,
    view_monitoring: false,
    manage_monitoring: false,
  },

  viewer: {
    // Dashboard & Overview
    view_dashboard: true,
    
    // RAB (Budget)
    view_rab: false,
    edit_rab: false,
    approve_rab: false,
    
    // Schedule & Gantt
    view_gantt: true,
    
    // Daily Reports & Progress
    view_daily_reports: true,
    create_daily_reports: false,
    view_progress: true,
    update_progress: false,
    
    // Attendance
    view_attendance: false,
    manage_attendance: false,
    
    // Finances
    view_finances: false,
    manage_expenses: false,
    view_evm: false,
    
    // Logistics & Inventory
    view_logistics: false,
    manage_logistics: false,
    create_po: false,
    approve_po: false,
    manage_inventory: false,
    
    // Documents
    view_documents: true,
    manage_documents: false,
    view_reports: true,
    
    // User Management
    view_users: false,
    manage_users: false,
    
    // Master Data
    view_master_data: false,
    manage_master_data: false,
    
    // System
    view_audit_trail: false,
    view_monitoring: false,
    manage_monitoring: false,
  },
};

/**
 * Helper function to check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return PERMISSION_MATRIX[role]?.[permission] ?? false;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  const permissions: Permission[] = [];
  const rolePermissions = PERMISSION_MATRIX[role];
  
  if (!rolePermissions) return [];
  
  (Object.keys(rolePermissions) as Permission[]).forEach((permission) => {
    if (rolePermissions[permission]) {
      permissions.push(permission);
    }
  });
  
  return permissions;
}

/**
 * Role descriptions for UI
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  owner: 'Full system access - Can manage all aspects including team, finances, and system settings',
  pm: 'Project Manager - Can manage operations, approve budgets, and oversee team',
  siteManager: 'Site Manager - Field operations, daily logs, attendance (no financial access)',
  logisticsManager: 'Logistics Manager - Inventory, procurement, and material management',
  accountant: 'Accountant - Financial reports and audit trail (read-only)',
  viewer: 'Viewer - Read-only access to reports and progress',
};

/**
 * Role display names
 */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  owner: 'Owner',
  pm: 'Project Manager',
  siteManager: 'Site Manager',
  logisticsManager: 'Logistics Manager',
  accountant: 'Accountant',
  viewer: 'Viewer',
};
