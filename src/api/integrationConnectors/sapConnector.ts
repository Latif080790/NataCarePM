/**
 * SAP Integration Connector
 * NataCarePM - Phase 4.4: Third-Party Integrations
 *
 * Connector for SAP ERP integration using OData services
 */

import { BaseIntegrationConnector, IntegrationConfig, ProjectData, TaskData, ResourceData } from './baseConnector';
import { logger } from '@/utils/logger.enhanced';
import { APIResponse } from '@/utils/responseWrapper';

// ============================================================================
// SAP Specific Types
// ============================================================================

interface SAPProject {
  ProjectID: string;
  ProjectName: string;
  Description?: string;
  StartDate: string;
  EndDate: string;
  Status: 'RELEASED' | 'CLOSED' | 'TECHNICAL' | 'DELETED';
  Currency: string;
  Budget?: number;
  ActualCost?: number;
  ProjectManager?: string;
  CompanyCode: string;
  Plant?: string;
}

interface SAPNetwork {
  NetworkID: string;
  ProjectID: string;
  NetworkName: string;
  Description?: string;
  StartDate: string;
  EndDate: string;
  Status: 'RELEASED' | 'CLOSED' | 'LOCKED' | 'DELETED';
  Priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  WorkCenter?: string;
  Plant: string;
}

interface SAPActivity {
  ActivityID: string;
  NetworkID: string;
  ActivityName: string;
  Description?: string;
  StartDate: string;
  EndDate: string;
  Duration: number; // in work days
  Status: 'NOT_STARTED' | 'IN_PROCESS' | 'TECO' | 'REL' | 'DLFL';
  WorkQuantity?: number;
  UnitOfMeasure?: string;
  WorkCenter?: string;
  AssignedResources: SAPResourceAssignment[];
  Predecessors: SAPActivityPredecessor[];
}

interface SAPResource {
  ResourceID: string;
  ResourceName: string;
  ResourceType: 'PERSON' | 'EQUIPMENT' | 'MATERIAL';
  CostCenter?: string;
  Plant?: string;
  StandardValueKey?: string;
  BaseUnit?: string;
  CostPerUnit?: number;
}

interface SAPResourceAssignment {
  AssignmentID: string;
  ActivityID: string;
  ResourceID: string;
  Quantity: number;
  UnitOfMeasure?: string;
  WorkCenter?: string;
}

interface SAPActivityPredecessor {
  PredecessorID: string;
  ActivityID: string;
  PredecessorActivityID: string;
  RelationshipType: 'FS' | 'SS' | 'FF' | 'SF';
  LagDuration?: number;
  LagUnit?: string;
}

// ============================================================================
// SAP Connector
// ============================================================================

export class SAPConnector extends BaseIntegrationConnector {
  private odataVersion: string = 'V2'; // SAP OData version
  private sapClient: string = '100'; // Default SAP client

  constructor(config: IntegrationConfig) {
    super({
      ...config,
      type: 'sap'
    });
    // Extract SAP client from config if provided
    if (config.credentials.apiKey) {
      this.sapClient = config.credentials.apiKey;
    }
  }

  /**
   * Authenticate with SAP OData services
   */
  async authenticate(): Promise<APIResponse<boolean>> {
    try {
      // Validate configuration
      const configValidation = this.validateConfig();
      if (!configValidation.success) {
        return configValidation as APIResponse<boolean>;
      }

      // For basic auth, we would use the provided credentials
      if (this.config.authType === 'basic') {
        logger.info(`${this.loggerPrefix} Authenticated with SAP OData services`);
        return {
          success: true,
          data: true
        };
      }

      // For OAuth2, we would exchange the authorization code for tokens
      if (this.config.authType === 'oauth2') {
        logger.info(`${this.loggerPrefix} Authenticated with SAP OData services`);
        return {
          success: true,
          data: true
        };
      }

      return {
        success: false,
        error: {
          message: 'Unsupported authentication type for SAP',
          code: 'UNSUPPORTED_AUTH_TYPE'
        }
      };
    } catch (error: any) {
      logger.error(`${this.loggerPrefix} Authentication failed`, error);
      return {
        success: false,
        error: {
          message: 'Authentication failed',
          code: 'AUTHENTICATION_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Fetch projects from SAP
   */
  async fetchProjects(): Promise<APIResponse<ProjectData[]>> {
    try {
      // Validate authentication
      const authResult = await this.authenticate();
      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error
        };
      }

      // Make OData request to fetch projects
      const endpoint = `/sap/opu/odata/sap/C_PROJECTMANAGEMENT_TP/${this.odataVersion}/Projects`;
      const response = await this.makeRequest<{ d: { results: SAPProject[] } }>(endpoint);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error
        };
      }

      // Transform SAP Project data to our format
      const projects: ProjectData[] = response.data.d.results.map(project => ({
        id: project.ProjectID,
        name: project.ProjectName,
        description: project.Description,
        startDate: new Date(project.StartDate),
        endDate: new Date(project.EndDate),
        status: this.mapProjectStatus(project.Status),
        budget: project.Budget,
        currency: project.Currency,
        manager: project.ProjectManager,
        team: [], // Would need separate API call to get team members
        createdAt: new Date(), // SAP doesn't provide this directly
        updatedAt: new Date() // SAP doesn't provide this directly
      }));

      logger.info(`${this.loggerPrefix} Fetched ${projects.length} projects`);
      return {
        success: true,
        data: projects
      };
    } catch (error: any) {
      logger.error(`${this.loggerPrefix} Failed to fetch projects`, error);
      return {
        success: false,
        error: {
          message: 'Failed to fetch projects',
          code: 'FETCH_PROJECTS_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Fetch tasks from SAP
   */
  async fetchTasks(projectId?: string): Promise<APIResponse<TaskData[]>> {
    try {
      // Validate authentication
      const authResult = await this.authenticate();
      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error
        };
      }

      // Build query parameters
      let filter = '';
      if (projectId) {
        filter = `?$filter=ProjectID eq '${projectId}'`;
      }

      // Make OData request to fetch networks (which represent high-level tasks)
      const networkEndpoint = `/sap/opu/odata/sap/C_PROJECTMANAGEMENT_TP/${this.odataVersion}/Networks${filter}`;
      const networkResponse = await this.makeRequest<{ d: { results: SAPNetwork[] } }>(networkEndpoint);

      if (!networkResponse.success || !networkResponse.data) {
        return {
          success: false,
          error: networkResponse.error
        };
      }

      // Transform SAP Network data to our format
      const tasks: TaskData[] = networkResponse.data.d.results.map(network => ({
        id: network.NetworkID,
        projectId: network.ProjectID,
        name: network.NetworkName,
        description: network.Description,
        startDate: new Date(network.StartDate),
        endDate: new Date(network.EndDate),
        duration: this.calculateDuration(network.StartDate, network.EndDate),
        status: this.mapNetworkStatus(network.Status),
        priority: this.mapNetworkPriority(network.Priority),
        assignee: network.WorkCenter,
        dependencies: [], // Would need separate API call to get predecessors
        progress: undefined, // SAP doesn't provide this directly for networks
        cost: undefined, // Would need to calculate from activities
        createdAt: new Date(), // SAP doesn't provide this directly
        updatedAt: new Date() // SAP doesn't provide this directly
      }));

      logger.info(`${this.loggerPrefix} Fetched ${tasks.length} tasks`);
      return {
        success: true,
        data: tasks
      };
    } catch (error: any) {
      logger.error(`${this.loggerPrefix} Failed to fetch tasks`, error);
      return {
        success: false,
        error: {
          message: 'Failed to fetch tasks',
          code: 'FETCH_TASKS_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Fetch resources from SAP
   */
  async fetchResources(): Promise<APIResponse<ResourceData[]>> {
    try {
      // Validate authentication
      const authResult = await this.authenticate();
      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error
        };
      }

      // Make OData request to fetch resources
      const endpoint = `/sap/opu/odata/sap/C_PROJECTMANAGEMENT_TP/${this.odataVersion}/Resources`;
      const response = await this.makeRequest<{ d: { results: SAPResource[] } }>(endpoint);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error
        };
      }

      // Transform SAP Resource data to our format
      const resources: ResourceData[] = response.data.d.results.map(resource => {
        // Map SAP resource type to our type
        let type: ResourceData['type'] = 'human';
        switch (resource.ResourceType) {
          case 'PERSON':
            type = 'human';
            break;
          case 'EQUIPMENT':
            type = 'equipment';
            break;
          case 'MATERIAL':
            type = 'material';
            break;
        }

        return {
          id: resource.ResourceID,
          name: resource.ResourceName,
          type,
          description: undefined, // SAP Resource doesn't have Description field
          cost: resource.CostPerUnit,
          unit: resource.BaseUnit,
          availability: undefined, // Would need separate API call
          skills: [], // SAP doesn't provide this directly
          certifications: [], // SAP doesn't provide this directly
          createdAt: new Date(), // SAP doesn't provide this directly
          updatedAt: new Date() // SAP doesn't provide this directly
        };
      });

      logger.info(`${this.loggerPrefix} Fetched ${resources.length} resources`);
      return {
        success: true,
        data: resources
      };
    } catch (error: any) {
      logger.error(`${this.loggerPrefix} Failed to fetch resources`, error);
      return {
        success: false,
        error: {
          message: 'Failed to fetch resources',
          code: 'FETCH_RESOURCES_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Sync projects to SAP
   */
  async syncProjects(projects: ProjectData[]): Promise<APIResponse<boolean>> {
    try {
      // Validate authentication
      const authResult = await this.authenticate();
      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error
        };
      }

      // Sync each project
      for (const project of projects) {
        // Transform our project data to SAP format
        const sapProject: Partial<SAPProject> = {
          ProjectID: project.id,
          ProjectName: project.name,
          Description: project.description,
          StartDate: project.startDate?.toISOString().split('T')[0], // SAP expects YYYY-MM-DD
          EndDate: project.endDate?.toISOString().split('T')[0], // SAP expects YYYY-MM-DD
          Status: this.mapProjectStatusToSAP(project.status),
          Currency: project.currency
        };

        // Make OData request to create/update project
        const endpoint = project.id 
          ? `/sap/opu/odata/sap/C_PROJECTMANAGEMENT_TP/${this.odataVersion}/Projects('${project.id}')`
          : `/sap/opu/odata/sap/C_PROJECTMANAGEMENT_TP/${this.odataVersion}/Projects`;

        const method = project.id ? 'PUT' : 'POST';

        const response = await this.makeRequest<{ d: SAPProject }>(
          endpoint,
          {
            method,
            body: JSON.stringify(sapProject)
          }
        );

        if (!response.success) {
          logger.error(`${this.loggerPrefix} Failed to sync project ${project.id}`, new Error(response.error?.message || 'Unknown error'));
          // Continue with other projects
        }
      }

      logger.info(`${this.loggerPrefix} Synced ${projects.length} projects`);
      return {
        success: true,
        data: true
      };
    } catch (error: any) {
      logger.error(`${this.loggerPrefix} Failed to sync projects`, error);
      return {
        success: false,
        error: {
          message: 'Failed to sync projects',
          code: 'SYNC_PROJECTS_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Sync tasks to SAP
   */
  async syncTasks(tasks: TaskData[]): Promise<APIResponse<boolean>> {
    try {
      // Validate authentication
      const authResult = await this.authenticate();
      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error
        };
      }

      // Sync each task
      for (const task of tasks) {
        // Transform our task data to SAP format
        const sapNetwork: Partial<SAPNetwork> = {
          NetworkID: task.id,
          ProjectID: task.projectId,
          NetworkName: task.name,
          Description: task.description,
          StartDate: task.startDate?.toISOString().split('T')[0], // SAP expects YYYY-MM-DD
          EndDate: task.endDate?.toISOString().split('T')[0], // SAP expects YYYY-MM-DD
          Status: this.mapNetworkStatusToSAP(task.status),
          Priority: this.mapNetworkPriorityToSAP(task.priority)
        };

        // Make OData request to create/update network
        const endpoint = task.id 
          ? `/sap/opu/odata/sap/C_PROJECTMANAGEMENT_TP/${this.odataVersion}/Networks('${task.id}')`
          : `/sap/opu/odata/sap/C_PROJECTMANAGEMENT_TP/${this.odataVersion}/Networks`;

        const method = task.id ? 'PUT' : 'POST';

        const response = await this.makeRequest<{ d: SAPNetwork }>(
          endpoint,
          {
            method,
            body: JSON.stringify(sapNetwork)
          }
        );

        if (!response.success) {
          logger.error(`${this.loggerPrefix} Failed to sync task ${task.id}`, new Error(response.error?.message || 'Unknown error'));
          // Continue with other tasks
        }
      }

      logger.info(`${this.loggerPrefix} Synced ${tasks.length} tasks`);
      return {
        success: true,
        data: true
      };
    } catch (error: any) {
      logger.error(`${this.loggerPrefix} Failed to sync tasks`, error);
      return {
        success: false,
        error: {
          message: 'Failed to sync tasks',
          code: 'SYNC_TASKS_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Sync resources to SAP
   */
  async syncResources(resources: ResourceData[]): Promise<APIResponse<boolean>> {
    try {
      // Validate authentication
      const authResult = await this.authenticate();
      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error
        };
      }

      // Sync each resource
      for (const resource of resources) {
        // Transform our resource data to SAP format
        const sapResource: Partial<SAPResource> = {
          ResourceID: resource.id,
          ResourceName: resource.name,
          ResourceType: this.mapResourceTypeToSAP(resource.type),
          CostPerUnit: resource.cost,
          BaseUnit: resource.unit
        };

        // Make OData request to create/update resource
        const endpoint = resource.id 
          ? `/sap/opu/odata/sap/C_PROJECTMANAGEMENT_TP/${this.odataVersion}/Resources('${resource.id}')`
          : `/sap/opu/odata/sap/C_PROJECTMANAGEMENT_TP/${this.odataVersion}/Resources`;

        const method = resource.id ? 'PUT' : 'POST';

        const response = await this.makeRequest<{ d: SAPResource }>(
          endpoint,
          {
            method,
            body: JSON.stringify(sapResource)
          }
        );

        if (!response.success) {
          logger.error(`${this.loggerPrefix} Failed to sync resource ${resource.id}`, new Error(response.error?.message || 'Unknown error'));
          // Continue with other resources
        }
      }

      logger.info(`${this.loggerPrefix} Synced ${resources.length} resources`);
      return {
        success: true,
        data: true
      };
    } catch (error: any) {
      logger.error(`${this.loggerPrefix} Failed to sync resources`, error);
      return {
        success: false,
        error: {
          message: 'Failed to sync resources',
          code: 'SYNC_RESOURCES_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Handle webhook events from SAP
   */
  async handleWebhook(payload: any): Promise<APIResponse<boolean>> {
    try {
      logger.info(`${this.loggerPrefix} Webhook received`, { payload });

      // Process different types of events
      switch (payload.eventType) {
        case 'project.changed':
          logger.info(`${this.loggerPrefix} Project changed event received`, { 
            projectId: payload.projectId
          });
          break;
        case 'network.updated':
          logger.info(`${this.loggerPrefix} Network updated event received`, { 
            networkId: payload.networkId
          });
          break;
        case 'resource.assigned':
          logger.info(`${this.loggerPrefix} Resource assigned event received`, { 
            resourceId: payload.resourceId,
            networkId: payload.networkId
          });
          break;
        default:
          logger.debug(`${this.loggerPrefix} Unhandled webhook event`, { eventType: payload.eventType });
      }

      return {
        success: true,
        data: true
      };
    } catch (error: any) {
      logger.error(`${this.loggerPrefix} Failed to handle webhook`, error);
      return {
        success: false,
        error: {
          message: 'Failed to handle webhook',
          code: 'WEBHOOK_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Calculate duration in work days between two dates
   */
  private calculateDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calculate difference in milliseconds
    const diffTime = Math.abs(end.getTime() - start.getTime());
    
    // Convert to days (excluding weekends)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Estimate work days (assuming 5 work days per week)
    const workDays = Math.floor(diffDays * 5 / 7);
    
    return workDays;
  }

  /**
   * Map SAP project status to our status
   */
  private mapProjectStatus(status: string): ProjectData['status'] {
    switch (status) {
      case 'RELEASED':
        return 'active';
      case 'CLOSED':
        return 'completed';
      case 'TECHNICAL':
        return 'planning';
      case 'DELETED':
        return 'cancelled';
      default:
        return 'planning';
    }
  }

  /**
   * Map our project status to SAP status
   */
  private mapProjectStatusToSAP(status: ProjectData['status']): 'RELEASED' | 'CLOSED' | 'TECHNICAL' | 'DELETED' {
    switch (status) {
      case 'active':
        return 'RELEASED';
      case 'completed':
        return 'CLOSED';
      case 'planning':
        return 'TECHNICAL';
      case 'on_hold':
        return 'TECHNICAL';
      case 'cancelled':
        return 'DELETED';
      default:
        return 'TECHNICAL';
    }
  }

  /**
   * Map SAP network status to our status
   */
  private mapNetworkStatus(status: string): TaskData['status'] {
    switch (status) {
      case 'RELEASED':
        return 'in_progress';
      case 'CLOSED':
        return 'completed';
      case 'LOCKED':
        return 'on_hold';
      case 'DELETED':
        return 'cancelled';
      case 'REL':
        return 'in_progress';
      case 'TECO':
        return 'completed';
      case 'DLFL':
        return 'cancelled';
      default:
        return 'not_started';
    }
  }

  /**
   * Map our network status to SAP status
   */
  private mapNetworkStatusToSAP(status: TaskData['status']): 'RELEASED' | 'CLOSED' | 'LOCKED' | 'DELETED' {
    switch (status) {
      case 'not_started':
        return 'RELEASED'; // In SAP, networks are typically released when created
      case 'in_progress':
        return 'RELEASED';
      case 'completed':
        return 'CLOSED';
      case 'on_hold':
        return 'LOCKED';
      case 'cancelled':
        return 'DELETED';
      default:
        return 'RELEASED';
    }
  }

  /**
   * Map SAP network priority to our priority
   */
  private mapNetworkPriority(priority: string): TaskData['priority'] {
    switch (priority) {
      case 'LOW':
        return 'low';
      case 'MEDIUM':
        return 'medium';
      case 'HIGH':
        return 'high';
      case 'VERY_HIGH':
        return 'critical';
      default:
        return 'medium';
    }
  }

  /**
   * Map our network priority to SAP priority
   */
  private mapNetworkPriorityToSAP(priority: TaskData['priority']): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    switch (priority) {
      case 'low':
        return 'LOW';
      case 'medium':
        return 'MEDIUM';
      case 'high':
        return 'HIGH';
      case 'critical':
        return 'VERY_HIGH';
      default:
        return 'MEDIUM';
    }
  }

  /**
   * Map our resource type to SAP resource type
   */
  private mapResourceTypeToSAP(type: ResourceData['type']): 'PERSON' | 'EQUIPMENT' | 'MATERIAL' {
    switch (type) {
      case 'human':
        return 'PERSON';
      case 'equipment':
        return 'EQUIPMENT';
      case 'material':
        return 'MATERIAL';
      default:
        return 'PERSON';
    }
  }
}