/**
 * ML Models Unit Tests
 * NataCarePM - Phase 4: AI & Analytics
 *
 * Comprehensive unit tests for machine learning models,
 * genetic algorithms, and predictive analytics
 */

import * as tf from '@tensorflow/tfjs';
import { TimeSeriesForecaster } from '@/api/predictiveAnalyticsService';
import { MLModelManager, GeneticAlgorithmOptimizer } from '@/api/aiResourceService';
import {
  saveModelToIndexedDB,
  loadModelFromIndexedDB,
  deleteModelFromIndexedDB,
  modelExists,
  listSavedModels,
} from '@/utils/mlModelPersistence';

// ============================================================================
// Mock Data
// ============================================================================

const mockTimeSeriesData = [
  100, 105, 110, 108, 112, 115, 120, 118, 125, 130, 128, 135, 140, 138, 145, 150, 148, 155, 160,
  158, 165, 170, 168, 175, 180, 178, 185, 190, 188, 195,
];

const mockCostData = [
  5000, 5200, 5400, 5100, 5600, 5800, 6000, 5900, 6200, 6500, 6300, 6800, 7000, 6900, 7200, 7500,
  7300, 7800, 8000, 7900,
];

// ============================================================================
// Time Series Forecaster Tests
// ============================================================================

describe('TimeSeriesForecaster', () => {
  let forecaster: TimeSeriesForecaster;

  beforeEach(() => {
    forecaster = new TimeSeriesForecaster();
  });

  afterEach(() => {
    // Cleanup TensorFlow.js tensors
    tf.disposeVariables();
  });

  describe('prepareTimeSeriesData', () => {
    it('should correctly prepare time series data for LSTM', () => {
      const sequenceLength = 5;
      const { xs, ys } = forecaster.prepareTimeSeriesData(mockTimeSeriesData, sequenceLength);

      expect(xs).toBeDefined();
      expect(ys).toBeDefined();
      expect(xs.length).toBe(mockTimeSeriesData.length - sequenceLength);
      expect(ys.length).toBe(mockTimeSeriesData.length - sequenceLength);
      expect(xs[0].length).toBe(sequenceLength);
    });

    it('should return empty arrays for insufficient data', () => {
      const shortData = [1, 2, 3];
      const sequenceLength = 5;
      const { xs, ys } = forecaster.prepareTimeSeriesData(shortData, sequenceLength);

      expect(xs.length).toBe(0);
      expect(ys.length).toBe(0);
    });

    it('should wrap values in arrays for multivariate compatibility', () => {
      const sequenceLength = 3;
      const { xs } = forecaster.prepareTimeSeriesData([1, 2, 3, 4, 5], sequenceLength);

      expect(xs[0][0]).toEqual([1]);
      expect(xs[0][1]).toEqual([2]);
      expect(xs[0][2]).toEqual([3]);
    });
  });

  describe('exponentialSmoothing', () => {
    it('should smooth time series data', () => {
      const alpha = 0.3;
      const smoothed = forecaster.exponentialSmoothing(mockTimeSeriesData, alpha);

      expect(smoothed).toBeDefined();
      expect(smoothed.length).toBe(mockTimeSeriesData.length);
      expect(smoothed[0]).toBe(mockTimeSeriesData[0]); // First value unchanged
    });

    it('should use default alpha of 0.3', () => {
      const smoothed = forecaster.exponentialSmoothing(mockTimeSeriesData);
      expect(smoothed).toBeDefined();
      expect(smoothed.length).toBe(mockTimeSeriesData.length);
    });

    it('should produce smoother values with higher alpha', () => {
      const smoothed1 = forecaster.exponentialSmoothing(mockTimeSeriesData, 0.1);
      const smoothed2 = forecaster.exponentialSmoothing(mockTimeSeriesData, 0.9);

      // Higher alpha should follow data more closely
      const variance1 = calculateVariance(smoothed1);
      const variance2 = calculateVariance(smoothed2);

      expect(variance2).toBeGreaterThan(variance1);
    });
  });

  describe('detectTrend', () => {
    it('should detect increasing trend', () => {
      const increasingData = [10, 20, 30, 40, 50, 60, 70];
      const trend = forecaster.detectTrend(increasingData);
      expect(trend).toBe('increasing');
    });

    it('should detect decreasing trend', () => {
      const decreasingData = [70, 60, 50, 40, 30, 20, 10];
      const trend = forecaster.detectTrend(decreasingData);
      expect(trend).toBe('decreasing');
    });

    it('should detect stable trend', () => {
      const stableData = [50, 51, 50, 49, 50, 51, 50];
      const trend = forecaster.detectTrend(stableData);
      expect(trend).toBe('stable');
    });

    it('should return stable for single data point', () => {
      const trend = forecaster.detectTrend([100]);
      expect(trend).toBe('stable');
    });
  });

  describe('buildLSTMModel', () => {
    it('should build LSTM model with correct architecture', async () => {
      const config = {
        inputDim: 1,
        lstmUnits: 32,
        denseUnits: 16,
        outputDim: 1,
        learningRate: 0.001,
        sequenceLength: 10,
      };

      const model = await forecaster.buildLSTMModel(config);

      expect(model).toBeDefined();
      expect(model.layers.length).toBeGreaterThan(0);

      // Check input shape
      const inputShape = model.inputs[0].shape;
      expect(inputShape[1]).toBe(config.sequenceLength);
      expect(inputShape[2]).toBe(config.inputDim);

      model.dispose();
    });

    it('should compile model with correct optimizer and loss', async () => {
      const config = {
        inputDim: 1,
        lstmUnits: 16,
        denseUnits: 8,
        outputDim: 1,
        learningRate: 0.01,
        sequenceLength: 5,
      };

      const model = await forecaster.buildLSTMModel(config);

      // Model should be compiled (ready to train)
      expect(model.optimizer).toBeDefined();
      expect(model.loss).toBeDefined();

      model.dispose();
    });
  });

  describe('train', () => {
    it('should train LSTM model successfully', async () => {
      const config = {
        inputDim: 1,
        lstmUnits: 16,
        denseUnits: 8,
        outputDim: 1,
        learningRate: 0.01,
        epochs: 5, // Small for testing
        sequenceLength: 5,
      };

      const model = await forecaster.train(mockTimeSeriesData, config);

      expect(model).toBeDefined();
      expect(model.layers.length).toBeGreaterThan(0);

      model.dispose();
    }, 30000); // 30s timeout for training

    it('should throw error for insufficient data', async () => {
      const config = {
        inputDim: 1,
        lstmUnits: 16,
        denseUnits: 8,
        outputDim: 1,
        learningRate: 0.01,
        epochs: 5,
        sequenceLength: 10,
      };

      const shortData = [1, 2, 3, 4, 5]; // Less than sequence length + 1

      await expect(forecaster.train(shortData, config)).rejects.toThrow('Insufficient data');
    });
  });

  describe('predict', () => {
    it('should generate predictions for future values', async () => {
      const config = {
        inputDim: 1,
        lstmUnits: 16,
        denseUnits: 8,
        outputDim: 1,
        learningRate: 0.01,
        epochs: 5,
        sequenceLength: 5,
      };

      await forecaster.train(mockTimeSeriesData, config);

      const forecastHorizon = 7;
      const { predictions, confidenceIntervals } = await forecaster.predict(
        mockTimeSeriesData,
        forecastHorizon,
        config.sequenceLength
      );

      expect(predictions).toBeDefined();
      expect(predictions.length).toBe(forecastHorizon);
      expect(confidenceIntervals.length).toBe(forecastHorizon);

      // Check confidence intervals
      confidenceIntervals.forEach((ci, idx) => {
        expect(ci.lower).toBeLessThan(predictions[idx]);
        expect(ci.upper).toBeGreaterThan(predictions[idx]);
      });
    }, 30000);

    it('should throw error if model not trained', async () => {
      const forecaster = new TimeSeriesForecaster();

      await expect(forecaster.predict(mockTimeSeriesData, 5, 10)).rejects.toThrow(
        'Model not trained'
      );
    });
  });
});

// ============================================================================
// ML Model Manager Tests
// ============================================================================

describe('MLModelManager', () => {
  let modelManager: MLModelManager;

  beforeEach(() => {
    modelManager = new MLModelManager();
  });

  afterEach(() => {
    tf.disposeVariables();
  });

  describe('buildResourceAllocationModel', () => {
    it('should build neural network with correct architecture', async () => {
      const model = await modelManager.buildResourceAllocationModel();

      expect(model).toBeDefined();
      expect(model.layers.length).toBeGreaterThan(0);

      // Check input dimension
      const inputShape = model.inputs[0].shape;
      expect(inputShape[1]).toBe(25); // 25 features

      model.dispose();
    });

    it('should include dropout layers for regularization', async () => {
      const model = await modelManager.buildResourceAllocationModel();

      const dropoutLayers = model.layers.filter((layer) => layer.getClassName() === 'Dropout');
      expect(dropoutLayers.length).toBeGreaterThan(0);

      model.dispose();
    });
  });

  describe('buildDurationPredictionModel', () => {
    it('should build LSTM model for duration prediction', async () => {
      const model = await modelManager.buildDurationPredictionModel();

      expect(model).toBeDefined();

      // Check for LSTM layers
      const lstmLayers = model.layers.filter((layer) => layer.getClassName() === 'LSTM');
      expect(lstmLayers.length).toBeGreaterThan(0);

      model.dispose();
    });

    it('should have linear activation for regression output', async () => {
      const model = await modelManager.buildDurationPredictionModel();

      const outputLayer = model.layers[model.layers.length - 1];
      expect(outputLayer.getConfig().activation).toBe('linear');

      model.dispose();
    });
  });
});

// ============================================================================
// Genetic Algorithm Tests
// ============================================================================

describe('GeneticAlgorithmOptimizer', () => {
  let optimizer: GeneticAlgorithmOptimizer;

  beforeEach(() => {
    const config = {
      populationSize: 20, // Small for testing
      maxGenerations: 10,
      mutationRate: 0.1,
      crossoverRate: 0.8,
      elitismRate: 0.1,
      fitnessFunction: 'cost' as const,
      selectionMethod: 'tournament' as const,
      tournamentSize: 3,
      convergenceThreshold: 0.001,
    };
    optimizer = new GeneticAlgorithmOptimizer(config);
  });

  describe('optimize', () => {
    it('should run optimization and return best solution', async () => {
      const mockTasks = [
        {
          id: 'task1',
          projectId: 'proj1',
          duration: 10,
          startDate: new Date(),
          endDate: new Date(),
        },
        {
          id: 'task2',
          projectId: 'proj1',
          duration: 15,
          startDate: new Date(),
          endDate: new Date(),
        },
      ];

      const mockResources: any[] = [
        { id: 'res1', type: 'human', name: 'Worker 1' },
        { id: 'res2', type: 'equipment', name: 'Equipment 1' },
      ];

      const constraints = {
        budgetLimit: 100000,
        deadlineDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      };

      const result = await optimizer.optimize(mockTasks, mockResources, constraints);

      expect(result).toBeDefined();
      expect(result.bestIndividual).toBeDefined();
      expect(result.bestFitness).toBeGreaterThanOrEqual(0);
      expect(result.bestFitness).toBeLessThanOrEqual(1);
      expect(result.generationsRun).toBeGreaterThan(0);
      expect(result.fitnessHistory.length).toBeGreaterThan(0);
    }, 15000);

    it('should improve fitness over generations', async () => {
      const mockTasks = [
        {
          id: 'task1',
          projectId: 'proj1',
          duration: 10,
          startDate: new Date(),
          endDate: new Date(),
        },
      ];

      const mockResources: any[] = [{ id: 'res1', type: 'human', name: 'Worker 1' }];

      const result = await optimizer.optimize(mockTasks, mockResources, {});

      const firstFitness = result.fitnessHistory[0];
      const lastFitness = result.fitnessHistory[result.fitnessHistory.length - 1];

      // Fitness should improve or stay same (never decrease)
      expect(lastFitness).toBeGreaterThanOrEqual(firstFitness);
    }, 15000);
  });
});

// ============================================================================
// ML Model Persistence Tests
// ============================================================================

describe('ML Model Persistence', () => {
  const testModelId = 'test_model_persistence';

  afterEach(async () => {
    // Cleanup
    try {
      await deleteModelFromIndexedDB(testModelId);
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  describe('saveModelToIndexedDB', () => {
    it('should save model to IndexedDB', async () => {
      const model = tf.sequential({
        layers: [
          tf.layers.dense({ units: 10, inputShape: [5], activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'linear' }),
        ],
      });

      const metadata = {
        modelId: testModelId,
        modelType: 'test_model',
        version: '1.0.0',
        trainedAt: new Date(),
        accuracy: 0.85,
        config: { units: 10 },
      };

      await expect(saveModelToIndexedDB(testModelId, model, metadata)).resolves.not.toThrow();

      model.dispose();
    }, 10000);
  });

  describe('loadModelFromIndexedDB', () => {
    it('should load previously saved model', async () => {
      // Save a model first
      const model = tf.sequential({
        layers: [
          tf.layers.dense({ units: 8, inputShape: [4], activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' }),
        ],
      });

      const metadata = {
        modelId: testModelId,
        modelType: 'binary_classifier',
        version: '1.0.0',
        trainedAt: new Date(),
        accuracy: 0.92,
        config: {},
      };

      await saveModelToIndexedDB(testModelId, model, metadata);
      model.dispose();

      // Load the model
      const loaded = await loadModelFromIndexedDB(testModelId);

      expect(loaded).not.toBeNull();
      expect(loaded!.model).toBeDefined();
      expect(loaded!.metadata.modelId).toBe(testModelId);
      expect(loaded!.metadata.modelType).toBe('binary_classifier');

      loaded!.model.dispose();
    }, 15000);

    it('should return null for non-existent model', async () => {
      const loaded = await loadModelFromIndexedDB('non_existent_model');
      expect(loaded).toBeNull();
    });
  });

  describe('modelExists', () => {
    it('should return true for existing model', async () => {
      const model = tf.sequential({
        layers: [tf.layers.dense({ units: 5, inputShape: [3] })],
      });

      await saveModelToIndexedDB(testModelId, model, {
        modelId: testModelId,
        modelType: 'test',
        version: '1.0.0',
        trainedAt: new Date(),
        config: {},
      });

      const exists = await modelExists(testModelId);
      expect(exists).toBe(true);

      model.dispose();
    }, 10000);

    it('should return false for non-existent model', async () => {
      const exists = await modelExists('non_existent_model_12345');
      expect(exists).toBe(false);
    });
  });

  describe('listSavedModels', () => {
    it('should return list of saved models', async () => {
      const model1 = tf.sequential({
        layers: [tf.layers.dense({ units: 5, inputShape: [3] })],
      });

      const model2 = tf.sequential({
        layers: [tf.layers.dense({ units: 10, inputShape: [5] })],
      });

      await saveModelToIndexedDB(`${testModelId}_1`, model1, {
        modelId: `${testModelId}_1`,
        modelType: 'test1',
        version: '1.0.0',
        trainedAt: new Date(),
        config: {},
      });

      await saveModelToIndexedDB(`${testModelId}_2`, model2, {
        modelId: `${testModelId}_2`,
        modelType: 'test2',
        version: '1.0.0',
        trainedAt: new Date(),
        config: {},
      });

      const models = await listSavedModels();

      expect(models.length).toBeGreaterThanOrEqual(2);

      // Cleanup
      await deleteModelFromIndexedDB(`${testModelId}_1`);
      await deleteModelFromIndexedDB(`${testModelId}_2`);

      model1.dispose();
      model2.dispose();
    }, 15000);
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

function calculateVariance(data: number[]): number {
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const squaredDiffs = data.map((val) => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;
}
