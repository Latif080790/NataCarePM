/**
 * Integration Gateway API
 * 
 * Central hub for managing third-party integrations with ERP, CRM, and other enterprise systems
 */

import { logger } from '@/utils/logger.enhanced';
import { APIResponse } from '@/utils/responseWrapper';

// Type definitions for integration systems
export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'erp' | 'crm' | 'accounting' | 'hr' | 'custom';
  baseUrl: string;
  authType: 'oauth2' | 'api_key' | 'basic' | 'saml';
  credentials: {
    clientId?: string;
    clientSecret?: string;
    apiKey?: string;
    username?: string;
    password?: string;
  };
  enabled: boolean;
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  lastSync?: Date;
  webhookUrl?: string;
}

export interface IntegrationData {
  projectId?: string;
  taskId?: string;
  userId?: string;
  resourceType: string;
  action: string;
  data: any;
  timestamp: Date;
}

export interface WebhookPayload {
  event: string;
  payload: any;
  timestamp: Date;
  signature?: string;
}

// Mock integration systems for demonstration
const mockIntegrations: IntegrationConfig[] = [
  {
    id: 'erp-001',
    name: 'SAP ERP',
    type: 'erp',
    baseUrl: 'https://sap.example.com/api',
    authType: 'oauth2',
    credentials: {
      clientId: 'sap-client-id',
      clientSecret: 'sap-client-secret'
    },
    enabled: true,
    syncFrequency: 'hourly',
    lastSync: new Date()
  },
  {
    id: 'crm-001',
    name: 'Salesforce CRM',
    type: 'crm',
    baseUrl: 'https://salesforce.example.com/api',
    authType: 'oauth2',
    credentials: {
      clientId: 'sf-client-id',
      clientSecret: 'sf-client-secret'
    },
    enabled: true,
    syncFrequency: 'realtime',
    webhookUrl: 'https://natacarepm.example.com/webhooks/salesforce'
  }
];

class IntegrationGateway {
  private integrations: Map<string, IntegrationConfig> = new Map();
  private webhookSecret: string;

  constructor() {
    this.webhookSecret = process.env.WEBHOOK_SECRET || 'default-secret';
    this.initializeIntegrations();
  }

  /**
   * Initialize integrations from configuration
   */
  private initializeIntegrations(): void {
    mockIntegrations.forEach(integration => {
      this.integrations.set(integration.id, integration);
    });
    logger.info('Integration gateway initialized', { integrationCount: this.integrations.size });
  }

  /**
   * Get all integrations
   */
  async getIntegrations(): Promise<APIResponse<IntegrationConfig[]>> {
    try {
      const integrations = Array.from(this.integrations.values());
      return {
        success: true,
        data: integrations
      };
    } catch (error) {
      logger.error('Failed to fetch integrations', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: {
          message: 'Failed to fetch integrations',
          code: 'INTEGRATION_FETCH_ERROR'
        }
      };
    }
  }

  /**
   * Get integration by ID
   */
  async getIntegration(id: string): Promise<APIResponse<IntegrationConfig>> {
    try {
      const integration = this.integrations.get(id);
      if (!integration) {
        return {
          success: false,
          error: {
            message: 'Integration not found',
            code: 'INTEGRATION_NOT_FOUND'
          }
        };
      }

      return {
        success: true,
        data: integration
      };
    } catch (error) {
      logger.error('Failed to fetch integration', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: {
          message: 'Failed to fetch integration',
          code: 'INTEGRATION_FETCH_ERROR'
        }
      };
    }
  }

  /**
   * Create new integration
   */
  async createIntegration(config: IntegrationConfig): Promise<APIResponse<IntegrationConfig>> {
    try {
      // Validate required fields
      if (!config.id || !config.name || !config.type || !config.baseUrl) {
        return {
          success: false,
          error: {
            message: 'Missing required fields',
            code: 'INVALID_INTEGRATION_CONFIG'
          }
        };
      }

      // Check if integration already exists
      if (this.integrations.has(config.id)) {
        return {
          success: false,
          error: {
            message: 'Integration already exists',
            code: 'INTEGRATION_EXISTS'
          }
        };
      }

      this.integrations.set(config.id, config);
      logger.info('Integration created', { integrationId: config.id, integrationName: config.name });

      return {
        success: true,
        data: config
      };
    } catch (error) {
      logger.error('Failed to create integration', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: {
          message: 'Failed to create integration',
          code: 'INTEGRATION_CREATE_ERROR'
        }
      };
    }
  }

  /**
   * Update integration
   */
  async updateIntegration(id: string, config: Partial<IntegrationConfig>): Promise<APIResponse<IntegrationConfig>> {
    try {
      const existing = this.integrations.get(id);
      if (!existing) {
        return {
          success: false,
          error: {
            message: 'Integration not found',
            code: 'INTEGRATION_NOT_FOUND'
          }
        };
      }

      const updated = { ...existing, ...config };
      this.integrations.set(id, updated);
      logger.info('Integration updated', { integrationId: id });

      return {
        success: true,
        data: updated
      };
    } catch (error) {
      logger.error('Failed to update integration', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: {
          message: 'Failed to update integration',
          code: 'INTEGRATION_UPDATE_ERROR'
        }
      };
    }
  }

  /**
   * Delete integration
   */
  async deleteIntegration(id: string): Promise<APIResponse<boolean>> {
    try {
      const exists = this.integrations.has(id);
      if (!exists) {
        return {
          success: false,
          error: {
            message: 'Integration not found',
            code: 'INTEGRATION_NOT_FOUND'
          }
        };
      }

      this.integrations.delete(id);
      logger.info('Integration deleted', { integrationId: id });

      return {
        success: true,
        data: true
      };
    } catch (error) {
      logger.error('Failed to delete integration', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: {
          message: 'Failed to delete integration',
          code: 'INTEGRATION_DELETE_ERROR'
        }
      };
    }
  }

  /**
   * Sync data with integration
   */
  async syncIntegrationData(id: string, data: IntegrationData): Promise<APIResponse<boolean>> {
    try {
      const integration = this.integrations.get(id);
      if (!integration) {
        return {
          success: false,
          error: {
            message: 'Integration not found',
            code: 'INTEGRATION_NOT_FOUND'
          }
        };
      }

      if (!integration.enabled) {
        return {
          success: false,
          error: {
            message: 'Integration is disabled',
            code: 'INTEGRATION_DISABLED'
          }
        };
      }

      // Simulate API call to external system
      logger.debug('Syncing data with integration', {
        integrationId: id,
        resourceType: data.resourceType,
        action: data.action
      });

      // Update last sync timestamp
      integration.lastSync = new Date();
      this.integrations.set(id, integration);

      return {
        success: true,
        data: true
      };
    } catch (error) {
      logger.error('Failed to sync integration data', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: {
          message: 'Failed to sync integration data',
          code: 'INTEGRATION_SYNC_ERROR'
        }
      };
    }
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(payload: WebhookPayload, signature?: string): Promise<APIResponse<boolean>> {
    try {
      // Verify webhook signature if provided
      if (signature && !this.verifyWebhookSignature(payload, signature)) {
        logger.warn('Invalid webhook signature');
        return {
          success: false,
          error: {
            message: 'Invalid webhook signature',
            code: 'INVALID_WEBHOOK_SIGNATURE'
          }
        };
      }

      // Process webhook event
      logger.info('Webhook received', {
        event: payload.event,
        timestamp: payload.timestamp
      });

      // In a real implementation, this would trigger specific actions based on the event type
      // For now, we'll just log the event
      switch (payload.event) {
        case 'project.created':
          logger.info('New project created in external system', payload.payload);
          break;
        case 'task.updated':
          logger.info('Task updated in external system', payload.payload);
          break;
        case 'user.added':
          logger.info('New user added in external system', payload.payload);
          break;
        default:
          logger.debug('Unhandled webhook event', { event: payload.event });
      }

      return {
        success: true,
        data: true
      };
    } catch (error) {
      logger.error('Failed to handle webhook', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: {
          message: 'Failed to handle webhook',
          code: 'WEBHOOK_PROCESS_ERROR'
        }
      };
    }
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(payload: WebhookPayload, signature: string): boolean {
    // In a real implementation, this would use cryptographic verification
    // For now, we'll just check if signature matches our secret
    return signature === this.webhookSecret;
  }

  /**
   * Get integration status
   */
  async getIntegrationStatus(): Promise<APIResponse<{ 
    total: number; 
    enabled: number; 
    disabled: number; 
    lastSync?: Date 
  }>> {
    try {
      const integrations = Array.from(this.integrations.values());
      const enabled = integrations.filter(i => i.enabled).length;
      const disabled = integrations.filter(i => !i.enabled).length;
      
      // Get the most recent sync time
      const lastSync = integrations
        .map(i => i.lastSync)
        .filter((date): date is Date => date !== undefined)
        .sort((a, b) => b.getTime() - a.getTime())[0];

      return {
        success: true,
        data: {
          total: integrations.length,
          enabled,
          disabled,
          lastSync
        }
      };
    } catch (error) {
      logger.error('Failed to get integration status', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: {
          message: 'Failed to get integration status',
          code: 'INTEGRATION_STATUS_ERROR'
        }
      };
    }
  }
}

// Export singleton instance
export const integrationGateway = new IntegrationGateway();

export default IntegrationGateway;