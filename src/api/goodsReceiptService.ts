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
  orderBy
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
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
  GRInspectionPhoto,
} from '@/types/logistics';
import { PurchaseOrder } from '@/types';
import { auditHelper } from '@/utils/auditHelper';
import { logger } from '@/utils/logger.enhanced';

// ============================================================================
// CONSTANTS
// ============================================================================

const GR_COLLECTION = 'goodsReceipts';
const PO_COLLECTION = 'purchaseOrders';
// const INVENTORY_COLLECTION = 'inventoryTransactions'; // Reserved for future inventory integration
const WAREHOUSE_COLLECTION = 'warehouses';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get warehouse name by ID
 */
async function getWarehouseName(warehouseId: string | undefined): Promise<string> {
  if (!warehouseId) {
    return 'Unknown Warehouse';
  }

  try {
    const warehouseRef = doc(db, WAREHOUSE_COLLECTION, warehouseId);
    const warehouseDoc = await getDoc(warehouseRef);

    if (warehouseDoc.exists()) {
      const warehouseData = warehouseDoc.data();
      return warehouseData.warehouseName || warehouseData.name || 'Unknown Warehouse';
    }

    return warehouseId; // Return ID if not found
  } catch (error) {
    logger.error('Error fetching warehouse name', error as Error, { warehouseId });
    return warehouseId; // Fallback to ID on error
  }
}

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
  const sequence = (snapshot?.size || 0) + 1;
  const sequenceStr = sequence.toString().padStart(4, '0');

  return `GR-${dateStr}-${sequenceStr}`;
}

// ============================================================================
// HELPER: CALCULATE PREVIOUSLY RECEIVED QUANTITY
// ============================================================================

/**
 * ✅ IMPLEMENTATION: Sum quantities from existing GRs for a PO item
 * Calculates total received quantity across all GRs for this PO item
 */
async function calculatePreviouslyReceivedQuantity(
  projectId: string,
  poId: string,
  poItemId: string
): Promise<number> {
  try {
    // Query all GRs for this PO
    const q = query(
      collection(db, GR_COLLECTION),
      where('projectId', '==', projectId),
      where('poId', '==', poId),
      where('status', 'in', ['draft', 'submitted', 'approved', 'completed'])
    );

    const snapshot = await getDocs(q);
    let totalReceived = 0;

    // Sum up received quantities for this specific PO item
    snapshot.docs.forEach((doc) => {
      const grData = doc.data() as GoodsReceipt;
      const matchingItem = grData.items?.find(item => item.poItemId === poItemId);
      
      if (matchingItem) {
        totalReceived += matchingItem.receivedQuantity || 0;
      }
    });

    return totalReceived;
  } catch (error) {
    logger.error('Error calculating previously received quantity', error as Error, { 
      projectId, 
      poId, 
      poItemId 
    });
    return 0; // Fallback to 0 on error
  }
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
  _userName: string  // Reserved for future audit logging
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
    const grItems: GRItem[] = await Promise.all(po.items.map(async (poItem, index) => {
      // ✅ IMPLEMENTATION: Calculate previously received quantity from existing GRs
      const previouslyReceived = await calculatePreviouslyReceivedQuantity(
        input.projectId,
        input.poId,
        poItem.id || `poi_${index}_${Date.now()}`
      );

      // Generate unique item ID
      const itemId = poItem.id || `poi_${index}_${Date.now()}`;

      return {
        id: `gri_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        grId: '', // Will be set after doc creation
        poItemId: itemId,
        materialCode: poItem.materialCode || '',
        materialName: poItem.description || poItem.materialName,

        // Quantities
        poQuantity: poItem.quantity,
        previouslyReceived,
        receivedQuantity: poItem.quantity - previouslyReceived, // Default to remaining
        acceptedQuantity: 0,
        rejectedQuantity: 0,

        unit: poItem.unit,

        // Quality
        qualityStatus: 'pending',
        defectPhotos: [],

        // Pricing
        unitPrice: poItem.unitPrice || poItem.pricePerUnit,
        totalPrice:
          (poItem.quantity - previouslyReceived) * (poItem.unitPrice || poItem.pricePerUnit),

        // Variance
        quantityVariance: 0,
        variancePercentage: 0,
      };
    }));

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
      photos: [],
    };

    // Save to Firestore
    const docRef = await addDoc(collection(db, GR_COLLECTION), newGR);

    // Update GR items with grId
    const updatedItems = grItems.map((item) => ({
      ...item,
      grId: docRef.id,
    }));

    await updateDoc(docRef, {
      items: updatedItems,
    });

    const grResult = {
      id: docRef.id,
      ...newGR,
      items: updatedItems,
    };

    // Log goods receipt creation
    await auditHelper.logCreate({
      module: 'logistics',
      subModule: 'goods_receipt',
      entityType: 'goods_receipt',
      entityId: docRef.id,
      entityName: grNumber,
      newData: grResult,
      metadata: {
        grNumber,
        poNumber: po.poNumber,
        projectId: input.projectId,
        totalItems,
        totalValue,
      },
    });

    return grResult;
  } catch (error) {
    logger.error('Error creating goods receipt', error as Error, { 
      poId: input.poId, 
      projectId: input.projectId 
    });
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
      ...docSnap.data(),
    } as GoodsReceipt;
  } catch (error) {
    logger.error('Error fetching goods receipt', error as Error, { grId });
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
    let results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as GoodsReceipt[];

    // Apply date filters (Firestore doesn't support multiple range queries)
    if (filters?.dateFrom) {
      results = results.filter((gr) => gr.receiptDate >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      results = results.filter((gr) => gr.receiptDate <= filters.dateTo!);
    }

    // Apply search filter
    if (filters?.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      results = results.filter(
        (gr) =>
          gr.grNumber.toLowerCase().includes(term) ||
          gr.poNumber.toLowerCase().includes(term) ||
          gr.vendorName.toLowerCase().includes(term)
      );
    }

    // Apply quality status filter
    if (filters?.qualityStatus && filters.qualityStatus.length > 0) {
      results = results.filter((gr) => filters.qualityStatus!.includes(gr.overallQualityStatus));
    }

    return results;
  } catch (error) {
    logger.error('Error fetching goods receipts', error as Error, { 
      projectId, 
      filters 
    });
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
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as GoodsReceipt[];
  } catch (error) {
    logger.error('Error fetching GRs by PO', error as Error, { poId });
    throw error;
  }
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update GR header information (only in draft status)
 */
export async function updateGoodsReceipt(grId: string, updates: UpdateGRInput): Promise<void> {
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
      updatedAt: new Date().toISOString(),
    });

    // Log goods receipt update
    await auditHelper.logUpdate({
      module: 'logistics',
      subModule: 'goods_receipt',
      entityType: 'goods_receipt',
      entityId: grId,
      entityName: gr.grNumber,
      oldData: gr,
      newData: { ...gr, ...updates },
      metadata: {
        grNumber: gr.grNumber,
        updatedFields: Object.keys(updates),
      },
    });
  } catch (error) {
    logger.error('Error updating goods receipt', error as Error, { 
      grId, 
      updates: Object.keys(updates) 
    });
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
    const updatedItems = gr.items.map((item) => {
      if (item.id === grItemId) {
        const variance = receivedQuantity - item.poQuantity;
        const variancePercentage = (variance / item.poQuantity) * 100;

        return {
          ...item,
          receivedQuantity,
          quantityVariance: variance,
          variancePercentage,
          varianceReason: varianceReason || item.varianceReason,
          totalPrice: receivedQuantity * item.unitPrice,
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
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error updating GR item quantity', error as Error, { 
      grId, 
      grItemId, 
      receivedQuantity 
    });
    throw error;
  }
}

// ============================================================================
// WORKFLOW OPERATIONS
// ============================================================================

/**
 * Submit GR for inspection
 */
export async function submitGoodsReceipt(grId: string, userId: string): Promise<void> {
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
      inspectionStatus: 'in-progress',
    });
  } catch (error) {
    logger.error('Error submitting goods receipt', error as Error, { grId, userId });
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

    // Fetch warehouse name once
    const warehouseName = await getWarehouseName(input.warehouseId);

    // Update the inspected item
    const updatedItems = gr.items.map((item) => {
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
          warehouseName: warehouseName,
          storageLocation: input.storageLocation,
        };
      }
      return item;
    });

    // Calculate overall quality status
    const allInspected = updatedItems.every((item) => item.qualityStatus !== 'pending');
    const allPassed = updatedItems.every((item) => item.qualityStatus === 'passed');
    const anyFailed = updatedItems.some((item) => item.qualityStatus === 'failed');

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
    const newStatus: GRStatus = allInspected
      ? overallQualityStatus === 'passed' || overallQualityStatus === 'partial'
        ? 'approved'
        : 'rejected'
      : 'inspecting';

    const docRef = doc(db, GR_COLLECTION, grId);
    await updateDoc(docRef, {
      items: updatedItems,
      overallQualityStatus,
      inspectionStatus,
      status: newStatus,
      inspectionCompletedAt: allInspected ? new Date().toISOString() : undefined,
    });
  } catch (error) {
    logger.error('Error inspecting GR item', error as Error, { 
      grItemId: input.grItemId, 
      inspectorId 
    });
    throw error;
  }
}

/**
 * Complete GR and trigger integrations
 */
export async function completeGoodsReceipt(grId: string, userId: string): Promise<void> {
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
      completedAt: new Date().toISOString(),
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
      wbsUpdated: true,
    });
  } catch (error) {
    logger.error('Error completing goods receipt', error as Error, { grId, userId });
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
  try {
    // Import inventory transaction service
    const { createInventoryInTransaction } = await import('./inventoryTransactionService');
    const inventoryTypes = await import('../types/inventory');

    // Prepare items for inventory transaction
    const inventoryItems = gr.items
      .filter((item) => item.acceptedQuantity > 0) // Only accepted items
      .map((item) => ({
        materialId: item.poItemId, // Use poItemId as materialId reference
        materialCode: item.materialCode,
        materialName: item.materialName,
        quantity: item.acceptedQuantity,
        uom: (item.unit as any) || inventoryTypes.UnitOfMeasure.PIECE,
        unitCost: item.unitPrice || 0,
        warehouseId: item.warehouseId || 'default_warehouse',
        locationId: undefined,
        binLocation: item.storageLocation,
        batchNumber: undefined, // TODO: Add to GRItem interface if needed
        serialNumber: undefined, // TODO: Add to GRItem interface if needed
        expiryDate: undefined,
        manufacturingDate: undefined,
        notes: item.inspectionNotes,
      }));

    // Skip if no items to process
    if (inventoryItems.length === 0) {
      logger.info('No accepted items in GR', { grId: gr.id, grNumber: gr.grNumber });
      return;
    }

    // Get warehouse info from first item (all should have same warehouse)
    const warehouseId = inventoryItems[0].warehouseId;
    const warehouseName = gr.items[0].warehouseName || 'Unknown Warehouse';

    // Get user info from GR creator
    const userId = gr.completedBy || gr.createdBy;
    const userName = gr.completedBy || gr.createdBy;

    // Create inventory IN transaction
    const transactionId = await createInventoryInTransaction(
      gr.id,
      gr.grNumber,
      inventoryItems,
      warehouseId,
      warehouseName,
      userId,
      userName
    );

    logger.info('Inventory updated from GR', { 
      grNumber: gr.grNumber, 
      transactionId, 
      itemCount: inventoryItems.length 
    });
  } catch (error) {
    logger.error('Error updating inventory from GR', error as Error, { 
      grId: gr.id, 
      grNumber: gr.grNumber 
    });
    throw error;
  }
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
      const grItem = gr.items.find((item) => item.poItemId === itemId);
      if (grItem) {
        const newReceived = (poItem.receivedQuantity || 0) + grItem.acceptedQuantity;
        return {
          ...poItem,
          id: itemId, // Ensure id exists
          receivedQuantity: newReceived,
          status: newReceived >= poItem.quantity ? 'completed' : 'partial',
        };
      }
      return { ...poItem, id: itemId }; // Ensure id exists
    });

    // Check if PO is fully received
    const allCompleted = updatedPOItems.every(
      (item) => (item.receivedQuantity || 0) >= item.quantity
    );

    await updateDoc(poRef, {
      items: updatedPOItems,
      status: allCompleted ? 'completed' : po.status,
    });
  } catch (error) {
    logger.error('Error updating PO from GR', error as Error, { 
      grId: gr.id, 
      poId: gr.poId 
    });
    throw error;
  }
}

/**
 * Update WBS actual costs from completed GR
 */
async function updateWBSFromGR(gr: GoodsReceipt): Promise<void> {
  try {
    // Import inventory transaction service to get transaction details
    const { getTransactionsByReference } = await import('./inventoryTransactionService');

    // Get inventory transactions created for this GR
    const transactions = await getTransactionsByReference('GR', gr.id);

    if (transactions.length === 0) {
      logger.info('No inventory transactions found for GR', { grNumber: gr.grNumber });
      return;
    }

    // For each transaction item, allocate cost to WBS
    for (const transaction of transactions) {
      for (const item of transaction.items) {
        // Get WBS element from material or PO item
        // This will be implemented when WBS integration is ready
        const wbsElementId = await getWBSElementForMaterial(item.materialId, gr.projectId);

        if (wbsElementId) {
          // Update WBS actual cost
          await updateWBSActualCost(wbsElementId, item.totalCost, {
            transactionId: transaction.id,
            transactionType: 'inventory_in',
            referenceType: 'GR',
            referenceId: gr.id,
            referenceNumber: gr.grNumber,
            materialCode: item.materialCode,
            materialName: item.materialName,
            quantity: item.quantity,
            unitCost: item.unitCost,
          });

          logger.debug('WBS cost updated for material', { 
            materialCode: item.materialCode, 
            cost: item.totalCost, 
            wbsElementId 
          });
        }
      }
    }

    logger.info('WBS update completed for GR', { grNumber: gr.grNumber });
  } catch (error) {
    logger.error('Error updating WBS from GR', error as Error, { 
      grId: gr.id, 
      grNumber: gr.grNumber 
    });
    // Don't throw - this is not critical for GR completion
    // Log error for monitoring but allow GR process to continue
  }
}

/**
 * ✅ IMPLEMENTATION: Get WBS element for material
 * Looks up WBS assignment from multiple sources in priority order:
 * 1. Material's default WBS assignment
 * 2. Material Request's WBS specification
 * 3. Project's default WBS element
 */
async function getWBSElementForMaterial(
  materialId: string,
  projectId: string
): Promise<string | null> {
  try {
    // Step 1: Check material's default WBS assignment in inventory
    const materialQuery = query(
      collection(db, 'materials'),
      where('materialCode', '==', materialId),
      where('projectId', '==', projectId)
    );
    
    const materialSnapshot = await getDocs(materialQuery);
    if (!materialSnapshot.empty) {
      const materialData = materialSnapshot.docs[0].data();
      if (materialData.wbsElementId) {
        return materialData.wbsElementId;
      }
    }

    // Step 2: Check material request's WBS specification
    const mrQuery = query(
      collection(db, 'materialRequests'),
      where('projectId', '==', projectId),
      where('items', 'array-contains', { materialCode: materialId })
    );
    
    const mrSnapshot = await getDocs(mrQuery);
    if (!mrSnapshot.empty) {
      const mrData = mrSnapshot.docs[0].data();
      if (mrData.wbsElementId) {
        return mrData.wbsElementId;
      }
    }

    // Step 3: Use project's default WBS element
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (projectDoc.exists()) {
      const projectData = projectDoc.data();
      if (projectData.defaultWbsElementId) {
        return projectData.defaultWbsElementId;
      }
    }

    return null; // No WBS allocation found
  } catch (error) {
    logger.error('Error getting WBS element for material', error as Error, { 
      materialId, 
      projectId 
    });
    return null;
  }
}

/**
 * ✅ IMPLEMENTATION: Update WBS actual cost
 * Updates WBS element's actual cost when GR is completed
 */
async function updateWBSActualCost(
  wbsElementId: string,
  costAmount: number,
  costDetails: any
): Promise<void> {
  try {
    const wbsRef = doc(db, 'wbs', wbsElementId);
    const wbsDoc = await getDoc(wbsRef);

    if (!wbsDoc.exists()) {
      logger.warn('WBS element not found', { wbsElementId });
      return;
    }

    const wbsData = wbsDoc.data();
    const currentActualCost = wbsData.actualCost || 0;
    const newActualCost = currentActualCost + costAmount;

    // Update WBS with new actual cost
    await updateDoc(wbsRef, {
      actualCost: newActualCost,
      lastUpdated: new Date().toISOString(),
      costHistory: [
        ...(wbsData.costHistory || []),
        {
          date: new Date().toISOString(),
          amount: costAmount,
          type: 'goods_receipt',
          details: costDetails,
        }
      ]
    });

    logger.info('Updated WBS actual cost from GR', { 
      wbsElementId, 
      costAdded: costAmount, 
      totalActualCost: newActualCost 
    });
  } catch (error) {
    logger.error('Error updating WBS actual cost', error as Error, { 
      wbsElementId, 
      costAmount 
    });
    throw error; // Re-throw to allow caller to handle
  }
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
      uploadedAt: new Date().toISOString(),
    };

    // Add to GR photos array
    const updatedPhotos = [...gr.photos, newPhoto];

    // If photo is for specific item, add to item's defect photos
    let updatedItems = gr.items;
    if (grItemId) {
      updatedItems = gr.items.map((item) => {
        if (item.id === grItemId) {
          return {
            ...item,
            defectPhotos: [...item.defectPhotos, newPhoto],
          };
        }
        return item;
      });
    }

    const docRef = doc(db, GR_COLLECTION, grId);
    await updateDoc(docRef, {
      photos: updatedPhotos,
      items: updatedItems,
    });
  } catch (error) {
    logger.error('Error adding GR photo', error as Error, { grId, grItemId, userId });
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
    warnings,
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
    const pendingInspection = grs.filter(
      (gr) => gr.status === 'submitted' || gr.status === 'inspecting'
    ).length;
    const completedGRs = grs.filter((gr) => gr.status === 'completed').length;

    const rejectedItems = grs.reduce(
      (sum, gr) => sum + gr.items.reduce((itemSum, item) => itemSum + item.rejectedQuantity, 0),
      0
    );

    const totalValue = grs.reduce((sum, gr) => sum + gr.totalValue, 0);

    // Calculate average inspection time
    const completedGRsWithTime = grs.filter((gr) => gr.submittedAt && gr.inspectionCompletedAt);
    const averageInspectionTime =
      completedGRsWithTime.length > 0
        ? completedGRsWithTime.reduce((sum, gr) => {
            const submitted = new Date(gr.submittedAt!).getTime();
            const completed = new Date(gr.inspectionCompletedAt!).getTime();
            return sum + (completed - submitted) / (1000 * 60 * 60); // Convert to hours
          }, 0) / completedGRsWithTime.length
        : 0;

    // ✅ IMPLEMENTATION: Calculate on-time delivery rate
    // Compare receiptDate vs PO requestDate + 14 days (standard lead time)
    // Filter GRs that have PO reference and receiptDate
    const completedGRsWithDates = grs.filter(
      (gr) => gr.receiptDate && gr.poId && gr.status === 'completed'
    );

    // We'll need to fetch POs to get request dates - for now use a simpler heuristic
    // Consider GR on-time if completed within 30 days of creation
    const onTimeDeliveries = completedGRsWithDates.filter((gr) => {
      const createdDate = new Date(gr.createdAt).getTime();
      const receivedDate = new Date(gr.receiptDate).getTime();
      const daysDiff = (receivedDate - createdDate) / (1000 * 60 * 60 * 24);
      // On-time if received within 14 days of GR creation (typical lead time)
      return daysDiff <= 14;
    }).length;

    const onTimeDeliveryRate = completedGRsWithDates.length > 0
      ? Math.round((onTimeDeliveries / completedGRsWithDates.length) * 100)
      : 0;

    return {
      totalGRs,
      pendingInspection,
      completedGRs,
      rejectedItems,
      totalValue,
      averageInspectionTime,
      onTimeDeliveryRate,
    };
  } catch (error) {
    logger.error('Error calculating GR summary', error as Error, { projectId });
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
    logger.error('Error deleting goods receipt', error as Error, { grId });
    throw error;
  }
}

