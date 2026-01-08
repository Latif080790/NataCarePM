/**
 * Smart AI Hooks
 * Phase 6: AI & Automation - Combined AI Features
 * 
 * Provides:
 * - Smart notifications with predictions
 * - Natural language querying
 * - AI-powered insights
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys, STALE_TIMES } from '@/config/queryClient';
import { 
  generateSmartNotifications, 
  calculateProjectHealth,
  predictProjectDelay,
  predictBudgetOverrun,
  type SmartNotification,
  type ProjectHealthMetrics,
  type PredictionResult
} from '@/services/smartNotificationService';
import {
  processNaturalLanguageQuery,
  type NLQueryResult,
  type ProjectContext
} from '@/services/naturalLanguageService';
import { useProject } from '@/contexts/ProjectContext';
import { useRabItems, useTasks, useInventoryMaterials } from '@/hooks/useQueryHooks';
import { useCallback, useMemo } from 'react';

// ============================================
// SMART NOTIFICATIONS HOOK
// ============================================

/**
 * Hook for smart notifications
 * Automatically generates predictive notifications based on project data
 */
export function useSmartNotifications(projectId: string | undefined) {
  const { data: rabItems = [] } = useRabItems(projectId);
  const { data: tasks = [] } = useTasks(projectId);
  const { data: inventoryMaterials = [] } = useInventoryMaterials();
  const { currentProject } = useProject();
  
  // Convert inventory materials to inventory items format
  const inventoryItems = useMemo(() => inventoryMaterials.map(m => ({
    materialName: m.materialName,
    quantity: m.currentStock,
    unit: m.baseUom,
  })), [inventoryMaterials]);
  
  return useQuery<SmartNotification[]>({
    queryKey: [...queryKeys.ai.all, 'smartNotifications', projectId],
    queryFn: () => {
      if (!currentProject || !projectId) return [];
      return generateSmartNotifications(currentProject, tasks, rabItems, inventoryItems);
    },
    enabled: !!projectId && !!currentProject,
    staleTime: STALE_TIMES.METRICS,
    // Refetch every 5 minutes
    refetchInterval: 5 * 60 * 1000,
  });
}

/**
 * Hook for project health metrics
 */
export function useProjectHealth(projectId: string | undefined) {
  const { data: rabItems = [] } = useRabItems(projectId);
  const { data: tasks = [] } = useTasks(projectId);
  const { currentProject } = useProject();
  
  return useQuery<ProjectHealthMetrics | null>({
    queryKey: [...queryKeys.ai.all, 'health', projectId],
    queryFn: () => {
      if (!currentProject || !projectId) return null;
      return calculateProjectHealth(currentProject, tasks, rabItems);
    },
    enabled: !!projectId && !!currentProject,
    staleTime: STALE_TIMES.METRICS,
  });
}

/**
 * Hook for delay prediction
 */
export function useDelayPrediction(projectId: string | undefined) {
  const { data: rabItems = [] } = useRabItems(projectId);
  const { data: tasks = [] } = useTasks(projectId);
  const { currentProject } = useProject();
  
  return useQuery<PredictionResult | null>({
    queryKey: [...queryKeys.ai.all, 'delayPrediction', projectId],
    queryFn: () => {
      if (!currentProject || !projectId) return null;
      return predictProjectDelay(currentProject, tasks, rabItems);
    },
    enabled: !!projectId && !!currentProject,
    staleTime: STALE_TIMES.METRICS,
  });
}

/**
 * Hook for budget prediction
 */
export function useBudgetPrediction(projectId: string | undefined) {
  const { data: rabItems = [] } = useRabItems(projectId);
  const { currentProject } = useProject();
  
  return useQuery({
    queryKey: [...queryKeys.ai.all, 'budgetPrediction', projectId],
    queryFn: () => {
      if (!currentProject || !projectId) return null;
      return predictBudgetOverrun(currentProject, rabItems);
    },
    enabled: !!projectId && !!currentProject,
    staleTime: STALE_TIMES.METRICS,
  });
}

// ============================================
// NATURAL LANGUAGE QUERY HOOK
// ============================================

/**
 * Hook for natural language queries
 */
export function useNLQuery(projectId: string | undefined) {
  const { data: rabItems = [] } = useRabItems(projectId);
  const { data: tasks = [] } = useTasks(projectId);
  const { data: inventoryMaterials = [] } = useInventoryMaterials();
  const { currentProject } = useProject();
  
  // Convert inventory materials to inventory items format
  const inventoryItems = useMemo(() => inventoryMaterials.map(m => ({
    materialName: m.materialName,
    quantity: m.currentStock,
    unit: m.baseUom,
  })), [inventoryMaterials]);
  
  const context: ProjectContext | null = useMemo(() => {
    if (!currentProject) return null;
    return {
      project: currentProject,
      tasks,
      rabItems,
      inventoryItems,
    };
  }, [currentProject, tasks, rabItems, inventoryItems]);
  
  const queryMutation = useMutation<NLQueryResult, Error, string>({
    mutationFn: async (query: string) => {
      if (!context) {
        throw new Error('Project context not available');
      }
      return processNaturalLanguageQuery(query, context);
    },
  });
  
  const askQuestion = useCallback((query: string) => {
    return queryMutation.mutateAsync(query);
  }, [queryMutation]);
  
  return {
    askQuestion,
    isLoading: queryMutation.isPending,
    lastResult: queryMutation.data,
    error: queryMutation.error,
    reset: queryMutation.reset,
  };
}

// ============================================
// COMBINED AI DASHBOARD HOOK
// ============================================

export interface AIInsights {
  health: ProjectHealthMetrics | null;
  delayPrediction: PredictionResult | null;
  budgetPrediction: {
    willOverrun: boolean;
    estimatedOverrun: number;
    confidence: number;
    factors: string[];
  } | null;
  notifications: SmartNotification[];
  isLoading: boolean;
}

/**
 * Combined hook for AI insights dashboard
 */
export function useAIInsights(projectId: string | undefined): AIInsights {
  const { data: health, isLoading: healthLoading } = useProjectHealth(projectId);
  const { data: delayPrediction, isLoading: delayLoading } = useDelayPrediction(projectId);
  const { data: budgetPrediction, isLoading: budgetLoading } = useBudgetPrediction(projectId);
  const { data: notifications = [], isLoading: notifLoading } = useSmartNotifications(projectId);
  
  return {
    health: health ?? null,
    delayPrediction: delayPrediction ?? null,
    budgetPrediction: budgetPrediction ?? null,
    notifications,
    isLoading: healthLoading || delayLoading || budgetLoading || notifLoading,
  };
}

export default {
  useSmartNotifications,
  useProjectHealth,
  useDelayPrediction,
  useBudgetPrediction,
  useNLQuery,
  useAIInsights,
};
