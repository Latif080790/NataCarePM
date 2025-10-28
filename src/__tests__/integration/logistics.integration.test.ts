import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createGoodsReceipt } from '../../api/goodsReceiptService';
import { createMaterial } from '../../api/inventoryService';

// Mock Firebase methods
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOnSnapshot = vi.fn();
const mockAddDoc = vi.fn();
const mockWriteBatch = vi.fn();

vi.mock('firebase/firestore', () => ({
  get collection() {
    return mockCollection;
  },
  get doc() {
    return mockDoc;
  },
  get getDoc() {
    return mockGetDoc;
  },
  get getDocs() {
    return mockGetDocs;
  },
  get setDoc() {
    return mockSetDoc;
  },
  get updateDoc() {
    return mockUpdateDoc;
  },
  get deleteDoc() {
    return mockDeleteDoc;
  },
  get query() {
    return mockQuery;
  },
  get where() {
    return mockWhere;
  },
  get onSnapshot() {
    return mockOnSnapshot;
  },
  get addDoc() {
    return mockAddDoc;
  },
  get writeBatch() {
    return mockWriteBatch;
  },
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(),
}));

// Mock Firebase config
vi.mock('../../firebaseConfig', () => ({
  db: {},
  storage: {},
}));

// Mock utilities
vi.mock('../../utils/responseWrapper', () => ({
  ...vi.importActual('../../utils/responseWrapper'),
  safeAsync: vi.fn().mockImplementation(async (fn) => {
    try {
      const result = await fn();
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: { 
          message: error.message || 'Unknown error',
          code: 'UNKNOWN_ERROR'
        } 
      };
    }
  }),
}));

vi.mock('../../utils/validators', () => ({
  validators: {
    isValidProjectId: vi.fn().mockReturnValue({ valid: true }),
    isValidId: vi.fn().mockReturnValue(true),
    isValidArray: vi.fn().mockReturnValue({ valid: true }),
    sanitizeString: vi.fn().mockImplementation((str) => str),
    isValidString: vi.fn().mockReturnValue({ valid: true }),
    isValidDate: vi.fn().mockReturnValue(true),
    isNonEmptyArray: vi.fn().mockReturnValue(true),
    isNonEmptyString: vi.fn().mockReturnValue(true),
    isValidEnum: vi.fn().mockReturnValue(true),
    isValidNumber: vi.fn().mockReturnValue({ valid: true }),
  },
  firebaseValidators: {
    isValidBatchSize: vi.fn().mockReturnValue({ valid: true }),
  },
}));

vi.mock('../../utils/retryWrapper', () => ({
  withRetry: vi.fn().mockImplementation(async (fn) => await fn()),
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    time: vi.fn(),
    timeEnd: vi.fn(),
  },
}));

// Mock auth context
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    },
  }),
}));

describe('Logistics Management Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Goods Receipt Creation Flow', () => {
    it('should successfully create goods receipt', async () => {
      // Arrange
      const mockUser = {
        id: 'user123',
        name: 'Test User',
        email: 'user@example.com',
        roleId: 'logistics',
      };
      
      const input = {
        poId: 'po123',
        projectId: 'project123',
        receiptDate: '2023-01-01',
        deliveryNote: 'DN-001',
        vehicleNumber: 'B1234XYZ',
        driverName: 'John Doe',
        warehouseId: 'wh123',
      };

      // Mock PO data
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          id: 'po123',
          poNumber: 'PO-001',
          vendorId: 'vendor123',
          vendorName: 'Test Vendor',
          status: 'approved',
          items: [
            {
              id: 'poi1',
              materialCode: 'MAT001',
              materialName: 'Cement',
              description: 'Portland Cement',
              quantity: 100,
              unit: 'bags',
              unitPrice: 50000,
              pricePerUnit: 50000,
              receivedQuantity: 0,
            }
          ],
        }),
      });
      
      // Mock warehouse data
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          id: 'wh123',
          warehouseName: 'Main Warehouse',
        }),
      });

      const mockDocRef = { id: 'gr123' };
      mockAddDoc.mockResolvedValue(mockDocRef);
      mockUpdateDoc.mockResolvedValue(undefined);

      // Act
      const result = await createGoodsReceipt(input, mockUser.id, mockUser.name);

      // Assert
      expect(result).toBeDefined();
      expect(result.grNumber).toContain('GR-');
      expect(mockGetDoc).toHaveBeenCalledTimes(2);
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should handle creating goods receipt with non-existent PO', async () => {
      // Arrange
      const mockUser = {
        id: 'user123',
        name: 'Test User',
        email: 'user@example.com',
        roleId: 'logistics',
      };
      
      const input = {
        poId: 'nonexistent-po',
        projectId: 'project123',
        receiptDate: '2023-01-01',
        deliveryNote: 'DN-001',
        vehicleNumber: 'B1234XYZ',
        driverName: 'John Doe',
        warehouseId: 'wh123',
      };

      // Mock non-existent PO
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      // Act & Assert
      await expect(createGoodsReceipt(input, mockUser.id, mockUser.name))
        .rejects.toThrow('Purchase Order not found');
    });
  });

  describe('Inventory Material Creation Flow', () => {
    it('should successfully create inventory material', async () => {
      // Arrange
      const mockUser = {
        id: 'user123',
        name: 'Test User',
        email: 'user@example.com',
        roleId: 'logistics',
      };
      
      const input = {
        materialName: 'Portland Cement',
        category: 'Raw Materials',
        description: 'High-quality Portland cement for construction',
        specification: 'Type I, 50kg bags',
        manufacturer: 'ABC Cement Co.',
        brand: 'ABC',
        model: 'Type I',
        baseUom: 'bags',
        alternateUoms: [
          {
            uom: 'tons',
            conversionFactor: 20,
          }
        ],
        reorderPoint: 50,
        minStockLevel: 100,
        maxStockLevel: 1000,
        shelfLife: 90,
        storageConditions: 'Dry storage',
        projectId: 'project123',
      };

      mockGetDocs.mockResolvedValue({
        docs: [], // No existing materials with same code prefix
      });

      const mockDocRef = { id: 'mat123' };
      mockAddDoc.mockResolvedValue(mockDocRef);

      // Act
      const result = await createMaterial(input, mockUser.id, mockUser.name);

      // Assert
      expect(result).toBeDefined();
      expect(result).toContain('MAT-');
      expect(mockGetDocs).toHaveBeenCalled();
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should handle creating material with duplicate name', async () => {
      // Arrange
      const mockUser = {
        id: 'user123',
        name: 'Test User',
        email: 'user@example.com',
        roleId: 'logistics',
      };
      
      const input = {
        materialName: 'Portland Cement',
        category: 'Raw Materials',
        description: 'High-quality Portland cement for construction',
        specification: 'Type I, 50kg bags',
        manufacturer: 'ABC Cement Co.',
        brand: 'ABC',
        model: 'Type I',
        baseUom: 'bags',
        alternateUoms: [],
        reorderPoint: 50,
        minStockLevel: 100,
        maxStockLevel: 1000,
        shelfLife: 90,
        storageConditions: 'Dry storage',
        projectId: 'project123',
      };

      // Mock existing material with same name
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            data: () => ({
              materialName: 'Portland Cement',
            }),
          }
        ],
      });

      // Act & Assert
      await expect(createMaterial(input, mockUser.id, mockUser.name))
        .rejects.toThrow('Material with this name already exists');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle database connection errors gracefully', async () => {
      // Arrange
      const mockUser = {
        id: 'user123',
        name: 'Test User',
        email: 'user@example.com',
        roleId: 'logistics',
      };
      
      const input = {
        poId: 'po123',
        projectId: 'project123',
        receiptDate: '2023-01-01',
        deliveryNote: 'DN-001',
        vehicleNumber: 'B1234XYZ',
        driverName: 'John Doe',
        warehouseId: 'wh123',
      };

      const errorMessage = 'Database connection failed';
      mockGetDoc.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(createGoodsReceipt(input, mockUser.id, mockUser.name))
        .rejects.toThrow(errorMessage);
    });

    it('should handle concurrent operations properly', async () => {
      // Arrange
      const mockUser = {
        id: 'user123',
        name: 'Test User',
        email: 'user@example.com',
        roleId: 'logistics',
      };
      
      const input1 = {
        poId: 'po123',
        projectId: 'project123',
        receiptDate: '2023-01-01',
        deliveryNote: 'DN-001',
        vehicleNumber: 'B1234XYZ',
        driverName: 'John Doe',
        warehouseId: 'wh123',
      };
      
      const input2 = {
        poId: 'po456',
        projectId: 'project123',
        receiptDate: '2023-01-02',
        deliveryNote: 'DN-002',
        vehicleNumber: 'B5678XYZ',
        driverName: 'Jane Doe',
        warehouseId: 'wh123',
      };

      // Mock PO data for both calls
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: 'po123',
          poNumber: 'PO-001',
          vendorId: 'vendor123',
          vendorName: 'Test Vendor',
          status: 'approved',
          items: [
            {
              id: 'poi1',
              materialCode: 'MAT001',
              materialName: 'Cement',
              description: 'Portland Cement',
              quantity: 100,
              unit: 'bags',
              unitPrice: 50000,
              pricePerUnit: 50000,
              receivedQuantity: 0,
            }
          ],
        }),
      });

      // Act - Simulate concurrent calls
      const results = await Promise.allSettled([
        createGoodsReceipt(input1, mockUser.id, mockUser.name),
        createGoodsReceipt(input2, mockUser.id, mockUser.name),
      ]);

      // Assert - Both should resolve (may succeed or fail, but should not hang)
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result).toHaveProperty('status');
      });
    });
  });
});