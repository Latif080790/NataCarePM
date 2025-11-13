/**
 * VENDOR SERVICE TESTS
 * 
 * Complete test coverage for vendor management:
 * - Vendor CRUD operations
 * - Vendor code generation
 * - Contact management
 * - Bank account management
 * - Performance tracking & calculations
 * - Vendor evaluation system
 * - Blacklist management
 * - Analytics & reporting
 * - PO integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createVendor,
  getVendorById,
  getVendors,
  updateVendor,
  deleteVendor,
  approveVendor,
  addVendorContact,
  updateVendorContact,
  removeVendorContact,
  addVendorBankAccount,
  updateVendorPerformance,
  createVendorEvaluation,
  getVendorEvaluations,
  blacklistVendor,
  removeFromBlacklist,
  getVendorSummary,
  searchVendors,
  getVendorPurchaseOrders,
  getVendorStatistics,
  linkPOToVendor,
} from '../vendorService';
import type { 
  Vendor, 
  CreateVendorInput, 
  CreateEvaluationInput,
  CreateBlacklistInput,
  VendorPerformance,
} from '@/types/vendor';

// Mock Firestore
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
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
}));

// Mock auditHelper
vi.mock('@/utils/auditHelper', () => ({
  auditHelper: {
    logCreate: vi.fn(),
    logUpdate: vi.fn(),
    logStatusChange: vi.fn(),
    logApproval: vi.fn(),
    logCustom: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/utils/logger.enhanced', () => ({
  logger: {
    error: vi.fn(),
  },
}));

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
} from 'firebase/firestore';
import { auditHelper } from '@/utils/auditHelper';

describe('vendorService', () => {
  // Setup
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Firestore functions to return references
    vi.mocked(doc).mockReturnValue({ id: 'mocked-doc-ref' } as any);
    vi.mocked(collection).mockReturnValue({ id: 'mocked-collection-ref' } as any);
    vi.mocked(query).mockReturnValue({ id: 'mocked-query' } as any);
  });

  // ============================================================================
  // VENDOR CODE GENERATION
  // ============================================================================

  describe('Vendor Code Generation', () => {
    it('should generate unique vendor code in VEN-YYYYMMDD-XXX format', async () => {
      const mockInput: CreateVendorInput = {
        vendorName: 'PT Test Vendor',
        legalName: 'PT Test Vendor Indonesia',
        category: 'materials',
        email: 'test@vendor.com',
        phone: '021-1234567',
        mobile: '0812-3456-7890',
        address: 'Jl. Test No. 123',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '12345',
        country: 'Indonesia',
        taxId: 'NPWP-123456789',
        businessLicenseNumber: 'NIB-123456',
        businessType: 'pt',
        paymentTerm: 'net_30',
      };

      // Mock getDocs for vendor code generation (empty - first vendor today)
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      // Mock addDoc
      vi.mocked(addDoc).mockResolvedValueOnce({ id: 'vendor-123' } as any);

      // Mock updateDoc for performance.vendorId update
      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      const vendor = await createVendor(mockInput, 'user-123', 'Test User');

      expect(vendor.vendorCode).toMatch(/^VEN-\d{8}-\d{3}$/);
      expect(vendor.vendorCode).toContain(new Date().toISOString().split('T')[0].replace(/-/g, ''));
    });

    it('should increment sequence number for subsequent vendors on same day', async () => {
      const mockInput: CreateVendorInput = {
        vendorName: 'PT Second Vendor',
        legalName: 'PT Second Vendor Indonesia',
        category: 'equipment',
        email: 'second@vendor.com',
        phone: '021-9876543',
        mobile: '0812-9876-5432',
        address: 'Jl. Second No. 456',
        city: 'Bandung',
        province: 'Jawa Barat',
        postalCode: '54321',
        country: 'Indonesia',
        taxId: 'NPWP-987654321',
        businessLicenseNumber: 'NIB-654321',
        businessType: 'pt',
        paymentTerm: 'net_14',
      };

      // Mock getDocs - return existing vendor from today
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
        docs: [{
          id: 'existing-vendor',
          data: () => ({ vendorCode: 'VEN-20251113-001' }),
        }],
      } as any);

      vi.mocked(addDoc).mockResolvedValueOnce({ id: 'vendor-456' } as any);
      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      const vendor = await createVendor(mockInput, 'user-456', 'Test User 2');

      // Should increment from 001 to 002
      expect(vendor.vendorCode).toMatch(/^VEN-\d{8}-002$/);
    });
  });

  // ============================================================================
  // VENDOR CRUD OPERATIONS
  // ============================================================================

  describe('createVendor', () => {
    it('should create vendor with all required fields and default performance metrics', async () => {
      const mockInput: CreateVendorInput = {
        vendorName: 'PT Supplier Utama',
        legalName: 'PT Supplier Utama Indonesia',
        category: 'materials',
        email: 'info@supplier.com',
        phone: '021-5551234',
        mobile: '0811-2222-3333',
        address: 'Jl. Industri No. 99',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '10110',
        country: 'Indonesia',
        taxId: 'NPWP-111222333',
        businessLicenseNumber: 'NIB-999888',
        businessType: 'pt',
        paymentTerm: 'net_30',
        contacts: [{
          name: 'John Doe',
          position: 'Sales Manager',
          phone: '0811-4444-5555',
          email: 'john@supplier.com',
          isPrimary: true,
        }],
        bankAccounts: [{
          bankName: 'BCA',
          accountNumber: '1234567890',
          accountName: 'PT Supplier Utama Indonesia',
          branch: 'Jakarta Pusat',
          isPrimary: true,
        }],
      };

      vi.mocked(getDocs).mockResolvedValueOnce({ empty: true, docs: [] } as any);
      vi.mocked(addDoc).mockResolvedValueOnce({ id: 'vendor-new' } as any);
      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      const vendor = await createVendor(mockInput, 'user-create', 'Admin User');

      expect(vendor.id).toBe('vendor-new');
      expect(vendor.vendorName).toBe('PT Supplier Utama');
      expect(vendor.status).toBe('pending_approval');
      expect(vendor.contacts).toHaveLength(1);
      expect(vendor.contacts[0]).toHaveProperty('id');
      expect(vendor.bankAccounts).toHaveLength(1);
      expect(vendor.bankAccounts[0]).toHaveProperty('id');
      expect(vendor.performance).toMatchObject({
        totalPOs: 0,
        totalPOValue: 0,
        onTimeDeliveryRate: 0,
        qualityAcceptanceRate: 0,
        performanceScore: 0,
        riskLevel: 'low',
      });
      expect(vendor.createdBy).toBe('user-create');
      expect(vendor.isBlacklisted).toBe(false);
      
      expect(auditHelper.logCreate).toHaveBeenCalled();
    });

    it('should handle vendor creation with minimal required fields', async () => {
      const minimalInput: CreateVendorInput = {
        vendorName: 'CV Minimal',
        legalName: 'CV Minimal Indonesia',
        category: 'services',
        email: 'minimal@cv.com',
        phone: '021-1111111',
        mobile: '0899-9999-9999',
        address: 'Jl. Minimal',
        city: 'Surabaya',
        province: 'Jawa Timur',
        postalCode: '60111',
        country: 'Indonesia',
        taxId: 'NPWP-MIN123',
        businessLicenseNumber: 'NIB-MIN456',
        businessType: 'cv',
        paymentTerm: 'cod',
      };

      vi.mocked(getDocs).mockResolvedValueOnce({ empty: true, docs: [] } as any);
      vi.mocked(addDoc).mockResolvedValueOnce({ id: 'vendor-minimal' } as any);
      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      const vendor = await createVendor(minimalInput, 'user-min', 'User Min');

      expect(vendor.id).toBe('vendor-minimal');
      expect(vendor.contacts).toEqual([]);
      expect(vendor.bankAccounts).toEqual([]);
      expect(vendor.certifications).toEqual([]);
      expect(vendor.productServices).toEqual([]);
      expect(vendor.tags).toEqual([]);
    });
  });

  describe('getVendorById', () => {
    it('should return vendor when found', async () => {
      const mockVendor: Vendor = {
        id: 'vendor-123',
        vendorCode: 'VEN-20251113-001',
        vendorName: 'PT Test Vendor',
        legalName: 'PT Test Vendor Indonesia',
        category: 'materials',
        status: 'active',
        email: 'test@vendor.com',
        phone: '021-1234567',
        mobile: '0812-3456-7890',
        address: 'Jl. Test',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '12345',
        country: 'Indonesia',
        taxId: 'NPWP-123',
        businessLicenseNumber: 'NIB-123',
        registrationNumber: 'REG-123',
        businessType: 'pt',
        paymentTerm: 'net_30',
        currency: 'IDR',
        contacts: [],
        bankAccounts: [],
        performance: {} as VendorPerformance,
        certifications: [],
        certificationExpiryDates: {},
        productServices: [],
        serviceAreas: [],
        capacity: '',
        overallRating: 'not_rated',
        isBlacklisted: false,
        blacklistRecords: [],
        createdBy: 'user-123',
        createdAt: new Date().toISOString(),
        tags: [],
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        id: 'vendor-123',
        data: () => mockVendor,
      } as any);

      const result = await getVendorById('vendor-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('vendor-123');
      expect(result?.vendorName).toBe('PT Test Vendor');
    });

    it('should return null when vendor not found', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false,
      } as any);

      const result = await getVendorById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getVendors', () => {
    it('should return all vendors with filters', async () => {
      const mockVendors = [
        { id: 'v1', vendorName: 'Vendor 1', status: 'active', category: 'materials' },
        { id: 'v2', vendorName: 'Vendor 2', status: 'pending_approval', category: 'equipment' },
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: mockVendors.map((v) => ({
          id: v.id,
          data: () => v,
        })),
      } as any);

      const result = await getVendors();

      expect(result).toHaveLength(2);
      expect(result[0].vendorName).toBe('Vendor 1');
    });

    it('should filter vendors by status', async () => {
      const mockVendors = [
        { 
          id: 'v1', 
          vendorName: 'Active Vendor', 
          status: 'active', 
          category: 'materials',
          overallRating: 'good',
          tags: [],
          city: 'Jakarta',
          province: 'DKI Jakarta',
          performance: { performanceScore: 85 },
          isBlacklisted: false,
        },
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: mockVendors.map((v) => ({
          id: v.id,
          data: () => v,
        })),
      } as any);

      const result = await getVendors({ status: ['active'] });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('active');
    });

    it('should filter vendors by performance score', async () => {
      const mockVendors = [
        { 
          id: 'v1', 
          vendorName: 'High Performer', 
          status: 'active',
          category: 'materials',
          overallRating: 'excellent',
          tags: [],
          city: 'Jakarta',
          province: 'DKI Jakarta',
          performance: { performanceScore: 90 },
          isBlacklisted: false,
        },
        { 
          id: 'v2', 
          vendorName: 'Low Performer', 
          status: 'active',
          category: 'services',
          overallRating: 'poor',
          tags: [],
          city: 'Bandung',
          province: 'Jawa Barat',
          performance: { performanceScore: 50 },
          isBlacklisted: false,
        },
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: mockVendors.map((v) => ({
          id: v.id,
          data: () => v,
        })),
      } as any);

      const result = await getVendors({ minPerformanceScore: 80 });

      expect(result).toHaveLength(1);
      expect(result[0].vendorName).toBe('High Performer');
    });
  });

  describe('updateVendor', () => {
    it('should update vendor and log audit trail', async () => {
      const mockOldVendor: Vendor = {
        id: 'vendor-update',
        vendorCode: 'VEN-20251113-999',
        vendorName: 'Old Name',
        status: 'active',
      } as Vendor;

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        id: 'vendor-update',
        data: () => mockOldVendor,
      } as any);

      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      await updateVendor('vendor-update', { vendorName: 'New Name' }, 'user-updater');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          vendorName: 'New Name',
          updatedBy: 'user-updater',
        })
      );
      expect(auditHelper.logUpdate).toHaveBeenCalled();
    });
  });

  describe('deleteVendor', () => {
    it('should soft delete vendor by setting status to inactive', async () => {
      const mockVendor: Vendor = {
        id: 'vendor-delete',
        vendorCode: 'VEN-20251113-888',
        vendorName: 'To Delete',
        status: 'active',
      } as Vendor;

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        id: 'vendor-delete',
        data: () => mockVendor,
      } as any);

      // Mock getDocs for active POs check (no active POs)
      vi.mocked(getDocs).mockResolvedValue({
        docs: [],
      } as any);

      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      await deleteVendor('vendor-delete', 'user-deleter');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'inactive',
          updatedBy: 'user-deleter',
        })
      );
      expect(auditHelper.logStatusChange).toHaveBeenCalled();
    });

    it('should throw error when deleting vendor with active POs', async () => {
      // Mock getDocs for projects
      const mockProjects = [{ id: 'proj-1' }];
      vi.mocked(getDocs)
        .mockResolvedValueOnce({
          docs: mockProjects.map(p => ({ id: p.id, data: () => ({}) })),
        } as any)
        .mockResolvedValueOnce({
          forEach: (callback: any) => {
            callback({ id: 'po-1', data: () => ({ status: 'Disetujui', vendorId: 'vendor-active' }) });
          },
          docs: [{ id: 'po-1', data: () => ({ status: 'Disetujui', vendorId: 'vendor-active' }) }],
        } as any);

      await expect(deleteVendor('vendor-active', 'user-deleter')).rejects.toThrow(
        'Cannot delete vendor with 1 active purchase order(s)'
      );
    });
  });

  describe('approveVendor', () => {
    it('should approve vendor and change status to active', async () => {
      const mockVendor: Vendor = {
        id: 'vendor-approve',
        vendorCode: 'VEN-20251113-777',
        vendorName: 'Pending Vendor',
        status: 'pending_approval',
        category: 'materials',
      } as Vendor;

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        id: 'vendor-approve',
        data: () => mockVendor,
      } as any);

      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      await approveVendor('vendor-approve', 'user-approver');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'active',
          updatedBy: 'user-approver',
        })
      );
      expect(auditHelper.logApproval).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // CONTACT MANAGEMENT
  // ============================================================================

  describe('Vendor Contact Management', () => {
    const mockVendor: Vendor = {
      id: 'vendor-contact',
      vendorCode: 'VEN-20251113-666',
      vendorName: 'Contact Test Vendor',
      contacts: [
        { id: 'contact-1', name: 'John Doe', position: 'Manager', phone: '123', email: 'john@test.com', isPrimary: true },
      ],
    } as Vendor;

    it('should add new contact to vendor', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        id: 'vendor-contact',
        data: () => mockVendor,
      } as any);

      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      const newContact = {
        name: 'Jane Smith',
        position: 'Assistant',
        phone: '456',
        email: 'jane@test.com',
        isPrimary: false,
      };

      await addVendorContact('vendor-contact', newContact);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          contacts: expect.arrayContaining([
            expect.objectContaining({ name: 'John Doe' }),
            expect.objectContaining({ name: 'Jane Smith', id: expect.stringContaining('contact_') }),
          ]),
        })
      );
    });

    it('should update existing contact', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        id: 'vendor-contact',
        data: () => mockVendor,
      } as any);

      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      await updateVendorContact('vendor-contact', 'contact-1', { phone: '999' });

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          contacts: expect.arrayContaining([
            expect.objectContaining({ id: 'contact-1', phone: '999' }),
          ]),
        })
      );
    });

    it('should remove contact from vendor', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        id: 'vendor-contact',
        data: () => mockVendor,
      } as any);

      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      await removeVendorContact('vendor-contact', 'contact-1');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          contacts: [],
        })
      );
    });
  });

  // ============================================================================
  // BANK ACCOUNT MANAGEMENT
  // ============================================================================

  describe('addVendorBankAccount', () => {
    it('should add bank account to vendor', async () => {
      const mockVendor = {
        id: 'vendor-bank',
        vendorCode: 'VEN-20251113-555',
        vendorName: 'Bank Test Vendor',
        bankAccounts: [],
      } as unknown as Vendor;

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        id: 'vendor-bank',
        data: () => mockVendor,
      } as any);

      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      const newBankAccount = {
        bankName: 'BNI',
        accountNumber: '9876543210',
        accountName: 'PT Test Vendor',
        branch: 'Jakarta',
        isPrimary: true,
      };

      await addVendorBankAccount('vendor-bank', newBankAccount);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bankAccounts: expect.arrayContaining([
            expect.objectContaining({
              bankName: 'BNI',
              accountNumber: '9876543210',
              accountName: 'PT Test Vendor',
              id: expect.stringContaining('bank_'),
            }),
          ]),
        })
      );
    });
  });

  // ============================================================================
  // PERFORMANCE TRACKING
  // ============================================================================

  describe('updateVendorPerformance', () => {
    it('should update performance metrics and recalculate scores', async () => {
      const mockVendor: Vendor = {
        id: 'vendor-perf',
        vendorCode: 'VEN-20251113-444',
        vendorName: 'Performance Test',
        performance: {
          vendorId: 'vendor-perf',
          totalPOs: 10,
          onTimeDeliveries: 8,
          lateDeliveries: 2,
          totalGRs: 10,
          acceptedGRs: 9,
          rejectedGRs: 1,
          onTimeDeliveryRate: 0,
          qualityAcceptanceRate: 0,
          performanceScore: 0,
          averageEvaluationScore: 85,
          averagePaymentDelay: 2,
          riskLevel: 'low',
        } as VendorPerformance,
      } as Vendor;

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        id: 'vendor-perf',
        data: () => mockVendor,
      } as any);

      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      await updateVendorPerformance('vendor-perf', { totalPOs: 11 });

      const updateCall = vi.mocked(updateDoc).mock.calls[0][1] as any;
      const updatedPerformance = updateCall.performance;

      // Should recalculate rates
      expect(updatedPerformance.onTimeDeliveryRate).toBe(80); // 8/(8+2) * 100
      expect(updatedPerformance.qualityAcceptanceRate).toBe(90); // 9/10 * 100
      
      // Should calculate performance score (weighted average)
      expect(updatedPerformance.performanceScore).toBeGreaterThan(0);
      
      // Should determine risk level
      expect(updatedPerformance.riskLevel).toBe('low'); // Score should be >= 80
    });

    it('should set high risk level for poor performance', async () => {
      const mockVendor: Vendor = {
        id: 'vendor-poor',
        vendorCode: 'VEN-20251113-333',
        vendorName: 'Poor Performance',
        performance: {
          vendorId: 'vendor-poor',
          totalPOs: 10,
          onTimeDeliveries: 3,
          lateDeliveries: 7,
          totalGRs: 10,
          acceptedGRs: 5,
          rejectedGRs: 5,
          onTimeDeliveryRate: 0,
          qualityAcceptanceRate: 0,
          performanceScore: 0,
          averageEvaluationScore: 40,
          averagePaymentDelay: 15,
          riskLevel: 'low',
        } as VendorPerformance,
      } as Vendor;

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        id: 'vendor-poor',
        data: () => mockVendor,
      } as any);

      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      await updateVendorPerformance('vendor-poor', {});

      const updateCall = vi.mocked(updateDoc).mock.calls[0][1] as any;
      const updatedPerformance = updateCall.performance;

      // Low rates and scores should result in high risk
      expect(updatedPerformance.riskLevel).toBe('high'); // Score should be < 60
    });
  });

  // ============================================================================
  // VENDOR EVALUATION
  // ============================================================================

  describe('createVendorEvaluation', () => {
    it('should create evaluation and update vendor rating', async () => {
      const mockInput: CreateEvaluationInput = {
        vendorId: 'vendor-eval',
        projectId: 'proj-eval',
        scores: {
          quality: 90,
          delivery: 85,
          price: 80,
          communication: 95,
          documentation: 88,
          compliance: 92,
        },
        strengths: 'Good quality, Responsive',
        weaknesses: 'Price could be better',
        recommendations: 'Continue partnership',
        poId: 'po-123',
        grId: 'gr-456',
      };

      const mockVendor: Vendor = {
        id: 'vendor-eval',
        vendorCode: 'VEN-20251113-222',
        vendorName: 'Evaluation Test',
        performance: {
          totalEvaluations: 2,
          averageEvaluationScore: 80,
        } as VendorPerformance,
      } as Vendor;

      vi.mocked(addDoc).mockResolvedValueOnce({ id: 'eval-new' } as any);
      
      // First getDoc: in updateVendorAfterEvaluation -> getVendorById
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        id: 'vendor-eval',
        data: () => mockVendor,
      } as any);
      
      // Second getDoc: in updateVendorAfterEvaluation -> updateVendorPerformance -> getVendorById
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        id: 'vendor-eval',
        data: () => mockVendor,
      } as any);
      
      // First updateDoc: in updateVendorPerformance
      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);
      
      // Second updateDoc: in updateVendorAfterEvaluation
      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      const evaluation = await createVendorEvaluation(mockInput, 'user-eval', 'Evaluator Name');

      expect(evaluation.id).toBe('eval-new');
      expect(evaluation.vendorId).toBe('vendor-eval');
      
      // Average score should be (90+85+80+95+88+92)/6 = 88.33
      expect(evaluation.averageScore).toBeCloseTo(88.33, 1);
      
      // Rating should be 'good' (75-89)
      expect(evaluation.rating).toBe('good');
      
      expect(addDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should assign excellent rating for high scores', async () => {
      const mockInput: CreateEvaluationInput = {
        vendorId: 'vendor-excellent',
        projectId: 'proj-excellent',
        scores: {
          quality: 95,
          delivery: 95,
          price: 90,
          communication: 98,
          documentation: 92,
          compliance: 95,
        },
        strengths: 'Exceptional quality',
        weaknesses: '',
        recommendations: 'Preferred vendor',
      };

      const mockVendor: Vendor = {
        id: 'vendor-excellent',
        performance: { totalEvaluations: 0, averageEvaluationScore: 0 } as VendorPerformance,
      } as Vendor;

      vi.mocked(addDoc).mockResolvedValueOnce({ id: 'eval-excellent' } as any);
      
      // First getDoc: in updateVendorAfterEvaluation -> getVendorById
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        id: 'vendor-excellent',
        data: () => mockVendor,
      } as any);
      
      // Second getDoc: in updateVendorAfterEvaluation -> updateVendorPerformance -> getVendorById
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        id: 'vendor-excellent',
        data: () => mockVendor,
      } as any);
      
      // Two updateDoc calls
      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);
      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      const evaluation = await createVendorEvaluation(mockInput, 'user-eval', 'Evaluator');

      // Average >= 90 should get 'excellent'
      expect(evaluation.rating).toBe('excellent');
    });
  });

  describe('getVendorEvaluations', () => {
    it('should return all evaluations for vendor', async () => {
      const mockEvaluations = [
        { id: 'eval-1', vendorId: 'vendor-123', averageScore: 85, rating: 'good' },
        { id: 'eval-2', vendorId: 'vendor-123', averageScore: 90, rating: 'excellent' },
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: mockEvaluations.map((e) => ({
          id: e.id,
          data: () => e,
        })),
      } as any);

      const result = await getVendorEvaluations('vendor-123');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('eval-1');
    });
  });

  // ============================================================================
  // BLACKLIST MANAGEMENT
  // ============================================================================

  describe('blacklistVendor', () => {
    it('should blacklist vendor and update status', async () => {
      const mockInput: CreateBlacklistInput = {
        vendorId: 'vendor-blacklist',
        projectId: 'proj-blacklist',
        reason: 'Poor quality and delays',
        category: 'quality',
        severity: 'permanent',
        effectiveFrom: new Date().toISOString(),
        effectiveUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const mockVendor = {
        id: 'vendor-blacklist',
        vendorCode: 'VEN-20251113-111',
        vendorName: 'Blacklist Test',
        status: 'active',
        blacklistRecords: [],
      } as unknown as Vendor;

      vi.mocked(addDoc).mockResolvedValueOnce({ id: 'blacklist-new' } as any);
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        id: 'vendor-blacklist',
        data: () => mockVendor,
      } as any);
      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      const blacklist = await blacklistVendor(mockInput, 'user-blacklist', 'Admin User');

      expect(blacklist.id).toBe('blacklist-new');
      expect(blacklist.vendorId).toBe('vendor-blacklist');
      expect(blacklist.isActive).toBe(true);
      
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          isBlacklisted: true,
          status: 'blacklisted',
        })
      );
      
      expect(auditHelper.logCustom).toHaveBeenCalled();
    });
  });

  describe('removeFromBlacklist', () => {
    it('should remove vendor from blacklist and restore active status', async () => {
      const mockVendor: Vendor = {
        id: 'vendor-unblacklist',
        vendorCode: 'VEN-20251113-000',
        vendorName: 'Unblacklist Test',
        isBlacklisted: true,
        blacklistRecords: [
          { id: 'blacklist-1', isActive: true } as any,
        ],
      } as Vendor;

      vi.mocked(updateDoc).mockResolvedValue(undefined as any);
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        id: 'vendor-unblacklist',
        data: () => mockVendor,
      } as any);

      await removeFromBlacklist('blacklist-1', 'vendor-unblacklist', 'user-reviewer', 'Resolved issues');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          isActive: false,
          reviewedBy: 'user-reviewer',
          reviewNotes: 'Resolved issues',
        })
      );
      
      // Should restore active status
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          isBlacklisted: false,
          status: 'active',
        })
      );
    });
  });

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================

  describe('getVendorSummary', () => {
    it('should return comprehensive vendor statistics', async () => {
      const mockVendors = [
        { 
          id: 'v1', 
          status: 'active', 
          category: 'materials', 
          overallRating: 'excellent',
          isBlacklisted: false,
          performance: { totalPOs: 10, totalPOValue: 100000, performanceScore: 90, onTimeDeliveryRate: 95, qualityAcceptanceRate: 98 },
        },
        { 
          id: 'v2', 
          status: 'pending_approval', 
          category: 'equipment', 
          overallRating: 'not_rated',
          isBlacklisted: false,
          performance: { totalPOs: 0, totalPOValue: 0, performanceScore: 0, onTimeDeliveryRate: 0, qualityAcceptanceRate: 0 },
        },
        { 
          id: 'v3', 
          status: 'active', 
          category: 'materials', 
          overallRating: 'good',
          isBlacklisted: true,
          performance: { totalPOs: 5, totalPOValue: 50000, performanceScore: 80, onTimeDeliveryRate: 85, qualityAcceptanceRate: 90 },
        },
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: mockVendors.map((v) => ({
          id: v.id,
          data: () => v,
        })),
      } as any);

      const summary = await getVendorSummary();

      expect(summary.totalVendors).toBe(3);
      expect(summary.activeVendors).toBe(2);
      expect(summary.blacklistedVendors).toBe(1);
      expect(summary.pendingApprovals).toBe(1);
      expect(summary.byCategory.materials).toBe(2);
      expect(summary.byCategory.equipment).toBe(1);
      expect(summary.byRating.excellent).toBe(1);
      expect(summary.byRating.good).toBe(1);
      expect(summary.totalPOValue).toBe(150000);
      expect(summary.topVendors).toHaveLength(2); // Only active vendors
      expect(summary.topVendors[0].performanceScore).toBe(90);
    });
  });

  describe('searchVendors', () => {
    it('should search vendors by name, code, or tax ID', async () => {
      const mockVendors = [
        { 
          id: 'v1', 
          vendorName: 'PT Semen Indonesia', 
          vendorCode: 'VEN-20251113-001',
          legalName: 'PT Semen Indonesia Tbk',
          taxId: 'NPWP-111',
        },
        { 
          id: 'v2', 
          vendorName: 'CV Beton Jaya', 
          vendorCode: 'VEN-20251113-002',
          legalName: 'CV Beton Jaya',
          taxId: 'NPWP-222',
        },
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: mockVendors.map((v) => ({
          id: v.id,
          data: () => v,
        })),
      } as any);

      const result = await searchVendors('semen');

      expect(result).toHaveLength(1);
      expect(result[0].vendorName).toBe('PT Semen Indonesia');
    });

    it('should be case-insensitive', async () => {
      const mockVendors = [
        { 
          id: 'v1', 
          vendorName: 'PT SUPPLIER UTAMA', 
          vendorCode: 'VEN-001',
          legalName: 'PT SUPPLIER UTAMA',
          taxId: 'NPWP-ABC',
        },
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: mockVendors.map((v) => ({
          id: v.id,
          data: () => v,
        })),
      } as any);

      const result = await searchVendors('supplier');

      expect(result).toHaveLength(1);
    });
  });

  // ============================================================================
  // PO INTEGRATION
  // ============================================================================

  describe('getVendorPurchaseOrders', () => {
    it('should return all POs for vendor across all projects', async () => {
      const mockProjects = [
        { id: 'proj-1' },
        { id: 'proj-2' },
      ];

      const mockPOs = [
        { id: 'po-1', vendorId: 'vendor-123', status: 'Disetujui' },
        { id: 'po-2', vendorId: 'vendor-123', status: 'Diterima Penuh' },
      ];

      // First call: get projects
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: mockProjects.map((p) => ({ id: p.id, data: () => ({}) })),
      } as any);

      // Second call: POs from proj-1
      vi.mocked(getDocs).mockResolvedValueOnce({
        forEach: (callback: any) => {
          callback({ id: 'po-1', data: () => mockPOs[0] });
        },
        docs: [{ id: 'po-1', data: () => mockPOs[0] }],
      } as any);

      // Third call: POs from proj-2
      vi.mocked(getDocs).mockResolvedValueOnce({
        forEach: (callback: any) => {
          callback({ id: 'po-2', data: () => mockPOs[1] });
        },
        docs: [{ id: 'po-2', data: () => mockPOs[1] }],
      } as any);

      const result = await getVendorPurchaseOrders('vendor-123');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('po-1');
      expect(result[1].id).toBe('po-2');
    });

    it('should filter POs by status', async () => {
      const mockProjects = [{ id: 'proj-1' }];
      const mockPOs = [
        { id: 'po-1', vendorId: 'vendor-123', status: 'Disetujui' },
        { id: 'po-2', vendorId: 'vendor-123', status: 'Diterima Penuh' },
      ];

      vi.mocked(getDocs)
        .mockResolvedValueOnce({
          docs: mockProjects.map((p) => ({ id: p.id, data: () => ({}) })),
        } as any)
        .mockResolvedValueOnce({
          forEach: (callback: any) => {
            mockPOs.forEach((po) => {
              callback({ id: po.id, data: () => po });
            });
          },
          docs: mockPOs.map((po) => ({ id: po.id, data: () => po })),
        } as any);

      const result = await getVendorPurchaseOrders('vendor-123', ['Disetujui']);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('Disetujui');
    });
  });

  describe('getVendorStatistics', () => {
    it('should calculate vendor PO statistics', async () => {
      const mockProjects = [{ id: 'proj-1' }];
      const mockPOs = [
        { id: 'po-1', vendorId: 'vendor-stat', status: 'Disetujui', totalAmount: 10000 },
        { id: 'po-2', vendorId: 'vendor-stat', status: 'Diterima Penuh', totalAmount: 20000 },
        { id: 'po-3', vendorId: 'vendor-stat', status: 'Dipesan', totalAmount: 15000 },
      ];

      vi.mocked(getDocs)
        .mockResolvedValueOnce({
          docs: mockProjects.map((p) => ({ id: p.id, data: () => ({}) })),
        } as any)
        .mockResolvedValueOnce({
          forEach: (callback: any) => {
            mockPOs.forEach((po) => {
              callback({ id: po.id, data: () => po });
            });
          },
          docs: mockPOs.map((po) => ({ id: po.id, data: () => po })),
        } as any);

      const stats = await getVendorStatistics('vendor-stat');

      expect(stats.totalPOs).toBe(3);
      expect(stats.activePOs).toBe(2); // Disetujui, Dipesan
      expect(stats.completedPOs).toBe(1); // Diterima Penuh
      expect(stats.totalValue).toBe(45000);
      expect(stats.averagePOValue).toBe(15000);
      expect(stats.pendingValue).toBe(25000);
    });
  });

  describe('linkPOToVendor', () => {
    it('should link existing PO to vendor', async () => {
      const mockPO = { id: 'po-link', vendorId: null };
      const mockVendor = { id: 'vendor-link', vendorName: 'Link Test Vendor' };

      // Mock parallel reads
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          id: 'po-link',
          data: () => mockPO,
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          id: 'vendor-link',
          data: () => mockVendor,
        } as any);

      vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

      await linkPOToVendor('proj-link', 'po-link', 'vendor-link');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          vendorId: 'vendor-link',
          vendorName: 'Link Test Vendor',
        })
      );
    });

    it('should throw error when PO not found', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false,
      } as any);

      await expect(linkPOToVendor('proj-1', 'nonexistent-po', 'vendor-1')).rejects.toThrow(
        'Purchase Order not found'
      );
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle network errors gracefully in createVendor', async () => {
      const mockInput: CreateVendorInput = {
        vendorName: 'Error Test',
        legalName: 'Error Test',
        category: 'materials',
        email: 'error@test.com',
        phone: '021-111',
        mobile: '0811-111',
        address: 'Error St',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '11111',
        country: 'Indonesia',
        taxId: 'ERROR-123',
        businessLicenseNumber: 'ERROR-456',
        businessType: 'pt',
        paymentTerm: 'cod',
      };

      vi.mocked(getDocs).mockRejectedValueOnce(new Error('Network error'));

      await expect(createVendor(mockInput, 'user-error', 'Error User')).rejects.toThrow(
        'Failed to create vendor'
      );
    });

    it('should throw error when vendor not found in updateVendorContact', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false,
      } as any);

      // Service wraps in try/catch and throws 'Failed to update vendor contact'
      await expect(
        updateVendorContact('nonexistent', 'contact-1', { phone: '123' })
      ).rejects.toThrow('Failed to update vendor contact');
    });
  });
});
