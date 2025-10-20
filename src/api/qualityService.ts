/**
 * Quality Management API Service
 * Priority 3D: Quality Management System
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
import { db } from '@/firebaseConfig';
import type {
  QualityInspection,
  Defect,
  QualityMetrics,
  CAPARecord,
  InspectionStatus,
  DefectStatus,
  QualityFilterOptions,
  DefectFilterOptions,
} from '@/types/quality.types';

const INSPECTIONS_COLLECTION = 'qualityInspections';
const DEFECTS_COLLECTION = 'defects';
const CAPA_COLLECTION = 'capaRecords';

class QualityService {
  private async generateInspectionNumber(projectId: string): Promise<string> {
    const year = new Date().getFullYear();
    const q = query(
      collection(db, INSPECTIONS_COLLECTION),
      where('projectId', '==', projectId)
    );
    const snapshot = await getDocs(q);
    return `QI-${year}-${String(snapshot.size + 1).padStart(3, '0')}`;
  }

  async createInspection(inspection: Omit<QualityInspection, 'id' | 'inspectionNumber' | 'createdAt' | 'updatedAt'>): Promise<QualityInspection> {
    try {
      const now = new Date();
      const inspectionNumber = await this.generateInspectionNumber(inspection.projectId);

      // Calculate pass rate
      const totalItems = inspection.checklist.length;
      const passedItems = inspection.checklist.filter(item => item.result === 'pass').length;
      const failedItems = inspection.checklist.filter(item => item.result === 'fail').length;
      const conditionalItems = inspection.checklist.filter(item => item.result === 'conditional').length;
      const passRate = totalItems > 0 ? (passedItems / totalItems) * 100 : 0;

      const inspectionData = {
        ...inspection,
        inspectionNumber,
        passedItems,
        failedItems,
        conditionalItems,
        totalItems,
        passRate,
        scheduledDate: Timestamp.fromDate(inspection.scheduledDate),
        actualDate: inspection.actualDate ? Timestamp.fromDate(inspection.actualDate) : null,
        completedDate: inspection.completedDate ? Timestamp.fromDate(inspection.completedDate) : null,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      const docRef = await addDoc(collection(db, INSPECTIONS_COLLECTION), inspectionData);

      return {
        ...inspection,
        id: docRef.id,
        inspectionNumber,
        passedItems,
        failedItems,
        conditionalItems,
        totalItems,
        passRate,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error('[QualityService] Error creating inspection:', error);
      throw new Error(`Failed to create inspection: ${error.message}`);
    }
  }

  async getInspectionById(inspectionId: string): Promise<QualityInspection | null> {
    try {
      const docRef = doc(db, INSPECTIONS_COLLECTION, inspectionId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        scheduledDate: data.scheduledDate?.toDate(),
        actualDate: data.actualDate?.toDate(),
        completedDate: data.completedDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as QualityInspection;
    } catch (error) {
      console.error('[QualityService] Error getting inspection:', error);
      throw new Error(`Failed to get inspection: ${error.message}`);
    }
  }

  async getInspections(projectId: string, filters?: QualityFilterOptions): Promise<QualityInspection[]> {
    try {
      let constraints: any[] = [where('projectId', '==', projectId)];

      if (filters?.inspectionType && filters.inspectionType.length > 0) {
        constraints.push(where('inspectionType', 'in', filters.inspectionType));
      }

      if (filters?.status && filters.status.length > 0) {
        constraints.push(where('status', 'in', filters.status));
      }

      constraints.push(orderBy('scheduledDate', 'desc'));

      const q = query(collection(db, INSPECTIONS_COLLECTION), ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          scheduledDate: data.scheduledDate?.toDate(),
          actualDate: data.actualDate?.toDate(),
          completedDate: data.completedDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as QualityInspection;
      });
    } catch (error) {
      console.error('[QualityService] Error getting inspections:', error);
      throw new Error(`Failed to get inspections: ${error.message}`);
    }
  }

  async createDefect(defect: Omit<Defect, 'id' | 'defectNumber' | 'createdAt' | 'updatedAt'>): Promise<Defect> {
    try {
      const year = new Date().getFullYear();
      const q = query(collection(db, DEFECTS_COLLECTION), where('projectId', '==', defect.projectId));
      const snapshot = await getDocs(q);
      const defectNumber = `DEF-${year}-${String(snapshot.size + 1).padStart(3, '0')}`;

      const now = new Date();
      const defectData = {
        ...defect,
        defectNumber,
        identifiedDate: Timestamp.fromDate(defect.identifiedDate),
        dueDate: defect.dueDate ? Timestamp.fromDate(defect.dueDate) : null,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      const docRef = await addDoc(collection(db, DEFECTS_COLLECTION), defectData);

      return {
        ...defect,
        id: docRef.id,
        defectNumber,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error('[QualityService] Error creating defect:', error);
      throw new Error(`Failed to create defect: ${error.message}`);
    }
  }

  async getDefects(projectId: string, filters?: DefectFilterOptions): Promise<Defect[]> {
    try {
      let constraints: any[] = [where('projectId', '==', projectId)];

      if (filters?.severity && filters.severity.length > 0) {
        constraints.push(where('severity', 'in', filters.severity));
      }

      if (filters?.status && filters.status.length > 0) {
        constraints.push(where('status', 'in', filters.status));
      }

      constraints.push(orderBy('identifiedDate', 'desc'));

      const q = query(collection(db, DEFECTS_COLLECTION), ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          identifiedDate: data.identifiedDate?.toDate(),
          dueDate: data.dueDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          closedAt: data.closedAt?.toDate(),
          resolution: data.resolution ? {
            ...data.resolution,
            resolvedDate: data.resolution.resolvedDate?.toDate(),
          } : undefined,
          verification: data.verification ? {
            ...data.verification,
            verifiedDate: data.verification.verifiedDate?.toDate(),
          } : undefined,
        } as Defect;
      });
    } catch (error) {
      console.error('[QualityService] Error getting defects:', error);
      throw new Error(`Failed to get defects: ${error.message}`);
    }
  }

  async updateDefect(defectId: string, updates: Partial<Defect>): Promise<void> {
    try {
      const docRef = doc(db, DEFECTS_COLLECTION, defectId);
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      };

      delete updateData.id;
      delete updateData.createdAt;

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('[QualityService] Error updating defect:', error);
      throw new Error(`Failed to update defect: ${error.message}`);
    }
  }

  async getQualityMetrics(projectId: string, periodStart: Date, periodEnd: Date): Promise<QualityMetrics> {
    try {
      const inspections = await this.getInspections(projectId);
      const defects = await this.getDefects(projectId);

      const periodInspections = inspections.filter(i =>
        i.scheduledDate >= periodStart && i.scheduledDate <= periodEnd
      );

      const periodDefects = defects.filter(d =>
        d.identifiedDate >= periodStart && d.identifiedDate <= periodEnd
      );

      const completedInspections = periodInspections.filter(i => i.status === 'completed');
      const passedInspections = completedInspections.filter(i => i.overallResult === 'pass');

      const metrics: QualityMetrics = {
        projectId,
        period: { start: periodStart, end: periodEnd },
        inspections: {
          total: periodInspections.length,
          completed: completedInspections.length,
          passed: passedInspections.length,
          failed: completedInspections.filter(i => i.overallResult === 'fail').length,
          passRate: completedInspections.length > 0 
            ? (passedInspections.length / completedInspections.length) * 100 
            : 0,
        },
        defects: {
          total: periodDefects.length,
          open: periodDefects.filter(d => d.status === 'open').length,
          closed: periodDefects.filter(d => d.status === 'closed').length,
          bySeverity: {
            critical: periodDefects.filter(d => d.severity === 'critical').length,
            major: periodDefects.filter(d => d.severity === 'major').length,
            minor: periodDefects.filter(d => d.severity === 'minor').length,
            cosmetic: periodDefects.filter(d => d.severity === 'cosmetic').length,
          },
          byCategory: {},
        },
        quality: {
          firstTimePassRate: completedInspections.length > 0
            ? (passedInspections.length / completedInspections.length) * 100
            : 0,
          defectRate: completedInspections.length > 0
            ? periodDefects.length / completedInspections.length
            : 0,
          averageClosureTime: 0,
          reworkCost: periodDefects.reduce((sum, d) => sum + (d.costImpact || 0), 0),
          reworkHours: periodDefects.reduce((sum, d) => sum + (d.resolution?.reworkHours || 0), 0),
        },
        compliance: {
          inspectionsOnTime: 0,
          inspectionsDelayed: 0,
          complianceScore: 0,
        },
        trends: {
          improving: false,
          defectTrend: 'stable',
          qualityTrend: 'stable',
        },
      };

      return metrics;
    } catch (error) {
      console.error('[QualityService] Error getting quality metrics:', error);
      throw new Error(`Failed to get quality metrics: ${error.message}`);
    }
  }
}

export const qualityService = new QualityService();
export default qualityService;
