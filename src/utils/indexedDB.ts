/**
 * IndexedDB Offline Storage Utility
 * Phase 3.5: Mobile Offline Inspections
 *
 * Provides offline-first data persistence with IndexedDB
 * Supports inspections, attachments, and sync queue management
 */

import type {
  OfflineInspection,
  SyncQueueItem,
  SyncConflict,
  OfflineStorageMetadata,
} from '@/types/offline.types';

const DB_NAME = 'NataCarePM_Offline';
const DB_VERSION = 1;

// Object Store Names
const STORES = {
  INSPECTIONS: 'inspections',
  ATTACHMENTS: 'attachments',
  SYNC_QUEUE: 'syncQueue',
  CONFLICTS: 'conflicts',
  METADATA: 'metadata',
} as const;

/**
 * Initialize IndexedDB database with schema
 */
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Inspections Store
      if (!db.objectStoreNames.contains(STORES.INSPECTIONS)) {
        const inspectionStore = db.createObjectStore(STORES.INSPECTIONS, {
          keyPath: 'localId',
        });
        inspectionStore.createIndex('remoteId', 'remoteId', { unique: false });
        inspectionStore.createIndex('projectId', 'projectId', { unique: false });
        inspectionStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        inspectionStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Attachments Store (for photos, videos, documents)
      if (!db.objectStoreNames.contains(STORES.ATTACHMENTS)) {
        const attachmentStore = db.createObjectStore(STORES.ATTACHMENTS, {
          keyPath: 'id',
        });
        attachmentStore.createIndex('inspectionId', 'inspectionId', { unique: false });
        attachmentStore.createIndex('uploaded', 'uploaded', { unique: false });
      }

      // Sync Queue Store
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, {
          keyPath: 'id',
        });
        syncStore.createIndex('status', 'status', { unique: false });
        syncStore.createIndex('priority', 'priority', { unique: false });
        syncStore.createIndex('type', 'type', { unique: false });
      }

      // Conflicts Store
      if (!db.objectStoreNames.contains(STORES.CONFLICTS)) {
        const conflictStore = db.createObjectStore(STORES.CONFLICTS, {
          keyPath: 'id',
        });
        conflictStore.createIndex('status', 'status', { unique: false });
        conflictStore.createIndex('entityType', 'entityType', { unique: false });
      }

      // Metadata Store
      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
      }
    };
  });
};

/**
 * Generic database operation wrapper
 */
const dbOperation = async <T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const db = await initDB();
  const transaction = db.transaction(storeName, mode);
  const store = transaction.objectStore(storeName);
  const request = operation(store);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// ==================== INSPECTION OPERATIONS ====================

/**
 * Save offline inspection
 */
export const saveInspection = async (inspection: OfflineInspection): Promise<void> => {
  await dbOperation(STORES.INSPECTIONS, 'readwrite', (store) => store.put(inspection));
};

/**
 * Get inspection by local ID
 */
export const getInspection = async (localId: string): Promise<OfflineInspection | undefined> => {
  return dbOperation(STORES.INSPECTIONS, 'readonly', (store) => store.get(localId));
};

/**
 * Get all inspections
 */
export const getAllInspections = async (): Promise<OfflineInspection[]> => {
  return dbOperation(STORES.INSPECTIONS, 'readonly', (store) => store.getAll());
};

/**
 * Get inspections by project
 */
export const getInspectionsByProject = async (projectId: string): Promise<OfflineInspection[]> => {
  const db = await initDB();
  const transaction = db.transaction(STORES.INSPECTIONS, 'readonly');
  const store = transaction.objectStore(STORES.INSPECTIONS);
  const index = store.index('projectId');
  const request = index.getAll(projectId);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get inspections by sync status
 */
export const getInspectionsByStatus = async (
  status: OfflineInspection['syncStatus']
): Promise<OfflineInspection[]> => {
  const db = await initDB();
  const transaction = db.transaction(STORES.INSPECTIONS, 'readonly');
  const store = transaction.objectStore(STORES.INSPECTIONS);
  const index = store.index('syncStatus');
  const request = index.getAll(status);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Update inspection
 */
export const updateInspection = async (
  localId: string,
  updates: Partial<OfflineInspection>
): Promise<void> => {
  const existing = await getInspection(localId);
  if (!existing) {
    throw new Error(`Inspection ${localId} not found`);
  }

  const updated: OfflineInspection = {
    ...existing,
    ...updates,
    updatedAt: new Date(),
  };

  await saveInspection(updated);
};

/**
 * Delete inspection
 */
export const deleteInspection = async (localId: string): Promise<void> => {
  await dbOperation(STORES.INSPECTIONS, 'readwrite', (store) => store.delete(localId));
};

// ==================== ATTACHMENT OPERATIONS ====================

interface OfflineAttachment {
  id: string;
  inspectionId: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
  uploaded: boolean;
  uploadProgress?: number;
  createdAt: Date;
}

/**
 * Save attachment blob
 */
export const saveAttachment = async (attachment: OfflineAttachment): Promise<void> => {
  await dbOperation(STORES.ATTACHMENTS, 'readwrite', (store) => store.put(attachment));
};

/**
 * Get attachment
 */
export const getAttachment = async (id: string): Promise<OfflineAttachment | undefined> => {
  return dbOperation(STORES.ATTACHMENTS, 'readonly', (store) => store.get(id));
};

/**
 * Get attachments by inspection
 */
export const getAttachmentsByInspection = async (
  inspectionId: string
): Promise<OfflineAttachment[]> => {
  const db = await initDB();
  const transaction = db.transaction(STORES.ATTACHMENTS, 'readonly');
  const store = transaction.objectStore(STORES.ATTACHMENTS);
  const index = store.index('inspectionId');
  const request = index.getAll(inspectionId);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get pending attachments (not uploaded)
 */
export const getPendingAttachments = async (): Promise<OfflineAttachment[]> => {
  const allAttachments = await dbOperation(STORES.ATTACHMENTS, 'readonly', (store) =>
    store.getAll()
  );
  return allAttachments.filter((attachment) => !attachment.uploaded);
};

/**
 * Update attachment upload status
 */
export const updateAttachmentUploadStatus = async (
  id: string,
  uploaded: boolean,
  uploadProgress?: number
): Promise<void> => {
  const existing = await getAttachment(id);
  if (!existing) {
    throw new Error(`Attachment ${id} not found`);
  }

  await saveAttachment({
    ...existing,
    uploaded,
    uploadProgress,
  });
};

/**
 * Delete attachment
 */
export const deleteAttachment = async (id: string): Promise<void> => {
  await dbOperation(STORES.ATTACHMENTS, 'readwrite', (store) => store.delete(id));
};

// ==================== SYNC QUEUE OPERATIONS ====================

/**
 * Add item to sync queue
 */
export const addToSyncQueue = async (item: SyncQueueItem): Promise<void> => {
  await dbOperation(STORES.SYNC_QUEUE, 'readwrite', (store) => store.put(item));
};

/**
 * Get sync queue items by status
 */
export const getSyncQueueByStatus = async (
  status: SyncQueueItem['status']
): Promise<SyncQueueItem[]> => {
  const db = await initDB();
  const transaction = db.transaction(STORES.SYNC_QUEUE, 'readonly');
  const store = transaction.objectStore(STORES.SYNC_QUEUE);
  const index = store.index('status');
  const request = index.getAll(status);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get pending sync queue items sorted by priority
 */
export const getPendingSyncQueue = async (): Promise<SyncQueueItem[]> => {
  const items = await getSyncQueueByStatus('pending');
  return items.sort((a, b) => b.priority - a.priority);
};

/**
 * Update sync queue item
 */
export const updateSyncQueueItem = async (
  id: string,
  updates: Partial<SyncQueueItem>
): Promise<void> => {
  const db = await initDB();
  const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
  const store = transaction.objectStore(STORES.SYNC_QUEUE);
  const request = store.get(id);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const existing = request.result;
      if (!existing) {
        reject(new Error(`Sync queue item ${id} not found`));
        return;
      }

      const updated = { ...existing, ...updates };
      const putRequest = store.put(updated);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
};

/**
 * Remove from sync queue
 */
export const removeFromSyncQueue = async (id: string): Promise<void> => {
  await dbOperation(STORES.SYNC_QUEUE, 'readwrite', (store) => store.delete(id));
};

/**
 * Clear completed sync queue items
 */
export const clearCompletedSyncQueue = async (): Promise<void> => {
  const completed = await getSyncQueueByStatus('synced');
  const db = await initDB();
  const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
  const store = transaction.objectStore(STORES.SYNC_QUEUE);

  completed.forEach((item) => {
    store.delete(item.id);
  });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

// ==================== CONFLICT OPERATIONS ====================

/**
 * Save sync conflict
 */
export const saveConflict = async (conflict: SyncConflict): Promise<void> => {
  await dbOperation(STORES.CONFLICTS, 'readwrite', (store) => store.put(conflict));
};

/**
 * Get all conflicts
 */
export const getAllConflicts = async (): Promise<SyncConflict[]> => {
  return dbOperation(STORES.CONFLICTS, 'readonly', (store) => store.getAll());
};

/**
 * Get pending conflicts
 */
export const getPendingConflicts = async (): Promise<SyncConflict[]> => {
  const db = await initDB();
  const transaction = db.transaction(STORES.CONFLICTS, 'readonly');
  const store = transaction.objectStore(STORES.CONFLICTS);
  const index = store.index('status');
  const request = index.getAll('pending');

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Resolve conflict
 */
export const resolveConflict = async (
  id: string,
  resolvedData: any,
  resolvedBy: string
): Promise<void> => {
  const db = await initDB();
  const transaction = db.transaction(STORES.CONFLICTS, 'readwrite');
  const store = transaction.objectStore(STORES.CONFLICTS);
  const request = store.get(id);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const conflict = request.result;
      if (!conflict) {
        reject(new Error(`Conflict ${id} not found`));
        return;
      }

      const resolved: SyncConflict = {
        ...conflict,
        status: 'resolved',
        resolvedData,
        resolvedBy,
        resolvedAt: new Date(),
      };

      const putRequest = store.put(resolved);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
};

/**
 * Delete conflict
 */
export const deleteConflict = async (id: string): Promise<void> => {
  await dbOperation(STORES.CONFLICTS, 'readwrite', (store) => store.delete(id));
};

// ==================== METADATA OPERATIONS ====================

/**
 * Save metadata
 */
export const saveMetadata = async (key: string, value: any): Promise<void> => {
  await dbOperation(STORES.METADATA, 'readwrite', (store) =>
    store.put({ key, value, updatedAt: new Date() })
  );
};

/**
 * Get metadata
 */
export const getMetadata = async (key: string): Promise<any> => {
  const result = await dbOperation(STORES.METADATA, 'readonly', (store) => store.get(key));
  return result?.value;
};

/**
 * Get storage statistics
 */
export const getStorageStats = async (): Promise<OfflineStorageMetadata> => {
//   const db = await initDB(); // Unused variable

  // Count records in each store
  const inspectionsCount = await dbOperation(STORES.INSPECTIONS, 'readonly', (store) =>
    store.count()
  );

  const attachmentsCount = await dbOperation(STORES.ATTACHMENTS, 'readonly', (store) =>
    store.count()
  );

  const syncQueueCount = await dbOperation(STORES.SYNC_QUEUE, 'readonly', (store) => store.count());

  const conflictsCount = await dbOperation(STORES.CONFLICTS, 'readonly', (store) => store.count());

  // Get pending/failed sync counts
  const pendingSync = (await getSyncQueueByStatus('pending')).length;
  const failedSync = (await getSyncQueueByStatus('failed')).length;
  const pendingConflicts = (await getPendingConflicts()).length;

  // Estimate storage size
  const estimateSize = async (): Promise<{ usage: number; quota: number }> => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return { usage: 0, quota: 0 };
  };

  const { usage, quota } = await estimateSize();

  const metadata: OfflineStorageMetadata = {
    version: DB_VERSION.toString(),
    lastSync: (await getMetadata('lastSync')) || new Date(0),
    deviceId: (await getMetadata('deviceId')) || 'unknown',
    databases: [
      {
        name: STORES.INSPECTIONS,
        version: DB_VERSION,
        size: 0, // Would need more complex calculation
        recordCount: inspectionsCount,
      },
      {
        name: STORES.ATTACHMENTS,
        version: DB_VERSION,
        size: 0,
        recordCount: attachmentsCount,
      },
      {
        name: STORES.SYNC_QUEUE,
        version: DB_VERSION,
        size: 0,
        recordCount: syncQueueCount,
      },
      {
        name: STORES.CONFLICTS,
        version: DB_VERSION,
        size: 0,
        recordCount: conflictsCount,
      },
    ],
    pendingSync,
    failedSync,
    conflicts: pendingConflicts,
    storageQuota: {
      usage,
      quota,
      percentage: quota > 0 ? (usage / quota) * 100 : 0,
    },
  };

  return metadata;
};

/**
 * Clear all offline data
 */
export const clearAllData = async (): Promise<void> => {
  const db = await initDB();
  const storeNames = [STORES.INSPECTIONS, STORES.ATTACHMENTS, STORES.SYNC_QUEUE, STORES.CONFLICTS];

  const transaction = db.transaction(storeNames, 'readwrite');

  storeNames.forEach((storeName) => {
    const store = transaction.objectStore(storeName);
    store.clear();
  });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export default {
  initDB,
  // Inspections
  saveInspection,
  getInspection,
  getAllInspections,
  getInspectionsByProject,
  getInspectionsByStatus,
  updateInspection,
  deleteInspection,
  // Attachments
  saveAttachment,
  getAttachment,
  getAttachmentsByInspection,
  getPendingAttachments,
  updateAttachmentUploadStatus,
  deleteAttachment,
  // Sync Queue
  addToSyncQueue,
  getSyncQueueByStatus,
  getPendingSyncQueue,
  updateSyncQueueItem,
  removeFromSyncQueue,
  clearCompletedSyncQueue,
  // Conflicts
  saveConflict,
  getAllConflicts,
  getPendingConflicts,
  resolveConflict,
  deleteConflict,
  // Metadata
  saveMetadata,
  getMetadata,
  getStorageStats,
  clearAllData,
};
