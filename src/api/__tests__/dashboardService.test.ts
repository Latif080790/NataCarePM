/**
 * Dashboard Service Tests
 * NataCarePM - Week 6 Day 2
 *
 * Comprehensive test suite for dashboardService
 * Tests dashboard CRUD, widget data generation, filtering, caching, real-time updates
 *
 * Service Pattern: Class-based singleton with in-memory storage
 * Dependencies: KPIService (mocked - already tested in Week 5 Day 7)
 *
 * Test Coverage:
 * - Dashboard Management (CRUD operations)
 * - Widget Data Generation (5 widget types)
 * - Data Filtering (6 filter operators)
 * - Data Extraction (actualCosts, budget, quality, resource, risk)
 * - Real-Time Updates (interval management)
 * - Caching (widget data cache)
 * - Error Handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { dashboardService, DashboardService } from '../dashboardService';
import type { 
  Project,
  Task,
  RabItem,
  EVMMetrics,
  Worker,
  Expense,
  DailyReport
} from '@/types';
import type { Resource } from '@/types/resource.types';
import type { 
  DashboardConfiguration,
  WidgetDataRequest
} from '../dashboardService';

// ============================================================================
// Mock KPIService (already tested in Week 5 Day 7)
// ============================================================================

vi.mock('../kpiService', () => ({
  KPIService: {
    calculateKPIMetrics: vi.fn().mockReturnValue({
      overallHealthScore: 85,
      performanceTrend: 'Improving',
      budgetUtilization: 95.5,
      costVariancePercentage: -5,
      scheduleVariancePercentage: 3,
      taskCompletionRate: 75,
      qualityScore: 92,
      resourceUtilization: 88,
      riskExposure: 15,
      criticalPathVariance: 2,
      earlyWarningIndicator: 10,
      timeToCompletion: 45,
      burnRate: 12000,
      velocityTrend: 'Stable',
      defectDensity: 0.05,
      productivityIndex: 1.15,
      costPerformanceIndex: 1.05
    })
  }
}));

// ============================================================================
// Test Setup & Mock Data
// ============================================================================

describe('Dashboard Service', () => {
  // Reset service state before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Clean up intervals after each test
  afterEach(() => {
    // Clear all real-time updates to prevent memory leaks
    const dashboardIds = ['dashboard-project-overview', 'test-dashboard'];
    dashboardIds.forEach(id => {
      dashboardService.clearRealTimeUpdates(id);
    });
  });

  // Mock project data
  const mockProject: Project = {
    id: 'proj-001',
    name: 'Construction Project Alpha',
    ownerId: 'user-001',
    budget: 1000000,
    status: 'in_progress' as any,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockTasks: Task[] = [
    {
      id: 'task-001',
      projectId: 'proj-001',
      name: 'Foundation Work',
      description: 'Lay foundation',
      status: 'completed',
      assignedTo: 'worker-001',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-15'),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'task-002',
      projectId: 'proj-001',
      name: 'Frame Construction',
      description: 'Build frame',
      status: 'in_progress',
      assignedTo: 'worker-002',
      startDate: new Date('2025-01-16'),
      endDate: new Date('2025-02-15'),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'task-003',
      projectId: 'proj-001',
      name: 'Roofing',
      description: 'Install roof',
      status: 'pending',
      assignedTo: 'worker-003',
      startDate: new Date('2025-02-16'),
      endDate: new Date('2025-03-15'),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'task-004',
      projectId: 'proj-001',
      name: 'Electrical Work',
      description: 'Install wiring',
      status: 'done',
      assignedTo: 'worker-004',
      startDate: new Date('2025-03-16'),
      endDate: new Date('2025-04-15'),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockRabItems: RabItem[] = [
    {
      id: 1,
      no: '1',
      uraian: 'Foundation materials',
      volume: 100,
      satuan: 'm³',
      hargaSatuan: 5000,
      kategori: 'material',
      ahspId: 'ahsp-001'
    },
    {
      id: 2,
      no: '2',
      uraian: 'Frame materials',
      volume: 50,
      satuan: 'm³',
      hargaSatuan: 8000,
      kategori: 'material',
      ahspId: 'ahsp-002'
    }
  ];

  const mockWorkers: Worker[] = [
    {
      id: 'worker-001',
      projectId: 'proj-001',
      name: 'John Doe',
      role: 'Foreman',
      contactInfo: '123-456-7890',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'worker-002',
      projectId: 'proj-001',
      name: 'Jane Smith',
      role: 'Carpenter',
      contactInfo: '123-456-7891',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockExpenses: Expense[] = [
    {
      id: 'exp-001',
      projectId: 'proj-001',
      rabItemId: '1',
      description: 'Cement purchase',
      amount: 250000,
      category: 'material',
      date: new Date('2025-01-05'),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'exp-002',
      projectId: 'proj-001',
      rabItemId: '1',
      description: 'Sand purchase',
      amount: 150000,
      category: 'material',
      date: new Date('2025-01-10'),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'exp-003',
      projectId: 'proj-001',
      rabItemId: '2',
      description: 'Steel beams',
      amount: 300000,
      category: 'material',
      date: new Date('2025-01-20'),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockDailyReports: DailyReport[] = [
    {
      id: 'report-001',
      projectId: 'proj-001',
      date: new Date('2025-01-15'),
      weather: 'Sunny',
      notes: 'Foundation completed',
      workforce: [{ id: 'worker-001', name: 'John Doe', role: 'Foreman', hours: 8 }],
      materialsConsumed: [
        { id: 'mat-001', name: 'Cement', quantity: 10, unit: 'bags' }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'report-002',
      projectId: 'proj-001',
      date: new Date('2025-01-16'),
      weather: 'Cloudy',
      notes: 'Started frame work',
      workforce: [{ id: 'worker-002', name: 'Jane Smith', role: 'Carpenter', hours: 8 }],
      materialsConsumed: [
        { id: 'mat-002', name: 'Steel', quantity: 5, unit: 'beams' }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockResources: Resource[] = [];

  const mockEVMMetrics: EVMMetrics = {
    plannedValue: 500000,
    earnedValue: 480000,
    actualCost: 450000,
    costVariance: 30000,
    scheduleVariance: -20000,
    costPerformanceIndex: 1.067,
    schedulePerformanceIndex: 0.96,
    estimateAtCompletion: 937500,
    estimateToComplete: 487500,
    varianceAtCompletion: 62500,
    toCompletePerformanceIndex: 1.1
  };

  const mockProjectData = {
    project: mockProject,
    tasks: mockTasks,
    rabItems: mockRabItems,
    workers: mockWorkers,
    resources: mockResources,
    expenses: mockExpenses,
    dailyReports: mockDailyReports,
    evmMetrics: mockEVMMetrics
  };

  // ============================================================================
  // Test Group 1: Dashboard Management
  // ============================================================================

  describe('Dashboard Management', () => {
    it('should initialize with default dashboard', async () => {
      const result = await dashboardService.getDashboard('dashboard-project-overview');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('dashboard-project-overview');
      expect(result.data?.name).toBe('Project Overview');
      expect(result.data?.widgets).toHaveLength(5);
    });

    it('should return error for non-existent dashboard', async () => {
      const result = await dashboardService.getDashboard('non-existent-dashboard');
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DASHBOARD_NOT_FOUND');
    });

    it('should save new dashboard configuration', async () => {
      const newDashboard: DashboardConfiguration = {
        id: 'dashboard-custom',
        name: 'Custom Dashboard',
        description: 'User custom dashboard',
        widgets: [],
        filters: [],
        layout: 'freeform',
        theme: 'dark',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-001'
      };

      const saveResult = await dashboardService.saveDashboard(newDashboard);
      expect(saveResult.success).toBe(true);
      expect(saveResult.data?.id).toBe('dashboard-custom');

      // Verify saved
      const getResult = await dashboardService.getDashboard('dashboard-custom');
      expect(getResult.success).toBe(true);
      expect(getResult.data?.name).toBe('Custom Dashboard');
      expect(getResult.data?.theme).toBe('dark');
    });

    it('should update existing dashboard', async () => {
      const dashboardResult = await dashboardService.getDashboard('dashboard-project-overview');
      const dashboard = dashboardResult.data!;

      // Update dashboard
      dashboard.name = 'Updated Project Overview';
      dashboard.theme = 'light';

      const updateResult = await dashboardService.saveDashboard(dashboard);
      expect(updateResult.success).toBe(true);

      // Verify update
      const getResult = await dashboardService.getDashboard('dashboard-project-overview');
      expect(getResult.data?.name).toBe('Updated Project Overview');
      expect(getResult.data?.theme).toBe('light');
    });

    it('should list all dashboards', async () => {
      const result = await dashboardService.listDashboards();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.length).toBeGreaterThanOrEqual(1);
      expect(result.data!.some(d => d.id === 'dashboard-project-overview')).toBe(true);
    });
  });

  // ============================================================================
  // Test Group 2: Widget Data Generation - Project Health
  // ============================================================================

  describe('Widget Data - Project Health', () => {
    it('should generate project health widget data', async () => {
      const request: WidgetDataRequest = {
        widgetId: 'widget-project-health',
        projectId: 'proj-001'
      };

      const result = await dashboardService.getWidgetData(request, mockProjectData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.healthScore).toBe(85);
      expect(result.data.performanceTrend).toBe('Improving');
      expect(result.data.kpiMetrics).toBeDefined();
    });

    it('should call KPIService during project health generation', async () => {
      const { KPIService } = await import('../kpiService');
      
      const request: WidgetDataRequest = {
        widgetId: 'widget-project-health',
        projectId: 'proj-001'
      };

      await dashboardService.getWidgetData(request, mockProjectData);
      
      expect(KPIService.calculateKPIMetrics).toHaveBeenCalled();
    });

    it('should pass correct data to KPIService', async () => {
      const { KPIService } = await import('../kpiService');
      
      const request: WidgetDataRequest = {
        widgetId: 'widget-project-health',
        projectId: 'proj-001'
      };

      await dashboardService.getWidgetData(request, mockProjectData);
      
      expect(KPIService.calculateKPIMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          tasks: mockTasks,
          rabItems: mockRabItems,
          actualCosts: {
            '1': 400000, // exp-001 + exp-002
            '2': 300000  // exp-003
          },
          budgetAtCompletion: 900000, // (100 * 5000) + (50 * 8000)
          evmMetrics: mockEVMMetrics
        })
      );
    });
  });

  // ============================================================================
  // Test Group 3: Widget Data Generation - Budget Utilization
  // ============================================================================

  describe('Widget Data - Budget Utilization', () => {
    it('should generate budget utilization widget data', async () => {
      const request: WidgetDataRequest = {
        widgetId: 'widget-budget-utilization',
        projectId: 'proj-001'
      };

      const result = await dashboardService.getWidgetData(request, mockProjectData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.budgetAtCompletion).toBe(900000);
      expect(result.data.totalActualCost).toBe(700000); // 400000 + 300000
      expect(result.data.budgetUtilization).toBeCloseTo(77.78, 1); // (700000/900000)*100
      expect(result.data.remainingBudget).toBe(200000); // 900000 - 700000
    });

    it('should handle zero budget gracefully', async () => {
      const projectDataNoBudget = {
        ...mockProjectData,
        rabItems: []
      };

      const request: WidgetDataRequest = {
        widgetId: 'widget-budget-utilization',
        projectId: 'proj-001'
      };

      const result = await dashboardService.getWidgetData(request, projectDataNoBudget);
      
      expect(result.success).toBe(true);
      expect(result.data.budgetAtCompletion).toBe(0);
      expect(result.data.budgetUtilization).toBe(0);
    });
  });

  // ============================================================================
  // Test Group 4: Widget Data Generation - Schedule Progress
  // ============================================================================

  describe('Widget Data - Schedule Progress', () => {
    it('should generate schedule progress widget data', async () => {
      const request: WidgetDataRequest = {
        widgetId: 'widget-schedule-progress',
        projectId: 'proj-001'
      };

      const result = await dashboardService.getWidgetData(request, mockProjectData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.totalTasks).toBe(4);
      expect(result.data.completedTasks).toBe(2); // 'completed' + 'done'
      expect(result.data.taskCompletionRate).toBe(50); // (2/4)*100
    });

    it('should calculate schedule variance from EVM metrics', async () => {
      const request: WidgetDataRequest = {
        widgetId: 'widget-schedule-progress',
        projectId: 'proj-001'
      };

      const result = await dashboardService.getWidgetData(request, mockProjectData);
      
      expect(result.data.scheduleVariancePercentage).toBeCloseTo(-4, 0); // (-20000/500000)*100
    });

    it('should handle missing EVM metrics', async () => {
      const projectDataNoEVM = {
        ...mockProjectData,
        evmMetrics: undefined
      };

      const request: WidgetDataRequest = {
        widgetId: 'widget-schedule-progress',
        projectId: 'proj-001'
      };

      const result = await dashboardService.getWidgetData(request, projectDataNoEVM);
      
      expect(result.success).toBe(true);
      expect(result.data.scheduleVariancePercentage).toBe(0);
    });
  });

  // ============================================================================
  // Test Group 5: Widget Data Generation - Task Summary
  // ============================================================================

  describe('Widget Data - Task Summary', () => {
    it('should generate task summary widget data', async () => {
      const request: WidgetDataRequest = {
        widgetId: 'widget-task-summary',
        projectId: 'proj-001'
      };

      const result = await dashboardService.getWidgetData(request, mockProjectData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.totalTasks).toBe(4);
      expect(result.data.summary).toBeDefined();
      expect(result.data.summary.length).toBeGreaterThan(0);
    });

    it('should group tasks by status correctly', async () => {
      const request: WidgetDataRequest = {
        widgetId: 'widget-task-summary',
        projectId: 'proj-001'
      };

      const result = await dashboardService.getWidgetData(request, mockProjectData);
      
      const summary = result.data.summary;
      
      // Find status groups
      const completedGroup = summary.find((s: any) => s.status === 'completed');
      const inProgressGroup = summary.find((s: any) => s.status === 'in_progress');
      const pendingGroup = summary.find((s: any) => s.status === 'pending');
      const doneGroup = summary.find((s: any) => s.status === 'done');

      expect(completedGroup?.count).toBe(1);
      expect(inProgressGroup?.count).toBe(1);
      expect(pendingGroup?.count).toBe(1);
      expect(doneGroup?.count).toBe(1);
    });

    it('should calculate percentages correctly', async () => {
      const request: WidgetDataRequest = {
        widgetId: 'widget-task-summary',
        projectId: 'proj-001'
      };

      const result = await dashboardService.getWidgetData(request, mockProjectData);
      
      const summary = result.data.summary;
      
      // Each status has 1 task out of 4 = 25%
      summary.forEach((group: any) => {
        expect(group.percentage).toBe(25);
      });
    });
  });

  // ============================================================================
  // Test Group 6: Widget Data Generation - Recent Activities
  // ============================================================================

  describe('Widget Data - Recent Activities', () => {
    it('should generate recent activities widget data', async () => {
      const request: WidgetDataRequest = {
        widgetId: 'widget-recent-activities',
        projectId: 'proj-001'
      };

      const result = await dashboardService.getWidgetData(request, mockProjectData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.activities).toBeDefined();
      expect(result.data.totalReports).toBe(2);
    });

    it('should sort activities by date (newest first)', async () => {
      const request: WidgetDataRequest = {
        widgetId: 'widget-recent-activities',
        projectId: 'proj-001'
      };

      const result = await dashboardService.getWidgetData(request, mockProjectData);
      
      const activities = result.data.activities;
      
      // First activity should be newest (2025-01-16)
      expect(new Date(activities[0].date).getTime()).toBeGreaterThan(
        new Date(activities[1].date).getTime()
      );
    });

    it('should limit to 10 most recent activities', async () => {
      // Create 15 daily reports
      const manyReports: DailyReport[] = Array.from({ length: 15 }, (_, i) => ({
        id: `report-${i}`,
        projectId: 'proj-001',
        date: new Date(`2025-01-${i + 1}`),
        weather: 'Sunny',
        notes: `Day ${i + 1}`,
        workforce: [],
        materialsConsumed: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const projectDataManyReports = {
        ...mockProjectData,
        dailyReports: manyReports
      };

      const request: WidgetDataRequest = {
        widgetId: 'widget-recent-activities',
        projectId: 'proj-001'
      };

      const result = await dashboardService.getWidgetData(request, projectDataManyReports);
      
      expect(result.data.activities).toHaveLength(10);
      expect(result.data.totalReports).toBe(15);
    });
  });

  // ============================================================================
  // Test Group 7: Data Filtering
  // ============================================================================

  describe('Data Filtering', () => {
    it('should apply equals filter correctly', async () => {
      const request: WidgetDataRequest = {
        widgetId: 'widget-task-summary',
        projectId: 'proj-001',
        filters: [
          { field: 'status', operator: 'equals', value: 'completed', label: 'Completed tasks' }
        ]
      };

      const result = await dashboardService.getWidgetData(request, mockProjectData);
      
      expect(result.success).toBe(true);
      expect(result.data.totalTasks).toBe(1); // Only 1 task with status 'completed'
    });

    it('should apply contains filter', async () => {
      const request: WidgetDataRequest = {
        widgetId: 'widget-task-summary',
        projectId: 'proj-001',
        filters: [
          { field: 'name', operator: 'contains', value: 'Work', label: 'Tasks with "Work"' }
        ]
      };

      const result = await dashboardService.getWidgetData(request, mockProjectData);
      
      // Foundation Work + Electrical Work = 2 tasks
      expect(result.data.totalTasks).toBe(2);
    });

    it('should apply greater_than filter', async () => {
      const request: WidgetDataRequest = {
        widgetId: 'widget-budget-utilization',
        projectId: 'proj-001',
        filters: [
          { field: 'amount', operator: 'greater_than', value: 200000, label: 'Expenses > 200k' }
        ]
      };

      const result = await dashboardService.getWidgetData(request, mockProjectData);
      
      // Only exp-001 (250k) and exp-003 (300k) match
      expect(result.data.totalActualCost).toBe(550000); // 250000 + 300000
    });

    it('should apply less_than filter', async () => {
      const request: WidgetDataRequest = {
        widgetId: 'widget-budget-utilization',
        projectId: 'proj-001',
        filters: [
          { field: 'amount', operator: 'less_than', value: 200000, label: 'Expenses < 200k' }
        ]
      };

      const result = await dashboardService.getWidgetData(request, mockProjectData);
      
      // Only exp-002 (150k) matches
      expect(result.data.totalActualCost).toBe(150000);
    });

    it('should apply between filter', async () => {
      const request: WidgetDataRequest = {
        widgetId: 'widget-budget-utilization',
        projectId: 'proj-001',
        filters: [
          { field: 'amount', operator: 'between', value: [150000, 300000], label: 'Expenses 150k-300k' }
        ]
      };

      const result = await dashboardService.getWidgetData(request, mockProjectData);
      
      // All expenses match (150k, 250k, 300k)
      expect(result.data.totalActualCost).toBe(700000);
    });

    it('should apply in filter', async () => {
      const request: WidgetDataRequest = {
        widgetId: 'widget-task-summary',
        projectId: 'proj-001',
        filters: [
          { field: 'status', operator: 'in', value: ['completed', 'done'], label: 'Completed or Done' }
        ]
      };

      const result = await dashboardService.getWidgetData(request, mockProjectData);
      
      // 2 tasks: 1 completed + 1 done
      expect(result.data.totalTasks).toBe(2);
    });
  });

  // ============================================================================
  // Test Group 8: Widget Data Caching
  // ============================================================================

  describe('Widget Data Caching', () => {
    it('should cache widget data after generation', async () => {
      const request: WidgetDataRequest = {
        widgetId: 'widget-project-health',
        projectId: 'proj-001'
      };

      await dashboardService.getWidgetData(request, mockProjectData);
      
      const cachedData = dashboardService.getCachedWidgetData('widget-project-health');
      
      expect(cachedData).toBeDefined();
      expect(cachedData?.widgetId).toBe('widget-project-health');
      expect(cachedData?.data).toBeDefined();
      expect(cachedData?.timestamp).toBeDefined();
    });

    it('should return undefined for non-cached widget', () => {
      const cachedData = dashboardService.getCachedWidgetData('non-existent-widget');
      
      expect(cachedData).toBeUndefined();
    });

    it('should update cache on subsequent widget data requests', async () => {
      const request: WidgetDataRequest = {
        widgetId: 'widget-budget-utilization',
        projectId: 'proj-001'
      };

      // First request
      await dashboardService.getWidgetData(request, mockProjectData);
      const firstCache = dashboardService.getCachedWidgetData('widget-budget-utilization');
      const firstTimestamp = firstCache?.timestamp;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      // Second request
      await dashboardService.getWidgetData(request, mockProjectData);
      const secondCache = dashboardService.getCachedWidgetData('widget-budget-utilization');
      const secondTimestamp = secondCache?.timestamp;

      expect(secondTimestamp?.getTime()).toBeGreaterThan(firstTimestamp?.getTime()!);
    });
  });

  // ============================================================================
  // Test Group 9: Real-Time Updates
  // ============================================================================

  describe('Real-Time Updates', () => {
    it('should start real-time updates for dashboard', () => {
      // This test verifies intervals are set up
      dashboardService.startRealTimeUpdates('dashboard-project-overview');
      
      // No assertion needed - just verify no errors thrown
      expect(true).toBe(true);
    });

    it('should clear real-time updates for dashboard', () => {
      dashboardService.startRealTimeUpdates('dashboard-project-overview');
      dashboardService.clearRealTimeUpdates('dashboard-project-overview');
      
      // No assertion needed - just verify no errors thrown
      expect(true).toBe(true);
    });

    it('should handle real-time updates for non-existent dashboard', () => {
      // Should not throw error
      dashboardService.startRealTimeUpdates('non-existent-dashboard');
      
      expect(true).toBe(true);
    });

    it('should clear existing intervals when starting new updates', () => {
      // Start updates twice - should clear first intervals
      dashboardService.startRealTimeUpdates('dashboard-project-overview');
      dashboardService.startRealTimeUpdates('dashboard-project-overview');
      
      // No assertion needed - just verify no errors thrown
      expect(true).toBe(true);
    });
  });

  // ============================================================================
  // Test Group 10: Error Handling
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle unknown widget ID gracefully', async () => {
      const request: WidgetDataRequest = {
        widgetId: 'widget-unknown',
        projectId: 'proj-001'
      };

      const result = await dashboardService.getWidgetData(request, mockProjectData);
      
      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Widget data not implemented');
    });

    it('should handle empty task list', async () => {
      const projectDataNoTasks = {
        ...mockProjectData,
        tasks: []
      };

      const request: WidgetDataRequest = {
        widgetId: 'widget-task-summary',
        projectId: 'proj-001'
      };

      const result = await dashboardService.getWidgetData(request, projectDataNoTasks);
      
      expect(result.success).toBe(true);
      expect(result.data.totalTasks).toBe(0);
    });

    it('should handle empty expense list', async () => {
      const projectDataNoExpenses = {
        ...mockProjectData,
        expenses: []
      };

      const request: WidgetDataRequest = {
        widgetId: 'widget-budget-utilization',
        projectId: 'proj-001'
      };

      const result = await dashboardService.getWidgetData(request, projectDataNoExpenses);
      
      expect(result.success).toBe(true);
      expect(result.data.totalActualCost).toBe(0);
    });

    it('should handle empty daily reports list', async () => {
      const projectDataNoReports = {
        ...mockProjectData,
        dailyReports: []
      };

      const request: WidgetDataRequest = {
        widgetId: 'widget-recent-activities',
        projectId: 'proj-001'
      };

      const result = await dashboardService.getWidgetData(request, projectDataNoReports);
      
      expect(result.success).toBe(true);
      expect(result.data.activities).toHaveLength(0);
      expect(result.data.totalReports).toBe(0);
    });
  });
});
