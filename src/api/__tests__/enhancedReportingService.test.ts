/**
 * Enhanced Reporting Service Tests
 * NataCarePM - Phase 4.5: Enhanced Reporting & Dashboards
 */

import { enhancedReportingService } from '../enhancedReportingService';

describe('Enhanced Reporting Service', () => {
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

      const config = {
        projectId: 'test-project',
        format: 'json' as const,
        includeCharts: true,
        includeSummary: true,
        includeRecommendations: true
      };

      const report = await enhancedReportingService.generateProjectReport(config, projectData);
      expect(report.success).toBe(true);
      expect(report.data?.name).toContain('Project Report');
      expect(report.data?.projectId).toBe('test-project');
    });
  });

  describe('Custom Report Builder', () => {
    it('should generate custom report', async () => {
      const builder = {
        name: 'Test Custom Report',
        description: 'Test custom report description',
        dataSources: ['tasks'],
        fields: [
          {
            id: 'taskName',
            name: 'Task Name',
            label: 'Task Name',
            type: 'string' as const,
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
  });
});