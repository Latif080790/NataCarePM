/**
 * GOODS RECEIPT SERVICE
 * 
 * Comprehensive service layer for Goods Receipt (GR) operations including:
 * - GR CRUD operations
 * - Quality inspection workflow
 * - Photo/document management
 * - Inventory integration
 * - PO status updates
 * - WBS actual cost allocation
 * - 3-way matching support
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
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { 
  GoodsReceipt, 
  GRItem, 
  CreateGRInput, 
  UpdateGRInput,
  InspectGRItemInput,
  GRStatus,
  QualityStatus,
  GRSummary,
  GRFilterOptions,
  GRValidationResult,
  GRInspectionPhoto
} from '../types/logistics';
import { PurchaseOrder } from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const GR_COLLECTION = 'goodsReceipts';
const PO_COLLECTION = 'purchaseOrders';
const INVENTORY_COLLECTION = 'inventoryTransactions';

// ============================================================================
// GR NUMBER GENERATION
// ============================================================================

/**
 * Generate unique GR number: GR-YYYYMMDD-XXXX
 */
async function generateGRNumber(projectId: string): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Get count of GRs created today for this project
  const q = query(
    collection(db, GR_COLLECTION),
    where('projectId', '==', projectId),
    where('createdAt', '>=', today.toISOString().slice(0, 10))
  );
  
  const snapshot = await getDocs(q);
  const sequence = snapshot.size + 1;
  const sequenceStr = sequence.toString().padStart(4, '0');
  
  return `GR-${dateStr}-${sequenceStr}`;
}

// ============================================================================
// CREATE GR FROM PO
// ============================================================================

/**
 * Create new Goods Receipt from Purchase Order
 */
export async function createGoodsReceipt(
  input: CreateGRInput,
  userId: string,
  userName: string
): Promise<GoodsReceipt> {
  try {
    // Fetch PO details
    const poDoc = await getDoc(doc(db, PO_COLLECTION, input.poId));
    if (!poDoc.exists()) {
      throw new Error('Purchase Order not found');
    }
    
    const po = { id: poDoc.id, ...poDoc.data() } as PurchaseOrder;
    
    // Validate PO status
    if (po.status === 'Ditolak') {
      throw new Error(`Cannot create GR for rejected PO`);
    }
    
    // Generate GR number
    const grNumber = await generateGRNumber(input.projectId);
    
    // Initialize GR items from PO items
    const grItems: GRItem[] = po.items.map((poItem, index) => {
      // Calculate previously received quantity
      // TODO: Sum quantities from existing GRs for this PO item
      const previouslyReceived = poItem.receivedQuantity || 0;
      
      // Generate unique item ID
      const itemId = poItem.id || `poi_${index}_${Date.now()}`;
      
      return {
        id: `gri_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        grId: '',  // Will be set after doc creation
        poItemId: itemId,
        materialCode: poItem.materialCode || '',
        materialName: poItem.description || poItem.materialName,
        
        // Quantities
        poQuantity: poItem.quantity,
        previouslyReceived,
        receivedQuantity: poItem.quantity - previouslyReceived,  // Default to remaining
        acceptedQuantity: 0,
        rejectedQuantity: 0,
        
        unit: poItem.unit,
        
        // Quality
        qualityStatus: 'pending',
        defectPhotos: [],
        
        // Pricing
        unitPrice: poItem.unitPrice || poItem.pricePerUnit,
        totalPrice: (poItem.quantity - previouslyReceived) * (poItem.unitPrice || poItem.pricePerUnit),
        
        // Variance
        quantityVariance: 0,
        variancePercentage: 0
      };
    });
    
    // Calculate totals
    const totalItems = grItems.length;
    const totalQuantity = grItems.reduce((sum, item) => sum + item.receivedQuantity, 0);
    const totalValue = grItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Create GR document
    const newGR: Omit<GoodsReceipt, 'id'> = {
      grNumber,
      projectId: input.projectId,
      
      // PO reference
      poId: input.poId,
      poNumber: po.poNumber || po.prNumber,
      vendorId: po.vendorId || '',
      vendorName: po.vendorName || 'Unknown Vendor',
      
      // Details
      status: 'draft',
      receiptDate: input.receiptDate,
      deliveryNote: input.deliveryNote,
      vehicleNumber: input.vehicleNumber,
      driverName: input.driverName,
      
      // Items
      items: grItems,
      totalItems,
      totalQuantity,
      totalValue,
      
      // Inspection
      inspectionStatus: 'not-started',
      overallQualityStatus: 'pending',
      
      // Integration flags
      inventoryUpdated: false,
      poUpdated: false,
      wbsUpdated: false,
      apInvoiceCreated: false,
      
      // Audit
      createdBy: userId,
      createdAt: new Date().toISOString(),
      
      // Notes
      receiverNotes: input.receiverNotes,
      
      // Photos
      photos: []
    };
    
    // Save to Firestore
    const docRef = await addDoc(collection(db, GR_COLLECTION), newGR);
    
    // Update GR items with grId
    const updatedItems = grItems.map(item => ({
      ...item,
      grId: docRef.id
    }));
    
    await updateDoc(docRef, { 
      items: updatedItems 
    });
    
    return {
      id: docRef.id,
      ...newGR,
      items: updatedItems
    };
    
  } catch (error) {
    console.error('Error creating goods receipt:', error);
    throw error;
  }
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Get single GR by ID
 */
export async function getGoodsReceiptById(grId: string): Promise<GoodsReceipt | null> {
  try {
    const docRef = doc(db, GR_COLLECTION, grId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as GoodsReceipt;
    
  } catch (error) {
    console.error('Error fetching goods receipt:', error);
    throw error;
  }
}

/**
 * Get all GRs for a project with optional filters
 */
export async function getGoodsReceipts(
  projectId: string,
  filters?: GRFilterOptions
): Promise<GoodsReceipt[]> {
  try {
    let q = query(
      collection(db, GR_COLLECTION),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );
    
    // Apply filters
    if (filters?.vendorId) {
      q = query(q, where('vendorId', '==', filters.vendorId));
    }
    
    if (filters?.status && filters.status.length > 0) {
      q = query(q, where('status', 'in', filters.status));
    }
    
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GoodsReceipt[];
    
    // Apply date filters (Firestore doesn't support multiple range queries)
    if (filters?.dateFrom) {
      results = results.filter(gr => gr.receiptDate >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      results = results.filter(gr => gr.receiptDate <= filters.dateTo!);
    }
    
    // Apply search filter
    if (filters?.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      results = results.filter(gr => 
        gr.grNumber.toLowerCase().includes(term) ||
        gr.poNumber.toLowerCase().includes(term) ||
        gr.vendorName.toLowerCase().includes(term)
      );
    }
    
    // Apply quality status filter
    if (filters?.qualityStatus && filters.qualityStatus.length > 0) {
      results = results.filter(gr => 
        filters.qualityStatus!.includes(gr.overallQualityStatus)
      );
    }
    
    return results;
    
  } catch (error) {
    console.error('Error fetching goods receipts:', error);
    throw error;
  }
}

/**
 * Get GRs for a specific PO
 */
export async function getGoodsReceiptsByPO(poId: string): Promise<GoodsReceipt[]> {
  try {
    const q = query(
      collection(db, GR_COLLECTION),
      where('poId', '==', poId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GoodsReceipt[];
    
  } catch (error) {
    console.error('Error fetching GRs by PO:', error);
    throw error;
  }
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update GR header information (only in draft status)
 */
export async function updateGoodsReceipt(
  grId: string,
  updates: UpdateGRInput
): Promise<void> {
  try {
    const gr = await getGoodsReceiptById(grId);
    if (!gr) {
      throw new Error('Goods Receipt not found');
    }
    
    if (gr.status !== 'draft') {
      throw new Error('Can only update GR in draft status');
    }
    
    const docRef = doc(db, GR_COLLECTION, grId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error updating goods receipt:', error);
    throw error;
  }
}

/**
 * Update GR item received quantity (only in draft status)
 */
export async function updateGRItemQuantity(
  grId: string,
  grItemId: string,
  receivedQuantity: number,
  varianceReason?: string
): Promise<void> {
  try {
    const gr = await getGoodsReceiptById(grId);
    if (!gr) {
      throw new Error('Goods Receipt not found');
    }
    
    if (gr.status !== 'draft') {
      throw new Error('Can only update quantities in draft status');
    }
    
    // Find and update the item
    const updatedItems = gr.items.map(item => {
      if (item.id === grItemId) {
        const variance = receivedQuantity - item.poQuantity;
        const variancePercentage = (variance / item.poQuantity) * 100;
        
        return {
          ...item,
          receivedQuantity,
          quantityVariance: variance,
          variancePercentage,
          varianceReason: varianceReason || item.varianceReason,
          totalPrice: receivedQuantity * item.unitPrice
        };
      }
      return item;
    });
    
    // Recalculate totals
    const totalQuantity = updatedItems.reduce((sum, item) => sum + item.receivedQuantity, 0);
    const totalValue = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    const docRef = doc(db, GR_COLLECTION, grId);
    await updateDoc(docRef, {
      items: updatedItems,
      totalQuantity,
      totalValue,
      updatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error updating GR item quantity:', error);
    throw error;
  }
}

// ============================================================================
// WORKFLOW OPERATIONS
// ============================================================================

/**
 * Submit GR for inspection
 */
export async function submitGoodsReceipt(
  grId: string,
  userId: string
): Promise<void> {
  try {
    const gr = await getGoodsReceiptById(grId);
    if (!gr) {
      throw new Error('Goods Receipt not found');
    }
    
    if (gr.status !== 'draft') {
      throw new Error('Can only submit GR in draft status');
    }
    
    // Validate GR has items
    if (gr.items.length === 0) {
      throw new Error('Cannot submit GR without items');
    }
    
    const docRef = doc(db, GR_COLLECTION, grId);
    await updateDoc(docRef, {
      status: 'submitted',
      submittedBy: userId,
      submittedAt: new Date().toISOString(),
      inspectionStatus: 'in-progress'
    });
    
  } catch (error) {
    console.error('Error submitting goods receipt:', error);
    throw error;
  }
}

/**
 * Perform quality inspection on GR item
 */
export async function inspectGRItem(
  input: InspectGRItemInput,
  inspectorId: string,
  inspectorName: string
): Promise<void> {
  try {
    const grId = input.grItemId.split('_')[0]; // Extract GR ID from item ID
    const gr = await getGoodsReceiptById(grId);
    
    if (!gr) {
      throw new Error('Goods Receipt not found');
    }
    
    // Update the inspected item
    const updatedItems = gr.items.map(item => {
      if (item.id === input.grItemId) {
        return {
          ...item,
          acceptedQuantity: input.acceptedQuantity,
          rejectedQuantity: input.rejectedQuantity,
          qualityStatus: input.qualityStatus,
          inspectionNotes: input.inspectionNotes,
          defectDescription: input.defectDescription,
          inspectorId,
          inspectorName,
          inspectionDate: new Date().toISOString(),
          warehouseId: input.warehouseId,
          warehouseName: input.warehouseId,  // TODO: Fetch warehouse name
          storageLocation: input.storageLocation
        };
      }
      return item;
    });
    
    // Calculate overall quality status
    const allInspected = updatedItems.every(item => item.qualityStatus !== 'pending');
    const allPassed = updatedItems.every(item => item.qualityStatus === 'passed');
    const anyFailed = updatedItems.some(item => item.qualityStatus === 'failed');
    
    let overallQualityStatus: QualityStatus = 'pending';
    if (allInspected) {
      if (allPassed) {
        overallQualityStatus = 'passed';
      } else if (anyFailed) {
        overallQualityStatus = 'failed';
      } else {
        overallQualityStatus = 'partial';
      }
    }
    
    const inspectionStatus = allInspected ? 'completed' : 'in-progress';
    const newStatus: GRStatus = allInspected ? 
      (overallQualityStatus === 'passed' || overallQualityStatus === 'partial' ? 'approved' : 'rejected') :
      'inspecting';
    
    const docRef = doc(db, GR_COLLECTION, grId);
    await updateDoc(docRef, {
      items: updatedItems,
      overallQualityStatus,
      inspectionStatus,
      status: newStatus,
      inspectionCompletedAt: allInspected ? new Date().toISOString() : undefined
    });
    
  } catch (error) {
    console.error('Error inspecting GR item:', error);
    throw error;
  }
}

/**
 * Complete GR and trigger integrations
 */
export async function completeGoodsReceipt(
  grId: string,
  userId: string
): Promise<void> {
  try {
    const gr = await getGoodsReceiptById(grId);
    if (!gr) {
      throw new Error('Goods Receipt not found');
    }
    
    if (gr.status !== 'approved') {
      throw new Error('Can only complete approved GR');
    }
    
    // Update GR status
    const docRef = doc(db, GR_COLLECTION, grId);
    await updateDoc(docRef, {
      status: 'completed',
      completedBy: userId,
      completedAt: new Date().toISOString()
    });
    
    // TODO: Trigger integrations
    // 1. Update inventory (create inventory transactions)
    await updateInventoryFromGR(gr);
    
    // 2. Update PO received quantities
    await updatePOFromGR(gr);
    
    // 3. Update WBS actual costs
    await updateWBSFromGR(gr);
    
    // Mark integration flags
    await updateDoc(docRef, {
      inventoryUpdated: true,
      poUpdated: true,
      wbsUpdated: true
    });
    
  } catch (error) {
    console.error('Error completing goods receipt:', error);
    throw error;
  }
}

// ============================================================================
// INTEGRATION FUNCTIONS
// ============================================================================

/**
 * Update inventory from completed GR
 */
async function updateInventoryFromGR(gr: GoodsReceipt): Promise<void> {
  // TODO: Create inventory transactions for each accepted item
  // For each gr.items where acceptedQuantity > 0:
  //   - Create INVENTORY_IN transaction
  //   - Update material stock levels
  //   - Link to WBS for cost tracking
  
  console.log('Inventory update from GR:', gr.id);
  // Implementation will be in Priority 6: Enhanced Inventory Management
}

/**
 * Update PO received quantities from completed GR
 */
async function updatePOFromGR(gr: GoodsReceipt): Promise<void> {
  try {
    const poRef = doc(db, PO_COLLECTION, gr.poId);
    const poDoc = await getDoc(poRef);
    
    if (!poDoc.exists()) {
      throw new Error('Purchase Order not found');
    }
    
    const po = { id: poDoc.id, ...poDoc.data() } as PurchaseOrder;
    
    // Update PO item received quantities
    const updatedPOItems = po.items.map((poItem, index) => {
      const itemId = poItem.id || `poi_${index}_${Date.now()}`;
      const grItem = gr.items.find(item => item.poItemId === itemId);
      if (grItem) {
        const newReceived = (poItem.receivedQuantity || 0) + grItem.acceptedQuantity;
        return {
          ...poItem,
          id: itemId,  // Ensure id exists
          receivedQuantity: newReceived,
          status: newReceived >= poItem.quantity ? 'completed' : 'partial'
        };
      }
      return { ...poItem, id: itemId };  // Ensure id exists
    });
    
    // Check if PO is fully received
    const allCompleted = updatedPOItems.every(item => 
      (item.receivedQuantity || 0) >= item.quantity
    );
    
    await updateDoc(poRef, {
      items: updatedPOItems,
      status: allCompleted ? 'completed' : po.status
    });
    
  } catch (error) {
    console.error('Error updating PO from GR:', error);
    throw error;
  }
}

/**
 * Update WBS actual costs from completed GR
 */
async function updateWBSFromGR(gr: GoodsReceipt): Promise<void> {
  // TODO: Allocate actual costs to WBS elements
  // For each gr.items:
  //   - Get wbsElementId from PO item or material
  //   - Add acceptedQuantity * unitPrice to WBS actual cost
  //   - Update variance (actual - budget)
  
  console.log('WBS update from GR:', gr.id);
  // Implementation will leverage wbsService.ts functions
}

// ============================================================================
// PHOTO MANAGEMENT
// ============================================================================

/**
 * Add inspection photo to GR
 */
export async function addGRPhoto(
  grId: string,
  grItemId: string,
  photo: Omit<GRInspectionPhoto, 'id'>,
  userId: string
): Promise<void> {
  try {
    const gr = await getGoodsReceiptById(grId);
    if (!gr) {
      throw new Error('Goods Receipt not found');
    }
    
    const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPhoto: GRInspectionPhoto = {
      id: photoId,
      ...photo,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString()
    };
    
    // Add to GR photos array
    const updatedPhotos = [...gr.photos, newPhoto];
    
    // If photo is for specific item, add to item's defect photos
    let updatedItems = gr.items;
    if (grItemId) {
      updatedItems = gr.items.map(item => {
        if (item.id === grItemId) {
          return {
            ...item,
            defectPhotos: [...item.defectPhotos, newPhoto]
          };
        }
        return item;
      });
    }
    
    const docRef = doc(db, GR_COLLECTION, grId);
    await updateDoc(docRef, {
      photos: updatedPhotos,
      items: updatedItems
    });
    
  } catch (error) {
    console.error('Error adding GR photo:', error);
    throw error;
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate GR before submission
 */
export function validateGoodsReceipt(gr: GoodsReceipt): GRValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check items
  if (gr.items.length === 0) {
    errors.push('GR must have at least one item');
  }
  
  // Check quantities
  gr.items.forEach((item, index) => {
    if (item.receivedQuantity <= 0) {
      errors.push(`Item ${index + 1}: Received quantity must be greater than 0`);
    }
    
    // Check variance
    if (Math.abs(item.variancePercentage) > 10) {
      warnings.push(
        `Item ${index + 1}: Large variance (${item.variancePercentage.toFixed(1)}%) - ` +
        `please provide reason`
      );
    }
  });
  
  // Check receipt date
  const receiptDate = new Date(gr.receiptDate);
  const today = new Date();
  if (receiptDate > today) {
    errors.push('Receipt date cannot be in the future');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// SUMMARY & STATISTICS
// ============================================================================

/**
 * Calculate GR summary statistics
 */
export async function getGRSummary(projectId: string): Promise<GRSummary> {
  try {
    const grs = await getGoodsReceipts(projectId);
    
    const totalGRs = grs.length;
    const pendingInspection = grs.filter(gr => 
      gr.status === 'submitted' || gr.status === 'inspecting'
    ).length;
    const completedGRs = grs.filter(gr => gr.status === 'completed').length;
    
    const rejectedItems = grs.reduce((sum, gr) => 
      sum + gr.items.reduce((itemSum, item) => itemSum + item.rejectedQuantity, 0), 0
    );
    
    const totalValue = grs.reduce((sum, gr) => sum + gr.totalValue, 0);
    
    // Calculate average inspection time
    const completedGRsWithTime = grs.filter(gr => 
      gr.submittedAt && gr.inspectionCompletedAt
    );
    const averageInspectionTime = completedGRsWithTime.length > 0 ?
      completedGRsWithTime.reduce((sum, gr) => {
        const submitted = new Date(gr.submittedAt!).getTime();
        const completed = new Date(gr.inspectionCompletedAt!).getTime();
        return sum + (completed - submitted) / (1000 * 60 * 60); // Convert to hours
      }, 0) / completedGRsWithTime.length : 0;
    
    // Calculate on-time delivery rate (placeholder)
    const onTimeDeliveryRate = 85; // TODO: Calculate based on expected vs actual dates
    
    return {
      totalGRs,
      pendingInspection,
      completedGRs,
      rejectedItems,
      totalValue,
      averageInspectionTime,
      onTimeDeliveryRate
    };
    
  } catch (error) {
    console.error('Error calculating GR summary:', error);
    throw error;
  }
}

// ============================================================================
// DELETE (Soft delete recommended)
// ============================================================================

/**
 * Delete GR (only in draft status)
 */
export async function deleteGoodsReceipt(grId: string): Promise<void> {
  try {
    const gr = await getGoodsReceiptById(grId);
    if (!gr) {
      throw new Error('Goods Receipt not found');
    }
    
    if (gr.status !== 'draft') {
      throw new Error('Can only delete GR in draft status');
    }
    
    const docRef = doc(db, GR_COLLECTION, grId);
    await deleteDoc(docRef);
    
  } catch (error) {
    console.error('Error deleting goods receipt:', error);
    throw error;
  }
}
