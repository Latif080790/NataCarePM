/**
 * Risk Management API Service
 * Priority 3B: Risk Management System
 *
 * Comprehensive risk identification, assessment, mitigation, and monitoring.
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
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import type {
  Risk,
  RiskSeverity,
  RiskProbability,
  RiskPriorityLevel,
  RiskReview,
  RiskAlert,
  RiskFilterOptions,
  RiskDashboardStats
} from '@/types/risk.types';

const RISKS_COLLECTION = 'risks';
const REVIEWS_COLLECTION = 'riskReviews';
const LESSONS_COLLECTION = 'lessonsLearned';
const ALERTS_COLLECTION = 'riskAlerts';

class RiskService {
  /**
   * Calculate risk score and priority level
   */
  private calculateRiskScore(
    severity: RiskSeverity,
    probability: RiskProbability
  ): {
    score: number;
    priorityLevel: RiskPriorityLevel;
  } {
    const score = severity * probability;

    let priorityLevel: RiskPriorityLevel;
    if (score >= 16) priorityLevel = 'critical';
    else if (score >= 10) priorityLevel = 'high';
    else if (score >= 5) priorityLevel = 'medium';
    else priorityLevel = 'low';

    return { score, priorityLevel };
  }

  /**
   * Create a new risk
   */
  async createRisk(
    risk: Omit<
      Risk,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'riskScore'
      | 'priorityLevel'
      | 'reviewHistory'
      | 'statusHistory'
    >
  ): Promise<Risk> {
    try {
      const { score, priorityLevel } = this.calculateRiskScore(risk.severity, risk.probability);
      const now = new Date();

      const riskNumber = await this.generateRiskNumber(risk.projectId);

      const riskData = {
        ...risk,
        riskNumber,
        riskScore: score,
        priorityLevel,
        reviewHistory: [],
        statusHistory: [
          {
            timestamp: Timestamp.fromDate(now),
            changedBy: risk.identifiedBy,
            previousStatus: null as any,
            newStatus: risk.status,
            reason: 'Initial creation',
          },
        ],
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        identifiedDate: Timestamp.fromDate(risk.identifiedDate),
        assessmentDate: risk.assessmentDate ? Timestamp.fromDate(risk.assessmentDate) : null,
        targetCloseDate: risk.targetCloseDate ? Timestamp.fromDate(risk.targetCloseDate) : null,
      };

      const docRef = await addDoc(collection(db, RISKS_COLLECTION), riskData);

      // Create alert if high priority
      if (priorityLevel === 'critical' || priorityLevel === 'high') {
        await this.createAlert({
          riskId: docRef.id,
          riskTitle: risk.title,
          alertType: 'high_score',
          severity: priorityLevel === 'critical' ? 'urgent' : 'high',
          message: `New ${priorityLevel} priority risk identified`,
          actionRequired: 'Review and create mitigation plan',
          assignedTo: [risk.owner],
          createdAt: now,
          acknowledged: false,
          resolved: false,
        });
      }

      return {
        ...risk,
        id: docRef.id,
        riskNumber,
        riskScore: score,
        priorityLevel,
        reviewHistory: [],
        statusHistory: riskData.statusHistory.map((s) => ({
          ...s,
          timestamp: s.timestamp.toDate(),
        })),
        createdAt: now,
        updatedAt: now,
      };
    } catch (error: any) {
      console.error('[RiskService] Error creating risk:', error);
      throw new Error(`Failed to create risk: ${error.message}`);
    }
  }

  /**
   * Generate unique risk number
   */
  private async generateRiskNumber(projectId: string): Promise<string> {
    const year = new Date().getFullYear();
    const q = query(
      collection(db, RISKS_COLLECTION),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const count = snapshot.size + 1;

    return `RISK-${year}-${String(count).padStart(3, '0')}`;
  }

  /**
   * Get risk by ID
   */
  async getRiskById(riskId: string): Promise<Risk | null> {
    try {
      const docRef = doc(db, RISKS_COLLECTION, riskId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return this.convertFirestoreToRisk(docSnap.id, data);
    } catch (error: any) {
      console.error('[RiskService] Error getting risk:', error);
      throw new Error(`Failed to get risk: ${error.message}`);
    }
  }

  /**
   * Get risks with filters
   */
  async getRisks(projectId: string, filters?: RiskFilterOptions): Promise<Risk[]> {
    try {
      const constraints: any[] = [where('projectId', '==', projectId)];

      if (filters?.category && filters.category.length > 0) {
        constraints.push(where('category', 'in', filters.category));
      }

      if (filters?.status && filters.status.length > 0) {
        constraints.push(where('status', 'in', filters.status));
      }

      if (filters?.priorityLevel && filters.priorityLevel.length > 0) {
        constraints.push(where('priorityLevel', 'in', filters.priorityLevel));
      }

      constraints.push(orderBy('riskScore', 'desc'));

      const q = query(collection(db, RISKS_COLLECTION), ...constraints);
      const querySnapshot = await getDocs(q);

      let risks = querySnapshot.docs.map((doc) => this.convertFirestoreToRisk(doc.id, doc.data()));

      // Client-side filters
      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        risks = risks.filter(
          (r) => r.title.toLowerCase().includes(term) || r.description.toLowerCase().includes(term)
        );
      }

      if (filters?.scoreRange) {
        risks = risks.filter(
          (r) => r.riskScore >= filters.scoreRange!.min && r.riskScore <= filters.scoreRange!.max
        );
      }

      return risks;
    } catch (error: any) {
      console.error('[RiskService] Error getting risks:', error);
      throw new Error(`Failed to get risks: ${error.message}`);
    }
  }

  /**
   * Update risk
   */
  async updateRisk(riskId: string, updates: Partial<Risk>, changedBy: string): Promise<void> {
    try {
      const docRef = doc(db, RISKS_COLLECTION, riskId);
      const current = await this.getRiskById(riskId);

      if (!current) {
        throw new Error('Risk not found');
      }

      const updateData: any = { ...updates };

      // Recalculate score if severity or probability changed
      if (updates.severity || updates.probability) {
        const severity = updates.severity || current.severity;
        const probability = updates.probability || current.probability;
        const { score, priorityLevel } = this.calculateRiskScore(severity, probability);

        updateData.riskScore = score;
        updateData.priorityLevel = priorityLevel;
      }

      // Track status change
      if (updates.status && updates.status !== current.status) {
        const statusChange = {
          timestamp: Timestamp.fromDate(new Date()),
          changedBy,
          previousStatus: current.status,
          newStatus: updates.status,
          reason: updateData.statusChangeReason || 'Status updated',
        };

        updateData.statusHistory = [...current.statusHistory, statusChange];
      }

      updateData.updatedAt = Timestamp.fromDate(new Date());
      delete updateData.id;
      delete updateData.createdAt;

      await updateDoc(docRef, updateData);
    } catch (error: any) {
      console.error('[RiskService] Error updating risk:', error);
      throw new Error(`Failed to update risk: ${error.message}`);
    }
  }

  /**
   * Delete risk
   */
  async deleteRisk(riskId: string): Promise<void> {
    try {
      const docRef = doc(db, RISKS_COLLECTION, riskId);
      await deleteDoc(docRef);
    } catch (error: any) {
      console.error('[RiskService] Error deleting risk:', error);
      throw new Error(`Failed to delete risk: ${error.message}`);
    }
  }

  /**
   * Create risk review
   */
  async createReview(riskId: string, review: Omit<RiskReview, 'id'>): Promise<void> {
    try {
      const risk = await this.getRiskById(riskId);
      if (!risk) {
        throw new Error('Risk not found');
      }

      const reviewData = {
        ...review,
        reviewDate: Timestamp.fromDate(review.reviewDate),
        nextReviewDate: Timestamp.fromDate(review.nextReviewDate),
        changes: review.changes.map((c) => ({
          ...c,
          oldValue: c.oldValue instanceof Date ? Timestamp.fromDate(c.oldValue) : c.oldValue,
          newValue: c.newValue instanceof Date ? Timestamp.fromDate(c.newValue) : c.newValue,
        })),
      };

      const docRef = doc(db, RISKS_COLLECTION, riskId);
      await updateDoc(docRef, {
        reviewHistory: [...risk.reviewHistory, { ...reviewData, id: Date.now().toString() }],
        lastReviewedAt: Timestamp.fromDate(review.reviewDate),
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error: any) {
      console.error('[RiskService] Error creating review:', error);
      throw new Error(`Failed to create review: ${error.message}`);
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(projectId: string): Promise<RiskDashboardStats> {
    try {
      const risks = await this.getRisks(projectId);

      const stats: RiskDashboardStats = {
        overview: {
          totalRisks: risks.length,
          activeRisks: risks.filter((r) =>
            ['identified', 'assessed', 'mitigating', 'monitoring'].includes(r.status)
          ).length,
          closedRisks: risks.filter((r) => r.status === 'closed').length,
          occurredRisks: risks.filter((r) => r.status === 'occurred').length,
        },
        distribution: {
          byPriority: {
            critical: risks.filter((r) => r.priorityLevel === 'critical').length,
            high: risks.filter((r) => r.priorityLevel === 'high').length,
            medium: risks.filter((r) => r.priorityLevel === 'medium').length,
            low: risks.filter((r) => r.priorityLevel === 'low').length,
          },
          byCategory: {} as any,
          byStatus: {} as any,
        },
        financial: {
          totalEstimatedImpact: risks.reduce((sum, r) => sum + r.estimatedImpact, 0),
          totalActualImpact: risks
            .filter((r) => r.occurred)
            .reduce((sum, r) => sum + (r.occurred?.actualCost || 0), 0),
          mitigationCosts: risks.reduce(
            (sum, r) => sum + (r.mitigationPlan?.estimatedCost || 0),
            0
          ),
          contingencyBudget: 0, // To be calculated from project budget
          contingencyUsed: 0,
        },
        performance: {
          risksIdentifiedThisMonth: 0, // Requires date filtering
          risksClosedThisMonth: 0,
          averageClosureTime: 0,
          mitigationSuccessRate: 0,
          overdueActions: 0,
        },
        alerts: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
      };

      return stats;
    } catch (error: any) {
      console.error('[RiskService] Error getting dashboard stats:', error);
      throw new Error(`Failed to get dashboard stats: ${error.message}`);
    }
  }

  /**
   * Create alert
   */
  private async createAlert(alert: Omit<RiskAlert, 'id'>): Promise<void> {
    try {
      const alertData = {
        ...alert,
        createdAt: Timestamp.fromDate(alert.createdAt),
        dueDate: alert.dueDate ? Timestamp.fromDate(alert.dueDate) : null,
      };

      await addDoc(collection(db, ALERTS_COLLECTION), alertData);
    } catch (error) {
      console.error('[RiskService] Error creating alert:', error);
      // Don't throw - alerts are non-critical
    }
  }

  /**
   * Convert Firestore data to Risk object
   */
  private convertFirestoreToRisk(id: string, data: any): Risk {
    return {
      id,
      ...data,
      identifiedDate: data.identifiedDate?.toDate(),
      assessmentDate: data.assessmentDate?.toDate(),
      targetCloseDate: data.targetCloseDate?.toDate(),
      actualCloseDate: data.actualCloseDate?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      lastReviewedAt: data.lastReviewedAt?.toDate(),
      statusHistory:
        data.statusHistory?.map((s: any) => ({
          ...s,
          timestamp: s.timestamp?.toDate(),
        })) || [],
      reviewHistory:
        data.reviewHistory?.map((r: any) => ({
          ...r,
          reviewDate: r.reviewDate?.toDate(),
          nextReviewDate: r.nextReviewDate?.toDate(),
        })) || [],
      occurred: data.occurred
        ? {
            ...data.occurred,
            date: data.occurred.date?.toDate(),
          }
        : undefined,
    } as Risk;
  }
}

export const riskService = new RiskService();
export default riskService;
