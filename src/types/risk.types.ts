/**
 * Risk Management Type Definitions
 * Priority 3B: Risk Management System
 * 
 * Comprehensive type system for identifying, assessing, mitigating,
 * and monitoring risks in construction projects.
 */

/**
 * Risk Category
 */
export type RiskCategory =
  | 'technical'
  | 'financial'
  | 'safety'
  | 'legal'
  | 'environmental'
  | 'operational'
  | 'schedule'
  | 'quality'
  | 'resource'
  | 'stakeholder'
  | 'external';

/**
 * Risk Severity (Impact)
 */
export type RiskSeverity = 1 | 2 | 3 | 4 | 5;

/**
 * Risk Probability (Likelihood)
 */
export type RiskProbability = 1 | 2 | 3 | 4 | 5;

/**
 * Risk Status
 */
export type RiskStatus =
  | 'identified'
  | 'assessed'
  | 'mitigating'
  | 'monitoring'
  | 'closed'
  | 'occurred';

/**
 * Risk Priority Level (based on score)
 */
export type RiskPriorityLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Mitigation Strategy Type
 */
export type MitigationStrategy =
  | 'avoid'      // Eliminate the risk
  | 'mitigate'   // Reduce likelihood or impact
  | 'transfer'   // Transfer to third party (insurance, subcontractor)
  | 'accept';    // Accept the risk

/**
 * Risk Impact Area
 */
export interface RiskImpactArea {
  cost?: {
    estimated: number;
    currency: string;
    description: string;
  };
  schedule?: {
    delayDays: number;
    criticalPath: boolean;
    description: string;
  };
  quality?: {
    severity: 'minor' | 'moderate' | 'major' | 'critical';
    description: string;
  };
  safety?: {
    severity: 'minor' | 'moderate' | 'major' | 'critical';
    affectedPersonnel: number;
    description: string;
  };
  reputation?: {
    severity: 'minor' | 'moderate' | 'major' | 'critical';
    description: string;
  };
}

/**
 * Mitigation Action
 */
export interface MitigationAction {
  id: string;
  action: string;
  responsibility: string; // user ID
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  cost?: number;
  completedDate?: Date;
  effectiveness?: 'low' | 'medium' | 'high';
  notes?: string;
}

/**
 * Mitigation Plan
 */
export interface MitigationPlan {
  strategy: MitigationStrategy;
  description: string;
  actions: MitigationAction[];
  estimatedCost: number;
  targetCompletionDate: Date;
  actualCompletionDate?: Date;
  effectiveness?: {
    severityReduction: number; // 0-5
    probabilityReduction: number; // 0-5
    costBenefit: number; // monetary value
  };
}

/**
 * Contingency Plan
 */
export interface ContingencyPlan {
  trigger: string; // What event/condition triggers this plan
  response: string; // What to do when triggered
  responsibilities: {
    role: string;
    actions: string[];
  }[];
  budget: number;
  resources: {
    type: string;
    quantity: number;
  }[];
  timeToImplement: number; // hours
}

/**
 * Main Risk Interface
 */
export interface Risk {
  id: string;
  projectId: string;
  
  // Basic Information
  riskNumber: string; // e.g., "RISK-001"
  title: string;
  description: string;
  category: RiskCategory;
  
  // Assessment
  severity: RiskSeverity;
  probability: RiskProbability;
  riskScore: number; // severity × probability (1-25)
  priorityLevel: RiskPriorityLevel;
  
  // Impact Analysis
  impactAreas: RiskImpactArea;
  estimatedImpact: number; // Total estimated cost impact
  
  // Ownership & Responsibility
  owner: string; // user ID - person responsible for managing this risk
  identifiedBy: string; // user ID
  stakeholders: string[]; // affected parties
  
  // Status & Timeline
  status: RiskStatus;
  identifiedDate: Date;
  assessmentDate?: Date;
  targetCloseDate?: Date;
  actualCloseDate?: Date;
  
  // Mitigation
  mitigationPlan?: MitigationPlan;
  contingencyPlan?: ContingencyPlan;
  
  // Residual Risk (after mitigation)
  residualSeverity?: RiskSeverity;
  residualProbability?: RiskProbability;
  residualScore?: number;
  
  // If risk occurred
  occurred?: {
    date: Date;
    actualImpact: RiskImpactArea;
    actualCost: number;
    lessonsLearned: string;
    preventiveMeasures: string;
  };
  
  // History & Tracking
  reviewHistory: RiskReview[];
  statusHistory: RiskStatusChange[];
  attachments: string[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastReviewedAt?: Date;
}

/**
 * Risk Review Record
 */
export interface RiskReview {
  id: string;
  reviewDate: Date;
  reviewedBy: string;
  
  currentSeverity: RiskSeverity;
  currentProbability: RiskProbability;
  currentScore: number;
  
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
    reason: string;
  }[];
  
  findings: string;
  recommendations: string;
  nextReviewDate: Date;
}

/**
 * Risk Status Change
 */
export interface RiskStatusChange {
  timestamp: Date;
  changedBy: string;
  previousStatus: RiskStatus;
  newStatus: RiskStatus;
  reason?: string;
}

/**
 * Risk Heat Map Data Point
 */
export interface RiskHeatMapPoint {
  riskId: string;
  title: string;
  severity: RiskSeverity;
  probability: RiskProbability;
  score: number;
  category: RiskCategory;
  status: RiskStatus;
}

/**
 * Risk Matrix Configuration
 */
export interface RiskMatrixConfig {
  severityLabels: {
    1: string; // e.g., "Very Low"
    2: string; // e.g., "Low"
    3: string; // e.g., "Medium"
    4: string; // e.g., "High"
    5: string; // e.g., "Very High"
  };
  probabilityLabels: {
    1: string; // e.g., "Rare"
    2: string; // e.g., "Unlikely"
    3: string; // e.g., "Possible"
    4: string; // e.g., "Likely"
    5: string; // e.g., "Almost Certain"
  };
  scoreThresholds: {
    low: number;      // 1-4
    medium: number;   // 5-9
    high: number;     // 10-15
    critical: number; // 16-25
  };
  colors: {
    low: string;
    medium: string;
    high: string;
    critical: string;
  };
}

/**
 * Risk Trend Data
 */
export interface RiskTrend {
  period: {
    start: Date;
    end: Date;
  };
  
  totalRisks: number;
  newRisks: number;
  closedRisks: number;
  occurredRisks: number;
  
  byPriority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  
  byCategory: Record<RiskCategory, number>;
  byStatus: Record<RiskStatus, number>;
  
  averageScore: number;
  totalEstimatedImpact: number;
  totalActualImpact: number;
  
  mitigationEffectiveness: number; // percentage
}

/**
 * Risk Alert
 */
export interface RiskAlert {
  id: string;
  riskId: string;
  riskTitle: string;
  
  alertType: 'overdue_action' | 'high_score' | 'review_due' | 'occurred' | 'escalation';
  severity: 'low' | 'medium' | 'high' | 'urgent';
  
  message: string;
  actionRequired: string;
  assignedTo: string[];
  
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  
  dueDate?: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

/**
 * Risk Filter Options
 */
export interface RiskFilterOptions {
  category?: RiskCategory[];
  status?: RiskStatus[];
  priorityLevel?: RiskPriorityLevel[];
  owner?: string[];
  
  severityRange?: {
    min: RiskSeverity;
    max: RiskSeverity;
  };
  
  probabilityRange?: {
    min: RiskProbability;
    max: RiskProbability;
  };
  
  scoreRange?: {
    min: number;
    max: number;
  };
  
  dateRange?: {
    field: 'identified' | 'target_close' | 'actual_close';
    start: Date;
    end: Date;
  };
  
  searchTerm?: string;
}

/**
 * Risk Dashboard Statistics
 */
export interface RiskDashboardStats {
  overview: {
    totalRisks: number;
    activeRisks: number;
    closedRisks: number;
    occurredRisks: number;
  };
  
  distribution: {
    byPriority: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    byCategory: Record<RiskCategory, number>;
    byStatus: Record<RiskStatus, number>;
  };
  
  financial: {
    totalEstimatedImpact: number;
    totalActualImpact: number;
    mitigationCosts: number;
    contingencyBudget: number;
    contingencyUsed: number;
  };
  
  performance: {
    risksIdentifiedThisMonth: number;
    risksClosedThisMonth: number;
    averageClosureTime: number; // days
    mitigationSuccessRate: number; // percentage
    overdueActions: number;
  };
  
  alerts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * Lessons Learned
 */
export interface LessonsLearned {
  id: string;
  projectId: string;
  riskId?: string;
  
  title: string;
  description: string;
  category: RiskCategory;
  
  whatHappened: string;
  whatWentWell: string;
  whatWentWrong: string;
  rootCause: string;
  
  preventiveMeasures: string[];
  recommendations: string[];
  
  applicableTo: string[]; // future projects, categories, etc.
  
  documentedBy: string;
  documentedAt: Date;
  
  tags: string[];
  attachments: string[];
}

/**
 * Risk Assessment Template
 */
export interface RiskAssessmentTemplate {
  id: string;
  name: string;
  description: string;
  category: RiskCategory;
  
  questions: {
    id: string;
    question: string;
    type: 'yes_no' | 'scale' | 'text' | 'checklist';
    options?: string[];
    weight: number; // importance 1-10
  }[];
  
  scoringLogic: {
    severityCalculation: string;
    probabilityCalculation: string;
  };
  
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}

/**
 * Risk Escalation Rule
 */
export interface RiskEscalationRule {
  id: string;
  name: string;
  
  trigger: {
    condition: 'score_threshold' | 'overdue_action' | 'status_change' | 'occurred';
    value: any;
  };
  
  escalateTo: {
    roles: string[];
    users: string[];
  };
  
  notificationMethod: ('email' | 'sms' | 'in_app')[];
  notificationTemplate: string;
  
  isActive: boolean;
}

export default Risk;
