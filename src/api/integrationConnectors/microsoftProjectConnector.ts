/**
 * Microsoft Project Integration Connector
 * NataCarePM - Phase 4.4: Third-Party Integrations
 *
 * Connector for Microsoft Project integration using Microsoft Graph API
 */

import { BaseIntegrationConnector, IntegrationConfig, ProjectData, TaskData, ResourceData } from './baseConnector';
import { logger } from '@/utils/logger.enhanced';
import { APIResponse } from '@/utils/responseWrapper';

// ============================================================================
// Microsoft Project Specific Types
// ============================================================================

interface MicrosoftProject {
  id: string;
  name: string;
  description?: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  webUrl?: string;
  currency?: string;
  plan: MicrosoftProjectPlan;
}

interface MicrosoftProjectPlan {
  id: string;
  title: string;
  createdDateTime: string;
  owner: MicrosoftUser;
  tasks: MicrosoftTask[];
  resources: MicrosoftResource[];
}

interface MicrosoftUser {
  id: string;
  displayName: string;
  email: string;
}

interface MicrosoftTask {
  id: string;
  name: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  duration: string; // ISO 8601 duration
  percentComplete: number;
  priority: number;
  status: 'notStarted' | 'inProgress' | 'completed' | 'waitingOnOthers' | 'deferred';
  assignments: MicrosoftAssignment[];
  dependencies?: string[]; // Task IDs
}

interface MicrosoftResource {
  id: string;
  name: string;
  type: 'work' | 'material' | 'cost';
  cost?: {
    rate: number;
    overtimeRate?: number;
  };
  availability?: {
    from: string;
    to: string;
  };
}

interface MicrosoftAssignment {
  id: string;
  taskId: string;
  resourceId: string;
  units: number; // 0-100
  workingTime?: string; // ISO 8601 duration
}

// ============================================================================
// Microsoft Project Connector
// ============================================================================

export class MicrosoftProjectConnector extends BaseIntegrationConnector {
  private graphApiVersion: string = 'v1.0';
  private scopes: string[] = [
    'Project.ReadWrite.All',
    'User.Read'
  ];

  constructor(config: IntegrationConfig) {
    super({
      ...config,
      type: 'microsoft_project'
    });
  }

  /**
   * Authenticate with Microsoft Graph API
   */
  async authenticate(): Promise<APIResponse<boolean>> {
    try {
      // Validate configuration
      const configValidation = this.validateConfig();
      if (!configValidation.success) {
        return configValidation as APIResponse<boolean>;
      }

      // For OAuth2, we would exchange the authorization code for tokens
      // This is a simplified implementation
      if (this.config.authType === 'oauth2') {
        // In a real implementation, this would make a request to Microsoft's token endpoint
        logger.info(`${this.loggerPrefix} Authenticated with Microsoft Graph API`);
        return {
          success: true,
          data: true
        };
      }

      return {
        success: false,
        error: {
          message: 'Unsupported authentication type for Microsoft Project',
          code: 'UNSUPPORTED_AUTH_TYPE'
        }
      };
    } catch (error) {
      logger.error(`${this.loggerPrefix} Authentication failed`, error instanceof Error ? error : new Error(String(error)));
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
   * Fetch projects from Microsoft Project
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
      const response = await this.makeRequest<MicrosoftProject[]>(
        `/${this.graphApiVersion}/projects`
      );

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error
        };
      }

      // Transform Microsoft Project data to our format
      const projects: ProjectData[] = response.data.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        startDate: project.plan.tasks.length > 0 
          ? new Date(Math.min(...project.plan.tasks.map(t => new Date(t.startDateTime).getTime()))) 
          : undefined,
        endDate: project.plan.tasks.length > 0 
          ? new Date(Math.max(...project.plan.tasks.map(t => new Date(t.endDateTime).getTime()))) 
          : undefined,
        status: 'active', // Microsoft Project doesn't have explicit status
        budget: undefined, // Would need to calculate from tasks/resources
        currency: project.currency,
        manager: project.plan.owner?.displayName,
        team: project.plan.resources.map(r => r.name),
        createdAt: new Date(project.createdDateTime),
        updatedAt: new Date(project.lastModifiedDateTime)
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
   * Fetch tasks from Microsoft Project
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

      // If projectId is provided, fetch tasks for specific project
      // Otherwise, fetch all tasks
      const endpoint = projectId 
        ? `/${this.graphApiVersion}/projects/${projectId}/tasks`
        : `/${this.graphApiVersion}/tasks`;

      // Make API request to fetch tasks
      const response = await this.makeRequest<MicrosoftTask[]>(
        endpoint
      );

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error
        };
      }

      // Transform Microsoft Task data to our format
      const tasks: TaskData[] = response.data.map(task => {
        // Convert duration from ISO 8601 to days
        let duration = 0;
        if (task.duration) {
          // Parse ISO 8601 duration (e.g., "P1D" = 1 day)
          const match = task.duration.match(/P(\d+)D/);
          if (match) {
            duration = parseInt(match[1]);
          }
        }

        // Map Microsoft status to our status
        let status: TaskData['status'] = 'not_started';
        switch (task.status) {
          case 'notStarted':
            status = 'not_started';
            break;
          case 'inProgress':
            status = 'in_progress';
            break;
          case 'completed':
            status = 'completed';
            break;
          case 'waitingOnOthers':
            status = 'on_hold';
            break;
          case 'deferred':
            status = 'on_hold';
            break;
        }

        // Map Microsoft priority (0-1000) to our priority
        let priority: TaskData['priority'] = 'medium';
        if (task.priority < 300) {
          priority = 'low';
        } else if (task.priority < 700) {
          priority = 'medium';
        } else if (task.priority < 900) {
          priority = 'high';
        } else {
          priority = 'critical';
        }

        return {
          id: task.id,
          projectId: '', // Would need to extract from context
          name: task.name,
          description: task.description,
          startDate: task.startDateTime ? new Date(task.startDateTime) : undefined,
          endDate: task.endDateTime ? new Date(task.endDateTime) : undefined,
          duration,
          status,
          priority,
          assignee: task.assignments.length > 0 
            ? task.assignments[0].resourceId 
            : undefined,
          dependencies: task.dependencies || [],
          progress: task.percentComplete,
          cost: undefined, // Would need to calculate from assignments
          createdAt: new Date(), // Microsoft doesn't provide this directly
          updatedAt: new Date() // Microsoft doesn't provide this directly
        };
      });

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
   * Fetch resources from Microsoft Project
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
      const response = await this.makeRequest<MicrosoftResource[]>(
        `/${this.graphApiVersion}/resources`
      );

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error
        };
      }

      // Transform Microsoft Resource data to our format
      const resources: ResourceData[] = response.data.map(resource => {
        // Map Microsoft resource type to our type
        let type: ResourceData['type'] = 'human';
        switch (resource.type) {
          case 'work':
            type = 'human';
            break;
          case 'material':
            type = 'material';
            break;
          case 'cost':
            type = 'material'; // Treat cost resources as materials
            break;
        }

        return {
          id: resource.id,
          name: resource.name,
          type,
          description: undefined, // Microsoft doesn't provide this directly
          cost: resource.cost?.rate,
          unit: undefined, // Microsoft doesn't provide this directly
          availability: resource.availability ? {
            startDate: new Date(resource.availability.from),
            endDate: new Date(resource.availability.to)
          } : undefined,
          skills: [], // Microsoft doesn't provide this directly
          certifications: [], // Microsoft doesn't provide this directly
          createdAt: new Date(), // Microsoft doesn't provide this directly
          updatedAt: new Date() // Microsoft doesn't provide this directly
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
   * Sync projects to Microsoft Project
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
        // Transform our project data to Microsoft format
        const microsoftProject: Partial<MicrosoftProject> = {
          name: project.name,
          description: project.description,
          currency: project.currency
        };

        // Make API request to create/update project
        const endpoint = project.id 
          ? `/${this.graphApiVersion}/projects/${project.id}`
          : `/${this.graphApiVersion}/projects`;

        const method = project.id ? 'PATCH' : 'POST';

        const response = await this.makeRequest<MicrosoftProject>(
          endpoint,
          {
            method,
            body: JSON.stringify(microsoftProject)
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
   * Sync tasks to Microsoft Project
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
        // Transform our task data to Microsoft format
        const microsoftTask: Partial<MicrosoftTask> = {
          name: task.name,
          description: task.description,
          startDateTime: task.startDate?.toISOString(),
          endDateTime: task.endDate?.toISOString(),
          percentComplete: task.progress || 0,
          status: this.mapStatusToMicrosoft(task.status)
        };

        // Convert duration to ISO 8601 format
        if (task.duration) {
          microsoftTask.duration = `P${task.duration}D`;
        }

        // Map priority
        microsoftTask.priority = this.mapPriorityToMicrosoft(task.priority);

        // Make API request to create/update task
        const endpoint = task.id 
          ? `/${this.graphApiVersion}/tasks/${task.id}`
          : `/${this.graphApiVersion}/tasks`;

        const method = task.id ? 'PATCH' : 'POST';

        const response = await this.makeRequest<MicrosoftTask>(
          endpoint,
          {
            method,
            body: JSON.stringify(microsoftTask)
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
   * Sync resources to Microsoft Project
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
        // Transform our resource data to Microsoft format
        const microsoftResource: Partial<MicrosoftResource> = {
          name: resource.name,
          type: this.mapResourceTypeToMicrosoft(resource.type)
        };

        // Add cost information
        if (resource.cost) {
          microsoftResource.cost = {
            rate: resource.cost
          };
        }

        // Add availability
        if (resource.availability) {
          microsoftResource.availability = {
            from: resource.availability.startDate?.toISOString() || new Date().toISOString(),
            to: resource.availability.endDate?.toISOString() || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          };
        }

        // Make API request to create/update resource
        const endpoint = resource.id 
          ? `/${this.graphApiVersion}/resources/${resource.id}`
          : `/${this.graphApiVersion}/resources`;

        const method = resource.id ? 'PATCH' : 'POST';

        const response = await this.makeRequest<MicrosoftResource>(
          endpoint,
          {
            method,
            body: JSON.stringify(microsoftResource)
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
   * Handle webhook events from Microsoft Project
   */
  async handleWebhook(payload: any): Promise<APIResponse<boolean>> {
    try {
      logger.info(`${this.loggerPrefix} Webhook received`, { payload });

      // Process different types of events
      switch (payload.resource) {
        case 'project':
          logger.info(`${this.loggerPrefix} Project event received`, { 
            eventType: payload.changeType,
            projectId: payload.resourceData?.id
          });
          break;
        case 'task':
          logger.info(`${this.loggerPrefix} Task event received`, { 
            eventType: payload.changeType,
            taskId: payload.resourceData?.id
          });
          break;
        case 'resource':
          logger.info(`${this.loggerPrefix} Resource event received`, { 
            eventType: payload.changeType,
            resourceId: payload.resourceData?.id
          });
          break;
        default:
          logger.debug(`${this.loggerPrefix} Unhandled webhook resource`, { resource: payload.resource });
      }

      return {
        success: true,
        data: true
      };
    } catch (error) {
      logger.error(`${this.loggerPrefix} Failed to handle webhook`, error instanceof Error ? error : new Error(String(error)));
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
   * Map our status to Microsoft Project status
   */
  private mapStatusToMicrosoft(status: TaskData['status']): MicrosoftTask['status'] {
    switch (status) {
      case 'not_started':
        return 'notStarted';
      case 'in_progress':
        return 'inProgress';
      case 'completed':
        return 'completed';
      case 'on_hold':
        return 'waitingOnOthers';
      case 'cancelled':
        return 'deferred';
      default:
        return 'notStarted';
    }
  }

  /**
   * Map our priority to Microsoft Project priority
   */
  private mapPriorityToMicrosoft(priority: TaskData['priority']): number {
    switch (priority) {
      case 'low':
        return 200;
      case 'medium':
        return 500;
      case 'high':
        return 800;
      case 'critical':
        return 950;
      default:
        return 500;
    }
  }

  /**
   * Map our resource type to Microsoft Project resource type
   */
  private mapResourceTypeToMicrosoft(type: ResourceData['type']): MicrosoftResource['type'] {
    switch (type) {
      case 'human':
        return 'work';
      case 'equipment':
        return 'work'; // Microsoft treats equipment as work resources
      case 'material':
        return 'material';
      default:
        return 'work';
    }
  }
}