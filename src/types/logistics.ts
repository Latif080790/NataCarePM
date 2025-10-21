/**
 * LOGISTICS MODULE TYPE DEFINITIONS
 *
 * Comprehensive type system for logistics operations including:
 * - Goods Receipt (GR)
 * - Material Request (MR)
 * - Inventory Management
 * - Vendor Management
 *
 * Created: October 2025
 */

// ============================================================================
// GOODS RECEIPT (GR) TYPES
// ============================================================================

/**
 * GR Status Workflow:
 * draft → submitted → inspecting → approved → rejected → completed
 */
export type GRStatus =
  | 'draft' // Initial creation, can be edited
  | 'submitted' // Submitted for inspection
  | 'inspecting' // Quality inspection in progress
  | 'approved' // Inspection passed, ready to complete
  | 'rejected' // Inspection failed, needs action
  | 'completed' // Inventory updated, PO updated, integration complete
  | 'cancelled'; // Cancelled GR

/**
 * Quality inspection result for each item
 */
export type QualityStatus =
  | 'pending' // Not yet inspected
  | 'passed' // Quality OK
  | 'partial' // Some items rejected
  | 'failed'; // All items rejected

/**
 * Inspection photo/document attachment
 */
export interface GRInspectionPhoto {
  id: string;
  grItemId: string;
  url: string;
  filename: string;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
  description?: string;
  category: 'arrival' | 'inspection' | 'defect' | 'packaging' | 'other';
}

/**
 * Individual item in Goods Receipt
 */
export interface GRItem {
  id: string;
  grId: string;
  poItemId: string; // Link to PO item
  materialCode: string;
  materialName: string;

  // Quantities
  poQuantity: number; // Original PO quantity
  previouslyReceived: number; // Already received in previous GRs
  receivedQuantity: number; // Current GR quantity
  acceptedQuantity: number; // Quantity that passed inspection
  rejectedQuantity: number; // Quantity that failed inspection

  unit: string;

  // Quality Inspection
  qualityStatus: QualityStatus;
  inspectionNotes?: string;
  inspectorId?: string;
  inspectorName?: string;
  inspectionDate?: string;

  // Defect tracking
  defectDescription?: string;
  defectPhotos: GRInspectionPhoto[];

  // Storage location
  warehouseId?: string;
  warehouseName?: string;
  storageLocation?: string;

  // Pricing (from PO)
  unitPrice: number;
  totalPrice: number;

  // Variance tracking
  quantityVariance: number; // receivedQuantity - poQuantity
  variancePercentage: number; // (variance / poQuantity) * 100
  varianceReason?: string;
}

/**
 * Main Goods Receipt document
 */
export interface GoodsReceipt {
  id: string;
  grNumber: string; // Auto-generated: GR-YYYYMMDD-XXXX
  projectId: string;

  // PO Reference
  poId: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;

  // GR Details
  status: GRStatus;
  receiptDate: string; // Actual goods arrival date
  deliveryNote?: string; // Vendor's delivery note number
  vehicleNumber?: string; // Delivery vehicle
  driverName?: string;

  // Items
  items: GRItem[];

  // Summary
  totalItems: number;
  totalQuantity: number;
  totalValue: number;

  // Inspection Summary
  inspectionStatus: 'not-started' | 'in-progress' | 'completed';
  overallQualityStatus: QualityStatus;
  inspectionCompletedAt?: string;

  // Integration flags
  inventoryUpdated: boolean;
  poUpdated: boolean;
  wbsUpdated: boolean;
  apInvoiceCreated: boolean;

  // Audit trail
  createdBy: string;
  createdAt: string;
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  completedBy?: string;
  completedAt?: string;

  // Notes
  receiverNotes?: string; // Notes from receiver
  inspectorNotes?: string; // Notes from quality inspector
  remarks?: string; // General remarks

  // Photos
  photos: GRInspectionPhoto[];
}

/**
 * GR creation input (from UI form)
 */
export interface CreateGRInput {
  projectId: string;
  poId: string;
  receiptDate: string;
  deliveryNote?: string;
  vehicleNumber?: string;
  driverName?: string;
  receiverNotes?: string;
}

/**
 * GR update input
 */
export interface UpdateGRInput {
  receiptDate?: string;
  deliveryNote?: string;
  vehicleNumber?: string;
  driverName?: string;
  receiverNotes?: string;
  inspectorNotes?: string;
  remarks?: string;
}

/**
 * Item inspection input
 */
export interface InspectGRItemInput {
  grItemId: string;
  acceptedQuantity: number;
  rejectedQuantity: number;
  qualityStatus: QualityStatus;
  inspectionNotes?: string;
  defectDescription?: string;
  warehouseId?: string;
  storageLocation?: string;
}

/**
 * GR summary statistics
 */
export interface GRSummary {
  totalGRs: number;
  pendingInspection: number;
  completedGRs: number;
  rejectedItems: number;
  totalValue: number;
  averageInspectionTime: number; // in hours
  onTimeDeliveryRate: number; // percentage
}

/**
 * GR filter options
 */
export interface GRFilterOptions {
  projectId?: string;
  vendorId?: string;
  status?: GRStatus[];
  qualityStatus?: QualityStatus[];
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string; // Search in GR number, PO number, vendor name
}

/**
 * GR validation result
 */
export interface GRValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// MATERIAL REQUEST (MR) TYPES
// ============================================================================

/**
 * MR Status Workflow:
 * draft → submitted → site_manager_review → pm_review →
 * budget_check → approved → rejected → converted_to_po → completed
 */
export type MRStatus =
  | 'draft'
  | 'submitted'
  | 'site_manager_review'
  | 'pm_review'
  | 'budget_check'
  | 'approved'
  | 'rejected'
  | 'converted_to_po'
  | 'completed'
  | 'cancelled';

/**
 * MR Priority
 */
export type MRPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Individual item in Material Request
 */
export interface MRItem {
  id: string;
  mrId: string;
  materialCode?: string; // If existing material
  materialName: string;
  description: string;
  specification?: string; // Technical specifications
  quantity: number;
  requestedQty: number; // Alias for quantity (used in modals)
  unit: string;

  // Budget allocation
  wbsElementId?: string;
  wbsCode?: string; // Alias for wbsElementId
  estimatedUnitPrice: number;
  estimatedTotalPrice: number;
  estimatedTotal: number; // Alias for estimatedTotalPrice

  // Inventory check
  currentStock: number;
  reorderPoint: number;
  stockStatus: 'sufficient' | 'low' | 'out_of_stock';

  // Justification
  justification: string;
  urgencyReason?: string;
  notes?: string; // General notes

  // PO conversion tracking
  convertedToPO: boolean;
  poId?: string;
  poItemId?: string;
}

/**
 * Main Material Request document
 */
export interface MaterialRequest {
  id: string;
  mrNumber: string; // Auto-generated: MR-YYYYMMDD-XXXX
  projectId: string;

  // Request details
  status: MRStatus;
  priority: MRPriority;
  requiredDate: string; // When materials are needed
  purpose: string; // Purpose of request
  deliveryLocation?: string; // Where materials should be delivered
  notes?: string; // General notes
  createdAt: string; // Creation timestamp

  // Items
  items: MRItem[];
  totalItems: number;
  totalEstimatedValue: number;

  // Approval workflow
  requestedBy: string;
  requestedAt: string;

  siteManagerId?: string;
  siteManagerApprovedAt?: string;
  siteManagerNotes?: string;

  pmId?: string;
  pmApprovedAt?: string;
  pmNotes?: string;

  budgetCheckedBy?: string;
  budgetCheckedAt?: string;
  budgetStatus?: 'sufficient' | 'insufficient' | 'needs_reallocation';
  budgetNotes?: string;

  finalApprovedBy?: string;
  finalApprovedAt?: string;

  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;

  // PO conversion
  convertedToPO: boolean;
  poIds: string[]; // Can be split into multiple POs
  poId?: string; // Primary PO ID
  convertedAt?: string; // When converted to PO

  // Approval stages for tracking
  approvalStages?: ApprovalStage[];

  // Attachments
  attachments: string[]; // URLs to supporting documents

  remarks?: string;
}

/**
 * Approval stage tracking
 */
export interface ApprovalStage {
  stage: string;
  status: 'pending' | 'approved' | 'rejected';
  approverName?: string;
  approverId?: string;
  approvedAt?: string;
  notes?: string;
}

/**
 * MR creation input
 */
export interface CreateMRInput {
  projectId: string;
  priority: MRPriority;
  requiredDate: string;
  purpose: string;
  items: Omit<MRItem, 'id' | 'mrId' | 'currentStock' | 'stockStatus' | 'convertedToPO'>[];
  remarks?: string;
}

/**
 * MR approval input
 */
export interface ApproveMRInput {
  mrId: string;
  approverRole: 'site_manager' | 'pm' | 'budget_controller' | 'final_approver';
  approved: boolean;
  notes?: string;
}

/**
 * MR to PO conversion input
 */
export interface ConvertMRtoPOInput {
  mrId: string;
  vendorId: string;
  itemMappings: {
    mrItemId: string;
    finalQuantity: number;
    finalUnitPrice: number;
  }[];
  deliveryDate: string;
  terms?: string;
}

// ============================================================================
// INVENTORY TYPES
// ============================================================================

/**
 * Inventory transaction types
 */
export type InventoryTransactionType =
  | 'IN' // Goods Receipt
  | 'OUT' // Material Issue
  | 'ADJUSTMENT' // Physical count adjustment
  | 'TRANSFER'; // Warehouse transfer

/**
 * Inventory transaction
 */
export interface InventoryTransaction {
  id: string;
  projectId: string;
  transactionNumber: string; // Auto-generated
  transactionType: InventoryTransactionType;
  transactionDate: string;

  materialCode: string;
  materialName: string;

  // Quantities
  quantityBefore: number;
  quantityChange: number; // Positive for IN, negative for OUT
  quantityAfter: number;

  unit: string;

  // Location
  warehouseId: string;
  warehouseName: string;
  storageLocation?: string;

  // Reference documents
  referenceType?: 'GR' | 'MI' | 'PO' | 'MR' | 'PHYSICAL_COUNT';
  referenceId?: string;
  referenceNumber?: string;

  // Cost tracking
  unitCost: number;
  totalCost: number;
  wbsElementId?: string;

  // Audit
  performedBy: string;
  notes?: string;
  createdAt: string;
}

/**
 * Material master data
 */
export interface Material {
  id: string;
  materialCode: string;
  materialName: string;
  description: string;
  category: string;
  unit: string;

  // Inventory control
  reorderPoint: number;
  minStock: number;
  maxStock: number;
  leadTimeDays: number;

  // Costing
  averageCost: number;
  lastPurchasePrice: number;
  standardCost?: number;

  // Current stock across all warehouses
  totalStock: number;
  availableStock: number; // Total - reserved
  reservedStock: number;

  // Status
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Warehouse/storage location
 */
export interface Warehouse {
  id: string;
  code: string;
  name: string;
  projectId: string;
  address?: string;
  managerId?: string;
  managerName?: string;
  isActive: boolean;
}

// ============================================================================
// VENDOR TYPES (Enhanced)
// ============================================================================

/**
 * Vendor evaluation criteria
 */
export interface VendorEvaluation {
  id: string;
  vendorId: string;
  evaluationDate: string;
  evaluatedBy: string;

  // Performance metrics
  qualityScore: number; // 0-100
  deliveryScore: number; // 0-100
  priceScore: number; // 0-100
  serviceScore: number; // 0-100
  overallScore: number; // Average

  // Detailed metrics
  onTimeDeliveryRate: number; // percentage
  qualityRejectionRate: number; // percentage
  responseTime: number; // hours
  complaintCount: number;

  notes?: string;
  recommendation: 'highly_recommended' | 'recommended' | 'conditional' | 'not_recommended';
}

/**
 * Enhanced vendor with performance tracking
 */
export interface EnhancedVendor {
  id: string;
  vendorCode: string;
  name: string;
  category: string[]; // e.g., ['Construction', 'Electrical']

  // Contact
  contactPerson: string;
  phone: string;
  email: string;
  address: string;

  // Legal
  npwp?: string; // Tax ID
  siup?: string; // Business permit
  certifications: string[]; // ISO, etc.

  // Payment terms
  paymentTerms: string;
  creditLimit: number;

  // Performance tracking
  totalPOs: number;
  totalValue: number;
  activeGRs: number;
  completedGRs: number;

  latestEvaluation?: VendorEvaluation;
  averageQualityScore: number;
  averageDeliveryScore: number;
  overallRating: number;

  // Status
  isActive: boolean;
  isBlacklisted: boolean;
  blacklistReason?: string;
  blacklistDate?: string;

  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Photo upload result
 */
export interface PhotoUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Generic list response with pagination
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
