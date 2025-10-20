/**
 * Safety Management Type Definitions
 * Phase 3.5: Quick Wins - Safety Management System
 * 
 * Comprehensive safety tracking including incidents, training,
 * PPE management, and safety audits
 */

export type IncidentSeverity = 'fatal' | 'critical' | 'major' | 'minor' | 'near_miss';
export type IncidentStatus = 'reported' | 'investigating' | 'corrective_action' | 'closed' | 'reopened';
export type IncidentType = 
  | 'fall'
  | 'struck_by'
  | 'caught_in_between'
  | 'electrical'
  | 'chemical'
  | 'fire'
  | 'equipment'
  | 'environmental'
  | 'ergonomic'
  | 'other';

export type TrainingStatus = 'scheduled' | 'in_progress' | 'completed' | 'expired' | 'cancelled';
export type TrainingType = 
  | 'safety_orientation'
  | 'fall_protection'
  | 'confined_space'
  | 'hot_work'
  | 'scaffolding'
  | 'crane_operation'
  | 'excavation'
  | 'hazmat'
  | 'first_aid'
  | 'fire_safety'
  | 'ppe_usage'
  | 'custom';

export type PPEType = 
  | 'hard_hat'
  | 'safety_glasses'
  | 'gloves'
  | 'safety_boots'
  | 'high_vis_vest'
  | 'respirator'
  | 'fall_harness'
  | 'hearing_protection'
  | 'face_shield';

export type AuditStatus = 'scheduled' | 'in_progress' | 'completed' | 'follow_up_required';
export type AuditType = 'routine' | 'spot_check' | 'incident_investigation' | 'regulatory';

/**
 * Safety Incident Record
 */
export interface SafetyIncident {
  id: string;
  incidentNumber: string; // e.g., "INC-2024-001"
  projectId: string;
  
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  
  title: string;
  description: string;
  location: string;
  
  occurredAt: Date;
  reportedAt: Date;
  reportedBy: string;
  
  // People involved
  injuredPersons: {
    id: string;
    name: string;
    role: string;
    injuryType: string;
    injurySeverity: 'fatal' | 'major' | 'minor' | 'none';
    medicalTreatment?: string;
    hospitalName?: string;
    daysLost?: number;
  }[];
  
  witnesses?: {
    id: string;
    name: string;
    role: string;
    statement?: string;
  }[];
  
  // Investigation
  investigationLead?: string;
  investigationStarted?: Date;
  investigationCompleted?: Date;
  
  rootCause?: string;
  contributingFactors?: string[];
  
  // Evidence
  photos: string[];
  documents: string[];
  videoUrls?: string[];
  
  // Corrective Actions
  correctiveActions: {
    id: string;
    action: string;
    responsibility: string;
    targetDate: Date;
    completedDate?: Date;
    status: 'pending' | 'in_progress' | 'completed';
  }[];
  
  // Regulatory
  oshaRecordable: boolean;
  oshaClassification?: string;
  authoritiesNotified: boolean;
  regulatoryReportNumber?: string;
  
  // Costs
  medicalCosts?: number;
  propertyCosts?: number;
  productivityCosts?: number;
  totalCost?: number;
  
  closedAt?: Date;
  closedBy?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Safety Training Record
 */
export interface SafetyTraining {
  id: string;
  trainingNumber: string; // e.g., "TRN-2024-001"
  projectId: string;
  
  type: TrainingType;
  title: string;
  description?: string;
  
  instructor: string;
  duration: number; // hours
  
  scheduledDate: Date;
  completedDate?: Date;
  expiryDate?: Date; // for certifications
  
  status: TrainingStatus;
  
  // Attendees
  attendees: {
    userId: string;
    name: string;
    role: string;
    attended: boolean;
    score?: number;
    passed?: boolean;
    certificateIssued?: boolean;
    certificateNumber?: string;
  }[];
  
  // Content
  topics: string[];
  materials: string[]; // document URLs
  
  // Assessment
  assessmentRequired: boolean;
  passingScore?: number;
  
  // Compliance
  regulatoryRequirement?: string;
  complianceStandard?: string; // e.g., "OSHA 1926.503"
  
  location: string;
  maxAttendees?: number;
  
  cost?: number;
  
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * PPE (Personal Protective Equipment) Inventory
 */
export interface PPEInventory {
  id: string;
  projectId: string;
  
  type: PPEType;
  brand: string;
  model: string;
  
  description: string;
  
  // Inventory
  totalQuantity: number;
  availableQuantity: number;
  assignedQuantity: number;
  damagedQuantity: number;
  
  // Specifications
  size?: string;
  specifications: Record<string, string>;
  certifications: string[]; // e.g., ["ANSI Z87.1", "CSA Z94.3"]
  
  // Lifecycle
  purchaseDate?: Date;
  expiryDate?: Date;
  inspectionInterval: number; // days
  lastInspection?: Date;
  nextInspection?: Date;
  
  // Cost
  unitCost: number;
  totalValue: number;
  
  // Storage
  storageLocation: string;
  reorderLevel: number;
  reorderQuantity: number;
  
  supplierId?: string;
  supplierName?: string;
  
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * PPE Assignment Record
 */
export interface PPEAssignment {
  id: string;
  projectId: string;
  
  ppeItemId: string;
  ppeType: PPEType;
  
  userId: string;
  userName: string;
  
  assignedDate: Date;
  expectedReturnDate?: Date;
  returnedDate?: Date;
  
  quantity: number;
  
  condition: 'new' | 'good' | 'fair' | 'damaged';
  conditionNotes?: string;
  
  serialNumbers?: string[];
  
  assignedBy: string;
  receivedBy?: string;
  
  status: 'active' | 'returned' | 'lost' | 'damaged';
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Safety Audit Record
 */
export interface SafetyAudit {
  id: string;
  auditNumber: string; // e.g., "AUD-2024-001"
  projectId: string;
  
  type: AuditType;
  status: AuditStatus;
  
  title: string;
  description?: string;
  
  scheduledDate: Date;
  conductedDate?: Date;
  
  auditor: string;
  auditorCertification?: string;
  
  location: string;
  scope: string[];
  
  // Checklist
  checklist: {
    id: string;
    category: string;
    item: string;
    requirement: string;
    compliant: boolean;
    evidence?: string;
    photos?: string[];
    comments?: string;
    priority?: 'critical' | 'major' | 'minor';
  }[];
  
  // Results
  totalItems: number;
  compliantItems: number;
  nonCompliantItems: number;
  complianceRate: number; // percentage
  
  // Findings
  findings: {
    id: string;
    category: string;
    severity: 'critical' | 'major' | 'minor';
    finding: string;
    recommendation: string;
    photos?: string[];
    correctiveAction?: string;
    dueDate?: Date;
    status: 'open' | 'in_progress' | 'completed';
  }[];
  
  // Follow-up
  followUpRequired: boolean;
  followUpDate?: Date;
  followUpAuditId?: string;
  
  overallRating?: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical';
  
  // Documents
  report?: string; // URL
  photos: string[];
  
  completedDate?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Safety Observation (Positive or Negative)
 */
export interface SafetyObservation {
  id: string;
  projectId: string;
  
  type: 'safe_behavior' | 'unsafe_act' | 'unsafe_condition' | 'suggestion';
  
  observedBy: string;
  observedAt: Date;
  location: string;
  
  description: string;
  photos?: string[];
  
  // If unsafe
  severity?: 'critical' | 'major' | 'minor';
  immediateActionTaken?: string;
  
  // If positive
  recognitionGiven?: boolean;
  
  // Follow-up
  actionRequired: boolean;
  assignedTo?: string;
  dueDate?: Date;
  completedDate?: Date;
  
  status: 'open' | 'in_progress' | 'completed';
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Safety Metrics and KPIs
 */
export interface SafetyMetrics {
  projectId: string;
  period: {
    start: Date;
    end: Date;
  };
  
  // Incident Metrics
  incidents: {
    total: number;
    bySeverity: Record<IncidentSeverity, number>;
    byType: Record<IncidentType, number>;
    fatalCount: number;
    lostTimeInjuries: number;
    totalDaysLost: number;
  };
  
  // Rates (per 200,000 hours worked)
  rates: {
    totalRecordableIncidentRate: number; // TRIR
    daysAwayRestrictedTransferRate: number; // DART
    lostTimeInjuryFrequencyRate: number; // LTIFR
    nearMissFrequencyRate: number;
  };
  
  // Training Metrics
  training: {
    totalSessions: number;
    totalAttendees: number;
    completionRate: number;
    averageScore: number;
    expiredCertifications: number;
    upcomingExpirations: number;
  };
  
  // PPE Compliance
  ppe: {
    totalInventory: number;
    activeAssignments: number;
    complianceRate: number;
    pendingInspections: number;
    expiredItems: number;
  };
  
  // Audits
  audits: {
    total: number;
    completed: number;
    averageComplianceRate: number;
    criticalFindings: number;
    openFindings: number;
  };
  
  // Observations
  observations: {
    total: number;
    safeBehaviors: number;
    unsafeActs: number;
    unsafeConditions: number;
    suggestions: number;
  };
  
  // Work Hours
  workHours: {
    totalHours: number;
    workersCount: number;
    daysSinceLastLTI: number;
  };
  
  // Trends
  trends: {
    incidentTrend: 'improving' | 'stable' | 'declining';
    complianceTrend: 'improving' | 'stable' | 'declining';
    trainingTrend: 'improving' | 'stable' | 'declining';
  };
  
  // Costs
  costs: {
    medical: number;
    property: number;
    productivity: number;
    training: number;
    ppe: number;
    total: number;
  };
}

/**
 * Safety Dashboard Summary
 */
export interface SafetyDashboardSummary {
  projectId: string;
  
  currentStatus: {
    daysSinceLastIncident: number;
    activeIncidents: number;
    criticalIncidents: number;
    openFindings: number;
  };
  
  thisMonth: SafetyMetrics;
  lastMonth: SafetyMetrics;
  yearToDate: SafetyMetrics;
  
  upcomingTraining: SafetyTraining[];
  expiringCertifications: {
    userId: string;
    userName: string;
    trainingType: TrainingType;
    expiryDate: Date;
  }[];
  
  recentIncidents: SafetyIncident[];
  pendingActions: number;
}

export default SafetyIncident;
