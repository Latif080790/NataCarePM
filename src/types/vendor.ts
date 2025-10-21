/**
 * VENDOR MANAGEMENT TYPE DEFINITIONS
 *
 * Comprehensive vendor management system with:
 * - Vendor CRUD
 * - Performance tracking
 * - Evaluation system
 * - Blacklist management
 * - Document management
 *
 * Created: October 2025
 */

// ============================================================================
// ENUMS & STATUS
// ============================================================================

/**
 * Vendor status
 */
export type VendorStatus =
  | 'active' // Active and can receive POs
  | 'inactive' // Temporarily inactive
  | 'blacklisted' // Blacklisted - cannot receive POs
  | 'under_review' // Under performance review
  | 'suspended' // Suspended temporarily
  | 'pending_approval'; // New vendor pending approval

/**
 * Vendor category/type
 */
export type VendorCategory =
  | 'materials' // Material supplier
  | 'equipment' // Equipment supplier
  | 'services' // Service provider
  | 'subcontractor' // Subcontractor
  | 'labor' // Labor supplier
  | 'rental' // Equipment rental
  | 'consultant' // Consultant
  | 'other'; // Other

/**
 * Payment terms
 */
export type PaymentTerm =
  | 'cod' // Cash on delivery
  | 'net_7' // Net 7 days
  | 'net_14' // Net 14 days
  | 'net_30' // Net 30 days
  | 'net_45' // Net 45 days
  | 'net_60' // Net 60 days
  | 'advance_50' // 50% advance
  | 'custom'; // Custom terms

/**
 * Performance rating
 */
export type PerformanceRating =
  | 'excellent' // 90-100%
  | 'good' // 75-89%
  | 'satisfactory' // 60-74%
  | 'poor' // Below 60%
  | 'not_rated'; // Not yet rated

/**
 * Evaluation criteria
 */
export type EvaluationCriteria =
  | 'quality' // Quality of goods/services
  | 'delivery' // On-time delivery
  | 'price' // Pricing competitiveness
  | 'communication' // Communication responsiveness
  | 'documentation' // Documentation completeness
  | 'compliance'; // Regulatory compliance

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Contact person for vendor
 */
export interface VendorContact {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  mobile?: string;
  isPrimary: boolean;
  notes?: string;
}

/**
 * Vendor bank account
 */
export interface VendorBankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch?: string;
  swiftCode?: string;
  isPrimary: boolean;
}

/**
 * Vendor document
 */
export interface VendorDocument {
  id: string;
  vendorId: string;
  documentType: 'tax_id' | 'business_license' | 'certificate' | 'contract' | 'other';
  documentName: string;
  documentNumber?: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  expiryDate?: string;
  isExpired: boolean;
  notes?: string;
}

/**
 * Vendor evaluation record
 */
export interface VendorEvaluation {
  id: string;
  vendorId: string;
  projectId: string;
  evaluationDate: string;
  evaluatedBy: string;
  evaluatorName: string;

  // Scores (0-100)
  scores: {
    quality: number;
    delivery: number;
    price: number;
    communication: number;
    documentation: number;
    compliance: number;
  };

  // Calculated
  averageScore: number;
  rating: PerformanceRating;

  // Comments
  strengths: string;
  weaknesses: string;
  recommendations: string;

  // Reference
  poId?: string;
  grId?: string;
}

/**
 * Vendor performance metrics
 */
export interface VendorPerformance {
  vendorId: string;

  // Transaction metrics
  totalPOs: number;
  totalPOValue: number;
  completedPOs: number;
  cancelledPOs: number;

  // Delivery metrics
  onTimeDeliveries: number;
  lateDeliveries: number;
  onTimeDeliveryRate: number; // Percentage
  averageDeliveryDelay: number; // Days

  // Quality metrics
  totalGRs: number;
  acceptedGRs: number;
  rejectedGRs: number;
  qualityAcceptanceRate: number; // Percentage

  // Financial metrics
  totalPaid: number;
  totalOutstanding: number;
  averagePaymentDelay: number; // Days

  // Evaluation metrics
  totalEvaluations: number;
  averageEvaluationScore: number;
  latestRating: PerformanceRating;

  // Last transaction
  lastPODate?: string;
  lastGRDate?: string;
  lastEvaluationDate?: string;

  // Calculated
  performanceScore: number; // Weighted score 0-100
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Blacklist record
 */
export interface VendorBlacklist {
  id: string;
  vendorId: string;
  projectId?: string; // null = company-wide blacklist

  blacklistedBy: string;
  blacklistedByName: string;
  blacklistedAt: string;

  reason: string;
  category: 'quality' | 'fraud' | 'non_compliance' | 'financial' | 'ethical' | 'other';
  severity: 'warning' | 'temporary' | 'permanent';

  effectiveFrom: string;
  effectiveUntil?: string; // null = indefinite

  isActive: boolean;

  // Review
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;

  attachments: string[];
}

/**
 * Main Vendor interface
 */
export interface Vendor {
  id: string;

  // Basic Info
  vendorCode: string; // Auto-generated: VEN-YYYYMMDD-XXX
  vendorName: string;
  legalName: string;
  category: VendorCategory;
  status: VendorStatus;

  // Contact Info
  email: string;
  phone: string;
  mobile?: string;
  website?: string;

  // Address
  address: string;
  city: string;
  province: string;
  postalCode?: string;
  country: string;

  // Legal & Tax
  taxId: string; // NPWP
  businessLicenseNumber?: string;
  registrationNumber?: string;

  // Business Details
  businessType: 'individual' | 'pt' | 'cv' | 'cooperative' | 'other';
  establishedYear?: number;
  employeeCount?: number;
  annualRevenue?: number;

  // Payment
  paymentTerm: PaymentTerm;
  customPaymentTerm?: string;
  currency: string; // Default: IDR

  // Contacts
  contacts: VendorContact[];

  // Bank Accounts
  bankAccounts: VendorBankAccount[];

  // Performance
  performance: VendorPerformance;

  // Certifications
  certifications: string[];
  certificationExpiryDates: Record<string, string>;

  // Capabilities
  productServices: string[]; // What they supply
  serviceAreas: string[]; // Geographic coverage
  capacity: string; // Production/service capacity

  // Rating
  overallRating: PerformanceRating;
  lastEvaluationDate?: string;

  // Blacklist status
  isBlacklisted: boolean;
  blacklistRecords: VendorBlacklist[];

  // Metadata
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;

  notes?: string;
  tags: string[];
}

/**
 * Vendor creation input
 */
export interface CreateVendorInput {
  vendorName: string;
  legalName: string;
  category: VendorCategory;
  email: string;
  phone: string;
  mobile?: string;
  website?: string;
  address: string;
  city: string;
  province: string;
  postalCode?: string;
  country: string;
  taxId: string;
  businessLicenseNumber?: string;
  businessType: 'individual' | 'pt' | 'cv' | 'cooperative' | 'other';
  paymentTerm: PaymentTerm;
  customPaymentTerm?: string;
  currency?: string;
  contacts?: Omit<VendorContact, 'id'>[];
  bankAccounts?: Omit<VendorBankAccount, 'id'>[];
  productServices?: string[];
  serviceAreas?: string[];
  capacity?: string;
  certifications?: string[];
  notes?: string;
  tags?: string[];
}

/**
 * Vendor update input
 */
export interface UpdateVendorInput {
  vendorName?: string;
  legalName?: string;
  category?: VendorCategory;
  status?: VendorStatus;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  businessLicenseNumber?: string;
  businessType?: 'individual' | 'pt' | 'cv' | 'cooperative' | 'other';
  paymentTerm?: PaymentTerm;
  customPaymentTerm?: string;
  currency?: string;
  productServices?: string[];
  serviceAreas?: string[];
  capacity?: string;
  certifications?: string[];
  notes?: string;
  tags?: string[];
}

/**
 * Vendor filter options
 */
export interface VendorFilters {
  status?: VendorStatus[];
  category?: VendorCategory[];
  rating?: PerformanceRating[];
  tags?: string[];
  city?: string[];
  province?: string[];
  isBlacklisted?: boolean;
  minPerformanceScore?: number;
  maxPerformanceScore?: number;
}

/**
 * Vendor evaluation input
 */
export interface CreateEvaluationInput {
  vendorId: string;
  projectId: string;
  scores: {
    quality: number;
    delivery: number;
    price: number;
    communication: number;
    documentation: number;
    compliance: number;
  };
  strengths: string;
  weaknesses: string;
  recommendations: string;
  poId?: string;
  grId?: string;
}

/**
 * Blacklist input
 */
export interface CreateBlacklistInput {
  vendorId: string;
  projectId?: string;
  reason: string;
  category: 'quality' | 'fraud' | 'non_compliance' | 'financial' | 'ethical' | 'other';
  severity: 'warning' | 'temporary' | 'permanent';
  effectiveFrom: string;
  effectiveUntil?: string;
  attachments?: string[];
}

/**
 * Vendor summary statistics
 */
export interface VendorSummary {
  totalVendors: number;
  activeVendors: number;
  blacklistedVendors: number;
  underReviewVendors: number;

  byCategory: Record<VendorCategory, number>;
  byRating: Record<PerformanceRating, number>;

  totalPOValue: number;
  averagePerformanceScore: number;
  averageOnTimeDeliveryRate: number;
  averageQualityAcceptanceRate: number;

  topVendors: {
    vendorId: string;
    vendorName: string;
    performanceScore: number;
    totalPOValue: number;
  }[];

  recentEvaluations: number;
  pendingApprovals: number;
}
