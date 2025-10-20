import { db } from '@/firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  increment,
  runTransaction
} from 'firebase/firestore';
import {
  InventoryMaterial,
  InventoryTransaction,
  StockCount,
  Warehouse,
  StorageLocation,
  StockAlert,
  StockMovement,
  CreateMaterialInput,
  UpdateMaterialInput,
  CreateTransactionInput,
  CreateStockCountInput,
  UpdateStockCountItemInput,
  CreateWarehouseInput,
  CreateLocationInput,
  MaterialFilters,
  TransactionFilters,
  StockCountFilters,
  InventorySummary,
  StockValuation,
  TransactionType,
  TransactionStatus,
  StockCountStatus,
  StockAlertType,
  ValuationMethod,
  MaterialStatus,
  UnitOfMeasure
} from '@/types/inventory';

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Generate unique material code: MAT-YYYYMMDD-XXX
 */
export async function generateMaterialCode(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  const prefix = `MAT-${dateStr}-`;
  
  const materialsRef = collection(db, 'inventory_materials');
  const q = query(
    materialsRef,
    where('materialCode', '>=', prefix),
    where('materialCode', '<', `${prefix}\uf8ff`),
    orderBy('materialCode', 'desc')
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return `${prefix}001`;
  }
  
  const lastCode = snapshot.docs[0].data().materialCode;
  const lastNumber = parseInt(lastCode.split('-')[2]);
  const newNumber = (lastNumber + 1).toString().padStart(3, '0');
  
  return `${prefix}${newNumber}`;
}

/**
 * Generate transaction code: INV-{TYPE}-YYYYMMDD-XXX
 */
export async function generateTransactionCode(type: TransactionType): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  const typeStr = type.toUpperCase();
  const prefix = `INV-${typeStr}-${dateStr}-`;
  
  const transactionsRef = collection(db, 'inventory_transactions');
  const q = query(
    transactionsRef,
    where('transactionCode', '>=', prefix),
    where('transactionCode', '<', `${prefix}\uf8ff`),
    orderBy('transactionCode', 'desc')
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return `${prefix}001`;
  }
  
  const lastCode = snapshot.docs[0].data().transactionCode;
  const lastNumber = parseInt(lastCode.split('-')[3]);
  const newNumber = (lastNumber + 1).toString().padStart(3, '0');
  
  return `${prefix}${newNumber}`;
}

/**
 * Generate stock count number: SC-YYYYMMDD-XXX
 */
export async function generateStockCountNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  const prefix = `SC-${dateStr}-`;
  
  const countsRef = collection(db, 'stock_counts');
  const q = query(
    countsRef,
    where('countNumber', '>=', prefix),
    where('countNumber', '<', `${prefix}\uf8ff`),
    orderBy('countNumber', 'desc')
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return `${prefix}001`;
  }
  
  const lastCode = snapshot.docs[0].data().countNumber;
  const lastNumber = parseInt(lastCode.split('-')[2]);
  const newNumber = (lastNumber + 1).toString().padStart(3, '0');
  
  return `${prefix}${newNumber}`;
}

/**
 * Convert quantity between UOMs
 */
export function convertQuantity(
  quantity: number,
  fromUom: UnitOfMeasure,
  toUom: UnitOfMeasure,
  material: InventoryMaterial
): number {
  if (fromUom === toUom) return quantity;
  
  // Convert to base UOM first
  let baseQuantity = quantity;
  if (fromUom !== material.baseUom) {
    const alternateUom = material.alternateUoms?.find(u => u.uom === fromUom);
    if (!alternateUom) {
      throw new Error(`UOM ${fromUom} not found for material ${material.materialCode}`);
    }
    baseQuantity = quantity * alternateUom.conversionFactor;
  }
  
  // Convert from base UOM to target UOM
  if (toUom === material.baseUom) {
    return baseQuantity;
  }
  
  const targetUom = material.alternateUoms?.find(u => u.uom === toUom);
  if (!targetUom) {
    throw new Error(`UOM ${toUom} not found for material ${material.materialCode}`);
  }
  
  return baseQuantity / targetUom.conversionFactor;
}

// ============================================================================
// MATERIAL MASTER DATA
// ============================================================================

/**
 * Create new inventory material
 */
export async function createMaterial(
  input: CreateMaterialInput,
  userId: string,
  userName: string
): Promise<string> {
  const materialCode = await generateMaterialCode();
  
  const materialData: Omit<InventoryMaterial, 'id'> = {
    materialCode,
    materialName: input.materialName,
    category: input.category,
    description: input.description,
    specification: input.specification,
    manufacturer: input.manufacturer,
    brand: input.brand,
    model: input.model,
    
    baseUom: input.baseUom,
    alternateUoms: input.alternateUoms,
    
    currentStock: 0,
    reservedStock: 0,
    availableStock: 0,
    minimumStock: input.minimumStock,
    maximumStock: input.maximumStock,
    reorderQuantity: input.reorderQuantity,
    
    valuationMethod: input.valuationMethod,
    standardCost: input.standardCost,
    averageCost: 0,
    lastPurchasePrice: 0,
    totalValue: 0,
    
    isBatchTracked: input.isBatchTracked,
    isSerialTracked: input.isSerialTracked,
    isExpiryTracked: input.isExpiryTracked,
    shelfLife: input.shelfLife,
    expiryWarningDays: input.expiryWarningDays,
    
    defaultWarehouseId: input.defaultWarehouseId,
    defaultLocationId: input.defaultLocationId,
    
    preferredVendorId: input.preferredVendorId,
    leadTime: input.leadTime,
    
    status: MaterialStatus.ACTIVE,
    
    wbsCode: input.wbsCode,
    costCenter: input.costCenter,
    glAccount: input.glAccount,
    
    createdAt: Timestamp.now(),
    createdBy: { userId, userName },
    updatedAt: Timestamp.now(),
    
    notes: input.notes,
    images: [],
    documents: []
  };
  
  const materialsRef = collection(db, 'inventory_materials');
  const docRef = await addDoc(materialsRef, materialData);
  
  return docRef.id;
}

/**
 * Get materials with filters
 */
export async function getMaterials(filters?: MaterialFilters): Promise<InventoryMaterial[]> {
  let q = query(collection(db, 'inventory_materials'));
  
  if (filters?.category) {
    q = query(q, where('category', '==', filters.category));
  }
  
  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }
  
  if (filters?.warehouseId) {
    q = query(q, where('defaultWarehouseId', '==', filters.warehouseId));
  }
  
  if (filters?.vendorId) {
    q = query(q, where('preferredVendorId', '==', filters.vendorId));
  }
  
  q = query(q, orderBy('materialCode', 'desc'));
  
  const snapshot = await getDocs(q);
  const materials = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as InventoryMaterial[];
  
  // Client-side filtering
  let filtered = materials;
  
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(m =>
      m.materialCode.toLowerCase().includes(searchLower) ||
      m.materialName.toLowerCase().includes(searchLower) ||
      m.description?.toLowerCase().includes(searchLower)
    );
  }
  
  if (filters?.lowStock) {
    filtered = filtered.filter(m => m.currentStock <= m.minimumStock && m.currentStock > 0);
  }
  
  if (filters?.outOfStock) {
    filtered = filtered.filter(m => m.currentStock === 0);
  }
  
  // Expiry tracking would require checking stock movements with expiry dates
  // This is a simplified version
  
  return filtered;
}

/**
 * Get material by ID
 */
export async function getMaterialById(materialId: string): Promise<InventoryMaterial | null> {
  const docRef = doc(db, 'inventory_materials', materialId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return {
    id: docSnap.id,
    ...docSnap.data()
  } as InventoryMaterial;
}

/**
 * Update material
 */
export async function updateMaterial(
  materialId: string,
  input: UpdateMaterialInput,
  userId: string,
  userName: string
): Promise<void> {
  const docRef = doc(db, 'inventory_materials', materialId);
  
  await updateDoc(docRef, {
    ...input,
    updatedAt: Timestamp.now(),
    updatedBy: { userId, userName }
  });
}

/**
 * Delete material (soft delete - set to inactive)
 */
export async function deleteMaterial(materialId: string): Promise<void> {
  const docRef = doc(db, 'inventory_materials', materialId);
  await updateDoc(docRef, {
    status: MaterialStatus.DISCONTINUED,
    updatedAt: Timestamp.now()
  });
}

/**
 * Check stock availability
 */
export async function checkStockAvailability(
  materialId: string,
  requiredQuantity: number,
  warehouseId?: string
): Promise<{
  available: boolean;
  currentStock: number;
  availableStock: number;
  shortfall: number;
}> {
  const material = await getMaterialById(materialId);
  
  if (!material) {
    throw new Error(`Material ${materialId} not found`);
  }
  
  const available = material.availableStock >= requiredQuantity;
  const shortfall = available ? 0 : requiredQuantity - material.availableStock;
  
  return {
    available,
    currentStock: material.currentStock,
    availableStock: material.availableStock,
    shortfall
  };
}

// ============================================================================
// INVENTORY TRANSACTIONS
// ============================================================================

/**
 * Create inventory transaction (IN/OUT/ADJUSTMENT/TRANSFER/RETURN)
 */
export async function createTransaction(
  input: CreateTransactionInput,
  userId: string,
  userName: string
): Promise<string> {
  const transactionCode = await generateTransactionCode(input.transactionType);
  
  // Get warehouse details
  const warehouseDoc = await getDoc(doc(db, 'warehouses', input.warehouseId));
  if (!warehouseDoc.exists()) {
    throw new Error(`Warehouse ${input.warehouseId} not found`);
  }
  const warehouseName = warehouseDoc.data().warehouseName;
  
  // Calculate total value
  let totalValue = 0;
  const processedItems = [];
  
  for (const item of input.items) {
    const material = await getMaterialById(item.materialId);
    if (!material) {
      throw new Error(`Material ${item.materialId} not found`);
    }
    
    // Convert to base quantity
    const baseQuantity = convertQuantity(item.quantity, item.uom, material.baseUom, material);
    
    const itemValue = item.quantity * item.unitCost;
    totalValue += itemValue;
    
    processedItems.push({
      id: `${Date.now()}_${Math.random()}`,
      materialId: item.materialId,
      materialCode: material.materialCode,
      materialName: material.materialName,
      quantity: item.quantity,
      uom: item.uom,
      baseQuantity,
      batchNumber: item.batchNumber,
      serialNumber: item.serialNumber,
      expiryDate: item.expiryDate,
      manufacturingDate: item.manufacturingDate,
      unitCost: item.unitCost,
      totalCost: itemValue,
      warehouseId: input.warehouseId,
      locationId: item.locationId,
      binLocation: item.binLocation,
      toWarehouseId: input.toWarehouseId,
      toLocationId: input.toLocationId,
      stockBefore: material.currentStock,
      stockAfter: material.currentStock, // Will be updated after transaction
      notes: item.notes
    });
  }
  
  const requiresApproval = input.transactionType === TransactionType.ADJUSTMENT;
  
  const transactionData: Omit<InventoryTransaction, 'id'> = {
    transactionCode,
    transactionType: input.transactionType,
    transactionDate: input.transactionDate,
    status: requiresApproval ? TransactionStatus.PENDING_APPROVAL : TransactionStatus.DRAFT,
    
    items: processedItems,
    
    warehouseId: input.warehouseId,
    warehouseName,
    locationId: input.locationId,
    locationName: undefined,
    
    toWarehouseId: input.toWarehouseId,
    toWarehouseName: undefined,
    toLocationId: input.toLocationId,
    toLocationName: undefined,
    
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    referenceNumber: input.referenceNumber,
    
    totalValue,
    
    reason: input.reason,
    reasonCategory: input.reasonCategory as any,
    
    approvalRequired: requiresApproval,
    
    createdAt: Timestamp.now(),
    createdBy: { userId, userName },
    
    notes: input.notes,
    attachments: []
  };
  
  const transactionsRef = collection(db, 'inventory_transactions');
  const docRef = await addDoc(transactionsRef, transactionData);
  
  return docRef.id;
}

/**
 * Complete transaction - updates stock levels
 */
export async function completeTransaction(
  transactionId: string,
  userId: string,
  userName: string
): Promise<void> {
  return runTransaction(db, async (transaction) => {
    const transactionDocRef = doc(db, 'inventory_transactions', transactionId);
    const transactionDoc = await transaction.get(transactionDocRef);
    
    if (!transactionDoc.exists()) {
      throw new Error('Transaction not found');
    }
    
    const txnData = transactionDoc.data() as InventoryTransaction;
    
    if (txnData.status === TransactionStatus.COMPLETED) {
      throw new Error('Transaction already completed');
    }
    
    if (txnData.approvalRequired && txnData.status !== TransactionStatus.APPROVED) {
      throw new Error('Transaction requires approval before completion');
    }
    
    // Update stock levels for each item
    for (const item of txnData.items) {
      const materialRef = doc(db, 'inventory_materials', item.materialId);
      const materialDoc = await transaction.get(materialRef);
      
      if (!materialDoc.exists()) {
        throw new Error(`Material ${item.materialId} not found`);
      }
      
      const material = materialDoc.data() as InventoryMaterial;
      
      let stockChange = 0;
      
      switch (txnData.transactionType) {
        case TransactionType.IN:
          stockChange = item.baseQuantity;
          break;
        case TransactionType.OUT:
          stockChange = -item.baseQuantity;
          break;
        case TransactionType.ADJUSTMENT:
          stockChange = item.baseQuantity; // Can be positive or negative
          break;
        case TransactionType.TRANSFER:
          // For now, just decrease from source (increase to destination handled separately)
          stockChange = -item.baseQuantity;
          break;
        case TransactionType.RETURN:
          stockChange = -item.baseQuantity;
          break;
      }
      
      const newStock = material.currentStock + stockChange;
      const newAvailable = newStock - material.reservedStock;
      
      // Update material stock
      transaction.update(materialRef, {
        currentStock: newStock,
        availableStock: newAvailable,
        totalValue: newStock * (material.averageCost || material.standardCost || 0),
        updatedAt: Timestamp.now()
      });
      
      // Create stock movement record
      const movementData: Omit<StockMovement, 'id'> = {
        movementDate: txnData.transactionDate,
        materialId: item.materialId,
        materialCode: item.materialCode,
        materialName: item.materialName,
        transactionId: transactionId,
        transactionCode: txnData.transactionCode,
        transactionType: txnData.transactionType,
        quantity: stockChange,
        uom: item.uom,
        stockBefore: material.currentStock,
        stockAfter: newStock,
        unitCost: item.unitCost,
        totalCost: item.totalCost,
        valuationMethod: material.valuationMethod,
        warehouseId: txnData.warehouseId,
        locationId: item.locationId,
        batchNumber: item.batchNumber,
        serialNumber: item.serialNumber,
        expiryDate: item.expiryDate,
        referenceType: txnData.referenceType,
        referenceId: txnData.referenceId,
        referenceNumber: txnData.referenceNumber,
        createdAt: Timestamp.now(),
        createdBy: { userId, userName }
      };
      
      const movementsRef = collection(db, 'stock_movements');
      transaction.set(doc(movementsRef), movementData);
      
      // Update item stockAfter
      item.stockAfter = newStock;
      
      // Check for stock alerts
      await checkAndCreateStockAlerts(material.id, newStock, material);
    }
    
    // Update transaction status
    transaction.update(transactionDocRef, {
      status: TransactionStatus.COMPLETED,
      completedAt: Timestamp.now(),
      completedBy: { userId, userName },
      items: txnData.items
    });
  });
}

/**
 * Approve transaction (for adjustments)
 */
export async function approveTransaction(
  transactionId: string,
  userId: string,
  userName: string,
  approvalNotes?: string
): Promise<void> {
  const docRef = doc(db, 'inventory_transactions', transactionId);
  
  await updateDoc(docRef, {
    status: TransactionStatus.APPROVED,
    approvedAt: Timestamp.now(),
    approvedBy: { userId, userName },
    approvalNotes
  });
}

/**
 * Get transactions with filters
 */
export async function getTransactions(filters?: TransactionFilters): Promise<InventoryTransaction[]> {
  let q = query(collection(db, 'inventory_transactions'));
  
  if (filters?.transactionType) {
    q = query(q, where('transactionType', '==', filters.transactionType));
  }
  
  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }
  
  if (filters?.warehouseId) {
    q = query(q, where('warehouseId', '==', filters.warehouseId));
  }
  
  if (filters?.referenceType) {
    q = query(q, where('referenceType', '==', filters.referenceType));
  }
  
  if (filters?.referenceId) {
    q = query(q, where('referenceId', '==', filters.referenceId));
  }
  
  q = query(q, orderBy('transactionDate', 'desc'));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as InventoryTransaction[];
}

// ============================================================================
// STOCK COUNT (PHYSICAL INVENTORY)
// ============================================================================

/**
 * Create stock count
 */
export async function createStockCount(
  input: CreateStockCountInput,
  userId: string,
  userName: string
): Promise<string> {
  const countNumber = await generateStockCountNumber();
  
  // Get warehouse details
  const warehouseDoc = await getDoc(doc(db, 'warehouses', input.warehouseId));
  if (!warehouseDoc.exists()) {
    throw new Error(`Warehouse ${input.warehouseId} not found`);
  }
  const warehouseName = warehouseDoc.data().warehouseName;
  
  // Get materials to count
  let materialsToCount: InventoryMaterial[] = [];
  
  if (input.countType === 'full') {
    // Count all materials in warehouse
    materialsToCount = await getMaterials({ warehouseId: input.warehouseId });
  } else if (input.materialIds && input.materialIds.length > 0) {
    // Count specific materials
    for (const id of input.materialIds) {
      const material = await getMaterialById(id);
      if (material) materialsToCount.push(material);
    }
  } else if (input.categories && input.categories.length > 0) {
    // Count by categories
    for (const category of input.categories) {
      const materials = await getMaterials({ category, warehouseId: input.warehouseId });
      materialsToCount.push(...materials);
    }
  }
  
  // Create stock count items
  const items = materialsToCount.map(material => ({
    id: `${Date.now()}_${Math.random()}`,
    materialId: material.id,
    materialCode: material.materialCode,
    materialName: material.materialName,
    uom: material.baseUom,
    systemQuantity: material.currentStock,
    countedQuantity: 0,
    variance: 0,
    variancePercentage: 0,
    hasDiscrepancy: false,
    unitCost: material.averageCost || material.standardCost || 0,
    varianceValue: 0,
    adjustmentApproved: false,
    notes: ''
  }));
  
  const countData: Omit<StockCount, 'id'> = {
    countNumber,
    countName: input.countName,
    countDate: input.countDate,
    status: StockCountStatus.PLANNED,
    
    warehouseId: input.warehouseId,
    warehouseName,
    locationId: input.locationId,
    locationName: undefined,
    countType: input.countType,
    
    materialIds: input.materialIds,
    categories: input.categories,
    
    plannedCount: items.length,
    countedItems: 0,
    discrepanciesFound: 0,
    
    countBy: input.countBy.map(id => ({ userId: id, userName: '' })),
    supervisor: input.supervisorId ? { userId: input.supervisorId, userName: '' } : undefined,
    
    items,
    
    adjustmentCreated: false,
    
    createdAt: Timestamp.now(),
    createdBy: { userId, userName },
    
    notes: input.notes,
    attachments: []
  };
  
  const countsRef = collection(db, 'stock_counts');
  const docRef = await addDoc(countsRef, countData);
  
  return docRef.id;
}

/**
 * Start stock count
 */
export async function startStockCount(countId: string): Promise<void> {
  const docRef = doc(db, 'stock_counts', countId);
  await updateDoc(docRef, {
    status: StockCountStatus.IN_PROGRESS,
    startedAt: Timestamp.now()
  });
}

/**
 * Update stock count item (record counted quantity)
 */
export async function updateStockCountItem(
  countId: string,
  itemId: string,
  input: UpdateStockCountItemInput,
  userId: string
): Promise<void> {
  const docRef = doc(db, 'stock_counts', countId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('Stock count not found');
  }
  
  const countData = docSnap.data() as StockCount;
  
  const itemIndex = countData.items.findIndex(item => item.id === itemId);
  if (itemIndex === -1) {
    throw new Error('Stock count item not found');
  }
  
  const item = countData.items[itemIndex];
  
  // Update item
  item.countedQuantity = input.countedQuantity;
  item.countedBy = userId;
  item.countedAt = Timestamp.now();
  item.variance = input.countedQuantity - item.systemQuantity;
  item.variancePercentage = item.systemQuantity > 0 
    ? (item.variance / item.systemQuantity) * 100 
    : 0;
  item.hasDiscrepancy = item.variance !== 0;
  item.varianceValue = item.variance * item.unitCost;
  
  if (input.batchNumber) item.batchNumber = input.batchNumber;
  if (input.serialNumber) item.serialNumber = input.serialNumber;
  if (input.expiryDate) item.expiryDate = input.expiryDate;
  if (input.locationId) item.locationId = input.locationId;
  if (input.binLocation) item.binLocation = input.binLocation;
  if (input.notes) item.notes = input.notes;
  
  // Update counts
  const countedItems = countData.items.filter(i => i.countedQuantity > 0 || i.countedAt).length;
  const discrepancies = countData.items.filter(i => i.hasDiscrepancy).length;
  
  await updateDoc(docRef, {
    items: countData.items,
    countedItems,
    discrepanciesFound: discrepancies
  });
}

/**
 * Complete stock count
 */
export async function completeStockCount(
  countId: string,
  userId: string,
  userName: string
): Promise<void> {
  const docRef = doc(db, 'stock_counts', countId);
  await updateDoc(docRef, {
    status: StockCountStatus.COMPLETED,
    completedAt: Timestamp.now()
  });
}

/**
 * Approve stock count and create adjustment transaction
 */
export async function approveStockCount(
  countId: string,
  userId: string,
  userName: string
): Promise<string | null> {
  const docRef = doc(db, 'stock_counts', countId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('Stock count not found');
  }
  
  const countData = docSnap.data() as StockCount;
  
  // Filter items with discrepancies
  const discrepancies = countData.items.filter(item => item.hasDiscrepancy);
  
  if (discrepancies.length === 0) {
    // No discrepancies, just mark as approved
    await updateDoc(docRef, {
      status: StockCountStatus.APPROVED,
      approvedAt: Timestamp.now(),
      approvedBy: { userId, userName }
    });
    return null;
  }
  
  // Create adjustment transaction for discrepancies
  const adjustmentItems = discrepancies.map(item => ({
    materialId: item.materialId,
    quantity: item.variance, // Can be positive or negative
    uom: item.uom,
    unitCost: item.unitCost,
    batchNumber: item.batchNumber,
    serialNumber: item.serialNumber,
    expiryDate: item.expiryDate,
    locationId: item.locationId,
    binLocation: item.binLocation,
    notes: `Stock count adjustment: ${item.notes || 'Physical count discrepancy'}`
  }));
  
  const adjustmentId = await createTransaction(
    {
      transactionType: TransactionType.ADJUSTMENT,
      transactionDate: Timestamp.now(),
      items: adjustmentItems,
      warehouseId: countData.warehouseId,
      locationId: countData.locationId,
      referenceType: 'STOCK_COUNT',
      referenceId: countId,
      referenceNumber: countData.countNumber,
      reason: `Adjustment from stock count ${countData.countNumber}`,
      reasonCategory: 'reconciliation',
      notes: `Auto-generated from stock count approval`
    },
    userId,
    userName
  );
  
  // Auto-approve and complete the adjustment
  await approveTransaction(adjustmentId, userId, userName, 'Auto-approved from stock count');
  await completeTransaction(adjustmentId, userId, userName);
  
  // Update stock count
  await updateDoc(docRef, {
    status: StockCountStatus.APPROVED,
    approvedAt: Timestamp.now(),
    approvedBy: { userId, userName },
    adjustmentCreated: true,
    adjustmentTransactionId: adjustmentId
  });
  
  return adjustmentId;
}

/**
 * Get stock counts with filters
 */
export async function getStockCounts(filters?: StockCountFilters): Promise<StockCount[]> {
  let q = query(collection(db, 'stock_counts'));
  
  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }
  
  if (filters?.warehouseId) {
    q = query(q, where('warehouseId', '==', filters.warehouseId));
  }
  
  if (filters?.countType) {
    q = query(q, where('countType', '==', filters.countType));
  }
  
  q = query(q, orderBy('countDate', 'desc'));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as StockCount[];
}

// ============================================================================
// STOCK ALERTS
// ============================================================================

/**
 * Check and create stock alerts based on stock levels
 */
async function checkAndCreateStockAlerts(
  materialId: string,
  currentStock: number,
  material: InventoryMaterial
): Promise<void> {
  const alerts: Omit<StockAlert, 'id'>[] = [];
  
  // Low stock alert
  if (currentStock <= material.minimumStock && currentStock > 0) {
    alerts.push({
      alertType: StockAlertType.LOW_STOCK,
      severity: 'high',
      materialId,
      materialCode: material.materialCode,
      materialName: material.materialName,
      currentStock,
      minimumStock: material.minimumStock,
      recommendedAction: `Reorder ${material.reorderQuantity} ${material.baseUom}`,
      warehouseId: material.defaultWarehouseId || '',
      warehouseName: '',
      isAcknowledged: false,
      isResolved: false,
      createdAt: Timestamp.now()
    });
  }
  
  // Out of stock alert
  if (currentStock === 0) {
    alerts.push({
      alertType: StockAlertType.OUT_OF_STOCK,
      severity: 'critical',
      materialId,
      materialCode: material.materialCode,
      materialName: material.materialName,
      currentStock,
      minimumStock: material.minimumStock,
      recommendedAction: `Urgent: Reorder ${material.reorderQuantity} ${material.baseUom}`,
      warehouseId: material.defaultWarehouseId || '',
      warehouseName: '',
      isAcknowledged: false,
      isResolved: false,
      createdAt: Timestamp.now()
    });
  }
  
  // Overstock alert
  if (material.maximumStock > 0 && currentStock > material.maximumStock) {
    alerts.push({
      alertType: StockAlertType.OVERSTOCK,
      severity: 'medium',
      materialId,
      materialCode: material.materialCode,
      materialName: material.materialName,
      currentStock,
      maximumStock: material.maximumStock,
      recommendedAction: 'Consider reducing reorder quantity',
      warehouseId: material.defaultWarehouseId || '',
      warehouseName: '',
      isAcknowledged: false,
      isResolved: false,
      createdAt: Timestamp.now()
    });
  }
  
  // Save alerts
  const alertsRef = collection(db, 'stock_alerts');
  for (const alert of alerts) {
    await addDoc(alertsRef, alert);
  }
}

/**
 * Get stock alerts
 */
export async function getStockAlerts(resolved: boolean = false): Promise<StockAlert[]> {
  const q = query(
    collection(db, 'stock_alerts'),
    where('isResolved', '==', resolved),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as StockAlert[];
}

/**
 * Acknowledge stock alert
 */
export async function acknowledgeStockAlert(
  alertId: string,
  userId: string,
  userName: string
): Promise<void> {
  const docRef = doc(db, 'stock_alerts', alertId);
  await updateDoc(docRef, {
    isAcknowledged: true,
    acknowledgedAt: Timestamp.now(),
    acknowledgedBy: { userId, userName }
  });
}

/**
 * Resolve stock alert
 */
export async function resolveStockAlert(
  alertId: string,
  resolution: string
): Promise<void> {
  const docRef = doc(db, 'stock_alerts', alertId);
  await updateDoc(docRef, {
    isResolved: true,
    resolvedAt: Timestamp.now(),
    resolution
  });
}

// ============================================================================
// WAREHOUSE & LOCATION
// ============================================================================

/**
 * Create warehouse
 */
export async function createWarehouse(
  input: CreateWarehouseInput,
  userId: string,
  userName: string
): Promise<string> {
  const warehouseData: Omit<Warehouse, 'id'> = {
    warehouseCode: `WH-${Date.now().toString().slice(-6)}`,
    warehouseName: input.warehouseName,
    warehouseType: input.warehouseType,
    address: input.address,
    city: input.city,
    province: input.province,
    totalCapacity: input.totalCapacity,
    usedCapacity: 0,
    managerId: input.managerId,
    managerName: input.managerName,
    contactPerson: input.contactPerson,
    contactPhone: input.contactPhone,
    isActive: true,
    locations: [],
    projectId: input.projectId,
    siteCode: input.siteCode,
    createdAt: Timestamp.now(),
    createdBy: { userId, userName },
    updatedAt: Timestamp.now(),
    notes: input.notes
  };
  
  const warehousesRef = collection(db, 'warehouses');
  const docRef = await addDoc(warehousesRef, warehouseData);
  
  return docRef.id;
}

/**
 * Get all warehouses
 */
export async function getWarehouses(): Promise<Warehouse[]> {
  const q = query(collection(db, 'warehouses'), where('isActive', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Warehouse[];
}

/**
 * Add location to warehouse
 */
export async function addWarehouseLocation(
  warehouseId: string,
  input: CreateLocationInput
): Promise<void> {
  const docRef = doc(db, 'warehouses', warehouseId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('Warehouse not found');
  }
  
  const warehouse = docSnap.data() as Warehouse;
  const locations = warehouse.locations || [];
  
  const newLocation: StorageLocation = {
    id: `${Date.now()}_${Math.random()}`,
    locationCode: input.locationCode,
    locationName: input.locationName,
    locationType: input.locationType,
    parentLocationId: input.parentLocationId,
    capacity: input.capacity,
    usedCapacity: 0,
    isActive: true,
    description: input.description,
    restrictions: input.restrictions
  };
  
  locations.push(newLocation);
  
  await updateDoc(docRef, {
    locations,
    updatedAt: Timestamp.now()
  });
}

// ============================================================================
// ANALYTICS & SUMMARY
// ============================================================================

/**
 * Get inventory summary
 */
export async function getInventorySummary(projectId: string): Promise<InventorySummary> {
  const materials = await getMaterials();
  const alerts = await getStockAlerts(false);
  const warehouses = await getWarehouses();
  const transactions = await getTransactions();
  const stockCounts = await getStockCounts({ status: StockCountStatus.PLANNED });
  
  const totalMaterials = materials.length;
  const activeMaterials = materials.filter(m => m.status === MaterialStatus.ACTIVE).length;
  const totalValue = materials.reduce((sum, m) => sum + m.totalValue, 0);
  
  const lowStockItems = alerts.filter(a => a.alertType === StockAlertType.LOW_STOCK).length;
  const outOfStockItems = alerts.filter(a => a.alertType === StockAlertType.OUT_OF_STOCK).length;
  const expiringItems = alerts.filter(a => a.alertType === StockAlertType.EXPIRING_SOON).length;
  
  // Top materials by value
  const topMaterials = materials
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 10)
    .map(m => ({
      materialId: m.id,
      materialCode: m.materialCode,
      materialName: m.materialName,
      currentStock: m.currentStock,
      totalValue: m.totalValue
    }));
  
  // Stock movement trend (simplified - last 30 days)
  const stockMovementTrend: InventorySummary['stockMovementTrend'] = [];
  
  return {
    totalMaterials,
    activeMaterials,
    totalValue,
    lowStockItems,
    outOfStockItems,
    expiringItems,
    totalWarehouses: warehouses.length,
    totalTransactions: transactions.length,
    pendingStockCounts: stockCounts.length,
    topMaterialsByValue: topMaterials,
    stockMovementTrend
  };
}

/**
 * Get stock valuation for a material
 */
export async function getStockValuation(materialId: string): Promise<StockValuation | null> {
  const material = await getMaterialById(materialId);
  if (!material) return null;
  
  const valuation: StockValuation = {
    materialId: material.id,
    materialCode: material.materialCode,
    materialName: material.materialName,
    quantity: material.currentStock,
    valuationMethod: material.valuationMethod,
    totalValue: material.totalValue
  };
  
  // For FIFO, get layers from stock movements
  if (material.valuationMethod === ValuationMethod.FIFO) {
    // Simplified - would need to track actual FIFO layers
    valuation.fifoLayers = [];
  }
  
  // For average cost
  if (material.valuationMethod === ValuationMethod.AVERAGE) {
    valuation.averageCost = material.averageCost;
  }
  
  return valuation;
}
