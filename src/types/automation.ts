import { Timestamp } from 'firebase/firestore';

// ============================================================================
// AUTOMATION TYPES
// ============================================================================

export enum AutomationTrigger {
  PO_APPROVED = 'po_approved',
  PO_COMPLETED = 'po_completed',
  GR_COMPLETED = 'gr_completed',
  GR_QUALITY_FAILED = 'gr_quality_failed',
  MR_APPROVED = 'mr_approved',
  MR_REJECTED = 'mr_rejected',
  PROGRESS_UPDATED = 'progress_updated',
  RAB_UPDATED = 'rab_updated',
  WBS_BUDGET_EXCEEDED = 'wbs_budget_exceeded',
  VENDOR_EVALUATED = 'vendor_evaluated',
  VENDOR_BLACKLISTED = 'vendor_blacklisted',
  INVOICE_APPROVED = 'invoice_approved',
  STOCK_LOW = 'stock_low',
  STOCK_OUT = 'stock_out',
  ITEM_EXPIRING = 'item_expiring'
}

export enum AutomationAction {
  CREATE_AP = 'create_ap',
  UPDATE_INVENTORY = 'update_inventory',
  CALCULATE_EVM = 'calculate_evm',
  SEND_NOTIFICATION = 'send_notification',
  UPDATE_WBS_BUDGET = 'update_wbs_budget',
  UPDATE_VENDOR_PERFORMANCE = 'update_vendor_performance',
  CREATE_REORDER_MR = 'create_reorder_mr',
  SEND_ALERT = 'send_alert',
  UPDATE_PROJECT_STATUS = 'update_project_status',
  GENERATE_REPORT = 'generate_report'
}

export enum AutomationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  RETRY = 'retry',
  CANCELLED = 'cancelled'
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WEBHOOK = 'webhook'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  ALERT = 'alert'
}

// ============================================================================
// AUTOMATION RULE
// ============================================================================

export interface AutomationRule {
  id: string;
  ruleName: string;
  description?: string;
  isActive: boolean;
  
  // Trigger configuration
  trigger: AutomationTrigger;
  triggerConditions?: AutomationCondition[];
  
  // Action configuration
  actions: AutomationActionConfig[];
  
  // Execution settings
  priority: number;
  retryCount: number;
  retryDelay: number; // in seconds
  timeout: number; // in seconds
  
  // Filtering
  projectIds?: string[];
  userRoles?: string[];
  
  // Statistics
  executionCount: number;
  successCount: number;
  failureCount: number;
  lastExecutedAt?: Timestamp;
  
  // Audit
  createdAt: Timestamp;
  createdBy: {
    userId: string;
    userName: string;
  };
  updatedAt: Timestamp;
  updatedBy?: {
    userId: string;
    userName: string;
  };
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: any;
}

export interface AutomationActionConfig {
  action: AutomationAction;
  parameters?: Record<string, any>;
  continueOnError: boolean;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
}

// ============================================================================
// AUTOMATION EXECUTION
// ============================================================================

export interface AutomationExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  
  // Trigger details
  trigger: AutomationTrigger;
  triggerData: Record<string, any>;
  triggerTimestamp: Timestamp;
  
  // Execution status
  status: AutomationStatus;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  duration?: number; // in milliseconds
  
  // Results
  actionsExecuted: number;
  actionsSuccess: number;
  actionsFailed: number;
  results: AutomationActionResult[];
  
  // Error handling
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  retryAttempt: number;
  
  // Context
  projectId?: string;
  userId?: string;
  userName?: string;
  
  // Audit
  createdAt: Timestamp;
}

export interface AutomationActionResult {
  action: AutomationAction;
  status: 'success' | 'failed' | 'skipped';
  startedAt: Timestamp;
  completedAt?: Timestamp;
  duration?: number;
  output?: any;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// NOTIFICATION
// ============================================================================

export interface Notification {
  id: string;
  
  // Recipient
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  
  // Content
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  
  // Delivery
  channels: NotificationChannel[];
  scheduledFor?: Timestamp;
  
  // Status tracking
  isRead: boolean;
  readAt?: Timestamp;
  isSent: boolean;
  sentAt?: Timestamp;
  deliveryStatus: Record<NotificationChannel, {
    sent: boolean;
    sentAt?: Timestamp;
    error?: string;
  }>;
  
  // Action buttons
  actions?: NotificationAction[];
  
  // Related entity
  relatedEntityType?: string;
  relatedEntityId?: string;
  
  // Grouping
  category?: string;
  tags?: string[];
  
  // Expiry
  expiresAt?: Timestamp;
  
  // Audit
  createdAt: Timestamp;
  createdBy?: {
    userId: string;
    userName: string;
  };
}

export interface NotificationAction {
  label: string;
  action: string;
  url?: string;
  style?: 'primary' | 'secondary' | 'danger';
}

// ============================================================================
// INTEGRATION EVENT
// ============================================================================

export interface IntegrationEvent {
  id: string;
  eventType: string;
  eventName: string;
  
  // Source
  sourceModule: string;
  sourceEntityType: string;
  sourceEntityId: string;
  
  // Event data
  eventData: Record<string, any>;
  previousState?: Record<string, any>;
  
  // Processing
  isProcessed: boolean;
  processedAt?: Timestamp;
  processingErrors?: string[];
  
  // Triggered automations
  triggeredRules: string[];
  executionIds: string[];
  
  // Audit
  createdAt: Timestamp;
  createdBy: {
    userId: string;
    userName: string;
  };
  
  // Context
  projectId?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// AUDIT TRAIL
// ============================================================================

export interface AuditLog {
  id: string;
  
  // Action details
  action: string;
  actionType: 'create' | 'read' | 'update' | 'delete' | 'execute' | 'approve' | 'reject';
  module: string;
  
  // Entity
  entityType: string;
  entityId: string;
  entityName?: string;
  
  // Changes
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  
  // User
  userId: string;
  userName: string;
  userRole: string;
  userIp?: string;
  
  // Context
  projectId?: string;
  sessionId?: string;
  
  // Result
  status: 'success' | 'failed';
  errorMessage?: string;
  
  // Metadata
  metadata?: Record<string, any>;
  
  // Timestamp
  timestamp: Timestamp;
}

// ============================================================================
// WORKFLOW DEFINITION
// ============================================================================

export interface WorkflowDefinition {
  id: string;
  workflowName: string;
  description?: string;
  version: string;
  isActive: boolean;
  
  // Steps
  steps: WorkflowStep[];
  
  // Triggers
  triggerEvents: AutomationTrigger[];
  
  // Settings
  allowParallel: boolean;
  timeoutMinutes: number;
  
  // Statistics
  executionCount: number;
  averageDuration: number;
  
  // Audit
  createdAt: Timestamp;
  createdBy: {
    userId: string;
    userName: string;
  };
  updatedAt: Timestamp;
}

export interface WorkflowStep {
  id: string;
  stepName: string;
  stepType: 'action' | 'condition' | 'parallel' | 'delay';
  
  // Action config (if stepType = 'action')
  action?: AutomationAction;
  parameters?: Record<string, any>;
  
  // Condition config (if stepType = 'condition')
  condition?: {
    expression: string;
    trueStep?: string;
    falseStep?: string;
  };
  
  // Parallel config (if stepType = 'parallel')
  parallelSteps?: string[];
  
  // Delay config (if stepType = 'delay')
  delaySeconds?: number;
  
  // Flow control
  nextStep?: string;
  onError?: 'continue' | 'retry' | 'stop';
  retryCount?: number;
  
  // Validation
  requiredFields?: string[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  
  // Status
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep?: string;
  
  // Execution data
  inputData: Record<string, any>;
  outputData?: Record<string, any>;
  stepResults: Record<string, any>;
  
  // Timing
  startedAt: Timestamp;
  completedAt?: Timestamp;
  duration?: number;
  
  // Context
  projectId?: string;
  userId: string;
  userName: string;
  
  // Error
  error?: {
    step: string;
    message: string;
    stack?: string;
  };
  
  createdAt: Timestamp;
}

// ============================================================================
// INTEGRATION STATISTICS
// ============================================================================

export interface IntegrationStatistics {
  // Overall metrics
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  
  // By trigger
  executionsByTrigger: Record<AutomationTrigger, {
    count: number;
    successRate: number;
    averageDuration: number;
  }>;
  
  // By action
  executionsByAction: Record<AutomationAction, {
    count: number;
    successRate: number;
    averageDuration: number;
  }>;
  
  // Notifications
  notificationsSent: number;
  notificationsDelivered: number;
  notificationsFailed: number;
  
  // Recent activity
  recentExecutions: AutomationExecution[];
  recentFailures: AutomationExecution[];
  
  // Time period
  periodStart: Timestamp;
  periodEnd: Timestamp;
}

// ============================================================================
// INTEGRATION MAPPING
// ============================================================================

export interface IntegrationMapping {
  id: string;
  mappingName: string;
  sourceModule: string;
  targetModule: string;
  isActive: boolean;
  
  // Field mappings
  fieldMappings: FieldMapping[];
  
  // Transformation rules
  transformations?: TransformationRule[];
  
  // Validation
  validationRules?: ValidationRule[];
  
  // Audit
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  isRequired: boolean;
  defaultValue?: any;
  transformation?: string;
}

export interface TransformationRule {
  field: string;
  operation: 'uppercase' | 'lowercase' | 'trim' | 'format' | 'calculate' | 'lookup' | 'custom';
  parameters?: Record<string, any>;
  script?: string;
}

export interface ValidationRule {
  field: string;
  rule: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  parameters?: Record<string, any>;
  errorMessage: string;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateAutomationRuleInput {
  ruleName: string;
  description?: string;
  trigger: AutomationTrigger;
  triggerConditions?: AutomationCondition[];
  actions: AutomationActionConfig[];
  priority?: number;
  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
  projectIds?: string[];
  userRoles?: string[];
}

export interface CreateNotificationInput {
  recipientId: string;
  recipientEmail?: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: NotificationChannel[];
  scheduledFor?: Timestamp;
  relatedEntityType?: string;
  relatedEntityId?: string;
  category?: string;
  actions?: NotificationAction[];
}

export interface CreateIntegrationEventInput {
  eventType: string;
  eventName: string;
  sourceModule: string;
  sourceEntityType: string;
  sourceEntityId: string;
  eventData: Record<string, any>;
  previousState?: Record<string, any>;
  projectId?: string;
  metadata?: Record<string, any>;
}

export interface CreateAuditLogInput {
  action: string;
  actionType: 'create' | 'read' | 'update' | 'delete' | 'execute' | 'approve' | 'reject';
  module: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  projectId?: string;
  status: 'success' | 'failed';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface AutomationExecutionFilters {
  ruleId?: string;
  trigger?: AutomationTrigger;
  status?: AutomationStatus;
  projectId?: string;
  startDate?: Timestamp;
  endDate?: Timestamp;
}

export interface NotificationFilters {
  recipientId?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  isRead?: boolean;
  category?: string;
  startDate?: Timestamp;
  endDate?: Timestamp;
}

export interface AuditLogFilters {
  userId?: string;
  module?: string;
  entityType?: string;
  entityId?: string;
  actionType?: string;
  projectId?: string;
  startDate?: Timestamp;
  endDate?: Timestamp;
}
