import { db } from '@/firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { APIResponse, safeAsync, APIError, ErrorCodes } from '@/utils/responseWrapper';
import { withRetry } from '@/utils/retryWrapper';
import { validators } from '@/utils/validators';
import { logger } from '@/utils/logger.enhanced';
import type { RabItem, ApprovalDecision } from '@/types';

// Define types for RAB approval workflow
interface RabApprovalStep {
  stepNumber: number;
  approverRole: string;
  approverName: string;
  approverUserId: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  comments?: string;
  decidedAt?: Date;
  requiredBy?: Date;
}

interface RabApprovalHistory {
  approverName: string;
  approverRole: string;
  approverUserId: string;
  decision: ApprovalDecision;
  comments?: string;
  timestamp: Date;
}

export interface RabApprovalWorkflow {
  id: string;
  rabItemId: number;
  projectId: string;
  title: string;
  description: string;
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'cancelled';
  currentApproverLevel: number;
  approvalWorkflow: RabApprovalStep[];
  approvalHistory: RabApprovalHistory[];
  submittedBy: string;
  submittedAt: Date;
  updatedAt: Date;
  createdBy: string;
  createdAt: Date;
  isCancelled: boolean;
  isCompleted: boolean;
}

/**
 * Validate RAB Item ID
 */
const validateRabItemId = (rabItemId: number, context: string): void => {
  if (!Number.isInteger(rabItemId) || rabItemId <= 0) {
    logger.warn(`Invalid RAB Item ID in ${context}`, { rabItemId });
    throw new APIError(
      ErrorCodes.INVALID_INPUT,
      `Invalid RAB Item ID: "${rabItemId}". RAB Item ID must be a positive integer.`,
      400,
      {
        rabItemId,
        suggestion: 'Use a valid positive integer for RAB Item ID',
      }
    );
  }
};

// RAB Approval Service
export class RabApprovalService {
  private RAB_APPROVAL_COLLECTION = 'rabApprovals';

  /**
   * Create a new RAB approval workflow
   */
  async createRabApproval(
    projectId: string,
    rabItemId: number,
    approvalData: Omit<RabApprovalWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'rabItemId' | 'projectId'>
  ): Promise<APIResponse<RabApprovalWorkflow>> {
    return await safeAsync(async () => {
      logger.info('Creating RAB approval workflow', { projectId, rabItemId });

      // Validate project ID
      if (!validators.isValidId(projectId)) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Invalid project ID', 400, { projectId });
      }

      // Validate RAB item ID
      validateRabItemId(rabItemId, 'createRabApproval');

      const newApproval: RabApprovalWorkflow = {
        id: `rab-approval-${Date.now()}`,
        rabItemId,
        projectId,
        title: approvalData.title,
        description: approvalData.description,
        status: approvalData.status,
        currentApproverLevel: approvalData.currentApproverLevel,
        approvalWorkflow: approvalData.approvalWorkflow,
        approvalHistory: approvalData.approvalHistory,
        submittedBy: approvalData.submittedBy,
        submittedAt: approvalData.submittedAt,
        updatedAt: new Date(),
        createdBy: approvalData.createdBy,
        createdAt: new Date(),
        isCancelled: approvalData.isCancelled,
        isCompleted: approvalData.isCompleted,
      };

      // Save to Firestore
      const docRef = await withRetry(
        () =>
          addDoc(collection(db, `projects/${projectId}/${this.RAB_APPROVAL_COLLECTION}`), {
            ...newApproval,
          }),
        { maxAttempts: 3 }
      );

      logger.info('RAB approval workflow created successfully', {
        approvalId: newApproval.id,
        projectId,
        rabItemId,
      });

      return newApproval;
    }, 'rabApprovalService.createRabApproval');
  }

  /**
   * Get RAB approval workflow by ID
   */
  async getRabApprovalById(
    projectId: string,
    approvalId: string
  ): Promise<APIResponse<RabApprovalWorkflow>> {
    return await safeAsync(async () => {
      logger.info('Fetching RAB approval workflow', { projectId, approvalId });

      // Validate project ID
      if (!validators.isValidId(projectId)) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Invalid project ID', 400, { projectId });
      }

      const docRef = doc(db, `projects/${projectId}/${this.RAB_APPROVAL_COLLECTION}`, approvalId);
      const docSnap = await withRetry(() => getDoc(docRef), { maxAttempts: 3 });

      if (!docSnap.exists()) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'RAB approval workflow not found', 404, { approvalId });
      }

      const approval = { id: approvalId, ...docSnap.data() } as RabApprovalWorkflow;

      logger.info('RAB approval workflow fetched successfully', { projectId, approvalId });
      return approval;
    }, 'rabApprovalService.getRabApprovalById');
  }

  /**
   * Get RAB approval workflow by RAB item ID
   */
  async getRabApprovalByRabItemId(
    projectId: string,
    rabItemId: number
  ): Promise<APIResponse<RabApprovalWorkflow>> {
    return await safeAsync(async () => {
      logger.info('Fetching RAB approval workflow by RAB item ID', { projectId, rabItemId });

      // Validate project ID
      if (!validators.isValidId(projectId)) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Invalid project ID', 400, { projectId });
      }

      // Validate RAB item ID
      validateRabItemId(rabItemId, 'getRabApprovalByRabItemId');

      const q = query(
        collection(db, `projects/${projectId}/${this.RAB_APPROVAL_COLLECTION}`),
        where('rabItemId', '==', rabItemId)
      );

      const snapshot = await withRetry(() => getDocs(q), { maxAttempts: 3 });
      
      if (snapshot.empty) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'RAB approval workflow not found', 404, { rabItemId });
      }

      const approval = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as RabApprovalWorkflow;

      logger.info('RAB approval workflow fetched successfully', { projectId, rabItemId });
      return approval;
    }, 'rabApprovalService.getRabApprovalByRabItemId');
  }

  /**
   * Update RAB approval workflow
   */
  async updateRabApproval(
    projectId: string,
    approvalId: string,
    updates: Partial<RabApprovalWorkflow>
  ): Promise<APIResponse<RabApprovalWorkflow>> {
    return await safeAsync(async () => {
      logger.info('Updating RAB approval workflow', { projectId, approvalId });

      // Validate project ID
      if (!validators.isValidId(projectId)) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Invalid project ID', 400, { projectId });
      }

      const docRef = doc(db, `projects/${projectId}/${this.RAB_APPROVAL_COLLECTION}`, approvalId);
      
      await withRetry(() => updateDoc(docRef, { ...updates, updatedAt: new Date() }), { maxAttempts: 3 });

      // Fetch updated approval workflow
      const updatedApproval = await this.getRabApprovalById(projectId, approvalId);

      logger.info('RAB approval workflow updated successfully', { projectId, approvalId });
      return updatedApproval.data!;
    }, 'rabApprovalService.updateRabApproval');
  }

  /**
   * Process approval decision
   */
  async processApproval(
    projectId: string,
    approvalId: string,
    decision: ApprovalDecision,
    comments: string,
    approverUserId: string
  ): Promise<APIResponse<RabApprovalWorkflow>> {
    return await safeAsync(async () => {
      logger.info('Processing RAB approval decision', { projectId, approvalId, decision });

      // Validate project ID
      if (!validators.isValidId(projectId)) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Invalid project ID', 400, { projectId });
      }

      // Get current approval workflow
      const approvalResult = await this.getRabApprovalById(projectId, approvalId);
      if (!approvalResult.success || !approvalResult.data) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'RAB approval workflow not found', 404, { approvalId });
      }

      const approval = approvalResult.data;
      
      // Check if this is the current approver's turn
      const currentStep = approval.approvalWorkflow.find(
        step => step.stepNumber === approval.currentApproverLevel
      );
      
      if (!currentStep) {
        throw new APIError(ErrorCodes.INVALID_OPERATION, 'No current approval step found', 400);
      }
      
      if (currentStep.status !== 'pending') {
        throw new APIError(ErrorCodes.INVALID_OPERATION, 'Current step is not pending', 400);
      }

      // Update the current step
      currentStep.status = decision === 'approve' ? 'approved' : 'rejected';
      currentStep.decidedAt = new Date();
      currentStep.comments = comments;

      // Add to approval history
      approval.approvalHistory.push({
        approverName: 'Current Approver', // In real implementation, fetch from user service
        approverRole: currentStep.approverRole,
        approverUserId,
        decision,
        comments,
        timestamp: new Date(),
      });

      // Update workflow status based on decision
      if (decision === 'approve') {
        // Move to next approver or complete if this was the last step
        const nextStep = approval.approvalWorkflow.find(
          step => step.stepNumber === approval.currentApproverLevel + 1
        );
        
        if (nextStep) {
          approval.currentApproverLevel = nextStep.stepNumber;
        } else {
          // No more steps, approval is complete
          approval.status = 'approved';
          approval.isCompleted = true;
        }
      } else {
        // Rejected or revision requested
        approval.status = decision === 'reject' ? 'rejected' : 'in_review';
      }

      // Update in database
      const updatedApproval = await this.updateRabApproval(projectId, approvalId, {
        approvalWorkflow: approval.approvalWorkflow,
        approvalHistory: approval.approvalHistory,
        currentApproverLevel: approval.currentApproverLevel,
        status: approval.status,
        isCompleted: approval.isCompleted,
      });

      logger.info('RAB approval decision processed successfully', { projectId, approvalId });
      return updatedApproval.data!;
    }, 'rabApprovalService.processApproval');
  }
}

// Export singleton instance
export const rabApprovalService = new RabApprovalService();