/**
 * VENDOR MANAGEMENT SERVICE
 *
 * Comprehensive vendor management including:
 * - CRUD operations
 * - Performance tracking
 * - Evaluation system
 * - Blacklist management
 * - Document management
 * - Analytics & reporting
 *
 * Created: October 2025
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import {
  Vendor,
  VendorContact,
  VendorBankAccount,
  VendorEvaluation,
  VendorPerformance,
  VendorBlacklist,
  CreateVendorInput,
  UpdateVendorInput,
  VendorFilters,
  CreateEvaluationInput,
  CreateBlacklistInput,
  VendorSummary,
  PerformanceRating,
} from '@/types/vendor';
import { auditHelper } from '@/utils/auditHelper';
import { logger } from '@/utils/logger.enhanced';

// ============================================================================
// CONSTANTS
// ============================================================================

const VENDORS_COLLECTION = 'vendors';
const EVALUATIONS_COLLECTION = 'vendor_evaluations';
const BLACKLIST_COLLECTION = 'vendor_blacklist';
// const DOCUMENTS_COLLECTION = 'vendor_documents'; // Reserved for future document management

// ============================================================================
// VENDOR CODE GENERATION
// ============================================================================

/**
 * Generate unique vendor code: VEN-YYYYMMDD-XXX
 */
async function generateVendorCode(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

  // Get count of vendors created today
  const q = query(
    collection(db, VENDORS_COLLECTION),
    where('createdAt', '>=', today.toISOString().split('T')[0]),
    orderBy('createdAt', 'desc'),
    limit(1)
  );

  const snapshot = await getDocs(q);
  let sequence = 1;

  if (!snapshot.empty) {
    const lastCode = snapshot.docs[0].data().vendorCode;
    const lastSequence = parseInt(lastCode.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `VEN-${dateStr}-${sequence.toString().padStart(3, '0')}`;
}

// ============================================================================
// VENDOR CRUD OPERATIONS
// ============================================================================

/**
 * Create new vendor
 */
export async function createVendor(
  input: CreateVendorInput,
  userId: string,
  _userName: string  // Reserved for future audit logging
): Promise<Vendor> {
  try {
    const vendorCode = await generateVendorCode();

    // Initialize contacts with IDs
    const contacts: VendorContact[] = (input.contacts || []).map((contact, index) => ({
      ...contact,
      id: `contact_${Date.now()}_${index}`,
    }));

    // Initialize bank accounts with IDs
    const bankAccounts: VendorBankAccount[] = (input.bankAccounts || []).map((account, index) => ({
      ...account,
      id: `bank_${Date.now()}_${index}`,
    }));

    // Initialize performance metrics
    const performance: VendorPerformance = {
      vendorId: '',
      totalPOs: 0,
      totalPOValue: 0,
      completedPOs: 0,
      cancelledPOs: 0,
      onTimeDeliveries: 0,
      lateDeliveries: 0,
      onTimeDeliveryRate: 0,
      averageDeliveryDelay: 0,
      totalGRs: 0,
      acceptedGRs: 0,
      rejectedGRs: 0,
      qualityAcceptanceRate: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      averagePaymentDelay: 0,
      totalEvaluations: 0,
      averageEvaluationScore: 0,
      latestRating: 'not_rated',
      performanceScore: 0,
      riskLevel: 'low',
    };

    const newVendor: Omit<Vendor, 'id'> = {
      vendorCode,
      vendorName: input.vendorName,
      legalName: input.legalName,
      category: input.category,
      status: 'pending_approval',
      email: input.email,
      phone: input.phone,
      mobile: input.mobile,
      website: input.website,
      address: input.address,
      city: input.city,
      province: input.province,
      postalCode: input.postalCode,
      country: input.country,
      taxId: input.taxId,
      businessLicenseNumber: input.businessLicenseNumber,
      registrationNumber: input.taxId, // Use taxId as registration number
      businessType: input.businessType,
      establishedYear: undefined,
      employeeCount: undefined,
      annualRevenue: undefined,
      paymentTerm: input.paymentTerm,
      customPaymentTerm: input.customPaymentTerm,
      currency: input.currency || 'IDR',
      contacts,
      bankAccounts,
      performance,
      certifications: input.certifications || [],
      certificationExpiryDates: {},
      productServices: input.productServices || [],
      serviceAreas: input.serviceAreas || [],
      capacity: input.capacity || '',
      overallRating: 'not_rated',
      isBlacklisted: false,
      blacklistRecords: [],
      createdBy: userId,
      createdAt: new Date().toISOString(),
      notes: input.notes,
      tags: input.tags || [],
    };

    const docRef = await addDoc(collection(db, VENDORS_COLLECTION), newVendor);

    // Update performance with vendorId
    await updateDoc(doc(db, VENDORS_COLLECTION, docRef.id), {
      'performance.vendorId': docRef.id,
    });

    const vendor = {
      id: docRef.id,
      ...newVendor,
      performance: {
        ...performance,
        vendorId: docRef.id,
      },
    };

    // Log vendor creation
    await auditHelper.logCreate({
      module: 'procurement',
      subModule: 'vendor_management',
      entityType: 'vendor',
      entityId: docRef.id,
      entityName: input.vendorName,
      newData: vendor,
      metadata: {
        vendorCode,
        category: input.category,
        status: 'pending_approval',
      },
    });

    return vendor;
  } catch (error) {
    logger.error('Error creating vendor', error as Error);
    throw new Error('Failed to create vendor');
  }
}

/**
 * Get vendor by ID
 */
export async function getVendorById(vendorId: string): Promise<Vendor | null> {
  try {
    const docRef = doc(db, VENDORS_COLLECTION, vendorId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Vendor;
  } catch (error) {
    logger.error('Error getting vendor', error as Error);
    throw new Error('Failed to get vendor');
  }
}

/**
 * Get all vendors with optional filtering
 */
export async function getVendors(filters?: VendorFilters): Promise<Vendor[]> {
  try {
    let q = query(collection(db, VENDORS_COLLECTION), orderBy('createdAt', 'desc'));

    // Apply filters
    if (filters?.status && filters.status.length > 0) {
      q = query(q, where('status', 'in', filters.status));
    }

    if (filters?.category && filters.category.length > 0) {
      q = query(q, where('category', 'in', filters.category));
    }

    if (filters?.isBlacklisted !== undefined) {
      q = query(q, where('isBlacklisted', '==', filters.isBlacklisted));
    }

    const snapshot = await getDocs(q);
    let vendors = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Vendor[];

    // Client-side filtering for complex criteria
    if (filters?.rating && filters.rating.length > 0) {
      vendors = vendors.filter((v) => filters.rating!.includes(v.overallRating));
    }

    if (filters?.tags && filters.tags.length > 0) {
      vendors = vendors.filter((v) => filters.tags!.some((tag) => v.tags.includes(tag)));
    }

    if (filters?.city && filters.city.length > 0) {
      vendors = vendors.filter((v) => filters.city!.includes(v.city));
    }

    if (filters?.province && filters.province.length > 0) {
      vendors = vendors.filter((v) => filters.province!.includes(v.province));
    }

    if (filters?.minPerformanceScore !== undefined) {
      vendors = vendors.filter(
        (v) => v.performance.performanceScore >= filters.minPerformanceScore!
      );
    }

    if (filters?.maxPerformanceScore !== undefined) {
      vendors = vendors.filter(
        (v) => v.performance.performanceScore <= filters.maxPerformanceScore!
      );
    }

    return vendors;
  } catch (error) {
    logger.error('Error getting vendors', error as Error);
    throw new Error('Failed to get vendors');
  }
}

/**
 * Update vendor
 */
export async function updateVendor(
  vendorId: string,
  input: UpdateVendorInput,
  userId: string
): Promise<void> {
  try {
    const docRef = doc(db, VENDORS_COLLECTION, vendorId);
    
    // Get old data for audit trail
    const oldVendor = await getVendorById(vendorId);

    await updateDoc(docRef, {
      ...input,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    });

    // Log vendor update
    if (oldVendor) {
      await auditHelper.logUpdate({
        module: 'procurement',
        subModule: 'vendor_management',
        entityType: 'vendor',
        entityId: vendorId,
        entityName: oldVendor.vendorName,
        oldData: oldVendor,
        newData: { ...oldVendor, ...input },
        metadata: {
          vendorCode: oldVendor.vendorCode,
          updatedFields: Object.keys(input),
        },
      });
    }
  } catch (error) {
    logger.error('Error updating vendor', error as Error);
    throw new Error('Failed to update vendor');
  }
}

/**
 * Delete vendor (soft delete by setting status to inactive)
 */
export async function deleteVendor(vendorId: string, userId: string): Promise<void> {
  try {
    // Check if vendor has active POs
    const activePOs = await getVendorPurchaseOrders(vendorId, [
      'Menunggu Persetujuan',
      'Disetujui',
      'PO Dibuat',
      'Dipesan',
    ]);
    if (activePOs.length > 0) {
      throw new Error(`Cannot delete vendor with ${activePOs.length} active purchase order(s)`);
    }

    // Get vendor data before deletion
    const vendor = await getVendorById(vendorId);

    const docRef = doc(db, VENDORS_COLLECTION, vendorId);
    await updateDoc(docRef, {
      status: 'inactive',
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    });

    // Log vendor deletion (soft delete)
    if (vendor) {
      await auditHelper.logStatusChange({
        module: 'procurement',
        entityType: 'vendor',
        entityId: vendorId,
        entityName: vendor.vendorName,
        oldStatus: vendor.status,
        newStatus: 'inactive',
        reason: 'Vendor deactivated',
        metadata: {
          vendorCode: vendor.vendorCode,
        },
      });
    }
  } catch (error) {
    logger.error('Error deleting vendor', error as Error);
    throw error;
  }
}

/**
 * Approve vendor (change status from pending to active)
 */
export async function approveVendor(vendorId: string, userId: string): Promise<void> {
  try {
    // Get vendor data before approval
    const vendor = await getVendorById(vendorId);

    const docRef = doc(db, VENDORS_COLLECTION, vendorId);
    await updateDoc(docRef, {
      status: 'active',
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    });

    // Log vendor approval
    if (vendor) {
      await auditHelper.logApproval({
        module: 'procurement',
        entityType: 'vendor',
        entityId: vendorId,
        entityName: vendor.vendorName,
        approvalStage: 'vendor_registration',
        decision: 'approved',
        oldStatus: vendor.status,
        newStatus: 'active',
        metadata: {
          vendorCode: vendor.vendorCode,
          category: vendor.category,
        },
      });
    }
  } catch (error) {
    logger.error('Error approving vendor', error as Error);
    throw new Error('Failed to approve vendor');
  }
}

// ============================================================================
// VENDOR CONTACTS MANAGEMENT
// ============================================================================

/**
 * Add contact to vendor
 */
export async function addVendorContact(
  vendorId: string,
  contact: Omit<VendorContact, 'id'>
): Promise<void> {
  try {
    const vendor = await getVendorById(vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const newContact: VendorContact = {
      ...contact,
      id: `contact_${Date.now()}`,
    };

    const docRef = doc(db, VENDORS_COLLECTION, vendorId);
    await updateDoc(docRef, {
      contacts: [...vendor.contacts, newContact],
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error adding vendor contact', error as Error);
    throw new Error('Failed to add vendor contact');
  }
}

/**
 * Update vendor contact
 */
export async function updateVendorContact(
  vendorId: string,
  contactId: string,
  updates: Partial<VendorContact>
): Promise<void> {
  try {
    const vendor = await getVendorById(vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const contacts = vendor.contacts.map((c) => (c.id === contactId ? { ...c, ...updates } : c));

    const docRef = doc(db, VENDORS_COLLECTION, vendorId);
    await updateDoc(docRef, {
      contacts,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error updating vendor contact', error as Error);
    throw new Error('Failed to update vendor contact');
  }
}

/**
 * Remove vendor contact
 */
export async function removeVendorContact(vendorId: string, contactId: string): Promise<void> {
  try {
    const vendor = await getVendorById(vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const contacts = vendor.contacts.filter((c) => c.id !== contactId);

    const docRef = doc(db, VENDORS_COLLECTION, vendorId);
    await updateDoc(docRef, {
      contacts,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error removing vendor contact', error as Error);
    throw new Error('Failed to remove vendor contact');
  }
}

// ============================================================================
// VENDOR BANK ACCOUNTS MANAGEMENT
// ============================================================================

/**
 * Add bank account to vendor
 */
export async function addVendorBankAccount(
  vendorId: string,
  bankAccount: Omit<VendorBankAccount, 'id'>
): Promise<void> {
  try {
    const vendor = await getVendorById(vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const newAccount: VendorBankAccount = {
      ...bankAccount,
      id: `bank_${Date.now()}`,
    };

    const docRef = doc(db, VENDORS_COLLECTION, vendorId);
    await updateDoc(docRef, {
      bankAccounts: [...vendor.bankAccounts, newAccount],
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error adding bank account', error as Error);
    throw new Error('Failed to add bank account');
  }
}

// ============================================================================
// PERFORMANCE TRACKING
// ============================================================================

/**
 * Update vendor performance metrics
 * Called automatically when PO/GR is created/updated
 */
export async function updateVendorPerformance(
  vendorId: string,
  updates: Partial<VendorPerformance>
): Promise<void> {
  try {
    const vendor = await getVendorById(vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const performance = {
      ...vendor.performance,
      ...updates,
    };

    // Recalculate rates
    if (performance.totalPOs > 0) {
      performance.onTimeDeliveryRate =
        (performance.onTimeDeliveries /
          (performance.onTimeDeliveries + performance.lateDeliveries)) *
        100;
    }

    if (performance.totalGRs > 0) {
      performance.qualityAcceptanceRate = (performance.acceptedGRs / performance.totalGRs) * 100;
    }

    // Calculate overall performance score (weighted)
    performance.performanceScore = calculatePerformanceScore(performance);

    // Determine risk level
    performance.riskLevel = determineRiskLevel(performance);

    const docRef = doc(db, VENDORS_COLLECTION, vendorId);
    await updateDoc(docRef, {
      performance,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error updating vendor performance', error as Error);
    throw new Error('Failed to update vendor performance');
  }
}

/**
 * Calculate weighted performance score
 */
function calculatePerformanceScore(performance: VendorPerformance): number {
  const weights = {
    onTimeDelivery: 0.3,
    qualityAcceptance: 0.3,
    evaluation: 0.25,
    financial: 0.15,
  };

  const onTimeScore = performance.onTimeDeliveryRate || 0;
  const qualityScore = performance.qualityAcceptanceRate || 0;
  const evalScore = performance.averageEvaluationScore || 0;
  const financialScore = 100 - Math.min(performance.averagePaymentDelay * 2, 50); // Penalty for delays

  return (
    onTimeScore * weights.onTimeDelivery +
    qualityScore * weights.qualityAcceptance +
    evalScore * weights.evaluation +
    financialScore * weights.financial
  );
}

/**
 * Determine risk level based on performance
 */
function determineRiskLevel(performance: VendorPerformance): 'low' | 'medium' | 'high' {
  if (performance.performanceScore >= 80) return 'low';
  if (performance.performanceScore >= 60) return 'medium';
  return 'high';
}

// ============================================================================
// VENDOR EVALUATION
// ============================================================================

/**
 * Create vendor evaluation
 */
export async function createVendorEvaluation(
  input: CreateEvaluationInput,
  userId: string,
  userName: string
): Promise<VendorEvaluation> {
  try {
    // Calculate average score
    const scores = input.scores;
    const averageScore =
      (scores.quality +
        scores.delivery +
        scores.price +
        scores.communication +
        scores.documentation +
        scores.compliance) /
      6;

    // Determine rating
    let rating: PerformanceRating;
    if (averageScore >= 90) rating = 'excellent';
    else if (averageScore >= 75) rating = 'good';
    else if (averageScore >= 60) rating = 'satisfactory';
    else rating = 'poor';

    const evaluation: Omit<VendorEvaluation, 'id'> = {
      vendorId: input.vendorId,
      projectId: input.projectId,
      evaluationDate: new Date().toISOString(),
      evaluatedBy: userId,
      evaluatorName: userName,
      scores: input.scores,
      averageScore,
      rating,
      strengths: input.strengths,
      weaknesses: input.weaknesses,
      recommendations: input.recommendations,
      poId: input.poId,
      grId: input.grId,
    };

    const docRef = await addDoc(collection(db, EVALUATIONS_COLLECTION), evaluation);

    // Update vendor's overall rating and performance
    await updateVendorAfterEvaluation(input.vendorId, averageScore, rating);

    return {
      id: docRef.id,
      ...evaluation,
    };
  } catch (error) {
    logger.error('Error creating vendor evaluation', error as Error);
    throw new Error('Failed to create vendor evaluation');
  }
}

/**
 * Update vendor after new evaluation
 */
async function updateVendorAfterEvaluation(
  vendorId: string,
  newScore: number,
  newRating: PerformanceRating
): Promise<void> {
  const vendor = await getVendorById(vendorId);
  if (!vendor) return;

  const totalEvals = vendor.performance.totalEvaluations + 1;
  const currentAvg = vendor.performance.averageEvaluationScore || 0;
  const newAvg = (currentAvg * vendor.performance.totalEvaluations + newScore) / totalEvals;

  await updateVendorPerformance(vendorId, {
    totalEvaluations: totalEvals,
    averageEvaluationScore: newAvg,
    latestRating: newRating,
    lastEvaluationDate: new Date().toISOString(),
  });

  await updateDoc(doc(db, VENDORS_COLLECTION, vendorId), {
    overallRating: newRating,
    lastEvaluationDate: new Date().toISOString(),
  });
}

/**
 * Get vendor evaluations
 */
export async function getVendorEvaluations(vendorId: string): Promise<VendorEvaluation[]> {
  try {
    const q = query(
      collection(db, EVALUATIONS_COLLECTION),
      where('vendorId', '==', vendorId),
      orderBy('evaluationDate', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as VendorEvaluation[];
  } catch (error) {
    logger.error('Error getting vendor evaluations', error as Error);
    throw new Error('Failed to get vendor evaluations');
  }
}

// ============================================================================
// BLACKLIST MANAGEMENT
// ============================================================================

/**
 * Blacklist vendor
 */
export async function blacklistVendor(
  input: CreateBlacklistInput,
  userId: string,
  userName: string
): Promise<VendorBlacklist> {
  try {
    const blacklist: Omit<VendorBlacklist, 'id'> = {
      vendorId: input.vendorId,
      projectId: input.projectId,
      blacklistedBy: userId,
      blacklistedByName: userName,
      blacklistedAt: new Date().toISOString(),
      reason: input.reason,
      category: input.category,
      severity: input.severity,
      effectiveFrom: input.effectiveFrom,
      effectiveUntil: input.effectiveUntil,
      isActive: true,
      attachments: input.attachments || [],
    };

    const docRef = await addDoc(collection(db, BLACKLIST_COLLECTION), blacklist);

    // Update vendor status
    const vendor = await getVendorById(input.vendorId);
    if (vendor) {
      await updateDoc(doc(db, VENDORS_COLLECTION, input.vendorId), {
        isBlacklisted: true,
        status: 'blacklisted',
        blacklistRecords: [...vendor.blacklistRecords, { id: docRef.id, ...blacklist }],
      });

      // Log vendor blacklisting
      await auditHelper.logCustom({
        action: `Vendor blacklisted: ${input.reason}`,
        actionType: 'update',
        actionCategory: 'security',
        module: 'procurement',
        entityType: 'vendor',
        entityId: input.vendorId,
        entityName: vendor.vendorName,
        beforeSnapshot: { isBlacklisted: false, status: vendor.status },
        afterSnapshot: { isBlacklisted: true, status: 'blacklisted' },
        subModule: 'blacklist_management',
        metadata: {
          vendorCode: vendor.vendorCode,
          blacklistReason: input.reason,
          blacklistCategory: input.category,
          severity: input.severity,
          effectiveFrom: input.effectiveFrom,
          effectiveUntil: input.effectiveUntil,
        },
      });
    }

    return {
      id: docRef.id,
      ...blacklist,
    };
  } catch (error) {
    logger.error('Error blacklisting vendor', error as Error);
    throw new Error('Failed to blacklist vendor');
  }
}

/**
 * Remove from blacklist
 */
export async function removeFromBlacklist(
  blacklistId: string,
  vendorId: string,
  userId: string,
  reviewNotes: string
): Promise<void> {
  try {
    // Update blacklist record
    await updateDoc(doc(db, BLACKLIST_COLLECTION, blacklistId), {
      isActive: false,
      reviewedBy: userId,
      reviewedAt: new Date().toISOString(),
      reviewNotes,
    });

    // Check if vendor has other active blacklists
    const vendor = await getVendorById(vendorId);
    if (!vendor) return;

    const hasOtherActiveBlacklists = vendor.blacklistRecords.some(
      (bl) => bl.id !== blacklistId && bl.isActive
    );

    if (!hasOtherActiveBlacklists) {
      await updateDoc(doc(db, VENDORS_COLLECTION, vendorId), {
        isBlacklisted: false,
        status: 'active',
      });
    }
  } catch (error) {
    logger.error('Error removing from blacklist', error as Error);
    throw new Error('Failed to remove from blacklist');
  }
}

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

/**
 * Get vendor summary statistics
 */
export async function getVendorSummary(): Promise<VendorSummary> {
  try {
    const vendors = await getVendors();

    const summary: VendorSummary = {
      totalVendors: vendors.length,
      activeVendors: vendors.filter((v) => v.status === 'active').length,
      blacklistedVendors: vendors.filter((v) => v.isBlacklisted).length,
      underReviewVendors: vendors.filter((v) => v.status === 'under_review').length,

      byCategory: {
        materials: 0,
        equipment: 0,
        services: 0,
        subcontractor: 0,
        labor: 0,
        rental: 0,
        consultant: 0,
        other: 0,
      },

      byRating: {
        excellent: 0,
        good: 0,
        satisfactory: 0,
        poor: 0,
        not_rated: 0,
      },

      totalPOValue: 0,
      averagePerformanceScore: 0,
      averageOnTimeDeliveryRate: 0,
      averageQualityAcceptanceRate: 0,

      topVendors: [],
      recentEvaluations: 0,
      pendingApprovals: vendors.filter((v) => v.status === 'pending_approval').length,
    };

    // Calculate category and rating distributions
    vendors.forEach((v) => {
      summary.byCategory[v.category]++;
      summary.byRating[v.overallRating]++;
      summary.totalPOValue += v.performance.totalPOValue;
    });

    // Calculate averages
    const activeVendorsWithPerf = vendors.filter(
      (v) => v.status === 'active' && v.performance.totalPOs > 0
    );
    if (activeVendorsWithPerf.length > 0) {
      summary.averagePerformanceScore =
        activeVendorsWithPerf.reduce((sum, v) => sum + v.performance.performanceScore, 0) /
        activeVendorsWithPerf.length;
      summary.averageOnTimeDeliveryRate =
        activeVendorsWithPerf.reduce((sum, v) => sum + v.performance.onTimeDeliveryRate, 0) /
        activeVendorsWithPerf.length;
      summary.averageQualityAcceptanceRate =
        activeVendorsWithPerf.reduce((sum, v) => sum + v.performance.qualityAcceptanceRate, 0) /
        activeVendorsWithPerf.length;
    }

    // Top vendors by performance
    summary.topVendors = vendors
      .filter((v) => v.status === 'active')
      .sort((a, b) => b.performance.performanceScore - a.performance.performanceScore)
      .slice(0, 5)
      .map((v) => ({
        vendorId: v.id,
        vendorName: v.vendorName,
        performanceScore: v.performance.performanceScore,
        totalPOValue: v.performance.totalPOValue,
      }));

    return summary;
  } catch (error) {
    logger.error('Error getting vendor summary', error as Error);
    throw new Error('Failed to get vendor summary');
  }
}

/**
 * Search vendors by name or code
 */
export async function searchVendors(searchTerm: string): Promise<Vendor[]> {
  try {
    const vendors = await getVendors();
    const term = searchTerm.toLowerCase();

    return vendors.filter(
      (v) =>
        v.vendorName.toLowerCase().includes(term) ||
        v.vendorCode.toLowerCase().includes(term) ||
        v.legalName.toLowerCase().includes(term) ||
        v.taxId.toLowerCase().includes(term)
    );
  } catch (error) {
    logger.error('Error searching vendors', error as Error);
    throw new Error('Failed to search vendors');
  }
}

// ============================================================================
// PO INTEGRATION
// ============================================================================

/**
 * Get all Purchase Orders for a specific vendor
 */
export async function getVendorPurchaseOrders(
  vendorId: string,
  statusFilter?: Array<
    | 'Menunggu Persetujuan'
    | 'Disetujui'
    | 'Ditolak'
    | 'PO Dibuat'
    | 'Dipesan'
    | 'Diterima Sebagian'
    | 'Diterima Penuh'
  >
): Promise<any[]> {
  try {
    // Query all projects' purchase orders that have this vendorId
    const projectsSnapshot = await getDocs(collection(db, 'projects'));
    const allPOs: any[] = [];

    for (const projectDoc of projectsSnapshot.docs) {
      const projectId = projectDoc.id;

      // Query POs for this project with vendorId
      const poQuery = query(
        collection(db, `projects/${projectId}/purchaseOrders`),
        where('vendorId', '==', vendorId)
      );

      const poSnapshot = await getDocs(poQuery);

      poSnapshot.forEach((doc) => {
        const poData = doc.data();
        const po = { id: doc.id, projectId, ...poData };

        // Filter by status if provided
        if (!statusFilter || statusFilter.includes(poData.status as any)) {
          allPOs.push(po);
        }
      });
    }

    return allPOs;
  } catch (error) {
    logger.error('Error getting vendor purchase orders', error as Error);
    return [];
  }
}

/**
 * Get vendor statistics including PO count and total value
 */
export async function getVendorStatistics(vendorId: string): Promise<{
  totalPOs: number;
  activePOs: number;
  completedPOs: number;
  totalValue: number;
  averagePOValue: number;
  pendingValue: number;
}> {
  try {
    const allPOs = await getVendorPurchaseOrders(vendorId);

    const activePOs = allPOs.filter((po) =>
      ['Menunggu Persetujuan', 'Disetujui', 'PO Dibuat', 'Dipesan'].includes(po.status)
    );

    const completedPOs = allPOs.filter((po) => ['Diterima Penuh'].includes(po.status));

    const totalValue = allPOs.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
    const pendingValue = activePOs.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
    const averagePOValue = allPOs.length > 0 ? totalValue / allPOs.length : 0;

    return {
      totalPOs: allPOs.length,
      activePOs: activePOs.length,
      completedPOs: completedPOs.length,
      totalValue,
      averagePOValue,
      pendingValue,
    };
  } catch (error) {
    logger.error('Error getting vendor statistics', error as Error);
    return {
      totalPOs: 0,
      activePOs: 0,
      completedPOs: 0,
      totalValue: 0,
      averagePOValue: 0,
      pendingValue: 0,
    };
  }
}

/**
 * Link existing PO to vendor (retroactive linking)
 */
export async function linkPOToVendor(
  projectId: string,
  poId: string,
  vendorId: string
): Promise<void> {
  try {
    const poRef = doc(db, `projects/${projectId}/purchaseOrders`, poId);
    const vendorRef = doc(db, VENDORS_COLLECTION, vendorId);

    // ✅ OPTIMIZATION: Batch read - fetch both documents in parallel
    const [poDoc, vendorDoc] = await Promise.all([
      getDoc(poRef),
      getDoc(vendorRef)
    ]);

    if (!poDoc.exists()) {
      throw new Error('Purchase Order not found');
    }

    if (!vendorDoc.exists()) {
      throw new Error('Vendor not found');
    }

    const vendorData = vendorDoc.data();

    await updateDoc(poRef, {
      vendorId,
      vendorName: vendorData.vendorName,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error linking PO to vendor', error as Error);
    throw error;
  }
}
