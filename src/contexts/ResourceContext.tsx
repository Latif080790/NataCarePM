/**
 * Resource Management Context
 * Priority 3A: Resource Management System
 *
 * Provides global state management for resources, allocations,
 * and utilization metrics across the application.
 */

import * as React from 'react';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { resourceService } from '@/api/resourceService';
import type {
  Resource,
  ResourceAllocation,
  ResourceUtilization,
  ResourceConflict,
  ResourceStatistics,
  ResourceFilterOptions,
  MaintenanceRecord,
} from '@/types/resource.types';

/**
 * Resource Context State Interface
 */
interface ResourceContextState {
  // Resources
  resources: Resource[];
  selectedResource: Resource | null;
  resourcesLoading: boolean;
  resourcesError: string | null;

  // Allocations
  allocations: ResourceAllocation[];
  allocationsLoading: boolean;
  allocationsError: string | null;

  // Utilization
  utilization: Map<string, ResourceUtilization>;

  // Statistics
  statistics: ResourceStatistics | null;

  // Filters
  filters: ResourceFilterOptions;

  // Actions - Resources
  fetchResources: (filters?: ResourceFilterOptions) => Promise<void>;
  fetchResourceById: (resourceId: string) => Promise<Resource | null>;
  createResource: (resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Resource>;
  updateResource: (resourceId: string, updates: Partial<Resource>) => Promise<void>;
  deleteResource: (resourceId: string) => Promise<void>;
  setSelectedResource: (resource: Resource | null) => void;
  setFilters: (filters: ResourceFilterOptions) => void;

  // Actions - Allocations
  fetchAllocations: (resourceId: string) => Promise<void>;
  createAllocation: (
    allocation: Omit<ResourceAllocation, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<ResourceAllocation>;
  updateAllocation: (allocationId: string, updates: Partial<ResourceAllocation>) => Promise<void>;
  checkConflicts: (params: {
    resourceId: string;
    startDate: Date;
    endDate: Date;
    excludeAllocationId?: string;
  }) => Promise<ResourceConflict[]>;

  // Actions - Utilization
  calculateUtilization: (
    resourceId: string,
    periodStart: Date,
    periodEnd: Date
  ) => Promise<ResourceUtilization>;

  // Actions - Maintenance
  createMaintenanceRecord: (record: Omit<MaintenanceRecord, 'id'>) => Promise<MaintenanceRecord>;
  fetchMaintenanceRecords: (resourceId: string) => Promise<MaintenanceRecord[]>;

  // Actions - Statistics
  fetchStatistics: () => Promise<void>;

  // Utility
  refreshResources: () => Promise<void>;
  clearError: () => void;
}

/**
 * Create Context
 */
const ResourceContext = createContext<ResourceContextState | undefined>(undefined);

/**
 * Resource Provider Props
 */
interface ResourceProviderProps {
  children: ReactNode;
}

/**
 * Resource Provider Component
 */
export const ResourceProvider: React.FC<ResourceProviderProps> = ({ children }) => {
  // State
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourcesError, setResourcesError] = useState<string | null>(null);

  const [allocations, setAllocations] = useState<ResourceAllocation[]>([]);
  const [allocationsLoading, setAllocationsLoading] = useState(false);
  const [allocationsError, setAllocationsError] = useState<string | null>(null);

  const [utilization, setUtilization] = useState<Map<string, ResourceUtilization>>(new Map());
  const [statistics, setStatistics] = useState<ResourceStatistics | null>(null);
  const [filters, setFilters] = useState<ResourceFilterOptions>({});

  /**
   * Fetch resources with optional filters
   */
  const fetchResources = useCallback(
    async (filterOptions?: ResourceFilterOptions) => {
      setResourcesLoading(true);
      setResourcesError(null);

      try {
        const fetchedResources = await resourceService.getResources(filterOptions || filters);
        setResources(fetchedResources);
      } catch (error: any) {
        console.error('[ResourceContext] Error fetching resources:', error);
        setResourcesError(error.message || 'Failed to fetch resources');
      } finally {
        setResourcesLoading(false);
      }
    },
    [filters]
  );

  /**
   * Fetch resource by ID
   */
  const fetchResourceById = useCallback(async (resourceId: string): Promise<Resource | null> => {
    try {
      const resource = await resourceService.getResourceById(resourceId);
      if (resource) {
        // Update in list if exists
        setResources((prev) => {
          const index = prev.findIndex((r) => r.id === resourceId);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = resource;
            return updated;
          }
          return prev;
        });
      }
      return resource;
    } catch (error: any) {
      console.error('[ResourceContext] Error fetching resource:', error);
      setResourcesError(error.message || 'Failed to fetch resource');
      return null;
    }
  }, []);

  /**
   * Create new resource
   */
  const createResource = useCallback(
    async (resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>): Promise<Resource> => {
      setResourcesLoading(true);
      setResourcesError(null);

      try {
        const newResource = await resourceService.createResource(resource);
        setResources((prev) => [newResource, ...prev]);
        return newResource;
      } catch (error: any) {
        console.error('[ResourceContext] Error creating resource:', error);
        setResourcesError(error.message || 'Failed to create resource');
        throw error;
      } finally {
        setResourcesLoading(false);
      }
    },
    []
  );

  /**
   * Update resource
   */
  const updateResource = useCallback(
    async (resourceId: string, updates: Partial<Resource>): Promise<void> => {
      setResourcesLoading(true);
      setResourcesError(null);

      try {
        await resourceService.updateResource(resourceId, updates);

        // Update in local state
        setResources((prev) =>
          prev.map((r) => (r.id === resourceId ? { ...r, ...updates, updatedAt: new Date() } : r))
        );

        // Update selected resource if it's the one being updated
        if (selectedResource?.id === resourceId) {
          setSelectedResource((prev) =>
            prev ? { ...prev, ...updates, updatedAt: new Date() } : null
          );
        }
      } catch (error: any) {
        console.error('[ResourceContext] Error updating resource:', error);
        setResourcesError(error.message || 'Failed to update resource');
        throw error;
      } finally {
        setResourcesLoading(false);
      }
    },
    [selectedResource]
  );

  /**
   * Delete resource
   */
  const deleteResource = useCallback(
    async (resourceId: string): Promise<void> => {
      setResourcesLoading(true);
      setResourcesError(null);

      try {
        await resourceService.deleteResource(resourceId);

        // Remove from local state
        setResources((prev) => prev.filter((r) => r.id !== resourceId));

        // Clear selected resource if it's the one being deleted
        if (selectedResource?.id === resourceId) {
          setSelectedResource(null);
        }
      } catch (error: any) {
        console.error('[ResourceContext] Error deleting resource:', error);
        setResourcesError(error.message || 'Failed to delete resource');
        throw error;
      } finally {
        setResourcesLoading(false);
      }
    },
    [selectedResource]
  );

  /**
   * Fetch allocations for a resource
   */
  const fetchAllocations = useCallback(async (resourceId: string): Promise<void> => {
    setAllocationsLoading(true);
    setAllocationsError(null);

    try {
      const fetchedAllocations = await resourceService.getResourceAllocations(resourceId);
      setAllocations(fetchedAllocations);
    } catch (error: any) {
      console.error('[ResourceContext] Error fetching allocations:', error);
      setAllocationsError(error.message || 'Failed to fetch allocations');
    } finally {
      setAllocationsLoading(false);
    }
  }, []);

  /**
   * Create allocation
   */
  const createAllocation = useCallback(
    async (
      allocation: Omit<ResourceAllocation, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<ResourceAllocation> => {
      setAllocationsLoading(true);
      setAllocationsError(null);

      try {
        const newAllocation = await resourceService.createAllocation(allocation);
        setAllocations((prev) => [newAllocation, ...prev]);

        // Update resource status to 'allocated'
        await updateResource(allocation.resourceId, { status: 'allocated' });

        return newAllocation;
      } catch (error: any) {
        console.error('[ResourceContext] Error creating allocation:', error);
        setAllocationsError(error.message || 'Failed to create allocation');
        throw error;
      } finally {
        setAllocationsLoading(false);
      }
    },
    [updateResource]
  );

  /**
   * Update allocation
   */
  const updateAllocation = useCallback(
    async (allocationId: string, updates: Partial<ResourceAllocation>): Promise<void> => {
      setAllocationsLoading(true);
      setAllocationsError(null);

      try {
        await resourceService.updateAllocation(allocationId, updates);

        // Update in local state
        setAllocations((prev) =>
          prev.map((a) => (a.id === allocationId ? { ...a, ...updates, updatedAt: new Date() } : a))
        );
      } catch (error: any) {
        console.error('[ResourceContext] Error updating allocation:', error);
        setAllocationsError(error.message || 'Failed to update allocation');
        throw error;
      } finally {
        setAllocationsLoading(false);
      }
    },
    []
  );

  /**
   * Check for allocation conflicts
   */
  const checkConflicts = useCallback(
    async (params: {
      resourceId: string;
      startDate: Date;
      endDate: Date;
      excludeAllocationId?: string;
    }): Promise<ResourceConflict[]> => {
      try {
        return await resourceService.checkAllocationConflicts(params);
      } catch (error: any) {
        console.error('[ResourceContext] Error checking conflicts:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Calculate utilization
   */
  const calculateUtilization = useCallback(
    async (
      resourceId: string,
      periodStart: Date,
      periodEnd: Date
    ): Promise<ResourceUtilization> => {
      try {
        const util = await resourceService.calculateUtilization(resourceId, periodStart, periodEnd);

        // Store in utilization map
        setUtilization((prev) => new Map(prev).set(resourceId, util));

        return util;
      } catch (error: any) {
        console.error('[ResourceContext] Error calculating utilization:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Create maintenance record
   */
  const createMaintenanceRecord = useCallback(
    async (record: Omit<MaintenanceRecord, 'id'>): Promise<MaintenanceRecord> => {
      try {
        const newRecord = await resourceService.createMaintenanceRecord(record);

        // Update resource status to 'maintenance' if record is in progress
        if (record.status === 'in_progress') {
          await updateResource(record.resourceId, { status: 'maintenance' });
        }

        return newRecord;
      } catch (error: any) {
        console.error('[ResourceContext] Error creating maintenance record:', error);
        throw error;
      }
    },
    [updateResource]
  );

  /**
   * Fetch maintenance records
   */
  const fetchMaintenanceRecords = useCallback(
    async (resourceId: string): Promise<MaintenanceRecord[]> => {
      try {
        return await resourceService.getMaintenanceRecords(resourceId);
      } catch (error: any) {
        console.error('[ResourceContext] Error fetching maintenance records:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Fetch statistics
   */
  const fetchStatistics = useCallback(async (): Promise<void> => {
    try {
      const stats = await resourceService.getResourceStatistics();
      setStatistics(stats);
    } catch (error: any) {
      console.error('[ResourceContext] Error fetching statistics:', error);
      setResourcesError(error.message || 'Failed to fetch statistics');
    }
  }, []);

  /**
   * Refresh resources
   */
  const refreshResources = useCallback(async (): Promise<void> => {
    await fetchResources();
    await fetchStatistics();
  }, [fetchResources, fetchStatistics]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setResourcesError(null);
    setAllocationsError(null);
  }, []);

  /**
   * Initial load
   */
  useEffect(() => {
    fetchResources();
    fetchStatistics();
  }, []);

  /**
   * Context value
   */
  const value: ResourceContextState = {
    // Resources
    resources,
    selectedResource,
    resourcesLoading,
    resourcesError,

    // Allocations
    allocations,
    allocationsLoading,
    allocationsError,

    // Utilization
    utilization,

    // Statistics
    statistics,

    // Filters
    filters,

    // Actions - Resources
    fetchResources,
    fetchResourceById,
    createResource,
    updateResource,
    deleteResource,
    setSelectedResource,
    setFilters,

    // Actions - Allocations
    fetchAllocations,
    createAllocation,
    updateAllocation,
    checkConflicts,

    // Actions - Utilization
    calculateUtilization,

    // Actions - Maintenance
    createMaintenanceRecord,
    fetchMaintenanceRecords,

    // Actions - Statistics
    fetchStatistics,

    // Utility
    refreshResources,
    clearError,
  };

  return <ResourceContext.Provider value={value}>{children}</ResourceContext.Provider>;
};

/**
 * Custom hook to use Resource Context
 */
export const useResource = (): ResourceContextState => {
  const context = useContext(ResourceContext);

  if (context === undefined) {
    throw new Error('useResource must be used within a ResourceProvider');
  }

  return context;
};

export default ResourceContext;

