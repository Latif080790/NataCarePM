import { Timestamp } from 'firebase/firestore';

// ============================================================================
// ENUMS
// ============================================================================

export enum MaterialCategory {
  RAW_MATERIAL = 'raw_material',
  CONSUMABLE = 'consumable',
  SPARE_PART = 'spare_part',
  TOOL = 'tool',
  EQUIPMENT = 'equipment',
  CHEMICAL = 'chemical',
  SAFETY_EQUIPMENT = 'safety_equipment',
  OFFICE_SUPPLY = 'office_supply',
  OTHER = 'other'
}

export enum UnitOfMeasure {
  // Length
  METER = 'm',
  CENTIMETER = 'cm',
  MILLIMETER = 'mm',
  KILOMETER = 'km',
  INCH = 'in',
  FOOT = 'ft',
  
  // Weight
  KILOGRAM = 'kg',
  GRAM = 'g',
  TON = 'ton',
  POUND = 'lb',
  
  // Volume
  LITER = 'l',
  MILLILITER = 'ml',
  CUBIC_METER = 'm3',
  GALLON = 'gal',
  
  // Quantity
  PIECE = 'pcs',
  UNIT = 'unit',
  SET = 'set',
  PAIR = 'pair',
  BOX = 'box',
  PACK = 'pack',
  ROLL = 'roll',
  SHEET = 'sheet',
  BUNDLE = 'bundle',
  
  // Area
  SQUARE_METER = 'm2',
  SQUARE_FOOT = 'ft2',
  
  // Other
  HOUR = 'hour',
  DAY = 'day',
  MONTH = 'month'
}

export enum MaterialStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
  OBSOLETE = 'obsolete'
}

export enum TransactionType {
  IN = 'in',                    // Goods Receipt from PO
  OUT = 'out',                  // Material usage/consumption
  ADJUSTMENT = 'adjustment',    // Stock adjustment (reconciliation)
  TRANSFER = 'transfer',        // Warehouse to warehouse transfer
  RETURN = 'return'            // Return to vendor
}

export enum TransactionStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum StockCountStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  APPROVED = 'approved',
  CANCELLED = 'cancelled'
}

export enum ValuationMethod {
  FIFO = 'fifo',              // First In First Out
  LIFO = 'lifo',              // Last In First Out
  AVERAGE = 'average',        // Weighted Average
  STANDARD = 'standard'       // Standard Cost
}

export enum StockAlertType {
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  EXPIRING_SOON = 'expiring_soon',
  EXPIRED = 'expired',
  OVERSTOCK = 'overstock'
}

export enum WarehouseType {
  MAIN = 'main',
  SITE = 'site',
  TEMPORARY = 'temporary',
  VENDOR = 'vendor'
}

// ============================================================================
// MAIN INTERFACES
// ============================================================================

export interface InventoryMaterial {
  id: string;
  materialCode: string;           // MAT-YYYYMMDD-XXX
  materialName: string;
  category: MaterialCategory;
  description?: string;
  
  // Classification
  specification?: string;
  manufacturer?: string;
  brand?: string;
  model?: string;
  
  // Unit & Measurement
  baseUom: UnitOfMeasure;        // Base unit of measure
  alternateUoms?: AlternateUom[]; // Alternative UOMs with conversion
  
  // Stock Information
  currentStock: number;
  reservedStock: number;          // Stock allocated to MRs/POs
  availableStock: number;         // currentStock - reservedStock
  minimumStock: number;           // Reorder point
  maximumStock: number;           // Maximum stock level
  reorderQuantity: number;        // Suggested reorder quantity
  
  // Valuation
  valuationMethod: ValuationMethod;
  standardCost?: number;          // Standard cost per unit
  averageCost?: number;           // Moving average cost
  lastPurchasePrice?: number;
  totalValue: number;             // currentStock * cost (based on valuation method)
  
  // Tracking
  isBatchTracked: boolean;        // Track by batch/lot number
  isSerialTracked: boolean;       // Track by serial number
  isExpiryTracked: boolean;       // Track expiry dates
  
  // Expiry Management
  shelfLife?: number;             // In days
  expiryWarningDays?: number;     // Days before expiry to alert
  
  // Location
  defaultWarehouseId?: string;
  defaultLocationId?: string;
  
  // Vendor Information
  preferredVendorId?: string;
  preferredVendorName?: string;
  leadTime?: number;              // In days
  
  // Status
  status: MaterialStatus;
  
  // Integration References
  wbsCode?: string;               // Link to WBS
  costCenter?: string;
  glAccount?: string;
  
  // Audit Trail
  createdAt: Timestamp;
  createdBy: {
    userId: string;
    userName: string;
  };
  updatedAt: Timestamp;
  updatedBy?: {
    userId: string;
    userName: string;
  };
  
  // Additional
  notes?: string;
  images?: string[];
  documents?: MaterialDocument[];
  customFields?: Record<string, any>;
}

export interface AlternateUom {
  uom: UnitOfMeasure;
  conversionFactor: number;       // How many base units in this UOM
  // Example: Base = PCS, Alternate = BOX (12 pcs), conversionFactor = 12
}

export interface MaterialDocument {
  id: string;
  documentType: string;           // datasheet, certificate, manual, etc.
  fileName: string;
  fileUrl: string;
  uploadedAt: Timestamp;
  uploadedBy: string;
}

// ============================================================================
// INVENTORY TRANSACTION
// ============================================================================

export interface InventoryTransaction {
  id: string;
  transactionCode: string;        // INV-IN-YYYYMMDD-XXX, INV-OUT-YYYYMMDD-XXX
  transactionType: TransactionType;
  transactionDate: Timestamp;
  status: TransactionStatus;
  
  // Items
  items: InventoryTransactionItem[];
  
  // Location
  warehouseId: string;
  warehouseName: string;
  locationId?: string;
  locationName?: string;
  
  // Transfer specific (if type = TRANSFER)
  toWarehouseId?: string;
  toWarehouseName?: string;
  toLocationId?: string;
  toLocationName?: string;
  
  // Reference Documents
  referenceType?: string;         // GR, MR, PO, ADJ, SC (Stock Count)
  referenceId?: string;
  referenceNumber?: string;
  
  // Valuation
  totalValue: number;             // Sum of all items value
  
  // Reason (for adjustments)
  reason?: string;
  reasonCategory?: 'damage' | 'loss' | 'found' | 'expired' | 'reconciliation' | 'other';
  
  // Approval (for adjustments)
  approvalRequired: boolean;
  approvedAt?: Timestamp;
  approvedBy?: {
    userId: string;
    userName: string;
  };
  approvalNotes?: string;
  
  // Audit Trail
  createdAt: Timestamp;
  createdBy: {
    userId: string;
    userName: string;
  };
  completedAt?: Timestamp;
  completedBy?: {
    userId: string;
    userName: string;
  };
  
  // Additional
  notes?: string;
  attachments?: string[];
}

export interface InventoryTransactionItem {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  
  // Quantity
  quantity: number;
  uom: UnitOfMeasure;
  baseQuantity: number;           // Quantity in base UOM
  
  // Tracking
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: Timestamp;
  manufacturingDate?: Timestamp;
  
  // Valuation
  unitCost: number;
  totalCost: number;              // quantity * unitCost
  
  // Location
  warehouseId: string;
  locationId?: string;
  binLocation?: string;
  
  // Transfer destination (if type = TRANSFER)
  toWarehouseId?: string;
  toLocationId?: string;
  toBinLocation?: string;
  
  // Stock Before/After
  stockBefore: number;
  stockAfter: number;
  
  // Additional
  notes?: string;
}

// ============================================================================
// STOCK COUNT (PHYSICAL INVENTORY)
// ============================================================================

export interface StockCount {
  id: string;
  countNumber: string;            // SC-YYYYMMDD-XXX
  countName: string;
  countDate: Timestamp;
  status: StockCountStatus;
  
  // Scope
  warehouseId: string;
  warehouseName: string;
  locationId?: string;
  locationName?: string;
  countType: 'full' | 'partial' | 'cycle';
  
  // Materials to count
  materialIds?: string[];         // If partial, specific materials
  categories?: MaterialCategory[]; // If partial, by category
  
  // Count Details
  plannedCount: number;           // Number of materials to count
  countedItems: number;           // Number of materials counted
  discrepanciesFound: number;     // Number of discrepancies
  
  // Team
  countBy: {
    userId: string;
    userName: string;
  }[];
  supervisor?: {
    userId: string;
    userName: string;
  };
  
  // Progress
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  approvedAt?: Timestamp;
  approvedBy?: {
    userId: string;
    userName: string;
  };
  
  // Results
  items: StockCountItem[];
  
  // Adjustments
  adjustmentCreated: boolean;
  adjustmentTransactionId?: string;
  
  // Audit Trail
  createdAt: Timestamp;
  createdBy: {
    userId: string;
    userName: string;
  };
  
  // Additional
  notes?: string;
  attachments?: string[];
}

export interface StockCountItem {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  uom: UnitOfMeasure;
  
  // System Stock
  systemQuantity: number;         // Stock per system
  
  // Physical Count
  countedQuantity: number;        // Actual counted quantity
  countedBy?: string;
  countedAt?: Timestamp;
  
  // Discrepancy
  variance: number;               // countedQuantity - systemQuantity
  variancePercentage: number;     // (variance / systemQuantity) * 100
  hasDiscrepancy: boolean;        // variance !== 0
  
  // Tracking
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: Timestamp;
  
  // Location
  locationId?: string;
  binLocation?: string;
  
  // Valuation
  unitCost: number;
  varianceValue: number;          // variance * unitCost
  
  // Resolution
  discrepancyReason?: string;
  adjustmentApproved: boolean;
  adjustedAt?: Timestamp;
  
  // Additional
  notes?: string;
  images?: string[];              // Photos of counted items
}

// ============================================================================
// WAREHOUSE & LOCATION
// ============================================================================

export interface Warehouse {
  id: string;
  warehouseCode: string;          // WH-XXX
  warehouseName: string;
  warehouseType: WarehouseType;
  
  // Location
  address?: string;
  city?: string;
  province?: string;
  
  // Capacity
  totalCapacity?: number;         // In square meters
  usedCapacity?: number;
  
  // Manager
  managerId?: string;
  managerName?: string;
  contactPerson?: string;
  contactPhone?: string;
  
  // Status
  isActive: boolean;
  
  // Locations/Zones within warehouse
  locations?: StorageLocation[];
  
  // Integration
  projectId?: string;
  siteCode?: string;
  
  // Audit Trail
  createdAt: Timestamp;
  createdBy: {
    userId: string;
    userName: string;
  };
  updatedAt: Timestamp;
  
  // Additional
  notes?: string;
}

export interface StorageLocation {
  id: string;
  locationCode: string;           // A1, B2, etc.
  locationName: string;
  locationType: 'rack' | 'shelf' | 'zone' | 'bin' | 'floor' | 'outdoor';
  
  // Hierarchy
  parentLocationId?: string;      // For nested locations
  
  // Capacity
  capacity?: number;
  usedCapacity?: number;
  
  // Status
  isActive: boolean;
  
  // Additional
  description?: string;
  restrictions?: string;          // e.g., "Hazardous materials only"
}

// ============================================================================
// STOCK ALERT
// ============================================================================

export interface StockAlert {
  id: string;
  alertType: StockAlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // Material
  materialId: string;
  materialCode: string;
  materialName: string;
  
  // Stock Information
  currentStock: number;
  minimumStock?: number;
  maximumStock?: number;
  recommendedAction?: string;
  
  // Expiry (if applicable)
  expiryDate?: Timestamp;
  daysUntilExpiry?: number;
  
  // Location
  warehouseId: string;
  warehouseName: string;
  locationId?: string;
  
  // Tracking
  batchNumber?: string;
  serialNumber?: string;
  
  // Status
  isAcknowledged: boolean;
  acknowledgedAt?: Timestamp;
  acknowledgedBy?: {
    userId: string;
    userName: string;
  };
  isResolved: boolean;
  resolvedAt?: Timestamp;
  resolution?: string;
  
  // Audit Trail
  createdAt: Timestamp;
  
  // Additional
  notes?: string;
}

// ============================================================================
// STOCK MOVEMENT (LEDGER)
// ============================================================================

export interface StockMovement {
  id: string;
  movementDate: Timestamp;
  
  // Material
  materialId: string;
  materialCode: string;
  materialName: string;
  
  // Transaction
  transactionId: string;
  transactionCode: string;
  transactionType: TransactionType;
  
  // Quantity
  quantity: number;               // Positive for IN, negative for OUT
  uom: UnitOfMeasure;
  
  // Stock Balance
  stockBefore: number;
  stockAfter: number;
  
  // Valuation
  unitCost: number;
  totalCost: number;
  valuationMethod: ValuationMethod;
  
  // Location
  warehouseId: string;
  locationId?: string;
  
  // Tracking
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: Timestamp;
  
  // Reference
  referenceType?: string;
  referenceId?: string;
  referenceNumber?: string;
  
  // Audit Trail
  createdAt: Timestamp;
  createdBy: {
    userId: string;
    userName: string;
  };
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateMaterialInput {
  materialName: string;
  category: MaterialCategory;
  description?: string;
  specification?: string;
  manufacturer?: string;
  brand?: string;
  model?: string;
  
  baseUom: UnitOfMeasure;
  alternateUoms?: Omit<AlternateUom, 'id'>[];
  
  minimumStock: number;
  maximumStock: number;
  reorderQuantity: number;
  
  valuationMethod: ValuationMethod;
  standardCost?: number;
  
  isBatchTracked: boolean;
  isSerialTracked: boolean;
  isExpiryTracked: boolean;
  shelfLife?: number;
  expiryWarningDays?: number;
  
  defaultWarehouseId?: string;
  defaultLocationId?: string;
  preferredVendorId?: string;
  leadTime?: number;
  
  wbsCode?: string;
  costCenter?: string;
  glAccount?: string;
  
  notes?: string;
}

export interface UpdateMaterialInput {
  materialName?: string;
  category?: MaterialCategory;
  description?: string;
  specification?: string;
  manufacturer?: string;
  brand?: string;
  model?: string;
  
  baseUom?: UnitOfMeasure;
  alternateUoms?: AlternateUom[];
  
  minimumStock?: number;
  maximumStock?: number;
  reorderQuantity?: number;
  
  valuationMethod?: ValuationMethod;
  standardCost?: number;
  
  isBatchTracked?: boolean;
  isSerialTracked?: boolean;
  isExpiryTracked?: boolean;
  shelfLife?: number;
  expiryWarningDays?: number;
  
  defaultWarehouseId?: string;
  defaultLocationId?: string;
  preferredVendorId?: string;
  leadTime?: number;
  
  status?: MaterialStatus;
  
  wbsCode?: string;
  costCenter?: string;
  glAccount?: string;
  
  notes?: string;
}

export interface CreateTransactionInput {
  transactionType: TransactionType;
  transactionDate: Timestamp;
  
  items: {
    materialId: string;
    quantity: number;
    uom: UnitOfMeasure;
    unitCost: number;
    batchNumber?: string;
    serialNumber?: string;
    expiryDate?: Timestamp;
    manufacturingDate?: Timestamp;
    locationId?: string;
    binLocation?: string;
    notes?: string;
  }[];
  
  warehouseId: string;
  locationId?: string;
  
  toWarehouseId?: string;
  toLocationId?: string;
  
  referenceType?: string;
  referenceId?: string;
  referenceNumber?: string;
  
  reason?: string;
  reasonCategory?: string;
  
  notes?: string;
}

export interface CreateStockCountInput {
  countName: string;
  countDate: Timestamp;
  countType: 'full' | 'partial' | 'cycle';
  
  warehouseId: string;
  locationId?: string;
  materialIds?: string[];
  categories?: MaterialCategory[];
  
  countBy: string[];              // User IDs
  supervisorId?: string;
  
  notes?: string;
}

export interface UpdateStockCountItemInput {
  countedQuantity: number;
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: Timestamp;
  locationId?: string;
  binLocation?: string;
  notes?: string;
}

export interface CreateWarehouseInput {
  warehouseName: string;
  warehouseType: WarehouseType;
  address?: string;
  city?: string;
  province?: string;
  totalCapacity?: number;
  managerId?: string;
  managerName?: string;
  contactPerson?: string;
  contactPhone?: string;
  projectId?: string;
  siteCode?: string;
  notes?: string;
}

export interface CreateLocationInput {
  locationCode: string;
  locationName: string;
  locationType: 'rack' | 'shelf' | 'zone' | 'bin' | 'floor' | 'outdoor';
  parentLocationId?: string;
  capacity?: number;
  description?: string;
  restrictions?: string;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface MaterialFilters {
  category?: MaterialCategory;
  status?: MaterialStatus;
  search?: string;                // Search by code, name, description
  warehouseId?: string;
  lowStock?: boolean;             // Stock below minimum
  outOfStock?: boolean;           // Stock = 0
  expiringSoon?: boolean;         // Expiry within warning days
  vendorId?: string;
}

export interface TransactionFilters {
  transactionType?: TransactionType;
  status?: TransactionStatus;
  warehouseId?: string;
  startDate?: Timestamp;
  endDate?: Timestamp;
  referenceType?: string;
  referenceId?: string;
  search?: string;
}

export interface StockCountFilters {
  status?: StockCountStatus;
  warehouseId?: string;
  countType?: 'full' | 'partial' | 'cycle';
  startDate?: Timestamp;
  endDate?: Timestamp;
  hasDiscrepancies?: boolean;
}

// ============================================================================
// ANALYTICS & SUMMARY
// ============================================================================

export interface InventorySummary {
  totalMaterials: number;
  activeMaterials: number;
  totalValue: number;
  
  lowStockItems: number;
  outOfStockItems: number;
  expiringItems: number;
  
  totalWarehouses: number;
  totalTransactions: number;
  pendingStockCounts: number;
  
  topMaterialsByValue: {
    materialId: string;
    materialCode: string;
    materialName: string;
    currentStock: number;
    totalValue: number;
  }[];
  
  stockMovementTrend: {
    date: string;
    inbound: number;
    outbound: number;
    value: number;
  }[];
}

export interface StockValuation {
  materialId: string;
  materialCode: string;
  materialName: string;
  
  quantity: number;
  valuationMethod: ValuationMethod;
  
  // FIFO Layers
  fifoLayers?: {
    batchNumber?: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    receiptDate: Timestamp;
  }[];
  
  // Average Cost
  averageCost?: number;
  totalValue: number;
}
