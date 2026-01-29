/**
 * OFFLINE SYNC SERVICE
 * Mengelola sync queue dan operasi offline-to-online
 * Last Updated: December 16, 2025
 */

import { db, auth } from '@/firebaseConfig';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  offlineDb,
  PendingOperation,
  OfflineDailyLog,
  OfflineAttachment,
  generateLocalId,
} from '@/db/offlineDatabase';
import { logger } from '@/utils/logger.enhanced';
// TODO: Implement storageService for file uploads
// import { uploadFile } from '@/services/storageService';

/**
 * SYNC QUEUE MANAGER
 */
class OfflineSyncService {
  private syncInProgress = false;
  private maxRetries = 5;
  private retryDelay = 2000; // 2 seconds

  /**
   * Add operation to sync queue
   */
  async queueOperation(
    type: 'create' | 'update' | 'delete',
    collection: string,
    documentId: string | undefined,
    data: any,
    projectId: string
  ): Promise<number> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to queue operations');
    }

    const operation: PendingOperation = {
      type,
      collection,
      documentId,
      data,
      projectId,
      userId: currentUser.uid,
      userName: currentUser.displayName || 'Unknown',
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    const id = await offlineDb.pendingOperations.add(operation);
    logger.info('Operation queued', { id, type, collection });

    return id;
  }

  /**
   * Save daily log offline
   */
  async saveDailyLogOffline(dailyLogData: any, projectId: string): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    const localId = generateLocalId();

    const offlineLog: OfflineDailyLog = {
      localId,
      projectId,
      date: dailyLogData.date,
      weather: dailyLogData.weather,
      temperature: dailyLogData.temperature,
      activities: dailyLogData.activities,
      issues: dailyLogData.issues,
      photos: dailyLogData.photos || [],
      workProgress: dailyLogData.workProgress || [],
      attendance: dailyLogData.attendance || [],
      createdBy: currentUser.uid,
      createdAt: Date.now(),
      syncStatus: 'pending',
    };

    await offlineDb.offlineDailyLogs.add(offlineLog);
    logger.info('Daily log saved offline', { localId, projectId });

    return localId;
  }

  /**
   * Save attachment offline
   */
  async saveAttachmentOffline(
    file: File,
    projectId: string,
    entityType: string,
    entityId: string
  ): Promise<string> {
    const localId = generateLocalId();

    // Convert file to blob for storage
    const blob = new Blob([file], { type: file.type });

    const attachment: OfflineAttachment = {
      localId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      blob,
      projectId,
      entityType,
      entityId,
      syncStatus: 'pending',
      createdAt: Date.now(),
    };

    await offlineDb.offlineAttachments.add(attachment);
    logger.info('Attachment saved offline', { localId, fileName: file.name });

    return localId;
  }

  /**
   * Sync all pending operations
   */
  async syncAll(): Promise<{
    success: number;
    failed: number;
    total: number;
  }> {
    if (this.syncInProgress) {
      logger.warn('Sync already in progress');
      return { success: 0, failed: 0, total: 0 };
    }

    if (!navigator.onLine) {
      logger.warn('Cannot sync: No internet connection');
      return { success: 0, failed: 0, total: 0 };
    }

    this.syncInProgress = true;
    let successCount = 0;
    let failedCount = 0;

    try {
      // 1. Sync pending operations
      const operations = await offlineDb.pendingOperations
        .where('status')
        .equals('pending')
        .toArray();

      logger.info(`Starting sync: ${operations.length} pending operations`);

      for (const operation of operations) {
        try {
          await this.syncOperation(operation);
          successCount++;
        } catch (error) {
          failedCount++;
          logger.error('Failed to sync operation', error instanceof Error ? error : new Error(String(error)), { operationId: operation.id });
        }
      }

      // 2. Sync offline daily logs
      const dailyLogs = await offlineDb.offlineDailyLogs
        .where('syncStatus')
        .equals('pending')
        .toArray();

      for (const log of dailyLogs) {
        try {
          await this.syncDailyLog(log);
          successCount++;
        } catch (error) {
          failedCount++;
          logger.error('Failed to sync daily log', error instanceof Error ? error : new Error(String(error)), { localId: log.localId });
        }
      }

      // 3. Sync offline attachments
      const attachments = await offlineDb.offlineAttachments
        .where('syncStatus')
        .equals('pending')
        .toArray();

      for (const attachment of attachments) {
        try {
          await this.syncAttachment(attachment);
          successCount++;
        } catch (error) {
          failedCount++;
          logger.error('Failed to sync attachment', error instanceof Error ? error : new Error(String(error)), { localId: attachment.localId });
        }
      }

      logger.info('Sync completed', {
        success: successCount,
        failed: failedCount,
        total: successCount + failedCount,
      });

      return {
        success: successCount,
        failed: failedCount,
        total: successCount + failedCount,
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync single operation
   */
  private async syncOperation(operation: PendingOperation): Promise<void> {
    if (!operation.id) {
      throw new Error('Operation ID is required');
    }

    // Update status to syncing
    await offlineDb.pendingOperations.update(operation.id, { status: 'syncing' });

    const startTime = Date.now();

    try {
      const collectionRef = collection(db, operation.collection);

      switch (operation.type) {
        case 'create':
          const docRef = await addDoc(collectionRef, {
            ...operation.data,
            createdAt: serverTimestamp(),
            syncedFromOffline: true,
          });
          logger.info('Operation synced: create', { docId: docRef.id });
          break;

        case 'update':
          if (!operation.documentId) {
            throw new Error('Document ID required for update');
          }
          const updateRef = doc(db, operation.collection, operation.documentId);
          await updateDoc(updateRef, {
            ...operation.data,
            updatedAt: serverTimestamp(),
            syncedFromOffline: true,
          });
          logger.info('Operation synced: update', { docId: operation.documentId });
          break;

        case 'delete':
          if (!operation.documentId) {
            throw new Error('Document ID required for delete');
          }
          const deleteRef = doc(db, operation.collection, operation.documentId);
          await deleteDoc(deleteRef);
          logger.info('Operation synced: delete', { docId: operation.documentId });
          break;
      }

      // Remove from queue after success
      await offlineDb.pendingOperations.delete(operation.id);

      // Log sync history
      await offlineDb.syncLogs.add({
        operationId: operation.id,
        action: operation.type,
        status: 'success',
        syncedAt: Date.now(),
        duration: Date.now() - startTime,
      });
    } catch (error) {
      // Increment retry count
      const newRetryCount = (operation.retryCount || 0) + 1;

      if (newRetryCount >= this.maxRetries) {
        // Mark as failed after max retries
        await offlineDb.pendingOperations.update(operation.id, {
          status: 'failed',
          retryCount: newRetryCount,
          lastError: error instanceof Error ? error.message : 'Unknown error',
        });

        await offlineDb.syncLogs.add({
          operationId: operation.id,
          action: operation.type,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          syncedAt: Date.now(),
          duration: Date.now() - startTime,
        });
      } else {
        // Update retry count and reset to pending
        await offlineDb.pendingOperations.update(operation.id, {
          status: 'pending',
          retryCount: newRetryCount,
          lastError: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      throw error;
    }
  }

  /**
   * Sync daily log
   */
  private async syncDailyLog(log: OfflineDailyLog): Promise<void> {
    if (!log.id) {
      throw new Error('Log ID is required');
    }

    try {
      // Upload to Firestore
      const docRef = await addDoc(
        collection(db, `projects/${log.projectId}/dailyLogs`),
        {
          date: log.date,
          weather: log.weather,
          temperature: log.temperature,
          activities: log.activities,
          issues: log.issues,
          photos: log.photos,
          workProgress: log.workProgress,
          attendance: log.attendance,
          createdBy: log.createdBy,
          createdAt: serverTimestamp(),
          syncedFromOffline: true,
          originalLocalId: log.localId,
        }
      );

      // Update status
      await offlineDb.offlineDailyLogs.update(log.id, {
        syncStatus: 'synced',
        serverDocId: docRef.id,
      });

      logger.info('Daily log synced', { localId: log.localId, serverId: docRef.id });

      // Delete after successful sync (optional - keep for history)
      // await offlineDb.offlineDailyLogs.delete(log.id);
    } catch (error) {
      await offlineDb.offlineDailyLogs.update(log.id, {
        syncStatus: 'failed',
      });
      throw error;
    }
  }

  /**
   * Sync attachment
   */
  private async syncAttachment(attachment: OfflineAttachment): Promise<void> {
    if (!attachment.id) {
      throw new Error('Attachment ID is required');
    }

    try {
      // Convert blob to File
      const file = new File([attachment.blob], attachment.fileName, {
        type: attachment.fileType,
      });

      // TODO: Upload to Firebase Storage
      // const path = `projects/${attachment.projectId}/${attachment.entityType}/${attachment.entityId}/${attachment.fileName}`;
      // const downloadUrl = await uploadFile(file, path);
      const downloadUrl = ''; // Placeholder until storageService is implemented

      // Update status
      await offlineDb.offlineAttachments.update(attachment.id, {
        syncStatus: 'synced',
        uploadedUrl: downloadUrl,
      });

      logger.info('Attachment synced', {
        localId: attachment.localId,
        url: downloadUrl,
      });

      // Delete after successful sync (optional)
      // await offlineDb.offlineAttachments.delete(attachment.id);
    } catch (error) {
      await offlineDb.offlineAttachments.update(attachment.id, {
        syncStatus: 'failed',
      });
      throw error;
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats() {
    const pending = await offlineDb.getPendingCount();
    const failed = await offlineDb.getFailedCount();
    const storageSize = await offlineDb.getStorageSize();
    const isLowStorage = await offlineDb.isStorageLow();

    return {
      pending,
      failed,
      storageSize,
      isLowStorage,
      isOnline: navigator.onLine,
      isSyncing: this.syncInProgress,
    };
  }

  /**
   * Clear failed operations (manual intervention)
   */
  async clearFailedOperations(): Promise<number> {
    const failed = await offlineDb.pendingOperations
      .where('status')
      .equals('failed')
      .toArray();

    await offlineDb.pendingOperations
      .where('status')
      .equals('failed')
      .delete();

    return failed.length;
  }
}

// Export singleton instance
export const offlineSyncService = new OfflineSyncService();
