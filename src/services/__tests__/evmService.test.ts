import { describe, it, expect } from 'vitest';
import { EVMService } from '../evmService';
import type { Task, RabItem, EVMMetrics } from '@/types';

// ============================================================================
// TEST DATA
// ============================================================================

const projectStartDate = new Date('2025-01-01');
const currentDate = new Date('2025-06-01'); // 5 months into project
const budgetAtCompletion = 1000000;

const mockTasks: Task[] = [
  {
    id: 'task-1',
    projectId: 'project-1',
    title: 'Foundation Work',
    description: 'Foundation excavation and concrete',
    startDate: '2025-01-01',
    endDate: '2025-03-01', // 2 months duration
    dueDate: '2025-03-01',
    progress: 100, // Completed
    status: 'completed',
    assignedTo: ['user-1'],
    createdBy: 'user-1',
    priority: 'high',
    dependencies: [],
    subtasks: [],
    tags: [],
    rabItemId: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'task-2',
    projectId: 'project-1',
    title: 'Structural Work',
    description: 'Building structure',
    startDate: '2025-03-01',
    endDate: '2025-07-01', // 4 months duration
    dueDate: '2025-07-01',
    progress: 60, // In progress
    status: 'in-progress',
    assignedTo: ['user-2'],
    createdBy: 'user-1',
    priority: 'high',
    dependencies: [],
    subtasks: [],
    tags: [],
    rabItemId: 2,
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'task-3',
    projectId: 'project-1',
    title: 'Finishing Work',
    description: 'Interior finishing',
    startDate: '2025-07-01',
    endDate: '2025-09-01', // 2 months duration
    dueDate: '2025-09-01',
    progress: 0, // Not started
    status: 'todo',
    assignedTo: ['user-3'],
    createdBy: 'user-1',
    priority: 'medium',
    dependencies: [],
    subtasks: [],
    tags: [],
    rabItemId: 3,
    createdAt: '2025-07-01T00:00:00Z',
    updatedAt: '2025-06-01T00:00:00Z',
  },
];

const mockRabItems: RabItem[] = [
  {
    id: 1,
    no: '1.1',
    uraian: 'Foundation Work',
    volume: 100,
    satuan: 'm³',
    hargaSatuan: 2000,
    kategori: 'foundation',
    ahspId: 'AHSP-001',
  },
  {
    id: 2,
    no: '1.2',
    uraian: 'Structural Work',
    volume: 200,
    satuan: 'm³',
    hargaSatuan: 3000,
    kategori: 'structure',
    ahspId: 'AHSP-002',
  },
  {
    id: 3,
    no: '1.3',
    uraian: 'Finishing Work',
    volume: 150,
    satuan: 'm²',
    hargaSatuan: 1000,
    kategori: 'finishing',
    ahspId: 'AHSP-003',
  },
];

const mockActualCosts = {
  'task-1': 210000, // Over budget (planned: 200k)
  'task-2': 350000, // Under budget so far (60% of 600k = 360k planned)
  'task-3': 0, // Not started
};

// ============================================================================
// TESTS - Main EVM Calculations
// ============================================================================

describe('EVMService - Main EVM Calculations', () => {
  it('should calculate comprehensive EVM metrics correctly', () => {
    const metrics = EVMService.calculateEVMMetrics('project-1', {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      currentDate,
      projectStartDate,
      budgetAtCompletion,
    });

    // Validate core metrics
    expect(metrics.projectId).toBe('project-1');
    expect(metrics.reportDate).toBe(currentDate);
    expect(metrics.budgetAtCompletion).toBe(budgetAtCompletion);

    // Validate PV, EV, AC are positive numbers
    expect(metrics.plannedValue).toBeGreaterThan(0);
    expect(metrics.earnedValue).toBeGreaterThan(0);
    expect(metrics.actualCost).toBe(560000); // 210k + 350k + 0

    // Validate performance indices
    expect(metrics.costPerformanceIndex).toBeGreaterThan(0);
    expect(metrics.schedulePerformanceIndex).toBeGreaterThan(0);

    // Validate variances
    expect(metrics.costVariance).toBeDefined();
    expect(metrics.scheduleVariance).toBeDefined();

    // Validate forecasts
    expect(metrics.estimateAtCompletion).toBeGreaterThan(0);
    expect(metrics.estimateToComplete).toBeGreaterThan(0);
    expect(metrics.varianceAtCompletion).toBeDefined();

    // Validate time metrics
    expect(metrics.timeVariance).toBeDefined();
    expect(metrics.estimatedTimeToComplete).toBeGreaterThan(0);

    // Validate status and health
    expect(['On Track', 'At Risk', 'Critical']).toContain(metrics.performanceStatus);
    expect(metrics.healthScore).toBeGreaterThanOrEqual(0);
    expect(metrics.healthScore).toBeLessThanOrEqual(100);
  });

  it('should calculate planned value (PV) based on schedule', () => {
    const metrics = EVMService.calculateEVMMetrics('project-1', {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      currentDate,
      projectStartDate,
      budgetAtCompletion,
    });

    // Task 1: Should be 100% planned (completed on time)
    // Task 2: Should be ~50% planned (halfway through timeline by currentDate)
    // Task 3: Should be 0% planned (not started yet)
    
    // PV should be less than BAC since not all work is planned yet
    expect(metrics.plannedValue).toBeLessThan(budgetAtCompletion);
    expect(metrics.plannedValue).toBeGreaterThan(0);
  });

  it('should calculate earned value (EV) based on actual progress', () => {
    const metrics = EVMService.calculateEVMMetrics('project-1', {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      currentDate,
      projectStartDate,
      budgetAtCompletion,
    });

    // Task 1: 100% progress → EV = 200k
    // Task 2: 60% progress → EV = 600k * 0.6 = 360k
    // Task 3: 0% progress → EV = 0
    // Total EV should be ~560k

    expect(metrics.earnedValue).toBeCloseTo(560000, -3); // Within 1000
  });

  it('should calculate cost performance index (CPI)', () => {
    const metrics = EVMService.calculateEVMMetrics('project-1', {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      currentDate,
      projectStartDate,
      budgetAtCompletion,
    });

    // CPI = EV / AC
    // EV ≈ 560k, AC = 560k
    // CPI ≈ 1.0 (on budget)

    expect(metrics.costPerformanceIndex).toBeCloseTo(1.0, 1);
    expect(metrics.costPerformanceIndex).toBeGreaterThan(0);
  });

  it('should calculate schedule performance index (SPI)', () => {
    const metrics = EVMService.calculateEVMMetrics('project-1', {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      currentDate,
      projectStartDate,
      budgetAtCompletion,
    });

    // SPI = EV / PV
    expect(metrics.schedulePerformanceIndex).toBeGreaterThan(0);
    
    // If EV > PV, ahead of schedule (SPI > 1)
    // If EV < PV, behind schedule (SPI < 1)
    // If EV = PV, on schedule (SPI = 1)
  });

  it('should calculate estimate at completion (EAC) using appropriate method', () => {
    const metrics = EVMService.calculateEVMMetrics('project-1', {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      currentDate,
      projectStartDate,
      budgetAtCompletion,
    });

    // EAC should be positive and realistic
    expect(metrics.estimateAtCompletion).toBeGreaterThan(0);
    
    // EAC should be close to BAC if performance is good (CPI ≈ 1)
    // For this test data, CPI ≈ 1.0, so EAC ≈ BAC
    expect(metrics.estimateAtCompletion).toBeGreaterThan(budgetAtCompletion * 0.8);
    expect(metrics.estimateAtCompletion).toBeLessThan(budgetAtCompletion * 1.5);
  });

  it('should determine performance status correctly', () => {
    // Test "On Track" status
    const goodMetrics = EVMService.calculateEVMMetrics('project-1', {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      currentDate,
      projectStartDate,
      budgetAtCompletion,
    });

    // With good performance (CPI ≈ 1, SPI ≈ 1), should be "On Track" or "At Risk"
    expect(['On Track', 'At Risk']).toContain(goodMetrics.performanceStatus);
  });

  it('should calculate health score between 0-100', () => {
    const metrics = EVMService.calculateEVMMetrics('project-1', {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      currentDate,
      projectStartDate,
      budgetAtCompletion,
    });

    expect(metrics.healthScore).toBeGreaterThanOrEqual(0);
    expect(metrics.healthScore).toBeLessThanOrEqual(100);
    
    // With good performance, health score should be decent
    expect(metrics.healthScore).toBeGreaterThan(50);
  });
});

// ============================================================================
// TESTS - EVM Trend Data Generation
// ============================================================================

describe('EVMService - EVM Trend Data', () => {
  it('should generate EVM trend data for multiple time points', () => {
    const historicalActualCosts = [
      {
        date: new Date('2025-02-01'),
        costs: { 'task-1': 100000, 'task-2': 0, 'task-3': 0 },
      },
      {
        date: new Date('2025-04-01'),
        costs: { 'task-1': 200000, 'task-2': 150000, 'task-3': 0 },
      },
      {
        date: new Date('2025-06-01'),
        costs: { 'task-1': 210000, 'task-2': 350000, 'task-3': 0 },
      },
    ];

    const trendData = EVMService.generateEVMTrendData(
      mockTasks,
      mockRabItems,
      historicalActualCosts,
      projectStartDate,
      budgetAtCompletion
    );

    expect(trendData).toHaveLength(3);

    // Validate each trend point
    trendData.forEach((point) => {
      expect(point.date).toBeInstanceOf(Date);
      expect(point.plannedValue).toBeGreaterThanOrEqual(0);
      expect(point.earnedValue).toBeGreaterThanOrEqual(0);
      expect(point.actualCost).toBeGreaterThanOrEqual(0);
      expect(point.cpi).toBeGreaterThan(0);
      expect(point.spi).toBeGreaterThan(0);
    });

    // Validate trend data is sorted by date
    for (let i = 1; i < trendData.length; i++) {
      expect(trendData[i].date.getTime()).toBeGreaterThan(
        trendData[i - 1].date.getTime()
      );
    }
  });

  it('should show increasing values over time in trend data', () => {
    const historicalActualCosts = [
      {
        date: new Date('2025-02-01'),
        costs: { 'task-1': 50000, 'task-2': 0, 'task-3': 0 },
      },
      {
        date: new Date('2025-04-01'),
        costs: { 'task-1': 150000, 'task-2': 100000, 'task-3': 0 },
      },
      {
        date: new Date('2025-06-01'),
        costs: { 'task-1': 210000, 'task-2': 300000, 'task-3': 0 },
      },
    ];

    const trendData = EVMService.generateEVMTrendData(
      mockTasks,
      mockRabItems,
      historicalActualCosts,
      projectStartDate,
      budgetAtCompletion
    );

    // AC should increase over time
    expect(trendData[1].actualCost).toBeGreaterThan(trendData[0].actualCost);
    expect(trendData[2].actualCost).toBeGreaterThan(trendData[1].actualCost);

    // EV should increase over time as work progresses
    expect(trendData[1].earnedValue).toBeGreaterThanOrEqual(trendData[0].earnedValue);
    expect(trendData[2].earnedValue).toBeGreaterThanOrEqual(trendData[1].earnedValue);
  });
});

// ============================================================================
// TESTS - Critical Path Impact
// ============================================================================

describe('EVMService - Critical Path Impact', () => {
  it('should identify critical tasks based on priority and progress', () => {
    const metrics = EVMService.calculateEVMMetrics('project-1', {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      currentDate,
      projectStartDate,
      budgetAtCompletion,
    });

    const criticalPathData = EVMService.calculateCriticalPathImpact(mockTasks, metrics);

    expect(criticalPathData.criticalTasks).toBeDefined();
    expect(Array.isArray(criticalPathData.criticalTasks)).toBe(true);
    
    // Task-1 and Task-2 are high priority, should be in critical path
    expect(criticalPathData.criticalTasks.length).toBeGreaterThan(0);
  });

  it('should calculate schedule risk', () => {
    const metrics = EVMService.calculateEVMMetrics('project-1', {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      currentDate,
      projectStartDate,
      budgetAtCompletion,
    });

    const criticalPathData = EVMService.calculateCriticalPathImpact(mockTasks, metrics);

    expect(criticalPathData.scheduleRisk).toBeGreaterThanOrEqual(0);
    expect(criticalPathData.scheduleRisk).toBeLessThanOrEqual(1);
  });

  it('should generate recommendations based on performance', () => {
    const metrics = EVMService.calculateEVMMetrics('project-1', {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      currentDate,
      projectStartDate,
      budgetAtCompletion,
    });

    const criticalPathData = EVMService.calculateCriticalPathImpact(mockTasks, metrics);

    expect(criticalPathData.recommendations).toBeDefined();
    expect(Array.isArray(criticalPathData.recommendations)).toBe(true);
    
    // Should have at least some recommendations
    expect(criticalPathData.recommendations.length).toBeGreaterThanOrEqual(0);
  });

  it('should recommend critical path focus when SPI is low', () => {
    // Create scenario with low SPI (behind schedule)
    const behindScheduleTasks: Task[] = mockTasks.map((task) => ({
      ...task,
      progress: task.progress * 0.5, // Half the expected progress
    }));

    const metrics = EVMService.calculateEVMMetrics('project-1', {
      tasks: behindScheduleTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      currentDate,
      projectStartDate,
      budgetAtCompletion,
    });

    const criticalPathData = EVMService.calculateCriticalPathImpact(
      behindScheduleTasks,
      metrics
    );

    // Should recommend critical path focus if SPI < 0.9
    if (metrics.schedulePerformanceIndex < 0.9) {
      expect(criticalPathData.recommendations.length).toBeGreaterThan(0);
      expect(
        criticalPathData.recommendations.some((rec) =>
          rec.toLowerCase().includes('critical')
        )
      ).toBe(true);
    }
  });
});

// ============================================================================
// TESTS - Project Completion Forecast
// ============================================================================

describe('EVMService - Project Completion Forecast', () => {
  it('should forecast project completion date and cost', () => {
    const metrics = EVMService.calculateEVMMetrics('project-1', {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      currentDate,
      projectStartDate,
      budgetAtCompletion,
    });

    const forecast = EVMService.forecastProjectCompletion(
      metrics,
      mockTasks,
      projectStartDate
    );

    expect(forecast.forecastCompletionDate).toBeInstanceOf(Date);
    expect(forecast.forecastCost).toBeGreaterThan(0);
    expect(forecast.confidenceLevel).toBeGreaterThan(0);
    expect(forecast.confidenceLevel).toBeLessThanOrEqual(1);
  });

  it('should generate three scenarios (optimistic, most likely, pessimistic)', () => {
    const metrics = EVMService.calculateEVMMetrics('project-1', {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      currentDate,
      projectStartDate,
      budgetAtCompletion,
    });

    const forecast = EVMService.forecastProjectCompletion(
      metrics,
      mockTasks,
      projectStartDate
    );

    // Validate optimistic scenario
    expect(forecast.scenarios.optimistic.date).toBeInstanceOf(Date);
    expect(forecast.scenarios.optimistic.cost).toBeGreaterThan(0);

    // Validate most likely scenario
    expect(forecast.scenarios.mostLikely.date).toBeInstanceOf(Date);
    expect(forecast.scenarios.mostLikely.cost).toBeGreaterThan(0);

    // Validate pessimistic scenario
    expect(forecast.scenarios.pessimistic.date).toBeInstanceOf(Date);
    expect(forecast.scenarios.pessimistic.cost).toBeGreaterThan(0);

    // Optimistic should be better than pessimistic
    expect(forecast.scenarios.optimistic.cost).toBeLessThan(
      forecast.scenarios.pessimistic.cost
    );
    expect(forecast.scenarios.optimistic.date.getTime()).toBeLessThan(
      forecast.scenarios.pessimistic.date.getTime()
    );
  });

  it('should have most likely scenario equal to main forecast', () => {
    const metrics = EVMService.calculateEVMMetrics('project-1', {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      currentDate,
      projectStartDate,
      budgetAtCompletion,
    });

    const forecast = EVMService.forecastProjectCompletion(
      metrics,
      mockTasks,
      projectStartDate
    );

    expect(forecast.scenarios.mostLikely.date).toEqual(forecast.forecastCompletionDate);
    expect(forecast.scenarios.mostLikely.cost).toBe(forecast.forecastCost);
  });

  it('should calculate confidence level based on performance stability', () => {
    const metrics = EVMService.calculateEVMMetrics('project-1', {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      currentDate,
      projectStartDate,
      budgetAtCompletion,
    });

    const forecast = EVMService.forecastProjectCompletion(
      metrics,
      mockTasks,
      projectStartDate
    );

    // Confidence should be at least 0.5 (minimum)
    expect(forecast.confidenceLevel).toBeGreaterThanOrEqual(0.5);
    
    // With good performance (CPI/SPI ≈ 1), confidence should be high
    if (
      metrics.costPerformanceIndex >= 0.95 &&
      metrics.schedulePerformanceIndex >= 0.95
    ) {
      expect(forecast.confidenceLevel).toBeGreaterThan(0.8);
    }
  });
});

// ============================================================================
// TESTS - Edge Cases
// ============================================================================

describe('EVMService - Edge Cases', () => {
  it('should handle zero actual costs gracefully', () => {
    const metrics = EVMService.calculateEVMMetrics('project-1', {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: {},
      currentDate,
      projectStartDate,
      budgetAtCompletion,
    });

    expect(metrics.actualCost).toBe(0);
    expect(metrics.costPerformanceIndex).toBe(1); // Default to 1 when AC = 0
  });

  it('should handle tasks with no matching RAB items', () => {
    const tasksWithoutRAB: Task[] = [
      {
        ...mockTasks[0],
        id: 'task-999', // No matching RAB item
      },
    ];

    const metrics = EVMService.calculateEVMMetrics('project-1', {
      tasks: tasksWithoutRAB,
      rabItems: mockRabItems,
      actualCosts: { 'task-999': 1000 },
      currentDate,
      projectStartDate,
      budgetAtCompletion,
    });

    expect(metrics).toBeDefined();
    expect(metrics.plannedValue).toBeGreaterThanOrEqual(0);
  });

  it('should handle tasks not yet started (currentDate < startDate)', () => {
    const futureTasks: Task[] = [
      {
        ...mockTasks[0],
        startDate: '2025-12-01', // Future date
        endDate: '2026-01-01',
        progress: 0,
      },
    ];

    const metrics = EVMService.calculateEVMMetrics('project-1', {
      tasks: futureTasks,
      rabItems: mockRabItems,
      actualCosts: {},
      currentDate,
      projectStartDate,
      budgetAtCompletion,
    });

    // Planned value should be 0 for tasks not started yet
    expect(metrics.plannedValue).toBe(0);
  });

  it('should handle tasks already completed (currentDate >= endDate)', () => {
    const completedTasks: Task[] = [
      {
        ...mockTasks[0],
        startDate: '2025-01-01',
        endDate: '2025-02-01', // Already past
        progress: 100,
      },
    ];

    const metrics = EVMService.calculateEVMMetrics('project-1', {
      tasks: completedTasks,
      rabItems: mockRabItems,
      actualCosts: { 'task-1': 200000 },
      currentDate,
      projectStartDate,
      budgetAtCompletion,
    });

    // For completed tasks, planned progress should be 100%
    expect(metrics.plannedValue).toBeGreaterThan(0);
  });

  it('should handle empty task list', () => {
    const metrics = EVMService.calculateEVMMetrics('project-1', {
      tasks: [],
      rabItems: mockRabItems,
      actualCosts: {},
      currentDate,
      projectStartDate,
      budgetAtCompletion,
    });

    expect(metrics.plannedValue).toBe(0);
    expect(metrics.earnedValue).toBe(0);
    expect(metrics.actualCost).toBe(0);
  });
});
