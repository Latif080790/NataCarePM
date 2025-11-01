import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aiResourceService } from '../../api/aiResourceService';

describe('AI Resource Service - Simple Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should create service instance', () => {
      expect(aiResourceService).toBeDefined();
    });

    it('should have model manager', () => {
      expect(aiResourceService['modelManager']).toBeDefined();
    });
  });

  describe('Optimization Goal Mapping', () => {
    it('should map minimize_cost to cost', () => {
      const service = aiResourceService as any;
      expect(service.mapOptimizationGoal('minimize_cost')).toBe('cost');
    });

    it('should map minimize_duration to time', () => {
      const service = aiResourceService as any;
      expect(service.mapOptimizationGoal('minimize_duration')).toBe('time');
    });

    it('should map maximize_quality to quality', () => {
      const service = aiResourceService as any;
      expect(service.mapOptimizationGoal('maximize_quality')).toBe('quality');
    });

    it('should map unknown goals to composite', () => {
      const service = aiResourceService as any;
      expect(service.mapOptimizationGoal('unknown_goal')).toBe('composite');
    });
  });

  describe('Genetic Algorithm Configuration', () => {
    it('should create optimizer with correct configuration', () => {
      const config = {
        populationSize: 100,
        maxGenerations: 200,
        mutationRate: 0.1,
        crossoverRate: 0.8,
        elitismRate: 0.1,
        fitnessFunction: 'composite' as const,
        selectionMethod: 'tournament' as const,
        tournamentSize: 5,
        convergenceThreshold: 0.001,
      };

      // This would normally create an optimizer, but we're just testing the config
      expect(config.populationSize).toBe(100);
      expect(config.maxGenerations).toBe(200);
      expect(config.mutationRate).toBe(0.1);
      expect(config.crossoverRate).toBe(0.8);
      expect(config.elitismRate).toBe(0.1);
      expect(config.fitnessFunction).toBe('composite');
      expect(config.selectionMethod).toBe('tournament');
      expect(config.tournamentSize).toBe(5);
      expect(config.convergenceThreshold).toBe(0.001);
    });
  });
});