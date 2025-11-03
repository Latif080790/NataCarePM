/**
 * Offline Data Management Service
 * NataCarePM Mobile App
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
// import { logger } from '@/utils/logger.enhanced';
const logger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
};

// Import construction types
import type { Rfi, Submittal, DailyLog } from '../../../src/types/construction.types';

// Extended interfaces with sync status
interface OfflineRfi extends Rfi {
  syncStatus?: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
}

interface OfflineSubmittal extends Submittal {
  syncStatus?: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
}

interface OfflineDailyLog extends DailyLog {
  syncStatus?: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
}

// Define database schema
interface NataCarePMDB extends DBSchema {
  offline_data: {
    key: string;
    value: {
      key: string;
      data: any;
      timestamp: number;
      type: string;
      projectId?: string;
    };
    indexes: { 'by-type': string; 'by-project': string; 'by-timestamp': number };
  };
  sync_queue: {
    key: string;
    value: {
      id: string;
      operation: 'create' | 'update' | 'delete';
      entityType: string;
      data: any;
      timestamp: number;
      attempts: number;
      projectId?: string;
    };
    indexes: { 'by-timestamp': number; 'by-project': string };
  };
  // Construction-specific stores
  offline_rfis: {
    key: string;
    value: {
      id: string;
      data: Rfi;
      timestamp: number;
      projectId: string;
      syncStatus: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
    };
    indexes: { 'by-project': string; 'by-timestamp': number; 'by-sync-status': string };
  };
  offline_submittals: {
    key: string;
    value: {
      id: string;
      data: Submittal;
      timestamp: number;
      projectId: string;
      syncStatus: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
    };
    indexes: { 'by-project': string; 'by-timestamp': number; 'by-sync-status': string };
  };
  offline_daily_logs: {
    key: string;
    value: {
      id: string;
      data: DailyLog;
      timestamp: number;
      projectId: string;
      syncStatus: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
    };
    indexes: { 'by-project': string; 'by-timestamp': number; 'by-sync-status': string };
  };
}

class OfflineService {
  private db: IDBPDatabase<NataCarePMDB> | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.setupConnectionListener();
  }

  /**
   * Initialize IndexedDB database
   */
  async initialize(): Promise<void> {
    try {
      this.db = await openDB<NataCarePMDB>('NataCarePM-Mobile', 2, {
        upgrade(db, oldVersion, newVersion) {
          // Create offline data store
          if (!db.objectStoreNames.contains('offline_data')) {
            const offlineStore = db.createObjectStore('offline_data', { keyPath: 'key' });
            offlineStore.createIndex('by-type', 'type');
            offlineStore.createIndex('by-project', 'projectId');
            offlineStore.createIndex('by-timestamp', 'timestamp');
          }

          // Create sync queue store
          if (!db.objectStoreNames.contains('sync_queue')) {
            const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
            syncStore.createIndex('by-timestamp', 'timestamp');
            syncStore.createIndex('by-project', 'projectId');
          }

          // Create construction-specific stores for version 2
          if (!db.objectStoreNames.contains('offline_rfis')) {
            const rfiStore = db.createObjectStore('offline_rfis', { keyPath: 'id' });
            rfiStore.createIndex('by-project', 'projectId');
            rfiStore.createIndex('by-timestamp', 'timestamp');
            rfiStore.createIndex('by-sync-status', 'syncStatus');
          }

          if (!db.objectStoreNames.contains('offline_submittals')) {
            const submittalStore = db.createObjectStore('offline_submittals', { keyPath: 'id' });
            submittalStore.createIndex('by-project', 'projectId');
            submittalStore.createIndex('by-timestamp', 'timestamp');
            submittalStore.createIndex('by-sync-status', 'syncStatus');
          }

          if (!db.objectStoreNames.contains('offline_daily_logs')) {
            const dailyLogStore = db.createObjectStore('offline_daily_logs', { keyPath: 'id' });
            dailyLogStore.createIndex('by-project', 'projectId');
            dailyLogStore.createIndex('by-timestamp', 'timestamp');
            dailyLogStore.createIndex('by-sync-status', 'syncStatus');
          }
        },
      });

      logger.info('Offline service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize offline service', error);
      throw error;
    }
  }

  /**
   * Save data locally when offline
   */
  async saveOfflineData<T>(
    key: string,
    data: T,
    type: string,
    projectId?: string
  ): Promise<void> {
    if (!this.db) {
      throw new Error('Offline service not initialized');
    }

    try {
      await this.db.put('offline_data', {
        key,
        data,
        timestamp: Date.now(),
        type,
        projectId,
      });

      logger.info(`Data saved offline: ${key}`, { type, projectId });
    } catch (error) {
      logger.error(`Failed to save data offline: ${key}`, error);
      throw error;
    }
  }

  /**
   * Retrieve offline data
   */
  async getOfflineData<T>(key: string): Promise<T | null> {
    if (!this.db) {
      throw new Error('Offline service not initialized');
    }

    try {
      const record = await this.db.get('offline_data', key);
      return record ? (record.data as T) : null;
    } catch (error) {
      logger.error(`Failed to retrieve offline data: ${key}`, error);
      return null;
    }
  }

  /**
   * Get all offline data of a specific type
   */
  async getOfflineDataByType<T>(type: string): Promise<T[]> {
    if (!this.db) {
      throw new Error('Offline service not initialized');
    }

    try {
      const records = await this.db.getAllFromIndex('offline_data', 'by-type', type);
      return records.map(record => record.data as T);
    } catch (error) {
      logger.error(`Failed to retrieve offline data by type: ${type}`, error);
      return [];
    }
  }

  /**
   * Add operation to sync queue
   */
  async addToSyncQueue<T>(
    operation: 'create' | 'update' | 'delete',
    entityType: string,
    data: T,
    projectId?: string
  ): Promise<void> {
    if (!this.db) {
      throw new Error('Offline service not initialized');
    }

    const syncItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      entityType,
      data,
      timestamp: Date.now(),
      attempts: 0,
      projectId,
    };

    try {
      await this.db.add('sync_queue', syncItem);
      logger.info(`Operation added to sync queue: ${syncItem.id}`, { operation, entityType });
    } catch (error) {
      logger.error(`Failed to add operation to sync queue`, error);
      throw error;
    }
  }

  /**
   * Process sync queue when online
   */
  async processSyncQueue(): Promise<void> {
    if (!this.db) {
      throw new Error('Offline service not initialized');
    }

    if (!this.isOnline) {
      logger.info('Device is offline, skipping sync queue processing');
      return;
    }

    try {
      const syncItems = await this.db.getAllFromIndex('sync_queue', 'by-timestamp');
      
      for (const item of syncItems) {
        try {
          // Attempt to sync the item
          await this.executeSyncOperation(item);
          
          // Remove from queue on success
          await this.db.delete('sync_queue', item.id);
          logger.info(`Sync operation completed: ${item.id}`);
        } catch (error) {
          // Increment attempts and update item
          item.attempts += 1;
          
          if (item.attempts >= 3) {
            // Move to dead letter queue after 3 failed attempts
            logger.error(`Sync operation failed after 3 attempts: ${item.id}`, error);
            // In a real implementation, you might move this to a separate store for manual review
          } else {
            // Update attempt count
            await this.db.put('sync_queue', item);
            logger.warn(`Sync operation failed, will retry: ${item.id}`, { attempts: item.attempts });
          }
        }
      }
    } catch (error) {
      logger.error('Failed to process sync queue', error);
    }
  }

  /**
   * Execute a sync operation
   */
  private async executeSyncOperation(item: any): Promise<void> {
    // This would integrate with your actual API services
    // For now, we'll simulate the sync operation
    
    logger.info(`Executing sync operation: ${item.id}`, {
      operation: item.operation,
      entityType: item.entityType,
    });

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate potential failure for testing retry logic
    if (Math.random() < 0.3) {
      throw new Error('Simulated sync failure');
    }

    // In a real implementation, you would:
    // 1. Call the appropriate API service method
    // 2. Handle the response
    // 3. Update local data if needed
  }

  /**
   * Resolve conflicts between offline and server data
   */
  async resolveConflict(localData: any, serverData: any): Promise<any> {
    // Implement conflict resolution strategy
    // This is a simple last-write-wins approach, but you could implement more sophisticated logic
    
    const localTimestamp = localData.timestamp || 0;
    const serverTimestamp = serverData.timestamp || 0;
    
    if (localTimestamp > serverTimestamp) {
      logger.info('Conflict resolved: local data is newer');
      return localData;
    } else {
      logger.info('Conflict resolved: server data is newer');
      return serverData;
    }
  }

  /**
   * Clear offline data for a specific project
   */
  async clearProjectData(projectId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Offline service not initialized');
    }

    try {
      const tx = this.db.transaction(['offline_data', 'sync_queue'], 'readwrite');
      
      // Clear offline data
      const offlineStore = tx.objectStore('offline_data');
      const offlineIndex = offlineStore.index('by-project');
      let cursor = await offlineIndex.openCursor(IDBKeyRange.only(projectId));
      
      while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
      }
      
      // Clear sync queue items
      const syncStore = tx.objectStore('sync_queue');
      const syncIndex = syncStore.index('by-project');
      let syncCursor = await syncIndex.openCursor(IDBKeyRange.only(projectId));
      
      while (syncCursor) {
        await syncCursor.delete();
        syncCursor = await syncCursor.continue();
      }
      
      await tx.done;
      logger.info(`Offline data cleared for project: ${projectId}`);
    } catch (error) {
      logger.error(`Failed to clear offline data for project: ${projectId}`, error);
      throw error;
    }
  }

  /**
   * Setup connection listener for online/offline events
   */
  private setupConnectionListener(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      logger.info('Device is now online');
      // Process sync queue when coming online
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      logger.info('Device is now offline');
    });
  }

  /**
   * Start periodic sync processing
   */
  startPeriodicSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.processSyncQueue();
    }, intervalMs);

    logger.info(`Periodic sync started with interval: ${intervalMs}ms`);
  }

  /**
   * Stop periodic sync processing
   */
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('Periodic sync stopped');
    }
  }

  /**
   * Get sync queue size
   */
  async getSyncQueueSize(): Promise<number> {
    if (!this.db) {
      throw new Error('Offline service not initialized');
    }

    try {
      const count = await this.db.count('sync_queue');
      return count;
    } catch (error) {
      logger.error('Failed to get sync queue size', error);
      return 0;
    }
  }

  /**
   * Get offline data size
   */
  async getOfflineDataSize(): Promise<number> {
    if (!this.db) {
      throw new Error('Offline service not initialized');
    }

    try {
      const count = await this.db.count('offline_data');
      return count;
    } catch (error) {
      logger.error('Failed to get offline data size', error);
      return 0;
    }
  }

  // ==================== CONSTRUCTION MODULE SPECIFIC METHODS ====================

  /**
   * Save RFI offline
   */
  async saveRfiOffline(rfi: Rfi): Promise<void> {
    if (!this.db) {
      throw new Error('Offline service not initialized');
    }

    try {
      await this.db.put('offline_rfis', {
        id: rfi.id,
        data: rfi,
        timestamp: Date.now(),
        projectId: rfi.projectId,
        syncStatus: 'pending'
      });

      logger.info(`RFI saved offline: ${rfi.id}`, { projectId: rfi.projectId });
    } catch (error) {
      logger.error(`Failed to save RFI offline: ${rfi.id}`, error);
      throw error;
    }
  }

  /**
   * Get offline RFIs for a project
   */
  async getOfflineRfis(projectId: string): Promise<Rfi[]> {
    if (!this.db) {
      throw new Error('Offline service not initialized');
    }

    try {
      const records = await this.db.getAllFromIndex('offline_rfis', 'by-project', projectId);
      return records.map(record => record.data);
    } catch (error) {
      logger.error(`Failed to retrieve offline RFIs for project: ${projectId}`, error);
      return [];
    }
  }

  /**
   * Save Submittal offline
   */
  async saveSubmittalOffline(submittal: Submittal): Promise<void> {
    if (!this.db) {
      throw new Error('Offline service not initialized');
    }

    try {
      await this.db.put('offline_submittals', {
        id: submittal.id,
        data: submittal,
        timestamp: Date.now(),
        projectId: submittal.projectId,
        syncStatus: 'pending'
      });

      logger.info(`Submittal saved offline: ${submittal.id}`, { projectId: submittal.projectId });
    } catch (error) {
      logger.error(`Failed to save Submittal offline: ${submittal.id}`, error);
      throw error;
    }
  }

  /**
   * Get offline Submittals for a project
   */
  async getOfflineSubmittals(projectId: string): Promise<Submittal[]> {
    if (!this.db) {
      throw new Error('Offline service not initialized');
    }

    try {
      const records = await this.db.getAllFromIndex('offline_submittals', 'by-project', projectId);
      return records.map(record => record.data);
    } catch (error) {
      logger.error(`Failed to retrieve offline Submittals for project: ${projectId}`, error);
      return [];
    }
  }

  /**
   * Save Daily Log offline
   */
  async saveDailyLogOffline(dailyLog: DailyLog): Promise<void> {
    if (!this.db) {
      throw new Error('Offline service not initialized');
    }

    try {
      await this.db.put('offline_daily_logs', {
        id: dailyLog.id,
        data: dailyLog,
        timestamp: Date.now(),
        projectId: dailyLog.projectId,
        syncStatus: 'pending'
      });

      logger.info(`Daily Log saved offline: ${dailyLog.id}`, { projectId: dailyLog.projectId });
    } catch (error) {
      logger.error(`Failed to save Daily Log offline: ${dailyLog.id}`, error);
      throw error;
    }
  }

  /**
   * Get offline Daily Logs for a project
   */
  async getOfflineDailyLogs(projectId: string): Promise<DailyLog[]> {
    if (!this.db) {
      throw new Error('Offline service not initialized');
    }

    try {
      const records = await this.db.getAllFromIndex('offline_daily_logs', 'by-project', projectId);
      return records.map(record => record.data);
    } catch (error) {
      logger.error(`Failed to retrieve offline Daily Logs for project: ${projectId}`, error);
      return [];
    }
  }

  /**
   * Update sync status for an offline entity
   */
  async updateSyncStatus(
    entityType: 'rfi' | 'submittal' | 'dailyLog',
    entityId: string,
    status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict'
  ): Promise<void> {
    if (!this.db) {
      throw new Error('Offline service not initialized');
    }

    try {
      let storeName: 'offline_rfis' | 'offline_submittals' | 'offline_daily_logs';
      
      switch (entityType) {
        case 'rfi':
          storeName = 'offline_rfis';
          break;
        case 'submittal':
          storeName = 'offline_submittals';
          break;
        case 'dailyLog':
          storeName = 'offline_daily_logs';
          break;
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }

      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const record = await store.get(entityId);
      
      if (record) {
        record.syncStatus = status;
        record.timestamp = Date.now();
        await store.put(record);
        logger.info(`Updated sync status for ${entityType} ${entityId} to ${status}`);
      }
      
      await tx.done;
    } catch (error) {
      logger.error(`Failed to update sync status for ${entityType} ${entityId}`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const offlineService = new OfflineService();