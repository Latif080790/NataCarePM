import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aiResourceService } from '../../api/aiResourceService';
import { GeneticAlgorithmOptimizer } from '../../api/aiResourceService';

describe('AI Resource Service - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Genetic Algorithm Optimizer', () => {
    it('should create optimizer instance with configuration', () => {
      const config = {
        populationSize: 50,
        maxGenerations: 100,
        mutationRate: 0.05,
        crossoverRate: 0.7,
        elitismRate: 0.2,
        fitnessFunction: 'cost' as const,
        selectionMethod: 'tournament' as const,
        tournamentSize: 3,
        convergenceThreshold: 0.01,
      };

      const optimizer = new GeneticAlgorithmOptimizer(config);
      
      expect(optimizer).toBeDefined();
      // Test that config is properly stored
      expect(optimizer['config'].populationSize).toBe(50);
      expect(optimizer['config'].mutationRate).toBe(0.05);
    });

    it('should initialize population correctly', () => {
      const config = {
        populationSize: 10,
        maxGenerations: 50,
        mutationRate: 0.1,
        crossoverRate: 0.8,
        elitismRate: 0.1,
        fitnessFunction: 'composite' as const,
        selectionMethod: 'tournament' as const,
        tournamentSize: 5,
        convergenceThreshold: 0.001,
      };

      const optimizer = new GeneticAlgorithmOptimizer(config);
      
      // Mock the createRandomAllocation method to avoid complex dependencies
      const mockCreateRandomAllocation = vi.fn().mockReturnValue([
        {
          allocationId: 'test-alloc-1',
          resourceId: 'resource-1',
          resourceType: 'worker' as const,
          projectId: 'project-1',
          taskId: 'task-1',
          startDate: new Date(),
          endDate: new Date(),
          allocationPercentage: 50,
          estimatedCost: 1000,
          status: 'planned' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test',
        }
      ]);
      
      optimizer['createRandomAllocation'] = mockCreateRandomAllocation;
      
      const tasks = [{ id: 'task-1', projectId: 'project-1' }];
      const resources = [
        {
          id: 'resource-1',
          type: 'human' as const,
          name: 'Test Worker',
          category: 'worker' as const,
          availability: [],
          costPerHour: 50,
          status: 'available' as const,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
        }
      ];
      
      optimizer['initializePopulation'](tasks, resources);
      
      expect(optimizer['population']).toHaveLength(10);
      expect(mockCreateRandomAllocation).toHaveBeenCalled();
    });

    it('should map resource types correctly', () => {
      const config = {
        populationSize: 10,
        maxGenerations: 50,
        mutationRate: 0.1,
        crossoverRate: 0.8,
        elitismRate: 0.1,
        fitnessFunction: 'composite' as const,
        selectionMethod: 'tournament' as const,
        tournamentSize: 5,
        convergenceThreshold: 0.001,
      };

      const optimizer = new GeneticAlgorithmOptimizer(config);
      
      expect(optimizer['mapResourceType']('human')).toBe('worker');
      expect(optimizer['mapResourceType']('equipment')).toBe('equipment');
      expect(optimizer['mapResourceType']('material')).toBe('material');
      expect(optimizer['mapResourceType']('unknown')).toBe('unknown');
    });

    it('should calculate variance correctly', () => {
      const config = {
        populationSize: 10,
        maxGenerations: 50,
        mutationRate: 0.1,
        crossoverRate: 0.8,
        elitismRate: 0.1,
        fitnessFunction: 'composite' as const,
        selectionMethod: 'tournament' as const,
        tournamentSize: 5,
        convergenceThreshold: 0.001,
      };

      const optimizer = new GeneticAlgorithmOptimizer(config);
      
      const values = [1, 2, 3, 4, 5];
      const variance = optimizer['calculateVariance'](values);
      
      // Expected variance calculation:
      // Mean = 3
      // Squared diffs = [4, 1, 0, 1, 4]
      // Variance = 10/5 = 2
      expect(variance).toBeCloseTo(2, 5);
    });

    it('should detect convergence correctly', () => {
      const config = {
        populationSize: 10,
        maxGenerations: 50,
        mutationRate: 0.1,
        crossoverRate: 0.8,
        elitismRate: 0.1,
        fitnessFunction: 'composite' as const,
        selectionMethod: 'tournament' as const,
        tournamentSize: 5,
        convergenceThreshold: 0.001,
      };

      const optimizer = new GeneticAlgorithmOptimizer(config);
      
      // Test with insufficient history (less than 10 values)
      const shortHistory = [0.5, 0.6, 0.7];
      expect(optimizer['hasConverged'](shortHistory)).toBe(false);
      
      // Test with converged history (low variance)
      const convergedHistory = [0.85, 0.851, 0.849, 0.852, 0.848, 0.851, 0.85, 0.849, 0.851, 0.85];
      expect(optimizer['hasConverged'](convergedHistory)).toBe(true);
      
      // Test with non-converged history (high variance)
      const nonConvergedHistory = [0.1, 0.9, 0.2, 0.8, 0.3, 0.7, 0.4, 0.6, 0.5, 0.55];
      expect(optimizer['hasConverged'](nonConvergedHistory)).toBe(false);
    });
  });

  describe('AI Resource Service Core Functions', () => {
    it('should have all required methods', () => {
      expect(typeof aiResourceService.initializeModels).toBe('function');
      expect(typeof aiResourceService.optimizeResources).toBe('function');
      expect(typeof aiResourceService['mapOptimizationGoal']).toBe('function');
      expect(typeof aiResourceService['fetchOptimizationData']).toBe('function');
      expect(typeof aiResourceService['generateRecommendations']).toBe('function');
      expect(typeof aiResourceService['createSchedulingPlan']).toBe('function');
      expect(typeof aiResourceService['calculateOptimizationMetrics']).toBe('function');
      expect(typeof aiResourceService['generateAlternatives']).toBe('function');
      expect(typeof aiResourceService['detectWarnings']).toBe('function');
      expect(typeof aiResourceService['loadTrainingData']).toBe('function');
      expect(typeof aiResourceService['saveOptimizationResult']).toBe('function');
    });

    it('should map optimization goals correctly', () => {
      expect(aiResourceService['mapOptimizationGoal']('minimize_cost')).toBe('cost');
      expect(aiResourceService['mapOptimizationGoal']('minimize_duration')).toBe('time');
      expect(aiResourceService['mapOptimizationGoal']('maximize_quality')).toBe('quality');
      expect(aiResourceService['mapOptimizationGoal']('balance_cost_time')).toBe('composite');
      expect(aiResourceService['mapOptimizationGoal']('unknown')).toBe('composite');
    });

    it('should detect warnings correctly', () => {
      const genome = [
        {
          allocationId: 'alloc-1',
          resourceId: 'resource-1',
          resourceType: 'worker' as const,
          projectId: 'project-1',
          taskId: 'task-1',
          startDate: new Date(),
          endDate: new Date(),
          allocationPercentage: 50,
          estimatedCost: 60000,
          status: 'planned' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test',
        }
      ];
      
      const constraints = {
        budgetLimit: 50000,
      };
      
      const warnings = aiResourceService['detectWarnings'](genome, constraints);
      
      expect(warnings).toHaveLength(1);
      expect(warnings[0].category).toBe('budget_overrun');
      expect(warnings[0].severity).toBe('critical');
    });

    it('should calculate optimization metrics correctly', () => {
      const genome = [
        {
          allocationId: 'alloc-1',
          resourceId: 'resource-1',
          resourceType: 'worker' as const,
          projectId: 'project-1',
          taskId: 'task-1',
          startDate: new Date(),
          endDate: new Date(),
          allocationPercentage: 50,
          estimatedCost: 10000,
          status: 'planned' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test',
        }
      ];
      
      const tasks = [
        {
          id: 'task-1',
          projectId: 'project-1',
          name: 'Test Task',
          volume: 100,
          unit: 'units',
          unitPrice: 150,
          startDate: new Date(),
          endDate: new Date(),
        }
      ];
      
      const resources: any[] = [
        {
          id: 'resource-1',
          type: 'human' as const,
          name: 'Test Worker',
          category: 'worker' as const,
          availability: [],
          costPerHour: 50,
          status: 'available' as const,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
        }
      ];
      
      const metrics = aiResourceService['calculateOptimizationMetrics'](genome, tasks, resources);
      
      expect(metrics).toBeDefined();
      expect(metrics.costSavings).toBeGreaterThanOrEqual(0);
      expect(metrics.costSavingsPercentage).toBeGreaterThanOrEqual(0);
      expect(metrics.resourceUtilizationAvg).toBeGreaterThanOrEqual(0);
    });

    it('should generate alternative scenarios', () => {
      const fitnessHistory = [0.5, 0.6, 0.7, 0.8];
      const tasks: any[] = [];
      const resources: any[] = [];
      
      const alternatives = aiResourceService['generateAlternatives'](fitnessHistory, tasks, resources);
      
      expect(alternatives).toHaveLength(2);
      expect(alternatives[0].scenarioName).toBe('Cost Optimized');
      expect(alternatives[1].scenarioName).toBe('Time Optimized');
    });
  });
});