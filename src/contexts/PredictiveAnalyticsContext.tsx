/**
 * Predictive Analytics Context
 * NataCarePM - Phase 4.2: AI & Analytics
 * 
 * React Context for managing predictive analytics state,
 * forecasting operations, and real-time predictions
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type {
  PredictiveAnalyticsState,
  CostForecast,
  ScheduleForecast,
  RiskForecast,
  QualityForecast,
  ForecastConfig,
  GenerateForecastRequest,
  GenerateForecastResponse,
  ForecastType,
} from '@/types/predictive-analytics.types';
import { predictiveAnalyticsService } from '@/api/predictiveAnalyticsService';

// ============================================================================
// Context Type Definition
// ============================================================================

interface PredictiveAnalyticsContextType extends PredictiveAnalyticsState {
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
  
  // State Management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// ============================================================================
// Context Creation
// ============================================================================

const PredictiveAnalyticsContext = createContext<PredictiveAnalyticsContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface PredictiveAnalyticsProviderProps {
  children: ReactNode;
}

export const PredictiveAnalyticsProvider: React.FC<PredictiveAnalyticsProviderProps> = ({ children }) => {
  const [state, setState] = useState<PredictiveAnalyticsState>({
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
  });

  // ============================================================================
  // Forecast Generation Methods
  // ============================================================================

  const generateForecast = useCallback(async (
    request: GenerateForecastRequest
  ): Promise<GenerateForecastResponse> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await predictiveAnalyticsService.generateForecast(request);

      // Update state with new forecasts
      setState(prev => ({
        ...prev,
        isLoading: false,
        costForecasts: response.forecasts.cost 
          ? [...prev.costForecasts, response.forecasts.cost]
          : prev.costForecasts,
        scheduleForecasts: response.forecasts.schedule
          ? [...prev.scheduleForecasts, response.forecasts.schedule]
          : prev.scheduleForecasts,
        riskForecasts: response.forecasts.risk
          ? [...prev.riskForecasts, response.forecasts.risk]
          : prev.riskForecasts,
        qualityForecasts: response.forecasts.quality
          ? [...prev.qualityForecasts, response.forecasts.quality]
          : prev.qualityForecasts,
      }));

      return response;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: `Forecast generation failed: ${error.message}`,
      }));
      throw error;
    }
  }, []);

  const generateCostForecast = useCallback(async (
    projectId: string,
    config?: Partial<ForecastConfig>
  ): Promise<CostForecast> => {
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
  }, [generateForecast]);

  const generateScheduleForecast = useCallback(async (
    projectId: string,
    config?: Partial<ForecastConfig>
  ): Promise<ScheduleForecast> => {
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
  }, [generateForecast]);

  const generateRiskForecast = useCallback(async (
    projectId: string,
    config?: Partial<ForecastConfig>
  ): Promise<RiskForecast> => {
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
  }, [generateForecast]);

  // ============================================================================
  // Forecast Retrieval Methods
  // ============================================================================

  const getLatestCostForecast = useCallback((projectId: string): CostForecast | undefined => {
    return state.costForecasts
      .filter(f => f.projectId === projectId)
      .sort((a, b) => b.forecastDate.getTime() - a.forecastDate.getTime())[0];
  }, [state.costForecasts]);

  const getLatestScheduleForecast = useCallback((projectId: string): ScheduleForecast | undefined => {
    return state.scheduleForecasts
      .filter(f => f.projectId === projectId)
      .sort((a, b) => b.forecastDate.getTime() - a.forecastDate.getTime())[0];
  }, [state.scheduleForecasts]);

  const getLatestRiskForecast = useCallback((projectId: string): RiskForecast | undefined => {
    return state.riskForecasts
      .filter(f => f.projectId === projectId)
      .sort((a, b) => b.forecastDate.getTime() - a.forecastDate.getTime())[0];
  }, [state.riskForecasts]);

  const getAllForecasts = useCallback((projectId: string) => {
    return {
      cost: getLatestCostForecast(projectId),
      schedule: getLatestScheduleForecast(projectId),
      risk: getLatestRiskForecast(projectId),
    };
  }, [getLatestCostForecast, getLatestScheduleForecast, getLatestRiskForecast]);

  // ============================================================================
  // Forecast Management Methods
  // ============================================================================

  const refreshForecasts = useCallback(async (projectId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const forecasts = await predictiveAnalyticsService.getLatestForecasts(projectId);

      setState(prev => {
        // Remove old forecasts for this project
        const filteredCost = prev.costForecasts.filter(f => f.projectId !== projectId);
        const filteredSchedule = prev.scheduleForecasts.filter(f => f.projectId !== projectId);
        const filteredRisk = prev.riskForecasts.filter(f => f.projectId !== projectId);

        return {
          ...prev,
          isLoading: false,
          costForecasts: forecasts.cost ? [...filteredCost, forecasts.cost] : filteredCost,
          scheduleForecasts: forecasts.schedule ? [...filteredSchedule, forecasts.schedule] : filteredSchedule,
          riskForecasts: forecasts.risk ? [...filteredRisk, forecasts.risk] : filteredRisk,
        };
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: `Failed to refresh forecasts: ${error.message}`,
      }));
    }
  }, []);

  const clearForecasts = useCallback(() => {
    setState(prev => ({
      ...prev,
      costForecasts: [],
      scheduleForecasts: [],
      riskForecasts: [],
      qualityForecasts: [],
    }));
  }, []);

  // ============================================================================
  // State Management Methods
  // ============================================================================

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue: PredictiveAnalyticsContextType = {
    ...state,
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
    setLoading,
    setError,
    clearError,
  };

  return (
    <PredictiveAnalyticsContext.Provider value={contextValue}>
      {children}
    </PredictiveAnalyticsContext.Provider>
  );
};

// ============================================================================
// Custom Hook
// ============================================================================

export const usePredictiveAnalytics = (): PredictiveAnalyticsContextType => {
  const context = useContext(PredictiveAnalyticsContext);
  
  if (!context) {
    throw new Error('usePredictiveAnalytics must be used within PredictiveAnalyticsProvider');
  }
  
  return context;
};

export default PredictiveAnalyticsContext;
