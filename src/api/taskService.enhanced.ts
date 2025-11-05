/**
 * Enhanced Task Service with Dependency Management
 *
 * Extends the existing task service with advanced features:
 * - Task dependencies (FS, SS, FF, SF)
 * - Critical path calculation
 * - Resource allocation
 * - Advanced scheduling
 *
 * @module api/taskService.enhanced
 */

import { db } from '@/firebaseConfig';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Task,
  User,
} from '@/types';
import { TaskDependency, ResourceAllocation } from '@/types/ai-resource.types';
import { projectService } from './projectService';
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
 * Enhanced Task Service Class
 */
export class EnhancedTaskService {
  private static collectionName = 'tasks';

  /**
   * Add task dependency
   */
  static async addTaskDependency(
    projectId: string,
    predecessorId: string,
    successorId: string,
    type: TaskDependency['dependencyType'] = 'finish_to_start',
    lagDays: number = 0,
    user: User
  ): Promise<APIResponse<string>> {
    return await safeAsync(async () => {
      validateProjectId(projectId);
      validateTaskId(predecessorId);
      validateTaskId(successorId);
      validateUserId(user.id);

      // Check if tasks exist
      const predecessorRef = doc(db, `projects/${projectId}/tasks`, predecessorId);
      const successorRef = doc(db, `projects/${projectId}/tasks`, successorId);
      
      const [predecessorSnap, successorSnap] = await Promise.all([
        getDoc(predecessorRef),
        getDoc(successorRef)
      ]);

      if (!predecessorSnap.exists()) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Predecessor task not found', 404, { taskId: predecessorId });
      }

      if (!successorSnap.exists()) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Successor task not found', 404, { taskId: successorId });
      }

      // Create dependency document
      const dependencyData: Omit<TaskDependency, 'predecessorTaskId' | 'successorTaskId'> & { predecessorTaskId: string; successorTaskId: string } = {
        predecessorTaskId: predecessorId,
        successorTaskId: successorId,
        dependencyType: type,
        lagTime: lagDays * 24, // Convert days to hours
      };

      const docRef = await addDoc(
        collection(db, `projects/${projectId}/taskDependencies`),
        dependencyData
      );

      // Update successor task with new dependency
      const successorTask = docToType<Task>(successorSnap);
      const updatedDependencies = [
        ...(successorTask.dependencies || []),
        docRef.id
      ];

      await updateDoc(successorRef, {
        dependencies: updatedDependencies,
        updatedAt: serverTimestamp()
      });

      try {
        await projectService.addAuditLog(
          projectId,
          user,
          `Added dependency: Task ${predecessorId} -> Task ${successorId} (${type})`
        );
      } catch (error) {
        console.warn('Failed to add audit log:', error);
      }

      console.log(`✅ Task dependency created: ${docRef.id}`);
      return docRef.id;
    }, 'EnhancedTaskService.addTaskDependency', user.id);
  }

  /**
   * Remove task dependency
   */
  static async removeTaskDependency(
    projectId: string,
    dependencyId: string,
    user: User
  ): Promise<APIResponse<void>> {
    return await safeAsync(async () => {
      validateProjectId(projectId);
      validateTaskId(dependencyId);
      validateUserId(user.id);

      const dependencyRef = doc(db, `projects/${projectId}/taskDependencies`, dependencyId);
      const dependencySnap = await getDoc(dependencyRef);

      if (!dependencySnap.exists()) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Dependency not found', 404, { dependencyId });
      }

      const dependency = docToType<TaskDependency>(dependencySnap);
      
      // Remove dependency from successor task
      const successorRef = doc(db, `projects/${projectId}/tasks`, dependency.successorTaskId);
      const successorSnap = await getDoc(successorRef);
      
      if (successorSnap.exists()) {
        const successorTask = docToType<Task>(successorSnap);
        const updatedDependencies = (successorTask.dependencies || []).filter(
          id => id !== dependencyId
        );
        
        await updateDoc(successorRef, {
          dependencies: updatedDependencies,
          updatedAt: serverTimestamp()
        });
      }

      // Delete dependency document
      await deleteDoc(dependencyRef);

      try {
        await projectService.addAuditLog(
          projectId,
          user,
          `Removed dependency: Task ${dependency.predecessorTaskId} -> Task ${dependency.successorTaskId}`
        );
      } catch (error) {
        console.warn('Failed to add audit log:', error);
      }

      console.log(`✅ Task dependency removed: ${dependencyId}`);
    }, 'EnhancedTaskService.removeTaskDependency', user.id);
  }

  /**
   * Get task dependencies
   */
  static async getTaskDependencies(
    projectId: string,
    taskId: string
  ): Promise<APIResponse<TaskDependency[]>> {
    return await safeAsync(async () => {
      validateProjectId(projectId);
      validateTaskId(taskId);

      // Get incoming dependencies (where this task is the successor)
      const incomingQuery = query(
        collection(db, `projects/${projectId}/taskDependencies`),
        where('successorTaskId', '==', taskId)
      );

      // Get outgoing dependencies (where this task is the predecessor)
      const outgoingQuery = query(
        collection(db, `projects/${projectId}/taskDependencies`),
        where('predecessorTaskId', '==', taskId)
      );

      const [incomingSnapshot, outgoingSnapshot] = await Promise.all([
        getDocs(incomingQuery),
        getDocs(outgoingQuery)
      ]);

      const dependencies = [
        ...incomingSnapshot.docs.map(d => docToType<TaskDependency>(d)),
        ...outgoingSnapshot.docs.map(d => docToType<TaskDependency>(d))
      ];

      return dependencies;
    }, 'EnhancedTaskService.getTaskDependencies');
  }

  /**
   * Calculate critical path using topological sort
   */
  static async calculateCriticalPath(
    projectId: string,
    tasks: Task[],
    dependencies: TaskDependency[]
  ): Promise<APIResponse<{ 
    criticalPath: string[]; 
    criticalTasks: string[]; 
    projectDuration: number;
    taskES: Record<string, number>; // Earliest Start
    taskEF: Record<string, number>; // Earliest Finish
    taskLS: Record<string, number>; // Latest Start
    taskLF: Record<string, number>; // Latest Finish
    taskFloat: Record<string, number>; // Total Float
  }>> {
    return await safeAsync(async () => {
      validateProjectId(projectId);

      // Create task lookup map
      const taskMap = new Map<string, Task>();
      tasks.forEach(task => taskMap.set(task.id, task));

      // Create dependency maps
      const successors = new Map<string, TaskDependency[]>();
      const predecessors = new Map<string, TaskDependency[]>();

      dependencies.forEach(dep => {
        if (!successors.has(dep.predecessorTaskId)) {
          successors.set(dep.predecessorTaskId, []);
        }
        successors.get(dep.predecessorTaskId)!.push(dep);

        if (!predecessors.has(dep.successorTaskId)) {
          predecessors.set(dep.successorTaskId, []);
        }
        predecessors.get(dep.successorTaskId)!.push(dep);
      });

      // Calculate task durations (in days)
      const taskDurations = new Map<string, number>();
      tasks.forEach(task => {
        if (task.startDate && task.endDate) {
          const start = new Date(task.startDate);
          const end = new Date(task.endDate);
          const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          taskDurations.set(task.id, Math.max(1, duration));
        } else {
          // Default duration of 1 day
          taskDurations.set(task.id, 1);
        }
      });

      // Forward pass - calculate ES and EF
      const taskES = new Map<string, number>();
      const taskEF = new Map<string, number>();

      // Initialize all tasks with ES = 0
      tasks.forEach(task => {
        taskES.set(task.id, 0);
        taskEF.set(task.id, 0);
      });

      // Topological sort to process tasks in correct order
      const inDegree = new Map<string, number>();
      tasks.forEach(task => inDegree.set(task.id, 0));

      dependencies.forEach(dep => {
        inDegree.set(dep.successorTaskId, (inDegree.get(dep.successorTaskId) || 0) + 1);
      });

      const queue: string[] = [];
      tasks.forEach(task => {
        if (inDegree.get(task.id) === 0) {
          queue.push(task.id);
        }
      });

      while (queue.length > 0) {
        const taskId = queue.shift()!;
        const duration = taskDurations.get(taskId) || 1;
        const ef = (taskES.get(taskId) || 0) + duration;
        taskEF.set(taskId, ef);

        // Update successors
        const taskSuccessors = successors.get(taskId) || [];
        taskSuccessors.forEach(dep => {
          const successorId = dep.successorTaskId;
          let es = ef; // Default FS relationship

          // Adjust for different dependency types
          switch (dep.dependencyType) {
            case 'start_to_start': // Start-to-Start
              es = taskES.get(taskId) || 0;
              break;
            case 'finish_to_finish': // Finish-to-Finish
              // This is more complex and would require looking at successor duration
              break;
            case 'start_to_finish': // Start-to-Finish
              es = (taskES.get(taskId) || 0) - (taskDurations.get(successorId) || 1);
              break;
          }

          // Add lag time (convert hours to days)
          es += Math.floor((dep.lagTime || 0) / 24);

          // Update if this gives a later start time
          if (es > (taskES.get(successorId) || 0)) {
            taskES.set(successorId, es);
          }

          inDegree.set(successorId, (inDegree.get(successorId) || 0) - 1);
          if (inDegree.get(successorId) === 0) {
            queue.push(successorId);
          }
        });
      }

      // Backward pass - calculate LS and LF
      const taskLS = new Map<string, number>();
      const taskLF = new Map<string, number>();

      // Find the latest EF as project end time
      let projectEndTime = 0;
      tasks.forEach(task => {
        const ef = taskEF.get(task.id) || 0;
        if (ef > projectEndTime) {
          projectEndTime = ef;
        }
      });

      // Initialize all tasks with LF = projectEndTime
      tasks.forEach(task => {
        taskLF.set(task.id, projectEndTime);
        taskLS.set(task.id, projectEndTime - (taskDurations.get(task.id) || 1));
      });

      // Process in reverse topological order
      const outDegree = new Map<string, number>();
      tasks.forEach(task => outDegree.set(task.id, 0));

      dependencies.forEach(dep => {
        outDegree.set(dep.predecessorTaskId, (outDegree.get(dep.predecessorTaskId) || 0) + 1);
      });

      const reverseQueue: string[] = [];
      tasks.forEach(task => {
        if (outDegree.get(task.id) === 0) {
          reverseQueue.push(task.id);
        }
      });

      while (reverseQueue.length > 0) {
        const taskId = reverseQueue.shift()!;
        const ls = taskLS.get(taskId) || 0;
        taskES.set(taskId, ls - (taskDurations.get(taskId) || 1));

        // Update predecessors
        const taskPredecessors = predecessors.get(taskId) || [];
        taskPredecessors.forEach(dep => {
          const predecessorId = dep.predecessorTaskId;
          let lf = ls; // Default FS relationship

          // Adjust for different dependency types
          switch (dep.dependencyType) {
            case 'start_to_start': // Start-to-Start
              // Already handled in forward pass
              break;
            case 'finish_to_finish': // Finish-to-Finish
              lf = taskLF.get(taskId) || 0;
              break;
            case 'start_to_finish': // Start-to-Finish
              lf = (taskLS.get(taskId) || 0) + (taskDurations.get(predecessorId) || 1);
              break;
          }

          // Subtract lag time (convert hours to days)
          lf -= Math.floor((dep.lagTime || 0) / 24);

          // Update if this gives an earlier finish time
          if (lf < (taskLF.get(predecessorId) || Infinity)) {
            taskLF.set(predecessorId, lf);
            taskLS.set(predecessorId, lf - (taskDurations.get(predecessorId) || 1));
          }

          outDegree.set(predecessorId, (outDegree.get(predecessorId) || 0) - 1);
          if (outDegree.get(predecessorId) === 0) {
            reverseQueue.push(predecessorId);
          }
        });
      }

      // Calculate total float for each task
      const taskFloat = new Map<string, number>();
      tasks.forEach(task => {
        const lf = taskLF.get(task.id) || 0;
        const ef = taskEF.get(task.id) || 0;
        const float = lf - ef;
        taskFloat.set(task.id, float);
      });

      // Identify critical tasks (float = 0)
      const criticalTasks: string[] = [];
      tasks.forEach(task => {
        if ((taskFloat.get(task.id) || 0) === 0) {
          criticalTasks.push(task.id);
        }
      });

      // Trace critical path
      const criticalPath: string[] = [];
      if (criticalTasks.length > 0) {
        // Start from the task with the earliest start that's critical
        let currentTaskId: string | undefined = criticalTasks[0];
        let earliestStart = taskES.get(currentTaskId) || 0;
        
        criticalTasks.forEach(taskId => {
          const es = taskES.get(taskId) || 0;
          if (es < earliestStart) {
            earliestStart = es;
            currentTaskId = taskId;
          }
        });

        // Follow the critical path
        while (currentTaskId) {
          criticalPath.push(currentTaskId);
          
          // Find the next critical successor
          const successorsList: TaskDependency[] = successors.get(currentTaskId) || [];
          let nextTaskId: string | undefined = undefined;
          
          for (const dep of successorsList) {
            if (criticalTasks.includes(dep.successorTaskId) && 
                (taskFloat.get(dep.successorTaskId) || 0) === 0) {
              nextTaskId = dep.successorTaskId;
              break;
            }
          }
          
          currentTaskId = nextTaskId;
        }
      }

      console.log(`✅ Critical path calculated for project ${projectId}`);
      
      return {
        criticalPath,
        criticalTasks,
        projectDuration: projectEndTime,
        taskES: Object.fromEntries(taskES),
        taskEF: Object.fromEntries(taskEF),
        taskLS: Object.fromEntries(taskLS),
        taskLF: Object.fromEntries(taskLF),
        taskFloat: Object.fromEntries(taskFloat)
      };
    }, 'EnhancedTaskService.calculateCriticalPath');
  }

  /**
   * Allocate resource to task
   */
  static async allocateResource(
    projectId: string,
    taskId: string,
    resourceId: string,
    allocatedUnits: number,
    startDate: string,
    endDate: string,
    user: User
  ): Promise<APIResponse<string>> {
    return await safeAsync(async () => {
      validateProjectId(projectId);
      validateTaskId(taskId);
      validateUserId(user.id);

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Start date must be before end date', 400);
      }

      // Check if task exists
      const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
      const taskSnap = await getDoc(taskRef);
      if (!taskSnap.exists()) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Task not found', 404, { taskId });
      }

      // Create resource allocation
      const allocationData: Omit<ResourceAllocation, 'allocationId'> & { allocationId: string } = {
        allocationId: '', // Will be set by Firestore
        resourceId,
        resourceType: 'worker', // Default to worker, could be enhanced
        projectId,
        taskId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        allocationPercentage: allocatedUnits,
        estimatedCost: 0, // Could be calculated based on resource rates
        status: 'planned',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.id,
      };

      const docRef = await addDoc(
        collection(db, `projects/${projectId}/resourceAllocations`),
        allocationData
      );

      try {
        await projectService.addAuditLog(
          projectId,
          user,
          `Allocated resource ${resourceId} to task ${taskId}`
        );
      } catch (error) {
        console.warn('Failed to add audit log:', error);
      }

      console.log(`✅ Resource allocated: ${docRef.id}`);
      return docRef.id;
    }, 'EnhancedTaskService.allocateResource', user.id);
  }

  /**
   * Get resource allocations for task
   */
  static async getTaskResourceAllocations(
    projectId: string,
    taskId: string
  ): Promise<APIResponse<ResourceAllocation[]>> {
    return await safeAsync(async () => {
      validateProjectId(projectId);
      validateTaskId(taskId);

      const q = query(
        collection(db, `projects/${projectId}/resourceAllocations`),
        where('taskId', '==', taskId)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => docToType<ResourceAllocation>(d));
    }, 'EnhancedTaskService.getTaskResourceAllocations');
  }

  /**
   * Update task schedule based on dependencies
   */
  static async updateTaskSchedule(
    projectId: string,
    taskId: string,
    updates: { startDate?: string; endDate?: string; duration?: number },
    user: User
  ): Promise<APIResponse<void>> {
    return await safeAsync(async () => {
      validateProjectId(projectId);
      validateTaskId(taskId);
      validateUserId(user.id);

      const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
      const taskSnap = await getDoc(taskRef);
      
      if (!taskSnap.exists()) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Task not found', 404, { taskId });
      }

      const updateData: any = {
        updatedAt: serverTimestamp()
      };

      if (updates.startDate) {
        updateData.startDate = updates.startDate;
      }

      if (updates.endDate) {
        updateData.endDate = updates.endDate;
      }

      if (updates.duration !== undefined) {
        updateData.duration = updates.duration;
        
        // If we have a start date, calculate end date
        if (updates.startDate && updates.duration) {
          const start = new Date(updates.startDate);
          const end = new Date(start);
          end.setDate(end.getDate() + updates.duration);
          updateData.endDate = end.toISOString().split('T')[0];
        }
      }

      await updateDoc(taskRef, updateData);

      try {
        await projectService.addAuditLog(
          projectId,
          user,
          `Updated schedule for task ${taskId}`
        );
      } catch (error) {
        console.warn('Failed to add audit log:', error);
      }

      console.log(`✅ Task schedule updated: ${taskId}`);
    }, 'EnhancedTaskService.updateTaskSchedule', user.id);
  }
}

// Export as singleton for backward compatibility
export const enhancedTaskService = EnhancedTaskService;