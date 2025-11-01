/**
 * Enhanced Reporting Service
 * NataCarePM - Phase 4.5: Enhanced Reporting & Dashboards
 *
 * Advanced reporting and dashboard capabilities with custom report builder,
 * interactive visualizations, and comprehensive analytics
 */

import { KPIService } from './kpiService';
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

// ============================================================================
// Type Definitions
// ============================================================================

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'project' | 'financial' | 'schedule' | 'quality' | 'resource' | 'risk' | 'custom';
  sections: ReportSection[];
  filters: ReportFilter[];
  format: 'pdf' | 'excel' | 'html' | 'json';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'chart' | 'table' | 'summary' | 'kpi' | 'text' | 'image';
  data: any;
  options: any;
  order: number;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: any;
  label: string;
}

export interface ReportConfiguration {
  templateId?: string;
  projectId?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  filters?: ReportFilter[];
  format: 'pdf' | 'excel' | 'html' | 'json';
  includeCharts: boolean;
  includeSummary: boolean;
  includeRecommendations: boolean;
}

export interface GeneratedReport {
  id: string;
  name: string;
  projectId?: string;
  templateId?: string;
  data: any;
  format: 'pdf' | 'excel' | 'html' | 'json';
  generatedAt: Date;
  generatedBy: string;
  size: number; // in bytes
  downloadUrl?: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'kpi' | 'chart' | 'table' | 'summary' | 'alert' | 'custom';
  data: any;
  options: any;
  size: 'small' | 'medium' | 'large' | 'full';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  refreshInterval?: number; // in seconds
}

export interface DashboardConfiguration {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  filters: ReportFilter[];
  layout: 'grid' | 'freeform';
  theme: 'light' | 'dark' | 'auto';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CustomReportBuilder {
  name: string;
  description: string;
  dataSources: string[];
  fields: ReportField[];
  groupings: string[];
  filters: ReportFilter[];
  visualizations: ReportVisualization[];
}

export interface ReportField {
  id: string;
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency';
  source: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface ReportVisualization {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'table' | 'heatmap' | 'gauge' | 'scatter';
  title: string;
  xAxis?: string;
  yAxis?: string;
  series?: string[];
  options: any;
}

// ============================================================================
// Enhanced Reporting Service
// ============================================================================

class EnhancedReportingService {
  private reportTemplates: Map<string, ReportTemplate> = new Map();
  private dashboardConfigs: Map<string, DashboardConfiguration> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
    this.initializeDefaultDashboards();
  }

  /**
   * Initialize default report templates
   */
  private initializeDefaultTemplates(): void {
    // Project Summary Template
    const projectSummaryTemplate: ReportTemplate = {
      id: 'template-project-summary',
      name: 'Project Summary Report',
      description: 'Comprehensive project overview with KPIs, financials, and schedule',
      category: 'project',
      sections: [
        {
          id: 'section-executive-summary',
          title: 'Executive Summary',
          type: 'summary',
          data: {},
          options: {},
          order: 1
        },
        {
          id: 'section-kpi-overview',
          title: 'Key Performance Indicators',
          type: 'kpi',
          data: {},
          options: {},
          order: 2
        },
        {
          id: 'section-financials',
          title: 'Financial Overview',
          type: 'chart',
          data: {},
          options: {
            chartType: 'bar'
          },
          order: 3
        },
        {
          id: 'section-schedule',
          title: 'Schedule Progress',
          type: 'chart',
          data: {},
          options: {
            chartType: 'line'
          },
          order: 4
        }
      ],
      filters: [
        {
          field: 'projectId',
          operator: 'equals',
          value: '',
          label: 'Project'
        },
        {
          field: 'dateRange',
          operator: 'between',
          value: { startDate: '', endDate: '' },
          label: 'Date Range'
        }
      ],
      format: 'pdf',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system'
    };

    this.reportTemplates.set(projectSummaryTemplate.id, projectSummaryTemplate);

    logger.info('Default report templates initialized');
  }

  /**
   * Initialize default dashboard configurations
   */
  private initializeDefaultDashboards(): void {
    // Project Manager Dashboard
    const projectManagerDashboard: DashboardConfiguration = {
      id: 'dashboard-project-manager',
      name: 'Project Manager Dashboard',
      description: 'Default dashboard for project managers with key metrics',
      widgets: [
        {
          id: 'widget-health-score',
          title: 'Project Health Score',
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
          size: 'medium',
          position: { x: 2, y: 0, width: 2, height: 1 }
        },
        {
          id: 'widget-task-completion',
          title: 'Task Completion Rate',
          type: 'chart',
          data: {},
          options: {
            chartType: 'line'
          },
          size: 'medium',
          position: { x: 4, y: 0, width: 2, height: 1 }
        },
        {
          id: 'widget-upcoming-tasks',
          title: 'Upcoming Tasks',
          type: 'table',
          data: {},
          options: {},
          size: 'large',
          position: { x: 0, y: 1, width: 3, height: 2 }
        },
        {
          id: 'widget-alerts',
          title: 'Recent Alerts',
          type: 'alert',
          data: {},
          options: {},
          size: 'large',
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

    this.dashboardConfigs.set(projectManagerDashboard.id, projectManagerDashboard);

    logger.info('Default dashboard configurations initialized');
  }

  /**
   * Generate a comprehensive project report
   */
  async generateProjectReport(
    config: ReportConfiguration,
    projectData: {
      project: Project;
      tasks: Task[];
      rabItems: RabItem[];
      workers: Worker[];
      resources: Resource[];
      expenses: Expense[];
      dailyReports: DailyReport[];
      evmMetrics?: EVMMetrics;
    }
  ): Promise<APIResponse<GeneratedReport>> {
    try {
      logger.info('Generating project report', { 
        projectId: config.projectId, 
        format: config.format 
      });

      // Calculate KPI metrics
      const kpiInput = {
        tasks: projectData.tasks,
        rabItems: projectData.rabItems,
        actualCosts: this.calculateActualCosts(projectData.expenses),
        budgetAtCompletion: this.calculateBudgetAtCompletion(projectData.rabItems),
        evmMetrics: projectData.evmMetrics,
        qualityData: this.extractQualityData(projectData.dailyReports),
        resourceData: this.extractResourceData(projectData.workers, projectData.tasks),
        riskData: this.extractRiskData(projectData.project)
      };

      const kpiMetrics = KPIService.calculateKPIMetrics(kpiInput);
      const kpiRatings = KPIService.calculateKPIRatings(kpiMetrics);
      const kpiRecommendations = KPIService.generateKPIRecommendations(kpiMetrics, kpiRatings);

      // Generate report data based on template
      const reportData = {
        project: projectData.project,
        kpiMetrics,
        kpiRatings,
        kpiRecommendations,
        tasks: projectData.tasks,
        expenses: projectData.expenses,
        dailyReports: projectData.dailyReports,
        workers: projectData.workers,
        resources: projectData.resources,
        generatedAt: new Date()
      };

      // Create generated report
      const report: GeneratedReport = {
        id: `report-${Date.now()}`,
        name: `Project Report - ${projectData.project.name}`,
        projectId: config.projectId,
        templateId: config.templateId,
        data: reportData,
        format: config.format,
        generatedAt: new Date(),
        generatedBy: 'system', // Would be user ID in real implementation
        size: JSON.stringify(reportData).length
      };

      logger.info('Project report generated successfully', { 
        reportId: report.id,
        projectId: config.projectId 
      });

      return {
        success: true,
        data: report
      };
    } catch (error: any) {
      logger.error('Failed to generate project report', error);
      return {
        success: false,
        error: {
          message: 'Failed to generate project report',
          code: 'REPORT_GENERATION_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Generate a custom report using the report builder
   */
  async generateCustomReport(
    builder: CustomReportBuilder,
    data: any[]
  ): Promise<APIResponse<GeneratedReport>> {
    try {
      logger.info('Generating custom report', { 
        reportName: builder.name,
        fieldCount: builder.fields.length 
      });

      // Process data according to builder configuration
      const processedData = this.processCustomReportData(builder, data);

      // Generate visualizations
      const visualizations = this.generateCustomVisualizations(builder, processedData);

      // Create report data
      const reportData = {
        name: builder.name,
        description: builder.description,
        fields: builder.fields,
        data: processedData,
        visualizations,
        generatedAt: new Date()
      };

      // Create generated report
      const report: GeneratedReport = {
        id: `custom-report-${Date.now()}`,
        name: builder.name,
        data: reportData,
        format: 'json', // Default format for custom reports
        generatedAt: new Date(),
        generatedBy: 'system', // Would be user ID in real implementation
        size: JSON.stringify(reportData).length
      };

      logger.info('Custom report generated successfully', { 
        reportId: report.id,
        reportName: builder.name 
      });

      return {
        success: true,
        data: report
      };
    } catch (error: any) {
      logger.error('Failed to generate custom report', error);
      return {
        success: false,
        error: {
          message: 'Failed to generate custom report',
          code: 'CUSTOM_REPORT_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Get dashboard configuration
   */
  async getDashboardConfiguration(id: string): Promise<APIResponse<DashboardConfiguration>> {
    try {
      const dashboard = this.dashboardConfigs.get(id);
      
      if (!dashboard) {
        return {
          success: false,
          error: {
            message: 'Dashboard configuration not found',
            code: 'DASHBOARD_NOT_FOUND'
          }
        };
      }

      return {
        success: true,
        data: dashboard
      };
    } catch (error: any) {
      logger.error('Failed to get dashboard configuration', error);
      return {
        success: false,
        error: {
          message: 'Failed to get dashboard configuration',
          code: 'DASHBOARD_FETCH_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Save dashboard configuration
   */
  async saveDashboardConfiguration(
    dashboard: DashboardConfiguration
  ): Promise<APIResponse<DashboardConfiguration>> {
    try {
      this.dashboardConfigs.set(dashboard.id, dashboard);
      
      logger.info('Dashboard configuration saved', { 
        dashboardId: dashboard.id,
        widgetCount: dashboard.widgets.length 
      });

      return {
        success: true,
        data: dashboard
      };
    } catch (error: any) {
      logger.error('Failed to save dashboard configuration', error);
      return {
        success: false,
        error: {
          message: 'Failed to save dashboard configuration',
          code: 'DASHBOARD_SAVE_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Get report template
   */
  async getReportTemplate(id: string): Promise<APIResponse<ReportTemplate>> {
    try {
      const template = this.reportTemplates.get(id);
      
      if (!template) {
        return {
          success: false,
          error: {
            message: 'Report template not found',
            code: 'TEMPLATE_NOT_FOUND'
          }
        };
      }

      return {
        success: true,
        data: template
      };
    } catch (error: any) {
      logger.error('Failed to get report template', error);
      return {
        success: false,
        error: {
          message: 'Failed to get report template',
          code: 'TEMPLATE_FETCH_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Save report template
   */
  async saveReportTemplate(template: ReportTemplate): Promise<APIResponse<ReportTemplate>> {
    try {
      this.reportTemplates.set(template.id, template);
      
      logger.info('Report template saved', { 
        templateId: template.id,
        sectionCount: template.sections.length 
      });

      return {
        success: true,
        data: template
      };
    } catch (error: any) {
      logger.error('Failed to save report template', error);
      return {
        success: false,
        error: {
          message: 'Failed to save report template',
          code: 'TEMPLATE_SAVE_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * List available report templates
   */
  async listReportTemplates(
    category?: string
  ): Promise<APIResponse<ReportTemplate[]>> {
    try {
      let templates = Array.from(this.reportTemplates.values());
      
      if (category) {
        templates = templates.filter(template => template.category === category);
      }

      return {
        success: true,
        data: templates
      };
    } catch (error: any) {
      logger.error('Failed to list report templates', error);
      return {
        success: false,
        error: {
          message: 'Failed to list report templates',
          code: 'TEMPLATE_LIST_ERROR',
          details: error
        }
      };
    }
  }

  /**
   * Export report to specified format
   */
  async exportReport(
    report: GeneratedReport,
    format: 'pdf' | 'excel' | 'html' | 'json'
  ): Promise<APIResponse<{ url: string; size: number }>> {
    try {
      // In a real implementation, this would generate the actual file
      // For now, we'll simulate the export process
      const exportUrl = `/reports/export/${report.id}.${format}`;
      const size = report.size * (format === 'pdf' ? 1.2 : format === 'excel' ? 0.8 : 1);
      
      logger.info('Report exported', { 
        reportId: report.id,
        format,
        size 
      });

      return {
        success: true,
        data: {
          url: exportUrl,
          size
        }
      };
    } catch (error: any) {
      logger.error('Failed to export report', error);
      return {
        success: false,
        error: {
          message: 'Failed to export report',
          code: 'REPORT_EXPORT_ERROR',
          details: error
        }
      };
    }
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
   * Process custom report data according to builder configuration
   */
  private processCustomReportData(builder: CustomReportBuilder, data: any[]): any[] {
    // Apply filters
    let filteredData = [...data];
    if (builder.filters && builder.filters.length > 0) {
      filteredData = filteredData.filter(item => {
        return builder.filters.every(filter => {
          const value = item[filter.field];
          switch (filter.operator) {
            case 'equals':
              return value === filter.value;
            case 'contains':
              return String(value).includes(filter.value);
            case 'greater_than':
              return value > filter.value;
            case 'less_than':
              return value < filter.value;
            case 'between':
              return value >= filter.value[0] && value <= filter.value[1];
            case 'in':
              return filter.value.includes(value);
            default:
              return true;
          }
        });
      });
    }

    // Apply groupings and aggregations
    if (builder.groupings && builder.groupings.length > 0) {
      // Group data by specified fields
      const groupedData: any = {};
      
      filteredData.forEach(item => {
        const groupKey = builder.groupings.map(field => item[field]).join('|');
        if (!groupedData[groupKey]) {
          groupedData[groupKey] = [];
        }
        groupedData[groupKey].push(item);
      });
      
      // Apply aggregations
      const result: any[] = [];
      Object.entries(groupedData).forEach(([key, groupItems]) => {
        const aggregatedItem: any = {};
        
        // Add grouping fields
        builder.groupings.forEach((field, index) => {
          aggregatedItem[field] = key.split('|')[index];
        });
        
        // Apply field aggregations
        builder.fields.forEach(field => {
          if (field.aggregation) {
            const values = (groupItems as any[]).map(item => item[field.source]);
            switch (field.aggregation) {
              case 'sum':
                aggregatedItem[field.id] = values.reduce((sum, val) => sum + (val || 0), 0);
                break;
              case 'avg':
                aggregatedItem[field.id] = values.reduce((sum, val) => sum + (val || 0), 0) / values.length;
                break;
              case 'count':
                aggregatedItem[field.id] = values.length;
                break;
              case 'min':
                aggregatedItem[field.id] = Math.min(...values);
                break;
              case 'max':
                aggregatedItem[field.id] = Math.max(...values);
                break;
            }
          } else {
            // Take first value for non-aggregated fields
            aggregatedItem[field.id] = (groupItems as any[])[0][field.source];
          }
        });
        
        result.push(aggregatedItem);
      });
      
      return result;
    }
    
    // If no groupings, just map fields
    return filteredData.map(item => {
      const mappedItem: any = {};
      builder.fields.forEach(field => {
        mappedItem[field.id] = item[field.source];
      });
      return mappedItem;
    });
  }

  /**
   * Generate visualizations for custom report
   */
  private generateCustomVisualizations(
    builder: CustomReportBuilder,
    data: any[]
  ): ReportVisualization[] {
    return builder.visualizations.map(viz => {
      // In a real implementation, this would generate actual chart data
      // For now, we'll just return the configuration with sample data
      return {
        ...viz,
        data: data.slice(0, 10) // Limit to first 10 items for sample
      };
    });
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const enhancedReportingService = new EnhancedReportingService();
export { EnhancedReportingService };
// Types are already exported above