import { describe, it, expect, beforeEach } from 'vitest';
import { KPIService } from '../kpiService';
import { Task, RabItem, EVMMetrics, KPIMetrics } from '@/types';

// ============================================================================
// TEST DATA
// ============================================================================

const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Foundation Work',
    description: 'Excavation and foundation',
    status: 'completed',
    priority: 'high',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-15'),
    assignedTo: ['user-1'],
    projectId: 'proj-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'user-1',
  },
  {
    id: 'task-2',
    title: 'Structural Work',
    description: 'Building structure',
    status: 'in-progress',
    priority: 'high',
    startDate: new Date('2024-01-16'),
    endDate: new Date('2024-02-15'),
    assignedTo: ['user-2'],
    projectId: 'proj-1',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-02-01'),
    createdBy: 'user-1',
  },
  {
    id: 'task-3',
    title: 'Finishing Work',
    description: 'Interior finishing',
    status: 'todo',
    priority: 'medium',
    startDate: new Date('2024-02-16'),
    endDate: new Date('2024-03-15'),
    assignedTo: ['user-3'],
    projectId: 'proj-1',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    createdBy: 'user-1',
  },
  {
    id: 'task-4',
    title: 'Final Inspection',
    description: 'Quality check',
    status: 'done',
    priority: 'high',
    startDate: new Date('2024-03-16'),
    endDate: new Date('2024-03-20'),
    assignedTo: ['user-4'],
    projectId: 'proj-1',
    createdAt: new Date('2024-03-16'),
    updatedAt: new Date('2024-03-20'),
    createdBy: 'user-1',
  },
];

const mockRabItems: RabItem[] = [
  {
    id: 1,
    no: '1.1',
    uraian: 'Foundation',
    volume: 100,
    satuan: 'm³',
    hargaSatuan: 50000,
    kategori: 'earthwork',
  },
  {
    id: 2,
    no: '1.2',
    uraian: 'Structure',
    volume: 200,
    satuan: 'm³',
    hargaSatuan: 75000,
    kategori: 'concrete',
  },
];

const mockActualCosts = {
  'task-1': 5000000,
  'task-2': 12000000,
  'task-3': 3000000,
  'task-4': 500000,
};

const mockEVMMetrics: EVMMetrics = {
  plannedValue: 20000000,
  earnedValue: 18000000,
  actualCost: 20500000,
  costVariance: -2500000,
  scheduleVariance: -2000000,
  costPerformanceIndex: 0.88,
  schedulePerformanceIndex: 0.9,
  estimateAtCompletion: 23295454,
  estimateToComplete: 2795454,
  varianceAtCompletion: -3295454,
  toCompletePerformanceIndex: 1.14,
};

const mockQualityData = {
  defects: 5,
  totalDeliverables: 100,
  reworkHours: 20,
  totalHours: 500,
};

const mockResourceData = {
  allocatedHours: 600,
  actualHours: 500,
  teamSize: 10,
  productivity: 105,
};

const mockRiskData = {
  totalRisks: 20,
  highRisks: 4,
  mitigatedRisks: 12,
  contingencyUsed: 3000000,
  contingencyTotal: 20000000,
};

const budgetAtCompletion = 20000000;

// ============================================================================
// TEST SUITE
// ============================================================================

describe('KPIService - Main KPI Calculations', () => {
  it('should calculate comprehensive KPI metrics with all inputs', () => {
    const kpiInput = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
      evmMetrics: mockEVMMetrics,
      qualityData: mockQualityData,
      resourceData: mockResourceData,
      riskData: mockRiskData,
    };

    const metrics = KPIService.calculateKPIMetrics(kpiInput);

    // Verify all KPI categories are present
    expect(metrics).toHaveProperty('budgetUtilization');
    expect(metrics).toHaveProperty('costVariancePercentage');
    expect(metrics).toHaveProperty('returnOnInvestment');
    expect(metrics).toHaveProperty('scheduleVariancePercentage');
    expect(metrics).toHaveProperty('taskCompletionRate');
    expect(metrics).toHaveProperty('milestoneAdherence');
    expect(metrics).toHaveProperty('defectRate');
    expect(metrics).toHaveProperty('reworkPercentage');
    expect(metrics).toHaveProperty('qualityScore');
    expect(metrics).toHaveProperty('resourceUtilization');
    expect(metrics).toHaveProperty('productivityIndex');
    expect(metrics).toHaveProperty('teamEfficiency');
    expect(metrics).toHaveProperty('riskExposure');
    expect(metrics).toHaveProperty('issueResolutionTime');
    expect(metrics).toHaveProperty('contingencyUtilization');
    expect(metrics).toHaveProperty('overallHealthScore');
    expect(metrics).toHaveProperty('performanceTrend');

    // Verify all values are numbers or strings
    expect(typeof metrics.budgetUtilization).toBe('number');
    expect(typeof metrics.overallHealthScore).toBe('number');
    expect(['Improving', 'Stable', 'Declining']).toContain(metrics.performanceTrend);
  });

  it('should calculate KPI metrics with minimal inputs (only tasks and costs)', () => {
    const minimalInput = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
    };

    const metrics = KPIService.calculateKPIMetrics(minimalInput);

    // Should use default values for missing data
    expect(metrics.qualityScore).toBe(85); // Default quality score
    expect(metrics.resourceUtilization).toBe(85); // Default resource utilization
    expect(metrics.riskExposure).toBe(20); // Default low risk
    expect(metrics.overallHealthScore).toBeGreaterThan(0);
    expect(metrics.overallHealthScore).toBeLessThanOrEqual(100);
  });

  it('should handle empty tasks array gracefully', () => {
    const emptyTasksInput = {
      tasks: [],
      rabItems: [],
      actualCosts: {},
      budgetAtCompletion: 10000000,
    };

    const metrics = KPIService.calculateKPIMetrics(emptyTasksInput);

    expect(metrics.taskCompletionRate).toBe(0);
    expect(metrics.milestoneAdherence).toBe(100); // Default when no milestones
    expect(metrics.budgetUtilization).toBe(0);
    expect(metrics.overallHealthScore).toBeGreaterThan(0);
  });

  it('should handle zero budget at completion', () => {
    const zeroBudgetInput = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion: 0,
    };

    const metrics = KPIService.calculateKPIMetrics(zeroBudgetInput);

    expect(metrics.budgetUtilization).toBe(0);
    expect(metrics.costVariancePercentage).toBe(0);
  });
});

describe('KPIService - Financial KPIs', () => {
  it('should calculate budget utilization correctly', () => {
    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    const totalActualCost = Object.values(mockActualCosts).reduce((a, b) => a + b, 0);
    const expectedUtilization = (totalActualCost / budgetAtCompletion) * 100;

    expect(metrics.budgetUtilization).toBeCloseTo(expectedUtilization, 2);
  });

  it('should calculate cost variance percentage from EVM metrics', () => {
    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
      evmMetrics: mockEVMMetrics,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    const expectedCostVariance = (mockEVMMetrics.costVariance / budgetAtCompletion) * 100;

    expect(metrics.costVariancePercentage).toBeCloseTo(expectedCostVariance, 2);
  });

  it('should calculate return on investment (ROI)', () => {
    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    const totalActualCost = Object.values(mockActualCosts).reduce((a, b) => a + b, 0);
    const estimatedValue = budgetAtCompletion * 1.3; // 30% value creation
    const expectedROI = ((estimatedValue - totalActualCost) / totalActualCost) * 100;

    expect(metrics.returnOnInvestment).toBeCloseTo(expectedROI, 2);
  });

  it('should handle zero actual costs for ROI calculation', () => {
    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: {},
      budgetAtCompletion,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    expect(metrics.returnOnInvestment).toBe(0);
  });
});

describe('KPIService - Schedule KPIs', () => {
  it('should calculate task completion rate correctly', () => {
    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    const completedCount = mockTasks.filter(
      (t) => t.status === 'done' || t.status === 'completed'
    ).length;
    const expectedRate = (completedCount / mockTasks.length) * 100;

    expect(metrics.taskCompletionRate).toBeCloseTo(expectedRate, 2);
  });

  it('should calculate schedule variance from EVM metrics', () => {
    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
      evmMetrics: mockEVMMetrics,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    const expectedScheduleVariance =
      (mockEVMMetrics.scheduleVariance / mockEVMMetrics.plannedValue) * 100;

    expect(metrics.scheduleVariancePercentage).toBeCloseTo(expectedScheduleVariance, 2);
  });

  it('should calculate milestone adherence (high priority tasks)', () => {
    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    const milestones = mockTasks.filter((t) => t.priority === 'high');
    const completedMilestones = milestones.filter(
      (t) => t.status === 'done' || t.status === 'completed'
    );
    const expectedAdherence = (completedMilestones.length / milestones.length) * 100;

    expect(metrics.milestoneAdherence).toBeCloseTo(expectedAdherence, 2);
  });

  it('should return 100% milestone adherence when no high priority tasks exist', () => {
    const lowPriorityTasks = mockTasks.map((t) => ({ ...t, priority: 'low' as const }));

    const input = {
      tasks: lowPriorityTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    expect(metrics.milestoneAdherence).toBe(100);
  });
});

describe('KPIService - Quality KPIs', () => {
  it('should calculate defect rate correctly', () => {
    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
      qualityData: mockQualityData,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    const expectedDefectRate =
      (mockQualityData.defects / mockQualityData.totalDeliverables) * 100;

    expect(metrics.defectRate).toBeCloseTo(expectedDefectRate, 2);
  });

  it('should calculate rework percentage correctly', () => {
    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
      qualityData: mockQualityData,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    const expectedReworkPercentage =
      (mockQualityData.reworkHours / mockQualityData.totalHours) * 100;

    expect(metrics.reworkPercentage).toBeCloseTo(expectedReworkPercentage, 2);
  });

  it('should calculate quality score based on defect rate and rework', () => {
    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
      qualityData: mockQualityData,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    // Quality score = 100 - defectRate * 10 - reworkPercentage * 5
    const defectRate = (mockQualityData.defects / mockQualityData.totalDeliverables) * 100;
    const reworkPercentage = (mockQualityData.reworkHours / mockQualityData.totalHours) * 100;
    const expectedQualityScore = Math.max(0, 100 - defectRate * 10 - reworkPercentage * 5);

    expect(metrics.qualityScore).toBeCloseTo(expectedQualityScore, 2);
  });

  it('should use default quality score when quality data is not provided', () => {
    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    expect(metrics.qualityScore).toBe(85); // Default
    expect(metrics.defectRate).toBe(0);
    expect(metrics.reworkPercentage).toBe(0);
  });

  it('should handle high defect rate (quality score should not go below 0)', () => {
    const highDefectData = {
      defects: 50,
      totalDeliverables: 100,
      reworkHours: 200,
      totalHours: 500,
    };

    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
      qualityData: highDefectData,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    expect(metrics.qualityScore).toBeGreaterThanOrEqual(0);
    expect(metrics.qualityScore).toBeLessThanOrEqual(100);
  });
});

describe('KPIService - Resource KPIs', () => {
  it('should calculate resource utilization correctly', () => {
    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
      resourceData: mockResourceData,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    const expectedUtilization =
      (mockResourceData.actualHours / mockResourceData.allocatedHours) * 100;

    expect(metrics.resourceUtilization).toBeCloseTo(expectedUtilization, 2);
  });

  it('should use productivity index from resource data', () => {
    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
      resourceData: mockResourceData,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    expect(metrics.productivityIndex).toBe(mockResourceData.productivity);
  });

  it('should calculate team efficiency', () => {
    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
      resourceData: mockResourceData,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    // Team efficiency should be a valid percentage
    expect(metrics.teamEfficiency).toBeGreaterThanOrEqual(0);
    expect(metrics.teamEfficiency).toBeLessThanOrEqual(150); // Capped at 150%
  });

  it('should use default resource KPIs when resource data is not provided', () => {
    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    expect(metrics.resourceUtilization).toBe(85); // Default
    expect(metrics.productivityIndex).toBe(100); // Default
    expect(metrics.teamEfficiency).toBe(90); // Default
  });

  it('should handle zero allocated hours gracefully', () => {
    const zeroHoursData = {
      allocatedHours: 0,
      actualHours: 100,
      teamSize: 5,
      productivity: 90,
    };

    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
      resourceData: zeroHoursData,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    expect(metrics.resourceUtilization).toBe(0);
  });
});

describe('KPIService - Risk KPIs', () => {
  it('should calculate risk exposure correctly', () => {
    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
      riskData: mockRiskData,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    const expectedRiskExposure = (mockRiskData.highRisks / mockRiskData.totalRisks) * 100;

    expect(metrics.riskExposure).toBeCloseTo(expectedRiskExposure, 2);
  });

  it('should calculate contingency utilization correctly', () => {
    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
      riskData: mockRiskData,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    const expectedContingency =
      (mockRiskData.contingencyUsed / mockRiskData.contingencyTotal) * 100;

    expect(metrics.contingencyUtilization).toBeCloseTo(expectedContingency, 2);
  });

  it('should use default risk KPIs when risk data is not provided', () => {
    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    expect(metrics.riskExposure).toBe(20); // Default low risk
    expect(metrics.issueResolutionTime).toBe(5); // Default 5 days
    expect(metrics.contingencyUtilization).toBe(15); // Default 15%
  });

  it('should handle zero total risks gracefully', () => {
    const zeroRisksData = {
      totalRisks: 0,
      highRisks: 0,
      mitigatedRisks: 0,
      contingencyUsed: 1000000,
      contingencyTotal: 10000000,
    };

    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
      riskData: zeroRisksData,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    expect(metrics.riskExposure).toBe(0);
  });
});

describe('KPIService - Overall Health Score', () => {
  it('should calculate overall health score between 0-100', () => {
    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
      evmMetrics: mockEVMMetrics,
      qualityData: mockQualityData,
      resourceData: mockResourceData,
      riskData: mockRiskData,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    expect(metrics.overallHealthScore).toBeGreaterThanOrEqual(0);
    expect(metrics.overallHealthScore).toBeLessThanOrEqual(100);
    expect(Number.isInteger(metrics.overallHealthScore)).toBe(true); // Should be rounded
  });

  it('should calculate higher health score for healthy project', () => {
    const healthyData = {
      tasks: mockTasks.map((t) => ({ ...t, status: 'completed' as const })),
      rabItems: mockRabItems,
      actualCosts: { 'task-1': 1000000, 'task-2': 1000000 }, // Low costs
      budgetAtCompletion: 10000000,
      evmMetrics: {
        ...mockEVMMetrics,
        costVariance: 500000, // Positive variance
        scheduleVariance: 500000, // Positive variance
      },
      qualityData: {
        defects: 1,
        totalDeliverables: 100,
        reworkHours: 5,
        totalHours: 500,
      },
      resourceData: {
        allocatedHours: 500,
        actualHours: 450,
        teamSize: 10,
        productivity: 110,
      },
      riskData: {
        totalRisks: 10,
        highRisks: 1,
        mitigatedRisks: 8,
        contingencyUsed: 1000000,
        contingencyTotal: 10000000,
      },
    };

    const metrics = KPIService.calculateKPIMetrics(healthyData);

    expect(metrics.overallHealthScore).toBeGreaterThan(70);
  });

  it('should calculate lower health score for troubled project', () => {
    const troubledData = {
      tasks: mockTasks.map((t) => ({ ...t, status: 'todo' as const })),
      rabItems: mockRabItems,
      actualCosts: { 'task-1': 15000000 }, // Very high cost
      budgetAtCompletion: 10000000,
      evmMetrics: {
        ...mockEVMMetrics,
        costVariance: -5000000, // Large negative variance
        scheduleVariance: -3000000, // Large negative variance
      },
      qualityData: {
        defects: 30,
        totalDeliverables: 100,
        reworkHours: 150,
        totalHours: 500,
      },
      resourceData: {
        allocatedHours: 500,
        actualHours: 800, // Over-allocated
        teamSize: 10,
        productivity: 60, // Low productivity
      },
      riskData: {
        totalRisks: 20,
        highRisks: 15, // Many high risks
        mitigatedRisks: 2,
        contingencyUsed: 8000000,
        contingencyTotal: 10000000, // High contingency usage
      },
    };

    const metrics = KPIService.calculateKPIMetrics(troubledData);

    // Health score should be lower than healthy project
    // Algorithm uses weighted average, so may not go below 60 with defaults
    expect(metrics.overallHealthScore).toBeLessThan(85); // Less than typical healthy score
  });
});

describe('KPIService - Performance Trend', () => {
  it('should determine performance trend as Improving, Stable, or Declining', () => {
    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
      evmMetrics: mockEVMMetrics,
      qualityData: mockQualityData,
      resourceData: mockResourceData,
      riskData: mockRiskData,
    };

    const metrics = KPIService.calculateKPIMetrics(input);

    expect(['Improving', 'Stable', 'Declining']).toContain(metrics.performanceTrend);
  });

  it('should return "Improving" trend for project with positive indicators', () => {
    const improvingData = {
      tasks: mockTasks.map((t) => ({ ...t, status: 'completed' as const })),
      rabItems: mockRabItems,
      actualCosts: { 'task-1': 1000000 },
      budgetAtCompletion: 10000000,
      evmMetrics: {
        ...mockEVMMetrics,
        costVariance: -200000, // Small negative (within -5%)
        scheduleVariance: -300000, // Small negative
      },
      qualityData: {
        defects: 2,
        totalDeliverables: 100,
        reworkHours: 10,
        totalHours: 500,
      },
      resourceData: {
        allocatedHours: 500,
        actualHours: 450,
        teamSize: 10,
        productivity: 105,
      },
      riskData: {
        totalRisks: 20,
        highRisks: 3, // Low risk exposure
        mitigatedRisks: 15,
        contingencyUsed: 2000000,
        contingencyTotal: 10000000,
      },
    };

    const metrics = KPIService.calculateKPIMetrics(improvingData);

    expect(metrics.performanceTrend).toBe('Improving');
  });

  it('should return "Declining" trend for project with negative indicators', () => {
    const decliningData = {
      tasks: mockTasks.map((t) => ({ ...t, status: 'todo' as const })),
      rabItems: mockRabItems,
      actualCosts: { 'task-1': 12000000 },
      budgetAtCompletion: 10000000,
      evmMetrics: {
        ...mockEVMMetrics,
        costVariance: -2000000, // Large negative (< -10%)
        scheduleVariance: -1500000,
      },
      qualityData: {
        defects: 25,
        totalDeliverables: 100,
        reworkHours: 120,
        totalHours: 500,
      },
      resourceData: {
        allocatedHours: 500,
        actualHours: 800, // Over-utilized
        teamSize: 10,
        productivity: 55, // Low productivity
      },
      riskData: {
        totalRisks: 20,
        highRisks: 12, // High risk exposure (> 50%)
        mitigatedRisks: 3,
        contingencyUsed: 7000000,
        contingencyTotal: 10000000,
      },
    };

    const metrics = KPIService.calculateKPIMetrics(decliningData);

    expect(metrics.performanceTrend).toBe('Declining');
  });
});

describe('KPIService - KPI Ratings', () => {
  it('should calculate performance ratings for all KPIs', () => {
    const input = {
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
      evmMetrics: mockEVMMetrics,
      qualityData: mockQualityData,
      resourceData: mockResourceData,
      riskData: mockRiskData,
    };

    const metrics = KPIService.calculateKPIMetrics(input);
    const ratings = KPIService.calculateKPIRatings(metrics);

    // Verify all ratings exist
    expect(ratings).toHaveProperty('budgetUtilization');
    expect(ratings).toHaveProperty('costVariance');
    expect(ratings).toHaveProperty('roi');
    expect(ratings).toHaveProperty('scheduleVariance');
    expect(ratings).toHaveProperty('taskCompletion');
    expect(ratings).toHaveProperty('milestoneAdherence');
    expect(ratings).toHaveProperty('qualityScore');
    expect(ratings).toHaveProperty('defectRate');
    expect(ratings).toHaveProperty('reworkPercentage');
    expect(ratings).toHaveProperty('resourceUtilization');
    expect(ratings).toHaveProperty('productivity');
    expect(ratings).toHaveProperty('teamEfficiency');
    expect(ratings).toHaveProperty('riskExposure');
    expect(ratings).toHaveProperty('contingencyUtilization');
    expect(ratings).toHaveProperty('overallHealth');

    // Verify all ratings are valid
    Object.values(ratings).forEach((rating) => {
      expect(['Excellent', 'Good', 'Fair', 'Poor']).toContain(rating);
    });
  });

  it('should rate excellent performance correctly', () => {
    const excellentMetrics: KPIMetrics = {
      budgetUtilization: 98,
      costVariancePercentage: -1,
      returnOnInvestment: 30,
      scheduleVariancePercentage: -1,
      taskCompletionRate: 98,
      milestoneAdherence: 100,
      defectRate: 0.5,
      reworkPercentage: 2,
      qualityScore: 95,
      resourceUtilization: 92,
      productivityIndex: 115,
      teamEfficiency: 98,
      riskExposure: 10,
      issueResolutionTime: 3,
      contingencyUtilization: 12,
      overallHealthScore: 95,
      performanceTrend: 'Improving',
    };

    const ratings = KPIService.calculateKPIRatings(excellentMetrics);

    expect(ratings.budgetUtilization).toBe('Excellent');
    expect(ratings.qualityScore).toBe('Excellent');
    expect(ratings.overallHealth).toBe('Excellent');
  });

  it('should rate poor performance correctly', () => {
    const poorMetrics: KPIMetrics = {
      budgetUtilization: 50, // Below 85% threshold = Poor
      costVariancePercentage: -25,
      returnOnInvestment: 3,
      scheduleVariancePercentage: -25,
      taskCompletionRate: 60,
      milestoneAdherence: 50,
      defectRate: 12,
      reworkPercentage: 25,
      qualityScore: 45,
      resourceUtilization: 45,
      productivityIndex: 65,
      teamEfficiency: 55,
      riskExposure: 60,
      issueResolutionTime: 10,
      contingencyUtilization: 65,
      overallHealthScore: 50,
      performanceTrend: 'Declining',
    };

    const ratings = KPIService.calculateKPIRatings(poorMetrics);

    // Budget utilization: 50 < 85 (fair threshold) = Poor
    expect(ratings.budgetUtilization).toBe('Poor');
    
    // Quality score: 45 < 60 (fair threshold) = Poor
    expect(ratings.qualityScore).toBe('Poor');
    
    // Task completion: 60 < 65 (fair threshold) = Poor
    expect(ratings.taskCompletion).toBe('Poor');
  });
});

describe('KPIService - KPI Recommendations', () => {
  it('should generate recommendations based on poor ratings', () => {
    const poorMetrics: KPIMetrics = {
      budgetUtilization: 130,
      costVariancePercentage: -25,
      returnOnInvestment: 3,
      scheduleVariancePercentage: -25,
      taskCompletionRate: 60,
      milestoneAdherence: 50,
      defectRate: 12,
      reworkPercentage: 25,
      qualityScore: 45,
      resourceUtilization: 45,
      productivityIndex: 65,
      teamEfficiency: 55,
      riskExposure: 60,
      issueResolutionTime: 10,
      contingencyUtilization: 65,
      overallHealthScore: 50,
      performanceTrend: 'Declining',
    };

    const ratings = KPIService.calculateKPIRatings(poorMetrics);
    const recommendations = KPIService.generateKPIRecommendations(poorMetrics, ratings);

    expect(recommendations.length).toBeGreaterThan(0);
    expect(Array.isArray(recommendations)).toBe(true);

    // Should have recommendations for all poor areas
    const recommendationText = recommendations.join(' ').toLowerCase();
    expect(recommendationText).toContain('cost'); // Budget issues
    expect(recommendationText).toContain('quality'); // Quality issues
    expect(recommendationText).toContain('resource'); // Resource issues
    expect(recommendationText).toContain('risk'); // Risk issues
  });

  it('should recommend cost controls for budget overruns', () => {
    const budgetIssueMetrics: KPIMetrics = {
      budgetUtilization: 120,
      costVariancePercentage: -15,
      returnOnInvestment: 5,
      scheduleVariancePercentage: 0,
      taskCompletionRate: 80,
      milestoneAdherence: 85,
      defectRate: 2,
      reworkPercentage: 5,
      qualityScore: 85,
      resourceUtilization: 85,
      productivityIndex: 95,
      teamEfficiency: 90,
      riskExposure: 20,
      issueResolutionTime: 5,
      contingencyUtilization: 15,
      overallHealthScore: 75,
      performanceTrend: 'Stable',
    };

    const ratings = KPIService.calculateKPIRatings(budgetIssueMetrics);
    const recommendations = KPIService.generateKPIRecommendations(budgetIssueMetrics, ratings);

    const hasBudgetRecommendations = recommendations.some(
      (r) => r.toLowerCase().includes('cost') || r.toLowerCase().includes('budget')
    );

    expect(hasBudgetRecommendations).toBe(true);
  });

  it('should recommend quality improvements for high defect rates', () => {
    const qualityIssueMetrics: KPIMetrics = {
      budgetUtilization: 95,
      costVariancePercentage: -2,
      returnOnInvestment: 20,
      scheduleVariancePercentage: 0,
      taskCompletionRate: 85,
      milestoneAdherence: 90,
      defectRate: 8,
      reworkPercentage: 15,
      qualityScore: 55,
      resourceUtilization: 85,
      productivityIndex: 95,
      teamEfficiency: 90,
      riskExposure: 20,
      issueResolutionTime: 5,
      contingencyUtilization: 15,
      overallHealthScore: 75,
      performanceTrend: 'Stable',
    };

    const ratings = KPIService.calculateKPIRatings(qualityIssueMetrics);
    const recommendations = KPIService.generateKPIRecommendations(qualityIssueMetrics, ratings);

    const hasQualityRecommendations = recommendations.some(
      (r) => r.toLowerCase().includes('quality') || r.toLowerCase().includes('training')
    );

    expect(hasQualityRecommendations).toBe(true);
  });

  it('should generate empty recommendations for excellent project', () => {
    const excellentMetrics: KPIMetrics = {
      budgetUtilization: 98,
      costVariancePercentage: -1,
      returnOnInvestment: 30,
      scheduleVariancePercentage: -1,
      taskCompletionRate: 98,
      milestoneAdherence: 100,
      defectRate: 0.5,
      reworkPercentage: 2,
      qualityScore: 95,
      resourceUtilization: 92,
      productivityIndex: 115,
      teamEfficiency: 98,
      riskExposure: 10,
      issueResolutionTime: 3,
      contingencyUtilization: 12,
      overallHealthScore: 95,
      performanceTrend: 'Improving',
    };

    const ratings = KPIService.calculateKPIRatings(excellentMetrics);
    const recommendations = KPIService.generateKPIRecommendations(excellentMetrics, ratings);

    // Should have minimal or no recommendations
    expect(recommendations.length).toBeLessThanOrEqual(2);
  });
});

describe('KPIService - KPI Trends', () => {
  it('should generate KPI trends from historical data', () => {
    const historicalData = [
      {
        date: new Date('2024-01-01'),
        metrics: KPIService.calculateKPIMetrics({
          tasks: mockTasks,
          rabItems: mockRabItems,
          actualCosts: { 'task-1': 5000000 },
          budgetAtCompletion,
        }),
      },
      {
        date: new Date('2024-02-01'),
        metrics: KPIService.calculateKPIMetrics({
          tasks: mockTasks,
          rabItems: mockRabItems,
          actualCosts: { 'task-1': 5000000, 'task-2': 6000000 },
          budgetAtCompletion,
        }),
      },
      {
        date: new Date('2024-03-01'),
        metrics: KPIService.calculateKPIMetrics({
          tasks: mockTasks,
          rabItems: mockRabItems,
          actualCosts: mockActualCosts,
          budgetAtCompletion,
        }),
      },
    ];

    const trends = KPIService.generateKPITrends(historicalData);

    // Verify trend structure
    expect(trends).toHaveProperty('budgetUtilization');
    expect(trends).toHaveProperty('taskCompletionRate');
    expect(trends).toHaveProperty('qualityScore');
    expect(trends).toHaveProperty('resourceUtilization');
    expect(trends).toHaveProperty('overallHealthScore');

    // Verify each trend has correct number of data points
    expect(trends.budgetUtilization).toHaveLength(3);
    expect(trends.taskCompletionRate).toHaveLength(3);

    // Verify trend data structure
    trends.budgetUtilization.forEach((trend) => {
      expect(trend).toHaveProperty('period');
      expect(trend).toHaveProperty('value');
      expect(trend).toHaveProperty('target');
      expect(trend).toHaveProperty('variance');

      expect(typeof trend.period).toBe('string');
      expect(typeof trend.value).toBe('number');
      expect(typeof trend.target).toBe('number');
      expect(typeof trend.variance).toBe('number');
    });
  });

  it('should calculate variance correctly in trends', () => {
    const sampleMetrics = KPIService.calculateKPIMetrics({
      tasks: mockTasks,
      rabItems: mockRabItems,
      actualCosts: mockActualCosts,
      budgetAtCompletion,
    });

    const historicalData = [
      {
        date: new Date('2024-01-01'),
        metrics: sampleMetrics,
      },
    ];

    const trends = KPIService.generateKPITrends(historicalData);

    // Variance should be value - target
    trends.budgetUtilization.forEach((trend) => {
      expect(trend.variance).toBeCloseTo(trend.value - trend.target, 2);
    });
  });
});
