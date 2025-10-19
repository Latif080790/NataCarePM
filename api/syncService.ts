/**
 * Offline Sync Service
 * Phase 3.5: Mobile Offline Inspections
 * 
 * Handles synchronization between offline IndexedDB and Firebase
 * Manages conflict resolution, retry logic, and background sync
 */

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
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import type {
  OfflineInspection,
  SyncQueueItem,
  SyncConflict,
  NetworkStatus,
  BackgroundSyncTask,
  ConflictResolution,
} from '@/types/offline.types';
import * as IndexedDB from '@/utils/indexedDB';

const INSPECTIONS_COLLECTION = 'offlineInspections';
const SYNC_BATCH_SIZE = 10;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Get device information
 */
const getDeviceInfo = () => {
  return {
    platform: navigator.platform,
    os: navigator.userAgent,
    browser: navigator.userAgent.split(' ').pop() || 'unknown',
    appVersion: '1.0.0', // From package.json
  };
};

/**
 * Generate unique device ID
 */
const getDeviceId = async (): Promise<string> => {
  let deviceId = await IndexedDB.getMetadata('deviceId');
  
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    await IndexedDB.saveMetadata('deviceId', deviceId);
  }
  
  return deviceId;
};

/**
 * Get current network status
 */
export const getNetworkStatus = (): NetworkStatus => {
  const online = navigator.onLine;
  
  // Network Information API (experimental)
  const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;
  
  const status: NetworkStatus = {
    online,
  };
  
  if (connection) {
    status.type = connection.type as any;
    status.effectiveType = connection.effectiveType;
    status.downlink = connection.downlink;
    status.rtt = connection.rtt;
    status.saveData = connection.saveData;
  }
  
  return status;
};

/**
 * Check if network is suitable for sync
 */
export const canSync = (): boolean => {
  const network = getNetworkStatus();
  
  if (!network.online) {
    return false;
  }
  
  // Don't sync on slow connections if data saver is on
  if (network.saveData && network.effectiveType === 'slow-2g') {
    return false;
  }
  
  return true;
};

class SyncService {
  private syncInProgress = false;
  private currentTask: BackgroundSyncTask | null = null;

  /**
   * Create offline inspection
   */
  async createOfflineInspection(
    projectId: string,
    inspectionType: string,
    data: OfflineInspection['data']
  ): Promise<OfflineInspection> {
    const deviceId = await getDeviceId();
    const localId = `inspection-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const inspection: OfflineInspection = {
      id: localId,
      localId,
      projectId,
      inspectionType,
      offlineMetadata: {
        createdOffline: true,
        lastModifiedOffline: new Date(),
        deviceId,
        deviceInfo: getDeviceInfo(),
        networkStatus: navigator.onLine ? 'online' : 'offline',
      },
      syncStatus: 'pending',
      syncRetryCount: 0,
      data,
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Save to IndexedDB
    await IndexedDB.saveInspection(inspection);
    
    // Add to sync queue
    const queueItem: SyncQueueItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      type: 'inspection',
      entityId: localId,
      operation: 'create',
      direction: 'upload',
      priority: 100,
      data: inspection,
      status: 'pending',
      retryCount: 0,
      maxRetries: MAX_RETRY_ATTEMPTS,
      createdAt: new Date(),
    };
    
    await IndexedDB.addToSyncQueue(queueItem);
    
    // Try immediate sync if online
    if (canSync()) {
      this.syncNow().catch(console.error);
    }
    
    return inspection;
  }

  /**
   * Update offline inspection
   */
  async updateOfflineInspection(
    localId: string,
    updates: Partial<OfflineInspection['data']>
  ): Promise<void> {
    const inspection = await IndexedDB.getInspection(localId);
    
    if (!inspection) {
      throw new Error(`Inspection ${localId} not found`);
    }
    
    const updatedInspection: OfflineInspection = {
      ...inspection,
      data: {
        ...inspection.data,
        ...updates,
      },
      offlineMetadata: {
        ...inspection.offlineMetadata,
        lastModifiedOffline: new Date(),
      },
      syncStatus: 'pending',
      updatedAt: new Date(),
    };
    
    await IndexedDB.saveInspection(updatedInspection);
    
    // Add to sync queue
    const queueItem: SyncQueueItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      type: 'inspection',
      entityId: localId,
      operation: 'update',
      direction: 'upload',
      priority: 90,
      data: updatedInspection,
      status: 'pending',
      retryCount: 0,
      maxRetries: MAX_RETRY_ATTEMPTS,
      createdAt: new Date(),
    };
    
    await IndexedDB.addToSyncQueue(queueItem);
    
    if (canSync()) {
      this.syncNow().catch(console.error);
    }
  }

  /**
   * Add attachment to inspection
   */
  async addAttachment(
    inspectionId: string,
    file: File
  ): Promise<string> {
    const attachmentId = `attachment-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Save blob to IndexedDB
    await IndexedDB.saveAttachment({
      id: attachmentId,
      inspectionId,
      blob: file,
      fileName: file.name,
      mimeType: file.type,
      uploaded: false,
      createdAt: new Date(),
    });
    
    // Update inspection
    const inspection = await IndexedDB.getInspection(inspectionId);
    if (inspection) {
      const attachment: OfflineInspection['attachments'][0] = {
        id: attachmentId,
        type: file.type.startsWith('image/') ? 'photo' : 
              file.type.startsWith('video/') ? 'video' : 'document',
        localPath: attachmentId, // Reference to IndexedDB
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploaded: false,
      };
      
      inspection.attachments.push(attachment);
      await IndexedDB.saveInspection(inspection);
      
      // Add to sync queue
      const queueItem: SyncQueueItem = {
        id: `sync-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        type: 'attachment',
        entityId: attachmentId,
        operation: 'create',
        direction: 'upload',
        priority: 80,
        data: { inspectionId, attachmentId },
        status: 'pending',
        retryCount: 0,
        maxRetries: MAX_RETRY_ATTEMPTS,
        createdAt: new Date(),
      };
      
      await IndexedDB.addToSyncQueue(queueItem);
    }
    
    if (canSync()) {
      this.syncNow().catch(console.error);
    }
    
    return attachmentId;
  }

  /**
   * Sync now (manual trigger)
   */
  async syncNow(): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }
    
    if (!canSync()) {
      console.log('Cannot sync: network unsuitable');
      return;
    }
    
    this.syncInProgress = true;
    
    try {
      const pendingItems = await IndexedDB.getPendingSyncQueue();
      
      if (pendingItems.length === 0) {
        console.log('No items to sync');
        return;
      }
      
      // Create background task
      this.currentTask = {
        id: `task-${Date.now()}`,
        tag: 'manual-sync',
        type: 'sync',
        itemsTotal: pendingItems.length,
        itemsProcessed: 0,
        itemsFailed: 0,
        progress: 0,
        startedAt: new Date(),
        status: 'running',
      };
      
      // Process in batches
      for (let i = 0; i < pendingItems.length; i += SYNC_BATCH_SIZE) {
        const batch = pendingItems.slice(i, i + SYNC_BATCH_SIZE);
        
        await Promise.all(
          batch.map((item) => this.processSyncItem(item))
        );
        
        if (this.currentTask) {
          this.currentTask.itemsProcessed = Math.min(
            i + SYNC_BATCH_SIZE,
            pendingItems.length
          );
          this.currentTask.progress =
            (this.currentTask.itemsProcessed / this.currentTask.itemsTotal) * 100;
        }
      }
      
      if (this.currentTask) {
        this.currentTask.status = 'completed';
        this.currentTask.completedAt = new Date();
      }
      
      // Update last sync time
      await IndexedDB.saveMetadata('lastSync', new Date());
      
    } catch (error) {
      console.error('Sync failed:', error);
      if (this.currentTask) {
        this.currentTask.status = 'failed';
        this.currentTask.error = error instanceof Error ? error.message : 'Unknown error';
      }
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Process individual sync queue item
   */
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    try {
      await IndexedDB.updateSyncQueueItem(item.id, { status: 'syncing' });
      
      switch (item.type) {
        case 'inspection':
          await this.syncInspection(item);
          break;
        case 'attachment':
          await this.syncAttachment(item);
          break;
        default:
          console.warn(`Unknown sync item type: ${item.type}`);
      }
      
      await IndexedDB.updateSyncQueueItem(item.id, {
        status: 'synced',
        processedAt: new Date(),
      });
      
      // Remove from queue after successful sync
      await IndexedDB.removeFromSyncQueue(item.id);
      
    } catch (error) {
      console.error(`Failed to sync item ${item.id}:`, error);
      
      const retryCount = item.retryCount + 1;
      
      if (retryCount >= item.maxRetries) {
        await IndexedDB.updateSyncQueueItem(item.id, {
          status: 'failed',
          retryCount,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        
        if (this.currentTask) {
          this.currentTask.itemsFailed++;
        }
      } else {
        // Schedule retry
        await IndexedDB.updateSyncQueueItem(item.id, {
          status: 'pending',
          retryCount,
          scheduledAt: new Date(Date.now() + RETRY_DELAY_MS * retryCount),
        });
      }
    }
  }

  /**
   * Sync inspection to Firebase
   */
  private async syncInspection(item: SyncQueueItem): Promise<void> {
    const inspection = item.data as OfflineInspection;
    
    if (item.operation === 'create') {
      // Check if already synced
      if (inspection.remoteId) {
        console.log(`Inspection ${inspection.localId} already has remoteId`);
        return;
      }
      
      // Upload to Firebase
      const docData = {
        localId: inspection.localId,
        projectId: inspection.projectId,
        inspectionType: inspection.inspectionType,
        offlineMetadata: {
          ...inspection.offlineMetadata,
          lastModifiedOffline: Timestamp.fromDate(inspection.offlineMetadata.lastModifiedOffline),
        },
        data: {
          ...inspection.data,
          scheduledDate: Timestamp.fromDate(inspection.data.scheduledDate),
          actualDate: inspection.data.actualDate
            ? Timestamp.fromDate(inspection.data.actualDate)
            : null,
        },
        createdAt: Timestamp.fromDate(inspection.createdAt),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, INSPECTIONS_COLLECTION), docData);
      
      // Update local record with remoteId
      await IndexedDB.updateInspection(inspection.localId, {
        remoteId: docRef.id,
        syncStatus: 'synced',
        lastSyncSuccess: new Date(),
      });
      
    } else if (item.operation === 'update') {
      if (!inspection.remoteId) {
        throw new Error('Cannot update inspection without remoteId');
      }
      
      // Check for conflicts
      const remoteDoc = await getDoc(doc(db, INSPECTIONS_COLLECTION, inspection.remoteId));
      
      if (remoteDoc.exists()) {
        const remoteData = remoteDoc.data();
        const remoteUpdatedAt = remoteData.updatedAt?.toDate();
        
        if (remoteUpdatedAt && remoteUpdatedAt > inspection.updatedAt) {
          // Conflict detected
          await this.handleConflict(inspection, remoteData);
          return;
        }
      }
      
      // No conflict, update
      await updateDoc(doc(db, INSPECTIONS_COLLECTION, inspection.remoteId), {
        data: {
          ...inspection.data,
          scheduledDate: Timestamp.fromDate(inspection.data.scheduledDate),
          actualDate: inspection.data.actualDate
            ? Timestamp.fromDate(inspection.data.actualDate)
            : null,
        },
        updatedAt: serverTimestamp(),
      });
      
      await IndexedDB.updateInspection(inspection.localId, {
        syncStatus: 'synced',
        lastSyncSuccess: new Date(),
      });
      
    } else if (item.operation === 'delete') {
      if (inspection.remoteId) {
        await deleteDoc(doc(db, INSPECTIONS_COLLECTION, inspection.remoteId));
      }
      await IndexedDB.deleteInspection(inspection.localId);
    }
  }

  /**
   * Sync attachment to Firebase Storage
   */
  private async syncAttachment(item: SyncQueueItem): Promise<void> {
    const { inspectionId, attachmentId } = item.data;
    
    const attachment = await IndexedDB.getAttachment(attachmentId);
    if (!attachment) {
      throw new Error(`Attachment ${attachmentId} not found`);
    }
    
    const inspection = await IndexedDB.getInspection(inspectionId);
    if (!inspection || !inspection.remoteId) {
      throw new Error('Inspection must be synced before attachments');
    }
    
    // Upload to Firebase Storage
    const storageRef = ref(
      storage,
      `inspections/${inspection.remoteId}/attachments/${attachmentId}`
    );
    
    await uploadBytes(storageRef, attachment.blob, {
      contentType: attachment.mimeType,
    });
    
    const downloadURL = await getDownloadURL(storageRef);
    
    // Update local attachment record
    await IndexedDB.updateAttachmentUploadStatus(attachmentId, true, 100);
    
    // Update inspection attachment reference
    const attachmentIndex = inspection.attachments.findIndex(
      (a) => a.id === attachmentId
    );
    
    if (attachmentIndex !== -1) {
      inspection.attachments[attachmentIndex].remoteUrl = downloadURL;
      inspection.attachments[attachmentIndex].uploaded = true;
      inspection.attachments[attachmentIndex].uploadProgress = 100;
      
      await IndexedDB.saveInspection(inspection);
      
      // Update remote inspection document
      await updateDoc(doc(db, INSPECTIONS_COLLECTION, inspection.remoteId), {
        attachments: inspection.attachments.map((a) => ({
          id: a.id,
          type: a.type,
          fileName: a.fileName,
          fileSize: a.fileSize,
          mimeType: a.mimeType,
          remoteUrl: a.remoteUrl,
        })),
      });
    }
  }

  /**
   * Handle sync conflict
   */
  private async handleConflict(
    localInspection: OfflineInspection,
    remoteData: any
  ): Promise<void> {
    const conflict: SyncConflict = {
      id: `conflict-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      entityType: 'inspection',
      entityId: localInspection.localId,
      localVersion: {
        data: localInspection,
        timestamp: localInspection.updatedAt,
        deviceId: localInspection.offlineMetadata.deviceId,
      },
      remoteVersion: {
        data: remoteData,
        timestamp: remoteData.updatedAt?.toDate() || new Date(),
        userId: remoteData.userId || 'unknown',
      },
      resolution: 'latest_wins', // Default strategy
      status: 'pending',
      createdAt: new Date(),
    };
    
    await IndexedDB.saveConflict(conflict);
    
    // Update inspection status
    await IndexedDB.updateInspection(localInspection.localId, {
      syncStatus: 'conflict',
    });
    
    // Auto-resolve based on strategy
    await this.autoResolveConflict(conflict);
  }

  /**
   * Auto-resolve conflict based on resolution strategy
   */
  private async autoResolveConflict(conflict: SyncConflict): Promise<void> {
    let resolvedData: any;
    
    switch (conflict.resolution) {
      case 'local_wins':
        resolvedData = conflict.localVersion.data;
        break;
        
      case 'remote_wins':
        resolvedData = conflict.remoteVersion.data;
        break;
        
      case 'latest_wins':
        resolvedData =
          conflict.localVersion.timestamp > conflict.remoteVersion.timestamp
            ? conflict.localVersion.data
            : conflict.remoteVersion.data;
        break;
        
      case 'manual':
        // Don't auto-resolve, wait for user intervention
        return;
        
      default:
        resolvedData = conflict.localVersion.data;
    }
    
    await IndexedDB.resolveConflict(conflict.id, resolvedData, 'system');
    
    // Apply resolution
    const inspection = resolvedData as OfflineInspection;
    await IndexedDB.saveInspection({
      ...inspection,
      syncStatus: 'pending',
    });
  }

  /**
   * Manual conflict resolution
   */
  async resolveConflictManually(
    conflictId: string,
    resolution: 'local' | 'remote' | 'merge',
    mergedData?: any
  ): Promise<void> {
    const conflicts = await IndexedDB.getAllConflicts();
    const conflict = conflicts.find((c) => c.id === conflictId);
    
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }
    
    let resolvedData: any;
    
    switch (resolution) {
      case 'local':
        resolvedData = conflict.localVersion.data;
        break;
      case 'remote':
        resolvedData = conflict.remoteVersion.data;
        break;
      case 'merge':
        if (!mergedData) {
          throw new Error('Merged data required for merge resolution');
        }
        resolvedData = mergedData;
        break;
    }
    
    await IndexedDB.resolveConflict(conflictId, resolvedData, 'user');
    
    // Update inspection
    const inspection = resolvedData as OfflineInspection;
    await IndexedDB.saveInspection({
      ...inspection,
      syncStatus: 'pending',
    });
    
    // Trigger sync
    if (canSync()) {
      await this.syncNow();
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    const pendingQueue = await IndexedDB.getPendingSyncQueue();
    const failedQueue = await IndexedDB.getSyncQueueByStatus('failed');
    const conflicts = await IndexedDB.getPendingConflicts();
    const stats = await IndexedDB.getStorageStats();
    
    return {
      pending: pendingQueue.length,
      failed: failedQueue.length,
      conflicts: conflicts.length,
      inProgress: this.syncInProgress,
      currentTask: this.currentTask,
      lastSync: stats.lastSync,
      storageUsage: stats.storageQuota,
    };
  }

  /**
   * Clear all synced data
   */
  async clearSyncedData(): Promise<void> {
    const syncedInspections = await IndexedDB.getInspectionsByStatus('synced');
    
    for (const inspection of syncedInspections) {
      // Keep inspections that have local-only changes
      if (inspection.offlineMetadata.lastModifiedOffline > (inspection.lastSyncSuccess || new Date(0))) {
        continue;
      }
      
      await IndexedDB.deleteInspection(inspection.localId);
    }
    
    await IndexedDB.clearCompletedSyncQueue();
  }
}

export default new SyncService();
