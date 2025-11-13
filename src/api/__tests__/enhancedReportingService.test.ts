/**
 * Enhanced Reporting Service Tests
 * Week 6 Day 1 - Testing enhancedReportingService
 * 
 * Service: enhancedReportingService (842 lines, class-based)
 * Pattern: In-memory storage with Maps, integrates with KPIService
 * Methods: 11 public + 6 private helpers
 * 
 * Test Coverage:
 * - Report generation workflows (project reports)
 * - Custom report builder (filters, groupings, aggregations)
 * - Dashboard management (CRUD operations)
 * - Template management (CRUD operations)
 * - Data extraction methods (costs, budget, quality, resource, risk)
 * - Report export (PDF, Excel, HTML, JSON)
 * - KPIService integration (mocked)
 * - Edge cases and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  enhancedReportingService,
  ReportConfiguration,
  CustomReportBuilder,
  DashboardConfiguration,
  ReportTemplate
} from '../enhancedReportingService';
import { KPIService } from '../kpiService';

// Mock KPIService (already tested in Week 5 Day 7)
vi.mock('../kpiService', () => ({
  KPIService: {
    calculateKPIMetrics: vi.fn().mockReturnValue({
      budgetUtilization: 102.5,
      costVariancePercentage: -10,
      returnOnInvestment: 15,
      scheduleVariancePercentage: -5,
      taskCompletionRate: 50,
      milestoneAdherence: 100,
      defectRate: 2,
      reworkPercentage: 5,
      qualityScore: 85,
      resourceUtilization: 90,
      productivityIndex: 95,
      teamEfficiency: 88,
      riskExposure: 40,
      issueResolutionTime: 5,
      contingencyUtilization: 20,
      overallHealthScore: 75,
      performanceTrend: 'Stable'
    }),
    calculateKPIRatings: vi.fn().mockReturnValue({
      budgetUtilization: 'Fair',
      costVariancePercentage: 'Poor',
      returnOnInvestment: 'Good',
      overallHealthScore: 'Fair'
    }),
    generateKPIRecommendations: vi.fn().mockReturnValue([
      'Implement cost controls',
      'Review schedule'
    ])
  }
}));

describe('Enhanced Reporting Service', () => {
  beforeEach(() => {
    // Reset KPIService mocks before each test
    vi.clearAllMocks();
  });

  describe('Report Templates', () => {
    it('should initialize with default templates', async () => {
      const templates = await enhancedReportingService.listReportTemplates();
      expect(templates.success).toBe(true);
      expect(templates.data).toHaveLength(1);
      expect(templates.data?.[0].name).toBe('Project Summary Report');
    });

    it('should filter templates by category', async () => {
      const templates = await enhancedReportingService.listReportTemplates('project');
      expect(templates.success).toBe(true);
      expect(templates.data?.[0].category).toBe('project');
    });

    it('should get template by ID', async () => {
      const template = await enhancedReportingService.getReportTemplate('template-project-summary');
      expect(template.success).toBe(true);
      expect(template.data?.id).toBe('template-project-summary');
    });

    it('should handle non-existent template', async () => {
      const template = await enhancedReportingService.getReportTemplate('non-existent');
      expect(template.success).toBe(false);
      expect(template.error?.code).toBe('TEMPLATE_NOT_FOUND');
    });

    it('should save new report template', async () => {
      const newTemplate: ReportTemplate = {
        id: 'template-custom-financial',
        name: 'Financial Report',
        description: 'Detailed financial analysis',
        category: 'financial',
        sections: [
          {
            id: 'section-budget',
            title: 'Budget Analysis',
            type: 'chart',
            data: {},
            options: { chartType: 'bar' },
            order: 1
          }
        ],
        filters: [],
        format: 'excel',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-123'
      };

      const saveResult = await enhancedReportingService.saveReportTemplate(newTemplate);
      expect(saveResult.success).toBe(true);
      expect(saveResult.data?.id).toBe('template-custom-financial');

      // Verify it was saved
      const getResult = await enhancedReportingService.getReportTemplate('template-custom-financial');
      expect(getResult.success).toBe(true);
      expect(getResult.data?.name).toBe('Financial Report');
    });

    it('should update existing template', async () => {
      // Get existing template
      const existing = await enhancedReportingService.getReportTemplate('template-project-summary');
      expect(existing.success).toBe(true);

      // Update it
      const updated = { ...existing.data!, description: 'Updated description' };
      const saveResult = await enhancedReportingService.saveReportTemplate(updated);
      expect(saveResult.success).toBe(true);

      // Verify update
      const getResult = await enhancedReportingService.getReportTemplate('template-project-summary');
      expect(getResult.data?.description).toBe('Updated description');
    });

    it('should return all templates when no category filter', async () => {
      // Add another template
      const template: ReportTemplate = {
        id: 'template-quality',
        name: 'Quality Report',
        description: 'Quality metrics',
        category: 'quality',
        sections: [],
        filters: [],
        format: 'pdf',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1'
      };
      await enhancedReportingService.saveReportTemplate(template);

      const result = await enhancedReportingService.listReportTemplates();
      expect(result.success).toBe(true);
      expect(result.data!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Dashboard Configurations', () => {
    it('should initialize with default dashboards', async () => {
      const dashboard = await enhancedReportingService.getDashboardConfiguration('dashboard-project-manager');
      expect(dashboard.success).toBe(true);
      expect(dashboard.data?.name).toBe('Project Manager Dashboard');
    });

    it('should handle non-existent dashboard', async () => {
      const dashboard = await enhancedReportingService.getDashboardConfiguration('non-existent');
      expect(dashboard.success).toBe(false);
      expect(dashboard.error?.code).toBe('DASHBOARD_NOT_FOUND');
    });

    it('should save new dashboard configuration', async () => {
      const newDashboard: DashboardConfiguration = {
        id: 'dashboard-executive',
        name: 'Executive Dashboard',
        description: 'High-level metrics for executives',
        widgets: [
          {
            id: 'widget-kpi-summary',
            title: 'KPI Summary',
            type: 'kpi',
            data: {},
            options: {},
            size: 'large',
            position: { x: 0, y: 0, width: 4, height: 2 }
          }
        ],
        filters: [],
        layout: 'grid',
        theme: 'dark',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin-1'
      };

      const saveResult = await enhancedReportingService.saveDashboardConfiguration(newDashboard);
      expect(saveResult.success).toBe(true);
      expect(saveResult.data?.name).toBe('Executive Dashboard');

      // Verify it was saved
      const getResult = await enhancedReportingService.getDashboardConfiguration('dashboard-executive');
      expect(getResult.success).toBe(true);
      expect(getResult.data?.theme).toBe('dark');
    });

    it('should update existing dashboard', async () => {
      const existing = await enhancedReportingService.getDashboardConfiguration('dashboard-project-manager');
      expect(existing.success).toBe(true);

      // Update theme
      const updated = { ...existing.data!, theme: 'light' as const };
      await enhancedReportingService.saveDashboardConfiguration(updated);

      // Verify update
      const result = await enhancedReportingService.getDashboardConfiguration('dashboard-project-manager');
      expect(result.data?.theme).toBe('light');
    });

    it('should handle dashboard with multiple widgets', async () => {
      const dashboard = await enhancedReportingService.getDashboardConfiguration('dashboard-project-manager');
      expect(dashboard.success).toBe(true);
      expect(dashboard.data?.widgets.length).toBeGreaterThan(0);
      expect(dashboard.data?.widgets[0]).toHaveProperty('id');
      expect(dashboard.data?.widgets[0]).toHaveProperty('title');
      expect(dashboard.data?.widgets[0]).toHaveProperty('type');
    });
  });

  describe('Report Generation', () => {
    it('should generate project report', async () => {
      // Mock project data
      const projectData = {
        project: {
          id: 'test-project',
          name: 'Test Project',
          location: 'Test Location',
          startDate: '2023-01-01',
          items: [],
          members: [],
          dailyReports: [],
          attendances: [],
          expenses: [],
          documents: [],
          purchaseOrders: [],
          inventory: [],
          termins: [],
          auditLog: []
        },
        tasks: [],
        rabItems: [],
        workers: [],
        resources: [],
        expenses: [],
        dailyReports: [],
        evmMetrics: undefined
      };

      const config: ReportConfiguration = {
        projectId: 'test-project',
        format: 'json',
        includeCharts: true,
        includeSummary: true,
        includeRecommendations: true
      };

      const report = await enhancedReportingService.generateProjectReport(config, projectData);
      expect(report.success).toBe(true);
      expect(report.data?.name).toContain('Project Report');
      expect(report.data?.projectId).toBe('test-project');
    });

    it('should call KPIService methods during report generation', async () => {
      const projectData = {
        project: { id: 'proj-1', name: 'Project 1' } as any,
        tasks: [{ id: 'task-1', title: 'Task 1', status: 'completed' }] as any,
        rabItems: [{ id: 1, volume: 100, hargaSatuan: 50000 }] as any,
        workers: [],
        resources: [],
        expenses: [],
        dailyReports: [],
        evmMetrics: {
          plannedValue: 10000,
          earnedValue: 9000,
          actualCost: 11000
        } as any
      };

      const config: ReportConfiguration = {
        projectId: 'proj-1',
        format: 'pdf',
        includeCharts: true,
        includeSummary: true,
        includeRecommendations: true
      };

      await enhancedReportingService.generateProjectReport(config, projectData);

      // Verify KPIService was called
      expect(KPIService.calculateKPIMetrics).toHaveBeenCalled();
      expect(KPIService.calculateKPIRatings).toHaveBeenCalled();
      expect(KPIService.generateKPIRecommendations).toHaveBeenCalled();
    });

    it('should include KPI data in generated report', async () => {
      const projectData = {
        project: { id: 'proj-2', name: 'Project 2' } as any,
        tasks: [],
        rabItems: [],
        workers: [],
        resources: [],
        expenses: [],
        dailyReports: []
      };

      const config: ReportConfiguration = {
        projectId: 'proj-2',
        format: 'html',
        includeCharts: false,
        includeSummary: true,
        includeRecommendations: false
      };

      const report = await enhancedReportingService.generateProjectReport(config, projectData);

      expect(report.success).toBe(true);
      expect(report.data?.data).toHaveProperty('kpiMetrics');
      expect(report.data?.data).toHaveProperty('kpiRatings');
      expect(report.data?.data).toHaveProperty('kpiRecommendations');
    });

    it('should calculate actual costs from expenses', async () => {
      const projectData = {
        project: { id: 'proj-3', name: 'Project 3' } as any,
        tasks: [],
        rabItems: [],
        workers: [],
        resources: [],
        expenses: [
          { id: 'exp-1', amount: 5000, rabItemId: '1' },
          { id: 'exp-2', amount: 3000, rabItemId: '1' },
          { id: 'exp-3', amount: 7000, rabItemId: '2' }
        ] as any,
        dailyReports: []
      };

      const config: ReportConfiguration = {
        projectId: 'proj-3',
        format: 'json',
        includeCharts: false,
        includeSummary: true,
        includeRecommendations: false
      };

      await enhancedReportingService.generateProjectReport(config, projectData);

      // Verify calculateKPIMetrics was called with correct actualCosts
      expect(KPIService.calculateKPIMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          actualCosts: {
            '1': 8000, // 5000 + 3000
            '2': 7000
          }
        })
      );
    });

    it('should calculate budget at completion from RAB items', async () => {
      const projectData = {
        project: { id: 'proj-4', name: 'Project 4' } as any,
        tasks: [],
        rabItems: [
          { id: 1, volume: 10, hargaSatuan: 1000 },
          { id: 2, volume: 5, hargaSatuan: 2000 }
        ] as any,
        workers: [],
        resources: [],
        expenses: [],
        dailyReports: []
      };

      const config: ReportConfiguration = {
        projectId: 'proj-4',
        format: 'excel',
        includeCharts: true,
        includeSummary: true,
        includeRecommendations: true
      };

      await enhancedReportingService.generateProjectReport(config, projectData);

      // Budget = (10 * 1000) + (5 * 2000) = 20000
      expect(KPIService.calculateKPIMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          budgetAtCompletion: 20000
        })
      );
    });

    it('should handle project without EVM metrics', async () => {
      const projectData = {
        project: { id: 'proj-5', name: 'Project 5' } as any,
        tasks: [],
        rabItems: [],
        workers: [],
        resources: [],
        expenses: [],
        dailyReports: []
        // No evmMetrics
      };

      const config: ReportConfiguration = {
        projectId: 'proj-5',
        format: 'pdf',
        includeCharts: true,
        includeSummary: true,
        includeRecommendations: true
      };

      const report = await enhancedReportingService.generateProjectReport(config, projectData);

      expect(report.success).toBe(true);
      expect(KPIService.calculateKPIMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          evmMetrics: undefined
        })
      );
    });

    it('should include report metadata', async () => {
      const projectData = {
        project: { id: 'proj-6', name: 'My Project' } as any,
        tasks: [],
        rabItems: [],
        workers: [],
        resources: [],
        expenses: [],
        dailyReports: []
      };

      const config: ReportConfiguration = {
        projectId: 'proj-6',
        format: 'pdf',
        includeCharts: true,
        includeSummary: true,
        includeRecommendations: true
      };

      const report = await enhancedReportingService.generateProjectReport(config, projectData);

      expect(report.data).toMatchObject({
        id: expect.stringContaining('report-'),
        name: expect.stringContaining('My Project'),
        projectId: 'proj-6',
        format: 'pdf',
        generatedAt: expect.any(Date),
        generatedBy: 'system',
        size: expect.any(Number)
      });
    });
  });

  describe('Custom Report Builder', () => {
    it('should generate custom report', async () => {
      const builder: CustomReportBuilder = {
        name: 'Test Custom Report',
        description: 'Test custom report description',
        dataSources: ['tasks'],
        fields: [
          {
            id: 'taskName',
            name: 'Task Name',
            label: 'Task Name',
            type: 'string',
            source: 'name'
          }
        ],
        groupings: [],
        filters: [],
        visualizations: []
      };

      const testData = [
        { name: 'Task 1', status: 'completed' },
        { name: 'Task 2', status: 'in_progress' }
      ];

      const report = await enhancedReportingService.generateCustomReport(builder, testData);
      expect(report.success).toBe(true);
      expect(report.data?.name).toBe('Test Custom Report');
      expect(report.data?.data.fields).toHaveLength(1);
    });

    it('should apply equals filter correctly', async () => {
      const builder: CustomReportBuilder = {
        name: 'Completed Tasks',
        description: 'Filter completed tasks',
        dataSources: ['tasks'],
        fields: [
          {
            id: 'name',
            name: 'name',
            label: 'Name',
            type: 'string',
            source: 'name'
          }
        ],
        groupings: [],
        filters: [
          {
            field: 'status',
            operator: 'equals',
            value: 'completed',
            label: 'Status'
          }
        ],
        visualizations: []
      };

      const testData = [
        { name: 'Task 1', status: 'completed' },
        { name: 'Task 2', status: 'in_progress' },
        { name: 'Task 3', status: 'completed' }
      ];

      const report = await enhancedReportingService.generateCustomReport(builder, testData);
      expect(report.success).toBe(true);
      expect(report.data?.data.data.length).toBe(2); // Only 2 completed tasks
    });

    it('should apply contains filter', async () => {
      const builder: CustomReportBuilder = {
        name: 'Foundation Tasks',
        description: 'Tasks containing Foundation',
        dataSources: ['tasks'],
        fields: [
          {
            id: 'name',
            name: 'name',
            label: 'Name',
            type: 'string',
            source: 'name'
          }
        ],
        groupings: [],
        filters: [
          {
            field: 'name',
            operator: 'contains',
            value: 'Foundation',
            label: 'Name'
          }
        ],
        visualizations: []
      };

      const testData = [
        { name: 'Foundation Work', status: 'completed' },
        { name: 'Steel Structure', status: 'in_progress' },
        { name: 'Foundation Inspection', status: 'todo' }
      ];

      const report = await enhancedReportingService.generateCustomReport(builder, testData);
      expect(report.success).toBe(true);
      expect(report.data?.data.data.length).toBe(2); // 2 tasks with "Foundation"
    });

    it('should apply greater_than filter', async () => {
      const builder: CustomReportBuilder = {
        name: 'High Budget Tasks',
        description: 'Tasks with budget > 5000',
        dataSources: ['tasks'],
        fields: [
          {
            id: 'budget',
            name: 'budget',
            label: 'Budget',
            type: 'number',
            source: 'budget'
          }
        ],
        groupings: [],
        filters: [
          {
            field: 'budget',
            operator: 'greater_than',
            value: 5000,
            label: 'Budget'
          }
        ],
        visualizations: []
      };

      const testData = [
        { name: 'Task 1', budget: 10000 },
        { name: 'Task 2', budget: 3000 },
        { name: 'Task 3', budget: 7000 }
      ];

      const report = await enhancedReportingService.generateCustomReport(builder, testData);
      expect(report.success).toBe(true);
      expect(report.data?.data.data.length).toBe(2); // 2 tasks > 5000
    });

    it('should apply less_than filter', async () => {
      const builder: CustomReportBuilder = {
        name: 'Low Duration Tasks',
        description: 'Tasks with duration < 10',
        dataSources: ['tasks'],
        fields: [
          {
            id: 'duration',
            name: 'duration',
            label: 'Duration',
            type: 'number',
            source: 'duration'
          }
        ],
        groupings: [],
        filters: [
          {
            field: 'duration',
            operator: 'less_than',
            value: 10,
            label: 'Duration'
          }
        ],
        visualizations: []
      };

      const testData = [
        { name: 'Task 1', duration: 5 },
        { name: 'Task 2', duration: 15 },
        { name: 'Task 3', duration: 8 }
      ];

      const report = await enhancedReportingService.generateCustomReport(builder, testData);
      expect(report.success).toBe(true);
      expect(report.data?.data.data.length).toBe(2); // 2 tasks < 10
    });

    it('should apply between filter', async () => {
      const builder: CustomReportBuilder = {
        name: 'Medium Budget Tasks',
        description: 'Tasks with budget between 5000-10000',
        dataSources: ['tasks'],
        fields: [
          {
            id: 'budget',
            name: 'budget',
            label: 'Budget',
            type: 'number',
            source: 'budget'
          }
        ],
        groupings: [],
        filters: [
          {
            field: 'budget',
            operator: 'between',
            value: [5000, 10000],
            label: 'Budget'
          }
        ],
        visualizations: []
      };

      const testData = [
        { name: 'Task 1', budget: 7000 },
        { name: 'Task 2', budget: 3000 },
        { name: 'Task 3', budget: 12000 },
        { name: 'Task 4', budget: 9000 }
      ];

      const report = await enhancedReportingService.generateCustomReport(builder, testData);
      expect(report.success).toBe(true);
      expect(report.data?.data.data.length).toBe(2); // 2 tasks between 5000-10000
    });

    it('should apply in filter', async () => {
      const builder: CustomReportBuilder = {
        name: 'Active Tasks',
        description: 'Tasks in specific statuses',
        dataSources: ['tasks'],
        fields: [
          {
            id: 'status',
            name: 'status',
            label: 'Status',
            type: 'string',
            source: 'status'
          }
        ],
        groupings: [],
        filters: [
          {
            field: 'status',
            operator: 'in',
            value: ['in_progress', 'review'],
            label: 'Status'
          }
        ],
        visualizations: []
      };

      const testData = [
        { name: 'Task 1', status: 'completed' },
        { name: 'Task 2', status: 'in_progress' },
        { name: 'Task 3', status: 'review' },
        { name: 'Task 4', status: 'todo' }
      ];

      const report = await enhancedReportingService.generateCustomReport(builder, testData);
      expect(report.success).toBe(true);
      expect(report.data?.data.data.length).toBe(2); // in_progress + review
    });

    it('should apply grouping with count aggregation', async () => {
      const builder: CustomReportBuilder = {
        name: 'Tasks by Status',
        description: 'Count tasks by status',
        dataSources: ['tasks'],
        fields: [
          {
            id: 'status',
            name: 'status',
            label: 'Status',
            type: 'string',
            source: 'status'
          },
          {
            id: 'count',
            name: 'count',
            label: 'Count',
            type: 'number',
            source: 'id',
            aggregation: 'count'
          }
        ],
        groupings: ['status'],
        filters: [],
        visualizations: []
      };

      const testData = [
        { id: '1', status: 'completed' },
        { id: '2', status: 'in_progress' },
        { id: '3', status: 'completed' }
      ];

      const report = await enhancedReportingService.generateCustomReport(builder, testData);
      expect(report.success).toBe(true);
      expect(report.data?.data.data.length).toBe(2); // 2 groups: completed, in_progress

      const completedGroup = report.data?.data.data.find((item: any) => item.status === 'completed');
      expect(completedGroup?.count).toBe(2);
    });

    it('should apply sum aggregation', async () => {
      const builder: CustomReportBuilder = {
        name: 'Expenses by Category',
        description: 'Sum expenses by category',
        dataSources: ['expenses'],
        fields: [
          {
            id: 'category',
            name: 'category',
            label: 'Category',
            type: 'string',
            source: 'category'
          },
          {
            id: 'total',
            name: 'total',
            label: 'Total',
            type: 'number',
            source: 'amount',
            aggregation: 'sum'
          }
        ],
        groupings: ['category'],
        filters: [],
        visualizations: []
      };

      const testData = [
        { category: 'material', amount: 1000 },
        { category: 'labor', amount: 2000 },
        { category: 'material', amount: 1500 }
      ];

      const report = await enhancedReportingService.generateCustomReport(builder, testData);
      expect(report.success).toBe(true);

      const materialGroup = report.data?.data.data.find((item: any) => item.category === 'material');
      expect(materialGroup?.total).toBe(2500); // 1000 + 1500
    });

    it('should apply avg aggregation', async () => {
      const builder: CustomReportBuilder = {
        name: 'Average Duration',
        description: 'Average duration by status',
        dataSources: ['tasks'],
        fields: [
          {
            id: 'status',
            name: 'status',
            label: 'Status',
            type: 'string',
            source: 'status'
          },
          {
            id: 'avgDuration',
            name: 'avgDuration',
            label: 'Avg Duration',
            type: 'number',
            source: 'duration',
            aggregation: 'avg'
          }
        ],
        groupings: ['status'],
        filters: [],
        visualizations: []
      };

      const testData = [
        { status: 'completed', duration: 10 },
        { status: 'completed', duration: 20 },
        { status: 'in_progress', duration: 15 }
      ];

      const report = await enhancedReportingService.generateCustomReport(builder, testData);
      expect(report.success).toBe(true);

      const completedGroup = report.data?.data.data.find((item: any) => item.status === 'completed');
      expect(completedGroup?.avgDuration).toBe(15); // (10 + 20) / 2
    });

    it('should apply min aggregation', async () => {
      const builder: CustomReportBuilder = {
        name: 'Min Budget by Category',
        description: 'Minimum budget by category',
        dataSources: ['tasks'],
        fields: [
          {
            id: 'category',
            name: 'category',
            label: 'Category',
            type: 'string',
            source: 'category'
          },
          {
            id: 'minBudget',
            name: 'minBudget',
            label: 'Min Budget',
            type: 'number',
            source: 'budget',
            aggregation: 'min'
          }
        ],
        groupings: ['category'],
        filters: [],
        visualizations: []
      };

      const testData = [
        { category: 'A', budget: 5000 },
        { category: 'A', budget: 3000 },
        { category: 'B', budget: 7000 }
      ];

      const report = await enhancedReportingService.generateCustomReport(builder, testData);
      expect(report.success).toBe(true);

      const categoryA = report.data?.data.data.find((item: any) => item.category === 'A');
      expect(categoryA?.minBudget).toBe(3000);
    });

    it('should apply max aggregation', async () => {
      const builder: CustomReportBuilder = {
        name: 'Max Budget by Category',
        description: 'Maximum budget by category',
        dataSources: ['tasks'],
        fields: [
          {
            id: 'category',
            name: 'category',
            label: 'Category',
            type: 'string',
            source: 'category'
          },
          {
            id: 'maxBudget',
            name: 'maxBudget',
            label: 'Max Budget',
            type: 'number',
            source: 'budget',
            aggregation: 'max'
          }
        ],
        groupings: ['category'],
        filters: [],
        visualizations: []
      };

      const testData = [
        { category: 'A', budget: 5000 },
        { category: 'A', budget: 8000 },
        { category: 'B', budget: 7000 }
      ];

      const report = await enhancedReportingService.generateCustomReport(builder, testData);
      expect(report.success).toBe(true);

      const categoryA = report.data?.data.data.find((item: any) => item.category === 'A');
      expect(categoryA?.maxBudget).toBe(8000);
    });

    it('should generate visualizations', async () => {
      const builder: CustomReportBuilder = {
        name: 'Visual Report',
        description: 'Report with charts',
        dataSources: ['tasks'],
        fields: [
          {
            id: 'status',
            name: 'status',
            label: 'Status',
            type: 'string',
            source: 'status'
          }
        ],
        groupings: [],
        filters: [],
        visualizations: [
          {
            id: 'chart-1',
            type: 'bar',
            title: 'Tasks by Status',
            xAxis: 'status',
            yAxis: 'count',
            series: ['tasks'],
            options: {}
          }
        ]
      };

      const testData = [
        { status: 'completed' },
        { status: 'in_progress' }
      ];

      const report = await enhancedReportingService.generateCustomReport(builder, testData);
      expect(report.success).toBe(true);
      expect(report.data?.data.visualizations).toHaveLength(1);
      expect(report.data?.data.visualizations[0].type).toBe('bar');
      expect(report.data?.data.visualizations[0].title).toBe('Tasks by Status');
    });

    it('should handle empty data gracefully', async () => {
      const builder: CustomReportBuilder = {
        name: 'Empty Report',
        description: 'Report with no data',
        dataSources: ['tasks'],
        fields: [
          {
            id: 'id',
            name: 'id',
            label: 'ID',
            type: 'string',
            source: 'id'
          }
        ],
        groupings: [],
        filters: [],
        visualizations: []
      };

      const report = await enhancedReportingService.generateCustomReport(builder, []);
      expect(report.success).toBe(true);
      expect(report.data?.data.data).toEqual([]);
    });

    it('should map fields without aggregation', async () => {
      const builder: CustomReportBuilder = {
        name: 'Simple Mapping',
        description: 'Map fields without grouping',
        dataSources: ['tasks'],
        fields: [
          {
            id: 'taskId',
            name: 'id',
            label: 'Task ID',
            type: 'string',
            source: 'id'
          },
          {
            id: 'taskTitle',
            name: 'title',
            label: 'Title',
            type: 'string',
            source: 'title'
          }
        ],
        groupings: [],
        filters: [],
        visualizations: []
      };

      const testData = [
        { id: '1', title: 'Task 1' },
        { id: '2', title: 'Task 2' }
      ];

      const report = await enhancedReportingService.generateCustomReport(builder, testData);
      expect(report.success).toBe(true);
      expect(report.data?.data.data.length).toBe(2);
      expect(report.data?.data.data[0]).toHaveProperty('taskId');
      expect(report.data?.data.data[0]).toHaveProperty('taskTitle');
    });
  });

  describe('Report Export', () => {
    it('should export report to different formats', async () => {
      // Mock generated report
      const mockReport = {
        id: 'test-report',
        name: 'Test Report',
        data: {},
        format: 'json' as const,
        generatedAt: new Date(),
        generatedBy: 'test-user',
        size: 1024
      };

      const exportResult = await enhancedReportingService.exportReport(mockReport, 'pdf');
      expect(exportResult.success).toBe(true);
      expect(exportResult.data?.url).toContain('/reports/export/');
      expect(exportResult.data?.url).toContain('.pdf');
    });

    it('should export to PDF format', async () => {
      const report = {
        id: 'report-pdf',
        name: 'PDF Report',
        data: { test: 'data' },
        format: 'json' as const,
        generatedAt: new Date(),
        generatedBy: 'user-1',
        size: 1000
      };

      const result = await enhancedReportingService.exportReport(report, 'pdf');
      expect(result.success).toBe(true);
      expect(result.data?.url).toContain('report-pdf.pdf');
      expect(result.data?.size).toBeGreaterThan(0);
    });

    it('should export to Excel format', async () => {
      const report = {
        id: 'report-excel',
        name: 'Excel Report',
        data: { test: 'data' },
        format: 'json' as const,
        generatedAt: new Date(),
        generatedBy: 'user-1',
        size: 1000
      };

      const result = await enhancedReportingService.exportReport(report, 'excel');
      expect(result.success).toBe(true);
      expect(result.data?.url).toContain('report-excel.excel');
    });

    it('should export to HTML format', async () => {
      const report = {
        id: 'report-html',
        name: 'HTML Report',
        data: { test: 'data' },
        format: 'json' as const,
        generatedAt: new Date(),
        generatedBy: 'user-1',
        size: 1000
      };

      const result = await enhancedReportingService.exportReport(report, 'html');
      expect(result.success).toBe(true);
      expect(result.data?.url).toContain('report-html.html');
    });

    it('should export to JSON format', async () => {
      const report = {
        id: 'report-json',
        name: 'JSON Report',
        data: { test: 'data' },
        format: 'json' as const,
        generatedAt: new Date(),
        generatedBy: 'user-1',
        size: 1000
      };

      const result = await enhancedReportingService.exportReport(report, 'json');
      expect(result.success).toBe(true);
      expect(result.data?.url).toContain('report-json.json');
    });

    it('should calculate different file sizes for different formats', async () => {
      const report = {
        id: 'report-sizes',
        name: 'Size Test',
        data: { test: 'data' },
        format: 'json' as const,
        generatedAt: new Date(),
        generatedBy: 'user-1',
        size: 1000
      };

      const pdfResult = await enhancedReportingService.exportReport(report, 'pdf');
      const excelResult = await enhancedReportingService.exportReport(report, 'excel');
      const htmlResult = await enhancedReportingService.exportReport(report, 'html');
      const jsonResult = await enhancedReportingService.exportReport(report, 'json');

      // PDF should be larger (1.2x), Excel smaller (0.8x), HTML and JSON same (1x)
      expect(pdfResult.data!.size).toBe(1200); // 1000 * 1.2
      expect(excelResult.data!.size).toBe(800); // 1000 * 0.8
      expect(htmlResult.data!.size).toBe(1000); // 1000 * 1
      expect(jsonResult.data!.size).toBe(1000); // 1000 * 1
    });
  });
});