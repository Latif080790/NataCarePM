/**
 * Quality Management Context
 * Priority 3D: Quality Management System
 * 
 * Provides global state management for quality inspections,
 * defects, and quality metrics.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { qualityService } from '../api/qualityService';
import type {
  QualityInspection,
  Defect,
  QualityMetrics,
  InspectionStatus,
  InspectionResult,
  DefectStatus,
  DefectSeverity,
  QualityFilterOptions,
  DefectFilterOptions,
} from '../types/quality.types';

/**
 * Quality Context State Interface
 */
interface QualityContextState {
  // Inspections
  inspections: QualityInspection[];
  selectedInspection: QualityInspection | null;
  inspectionsLoading: boolean;
  inspectionsError: string | null;
  
  // Defects
  defects: Defect[];
  selectedDefect: Defect | null;
  defectsLoading: boolean;
  defectsError: string | null;
  
  // Metrics
  metrics: QualityMetrics | null;
  metricsLoading: boolean;
  
  // Filters
  inspectionFilters: QualityFilterOptions;
  defectFilters: DefectFilterOptions;
  
  // Actions - Inspections
  fetchInspections: (projectId: string, filters?: QualityFilterOptions) => Promise<void>;
  fetchInspectionById: (inspectionId: string) => Promise<QualityInspection | null>;
  createInspection: (inspection: Omit<QualityInspection, 'id' | 'inspectionNumber' | 'createdAt' | 'updatedAt'>) => Promise<QualityInspection>;
  updateInspection: (inspectionId: string, updates: Partial<QualityInspection>) => Promise<void>;
  setSelectedInspection: (inspection: QualityInspection | null) => void;
  setInspectionFilters: (filters: QualityFilterOptions) => void;
  
  // Actions - Defects
  fetchDefects: (projectId: string, filters?: DefectFilterOptions) => Promise<void>;
  createDefect: (defect: Omit<Defect, 'id' | 'defectNumber' | 'createdAt' | 'updatedAt'>) => Promise<Defect>;
  updateDefect: (defectId: string, updates: Partial<Defect>) => Promise<void>;
  setSelectedDefect: (defect: Defect | null) => void;
  setDefectFilters: (filters: DefectFilterOptions) => void;
  
  // Actions - Metrics
  fetchMetrics: (projectId: string, periodStart: Date, periodEnd: Date) => Promise<void>;
  
  // Utility
  getInspectionsByStatus: (status: InspectionStatus) => QualityInspection[];
  getInspectionsByResult: (result: InspectionResult) => QualityInspection[];
  getDefectsBySeverity: (severity: DefectSeverity) => Defect[];
  getDefectsByStatus: (status: DefectStatus) => Defect[];
  getOpenDefects: () => Defect[];
  getCriticalDefects: () => Defect[];
  getPassRate: () => number;
  getDefectRate: () => number;
  refreshQuality: (projectId: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Create Context
 */
const QualityContext = createContext<QualityContextState | undefined>(undefined);

/**
 * Quality Provider Props
 */
interface QualityProviderProps {
  children: ReactNode;
}

/**
 * Quality Provider Component
 */
export const QualityProvider: React.FC<QualityProviderProps> = ({ children }) => {
  // State
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);
  const [inspectionsLoading, setInspectionsLoading] = useState(false);
  const [inspectionsError, setInspectionsError] = useState<string | null>(null);
  
  const [defects, setDefects] = useState<Defect[]>([]);
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);
  const [defectsLoading, setDefectsLoading] = useState(false);
  const [defectsError, setDefectsError] = useState<string | null>(null);
  
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  
  const [inspectionFilters, setInspectionFilters] = useState<QualityFilterOptions>({});
  const [defectFilters, setDefectFilters] = useState<DefectFilterOptions>({});

  /**
   * Fetch inspections with optional filters
   */
  const fetchInspections = useCallback(async (projectId: string, filterOptions?: QualityFilterOptions) => {
    setInspectionsLoading(true);
    setInspectionsError(null);
    
    try {
      const fetchedInspections = await qualityService.getInspections(projectId, filterOptions || inspectionFilters);
      setInspections(fetchedInspections);
    } catch (error: any) {
      console.error('[QualityContext] Error fetching inspections:', error);
      setInspectionsError(error.message || 'Failed to fetch inspections');
    } finally {
      setInspectionsLoading(false);
    }
  }, [inspectionFilters]);

  /**
   * Fetch inspection by ID
   */
  const fetchInspectionById = useCallback(async (inspectionId: string): Promise<QualityInspection | null> => {
    try {
      const inspection = await qualityService.getInspectionById(inspectionId);
      if (inspection) {
        // Update in list if exists
        setInspections(prev => {
          const index = prev.findIndex(i => i.id === inspectionId);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = inspection;
            return updated;
          }
          return prev;
        });
      }
      return inspection;
    } catch (error: any) {
      console.error('[QualityContext] Error fetching inspection:', error);
      setInspectionsError(error.message || 'Failed to fetch inspection');
      return null;
    }
  }, []);

  /**
   * Create new inspection
   */
  const createInspection = useCallback(async (
    inspection: Omit<QualityInspection, 'id' | 'inspectionNumber' | 'createdAt' | 'updatedAt'>
  ): Promise<QualityInspection> => {
    setInspectionsLoading(true);
    setInspectionsError(null);
    
    try {
      const newInspection = await qualityService.createInspection(inspection);
      setInspections(prev => [newInspection, ...prev]);
      
      // Create defects for failed items
      if (newInspection.defectsFound && newInspection.defectsFound.length > 0) {
        // Refresh defects list
        await fetchDefects(inspection.projectId);
      }
      
      return newInspection;
    } catch (error: any) {
      console.error('[QualityContext] Error creating inspection:', error);
      setInspectionsError(error.message || 'Failed to create inspection');
      throw error;
    } finally {
      setInspectionsLoading(false);
    }
  }, []);

  /**
   * Update inspection
   */
  const updateInspection = useCallback(async (
    inspectionId: string,
    updates: Partial<QualityInspection>
  ): Promise<void> => {
    setInspectionsLoading(true);
    setInspectionsError(null);
    
    try {
      // Note: qualityService doesn't have updateInspection method
      // This would need to be added to the API service
      // For now, we'll just update local state
      setInspections(prev => prev.map(i => 
        i.id === inspectionId ? { ...i, ...updates, updatedAt: new Date() } : i
      ));
      
      if (selectedInspection?.id === inspectionId) {
        setSelectedInspection(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
      }
    } catch (error: any) {
      console.error('[QualityContext] Error updating inspection:', error);
      setInspectionsError(error.message || 'Failed to update inspection');
      throw error;
    } finally {
      setInspectionsLoading(false);
    }
  }, [selectedInspection]);

  /**
   * Fetch defects with optional filters
   */
  const fetchDefects = useCallback(async (projectId: string, filterOptions?: DefectFilterOptions) => {
    setDefectsLoading(true);
    setDefectsError(null);
    
    try {
      const fetchedDefects = await qualityService.getDefects(projectId, filterOptions || defectFilters);
      setDefects(fetchedDefects);
    } catch (error: any) {
      console.error('[QualityContext] Error fetching defects:', error);
      setDefectsError(error.message || 'Failed to fetch defects');
    } finally {
      setDefectsLoading(false);
    }
  }, [defectFilters]);

  /**
   * Create new defect
   */
  const createDefect = useCallback(async (
    defect: Omit<Defect, 'id' | 'defectNumber' | 'createdAt' | 'updatedAt'>
  ): Promise<Defect> => {
    setDefectsLoading(true);
    setDefectsError(null);
    
    try {
      const newDefect = await qualityService.createDefect(defect);
      setDefects(prev => [newDefect, ...prev]);
      return newDefect;
    } catch (error: any) {
      console.error('[QualityContext] Error creating defect:', error);
      setDefectsError(error.message || 'Failed to create defect');
      throw error;
    } finally {
      setDefectsLoading(false);
    }
  }, []);

  /**
   * Update defect
   */
  const updateDefect = useCallback(async (
    defectId: string,
    updates: Partial<Defect>
  ): Promise<void> => {
    setDefectsLoading(true);
    setDefectsError(null);
    
    try {
      await qualityService.updateDefect(defectId, updates);
      
      // Update in local state
      setDefects(prev => prev.map(d => 
        d.id === defectId ? { ...d, ...updates, updatedAt: new Date() } : d
      ));
      
      if (selectedDefect?.id === defectId) {
        setSelectedDefect(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
      }
    } catch (error: any) {
      console.error('[QualityContext] Error updating defect:', error);
      setDefectsError(error.message || 'Failed to update defect');
      throw error;
    } finally {
      setDefectsLoading(false);
    }
  }, [selectedDefect]);

  /**
   * Fetch quality metrics
   */
  const fetchMetrics = useCallback(async (
    projectId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<void> => {
    setMetricsLoading(true);
    
    try {
      const metricsData = await qualityService.getQualityMetrics(projectId, periodStart, periodEnd);
      setMetrics(metricsData);
    } catch (error: any) {
      console.error('[QualityContext] Error fetching metrics:', error);
      setInspectionsError(error.message || 'Failed to fetch metrics');
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  /**
   * Get inspections by status
   */
  const getInspectionsByStatus = useCallback((status: InspectionStatus): QualityInspection[] => {
    return inspections.filter(i => i.status === status);
  }, [inspections]);

  /**
   * Get inspections by result
   */
  const getInspectionsByResult = useCallback((result: InspectionResult): QualityInspection[] => {
    return inspections.filter(i => i.overallResult === result);
  }, [inspections]);

  /**
   * Get defects by severity
   */
  const getDefectsBySeverity = useCallback((severity: DefectSeverity): Defect[] => {
    return defects.filter(d => d.severity === severity);
  }, [defects]);

  /**
   * Get defects by status
   */
  const getDefectsByStatus = useCallback((status: DefectStatus): Defect[] => {
    return defects.filter(d => d.status === status);
  }, [defects]);

  /**
   * Get open defects
   */
  const getOpenDefects = useCallback((): Defect[] => {
    return defects.filter(d => ['open', 'in_progress'].includes(d.status));
  }, [defects]);

  /**
   * Get critical defects
   */
  const getCriticalDefects = useCallback((): Defect[] => {
    return defects.filter(d => d.severity === 'critical' && ['open', 'in_progress'].includes(d.status));
  }, [defects]);

  /**
   * Get overall pass rate
   */
  const getPassRate = useCallback((): number => {
    const completedInspections = inspections.filter(i => i.status === 'completed');
    if (completedInspections.length === 0) return 0;
    
    const passedInspections = completedInspections.filter(i => i.overallResult === 'pass');
    return (passedInspections.length / completedInspections.length) * 100;
  }, [inspections]);

  /**
   * Get defect rate
   */
  const getDefectRate = useCallback((): number => {
    const completedInspections = inspections.filter(i => i.status === 'completed');
    if (completedInspections.length === 0) return 0;
    
    return defects.length / completedInspections.length;
  }, [inspections, defects]);

  /**
   * Refresh all quality data
   */
  const refreshQuality = useCallback(async (projectId: string): Promise<void> => {
    await fetchInspections(projectId);
    await fetchDefects(projectId);
    
    // Fetch metrics for last 30 days
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - 30);
    await fetchMetrics(projectId, periodStart, periodEnd);
  }, [fetchInspections, fetchDefects, fetchMetrics]);

  /**
   * Clear errors
   */
  const clearError = useCallback(() => {
    setInspectionsError(null);
    setDefectsError(null);
  }, []);

  /**
   * Context value
   */
  const value: QualityContextState = {
    // Inspections
    inspections,
    selectedInspection,
    inspectionsLoading,
    inspectionsError,
    
    // Defects
    defects,
    selectedDefect,
    defectsLoading,
    defectsError,
    
    // Metrics
    metrics,
    metricsLoading,
    
    // Filters
    inspectionFilters,
    defectFilters,
    
    // Actions - Inspections
    fetchInspections,
    fetchInspectionById,
    createInspection,
    updateInspection,
    setSelectedInspection,
    setInspectionFilters,
    
    // Actions - Defects
    fetchDefects,
    createDefect,
    updateDefect,
    setSelectedDefect,
    setDefectFilters,
    
    // Actions - Metrics
    fetchMetrics,
    
    // Utility
    getInspectionsByStatus,
    getInspectionsByResult,
    getDefectsBySeverity,
    getDefectsByStatus,
    getOpenDefects,
    getCriticalDefects,
    getPassRate,
    getDefectRate,
    refreshQuality,
    clearError,
  };

  return (
    <QualityContext.Provider value={value}>
      {children}
    </QualityContext.Provider>
  );
};

/**
 * Custom hook to use Quality Context
 */
export const useQuality = (): QualityContextState => {
  const context = useContext(QualityContext);
  
  if (context === undefined) {
    throw new Error('useQuality must be used within a QualityProvider');
  }
  
  return context;
};

export default QualityContext;
