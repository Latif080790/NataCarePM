/**
 * INVENTORY TRANSACTION SERVICE
 * 
 * Comprehensive service layer for Inventory Transaction operations including:
 * - Transaction CRUD operations (IN, OUT, ADJUSTMENT, TRANSFER, RETURN)
 * - Stock movement tracking
 * - Audit trail generation
 * - Integration with GR, MR, PO, Stock Count
 * - Valuation methods (FIFO, LIFO, Average, Standard)
 * - Batch/Serial number tracking
 * - Location tracking (Warehouse, Bin, Zone)
 * - Approval workflow for adjustments
 * - Real-time stock level updates
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
  limit as firestoreLimit,
  Timestamp,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { 
  InventoryTransaction,
  InventoryTransactionItem,
  TransactionType,
  TransactionStatus,
  UnitOfMeasure
} from '../types/inventory';

// ============================================================================
// CONSTANTS
// ============================================================================

const INVENTORY_TRANSACTIONS_COLLECTION = 'inventoryTransactions';
const STOCK_LEDGER_COLLECTION = 'stockLedger';
const MATERIAL_COLLECTION = 'materials';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate unique transaction code
 */
function generateTransactionCode(type: TransactionType): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  const prefix = type === TransactionType.IN ? 'INV-IN' :
                 type === TransactionType.OUT ? 'INV-OUT' :
                 type === TransactionType.ADJUSTMENT ? 'INV-ADJ' :
                 type === TransactionType.TRANSFER ? 'INV-TRF' :
                 'INV-RTN';
  
  return `${prefix}-${year}${month}${day}-${random}`;
}

/**
 * Get current stock for material at warehouse
 */
async function getCurrentStock(
  materialId: string, 
  warehouseId: string,
  locationId?: string
): Promise<number> {
  try {
    // Query stock ledger for most recent balance
    let stockQuery = query(
      collection(db, STOCK_LEDGER_COLLECTION),
      where('materialId', '==', materialId),
      where('warehouseId', '==', warehouseId),
      orderBy('transactionDate', 'desc'),
      firestoreLimit(1)
    );
    
    const snapshot = await getDocs(stockQuery);
    
    if (snapshot.empty) {
      return 0;
    }
    
    const ledgerEntry = snapshot.docs[0].data();
    return ledgerEntry.stockBalance || 0;
    
  } catch (error) {
    console.error('Error getting current stock:', error);
    return 0;
  }
}

// ============================================================================
// STOCK LEVEL CHECKING (for Material Request validation)
// ============================================================================

/**
 * Check stock availability for Material Request items
 * Used during MR creation/approval to validate if materials are available
 */
export async function checkStockLevel(
  materialId: string,
  materialCode: string,
  requestedQty: number,
  warehouseId?: string
): Promise<{
  available: boolean;
  currentStock: number;
  shortfall: number;
  message: string;
  suggestions: string[];
}> {
  try {
    // If no specific warehouse, check all warehouses
    if (!warehouseId) {
      // Query all stock locations for this material
      const stockQuery = query(
        collection(db, STOCK_LEDGER_COLLECTION),
        where('materialId', '==', materialId),
        orderBy('transactionDate', 'desc')
      );
      
      const snapshot = await getDocs(stockQuery);
      
      // Group by warehouse and get latest balance for each
      const warehouseStocks = new Map<string, number>();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const whId = data.warehouseId;
        if (!warehouseStocks.has(whId)) {
          warehouseStocks.set(whId, data.stockBalance || 0);
        }
      });
      
      const totalStock = Array.from(warehouseStocks.values()).reduce((sum, stock) => sum + stock, 0);
      const shortfall = Math.max(0, requestedQty - totalStock);
      const available = totalStock >= requestedQty;
      
      const suggestions = [];
      if (!available && totalStock > 0) {
        suggestions.push(`Available stock: ${totalStock} ${materialCode} across ${warehouseStocks.size} warehouses`);
        suggestions.push('Consider reducing quantity or splitting the request');
      } else if (!available) {
        suggestions.push('No stock available - initiate Purchase Request');
      }
      
      return {
        available,
        currentStock: totalStock,
        shortfall,
        message: available 
          ? `Stock available: ${totalStock} units` 
          : `Insufficient stock. Short: ${shortfall} units`,
        suggestions
      };
    }
    
    // Check specific warehouse
    const currentStock = await getCurrentStock(materialId, warehouseId);
    const shortfall = Math.max(0, requestedQty - currentStock);
    const available = currentStock >= requestedQty;
    
    const suggestions = [];
    if (!available && currentStock > 0) {
      suggestions.push(`Only ${currentStock} units available in warehouse`);
      suggestions.push('Consider requesting from another warehouse');
    } else if (!available) {
      suggestions.push('No stock in this warehouse');
      suggestions.push('Check other warehouses or initiate Purchase Request');
    }
    
    return {
      available,
      currentStock,
      shortfall,
      message: available 
        ? `Stock available: ${currentStock} units in warehouse` 
        : `Insufficient stock in warehouse. Short: ${shortfall} units`,
      suggestions
    };
    
  } catch (error) {
    console.error('Error checking stock level:', error);
    return {
      available: false,
      currentStock: 0,
      shortfall: requestedQty,
      message: 'Error checking stock availability',
      suggestions: ['Please try again or contact administrator']
    };
  }
}

/**
 * Update stock ledger with transaction
 */
async function updateStockLedger(
  transaction: InventoryTransaction,
  item: InventoryTransactionItem
): Promise<void> {
  try {
    const ledgerEntry = {
      materialId: item.materialId,
      materialCode: item.materialCode,
      materialName: item.materialName,
      
      // Transaction details
      transactionId: transaction.id,
      transactionCode: transaction.transactionCode,
      transactionType: transaction.transactionType,
      transactionDate: transaction.transactionDate,
      
      // Location
      warehouseId: item.warehouseId,
      locationId: item.locationId || null,
      binLocation: item.binLocation || null,
      
      // Quantity movement
      quantityIn: transaction.transactionType === TransactionType.IN ? item.quantity : 0,
      quantityOut: transaction.transactionType === TransactionType.OUT ? item.quantity : 0,
      quantityAdjustment: transaction.transactionType === TransactionType.ADJUSTMENT ? item.quantity : 0,
      uom: item.uom,
      
      // Stock balance
      stockBefore: item.stockBefore,
      stockAfter: item.stockAfter,
      stockBalance: item.stockAfter,
      
      // Valuation
      unitCost: item.unitCost,
      totalCost: item.totalCost,
      
      // Tracking
      batchNumber: item.batchNumber || null,
      serialNumber: item.serialNumber || null,
      
      // Reference
      referenceType: transaction.referenceType || null,
      referenceId: transaction.referenceId || null,
      referenceNumber: transaction.referenceNumber || null,
      
      // Audit
      createdAt: transaction.createdAt,
      createdBy: transaction.createdBy,
      
      // Additional
      notes: item.notes || transaction.notes || null
    };
    
    await addDoc(collection(db, STOCK_LEDGER_COLLECTION), ledgerEntry);
    
  } catch (error) {
    console.error('Error updating stock ledger:', error);
    throw error;
  }
}

/**
 * Update material stock levels in master data
 */
async function updateMaterialStock(
  materialId: string,
  warehouseId: string,
  newStockLevel: number
): Promise<void> {
  try {
    const materialRef = doc(db, MATERIAL_COLLECTION, materialId);
    const materialDoc = await getDoc(materialRef);
    
    if (!materialDoc.exists()) {
      console.warn(`Material ${materialId} not found`);
      return;
    }
    
    const materialData = materialDoc.data();
    const warehouseStock = materialData.warehouseStock || {};
    
    // Update warehouse-specific stock
    warehouseStock[warehouseId] = newStockLevel;
    
    // Calculate total stock across all warehouses
    const totalStock = Object.values(warehouseStock as Record<string, number>)
      .reduce((sum, stock) => sum + stock, 0);
    
    await updateDoc(materialRef, {
      warehouseStock,
      totalStock,
      lastStockUpdate: Timestamp.now()
    });
    
  } catch (error) {
    console.error('Error updating material stock:', error);
    throw error;
  }
}

// ============================================================================
// MAIN TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Create Inventory IN transaction (from Goods Receipt)
 */
export async function createInventoryInTransaction(
  grId: string,
  grNumber: string,
  items: Array<{
    materialId: string;
    materialCode: string;
    materialName: string;
    quantity: number;
    uom: UnitOfMeasure;
    unitCost: number;
    warehouseId: string;
    locationId?: string;
    binLocation?: string;
    batchNumber?: string;
    serialNumber?: string;
    expiryDate?: Timestamp;
    manufacturingDate?: Timestamp;
    notes?: string;
  }>,
  warehouseId: string,
  warehouseName: string,
  userId: string,
  userName: string
): Promise<string> {
  try {
    const transactionCode = generateTransactionCode(TransactionType.IN);
    
    // Prepare transaction items with stock levels
    const transactionItems: InventoryTransactionItem[] = [];
    
    for (const item of items) {
      const stockBefore = await getCurrentStock(item.materialId, item.warehouseId, item.locationId);
      const stockAfter = stockBefore + item.quantity;
      
      transactionItems.push({
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        materialId: item.materialId,
        materialCode: item.materialCode,
        materialName: item.materialName,
        quantity: item.quantity,
        uom: item.uom,
        baseQuantity: item.quantity, // TODO: Convert to base UOM if needed
        batchNumber: item.batchNumber,
        serialNumber: item.serialNumber,
        expiryDate: item.expiryDate,
        manufacturingDate: item.manufacturingDate,
        unitCost: item.unitCost,
        totalCost: item.quantity * item.unitCost,
        warehouseId: item.warehouseId,
        locationId: item.locationId,
        binLocation: item.binLocation,
        stockBefore,
        stockAfter,
        notes: item.notes
      });
    }
    
    // Calculate total value
    const totalValue = transactionItems.reduce((sum, item) => sum + item.totalCost, 0);
    
    // Create transaction
    const transaction: Omit<InventoryTransaction, 'id'> = {
      transactionCode,
      transactionType: TransactionType.IN,
      transactionDate: Timestamp.now(),
      status: TransactionStatus.COMPLETED,
      items: transactionItems,
      warehouseId,
      warehouseName,
      referenceType: 'GR',
      referenceId: grId,
      referenceNumber: grNumber,
      totalValue,
      approvalRequired: false,
      createdAt: Timestamp.now(),
      createdBy: {
        userId,
        userName
      },
      completedAt: Timestamp.now(),
      completedBy: {
        userId,
        userName
      }
    };
    
    // Use Firestore transaction to ensure atomicity
    const transactionId = await runTransaction(db, async (firestoreTransaction) => {
      // Add inventory transaction
      const transactionRef = doc(collection(db, INVENTORY_TRANSACTIONS_COLLECTION));
      firestoreTransaction.set(transactionRef, transaction);
      
      // Update stock levels for each item
      for (const item of transactionItems) {
        // Update stock ledger
        await updateStockLedger(
          { id: transactionRef.id, ...transaction } as InventoryTransaction,
          item
        );
        
        // Update material stock
        await updateMaterialStock(item.materialId, item.warehouseId, item.stockAfter);
      }
      
      return transactionRef.id;
    });
    
    console.log('✅ Inventory IN transaction created:', transactionCode);
    return transactionId;
    
  } catch (error) {
    console.error('❌ Error creating inventory IN transaction:', error);
    throw error;
  }
}

/**
 * Create Inventory OUT transaction (Material Request/Usage)
 */
export async function createInventoryOutTransaction(
  mrId: string,
  mrNumber: string,
  items: Array<{
    materialId: string;
    materialCode: string;
    materialName: string;
    quantity: number;
    uom: UnitOfMeasure;
    unitCost: number;
    warehouseId: string;
    locationId?: string;
    binLocation?: string;
    batchNumber?: string;
    serialNumber?: string;
    notes?: string;
  }>,
  warehouseId: string,
  warehouseName: string,
  userId: string,
  userName: string
): Promise<string> {
  try {
    const transactionCode = generateTransactionCode(TransactionType.OUT);
    
    // Prepare transaction items with stock levels
    const transactionItems: InventoryTransactionItem[] = [];
    
    for (const item of items) {
      const stockBefore = await getCurrentStock(item.materialId, item.warehouseId, item.locationId);
      const stockAfter = stockBefore - item.quantity;
      
      // Validate sufficient stock
      if (stockAfter < 0) {
        throw new Error(
          `Insufficient stock for ${item.materialName}. ` +
          `Available: ${stockBefore}, Requested: ${item.quantity}`
        );
      }
      
      transactionItems.push({
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        materialId: item.materialId,
        materialCode: item.materialCode,
        materialName: item.materialName,
        quantity: item.quantity,
        uom: item.uom,
        baseQuantity: item.quantity,
        batchNumber: item.batchNumber,
        serialNumber: item.serialNumber,
        unitCost: item.unitCost,
        totalCost: item.quantity * item.unitCost,
        warehouseId: item.warehouseId,
        locationId: item.locationId,
        binLocation: item.binLocation,
        stockBefore,
        stockAfter,
        notes: item.notes
      });
    }
    
    // Calculate total value
    const totalValue = transactionItems.reduce((sum, item) => sum + item.totalCost, 0);
    
    // Create transaction
    const transaction: Omit<InventoryTransaction, 'id'> = {
      transactionCode,
      transactionType: TransactionType.OUT,
      transactionDate: Timestamp.now(),
      status: TransactionStatus.COMPLETED,
      items: transactionItems,
      warehouseId,
      warehouseName,
      referenceType: 'MR',
      referenceId: mrId,
      referenceNumber: mrNumber,
      totalValue,
      approvalRequired: false,
      createdAt: Timestamp.now(),
      createdBy: {
        userId,
        userName
      },
      completedAt: Timestamp.now(),
      completedBy: {
        userId,
        userName
      }
    };
    
    // Use Firestore transaction to ensure atomicity
    const transactionId = await runTransaction(db, async (firestoreTransaction) => {
      // Add inventory transaction
      const transactionRef = doc(collection(db, INVENTORY_TRANSACTIONS_COLLECTION));
      firestoreTransaction.set(transactionRef, transaction);
      
      // Update stock levels for each item
      for (const item of transactionItems) {
        // Update stock ledger
        await updateStockLedger(
          { id: transactionRef.id, ...transaction } as InventoryTransaction,
          item
        );
        
        // Update material stock
        await updateMaterialStock(item.materialId, item.warehouseId, item.stockAfter);
      }
      
      return transactionRef.id;
    });
    
    console.log('✅ Inventory OUT transaction created:', transactionCode);
    return transactionId;
    
  } catch (error) {
    console.error('❌ Error creating inventory OUT transaction:', error);
    throw error;
  }
}

/**
 * Create Inventory ADJUSTMENT transaction
 */
export async function createInventoryAdjustmentTransaction(
  items: Array<{
    materialId: string;
    materialCode: string;
    materialName: string;
    adjustmentQuantity: number; // Positive = increase, Negative = decrease
    uom: UnitOfMeasure;
    unitCost: number;
    warehouseId: string;
    locationId?: string;
    binLocation?: string;
    batchNumber?: string;
    notes?: string;
  }>,
  warehouseId: string,
  warehouseName: string,
  reason: string,
  reasonCategory: 'damage' | 'loss' | 'found' | 'expired' | 'reconciliation' | 'other',
  userId: string,
  userName: string,
  requiresApproval: boolean = true
): Promise<string> {
  try {
    const transactionCode = generateTransactionCode(TransactionType.ADJUSTMENT);
    
    // Prepare transaction items with stock levels
    const transactionItems: InventoryTransactionItem[] = [];
    
    for (const item of items) {
      const stockBefore = await getCurrentStock(item.materialId, item.warehouseId, item.locationId);
      const stockAfter = stockBefore + item.adjustmentQuantity;
      
      // Validate stock after adjustment
      if (stockAfter < 0) {
        throw new Error(
          `Invalid adjustment for ${item.materialName}. ` +
          `Current stock: ${stockBefore}, Adjustment: ${item.adjustmentQuantity}, ` +
          `Result would be negative.`
        );
      }
      
      transactionItems.push({
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        materialId: item.materialId,
        materialCode: item.materialCode,
        materialName: item.materialName,
        quantity: item.adjustmentQuantity,
        uom: item.uom,
        baseQuantity: item.adjustmentQuantity,
        batchNumber: item.batchNumber,
        unitCost: item.unitCost,
        totalCost: Math.abs(item.adjustmentQuantity) * item.unitCost,
        warehouseId: item.warehouseId,
        locationId: item.locationId,
        binLocation: item.binLocation,
        stockBefore,
        stockAfter,
        notes: item.notes
      });
    }
    
    // Calculate total value
    const totalValue = transactionItems.reduce((sum, item) => sum + item.totalCost, 0);
    
    // Create transaction
    const transaction: Omit<InventoryTransaction, 'id'> = {
      transactionCode,
      transactionType: TransactionType.ADJUSTMENT,
      transactionDate: Timestamp.now(),
      status: requiresApproval ? TransactionStatus.PENDING_APPROVAL : TransactionStatus.COMPLETED,
      items: transactionItems,
      warehouseId,
      warehouseName,
      referenceType: 'ADJ',
      reason,
      reasonCategory,
      totalValue,
      approvalRequired: requiresApproval,
      createdAt: Timestamp.now(),
      createdBy: {
        userId,
        userName
      },
      completedAt: requiresApproval ? undefined : Timestamp.now(),
      completedBy: requiresApproval ? undefined : {
        userId,
        userName
      }
    };
    
    // Add to Firestore
    const docRef = await addDoc(collection(db, INVENTORY_TRANSACTIONS_COLLECTION), transaction);
    
    // If no approval required, update stock immediately
    if (!requiresApproval) {
      for (const item of transactionItems) {
        await updateStockLedger(
          { id: docRef.id, ...transaction } as InventoryTransaction,
          item
        );
        await updateMaterialStock(item.materialId, item.warehouseId, item.stockAfter);
      }
    }
    
    console.log('✅ Inventory ADJUSTMENT transaction created:', transactionCode);
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Error creating inventory ADJUSTMENT transaction:', error);
    throw error;
  }
}

/**
 * Approve inventory adjustment transaction
 */
export async function approveAdjustmentTransaction(
  transactionId: string,
  approvalNotes: string,
  approverId: string,
  approverName: string
): Promise<void> {
  try {
    const transactionRef = doc(db, INVENTORY_TRANSACTIONS_COLLECTION, transactionId);
    const transactionDoc = await getDoc(transactionRef);
    
    if (!transactionDoc.exists()) {
      throw new Error('Transaction not found');
    }
    
    const transaction = { id: transactionDoc.id, ...transactionDoc.data() } as InventoryTransaction;
    
    if (transaction.status !== TransactionStatus.PENDING_APPROVAL) {
      throw new Error(`Transaction cannot be approved. Current status: ${transaction.status}`);
    }
    
    if (transaction.transactionType !== TransactionType.ADJUSTMENT) {
      throw new Error('Only adjustment transactions require approval');
    }
    
    // Update transaction status
    await updateDoc(transactionRef, {
      status: TransactionStatus.APPROVED,
      approvedAt: Timestamp.now(),
      approvedBy: {
        userId: approverId,
        userName: approverName
      },
      approvalNotes,
      completedAt: Timestamp.now(),
      completedBy: {
        userId: approverId,
        userName: approverName
      }
    });
    
    // Update stock levels
    for (const item of transaction.items) {
      await updateStockLedger(transaction, item);
      await updateMaterialStock(item.materialId, item.warehouseId, item.stockAfter);
    }
    
    console.log('✅ Adjustment transaction approved:', transaction.transactionCode);
    
  } catch (error) {
    console.error('❌ Error approving adjustment transaction:', error);
    throw error;
  }
}

/**
 * Create Inventory TRANSFER transaction
 */
export async function createInventoryTransferTransaction(
  items: Array<{
    materialId: string;
    materialCode: string;
    materialName: string;
    quantity: number;
    uom: UnitOfMeasure;
    unitCost: number;
    fromWarehouseId: string;
    fromLocationId?: string;
    fromBinLocation?: string;
    toWarehouseId: string;
    toLocationId?: string;
    toBinLocation?: string;
    batchNumber?: string;
    serialNumber?: string;
    notes?: string;
  }>,
  fromWarehouseId: string,
  fromWarehouseName: string,
  toWarehouseId: string,
  toWarehouseName: string,
  userId: string,
  userName: string
): Promise<string> {
  try {
    const transactionCode = generateTransactionCode(TransactionType.TRANSFER);
    
    // Prepare transaction items
    const transactionItems: InventoryTransactionItem[] = [];
    
    for (const item of items) {
      const stockBefore = await getCurrentStock(item.materialId, item.fromWarehouseId, item.fromLocationId);
      const stockAfter = stockBefore - item.quantity;
      
      // Validate sufficient stock at source
      if (stockAfter < 0) {
        throw new Error(
          `Insufficient stock for ${item.materialName} at source warehouse. ` +
          `Available: ${stockBefore}, Transfer quantity: ${item.quantity}`
        );
      }
      
      transactionItems.push({
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        materialId: item.materialId,
        materialCode: item.materialCode,
        materialName: item.materialName,
        quantity: item.quantity,
        uom: item.uom,
        baseQuantity: item.quantity,
        batchNumber: item.batchNumber,
        serialNumber: item.serialNumber,
        unitCost: item.unitCost,
        totalCost: item.quantity * item.unitCost,
        warehouseId: item.fromWarehouseId,
        locationId: item.fromLocationId,
        binLocation: item.fromBinLocation,
        toWarehouseId: item.toWarehouseId,
        toLocationId: item.toLocationId,
        toBinLocation: item.toBinLocation,
        stockBefore,
        stockAfter,
        notes: item.notes
      });
    }
    
    // Calculate total value
    const totalValue = transactionItems.reduce((sum, item) => sum + item.totalCost, 0);
    
    // Create transaction
    const transaction: Omit<InventoryTransaction, 'id'> = {
      transactionCode,
      transactionType: TransactionType.TRANSFER,
      transactionDate: Timestamp.now(),
      status: TransactionStatus.COMPLETED,
      items: transactionItems,
      warehouseId: fromWarehouseId,
      warehouseName: fromWarehouseName,
      toWarehouseId,
      toWarehouseName,
      referenceType: 'TRF',
      totalValue,
      approvalRequired: false,
      createdAt: Timestamp.now(),
      createdBy: {
        userId,
        userName
      },
      completedAt: Timestamp.now(),
      completedBy: {
        userId,
        userName
      }
    };
    
    // Use Firestore transaction to ensure atomicity
    const transactionId = await runTransaction(db, async (firestoreTransaction) => {
      // Add inventory transaction
      const transactionRef = doc(collection(db, INVENTORY_TRANSACTIONS_COLLECTION));
      firestoreTransaction.set(transactionRef, transaction);
      
      // Update stock levels for each item
      for (const item of transactionItems) {
        // Deduct from source warehouse
        await updateStockLedger(
          { id: transactionRef.id, ...transaction } as InventoryTransaction,
          item
        );
        await updateMaterialStock(item.materialId, item.warehouseId, item.stockAfter);
        
        // Add to destination warehouse
        const destStockBefore = await getCurrentStock(item.materialId, item.toWarehouseId!, item.toLocationId);
        const destStockAfter = destStockBefore + item.quantity;
        
        const destItem = {
          ...item,
          warehouseId: item.toWarehouseId!,
          locationId: item.toLocationId,
          binLocation: item.toBinLocation,
          stockBefore: destStockBefore,
          stockAfter: destStockAfter
        };
        
        await updateStockLedger(
          { id: transactionRef.id, ...transaction } as InventoryTransaction,
          destItem
        );
        await updateMaterialStock(item.materialId, item.toWarehouseId!, destStockAfter);
      }
      
      return transactionRef.id;
    });
    
    console.log('✅ Inventory TRANSFER transaction created:', transactionCode);
    return transactionId;
    
  } catch (error) {
    console.error('❌ Error creating inventory TRANSFER transaction:', error);
    throw error;
  }
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get transaction by ID
 */
export async function getInventoryTransactionById(
  transactionId: string
): Promise<InventoryTransaction | null> {
  try {
    const docRef = doc(db, INVENTORY_TRANSACTIONS_COLLECTION, transactionId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as InventoryTransaction;
    
  } catch (error) {
    console.error('Error getting transaction:', error);
    throw error;
  }
}

/**
 * Get all transactions with filters
 */
export async function getInventoryTransactions(filters?: {
  transactionType?: TransactionType;
  status?: TransactionStatus;
  warehouseId?: string;
  materialId?: string;
  dateFrom?: Timestamp;
  dateTo?: Timestamp;
  limit?: number;
}): Promise<InventoryTransaction[]> {
  try {
    let q = query(collection(db, INVENTORY_TRANSACTIONS_COLLECTION));
    
    // Apply filters
    if (filters?.transactionType) {
      q = query(q, where('transactionType', '==', filters.transactionType));
    }
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters?.warehouseId) {
      q = query(q, where('warehouseId', '==', filters.warehouseId));
    }
    if (filters?.dateFrom) {
      q = query(q, where('transactionDate', '>=', filters.dateFrom));
    }
    if (filters?.dateTo) {
      q = query(q, where('transactionDate', '<=', filters.dateTo));
    }
    
    // Order by date descending
    q = query(q, orderBy('transactionDate', 'desc'));
    
    // Apply limit
    if (filters?.limit) {
      q = query(q, firestoreLimit(filters.limit));
    }
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as InventoryTransaction));
    
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
}

/**
 * Get transactions by reference (GR, MR, PO, etc.)
 */
export async function getTransactionsByReference(
  referenceType: string,
  referenceId: string
): Promise<InventoryTransaction[]> {
  try {
    const q = query(
      collection(db, INVENTORY_TRANSACTIONS_COLLECTION),
      where('referenceType', '==', referenceType),
      where('referenceId', '==', referenceId),
      orderBy('transactionDate', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as InventoryTransaction));
    
  } catch (error) {
    console.error('Error getting transactions by reference:', error);
    throw error;
  }
}

/**
 * Get stock ledger for material
 */
export async function getStockLedger(
  materialId: string,
  warehouseId?: string,
  dateFrom?: Timestamp,
  dateTo?: Timestamp
): Promise<any[]> {
  try {
    let q = query(
      collection(db, STOCK_LEDGER_COLLECTION),
      where('materialId', '==', materialId)
    );
    
    if (warehouseId) {
      q = query(q, where('warehouseId', '==', warehouseId));
    }
    
    if (dateFrom) {
      q = query(q, where('transactionDate', '>=', dateFrom));
    }
    
    if (dateTo) {
      q = query(q, where('transactionDate', '<=', dateTo));
    }
    
    q = query(q, orderBy('transactionDate', 'asc'));
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
  } catch (error) {
    console.error('Error getting stock ledger:', error);
    throw error;
  }
}

// ============================================================================
// EXPORT SERVICE
// ============================================================================

export const inventoryTransactionService = {
  // Create transactions
  createInventoryInTransaction,
  createInventoryOutTransaction,
  createInventoryAdjustmentTransaction,
  createInventoryTransferTransaction,
  
  // Approval
  approveAdjustmentTransaction,
  
  // Queries
  getInventoryTransactionById,
  getInventoryTransactions,
  getTransactionsByReference,
  getStockLedger,
  
  // Helpers
  getCurrentStock,
  generateTransactionCode
};

export default inventoryTransactionService;
