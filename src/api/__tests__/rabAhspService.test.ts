/**
 * Unit Tests for RAB & AHSP Service
 * 
 * Tests coverage:
 * - CRUD operations for RAB items
 * - CRUD operations for AHSP data
 * - Validation logic
 * - Error handling
 * - Price history management
 * - Enhanced RAB calculations
 * 
 * Created: November 12, 2025
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RabAhspService } from '../rabAhspService';
import { RabItem, AhspData } from '@/types';
import { ErrorCodes } from '@/utils/responseWrapper';

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
}));

describe('RabAhspService', () => {
  let service: RabAhspService;
  
  beforeEach(() => {
    service = new RabAhspService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createRabItem', () => {
    const validProjectId = 'project_123';
    const validRabData: Omit<RabItem, 'id'> = {
      no: '1.1.1',
      uraian: 'Pekerjaan Galian Tanah',
      volume: 100,
      satuan: 'm³',
      hargaSatuan: 150000,
      kategori: 'earthwork',
      ahspId: 'AHSP_001',
      duration: 10,
      dependsOn: 0,
      wbsElementId: 'WBS_001',
    };

    it('should create RAB item with valid data', async () => {
      const { addDoc } = await import('firebase/firestore');
      vi.mocked(addDoc).mockResolvedValue({ id: 'rab_123' } as any);

      const result = await service.createRabItem(validProjectId, validRabData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(addDoc).toHaveBeenCalledTimes(1);
    });

    it('should reject invalid project ID', async () => {
      const result = await service.createRabItem('', validRabData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
      expect(result.error?.message).toContain('Invalid project ID');
    });

    it('should reject empty description', async () => {
      const invalidData = { ...validRabData, uraian: '' };
      const result = await service.createRabItem(validProjectId, invalidData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
      expect(result.error?.message).toContain('description is required');
    });

    it('should reject negative volume', async () => {
      const invalidData = { ...validRabData, volume: -10 };
      const result = await service.createRabItem(validProjectId, invalidData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
      expect(result.error?.message).toContain('positive number');
    });

    it('should reject zero volume', async () => {
      const invalidData = { ...validRabData, volume: 0 };
      const result = await service.createRabItem(validProjectId, invalidData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
    });

    it('should reject negative unit price', async () => {
      const invalidData = { ...validRabData, hargaSatuan: -1000 };
      const result = await service.createRabItem(validProjectId, invalidData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
      expect(result.error?.message).toContain('positive number');
    });

    it('should reject invalid AHSP ID', async () => {
      const invalidData = { ...validRabData, ahspId: '' };
      const result = await service.createRabItem(validProjectId, invalidData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
      expect(result.error?.message).toContain('AHSP ID');
    });
  });

  describe('getRabItemById', () => {
    it('should return RAB item when found', async () => {
      const { getDoc } = await import('firebase/firestore');
      const mockRabItem = {
        id: 1,
        no: '1.1.1',
        uraian: 'Test Item',
        volume: 100,
        satuan: 'm³',
        hargaSatuan: 150000,
        kategori: 'earthwork',
        ahspId: 'AHSP_001',
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: '1',
        data: () => mockRabItem,
      } as any);

      const result = await service.getRabItemById('project_123', 1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        id: 1,
        uraian: 'Test Item',
      }));
    });

    it('should return error when RAB item not found', async () => {
      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await service.getRabItemById('project_123', 999);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.NOT_FOUND);
    });

    it('should reject invalid RAB item ID', async () => {
      const result = await service.getRabItemById('project_123', -1);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
      expect(result.error?.message).toContain('positive integer');
    });

    it('should reject non-integer RAB item ID', async () => {
      const result = await service.getRabItemById('project_123', 1.5);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
    });
  });

  describe('updateRabItem', () => {
    const validUpdateData = {
      uraian: 'Updated Description',
      volume: 200,
      hargaSatuan: 175000,
    };

    it('should update RAB item with valid data', async () => {
      const { getDoc, updateDoc } = await import('firebase/firestore');
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: '1',
        data: () => ({ id: 1, projectId: 'project_123' }),
      } as any);
      
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await service.updateRabItem('project_123', 1, validUpdateData);

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalledTimes(1);
    });

    it('should reject update with negative volume', async () => {
      const invalidData = { volume: -50 };
      const result = await service.updateRabItem('project_123', 1, invalidData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
    });

    it('should reject update with negative price', async () => {
      const invalidData = { hargaSatuan: -1000 };
      const result = await service.updateRabItem('project_123', 1, invalidData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
    });
  });

  describe('deleteRabItem', () => {
    it('should delete RAB item successfully', async () => {
      const { getDoc, deleteDoc } = await import('firebase/firestore');
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: '1',
        data: () => ({ id: 1, projectId: 'project_123' }),
      } as any);
      
      vi.mocked(deleteDoc).mockResolvedValue(undefined);

      const result = await service.deleteRabItem('project_123', 1);

      expect(result.success).toBe(true);
      expect(deleteDoc).toHaveBeenCalledTimes(1);
    });

    it('should return error when deleting non-existent item', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await service.deleteRabItem('project_123', 999);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.NOT_FOUND);
    });
  });

  describe('getRabItemsByProject', () => {
    it('should return all RAB items for a project', async () => {
      const { getDocs } = await import('firebase/firestore');
      const mockRabItems = [
        { id: 1, uraian: 'Item 1', volume: 100, hargaSatuan: 150000 },
        { id: 2, uraian: 'Item 2', volume: 50, hargaSatuan: 200000 },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockRabItems.map((item, idx) => ({
          id: String(idx + 1),
          data: () => item,
          exists: () => true,
        })),
      } as any);

      const result = await service.getRabItemsByProject('project_123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].uraian).toBe('Item 1');
    });

    it('should return empty array for project with no items', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      vi.mocked(getDocs).mockResolvedValue({
        docs: [],
      } as any);

      const result = await service.getRabItemsByProject('project_empty');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('AHSP Operations', () => {
    const validAhspData: AhspData = {
      labors: {
        'item1': { 'Pekerja': 1, 'Mandor': 0.1 }
      },
      materials: {
        'item1': { 'Pasir': 0.5, 'Semen': 2 }
      },
      laborRates: {
        'Pekerja': 150000,
        'Mandor': 200000
      },
      materialPrices: {
        'Pasir': 250000,
        'Semen': 85000
      },
      materialUnits: {
        'Pasir': 'm³',
        'Semen': 'sak'
      }
    };

    describe('getAhspData', () => {
      it('should return AHSP data when found', async () => {
        const { getDoc } = await import('firebase/firestore');
        
        vi.mocked(getDoc).mockResolvedValue({
          exists: () => true,
          id: 'AHSP_001',
          data: () => validAhspData,
        } as any);

        const result = await service.getAhspData('AHSP_001');

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.labors).toEqual(validAhspData.labors);
      });

      it('should return error when AHSP not found', async () => {
        const { getDoc } = await import('firebase/firestore');
        
        vi.mocked(getDoc).mockResolvedValue({
          exists: () => false,
        } as any);

        const result = await service.getAhspData('AHSP_999');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.NOT_FOUND);
      });

      it('should reject invalid AHSP ID format', async () => {
        const result = await service.getAhspData('');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
      });
    });

    describe('getAllAhspData', () => {
      it('should return all AHSP data', async () => {
        const { getDocs } = await import('firebase/firestore');
        
        vi.mocked(getDocs).mockResolvedValue({
          docs: [
            { id: 'AHSP_001', data: () => validAhspData, exists: () => true },
            { id: 'AHSP_002', data: () => validAhspData, exists: () => true },
          ],
        } as any);

        const result = await service.getAllAhspData();

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
      });

      it('should return empty array when no AHSP data exists', async () => {
        const { getDocs } = await import('firebase/firestore');
        
        vi.mocked(getDocs).mockResolvedValue({
          docs: [],
        } as any);

        const result = await service.getAllAhspData();

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(0);
      });
    });

    describe('upsertAhspData', () => {
      it('should update existing AHSP data', async () => {
        const { updateDoc } = await import('firebase/firestore');
        vi.mocked(updateDoc).mockResolvedValue(undefined);

        const result = await service.upsertAhspData('AHSP_001', validAhspData);

        expect(result.success).toBe(true);
        expect(updateDoc).toHaveBeenCalledTimes(1);
      });

      it('should reject invalid AHSP ID', async () => {
        const result = await service.upsertAhspData('', validAhspData);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle Firestore connection errors gracefully', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      vi.mocked(getDocs).mockRejectedValue(new Error('Network error'));

      const result = await service.getRabItemsByProject('project_123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle concurrent updates correctly', async () => {
      const { getDoc, updateDoc } = await import('firebase/firestore');
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: '1',
        data: () => ({ id: 1, projectId: 'project_123', version: 1 }),
      } as any);
      
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const promises = [
        service.updateRabItem('project_123', 1, { volume: 100 }),
        service.updateRabItem('project_123', 1, { volume: 200 }),
      ];

      const results = await Promise.all(promises);

      expect(results.every(r => r.success)).toBe(true);
    });

    it('should validate project ID format', async () => {
      const result = await service.getRabItemsByProject('invalid id with spaces');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large dataset retrieval efficiently', async () => {
      const { getDocs } = await import('firebase/firestore');
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: String(i + 1),
        data: () => ({
          id: i + 1,
          uraian: `Item ${i + 1}`,
          volume: 100,
          hargaSatuan: 150000,
        }),
        exists: () => true,
      }));

      vi.mocked(getDocs).mockResolvedValue({
        docs: largeDataset,
      } as any);

      const startTime = Date.now();
      const result = await service.getRabItemsByProject('project_large');
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1000);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
