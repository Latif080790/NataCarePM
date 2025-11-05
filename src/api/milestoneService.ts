/**
 * Milestone Management API Service
 *
 * Provides CRUD operations and business logic for managing
 * project milestones with dependencies and progress tracking.
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
import { Milestone, MilestoneProgressUpdate, User } from '@/types';
import { APIResponse, APIError, ErrorCodes, safeAsync } from '@/utils/responseWrapper';

import { validators } from '@/utils/validators';

// Helper to convert Firestore doc to TypeScript types
const docToType = <T>(docSnap: any): T => ({ ...(docSnap.data() as any), id: docSnap.id } as T);

// Validation helpers
const validateProjectId = (projectId: string): void => {
  const validation = validators.isValidProjectId(projectId);
  if (!validation.valid) throw new APIError(ErrorCodes.INVALID_INPUT, validation.errors[0] || 'Invalid project ID', 400, { projectId, errors: validation.errors });
};

const validateMilestoneId = (milestoneId: string): void => {
  if (!validators.isValidId(milestoneId)) throw new APIError(ErrorCodes.INVALID_INPUT, 'Invalid milestone ID', 400, { milestoneId });
};

const validateUserId = (userId: string): void => {
  if (!validators.isValidId(userId)) throw new APIError(ErrorCodes.INVALID_INPUT, 'Invalid user ID', 400, { userId });
};

/**
 * Milestone Service Class
 */
export class MilestoneService {
  private static collectionName = 'milestones';

  /**
   * Create a new milestone
   */
  static async createMilestone(
    projectId: string,
    milestoneData: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>,
    user: User
  ): Promise<APIResponse<string>> {
    return await safeAsync(async () => {
      validateProjectId(projectId);
      validateUserId(user.id);

      // Validate required fields
      if (!milestoneData.name || milestoneData.name.trim().length === 0) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Milestone name is required', 400);
      }

      if (!milestoneData.dueDate) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Due date is required', 400);
      }

      const newMilestone: Omit<Milestone, 'id'> = {
        ...milestoneData,
        projectId,
        progress: milestoneData.progress || 0,
        dependencies: milestoneData.dependencies || [],
        assignedTo: milestoneData.assignedTo || [],
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, this.collectionName), newMilestone);

      console.log(`✅ Milestone created: ${docRef.id}`);
      return docRef.id;
    }, 'MilestoneService.createMilestone', user.id);
  }

  /**
   * Get milestone by ID
   */
  static async getMilestone(milestoneId: string): Promise<APIResponse<Milestone | null>> {
    return await safeAsync(async () => {
      validateMilestoneId(milestoneId);

      const docRef = doc(db, this.collectionName, milestoneId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return docToType<Milestone>(docSnap);
    }, 'MilestoneService.getMilestone');
  }

  /**
   * Get all milestones for a project
   */
  static async getProjectMilestones(projectId: string): Promise<APIResponse<Milestone[]>> {
    return await safeAsync(async () => {
      validateProjectId(projectId);

      const q = query(
        collection(db, this.collectionName),
        where('projectId', '==', projectId),
        orderBy('dueDate', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => docToType<Milestone>(doc));
    }, 'MilestoneService.getProjectMilestones');
  }

  /**
   * Update milestone
   */
  static async updateMilestone(
    milestoneId: string,
    updates: Partial<Milestone>,
    user: User
  ): Promise<APIResponse<void>> {
    return await safeAsync(async () => {
      validateMilestoneId(milestoneId);
      validateUserId(user.id);

      const milestoneRef = doc(db, this.collectionName, milestoneId);
      const milestoneSnap = await getDoc(milestoneRef);

      if (!milestoneSnap.exists()) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Milestone not found', 404, { milestoneId });
      }

      // Validate progress if provided
      if (updates.progress !== undefined && (updates.progress < 0 || updates.progress > 100)) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Progress must be between 0 and 100', 400);
      }

      await updateDoc(milestoneRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      console.log(`✅ Milestone updated: ${milestoneId}`);
    }, 'MilestoneService.updateMilestone', user.id);
  }

  /**
   * Update milestone progress
   */
  static async updateMilestoneProgress(
    milestoneId: string,
    progressUpdate: MilestoneProgressUpdate,
    user: User
  ): Promise<APIResponse<void>> {
    return await safeAsync(async () => {
      validateMilestoneId(milestoneId);
      validateUserId(user.id);

      const milestoneRef = doc(db, this.collectionName, milestoneId);
      const milestoneSnap = await getDoc(milestoneRef);

      if (!milestoneSnap.exists()) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Milestone not found', 404, { milestoneId });
      }

      // Validate progress
      if (progressUpdate.progress < 0 || progressUpdate.progress > 100) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Progress must be between 0 and 100', 400);
      }

      const updates: Partial<Milestone> = {
        progress: progressUpdate.progress,
        updatedAt: new Date().toISOString(),
      };

      // Update status if provided
      if (progressUpdate.status) {
        updates.status = progressUpdate.status;
      }

      // Auto-complete milestone if progress is 100
      if (progressUpdate.progress === 100) {
        updates.status = 'completed';
      }

      await updateDoc(milestoneRef, updates);

      console.log(`✅ Milestone progress updated: ${milestoneId} (${progressUpdate.progress}%)`);
    }, 'MilestoneService.updateMilestoneProgress', user.id);
  }

  /**
   * Delete milestone
   */
  static async deleteMilestone(
    milestoneId: string,
    user: User
  ): Promise<APIResponse<void>> {
    return await safeAsync(async () => {
      validateMilestoneId(milestoneId);
      validateUserId(user.id);

      const milestoneRef = doc(db, this.collectionName, milestoneId);
      const milestoneSnap = await getDoc(milestoneRef);

      if (!milestoneSnap.exists()) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Milestone not found', 404, { milestoneId });
      }

      await deleteDoc(milestoneRef);

      console.log(`✅ Milestone deleted: ${milestoneId}`);
    }, 'MilestoneService.deleteMilestone', user.id);
  }

  /**
   * Get upcoming milestones
   */
  static async getUpcomingMilestones(
    projectId: string,
    daysAhead: number = 30
  ): Promise<APIResponse<Milestone[]>> {
    return await safeAsync(async () => {
      validateProjectId(projectId);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

      const q = query(
        collection(db, this.collectionName),
        where('projectId', '==', projectId),
        where('dueDate', '>=', new Date().toISOString().split('T')[0]),
        where('dueDate', '<=', cutoffDate.toISOString().split('T')[0]),
        where('status', '!=', 'completed'),
        orderBy('dueDate', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => docToType<Milestone>(doc));
    }, 'MilestoneService.getUpcomingMilestones');
  }

  /**
   * Get overdue milestones
   */
  static async getOverdueMilestones(projectId: string): Promise<APIResponse<Milestone[]>> {
    return await safeAsync(async () => {
      validateProjectId(projectId);

      const q = query(
        collection(db, this.collectionName),
        where('projectId', '==', projectId),
        where('dueDate', '<', new Date().toISOString().split('T')[0]),
        where('status', '!=', 'completed'),
        orderBy('dueDate', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => docToType<Milestone>(doc));
    }, 'MilestoneService.getOverdueMilestones');
  }

  /**
   * Check milestone dependencies
   */
  static async checkMilestoneDependencies(
    milestoneId: string
  ): Promise<APIResponse<{ canProceed: boolean; blockingTasks: string[] }>> {
    return await safeAsync(async () => {
      validateMilestoneId(milestoneId);

      const milestone = await this.getMilestone(milestoneId);
      if (!milestone.success || !milestone.data) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Milestone not found', 404, { milestoneId });
      }

      // In a real implementation, this would check task completion status
      // For now, we'll return a placeholder response
      return {
        canProceed: milestone.data.data!.dependencies.length === 0,
        blockingTasks: milestone.data.data!.dependencies,
      };
    }, 'MilestoneService.checkMilestoneDependencies');
  }
}

// Export as singleton for backward compatibility
export const milestoneService = MilestoneService;