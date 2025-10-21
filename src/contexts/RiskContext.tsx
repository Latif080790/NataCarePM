/**
 * Risk Management Context
 * Priority 3B: Risk Management System
 *
 * Provides global state management for risks, assessments,
 * mitigation plans, and risk analytics.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { riskService } from '@/api/riskService';
import type {
  Risk,
  RiskCategory,
  RiskStatus,
  RiskSeverity,
  RiskProbability,
  RiskPriorityLevel,
  RiskReview,
  RiskDashboardStats,
  RiskFilterOptions,
} from '@/types/risk.types';

/**
 * Risk Context State Interface
 */
interface RiskContextState {
  // Risks
  risks: Risk[];
  selectedRisk: Risk | null;
  risksLoading: boolean;
  risksError: string | null;

  // Dashboard
  dashboardStats: RiskDashboardStats | null;
  statsLoading: boolean;

  // Filters
  filters: RiskFilterOptions;

  // Actions - Risks
  fetchRisks: (projectId: string, filters?: RiskFilterOptions) => Promise<void>;
  fetchRiskById: (riskId: string) => Promise<Risk | null>;
  createRisk: (
    risk: Omit<
      Risk,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'riskScore'
      | 'priorityLevel'
      | 'reviewHistory'
      | 'statusHistory'
    >
  ) => Promise<Risk>;
  updateRisk: (riskId: string, updates: Partial<Risk>, changedBy: string) => Promise<void>;
  deleteRisk: (riskId: string) => Promise<void>;
  setSelectedRisk: (risk: Risk | null) => void;
  setFilters: (filters: RiskFilterOptions) => void;

  // Actions - Reviews
  createReview: (riskId: string, review: Omit<RiskReview, 'id'>) => Promise<void>;

  // Actions - Dashboard
  fetchDashboardStats: (projectId: string) => Promise<void>;

  // Utility
  getRisksByPriority: (priority: RiskPriorityLevel) => Risk[];
  getRisksByCategory: (category: RiskCategory) => Risk[];
  getRisksByStatus: (status: RiskStatus) => Risk[];
  getHighPriorityRisks: () => Risk[];
  refreshRisks: (projectId: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Create Context
 */
const RiskContext = createContext<RiskContextState | undefined>(undefined);

/**
 * Risk Provider Props
 */
interface RiskProviderProps {
  children: ReactNode;
}

/**
 * Risk Provider Component
 */
export const RiskProvider: React.FC<RiskProviderProps> = ({ children }) => {
  // State
  const [risks, setRisks] = useState<Risk[]>([]);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [risksLoading, setRisksLoading] = useState(false);
  const [risksError, setRisksError] = useState<string | null>(null);

  const [dashboardStats, setDashboardStats] = useState<RiskDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [filters, setFilters] = useState<RiskFilterOptions>({});

  /**
   * Fetch risks with optional filters
   */
  const fetchRisks = useCallback(
    async (projectId: string, filterOptions?: RiskFilterOptions) => {
      setRisksLoading(true);
      setRisksError(null);

      try {
        const fetchedRisks = await riskService.getRisks(projectId, filterOptions || filters);
        setRisks(fetchedRisks);
      } catch (error: any) {
        console.error('[RiskContext] Error fetching risks:', error);
        setRisksError(error.message || 'Failed to fetch risks');
      } finally {
        setRisksLoading(false);
      }
    },
    [filters]
  );

  /**
   * Fetch risk by ID
   */
  const fetchRiskById = useCallback(async (riskId: string): Promise<Risk | null> => {
    try {
      const risk = await riskService.getRiskById(riskId);
      if (risk) {
        // Update in list if exists
        setRisks((prev) => {
          const index = prev.findIndex((r) => r.id === riskId);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = risk;
            return updated;
          }
          return prev;
        });
      }
      return risk;
    } catch (error: any) {
      console.error('[RiskContext] Error fetching risk:', error);
      setRisksError(error.message || 'Failed to fetch risk');
      return null;
    }
  }, []);

  /**
   * Create new risk
   */
  const createRisk = useCallback(
    async (
      risk: Omit<
        Risk,
        | 'id'
        | 'createdAt'
        | 'updatedAt'
        | 'riskScore'
        | 'priorityLevel'
        | 'reviewHistory'
        | 'statusHistory'
      >
    ): Promise<Risk> => {
      setRisksLoading(true);
      setRisksError(null);

      try {
        const newRisk = await riskService.createRisk(risk);
        setRisks((prev) => [newRisk, ...prev]);
        return newRisk;
      } catch (error: any) {
        console.error('[RiskContext] Error creating risk:', error);
        setRisksError(error.message || 'Failed to create risk');
        throw error;
      } finally {
        setRisksLoading(false);
      }
    },
    []
  );

  /**
   * Update risk
   */
  const updateRisk = useCallback(
    async (riskId: string, updates: Partial<Risk>, changedBy: string): Promise<void> => {
      setRisksLoading(true);
      setRisksError(null);

      try {
        await riskService.updateRisk(riskId, updates, changedBy);

        // Fetch updated risk to get recalculated scores
        const updatedRisk = await riskService.getRiskById(riskId);

        if (updatedRisk) {
          // Update in local state
          setRisks((prev) => prev.map((r) => (r.id === riskId ? updatedRisk : r)));

          // Update selected risk if it's the one being updated
          if (selectedRisk?.id === riskId) {
            setSelectedRisk(updatedRisk);
          }
        }
      } catch (error: any) {
        console.error('[RiskContext] Error updating risk:', error);
        setRisksError(error.message || 'Failed to update risk');
        throw error;
      } finally {
        setRisksLoading(false);
      }
    },
    [selectedRisk]
  );

  /**
   * Delete risk
   */
  const deleteRisk = useCallback(
    async (riskId: string): Promise<void> => {
      setRisksLoading(true);
      setRisksError(null);

      try {
        await riskService.deleteRisk(riskId);

        // Remove from local state
        setRisks((prev) => prev.filter((r) => r.id !== riskId));

        // Clear selected risk if it's the one being deleted
        if (selectedRisk?.id === riskId) {
          setSelectedRisk(null);
        }
      } catch (error: any) {
        console.error('[RiskContext] Error deleting risk:', error);
        setRisksError(error.message || 'Failed to delete risk');
        throw error;
      } finally {
        setRisksLoading(false);
      }
    },
    [selectedRisk]
  );

  /**
   * Create risk review
   */
  const createReview = useCallback(
    async (riskId: string, review: Omit<RiskReview, 'id'>): Promise<void> => {
      try {
        await riskService.createReview(riskId, review);

        // Refresh risk to get updated review history
        await fetchRiskById(riskId);
      } catch (error: any) {
        console.error('[RiskContext] Error creating review:', error);
        throw error;
      }
    },
    [fetchRiskById]
  );

  /**
   * Fetch dashboard statistics
   */
  const fetchDashboardStats = useCallback(async (projectId: string): Promise<void> => {
    setStatsLoading(true);

    try {
      const stats = await riskService.getDashboardStats(projectId);
      setDashboardStats(stats);
    } catch (error: any) {
      console.error('[RiskContext] Error fetching dashboard stats:', error);
      setRisksError(error.message || 'Failed to fetch dashboard stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /**
   * Get risks by priority level
   */
  const getRisksByPriority = useCallback(
    (priority: RiskPriorityLevel): Risk[] => {
      return risks.filter((r) => r.priorityLevel === priority);
    },
    [risks]
  );

  /**
   * Get risks by category
   */
  const getRisksByCategory = useCallback(
    (category: RiskCategory): Risk[] => {
      return risks.filter((r) => r.category === category);
    },
    [risks]
  );

  /**
   * Get risks by status
   */
  const getRisksByStatus = useCallback(
    (status: RiskStatus): Risk[] => {
      return risks.filter((r) => r.status === status);
    },
    [risks]
  );

  /**
   * Get high priority risks (critical + high)
   */
  const getHighPriorityRisks = useCallback((): Risk[] => {
    return risks.filter((r) => r.priorityLevel === 'critical' || r.priorityLevel === 'high');
  }, [risks]);

  /**
   * Refresh risks and stats
   */
  const refreshRisks = useCallback(
    async (projectId: string): Promise<void> => {
      await fetchRisks(projectId);
      await fetchDashboardStats(projectId);
    },
    [fetchRisks, fetchDashboardStats]
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setRisksError(null);
  }, []);

  /**
   * Context value
   */
  const value: RiskContextState = {
    // Risks
    risks,
    selectedRisk,
    risksLoading,
    risksError,

    // Dashboard
    dashboardStats,
    statsLoading,

    // Filters
    filters,

    // Actions - Risks
    fetchRisks,
    fetchRiskById,
    createRisk,
    updateRisk,
    deleteRisk,
    setSelectedRisk,
    setFilters,

    // Actions - Reviews
    createReview,

    // Actions - Dashboard
    fetchDashboardStats,

    // Utility
    getRisksByPriority,
    getRisksByCategory,
    getRisksByStatus,
    getHighPriorityRisks,
    refreshRisks,
    clearError,
  };

  return <RiskContext.Provider value={value}>{children}</RiskContext.Provider>;
};

/**
 * Custom hook to use Risk Context
 */
export const useRisk = (): RiskContextState => {
  const context = useContext(RiskContext);

  if (context === undefined) {
    throw new Error('useRisk must be used within a RiskProvider');
  }

  return context;
};

export default RiskContext;
