/**
 * Unit Tests for Inventory Service
 * 
 * Tests coverage:
 * - Material CRUD operations (create, read, update, delete)
 * - Material code generation (MAT-YYYYMMDD-XXX format)
 * - Stock availability checking
 * - Inventory transactions (IN, OUT, TRANSFER, ADJUSTMENT)
 * - Transaction approval workflow
 * - Stock count operations (create, start, update, complete, approve)
 * - Stock alerts (low stock, out of stock, expiring soon, overstock)
 * - Warehouse and location management
 * - Inventory summary and analytics
 * - Edge cases and error handling
 * 
 * Created: November 13, 2025 (Week 3 Day 6)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
  runTransaction,
  Timestamp,
} from 'firebase/firestore';

// Mock Firebase Config
vi.mock('@/firebaseConfig', () => ({
  db: {},
}));

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  runTransaction: vi.fn(),
  initializeFirestore: vi.fn(),
  persistentLocalCache: vi.fn(),
  persistentMultipleTabManager: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: 1699900000, nanoseconds: 0 })),
    fromDate: vi.fn((date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 })),
  },
}));

// Mock audit helper
vi.mock('@/utils/auditHelper', () => ({
  auditHelper: {
    logAction: vi.fn(),
    logCreate: vi.fn().mockResolvedValue(undefined),
    logUpdate: vi.fn().mockResolvedValue(undefined),
    logDelete: vi.fn().mockResolvedValue(undefined),
    logStatusChange: vi.fn().mockResolvedValue(undefined),
    logApproval: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock logger
vi.mock('@/utils/logger.enhanced', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Import service functions after mocks
import * as inventoryService from '../inventoryService';

const {
  generateMaterialCode,
  generateTransactionCode,
  generateStockCountNumber,
  convertQuantity,
  createMaterial,
  getMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
  checkStockAvailability,
  createTransaction,
  completeTransaction,
  approveTransaction,
  getTransactions,
  createStockCount,
  startStockCount,
  updateStockCountItem,
  completeStockCount,
  approveStockCount,
  getStockCounts,
  getStockAlerts,
  acknowledgeStockAlert,
  resolveStockAlert,
  createWarehouse,
  getWarehouses,
  addWarehouseLocation,
  getInventorySummary,
} = inventoryService;

describe('inventoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mock implementations
    vi.mocked(getDoc).mockReset();
    vi.mocked(getDocs).mockReset();
    vi.mocked(addDoc).mockReset();
    vi.mocked(updateDoc).mockReset();
    vi.mocked(deleteDoc).mockReset();
    vi.mocked(runTransaction).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==================== CODE GENERATION ====================

  describe('generateMaterialCode', () => {
    it('should generate material code in MAT-YYYYMMDD-XXX format', async () => {
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      const code = await generateMaterialCode();

      expect(code).toMatch(/^MAT-\d{8}-001$/);
      expect(getDocs).toHaveBeenCalled();
    });

    it('should increment sequence number for existing materials', async () => {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            data: () => ({ materialCode: `MAT-${today}-005` }),
          },
        ],
      } as any);

      const code = await generateMaterialCode();

      expect(code).toBe(`MAT-${today}-006`);
    });

    it('should handle missing docs gracefully', async () => {
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
        docs: null,
      } as any);

      const code = await generateMaterialCode();

      expect(code).toMatch(/^MAT-\d{8}-001$/);
    });
  });

  describe('generateTransactionCode', () => {
    it('should generate transaction code with type prefix', async () => {
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      const code = await generateTransactionCode('IN');

      expect(code).toMatch(/^TRX-IN-\d{8}-001$/);
    });

    it('should support different transaction types', async () => {
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      const codeOut = await generateTransactionCode('OUT');

      expect(codeOut).toMatch(/^TRX-OUT-\d{8}-001$/);
    });
  });

  describe('generateStockCountNumber', () => {
    it('should generate stock count number in SC-YYYYMMDD-XXX format', async () => {
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      const number = await generateStockCountNumber();

      expect(number).toMatch(/^SC-\d{8}-001$/);
    });
  });

  describe('convertQuantity', () => {
    it('should convert between units correctly', () => {
      const result = convertQuantity(1000, 'kg', 'ton');

      expect(result).toBe(1);
    });

    it('should return same quantity for same units', () => {
      const result = convertQuantity(100, 'pcs', 'pcs');

      expect(result).toBe(100);
    });

    it('should handle invalid conversions', () => {
      const result = convertQuantity(100, 'kg', 'invalid_unit' as any);

      expect(result).toBe(100); // Should fallback
    });
  });

  // ==================== MATERIAL CRUD ====================

  describe('createMaterial', () => {
    it('should create material with generated code', async () => {
      const mockInput = {
        materialName: 'Portland Cement',
        category: 'Material',
        subcategory: 'Cement',
        baseUom: 'sak',
        unitPrice: 85000,
        minimumStock: 10,
        maximumStock: 100,
        reorderPoint: 20,
        reorderQuantity: 50,
        projectId: 'proj-123',
      };

      // Mock material code generation
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      // Mock addDoc
      vi.mocked(addDoc).mockResolvedValueOnce({
        id: 'mat-new-123',
      } as any);

      // Mock final getDoc
      vi.mocked(getDoc).mockResolvedValueOnce({
        id: 'mat-new-123',
        exists: () => true,
        data: () => ({
          materialCode: 'MAT-20251113-001',
          materialName: 'Portland Cement',
          currentStock: 0,
        }),
      } as any);

      const result = await createMaterial(mockInput, 'user-123', 'John Doe');

      expect(result).toBeDefined();
      expect(result.id).toBe('mat-new-123');
      expect(addDoc).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const invalidInput = {
        materialName: '',
        category: 'Material',
        baseUom: 'pcs',
        unitPrice: 0,
        projectId: 'proj-123',
      } as any;

      await expect(
        createMaterial(invalidInput, 'user-123', 'John Doe')
      ).rejects.toThrow();
    });
  });

  describe('getMaterials', () => {
    it('should return all materials', async () => {
      const mockMaterials = [
        { id: 'mat-1', materialCode: 'MAT-001', materialName: 'Cement' },
        { id: 'mat-2', materialCode: 'MAT-002', materialName: 'Steel' },
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: mockMaterials.map(m => ({
          id: m.id,
          data: () => m,
        })),
      } as any);

      const result = await getMaterials();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('mat-1');
    });

    it('should filter by category when provided', async () => {
      const mockMaterials = [
        { id: 'mat-1', category: 'Material' },
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: mockMaterials.map(m => ({
          id: m.id,
          data: () => m,
        })),
      } as any);

      const result = await getMaterials({ category: 'Material' });

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('Material');
    });
  });

  describe('getMaterialById', () => {
    it('should return material when found', async () => {
      const mockMaterial = {
        materialCode: 'MAT-001',
        materialName: 'Cement',
        currentStock: 100,
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        id: 'mat-123',
        exists: () => true,
        data: () => mockMaterial,
      } as any);

      const result = await getMaterialById('mat-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('mat-123');
      expect(result?.materialName).toBe('Cement');
    });

    it('should return null when material not found', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false,
      } as any);

      const result = await getMaterialById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateMaterial', () => {
    it('should update material successfully', async () => {
      const mockMaterial = {
        materialCode: 'MAT-001',
        currentStock: 100,
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        id: 'mat-123',
        exists: () => true,
        data: () => mockMaterial,
      } as any);

      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      await updateMaterial('mat-123', {
        minimumStock: 15,
        maximumStock: 150,
      });

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should reject update of non-existent material', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false,
      } as any);

      await expect(
        updateMaterial('non-existent', { minimumStock: 10 })
      ).rejects.toThrow('not found');
    });
  });

  describe('deleteMaterial', () => {
    it('should delete material with zero stock', async () => {
      const mockMaterial = {
        currentStock: 0,
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        id: 'mat-123',
        exists: () => true,
        data: () => mockMaterial,
      } as any);

      vi.mocked(deleteDoc).mockResolvedValueOnce(undefined as any);

      await deleteMaterial('mat-123');

      expect(deleteDoc).toHaveBeenCalled();
    });

    it('should reject deletion of material with stock', async () => {
      const mockMaterial = {
        currentStock: 50,
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        id: 'mat-123',
        exists: () => true,
        data: () => mockMaterial,
      } as any);

      await expect(
        deleteMaterial('mat-123')
      ).rejects.toThrow('current stock');
    });
  });

  // ==================== STOCK AVAILABILITY ====================

  describe('checkStockAvailability', () => {
    it('should return available when stock sufficient', async () => {
      const mockMaterial = {
        currentStock: 100,
        reservedStock: 20,
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockMaterial,
      } as any);

      const result = await checkStockAvailability('mat-123', 50);

      expect(result.isAvailable).toBe(true);
      expect(result.availableQuantity).toBe(80); // 100 - 20
    });

    it('should return not available when stock insufficient', async () => {
      const mockMaterial = {
        currentStock: 30,
        reservedStock: 10,
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockMaterial,
      } as any);

      const result = await checkStockAvailability('mat-123', 50);

      expect(result.isAvailable).toBe(false);
      expect(result.shortfall).toBe(30); // 50 - 20
    });
  });

  // ==================== TRANSACTIONS ====================

  describe('createTransaction', () => {
    it('should create IN transaction', async () => {
      const mockInput = {
        transactionType: 'IN' as const,
        materialId: 'mat-123',
        quantity: 100,
        fromWarehouseId: 'wh-001',
        projectId: 'proj-123',
        referenceType: 'GR',
        referenceId: 'gr-001',
      };

      // Mock transaction code generation
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      // Mock material fetch
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          materialCode: 'MAT-001',
          materialName: 'Cement',
          unitPrice: 85000,
        }),
      } as any);

      // Mock addDoc
      vi.mocked(addDoc).mockResolvedValueOnce({
        id: 'trx-new-123',
      } as any);

      // Mock final getDoc
      vi.mocked(getDoc).mockResolvedValueOnce({
        id: 'trx-new-123',
        exists: () => true,
        data: () => ({
          transactionCode: 'TRX-IN-20251113-001',
          transactionType: 'IN',
        }),
      } as any);

      const result = await createTransaction(mockInput, 'user-123', 'John Doe');

      expect(result).toBeDefined();
      expect(result.id).toBe('trx-new-123');
    });

    it('should create OUT transaction', async () => {
      const mockInput = {
        transactionType: 'OUT' as const,
        materialId: 'mat-123',
        quantity: 50,
        fromWarehouseId: 'wh-001',
        projectId: 'proj-123',
      };

      // Mock code gen
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      // Mock material
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          materialCode: 'MAT-001',
          currentStock: 100,
          unitPrice: 85000,
        }),
      } as any);

      vi.mocked(addDoc).mockResolvedValueOnce({ id: 'trx-out' } as any);
      vi.mocked(getDoc).mockResolvedValueOnce({
        id: 'trx-out',
        exists: () => true,
        data: () => ({ transactionType: 'OUT' }),
      } as any);

      const result = await createTransaction(mockInput, 'user-123', 'John Doe');

      expect(result.transactionType).toBe('OUT');
    });

    it('should validate quantity for OUT transaction', async () => {
      const mockInput = {
        transactionType: 'OUT' as const,
        materialId: 'mat-123',
        quantity: 150, // More than available
        fromWarehouseId: 'wh-001',
        projectId: 'proj-123',
      };

      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          materialCode: 'MAT-001',
          currentStock: 100,
          reservedStock: 0,
        }),
      } as any);

      await expect(
        createTransaction(mockInput, 'user-123', 'John Doe')
      ).rejects.toThrow('Insufficient stock');
    });
  });

  describe('completeTransaction', () => {
    it('should complete transaction and update stock', async () => {
      const mockTransaction = {
        transactionType: 'IN',
        materialId: 'mat-123',
        quantity: 100,
        status: 'PENDING',
      };

      const mockMaterial = {
        currentStock: 50,
      };

      // Mock transaction fetch
      vi.mocked(getDoc).mockResolvedValueOnce({
        id: 'trx-123',
        exists: () => true,
        data: () => mockTransaction,
      } as any);

      // Mock material fetch
      vi.mocked(getDoc).mockResolvedValueOnce({
        id: 'mat-123',
        exists: () => true,
        data: () => mockMaterial,
      } as any);

      vi.mocked(updateDoc).mockResolvedValue(undefined as any);

      await completeTransaction('trx-123', 'user-123');

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should reject completion of already completed transaction', async () => {
      const mockTransaction = {
        status: 'COMPLETED',
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockTransaction,
      } as any);

      await expect(
        completeTransaction('trx-123', 'user-123')
      ).rejects.toThrow('already completed');
    });
  });

  describe('approveTransaction', () => {
    it('should approve pending transaction', async () => {
      const mockTransaction = {
        status: 'PENDING',
        transactionType: 'IN',
        materialId: 'mat-123',
        quantity: 100,
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        id: 'trx-123',
        exists: () => true,
        data: () => mockTransaction,
      } as any);

      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      await approveTransaction('trx-123', 'approver-123', 'Jane Doe');

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should reject approval of completed transaction', async () => {
      const mockTransaction = {
        status: 'COMPLETED',
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockTransaction,
      } as any);

      await expect(
        approveTransaction('trx-123', 'approver-123', 'Jane Doe')
      ).rejects.toThrow('cannot approve');
    });
  });

  describe('getTransactions', () => {
    it('should return all transactions', async () => {
      const mockTransactions = [
        { id: 'trx-1', transactionType: 'IN' },
        { id: 'trx-2', transactionType: 'OUT' },
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: mockTransactions.map(t => ({
          id: t.id,
          data: () => t,
        })),
      } as any);

      const result = await getTransactions();

      expect(result).toHaveLength(2);
    });

    it('should filter by transaction type', async () => {
      const mockTransactions = [
        { id: 'trx-1', transactionType: 'IN' },
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: mockTransactions.map(t => ({
          id: t.id,
          data: () => t,
        })),
      } as any);

      const result = await getTransactions({ transactionType: 'IN' });

      expect(result).toHaveLength(1);
      expect(result[0].transactionType).toBe('IN');
    });
  });

  // ==================== STOCK COUNT ====================

  describe('createStockCount', () => {
    it('should create stock count with generated number', async () => {
      const mockInput = {
        countName: 'Monthly Stock Count',
        scheduledDate: new Date().toISOString(),
        warehouseId: 'wh-001',
        materialIds: ['mat-1', 'mat-2'],
        projectId: 'proj-123',
      };

      // Mock number generation
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      // Mock materials fetch
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [
          {
            id: 'mat-1',
            data: () => ({
              materialCode: 'MAT-001',
              materialName: 'Cement',
              currentStock: 100,
            }),
          },
          {
            id: 'mat-2',
            data: () => ({
              materialCode: 'MAT-002',
              materialName: 'Steel',
              currentStock: 50,
            }),
          },
        ],
      } as any);

      vi.mocked(addDoc).mockResolvedValueOnce({ id: 'sc-new' } as any);
      vi.mocked(getDoc).mockResolvedValueOnce({
        id: 'sc-new',
        exists: () => true,
        data: () => ({
          stockCountNumber: 'SC-20251113-001',
          status: 'PLANNED',
        }),
      } as any);

      const result = await createStockCount(mockInput, 'user-123', 'John Doe');

      expect(result).toBeDefined();
      expect(result.id).toBe('sc-new');
    });
  });

  describe('startStockCount', () => {
    it('should start planned stock count', async () => {
      const mockStockCount = {
        status: 'PLANNED',
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockStockCount,
      } as any);

      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      await startStockCount('sc-123');

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should reject starting already started count', async () => {
      const mockStockCount = {
        status: 'IN_PROGRESS',
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockStockCount,
      } as any);

      await expect(startStockCount('sc-123')).rejects.toThrow('already started');
    });
  });

  describe('updateStockCountItem', () => {
    it('should update counted quantity', async () => {
      const mockStockCount = {
        status: 'IN_PROGRESS',
        items: [
          {
            materialId: 'mat-123',
            systemQuantity: 100,
            countedQuantity: 0,
          },
        ],
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        id: 'sc-123',
        exists: () => true,
        data: () => mockStockCount,
      } as any);

      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      await updateStockCountItem('sc-123', 'mat-123', {
        countedQuantity: 98,
        notes: 'Minor discrepancy',
      });

      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('completeStockCount', () => {
    it('should complete stock count with all items counted', async () => {
      const mockStockCount = {
        status: 'IN_PROGRESS',
        items: [
          {
            materialId: 'mat-1',
            countedQuantity: 100,
          },
        ],
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockStockCount,
      } as any);

      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      await completeStockCount('sc-123', 'user-123');

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should reject completion with uncounted items', async () => {
      const mockStockCount = {
        status: 'IN_PROGRESS',
        items: [
          {
            materialId: 'mat-1',
            countedQuantity: null, // Not counted
          },
        ],
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockStockCount,
      } as any);

      await expect(
        completeStockCount('sc-123', 'user-123')
      ).rejects.toThrow('all items must be counted');
    });
  });

  describe('approveStockCount', () => {
    it('should approve completed stock count and create adjustments', async () => {
      const mockStockCount = {
        status: 'COMPLETED',
        items: [
          {
            materialId: 'mat-123',
            systemQuantity: 100,
            countedQuantity: 98,
            variance: -2,
          },
        ],
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        id: 'sc-123',
        exists: () => true,
        data: () => mockStockCount,
      } as any);

      // Mock material fetch for adjustment
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          materialCode: 'MAT-001',
          currentStock: 100,
        }),
      } as any);

      vi.mocked(updateDoc).mockResolvedValue(undefined as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'adj-1' } as any);

      await approveStockCount('sc-123', 'approver-123', 'Jane Doe');

      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('getStockCounts', () => {
    it('should return all stock counts', async () => {
      const mockCounts = [
        { id: 'sc-1', status: 'PLANNED' },
        { id: 'sc-2', status: 'IN_PROGRESS' },
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: mockCounts.map(c => ({
          id: c.id,
          data: () => c,
        })),
      } as any);

      const result = await getStockCounts();

      expect(result).toHaveLength(2);
    });
  });

  // ==================== STOCK ALERTS ====================

  describe('getStockAlerts', () => {
    it('should return unresolved alerts by default', async () => {
      const mockAlerts = [
        { id: 'alert-1', alertType: 'LOW_STOCK', isResolved: false },
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: mockAlerts.map(a => ({
          id: a.id,
          data: () => a,
        })),
      } as any);

      const result = await getStockAlerts(false);

      expect(result).toHaveLength(1);
      expect(result[0].isResolved).toBe(false);
    });

    it('should return resolved alerts when requested', async () => {
      const mockAlerts = [
        { id: 'alert-1', alertType: 'LOW_STOCK', isResolved: true },
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: mockAlerts.map(a => ({
          id: a.id,
          data: () => a,
        })),
      } as any);

      const result = await getStockAlerts(true);

      expect(result).toHaveLength(1);
      expect(result[0].isResolved).toBe(true);
    });
  });

  describe('acknowledgeStockAlert', () => {
    it('should acknowledge alert', async () => {
      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      await acknowledgeStockAlert('alert-123', 'user-123', 'John Doe');

      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('resolveStockAlert', () => {
    it('should resolve alert with resolution notes', async () => {
      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      await resolveStockAlert('alert-123', 'Reordered 100 units');

      expect(updateDoc).toHaveBeenCalled();
    });
  });

  // ==================== WAREHOUSE & LOCATION ====================

  describe('createWarehouse', () => {
    it('should create warehouse with generated code', async () => {
      const mockInput = {
        warehouseName: 'Main Warehouse',
        warehouseType: 'CENTRAL',
        address: 'Jl. Example No. 123',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        totalCapacity: 1000,
        managerId: 'mgr-123',
        managerName: 'Manager Name',
        contactPerson: 'Contact Person',
        contactPhone: '08123456789',
        projectId: 'proj-123',
        siteCode: 'SITE-001',
      };

      vi.mocked(addDoc).mockResolvedValueOnce({ id: 'wh-new' } as any);

      const result = await createWarehouse(mockInput, 'user-123', 'John Doe');

      expect(result).toBe('wh-new');
      expect(addDoc).toHaveBeenCalled();
    });
  });

  describe('getWarehouses', () => {
    it('should return active warehouses', async () => {
      const mockWarehouses = [
        { id: 'wh-1', warehouseName: 'Main', isActive: true },
        { id: 'wh-2', warehouseName: 'Secondary', isActive: true },
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: mockWarehouses.map(w => ({
          id: w.id,
          data: () => w,
        })),
      } as any);

      const result = await getWarehouses();

      expect(result).toHaveLength(2);
    });
  });

  describe('addWarehouseLocation', () => {
    it('should add location to warehouse', async () => {
      const mockWarehouse = {
        locations: [],
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockWarehouse,
      } as any);

      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      await addWarehouseLocation('wh-123', {
        locationCode: 'A-01',
        locationName: 'Aisle A Row 1',
        locationType: 'RACK',
        capacity: 100,
      });

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should reject adding location to non-existent warehouse', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false,
      } as any);

      await expect(
        addWarehouseLocation('non-existent', {
          locationCode: 'A-01',
          locationName: 'Test',
          locationType: 'RACK',
          capacity: 100,
        })
      ).rejects.toThrow('Warehouse not found');
    });
  });

  // ==================== ANALYTICS ====================

  describe('getInventorySummary', () => {
    it('should return comprehensive inventory summary', async () => {
      // Mock materials
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [
          {
            id: 'mat-1',
            data: () => ({
              status: 'ACTIVE',
              totalValue: 1000000,
            }),
          },
        ],
      } as any);

      // Mock alerts
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [
          {
            id: 'alert-1',
            data: () => ({ alertType: 'LOW_STOCK' }),
          },
        ],
      } as any);

      // Mock warehouses
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [
          {
            id: 'wh-1',
            data: () => ({ warehouseName: 'Main' }),
          },
        ],
      } as any);

      // Mock transactions
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [],
      } as any);

      // Mock stock counts
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [],
      } as any);

      const result = await getInventorySummary('proj-123');

      expect(result).toBeDefined();
      expect(result.totalMaterials).toBe(1);
    });
  });

  // ==================== EDGE CASES ====================

  describe('Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      vi.mocked(getDocs).mockRejectedValueOnce(new Error('Network error'));

      await expect(getMaterials()).rejects.toThrow('Network error');
    });

    it('should handle concurrent transactions', async () => {
      const mockInput = {
        transactionType: 'IN' as const,
        materialId: 'mat-123',
        quantity: 50,
        fromWarehouseId: 'wh-001',
        projectId: 'proj-123',
      };

      vi.mocked(getDocs).mockResolvedValue({
        empty: true,
        docs: [],
      } as any);

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          materialCode: 'MAT-001',
          currentStock: 100,
          unitPrice: 85000,
        }),
      } as any);

      vi.mocked(addDoc).mockResolvedValue({ id: 'trx-concurrent' } as any);

      const promises = [
        createTransaction(mockInput, 'user-1', 'User One'),
        createTransaction(mockInput, 'user-2', 'User Two'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(2);
    });

    it('should handle very large quantities', async () => {
      const mockMaterial = {
        currentStock: 999999999,
        reservedStock: 0,
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockMaterial,
      } as any);

      const result = await checkStockAvailability('mat-123', 500000000);

      expect(result.isAvailable).toBe(true);
    });

    it('should handle special characters in material names', async () => {
      const mockInput = {
        materialName: 'Cement (Type I) [50kg]',
        category: 'Material',
        baseUom: 'sak',
        unitPrice: 85000,
        projectId: 'proj-123',
      };

      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      vi.mocked(addDoc).mockResolvedValueOnce({ id: 'mat-special' } as any);
      vi.mocked(getDoc).mockResolvedValueOnce({
        id: 'mat-special',
        exists: () => true,
        data: () => ({
          materialName: 'Cement (Type I) [50kg]',
        }),
      } as any);

      const result = await createMaterial(mockInput, 'user-123', 'John Doe');

      expect(result.materialName).toContain('(Type I)');
    });

    it('should handle null/undefined gracefully in filters', async () => {
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [],
      } as any);

      const result = await getMaterials({
        category: undefined,
        status: undefined,
      } as any);

      expect(result).toEqual([]);
    });
  });
});
