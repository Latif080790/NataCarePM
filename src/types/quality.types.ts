/**
 * Quality Management Type Definitions
 * Priority 3D: Quality Management System
 */

export type InspectionType =
  | 'pre_construction'
  | 'foundation'
  | 'structural'
  | 'finishing'
  | 'mep' // Mechanical, Electrical, Plumbing
  | 'safety'
  | 'final'
  | 'custom';

export type InspectionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'failed';

export type InspectionResult = 'pass' | 'fail' | 'conditional' | 'na';

export type DefectSeverity = 'critical' | 'major' | 'minor' | 'cosmetic';

export type DefectStatus = 'open' | 'in_progress' | 'resolved' | 'verified' | 'closed' | 'rejected';

export interface ChecklistItem {
  id: string;
  itemNumber: string;
  description: string;
  specification?: string;
  acceptanceCriteria: string;
  result: InspectionResult;
  notes?: string;
  photos?: string[];
  measuredValue?: number;
  requiredValue?: number;
  unit?: string;
}

export interface InspectionPhoto {
  id: string;
  url: string;
  caption?: string;
  location?: string;
  annotations?: {
    type: 'arrow' | 'circle' | 'text' | 'rectangle';
    coordinates: number[];
    color: string;
    text?: string;
  }[];
  uploadedAt: Date;
}

export interface QualityInspection {
  id: string;
  projectId: string;
  inspectionNumber: string; // e.g., "QI-2024-001"

  inspectionType: InspectionType;
  title: string;
  description?: string;

  scheduledDate: Date;
  actualDate?: Date;
  completedDate?: Date;

  inspector: string;
  inspectorSignature?: string;

  location: string;
  workPackageId?: string;
  contractorId?: string;

  checklist: ChecklistItem[];
  photos: InspectionPhoto[];

  overallResult: InspectionResult;
  passedItems: number;
  failedItems: number;
  conditionalItems: number;
  totalItems: number;
  passRate: number; // percentage

  defectsFound: string[]; // defect IDs

  notes: string;
  recommendations?: string;

  status: InspectionStatus;

  reviewedBy?: string;
  reviewedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface Defect {
  id: string;
  defectNumber: string; // e.g., "DEF-2024-001"

  inspectionId?: string;
  projectId: string;

  title: string;
  description: string;
  severity: DefectSeverity;

  category: 'workmanship' | 'material' | 'design' | 'specification' | 'safety' | 'other';

  location: string;
  workPackageId?: string;
  contractorId?: string;

  photos: string[];
  videoUrls?: string[];

  identifiedBy: string;
  identifiedDate: Date;

  rootCause?: string;
  correctiveAction: string;
  preventiveAction?: string;

  assignedTo?: string;
  dueDate?: Date;

  status: DefectStatus;

  resolution?: {
    description: string;
    resolvedBy: string;
    resolvedDate: Date;
    photos?: string[];
    cost?: number;
    reworkHours?: number;
  };

  verification?: {
    verifiedBy: string;
    verifiedDate: Date;
    approved: boolean;
    comments?: string;
  };

  costImpact?: number;
  scheduleImpact?: number; // days

  relatedDefects?: string[];

  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export interface QualityStandard {
  id: string;
  name: string;
  code: string; // e.g., "ISO 9001", "ACI 301"
  version?: string;
  description: string;
  applicableTo: string[]; // project types, work packages
  requirements: {
    id: string;
    requirement: string;
    testMethod?: string;
    acceptanceCriteria: string;
  }[];
  isActive: boolean;
}

export interface QualityMetrics {
  projectId: string;
  period: {
    start: Date;
    end: Date;
  };

  inspections: {
    total: number;
    completed: number;
    passed: number;
    failed: number;
    passRate: number;
  };

  defects: {
    total: number;
    open: number;
    closed: number;
    bySeverity: Record<DefectSeverity, number>;
    byCategory: Record<string, number>;
  };

  quality: {
    firstTimePassRate: number;
    defectRate: number; // defects per inspection
    averageClosureTime: number; // days
    reworkCost: number;
    reworkHours: number;
  };

  compliance: {
    inspectionsOnTime: number;
    inspectionsDelayed: number;
    complianceScore: number; // percentage
  };

  trends: {
    improving: boolean;
    defectTrend: 'increasing' | 'decreasing' | 'stable';
    qualityTrend: 'improving' | 'declining' | 'stable';
  };
}

export interface CAPARecord {
  // Corrective and Preventive Action
  id: string;
  projectId: string;

  type: 'corrective' | 'preventive';

  issue: string;
  defectId?: string;

  rootCause: string;
  analysis: string;

  action: string;
  responsibility: string;
  targetDate: Date;

  status: 'planned' | 'in_progress' | 'completed' | 'verified' | 'ineffective';

  implementation?: {
    completedDate: Date;
    completedBy: string;
    evidence?: string[];
  };

  verification?: {
    verifiedDate: Date;
    verifiedBy: string;
    effective: boolean;
    comments?: string;
  };

  createdAt: Date;
}

export interface QualityFilterOptions {
  inspectionType?: InspectionType[];
  status?: InspectionStatus[];
  result?: InspectionResult[];
  inspector?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  location?: string[];
  searchTerm?: string;
}

export interface DefectFilterOptions {
  severity?: DefectSeverity[];
  status?: DefectStatus[];
  category?: string[];
  assignedTo?: string[];
  dateRange?: {
    field: 'identified' | 'due' | 'resolved';
    start: Date;
    end: Date;
  };
  searchTerm?: string;
}

export default QualityInspection;
