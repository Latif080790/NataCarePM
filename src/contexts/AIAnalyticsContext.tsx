/**
 * AI Analytics Context (Consolidated)
 * NataCarePM - Phase 4: AI & Analytics
 *
 * CONSOLIDATED CONTEXT: Combines AIResourceContext + PredictiveAnalyticsContext
 * Reduces context overhead while maintaining full functionality
 *
 * Features:
 * - AI Resource Optimization (ML models, recommendations)
 * - Predictive Analytics (forecasting, risk analysis)
 * - Backward compatibility via facade hooks
 */

import * as React from 'react';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// AI Resource Types
import {
  AIResourceOptimizationState,
  MLModelMetadata,
  ResourceOptimizationRequest,
  OptimizationResult,
  SchedulingRecommendation,
  ResourceAllocation,
  ResourceDemandForecast,
  ResourceBottleneck,
} from '@/types/ai-resource.types';

// Predictive Analytics Types
import type {
  PredictiveAnalyticsState,
  CostForecast,
  ScheduleForecast,
  RiskForecast,
  ForecastConfig,
  GenerateForecastRequest,
  GenerateForecastResponse,
} from '@/types/predictive-analytics.types';

// Services
import { aiResourceService } from '@/services/aiResourceService';
import { predictiveAnalyticsService } from '@/services/predictiveAnalyticsService';

// ============================================================================
// Combined State Type
// ============================================================================

interface AIAnalyticsState {
  // AI Resource State
  aiResource: AIResourceOptimizationState;
  // Predictive Analytics State
  predictive: PredictiveAnalyticsState;
  // Global loading/error
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Context Type Definition
// ============================================================================

interface AIAnalyticsContextType {
  // State
  state: AIAnalyticsState;

  // ====== AI Resource Functions ======
  // ML Model Management
  initializeModels: () => Promise<void>;
  loadModelMetadata: (modelId: string) => Promise<MLModelMetadata | null>;

  // Resource Optimization
  requestOptimization: (request: ResourceOptimizationRequest) => Promise<OptimizationResult>;
  getOptimizationResult: (resultId: string) => OptimizationResult | undefined;
  clearOptimizationResults: () => void;

  // Recommendations
  getRecommendations: (projectId?: string) => SchedulingRecommendation[];
  acceptRecommendation: (recommendationId: string) => Promise<void>;
  rejectRecommendation: (recommendationId: string) => Promise<void>;

  // Resource Allocations
  getAllocations: (projectId?: string) => ResourceAllocation[];
  updateAllocation: (allocationId: string, updates: Partial<ResourceAllocation>) => void;

  // Forecasting & Analysis
  getDemandForecast: (projectId: string, resourceType?: string) => ResourceDemandForecast[];
  getBottlenecks: (severity?: string) => ResourceBottleneck[];

  // ====== Predictive Analytics Functions ======
  // Forecast Generation
  generateForecast: (request: GenerateForecastRequest) => Promise<GenerateForecastResponse>;
  generateCostForecast: (projectId: string, config?: Partial<ForecastConfig>) => Promise<CostForecast>;
  generateScheduleForecast: (projectId: string, config?: Partial<ForecastConfig>) => Promise<ScheduleForecast>;
  generateRiskForecast: (projectId: string, config?: Partial<ForecastConfig>) => Promise<RiskForecast>;

  // Forecast Retrieval
  getLatestCostForecast: (projectId: string) => CostForecast | undefined;
  getLatestScheduleForecast: (projectId: string) => ScheduleForecast | undefined;
  getLatestRiskForecast: (projectId: string) => RiskForecast | undefined;
  getAllForecasts: (projectId: string) => {
    cost?: CostForecast;
    schedule?: ScheduleForecast;
    risk?: RiskForecast;
  };

  // Forecast Management
  refreshForecasts: (projectId: string) => Promise<void>;
  clearForecasts: () => void;

  // ====== State Management ======
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// ============================================================================
// Context Creation
// ============================================================================

const AIAnalyticsContext = createContext<AIAnalyticsContextType | undefined>(undefined);

// ============================================================================
// Initial State
// ============================================================================

const initialAIResourceState: AIResourceOptimizationState = {
  models: [],
  activeOptimization: undefined,
  optimizationResults: [],
  recommendations: [],
  resourceAllocations: [],
  demandForecasts: [],
  bottlenecks: [],
  isLoading: false,
  error: null,
};

const initialPredictiveState: PredictiveAnalyticsState = {
  costForecasts: [],
  scheduleForecasts: [],
  riskForecasts: [],
  qualityForecasts: [],
  timeSeriesData: [],
  forecastAccuracy: [],
  externalFactors: [],
  scenarioAnalyses: [],
  isLoading: false,
  error: null,
};

// ============================================================================
// Provider Component
// ============================================================================

interface AIAnalyticsProviderProps {
  children: ReactNode;
}

export const AIAnalyticsProvider: React.FC<AIAnalyticsProviderProps> = ({ children }) => {
  const [state, setState] = useState<AIAnalyticsState>({
    aiResource: initialAIResourceState,
    predictive: initialPredictiveState,
    isLoading: false,
    error: null,
  });

  // ============================================================================
  // AI Resource: ML Model Management
  // ============================================================================

  const initializeModels = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await aiResourceService.initializeModels();
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: `Failed to initialize ML models: ${message}`,
      }));
      throw error;
    }
  }, []);

  const loadModelMetadata = useCallback(
    async (_modelId: string): Promise<MLModelMetadata | null> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        setState((prev) => ({ ...prev, isLoading: false }));
        return null; // Placeholder - implement when needed
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: `Failed to load model metadata: ${message}`,
        }));
        return null;
      }
    },
    []
  );

  // ============================================================================
  // AI Resource: Optimization
  // ============================================================================

  const requestOptimization = useCallback(
    async (request: ResourceOptimizationRequest): Promise<OptimizationResult> => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        aiResource: { ...prev.aiResource, activeOptimization: request },
      }));

      try {
        const result = await aiResourceService.optimizeResources(request);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          aiResource: {
            ...prev.aiResource,
            activeOptimization: undefined,
            optimizationResults: [...prev.aiResource.optimizationResults, result],
            recommendations: [
              ...prev.aiResource.recommendations,
              ...result.recommendations.map((rec) => ({
                recommendationId: rec.recommendationId,
                projectId: rec.projectId,
                recommendationType: 'reallocation' as const,
                priority: 'medium' as const,
                description: rec.reasoning,
                reasoning: rec.reasoning,
                affectedTasks: [rec.taskId],
                affectedResources: rec.recommendedResources.map((r) => r.resourceId),
                estimatedImpact: {
                  costChange: rec.estimatedCost,
                  timeChange: rec.estimatedDuration,
                  qualityChange: rec.qualityScore,
                  riskChange: -rec.riskScore,
                },
                implementationSteps: [
                  'Review recommendation',
                  'Approve allocation',
                  'Update schedule',
                ],
                status: 'pending' as const,
                createdAt: new Date(),
                createdBy: 'AI',
              })),
            ],
          },
        }));

        return result;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          aiResource: { ...prev.aiResource, activeOptimization: undefined },
          error: `Optimization failed: ${message}`,
        }));
        throw error;
      }
    },
    []
  );

  const getOptimizationResult = useCallback(
    (resultId: string): OptimizationResult | undefined => {
      return state.aiResource.optimizationResults.find((r) => r.resultId === resultId);
    },
    [state.aiResource.optimizationResults]
  );

  const clearOptimizationResults = useCallback(() => {
    setState((prev) => ({
      ...prev,
      aiResource: { ...prev.aiResource, optimizationResults: [] },
    }));
  }, []);

  // ============================================================================
  // AI Resource: Recommendations
  // ============================================================================

  const getRecommendations = useCallback(
    (projectId?: string): SchedulingRecommendation[] => {
      if (projectId) {
        return state.aiResource.recommendations.filter((r) => r.projectId === projectId);
      }
      return state.aiResource.recommendations;
    },
    [state.aiResource.recommendations]
  );

  const acceptRecommendation = useCallback(async (recommendationId: string) => {
    setState((prev) => ({
      ...prev,
      aiResource: {
        ...prev.aiResource,
        recommendations: prev.aiResource.recommendations.map((rec) =>
          rec.recommendationId === recommendationId ? { ...rec, status: 'accepted' as const } : rec
        ),
      },
    }));
  }, []);

  const rejectRecommendation = useCallback(async (recommendationId: string) => {
    setState((prev) => ({
      ...prev,
      aiResource: {
        ...prev.aiResource,
        recommendations: prev.aiResource.recommendations.map((rec) =>
          rec.recommendationId === recommendationId ? { ...rec, status: 'rejected' as const } : rec
        ),
      },
    }));
  }, []);

  // ============================================================================
  // AI Resource: Allocations
  // ============================================================================

  const getAllocations = useCallback(
    (projectId?: string): ResourceAllocation[] => {
      if (projectId) {
        return state.aiResource.resourceAllocations.filter((a) => a.projectId === projectId);
      }
      return state.aiResource.resourceAllocations;
    },
    [state.aiResource.resourceAllocations]
  );

  const updateAllocation = useCallback(
    (allocationId: string, updates: Partial<ResourceAllocation>) => {
      setState((prev) => ({
        ...prev,
        aiResource: {
          ...prev.aiResource,
          resourceAllocations: prev.aiResource.resourceAllocations.map((alloc) =>
            alloc.allocationId === allocationId
              ? { ...alloc, ...updates, updatedAt: new Date() }
              : alloc
          ),
        },
      }));
    },
    []
  );

  // ============================================================================
  // AI Resource: Forecasting
  // ============================================================================

  const getDemandForecast = useCallback(
    (projectId: string, resourceType?: string): ResourceDemandForecast[] => {
      let forecasts = state.aiResource.demandForecasts.filter((f) => f.projectId === projectId);
      if (resourceType) {
        forecasts = forecasts.filter((f) => f.resourceType === resourceType);
      }
      return forecasts;
    },
    [state.aiResource.demandForecasts]
  );

  const getBottlenecks = useCallback(
    (severity?: string): ResourceBottleneck[] => {
      if (severity) {
        return state.aiResource.bottlenecks.filter((b) => b.severity === severity);
      }
      return state.aiResource.bottlenecks;
    },
    [state.aiResource.bottlenecks]
  );

  // ============================================================================
  // Predictive Analytics: Forecast Generation
  // ============================================================================

  const generateForecast = useCallback(
    async (request: GenerateForecastRequest): Promise<GenerateForecastResponse> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await predictiveAnalyticsService.generateForecast(request);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          predictive: {
            ...prev.predictive,
            costForecasts: response.forecasts.cost
              ? [...prev.predictive.costForecasts, response.forecasts.cost]
              : prev.predictive.costForecasts,
            scheduleForecasts: response.forecasts.schedule
              ? [...prev.predictive.scheduleForecasts, response.forecasts.schedule]
              : prev.predictive.scheduleForecasts,
            riskForecasts: response.forecasts.risk
              ? [...prev.predictive.riskForecasts, response.forecasts.risk]
              : prev.predictive.riskForecasts,
            qualityForecasts: response.forecasts.quality
              ? [...prev.predictive.qualityForecasts, response.forecasts.quality]
              : prev.predictive.qualityForecasts,
          },
        }));

        return response;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: `Forecast generation failed: ${message}`,
        }));
        throw error;
      }
    },
    []
  );

  const generateCostForecast = useCallback(
    async (projectId: string, config?: Partial<ForecastConfig>): Promise<CostForecast> => {
      const request: GenerateForecastRequest = {
        projectId,
        forecastTypes: ['cost'],
        config: config || {},
      };

      const response = await generateForecast(request);

      if (!response.forecasts.cost) {
        throw new Error('Cost forecast not generated');
      }

      return response.forecasts.cost;
    },
    [generateForecast]
  );

  const generateScheduleForecast = useCallback(
    async (projectId: string, config?: Partial<ForecastConfig>): Promise<ScheduleForecast> => {
      const request: GenerateForecastRequest = {
        projectId,
        forecastTypes: ['schedule'],
        config: config || {},
      };

      const response = await generateForecast(request);

      if (!response.forecasts.schedule) {
        throw new Error('Schedule forecast not generated');
      }

      return response.forecasts.schedule;
    },
    [generateForecast]
  );

  const generateRiskForecast = useCallback(
    async (projectId: string, config?: Partial<ForecastConfig>): Promise<RiskForecast> => {
      const request: GenerateForecastRequest = {
        projectId,
        forecastTypes: ['risk'],
        config: config || {},
      };

      const response = await generateForecast(request);

      if (!response.forecasts.risk) {
        throw new Error('Risk forecast not generated');
      }

      return response.forecasts.risk;
    },
    [generateForecast]
  );

  // ============================================================================
  // Predictive Analytics: Forecast Retrieval
  // ============================================================================

  const getLatestCostForecast = useCallback(
    (projectId: string): CostForecast | undefined => {
      return state.predictive.costForecasts
        .filter((f) => f.projectId === projectId)
        .sort((a, b) => b.forecastDate.getTime() - a.forecastDate.getTime())[0];
    },
    [state.predictive.costForecasts]
  );

  const getLatestScheduleForecast = useCallback(
    (projectId: string): ScheduleForecast | undefined => {
      return state.predictive.scheduleForecasts
        .filter((f) => f.projectId === projectId)
        .sort((a, b) => b.forecastDate.getTime() - a.forecastDate.getTime())[0];
    },
    [state.predictive.scheduleForecasts]
  );

  const getLatestRiskForecast = useCallback(
    (projectId: string): RiskForecast | undefined => {
      return state.predictive.riskForecasts
        .filter((f) => f.projectId === projectId)
        .sort((a, b) => b.forecastDate.getTime() - a.forecastDate.getTime())[0];
    },
    [state.predictive.riskForecasts]
  );

  const getAllForecasts = useCallback(
    (projectId: string) => {
      return {
        cost: getLatestCostForecast(projectId),
        schedule: getLatestScheduleForecast(projectId),
        risk: getLatestRiskForecast(projectId),
      };
    },
    [getLatestCostForecast, getLatestScheduleForecast, getLatestRiskForecast]
  );

  // ============================================================================
  // Predictive Analytics: Forecast Management
  // ============================================================================

  const refreshForecasts = useCallback(async (projectId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const forecasts = await predictiveAnalyticsService.getLatestForecasts(projectId);

      setState((prev) => {
        const filteredCost = prev.predictive.costForecasts.filter((f) => f.projectId !== projectId);
        const filteredSchedule = prev.predictive.scheduleForecasts.filter(
          (f) => f.projectId !== projectId
        );
        const filteredRisk = prev.predictive.riskForecasts.filter((f) => f.projectId !== projectId);

        return {
          ...prev,
          isLoading: false,
          predictive: {
            ...prev.predictive,
            costForecasts: forecasts.cost ? [...filteredCost, forecasts.cost] : filteredCost,
            scheduleForecasts: forecasts.schedule
              ? [...filteredSchedule, forecasts.schedule]
              : filteredSchedule,
            riskForecasts: forecasts.risk ? [...filteredRisk, forecasts.risk] : filteredRisk,
          },
        };
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: `Failed to refresh forecasts: ${message}`,
      }));
    }
  }, []);

  const clearForecasts = useCallback(() => {
    setState((prev) => ({
      ...prev,
      predictive: {
        ...prev.predictive,
        costForecasts: [],
        scheduleForecasts: [],
        riskForecasts: [],
        qualityForecasts: [],
      },
    }));
  }, []);

  // ============================================================================
  // State Management
  // ============================================================================

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue: AIAnalyticsContextType = {
    state,
    // AI Resource
    initializeModels,
    loadModelMetadata,
    requestOptimization,
    getOptimizationResult,
    clearOptimizationResults,
    getRecommendations,
    acceptRecommendation,
    rejectRecommendation,
    getAllocations,
    updateAllocation,
    getDemandForecast,
    getBottlenecks,
    // Predictive Analytics
    generateForecast,
    generateCostForecast,
    generateScheduleForecast,
    generateRiskForecast,
    getLatestCostForecast,
    getLatestScheduleForecast,
    getLatestRiskForecast,
    getAllForecasts,
    refreshForecasts,
    clearForecasts,
    // State Management
    setLoading,
    setError,
    clearError,
  };

  return (
    <AIAnalyticsContext.Provider value={contextValue}>{children}</AIAnalyticsContext.Provider>
  );
};

// ============================================================================
// Main Hook
// ============================================================================

export const useAIAnalytics = (): AIAnalyticsContextType => {
  const context = useContext(AIAnalyticsContext);
  if (!context) {
    throw new Error('useAIAnalytics must be used within AIAnalyticsProvider');
  }
  return context;
};

// ============================================================================
// FACADE HOOKS - Backward Compatibility
// These hooks maintain the same API as the original separate contexts
// ============================================================================

/**
 * @deprecated Use useAIAnalytics() instead. This hook is for backward compatibility only.
 */
export const useAIResource = () => {
  const { state, ...methods } = useAIAnalytics();

  return {
    // State (flattened like original AIResourceContext)
    ...state.aiResource,
    isLoading: state.isLoading,
    error: state.error,
    // Methods
    initializeModels: methods.initializeModels,
    loadModelMetadata: methods.loadModelMetadata,
    requestOptimization: methods.requestOptimization,
    getOptimizationResult: methods.getOptimizationResult,
    clearOptimizationResults: methods.clearOptimizationResults,
    getRecommendations: methods.getRecommendations,
    acceptRecommendation: methods.acceptRecommendation,
    rejectRecommendation: methods.rejectRecommendation,
    getAllocations: methods.getAllocations,
    updateAllocation: methods.updateAllocation,
    getDemandForecast: methods.getDemandForecast,
    getBottlenecks: methods.getBottlenecks,
    setLoading: methods.setLoading,
    setError: methods.setError,
    clearError: methods.clearError,
  };
};

/**
 * @deprecated Use useAIAnalytics() instead. This hook is for backward compatibility only.
 */
export const usePredictiveAnalytics = () => {
  const { state, ...methods } = useAIAnalytics();

  return {
    // State (flattened like original PredictiveAnalyticsContext)
    ...state.predictive,
    isLoading: state.isLoading,
    error: state.error,
    // Methods
    generateForecast: methods.generateForecast,
    generateCostForecast: methods.generateCostForecast,
    generateScheduleForecast: methods.generateScheduleForecast,
    generateRiskForecast: methods.generateRiskForecast,
    getLatestCostForecast: methods.getLatestCostForecast,
    getLatestScheduleForecast: methods.getLatestScheduleForecast,
    getLatestRiskForecast: methods.getLatestRiskForecast,
    getAllForecasts: methods.getAllForecasts,
    refreshForecasts: methods.refreshForecasts,
    clearForecasts: methods.clearForecasts,
    setLoading: methods.setLoading,
    setError: methods.setError,
    clearError: methods.clearError,
  };
};

export default AIAnalyticsContext;
