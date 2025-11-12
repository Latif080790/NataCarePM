/**
 * Unit Tests for Goods Receipt Service
 * 
 * Tests coverage:
 * - GR CRUD operations
 * - GR number generation
 * - Quality inspection workflow
 * - Status transitions (draft → submitted → completed)
 * - Validation logic
 * - Error handling
 * - Integration with PO updates
 * 
 * Created: November 12, 2025
 * Fixed: November 12, 2025 - Type compatibility with CreateGRInput
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createGoodsReceipt,
  getGoodsReceiptById,
  updateGoodsReceipt,
  submitGoodsReceipt,
  completeGoodsReceipt,
  validateGoodsReceipt,
  deleteGoodsReceipt,
} from '../goodsReceiptService';
import type { GoodsReceipt, GRStatus, CreateGRInput, UpdateGRInput } from '@/types/logistics';

// Mock Firebase
vi.mock('@/firebaseConfig', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
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

// Mock auditHelper
vi.mock('@/utils/auditHelper', () => ({
  auditHelper: {
    log: vi.fn(),
    logCreate: vi.fn(),
    logUpdate: vi.fn(),
    logDelete: vi.fn(),
  },
}));

describe('GoodsReceiptService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createGoodsReceipt', () => {
    const validCreateInput: CreateGRInput = {
      projectId: 'project_123',
      poId: 'PO-20251112-0001',
      receiptDate: new Date().toISOString(),
      deliveryNote: 'DN-001',
      vehicleNumber: 'B1234XYZ',
      driverName: 'John Doe',
      receiverNotes: 'Test GR creation',
    };

    it('should create goods receipt with valid data', async () => {
      const { addDoc, getDocs, getDoc } = await import('firebase/firestore');
      
      // Mock PO data
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: 'po_123',
        data: () => ({
          projectId: 'project_123',
          poNumber: 'PO-20251112-0001',
          vendorId: 'vendor_123',
          vendorName: 'PT Test Vendor',
          items: [{
            id: 'item_001',
            materialCode: 'MAT-001',
            materialName: 'Semen Portland',
            quantity: 100,
            unit: 'sak',
            unitPrice: 85000,
          }],
          status: 'approved',
        }),
      } as any);
      
      // Mock GR number generation (getDocs)
      vi.mocked(getDocs).mockResolvedValue({
        size: 0,
      } as any);
      
      // Mock createGR (addDoc)
      vi.mocked(addDoc).mockResolvedValue({ id: 'gr_123' } as any);

      const result = await createGoodsReceipt(validCreateInput, 'user_456', 'Test User');

      expect(result).toBeDefined();
      expect(result.grNumber).toMatch(/^GR-\d{8}-\d{4}$/);
      expect(result.status).toBe('draft');
      expect(addDoc).toHaveBeenCalledTimes(1);
    });

    it('should reject GR creation if PO not found', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      // Mock PO not found
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      await expect(
        createGoodsReceipt(validCreateInput, 'user_456', 'Test User')
      ).rejects.toThrow('Purchase Order not found');
    });

    it('should generate sequential GR numbers', async () => {
      const { addDoc, getDocs, getDoc } = await import('firebase/firestore');
      
      // Mock PO data
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: 'po_123',
        data: () => ({
          projectId: 'project_123',
          poNumber: 'PO-20251112-0001',
          items: [{
            id: 'item_001',
            materialCode: 'MAT-001',
            materialName: 'Semen',
            quantity: 100,
            unit: 'sak',
            unitPrice: 85000,
          }],
          status: 'approved',
        }),
      } as any);
      
      // First GR - no existing GRs
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [],
        size: 0,
      } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'gr_001' } as any);

      const gr1 = await createGoodsReceipt(validCreateInput, 'user_456', 'Test User');
      expect(gr1.grNumber).toContain('0001');

      // Second GR - one existing GR
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [{}],
        size: 1,
      } as any);

      const gr2 = await createGoodsReceipt(validCreateInput, 'user_456', 'Test User');
      expect(gr2.grNumber).toContain('0002');
    });
  });

  describe('getGoodsReceiptById', () => {
    it('should return GR when found', async () => {
      const { getDoc } = await import('firebase/firestore');
      const mockGR: GoodsReceipt = {
        id: 'gr_123',
        grNumber: 'GR-20251112-0001',
        projectId: 'project_123',
        poId: 'PO-001',
        poNumber: 'PO-001',
        vendorId: 'vendor_123',
        vendorName: 'PT Test Vendor',
        status: 'draft' as GRStatus,
        receiptDate: new Date().toISOString(),
        items: [],
        totalItems: 0,
        totalQuantity: 0,
        totalValue: 0,
        inspectionStatus: 'pending',
        overallQualityStatus: 'pending',
        inventoryUpdated: false,
        poUpdated: false,
        wbsUpdated: false,
        createdAt: new Date().toISOString(),
        createdBy: 'user_456',
        updatedAt: new Date().toISOString(),
        updatedBy: 'user_456',
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: 'gr_123',
        data: () => mockGR,
      } as any);

      const result = await getGoodsReceiptById('gr_123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('gr_123');
      expect(result?.grNumber).toBe('GR-20251112-0001');
    });

    it('should return null when GR not found', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await getGoodsReceiptById('nonexistent_gr');

      expect(result).toBeNull();
    });
  });

  describe('updateGoodsReceipt', () => {
    it('should update GR with valid data', async () => {
      const { getDoc, updateDoc } = await import('firebase/firestore');
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ status: 'draft' }),
      } as any);

      const updates: UpdateGRInput = { 
        receiptDate: new Date().toISOString(),
        deliveryNote: 'Updated delivery note',
        vehicleNumber: 'B5678ABC',
      };

      await updateGoodsReceipt('gr_123', updates);

      expect(updateDoc).toHaveBeenCalledTimes(1);
    });

    it('should reject update of non-draft GR', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ status: 'completed' }),
      } as any);

      await expect(
        updateGoodsReceipt('gr_123', { deliveryNote: 'Cannot update' })
      ).rejects.toThrow('draft status');
    });
  });

  describe('submitGoodsReceipt', () => {
    it('should submit draft GR', async () => {
      const { getDoc, updateDoc, doc } = await import('firebase/firestore');
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ 
          status: 'draft',
          items: [{ id: 'item_001' }],
        }),
      } as any);

      vi.mocked(doc).mockReturnValue({} as any);

      await submitGoodsReceipt('gr_123', 'user_456');

      expect(updateDoc).toHaveBeenCalled();
      const callArgs = vi.mocked(updateDoc).mock.calls[0];
      expect(callArgs[1]).toMatchObject({ status: 'submitted' });
    });

    it('should reject submit of non-draft GR', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ status: 'completed' }),
      } as any);

      await expect(
        submitGoodsReceipt('gr_123', 'user_456')
      ).rejects.toThrow('draft');
    });
  });

  describe('completeGoodsReceipt', () => {
    it('should complete approved GR', async () => {
      const { getDoc, updateDoc, doc } = await import('firebase/firestore');
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ 
          status: 'approved',
          items: [
            { 
              id: 'item_001',
              inspectionStatus: 'passed',
            }
          ],
        }),
      } as any);

      vi.mocked(doc).mockReturnValue({} as any);

      await completeGoodsReceipt('gr_123', 'user_456');

      expect(updateDoc).toHaveBeenCalled();
      const firstCall = vi.mocked(updateDoc).mock.calls[0];
      expect(firstCall[1]).toMatchObject({ status: 'completed' });
    });

    it('should reject complete of non-approved GR', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ status: 'draft' }),
      } as any);

      await expect(
        completeGoodsReceipt('gr_123', 'user_456')
      ).rejects.toThrow('approved');
    });

    it('should reject complete of submitted GR', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ 
          status: 'submitted',
          items: [
            { 
              id: 'item_001',
              inspectionStatus: 'pending',
            }
          ],
        }),
      } as any);

      await expect(
        completeGoodsReceipt('gr_123', 'user_456')
      ).rejects.toThrow('approved');
    });
  });

  describe('validateGoodsReceipt', () => {
    it('should validate valid GR', () => {
      const validGR: GoodsReceipt = {
        id: 'gr_123',
        grNumber: 'GR-20251112-0001',
        projectId: 'project_123',
        poId: 'PO-001',
        poNumber: 'PO-001',
        vendorId: 'vendor_123',
        vendorName: 'PT Test Vendor',
        status: 'draft' as GRStatus,
        receiptDate: new Date().toISOString(),
        totalItems: 1,
        totalQuantity: 100,
        totalValue: 8500000,
        inspectionStatus: 'not-started',
        overallQualityStatus: 'pending',
        inventoryUpdated: false,
        poUpdated: false,
        wbsUpdated: false,
        createdAt: new Date().toISOString(),
        createdBy: 'user_456',
        updatedAt: new Date().toISOString(),
        updatedBy: 'user_456',
        items: [
          {
            id: 'item_001',
            grId: 'gr_123',
            poItemId: 'poItem_001',
            materialCode: 'MAT-001',
            materialName: 'Semen',
            poQuantity: 100,
            previouslyReceived: 0,
            receivedQuantity: 100,
            acceptedQuantity: 0,
            rejectedQuantity: 0,
            unit: 'sak',
            qualityStatus: 'pending',
            unitPrice: 85000,
            totalPrice: 8500000,
            quantityVariance: 0,
            defectPhotos: [],
            variancePercentage: 0,
          }
        ],
      };

      const result = validateGoodsReceipt(validGR);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidGR: GoodsReceipt = {
        id: 'gr_123',
        grNumber: 'GR-20251112-0001',
        projectId: '',  // Empty projectId
        poId: '',       // Empty poId
        poNumber: 'PO-001',
        vendorId: 'vendor_123',
        vendorName: 'PT Test Vendor',
        status: 'draft' as GRStatus,
        receiptDate: new Date().toISOString(),
        totalItems: 0,
        totalQuantity: 0,
        totalValue: 0,
        inspectionStatus: 'not-started',
        overallQualityStatus: 'pending',
        inventoryUpdated: false,
        poUpdated: false,
        wbsUpdated: false,
        createdAt: new Date().toISOString(),
        createdBy: 'user_456',
        updatedAt: new Date().toISOString(),
        updatedBy: 'user_456',
        items: [],
      };

      const result = validateGoodsReceipt(invalidGR);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect empty items array', () => {
      const invalidGR: GoodsReceipt = {
        id: 'gr_123',
        grNumber: 'GR-20251112-0001',
        projectId: 'project_123',
        poId: 'PO-001',
        poNumber: 'PO-001',
        vendorId: 'vendor_123',
        vendorName: 'PT Test Vendor',
        status: 'draft' as GRStatus,
        receiptDate: new Date().toISOString(),
        totalItems: 0,
        totalQuantity: 0,
        totalValue: 0,
        inspectionStatus: 'not-started',
        overallQualityStatus: 'pending',
        inventoryUpdated: false,
        poUpdated: false,
        wbsUpdated: false,
        createdAt: new Date().toISOString(),
        createdBy: 'user_456',
        items: [],
        photos: [],
        apInvoiceCreated: false,
      };

      const result = validateGoodsReceipt(invalidGR);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('item'))).toBe(true);
    });

    it('should detect negative quantities', () => {
      const invalidGR: GoodsReceipt = {
        id: 'gr_123',
        grNumber: 'GR-20251112-0001',
        projectId: 'project_123',
        poId: 'PO-001',
        poNumber: 'PO-001',
        vendorId: 'vendor_123',
        vendorName: 'PT Test Vendor',
        status: 'draft' as GRStatus,
        receiptDate: new Date().toISOString(),
        totalItems: 1,
        totalQuantity: -10,
        totalValue: 0,
        inspectionStatus: 'not-started',
        overallQualityStatus: 'pending',
        inventoryUpdated: false,
        poUpdated: false,
        wbsUpdated: false,
        createdAt: new Date().toISOString(),
        createdBy: 'user_456',
        updatedAt: new Date().toISOString(),
        updatedBy: 'user_456',
        items: [
          {
            id: 'item_001',
            grId: 'gr_123',
            poItemId: 'poItem_001',
            materialCode: 'MAT-001',
            materialName: 'Semen',
            poQuantity: 100,
            previouslyReceived: 0,
            receivedQuantity: -10, // Invalid negative quantity
            acceptedQuantity: 0,
            rejectedQuantity: 0,
            unit: 'sak',
            qualityStatus: 'pending',
            unitPrice: 85000,
            totalPrice: 0,
            quantityVariance: 0,
            defectPhotos: [],
            variancePercentage: 0,
          }
        ],
      };

      const result = validateGoodsReceipt(invalidGR);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('deleteGoodsReceipt', () => {
    it('should delete draft GR', async () => {
      const { getDoc, deleteDoc } = await import('firebase/firestore');
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ status: 'draft' }),
      } as any);

      await deleteGoodsReceipt('gr_123');

      expect(deleteDoc).toHaveBeenCalledTimes(1);
    });

    it('should reject delete of non-draft GR', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ status: 'submitted' }),
      } as any);

      await expect(
        deleteGoodsReceipt('gr_123')
      ).rejects.toThrow('draft');
    });

    it('should reject delete of nonexistent GR', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      await expect(
        deleteGoodsReceipt('nonexistent_gr')
      ).rejects.toThrow('not found');
    });
  });

  describe('Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      vi.mocked(getDoc).mockRejectedValue(new Error('Network error'));

      await expect(
        getGoodsReceiptById('gr_123')
      ).rejects.toThrow('Network error');
    });

    it('should handle concurrent GR creation', async () => {
      const { addDoc, getDocs, getDoc } = await import('firebase/firestore');
      
      // Mock PO data
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: 'po_123',
        data: () => ({
          projectId: 'project_123',
          poNumber: 'PO-20251112-0001',
          items: [{
            id: 'item_001',
            materialCode: 'MAT-001',
            materialName: 'Semen',
            quantity: 100,
            unit: 'sak',
            unitPrice: 85000,
          }],
          status: 'approved',
        }),
      } as any);
      
      vi.mocked(getDocs).mockResolvedValue({
        size: 0,
      } as any);
      
      vi.mocked(addDoc).mockResolvedValue({ id: 'gr_concurrent' } as any);

      const validInput: CreateGRInput = {
        projectId: 'project_123',
        poId: 'PO-20251112-0001',
        receiptDate: new Date().toISOString(),
        deliveryNote: 'DN-001',
      };

      const results = await Promise.all([
        createGoodsReceipt(validInput, 'user_1', 'User One'),
        createGoodsReceipt(validInput, 'user_2', 'User Two'),
      ]);

      expect(results).toHaveLength(2);
      results.forEach(gr => {
        expect(gr.grNumber).toMatch(/^GR-\d{8}-\d{4}$/);
      });
    });
  });

  describe('Status Workflow', () => {
    it('should follow correct status progression', async () => {
      const { getDoc, updateDoc, addDoc, getDocs, doc } = await import('firebase/firestore');
      
      // Mock PO data for createGoodsReceipt
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        id: 'po_123',
        data: () => ({
          projectId: 'project_123',
          poNumber: 'PO-001',
          items: [{
            id: 'item_001',
            materialCode: 'MAT-001',
            materialName: 'Semen',
            quantity: 100,
            unit: 'sak',
            unitPrice: 85000,
          }],
          status: 'approved',
        }),
      } as any);
      
      vi.mocked(getDocs).mockResolvedValue({
        size: 0,
      } as any);
      
      vi.mocked(addDoc).mockResolvedValue({ id: 'gr_123' } as any);

      const validInput: CreateGRInput = {
        projectId: 'project_123',
        poId: 'PO-001',
        receiptDate: new Date().toISOString(),
      };

      const gr = await createGoodsReceipt(validInput, 'user_456', 'Test User');
      expect(gr.status).toBe('draft');

      // Transition: draft → submitted
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ 
          status: 'draft',
          items: [{ id: 'item_001' }],
        }),
      } as any);
      
      vi.mocked(doc).mockReturnValue({} as any);
      
      await submitGoodsReceipt('gr_123', 'user_456');
      
      // Check 2nd call (1st is for items update, 2nd is for status)
      const calls = vi.mocked(updateDoc).mock.calls;
      const statusUpdateCall = calls.find(call => 
        call[1] && typeof call[1] === 'object' && 'status' in call[1]
      );
      expect(statusUpdateCall).toBeDefined();
      expect(statusUpdateCall![1]).toMatchObject({ status: 'submitted' });

      // Transition: approved → completed
      // Mock GR fetch
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ 
            id: 'gr_123',
            projectId: 'proj_123',
            poId: 'po_123',
            status: 'approved',
            items: [
              { 
                id: 'item_001',
                poItemId: 'poItem_001',
                receivedQuantity: 100,
                inspectionStatus: 'passed',
              }
            ],
          }),
        } as any)
        // Mock PO fetch for updatePOFromGR
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            id: 'po_123',
            items: [{ id: 'poItem_001', quantity: 100, receivedQuantity: 0 }],
          }),
        } as any);
      
      vi.mocked(doc).mockReturnValue({} as any);
      
      await completeGoodsReceipt('gr_123', 'user_456');
      
      // Check completion call
      const completionCalls = vi.mocked(updateDoc).mock.calls;
      const completionCall = completionCalls.find(call => 
        call[1] && typeof call[1] === 'object' && 'status' in call[1] && call[1].status === 'completed'
      );
      expect(completionCall).toBeDefined();
      expect(completionCall![1]).toMatchObject({ status: 'completed' });
    });
  });
});
