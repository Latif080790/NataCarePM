/**
 * Construction Domain Type Definitions
 * RFI, Submittals, and Daily Logs
 */

// ============================================
// REQUEST FOR INFORMATION (RFI)
// ============================================

export type RfiStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'pending_response'
  | 'responded'
  | 'approved'
  | 'closed'
  | 'cancelled';

export type RfiPriority = 'low' | 'medium' | 'high' | 'critical';

export type RfiType =
  | 'design'
  | 'specification'
  | 'material'
  | 'schedule'
  | 'coordination'
  | 'quality'
  | 'safety'
  | 'contract'
  | 'other';

export interface RfiQuestion {
  id: string;
  question: string;
  category: string;
  drawingsReferences?: string[];
  specificationReferences?: string[];
  relatedItems?: string[];
}

export interface RfiResponse {
  id: string;
  response: string;
  responderId: string;
  responderName: string;
  responseDate: Date;
  attachments?: ConstructionAttachment[];
  approvedBy?: string;
  approvedDate?: Date;
}

export interface RfiAssignment {
  assignedTo: string;
  assignedToName: string;
  assignedBy: string;
  assignedByName: string;
  assignedDate: Date;
  dueDate?: Date;
  responseDate?: Date;
}

export interface Rfi {
  id: string;
  projectId: string;
  rfiNumber: string; // e.g., "RFI-2024-001"
  
  title: string;
  questions: RfiQuestion[];
  type: RfiType;
  priority: RfiPriority;
  status: RfiStatus;
  
  // Assignment information
  assignment?: RfiAssignment;
  
  // Response information
  responses: RfiResponse[];
  finalResponse?: string;
  responseDueDate?: Date;
  
  // References
  relatedChangeOrders?: string[];
  relatedSubmittals?: string[];
  
  // Metadata
  submittedBy: string;
  submittedByName: string;
  submittedDate: Date;
  lastUpdated: Date;
  closedDate?: Date;
  cancelledDate?: Date;
  
  // Tracking
  daysOpen: number;
  responseTime?: number; // in days
  
  // Attachments
  attachments: ConstructionAttachment[];
}

// ============================================
// SUBMITTALS
// ============================================

export type SubmittalStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'reviewed'
  | 'approved'
  | 'rejected'
  | 'resubmitted'
  | 'closed'
  | 'cancelled';

export type SubmittalType =
  | 'product_data'
  | 'samples'
  | 'shop_drawings'
  | 'schedules'
  | 'certifications'
  | 'reports'
  | 'specifications'
  | 'other';

export interface SubmittalReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string;
  reviewDate: Date;
  status: 'approved' | 'rejected' | 'comments_required';
  comments: string;
  actionItems?: string[];
  attachments?: ConstructionAttachment[];
}

export interface SubmittalApproval {
  id: string;
  approverId: string;
  approverName: string;
  approverRole: string;
  approvalDate: Date;
  status: 'approved' | 'rejected';
  comments: string;
  attachments?: ConstructionAttachment[];
}

export interface SubmittalRevision {
  revisionNumber: string;
  submittedDate: Date;
  submittedBy: string;
  submittedByName: string;
  description: string;
  files: ConstructionAttachment[];
}

export interface Submittal {
  id: string;
  projectId: string;
  submittalNumber: string; // e.g., "SUB-2024-001"
  
  title: string;
  description: string;
  type: SubmittalType;
  status: SubmittalStatus;
  
  // Specification information
  specificationSection?: string;
  drawingReferences?: string[];
  
  // Submission information
  submittedBy: string;
  submittedByName: string;
  submittedDate: Date;
  dueDate?: Date;
  
  // Content
  files: ConstructionAttachment[];
  revisions: SubmittalRevision[];
  
  // Review and approval workflow
  reviewers: string[];
  reviews: SubmittalReview[];
  approvals: SubmittalApproval[];
  currentReviewer?: string;
  
  // Tracking
  daysOpen: number;
  reviewDueDate?: Date;
  approvedDate?: Date;
  rejectedDate?: Date;
  closedDate?: Date;
  cancelledDate?: Date;
  
  // References
  relatedRfis?: string[];
  relatedChangeOrders?: string[];
  
  // Metadata
  lastUpdated: Date;
  createdBy: string;
  updatedBy: string;
}

// ============================================
// DAILY LOGS
// ============================================

export type DailyLogType =
  | 'general'
  | 'safety'
  | 'quality'
  | 'weather'
  | 'equipment'
  | 'materials'
  | 'personnel'
  | 'progress';

export interface DailyLogEntry {
  id: string;
  type: DailyLogType;
  title: string;
  description: string;
  date: Date;
  time?: string;
  location?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  
  // Personnel involved
  personnel?: {
    userId: string;
    name: string;
    role: string;
  }[];
  
  // Attachments
  attachments?: ConstructionAttachment[];
  
  // References
  relatedItems?: string[];
  
  // Metadata
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface WeatherLog {
  id: string;
  date: Date;
  temperature: {
    high: number;
    low: number;
    unit: 'celsius' | 'fahrenheit';
  };
  conditions: string;
  windSpeed?: number;
  humidity?: number;
  visibility?: string;
  impact: 'none' | 'minor' | 'moderate' | 'severe';
  notes?: string;
}

export interface PersonnelLog {
  id: string;
  date: Date;
  workerId: string;
  workerName: string;
  role: string;
  hoursWorked: number;
  status: 'present' | 'absent' | 'late' | 'leave';
  notes?: string;
  clockIn?: string;
  clockOut?: string;
}

export interface EquipmentLog {
  id: string;
  date: Date;
  equipmentId: string;
  equipmentName: string;
  hoursUsed: number;
  operator?: string;
  status: 'operational' | 'maintenance' | 'broken' | 'idle';
  location?: string;
  notes?: string;
}

export interface MaterialLog {
  id: string;
  date: Date;
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  source?: string;
  destination?: string;
  status: 'received' | 'used' | 'wasted' | 'returned';
  notes?: string;
}

export interface DailyLog {
  id: string;
  projectId: string;
  date: Date;
  logNumber: string; // e.g., "DL-2024-001"
  
  // General information
  generalContractor: string;
  projectManager: string;
  weatherConditions?: string;
  
  // Daily entries
  entries: DailyLogEntry[];
  
  // Specialized logs
  weatherLogs: WeatherLog[];
  personnelLogs: PersonnelLog[];
  equipmentLogs: EquipmentLog[];
  materialLogs: MaterialLog[];
  
  // Summary information
  workPerformed: string;
  workPlanned: string;
  issues: string;
  safetyNotes: string;
  
  // Metadata
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  lastUpdated: Date;
  approvedBy?: string;
  approvedDate?: Date;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
}

// ============================================
// COMMON INTERFACES
// ============================================

export interface ConstructionAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: Date;
}

export interface ConstructionFilterOptions {
  status?: string[];
  priority?: string[];
  type?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  assignedTo?: string[];
  searchTerm?: string;
}

export default Rfi;