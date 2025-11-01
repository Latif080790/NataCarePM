/**
 * Dashboard Service
 * NataCarePM - Phase 4.5: Enhanced Reporting & Dashboards
 *
 * Service for managing dashboard widgets, layouts, and real-time data updates
 */

import { logger } from '@/utils/logger.enhanced';
import { APIResponse } from '@/utils/responseWrapper';
import { 
  Project, 
  Task, 
  RabItem, 
  EVMMetrics, 
  Worker, 
  Expense,
  DailyReport
} from '@/types';
import { Resource } from '@/types/resource.types';
import { KPIService } from './kpiService';
import { 
  DashboardWidget, 
  DashboardConfiguration,
  ReportFilter
} from './enhancedReportingService';

// ============================================================================
// Type Definitions
// ============================================================================

export interface WidgetDataRequest {
  widgetId: string;
  projectId?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  filters?: ReportFilter[];
}

export interface RealTimeWidgetData {
  widgetId: string;
  data: any;
  timestamp: Date;
  lastUpdated: Date;
}

export interface DashboardFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: any;
  label: string;
}

// ============================================================================
// Dashboard Service
// ============================================================================

class DashboardService {
  private dashboards: Map<string, DashboardConfiguration> = new Map();
  private widgetDataCache: Map<string, RealTimeWidgetData> = new Map();
  private refreshIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeDefaultDashboards();
  }

  /**
   * Initialize default dashboards
   */
  private initializeDefaultDashboards(): void {
    // Project Overview Dashboard
    const projectOverviewDashboard: DashboardConfiguration = {
      id: 'dashboard-project-overview',
      name: 'Project Overview',
      description: 'High-level project overview with key metrics',
      widgets: [
        {
          id: 'widget-project-health',
          title: 'Project Health',
          type: 'kpi',
          data: {},
          options: {
            format: 'gauge',
            min: 0,
            max: 100
          },
          size: 'small',
          position: { x: 0, y: 0, width: 2, height: 1 }
        },
        {
          id: 'widget-budget-utilization',
          title: 'Budget Utilization',
          type: 'chart',
          data: {},
          options: {
            chartType: 'bar'
          },
          size: 'small',
          position: { x: 2, y: 0, width: 2, height: 1 }
        },
        {
          id: 'widget-schedule-progress',
          title: 'Schedule Progress',
          type: 'chart',
          data: {},
          options: {
            chartType: 'line'
          },
          size: 'small',
          position: { x: 4, y: 0, width: 2, height: 1 }
        },
        {
          id: 'widget-task-summary',
          title: 'Task Summary',
          type: 'table',
          data: {},
          options: {},
          size: 'medium',
          position: { x: 0, y: 1, width: 3, height: 2 }
        },
        {
          id: 'widget-recent-activities',
          title: 'Recent Activities',
          type: 'table',
          data: {},
          options: {},
          size: 'medium',
          position: { x: 3, y: 1, width: 3, height: 2 }
        }
      ],
      filters: [],
      layout: 'grid',
      theme: 'auto',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system'
    };

    this.dashboards.set(projectOverviewDashboard.id, projectOverviewDashboard);

    logger.info('Default dashboards initialized');
  }

  /**
   * Get dashboard configuration
   */
  async getDashboard(id: string): Promise<APIResponse<DashboardConfiguration>> {
    try {
      const dashboard = this.dashboards.get(id);
      
      if (!dashboard) {
        return {
          success: false,
          error: {
            message: 'Dashboard not found',
            code: 'DASHBOARD_NOT_FOUND'
          }
        };
      }

      return {
        success: true,
        data: dashboard
      };
    } catch (error: any) {
      logger.error('Failed to get dashboard', error);
      return {
        success: false,
        error: {
          message: 'Failed to get dashboard',
          code: 'DASHBOARD_FETCH_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Save dashboard configuration
   */
  async saveDashboard(dashboard: DashboardConfiguration): Promise<APIResponse<DashboardConfiguration>> {
    try {
      this.dashboards.set(dashboard.id, dashboard);
      
      logger.info('Dashboard saved', { 
        dashboardId: dashboard.id,
        widgetCount: dashboard.widgets.length 
      });

      return {
        success: true,
        data: dashboard
      };
    } catch (error: any) {
      logger.error('Failed to save dashboard', error);
      return {
        success: false,
        error: {
          message: 'Failed to save dashboard',
          code: 'DASHBOARD_SAVE_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Get widget data
   */
  async getWidgetData(request: WidgetDataRequest, projectData: {
    project: Project;
    tasks: Task[];
    rabItems: RabItem[];
    workers: Worker[];
    resources: Resource[];
    expenses: Expense[];
    dailyReports: DailyReport[];
    evmMetrics?: EVMMetrics;
  }): Promise<APIResponse<any>> {
    try {
      const { widgetId, projectId, dateRange, filters } = request;
      
      logger.debug('Fetching widget data', { widgetId, projectId });

      // Apply filters to project data
      let filteredTasks = [...projectData.tasks];
      let filteredExpenses = [...projectData.expenses];
      let filteredDailyReports = [...projectData.dailyReports];

      if (filters && filters.length > 0) {
        // Apply task filters
        filteredTasks = filteredTasks.filter(task => {
          return filters.every(filter => {
            const value = (task as any)[filter.field];
            return this.applyFilter(value, filter.operator, filter.value);
          });
        });

        // Apply expense filters
        filteredExpenses = filteredExpenses.filter(expense => {
          return filters.every(filter => {
            const value = (expense as any)[filter.field];
            return this.applyFilter(value, filter.operator, filter.value);
          });
        });

        // Apply daily report filters
        filteredDailyReports = filteredDailyReports.filter(report => {
          return filters.every(filter => {
            const value = (report as any)[filter.field];
            return this.applyFilter(value, filter.operator, filter.value);
          });
        });
      }

      // Generate widget-specific data
      let widgetData: any = {};
      
      switch (widgetId) {
        case 'widget-project-health':
          widgetData = this.generateProjectHealthData(projectData, filteredTasks, filteredExpenses, filteredDailyReports);
          break;
        case 'widget-budget-utilization':
          widgetData = this.generateBudgetUtilizationData(projectData, filteredExpenses);
          break;
        case 'widget-schedule-progress':
          widgetData = this.generateScheduleProgressData(projectData, filteredTasks);
          break;
        case 'widget-task-summary':
          widgetData = this.generateTaskSummaryData(filteredTasks);
          break;
        case 'widget-recent-activities':
          widgetData = this.generateRecentActivitiesData(filteredDailyReports);
          break;
        default:
          widgetData = { message: 'Widget data not implemented' };
      }

      // Cache the data
      const cacheData: RealTimeWidgetData = {
        widgetId,
        data: widgetData,
        timestamp: new Date(),
        lastUpdated: new Date()
      };
      
      this.widgetDataCache.set(widgetId, cacheData);

      return {
        success: true,
        data: widgetData
      };
    } catch (error: any) {
      logger.error('Failed to get widget data', error);
      return {
        success: false,
        error: {
          message: 'Failed to get widget data',
          code: 'WIDGET_DATA_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Apply filter to value
   */
  private applyFilter(value: any, operator: string, filterValue: any): boolean {
    switch (operator) {
      case 'equals':
        return value === filterValue;
      case 'contains':
        return String(value).includes(filterValue);
      case 'greater_than':
        return value > filterValue;
      case 'less_than':
        return value < filterValue;
      case 'between':
        return value >= filterValue[0] && value <= filterValue[1];
      case 'in':
        return filterValue.includes(value);
      default:
        return true;
    }
  }

  /**
   * Generate project health data
   */
  private generateProjectHealthData(
    projectData: any,
    tasks: Task[],
    expenses: Expense[],
    dailyReports: DailyReport[]
  ): any {
    // Calculate KPI metrics for project health
    const kpiInput = {
      tasks,
      rabItems: projectData.rabItems,
      actualCosts: this.calculateActualCosts(expenses),
      budgetAtCompletion: this.calculateBudgetAtCompletion(projectData.rabItems),
      evmMetrics: projectData.evmMetrics,
      qualityData: this.extractQualityData(dailyReports),
      resourceData: this.extractResourceData(projectData.workers, tasks),
      riskData: this.extractRiskData(projectData.project)
    };

    const kpiMetrics = KPIService.calculateKPIMetrics(kpiInput);
    
    return {
      healthScore: kpiMetrics.overallHealthScore,
      performanceTrend: kpiMetrics.performanceTrend,
      kpiMetrics
    };
  }

  /**
   * Generate budget utilization data
   */
  private generateBudgetUtilizationData(
    projectData: any,
    expenses: Expense[]
  ): any {
    const budgetAtCompletion = this.calculateBudgetAtCompletion(projectData.rabItems);
    const actualCosts = this.calculateActualCosts(expenses);
    const totalActualCost = Object.values(actualCosts).reduce((sum, cost) => sum + cost, 0);
    const budgetUtilization = budgetAtCompletion > 0 ? (totalActualCost / budgetAtCompletion) * 100 : 0;

    return {
      budgetAtCompletion,
      totalActualCost,
      budgetUtilization: Math.round(budgetUtilization * 100) / 100,
      remainingBudget: budgetAtCompletion - totalActualCost
    };
  }

  /**
   * Generate schedule progress data
   */
  private generateScheduleProgressData(
    projectData: any,
    tasks: Task[]
  ): any {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (task) => task.status === 'done' || task.status === 'completed'
    ).length;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate schedule variance if EVM metrics are available
    let scheduleVariancePercentage = 0;
    if (projectData.evmMetrics) {
      scheduleVariancePercentage = (projectData.evmMetrics.scheduleVariance / projectData.evmMetrics.plannedValue) * 100;
    }

    return {
      totalTasks,
      completedTasks,
      taskCompletionRate: Math.round(taskCompletionRate * 100) / 100,
      scheduleVariancePercentage: Math.round(scheduleVariancePercentage * 100) / 100
    };
  }

  /**
   * Generate task summary data
   */
  private generateTaskSummaryData(tasks: Task[]): any {
    // Group tasks by status
    const statusGroups: { [key: string]: Task[] } = {};
    tasks.forEach(task => {
      const status = task.status || 'unknown';
      if (!statusGroups[status]) {
        statusGroups[status] = [];
      }
      statusGroups[status].push(task);
    });

    // Create summary data
    const summary = Object.entries(statusGroups).map(([status, taskList]) => ({
      status,
      count: taskList.length,
      percentage: Math.round((taskList.length / tasks.length) * 100)
    }));

    return {
      summary,
      totalTasks: tasks.length
    };
  }

  /**
   * Generate recent activities data
   */
  private generateRecentActivitiesData(dailyReports: DailyReport[]): any {
    // Sort daily reports by date (newest first)
    const sortedReports = [...dailyReports].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Take the 10 most recent reports
    const recentReports = sortedReports.slice(0, 10);

    // Extract activity data
    const activities = recentReports.map(report => ({
      date: report.date,
      notes: report.notes,
      workforceCount: report.workforce?.length || 0,
      materialsConsumed: report.materialsConsumed?.length || 0
    }));

    return {
      activities,
      totalReports: dailyReports.length
    };
  }

  /**
   * Calculate actual costs from expenses
   */
  private calculateActualCosts(expenses: Expense[]): { [taskId: string]: number } {
    const actualCosts: { [taskId: string]: number } = {};
    
    expenses.forEach(expense => {
      if (expense.rabItemId) {
        actualCosts[expense.rabItemId] = (actualCosts[expense.rabItemId] || 0) + expense.amount;
      }
    });
    
    return actualCosts;
  }

  /**
   * Calculate budget at completion from RAB items
   */
  private calculateBudgetAtCompletion(rabItems: RabItem[]): number {
    return rabItems.reduce((sum, item) => sum + (item.volume * item.hargaSatuan), 0);
  }

  /**
   * Extract quality data from daily reports
   */
  private extractQualityData(dailyReports: DailyReport[]): any {
    // Simplified extraction - in a real implementation, this would analyze quality metrics
    const defects = dailyReports.reduce((sum, report) => {
      return sum + (report.materialsConsumed?.length || 0);
    }, 0);
    
    return {
      defects,
      totalDeliverables: dailyReports.length,
      reworkHours: 0, // Would need to extract from reports
      totalHours: 0 // Would need to extract from reports
    };
  }

  /**
   * Extract resource data from workers and tasks
   */
  private extractResourceData(workers: Worker[], tasks: Task[]): any {
    // Simplified extraction - in a real implementation, this would analyze resource metrics
    const allocatedHours = tasks.reduce((sum, task) => {
      // Estimate 8 hours per day for task duration
      const duration = task.endDate && task.startDate ? 
        (new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24) : 0;
      return sum + (duration * 8);
    }, 0);
    
    return {
      allocatedHours,
      actualHours: allocatedHours * 0.9, // Simulate 90% actual vs planned
      teamSize: workers.length,
      productivity: 95 // Simulate 95% productivity
    };
  }

  /**
   * Extract risk data from project
   */
  private extractRiskData(project: Project): any {
    // Simplified extraction - in a real implementation, this would analyze risk metrics
    // For now, we'll simulate risk data
    return {
      totalRisks: 5,
      highRisks: 2,
      mitigatedRisks: 3,
      contingencyUsed: 10000, // Simulate contingency used
      contingencyTotal: 50000 // Simulate total contingency
    };
  }

  /**
   * Start real-time data updates for dashboard
   */
  startRealTimeUpdates(dashboardId: string): void {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      logger.warn('Dashboard not found for real-time updates', { dashboardId });
      return;
    }

    // Clear any existing intervals
    this.clearRealTimeUpdates(dashboardId);

    // Set up intervals for widgets that require real-time updates
    dashboard.widgets.forEach(widget => {
      if (widget.refreshInterval && widget.refreshInterval > 0) {
        const intervalId = setInterval(() => {
          // In a real implementation, this would fetch updated data
          logger.debug('Refreshing widget data', { widgetId: widget.id });
        }, widget.refreshInterval * 1000);

        this.refreshIntervals.set(`${dashboardId}-${widget.id}`, intervalId);
      }
    });

    logger.info('Real-time updates started for dashboard', { dashboardId });
  }

  /**
   * Clear real-time data updates for dashboard
   */
  clearRealTimeUpdates(dashboardId: string): void {
    // Clear all intervals for this dashboard
    this.refreshIntervals.forEach((intervalId, key) => {
      if (key.startsWith(`${dashboardId}-`)) {
        clearInterval(intervalId);
        this.refreshIntervals.delete(key);
      }
    });

    logger.info('Real-time updates cleared for dashboard', { dashboardId });
  }

  /**
   * Get cached widget data
   */
  getCachedWidgetData(widgetId: string): RealTimeWidgetData | undefined {
    return this.widgetDataCache.get(widgetId);
  }

  /**
   * List all available dashboards
   */
  async listDashboards(): Promise<APIResponse<DashboardConfiguration[]>> {
    try {
      const dashboards = Array.from(this.dashboards.values());
      
      return {
        success: true,
        data: dashboards
      };
    } catch (error: any) {
      logger.error('Failed to list dashboards', error);
      return {
        success: false,
        error: {
          message: 'Failed to list dashboards',
          code: 'DASHBOARD_LIST_ERROR',
          details: error
        }
      };
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const dashboardService = new DashboardService();
export { DashboardService };
// Types are already exported above