/**
 * Change Order Management API Service
 * Priority 3C: Change Order Management System
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
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type {
  ChangeOrder,
  ChangeOrderStatus,
  ChangeOrderType,
  ChangeOrderSummary,
  ChangeOrderFilterOptions,
  ApprovalDecision,
} from '../types/changeOrder.types';

const CHANGE_ORDERS_COLLECTION = 'changeOrders';

class ChangeOrderService {
  /**
   * Generate change order number
   */
  private async generateChangeNumber(projectId: string): Promise<string> {
    const year = new Date().getFullYear();
    const q = query(
      collection(db, CHANGE_ORDERS_COLLECTION),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const count = snapshot.size + 1;
    
    return `CO-${year}-${String(count).padStart(3, '0')}`;
  }

  /**
   * Create change order
   */
  async createChangeOrder(changeOrder: Omit<ChangeOrder, 'id' | 'changeNumber' | 'createdAt' | 'updatedAt'>): Promise<ChangeOrder> {
    try {
      const now = new Date();
      const changeNumber = await this.generateChangeNumber(changeOrder.projectId);

      const changeOrderData = {
        ...changeOrder,
        changeNumber,
        currentApproverLevel: 0,
        requestedDate: Timestamp.fromDate(changeOrder.requestedDate),
        requiredBy: changeOrder.requiredBy ? Timestamp.fromDate(changeOrder.requiredBy) : null,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        approvalWorkflow: changeOrder.approvalWorkflow.map(step => ({
          ...step,
          requiredBy: step.requiredBy ? Timestamp.fromDate(step.requiredBy) : null,
        })),
      };

      const docRef = await addDoc(collection(db, CHANGE_ORDERS_COLLECTION), changeOrderData);

      return {
        ...changeOrder,
        id: docRef.id,
        changeNumber,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error('[ChangeOrderService] Error creating change order:', error);
      throw new Error(`Failed to create change order: ${error.message}`);
    }
  }

  /**
   * Get change order by ID
   */
  async getChangeOrderById(changeOrderId: string): Promise<ChangeOrder | null> {
    try {
      const docRef = doc(db, CHANGE_ORDERS_COLLECTION, changeOrderId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        requestedDate: data.requestedDate?.toDate(),
        requiredBy: data.requiredBy?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        submittedAt: data.submittedAt?.toDate(),
        approvedAt: data.approvedAt?.toDate(),
        rejectedAt: data.rejectedAt?.toDate(),
        implementationStartDate: data.implementationStartDate?.toDate(),
        implementationEndDate: data.implementationEndDate?.toDate(),
        implementedDate: data.implementedDate?.toDate(),
        approvalHistory: data.approvalHistory?.map((a: any) => ({
          ...a,
          timestamp: a.timestamp?.toDate(),
        })) || [],
      } as ChangeOrder;
    } catch (error) {
      console.error('[ChangeOrderService] Error getting change order:', error);
      throw new Error(`Failed to get change order: ${error.message}`);
    }
  }

  /**
   * Get change orders with filters
   */
  async getChangeOrders(projectId: string, filters?: ChangeOrderFilterOptions): Promise<ChangeOrder[]> {
    try {
      let constraints: any[] = [where('projectId', '==', projectId)];

      if (filters?.status && filters.status.length > 0) {
        constraints.push(where('status', 'in', filters.status));
      }

      if (filters?.type && filters.type.length > 0) {
        constraints.push(where('changeType', 'in', filters.type));
      }

      constraints.push(orderBy('requestedDate', 'desc'));

      const q = query(collection(db, CHANGE_ORDERS_COLLECTION), ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          requestedDate: data.requestedDate?.toDate(),
          requiredBy: data.requiredBy?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as ChangeOrder;
      });
    } catch (error) {
      console.error('[ChangeOrderService] Error getting change orders:', error);
      throw new Error(`Failed to get change orders: ${error.message}`);
    }
  }

  /**
   * Update change order
   */
  async updateChangeOrder(changeOrderId: string, updates: Partial<ChangeOrder>): Promise<void> {
    try {
      const docRef = doc(db, CHANGE_ORDERS_COLLECTION, changeOrderId);
      
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      };

      delete updateData.id;
      delete updateData.createdAt;

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('[ChangeOrderService] Error updating change order:', error);
      throw new Error(`Failed to update change order: ${error.message}`);
    }
  }

  /**
   * Process approval decision
   */
  async processApproval(
    changeOrderId: string,
    decision: ApprovalDecision,
    comments: string,
    approverUserId: string
  ): Promise<void> {
    try {
      const changeOrder = await this.getChangeOrderById(changeOrderId);
      if (!changeOrder) {
        throw new Error('Change order not found');
      }

      const currentStep = changeOrder.approvalWorkflow[changeOrder.currentApproverLevel];
      if (!currentStep) {
        throw new Error('No pending approval step');
      }

      // Update approval step
      currentStep.status = decision === 'approve' ? 'approved' : 'rejected';
      currentStep.decision = decision;
      currentStep.comments = comments;
      currentStep.decidedAt = new Date();

      // Add to approval history
      const approvalRecord = {
        approverUserId,
        approverName: currentStep.approverName,
        decision,
        comments,
        timestamp: new Date(),
      };

      const updates: Partial<ChangeOrder> = {
        approvalWorkflow: changeOrder.approvalWorkflow,
        approvalHistory: [...changeOrder.approvalHistory, approvalRecord],
      };

      // Update status based on decision
      if (decision === 'reject') {
        updates.status = 'rejected';
        updates.rejectedAt = new Date();
        updates.rejectionReason = comments;
      } else if (decision === 'approve') {
        // Check if this was the last approval step
        if (changeOrder.currentApproverLevel === changeOrder.approvalWorkflow.length - 1) {
          updates.status = 'approved';
          updates.approvedAt = new Date();
        } else {
          updates.currentApproverLevel = changeOrder.currentApproverLevel + 1;
          updates.status = 'pending_approval';
        }
      }

      await this.updateChangeOrder(changeOrderId, updates);
    } catch (error) {
      console.error('[ChangeOrderService] Error processing approval:', error);
      throw new Error(`Failed to process approval: ${error.message}`);
    }
  }

  /**
   * Get change order summary
   */
  async getSummary(projectId: string): Promise<ChangeOrderSummary> {
    try {
      const changeOrders = await this.getChangeOrders(projectId);

      const summary: ChangeOrderSummary = {
        projectId,
        totalChangeOrders: changeOrders.length,
        byStatus: {} as any,
        byType: {} as any,
        totalCostImpact: changeOrders.reduce((sum, co) => sum + co.costImpact, 0),
        totalScheduleImpact: changeOrders.reduce((sum, co) => sum + co.scheduleImpact, 0),
        approvalRate: 0,
        averageApprovalTime: 0,
        pendingApprovals: changeOrders.filter(co => 
          ['submitted', 'under_review', 'pending_approval'].includes(co.status)
        ).length,
        overdueApprovals: 0,
      };

      // Calculate approval rate
      const decided = changeOrders.filter(co => 
        ['approved', 'rejected'].includes(co.status)
      );
      const approved = changeOrders.filter(co => co.status === 'approved');
      summary.approvalRate = decided.length > 0 ? (approved.length / decided.length) * 100 : 0;

      return summary;
    } catch (error) {
      console.error('[ChangeOrderService] Error getting summary:', error);
      throw new Error(`Failed to get summary: ${error.message}`);
    }
  }

  /**
   * Delete change order
   */
  async deleteChangeOrder(changeOrderId: string): Promise<void> {
    try {
      const docRef = doc(db, CHANGE_ORDERS_COLLECTION, changeOrderId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('[ChangeOrderService] Error deleting change order:', error);
      throw new Error(`Failed to delete change order: ${error.message}`);
    }
  }
}

export const changeOrderService = new ChangeOrderService();
export default changeOrderService;
