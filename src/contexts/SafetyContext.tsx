/**
 * Safety Management Context
 * Phase 3.5: Quick Wins - Safety Management System
 *
 * Provides global state management for safety incidents, training,
 * PPE, audits, and safety metrics
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { safetyService } from '@/api/safetyService';
import type {
  SafetyIncident,
  SafetyTraining,
  PPEInventory,
  PPEAssignment,
  SafetyAudit,
  SafetyObservation,
  SafetyMetrics,
  SafetyDashboardSummary,
  IncidentSeverity,
  IncidentStatus,
  TrainingStatus,
  AuditStatus,
} from '@/types/safety.types';

/**
 * Safety Context State Interface
 */
interface SafetyContextState {
  // Incidents
  incidents: SafetyIncident[];
  selectedIncident: SafetyIncident | null;
  incidentsLoading: boolean;
  incidentsError: string | null;

  // Training
  training: SafetyTraining[];
  selectedTraining: SafetyTraining | null;
  trainingLoading: boolean;
  trainingError: string | null;

  // PPE
  ppeInventory: PPEInventory[];
  ppeAssignments: PPEAssignment[];
  ppeLoading: boolean;
  ppeError: string | null;

  // Audits
  audits: SafetyAudit[];
  selectedAudit: SafetyAudit | null;
  auditsLoading: boolean;
  auditsError: string | null;

  // Observations
  observations: SafetyObservation[];
  observationsLoading: boolean;
  observationsError: string | null;

  // Metrics & Dashboard
  metrics: SafetyMetrics | null;
  dashboardSummary: SafetyDashboardSummary | null;
  metricsLoading: boolean;

  // Actions - Incidents
  fetchIncidents: (projectId: string) => Promise<void>;
  fetchIncidentById: (incidentId: string) => Promise<SafetyIncident | null>;
  createIncident: (
    incident: Omit<SafetyIncident, 'id' | 'incidentNumber' | 'createdAt' | 'updatedAt'>
  ) => Promise<SafetyIncident>;
  updateIncident: (incidentId: string, updates: Partial<SafetyIncident>) => Promise<void>;
  deleteIncident: (incidentId: string) => Promise<void>;
  setSelectedIncident: (incident: SafetyIncident | null) => void;

  // Actions - Training
  fetchTraining: (projectId: string) => Promise<void>;
  createTraining: (
    training: Omit<SafetyTraining, 'id' | 'trainingNumber' | 'createdAt' | 'updatedAt'>
  ) => Promise<SafetyTraining>;
  updateTraining: (trainingId: string, updates: Partial<SafetyTraining>) => Promise<void>;
  setSelectedTraining: (training: SafetyTraining | null) => void;

  // Actions - PPE
  fetchPPEInventory: (projectId: string) => Promise<void>;
  fetchPPEAssignments: (projectId: string) => Promise<void>;
  createPPEItem: (
    ppe: Omit<PPEInventory, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<PPEInventory>;
  updatePPEItem: (ppeId: string, updates: Partial<PPEInventory>) => Promise<void>;
  createPPEAssignment: (
    assignment: Omit<PPEAssignment, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<PPEAssignment>;

  // Actions - Audits
  fetchAudits: (projectId: string) => Promise<void>;
  createAudit: (
    audit: Omit<SafetyAudit, 'id' | 'auditNumber' | 'createdAt' | 'updatedAt'>
  ) => Promise<SafetyAudit>;
  updateAudit: (auditId: string, updates: Partial<SafetyAudit>) => Promise<void>;
  setSelectedAudit: (audit: SafetyAudit | null) => void;

  // Actions - Observations
  fetchObservations: (projectId: string) => Promise<void>;
  createObservation: (
    observation: Omit<SafetyObservation, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<SafetyObservation>;

  // Actions - Metrics
  fetchMetrics: (projectId: string, periodStart: Date, periodEnd: Date) => Promise<void>;
  fetchDashboardSummary: (projectId: string) => Promise<void>;

  // Utility
  getIncidentsBySeverity: (severity: IncidentSeverity) => SafetyIncident[];
  getIncidentsByStatus: (status: IncidentStatus) => SafetyIncident[];
  getCriticalIncidents: () => SafetyIncident[];
  getOpenIncidents: () => SafetyIncident[];
  getTrainingByStatus: (status: TrainingStatus) => SafetyTraining[];
  getUpcomingTraining: () => SafetyTraining[];
  getAuditsByStatus: (status: AuditStatus) => SafetyAudit[];
  refreshSafety: (projectId: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Create Context
 */
const SafetyContext = createContext<SafetyContextState | undefined>(undefined);

/**
 * Safety Provider Props
 */
interface SafetyProviderProps {
  children: ReactNode;
}

/**
 * Safety Provider Component
 */
export const SafetyProvider: React.FC<SafetyProviderProps> = ({ children }) => {
  // State - Incidents
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<SafetyIncident | null>(null);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [incidentsError, setIncidentsError] = useState<string | null>(null);

  // State - Training
  const [training, setTraining] = useState<SafetyTraining[]>([]);
  const [selectedTraining, setSelectedTraining] = useState<SafetyTraining | null>(null);
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [trainingError, setTrainingError] = useState<string | null>(null);

  // State - PPE
  const [ppeInventory, setPPEInventory] = useState<PPEInventory[]>([]);
  const [ppeAssignments, setPPEAssignments] = useState<PPEAssignment[]>([]);
  const [ppeLoading, setPPELoading] = useState(false);
  const [ppeError, setPPEError] = useState<string | null>(null);

  // State - Audits
  const [audits, setAudits] = useState<SafetyAudit[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<SafetyAudit | null>(null);
  const [auditsLoading, setAuditsLoading] = useState(false);
  const [auditsError, setAuditsError] = useState<string | null>(null);

  // State - Observations
  const [observations, setObservations] = useState<SafetyObservation[]>([]);
  const [observationsLoading, setObservationsLoading] = useState(false);
  const [observationsError, setObservationsError] = useState<string | null>(null);

  // State - Metrics
  const [metrics, setMetrics] = useState<SafetyMetrics | null>(null);
  const [dashboardSummary, setDashboardSummary] = useState<SafetyDashboardSummary | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  /**
   * Fetch incidents
   */
  const fetchIncidents = useCallback(async (projectId: string) => {
    setIncidentsLoading(true);
    setIncidentsError(null);

    try {
      const fetchedIncidents = await safetyService.getIncidents(projectId);
      setIncidents(fetchedIncidents);
    } catch (error: any) {
      console.error('[SafetyContext] Error fetching incidents:', error);
      setIncidentsError(error.message || 'Failed to fetch incidents');
    } finally {
      setIncidentsLoading(false);
    }
  }, []);

  /**
   * Fetch incident by ID
   */
  const fetchIncidentById = useCallback(
    async (incidentId: string): Promise<SafetyIncident | null> => {
      try {
        const incident = await safetyService.getIncidentById(incidentId);
        if (incident) {
          setIncidents((prev) => {
            const index = prev.findIndex((i) => i.id === incidentId);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = incident;
              return updated;
            }
            return prev;
          });
        }
        return incident;
      } catch (error: any) {
        console.error('[SafetyContext] Error fetching incident:', error);
        setIncidentsError(error.message || 'Failed to fetch incident');
        return null;
      }
    },
    []
  );

  /**
   * Create incident
   */
  const createIncident = useCallback(
    async (
      incident: Omit<SafetyIncident, 'id' | 'incidentNumber' | 'createdAt' | 'updatedAt'>
    ): Promise<SafetyIncident> => {
      setIncidentsLoading(true);
      setIncidentsError(null);

      try {
        const newIncident = await safetyService.createIncident(incident);
        setIncidents((prev) => [newIncident, ...prev]);
        return newIncident;
      } catch (error: any) {
        console.error('[SafetyContext] Error creating incident:', error);
        setIncidentsError(error.message || 'Failed to create incident');
        throw error;
      } finally {
        setIncidentsLoading(false);
      }
    },
    []
  );

  /**
   * Update incident
   */
  const updateIncident = useCallback(
    async (incidentId: string, updates: Partial<SafetyIncident>): Promise<void> => {
      setIncidentsLoading(true);
      setIncidentsError(null);

      try {
        await safetyService.updateIncident(incidentId, updates);

        setIncidents((prev) =>
          prev.map((i) => (i.id === incidentId ? { ...i, ...updates, updatedAt: new Date() } : i))
        );

        if (selectedIncident?.id === incidentId) {
          setSelectedIncident((prev) =>
            prev ? { ...prev, ...updates, updatedAt: new Date() } : null
          );
        }
      } catch (error: any) {
        console.error('[SafetyContext] Error updating incident:', error);
        setIncidentsError(error.message || 'Failed to update incident');
        throw error;
      } finally {
        setIncidentsLoading(false);
      }
    },
    [selectedIncident]
  );

  /**
   * Delete incident
   */
  const deleteIncident = useCallback(
    async (incidentId: string): Promise<void> => {
      setIncidentsLoading(true);
      setIncidentsError(null);

      try {
        await safetyService.deleteIncident(incidentId);
        setIncidents((prev) => prev.filter((i) => i.id !== incidentId));

        if (selectedIncident?.id === incidentId) {
          setSelectedIncident(null);
        }
      } catch (error: any) {
        console.error('[SafetyContext] Error deleting incident:', error);
        setIncidentsError(error.message || 'Failed to delete incident');
        throw error;
      } finally {
        setIncidentsLoading(false);
      }
    },
    [selectedIncident]
  );

  /**
   * Fetch training
   */
  const fetchTraining = useCallback(async (projectId: string) => {
    setTrainingLoading(true);
    setTrainingError(null);

    try {
      const fetchedTraining = await safetyService.getTraining(projectId);
      setTraining(fetchedTraining);
    } catch (error: any) {
      console.error('[SafetyContext] Error fetching training:', error);
      setTrainingError(error.message || 'Failed to fetch training');
    } finally {
      setTrainingLoading(false);
    }
  }, []);

  /**
   * Create training
   */
  const createTraining = useCallback(
    async (
      trainingData: Omit<SafetyTraining, 'id' | 'trainingNumber' | 'createdAt' | 'updatedAt'>
    ): Promise<SafetyTraining> => {
      setTrainingLoading(true);
      setTrainingError(null);

      try {
        const newTraining = await safetyService.createTraining(trainingData);
        setTraining((prev) => [newTraining, ...prev]);
        return newTraining;
      } catch (error: any) {
        console.error('[SafetyContext] Error creating training:', error);
        setTrainingError(error.message || 'Failed to create training');
        throw error;
      } finally {
        setTrainingLoading(false);
      }
    },
    []
  );

  /**
   * Update training
   */
  const updateTraining = useCallback(
    async (trainingId: string, updates: Partial<SafetyTraining>): Promise<void> => {
      setTrainingLoading(true);
      setTrainingError(null);

      try {
        await safetyService.updateTraining(trainingId, updates);

        setTraining((prev) =>
          prev.map((t) => (t.id === trainingId ? { ...t, ...updates, updatedAt: new Date() } : t))
        );

        if (selectedTraining?.id === trainingId) {
          setSelectedTraining((prev) =>
            prev ? { ...prev, ...updates, updatedAt: new Date() } : null
          );
        }
      } catch (error: any) {
        console.error('[SafetyContext] Error updating training:', error);
        setTrainingError(error.message || 'Failed to update training');
        throw error;
      } finally {
        setTrainingLoading(false);
      }
    },
    [selectedTraining]
  );

  /**
   * Fetch PPE inventory
   */
  const fetchPPEInventory = useCallback(async (projectId: string) => {
    setPPELoading(true);
    setPPEError(null);

    try {
      const inventory = await safetyService.getPPEInventory(projectId);
      setPPEInventory(inventory);
    } catch (error: any) {
      console.error('[SafetyContext] Error fetching PPE inventory:', error);
      setPPEError(error.message || 'Failed to fetch PPE inventory');
    } finally {
      setPPELoading(false);
    }
  }, []);

  /**
   * Fetch PPE assignments
   */
  const fetchPPEAssignments = useCallback(async (projectId: string) => {
    setPPELoading(true);
    setPPEError(null);

    try {
      const assignments = await safetyService.getPPEAssignments(projectId);
      setPPEAssignments(assignments);
    } catch (error: any) {
      console.error('[SafetyContext] Error fetching PPE assignments:', error);
      setPPEError(error.message || 'Failed to fetch PPE assignments');
    } finally {
      setPPELoading(false);
    }
  }, []);

  /**
   * Create PPE item
   */
  const createPPEItem = useCallback(
    async (ppe: Omit<PPEInventory, 'id' | 'createdAt' | 'updatedAt'>): Promise<PPEInventory> => {
      setPPELoading(true);
      setPPEError(null);

      try {
        const newItem = await safetyService.createPPEItem(ppe);
        setPPEInventory((prev) => [newItem, ...prev]);
        return newItem;
      } catch (error: any) {
        console.error('[SafetyContext] Error creating PPE item:', error);
        setPPEError(error.message || 'Failed to create PPE item');
        throw error;
      } finally {
        setPPELoading(false);
      }
    },
    []
  );

  /**
   * Update PPE item
   */
  const updatePPEItem = useCallback(
    async (ppeId: string, updates: Partial<PPEInventory>): Promise<void> => {
      setPPELoading(true);
      setPPEError(null);

      try {
        await safetyService.updatePPEItem(ppeId, updates);

        setPPEInventory((prev) =>
          prev.map((p) => (p.id === ppeId ? { ...p, ...updates, updatedAt: new Date() } : p))
        );
      } catch (error: any) {
        console.error('[SafetyContext] Error updating PPE item:', error);
        setPPEError(error.message || 'Failed to update PPE item');
        throw error;
      } finally {
        setPPELoading(false);
      }
    },
    []
  );

  /**
   * Create PPE assignment
   */
  const createPPEAssignment = useCallback(
    async (
      assignment: Omit<PPEAssignment, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<PPEAssignment> => {
      setPPELoading(true);
      setPPEError(null);

      try {
        const newAssignment = await safetyService.createPPEAssignment(assignment);
        setPPEAssignments((prev) => [newAssignment, ...prev]);
        return newAssignment;
      } catch (error: any) {
        console.error('[SafetyContext] Error creating PPE assignment:', error);
        setPPEError(error.message || 'Failed to create PPE assignment');
        throw error;
      } finally {
        setPPELoading(false);
      }
    },
    []
  );

  /**
   * Fetch audits
   */
  const fetchAudits = useCallback(async (projectId: string) => {
    setAuditsLoading(true);
    setAuditsError(null);

    try {
      const fetchedAudits = await safetyService.getAudits(projectId);
      setAudits(fetchedAudits);
    } catch (error: any) {
      console.error('[SafetyContext] Error fetching audits:', error);
      setAuditsError(error.message || 'Failed to fetch audits');
    } finally {
      setAuditsLoading(false);
    }
  }, []);

  /**
   * Create audit
   */
  const createAudit = useCallback(
    async (
      audit: Omit<SafetyAudit, 'id' | 'auditNumber' | 'createdAt' | 'updatedAt'>
    ): Promise<SafetyAudit> => {
      setAuditsLoading(true);
      setAuditsError(null);

      try {
        const newAudit = await safetyService.createAudit(audit);
        setAudits((prev) => [newAudit, ...prev]);
        return newAudit;
      } catch (error: any) {
        console.error('[SafetyContext] Error creating audit:', error);
        setAuditsError(error.message || 'Failed to create audit');
        throw error;
      } finally {
        setAuditsLoading(false);
      }
    },
    []
  );

  /**
   * Update audit
   */
  const updateAudit = useCallback(
    async (auditId: string, updates: Partial<SafetyAudit>): Promise<void> => {
      setAuditsLoading(true);
      setAuditsError(null);

      try {
        await safetyService.updateAudit(auditId, updates);

        setAudits((prev) =>
          prev.map((a) => (a.id === auditId ? { ...a, ...updates, updatedAt: new Date() } : a))
        );

        if (selectedAudit?.id === auditId) {
          setSelectedAudit((prev) =>
            prev ? { ...prev, ...updates, updatedAt: new Date() } : null
          );
        }
      } catch (error: any) {
        console.error('[SafetyContext] Error updating audit:', error);
        setAuditsError(error.message || 'Failed to update audit');
        throw error;
      } finally {
        setAuditsLoading(false);
      }
    },
    [selectedAudit]
  );

  /**
   * Fetch observations
   */
  const fetchObservations = useCallback(async (projectId: string) => {
    setObservationsLoading(true);
    setObservationsError(null);

    try {
      const fetchedObservations = await safetyService.getObservations(projectId);
      setObservations(fetchedObservations);
    } catch (error: any) {
      console.error('[SafetyContext] Error fetching observations:', error);
      setObservationsError(error.message || 'Failed to fetch observations');
    } finally {
      setObservationsLoading(false);
    }
  }, []);

  /**
   * Create observation
   */
  const createObservation = useCallback(
    async (
      observation: Omit<SafetyObservation, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<SafetyObservation> => {
      setObservationsLoading(true);
      setObservationsError(null);

      try {
        const newObservation = await safetyService.createObservation(observation);
        setObservations((prev) => [newObservation, ...prev]);
        return newObservation;
      } catch (error: any) {
        console.error('[SafetyContext] Error creating observation:', error);
        setObservationsError(error.message || 'Failed to create observation');
        throw error;
      } finally {
        setObservationsLoading(false);
      }
    },
    []
  );

  /**
   * Fetch metrics
   */
  const fetchMetrics = useCallback(
    async (projectId: string, periodStart: Date, periodEnd: Date): Promise<void> => {
      setMetricsLoading(true);

      try {
        const calculatedMetrics = await safetyService.calculateMetrics(
          projectId,
          periodStart,
          periodEnd
        );
        setMetrics(calculatedMetrics);
      } catch (error: any) {
        console.error('[SafetyContext] Error fetching metrics:', error);
        setIncidentsError(error.message || 'Failed to fetch metrics');
      } finally {
        setMetricsLoading(false);
      }
    },
    []
  );

  /**
   * Fetch dashboard summary
   */
  const fetchDashboardSummary = useCallback(async (projectId: string): Promise<void> => {
    setMetricsLoading(true);

    try {
      const summary = await safetyService.getDashboardSummary(projectId);
      setDashboardSummary(summary);
    } catch (error: any) {
      console.error('[SafetyContext] Error fetching dashboard summary:', error);
      setIncidentsError(error.message || 'Failed to fetch dashboard summary');
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  /**
   * Get incidents by severity
   */
  const getIncidentsBySeverity = useCallback(
    (severity: IncidentSeverity): SafetyIncident[] => {
      return incidents.filter((i) => i.severity === severity);
    },
    [incidents]
  );

  /**
   * Get incidents by status
   */
  const getIncidentsByStatus = useCallback(
    (status: IncidentStatus): SafetyIncident[] => {
      return incidents.filter((i) => i.status === status);
    },
    [incidents]
  );

  /**
   * Get critical incidents
   */
  const getCriticalIncidents = useCallback((): SafetyIncident[] => {
    return incidents.filter((i) => i.severity === 'critical' || i.severity === 'fatal');
  }, [incidents]);

  /**
   * Get open incidents
   */
  const getOpenIncidents = useCallback((): SafetyIncident[] => {
    return incidents.filter((i) =>
      ['reported', 'investigating', 'corrective_action'].includes(i.status)
    );
  }, [incidents]);

  /**
   * Get training by status
   */
  const getTrainingByStatus = useCallback(
    (status: TrainingStatus): SafetyTraining[] => {
      return training.filter((t) => t.status === status);
    },
    [training]
  );

  /**
   * Get upcoming training
   */
  const getUpcomingTraining = useCallback((): SafetyTraining[] => {
    const now = new Date();
    return training
      .filter((t) => t.scheduledDate > now && t.status === 'scheduled')
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  }, [training]);

  /**
   * Get audits by status
   */
  const getAuditsByStatus = useCallback(
    (status: AuditStatus): SafetyAudit[] => {
      return audits.filter((a) => a.status === status);
    },
    [audits]
  );

  /**
   * Refresh all safety data
   */
  const refreshSafety = useCallback(
    async (projectId: string): Promise<void> => {
      await Promise.all([
        fetchIncidents(projectId),
        fetchTraining(projectId),
        fetchPPEInventory(projectId),
        fetchPPEAssignments(projectId),
        fetchAudits(projectId),
        fetchObservations(projectId),
        fetchDashboardSummary(projectId),
      ]);
    },
    [
      fetchIncidents,
      fetchTraining,
      fetchPPEInventory,
      fetchPPEAssignments,
      fetchAudits,
      fetchObservations,
      fetchDashboardSummary,
    ]
  );

  /**
   * Clear errors
   */
  const clearError = useCallback(() => {
    setIncidentsError(null);
    setTrainingError(null);
    setPPEError(null);
    setAuditsError(null);
    setObservationsError(null);
  }, []);

  /**
   * Context value
   */
  const value: SafetyContextState = {
    // Incidents
    incidents,
    selectedIncident,
    incidentsLoading,
    incidentsError,

    // Training
    training,
    selectedTraining,
    trainingLoading,
    trainingError,

    // PPE
    ppeInventory,
    ppeAssignments,
    ppeLoading,
    ppeError,

    // Audits
    audits,
    selectedAudit,
    auditsLoading,
    auditsError,

    // Observations
    observations,
    observationsLoading,
    observationsError,

    // Metrics
    metrics,
    dashboardSummary,
    metricsLoading,

    // Actions - Incidents
    fetchIncidents,
    fetchIncidentById,
    createIncident,
    updateIncident,
    deleteIncident,
    setSelectedIncident,

    // Actions - Training
    fetchTraining,
    createTraining,
    updateTraining,
    setSelectedTraining,

    // Actions - PPE
    fetchPPEInventory,
    fetchPPEAssignments,
    createPPEItem,
    updatePPEItem,
    createPPEAssignment,

    // Actions - Audits
    fetchAudits,
    createAudit,
    updateAudit,
    setSelectedAudit,

    // Actions - Observations
    fetchObservations,
    createObservation,

    // Actions - Metrics
    fetchMetrics,
    fetchDashboardSummary,

    // Utility
    getIncidentsBySeverity,
    getIncidentsByStatus,
    getCriticalIncidents,
    getOpenIncidents,
    getTrainingByStatus,
    getUpcomingTraining,
    getAuditsByStatus,
    refreshSafety,
    clearError,
  };

  return <SafetyContext.Provider value={value}>{children}</SafetyContext.Provider>;
};

/**
 * Custom hook to use Safety Context
 */
export const useSafety = (): SafetyContextState => {
  const context = useContext(SafetyContext);

  if (context === undefined) {
    throw new Error('useSafety must be used within a SafetyProvider');
  }

  return context;
};

export default SafetyContext;
