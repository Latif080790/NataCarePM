/**
 * AI Resource Optimization Context
 * NataCarePM - Phase 4: AI & Analytics
 *
 * React Context for managing AI resource optimization state,
 * ML model interactions, and optimization results
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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
import { aiResourceService } from '@/api/aiResourceService';

// ============================================================================
// Context Type Definition
// ============================================================================

interface AIResourceContextType extends AIResourceOptimizationState {
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

  // State Management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// ============================================================================
// Context Creation
// ============================================================================

const AIResourceContext = createContext<AIResourceContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface AIResourceProviderProps {
  children: ReactNode;
}

export const AIResourceProvider: React.FC<AIResourceProviderProps> = ({ children }) => {
  const [state, setState] = useState<AIResourceOptimizationState>({
    models: [],
    activeOptimization: undefined,
    optimizationResults: [],
    recommendations: [],
    resourceAllocations: [],
    demandForecasts: [],
    bottlenecks: [],
    isLoading: false,
    error: null,
  });

  // ============================================================================
  // ML Model Management
  // ============================================================================

  const initializeModels = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await aiResourceService.initializeModels();
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: `Failed to initialize ML models: ${error.message}`,
      }));
      throw error;
    }
  }, []);

  const loadModelMetadata = useCallback(
    async (modelId: string): Promise<MLModelMetadata | null> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // This would call the actual service method
        // For now, return null as placeholder
        setState((prev) => ({ ...prev, isLoading: false }));
        return null;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: `Failed to load model metadata: ${error.message}`,
        }));
        return null;
      }
    },
    []
  );

  // ============================================================================
  // Resource Optimization
  // ============================================================================

  const requestOptimization = useCallback(
    async (request: ResourceOptimizationRequest): Promise<OptimizationResult> => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        activeOptimization: request,
      }));

      try {
        const result = await aiResourceService.optimizeResources(request);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          activeOptimization: undefined,
          optimizationResults: [...prev.optimizationResults, result],
          recommendations: [
            ...prev.recommendations,
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
        }));

        return result;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          activeOptimization: undefined,
          error: `Optimization failed: ${error.message}`,
        }));
        throw error;
      }
    },
    []
  );

  const getOptimizationResult = useCallback(
    (resultId: string): OptimizationResult | undefined => {
      return state.optimizationResults.find((r) => r.resultId === resultId);
    },
    [state.optimizationResults]
  );

  const clearOptimizationResults = useCallback(() => {
    setState((prev) => ({ ...prev, optimizationResults: [] }));
  }, []);

  // ============================================================================
  // Recommendations Management
  // ============================================================================

  const getRecommendations = useCallback(
    (projectId?: string): SchedulingRecommendation[] => {
      if (projectId) {
        return state.recommendations.filter((r) => r.projectId === projectId);
      }
      return state.recommendations;
    },
    [state.recommendations]
  );

  const acceptRecommendation = useCallback(async (recommendationId: string) => {
    setState((prev) => ({
      ...prev,
      recommendations: prev.recommendations.map((rec) =>
        rec.recommendationId === recommendationId ? { ...rec, status: 'accepted' as const } : rec
      ),
    }));

    // TODO: Implement actual allocation based on recommendation
  }, []);

  const rejectRecommendation = useCallback(async (recommendationId: string) => {
    setState((prev) => ({
      ...prev,
      recommendations: prev.recommendations.map((rec) =>
        rec.recommendationId === recommendationId ? { ...rec, status: 'rejected' as const } : rec
      ),
    }));
  }, []);

  // ============================================================================
  // Resource Allocations
  // ============================================================================

  const getAllocations = useCallback(
    (projectId?: string): ResourceAllocation[] => {
      if (projectId) {
        return state.resourceAllocations.filter((a) => a.projectId === projectId);
      }
      return state.resourceAllocations;
    },
    [state.resourceAllocations]
  );

  const updateAllocation = useCallback(
    (allocationId: string, updates: Partial<ResourceAllocation>) => {
      setState((prev) => ({
        ...prev,
        resourceAllocations: prev.resourceAllocations.map((alloc) =>
          alloc.allocationId === allocationId
            ? { ...alloc, ...updates, updatedAt: new Date() }
            : alloc
        ),
      }));
    },
    []
  );

  // ============================================================================
  // Forecasting & Analysis
  // ============================================================================

  const getDemandForecast = useCallback(
    (projectId: string, resourceType?: string): ResourceDemandForecast[] => {
      let forecasts = state.demandForecasts.filter((f) => f.projectId === projectId);

      if (resourceType) {
        forecasts = forecasts.filter((f) => f.resourceType === resourceType);
      }

      return forecasts;
    },
    [state.demandForecasts]
  );

  const getBottlenecks = useCallback(
    (severity?: string): ResourceBottleneck[] => {
      if (severity) {
        return state.bottlenecks.filter((b) => b.severity === severity);
      }
      return state.bottlenecks;
    },
    [state.bottlenecks]
  );

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

  const contextValue: AIResourceContextType = {
    ...state,
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
    setLoading,
    setError,
    clearError,
  };

  return <AIResourceContext.Provider value={contextValue}>{children}</AIResourceContext.Provider>;
};

// ============================================================================
// Custom Hook
// ============================================================================

export const useAIResource = (): AIResourceContextType => {
  const context = useContext(AIResourceContext);

  if (!context) {
    throw new Error('useAIResource must be used within AIResourceProvider');
  }

  return context;
};

export default AIResourceContext;
