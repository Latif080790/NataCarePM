/**
 * Real-time Data Sync Service
 * NataCarePM - Phase 4.7: Real-time Data Synchronization
 *
 * Service for real-time synchronization with third-party systems using webhooks,
 * WebSocket connections, and polling mechanisms
 */

import { 
  BaseIntegrationConnector, 
  IntegrationConfig, 
  ProjectData, 
  TaskData, 
  ResourceData 
} from './integrationConnectors';
import { MicrosoftProjectConnector } from './integrationConnectors/microsoftProjectConnector';
import { PrimaveraConnector } from './integrationConnectors/primaveraConnector';
import { SAPConnector } from './integrationConnectors/sapConnector';
import { logger } from '@/utils/logger.enhanced';
import { APIResponse } from '@/utils/responseWrapper';
import { EventEmitter } from 'events';

// ============================================================================
// Type Definitions
// ============================================================================

export interface SyncEvent {
  id: string;
  eventType: 'project.created' | 'project.updated' | 'project.deleted' | 
              'task.created' | 'task.updated' | 'task.deleted' | 
              'resource.created' | 'resource.updated' | 'resource.deleted';
  entityId: string;
  entityType: 'project' | 'task' | 'resource';
  data: any;
  timestamp: Date;
  sourceSystem: string;
  targetSystem: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  errorMessage?: string;
}

export interface RealtimeSyncConfig {
  maxRetries: number;
  retryDelay: number; // in milliseconds
  batchSize: number;
  syncInterval: number; // in milliseconds for polling
  enableWebhooks: boolean;
  enablePolling: boolean;
  enableWebSocket: boolean;
}

export interface WebSocketConnection {
  id: string;
  system: string;
  url: string;
  socket: WebSocket | null;
  connected: boolean;
  lastPing: Date;
  reconnectAttempts: number;
}

// ============================================================================
// Real-time Sync Service
// ============================================================================

class RealtimeSyncService extends EventEmitter {
  private connectors: Map<string, BaseIntegrationConnector> = new Map();
  private syncQueue: SyncEvent[] = [];
  private syncConfig: RealtimeSyncConfig;
  private webSocketConnections: Map<string, WebSocketConnection> = new Map();
  private isProcessing: boolean = false;
  private syncIntervalId: NodeJS.Timeout | null = null;

  constructor(config?: Partial<RealtimeSyncConfig>) {
    super();
    this.syncConfig = {
      maxRetries: config?.maxRetries || 3,
      retryDelay: config?.retryDelay || 5000,
      batchSize: config?.batchSize || 10,
      syncInterval: config?.syncInterval || 30000, // 30 seconds
      enableWebhooks: config?.enableWebhooks !== undefined ? config.enableWebhooks : true,
      enablePolling: config?.enablePolling !== undefined ? config.enablePolling : true,
      enableWebSocket: config?.enableWebSocket !== undefined ? config.enableWebSocket : true,
    };
  }

  /**
   * Initialize the real-time sync service
   */
  async initialize(): Promise<void> {
    logger.info('Initializing real-time sync service', { config: this.syncConfig });
    
    // Start sync processing
    this.startSyncProcessing();
    
    // Start periodic sync if polling is enabled
    if (this.syncConfig.enablePolling) {
      this.startPeriodicSync();
    }
    
    logger.info('Real-time sync service initialized');
  }

  /**
   * Register an integration connector
   */
  registerConnector(connector: BaseIntegrationConnector): void {
    this.connectors.set(connector.getConfig().id, connector);
    logger.info('Connector registered', { 
      connectorId: connector.getConfig().id, 
      connectorName: connector.getConfig().name 
    });
    
    // Initialize WebSocket connection if enabled
    if (this.syncConfig.enableWebSocket) {
      this.initializeWebSocketConnection(connector.getConfig());
    }
  }

  /**
   * Create connector instance based on type
   */
  createConnector(config: IntegrationConfig): BaseIntegrationConnector {
    switch (config.type) {
      case 'microsoft_project':
        return new MicrosoftProjectConnector(config);
      case 'primavera':
        return new PrimaveraConnector(config);
      case 'sap':
        return new SAPConnector(config);
      default:
        throw new Error(`Unsupported connector type: ${config.type}`);
    }
  }

  /**
   * Initialize WebSocket connection for real-time updates
   */
  private async initializeWebSocketConnection(config: IntegrationConfig): Promise<void> {
    try {
      // Only initialize if webhook URL is provided
      if (!config.webhookUrl) {
        logger.debug('No webhook URL provided, skipping WebSocket initialization', { 
          connectorId: config.id 
        });
        return;
      }

      const connection: WebSocketConnection = {
        id: `ws-${config.id}`,
        system: config.name,
        url: config.webhookUrl,
        socket: null,
        connected: false,
        lastPing: new Date(),
        reconnectAttempts: 0
      };

      this.webSocketConnections.set(config.id, connection);
      await this.connectWebSocket(config.id);
    } catch (error) {
      logger.error('Failed to initialize WebSocket connection', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Connect to WebSocket endpoint
   */
  private async connectWebSocket(connectorId: string): Promise<void> {
    const connection = this.webSocketConnections.get(connectorId);
    if (!connection) {
      logger.warn('WebSocket connection not found', { connectorId });
      return;
    }

    try {
      // Close existing connection if any
      if (connection.socket) {
        connection.socket.close();
      }

      // Create new WebSocket connection
      const socket = new WebSocket(connection.url);
      connection.socket = socket;

      socket.onopen = () => {
        connection.connected = true;
        connection.reconnectAttempts = 0;
        logger.info('WebSocket connection established', { 
          connectorId, 
          system: connection.system 
        });
        this.emit('websocket.connected', { connectorId, system: connection.system });
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleWebSocketMessage(connectorId, message);
        } catch (error) {
          logger.error('Failed to parse WebSocket message', error instanceof Error ? error : new Error(String(error)));
        }
      };

      socket.onclose = () => {
        connection.connected = false;
        logger.warn('WebSocket connection closed', { 
          connectorId, 
          system: connection.system 
        });
        this.emit('websocket.disconnected', { connectorId, system: connection.system });
        
        // Attempt to reconnect
        this.reconnectWebSocket(connectorId);
      };

      socket.onerror = (error) => {
        logger.error('WebSocket error', error instanceof Error ? error : new Error(String(error)));
        this.emit('websocket.error', { connectorId, system: connection.system, error });
      };

    } catch (error) {
      logger.error('Failed to connect WebSocket', error instanceof Error ? error : new Error(String(error)));
      this.reconnectWebSocket(connectorId);
    }
  }

  /**
   * Reconnect WebSocket with exponential backoff
   */
  private async reconnectWebSocket(connectorId: string): Promise<void> {
    const connection = this.webSocketConnections.get(connectorId);
    if (!connection) return;

    // Limit reconnect attempts
    if (connection.reconnectAttempts >= 5) {
      logger.error('Max reconnect attempts reached, giving up');
      return;
    }

    connection.reconnectAttempts++;
    
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = Math.min(1000 * Math.pow(2, connection.reconnectAttempts - 1), 30000);
    
    logger.info('Scheduling WebSocket reconnect', { 
      connectorId, 
      delay, 
      attempt: connection.reconnectAttempts 
    });
    
    setTimeout(() => {
      this.connectWebSocket(connectorId);
    }, delay);
  }

  /**
   * Handle WebSocket message
   */
  private async handleWebSocketMessage(connectorId: string, message: any): Promise<void> {
    logger.debug('WebSocket message received', { connectorId, message });
    
    try {
      const connector = this.connectors.get(connectorId);
      if (!connector) {
        logger.warn('Connector not found for WebSocket message', { connectorId });
        return;
      }

      // Create sync event from message
      const syncEvent: SyncEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        eventType: this.mapEventType(message.event),
        entityId: message.payload?.id || '',
        entityType: this.mapEntityType(message.event),
        data: message.payload,
        timestamp: new Date(),
        sourceSystem: connector.getConfig().name,
        targetSystem: 'NataCarePM',
        status: 'pending',
        retryCount: 0
      };

      // Add to sync queue
      this.syncQueue.push(syncEvent);
      this.emit('sync.event.received', syncEvent);
      
      logger.info('Sync event added to queue', {
        eventId: syncEvent.id,
        eventType: syncEvent.eventType
      } as any);
    } catch (error) {
      logger.error('Failed to handle WebSocket message', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Map external event type to internal event type
   */
  private mapEventType(externalEvent: string): SyncEvent['eventType'] {
    const eventMap: Record<string, SyncEvent['eventType']> = {
      'project.created': 'project.created',
      'project.updated': 'project.updated',
      'project.deleted': 'project.deleted',
      'task.created': 'task.created',
      'task.updated': 'task.updated',
      'task.deleted': 'task.deleted',
      'resource.created': 'resource.created',
      'resource.updated': 'resource.updated',
      'resource.deleted': 'resource.deleted',
    };
    
    return eventMap[externalEvent] || 'project.updated'; // Default to project update
  }

  /**
   * Map external event type to entity type
   */
  private mapEntityType(externalEvent: string): SyncEvent['entityType'] {
    if (externalEvent.includes('project')) return 'project';
    if (externalEvent.includes('task')) return 'task';
    if (externalEvent.includes('resource')) return 'resource';
    return 'project'; // Default to project
  }

  /**
   * Start sync processing loop
   */
  private startSyncProcessing(): void {
    const processQueue = async () => {
      if (this.isProcessing) {
        setTimeout(processQueue, 1000); // Check again in 1 second
        return;
      }
      
      if (this.syncQueue.length > 0) {
        await this.processSyncQueue();
      }
      
      setTimeout(processQueue, 1000); // Check again in 1 second
    };
    
    processQueue();
  }

  /**
   * Start periodic sync for polling-based systems
   */
  private startPeriodicSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }
    
    this.syncIntervalId = setInterval(async () => {
      await this.performPeriodicSync();
    }, this.syncConfig.syncInterval);
    
    logger.info('Periodic sync started', { interval: this.syncConfig.syncInterval });
  }

  /**
   * Perform periodic sync with all enabled connectors
   */
  private async performPeriodicSync(): Promise<void> {
    logger.debug('Performing periodic sync');
    
    for (const [connectorId, connector] of this.connectors.entries()) {
      if (!connector.getConfig().enabled) continue;
      
      try {
        // Only sync if not using real-time mechanisms or if real-time failed
        const shouldSync = connector.getConfig().syncFrequency === 'realtime' ? 
          Date.now() - (connector.getConfig().lastSync?.getTime() || 0) > 300000 : // 5 minutes fallback
          true;
          
        if (shouldSync) {
          await this.syncConnectorData(connectorId);
        }
      } catch (error) {
        logger.error('Periodic sync failed for connector: ' + (error instanceof Error ? error.message : String(error)));
      }
    }
  }

  /**
   * Process sync queue
   */
  private async processSyncQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      // Process in batches
      const batch = this.syncQueue.splice(0, this.syncConfig.batchSize);
      
      if (batch.length > 0) {
        logger.info('Processing sync queue batch', { batchSize: batch.length });
        
        // Process each event in the batch
        await Promise.all(batch.map(event => this.processSyncEvent(event)));
      }
    } catch (error) {
      logger.error('Failed to process sync queue', error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual sync event
   */
  private async processSyncEvent(event: SyncEvent): Promise<void> {
    try {
      event.status = 'processing';
      this.emit('sync.event.processing', event);
      
      // Find the appropriate connector
      const connector = Array.from(this.connectors.values()).find(
        c => c.getConfig().name === event.sourceSystem
      );
      
      if (!connector) {
        throw new Error(`Connector not found for system: ${event.sourceSystem}`);
      }
      
      // Process based on event type
      switch (event.eventType) {
        case 'project.created':
        case 'project.updated':
          await this.syncProjectData(connector, event.data);
          break;
        case 'task.created':
        case 'task.updated':
          await this.syncTaskData(connector, event.data);
          break;
        case 'resource.created':
        case 'resource.updated':
          await this.syncResourceData(connector, event.data);
          break;
        default:
          logger.warn('Unknown event type', { eventType: event.eventType });
      }
      
      event.status = 'completed';
      this.emit('sync.event.completed', event);
      
      logger.info('Sync event processed successfully', { 
        eventId: event.id, 
        eventType: event.eventType 
      });
    } catch (error) {
      event.status = 'failed';
      event.errorMessage = error instanceof Error ? error.message : String(error);
      event.retryCount++;
      
      logger.error('Failed to process sync event', {
        eventId: event.id,
        error: event.errorMessage
      } as any);
      
      this.emit('sync.event.failed', event);
      
      // Retry if needed
      if (event.retryCount < this.syncConfig.maxRetries) {
        setTimeout(() => {
          this.syncQueue.push(event);
          logger.info('Sync event requeued for retry', { 
            eventId: event.id, 
            retryCount: event.retryCount 
          });
        }, this.syncConfig.retryDelay * event.retryCount); // Exponential backoff
      } else {
        logger.error('Max retries reached for sync event, giving up', { 
          message: `Max retries reached for sync event ${event.id}`,
          eventId: event.id 
        } as any);
        this.emit('sync.event.giveup', event);
      }
    }
  }

  /**
   * Sync project data from external system
   */
  private async syncProjectData(connector: BaseIntegrationConnector, data: any): Promise<void> {
    // Transform external data to our format
    const projectData: ProjectData = {
      id: data.id,
      name: data.name || data.title,
      description: data.description,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      status: data.status || 'active',
      budget: data.budget,
      currency: data.currency,
      manager: data.manager,
      team: data.team || [],
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    };
    
    // In a real implementation, this would update our local database
    logger.info('Project data synced', { projectId: projectData.id, projectName: projectData.name });
    
    // Emit event for other services to handle
    this.emit('project.synced', projectData);
  }

  /**
   * Sync task data from external system
   */
  private async syncTaskData(connector: BaseIntegrationConnector, data: any): Promise<void> {
    // Transform external data to our format
    const taskData: TaskData = {
      id: data.id,
      projectId: data.projectId,
      name: data.name || data.title,
      description: data.description,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      duration: data.duration,
      status: data.status || 'not_started',
      priority: data.priority || 'medium',
      assignee: data.assignee,
      dependencies: data.dependencies || [],
      progress: data.progress,
      cost: data.cost,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    };
    
    // In a real implementation, this would update our local database
    logger.info('Task data synced', { taskId: taskData.id, taskName: taskData.name });
    
    // Emit event for other services to handle
    this.emit('task.synced', taskData);
  }

  /**
   * Sync resource data from external system
   */
  private async syncResourceData(connector: BaseIntegrationConnector, data: any): Promise<void> {
    // Transform external data to our format
    const resourceData: ResourceData = {
      id: data.id,
      name: data.name,
      type: data.type || 'human',
      description: data.description,
      cost: data.cost,
      unit: data.unit,
      availability: data.availability ? {
        startDate: data.availability.startDate ? new Date(data.availability.startDate) : undefined,
        endDate: data.availability.endDate ? new Date(data.availability.endDate) : undefined,
        quantity: data.availability.quantity
      } : undefined,
      skills: data.skills || [],
      certifications: data.certifications || [],
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    };
    
    // In a real implementation, this would update our local database
    logger.info('Resource data synced', { resourceId: resourceData.id, resourceName: resourceData.name });
    
    // Emit event for other services to handle
    this.emit('resource.synced', resourceData);
  }

  /**
   * Sync data with a specific connector
   */
  private async syncConnectorData(connectorId: string): Promise<void> {
    const connector = this.connectors.get(connectorId);
    if (!connector || !connector.getConfig().enabled) return;
    
    logger.info('Syncing data with connector', { connectorId, connectorName: connector.getConfig().name });
    
    try {
      // Authenticate first
      const authResult = await connector.authenticate();
      if (!authResult.success) {
        throw new Error(`Authentication failed: ${authResult.error?.message}`);
      }
      
      // Fetch and sync projects
      const projectsResult = await connector.fetchProjects();
      if (projectsResult.success && projectsResult.data) {
        for (const project of projectsResult.data) {
          await this.syncProjectData(connector, project);
        }
      }
      
      // Fetch and sync tasks
      const tasksResult = await connector.fetchTasks();
      if (tasksResult.success && tasksResult.data) {
        for (const task of tasksResult.data) {
          await this.syncTaskData(connector, task);
        }
      }
      
      // Fetch and sync resources
      const resourcesResult = await connector.fetchResources();
      if (resourcesResult.success && resourcesResult.data) {
        for (const resource of resourcesResult.data) {
          await this.syncResourceData(connector, resource);
        }
      }
      
      // Update last sync timestamp
      connector.getConfig().lastSync = new Date();
      
      logger.info('Connector data sync completed', { connectorId });
    } catch (error) {
      logger.error('Connector data sync failed', { 
        connectorId,
        error: error instanceof Error ? error.message : String(error)
      } as any);
      throw error;
    }
  }

  /**
   * Push data to external system
   */
  async pushData(connectorId: string, data: any, entityType: string): Promise<APIResponse<boolean>> {
    try {
      const connector = this.connectors.get(connectorId);
      if (!connector) {
        return {
          success: false,
          error: {
            message: 'Connector not found',
            code: 'CONNECTOR_NOT_FOUND'
          }
        };
      }
      
      // Authenticate first
      const authResult = await connector.authenticate();
      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error
        };
      }
      
      let syncResult: APIResponse<boolean>;
      
      // Sync based on entity type
      switch (entityType) {
        case 'project':
          syncResult = await connector.syncProjects([data as ProjectData]);
          break;
        case 'task':
          syncResult = await connector.syncTasks([data as TaskData]);
          break;
        case 'resource':
          syncResult = await connector.syncResources([data as ResourceData]);
          break;
        default:
          return {
            success: false,
            error: {
              message: `Unsupported entity type: ${entityType}`,
              code: 'UNSUPPORTED_ENTITY_TYPE'
            }
          };
      }
      
      if (syncResult.success) {
        logger.info('Data pushed to external system', {
          connectorId,
          entityType,
          entityId: data.id
        } as any);
      } else {
        logger.error('Failed to push data to external system', {
          connectorId,
          entityType,
          error: syncResult.error
        } as any);
      }
      
      return syncResult;
    } catch (error) {
      logger.error('Failed to push data', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: {
          message: 'Failed to push data',
          code: 'PUSH_DATA_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Get sync queue status
   */
  getSyncQueueStatus(): { 
    pending: number; 
    processing: number; 
    failed: number; 
    total: number 
  } {
    const pending = this.syncQueue.filter(e => e.status === 'pending').length;
    const processing = this.syncQueue.filter(e => e.status === 'processing').length;
    const failed = this.syncQueue.filter(e => e.status === 'failed').length;
    
    return {
      pending,
      processing,
      failed,
      total: this.syncQueue.length
    };
  }

  /**
   * Get WebSocket connections status
   */
  getWebSocketStatus(): { 
    connected: number; 
    disconnected: number; 
    total: number 
  } {
    const connected = Array.from(this.webSocketConnections.values())
      .filter(c => c.connected).length;
    const disconnected = Array.from(this.webSocketConnections.values())
      .filter(c => !c.connected).length;
    
    return {
      connected,
      disconnected,
      total: this.webSocketConnections.size
    };
  }

  /**
   * Get overall sync status
   */
  async getSyncStatus(): Promise<APIResponse<any>> {
    return {
      success: true,
      data: {
        queue: this.getSyncQueueStatus(),
        websockets: this.getWebSocketStatus(),
        connectors: Array.from(this.connectors.values()).map(c => ({
          id: c.getConfig().id,
          name: c.getConfig().name,
          enabled: c.getConfig().enabled,
          lastSync: c.getConfig().lastSync,
          connected: Array.from(this.webSocketConnections.values())
            .some(ws => ws.system === c.getConfig().name && ws.connected)
        }))
      }
    };
  }

  /**
   * Shutdown the service gracefully
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down real-time sync service');
    
    // Clear sync interval
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
    
    // Close WebSocket connections
    for (const [connectorId, connection] of this.webSocketConnections.entries()) {
      if (connection.socket) {
        connection.socket.close();
      }
    }
    
    // Clear sync queue
    this.syncQueue = [];
    this.connectors.clear();
    this.webSocketConnections.clear();
    
    logger.info('Real-time sync service shutdown complete');
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const realtimeSyncService = new RealtimeSyncService();

// Export types
// Types are already exported at the top of the file