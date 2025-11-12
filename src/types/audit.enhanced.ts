/**
 * Enhanced Audit Trail Types
 * Day 4 - Comprehensive audit logging with before/after comparison
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// ENHANCED CHANGE TRACKING
// ============================================================================

export interface FieldChange {
  field: string;
  fieldLabel: string;
  fieldType: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  oldValue: any;
  newValue: any;
  oldValueFormatted?: string;
  newValueFormatted?: string;
  changeType: 'added' | 'modified' | 'removed';
  isSignificant: boolean; // For highlighting important changes
}

export interface EnhancedAuditLog {
  id: string;

  // Action details
  action: string;
  actionType: 'create' | 'read' | 'update' | 'delete' | 'execute' | 'approve' | 'reject' | 'export' | 'import';
  actionCategory: 'data' | 'security' | 'finance' | 'logistics' | 'project' | 'system';
  module: string;
  subModule?: string;

  // Entity
  entityType: string;
  entityId: string;
  entityName?: string;
  parentEntityType?: string;
  parentEntityId?: string;

  // Enhanced Changes
  changes?: FieldChange[];
  changesSummary?: string;
  beforeSnapshot?: Record<string, any>;
  afterSnapshot?: Record<string, any>;
  
  // User
  userId: string;
  userName: string;
  userEmail?: string;
  userRole: string;
  userDepartment?: string;
  userIp?: string;
  userAgent?: string;
  userLocation?: {
    country?: string;
    city?: string;
    timezone?: string;
  };

  // Context
  projectId?: string;
  projectName?: string;
  sessionId?: string;
  requestId?: string;

  // Result
  status: 'success' | 'failed' | 'partial';
  errorMessage?: string;
  errorCode?: string;
  warnings?: string[];

  // Impact
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  affectedUsers?: string[];
  affectedEntities?: Array<{
    entityType: string;
    entityId: string;
    entityName?: string;
  }>;

  // Compliance
  isCompliant: boolean;
  complianceNotes?: string;
  requiresReview: boolean;
  reviewedBy?: string;
  reviewedAt?: Timestamp;

  // Metadata
  metadata?: Record<string, any>;
  tags?: string[];
  
  // Performance
  executionTimeMs?: number;
  
  // Timestamps
  timestamp: Timestamp;
  createdAt: Timestamp;
}

// ============================================================================
// AUDIT LOG FILTERS (ENHANCED)
// ============================================================================

export interface EnhancedAuditLogFilters {
  // Basic filters
  userId?: string;
  userRole?: string;
  module?: string;
  entityType?: string;
  entityId?: string;
  actionType?: string | string[];
  status?: 'success' | 'failed' | 'partial';

  // Date range
  startDate?: Timestamp;
  endDate?: Timestamp;

  // Advanced filters
  projectId?: string;
  impactLevel?: 'low' | 'medium' | 'high' | 'critical';
  actionCategory?: string;
  requiresReview?: boolean;
  isCompliant?: boolean;
  
  // Search
  searchQuery?: string;
  searchFields?: string[];
  
  // Tags
  tags?: string[];
  
  // Performance
  minExecutionTime?: number;
  maxExecutionTime?: number;
}

// ============================================================================
// AUDIT STATISTICS (ENHANCED)
// ============================================================================

export interface EnhancedAuditStatistics {
  // Overview
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  partialActions: number;
  
  // By dimensions
  actionsByModule: Record<string, number>;
  actionsByType: Record<string, number>;
  actionsByCategory: Record<string, number>;
  actionsByImpactLevel: Record<string, number>;
  actionsByStatus: Record<string, number>;
  
  // User activity
  mostActiveUsers: Array<{
    userId: string;
    userName: string;
    userRole: string;
    actionCount: number;
    lastActivity: Date;
  }>;
  
  // Entity activity
  mostModifiedEntities: Array<{
    entityType: string;
    entityId: string;
    entityName?: string;
    modificationCount: number;
  }>;
  
  // Trends
  actionTrend: Array<{
    date: string;
    count: number;
  }>;
  
  // Compliance
  complianceRate: number;
  itemsRequiringReview: number;
  
  // Performance
  averageExecutionTime: number;
  slowestActions: Array<{
    id: string;
    action: string;
    executionTime: number;
  }>;
  
  // Recent activity
  recentActivity: EnhancedAuditLog[];
}

// ============================================================================
// EXPORT OPTIONS
// ============================================================================

export interface AuditExportOptions {
  format: 'excel' | 'pdf' | 'csv' | 'json';
  filters?: EnhancedAuditLogFilters;
  fields?: string[];
  includeChanges: boolean;
  includeMetadata: boolean;
  groupBy?: 'user' | 'module' | 'entityType' | 'date';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  maxRecords?: number;
  
  // For PDF
  pdfOptions?: {
    title?: string;
    orientation?: 'portrait' | 'landscape';
    includeCharts?: boolean;
    includeStatistics?: boolean;
  };
}

export interface AuditExportResult {
  success: boolean;
  format: string;
  filename: string;
  downloadUrl?: string;
  blob?: Blob;
  recordCount: number;
  error?: string;
}

// ============================================================================
// AUDIT DASHBOARD
// ============================================================================

export interface AuditDashboardData {
  statistics: EnhancedAuditStatistics;
  
  // Charts data
  activityTrendData: Array<{
    date: string;
    success: number;
    failed: number;
  }>;
  
  moduleDistribution: Array<{
    module: string;
    count: number;
    percentage: number;
  }>;
  
  userActivityDistribution: Array<{
    userName: string;
    count: number;
  }>;
  
  impactLevelDistribution: Array<{
    level: string;
    count: number;
  }>;
  
  // Alerts
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  
  // Recent critical actions
  criticalActions: EnhancedAuditLog[];
  
  // Compliance summary
  complianceSummary: {
    totalReviewed: number;
    pendingReview: number;
    compliantRate: number;
    nonCompliantCount: number;
  };
}

// ============================================================================
// AUDIT SEARCH RESULT
// ============================================================================

export interface AuditSearchResult {
  logs: EnhancedAuditLog[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  aggregations?: {
    byModule?: Record<string, number>;
    byUser?: Record<string, number>;
    byStatus?: Record<string, number>;
  };
}

// ============================================================================
// AUDIT TIMELINE
// ============================================================================

export interface AuditTimelineEntry {
  timestamp: Date;
  action: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
  changes: FieldChange[];
  status: 'success' | 'failed' | 'partial';
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface EntityAuditTimeline {
  entityType: string;
  entityId: string;
  entityName?: string;
  timeline: AuditTimelineEntry[];
  summary: {
    totalChanges: number;
    contributors: Array<{
      userId: string;
      userName: string;
      changeCount: number;
    }>;
    firstChange: Date;
    lastChange: Date;
  };
}
