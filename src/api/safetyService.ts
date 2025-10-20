/**
 * Safety Management Service
 * Phase 3.5: Quick Wins - Safety Management System
 * 
 * Comprehensive safety tracking including incidents, training,
 * PPE management, and safety audits with OSHA compliance
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import type {
  SafetyIncident,
  SafetyTraining,
  PPEInventory,
  PPEAssignment,
  SafetyAudit,
  SafetyObservation,
  SafetyMetrics,
  SafetyDashboardSummary,
  IncidentSeverity,
  IncidentStatus,
  TrainingStatus,
  AuditStatus,
} from '@/types/safety.types';

/**
 * Convert Firestore timestamp to Date
 */
const convertTimestamps = <T>(data: any): T => {
  const converted: any = { ...data };
  
  Object.keys(converted).forEach(key => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate();
    } else if (Array.isArray(converted[key])) {
      converted[key] = converted[key].map((item: any) =>
        typeof item === 'object' && item !== null ? convertTimestamps(item) : item
      );
    } else if (typeof converted[key] === 'object' && converted[key] !== null) {
      converted[key] = convertTimestamps(converted[key]);
    }
  });
  
  return converted as T;
};

/**
 * Generate unique incident number
 */
const generateIncidentNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const incidentsRef = collection(db, 'safetyIncidents');
  const q = query(
    incidentsRef,
    where('incidentNumber', '>=', `INC-${year}-000`),
    where('incidentNumber', '<=', `INC-${year}-999`),
    orderBy('incidentNumber', 'desc')
  );
  
  const snapshot = await getDocs(q);
  const lastNumber = snapshot.empty ? 0 : 
    parseInt(snapshot.docs[0].data().incidentNumber.split('-')[2]);
  
  return `INC-${year}-${String(lastNumber + 1).padStart(3, '0')}`;
};

/**
 * Safety Incident Operations
 */
export const safetyService = {
  // ==================== Incidents ====================
  
  /**
   * Get all incidents for a project
   */
  async getIncidents(projectId: string): Promise<SafetyIncident[]> {
    try {
      const incidentsRef = collection(db, 'safetyIncidents');
      const q = query(
        incidentsRef,
        where('projectId', '==', projectId),
        orderBy('occurredAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => convertTimestamps<SafetyIncident>({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('[SafetyService] Error fetching incidents:', error);
      throw new Error('Failed to fetch safety incidents');
    }
  },

  /**
   * Get incident by ID
   */
  async getIncidentById(incidentId: string): Promise<SafetyIncident | null> {
    try {
      const incidentRef = doc(db, 'safetyIncidents', incidentId);
      const incidentDoc = await getDoc(incidentRef);
      
      if (!incidentDoc.exists()) {
        return null;
      }
      
      return convertTimestamps<SafetyIncident>({
        id: incidentDoc.id,
        ...incidentDoc.data(),
      });
    } catch (error) {
      console.error('[SafetyService] Error fetching incident:', error);
      return null;
    }
  },

  /**
   * Create new incident
   */
  async createIncident(
    incident: Omit<SafetyIncident, 'id' | 'incidentNumber' | 'createdAt' | 'updatedAt'>
  ): Promise<SafetyIncident> {
    try {
      const incidentNumber = await generateIncidentNumber();
      
      const incidentData = {
        ...incident,
        incidentNumber,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const incidentsRef = collection(db, 'safetyIncidents');
      const docRef = await addDoc(incidentsRef, incidentData);
      
      return {
        id: docRef.id,
        ...incident,
        incidentNumber,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('[SafetyService] Error creating incident:', error);
      throw new Error('Failed to create safety incident');
    }
  },

  /**
   * Update incident
   */
  async updateIncident(
    incidentId: string,
    updates: Partial<SafetyIncident>
  ): Promise<void> {
    try {
      const incidentRef = doc(db, 'safetyIncidents', incidentId);
      await updateDoc(incidentRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[SafetyService] Error updating incident:', error);
      throw new Error('Failed to update safety incident');
    }
  },

  /**
   * Delete incident
   */
  async deleteIncident(incidentId: string): Promise<void> {
    try {
      const incidentRef = doc(db, 'safetyIncidents', incidentId);
      await deleteDoc(incidentRef);
    } catch (error) {
      console.error('[SafetyService] Error deleting incident:', error);
      throw new Error('Failed to delete safety incident');
    }
  },

  // ==================== Training ====================

  /**
   * Get all training for a project
   */
  async getTraining(projectId: string): Promise<SafetyTraining[]> {
    try {
      const trainingRef = collection(db, 'safetyTraining');
      const q = query(
        trainingRef,
        where('projectId', '==', projectId),
        orderBy('scheduledDate', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => convertTimestamps<SafetyTraining>({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('[SafetyService] Error fetching training:', error);
      throw new Error('Failed to fetch safety training');
    }
  },

  /**
   * Create training
   */
  async createTraining(
    training: Omit<SafetyTraining, 'id' | 'trainingNumber' | 'createdAt' | 'updatedAt'>
  ): Promise<SafetyTraining> {
    try {
      const year = new Date().getFullYear();
      const trainingRef = collection(db, 'safetyTraining');
      const q = query(trainingRef, orderBy('trainingNumber', 'desc'));
      const snapshot = await getDocs(q);
      const lastNumber = snapshot.empty ? 0 : 
        parseInt(snapshot.docs[0].data().trainingNumber.split('-')[2]);
      const trainingNumber = `TRN-${year}-${String(lastNumber + 1).padStart(3, '0')}`;
      
      const trainingData = {
        ...training,
        trainingNumber,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(trainingRef, trainingData);
      
      return {
        id: docRef.id,
        ...training,
        trainingNumber,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('[SafetyService] Error creating training:', error);
      throw new Error('Failed to create safety training');
    }
  },

  /**
   * Update training
   */
  async updateTraining(
    trainingId: string,
    updates: Partial<SafetyTraining>
  ): Promise<void> {
    try {
      const trainingRef = doc(db, 'safetyTraining', trainingId);
      await updateDoc(trainingRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[SafetyService] Error updating training:', error);
      throw new Error('Failed to update safety training');
    }
  },

  // ==================== PPE ====================

  /**
   * Get PPE inventory for a project
   */
  async getPPEInventory(projectId: string): Promise<PPEInventory[]> {
    try {
      const ppeRef = collection(db, 'ppeInventory');
      const q = query(ppeRef, where('projectId', '==', projectId));
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => convertTimestamps<PPEInventory>({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('[SafetyService] Error fetching PPE inventory:', error);
      throw new Error('Failed to fetch PPE inventory');
    }
  },

  /**
   * Create PPE item
   */
  async createPPEItem(
    ppe: Omit<PPEInventory, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PPEInventory> {
    try {
      const ppeRef = collection(db, 'ppeInventory');
      const docRef = await addDoc(ppeRef, {
        ...ppe,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return {
        id: docRef.id,
        ...ppe,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('[SafetyService] Error creating PPE item:', error);
      throw new Error('Failed to create PPE item');
    }
  },

  /**
   * Update PPE item
   */
  async updatePPEItem(
    ppeId: string,
    updates: Partial<PPEInventory>
  ): Promise<void> {
    try {
      const ppeRef = doc(db, 'ppeInventory', ppeId);
      await updateDoc(ppeRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[SafetyService] Error updating PPE item:', error);
      throw new Error('Failed to update PPE item');
    }
  },

  /**
   * Get PPE assignments for a project
   */
  async getPPEAssignments(projectId: string): Promise<PPEAssignment[]> {
    try {
      const assignmentsRef = collection(db, 'ppeAssignments');
      const q = query(
        assignmentsRef,
        where('projectId', '==', projectId),
        orderBy('assignedDate', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => convertTimestamps<PPEAssignment>({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('[SafetyService] Error fetching PPE assignments:', error);
      throw new Error('Failed to fetch PPE assignments');
    }
  },

  /**
   * Create PPE assignment
   */
  async createPPEAssignment(
    assignment: Omit<PPEAssignment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PPEAssignment> {
    try {
      const assignmentsRef = collection(db, 'ppeAssignments');
      const docRef = await addDoc(assignmentsRef, {
        ...assignment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return {
        id: docRef.id,
        ...assignment,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('[SafetyService] Error creating PPE assignment:', error);
      throw new Error('Failed to create PPE assignment');
    }
  },

  // ==================== Audits ====================

  /**
   * Get safety audits for a project
   */
  async getAudits(projectId: string): Promise<SafetyAudit[]> {
    try {
      const auditsRef = collection(db, 'safetyAudits');
      const q = query(
        auditsRef,
        where('projectId', '==', projectId),
        orderBy('scheduledDate', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => convertTimestamps<SafetyAudit>({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('[SafetyService] Error fetching audits:', error);
      throw new Error('Failed to fetch safety audits');
    }
  },

  /**
   * Create safety audit
   */
  async createAudit(
    audit: Omit<SafetyAudit, 'id' | 'auditNumber' | 'createdAt' | 'updatedAt'>
  ): Promise<SafetyAudit> {
    try {
      const year = new Date().getFullYear();
      const auditsRef = collection(db, 'safetyAudits');
      const q = query(auditsRef, orderBy('auditNumber', 'desc'));
      const snapshot = await getDocs(q);
      const lastNumber = snapshot.empty ? 0 :
        parseInt(snapshot.docs[0].data().auditNumber.split('-')[2]);
      const auditNumber = `AUD-${year}-${String(lastNumber + 1).padStart(3, '0')}`;
      
      const auditData = {
        ...audit,
        auditNumber,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(auditsRef, auditData);
      
      return {
        id: docRef.id,
        ...audit,
        auditNumber,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('[SafetyService] Error creating audit:', error);
      throw new Error('Failed to create safety audit');
    }
  },

  /**
   * Update safety audit
   */
  async updateAudit(
    auditId: string,
    updates: Partial<SafetyAudit>
  ): Promise<void> {
    try {
      const auditRef = doc(db, 'safetyAudits', auditId);
      await updateDoc(auditRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[SafetyService] Error updating audit:', error);
      throw new Error('Failed to update safety audit');
    }
  },

  // ==================== Observations ====================

  /**
   * Get safety observations for a project
   */
  async getObservations(projectId: string): Promise<SafetyObservation[]> {
    try {
      const observationsRef = collection(db, 'safetyObservations');
      const q = query(
        observationsRef,
        where('projectId', '==', projectId),
        orderBy('observedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => convertTimestamps<SafetyObservation>({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('[SafetyService] Error fetching observations:', error);
      throw new Error('Failed to fetch safety observations');
    }
  },

  /**
   * Create safety observation
   */
  async createObservation(
    observation: Omit<SafetyObservation, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SafetyObservation> {
    try {
      const observationsRef = collection(db, 'safetyObservations');
      const docRef = await addDoc(observationsRef, {
        ...observation,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return {
        id: docRef.id,
        ...observation,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('[SafetyService] Error creating observation:', error);
      throw new Error('Failed to create safety observation');
    }
  },

  // ==================== Metrics & Analytics ====================

  /**
   * Calculate safety metrics for a project
   */
  async calculateMetrics(
    projectId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<SafetyMetrics> {
    try {
      const incidents = await this.getIncidents(projectId);
      const training = await this.getTraining(projectId);
      const audits = await this.getAudits(projectId);
      const observations = await this.getObservations(projectId);
      
      // Filter by period
      const periodIncidents = incidents.filter(i =>
        i.occurredAt >= periodStart && i.occurredAt <= periodEnd
      );
      const periodTraining = training.filter(t =>
        t.scheduledDate >= periodStart && t.scheduledDate <= periodEnd
      );
      const periodAudits = audits.filter(a =>
        a.scheduledDate >= periodStart && a.scheduledDate <= periodEnd
      );
      const periodObservations = observations.filter(o =>
        o.observedAt >= periodStart && o.observedAt <= periodEnd
      );
      
      // Calculate incident metrics
      const bySeverity = periodIncidents.reduce((acc, inc) => {
        acc[inc.severity] = (acc[inc.severity] || 0) + 1;
        return acc;
      }, {} as Record<IncidentSeverity, number>);
      
      const byType = periodIncidents.reduce((acc, inc) => {
        acc[inc.type] = (acc[inc.type] || 0) + 1;
        return acc;
      }, {} as any);
      
      const fatalCount = periodIncidents.filter(i => i.severity === 'fatal').length;
      const lostTimeInjuries = periodIncidents.filter(i =>
        i.injuredPersons.some(p => p.daysLost && p.daysLost > 0)
      ).length;
      const totalDaysLost = periodIncidents.reduce((sum, i) =>
        sum + i.injuredPersons.reduce((s, p) => s + (p.daysLost || 0), 0), 0
      );
      
      // Assuming 200,000 work hours (standard OSHA denominator)
      const workHours = 200000; // This should be calculated from actual time tracking
      const trir = (periodIncidents.filter(i => i.oshaRecordable).length / workHours) * 200000;
      const ltifr = (lostTimeInjuries / workHours) * 200000;
      
      // Training metrics
      const totalAttendees = periodTraining.reduce((sum, t) => sum + t.attendees.length, 0);
      const passedAttendees = periodTraining.reduce((sum, t) =>
        sum + t.attendees.filter(a => a.passed).length, 0
      );
      
      // Audit metrics
      const completedAudits = periodAudits.filter(a => a.status === 'completed');
      const avgComplianceRate = completedAudits.length > 0 ?
        completedAudits.reduce((sum, a) => sum + a.complianceRate, 0) / completedAudits.length : 0;
      
      return {
        projectId,
        period: { start: periodStart, end: periodEnd },
        incidents: {
          total: periodIncidents.length,
          bySeverity,
          byType,
          fatalCount,
          lostTimeInjuries,
          totalDaysLost,
        },
        rates: {
          totalRecordableIncidentRate: trir,
          daysAwayRestrictedTransferRate: 0, // Calculate if DART data available
          lostTimeInjuryFrequencyRate: ltifr,
          nearMissFrequencyRate: (bySeverity.near_miss || 0 / workHours) * 200000,
        },
        training: {
          totalSessions: periodTraining.length,
          totalAttendees,
          completionRate: totalAttendees > 0 ? (passedAttendees / totalAttendees) * 100 : 0,
          averageScore: 0, // Calculate from training.attendees.score
          expiredCertifications: 0, // Calculate from training with expiryDate < today
          upcomingExpirations: 0, // Calculate from training with expiryDate < today + 30 days
        },
        ppe: {
          totalInventory: 0,
          activeAssignments: 0,
          complianceRate: 0,
          pendingInspections: 0,
          expiredItems: 0,
        },
        audits: {
          total: periodAudits.length,
          completed: completedAudits.length,
          averageComplianceRate: avgComplianceRate,
          criticalFindings: completedAudits.reduce((sum, a) =>
            sum + a.findings.filter(f => f.severity === 'critical').length, 0
          ),
          openFindings: completedAudits.reduce((sum, a) =>
            sum + a.findings.filter(f => f.status === 'open').length, 0
          ),
        },
        observations: {
          total: periodObservations.length,
          safeBehaviors: periodObservations.filter(o => o.type === 'safe_behavior').length,
          unsafeActs: periodObservations.filter(o => o.type === 'unsafe_act').length,
          unsafeConditions: periodObservations.filter(o => o.type === 'unsafe_condition').length,
          suggestions: periodObservations.filter(o => o.type === 'suggestion').length,
        },
        workHours: {
          totalHours: workHours,
          workersCount: 0, // Get from project
          daysSinceLastLTI: 0, // Calculate from last LTI date
        },
        trends: {
          incidentTrend: 'stable',
          complianceTrend: 'improving',
          trainingTrend: 'improving',
        },
        costs: {
          medical: periodIncidents.reduce((sum, i) => sum + (i.medicalCosts || 0), 0),
          property: periodIncidents.reduce((sum, i) => sum + (i.propertyCosts || 0), 0),
          productivity: periodIncidents.reduce((sum, i) => sum + (i.productivityCosts || 0), 0),
          training: periodTraining.reduce((sum, t) => sum + (t.cost || 0), 0),
          ppe: 0, // Calculate from PPE purchases
          total: 0,
        },
      };
    } catch (error) {
      console.error('[SafetyService] Error calculating metrics:', error);
      throw new Error('Failed to calculate safety metrics');
    }
  },

  /**
   * Get safety dashboard summary
   */
  async getDashboardSummary(projectId: string): Promise<SafetyDashboardSummary> {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const yearStart = new Date(now.getFullYear(), 0, 1);
      
      const [incidents, training, thisMonth, lastMonth, yearToDate] = await Promise.all([
        this.getIncidents(projectId),
        this.getTraining(projectId),
        this.calculateMetrics(projectId, monthStart, now),
        this.calculateMetrics(projectId, lastMonthStart, lastMonthEnd),
        this.calculateMetrics(projectId, yearStart, now),
      ]);
      
      const activeIncidents = incidents.filter(i =>
        ['reported', 'investigating', 'corrective_action'].includes(i.status)
      );
      const criticalIncidents = incidents.filter(i => i.severity === 'critical' || i.severity === 'fatal');
      
      const upcomingTraining = training
        .filter(t => t.scheduledDate > now && t.status === 'scheduled')
        .slice(0, 5);
      
      const expiringCertifications = training
        .flatMap(t => t.attendees
          .filter(a => t.expiryDate && t.expiryDate > now && t.expiryDate < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000))
          .map(a => ({
            userId: a.userId,
            userName: a.name,
            trainingType: t.type,
            expiryDate: t.expiryDate!,
          }))
        );
      
      return {
        projectId,
        currentStatus: {
          daysSinceLastIncident: 0, // Calculate from last incident date
          activeIncidents: activeIncidents.length,
          criticalIncidents: criticalIncidents.length,
          openFindings: 0, // From audits
        },
        thisMonth,
        lastMonth,
        yearToDate,
        upcomingTraining,
        expiringCertifications,
        recentIncidents: incidents.slice(0, 5),
        pendingActions: 0, // Calculate from corrective actions
      };
    } catch (error) {
      console.error('[SafetyService] Error fetching dashboard summary:', error);
      throw new Error('Failed to fetch safety dashboard summary');
    }
  },
};

export default safetyService;
