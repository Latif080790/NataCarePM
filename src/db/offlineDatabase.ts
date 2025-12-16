/**
 * OFFLINE DATABASE CONFIGURATION
 * IndexedDB setup untuk offline-first functionality
 * Last Updated: December 16, 2025
 */

import Dexie, { Table } from 'dexie';

/**
 * PENDING OPERATIONS
 * Queue untuk operasi yang belum ter-sync ke server
 */
export interface PendingOperation {
  id?: number;
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId?: string;
  data: any;
  projectId: string;
  userId: string;
  userName: string;
  timestamp: number;
  retryCount: number;
  lastError?: string;
  status: 'pending' | 'syncing' | 'failed';
}

/**
 * OFFLINE DATA CACHE
 * Cache untuk data yang sering diakses
 */
export interface OfflineCache {
  id?: string;
  key: string;
  data: any;
  projectId: string;
  collection: string;
  timestamp: number;
  expiresAt?: number;
}

/**
 * OFFLINE DAILY LOGS
 * Daily logs yang dibuat saat offline
 */
export interface OfflineDailyLog {
  id?: string;
  localId: string; // Temporary ID before sync
  projectId: string;
  date: string;
  weather: string;
  temperature: number;
  activities: string;
  issues: string;
  photos: string[]; // Base64 or Blob URLs
  workProgress: any[];
  attendance: any[];
  createdBy: string;
  createdAt: number;
  syncStatus: 'pending' | 'synced' | 'failed';
  serverDocId?: string; // Firebase document ID after sync
}

/**
 * OFFLINE ATTACHMENTS
 * Photos & documents yang belum ter-upload
 */
export interface OfflineAttachment {
  id?: string;
  localId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  blob: Blob;
  base64?: string;
  projectId: string;
  entityType: string;
  entityId: string;
  uploadedUrl?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  createdAt: number;
}

/**
 * SYNC LOG
 * History sync untuk debugging
 */
export interface SyncLog {
  id?: number;
  operationId: number;
  action: string;
  status: 'success' | 'failed';
  errorMessage?: string;
  syncedAt: number;
  duration: number;
}

/**
 * DATABASE CLASS
 */
class OfflineDatabase extends Dexie {
  // Tables
  pendingOperations!: Table<PendingOperation, number>;
  offlineCache!: Table<OfflineCache, string>;
  offlineDailyLogs!: Table<OfflineDailyLog, string>;
  offlineAttachments!: Table<OfflineAttachment, string>;
  syncLogs!: Table<SyncLog, number>;

  constructor() {
    super('NataCarePMOffline');
    
    // Define schema version 1
    this.version(1).stores({
      pendingOperations: '++id, projectId, userId, collection, status, timestamp',
      offlineCache: 'id, key, projectId, collection, timestamp',
      offlineDailyLogs: 'id, localId, projectId, syncStatus, date',
      offlineAttachments: 'id, localId, projectId, entityType, entityId, syncStatus',
      syncLogs: '++id, operationId, syncedAt',
    });
  }

  /**
   * Clear all offline data (use with caution!)
   */
  async clearAll() {
    await this.pendingOperations.clear();
    await this.offlineCache.clear();
    await this.offlineDailyLogs.clear();
    await this.offlineAttachments.clear();
    await this.syncLogs.clear();
  }

  /**
   * Get pending operations count
   */
  async getPendingCount(): Promise<number> {
    return await this.pendingOperations.where('status').equals('pending').count();
  }

  /**
   * Get failed operations count
   */
  async getFailedCount(): Promise<number> {
    return await this.pendingOperations.where('status').equals('failed').count();
  }

  /**
   * Get database size estimate (in bytes)
   */
  async getStorageSize(): Promise<number> {
    if (!navigator.storage || !navigator.storage.estimate) {
      return 0;
    }
    
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }

  /**
   * Check if storage quota is running low
   */
  async isStorageLow(): Promise<boolean> {
    if (!navigator.storage || !navigator.storage.estimate) {
      return false;
    }
    
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    
    // Alert if using more than 80% of quota
    return quota > 0 && (usage / quota) > 0.8;
  }
}

// Export singleton instance
export const offlineDb = new OfflineDatabase();

// Export types
export type { Table };

/**
 * UTILITY FUNCTIONS
 */

/**
 * Generate unique local ID
 */
export function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if browser supports IndexedDB
 */
export function isIndexedDBSupported(): boolean {
  return 'indexedDB' in window;
}

/**
 * Request persistent storage (to prevent data eviction)
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage || !navigator.storage.persist) {
    return false;
  }

  try {
    const isPersisted = await navigator.storage.persisted();
    if (isPersisted) {
      return true;
    }

    const granted = await navigator.storage.persist();
    return granted;
  } catch (error) {
    console.error('Failed to request persistent storage:', error);
    return false;
  }
}
