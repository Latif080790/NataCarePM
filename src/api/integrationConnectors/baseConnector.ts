/**
 * Base Integration Connector
 * NataCarePM - Phase 4.4: Third-Party Integrations
 *
 * Abstract base class for all third-party integration connectors
 */

import { logger } from '@/utils/logger.enhanced';
import { APIResponse } from '@/utils/responseWrapper';

// ============================================================================
// Type Definitions
// ============================================================================

export interface IntegrationCredentials {
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'microsoft_project' | 'primavera' | 'sap' | 'custom';
  baseUrl: string;
  authType: 'oauth2' | 'api_key' | 'basic' | 'saml';
  credentials: IntegrationCredentials;
  enabled: boolean;
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  lastSync?: Date;
  webhookUrl?: string;
}

export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  budget?: number;
  currency?: string;
  manager?: string;
  team?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskData {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  duration?: number; // in days
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  dependencies?: string[]; // Task IDs
  progress?: number; // 0-100
  cost?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResourceData {
  id: string;
  name: string;
  type: 'human' | 'equipment' | 'material';
  description?: string;
  cost?: number;
  unit?: string;
  availability?: {
    startDate?: Date;
    endDate?: Date;
    quantity?: number;
  };
  skills?: string[];
  certifications?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Base Connector Class
// ============================================================================

export abstract class BaseIntegrationConnector {
  protected config: IntegrationConfig;
  protected loggerPrefix: string;

  constructor(config: IntegrationConfig) {
    this.config = config;
    this.loggerPrefix = `[${config.type.toUpperCase()} Connector]`;
  }

  /**
   * Initialize the connector
   */
  async initialize(): Promise<void> {
    logger.info(`${this.loggerPrefix} Initializing connector`, { 
      integrationId: this.config.id, 
      integrationName: this.config.name 
    });
  }

  /**
   * Authenticate with the third-party system
   */
  abstract authenticate(): Promise<APIResponse<boolean>>;

  /**
   * Fetch projects from the third-party system
   */
  abstract fetchProjects(): Promise<APIResponse<ProjectData[]>>;

  /**
   * Fetch tasks from the third-party system
   */
  abstract fetchTasks(projectId?: string): Promise<APIResponse<TaskData[]>>;

  /**
   * Fetch resources from the third-party system
   */
  abstract fetchResources(): Promise<APIResponse<ResourceData[]>>;

  /**
   * Sync projects to the third-party system
   */
  abstract syncProjects(projects: ProjectData[]): Promise<APIResponse<boolean>>;

  /**
   * Sync tasks to the third-party system
   */
  abstract syncTasks(tasks: TaskData[]): Promise<APIResponse<boolean>>;

  /**
   * Sync resources to the third-party system
   */
  abstract syncResources(resources: ResourceData[]): Promise<APIResponse<boolean>>;

  /**
   * Handle webhook events from the third-party system
   */
  abstract handleWebhook(payload: any): Promise<APIResponse<boolean>>;

  /**
   * Refresh authentication tokens if needed
   */
  protected async refreshAuth(): Promise<APIResponse<boolean>> {
    logger.debug(`${this.loggerPrefix} Refreshing authentication tokens`);
    // Default implementation - should be overridden by specific connectors
    return {
      success: true,
      data: true
    };
  }

  /**
   * Make authenticated API request
   */
  protected async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const url = `${this.config.baseUrl}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {})
      };

      // Add authentication headers if needed
      if (this.config.authType === 'api_key' && this.config.credentials.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.credentials.apiKey}`;
      } else if (this.config.authType === 'oauth2' && this.config.credentials.accessToken) {
        headers['Authorization'] = `Bearer ${this.config.credentials.accessToken}`;
      } else if (this.config.authType === 'basic' && this.config.credentials.username && this.config.credentials.password) {
        const credentials = btoa(`${this.config.credentials.username}:${this.config.credentials.password}`);
        headers['Authorization'] = `Basic ${credentials}`;
      }

      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      logger.error(`${this.loggerPrefix} API request failed`, error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: {
          message: 'API request failed',
          code: 'API_REQUEST_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Validate configuration
   */
  protected validateConfig(): APIResponse<boolean> {
    if (!this.config.id || !this.config.name || !this.config.type || !this.config.baseUrl) {
      return {
        success: false,
        error: {
          message: 'Missing required configuration fields',
          code: 'INVALID_CONFIG'
        }
      };
    }

    if (this.config.authType === 'oauth2' && (!this.config.credentials.clientId || !this.config.credentials.clientSecret)) {
      return {
        success: false,
        error: {
          message: 'Missing OAuth2 credentials',
          code: 'MISSING_OAUTH_CREDENTIALS'
        }
      };
    }

    if (this.config.authType === 'api_key' && !this.config.credentials.apiKey) {
      return {
        success: false,
        error: {
          message: 'Missing API key',
          code: 'MISSING_API_KEY'
        }
      };
    }

    if (this.config.authType === 'basic' && (!this.config.credentials.username || !this.config.credentials.password)) {
      return {
        success: false,
        error: {
          message: 'Missing basic auth credentials',
          code: 'MISSING_BASIC_CREDENTIALS'
        }
      };
    }

    return {
      success: true,
      data: true
    };
  }

  /**
   * Get connector status
   */
  async getStatus(): Promise<APIResponse<{ 
    connected: boolean; 
    lastSync?: Date; 
    configValid: boolean 
  }>> {
    const configValidation = this.validateConfig();
    
    return {
      success: true,
      data: {
        connected: this.config.enabled,
        lastSync: this.config.lastSync,
        configValid: configValidation.success
      }
    };
  }

  /**
   * Enable the connector
   */
  async enable(): Promise<APIResponse<boolean>> {
    this.config.enabled = true;
    logger.info(`${this.loggerPrefix} Connector enabled`, { integrationId: this.config.id });
    return {
      success: true,
      data: true
    };
  }

  /**
   * Disable the connector
   */
  async disable(): Promise<APIResponse<boolean>> {
    this.config.enabled = false;
    logger.info(`${this.loggerPrefix} Connector disabled`, { integrationId: this.config.id });
    return {
      success: true,
      data: true
    };
  }
}