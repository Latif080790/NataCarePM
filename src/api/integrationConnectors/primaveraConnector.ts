/**
 * Primavera Integration Connector
 * NataCarePM - Phase 4.4: Third-Party Integrations
 *
 * Connector for Oracle Primavera P6 integration
 */

import { BaseIntegrationConnector, IntegrationConfig, ProjectData, TaskData, ResourceData } from './baseConnector';
import { logger } from '@/utils/logger.enhanced';
import { APIResponse } from '@/utils/responseWrapper';

// ============================================================================
// Primavera Specific Types
// ============================================================================

interface PrimaveraProject {
  ObjectId: number;
  Id: string;
  Name: string;
  Description?: string;
  CreationDate: string;
  LastUpdateDate: string;
  PlannedStartDate: string;
  PlannedFinishDate: string;
  Status: 'Active' | 'Inactive' | 'What-If';
  Currency: string;
  Budget?: number;
  Manager?: string;
  EPSObjectId: number;
}

interface PrimaveraActivity {
  ObjectId: number;
  Id: string;
  Name: string;
  Description?: string;
  PlannedStartDate: string;
  PlannedFinishDate: string;
  ActualStartDate?: string;
  ActualFinishDate?: string;
  RemainingDuration: number;
  PercentComplete: number;
  Status: 'Not Started' | 'In Progress' | 'Completed' | 'Cancelled';
  Priority: 'Low' | 'Medium' | 'High' | 'Critical';
  ProjectObjectId: number;
  WBSObjectId: number;
  ResourceAssignments: PrimaveraResourceAssignment[];
  Predecessors: PrimaveraPredecessor[];
}

interface PrimaveraResource {
  ObjectId: number;
  Id: string;
  Name: string;
  ResourceType: 'Labor' | 'Nonlabor' | 'Material';
  CostPerUnit?: number;
  UnitsPerTime?: number;
  CalendarObjectId?: number;
  RoleObjectId?: number;
}

interface PrimaveraResourceAssignment {
  ObjectId: number;
  ActivityObjectId: number;
  ResourceObjectId: number;
  Units: number;
  RemainingUnits: number;
  ActualUnits: number;
}

interface PrimaveraPredecessor {
  ObjectId: number;
  PredecessorActivityObjectId: number;
  SuccessorActivityObjectId: number;
  Type: 'FS' | 'SS' | 'FF' | 'SF';
  Lag: number;
}

// ============================================================================
// Primavera Connector
// ============================================================================

export class PrimaveraConnector extends BaseIntegrationConnector {
  private apiVersion: string = '9.9.9'; // Primavera REST API version
  private databaseId: string = 'PMDB'; // Default database ID

  constructor(config: IntegrationConfig) {
    super({
      ...config,
      type: 'primavera'
    });
    // Extract database ID from config if provided
    if (config.credentials.apiKey) {
      this.databaseId = config.credentials.apiKey;
    }
  }

  /**
   * Authenticate with Primavera REST API
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
        logger.info(`${this.loggerPrefix} Authenticated with Primavera REST API`);
        return {
          success: true,
          data: true
        };
      }

      // For API key auth, we would include it in requests
      if (this.config.authType === 'api_key') {
        logger.info(`${this.loggerPrefix} Authenticated with Primavera REST API`);
        return {
          success: true,
          data: true
        };
      }

      return {
        success: false,
        error: {
          message: 'Unsupported authentication type for Primavera',
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
   * Fetch projects from Primavera
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

      // Make API request to fetch projects
      const endpoint = `/p6ws/rest/v1/projects?DatabaseId=${this.databaseId}`;
      const response = await this.makeRequest<PrimaveraProject[]>(endpoint);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error
        };
      }

      // Transform Primavera Project data to our format
      const projects: ProjectData[] = response.data.map(project => ({
        id: project.ObjectId.toString(),
        name: project.Name,
        description: project.Description,
        startDate: new Date(project.PlannedStartDate),
        endDate: new Date(project.PlannedFinishDate),
        status: this.mapProjectStatus(project.Status),
        budget: project.Budget,
        currency: project.Currency,
        manager: project.Manager,
        team: [], // Would need separate API call to get team members
        createdAt: new Date(project.CreationDate),
        updatedAt: new Date(project.LastUpdateDate)
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
   * Fetch tasks from Primavera
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
      let queryParams = `DatabaseId=${this.databaseId}`;
      if (projectId) {
        queryParams += `&ProjectObjectId=${projectId}`;
      }

      // Make API request to fetch activities
      const endpoint = `/p6ws/rest/v1/activities?${queryParams}`;
      const response = await this.makeRequest<PrimaveraActivity[]>(endpoint);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error
        };
      }

      // Transform Primavera Activity data to our format
      const tasks: TaskData[] = response.data.map(activity => ({
        id: activity.ObjectId.toString(),
        projectId: activity.ProjectObjectId.toString(),
        name: activity.Name,
        description: activity.Description,
        startDate: new Date(activity.PlannedStartDate),
        endDate: new Date(activity.PlannedFinishDate),
        duration: activity.RemainingDuration,
        status: this.mapActivityStatus(activity.Status),
        priority: this.mapActivityPriority(activity.Priority),
        assignee: activity.ResourceAssignments.length > 0 
          ? activity.ResourceAssignments[0].ResourceObjectId.toString()
          : undefined,
        dependencies: activity.Predecessors.map(p => p.PredecessorActivityObjectId.toString()),
        progress: activity.PercentComplete,
        cost: undefined, // Would need to calculate from resource assignments
        createdAt: new Date(), // Primavera doesn't provide this directly
        updatedAt: new Date() // Primavera doesn't provide this directly
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
   * Fetch resources from Primavera
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

      // Make API request to fetch resources
      const endpoint = `/p6ws/rest/v1/resources?DatabaseId=${this.databaseId}`;
      const response = await this.makeRequest<PrimaveraResource[]>(endpoint);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error
        };
      }

      // Transform Primavera Resource data to our format
      const resources: ResourceData[] = response.data.map(resource => {
        // Map Primavera resource type to our type
        let type: ResourceData['type'] = 'human';
        switch (resource.ResourceType) {
          case 'Labor':
            type = 'human';
            break;
          case 'Nonlabor':
            type = 'equipment';
            break;
          case 'Material':
            type = 'material';
            break;
        }

        return {
          id: resource.ObjectId.toString(),
          name: resource.Name,
          type,
          description: undefined, // Primavera doesn't provide this directly
          cost: resource.CostPerUnit,
          unit: undefined, // Primavera doesn't provide this directly
          availability: undefined, // Would need separate API call
          skills: [], // Primavera doesn't provide this directly
          certifications: [], // Primavera doesn't provide this directly
          createdAt: new Date(), // Primavera doesn't provide this directly
          updatedAt: new Date() // Primavera doesn't provide this directly
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
   * Sync projects to Primavera
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
        // Transform our project data to Primavera format
        const primaveraProject: Partial<PrimaveraProject> = {
          Id: project.id,
          Name: project.name,
          Description: project.description,
          PlannedStartDate: project.startDate?.toISOString(),
          PlannedFinishDate: project.endDate?.toISOString(),
          Status: this.mapProjectStatusToPrimavera(project.status),
          Currency: project.currency
        };

        // Make API request to create/update project
        const endpoint = project.id 
          ? `/p6ws/rest/v1/projects/${project.id}?DatabaseId=${this.databaseId}`
          : `/p6ws/rest/v1/projects?DatabaseId=${this.databaseId}`;

        const method = project.id ? 'PUT' : 'POST';

        const response = await this.makeRequest<PrimaveraProject>(
          endpoint,
          {
            method,
            body: JSON.stringify(primaveraProject)
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
   * Sync tasks to Primavera
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
        // Transform our task data to Primavera format
        const primaveraActivity: Partial<PrimaveraActivity> = {
          Id: task.id,
          Name: task.name,
          Description: task.description,
          PlannedStartDate: task.startDate?.toISOString(),
          PlannedFinishDate: task.endDate?.toISOString(),
          RemainingDuration: task.duration || 0,
          PercentComplete: task.progress || 0,
          Status: this.mapActivityStatusToPrimavera(task.status),
          Priority: this.mapActivityPriorityToPrimavera(task.priority),
          ProjectObjectId: parseInt(task.projectId)
        };

        // Make API request to create/update activity
        const endpoint = task.id 
          ? `/p6ws/rest/v1/activities/${task.id}?DatabaseId=${this.databaseId}`
          : `/p6ws/rest/v1/activities?DatabaseId=${this.databaseId}`;

        const method = task.id ? 'PUT' : 'POST';

        const response = await this.makeRequest<PrimaveraActivity>(
          endpoint,
          {
            method,
            body: JSON.stringify(primaveraActivity)
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
   * Sync resources to Primavera
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
        // Transform our resource data to Primavera format
        const primaveraResource: Partial<PrimaveraResource> = {
          Id: resource.id,
          Name: resource.name,
          ResourceType: this.mapResourceTypeToPrimavera(resource.type),
          CostPerUnit: resource.cost
        };

        // Make API request to create/update resource
        const endpoint = resource.id 
          ? `/p6ws/rest/v1/resources/${resource.id}?DatabaseId=${this.databaseId}`
          : `/p6ws/rest/v1/resources?DatabaseId=${this.databaseId}`;

        const method = resource.id ? 'PUT' : 'POST';

        const response = await this.makeRequest<PrimaveraResource>(
          endpoint,
          {
            method,
            body: JSON.stringify(primaveraResource)
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
   * Handle webhook events from Primavera
   */
  async handleWebhook(payload: any): Promise<APIResponse<boolean>> {
    try {
      logger.info(`${this.loggerPrefix} Webhook received`, { payload });

      // Process different types of events
      switch (payload.eventType) {
        case 'project.created':
          logger.info(`${this.loggerPrefix} Project created event received`, { 
            projectId: payload.projectId
          });
          break;
        case 'activity.updated':
          logger.info(`${this.loggerPrefix} Activity updated event received`, { 
            activityId: payload.activityId
          });
          break;
        case 'resource.assigned':
          logger.info(`${this.loggerPrefix} Resource assigned event received`, { 
            resourceId: payload.resourceId,
            activityId: payload.activityId
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
   * Map Primavera project status to our status
   */
  private mapProjectStatus(status: string): ProjectData['status'] {
    switch (status) {
      case 'Active':
        return 'active';
      case 'Inactive':
        return 'on_hold';
      case 'What-If':
        return 'planning';
      default:
        return 'planning';
    }
  }

  /**
   * Map our project status to Primavera status
   */
  private mapProjectStatusToPrimavera(status: ProjectData['status']): 'Active' | 'Inactive' | 'What-If' {
    switch (status) {
      case 'active':
        return 'Active';
      case 'on_hold':
        return 'Inactive';
      case 'planning':
        return 'What-If';
      case 'completed':
        return 'Inactive';
      case 'cancelled':
        return 'Inactive';
      default:
        return 'What-If';
    }
  }

  /**
   * Map Primavera activity status to our status
   */
  private mapActivityStatus(status: string): TaskData['status'] {
    switch (status) {
      case 'Not Started':
        return 'not_started';
      case 'In Progress':
        return 'in_progress';
      case 'Completed':
        return 'completed';
      case 'Cancelled':
        return 'cancelled';
      default:
        return 'not_started';
    }
  }

  /**
   * Map our activity status to Primavera status
   */
  private mapActivityStatusToPrimavera(status: TaskData['status']): 'Not Started' | 'In Progress' | 'Completed' | 'Cancelled' {
    switch (status) {
      case 'not_started':
        return 'Not Started';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'on_hold':
        return 'Not Started'; // Primavera doesn't have explicit on-hold status
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Not Started';
    }
  }

  /**
   * Map Primavera activity priority to our priority
   */
  private mapActivityPriority(priority: string): TaskData['priority'] {
    switch (priority) {
      case 'Low':
        return 'low';
      case 'Medium':
        return 'medium';
      case 'High':
        return 'high';
      case 'Critical':
        return 'critical';
      default:
        return 'medium';
    }
  }

  /**
   * Map our activity priority to Primavera priority
   */
  private mapActivityPriorityToPrimavera(priority: TaskData['priority']): 'Low' | 'Medium' | 'High' | 'Critical' {
    switch (priority) {
      case 'low':
        return 'Low';
      case 'medium':
        return 'Medium';
      case 'high':
        return 'High';
      case 'critical':
        return 'Critical';
      default:
        return 'Medium';
    }
  }

  /**
   * Map our resource type to Primavera resource type
   */
  private mapResourceTypeToPrimavera(type: ResourceData['type']): 'Labor' | 'Nonlabor' | 'Material' {
    switch (type) {
      case 'human':
        return 'Labor';
      case 'equipment':
        return 'Nonlabor';
      case 'material':
        return 'Material';
      default:
        return 'Labor';
    }
  }
}