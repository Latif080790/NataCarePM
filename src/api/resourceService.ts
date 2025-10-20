/**
 * Resource Management API Service
 * Priority 3A: Resource Management System
 * 
 * Provides CRUD operations and business logic for managing
 * human resources, equipment, and materials in construction projects.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import type {
  Resource,
  ResourceAllocation,
  ResourceUtilization,
  ResourceConflict,
  ResourceForecast,
  CapacityPlan,
  ResourceCostSummary,
  OptimizationSuggestion,
  ResourcePerformance,
  MaintenanceRecord,
  ResourceFilterOptions,
  ResourceStatistics,
  ResourceType,
  ResourceStatus,
} from '@/types/resource.types';

// Collection references
const RESOURCES_COLLECTION = 'resources';
const ALLOCATIONS_COLLECTION = 'resourceAllocations';
const UTILIZATION_COLLECTION = 'resourceUtilization';
const MAINTENANCE_COLLECTION = 'resourceMaintenance';

/**
 * Resource Service Class
 */
class ResourceService {
  /**
   * Create a new resource
   */
  async createResource(resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>): Promise<Resource> {
    try {
      const now = new Date();
      const resourceData = {
        ...resource,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      const docRef = await addDoc(collection(db, RESOURCES_COLLECTION), resourceData);
      
      return {
        ...resource,
        id: docRef.id,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error('[ResourceService] Error creating resource:', error);
      throw new Error(`Failed to create resource: ${error.message}`);
    }
  }

  /**
   * Get resource by ID
   */
  async getResourceById(resourceId: string): Promise<Resource | null> {
    try {
      const docRef = doc(db, RESOURCES_COLLECTION, resourceId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        availability: data.availability?.map((slot: any) => ({
          ...slot,
          startDate: slot.startDate?.toDate(),
          endDate: slot.endDate?.toDate(),
        })),
      } as Resource;
    } catch (error) {
      console.error('[ResourceService] Error getting resource:', error);
      throw new Error(`Failed to get resource: ${error.message}`);
    }
  }

  /**
   * Get all resources with optional filters
   */
  async getResources(filters?: ResourceFilterOptions): Promise<Resource[]> {
    try {
      let q = collection(db, RESOURCES_COLLECTION);
      let constraints: any[] = [];

      // Apply filters
      if (filters?.type && filters.type.length > 0) {
        constraints.push(where('type', 'in', filters.type));
      }

      if (filters?.category && filters.category.length > 0) {
        constraints.push(where('category', 'in', filters.category));
      }

      if (filters?.status && filters.status.length > 0) {
        constraints.push(where('status', 'in', filters.status));
      }

      if (filters?.location && filters.location.length > 0) {
        constraints.push(where('location', 'in', filters.location));
      }

      // Add ordering
      constraints.push(orderBy('createdAt', 'desc'));

      const resourceQuery = query(q, ...constraints);
      const querySnapshot = await getDocs(resourceQuery);

      const resources = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          availability: data.availability?.map((slot: any) => ({
            ...slot,
            startDate: slot.startDate?.toDate(),
            endDate: slot.endDate?.toDate(),
          })),
        } as Resource;
      });

      // Apply client-side filters
      let filtered = resources;

      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(r =>
          r.name.toLowerCase().includes(term) ||
          r.description?.toLowerCase().includes(term)
        );
      }

      if (filters?.skills && filters.skills.length > 0) {
        filtered = filtered.filter(r =>
          r.skills?.some(skill =>
            filters.skills!.some(filterSkill =>
              skill.skillName.toLowerCase().includes(filterSkill.toLowerCase())
            )
          )
        );
      }

      if (filters?.costRange) {
        filtered = filtered.filter(r => {
          const cost = r.costPerHour || r.costPerDay || r.costPerUnit || 0;
          return cost >= (filters.costRange!.min || 0) &&
                 cost <= (filters.costRange!.max || Infinity);
        });
      }

      return filtered;
    } catch (error) {
      console.error('[ResourceService] Error getting resources:', error);
      throw new Error(`Failed to get resources: ${error.message}`);
    }
  }

  /**
   * Update resource
   */
  async updateResource(resourceId: string, updates: Partial<Resource>): Promise<void> {
    try {
      const docRef = doc(db, RESOURCES_COLLECTION, resourceId);
      
      const updateData = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      };

      // Remove fields that shouldn't be updated
      delete (updateData as any).id;
      delete (updateData as any).createdAt;

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('[ResourceService] Error updating resource:', error);
      throw new Error(`Failed to update resource: ${error.message}`);
    }
  }

  /**
   * Delete resource
   */
  async deleteResource(resourceId: string): Promise<void> {
    try {
      // Check for active allocations
      const allocations = await this.getResourceAllocations(resourceId, {
        status: ['planned', 'confirmed', 'active'],
      });

      if (allocations.length > 0) {
        throw new Error('Cannot delete resource with active allocations');
      }

      const docRef = doc(db, RESOURCES_COLLECTION, resourceId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('[ResourceService] Error deleting resource:', error);
      throw new Error(`Failed to delete resource: ${error.message}`);
    }
  }

  /**
   * Create resource allocation
   */
  async createAllocation(allocation: Omit<ResourceAllocation, 'id' | 'createdAt' | 'updatedAt'>): Promise<ResourceAllocation> {
    try {
      // Check for conflicts
      const conflicts = await this.checkAllocationConflicts({
        resourceId: allocation.resourceId,
        startDate: allocation.startDate,
        endDate: allocation.endDate,
      });

      if (conflicts.length > 0) {
        throw new Error(`Resource has conflicting allocations: ${conflicts.map(c => c.allocations[0].projectName).join(', ')}`);
      }

      const now = new Date();
      const allocationData = {
        ...allocation,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        startDate: Timestamp.fromDate(allocation.startDate),
        endDate: Timestamp.fromDate(allocation.endDate),
      };

      const docRef = await addDoc(collection(db, ALLOCATIONS_COLLECTION), allocationData);

      // Update resource status
      await this.updateResource(allocation.resourceId, {
        status: 'allocated',
      });

      return {
        ...allocation,
        id: docRef.id,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error('[ResourceService] Error creating allocation:', error);
      throw new Error(`Failed to create allocation: ${error.message}`);
    }
  }

  /**
   * Get resource allocations
   */
  async getResourceAllocations(
    resourceId: string,
    filters?: { status?: string[]; projectId?: string }
  ): Promise<ResourceAllocation[]> {
    try {
      let constraints: any[] = [where('resourceId', '==', resourceId)];

      if (filters?.status && filters.status.length > 0) {
        constraints.push(where('status', 'in', filters.status));
      }

      if (filters?.projectId) {
        constraints.push(where('projectId', '==', filters.projectId));
      }

      constraints.push(orderBy('startDate', 'desc'));

      const q = query(collection(db, ALLOCATIONS_COLLECTION), ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate(),
          endDate: data.endDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as ResourceAllocation;
      });
    } catch (error) {
      console.error('[ResourceService] Error getting allocations:', error);
      throw new Error(`Failed to get allocations: ${error.message}`);
    }
  }

  /**
   * Update allocation
   */
  async updateAllocation(allocationId: string, updates: Partial<ResourceAllocation>): Promise<void> {
    try {
      const docRef = doc(db, ALLOCATIONS_COLLECTION, allocationId);
      
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      };

      if (updates.startDate) {
        updateData.startDate = Timestamp.fromDate(updates.startDate);
      }

      if (updates.endDate) {
        updateData.endDate = Timestamp.fromDate(updates.endDate);
      }

      delete updateData.id;
      delete updateData.createdAt;

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('[ResourceService] Error updating allocation:', error);
      throw new Error(`Failed to update allocation: ${error.message}`);
    }
  }

  /**
   * Check for allocation conflicts
   */
  async checkAllocationConflicts(params: {
    resourceId: string;
    startDate: Date;
    endDate: Date;
    excludeAllocationId?: string;
  }): Promise<ResourceConflict[]> {
    try {
      const allocations = await this.getResourceAllocations(params.resourceId, {
        status: ['planned', 'confirmed', 'active'],
      });

      const conflicts: ResourceConflict[] = [];
      
      for (const allocation of allocations) {
        if (params.excludeAllocationId && allocation.id === params.excludeAllocationId) {
          continue;
        }

        // Check for date overlap
        if (
          (params.startDate >= allocation.startDate && params.startDate <= allocation.endDate) ||
          (params.endDate >= allocation.startDate && params.endDate <= allocation.endDate) ||
          (params.startDate <= allocation.startDate && params.endDate >= allocation.endDate)
        ) {
          const resource = await this.getResourceById(params.resourceId);
          
          conflicts.push({
            resourceId: params.resourceId,
            resourceName: resource?.name || 'Unknown',
            conflictType: 'overallocation',
            allocations: [{
              allocationId: allocation.id,
              projectId: allocation.projectId,
              projectName: allocation.projectName,
              startDate: allocation.startDate,
              endDate: allocation.endDate,
            }],
            conflictPeriod: {
              start: new Date(Math.max(params.startDate.getTime(), allocation.startDate.getTime())),
              end: new Date(Math.min(params.endDate.getTime(), allocation.endDate.getTime())),
            },
            severity: 'high',
            suggestedResolution: 'Adjust allocation dates or find alternative resource',
          });
        }
      }

      return conflicts;
    } catch (error) {
      console.error('[ResourceService] Error checking conflicts:', error);
      throw new Error(`Failed to check conflicts: ${error.message}`);
    }
  }

  /**
   * Calculate resource utilization
   */
  async calculateUtilization(
    resourceId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<ResourceUtilization> {
    try {
      const resource = await this.getResourceById(resourceId);
      if (!resource) {
        throw new Error('Resource not found');
      }

      const allocations = await this.getResourceAllocations(resourceId);
      
      // Filter allocations within period
      const periodAllocations = allocations.filter(a =>
        a.startDate <= periodEnd && a.endDate >= periodStart
      );

      // Calculate metrics
      const periodDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
      const totalAvailableHours = periodDays * 8; // Assuming 8-hour workday

      let totalAllocatedHours = 0;
      let totalActualHours = 0;
      let totalCost = 0;
      let tasksCompleted = 0;

      for (const allocation of periodAllocations) {
        totalAllocatedHours += allocation.plannedHours || 0;
        totalActualHours += allocation.actualHours || 0;
        totalCost += allocation.actualCost || allocation.plannedCost;
        
        if (allocation.status === 'completed') {
          tasksCompleted++;
        }
      }

      const utilizationRate = (totalActualHours / totalAvailableHours) * 100;
      const idleHours = totalAvailableHours - totalActualHours;
      const costPerProductiveHour = totalActualHours > 0 ? totalCost / totalActualHours : 0;

      return {
        resourceId,
        resourceName: resource.name,
        resourceType: resource.type,
        periodStart,
        periodEnd,
        totalAvailableHours,
        totalAllocatedHours,
        totalActualHours,
        utilizationRate,
        idleHours,
        totalCost,
        costPerProductiveHour,
        tasksCompleted,
        averageTaskDuration: tasksCompleted > 0 ? totalActualHours / tasksCompleted : 0,
      };
    } catch (error) {
      console.error('[ResourceService] Error calculating utilization:', error);
      throw new Error(`Failed to calculate utilization: ${error.message}`);
    }
  }

  /**
   * Get resource statistics
   */
  async getResourceStatistics(): Promise<ResourceStatistics> {
    try {
      const resources = await this.getResources();

      const stats: ResourceStatistics = {
        total: resources.length,
        byType: {
          human: 0,
          equipment: 0,
          material: 0,
        },
        byCategory: {} as any,
        byStatus: {
          available: 0,
          allocated: 0,
          maintenance: 0,
          unavailable: 0,
          retired: 0,
        },
        utilization: {
          average: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
        costs: {
          totalMonthly: 0,
          totalYearly: 0,
          averagePerResource: 0,
        },
        availability: {
          available: 0,
          allocated: 0,
          unavailable: 0,
        },
      };

      for (const resource of resources) {
        // Count by type
        stats.byType[resource.type]++;

        // Count by status
        stats.byStatus[resource.status]++;

        // Count by availability
        if (resource.status === 'available') {
          stats.availability.available++;
        } else if (resource.status === 'allocated') {
          stats.availability.allocated++;
        } else {
          stats.availability.unavailable++;
        }

        // Calculate costs
        const costPerMonth = (resource.costPerHour || 0) * 160 || // 160 hours/month
                           (resource.costPerDay || 0) * 20; // 20 days/month
        stats.costs.totalMonthly += costPerMonth;
      }

      stats.costs.totalYearly = stats.costs.totalMonthly * 12;
      stats.costs.averagePerResource = resources.length > 0 ? stats.costs.totalMonthly / resources.length : 0;

      return stats;
    } catch (error) {
      console.error('[ResourceService] Error getting statistics:', error);
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }

  /**
   * Create maintenance record
   */
  async createMaintenanceRecord(record: Omit<MaintenanceRecord, 'id'>): Promise<MaintenanceRecord> {
    try {
      const recordData = {
        ...record,
        actualDate: Timestamp.fromDate(record.actualDate),
        scheduledDate: record.scheduledDate ? Timestamp.fromDate(record.scheduledDate) : null,
        completedDate: record.completedDate ? Timestamp.fromDate(record.completedDate) : null,
        nextMaintenanceDate: record.nextMaintenanceDate ? Timestamp.fromDate(record.nextMaintenanceDate) : null,
      };

      const docRef = await addDoc(collection(db, MAINTENANCE_COLLECTION), recordData);

      return {
        ...record,
        id: docRef.id,
      };
    } catch (error) {
      console.error('[ResourceService] Error creating maintenance record:', error);
      throw new Error(`Failed to create maintenance record: ${error.message}`);
    }
  }

  /**
   * Get maintenance records for a resource
   */
  async getMaintenanceRecords(resourceId: string): Promise<MaintenanceRecord[]> {
    try {
      const q = query(
        collection(db, MAINTENANCE_COLLECTION),
        where('resourceId', '==', resourceId),
        orderBy('actualDate', 'desc')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          actualDate: data.actualDate?.toDate(),
          scheduledDate: data.scheduledDate?.toDate(),
          completedDate: data.completedDate?.toDate(),
          nextMaintenanceDate: data.nextMaintenanceDate?.toDate(),
        } as MaintenanceRecord;
      });
    } catch (error) {
      console.error('[ResourceService] Error getting maintenance records:', error);
      throw new Error(`Failed to get maintenance records: ${error.message}`);
    }
  }
}

// Export singleton instance
export const resourceService = new ResourceService();
export default resourceService;
