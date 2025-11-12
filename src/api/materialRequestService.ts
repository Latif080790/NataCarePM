/**
 * MATERIAL REQUEST SERVICE
 *
 * Comprehensive service layer for Material Request (MR) operations including:
 * - MR CRUD operations
 * - Multi-level approval workflow (Site Manager → PM → Budget Check → Final Approval)
 * - Inventory stock checking
 * - Budget verification via WBS
 * - MR to PO conversion
 * - Real-time status tracking
 *
 * Created: October 2025
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import {
  MaterialRequest,
  MRItem,
  CreateMRInput,
  ApproveMRInput,
  ConvertMRtoPOInput,
  MRStatus,
  MRPriority,
} from '@/types/logistics';
import { PurchaseOrder, POItem } from '@/types';
import { auditHelper } from '@/utils/auditHelper';
import { getVendorById } from './vendorService';

// ============================================================================
// CONSTANTS
// ============================================================================

const MR_COLLECTION = 'materialRequests';
// const INVENTORY_COLLECTION = 'materials'; // Reserved for future inventory checking
const PO_COLLECTION = 'purchaseOrders';

// ============================================================================
// MR NUMBER GENERATION
// ============================================================================

/**
 * Generate unique MR number: MR-YYYYMMDD-XXXX
 */
async function generateMRNumber(projectId: string): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  // Get count of MRs created today for this project
  const q = query(
    collection(db, MR_COLLECTION),
    where('projectId', '==', projectId),
    where('requestedAt', '>=', today.toISOString().slice(0, 10))
  );

  const snapshot = await getDocs(q);
  const sequence = snapshot.size + 1;
  const sequenceStr = sequence.toString().padStart(4, '0');

  return `MR-${dateStr}-${sequenceStr}`;
}

// ============================================================================
// CREATE MR
// ============================================================================

/**
 * Create new Material Request
 */
export async function createMaterialRequest(
  input: CreateMRInput,
  userId: string,
  userName: string
): Promise<MaterialRequest> {
  try {
    // Generate MR number
    const mrNumber = await generateMRNumber(input.projectId);

    // Check inventory stock levels for each item
    const itemsWithStockCheck: MRItem[] = await Promise.all(
      input.items.map(async (item) => {
        const stockInfo = await checkInventoryStock(item.materialCode || '', input.projectId);

        return {
          id: `mri_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          mrId: '', // Will be set after doc creation
          materialCode: item.materialCode,
          materialName: item.materialName,
          description: item.description,
          specification: item.description, // Use description as spec
          quantity: item.quantity,
          requestedQty: item.quantity, // Alias
          unit: item.unit,
          wbsElementId: item.wbsElementId,
          wbsCode: item.wbsElementId, // Alias
          estimatedUnitPrice: item.estimatedUnitPrice,
          estimatedTotalPrice: item.quantity * item.estimatedUnitPrice,
          estimatedTotal: item.quantity * item.estimatedUnitPrice, // Alias
          currentStock: stockInfo.currentStock,
          reorderPoint: stockInfo.reorderPoint,
          stockStatus: stockInfo.stockStatus,
          justification: item.justification,
          urgencyReason: item.urgencyReason,
          notes: item.urgencyReason, // Use urgencyReason as notes
          convertedToPO: false,
        };
      })
    );

    // Calculate totals
    const totalItems = itemsWithStockCheck.length;
    const totalEstimatedValue = itemsWithStockCheck.reduce(
      (sum, item) => sum + item.estimatedTotalPrice,
      0
    );

    // Create MR document
    const newMR: Omit<MaterialRequest, 'id'> = {
      mrNumber,
      projectId: input.projectId,
      status: 'draft',
      priority: input.priority,
      requiredDate: input.requiredDate,
      purpose: input.purpose,
      createdAt: new Date().toISOString(),
      items: itemsWithStockCheck,
      totalItems,
      totalEstimatedValue,
      requestedBy: userId,
      requestedAt: new Date().toISOString(),
      convertedToPO: false,
      poIds: [],
      attachments: [],
      remarks: input.remarks,
    };

    // Save to Firestore
    const docRef = await addDoc(collection(db, MR_COLLECTION), newMR);

    // Update items with mrId
    const updatedItems = itemsWithStockCheck.map((item) => ({
      ...item,
      mrId: docRef.id,
    }));

    await updateDoc(docRef, {
      items: updatedItems,
    });

    const createdMR = {
      id: docRef.id,
      ...newMR,
      items: updatedItems,
    };

    // Enhanced audit logging
    await auditHelper.logCreate({
      module: 'logistics',
      entityType: 'material_request',
      entityId: docRef.id,
      entityName: mrNumber,
      newData: {
        mrNumber,
        projectId: input.projectId,
        status: 'draft',
        priority: input.priority,
        requiredDate: input.requiredDate,
        totalItems,
        totalEstimatedValue,
      },
      metadata: {
        purpose: input.purpose,
        requestedBy: userName,
        itemsCount: totalItems,
      },
    });

    return createdMR;
  } catch (error) {
    console.error('Error creating material request:', error);
    throw error;
  }
}

// ============================================================================
// INVENTORY STOCK CHECK
// ============================================================================

/**
 * Check inventory stock for a material
 */
async function checkInventoryStock(
  materialCode: string,
  _projectId: string  // Reserved for future multi-project inventory support
): Promise<{
  currentStock: number;
  reorderPoint: number;
  stockStatus: 'sufficient' | 'low' | 'out_of_stock';
}> {
  try {
    if (!materialCode) {
      return {
        currentStock: 0,
        reorderPoint: 0,
        stockStatus: 'out_of_stock',
      };
    }

    // ✅ IMPLEMENTATION: Query actual inventory collection
    const inventoryQuery = query(
      collection(db, 'inventory_materials'),
      where('materialCode', '==', materialCode),
      where('projectId', '==', _projectId)
    );

    const querySnapshot = await getDocs(inventoryQuery);

    if (querySnapshot.empty) {
      // Material not found in inventory
      return {
        currentStock: 0,
        reorderPoint: 0,
        stockStatus: 'out_of_stock',
      };
    }

    // Get first matching material
    const inventoryDoc = querySnapshot.docs[0];
    const inventoryData = inventoryDoc.data();

    const currentStock = inventoryData.availableStock || inventoryData.currentStock || 0;
    const reorderPoint = inventoryData.minimumStock || inventoryData.reorderPoint || 10;

    let stockStatus: 'sufficient' | 'low' | 'out_of_stock';
    if (currentStock === 0) {
      stockStatus = 'out_of_stock';
    } else if (currentStock <= reorderPoint) {
      stockStatus = 'low';
    } else {
      stockStatus = 'sufficient';
    }

    return { currentStock, reorderPoint, stockStatus };
  } catch (error) {
    console.error('Error checking inventory stock:', error);
    return {
      currentStock: 0,
      reorderPoint: 0,
      stockStatus: 'out_of_stock',
    };
  }
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Get single MR by ID
 */
export async function getMaterialRequestById(mrId: string): Promise<MaterialRequest | null> {
  try {
    const docRef = doc(db, MR_COLLECTION, mrId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as MaterialRequest;
  } catch (error) {
    console.error('Error fetching material request:', error);
    throw error;
  }
}

/**
 * Get all MRs for a project
 */
export async function getMaterialRequests(
  projectId: string,
  filters?: {
    status?: MRStatus[];
    priority?: MRPriority[];
    requestedBy?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<MaterialRequest[]> {
  try {
    const q = query(
      collection(db, MR_COLLECTION),
      where('projectId', '==', projectId),
      orderBy('requestedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    let results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as MaterialRequest[];

    // Apply filters
    if (filters?.status && filters.status.length > 0) {
      results = results.filter((mr) => filters.status!.includes(mr.status));
    }

    if (filters?.priority && filters.priority.length > 0) {
      results = results.filter((mr) => filters.priority!.includes(mr.priority));
    }

    if (filters?.requestedBy) {
      results = results.filter((mr) => mr.requestedBy === filters.requestedBy);
    }

    if (filters?.dateFrom) {
      results = results.filter((mr) => mr.requestedAt >= filters.dateFrom!);
    }

    if (filters?.dateTo) {
      results = results.filter((mr) => mr.requestedAt <= filters.dateTo!);
    }

    return results;
  } catch (error) {
    console.error('Error fetching material requests:', error);
    throw error;
  }
}

/**
 * Get MRs pending approval for specific user
 */
export async function getPendingApprovals(
  _userId: string,  // Reserved for future user-specific filtering
  role: 'site_manager' | 'pm' | 'budget_controller'
): Promise<MaterialRequest[]> {
  try {
    let statusFilter: MRStatus;

    switch (role) {
      case 'site_manager':
        statusFilter = 'site_manager_review';
        break;
      case 'pm':
        statusFilter = 'pm_review';
        break;
      case 'budget_controller':
        statusFilter = 'budget_check';
        break;
      default:
        return [];
    }

    const q = query(
      collection(db, MR_COLLECTION),
      where('status', '==', statusFilter),
      orderBy('requestedAt', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as MaterialRequest[];
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    throw error;
  }
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update MR (only in draft status)
 */
export async function updateMaterialRequest(
  mrId: string,
  updates: Partial<CreateMRInput>
): Promise<void> {
  try {
    const mr = await getMaterialRequestById(mrId);
    if (!mr) {
      throw new Error('Material Request not found');
    }

    if (mr.status !== 'draft') {
      throw new Error('Can only update MR in draft status');
    }

    const docRef = doc(db, MR_COLLECTION, mrId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    // Enhanced audit logging
    await auditHelper.logUpdate({
      module: 'logistics',
      entityType: 'material_request',
      entityId: mrId,
      entityName: mr.mrNumber,
      oldData: {
        priority: mr.priority,
        requiredDate: mr.requiredDate,
        purpose: mr.purpose,
        totalItems: mr.totalItems,
      },
      newData: {
        priority: updates.priority || mr.priority,
        requiredDate: updates.requiredDate || mr.requiredDate,
        purpose: updates.purpose || mr.purpose,
        totalItems: updates.items?.length || mr.totalItems,
      },
      metadata: {
        mrNumber: mr.mrNumber,
        updatedFields: Object.keys(updates),
      },
    });
  } catch (error) {
    console.error('Error updating material request:', error);
    throw error;
  }
}

// ============================================================================
// WORKFLOW: SUBMIT MR
// ============================================================================

/**
 * Submit MR for approval workflow
 */
export async function submitMaterialRequest(mrId: string, userId: string): Promise<void> {
  try {
    const mr = await getMaterialRequestById(mrId);
    if (!mr) {
      throw new Error('Material Request not found');
    }

    if (mr.status !== 'draft') {
      throw new Error('Can only submit MR in draft status');
    }

    // Validate MR has items
    if (mr.items.length === 0) {
      throw new Error('Cannot submit MR without items');
    }

    // Start approval workflow - first go to Site Manager
    const docRef = doc(db, MR_COLLECTION, mrId);
    await updateDoc(docRef, {
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      submittedBy: userId,
    });

    // If no site manager required, go directly to PM review
    // For now, always start with site_manager_review
    await updateDoc(docRef, {
      status: 'site_manager_review',
    });
  } catch (error) {
    console.error('Error submitting material request:', error);
    throw error;
  }
}

// ============================================================================
// WORKFLOW: APPROVAL
// ============================================================================

/**
 * Approve or reject MR at any approval stage
 */
export async function approveMaterialRequest(
  input: ApproveMRInput,
  approverId: string,
  _approverName: string  // Reserved for future audit logging
): Promise<void> {
  try {
    const mr = await getMaterialRequestById(input.mrId);
    if (!mr) {
      throw new Error('Material Request not found');
    }

    const docRef = doc(db, MR_COLLECTION, input.mrId);
    const now = new Date().toISOString();

    // Handle rejection
    if (!input.approved) {
      await updateDoc(docRef, {
        status: 'rejected',
        rejectedBy: approverId,
        rejectedAt: now,
        rejectionReason: input.notes,
      });

      // Enhanced audit logging for rejection
      await auditHelper.logApproval({
        module: 'logistics',
        entityType: 'material_request',
        entityId: input.mrId,
        entityName: mr.mrNumber,
        approvalStage: input.approverRole || 'unknown',
        decision: 'rejected',
        comments: input.notes,
        oldStatus: mr.status,
        newStatus: 'rejected',
        metadata: {
          mrNumber: mr.mrNumber,
          totalEstimatedValue: mr.totalEstimatedValue,
          rejectionReason: input.notes,
        },
      });

      return;
    }

    // Determine new status based on approver role
    let newStatus: MRStatus = mr.status;
    switch (input.approverRole) {
      case 'site_manager':
        newStatus = 'pm_review';
        break;
      case 'pm':
        newStatus = 'budget_check';
        break;
      case 'budget_controller':
        // Will be set after budget check
        break;
      case 'final_approver':
        newStatus = 'approved';
        break;
    }

    // Handle approval at each stage
    switch (input.approverRole) {
      case 'site_manager':
        await updateDoc(docRef, {
          siteManagerId: approverId,
          siteManagerApprovedAt: now,
          siteManagerNotes: input.notes,
          status: 'pm_review', // Move to next stage
        });
        break;

      case 'pm':
        await updateDoc(docRef, {
          pmId: approverId,
          pmApprovedAt: now,
          pmNotes: input.notes,
          status: 'budget_check', // Move to budget verification
        });
        break;

      case 'budget_controller':
        // Check budget availability via WBS
        const budgetStatus = await checkBudgetAvailability(mr);

        newStatus = budgetStatus.status === 'sufficient' ? 'approved' : 'rejected';

        await updateDoc(docRef, {
          budgetCheckedBy: approverId,
          budgetCheckedAt: now,
          budgetStatus: budgetStatus.status,
          budgetNotes: `${input.notes}\n\nBudget Analysis: ${budgetStatus.message}`,
          status: newStatus,
        });
        break;

      case 'final_approver':
        await updateDoc(docRef, {
          finalApprovedBy: approverId,
          finalApprovedAt: now,
          status: 'approved',
        });
        break;

      default:
        throw new Error(`Invalid approver role: ${input.approverRole}`);
    }

    // Enhanced audit logging for approval
    await auditHelper.logApproval({
      module: 'logistics',
      entityType: 'material_request',
      entityId: input.mrId,
      entityName: mr.mrNumber,
      approvalStage: input.approverRole || 'unknown',
      decision: 'approved',
      comments: input.notes,
      oldStatus: mr.status,
      newStatus,
      metadata: {
        mrNumber: mr.mrNumber,
        totalEstimatedValue: mr.totalEstimatedValue,
        approverRole: input.approverRole,
        approvalNotes: input.notes,
      },
    });
  } catch (error) {
    console.error('Error approving material request:', error);
    throw error;
  }
}

// ============================================================================
// BUDGET VERIFICATION
// ============================================================================

/**
 * Check budget availability for MR items via WBS
 */
export async function checkBudgetAvailability(mr: MaterialRequest): Promise<{
  status: 'sufficient' | 'insufficient' | 'needs_reallocation';
  message: string;
  details?: {
    totalRequired: number;
    totalAvailable: number;
    wbsBreakdown: Array<{
      wbsCode: string;
      wbsName: string;
      required: number;
      available: number;
      status: string;
    }>;
  };
}> {
  try {
    // Get WBS data from cost control service
    const { getWBSBudgetStatus } = await import('./costControlService');

    // Group MR items by WBS code
    const wbsMap = new Map<string, number>();
    mr.items.forEach((item) => {
      if (item.wbsCode) {
        const current = wbsMap.get(item.wbsCode) || 0;
        wbsMap.set(item.wbsCode, current + item.requestedQty * item.estimatedUnitPrice);
      }
    });

    const totalRequired = mr.totalEstimatedValue;
    let totalAvailable = 0;
    const wbsBreakdown = [];
    let allSufficient = true;
    let needsReallocation = false;

    // Check each WBS element
    for (const [wbsCode, requiredAmount] of wbsMap.entries()) {
      try {
        const wbsStatus = await getWBSBudgetStatus(mr.projectId, wbsCode);

        if (wbsStatus) {
          const available = wbsStatus.remainingBudget || 0;
          totalAvailable += available;

          let status = 'sufficient';
          if (available < requiredAmount) {
            status = 'insufficient';
            allSufficient = false;
          } else if (available < requiredAmount * 1.2) {
            status = 'tight';
            needsReallocation = true;
          }

          wbsBreakdown.push({
            wbsCode,
            wbsName: wbsStatus.wbsName || wbsCode,
            required: requiredAmount,
            available,
            status,
          });
        } else {
          // WBS not found - assume insufficient
          allSufficient = false;
          wbsBreakdown.push({
            wbsCode,
            wbsName: wbsCode,
            required: requiredAmount,
            available: 0,
            status: 'not_found',
          });
        }
      } catch (error) {
        console.error(`Error checking WBS ${wbsCode}:`, error);
        allSufficient = false;
      }
    }

    // Determine overall status
    let status: 'sufficient' | 'insufficient' | 'needs_reallocation';
    let message: string;

    if (wbsBreakdown.length === 0) {
      // No WBS codes assigned - cannot check budget
      status = 'needs_reallocation';
      message = 'No WBS codes assigned to MR items. Budget check cannot be performed.';
    } else if (allSufficient && !needsReallocation) {
      status = 'sufficient';
      message = `Budget sufficient across all WBS elements. Required: $${totalRequired.toFixed(2)}, Available: $${totalAvailable.toFixed(2)}`;
    } else if (needsReallocation && !allSufficient) {
      status = 'insufficient';
      message = `Budget insufficient. Required: $${totalRequired.toFixed(2)}, Available: $${totalAvailable.toFixed(2)}. Some WBS elements exceed budget.`;
    } else if (needsReallocation) {
      status = 'needs_reallocation';
      message = `Budget tight. May need reallocation. Required: $${totalRequired.toFixed(2)}, Available: $${totalAvailable.toFixed(2)}`;
    } else {
      status = 'insufficient';
      message = `Budget insufficient. Required: $${totalRequired.toFixed(2)}, Available: $${totalAvailable.toFixed(2)}`;
    }

    return {
      status,
      message,
      details: {
        totalRequired,
        totalAvailable,
        wbsBreakdown,
      },
    };
  } catch (error) {
    console.error('Error checking budget:', error);
    return {
      status: 'insufficient',
      message: 'Error checking budget availability. Please try again.',
    };
  }
}

// ============================================================================
// MR TO PO CONVERSION
// ============================================================================

/**
 * Convert approved MR to Purchase Order
 */
export async function convertMRtoPO(
  input: ConvertMRtoPOInput,
  userId: string
): Promise<PurchaseOrder> {
  try {
    const mr = await getMaterialRequestById(input.mrId);
    if (!mr) {
      throw new Error('Material Request not found');
    }

    if (mr.status !== 'approved') {
      throw new Error('Can only convert approved MR to PO');
    }

    // Create PO items from MR items
    const poItems: POItem[] = input.itemMappings.map((mapping) => {
      const mrItem = mr.items.find((item) => item.id === mapping.mrItemId);
      if (!mrItem) {
        throw new Error(`MR item not found: ${mapping.mrItemId}`);
      }

      return {
        id: `poi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        materialCode: mrItem.materialCode,
        materialName: mrItem.materialName,
        description: mrItem.description,
        quantity: mapping.finalQuantity,
        unit: mrItem.unit,
        pricePerUnit: mapping.finalUnitPrice,
        unitPrice: mapping.finalUnitPrice,
        totalPrice: mapping.finalQuantity * mapping.finalUnitPrice,
        receivedQuantity: 0,
        status: 'pending',
      };
    });

    // Calculate total
    const totalAmount = poItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // ✅ IMPLEMENTATION: Fetch vendor data from vendorService
    let vendorName = '';
    try {
      const vendor = await getVendorById(input.vendorId);
      vendorName = vendor?.vendorName || '';
    } catch (error) {
      console.warn('Failed to fetch vendor name:', error);
      // Continue with empty vendor name
    }

    // Create PO
    const newPO: Omit<PurchaseOrder, 'id'> = {
      prNumber: mr.mrNumber, // Link to MR
      poNumber: `PO-${mr.mrNumber.replace('MR-', '')}`,
      status: 'PO Dibuat',
      items: poItems,
      requester: mr.requestedBy,
      requestDate: mr.requestedAt,
      vendorId: input.vendorId,
      vendorName,
      totalAmount,
      wbsElementId: mr.items[0]?.wbsElementId, // Use first item's WBS
      grnStatus: 'Belum Diterima',
      notes: `Converted from Material Request: ${mr.mrNumber}\n${input.terms || ''}`,
    };

    // Save PO
    const poRef = await addDoc(collection(db, PO_COLLECTION), newPO);

    // Update MR items as converted
    const updatedItems = mr.items.map((item) => ({
      ...item,
      convertedToPO: true,
      poId: poRef.id,
      poItemId: poItems.find((poi) => poi.materialCode === item.materialCode)?.id,
    }));

    // Update MR status
    const mrRef = doc(db, MR_COLLECTION, input.mrId);
    await updateDoc(mrRef, {
      status: 'converted_to_po',
      convertedToPO: true,
      poIds: [...mr.poIds, poRef.id],
      items: updatedItems,
      convertedAt: new Date().toISOString(),
      convertedBy: userId,
    });

    const createdPO = {
      id: poRef.id,
      ...newPO,
    };

    // Enhanced audit logging
    await auditHelper.logStatusChange({
      module: 'logistics',
      entityType: 'material_request',
      entityId: input.mrId,
      entityName: mr.mrNumber,
      oldStatus: 'approved',
      newStatus: 'converted_to_po',
      metadata: {
        mrNumber: mr.mrNumber,
        poNumber: newPO.poNumber,
        poId: poRef.id,
        vendorId: input.vendorId,
        totalAmount,
        itemsCount: poItems.length,
        convertedBy: userId,
      },
    });

    return createdPO;
  } catch (error) {
    console.error('Error converting MR to PO:', error);
    throw error;
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate MR before submission
 */
export function validateMaterialRequest(mr: Partial<MaterialRequest>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check items
  if (!mr.items || mr.items.length === 0) {
    errors.push('MR must have at least one item');
  }

  // Check required date
  if (mr.requiredDate) {
    const reqDate = new Date(mr.requiredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reqDate < today) {
      errors.push('Required date cannot be in the past');
    }

    // Warn if very urgent (less than 3 days)
    const daysUntilRequired = Math.ceil(
      (reqDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilRequired < 3 && mr.priority !== 'urgent') {
      warnings.push(
        `Required date is in ${daysUntilRequired} days. Consider setting priority to 'urgent'.`
      );
    }
  }

  // Check quantities
  mr.items?.forEach((item, index) => {
    if (item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
    }

    if (!item.justification || item.justification.trim() === '') {
      warnings.push(`Item ${index + 1}: Justification is recommended`);
    }

    // Check stock status
    if (item.stockStatus === 'sufficient' && mr.priority !== 'urgent') {
      warnings.push(
        `Item ${index + 1}: Stock is sufficient (${item.currentStock} ${item.unit}). ` +
          `Consider using existing stock first.`
      );
    }
  });

  // Check budget allocation
  mr.items?.forEach((item, index) => {
    if (!item.wbsElementId) {
      warnings.push(`Item ${index + 1}: No WBS element assigned for budget tracking`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// SUMMARY & STATISTICS
// ============================================================================

/**
 * Calculate MR summary statistics
 */
export async function getMRSummary(projectId: string): Promise<{
  totalMRs: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  convertedToPO: number;
  totalEstimatedValue: number;
  avgApprovalTime: number; // in hours
}> {
  try {
    const mrs = await getMaterialRequests(projectId);

    const totalMRs = mrs.length;
    const pendingApproval = mrs.filter((mr) =>
      ['submitted', 'site_manager_review', 'pm_review', 'budget_check'].includes(mr.status)
    ).length;
    const approved = mrs.filter((mr) => mr.status === 'approved').length;
    const rejected = mrs.filter((mr) => mr.status === 'rejected').length;
    const convertedToPO = mrs.filter((mr) => mr.convertedToPO).length;

    const totalEstimatedValue = mrs.reduce((sum, mr) => sum + mr.totalEstimatedValue, 0);

    // Calculate average approval time
    const approvedMRs = mrs.filter((mr) => mr.finalApprovedAt);
    const avgApprovalTime =
      approvedMRs.length > 0
        ? approvedMRs.reduce((sum, mr) => {
            const requested = new Date(mr.requestedAt).getTime();
            const approved = new Date(mr.finalApprovedAt!).getTime();
            return sum + (approved - requested) / (1000 * 60 * 60); // Convert to hours
          }, 0) / approvedMRs.length
        : 0;

    return {
      totalMRs,
      pendingApproval,
      approved,
      rejected,
      convertedToPO,
      totalEstimatedValue,
      avgApprovalTime,
    };
  } catch (error) {
    console.error('Error calculating MR summary:', error);
    throw error;
  }
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete MR (only in draft status)
 */
export async function deleteMaterialRequest(mrId: string): Promise<void> {
  try {
    const mr = await getMaterialRequestById(mrId);
    if (!mr) {
      throw new Error('Material Request not found');
    }

    if (mr.status !== 'draft') {
      throw new Error('Can only delete MR in draft status');
    }

    const docRef = doc(db, MR_COLLECTION, mrId);
    await deleteDoc(docRef);

    // Enhanced audit logging
    await auditHelper.logDelete({
      module: 'logistics',
      entityType: 'material_request',
      entityId: mrId,
      entityName: mr.mrNumber,
      oldData: {
        mrNumber: mr.mrNumber,
        status: mr.status,
        totalItems: mr.totalItems,
        totalEstimatedValue: mr.totalEstimatedValue,
        projectId: mr.projectId,
      },
      metadata: {
        reason: 'Draft MR deleted',
      },
    });
  } catch (error) {
    console.error('Error deleting material request:', error);
    throw error;
  }
}
