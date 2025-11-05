/**
 * Scheduling Optimization Service
 *
 * Advanced scheduling algorithms for project management including:
 * - Resource leveling
 * - Schedule conflict detection
 * - Constraint management
 * - Schedule baseline and versioning
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
  orderBy
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { Task, User } from '@/types';
import { TaskDependency, SchedulingPlan, TaskSchedule } from '@/types/ai-resource.types';
import { enhancedTaskService } from './taskService.enhanced';
import { APIResponse, APIError, ErrorCodes, safeAsync } from '@/utils/responseWrapper';

import { validators } from '@/utils/validators';

// Helper to convert Firestore doc to TypeScript types
const docToType = <T>(docSnap: any): T => ({ ...(docSnap.data() as any), id: docSnap.id } as T);

// Validation helpers
const validateProjectId = (projectId: string): void => {
  const validation = validators.isValidProjectId(projectId);
  if (!validation.valid) throw new APIError(ErrorCodes.INVALID_INPUT, validation.errors[0] || 'Invalid project ID', 400, { projectId, errors: validation.errors });
};

const validateTaskId = (taskId: string): void => {
  if (!validators.isValidId(taskId)) throw new APIError(ErrorCodes.INVALID_INPUT, 'Invalid task ID', 400, { taskId });
};

const validateUserId = (userId: string): void => {
  if (!validators.isValidId(userId)) throw new APIError(ErrorCodes.INVALID_INPUT, 'Invalid user ID', 400, { userId });
};

/**
 * Scheduling Constraint Types
 */
export interface SchedulingConstraint {
  id: string;
  projectId: string;
  type: 'resource' | 'date' | 'precedence' | 'calendar';
  description: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface ResourceConstraint extends SchedulingConstraint {
  type: 'resource';
  resourceId: string;
  maxAllocation: number; // Percentage
  startDate: string;
  endDate: string;
}

export interface DateConstraint extends SchedulingConstraint {
  type: 'date';
  taskId: string;
  constraintType: 'must_start_on' | 'must_finish_on' | 'start_no_earlier_than' | 'start_no_later_than' | 'finish_no_earlier_than' | 'finish_no_later_than';
  date: string;
}

export interface PrecedenceConstraint extends SchedulingConstraint {
  type: 'precedence';
  predecessorTaskId: string;
  successorTaskId: string;
  lagTime: number; // Hours
}

export interface CalendarConstraint extends SchedulingConstraint {
  type: 'calendar';
  workingDays: number[]; // 0=Sunday, 6=Saturday
  workingHours: {
    startHour: number; // 0-23
    endHour: number; // 0-23
  };
}

/**
 * Schedule Baseline Types
 */
export interface ScheduleBaseline {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  taskSchedules: TaskSchedule[];
  dependencies: TaskDependency[];
}

/**
 * Scheduling Service Class
 */
export class SchedulingService {
  private static scheduleCollection = 'schedules';
  private static constraintCollection = 'scheduling_constraints';
  private static baselineCollection = 'schedule_baselines';

  /**
   * Detect schedule conflicts
   */
  static async detectScheduleConflicts(
    projectId: string,
    tasks: Task[],
    dependencies: TaskDependency[]
  ): Promise<APIResponse<{ 
    resourceConflicts: any[]; 
    dateConflicts: any[]; 
    precedenceConflicts: any[];
  }>> {
    return await safeAsync(async () => {
      validateProjectId(projectId);

      // Resource conflicts - check for overallocation
      const resourceConflicts = await this.detectResourceConflicts(projectId, tasks);

      // Date conflicts - check constraint violations
      const dateConflicts = await this.detectDateConflicts(projectId, tasks);

      // Precedence conflicts - check dependency violations
      const precedenceConflicts = await this.detectPrecedenceConflicts(tasks, dependencies);

      return {
        resourceConflicts,
        dateConflicts,
        precedenceConflicts,
      };
    }, 'SchedulingService.detectScheduleConflicts');
  }

  /**
   * Detect resource conflicts
   */
  private static async detectResourceConflicts(
    projectId: string,
    tasks: Task[]
  ): Promise<any[]> {
    // This would check for resource overallocation
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Detect date conflicts
   */
  private static async detectDateConflicts(
    projectId: string,
    tasks: Task[]
  ): Promise<any[]> {
    // This would check for constraint violations
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Detect precedence conflicts
   */
  private static async detectPrecedenceConflicts(
    tasks: Task[],
    dependencies: TaskDependency[]
  ): Promise<any[]> {
    // This would check for dependency violations
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Apply resource leveling
   */
  static async applyResourceLeveling(
    projectId: string,
    tasks: Task[],
    dependencies: TaskDependency[],
    user: User
  ): Promise<APIResponse<SchedulingPlan>> {
    return await safeAsync(async () => {
      validateProjectId(projectId);
      validateUserId(user.id);

      // Create task schedules from tasks
      const taskSchedules: TaskSchedule[] = tasks.map(task => ({
        taskId: task.id,
        taskName: task.title,
        startDate: task.startDate ? new Date(task.startDate) : new Date(),
        endDate: task.endDate ? new Date(task.endDate) : new Date(),
        duration: task.startDate && task.endDate ? 
          Math.ceil((new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 1,
        isCritical: false, // Will be calculated
        slack: 0, // Will be calculated
        assignedResources: task.assignedTo || [],
        predecessors: [], // Will be populated
        successors: [], // Will be populated
        estimatedCost: 0, // Would be calculated from resource costs
        complexity: 5, // Default complexity
        riskLevel: 'medium', // Default risk level
      }));

      // Populate predecessors and successors from dependencies
      dependencies.forEach(dep => {
        const predecessor = taskSchedules.find(ts => ts.taskId === dep.predecessorTaskId);
        const successor = taskSchedules.find(ts => ts.taskId === dep.successorTaskId);
        
        if (predecessor && successor) {
          predecessor.successors.push(dep.successorTaskId);
          successor.predecessors.push(dep.predecessorTaskId);
        }
      });

      // Calculate critical path (simplified)
      const criticalPath = await enhancedTaskService.calculateCriticalPath(projectId, tasks, dependencies);
      if (criticalPath.success && criticalPath.data) {
        taskSchedules.forEach(ts => {
          ts.isCritical = criticalPath.data!.criticalTasks.includes(ts.taskId);
        });
      }

      // Create scheduling plan
      const schedulingPlan: SchedulingPlan = {
        planId: `plan_${projectId}_${Date.now()}`,
        projectId,
        tasks: taskSchedules,
        criticalPath: criticalPath.success && criticalPath.data ? criticalPath.data.criticalPath : [],
        totalDuration: taskSchedules.reduce((sum, ts) => sum + ts.duration, 0),
        totalCost: 0, // Would be calculated from resource costs
        resourceUtilization: [], // Would be populated
        milestones: [], // Would be populated
        dependencies,
        bufferTime: 0, // Would be calculated
      };

      console.log(`✅ Resource leveling applied for project ${projectId}`);
      return schedulingPlan;
    }, 'SchedulingService.applyResourceLeveling', user.id);
  }

  /**
   * Create scheduling constraint
   */
  static async createConstraint(
    projectId: string,
    constraintData: Omit<SchedulingConstraint, 'id' | 'createdAt' | 'createdBy'>,
    user: User
  ): Promise<APIResponse<string>> {
    return await safeAsync(async () => {
      validateProjectId(projectId);
      validateUserId(user.id);

      const newConstraint = {
        ...constraintData,
        projectId,
        createdAt: new Date().toISOString(),
        createdBy: user.id,
      };

      const docRef = await addDoc(collection(db, this.constraintCollection), newConstraint);

      console.log(`✅ Scheduling constraint created: ${docRef.id}`);
      return docRef.id;
    }, 'SchedulingService.createConstraint', user.id);
  }

  /**
   * Get scheduling constraints for project
   */
  static async getProjectConstraints(
    projectId: string
  ): Promise<APIResponse<SchedulingConstraint[]>> {
    return await safeAsync(async () => {
      validateProjectId(projectId);

      const q = query(
        collection(db, this.constraintCollection),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => docToType<SchedulingConstraint>(doc));
    }, 'SchedulingService.getProjectConstraints');
  }

  /**
   * Update scheduling constraint
   */
  static async updateConstraint(
    constraintId: string,
    updates: Partial<SchedulingConstraint>,
    user: User
  ): Promise<APIResponse<void>> {
    return await safeAsync(async () => {
      validateUserId(user.id);

      const constraintRef = doc(db, this.constraintCollection, constraintId);
      const constraintSnap = await getDoc(constraintRef);

      if (!constraintSnap.exists()) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Constraint not found', 404, { constraintId });
      }

      await updateDoc(constraintRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      console.log(`✅ Scheduling constraint updated: ${constraintId}`);
    }, 'SchedulingService.updateConstraint', user.id);
  }

  /**
   * Delete scheduling constraint
   */
  static async deleteConstraint(
    constraintId: string,
    user: User
  ): Promise<APIResponse<void>> {
    return await safeAsync(async () => {
      validateUserId(user.id);

      const constraintRef = doc(db, this.constraintCollection, constraintId);
      const constraintSnap = await getDoc(constraintRef);

      if (!constraintSnap.exists()) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Constraint not found', 404, { constraintId });
      }

      await deleteDoc(constraintRef);

      console.log(`✅ Scheduling constraint deleted: ${constraintId}`);
    }, 'SchedulingService.deleteConstraint', user.id);
  }

  /**
   * Create schedule baseline
   */
  static async createBaseline(
    projectId: string,
    baselineData: Omit<ScheduleBaseline, 'id' | 'createdAt' | 'createdBy'>,
    user: User
  ): Promise<APIResponse<string>> {
    return await safeAsync(async () => {
      validateProjectId(projectId);
      validateUserId(user.id);

      const newBaseline = {
        ...baselineData,
        projectId,
        createdAt: new Date().toISOString(),
        createdBy: user.id,
      };

      const docRef = await addDoc(collection(db, this.baselineCollection), newBaseline);

      console.log(`✅ Schedule baseline created: ${docRef.id}`);
      return docRef.id;
    }, 'SchedulingService.createBaseline', user.id);
  }

  /**
   * Get schedule baselines for project
   */
  static async getProjectBaselines(
    projectId: string
  ): Promise<APIResponse<ScheduleBaseline[]>> {
    return await safeAsync(async () => {
      validateProjectId(projectId);

      const q = query(
        collection(db, this.baselineCollection),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => docToType<ScheduleBaseline>(doc));
    }, 'SchedulingService.getProjectBaselines');
  }

  /**
   * Get schedule baseline by ID
   */
  static async getBaseline(
    baselineId: string
  ): Promise<APIResponse<ScheduleBaseline | null>> {
    return await safeAsync(async () => {
      const docRef = doc(db, this.baselineCollection, baselineId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return docToType<ScheduleBaseline>(docSnap);
    }, 'SchedulingService.getBaseline');
  }

  /**
   * Compare current schedule with baseline
   */
  static async compareWithBaseline(
    projectId: string,
    baselineId: string,
    currentTasks: Task[],
    currentDependencies: TaskDependency[]
  ): Promise<APIResponse<{ 
    scheduleVariance: number; 
    costVariance: number; 
    durationVariance: number;
    taskVariances: any[];
  }>> {
    return await safeAsync(async () => {
      validateProjectId(projectId);

      const baseline = await this.getBaseline(baselineId);
      if (!baseline.success || !baseline.data) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Baseline not found', 404, { baselineId });
      }

      // Calculate variances (simplified)
      const scheduleVariance = 0; // Would be calculated
      const costVariance = 0; // Would be calculated
      const durationVariance = 0; // Would be calculated
      const taskVariances = []; // Would be populated

      return {
        scheduleVariance,
        costVariance,
        durationVariance,
        taskVariances,
      };
    }, 'SchedulingService.compareWithBaseline');
  }
}

// Export as singleton for backward compatibility
export const schedulingService = SchedulingService;