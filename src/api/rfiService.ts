import { db } from '@/firebaseConfig';
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
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { 
  Rfi, 
  RfiStatus, 
  RfiResponse, 
  RfiAssignment,
  ConstructionAttachment,
  ConstructionFilterOptions
} from '@/types/construction.types';
import { APIResponse, safeAsync, APIError, ErrorCodes } from '@/utils/responseWrapper';
import { withRetry } from '@/utils/retryWrapper';
import { validators } from '@/utils/validators';
import { logger } from '@/utils/logger.enhanced';

/**
 * Validate RFI ID
 */
const validateRfiId = (rfiId: string, context: string): void => {
  if (!validators.isValidId(rfiId)) {
    logger.warn(`Invalid RFI ID in ${context}`, { rfiId });
    throw new APIError(
      ErrorCodes.INVALID_INPUT,
      `Invalid RFI ID: "${rfiId}". RFI ID must be a non-empty string with alphanumeric characters and underscores only.`,
      400,
      {
        rfiId,
        suggestion: 'Use a valid format like "rfi_123" or generate a new ID with generateId()',
      }
    );
  }
};

/**
 * Validate RFI status
 */
const validateRfiStatus = (status: string, context: string): void => {
  const validStatuses: RfiStatus[] = [
    'draft',
    'submitted',
    'under_review',
    'pending_response',
    'responded',
    'approved',
    'closed',
    'cancelled'
  ];

  if (!validators.isValidEnum(status, validStatuses)) {
    throw new APIError(
      ErrorCodes.INVALID_INPUT,
      `Invalid RFI status: "${status}". Valid statuses are: ${validStatuses.join(', ')}`,
      400,
      {
        status,
        validStatuses,
        suggestion: 'Common workflow: draft → submitted → under_review → responded → approved → closed',
      }
    );
  }
};

// RFI Service
export class RfiService {
  private COLLECTION = 'rfis';

  /**
   * Create a new RFI
   */
  async createRfi(
    projectId: string,
    rfiData: Omit<Rfi, 'id' | 'rfiNumber' | 'responses' | 'attachments' | 'submittedDate' | 'lastUpdated' | 'daysOpen'>
  ): Promise<APIResponse<Rfi>> {
    return await safeAsync(async () => {
      logger.info('Creating RFI', { projectId });

      // Validate project ID
      if (!validators.isValidId(projectId)) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Invalid project ID', 400, { projectId });
      }

      // Validate required fields
      if (!validators.isNonEmptyString(rfiData.title)) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'RFI title is required', 400);
      }

      if (!Array.isArray(rfiData.questions) || rfiData.questions.length === 0) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'At least one question is required', 400);
      }

      // Generate RFI number
      const rfiNumber = await this.generateRfiNumber(projectId);

      const newRfi: Rfi = {
        id: this.generateId(),
        projectId,
        rfiNumber,
        title: rfiData.title,
        questions: rfiData.questions,
        type: rfiData.type,
        priority: rfiData.priority,
        status: 'draft',
        responses: [],
        submittedBy: rfiData.submittedBy,
        submittedByName: rfiData.submittedByName,
        submittedDate: new Date(),
        lastUpdated: new Date(),
        daysOpen: 0,
        attachments: [],
      };

      // Save to Firestore
      const docRef = await withRetry(
        () =>
          addDoc(collection(db, this.COLLECTION), {
            ...newRfi,
            submittedDate: serverTimestamp(),
            lastUpdated: serverTimestamp(),
          }),
        { maxAttempts: 3 }
      );

      // Update with generated ID
      const createdRfi = { ...newRfi, id: docRef.id };
      await updateDoc(docRef, { id: docRef.id });

      logger.info('RFI created successfully', {
        rfiId: docRef.id,
        rfiNumber,
        projectId,
      });

      return createdRfi;
    }, 'rfiService.createRfi');
  }

  /**
   * Get RFI by ID
   */
  async getRfiById(rfiId: string): Promise<APIResponse<Rfi>> {
    return await safeAsync(async () => {
      validateRfiId(rfiId, 'getRfiById');
      logger.info('Fetching RFI', { rfiId });

      const docRef = doc(db, this.COLLECTION, rfiId);
      const docSnap = await withRetry(() => getDoc(docRef), { maxAttempts: 3 });

      if (!docSnap.exists()) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'RFI not found', 404, { rfiId });
      }

      const rfi = { id: docSnap.id, ...docSnap.data() } as Rfi;

      logger.info('RFI fetched successfully', { rfiId });
      return rfi;
    }, 'rfiService.getRfiById');
  }

  /**
   * Get all RFIs for a project
   */
  async getRfisByProject(
    projectId: string,
    filters?: ConstructionFilterOptions
  ): Promise<APIResponse<Rfi[]>> {
    return await safeAsync(async () => {
      logger.info('Fetching RFIs for project', { projectId });

      // Validate project ID
      if (!validators.isValidId(projectId)) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Invalid project ID', 400, { projectId });
      }

      let q = query(
        collection(db, this.COLLECTION),
        where('projectId', '==', projectId),
        orderBy('submittedDate', 'desc')
      );

      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        q = query(q, where('status', 'in', filters.status));
      }

      if (filters?.priority && filters.priority.length > 0) {
        q = query(q, where('priority', 'in', filters.priority));
      }

      if (filters?.type && filters.type.length > 0) {
        q = query(q, where('type', 'in', filters.type));
      }

      if (filters?.assignedTo && filters.assignedTo.length > 0) {
        q = query(q, where('assignment.assignedTo', 'in', filters.assignedTo));
      }

      if (filters?.dateRange) {
        q = query(
          q,
          where('submittedDate', '>=', Timestamp.fromDate(filters.dateRange.start)),
          where('submittedDate', '<=', Timestamp.fromDate(filters.dateRange.end))
        );
      }

      if (filters?.searchTerm) {
        // Note: Firestore doesn't support full-text search, this is a simplified implementation
        // In production, you would use Firestore's full-text search capabilities or Algolia
        logger.warn('Full-text search not implemented in this example');
      }

      const snapshot = await withRetry(() => getDocs(q), { maxAttempts: 3 });
      const rfis = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Rfi));

      logger.info('RFIs fetched successfully', {
        projectId,
        count: rfis.length,
      });

      return rfis;
    }, 'rfiService.getRfisByProject');
  }

  /**
   * Update RFI
   */
  async updateRfi(
    rfiId: string,
    updates: Partial<Rfi>,
    updatedBy: string
  ): Promise<APIResponse<Rfi>> {
    return await safeAsync(async () => {
      validateRfiId(rfiId, 'updateRfi');
      logger.info('Updating RFI', { rfiId });

      // Validate status if provided
      if (updates.status) {
        validateRfiStatus(updates.status, 'updateRfi');
      }

      const docRef = doc(db, this.COLLECTION, rfiId);
      const updateData = {
        ...updates,
        lastUpdated: serverTimestamp(),
        updatedBy,
      };

      await withRetry(() => updateDoc(docRef, updateData), { maxAttempts: 3 });

      // Fetch updated RFI
      const updatedRfi = await this.getRfiById(rfiId);

      logger.info('RFI updated successfully', { rfiId });
      return updatedRfi.data!;
    }, 'rfiService.updateRfi');
  }

  /**
   * Submit RFI
   */
  async submitRfi(rfiId: string, submittedBy: string): Promise<APIResponse<Rfi>> {
    return await safeAsync(async () => {
      validateRfiId(rfiId, 'submitRfi');
      logger.info('Submitting RFI', { rfiId });

      const rfi = await this.getRfiById(rfiId);
      if (!rfi.success || !rfi.data) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'RFI not found', 404, { rfiId });
      }

      if (rfi.data.status !== 'draft') {
        throw new APIError(
          ErrorCodes.INVALID_OPERATION,
          'Only draft RFIs can be submitted',
          400,
          { currentStatus: rfi.data.status }
        );
      }

      const updatedRfi = await this.updateRfi(
        rfiId,
        {
          status: 'submitted',
          submittedDate: new Date(),
        },
        submittedBy
      );

      logger.info('RFI submitted successfully', { rfiId });
      return updatedRfi.data!;
    }, 'rfiService.submitRfi');
  }

  /**
   * Add response to RFI
   */
  async addRfiResponse(
    rfiId: string,
    response: Omit<RfiResponse, 'id' | 'responseDate'>,
    responderId: string,
    responderName: string
  ): Promise<APIResponse<Rfi>> {
    return await safeAsync(async () => {
      validateRfiId(rfiId, 'addRfiResponse');
      logger.info('Adding response to RFI', { rfiId });

      const rfi = await this.getRfiById(rfiId);
      if (!rfi.success || !rfi.data) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'RFI not found', 404, { rfiId });
      }

      const newResponse: RfiResponse = {
        id: this.generateId(),
        ...response,
        responderId,
        responderName,
        responseDate: new Date(),
      };

      const updatedResponses = [...rfi.data.responses, newResponse];

      const updatedRfi = await this.updateRfi(
        rfiId,
        {
          responses: updatedResponses,
          status: 'responded',
        },
        responderId
      );

      logger.info('Response added successfully', { rfiId });
      return updatedRfi.data!;
    }, 'rfiService.addRfiResponse');
  }

  /**
   * Assign RFI to user
   */
  async assignRfi(
    rfiId: string,
    assignment: Omit<RfiAssignment, 'assignedDate'>,
    assignedBy: string,
    assignedByName: string
  ): Promise<APIResponse<Rfi>> {
    return await safeAsync(async () => {
      validateRfiId(rfiId, 'assignRfi');
      logger.info('Assigning RFI', { rfiId, assignedTo: assignment.assignedTo });

      const rfiAssignment: RfiAssignment = {
        ...assignment,
        assignedBy,
        assignedByName,
        assignedDate: new Date(),
      };

      const updatedRfi = await this.updateRfi(
        rfiId,
        {
          assignment: rfiAssignment,
          status: 'under_review',
        },
        assignedBy
      );

      logger.info('RFI assigned successfully', { rfiId });
      return updatedRfi.data!;
    }, 'rfiService.assignRfi');
  }

  /**
   * Delete RFI
   */
  async deleteRfi(rfiId: string, deletedBy: string): Promise<APIResponse<void>> {
    return await safeAsync(async () => {
      validateRfiId(rfiId, 'deleteRfi');
      logger.info('Deleting RFI', { rfiId });

      // Check if RFI can be deleted (only draft or cancelled RFIs)
      const rfi = await this.getRfiById(rfiId);
      if (!rfi.success || !rfi.data) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'RFI not found', 404, { rfiId });
      }

      if (rfi.data.status !== 'draft' && rfi.data.status !== 'cancelled') {
        throw new APIError(
          ErrorCodes.INVALID_OPERATION,
          'Only draft or cancelled RFIs can be deleted',
          400,
          { currentStatus: rfi.data.status }
        );
      }

      const docRef = doc(db, this.COLLECTION, rfiId);
      await withRetry(() => deleteDoc(docRef), { maxAttempts: 3 });

      logger.info('RFI deleted successfully', { rfiId, deletedBy });
    }, 'rfiService.deleteRfi');
  }

  /**
   * Generate RFI number
   */
  private async generateRfiNumber(projectId: string): Promise<string> {
    // In a real implementation, you would query the database to find the next available number
    // For this example, we'll generate a simple number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `RFI-${new Date().getFullYear()}-${timestamp.toString().slice(-4)}-${random.toString().padStart(3, '0')}`;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `rfi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const rfiService = new RfiService();