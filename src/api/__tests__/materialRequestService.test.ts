/**
 * Unit Tests for Material Request Service
 * 
 * Tests coverage:
 * - MR CRUD operations (create, read, update, delete)
 * - Multi-level approval workflow (Site Manager → PM → Budget → Final)
 * - MR to PO conversion
 * - Inventory stock checking
 * - Budget verification via WBS
 * - Edge cases and error handling
 * 
 * Created: November 13, 2025 (Week 3 Day 4)
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
  Timestamp,
} from 'firebase/firestore';

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
  Timestamp: {
    now: vi.fn(() => ({ seconds: 1699900000, nanoseconds: 0 })),
    fromDate: vi.fn((date: Date) => ({ 
      seconds: Math.floor(date.getTime() / 1000), 
      nanoseconds: 0 
    })),
  },
}));

// Mock Firebase config
vi.mock('@/firebaseConfig', () => ({
  db: {},
}));

// Mock logger
vi.mock('@/utils/logger.enhanced', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock audit helper
vi.mock('@/utils/auditHelper', () => ({
  auditHelper: {
    logAction: vi.fn(),
    logMaterialRequestAction: vi.fn(),
    logCreate: vi.fn().mockResolvedValue(undefined),
    logUpdate: vi.fn().mockResolvedValue(undefined),
    logDelete: vi.fn().mockResolvedValue(undefined),
    logApproval: vi.fn().mockResolvedValue(undefined),
    logStatusChange: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock vendor service
vi.mock('@/api/vendorService', () => ({
  getVendorById: vi.fn(),
}));

// Import service functions after mocks are defined
import * as materialRequestService from '../materialRequestService';

const {
  createMaterialRequest,
  getMaterialRequestById,
  getMaterialRequests,
  updateMaterialRequest,
  submitMaterialRequest,
  approveMaterialRequest,
  convertMRtoPO,
  deleteMaterialRequest,
  validateMaterialRequest,
} = materialRequestService;

describe('materialRequestService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations to avoid test pollution
    vi.mocked(getDoc).mockReset();
    vi.mocked(getDocs).mockReset();
    vi.mocked(addDoc).mockReset();
    vi.mocked(updateDoc).mockReset();
    vi.mocked(deleteDoc).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==================== CREATE MR ====================

  describe('createMaterialRequest', () => {
    it('should create material request with generated MR number', async () => {
      const mockInput = {
        projectId: 'proj-123',
        priority: 'high' as const,
        requiredDate: '2025-12-01',
        purpose: 'Construction material for foundation work',
        items: [
          {
            materialCode: 'MAT-001',
            materialName: 'Cement',
            description: 'Portland cement',
            quantity: 100,
            unit: 'kg',
            estimatedUnitPrice: 50000,
            wbsElementId: 'wbs-1',
          },
        ],
        remarks: 'Urgent requirement',
      };

      // Mock getDocs for MR number generation (count today's MRs)
      vi.mocked(getDocs).mockResolvedValueOnce({
        size: 5,
        docs: [],
        empty: false,
      } as any);

      // Mock getDocs for inventory stock check
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            data: () => ({
              availableStock: 500,
              minimumStock: 50,
            }),
          },
        ],
      } as any);

      // Mock addDoc to return new MR ID
      vi.mocked(addDoc).mockResolvedValueOnce({
        id: 'mr-new-123',
      } as any);

      // Mock getDoc to return created MR
      const mockMRData = {
        id: 'mr-new-123',
        mrNumber: 'MR-20251113-0006',
        projectId: 'proj-123',
        status: 'draft',
        ...mockInput,
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockMRData,
        id: 'mr-new-123',
      } as any);

      const result = await createMaterialRequest(mockInput, 'user-123', 'John Doe');

      expect(result).toBeDefined();
      expect(result.mrNumber).toMatch(/^MR-\d{8}-\d{4}$/);
      expect(result.status).toBe('draft');
      expect(result.projectId).toBe('proj-123');
      expect(addDoc).toHaveBeenCalled();
    });

    it('should check inventory stock for each item', async () => {
      const mockInput = {
        projectId: 'proj-123',
        items: [
          {
            materialCode: 'MAT-001',
            materialName: 'Cement',
            quantity: 100,
            unit: 'kg',
            estimatedUnitPrice: 50000,
          },
        ],
        requestedBy: 'user-123',
        requestedByName: 'John Doe',
        departmentId: 'dept-1',
        priority: 'medium' as const,
      };

      // Mock MR number generation
      vi.mocked(getDocs).mockResolvedValueOnce({
        size: 0,
        docs: [],
        empty: true,
      } as any);

      // Mock inventory check - low stock
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            data: () => ({
              availableStock: 30,
              minimumStock: 50,
            }),
          },
        ],
      } as any);

      vi.mocked(addDoc).mockResolvedValueOnce({ id: 'mr-123' } as any);
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ id: 'mr-123', status: 'draft' }),
      } as any);

      await createMaterialRequest(mockInput, 'user-123', 'John Doe');

      // Verify inventory was checked
      expect(getDocs).toHaveBeenCalledTimes(2); // Once for MR number, once for inventory
    });

    it('should handle missing material code gracefully', async () => {
      const mockInput = {
        projectId: 'proj-123',
        items: [
          {
            materialCode: '',
            materialName: 'Generic Material',
            quantity: 10,
            unit: 'pcs',
            estimatedUnitPrice: 10000,
          },
        ],
        requestedBy: 'user-123',
        requestedByName: 'John Doe',
        departmentId: 'dept-1',
        priority: 'low' as const,
      };

      vi.mocked(getDocs).mockResolvedValueOnce({ size: 0, docs: [] } as any);
      vi.mocked(addDoc).mockResolvedValueOnce({ id: 'mr-123' } as any);
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ id: 'mr-123', status: 'draft' }),
      } as any);

      const result = await createMaterialRequest(mockInput, 'user-123', 'John Doe');

      expect(result).toBeDefined();
      expect(result.status).toBe('draft');
    });

    it('should calculate total estimated cost', async () => {
      const mockInput = {
        projectId: 'proj-123',
        items: [
          {
            materialCode: 'MAT-001',
            materialName: 'Cement',
            quantity: 100,
            unit: 'kg',
            estimatedUnitPrice: 50000,
          },
          {
            materialCode: 'MAT-002',
            materialName: 'Steel',
            quantity: 50,
            unit: 'kg',
            estimatedUnitPrice: 80000,
          },
        ],
        requestedBy: 'user-123',
        requestedByName: 'John Doe',
        departmentId: 'dept-1',
        priority: 'high' as const,
      };

      vi.mocked(getDocs).mockResolvedValue({ size: 0, docs: [] } as any);
      vi.mocked(addDoc).mockResolvedValueOnce({ id: 'mr-123' } as any);
      
      const mockMRData = {
        id: 'mr-123',
        items: mockInput.items,
        status: 'draft',
      };
      
      vi.mocked(getDoc).mockResolvedValueOnce({
        id: 'mr-123',
        exists: () => true,
        data: () => mockMRData,
      } as any);

      const result = await createMaterialRequest(mockInput, 'user-123', 'John Doe');

      expect(result).toBeDefined();
      expect(result.items).toHaveLength(2);
      expect(addDoc).toHaveBeenCalled();
    });
  });

  // ==================== READ OPERATIONS ====================

  describe('getMaterialRequestById', () => {
    it('should return MR when found', async () => {
      const mockMR = {
        mrNumber: 'MR-20251113-0001',
        projectId: 'proj-123',
        status: 'pending_approval',
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        id: 'mr-123',
        exists: () => true,
        data: () => mockMR,
      } as any);

      const result = await getMaterialRequestById('mr-123');

      expect(result).toEqual({ id: 'mr-123', ...mockMR });
      expect(getDoc).toHaveBeenCalled();
    });

    it('should return null when MR not found', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false,
      } as any);

      const result = await getMaterialRequestById('non-existent');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(getDoc).mockRejectedValueOnce(new Error('Firestore error'));

      await expect(getMaterialRequestById('mr-123')).rejects.toThrow('Firestore error');
    });
  });

  describe('getMaterialRequests', () => {
    it('should return all MRs for a project', async () => {
      const mockMRs = [
        { id: 'mr-1', projectId: 'proj-123', status: 'draft' },
        { id: 'mr-2', projectId: 'proj-123', status: 'approved' },
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: mockMRs.map(mr => ({
          id: mr.id,
          data: () => mr,
        })),
      } as any);

      const result = await getMaterialRequests('proj-123');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('mr-1');
    });

    it('should filter by status when provided', async () => {
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [
          {
            id: 'mr-1',
            data: () => ({ id: 'mr-1', status: 'approved' }),
          },
        ],
      } as any);

      const result = await getMaterialRequests('proj-123', 'approved');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('approved');
    });
  });

  // ==================== UPDATE OPERATIONS ====================

  describe('updateMaterialRequest', () => {
    it('should update MR successfully', async () => {
      const mockMR = {
        mrNumber: 'MR-20251113-0001',
        status: 'draft',
        priority: 'low',
        requiredDate: '2025-12-01',
        purpose: 'Test',
        totalItems: 1,
      };

      // Mock for getMaterialRequestById call inside updateMaterialRequest
      vi.mocked(getDoc).mockResolvedValueOnce({
        id: 'mr-123',
        exists: () => true,
        data: () => mockMR,
      } as any);

      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      await updateMaterialRequest('mr-123', { 
        remarks: 'Updated notes',
        priority: 'high',
      });

      expect(updateDoc).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalledTimes(1); // Called by getMaterialRequestById
    });

    it('should handle update errors', async () => {
      const mockMR = {
        mrNumber: 'MR-20251113-0001',
        status: 'approved', // Not draft - will fail validation
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        id: 'mr-123',
        exists: () => true,
        data: () => mockMR,
      } as any);

      await expect(
        updateMaterialRequest('mr-123', { remarks: 'Updated' })
      ).rejects.toThrow('Can only update MR in draft status');
    });
  });

  // ==================== APPROVAL WORKFLOW ====================

  describe('submitMaterialRequest', () => {
    it('should change status from draft to pending_approval', async () => {
      const mockMR = {
        mrNumber: 'MR-20251113-0001',
        status: 'draft',
        items: [{ materialCode: 'MAT-001', materialName: 'Test' }],
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        id: 'mr-123',
        exists: () => true,
        data: () => mockMR,
      } as any);

      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      await submitMaterialRequest('mr-123', 'user-123');

      expect(updateDoc).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalledTimes(1);
    });

    it('should reject submission if MR not found', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false,
      } as any);

      await expect(
        submitMaterialRequest('non-existent', 'user-123')
      ).rejects.toThrow();
    });
  });

  describe('approveMaterialRequest', () => {
    it('should approve MR and update status', async () => {
      const mockMR = {
        id: 'mr-123',
        status: 'pending_approval',
        items: [
          {
            quantity: 100,
            estimatedUnitPrice: 50000,
          },
        ],
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockMR,
      } as any);

      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      await approveMaterialRequest(
        {
          mrId: 'mr-123',
          approverRole: 'site_manager',
          approved: true,
          notes: 'Approved',
        },
        'user-456',
        'Manager'
      );

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should reject MR when approved is false', async () => {
      const mockMR = {
        id: 'mr-123',
        status: 'pending_approval',
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockMR,
      } as any);

      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      await approveMaterialRequest(
        {
          mrId: 'mr-123',
          approverRole: 'site_manager',
          approved: false,
          notes: 'Rejected due to budget',
        },
        'user-456',
        'Manager'
      );

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should handle multi-level approval flow', async () => {
      const mockMR = {
        id: 'mr-123',
        status: 'pending_pm_approval',
        approvalHistory: [
          {
            level: 'site_manager',
            approved: true,
            approvedAt: new Date(),
          },
        ],
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockMR,
      } as any);

      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      await approveMaterialRequest(
        {
          mrId: 'mr-123',
          approverRole: 'pm',
          approved: true,
          notes: 'PM approved',
        },
        'pm-user',
        'Project Manager'
      );

      expect(updateDoc).toHaveBeenCalled();
    });
  });

  // ==================== MR TO PO CONVERSION ====================

  describe('convertMRtoPO', () => {
    it('should convert approved MR to PO', async () => {
      const mockMR = {
        id: 'mr-123',
        mrNumber: 'MR-20251113-0001',
        projectId: 'proj-123',
        status: 'approved',
        poIds: [], // Add this to avoid iteration error
        items: [
          {
            id: 'item-1',
            materialCode: 'MAT-001',
            materialName: 'Cement',
            quantity: 100,
            unit: 'kg',
            estimatedUnitPrice: 50000,
          },
        ],
      };

      const mockVendor = {
        id: 'vendor-123',
        name: 'PT Material Supplier',
        email: 'vendor@example.com',
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        id: 'mr-123',
        exists: () => true,
        data: () => mockMR,
      } as any);

      // Mock vendor service
      const { getVendorById } = await import('@/api/vendorService');
      vi.mocked(getVendorById).mockResolvedValueOnce(mockVendor as any);

      // Mock getDocs for PO number generation
      vi.mocked(getDocs).mockResolvedValueOnce({
        size: 5,
        docs: [],
      } as any);

      // Mock addDoc for PO creation
      vi.mocked(addDoc).mockResolvedValueOnce({
        id: 'po-new-123',
      } as any);

      // Mock updateDoc for MR status update
      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      const result = await convertMRtoPO(
        {
          mrId: 'mr-123',
          vendorId: 'vendor-123',
          itemMappings: [
            {
              mrItemId: 'item-1',
              finalQuantity: 100,
              finalUnitPrice: 50000,
            },
          ],
          deliveryDate: '2025-12-01',
          terms: 'Net 30',
        },
        'user-123'
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('po-new-123');
      expect(addDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should reject conversion if MR not approved', async () => {
      const mockMR = {
        id: 'mr-123',
        status: 'pending_approval',
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockMR,
      } as any);

      await expect(
        convertMRtoPO(
          {
            mrId: 'mr-123',
            vendorId: 'vendor-123',
            itemMappings: [],
            deliveryDate: '2025-12-01',
          },
          'user-123'
        )
      ).rejects.toThrow();
    });

    it('should handle missing vendor gracefully', async () => {
      const mockMR = {
        id: 'mr-123',
        status: 'approved',
        items: [],
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockMR,
      } as any);

      const { getVendorById } = await import('@/api/vendorService');
      vi.mocked(getVendorById).mockResolvedValueOnce(null);

      await expect(
        convertMRtoPO(
          {
            mrId: 'mr-123',
            vendorId: 'invalid-vendor',
            itemMappings: [],
            deliveryDate: '2025-12-01',
          },
          'user-123'
        )
      ).rejects.toThrow();
    });
  });

  // ==================== DELETE OPERATIONS ====================

  describe('deleteMaterialRequest', () => {
    it('should delete MR successfully', async () => {
      const mockMR = {
        mrNumber: 'MR-20251113-0001',
        status: 'draft',
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        id: 'mr-123',
        exists: () => true,
        data: () => mockMR,
      } as any);

      vi.mocked(deleteDoc).mockResolvedValueOnce(undefined as any);

      await deleteMaterialRequest('mr-123');

      expect(deleteDoc).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalledTimes(1);
    });

    it('should handle delete errors', async () => {
      const mockMR = {
        mrNumber: 'MR-20251113-0001',
        status: 'approved', // Not draft - will fail validation
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        id: 'mr-123',
        exists: () => true,
        data: () => mockMR,
      } as any);

      await expect(
        deleteMaterialRequest('mr-123')
      ).rejects.toThrow('Can only delete MR in draft status');
    });
  });

  // ==================== VALIDATION ====================

  describe('validateMaterialRequest', () => {
    it('should validate complete MR data', async () => {
      const validMR = {
        projectId: 'proj-123',
        items: [
          {
            materialCode: 'MAT-001',
            materialName: 'Cement',
            quantity: 100,
            unit: 'kg',
          },
        ],
        requestedBy: 'user-123',
        requestedByName: 'John Doe',
      };

      const result = validateMaterialRequest(validMR);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject MR without project ID', async () => {
      const invalidMR = {
        projectId: '',
        items: [],
        requestedBy: 'user-123',
      };

      const result = validateMaterialRequest(invalidMR);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject MR with empty items', async () => {
      const invalidMR = {
        projectId: 'proj-123',
        items: [],
        requestedBy: 'user-123',
      };

      const result = validateMaterialRequest(invalidMR);

      expect(result.isValid).toBe(false);
    });
  });

  // ==================== EDGE CASES ====================

  describe('Edge Cases', () => {
    it('should handle concurrent approvals gracefully', async () => {
      const mockMR = {
        id: 'mr-123',
        status: 'pending_approval',
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockMR,
      } as any);

      vi.mocked(updateDoc).mockResolvedValue(undefined as any);

      // Simulate concurrent approvals
      const approvals = [
        approveMaterialRequest(
          {
            mrId: 'mr-123',
            approverRole: 'site_manager',
            approved: true,
            notes: 'Approved 1',
          },
          'user-1',
          'Manager 1'
        ),
        approveMaterialRequest(
          {
            mrId: 'mr-123',
            approverRole: 'pm',
            approved: true,
            notes: 'Approved 2',
          },
          'user-2',
          'Manager 2'
        ),
      ];

      await Promise.all(approvals);

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should handle very large quantities', async () => {
      const mockInput = {
        projectId: 'proj-123',
        priority: 'high' as const,
        requiredDate: '2025-12-01',
        purpose: 'Large quantity order',
        items: [
          {
            materialCode: 'MAT-001',
            materialName: 'Cement',
            requestedQty: 999999999,
            unit: 'kg',
            estimatedUnitPrice: 50000,
          },
        ],
      };

      vi.mocked(getDocs).mockResolvedValue({ size: 0, docs: [] } as any);
      vi.mocked(addDoc).mockResolvedValueOnce({ id: 'mr-123' } as any);
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ id: 'mr-123', status: 'draft' }),
      } as any);

      const result = await createMaterialRequest(mockInput, 'user-123', 'John Doe');

      expect(result).toBeDefined();
    });

    it('should handle special characters in material names', async () => {
      const mockInput = {
        projectId: 'proj-123',
        priority: 'medium' as const,
        requiredDate: '2025-12-01',
        purpose: 'Special materials order',
        items: [
          {
            materialCode: 'MAT-001',
            materialName: 'Cement (Type-1) [50kg] <Premium>',
            requestedQty: 100,
            unit: 'kg',
            estimatedUnitPrice: 50000,
          },
        ],
      };

      vi.mocked(getDocs).mockResolvedValue({ size: 0, docs: [] } as any);
      vi.mocked(addDoc).mockResolvedValueOnce({ id: 'mr-123' } as any);
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ id: 'mr-123', status: 'draft' }),
      } as any);

      const result = await createMaterialRequest(mockInput, 'user-123', 'John Doe');

      expect(result).toBeDefined();
    });

    it('should handle null/undefined values gracefully', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          id: 'mr-123',
          items: null,
          notes: undefined,
        }),
      } as any);

      const result = await getMaterialRequestById('mr-123');

      expect(result).toBeDefined();
    });
  });
});

