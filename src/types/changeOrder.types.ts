/**
 * Change Order Management Type Definitions
 * Priority 3C: Change Order Management System
 */

export type ChangeOrderType =
  | 'scope'
  | 'schedule'
  | 'budget'
  | 'design'
  | 'specification'
  | 'other';

export type ChangeOrderStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'implemented'
  | 'cancelled';

export type ApprovalDecision = 'approve' | 'reject' | 'request_revision';

export interface BudgetImpact {
  originalBudget: number;
  additionalCost: number;
  newBudget: number;
  variance: number;
  variancePercentage: number;
  affectedCostCategories: {
    category: string;
    impact: number;
  }[];
}

export interface ScheduleImpact {
  originalEndDate: Date;
  delayDays: number;
  newEndDate: Date;
  affectedTasks: {
    taskId: string;
    taskName: string;
    delayDays: number;
  }[];
  criticalPathAffected: boolean;
}

export interface ApprovalStep {
  stepNumber: number;
  approverRole: string;
  approverUserId: string;
  approverName: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  requiredBy?: Date;
  decision?: ApprovalDecision;
  comments?: string;
  decidedAt?: Date;
}

export interface ApprovalRecord {
  approverUserId: string;
  approverName: string;
  decision: ApprovalDecision;
  comments: string;
  timestamp: Date;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ChangeOrder {
  id: string;
  projectId: string;

  changeNumber: string; // e.g., "CO-2024-001"
  title: string;
  description: string;
  changeType: ChangeOrderType;

  requestedBy: string;
  requestedDate: Date;
  requiredBy?: Date; // when does this need to be decided

  status: ChangeOrderStatus;

  justification: string;
  alternativesConsidered?: string;

  costImpact: number;
  scheduleImpact: number; // days
  budgetImpact: BudgetImpact;
  scheduleImpactDetail?: ScheduleImpact;

  approvalWorkflow: ApprovalStep[];
  approvalHistory: ApprovalRecord[];
  currentApproverLevel: number;

  attachments: Attachment[];

  implementationPlan?: string;
  implementationStartDate?: Date;
  implementationEndDate?: Date;
  implementedDate?: Date;
  implementedBy?: string;

  rejectionReason?: string;
  cancellationReason?: string;

  relatedChangeOrders?: string[];

  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
}

export interface ChangeOrderSummary {
  projectId: string;
  totalChangeOrders: number;
  byStatus: Record<ChangeOrderStatus, number>;
  byType: Record<ChangeOrderType, number>;

  totalCostImpact: number;
  totalScheduleImpact: number;

  approvalRate: number; // percentage
  averageApprovalTime: number; // days

  pendingApprovals: number;
  overdueApprovals: number;
}

export interface ChangeOrderFilterOptions {
  status?: ChangeOrderStatus[];
  type?: ChangeOrderType[];
  requestedBy?: string[];
  dateRange?: {
    field: 'requested' | 'submitted' | 'approved';
    start: Date;
    end: Date;
  };
  costRange?: {
    min: number;
    max: number;
  };
  searchTerm?: string;
}

export default ChangeOrder;
