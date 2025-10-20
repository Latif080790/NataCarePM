import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import {
  AuditLog,
  CreateAuditLogInput,
  AuditLogFilters
} from '@/types/automation';

// ============================================================================
// AUDIT LOG CREATION
// ============================================================================

export const createAuditLog = async (
  input: CreateAuditLogInput,
  userId: string,
  userName: string,
  userRole: string,
  userIp?: string,
  sessionId?: string
): Promise<string> => {
  const auditData: Omit<AuditLog, 'id'> = {
    action: input.action,
    actionType: input.actionType,
    module: input.module,
    entityType: input.entityType,
    entityId: input.entityId,
    entityName: input.entityName,
    changes: input.changes,
    userId,
    userName,
    userRole,
    userIp,
    projectId: input.projectId,
    sessionId,
    status: input.status,
    errorMessage: input.errorMessage,
    metadata: input.metadata,
    timestamp: Timestamp.now()
  };

  const docRef = await addDoc(collection(db, 'auditLogs'), auditData);
  return docRef.id;
};

// ============================================================================
// AUDIT LOG QUERIES
// ============================================================================

export const getAuditLogs = async (
  filters?: AuditLogFilters,
  limitCount: number = 100
): Promise<AuditLog[]> => {
  let q = query(
    collection(db, 'auditLogs'),
    orderBy('timestamp', 'desc'),
    firestoreLimit(limitCount)
  );

  if (filters?.userId) {
    q = query(q, where('userId', '==', filters.userId));
  }

  if (filters?.module) {
    q = query(q, where('module', '==', filters.module));
  }

  if (filters?.entityType) {
    q = query(q, where('entityType', '==', filters.entityType));
  }

  if (filters?.entityId) {
    q = query(q, where('entityId', '==', filters.entityId));
  }

  if (filters?.actionType) {
    q = query(q, where('actionType', '==', filters.actionType));
  }

  if (filters?.projectId) {
    q = query(q, where('projectId', '==', filters.projectId));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as AuditLog));
};

export const getEntityAuditTrail = async (
  entityType: string,
  entityId: string,
  limitCount: number = 50
): Promise<AuditLog[]> => {
  const q = query(
    collection(db, 'auditLogs'),
    where('entityType', '==', entityType),
    where('entityId', '==', entityId),
    orderBy('timestamp', 'desc'),
    firestoreLimit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as AuditLog));
};

export const getUserActivityLog = async (
  userId: string,
  startDate?: Timestamp,
  endDate?: Timestamp,
  limitCount: number = 100
): Promise<AuditLog[]> => {
  let q = query(
    collection(db, 'auditLogs'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc'),
    firestoreLimit(limitCount)
  );

  if (startDate && endDate) {
    q = query(q, where('timestamp', '>=', startDate), where('timestamp', '<=', endDate));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as AuditLog));
};

// ============================================================================
// SPECIALIZED AUDIT LOGGING
// ============================================================================

export const logPOCreation = async (
  poId: string,
  poNumber: string,
  poData: any,
  userId: string,
  userName: string,
  userRole: string,
  projectId?: string
): Promise<string> => {
  return await createAuditLog(
    {
      action: 'Purchase Order Created',
      actionType: 'create',
      module: 'procurement',
      entityType: 'purchase_order',
      entityId: poId,
      entityName: poNumber,
      projectId,
      status: 'success',
      metadata: {
        vendorName: poData.vendorName,
        totalAmount: poData.totalAmount,
        itemCount: poData.items?.length || 0
      }
    },
    userId,
    userName,
    userRole
  );
};

export const logPOApproval = async (
  poId: string,
  poNumber: string,
  approvalStage: string,
  userId: string,
  userName: string,
  userRole: string,
  projectId?: string
): Promise<string> => {
  return await createAuditLog(
    {
      action: `Purchase Order Approved - ${approvalStage}`,
      actionType: 'approve',
      module: 'procurement',
      entityType: 'purchase_order',
      entityId: poId,
      entityName: poNumber,
      projectId,
      status: 'success',
      metadata: {
        approvalStage,
        approver: userName
      }
    },
    userId,
    userName,
    userRole
  );
};

export const logGRCreation = async (
  grId: string,
  grNumber: string,
  grData: any,
  userId: string,
  userName: string,
  userRole: string,
  projectId?: string
): Promise<string> => {
  return await createAuditLog(
    {
      action: 'Goods Receipt Created',
      actionType: 'create',
      module: 'logistics',
      entityType: 'goods_receipt',
      entityId: grId,
      entityName: grNumber,
      projectId,
      status: 'success',
      metadata: {
        poNumber: grData.poNumber,
        receivedItems: grData.items?.length || 0,
        totalValue: grData.totalValue
      }
    },
    userId,
    userName,
    userRole
  );
};

export const logMRApproval = async (
  mrId: string,
  mrNumber: string,
  approvalStage: string,
  userId: string,
  userName: string,
  userRole: string,
  projectId?: string
): Promise<string> => {
  return await createAuditLog(
    {
      action: `Material Request Approved - ${approvalStage}`,
      actionType: 'approve',
      module: 'procurement',
      entityType: 'material_request',
      entityId: mrId,
      entityName: mrNumber,
      projectId,
      status: 'success',
      metadata: {
        approvalStage,
        approver: userName
      }
    },
    userId,
    userName,
    userRole
  );
};

export const logInventoryTransaction = async (
  transactionId: string,
  transactionCode: string,
  transactionType: string,
  items: any[],
  userId: string,
  userName: string,
  userRole: string,
  projectId?: string
): Promise<string> => {
  return await createAuditLog(
    {
      action: `Inventory Transaction - ${transactionType}`,
      actionType: 'create',
      module: 'inventory',
      entityType: 'inventory_transaction',
      entityId: transactionId,
      entityName: transactionCode,
      projectId,
      status: 'success',
      metadata: {
        transactionType,
        itemCount: items.length,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0)
      }
    },
    userId,
    userName,
    userRole
  );
};

export const logVendorEvaluation = async (
  vendorId: string,
  vendorName: string,
  evaluationData: any,
  userId: string,
  userName: string,
  userRole: string
): Promise<string> => {
  return await createAuditLog(
    {
      action: 'Vendor Evaluated',
      actionType: 'update',
      module: 'vendor',
      entityType: 'vendor',
      entityId: vendorId,
      entityName: vendorName,
      status: 'success',
      metadata: {
        overallScore: evaluationData.overallScore,
        rating: evaluationData.rating,
        evaluator: userName
      }
    },
    userId,
    userName,
    userRole
  );
};

export const logWBSBudgetUpdate = async (
  wbsId: string,
  wbsCode: string,
  oldBudget: number,
  newBudget: number,
  userId: string,
  userName: string,
  userRole: string,
  projectId?: string
): Promise<string> => {
  return await createAuditLog(
    {
      action: 'WBS Budget Updated',
      actionType: 'update',
      module: 'finance',
      entityType: 'wbs',
      entityId: wbsId,
      entityName: wbsCode,
      changes: [
        {
          field: 'budget',
          oldValue: oldBudget,
          newValue: newBudget
        }
      ],
      projectId,
      status: 'success',
      metadata: {
        variance: newBudget - oldBudget,
        variancePercent: ((newBudget - oldBudget) / oldBudget) * 100
      }
    },
    userId,
    userName,
    userRole
  );
};

export const logProgressUpdate = async (
  activityId: string,
  activityName: string,
  oldProgress: number,
  newProgress: number,
  userId: string,
  userName: string,
  userRole: string,
  projectId?: string
): Promise<string> => {
  return await createAuditLog(
    {
      action: 'Progress Updated',
      actionType: 'update',
      module: 'project',
      entityType: 'activity',
      entityId: activityId,
      entityName: activityName,
      changes: [
        {
          field: 'progress',
          oldValue: oldProgress,
          newValue: newProgress
        }
      ],
      projectId,
      status: 'success',
      metadata: {
        progressChange: newProgress - oldProgress,
        updatedBy: userName
      }
    },
    userId,
    userName,
    userRole
  );
};

export const logAutomationExecution = async (
  automationId: string,
  automationName: string,
  trigger: string,
  status: 'success' | 'failed',
  errorMessage?: string,
  projectId?: string
): Promise<string> => {
  return await createAuditLog(
    {
      action: `Automation Executed - ${automationName}`,
      actionType: 'execute',
      module: 'automation',
      entityType: 'automation_rule',
      entityId: automationId,
      entityName: automationName,
      projectId,
      status,
      errorMessage,
      metadata: {
        trigger,
        executedAt: new Date().toISOString()
      }
    },
    'system',
    'System',
    'system'
  );
};

// ============================================================================
// AUDIT ANALYTICS
// ============================================================================

export interface AuditStatistics {
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  actionsByModule: Record<string, number>;
  actionsByType: Record<string, number>;
  mostActiveUsers: Array<{
    userId: string;
    userName: string;
    actionCount: number;
  }>;
  recentActivity: AuditLog[];
}

export const getAuditStatistics = async (
  startDate: Timestamp,
  endDate: Timestamp,
  projectId?: string
): Promise<AuditStatistics> => {
  let q = query(
    collection(db, 'auditLogs'),
    where('timestamp', '>=', startDate),
    where('timestamp', '<=', endDate)
  );

  if (projectId) {
    q = query(q, where('projectId', '==', projectId));
  }

  const snapshot = await getDocs(q);
  const logs = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as AuditLog));

  const totalActions = logs.length;
  const successfulActions = logs.filter(log => log.status === 'success').length;
  const failedActions = logs.filter(log => log.status === 'failed').length;

  const actionsByModule: Record<string, number> = {};
  const actionsByType: Record<string, number> = {};
  const userActionCounts: Record<string, { userName: string; count: number }> = {};

  logs.forEach(log => {
    // By module
    actionsByModule[log.module] = (actionsByModule[log.module] || 0) + 1;

    // By type
    actionsByType[log.actionType] = (actionsByType[log.actionType] || 0) + 1;

    // By user
    if (!userActionCounts[log.userId]) {
      userActionCounts[log.userId] = {
        userName: log.userName,
        count: 0
      };
    }
    userActionCounts[log.userId].count++;
  });

  const mostActiveUsers = Object.entries(userActionCounts)
    .map(([userId, data]) => ({
      userId,
      userName: data.userName,
      actionCount: data.count
    }))
    .sort((a, b) => b.actionCount - a.actionCount)
    .slice(0, 10);

  const recentActivity = logs.slice(0, 20);

  return {
    totalActions,
    successfulActions,
    failedActions,
    actionsByModule,
    actionsByType,
    mostActiveUsers,
    recentActivity
  };
};

// ============================================================================
// COMPLIANCE & REPORTING
// ============================================================================

export const generateComplianceReport = async (
  startDate: Timestamp,
  endDate: Timestamp,
  projectId?: string
): Promise<{
  period: { start: Date; end: Date };
  totalActions: number;
  criticalActions: number;
  failedActions: number;
  userActivity: Array<{
    userId: string;
    userName: string;
    userRole: string;
    actionCount: number;
    lastActivity: Date;
  }>;
  moduleActivity: Record<string, number>;
  anomalies: AuditLog[];
}> => {
  const logs = await getAuditLogs(
    {
      startDate,
      endDate,
      projectId
    },
    10000 // High limit for comprehensive report
  );

  const userActivity: Record<string, any> = {};
  const moduleActivity: Record<string, number> = {};
  const criticalActionTypes = ['delete', 'approve', 'reject'];
  const anomalies: AuditLog[] = [];

  logs.forEach(log => {
    // User activity tracking
    if (!userActivity[log.userId]) {
      userActivity[log.userId] = {
        userId: log.userId,
        userName: log.userName,
        userRole: log.userRole,
        actionCount: 0,
        lastActivity: log.timestamp.toDate()
      };
    }
    userActivity[log.userId].actionCount++;
    if (log.timestamp.toDate() > userActivity[log.userId].lastActivity) {
      userActivity[log.userId].lastActivity = log.timestamp.toDate();
    }

    // Module activity
    moduleActivity[log.module] = (moduleActivity[log.module] || 0) + 1;

    // Detect anomalies (failed critical actions)
    if (log.status === 'failed' && criticalActionTypes.includes(log.actionType)) {
      anomalies.push(log);
    }
  });

  const criticalActions = logs.filter(log => 
    criticalActionTypes.includes(log.actionType)
  ).length;

  const failedActions = logs.filter(log => log.status === 'failed').length;

  return {
    period: {
      start: startDate.toDate(),
      end: endDate.toDate()
    },
    totalActions: logs.length,
    criticalActions,
    failedActions,
    userActivity: Object.values(userActivity),
    moduleActivity,
    anomalies
  };
};

// ============================================================================
// CLEANUP
// ============================================================================

export const archiveOldAuditLogs = async (daysOld: number): Promise<number> => {
  const cutoffDate = Timestamp.fromMillis(
    Date.now() - (daysOld * 24 * 60 * 60 * 1000)
  );

  const q = query(
    collection(db, 'auditLogs'),
    where('timestamp', '<=', cutoffDate)
  );

  const snapshot = await getDocs(q);
  
  // In production, you would move these to an archive collection
  // or export to long-term storage before deleting
  
  return snapshot.size;
};
