/**
 * Enhanced Audit Service
 * Day 4 - Advanced audit logging with before/after comparison
 */

import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import {
  EnhancedAuditLog,
  FieldChange,
  EnhancedAuditLogFilters,
  EnhancedAuditStatistics,
  AuditSearchResult,
  EntityAuditTimeline,
  AuditTimelineEntry,
} from '@/types/audit.enhanced';

// ============================================================================
// CHANGE TRACKING UTILITIES
// ============================================================================

/**
 * Compare two objects and generate detailed field changes
 */
export const generateFieldChanges = (
  oldData: Record<string, any>,
  newData: Record<string, any>,
  fieldLabels?: Record<string, string>,
  significantFields?: string[]
): FieldChange[] => {
  const changes: FieldChange[] = [];
  const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);

  allKeys.forEach((key) => {
    const oldValue = oldData?.[key];
    const newValue = newData?.[key];

    // Skip if values are the same
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
      return;
    }

    const fieldType = detectFieldType(newValue || oldValue);
    let changeType: 'added' | 'modified' | 'removed' = 'modified';

    if (oldValue === undefined || oldValue === null) {
      changeType = 'added';
    } else if (newValue === undefined || newValue === null) {
      changeType = 'removed';
    }

    changes.push({
      field: key,
      fieldLabel: fieldLabels?.[key] || formatFieldName(key),
      fieldType,
      oldValue,
      newValue,
      oldValueFormatted: formatValue(oldValue, fieldType),
      newValueFormatted: formatValue(newValue, fieldType),
      changeType,
      isSignificant: significantFields?.includes(key) || false,
    });
  });

  return changes;
};

/**
 * Detect field type from value
 */
const detectFieldType = (value: any): FieldChange['fieldType'] => {
  if (value === null || value === undefined) return 'string';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (value instanceof Date || value instanceof Timestamp) return 'date';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return 'string';
};

/**
 * Format field name from camelCase to readable text
 */
const formatFieldName = (fieldName: string): string => {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

/**
 * Format value for display
 */
const formatValue = (value: any, fieldType: FieldChange['fieldType']): string => {
  if (value === null || value === undefined) return 'N/A';

  switch (fieldType) {
    case 'date':
      if (value instanceof Timestamp) {
        return value.toDate().toLocaleString();
      }
      if (value instanceof Date) {
        return value.toLocaleString();
      }
      return String(value);

    case 'boolean':
      return value ? 'Yes' : 'No';

    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value);

    case 'array':
      return `[${value.length} items]`;

    case 'object':
      return JSON.stringify(value, null, 2).substring(0, 100) + '...';

    default:
      return String(value);
  }
};

/**
 * Generate change summary text
 */
const generateChangesSummary = (changes: FieldChange[]): string => {
  if (!changes || changes.length === 0) return 'No changes';

  const summaries: string[] = [];
  changes.slice(0, 3).forEach((change) => {
    if (change.changeType === 'added') {
      summaries.push(`Added ${change.fieldLabel}`);
    } else if (change.changeType === 'removed') {
      summaries.push(`Removed ${change.fieldLabel}`);
    } else {
      summaries.push(`Changed ${change.fieldLabel}`);
    }
  });

  if (changes.length > 3) {
    summaries.push(`and ${changes.length - 3} more`);
  }

  return summaries.join(', ');
};

// ============================================================================
// ENHANCED AUDIT LOG CREATION
// ============================================================================

export const createEnhancedAuditLog = async (
  action: string,
  actionType: EnhancedAuditLog['actionType'],
  actionCategory: EnhancedAuditLog['actionCategory'],
  module: string,
  entityType: string,
  entityId: string,
  userId: string,
  userName: string,
  userRole: string,
  options?: {
    entityName?: string;
    subModule?: string;
    parentEntityType?: string;
    parentEntityId?: string;
    beforeData?: Record<string, any>;
    afterData?: Record<string, any>;
    fieldLabels?: Record<string, string>;
    significantFields?: string[];
    projectId?: string;
    projectName?: string;
    sessionId?: string;
    requestId?: string;
    userEmail?: string;
    userDepartment?: string;
    userIp?: string;
    userAgent?: string;
    userLocation?: EnhancedAuditLog['userLocation'];
    status?: 'success' | 'failed' | 'partial';
    errorMessage?: string;
    errorCode?: string;
    warnings?: string[];
    impactLevel?: 'low' | 'medium' | 'high' | 'critical';
    affectedUsers?: string[];
    affectedEntities?: Array<{ entityType: string; entityId: string; entityName?: string }>;
    isCompliant?: boolean;
    complianceNotes?: string;
    requiresReview?: boolean;
    metadata?: Record<string, any>;
    tags?: string[];
    executionTimeMs?: number;
  }
): Promise<string> => {
  const now = Timestamp.now();

  // Generate field changes if before/after data provided
  let changes: FieldChange[] | undefined;
  let changesSummary: string | undefined;

  if (options?.beforeData && options?.afterData) {
    changes = generateFieldChanges(
      options.beforeData,
      options.afterData,
      options.fieldLabels,
      options.significantFields
    );
    changesSummary = generateChangesSummary(changes);
  }

  // Determine impact level if not provided
  const impactLevel = options?.impactLevel || determineImpactLevel(actionType, changes);

  const auditData: Omit<EnhancedAuditLog, 'id'> = {
    // Action details
    action,
    actionType,
    actionCategory,
    module,
    subModule: options?.subModule,

    // Entity
    entityType,
    entityId,
    entityName: options?.entityName,
    parentEntityType: options?.parentEntityType,
    parentEntityId: options?.parentEntityId,

    // Changes
    changes,
    changesSummary,
    beforeSnapshot: options?.beforeData,
    afterSnapshot: options?.afterData,

    // User
    userId,
    userName,
    userEmail: options?.userEmail,
    userRole,
    userDepartment: options?.userDepartment,
    userIp: options?.userIp,
    userAgent: options?.userAgent,
    userLocation: options?.userLocation,

    // Context
    projectId: options?.projectId,
    projectName: options?.projectName,
    sessionId: options?.sessionId,
    requestId: options?.requestId,

    // Result
    status: options?.status || 'success',
    errorMessage: options?.errorMessage,
    errorCode: options?.errorCode,
    warnings: options?.warnings,

    // Impact
    impactLevel,
    affectedUsers: options?.affectedUsers,
    affectedEntities: options?.affectedEntities,

    // Compliance
    isCompliant: options?.isCompliant !== false,
    complianceNotes: options?.complianceNotes,
    requiresReview: options?.requiresReview || impactLevel === 'critical',

    // Metadata
    metadata: options?.metadata,
    tags: options?.tags,

    // Performance
    executionTimeMs: options?.executionTimeMs,

    // Timestamps
    timestamp: now,
    createdAt: now,
  };

  const docRef = await addDoc(collection(db, 'enhancedAuditLogs'), auditData);
  return docRef.id;
};

/**
 * Determine impact level based on action type and changes
 */
const determineImpactLevel = (
  actionType: EnhancedAuditLog['actionType'],
  changes?: FieldChange[]
): 'low' | 'medium' | 'high' | 'critical' => {
  // Critical actions
  if (actionType === 'delete') return 'critical';
  if (actionType === 'approve' || actionType === 'reject') return 'high';

  // Check for significant field changes
  if (changes && changes.some((c) => c.isSignificant)) {
    return 'high';
  }

  // Medium for updates with many changes
  if (actionType === 'update' && changes && changes.length > 5) {
    return 'medium';
  }

  return 'low';
};

// ============================================================================
// ENHANCED AUDIT LOG QUERIES
// ============================================================================

export const getEnhancedAuditLogs = async (
  filters?: EnhancedAuditLogFilters,
  limitCount: number = 100,
  lastDoc?: QueryDocumentSnapshot
): Promise<AuditSearchResult> => {
  let q = query(
    collection(db, 'enhancedAuditLogs'),
    orderBy('timestamp', 'desc'),
    firestoreLimit(limitCount + 1) // Get one extra to check if there are more
  );

  // Apply filters
  if (filters?.userId) {
    q = query(q, where('userId', '==', filters.userId));
  }

  if (filters?.userRole) {
    q = query(q, where('userRole', '==', filters.userRole));
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
    if (Array.isArray(filters.actionType)) {
      q = query(q, where('actionType', 'in', filters.actionType));
    } else {
      q = query(q, where('actionType', '==', filters.actionType));
    }
  }

  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }

  if (filters?.projectId) {
    q = query(q, where('projectId', '==', filters.projectId));
  }

  if (filters?.impactLevel) {
    q = query(q, where('impactLevel', '==', filters.impactLevel));
  }

  if (filters?.actionCategory) {
    q = query(q, where('actionCategory', '==', filters.actionCategory));
  }

  if (filters?.requiresReview !== undefined) {
    q = query(q, where('requiresReview', '==', filters.requiresReview));
  }

  if (filters?.startDate) {
    q = query(q, where('timestamp', '>=', filters.startDate));
  }

  if (filters?.endDate) {
    q = query(q, where('timestamp', '<=', filters.endDate));
  }

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const docs = snapshot.docs;

  // Check if there are more results
  const hasMore = docs.length > limitCount;
  const resultDocs = hasMore ? docs.slice(0, limitCount) : docs;

  const logs = resultDocs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as EnhancedAuditLog
  );

  return {
    logs,
    totalCount: logs.length,
    pageSize: limitCount,
    currentPage: 1,
    totalPages: 1,
    hasMore,
  };
};

/**
 * Get entity audit timeline with all changes
 */
export const getEntityAuditTimeline = async (
  entityType: string,
  entityId: string,
  limitCount: number = 100
): Promise<EntityAuditTimeline> => {
  const result = await getEnhancedAuditLogs(
    { entityType, entityId },
    limitCount
  );

  const timeline: AuditTimelineEntry[] = result.logs.map((log) => ({
    timestamp: log.timestamp.toDate(),
    action: log.action,
    user: {
      id: log.userId,
      name: log.userName,
      role: log.userRole,
    },
    changes: log.changes || [],
    status: log.status,
    impactLevel: log.impactLevel,
  }));

  // Calculate summary
  const contributorsMap = new Map<string, { userName: string; changeCount: number }>();
  let totalChanges = 0;

  result.logs.forEach((log) => {
    const changeCount = log.changes?.length || 0;
    totalChanges += changeCount;

    const existing = contributorsMap.get(log.userId);
    if (existing) {
      existing.changeCount += changeCount;
    } else {
      contributorsMap.set(log.userId, {
        userName: log.userName,
        changeCount,
      });
    }
  });

  const contributors = Array.from(contributorsMap.entries()).map(([userId, data]) => ({
    userId,
    userName: data.userName,
    changeCount: data.changeCount,
  }));

  const timestamps = result.logs.map((log) => log.timestamp.toDate());

  return {
    entityType,
    entityId,
    entityName: result.logs[0]?.entityName,
    timeline,
    summary: {
      totalChanges,
      contributors,
      firstChange: timestamps.length > 0 ? timestamps[timestamps.length - 1] : new Date(),
      lastChange: timestamps.length > 0 ? timestamps[0] : new Date(),
    },
  };
};

// ============================================================================
// AUDIT STATISTICS
// ============================================================================

export const getEnhancedAuditStatistics = async (
  filters?: EnhancedAuditLogFilters
): Promise<EnhancedAuditStatistics> => {
  const result = await getEnhancedAuditLogs(filters, 10000); // Large limit for statistics
  const logs = result.logs;

  // Calculate statistics
  const totalActions = logs.length;
  const successfulActions = logs.filter((log) => log.status === 'success').length;
  const failedActions = logs.filter((log) => log.status === 'failed').length;
  const partialActions = logs.filter((log) => log.status === 'partial').length;

  // Group by different dimensions
  const actionsByModule: Record<string, number> = {};
  const actionsByType: Record<string, number> = {};
  const actionsByCategory: Record<string, number> = {};
  const actionsByImpactLevel: Record<string, number> = {};
  const actionsByStatus: Record<string, number> = {};
  const userActionCounts: Record<string, any> = {};
  const entityModificationCounts: Record<string, any> = {};

  logs.forEach((log) => {
    actionsByModule[log.module] = (actionsByModule[log.module] || 0) + 1;
    actionsByType[log.actionType] = (actionsByType[log.actionType] || 0) + 1;
    actionsByCategory[log.actionCategory] = (actionsByCategory[log.actionCategory] || 0) + 1;
    actionsByImpactLevel[log.impactLevel] = (actionsByImpactLevel[log.impactLevel] || 0) + 1;
    actionsByStatus[log.status] = (actionsByStatus[log.status] || 0) + 1;

    // User activity
    if (!userActionCounts[log.userId]) {
      userActionCounts[log.userId] = {
        userId: log.userId,
        userName: log.userName,
        userRole: log.userRole,
        actionCount: 0,
        lastActivity: log.timestamp.toDate(),
      };
    }
    userActionCounts[log.userId].actionCount++;
    if (log.timestamp.toDate() > userActionCounts[log.userId].lastActivity) {
      userActionCounts[log.userId].lastActivity = log.timestamp.toDate();
    }

    // Entity modifications
    const entityKey = `${log.entityType}-${log.entityId}`;
    if (!entityModificationCounts[entityKey]) {
      entityModificationCounts[entityKey] = {
        entityType: log.entityType,
        entityId: log.entityId,
        entityName: log.entityName,
        modificationCount: 0,
      };
    }
    entityModificationCounts[entityKey].modificationCount++;
  });

  const mostActiveUsers = Object.values(userActionCounts)
    .sort((a: any, b: any) => b.actionCount - a.actionCount)
    .slice(0, 10);

  const mostModifiedEntities = Object.values(entityModificationCounts)
    .sort((a: any, b: any) => b.modificationCount - a.modificationCount)
    .slice(0, 10);

  // Calculate compliance rate
  const compliantCount = logs.filter((log) => log.isCompliant).length;
  const complianceRate = totalActions > 0 ? (compliantCount / totalActions) * 100 : 100;
  const itemsRequiringReview = logs.filter((log) => log.requiresReview).length;

  // Calculate average execution time
  const logsWithExecutionTime = logs.filter((log) => log.executionTimeMs !== undefined);
  const averageExecutionTime =
    logsWithExecutionTime.length > 0
      ? logsWithExecutionTime.reduce((sum, log) => sum + (log.executionTimeMs || 0), 0) /
        logsWithExecutionTime.length
      : 0;

  const slowestActions = logs
    .filter((log) => log.executionTimeMs !== undefined)
    .sort((a, b) => (b.executionTimeMs || 0) - (a.executionTimeMs || 0))
    .slice(0, 10)
    .map((log) => ({
      id: log.id,
      action: log.action,
      executionTime: log.executionTimeMs || 0,
    }));

  // Action trend (last 7 days)
  const actionTrend = generateActionTrend(logs, 7);

  return {
    totalActions,
    successfulActions,
    failedActions,
    partialActions,
    actionsByModule,
    actionsByType,
    actionsByCategory,
    actionsByImpactLevel,
    actionsByStatus,
    mostActiveUsers,
    mostModifiedEntities,
    actionTrend,
    complianceRate,
    itemsRequiringReview,
    averageExecutionTime,
    slowestActions,
    recentActivity: logs.slice(0, 20),
  };
};

/**
 * Generate action trend for the last N days
 */
const generateActionTrend = (logs: EnhancedAuditLog[], days: number) => {
  const trend: Array<{ date: string; count: number }> = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const count = logs.filter((log) => {
      const logDate = log.timestamp.toDate();
      return logDate >= date && logDate < nextDate;
    }).length;

    trend.push({
      date: date.toISOString().split('T')[0],
      count,
    });
  }

  return trend;
};
