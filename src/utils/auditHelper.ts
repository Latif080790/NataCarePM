/**
 * Audit Helper Utility
 * Day 5 - Simplifies integration of enhanced audit logging across modules
 * 
 * FIXED: Handles undefined userId and other fields properly
 */

import { createEnhancedAuditLog } from '@/api/auditService.enhanced';
import { auth } from '@/firebaseConfig';

/**
 * Get current user info safely (never returns undefined)
 */
const getCurrentUserInfo = () => {
  const user = auth.currentUser;
  
  if (!user) {
    return {
      userId: 'system',
      userName: 'System',
      userEmail: 'system@natacare.com',
      userRole: 'system',
    };
  }

  return {
    userId: user.uid || 'unknown',
    userName: user.displayName || user.email || 'Unknown User',
    userEmail: user.email || 'no-email@natacare.com',
    userRole: (user as any).role || 'user',
  };
};

/**
 * Quick audit log creation for common operations
 */
export const auditHelper = {
  /**
   * Log a CREATE action
   */
  async logCreate(params: {
    module: string;
    entityType: string;
    entityId: string;
    entityName: string;
    newData: Record<string, any>;
    subModule?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const userInfo = getCurrentUserInfo();

      await createEnhancedAuditLog(
        `Created ${params.entityType}`,
        'create',
        'data',
        params.module,
        params.entityType,
        params.entityId,
        userInfo.userId,
        userInfo.userName,
        userInfo.userRole,
        {
          entityName: params.entityName,
          subModule: params.subModule,
          afterData: params.newData,
          userEmail: userInfo.userEmail,
          metadata: params.metadata || {},
        }
      );
    } catch (error) {
      console.error('Audit log creation failed:', error);
      // Don't throw - audit logging should not block operations
    }
  },

  /**
   * Log an UPDATE action
   */
  async logUpdate(params: {
    module: string;
    entityType: string;
    entityId: string;
    entityName: string;
    oldData: Record<string, any>;
    newData: Record<string, any>;
    subModule?: string;
    significantFields?: string[];
    fieldLabels?: Record<string, string>;
    metadata?: Record<string, any>;
  }) {
    try {
      const userInfo = getCurrentUserInfo();

      await createEnhancedAuditLog(
        `Updated ${params.entityType}`,
        'update',
        'data',
        params.module,
        params.entityType,
        params.entityId,
        userInfo.userId,
        userInfo.userName,
        userInfo.userRole,
        {
          entityName: params.entityName,
          subModule: params.subModule,
          beforeData: params.oldData,
          afterData: params.newData,
          significantFields: params.significantFields,
          fieldLabels: params.fieldLabels,
          userEmail: userInfo.userEmail,
          metadata: params.metadata || {},
        }
      );
    } catch (error) {
      console.error('Audit log update failed:', error);
    }
  },

  /**
   * Log a DELETE action
   */
  async logDelete(params: {
    module: string;
    entityType: string;
    entityId: string;
    entityName: string;
    oldData: Record<string, any>;
    subModule?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const userInfo = getCurrentUserInfo();

      await createEnhancedAuditLog(
        `Deleted ${params.entityType}`,
        'delete',
        'data',
        params.module,
        params.entityType,
        params.entityId,
        userInfo.userId,
        userInfo.userName,
        userInfo.userRole,
        {
          entityName: params.entityName,
          subModule: params.subModule,
          beforeData: params.oldData,
          userEmail: userInfo.userEmail,
          metadata: params.metadata || {},
        }
      );
    } catch (error) {
      console.error('Audit log deletion failed:', error);
    }
  },

  /**
   * Log an APPROVAL action
   */
  async logApproval(params: {
    module: string;
    entityType: string;
    entityId: string;
    entityName: string;
    approvalStage: string;
    decision: 'approved' | 'rejected';
    comments?: string;
    oldStatus?: string;
    newStatus?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const userInfo = getCurrentUserInfo();

      await createEnhancedAuditLog(
        `${params.decision === 'approved' ? 'Approved' : 'Rejected'} ${params.entityType} - ${params.approvalStage}`,
        params.decision === 'approved' ? 'approve' : 'reject',
        'data',
        params.module,
        params.entityType,
        params.entityId,
        userInfo.userId,
        userInfo.userName,
        userInfo.userRole,
        {
          entityName: params.entityName,
          beforeData: params.oldStatus ? { status: params.oldStatus } : undefined,
          afterData: params.newStatus ? { status: params.newStatus } : undefined,
          userEmail: userInfo.userEmail,
          metadata: {
            ...(params.metadata || {}),
            approvalStage: params.approvalStage,
            decision: params.decision,
            comments: params.comments || '',
          },
        }
      );
    } catch (error) {
      console.error('Audit log approval failed:', error);
    }
  },

  /**
   * Log a STATUS CHANGE action
   */
  async logStatusChange(params: {
    module: string;
    entityType: string;
    entityId: string;
    entityName: string;
    oldStatus: string;
    newStatus: string;
    reason?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const userInfo = getCurrentUserInfo();

      await createEnhancedAuditLog(
        `Status changed from ${params.oldStatus} to ${params.newStatus}`,
        'update',
        'data',
        params.module,
        params.entityType,
        params.entityId,
        userInfo.userId,
        userInfo.userName,
        userInfo.userRole,
        {
          entityName: params.entityName,
          beforeData: { status: params.oldStatus },
          afterData: { status: params.newStatus },
          userEmail: userInfo.userEmail,
          metadata: {
            ...(params.metadata || {}),
            reason: params.reason || '',
          },
        }
      );
    } catch (error) {
      console.error('Audit log status change failed:', error);
    }
  },

  /**
   * Log a BULK action
   */
  async logBulkAction(params: {
    module: string;
    action: string;
    entityType: string;
    entityCount: number;
    actionType: 'create' | 'update' | 'delete' | 'bulk_operation';
    metadata?: Record<string, any>;
  }) {
    try {
      const userInfo = getCurrentUserInfo();

      await createEnhancedAuditLog(
        `Bulk ${params.action} - ${params.entityCount} ${params.entityType}(s)`,
        params.actionType === 'bulk_operation' ? 'execute' : params.actionType,
        'data',
        params.module,
        params.entityType,
        'bulk',
        userInfo.userId,
        userInfo.userName,
        userInfo.userRole,
        {
          entityName: `Bulk operation: ${params.entityCount} items`,
          userEmail: userInfo.userEmail,
          metadata: {
            ...(params.metadata || {}),
            entityCount: params.entityCount,
          },
        }
      );
    } catch (error) {
      console.error('Audit log bulk action failed:', error);
    }
  },

  /**
   * Log a CUSTOM action
   */
  async logCustom(params: {
    action: string;
    actionType: 'create' | 'read' | 'update' | 'delete' | 'execute' | 'approve' | 'reject' | 'export' | 'import';
    actionCategory: 'data' | 'security' | 'finance' | 'logistics' | 'project' | 'system';
    module: string;
    entityType: string;
    entityId: string;
    entityName: string;
    beforeSnapshot?: Record<string, any>;
    afterSnapshot?: Record<string, any>;
    subModule?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const userInfo = getCurrentUserInfo();

      await createEnhancedAuditLog(
        params.action,
        params.actionType,
        params.actionCategory,
        params.module,
        params.entityType,
        params.entityId,
        userInfo.userId,
        userInfo.userName,
        userInfo.userRole,
        {
          entityName: params.entityName,
          subModule: params.subModule,
          beforeData: params.beforeSnapshot,
          afterData: params.afterSnapshot,
          userEmail: userInfo.userEmail,
          metadata: params.metadata || {},
        }
      );
    } catch (error) {
      console.error('Audit log custom action failed:', error);
    }
  },
};

/**
 * Field labels untuk display yang lebih baik
 */
export const commonFieldLabels = {
  // Common fields
  id: 'ID',
  name: 'Name',
  description: 'Description',
  status: 'Status',
  createdAt: 'Created At',
  updatedAt: 'Updated At',
  createdBy: 'Created By',
  updatedBy: 'Updated By',
  
  // Procurement fields
  poNumber: 'PO Number',
  vendorId: 'Vendor ID',
  vendorName: 'Vendor Name',
  totalAmount: 'Total Amount',
  currency: 'Currency',
  deliveryDate: 'Delivery Date',
  paymentTerms: 'Payment Terms',
  
  // Logistics fields
  grNumber: 'GR Number',
  materialRequestNumber: 'MR Number',
  quantity: 'Quantity',
  unit: 'Unit',
  location: 'Location',
  warehouse: 'Warehouse',
  
  // Finance fields
  journalNumber: 'Journal Number',
  accountCode: 'Account Code',
  debit: 'Debit',
  credit: 'Credit',
  amount: 'Amount',
  transactionDate: 'Transaction Date',
};

/**
 * Significant fields untuk tracking perubahan penting
 */
export const significantFields = {
  procurement: ['status', 'totalAmount', 'vendorId', 'deliveryDate', 'approvalStatus'],
  logistics: ['status', 'quantity', 'location', 'receivedDate'],
  finance: ['status', 'amount', 'debit', 'credit', 'approvalStatus'],
  general: ['status', 'approvalStatus', 'isActive', 'isDeleted'],
};
