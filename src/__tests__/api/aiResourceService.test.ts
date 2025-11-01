import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aiResourceService } from '../../api/aiResourceService';
import * as tf from '@tensorflow/tfjs';

// Mock TensorFlow.js
vi.mock('@tensorflow/tfjs', () => {
  const mockModel = {
    add: vi.fn().mockReturnThis(),
    compile: vi.fn(),
    fit: vi.fn().mockResolvedValue({ history: {} }),
    predict: vi.fn().mockReturnValue({
      array: vi.fn().mockResolvedValue([[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]]),
    }),
    dispose: vi.fn(),
  };

  return {
    default: {},
    sequential: vi.fn().mockReturnValue(mockModel),
    layers: {
      dense: vi.fn().mockReturnValue({}),
      dropout: vi.fn().mockReturnValue({}),
      lstm: vi.fn().mockReturnValue({}),
    },
    train: {
      adam: vi.fn(),
    },
    tensor2d: vi.fn().mockReturnValue({
      dispose: vi.fn(),
    }),
  };
});

// Mock Firebase
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockTimestamp = {
  fromDate: vi.fn().mockImplementation((date) => date),
  now: vi.fn().mockImplementation(() => new Date()),
};

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  getDocs: mockGetDocs,
  addDoc: mockAddDoc,
  updateDoc: mockUpdateDoc,
  query: mockQuery,
  where: mockWhere,
  Timestamp: mockTimestamp,
}));

vi.mock('@/firebaseConfig', () => ({
  db: {},
}));

describe('AI Resource Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('MLModelManager', () => {
    it('should build resource allocation model successfully', async () => {
      const model = await aiResourceService['modelManager'].buildResourceAllocationModel();
      
      expect(model).toBeDefined();
      expect(tf.sequential).toHaveBeenCalled();
    });

    it('should build duration prediction model successfully', async () => {
      const model = await aiResourceService['modelManager'].buildDurationPredictionModel();
      
      expect(model).toBeDefined();
      expect(tf.sequential).toHaveBeenCalled();
    });

    it('should train model with dataset', async () => {
      const mockModel = {
        fit: vi.fn().mockResolvedValue({ history: {} }),
      };
      
      const trainingData = {
        datasetId: 'test_dataset',
        name: 'Test Dataset',
        description: 'Test training data',
        dataPoints: [
          {
            dataId: 'data1',
            projectId: 'project1',
            features: {
              taskComplexity: 5,
              taskDuration: 40,
              requiredSkills: [],
              budgetAmount: 10000,
              workerExperienceYears: 3,
              workerProficiencyLevel: 4,
              equipmentAge: 2,
              equipmentCondition: 4,
              season: 'summer' as const,
              weatherConditions: 'sunny',
              siteAccessibility: 4,
              previousProjectsCount: 10,
              averageDelayDays: 2,
              averageCostOverrun: 5,
            },
            labels: {
              actualDuration: 45,
              actualCost: 11000,
              qualityScore: 85,
              successRate: 0.9,
              delayDays: 5,
              costOverrunPercentage: 10,
            },
            timestamp: new Date(),
          },
        ],
        splitRatio: { training: 0.7, validation: 0.15, testing: 0.15 },
        createdAt: new Date(),
        updatedAt: new Date(),
        normalizationParams: {
          mean: [5, 40, 10000, 3, 4, 2, 4, 0, 4, 10, 2, 5],
          std: [1, 10, 2000, 1, 1, 1, 1, 1, 1, 5, 1, 2],
          min: [1, 1, 1000, 1, 1, 0, 1, 0, 1, 0, 0, 0],
          max: [10, 100, 50000, 20, 5, 10, 5, 1, 5, 50, 10, 20],
        },
      };

      const metadata = await aiResourceService['modelManager'].trainModel(
        'test_model',
        mockModel as any,
        trainingData
      );

      expect(metadata).toBeDefined();
      expect(metadata.modelId).toBe('test_model');
      expect(metadata.accuracy).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GeneticAlgorithmOptimizer', () => {
    it('should optimize resource allocation', async () => {
      const tasks = [
        {
          id: 'task1',
          projectId: 'project1',
          name: 'Foundation Work',
          volume: 100,
          unit: 'm3',
          unitPrice: 500,
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-01-31'),
        },
      ];

      const resources = [
        {
          id: 'resource1',
          type: 'human',
          name: 'John Doe',
          category: 'worker',
          availability: [],
          costPerHour: 50,
          status: 'available',
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
        },
      ];

      const constraints = {
        budgetLimit: 50000,
        deadlineDate: new Date('2023-02-15'),
      };

      const config = {
        populationSize: 10,
        maxGenerations: 5,
        mutationRate: 0.1,
        crossoverRate: 0.8,
        elitismRate: 0.1,
        fitnessFunction: 'composite',
        selectionMethod: 'tournament',
        tournamentSize: 3,
        convergenceThreshold: 0.01,
      };

      const optimizer = new (aiResourceService as any).constructor()['gaOptimizer'].constructor(config);
      const result = await optimizer.optimize(tasks, resources, constraints);

      expect(result).toBeDefined();
      expect(result.bestFitness).toBeGreaterThanOrEqual(0);
      expect(result.generationsRun).toBeGreaterThanOrEqual(0);
    });
  });

  describe('AIResourceService', () => {
    it('should initialize models successfully', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            data: () => ({
              dataId: 'data1',
              projectId: 'project1',
              features: {},
              labels: {},
              timestamp: new Date(),
            }),
          },
        ],
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await aiResourceService.initializeModels();

      expect(consoleSpy).toHaveBeenCalledWith('Initializing AI models...');
      expect(consoleSpy).toHaveBeenCalledWith('Resource Allocation model trained successfully');

      consoleSpy.mockRestore();
    });

    it('should optimize resources successfully', async () => {
      // Mock Firebase responses
      mockGetDocs
        .mockResolvedValueOnce({
          docs: [
            {
              id: 'project1',
              data: () => ({
                id: 'project1',
                name: 'Test Project',
                startDate: new Date('2023-01-01'),
                items: [
                  {
                    id: 1,
                    uraian: 'Foundation Work',
                    volume: 100,
                    satuan: 'm3',
                    hargaSatuan: 500,
                  },
                ],
              }),
            },
          ],
        })
        .mockResolvedValueOnce({
          docs: [
            {
              id: 'resource1',
              data: () => ({
                id: 'resource1',
                name: 'Test Resource',
                type: 'human',
                category: 'worker',
                availability: [],
                costPerHour: 50,
                status: 'available',
                metadata: {},
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'system',
              }),
            },
          ],
        });

      mockAddDoc.mockResolvedValue({ id: 'result1' });

      const request = {
        requestId: 'request1',
        projectIds: ['project1'],
        optimizationGoal: 'minimize_cost' as const,
        constraints: {
          budgetLimit: 50000,
        },
        preferences: {},
        timeHorizon: {
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-12-31'),
        },
        requestedAt: new Date(),
        requestedBy: 'user1',
      };

      const result = await aiResourceService.optimizeResources(request);

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.recommendations).toHaveLength(1);
    });

    it('should map optimization goals correctly', () => {
      const service = aiResourceService as any;
      
      expect(service.mapOptimizationGoal('minimize_cost')).toBe('cost');
      expect(service.mapOptimizationGoal('minimize_duration')).toBe('time');
      expect(service.mapOptimizationGoal('maximize_quality')).toBe('quality');
      expect(service.mapOptimizationGoal('unknown_goal')).toBe('composite');
    });
  });
});