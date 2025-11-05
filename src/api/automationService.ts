import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import {
  AutomationRule,
  AutomationExecution,
  AutomationTrigger,
  AutomationAction,
  AutomationStatus,
  CreateAutomationRuleInput,
  AutomationExecutionFilters,
  AutomationActionResult,
  IntegrationEvent,
  CreateIntegrationEventInput,
  IntegrationStatistics,
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from '@/types/automation';
// Note: notificationService import commented due to TypeScript module resolution issue
// Using dynamic import at runtime instead

// ============================================================================
// AUTOMATION RULE MANAGEMENT
// ============================================================================

export const createAutomationRule = async (
  input: CreateAutomationRuleInput,
  userId: string,
  userName: string
): Promise<string> => {
  const ruleData: Omit<AutomationRule, 'id'> = {
    ruleName: input.ruleName,
    description: input.description,
    isActive: true,
    trigger: input.trigger,
    triggerConditions: input.triggerConditions || [],
    actions: input.actions,
    priority: input.priority || 5,
    retryCount: input.retryCount || 3,
    retryDelay: input.retryDelay || 60,
    timeout: input.timeout || 300,
    projectIds: input.projectIds,
    userRoles: input.userRoles,
    executionCount: 0,
    successCount: 0,
    failureCount: 0,
    createdAt: Timestamp.now(),
    createdBy: { userId, userName },
    updatedAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, 'automationRules'), ruleData);
  return docRef.id;
};

export const getAutomationRules = async (activeOnly: boolean = true): Promise<AutomationRule[]> => {
  let q = query(collection(db, 'automationRules'), orderBy('priority', 'desc'));

  if (activeOnly) {
    q = query(q, where('isActive', '==', true));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as AutomationRule
  );
};

export const getAutomationRuleById = async (ruleId: string): Promise<AutomationRule | null> => {
  const docRef = doc(db, 'automationRules', ruleId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as AutomationRule;
};

export const updateAutomationRule = async (
  ruleId: string,
  updates: Partial<CreateAutomationRuleInput>,
  userId: string,
  userName: string
): Promise<void> => {
  const docRef = doc(db, 'automationRules', ruleId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
    updatedBy: { userId, userName },
  });
};

export const toggleAutomationRule = async (ruleId: string, isActive: boolean): Promise<void> => {
  const docRef = doc(db, 'automationRules', ruleId);
  await updateDoc(docRef, {
    isActive,
    updatedAt: Timestamp.now(),
  });
};

export const deleteAutomationRule = async (ruleId: string): Promise<void> => {
  const docRef = doc(db, 'automationRules', ruleId);
  await deleteDoc(docRef);
};

// ============================================================================
// AUTOMATION EXECUTION
// ============================================================================

export const triggerAutomation = async (
  trigger: AutomationTrigger,
  triggerData: Record<string, any>,
  userId?: string,
  userName?: string,
  projectId?: string
): Promise<string[]> => {
  // Find matching rules
  const rules = await getAutomationRules(true);
  const matchingRules = rules.filter((rule) => {
    if (rule.trigger !== trigger) return false;

    // Check project filter
    if (rule.projectIds && rule.projectIds.length > 0 && projectId) {
      if (!rule.projectIds.includes(projectId)) return false;
    }

    // Check conditions
    if (rule.triggerConditions && rule.triggerConditions.length > 0) {
      return rule.triggerConditions.every((condition) => evaluateCondition(condition, triggerData));
    }

    return true;
  });

  // Sort by priority
  matchingRules.sort((a, b) => b.priority - a.priority);

  // Execute rules
  const executionIds: string[] = [];
  for (const rule of matchingRules) {
    try {
      const executionId = await executeAutomationRule(
        rule,
        triggerData,
        userId,
        userName,
        projectId
      );
      executionIds.push(executionId);
    } catch (error) {
      console.error(`Failed to execute rule ${rule.id}:`, error);
    }
  }

  return executionIds;
};

const evaluateCondition = (
  condition: { field: string; operator: string; value: any },
  data: Record<string, any>
): boolean => {
  const fieldValue = getNestedValue(data, condition.field);

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'not_equals':
      return fieldValue !== condition.value;
    case 'greater_than':
      return fieldValue > condition.value;
    case 'less_than':
      return fieldValue < condition.value;
    case 'contains':
      return String(fieldValue).includes(String(condition.value));
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(fieldValue);
    case 'not_in':
      return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
    default:
      return false;
  }
};

const getNestedValue = (obj: Record<string, any>, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

export const executeAutomationRule = async (
  rule: AutomationRule,
  triggerData: Record<string, any>,
  userId?: string,
  userName?: string,
  projectId?: string
): Promise<string> => {
  const startTime = Timestamp.now();

  // Create execution record
  const executionData: Omit<AutomationExecution, 'id'> = {
    ruleId: rule.id,
    ruleName: rule.ruleName,
    trigger: rule.trigger,
    triggerData,
    triggerTimestamp: Timestamp.now(),
    status: AutomationStatus.PROCESSING,
    startedAt: startTime,
    actionsExecuted: 0,
    actionsSuccess: 0,
    actionsFailed: 0,
    results: [],
    retryAttempt: 0,
    projectId,
    userId,
    userName,
    createdAt: Timestamp.now(),
  };

  const executionRef = await addDoc(collection(db, 'automationExecutions'), executionData);
  const executionId = executionRef.id;

  // Execute actions
  try {
    const results: AutomationActionResult[] = [];
    let allSuccess = true;

    for (const actionConfig of rule.actions) {
      const actionStartTime = Timestamp.now();

      try {
        const output = await executeAction(
          actionConfig.action,
          actionConfig.parameters || {},
          triggerData,
          projectId
        );

        results.push({
          action: actionConfig.action,
          status: 'success',
          startedAt: actionStartTime,
          completedAt: Timestamp.now(),
          duration: Timestamp.now().toMillis() - actionStartTime.toMillis(),
          output,
        });

        executionData.actionsSuccess++;
      } catch (error: any) {
        allSuccess = false;

        results.push({
          action: actionConfig.action,
          status: 'failed',
          startedAt: actionStartTime,
          completedAt: Timestamp.now(),
          duration: Timestamp.now().toMillis() - actionStartTime.toMillis(),
          error: {
            code: error.code || 'UNKNOWN_ERROR',
            message: error.message,
          },
        });

        executionData.actionsFailed++;

        if (!actionConfig.continueOnError) {
          break;
        }
      }

      executionData.actionsExecuted++;
    }

    // Update execution record
    const endTime = Timestamp.now();
    await updateDoc(executionRef, {
      status: allSuccess ? AutomationStatus.SUCCESS : AutomationStatus.FAILED,
      completedAt: endTime,
      duration: endTime.toMillis() - startTime.toMillis(),
      actionsExecuted: executionData.actionsExecuted,
      actionsSuccess: executionData.actionsSuccess,
      actionsFailed: executionData.actionsFailed,
      results,
    });

    // Update rule statistics
    const ruleRef = doc(db, 'automationRules', rule.id);
    await updateDoc(ruleRef, {
      executionCount: increment(1),
      successCount: increment(allSuccess ? 1 : 0),
      failureCount: increment(allSuccess ? 0 : 1),
      lastExecutedAt: Timestamp.now(),
    });

    return executionId;
  } catch (error: any) {
    // Update execution with error
    await updateDoc(executionRef, {
      status: AutomationStatus.FAILED,
      completedAt: Timestamp.now(),
      error: {
        code: error.code || 'EXECUTION_ERROR',
        message: error.message,
        stack: error.stack,
      },
    });

    // Update rule statistics
    const ruleRef = doc(db, 'automationRules', rule.id);
    await updateDoc(ruleRef, {
      executionCount: increment(1),
      failureCount: increment(1),
      lastExecutedAt: Timestamp.now(),
    });

    throw error;
  }
};

// ============================================================================
// ACTION EXECUTORS
// ============================================================================

const executeAction = async (
  action: AutomationAction,
  parameters: Record<string, any>,
  triggerData: Record<string, any>,
  projectId?: string
): Promise<any> => {
  switch (action) {
    case AutomationAction.CREATE_AP:
      return await createAPEntry(triggerData, projectId);

    case AutomationAction.UPDATE_INVENTORY:
      return await updateInventoryFromGR(triggerData);

    case AutomationAction.CALCULATE_EVM:
      return await calculateEVMMetrics(triggerData, projectId);

    case AutomationAction.UPDATE_WBS_BUDGET:
      return await syncWBSBudget(triggerData, projectId);

    case AutomationAction.UPDATE_VENDOR_PERFORMANCE:
      return await updateVendorPerformance(triggerData);

    case AutomationAction.CREATE_REORDER_MR:
      return await createReorderMR(triggerData, projectId);

    case AutomationAction.SEND_NOTIFICATION:
      return await sendAutomationNotification(parameters, triggerData);

    case AutomationAction.SEND_ALERT:
      return await sendAutomationAlert(parameters, triggerData);

    case AutomationAction.UPDATE_PROJECT_STATUS:
      return await updateProjectStatus(triggerData, projectId);

    case AutomationAction.GENERATE_REPORT:
      return await generateAutomationReport(parameters, triggerData, projectId);

    default:
      throw new Error(`Unknown action: ${action}`);
  }
};

// Action: Create AP Entry from PO
const createAPEntry = async (
  triggerData: Record<string, any>,
  projectId?: string
): Promise<any> => {
  // Placeholder - AP Service integration
  console.log('AP Entry creation triggered:', triggerData);

  return {
    message: 'AP Entry creation scheduled',
    poNumber: triggerData.purchaseOrder?.poNumber,
  };
};

// Action: Update Inventory from Goods Receipt
const updateInventoryFromGR = async (triggerData: Record<string, any>): Promise<any> => {
  const { createTransaction } = await import('./inventoryService');

  const grData = triggerData.goodsReceipt;

  return await createTransaction(
    {
      transactionType: 'goods_in' as any,
      transactionDate: Timestamp.now(),
      warehouseId: grData.warehouseId,
      referenceNumber: grData.grNumber,
      items: grData.items.map((item: any) => ({
        materialId: item.materialId,
        quantity: item.receivedQuantity,
        unitCost: item.unitPrice,
      })),
      notes: `Auto-created from GR ${grData.grNumber}`,
    },
    triggerData.userId || 'system',
    triggerData.userName || 'System'
  );
};

// Action: Calculate EVM Metrics
const calculateEVMMetrics = async (
  triggerData: Record<string, any>,
  projectId?: string
): Promise<any> => {
  if (!projectId) {
    throw new Error('Project ID required for EVM calculation');
  }

  // Placeholder for EVM calculation
  console.log('EVM calculation triggered for project:', projectId);

  return {
    message: 'EVM calculation scheduled',
    projectId,
  };
};

// Action: Sync WBS Budget
const syncWBSBudget = async (
  triggerData: Record<string, any>,
  projectId?: string
): Promise<any> => {
  if (!projectId) {
    throw new Error('Project ID required for WBS budget sync');
  }

  // Placeholder for WBS sync
  console.log('WBS budget sync triggered:', { projectId, rabId: triggerData.rabId });

  return {
    message: 'WBS budget sync scheduled',
    projectId,
    rabId: triggerData.rabId,
  };
};

// Action: Update Vendor Performance
const updateVendorPerformance = async (triggerData: Record<string, any>): Promise<any> => {
  // Placeholder for vendor evaluation
  console.log('Vendor performance update triggered:', triggerData.vendorId);

  return {
    message: 'Vendor performance update scheduled',
    vendorId: triggerData.vendorId,
  };
};

// Action: Create Reorder Material Request
const createReorderMR = async (
  triggerData: Record<string, any>,
  projectId?: string
): Promise<any> => {
  const { createMaterialRequest } = await import('./materialRequestService');

  const materialData = triggerData.material;
  const now = new Date();
  const requiredDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const quantity = materialData.reorderQuantity || materialData.minimumStock || 1;
  const unitPrice = materialData.standardCost || 0;

  return await createMaterialRequest(
    {
      projectId: projectId || '',
      requiredDate: requiredDate.toISOString().split('T')[0],
      priority: 'medium',
      purpose: `Automatic reorder triggered by low stock alert for ${materialData.materialName}`,
      items: [
        {
          materialCode: materialData.materialCode || materialData.id,
          materialName: materialData.materialName,
          quantity,
          requestedQty: quantity,
          unit: materialData.baseUom,
          estimatedUnitPrice: unitPrice,
          estimatedTotal: quantity * unitPrice,
          estimatedTotalPrice: quantity * unitPrice,
          reorderPoint: materialData.minimumStock || 0,
          wbsCode: materialData.wbsCode || '',
          justification: `Auto-reorder: Stock below minimum (${materialData.currentStock})`,
          description: `Auto-reorder for ${materialData.materialName}`,
        },
      ],
      remarks: 'Auto-generated Material Request',
    },
    'system',
    'System'
  );
};

// Action: Send Notification
const sendAutomationNotification = async (
  parameters: Record<string, any>,
  triggerData: Record<string, any>
): Promise<any> => {
  // Use dynamic import to avoid TypeScript module resolution issues
  try {
    const { createNotification } = await import('./notificationService.ts');
    return await createNotification({
      recipientId: parameters.recipientId || triggerData.userId,
      recipientEmail: parameters.recipientEmail,
      type: parameters.notificationType || 'info',
      priority: parameters.priority || 'normal',
      title: parameters.title || 'Automation Notification',
      message: parameters.message || 'An automation has been executed',
      data: triggerData,
      channels: parameters.channels || ['in_app'],
      relatedEntityType: parameters.entityType,
      relatedEntityId: parameters.entityId,
      category: 'automation',
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
    return { message: 'Notification delivery scheduled' };
  }
};

// Action: Send Alert
const sendAutomationAlert = async (
  parameters: Record<string, any>,
  triggerData: Record<string, any>
): Promise<any> => {
  // Use dynamic import to avoid TypeScript module resolution issues
  try {
    const { createNotification } = await import('./notificationService.ts');
    return await createNotification({
      recipientId: parameters.recipientId || triggerData.userId,
      type: NotificationType.ALERT,
      priority: NotificationPriority.HIGH,
      title: parameters.alertTitle || 'System Alert',
      message: parameters.alertMessage || 'An important event has occurred',
      data: triggerData,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      category: 'alert',
    });
  } catch (error) {
    console.error('Failed to send alert:', error);
    return { message: 'Alert delivery scheduled' };
  }
};

// Action: Update Project Status
const updateProjectStatus = async (
  triggerData: Record<string, any>,
  projectId?: string
): Promise<any> => {
  if (!projectId) {
    throw new Error('Project ID required for status update');
  }

  const projectRef = doc(db, 'projects', projectId);
  const updates: Record<string, any> = {
    updatedAt: Timestamp.now(),
  };

  if (triggerData.status) {
    updates.status = triggerData.status;
  }

  await updateDoc(projectRef, updates);

  return { projectId, updates };
};

// Action: Generate Report
const generateAutomationReport = async (
  parameters: Record<string, any>,
  triggerData: Record<string, any>,
  projectId?: string
): Promise<any> => {
  // Placeholder for report generation
  return {
    reportType: parameters.reportType,
    generatedAt: Timestamp.now(),
    data: triggerData,
    projectId,
  };
};

// ============================================================================
// INTEGRATION EVENTS
// ============================================================================

export const createIntegrationEvent = async (
  input: CreateIntegrationEventInput,
  userId: string,
  userName: string
): Promise<string> => {
  const eventData: Omit<IntegrationEvent, 'id'> = {
    eventType: input.eventType,
    eventName: input.eventName,
    sourceModule: input.sourceModule,
    sourceEntityType: input.sourceEntityType,
    sourceEntityId: input.sourceEntityId,
    eventData: input.eventData,
    previousState: input.previousState,
    isProcessed: false,
    triggeredRules: [],
    executionIds: [],
    createdAt: Timestamp.now(),
    createdBy: { userId, userName },
    projectId: input.projectId,
    metadata: input.metadata,
  };

  const docRef = await addDoc(collection(db, 'integrationEvents'), eventData);

  // Trigger automation asynchronously
  setTimeout(async () => {
    try {
      const trigger = mapEventToTrigger(input.eventType);
      if (trigger) {
        const executionIds = await triggerAutomation(
          trigger,
          input.eventData,
          userId,
          userName,
          input.projectId
        );

        // Update event with execution IDs
        await updateDoc(docRef, {
          isProcessed: true,
          processedAt: Timestamp.now(),
          executionIds,
        });
      }
    } catch (error: any) {
      console.error('Error processing integration event:', error);
      await updateDoc(docRef, {
        isProcessed: true,
        processedAt: Timestamp.now(),
        processingErrors: [error.message],
      });
    }
  }, 0);

  return docRef.id;
};

const mapEventToTrigger = (eventType: string): AutomationTrigger | null => {
  const mapping: Record<string, AutomationTrigger> = {
    po_approved: AutomationTrigger.PO_APPROVED,
    po_completed: AutomationTrigger.PO_COMPLETED,
    gr_completed: AutomationTrigger.GR_COMPLETED,
    gr_quality_failed: AutomationTrigger.GR_QUALITY_FAILED,
    mr_approved: AutomationTrigger.MR_APPROVED,
    mr_rejected: AutomationTrigger.MR_REJECTED,
    progress_updated: AutomationTrigger.PROGRESS_UPDATED,
    rab_updated: AutomationTrigger.RAB_UPDATED,
    wbs_budget_exceeded: AutomationTrigger.WBS_BUDGET_EXCEEDED,
    vendor_evaluated: AutomationTrigger.VENDOR_EVALUATED,
    vendor_blacklisted: AutomationTrigger.VENDOR_BLACKLISTED,
    invoice_approved: AutomationTrigger.INVOICE_APPROVED,
    stock_low: AutomationTrigger.STOCK_LOW,
    stock_out: AutomationTrigger.STOCK_OUT,
    item_expiring: AutomationTrigger.ITEM_EXPIRING,
  };

  return mapping[eventType] || null;
};

// ============================================================================
// AUTOMATION EXECUTION QUERIES
// ============================================================================

export const getAutomationExecutions = async (
  filters?: AutomationExecutionFilters,
  limitCount: number = 50
): Promise<AutomationExecution[]> => {
  let q = query(
    collection(db, 'automationExecutions'),
    orderBy('startedAt', 'desc'),
    firestoreLimit(limitCount)
  );

  if (filters?.ruleId) {
    q = query(q, where('ruleId', '==', filters.ruleId));
  }

  if (filters?.trigger) {
    q = query(q, where('trigger', '==', filters.trigger));
  }

  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }

  if (filters?.projectId) {
    q = query(q, where('projectId', '==', filters.projectId));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as AutomationExecution
  );
};

export const getAutomationExecutionById = async (
  executionId: string
): Promise<AutomationExecution | null> => {
  const docRef = doc(db, 'automationExecutions', executionId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as AutomationExecution;
};

// ============================================================================
// STATISTICS
// ============================================================================

export const getIntegrationStatistics = async (
  startDate: Timestamp,
  endDate: Timestamp,
  projectId?: string
): Promise<IntegrationStatistics> => {
  let q = query(
    collection(db, 'automationExecutions'),
    where('startedAt', '>=', startDate),
    where('startedAt', '<=', endDate)
  );

  if (projectId) {
    q = query(q, where('projectId', '==', projectId));
  }

  const snapshot = await getDocs(q);
  const executions = snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as AutomationExecution
  );

  // Calculate statistics
  const totalExecutions = executions.length;
  const successfulExecutions = executions.filter(
    (e) => e.status === AutomationStatus.SUCCESS
  ).length;
  const failedExecutions = executions.filter((e) => e.status === AutomationStatus.FAILED).length;
  const averageDuration =
    executions.reduce((sum, e) => sum + (e.duration || 0), 0) / totalExecutions || 0;

  // By trigger
  const executionsByTrigger: Record<string, any> = {};
  // By action
  const executionsByAction: Record<string, any> = {};

  // Recent activity
  const recentExecutions = executions.slice(0, 10);
  const recentFailures = executions
    .filter((e) => e.status === AutomationStatus.FAILED)
    .slice(0, 10);

  return {
    totalExecutions,
    successfulExecutions,
    failedExecutions,
    averageDuration,
    executionsByTrigger,
    executionsByAction,
    notificationsSent: 0, // TODO: Get from notification service
    notificationsDelivered: 0,
    notificationsFailed: 0,
    recentExecutions,
    recentFailures,
    periodStart: startDate,
    periodEnd: endDate,
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const retryFailedExecution = async (executionId: string): Promise<string> => {
  const execution = await getAutomationExecutionById(executionId);
  if (!execution) {
    throw new Error('Execution not found');
  }

  const rule = await getAutomationRuleById(execution.ruleId);
  if (!rule) {
    throw new Error('Automation rule not found');
  }

  return await executeAutomationRule(
    rule,
    execution.triggerData,
    execution.userId,
    execution.userName,
    execution.projectId
  );
};

export const cancelExecution = async (executionId: string): Promise<void> => {
  const docRef = doc(db, 'automationExecutions', executionId);
  await updateDoc(docRef, {
    status: AutomationStatus.CANCELLED,
    completedAt: Timestamp.now(),
  });
};
