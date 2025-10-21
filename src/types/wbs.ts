/**
 * Work Breakdown Structure (WBS) Type Definitions
 *
 * WBS is the hierarchical decomposition of project work into manageable components.
 * Each WBS element represents a work package that can be planned, tracked, and controlled.
 *
 * @module types/wbs
 */

/**
 * WBS Element - Represents a single node in the Work Breakdown Structure
 */
export interface WBSElement {
  /** Unique identifier */
  id: string;

  /** WBS code following standard format (e.g., "1.2.3") */
  code: string;

  /** Element name/description */
  name: string;

  /** Description of work scope */
  description?: string;

  /** Parent element ID (null for root level) */
  parentId: string | null;

  /** Hierarchy level (1 = top level, 2 = second level, etc.) */
  level: number;

  /** Project this WBS belongs to */
  projectId: string;

  /** Chart of Account ID for cost tracking */
  accountId?: string;

  /** Budget amount allocated to this WBS element */
  budgetAmount: number;

  /** Actual cost incurred (from expenses) */
  actualAmount: number;

  /** Committed amount (from purchase orders) */
  commitments: number;

  /** Variance = Budget - (Actual + Commitments) */
  variance: number;

  /** Variance percentage */
  variancePercentage: number;

  /** Available budget = Budget - Actual - Commitments */
  availableBudget: number;

  /** Work status */
  status: 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';

  /** Progress percentage (0-100) */
  progress: number;

  /** Planned start date */
  startDate?: string;

  /** Planned end date */
  endDate?: string;

  /** Actual start date */
  actualStartDate?: string;

  /** Actual end date */
  actualEndDate?: string;

  /** Responsible person/team */
  responsibleUser?: string;

  /** Is this element a deliverable? */
  isDeliverable: boolean;

  /** Is this element billable to client? */
  isBillable: boolean;

  /** Child elements (for tree structure) */
  children: WBSElement[];

  /** Number of RAB items linked to this WBS */
  rabItemCount: number;

  /** Number of tasks linked to this WBS */
  taskCount: number;

  /** Order/sequence within parent */
  order: number;

  /** Custom attributes */
  customFields?: { [key: string]: any };

  /** Notes/comments */
  notes?: string;

  /** Audit information */
  createdBy: string;
  createdDate: string;
  updatedBy?: string;
  updatedDate?: string;
}

/**
 * WBS Template - Reusable WBS structure for similar projects
 */
export interface WBSTemplate {
  id: string;
  name: string;
  description: string;
  category: string; // e.g., "Construction", "IT Project", "Infrastructure"
  elements: WBSTemplateElement[];
  createdBy: string;
  createdDate: string;
  isPublic: boolean;
}

/**
 * WBS Template Element - Element in a template (without project-specific data)
 */
export interface WBSTemplateElement {
  code: string;
  name: string;
  description?: string;
  parentCode: string | null;
  level: number;
  order: number;
  isDeliverable: boolean;
  isBillable: boolean;
  estimatedBudgetPercentage?: number; // % of total project budget
  notes?: string;
}

/**
 * WBS Summary - Aggregated statistics for a WBS element and its children
 */
export interface WBSSummary {
  wbsId: string;
  wbsCode: string;
  wbsName: string;

  /** Total budget (including children) */
  totalBudget: number;

  /** Total actual cost (including children) */
  totalActual: number;

  /** Total commitments (including children) */
  totalCommitments: number;

  /** Total variance */
  totalVariance: number;

  /** Variance percentage */
  variancePercentage: number;

  /** Overall progress (weighted by budget) */
  overallProgress: number;

  /** Number of child elements */
  childCount: number;

  /** Number of completed children */
  completedChildCount: number;

  /** RAB items linked to this WBS and children */
  totalRabItems: number;

  /** Tasks linked to this WBS and children */
  totalTasks: number;

  /** Completion status */
  completionStatus: 'On Track' | 'At Risk' | 'Over Budget' | 'Delayed' | 'Completed';
}

/**
 * WBS Cost Allocation - Links costs to WBS elements
 */
export interface WBSCostAllocation {
  id: string;
  wbsId: string;
  wbsCode: string;

  /** Type of cost */
  costType: 'Budget' | 'Actual' | 'Commitment';

  /** Reference to source document */
  referenceType: 'RAB Item' | 'Expense' | 'Purchase Order' | 'Journal Entry';
  referenceId: string;
  referenceNumber?: string;

  /** Amount */
  amount: number;
  currency: string;

  /** Date of allocation */
  allocationDate: string;

  /** Description */
  description: string;

  /** Posted to GL? */
  posted: boolean;

  /** Audit */
  createdBy: string;
  createdDate: string;
}

/**
 * WBS Hierarchy - Complete tree structure
 */
export interface WBSHierarchy {
  projectId: string;
  projectName: string;
  rootElements: WBSElement[];
  flatList: WBSElement[]; // Flattened for easy searching
  totalElements: number;
  maxLevel: number;
  lastUpdated: string;
}

/**
 * WBS Budget Rollup - Budget summary by hierarchy level
 */
export interface WBSBudgetRollup {
  level: number;
  elements: {
    wbsId: string;
    code: string;
    name: string;
    budget: number;
    actual: number;
    commitments: number;
    variance: number;
    variancePercentage: number;
    progress: number;
    status: WBSElement['status'];
  }[];
  levelTotal: {
    budget: number;
    actual: number;
    commitments: number;
    variance: number;
  };
}

/**
 * WBS Link - Relationship between WBS and other entities
 */
export interface WBSLink {
  id: string;
  wbsId: string;
  linkType: 'RAB Item' | 'Task' | 'Purchase Order' | 'Expense' | 'Document';
  linkedEntityId: string;
  linkedEntityName: string;
  createdBy: string;
  createdDate: string;
}

/**
 * WBS Change History - Audit trail for WBS changes
 */
export interface WBSChangeHistory {
  id: string;
  wbsId: string;
  wbsCode: string;
  changeType: 'Created' | 'Updated' | 'Deleted' | 'Moved' | 'Budget Changed' | 'Status Changed';
  fieldChanged?: string;
  oldValue?: any;
  newValue?: any;
  reason?: string;
  changedBy: string;
  changedDate: string;
}

/**
 * WBS Validation Result
 */
export interface WBSValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * WBS Filter Options
 */
export interface WBSFilterOptions {
  status?: WBSElement['status'][];
  level?: number[];
  responsibleUser?: string[];
  budgetRange?: { min: number; max: number };
  progressRange?: { min: number; max: number };
  isDeliverable?: boolean;
  isBillable?: boolean;
  hasVariance?: boolean; // Show only elements with budget variance
  searchTerm?: string;
}

/**
 * WBS Sort Options
 */
export interface WBSSortOptions {
  field: 'code' | 'name' | 'budget' | 'actual' | 'variance' | 'progress' | 'status';
  direction: 'asc' | 'desc';
}

/**
 * WBS Export Format
 */
export type WBSExportFormat = 'Excel' | 'CSV' | 'PDF' | 'MS Project' | 'Primavera' | 'JSON';

/**
 * WBS Import Data
 */
export interface WBSImportData {
  elements: Partial<WBSElement>[];
  projectId: string;
  importSource: 'Excel' | 'MS Project' | 'Primavera' | 'JSON';
  importedBy: string;
  importDate: string;
}

/**
 * Type guard to check if element has children
 */
export function hasChildren(element: WBSElement): boolean {
  return element.children && element.children.length > 0;
}

/**
 * Type guard to check if element is root level
 */
export function isRootElement(element: WBSElement): boolean {
  return element.parentId === null || element.level === 1;
}

/**
 * Type guard to check if element is leaf (no children)
 */
export function isLeafElement(element: WBSElement): boolean {
  return !element.children || element.children.length === 0;
}
