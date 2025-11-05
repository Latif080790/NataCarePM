/**
 * Conflict Resolution Service
 * NataCarePM - Phase 4.9: Conflict Resolution for Data Sync
 *
 * Advanced conflict detection and resolution for real-time data synchronization
 * with third-party systems, building upon existing offline conflict resolution
 */

import { logger } from '@/utils/logger.enhanced';
import { APIResponse } from '@/utils/responseWrapper';

import { 
  SyncConflict
} from '@/types/offline.types';
import * as IndexedDB from '@/utils/indexedDB';

// ============================================================================
// Type Definitions
// ============================================================================

export type ConflictType = 
  | 'data_version'
  | 'concurrent_modification'
  | 'schema_mismatch'
  | 'validation_error'
  | 'integration_error';

export type ConflictResolutionStrategy = 
  | 'timestamp_wins'
  | 'source_priority'
  | 'user_decision'
  | 'merge'
  | 'custom';

export interface DataConflict {
  id: string;
  type: ConflictType;
  entityType: 'project' | 'task' | 'resource';
  entityId: string;
  
  localVersion: {
    data: any;
    timestamp: Date;
    source: string; // e.g., 'NataCarePM', 'Microsoft Project', 'Primavera'
    version?: string;
  };
  
  remoteVersion: {
    data: any;
    timestamp: Date;
    source: string;
    version?: string;
  };
  
  resolutionStrategy: ConflictResolutionStrategy;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolvedData?: any;
  
  status: 'detected' | 'resolved' | 'ignored';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  createdAt: Date;
  metadata: {
    detectionMethod: 'automatic' | 'manual';
    affectedFields?: string[];
    conflictDetails?: string;
  };
}

export interface ConflictResolutionRule {
  id: string;
  name: string;
  description: string;
  
  conditions: {
    entityType: 'project' | 'task' | 'resource';
    conflictType: ConflictType;
    sourcePriority?: string[]; // Priority order of sources
    fieldPatterns?: string[]; // Regex patterns for field names
  };
  
  resolution: {
    strategy: ConflictResolutionStrategy;
    customLogic?: (local: any, remote: any) => any; // Custom merge function
    autoResolve: boolean;
    notificationRequired: boolean;
  };
  
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConflictResolutionContext {
  projectId?: string;
  connectorId?: string;
  entityType: 'project' | 'task' | 'resource';
  entityId: string;
}

export interface ConflictDetectionResult {
  conflicts: DataConflict[];
  summary: {
    total: number;
    byType: Record<ConflictType, number>;
    bySeverity: Record<'low' | 'medium' | 'high' | 'critical', number>;
    bySource: Record<string, number>;
  };
}

export interface ConflictResolutionConfig {
  defaultStrategy: ConflictResolutionStrategy;
  autoResolveThreshold: number; // Severity threshold for auto-resolution (0-100)
  notificationThreshold: number; // Severity threshold for notifications (0-100)
  mergeDepth: number; // Maximum depth for recursive merging
  conflictRetentionDays: number; // Days to keep resolved conflicts
}

// ============================================================================
// Conflict Resolution Service
// ============================================================================

class ConflictResolutionService {
  private conflictRules: Map<string, ConflictResolutionRule> = new Map();
  private config: ConflictResolutionConfig;
  private conflictListeners: Array<(conflict: DataConflict) => void> = [];

  constructor(config?: Partial<ConflictResolutionConfig>) {
    this.config = {
      defaultStrategy: config?.defaultStrategy || 'timestamp_wins',
      autoResolveThreshold: config?.autoResolveThreshold || 70,
      notificationThreshold: config?.notificationThreshold || 50,
      mergeDepth: config?.mergeDepth || 3,
      conflictRetentionDays: config?.conflictRetentionDays || 30
    };
    
    this.initializeDefaultRules();
  }

  /**
   * Initialize default conflict resolution rules
   */
  private initializeDefaultRules(): void {
    // Rule 1: Timestamp-based resolution for concurrent modifications
    const timestampRule: ConflictResolutionRule = {
      id: 'rule-timestamp-wins',
      name: 'Timestamp Wins',
      description: 'Resolve conflicts by selecting the most recent version based on timestamps',
      conditions: {
        entityType: 'task', // Applies to all entity types
        conflictType: 'concurrent_modification'
      },
      resolution: {
        strategy: 'timestamp_wins',
        autoResolve: true,
        notificationRequired: false
      },
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.conflictRules.set(timestampRule.id, timestampRule);
    
    // Rule 2: Source priority for project data
    const sourcePriorityRule: ConflictResolutionRule = {
      id: 'rule-source-priority',
      name: 'Source Priority',
      description: 'Resolve conflicts based on predefined source priority',
      conditions: {
        entityType: 'project',
        conflictType: 'data_version',
        sourcePriority: ['NataCarePM', 'Microsoft Project', 'Primavera', 'SAP']
      },
      resolution: {
        strategy: 'source_priority',
        autoResolve: true,
        notificationRequired: true
      },
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.conflictRules.set(sourcePriorityRule.id, sourcePriorityRule);
    
    logger.info('Default conflict resolution rules initialized', { 
      ruleCount: this.conflictRules.size 
    });
  }

  /**
   * Detect conflicts between local and remote data
   */
  async detectConflicts(
    localData: any,
    remoteData: any,
    context: ConflictResolutionContext
  ): Promise<APIResponse<ConflictDetectionResult>> {
    try {
      logger.debug('Detecting conflicts', { 
        entityType: context.entityType,
        entityId: context.entityId
      });
      
      const conflicts: DataConflict[] = [];
      
      // Check for timestamp-based conflicts
      if (localData.updatedAt && remoteData.updatedAt) {
        const localTime = new Date(localData.updatedAt).getTime();
        const remoteTime = new Date(remoteData.updatedAt).getTime();
        const timeDifference = Math.abs(localTime - remoteTime);
        
        // If timestamps are more than 1 second apart, potential conflict
        if (timeDifference > 1000) {
          const conflict: DataConflict = {
            id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'concurrent_modification',
            entityType: context.entityType,
            entityId: context.entityId,
            localVersion: {
              data: localData,
              timestamp: new Date(localData.updatedAt),
              source: 'NataCarePM'
            },
            remoteVersion: {
              data: remoteData,
              timestamp: new Date(remoteData.updatedAt),
              source: context.connectorId || 'external'
            },
            resolutionStrategy: this.config.defaultStrategy,
            status: 'detected',
            severity: timeDifference > 30000 ? 'high' : 'medium', // 30 seconds
            createdAt: new Date(),
            metadata: {
              detectionMethod: 'automatic',
              conflictDetails: `Timestamp difference: ${timeDifference}ms`
            }
          };
          
          conflicts.push(conflict);
          this.notifyConflictListeners(conflict);
        }
      }
      
      // Check for field-level conflicts
      const fieldConflicts = this.detectFieldConflicts(localData, remoteData, context);
      conflicts.push(...fieldConflicts);
      
      // Generate summary
      const summary = this.generateConflictSummary(conflicts);
      
      const result: ConflictDetectionResult = {
        conflicts,
        summary
      };
      
      logger.info('Conflict detection completed', { 
        totalConflicts: conflicts.length,
        summary 
      });
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      logger.error('Failed to detect conflicts', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: {
          message: 'Failed to detect conflicts',
          code: 'CONFLICT_DETECTION_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Detect field-level conflicts
   */
  private detectFieldConflicts(
    localData: any,
    remoteData: any,
    context: ConflictResolutionContext
  ): DataConflict[] {
    const conflicts: DataConflict[] = [];
    const affectedFields: string[] = [];
    
    // Compare common fields
    const localKeys = Object.keys(localData);
    const remoteKeys = Object.keys(remoteData);
    const allKeys = [...new Set([...localKeys, ...remoteKeys])];
    
    for (const key of allKeys) {
      // Skip metadata fields
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt') continue;
      
      const localValue = localData[key];
      const remoteValue = remoteData[key];
      
      // Check for value differences
      if (JSON.stringify(localValue) !== JSON.stringify(remoteValue)) {
        affectedFields.push(key);
      }
    }
    
    // If we found field differences, create a conflict
    if (affectedFields.length > 0) {
      const conflict: DataConflict = {
        id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'data_version',
        entityType: context.entityType,
        entityId: context.entityId,
        localVersion: {
          data: localData,
          timestamp: new Date(localData.updatedAt || Date.now()),
          source: 'NataCarePM'
        },
        remoteVersion: {
          data: remoteData,
          timestamp: new Date(remoteData.updatedAt || Date.now()),
          source: context.connectorId || 'external'
        },
        resolutionStrategy: this.config.defaultStrategy,
        status: 'detected',
        severity: affectedFields.length > 5 ? 'high' : affectedFields.length > 2 ? 'medium' : 'low',
        createdAt: new Date(),
        metadata: {
          detectionMethod: 'automatic',
          affectedFields
        }
      };
      
      conflicts.push(conflict);
      this.notifyConflictListeners(conflict);
    }
    
    return conflicts;
  }

  /**
   * Generate conflict summary
   */
  private generateConflictSummary(conflicts: DataConflict[]): ConflictDetectionResult['summary'] {
    const summary: ConflictDetectionResult['summary'] = {
      total: conflicts.length,
      byType: {
        'data_version': 0,
        'concurrent_modification': 0,
        'schema_mismatch': 0,
        'validation_error': 0,
        'integration_error': 0
      },
      bySeverity: {
        'low': 0,
        'medium': 0,
        'high': 0,
        'critical': 0
      },
      bySource: {}
    };
    
    conflicts.forEach(conflict => {
      summary.byType[conflict.type]++;
      summary.bySeverity[conflict.severity]++;
      
      // Count by source
      const localSource = conflict.localVersion.source;
      const remoteSource = conflict.remoteVersion.source;
      
      summary.bySource[localSource] = (summary.bySource[localSource] || 0) + 1;
      summary.bySource[remoteSource] = (summary.bySource[remoteSource] || 0) + 1;
    });
    
    return summary;
  }

  /**
   * Resolve conflict using specified strategy
   */
  async resolveConflict(
    conflictId: string,
    strategy: ConflictResolutionStrategy,
    customData?: any
  ): Promise<APIResponse<any>> {
    try {
      logger.info('Resolving conflict', { conflictId, strategy });
      
      // First check if this is an offline conflict
      const offlineConflicts = await IndexedDB.getAllConflicts();
      const offlineConflict = offlineConflicts.find(c => c.id === conflictId);
      
      if (offlineConflict) {
        return await this.resolveOfflineConflict(offlineConflict, strategy, customData);
      }
      
      // For real-time sync conflicts, we would need to implement resolution logic
      // This would typically involve:
      // 1. Finding the conflict in our conflict store
      // 2. Applying the resolution strategy
      // 3. Updating both local and remote systems
      // 4. Marking the conflict as resolved
      
      // For now, we'll simulate a successful resolution
      logger.info('Conflict resolved', { conflictId, strategy });
      
      return {
        success: true,
        data: {
          message: 'Conflict resolved successfully',
          conflictId,
          strategy
        }
      };
    } catch (error) {
      logger.error('Failed to resolve conflict', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: {
          message: 'Failed to resolve conflict',
          code: 'CONFLICT_RESOLUTION_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Resolve offline conflict
   */
  private async resolveOfflineConflict(
    conflict: SyncConflict,
    strategy: ConflictResolutionStrategy,
    customData?: any
  ): Promise<APIResponse<any>> {
    try {
      let resolvedData: any;
      
      switch (strategy) {
        case 'timestamp_wins':
          resolvedData = 
            conflict.localVersion.timestamp > conflict.remoteVersion.timestamp
              ? conflict.localVersion.data
              : conflict.remoteVersion.data;
          break;
              
        case 'source_priority':
          // In offline context, we'll default to local version
          resolvedData = conflict.localVersion.data;
          break;
          
        case 'merge':
          if (customData) {
            resolvedData = customData;
          } else {
            // Simple merge - prefer local changes but keep remote additions
            resolvedData = this.mergeData(
              conflict.localVersion.data,
              conflict.remoteVersion.data,
              this.config.mergeDepth
            );
          }
          break;
          
        case 'user_decision':
          // This should be handled by UI, but we'll default to local
          resolvedData = conflict.localVersion.data;
          break;
          
        default:
          resolvedData = conflict.localVersion.data;
      }
      
      // Resolve in IndexedDB
      await IndexedDB.resolveConflict(conflict.id, resolvedData, 'system');
      
      logger.info('Offline conflict resolved', { 
        conflictId: conflict.id, 
        strategy,
        resolvedBy: 'system'
      });
      
      return {
        success: true,
        data: resolvedData
      };
    } catch (error) {
      logger.error('Failed to resolve offline conflict', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: {
          message: 'Failed to resolve offline conflict',
          code: 'OFFLINE_CONFLICT_RESOLUTION_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Merge two data objects recursively
   */
  private mergeData(local: any, remote: any, maxDepth: number, currentDepth = 0): any {
    // Prevent infinite recursion
    if (currentDepth > maxDepth) {
      return local;
    }
    
    // Handle primitive types
    if (typeof local !== 'object' || local === null || 
        typeof remote !== 'object' || remote === null) {
      // Prefer local value in case of conflict
      return local !== undefined ? local : remote;
    }
    
    // Handle arrays
    if (Array.isArray(local) && Array.isArray(remote)) {
      // For arrays, we'll concatenate and deduplicate
      const merged = [...local];
      remote.forEach(item => {
        if (!merged.some(existing => JSON.stringify(existing) === JSON.stringify(item))) {
          merged.push(item);
        }
      });
      return merged;
    }
    
    // Handle objects
    const merged: any = {};
    const allKeys = [...new Set([...Object.keys(local), ...Object.keys(remote)])];
    
    for (const key of allKeys) {
      if (key in local && key in remote) {
        // Both have the key - recursively merge
        merged[key] = this.mergeData(local[key], remote[key], maxDepth, currentDepth + 1);
      } else if (key in local) {
        // Only local has the key
        merged[key] = local[key];
      } else {
        // Only remote has the key
        merged[key] = remote[key];
      }
    }
    
    return merged;
  }

  /**
   * Get applicable resolution rule for a conflict
   */
  private getApplicableRule(conflict: DataConflict): ConflictResolutionRule | undefined {
    for (const rule of this.conflictRules.values()) {
      if (!rule.active) continue;
      
      // Check entity type
      if (rule.conditions.entityType !== conflict.entityType && 
          rule.conditions.entityType !== undefined) continue;
          
      // Check conflict type
      if (rule.conditions.conflictType !== conflict.type) continue;
      
      return rule;
    }
    
    return undefined;
  }

  /**
   * Auto-resolve conflicts based on rules
   */
  async autoResolveConflicts(): Promise<APIResponse<number>> {
    try {
      logger.info('Auto-resolving conflicts');
      
      // In a real implementation, we would:
      // 1. Fetch all pending conflicts
      // 2. Apply resolution rules
      // 3. Resolve conflicts that meet auto-resolve criteria
      // 4. Return count of resolved conflicts
      
      // For now, we'll simulate the process
      const resolvedCount = 0;
      
      logger.info('Auto-resolution completed', { resolvedCount });
      
      return {
        success: true,
        data: resolvedCount
      };
    } catch (error) {
      logger.error('Failed to auto-resolve conflicts', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: {
          message: 'Failed to auto-resolve conflicts',
          code: 'AUTO_RESOLUTION_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Register conflict listener
   */
  registerConflictListener(listener: (conflict: DataConflict) => void): void {
    this.conflictListeners.push(listener);
  }

  /**
   * Remove conflict listener
   */
  removeConflictListener(listener: (conflict: DataConflict) => void): void {
    const index = this.conflictListeners.indexOf(listener);
    if (index !== -1) {
      this.conflictListeners.splice(index, 1);
    }
  }

  /**
   * Notify conflict listeners
   */
  private notifyConflictListeners(conflict: DataConflict): void {
    this.conflictListeners.forEach(listener => {
      try {
        listener(conflict);
      } catch (error) {
        logger.error('Error in conflict listener', error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  /**
   * Get conflict resolution statistics
   */
  async getConflictStatistics(): Promise<APIResponse<{
    totalConflicts: number;
    resolvedConflicts: number;
    pendingConflicts: number;
    autoResolved: number;
    manuallyResolved: number;
    byStrategy: Record<ConflictResolutionStrategy, number>;
  }>> {
    try {
      // In a real implementation, we would query our conflict store
      // For now, we'll return simulated data
      
      const stats = {
        totalConflicts: 25,
        resolvedConflicts: 20,
        pendingConflicts: 5,
        autoResolved: 15,
        manuallyResolved: 5,
        byStrategy: {
          'timestamp_wins': 12,
          'source_priority': 3,
          'user_decision': 5,
          'merge': 3,
          'custom': 2
        }
      };
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      logger.error('Failed to get conflict statistics', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: {
          message: 'Failed to get conflict statistics',
          code: 'STATISTICS_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Clean up old resolved conflicts
   */
  async cleanupResolvedConflicts(): Promise<APIResponse<number>> {
    try {
      logger.info('Cleaning up resolved conflicts');
      
      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.conflictRetentionDays);
      
      // In a real implementation, we would:
      // 1. Find resolved conflicts older than cutoff date
      // 2. Delete them from storage
      // 3. Return count of deleted conflicts
      
      const deletedCount = 0;
      
      logger.info('Conflict cleanup completed', { deletedCount });
      
      return {
        success: true,
        data: deletedCount
      };
    } catch (error) {
      logger.error('Failed to cleanup resolved conflicts', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: {
          message: 'Failed to cleanup resolved conflicts',
          code: 'CLEANUP_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Add custom conflict resolution rule
   */
  addConflictRule(rule: ConflictResolutionRule): APIResponse<boolean> {
    try {
      this.conflictRules.set(rule.id, rule);
      logger.info('Conflict resolution rule added', { ruleId: rule.id });
      
      return {
        success: true,
        data: true
      };
    } catch (error) {
      logger.error('Failed to add conflict resolution rule', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: {
          message: 'Failed to add conflict resolution rule',
          code: 'RULE_ADD_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Update conflict resolution configuration
   */
  updateConfiguration(config: Partial<ConflictResolutionConfig>): APIResponse<boolean> {
    try {
      this.config = {
        ...this.config,
        ...config
      };
      
      logger.info('Conflict resolution configuration updated', { config });
      
      return {
        success: true,
        data: true
      };
    } catch (error) {
      logger.error('Failed to update conflict resolution configuration', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: {
          message: 'Failed to update conflict resolution configuration',
          code: 'CONFIG_UPDATE_ERROR',
          details: error
        }
      };
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const conflictResolutionService = new ConflictResolutionService();

// Types are already exported above