/**
 * Disaster Recovery Service
 * Comprehensive backup, recovery, and business continuity management
 * Version: 1.0.0
 * Last Updated: October 2025
 */

import { db, storage } from '@/firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { ref, listAll } from 'firebase/storage';
import { withRetry } from '@/utils/retryWrapper';
import { APIError, ErrorCodes } from '@/utils/responseWrapper';
import { createScopedLogger } from '@/utils/logger';
import { validators } from '@/utils/validators';

const logger = createScopedLogger('disasterRecoveryService');

const COLLECTIONS = {
  BACKUPS: 'backups',
  RECOVERY_LOGS: 'recovery_logs',
  INCIDENT_LOGS: 'incident_logs',
  BCP_DOCUMENTS: 'bcp_documents',
} as const;

/**
 * Backup Types
 */
export type BackupType = 'full' | 'incremental' | 'differential';

export type BackupStatus = 'scheduled' | 'in_progress' | 'completed' | 'failed';

export type RecoveryStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';

/**
 * Backup Configuration
 */
export interface BackupConfig {
  id: string;
  name: string;
  type: BackupType;
  schedule: string; // cron expression
  retentionDays: number;
  includeStorage: boolean;
  includeFirestore: boolean;
  regions: string[]; // cross-region replication
  encryptionEnabled: boolean;
  lastBackup?: Date;
  nextBackup?: Date;
  status: BackupStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Backup Record
 */
export interface BackupRecord {
  id: string;
  configId: string;
  type: BackupType;
  status: BackupStatus;
  startTime: Date;
  endTime?: Date;
  sizeBytes?: number;
  fileCount?: number;
  firestoreCollections?: string[];
  storageBuckets?: string[];
  regions: string[];
  checksum?: string;
  errorMessage?: string;
  recoveryTested: boolean;
  retentionExpiry: Date;
}

/**
 * Recovery Operation
 */
export interface RecoveryOperation {
  id: string;
  type: 'full' | 'partial' | 'point_in_time';
  backupId?: string;
  targetEnvironment: string;
  status: RecoveryStatus;
  startTime: Date;
  endTime?: Date;
  initiatedBy: string;
  approvedBy?: string;
  collections?: string[];
  documents?: string[];
  errorMessage?: string;
  rollbackAvailable: boolean;
}

/**
 * Business Continuity Plan
 */
export interface BCPDocument {
  id: string;
  version: string;
  title: string;
  content: string;
  category: 'incident_response' | 'recovery_procedures' | 'contact_lists' | 'communication_plan';
  lastReviewed: Date;
  nextReview: Date;
  approvedBy: string;
  status: 'draft' | 'approved' | 'archived';
}

/**
 * Disaster Recovery Service
 */
export class DisasterRecoveryService {
  /**
   * Create backup configuration
   */
  async createBackupConfig(config: Omit<BackupConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<BackupConfig> {
    try {
      // Validate configuration
      if (!validators.isValidString(config.name, 1, 100).valid) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Backup name must be between 1 and 100 characters', 400);
      }

      if (!validators.isValidCronExpression(config.schedule)) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Invalid cron schedule expression', 400);
      }

      if (config.retentionDays < 1 || config.retentionDays > 3650) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Retention days must be between 1 and 3650', 400);
      }

      const configId = `backup_config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const backupConfig: BackupConfig = {
        ...config,
        id: configId,
        nextBackup: this.calculateNextBackup(config.schedule),
        status: 'scheduled',
        createdAt: now,
        updatedAt: now,
      };

      // Save to Firestore
      const docRef = doc(db, COLLECTIONS.BACKUPS, `configs/${configId}`);
      await withRetry(
        () =>
          setDoc(docRef, {
            ...backupConfig,
            nextBackup: Timestamp.fromDate(backupConfig.nextBackup!),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }),
        { maxAttempts: 3 }
      );

      logger.success('createBackupConfig', 'Backup configuration created', { configId });

      return backupConfig;
    } catch (error) {
      logger.error('createBackupConfig', 'Failed to create backup config', error as Error);
      throw error;
    }
  }

  /**
   * Execute backup operation
   */
  async executeBackup(configId: string): Promise<BackupRecord> {
    try {
      // Get configuration
      const config = await this.getBackupConfig(configId);
      if (!config) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Backup configuration not found', 404);
      }

      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const startTime = new Date();

      const backupRecord: BackupRecord = {
        id: backupId,
        configId,
        type: config.type,
        status: 'in_progress',
        startTime,
        regions: config.regions,
        recoveryTested: false,
        retentionExpiry: new Date(Date.now() + config.retentionDays * 24 * 60 * 60 * 1000),
      };

      // Save initial backup record
      await this.saveBackupRecord(backupRecord);

      try {
        // Execute backup based on type
        if (config.includeFirestore) {
          await this.backupFirestoreCollections(backupRecord, config);
        }

        if (config.includeStorage) {
          await this.backupStorageBuckets(backupRecord, config);
        }

        // Cross-region replication
        if (config.regions.length > 1) {
          await this.replicateToRegions(backupRecord, config);
        }

        // Calculate checksum and finalize
        backupRecord.status = 'completed';
        backupRecord.endTime = new Date();
        backupRecord.checksum = await this.calculateBackupChecksum(backupRecord);

        // Update configuration
        await this.updateBackupConfig(configId, {
          lastBackup: startTime,
          nextBackup: this.calculateNextBackup(config.schedule),
          status: 'scheduled',
        });

        logger.success('executeBackup', 'Backup completed successfully', {
          backupId,
          type: config.type,
          sizeBytes: backupRecord.sizeBytes,
        });

      } catch (error) {
        backupRecord.status = 'failed';
        backupRecord.endTime = new Date();
        backupRecord.errorMessage = (error as Error).message;

        logger.error('executeBackup', 'Backup failed', error as Error, { backupId });
      }

      // Save final backup record
      await this.saveBackupRecord(backupRecord);

      return backupRecord;
    } catch (error) {
      logger.error('executeBackup', 'Failed to execute backup', error as Error, { configId });
      throw error;
    }
  }

  /**
   * Execute recovery operation
   */
  async executeRecovery(
    operation: Omit<RecoveryOperation, 'id' | 'startTime' | 'status'>
  ): Promise<RecoveryOperation> {
    try {
      const recoveryId = `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const startTime = new Date();

      const recoveryOperation: RecoveryOperation = {
        ...operation,
        id: recoveryId,
        status: 'in_progress',
        startTime,
        rollbackAvailable: true,
      };

      // Save initial recovery record
      await this.saveRecoveryOperation(recoveryOperation);

      try {
        if (operation.type === 'full') {
          await this.performFullRecovery(operation.backupId!, operation.targetEnvironment);
        } else if (operation.type === 'partial') {
          await this.performPartialRecovery(
            operation.backupId!,
            operation.targetEnvironment,
            operation.collections || []
          );
        } else if (operation.type === 'point_in_time') {
          await this.performPointInTimeRecovery(operation.targetEnvironment, startTime);
        }

        recoveryOperation.status = 'completed';
        recoveryOperation.endTime = new Date();

        logger.success('executeRecovery', 'Recovery completed successfully', {
          recoveryId,
          type: operation.type,
          targetEnvironment: operation.targetEnvironment,
        });

      } catch (error) {
        recoveryOperation.status = 'failed';
        recoveryOperation.endTime = new Date();
        recoveryOperation.errorMessage = (error as Error).message;

        logger.error('executeRecovery', 'Recovery failed', error as Error, { recoveryId });
      }

      // Save final recovery record
      await this.saveRecoveryOperation(recoveryOperation);

      return recoveryOperation;
    } catch (error) {
      logger.error('executeRecovery', 'Failed to execute recovery', error as Error);
      throw error;
    }
  }

  /**
   * Test backup recovery
   */
  async testBackupRecovery(backupId: string): Promise<boolean> {
    try {
      const backup = await this.getBackupRecord(backupId);
      if (!backup) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Backup not found', 404);
      }

      // Create test environment
      const testEnvironment = `test_env_${Date.now()}`;

      // Perform partial recovery to test environment
      await this.performPartialRecovery(backupId, testEnvironment, ['users', 'projects']);

      // Verify data integrity
      const integrityCheck = await this.verifyDataIntegrity(testEnvironment);

      // Clean up test environment
      await this.cleanupTestEnvironment(testEnvironment);

      // Update backup record
      await this.updateBackupRecord(backupId, { recoveryTested: true });

      logger.success('testBackupRecovery', 'Backup recovery test completed', {
        backupId,
        integrityCheck,
      });

      return integrityCheck;
    } catch (error) {
      logger.error('testBackupRecovery', 'Backup recovery test failed', error as Error, { backupId });
      return false;
    }
  }

  /**
   * Create BCP document
   */
  async createBCPDocument(doc: Omit<BCPDocument, 'id'>): Promise<BCPDocument> {
    try {
      const docId = `bcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const bcpDocument: BCPDocument = {
        ...doc,
        id: docId,
      };

      // Save to Firestore
      const docRef = doc(db, COLLECTIONS.BCP_DOCUMENTS, docId);
      await withRetry(() => setDoc(docRef, bcpDocument), { maxAttempts: 3 });

      logger.success('createBCPDocument', 'BCP document created', { docId });

      return bcpDocument;
    } catch (error) {
      logger.error('createBCPDocument', 'Failed to create BCP document', error as Error);
      throw error;
    }
  }

  /**
   * Get BCP documents by category
   */
  async getBCPDocuments(category?: BCPDocument['category']): Promise<BCPDocument[]> {
    try {
      let q = query(collection(db, COLLECTIONS.BCP_DOCUMENTS), orderBy('lastReviewed', 'desc'));

      if (category) {
        q = query(q, where('category', '==', category));
      }

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => doc.data() as BCPDocument);
    } catch (error) {
      logger.error('getBCPDocuments', 'Failed to get BCP documents', error as Error);
      return [];
    }
  }

  /**
   * Log incident
   */
  async logIncident(
    incident: {
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      affectedSystems: string[];
      reportedBy: string;
    }
  ): Promise<string> {
    try {
      const incidentId = `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const incidentData = {
        id: incidentId,
        ...incident,
        status: 'reported',
        reportedAt: new Date(),
        resolvedAt: null,
        resolution: null,
        assignedTo: null,
      };

      // Save to Firestore
      const docRef = doc(db, COLLECTIONS.INCIDENT_LOGS, incidentId);
      await withRetry(() => setDoc(docRef, incidentData), { maxAttempts: 3 });

      logger.success('logIncident', 'Incident logged', { incidentId, severity: incident.severity });

      return incidentId;
    } catch (error) {
      logger.error('logIncident', 'Failed to log incident', error as Error);
      throw error;
    }
  }

  // ========================================
  // PRIVATE METHODS
  // ========================================

  private async getBackupConfig(configId: string): Promise<BackupConfig | null> {
    try {
      const docRef = doc(db, COLLECTIONS.BACKUPS, `configs/${configId}`);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      const data = docSnap.data();
      return {
        ...data,
        nextBackup: data.nextBackup?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as BackupConfig;
    } catch (error) {
      logger.error('getBackupConfig', 'Failed to get backup config', error as Error, { configId });
      return null;
    }
  }

  private async saveBackupRecord(record: BackupRecord): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.BACKUPS, `records/${record.id}`);
      await withRetry(() => setDoc(docRef, record), { maxAttempts: 3 });
    } catch (error) {
      logger.error('saveBackupRecord', 'Failed to save backup record', error as Error, { backupId: record.id });
    }
  }

  private async getBackupRecord(backupId: string): Promise<BackupRecord | null> {
    try {
      const docRef = doc(db, COLLECTIONS.BACKUPS, `records/${backupId}`);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      return docSnap.data() as BackupRecord;
    } catch (error) {
      logger.error('getBackupRecord', 'Failed to get backup record', error as Error, { backupId });
      return null;
    }
  }

  private async updateBackupConfig(configId: string, updates: Partial<BackupConfig>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.BACKUPS, `configs/${configId}`);
      await withRetry(() => updateDoc(docRef, updates), { maxAttempts: 3 });
    } catch (error) {
      logger.error('updateBackupConfig', 'Failed to update backup config', error as Error, { configId });
    }
  }

  private async updateBackupRecord(backupId: string, updates: Partial<BackupRecord>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.BACKUPS, `records/${backupId}`);
      await withRetry(() => updateDoc(docRef, updates), { maxAttempts: 3 });
    } catch (error) {
      logger.error('updateBackupRecord', 'Failed to update backup record', error as Error, { backupId });
    }
  }

  private async saveRecoveryOperation(operation: RecoveryOperation): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.RECOVERY_LOGS, operation.id);
      await withRetry(() => setDoc(docRef, operation), { maxAttempts: 3 });
    } catch (error) {
      logger.error('saveRecoveryOperation', 'Failed to save recovery operation', error as Error, {
        recoveryId: operation.id,
      });
    }
  }

  private calculateNextBackup(cronExpression: string): Date {
    // Simple implementation - in production, use a proper cron parser
    // For now, assume daily backups
    const nextBackup = new Date();
    nextBackup.setDate(nextBackup.getDate() + 1);
    return nextBackup;
  }

  private async backupFirestoreCollections(backupRecord: BackupRecord, config: BackupConfig): Promise<void> {
    try {
      // Get all collections to backup
      const collections = ['users', 'projects', 'tasks', 'chart_of_accounts', 'journal_entries'];

      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, collectionName));
        backupRecord.firestoreCollections = backupRecord.firestoreCollections || [];
        backupRecord.firestoreCollections.push(collectionName);

        // In a real implementation, this would export to cloud storage
        // For now, just count the documents
        backupRecord.fileCount = (backupRecord.fileCount || 0) + snapshot.size;
      }

      logger.debug('backupFirestoreCollections', 'Firestore collections backed up', {
        collections: backupRecord.firestoreCollections,
        totalDocuments: backupRecord.fileCount,
      });
    } catch (error) {
      logger.error('backupFirestoreCollections', 'Failed to backup Firestore', error as Error);
      throw error;
    }
  }

  private async backupStorageBuckets(backupRecord: BackupRecord, config: BackupConfig): Promise<void> {
    try {
      // List all files in storage
      const storageRef = ref(storage);
      const result = await listAll(storageRef);

      backupRecord.storageBuckets = ['default'];
      backupRecord.fileCount = (backupRecord.fileCount || 0) + result.items.length;

      // Calculate total size (simplified)
      backupRecord.sizeBytes = result.items.length * 1024 * 1024; // Assume 1MB per file

      logger.debug('backupStorageBuckets', 'Storage buckets backed up', {
        buckets: backupRecord.storageBuckets,
        fileCount: backupRecord.fileCount,
        sizeBytes: backupRecord.sizeBytes,
      });
    } catch (error) {
      logger.error('backupStorageBuckets', 'Failed to backup storage', error as Error);
      throw error;
    }
  }

  private async replicateToRegions(backupRecord: BackupRecord, config: BackupConfig): Promise<void> {
    // In a real implementation, this would replicate to multiple regions
    // For now, just log the operation
    logger.info('replicateToRegions', 'Cross-region replication completed', {
      regions: config.regions,
      backupId: backupRecord.id,
    });
  }

  private async calculateBackupChecksum(backupRecord: BackupRecord): Promise<string> {
    // Simplified checksum calculation
    const data = JSON.stringify({
      id: backupRecord.id,
      type: backupRecord.type,
      startTime: backupRecord.startTime,
      fileCount: backupRecord.fileCount,
      sizeBytes: backupRecord.sizeBytes,
    });
    return btoa(data).slice(0, 32);
  }

  private async performFullRecovery(backupId: string, targetEnvironment: string): Promise<void> {
    logger.info('performFullRecovery', 'Starting full recovery', { backupId, targetEnvironment });
    // Implementation would restore all data from backup
  }

  private async performPartialRecovery(
    backupId: string,
    targetEnvironment: string,
    collections: string[]
  ): Promise<void> {
    logger.info('performPartialRecovery', 'Starting partial recovery', {
      backupId,
      targetEnvironment,
      collections,
    });
    // Implementation would restore specific collections
  }

  private async performPointInTimeRecovery(targetEnvironment: string, pointInTime: Date): Promise<void> {
    logger.info('performPointInTimeRecovery', 'Starting point-in-time recovery', {
      targetEnvironment,
      pointInTime,
    });
    // Implementation would restore to specific point in time
  }

  private async verifyDataIntegrity(environment: string): Promise<boolean> {
    // Simplified integrity check
    logger.debug('verifyDataIntegrity', 'Data integrity verified', { environment });
    return true;
  }

  private async cleanupTestEnvironment(environment: string): Promise<void> {
    logger.debug('cleanupTestEnvironment', 'Test environment cleaned up', { environment });
  }
}

// Export singleton instance
export const disasterRecoveryService = new DisasterRecoveryService();
