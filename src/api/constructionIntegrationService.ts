/**
 * Construction Domain Integration Service
 * NataCarePM - Construction Management Suite
 * 
 * Provides cross-module integration between RFI, Submittals, and Daily Logs
 * enabling seamless workflow and data sharing between construction domain modules.
 */

import { rfiService } from './rfiService';
import { submittalService } from './submittalService';
import { dailyLogService } from './dailyLogService';
import { projectService } from './projectService';
import { createNotification } from './notificationService';
import { APIResponse, safeAsync, APIError, ErrorCodes } from '@/utils/responseWrapper';
import { logger } from '@/utils/logger.enhanced';
import { withRetry } from '@/utils/retryWrapper';
import { 
  Rfi, 
  Submittal, 
  DailyLog,
  ConstructionFilterOptions
} from '@/types/construction.types';
import { Project } from '@/types';
import { NotificationType, NotificationPriority, NotificationChannel } from '@/types/automation';

/**
 * Cross-reference between construction domain entities
 */
export interface ConstructionCrossReference {
  rfiId?: string;
  submittalId?: string;
  dailyLogId?: string;
  taskId?: string;
  changeOrderId?: string;
}

/**
 * Integrated construction workflow
 */
export interface ConstructionWorkflow {
  projectId: string;
  workflowId: string;
  name: string;
  description: string;
  steps: ConstructionWorkflowStep[];
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface ConstructionWorkflowStep {
  stepId: string;
  name: string;
  description: string;
  requiredEntities: ('rfi' | 'submittal' | 'dailyLog' | 'task')[];
  dependencies: string[]; // stepIds that must be completed first
  assignees: string[];
  dueDate?: Date;
  completed: boolean;
  completedAt?: Date;
  completionNotes?: string;
}

/**
 * Construction Domain Integration Service
 */
export class ConstructionIntegrationService {
  /**
   * Auto-link related construction entities
   */
  async autoLinkRelatedEntities(
    projectId: string,
    rfiId?: string,
    submittalId?: string,
    dailyLogId?: string
  ): Promise<APIResponse<void>> {
    return await safeAsync(async () => {
      logger.info('Auto-linking construction entities', { projectId, rfiId, submittalId, dailyLogId });

      // Get all entities for the project
      const [rfisResult, submittalsResult, dailyLogsResult] = await Promise.all([
        rfiService.getRfisByProject(projectId),
        submittalService.getSubmittalsByProject(projectId),
        dailyLogService.getDailyLogsByProject(projectId)
      ]);

      if (!rfisResult.success || !submittalsResult.success || !dailyLogsResult.success) {
        throw new APIError(
          ErrorCodes.INTERNAL_ERROR,
          'Failed to fetch construction entities for auto-linking'
        );
      }

      const rfis = rfisResult.data || [];
      const submittals = submittalsResult.data || [];
      const dailyLogs = dailyLogsResult.data || [];

      // Link related RFIs and Submittals based on content similarity
      if (rfiId) {
        const rfi = rfis.find(r => r.id === rfiId);
        if (rfi) {
          await this.linkRelatedSubmittals(rfi, submittals);
        }
      }

      if (submittalId) {
        const submittal = submittals.find(s => s.id === submittalId);
        if (submittal) {
          await this.linkRelatedRfis(submittal, rfis);
        }
      }

      // Link related Daily Logs based on date and project context
      if (dailyLogId) {
        const dailyLog = dailyLogs.find(d => d.id === dailyLogId);
        if (dailyLog) {
          await this.linkRelatedDailyLogs(dailyLog, rfis, submittals);
        }
      }

      logger.info('Auto-linking completed successfully', { projectId });
    }, 'constructionIntegrationService.autoLinkRelatedEntities');
  }

  /**
   * Link related submittals to an RFI based on content analysis
   */
  private async linkRelatedSubmittals(rfi: Rfi, submittals: Submittal[]): Promise<void> {
    const relatedSubmittals: string[] = [];

    // Simple keyword matching for demo - in production, this would use NLP
    const rfiKeywords = this.extractKeywords(rfi.title + ' ' + rfi.questions.map(q => q.question).join(' '));

    for (const submittal of submittals) {
      const submittalKeywords = this.extractKeywords(
        submittal.title + ' ' + submittal.description + ' ' + 
        (submittal.specificationSection || '') + ' ' + 
        (submittal.drawingReferences || []).join(' ')
      );

      // Calculate similarity score
      const similarity = this.calculateKeywordSimilarity(rfiKeywords, submittalKeywords);
      
      if (similarity > 0.3) { // 30% similarity threshold
        relatedSubmittals.push(submittal.id);
      }
    }

    // Update RFI with related submittals if any found
    if (relatedSubmittals.length > 0 && !rfi.relatedSubmittals) {
      await rfiService.updateRfi(rfi.id, { relatedSubmittals }, 'system');
      logger.info('Linked related submittals to RFI', { 
        rfiId: rfi.id, 
        relatedSubmittalsCount: relatedSubmittals.length 
      });
    }
  }

  /**
   * Link related RFIs to a submittal based on content analysis
   */
  private async linkRelatedRfis(submittal: Submittal, rfis: Rfi[]): Promise<void> {
    const relatedRfis: string[] = [];

    // Simple keyword matching for demo - in production, this would use NLP
    const submittalKeywords = this.extractKeywords(
      submittal.title + ' ' + submittal.description + ' ' + 
      (submittal.specificationSection || '') + ' ' + 
      (submittal.drawingReferences || []).join(' ')
    );

    for (const rfi of rfis) {
      const rfiKeywords = this.extractKeywords(rfi.title + ' ' + rfi.questions.map(q => q.question).join(' '));
      
      // Calculate similarity score
      const similarity = this.calculateKeywordSimilarity(submittalKeywords, rfiKeywords);
      
      if (similarity > 0.3) { // 30% similarity threshold
        relatedRfis.push(rfi.id);
      }
    }

    // Update submittal with related RFIs if any found
    if (relatedRfis.length > 0 && !submittal.relatedRfis) {
      // Note: This would require adding relatedRfis field to Submittal type
      logger.info('Linked related RFIs to submittal', { 
        submittalId: submittal.id, 
        relatedRfisCount: relatedRfis.length 
      });
    }
  }

  /**
   * Link related daily logs based on date and context
   */
  private async linkRelatedDailyLogs(
    dailyLog: DailyLog, 
    rfis: Rfi[], 
    submittals: Submittal[]
  ): Promise<void> {
    const relatedRfis: string[] = [];
    const relatedSubmittals: string[] = [];

    // Link RFIs and Submittals that occurred on the same date or nearby dates
    const logDate = new Date(dailyLog.date);
    const dateRangeStart = new Date(logDate);
    dateRangeStart.setDate(logDate.getDate() - 2);
    const dateRangeEnd = new Date(logDate);
    dateRangeEnd.setDate(logDate.getDate() + 2);

    // Find RFIs within date range
    for (const rfi of rfis) {
      const rfiDate = new Date(rfi.submittedDate);
      if (rfiDate >= dateRangeStart && rfiDate <= dateRangeEnd) {
        relatedRfis.push(rfi.id);
      }
    }

    // Find Submittals within date range
    for (const submittal of submittals) {
      const submittalDate = new Date(submittal.submittedDate);
      if (submittalDate >= dateRangeStart && submittalDate <= dateRangeEnd) {
        relatedSubmittals.push(submittal.id);
      }
    }

    // Add entries to daily log for related items
    if (relatedRfis.length > 0 || relatedSubmittals.length > 0) {
      const newEntries = [];
      
      for (const rfiId of relatedRfis) {
        const rfi = rfis.find(r => r.id === rfiId);
        if (rfi) {
          newEntries.push({
            id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'general' as const,
            title: `Related RFI: ${rfi.title}`,
            description: `RFI #${rfi.rfiNumber} was submitted on this date`,
            date: dailyLog.date,
            relatedItems: [rfiId]
          });
        }
      }

      for (const submittalId of relatedSubmittals) {
        const submittal = submittals.find(s => s.id === submittalId);
        if (submittal) {
          newEntries.push({
            id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'general' as const,
            title: `Related Submittal: ${submittal.title}`,
            description: `Submittal #${submittal.submittalNumber} was submitted on this date`,
            date: dailyLog.date,
            relatedItems: [submittalId]
          });
        }
      }

      if (newEntries.length > 0) {
        // Update daily log with new entries
        await dailyLogService.updateDailyLog(
          dailyLog.id, 
          { 
            entries: [...dailyLog.entries, ...newEntries.map(entry => ({
              ...entry,
              createdBy: 'system',
              createdByName: 'System',
              createdAt: new Date(),
              updatedAt: new Date()
            }))]
          }, 
          'system'
        );
        
        logger.info('Added related item entries to daily log', { 
          dailyLogId: dailyLog.id, 
          entriesAdded: newEntries.length 
        });
      }
    }
  }

  /**
   * Extract keywords from text for similarity matching
   */
  private extractKeywords(text: string): string[] {
    if (!text) return [];
    
    // Simple keyword extraction - in production, this would use NLP libraries
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3) // Filter out short words
      .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicates
  }

  /**
   * Calculate similarity between two keyword sets
   */
  private calculateKeywordSimilarity(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;
    
    const intersection = keywords1.filter(word => keywords2.includes(word));
    const union = [...new Set([...keywords1, ...keywords2])];
    
    return intersection.length / union.length;
  }

  /**
   * Create integrated construction workflow
   */
  async createConstructionWorkflow(
    projectId: string,
    workflowData: Omit<ConstructionWorkflow, 'workflowId' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<APIResponse<ConstructionWorkflow>> {
    return await safeAsync(async () => {
      logger.info('Creating construction workflow', { projectId, workflowName: workflowData.name });

      const workflow: ConstructionWorkflow = {
        ...workflowData,
        workflowId: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate workflow steps
      for (const step of workflow.steps) {
        // Validate dependencies exist
        for (const dependency of step.dependencies) {
          if (!workflow.steps.some(s => s.stepId === dependency)) {
            throw new APIError(
              ErrorCodes.INVALID_INPUT,
              `Invalid dependency: Step ${dependency} not found in workflow`
            );
          }
        }
      }

      // Save workflow to project (in a real implementation, this would be saved to a database)
      logger.info('Construction workflow created successfully', { 
        workflowId: workflow.workflowId, 
        steps: workflow.steps.length 
      });

      return workflow;
    }, 'constructionIntegrationService.createConstructionWorkflow');
  }

  /**
   * Execute construction workflow step
   */
  async executeWorkflowStep(
    workflowId: string,
    stepId: string,
    userId: string,
    completionNotes?: string
  ): Promise<APIResponse<ConstructionWorkflow>> {
    return await safeAsync(async () => {
      logger.info('Executing workflow step', { workflowId, stepId, userId });

      // In a real implementation, this would fetch the workflow from database
      // For demo purposes, we'll simulate the process
      const workflow: ConstructionWorkflow = {
        projectId: 'demo-project',
        workflowId,
        name: 'Demo Workflow',
        description: 'Demo construction workflow',
        steps: [
          {
            stepId: 'step1',
            name: 'Create RFI',
            description: 'Create Request for Information',
            requiredEntities: ['rfi'],
            dependencies: [],
            assignees: [userId],
            completed: false
          },
          {
            stepId: 'step2',
            name: 'Review Submittal',
            description: 'Review construction submittal',
            requiredEntities: ['submittal'],
            dependencies: ['step1'],
            assignees: [userId],
            completed: false
          }
        ],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Find and update the step
      const step = workflow.steps.find(s => s.stepId === stepId);
      if (!step) {
        throw new APIError(
          ErrorCodes.NOT_FOUND,
          `Workflow step ${stepId} not found`
        );
      }

      // Check if dependencies are completed
      const dependenciesCompleted = step.dependencies.every(depId => {
        const depStep = workflow.steps.find(s => s.stepId === depId);
        return depStep && depStep.completed;
      });

      if (!dependenciesCompleted) {
        throw new APIError(
          ErrorCodes.INVALID_OPERATION,
          'Cannot execute step: Dependencies not completed'
        );
      }

      // Execute step
      step.completed = true;
      step.completedAt = new Date();
      step.completionNotes = completionNotes;
      workflow.updatedAt = new Date();

      // Check if workflow is completed
      const allStepsCompleted = workflow.steps.every(s => s.completed);
      if (allStepsCompleted) {
        workflow.status = 'completed';
      }

      logger.info('Workflow step executed successfully', { 
        workflowId, 
        stepId, 
        completed: step.completed 
      });

      return workflow;
    }, 'constructionIntegrationService.executeWorkflowStep');
  }

  /**
   * Generate integrated construction report
   */
  async generateConstructionReport(
    projectId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<APIResponse<any>> {
    return await safeAsync(async () => {
      logger.info('Generating construction report', { projectId, dateRange });

      // Fetch all construction entities for the date range
      const filterOptions: ConstructionFilterOptions = {
        dateRange: {
          start: dateRange.start,
          end: dateRange.end
        }
      };

      const [rfisResult, submittalsResult, dailyLogsResult, projectResult] = await Promise.all([
        rfiService.getRfisByProject(projectId, filterOptions),
        submittalService.getSubmittalsByProject(projectId, filterOptions),
        dailyLogService.getDailyLogsByProject(projectId, filterOptions),
        projectService.getProjectById(projectId)
      ]);

      if (!rfisResult.success || !submittalsResult.success || 
          !dailyLogsResult.success || !projectResult.success) {
        throw new APIError(
          ErrorCodes.INTERNAL_ERROR,
          'Failed to fetch data for construction report'
        );
      }

      const rfis = rfisResult.data || [];
      const submittals = submittalsResult.data || [];
      const dailyLogs = dailyLogsResult.data || [];
      const project = projectResult.data;

      // Generate report data
      const report = {
        projectId,
        projectName: project?.name || 'Unknown Project',
        reportPeriod: {
          start: dateRange.start,
          end: dateRange.end
        },
        summary: {
          totalRfis: rfis.length,
          totalSubmittals: submittals.length,
          totalDailyLogs: dailyLogs.length,
          openRfis: rfis.filter((rfi: Rfi) => rfi.status !== 'closed' && rfi.status !== 'cancelled').length,
          pendingSubmittals: submittals.filter((s: Submittal) => s.status === 'submitted' || s.status === 'under_review').length
        },
        rfis: rfis.map((rfi: Rfi) => ({
          id: rfi.id,
          number: rfi.rfiNumber,
          title: rfi.title,
          status: rfi.status,
          priority: rfi.priority,
          submittedDate: rfi.submittedDate,
          responseDueDate: rfi.responseDueDate,
          daysOpen: rfi.daysOpen
        })),
        submittals: submittals.map((submittal: Submittal) => ({
          id: submittal.id,
          number: submittal.submittalNumber,
          title: submittal.title,
          status: submittal.status,
          type: submittal.type,
          submittedDate: submittal.submittedDate,
          dueDate: submittal.dueDate,
          daysOpen: submittal.daysOpen
        })),
        dailyLogs: dailyLogs.map((dailyLog: DailyLog) => ({
          id: dailyLog.id,
          date: dailyLog.date,
          generalContractor: dailyLog.generalContractor,
          projectManager: dailyLog.projectManager,
          entriesCount: dailyLog.entries.length,
          weatherConditions: dailyLog.weatherConditions
        })),
        createdAt: new Date()
      };

      logger.info('Construction report generated successfully', { 
        projectId, 
        rfis: report.summary.totalRfis,
        submittals: report.summary.totalSubmittals,
        dailyLogs: report.summary.totalDailyLogs
      });

      return report;
    }, 'constructionIntegrationService.generateConstructionReport');
  }

  /**
   * Notify stakeholders of construction updates
   */
  async notifyConstructionUpdates(
    projectId: string,
    updates: {
      type: 'rfi' | 'submittal' | 'dailyLog';
      action: 'created' | 'updated' | 'completed';
      entityId: string;
      message: string;
    }
  ): Promise<APIResponse<void>> {
    return await safeAsync(async () => {
      logger.info('Sending construction update notifications', { projectId, updates });

      // Get project team members
      const projectResult = await projectService.getProjectById(projectId)
      if (!projectResult.success || !projectResult.data) {
        throw new APIError(
          ErrorCodes.NOT_FOUND,
          'Project not found for notifications'
        );
      }

      const project = projectResult.data;
      const teamMembers = project.members || [];

      // Send notifications to team members
      const notificationPromises = teamMembers.map((member: any) => {
        return createNotification({
          recipientId: member.userId,
          title: `Construction Update - ${updates.type.toUpperCase()}`,
          message: updates.message,
          type: NotificationType.INFO,
          priority: updates.type === 'rfi' ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          relatedEntityId: updates.entityId,
          relatedEntityType: updates.type
        });
      });

      await Promise.all(notificationPromises);

      logger.info('Construction update notifications sent successfully', { 
        projectId, 
        recipients: teamMembers.length 
      });
    }, 'constructionIntegrationService.notifyConstructionUpdates');
  }
}

// Export singleton instance
export const constructionIntegrationService = new ConstructionIntegrationService();