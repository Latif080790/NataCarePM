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
  Submittal, 
  SubmittalStatus, 
  SubmittalReview, 
  SubmittalApproval,
  SubmittalRevision,
  ConstructionFilterOptions
} from '@/types/construction.types';
import { APIResponse, safeAsync, APIError, ErrorCodes } from '@/utils/responseWrapper';
import { withRetry } from '@/utils/retryWrapper';
import { validators } from '@/utils/validators';
import { logger } from '@/utils/logger.enhanced';

/**
 * Validate Submittal ID
 */
const validateSubmittalId = (submittalId: string, context: string): void => {
  if (!validators.isValidId(submittalId)) {
    logger.warn(`Invalid Submittal ID in ${context}`, { submittalId });
    throw new APIError(
      ErrorCodes.INVALID_INPUT,
      `Invalid Submittal ID: "${submittalId}". Submittal ID must be a non-empty string with alphanumeric characters and underscores only.`,
      400,
      {
        submittalId,
        suggestion: 'Use a valid format like "sub_123" or generate a new ID with generateId()',
      }
    );
  }
};

/**
 * Validate Submittal status
 */
const validateSubmittalStatus = (status: string, context: string): void => {
  const validStatuses: SubmittalStatus[] = [
    'draft',
    'submitted',
    'under_review',
    'reviewed',
    'approved',
    'rejected',
    'resubmitted',
    'closed',
    'cancelled'
  ];

  if (!validators.isValidEnum(status, validStatuses)) {
    throw new APIError(
      ErrorCodes.INVALID_INPUT,
      `Invalid Submittal status: "${status}". Valid statuses are: ${validStatuses.join(', ')}`,
      400,
      {
        status,
        validStatuses,
        suggestion: 'Common workflow: draft → submitted → under_review → reviewed → approved/rejected → closed',
      }
    );
  }
};

// Submittal Service
export class SubmittalService {
  private COLLECTION = 'submittals';

  /**
   * Create a new Submittal
   */
  async createSubmittal(
    projectId: string,
    submittalData: Omit<Submittal, 'id' | 'submittalNumber' | 'reviews' | 'approvals' | 'revisions' | 'submittedDate' | 'lastUpdated' | 'daysOpen'>
  ): Promise<APIResponse<Submittal>> {
    return await safeAsync(async () => {
      logger.info('Creating Submittal', { projectId });

      // Validate project ID
      if (!validators.isValidId(projectId)) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Invalid project ID', 400, { projectId });
      }

      // Validate required fields
      if (!validators.isNonEmptyString(submittalData.title)) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Submittal title is required', 400);
      }

      if (!Array.isArray(submittalData.files) || submittalData.files.length === 0) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'At least one file is required', 400);
      }

      // Generate Submittal number
      const submittalNumber = await this.generateSubmittalNumber(projectId);

      const newSubmittal: Submittal = {
        id: this.generateId(),
        projectId,
        submittalNumber,
        title: submittalData.title,
        description: submittalData.description || '',
        type: submittalData.type,
        status: 'draft',
        specificationSection: submittalData.specificationSection,
        drawingReferences: submittalData.drawingReferences,
        submittedBy: submittalData.submittedBy,
        submittedByName: submittalData.submittedByName,
        submittedDate: new Date(),
        dueDate: submittalData.dueDate,
        files: submittalData.files,
        revisions: [],
        reviewers: submittalData.reviewers || [],
        reviews: [],
        approvals: [],
        daysOpen: 0,
        lastUpdated: new Date(),
        createdBy: submittalData.submittedBy,
        updatedBy: submittalData.submittedBy,
      };

      // Save to Firestore
      const docRef = await withRetry(
        () =>
          addDoc(collection(db, this.COLLECTION), {
            ...newSubmittal,
            submittedDate: serverTimestamp(),
            lastUpdated: serverTimestamp(),
          }),
        { maxAttempts: 3 }
      );

      // Update with generated ID
      const createdSubmittal = { ...newSubmittal, id: docRef.id };
      await updateDoc(docRef, { id: docRef.id });

      logger.info('Submittal created successfully', {
        submittalId: docRef.id,
        submittalNumber,
        projectId,
      });

      return createdSubmittal;
    }, 'submittalService.createSubmittal');
  }

  /**
   * Get Submittal by ID
   */
  async getSubmittalById(submittalId: string): Promise<APIResponse<Submittal>> {
    return await safeAsync(async () => {
      validateSubmittalId(submittalId, 'getSubmittalById');
      logger.info('Fetching Submittal', { submittalId });

      const docRef = doc(db, this.COLLECTION, submittalId);
      const docSnap = await withRetry(() => getDoc(docRef), { maxAttempts: 3 });

      if (!docSnap.exists()) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Submittal not found', 404, { submittalId });
      }

      const submittal = { id: docSnap.id, ...docSnap.data() } as Submittal;

      logger.info('Submittal fetched successfully', { submittalId });
      return submittal;
    }, 'submittalService.getSubmittalById');
  }

  /**
   * Get all Submittals for a project
   */
  async getSubmittalsByProject(
    projectId: string,
    filters?: ConstructionFilterOptions
  ): Promise<APIResponse<Submittal[]>> {
    return await safeAsync(async () => {
      logger.info('Fetching Submittals for project', { projectId });

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

      if (filters?.type && filters.type.length > 0) {
        q = query(q, where('type', 'in', filters.type));
      }

      if (filters?.assignedTo && filters.assignedTo.length > 0) {
        q = query(q, where('reviewers', 'array-contains-any', filters.assignedTo));
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
        logger.warn('Full-text search not implemented in this example');
      }

      const snapshot = await withRetry(() => getDocs(q), { maxAttempts: 3 });
      const submittals = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Submittal));

      logger.info('Submittals fetched successfully', {
        projectId,
        count: submittals.length,
      });

      return submittals;
    }, 'submittalService.getSubmittalsByProject');
  }

  /**
   * Update Submittal
   */
  async updateSubmittal(
    submittalId: string,
    updates: Partial<Submittal>,
    updatedBy: string
  ): Promise<APIResponse<Submittal>> {
    return await safeAsync(async () => {
      validateSubmittalId(submittalId, 'updateSubmittal');
      logger.info('Updating Submittal', { submittalId });

      // Validate status if provided
      if (updates.status) {
        validateSubmittalStatus(updates.status, 'updateSubmittal');
      }

      const docRef = doc(db, this.COLLECTION, submittalId);
      const updateData = {
        ...updates,
        lastUpdated: serverTimestamp(),
        updatedBy,
      };

      await withRetry(() => updateDoc(docRef, updateData), { maxAttempts: 3 });

      // Fetch updated Submittal
      const updatedSubmittal = await this.getSubmittalById(submittalId);

      logger.info('Submittal updated successfully', { submittalId });
      return updatedSubmittal.data!;
    }, 'submittalService.updateSubmittal');
  }

  /**
   * Submit Submittal
   */
  async submitSubmittal(submittalId: string, submittedBy: string): Promise<APIResponse<Submittal>> {
    return await safeAsync(async () => {
      validateSubmittalId(submittalId, 'submitSubmittal');
      logger.info('Submitting Submittal', { submittalId });

      const submittal = await this.getSubmittalById(submittalId);
      if (!submittal.success || !submittal.data) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Submittal not found', 404, { submittalId });
      }

      if (submittal.data.status !== 'draft') {
        throw new APIError(
          ErrorCodes.INVALID_OPERATION,
          'Only draft Submittals can be submitted',
          400,
          { currentStatus: submittal.data.status }
        );
      }

      const updatedSubmittal = await this.updateSubmittal(
        submittalId,
        {
          status: 'submitted',
          submittedDate: new Date(),
        },
        submittedBy
      );

      logger.info('Submittal submitted successfully', { submittalId });
      return updatedSubmittal.data!;
    }, 'submittalService.submitSubmittal');
  }

  /**
   * Add review to Submittal
   */
  async addSubmittalReview(
    submittalId: string,
    review: Omit<SubmittalReview, 'id' | 'reviewDate'>,
    reviewerId: string,
    reviewerName: string,
    reviewerRole: string
  ): Promise<APIResponse<Submittal>> {
    return await safeAsync(async () => {
      validateSubmittalId(submittalId, 'addSubmittalReview');
      logger.info('Adding review to Submittal', { submittalId });

      const submittal = await this.getSubmittalById(submittalId);
      if (!submittal.success || !submittal.data) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Submittal not found', 404, { submittalId });
      }

      const newReview: SubmittalReview = {
        id: this.generateId(),
        ...review,
        reviewerId,
        reviewerName,
        reviewerRole,
        reviewDate: new Date(),
      };

      const updatedReviews = [...submittal.data.reviews, newReview];

      const updatedSubmittal = await this.updateSubmittal(
        submittalId,
        {
          reviews: updatedReviews,
          status: 'reviewed',
        },
        reviewerId
      );

      logger.info('Review added successfully', { submittalId });
      return updatedSubmittal.data!;
    }, 'submittalService.addSubmittalReview');
  }

  /**
   * Add approval to Submittal
   */
  async addSubmittalApproval(
    submittalId: string,
    approval: Omit<SubmittalApproval, 'id' | 'approvalDate'>,
    approverId: string,
    approverName: string,
    approverRole: string
  ): Promise<APIResponse<Submittal>> {
    return await safeAsync(async () => {
      validateSubmittalId(submittalId, 'addSubmittalApproval');
      logger.info('Adding approval to Submittal', { submittalId });

      const submittal = await this.getSubmittalById(submittalId);
      if (!submittal.success || !submittal.data) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Submittal not found', 404, { submittalId });
      }

      const newApproval: SubmittalApproval = {
        id: this.generateId(),
        ...approval,
        approverId,
        approverName,
        approverRole,
        approvalDate: new Date(),
      };

      const updatedApprovals = [...submittal.data.approvals, newApproval];

      const updatedSubmittal = await this.updateSubmittal(
        submittalId,
        {
          approvals: updatedApprovals,
          status: approval.status === 'approved' ? 'approved' : 'rejected',
          approvedDate: approval.status === 'approved' ? new Date() : undefined,
          rejectedDate: approval.status === 'rejected' ? new Date() : undefined,
        },
        approverId
      );

      logger.info('Approval added successfully', { submittalId });
      return updatedSubmittal.data!;
    }, 'submittalService.addSubmittalApproval');
  }

  /**
   * Add revision to Submittal
   */
  async addSubmittalRevision(
    submittalId: string,
    revision: Omit<SubmittalRevision, 'revisionNumber' | 'submittedDate' | 'submittedBy' | 'submittedByName'>,
    submittedBy: string,
    submittedByName: string
  ): Promise<APIResponse<Submittal>> {
    return await safeAsync(async () => {
      validateSubmittalId(submittalId, 'addSubmittalRevision');
      logger.info('Adding revision to Submittal', { submittalId });

      const submittal = await this.getSubmittalById(submittalId);
      if (!submittal.success || !submittal.data) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Submittal not found', 404, { submittalId });
      }

      // Generate revision number
      const revisionNumber = `REV-${(submittal.data.revisions.length + 1).toString().padStart(2, '0')}`;

      const newRevision: SubmittalRevision = {
        revisionNumber,
        ...revision,
        submittedDate: new Date(),
        submittedBy,
        submittedByName,
      };

      const updatedRevisions = [...submittal.data.revisions, newRevision];

      const updatedSubmittal = await this.updateSubmittal(
        submittalId,
        {
          revisions: updatedRevisions,
          status: 'resubmitted',
        },
        submittedBy
      );

      logger.info('Revision added successfully', { submittalId });
      return updatedSubmittal.data!;
    }, 'submittalService.addSubmittalRevision');
  }

  /**
   * Delete Submittal
   */
  async deleteSubmittal(submittalId: string, deletedBy: string): Promise<APIResponse<void>> {
    return await safeAsync(async () => {
      validateSubmittalId(submittalId, 'deleteSubmittal');
      logger.info('Deleting Submittal', { submittalId });

      // Check if Submittal can be deleted (only draft or cancelled Submittals)
      const submittal = await this.getSubmittalById(submittalId);
      if (!submittal.success || !submittal.data) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Submittal not found', 404, { submittalId });
      }

      if (submittal.data.status !== 'draft' && submittal.data.status !== 'cancelled') {
        throw new APIError(
          ErrorCodes.INVALID_OPERATION,
          'Only draft or cancelled Submittals can be deleted',
          400,
          { currentStatus: submittal.data.status }
        );
      }

      const docRef = doc(db, this.COLLECTION, submittalId);
      await withRetry(() => deleteDoc(docRef), { maxAttempts: 3 });

      logger.info('Submittal deleted successfully', { submittalId, deletedBy });
    }, 'submittalService.deleteSubmittal');
  }

  /**
   * Generate Submittal number
   */
  private async generateSubmittalNumber(projectId: string): Promise<string> {
    // In a real implementation, you would query the database to find the next available number
    // For this example, we'll generate a simple number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `SUB-${new Date().getFullYear()}-${timestamp.toString().slice(-4)}-${random.toString().padStart(3, '0')}`;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const submittalService = new SubmittalService();