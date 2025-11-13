/**
 * Tests for Accounts Payable Service
 *
 * Tests comprehensive vendor payment functionality including:
 * - Invoice creation and management
 * - Approval workflow
 * - Payment recording and tracking
 * - Aging report generation
 * - Integration with journal entries
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountsPayableService } from '../accountsPayableService';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
} from 'firebase/firestore';
import type { AccountsPayable, PayableStatus } from '@/types/accounting';

// Mock Firebase
vi.mock('@/firebaseConfig', () => ({
  db: {},
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  Timestamp: {
    fromDate: vi.fn((date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
    })),
  },
}));

// Mock utils
vi.mock('@/utils/retryWrapper', () => ({
  withRetry: vi.fn((fn) => fn()),
}));

vi.mock('@/utils/logger', () => ({
  createScopedLogger: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  })),
}));

vi.mock('@/utils/validators', () => ({
  validators: {
    isValidString: vi.fn((str: string, min: number, max: number) => ({
      valid: str.length >= min && str.length <= max,
    })),
  },
}));

// Mock journal service
vi.mock('../journalService', () => ({
  journalEntriesService: {
    createJournalEntry: vi.fn().mockResolvedValue({
      id: 'journal_123',
      entryNumber: 'JE-2025-0001',
    }),
  },
}));

describe('accountsPayableService', () => {
  let service: AccountsPayableService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AccountsPayableService();
  });

  describe('AP Number Generation', () => {
    it('should generate first AP number for current year', async () => {
      const year = new Date().getFullYear();
      const mockSnapshot = {
        empty: true,
        docs: [],
      };

      vi.mocked(collection).mockReturnValue('accounts_payable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await service.createAccountsPayable(
        {
          invoiceNumber: 'INV-001',
          invoiceDate: new Date('2025-01-15'),
          dueDate: new Date('2025-02-15'),
          vendorId: 'vendor_123',
          vendorName: 'ABC Supplies',
          vendorCode: 'V001',
          currency: 'IDR',
          lineItems: [
            {
              description: 'Materials',
              quantity: 10,
              unitPrice: 100000,
              amount: 1000000,
            } as any,
          ],
          subtotal: 1000000,
          taxAmount: 0,
          totalAmount: 1000000,
        } as any,
        'user_123'
      );

      expect(result.apNumber).toBe(`AP-${year}-0001`);
    });

    it('should generate next AP number in sequence', async () => {
      const year = new Date().getFullYear();
      const mockSnapshot = {
        empty: false,
        docs: [
          {
            data: () => ({
              apNumber: `AP-${year}-0005`,
            }),
          },
        ],
      };

      vi.mocked(collection).mockReturnValue('accounts_payable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await service.createAccountsPayable(
        {
          invoiceNumber: 'INV-002',
          invoiceDate: new Date(),
          dueDate: new Date(),
          vendorId: 'vendor_123',
          vendorName: 'ABC Supplies',
          vendorCode: 'V001',
          currency: 'IDR',
          lineItems: [{ description: 'Test', quantity: 1, unitPrice: 100, amount: 100 } as any],
          subtotal: 100,
          taxAmount: 0,
          totalAmount: 100,
        } as any,
        'user_123'
      );

      expect(result.apNumber).toBe(`AP-${year}-0006`);
    });
  });

  describe('Aging Calculation', () => {
    it('should calculate aging bracket 0-30 days', async () => {
      const mockSnapshot = {
        empty: true,
        docs: [],
      };

      vi.mocked(collection).mockReturnValue('accounts_payable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() - 15); // 15 days ago

      const result = await service.createAccountsPayable(
        {
          invoiceNumber: 'INV-001',
          invoiceDate,
          dueDate: new Date(),
          vendorId: 'vendor_123',
          vendorName: 'ABC Supplies',
          vendorCode: 'V001',
          currency: 'IDR',
          lineItems: [{ description: 'Test', quantity: 1, unitPrice: 100, amount: 100 } as any],
          subtotal: 100,
          taxAmount: 0,
          totalAmount: 100,
        } as any,
        'user_123'
      );

      expect(result.agingBracket).toBe('0-30');
      expect(result.agingDays).toBeGreaterThanOrEqual(14);
      expect(result.agingDays).toBeLessThanOrEqual(16);
    });

    it('should calculate aging bracket 31-60 days', async () => {
      const mockSnapshot = {
        empty: true,
        docs: [],
      };

      vi.mocked(collection).mockReturnValue('accounts_payable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() - 45); // 45 days ago

      const result = await service.createAccountsPayable(
        {
          invoiceNumber: 'INV-002',
          invoiceDate,
          dueDate: new Date(),
          vendorId: 'vendor_123',
          vendorName: 'ABC Supplies',
          vendorCode: 'V001',
          currency: 'IDR',
          lineItems: [{ description: 'Test', quantity: 1, unitPrice: 100, amount: 100 } as any],
          subtotal: 100,
          taxAmount: 0,
          totalAmount: 100,
        } as any,
        'user_123'
      );

      expect(result.agingBracket).toBe('31-60');
    });

    it('should calculate aging bracket 90+ days', async () => {
      const mockSnapshot = {
        empty: true,
        docs: [],
      };

      vi.mocked(collection).mockReturnValue('accounts_payable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() - 120); // 120 days ago

      const result = await service.createAccountsPayable(
        {
          invoiceNumber: 'INV-003',
          invoiceDate,
          dueDate: new Date(),
          vendorId: 'vendor_123',
          vendorName: 'ABC Supplies',
          vendorCode: 'V001',
          currency: 'IDR',
          lineItems: [{ description: 'Test', quantity: 1, unitPrice: 100, amount: 100 } as any],
          subtotal: 100,
          taxAmount: 0,
          totalAmount: 100,
        } as any,
        'user_123'
      );

      expect(result.agingBracket).toBe('90+');
    });
  });

  describe('createAccountsPayable', () => {
    it('should create AP with all fields correctly populated', async () => {
      const mockSnapshot = {
        empty: true,
        docs: [],
      };

      vi.mocked(collection).mockReturnValue('accounts_payable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const invoiceDate = new Date('2025-01-15');
      const dueDate = new Date('2025-02-15');

      const result = await service.createAccountsPayable(
        {
          invoiceNumber: 'INV-001',
          invoiceDate,
          dueDate,
          vendorId: 'vendor_123',
          vendorName: 'ABC Supplies',
          vendorCode: 'V001',
          currency: 'IDR',
          lineItems: [
            {
              description: 'Construction Materials',
              quantity: 100,
              unitPrice: 50000,
              amount: 5000000,
            } as any,
          ],
          subtotal: 5000000,
          taxAmount: 550000,
          totalAmount: 5550000,
        } as any,
        'user_123'
      );

      expect(result.id).toContain('ap_');
      expect(result.apNumber).toContain('AP-2025-');
      expect(result.invoiceNumber).toBe('INV-001');
      expect(result.vendorName).toBe('ABC Supplies');
      expect(result.totalAmount).toBe(5550000);
      expect(result.amountPaid).toBe(0);
      expect(result.amountDue).toBe(5550000);
      expect(result.status).toBe('pending');
      expect(result.lineItems).toHaveLength(1);
      expect(result.lineItems[0].lineNumber).toBe(1);
      expect(result.payments).toEqual([]);
      expect(result.createdBy).toBe('user_123');
    });

    it('should set requiresApproval for amounts > 10M', async () => {
      const mockSnapshot = {
        empty: true,
        docs: [],
      };

      vi.mocked(collection).mockReturnValue('accounts_payable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await service.createAccountsPayable(
        {
          invoiceNumber: 'INV-BIG',
          invoiceDate: new Date(),
          dueDate: new Date(),
          vendorId: 'vendor_123',
          vendorName: 'ABC Supplies',
          vendorCode: 'V001',
          currency: 'IDR',
          lineItems: [
            { description: 'Large Purchase', quantity: 1, unitPrice: 15000000, amount: 15000000 } as any,
          ],
          subtotal: 15000000,
          taxAmount: 0,
          totalAmount: 15000000,
        } as any,
        'user_123'
      );

      expect(result.requiresApproval).toBe(true);
    });

    it('should enrich line items with default values', async () => {
      const mockSnapshot = {
        empty: true,
        docs: [],
      };

      vi.mocked(collection).mockReturnValue('accounts_payable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await service.createAccountsPayable(
        {
          invoiceNumber: 'INV-001',
          invoiceDate: new Date(),
          dueDate: new Date(),
          vendorId: 'vendor_123',
          vendorName: 'ABC Supplies',
          vendorCode: 'V001',
          currency: 'IDR',
          lineItems: [
            { description: 'Item 1', quantity: 5, unitPrice: 1000, amount: 5000 } as any,
            { description: 'Item 2', quantity: 10, unitPrice: 2000, amount: 20000 } as any,
          ],
          subtotal: 25000,
          taxAmount: 0,
          totalAmount: 25000,
        } as any,
        'user_123'
      );

      expect(result.lineItems[0].id).toBe('line_1');
      expect(result.lineItems[0].lineNumber).toBe(1);
      expect(result.lineItems[0].expenseAccountId).toBe('default_expense_account');
      expect(result.lineItems[0].expenseAccountNumber).toBe('5000');

      expect(result.lineItems[1].id).toBe('line_2');
      expect(result.lineItems[1].lineNumber).toBe(2);
    });

    it('should reject AP without invoice number', async () => {
      await expect(
        service.createAccountsPayable(
          {
            invoiceNumber: '',
            invoiceDate: new Date(),
            dueDate: new Date(),
            vendorId: 'vendor_123',
            vendorName: 'ABC',
            vendorCode: 'V001',
            currency: 'IDR',
            lineItems: [{ description: 'Test', quantity: 1, unitPrice: 100, amount: 100 } as any],
            subtotal: 100,
            taxAmount: 0,
            totalAmount: 100,
          } as any,
          'user_123'
        )
      ).rejects.toThrow('Invoice number is required');
    });

    it('should reject AP without vendor ID', async () => {
      await expect(
        service.createAccountsPayable(
          {
            invoiceNumber: 'INV-001',
            invoiceDate: new Date(),
            dueDate: new Date(),
            vendorId: '',
            vendorName: 'ABC',
            vendorCode: 'V001',
            currency: 'IDR',
            lineItems: [{ description: 'Test', quantity: 1, unitPrice: 100, amount: 100 } as any],
            subtotal: 100,
            taxAmount: 0,
            totalAmount: 100,
          } as any,
          'user_123'
        )
      ).rejects.toThrow('Vendor ID is required');
    });

    it('should reject AP without line items', async () => {
      await expect(
        service.createAccountsPayable(
          {
            invoiceNumber: 'INV-001',
            invoiceDate: new Date(),
            dueDate: new Date(),
            vendorId: 'vendor_123',
            vendorName: 'ABC',
            vendorCode: 'V001',
            currency: 'IDR',
            lineItems: [],
            subtotal: 0,
            taxAmount: 0,
            totalAmount: 0,
          } as any,
          'user_123'
        )
      ).rejects.toThrow('At least one line item is required');
    });
  });

  describe('getAccountsPayable', () => {
    it('should get AP by ID successfully', async () => {
      const mockAP = {
        id: 'ap_123',
        apNumber: 'AP-2025-0001',
        invoiceNumber: 'INV-001',
        invoiceDate: new Date('2025-01-15'),
        dueDate: new Date('2025-02-15'),
        vendorId: 'vendor_123',
        vendorName: 'ABC Supplies',
        vendorCode: 'V001',
        currency: 'IDR',
        lineItems: [],
        subtotal: 1000000,
        taxAmount: 110000,
        totalAmount: 1110000,
        amountPaid: 0,
        amountDue: 1110000,
        status: 'pending',
        agingDays: 10,
        agingBracket: '0-30',
        payments: [],
        createdAt: new Date(),
        createdBy: 'user_123',
        updatedAt: new Date(),
        updatedBy: 'user_123',
      } as unknown as AccountsPayable;

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockAP,
          invoiceDate: { toDate: () => mockAP.invoiceDate },
          dueDate: { toDate: () => mockAP.dueDate },
          createdAt: { toDate: () => mockAP.createdAt },
          updatedAt: { toDate: () => mockAP.updatedAt },
        }),
      } as any);

      const result = await service.getAccountsPayable('ap_123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('ap_123');
      expect(result?.apNumber).toBe('AP-2025-0001');
      expect(result?.vendorName).toBe('ABC Supplies');
    });

    it('should return null for non-existent AP', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await service.getAccountsPayable('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getAllAccountsPayable', () => {
    it('should get all AP sorted by invoice date', async () => {
      const mockAPs = [
        { id: 'ap_1', apNumber: 'AP-2025-0001', invoiceDate: new Date('2025-01-15') },
        { id: 'ap_2', apNumber: 'AP-2025-0002', invoiceDate: new Date('2025-01-20') },
      ];

      vi.mocked(collection).mockReturnValue('accounts_payable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockAPs.map((ap) => ({
          data: () => ({
            ...ap,
            invoiceDate: { toDate: () => ap.invoiceDate },
            dueDate: { toDate: () => new Date() },
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        })),
      } as any);

      const result = await service.getAllAccountsPayable();

      expect(result).toHaveLength(2);
      expect(result[0].apNumber).toBe('AP-2025-0001');
    });

    it('should return empty array on error', async () => {
      vi.mocked(collection).mockReturnValue('accounts_payable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockRejectedValue(new Error('Firestore error'));

      const result = await service.getAllAccountsPayable();

      expect(result).toEqual([]);
    });
  });

  describe('getAccountsPayableByStatus', () => {
    it('should get AP filtered by status', async () => {
      const mockPendingAPs = [
        {
          id: 'ap_1',
          apNumber: 'AP-2025-0001',
          status: 'pending',
          dueDate: new Date('2025-02-15'),
        },
        {
          id: 'ap_2',
          apNumber: 'AP-2025-0002',
          status: 'pending',
          dueDate: new Date('2025-02-20'),
        },
      ];

      vi.mocked(collection).mockReturnValue('accounts_payable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockPendingAPs.map((ap) => ({
          data: () => ({
            ...ap,
            invoiceDate: { toDate: () => new Date() },
            dueDate: { toDate: () => ap.dueDate },
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        })),
      } as any);

      const result = await service.getAccountsPayableByStatus('pending' as PayableStatus);

      expect(result).toHaveLength(2);
      expect(result.every((ap) => ap.status === 'pending')).toBe(true);
    });
  });

  describe('getAccountsPayableByVendor', () => {
    it('should get AP for specific vendor', async () => {
      const mockVendorAPs = [
        {
          id: 'ap_1',
          apNumber: 'AP-2025-0001',
          vendorId: 'vendor_123',
          vendorName: 'ABC Supplies',
        },
        {
          id: 'ap_2',
          apNumber: 'AP-2025-0002',
          vendorId: 'vendor_123',
          vendorName: 'ABC Supplies',
        },
      ];

      vi.mocked(collection).mockReturnValue('accounts_payable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockVendorAPs.map((ap) => ({
          data: () => ({
            ...ap,
            invoiceDate: { toDate: () => new Date() },
            dueDate: { toDate: () => new Date() },
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        })),
      } as any);

      const result = await service.getAccountsPayableByVendor('vendor_123');

      expect(result).toHaveLength(2);
      expect(result.every((ap) => ap.vendorId === 'vendor_123')).toBe(true);
    });
  });

  describe('approveAccountsPayable', () => {
    it('should approve pending AP successfully', async () => {
      const mockPendingAP = {
        id: 'ap_123',
        apNumber: 'AP-2025-0001',
        invoiceNumber: 'INV-001',
        invoiceDate: new Date(),
        dueDate: new Date(),
        vendorId: 'vendor_123',
        vendorName: 'ABC Supplies',
        vendorCode: 'V001',
        currency: 'IDR',
        lineItems: [],
        subtotal: 1000000,
        taxAmount: 0,
        totalAmount: 1000000,
        amountPaid: 0,
        amountDue: 1000000,
        status: 'pending',
        agingDays: 10,
        agingBracket: '0-30',
        payments: [],
        createdAt: new Date(),
        createdBy: 'user_123',
        updatedAt: new Date(),
        updatedBy: 'user_123',
      } as unknown as AccountsPayable;

      let getCallCount = 0;
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockImplementation(() => {
        getCallCount++;
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            ...mockPendingAP,
            status: getCallCount === 1 ? 'pending' : 'approved',
            invoiceDate: { toDate: () => mockPendingAP.invoiceDate },
            dueDate: { toDate: () => mockPendingAP.dueDate },
            createdAt: { toDate: () => mockPendingAP.createdAt },
            updatedAt: { toDate: () => mockPendingAP.updatedAt },
            approvedAt: getCallCount === 2 ? { toDate: () => new Date() } : undefined,
          }),
        } as any);
      });

      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await service.approveAccountsPayable('ap_123', 'user_456', 'Approved by manager');

      expect(updateDoc).toHaveBeenCalled();
      expect(result?.status).toBe('approved');
    });

    it('should throw error for non-existent AP', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      await expect(service.approveAccountsPayable('nonexistent', 'user_123')).rejects.toThrow(
        'not found'
      );
    });

    it('should prevent approving non-pending AP', async () => {
      const mockApprovedAP = {
        id: 'ap_123',
        apNumber: 'AP-2025-0001',
        invoiceNumber: 'INV-001',
        invoiceDate: new Date(),
        dueDate: new Date(),
        vendorId: 'vendor_123',
        vendorName: 'ABC Supplies',
        vendorCode: 'V001',
        currency: 'IDR',
        lineItems: [],
        subtotal: 1000000,
        taxAmount: 0,
        totalAmount: 1000000,
        amountPaid: 1000000,
        amountDue: 0,
        status: 'paid', // Already paid
        agingDays: 10,
        agingBracket: '0-30',
        payments: [],
        createdAt: new Date(),
        createdBy: 'user_123',
        updatedAt: new Date(),
        updatedBy: 'user_123',
      } as unknown as AccountsPayable;

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockApprovedAP,
          invoiceDate: { toDate: () => mockApprovedAP.invoiceDate },
          dueDate: { toDate: () => mockApprovedAP.dueDate },
          createdAt: { toDate: () => mockApprovedAP.createdAt },
          updatedAt: { toDate: () => mockApprovedAP.updatedAt },
        }),
      } as any);

      await expect(service.approveAccountsPayable('ap_123', 'user_456')).rejects.toThrow(
        'Cannot approve'
      );
    });
  });

  describe('recordPayment', () => {
    it('should record full payment successfully', async () => {
      const mockAP = {
        id: 'ap_123',
        apNumber: 'AP-2025-0001',
        invoiceNumber: 'INV-001',
        invoiceDate: new Date(),
        dueDate: new Date(),
        vendorId: 'vendor_123',
        vendorName: 'ABC Supplies',
        vendorCode: 'V001',
        currency: 'IDR',
        lineItems: [],
        subtotal: 1000000,
        taxAmount: 0,
        totalAmount: 1000000,
        amountPaid: 0,
        amountDue: 1000000,
        status: 'approved',
        agingDays: 10,
        agingBracket: '0-30',
        payments: [],
        createdAt: new Date(),
        createdBy: 'user_123',
        updatedAt: new Date(),
        updatedBy: 'user_123',
      } as unknown as AccountsPayable;

      let getCallCount = 0;
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockImplementation(() => {
        getCallCount++;
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            ...mockAP,
            amountPaid: getCallCount === 1 ? 0 : 1000000,
            amountDue: getCallCount === 1 ? 1000000 : 0,
            status: getCallCount === 1 ? 'approved' : 'paid',
            invoiceDate: { toDate: () => mockAP.invoiceDate },
            dueDate: { toDate: () => mockAP.dueDate },
            createdAt: { toDate: () => mockAP.createdAt },
            updatedAt: { toDate: () => mockAP.updatedAt },
          }),
        } as any);
      });

      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const payment = {
        amount: 1000000,
        paymentDate: new Date(),
        paymentMethod: 'bank_transfer' as any,
        bankAccountId: 'bank_001',
        bankAccountName: 'BCA Main',
        reference: 'TRX-001',
        currency: 'IDR',
      } as any;

      const result = await service.recordPayment('ap_123', payment, 'user_456');

      expect(updateDoc).toHaveBeenCalled();
      expect(result?.status).toBe('paid');
      expect(result?.amountPaid).toBe(1000000);
      expect(result?.amountDue).toBe(0);
    });

    it('should record partial payment', async () => {
      const mockAP = {
        id: 'ap_123',
        apNumber: 'AP-2025-0001',
        invoiceNumber: 'INV-001',
        invoiceDate: new Date(),
        dueDate: new Date(),
        vendorId: 'vendor_123',
        vendorName: 'ABC Supplies',
        vendorCode: 'V001',
        currency: 'IDR',
        lineItems: [],
        subtotal: 2000000,
        taxAmount: 0,
        totalAmount: 2000000,
        amountPaid: 0,
        amountDue: 2000000,
        status: 'approved',
        agingDays: 10,
        agingBracket: '0-30',
        payments: [],
        createdAt: new Date(),
        createdBy: 'user_123',
        updatedAt: new Date(),
        updatedBy: 'user_123',
      } as unknown as AccountsPayable;

      let getCallCount = 0;
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockImplementation(() => {
        getCallCount++;
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            ...mockAP,
            amountPaid: getCallCount === 1 ? 0 : 1000000,
            amountDue: getCallCount === 1 ? 2000000 : 1000000,
            status: getCallCount === 1 ? 'approved' : 'partially_paid',
            invoiceDate: { toDate: () => mockAP.invoiceDate },
            dueDate: { toDate: () => mockAP.dueDate },
            createdAt: { toDate: () => mockAP.createdAt },
            updatedAt: { toDate: () => mockAP.updatedAt },
          }),
        } as any);
      });

      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const payment = {
        amount: 1000000,
        paymentDate: new Date(),
        paymentMethod: 'bank_transfer' as any,
        reference: 'TRX-001',
        currency: 'IDR',
      } as any;

      const result = await service.recordPayment('ap_123', payment, 'user_456');

      expect(result?.status).toBe('partially_paid');
      expect(result?.amountPaid).toBe(1000000);
      expect(result?.amountDue).toBe(1000000);
    });

    it('should prevent payment exceeding amount due', async () => {
      const mockAP = {
        id: 'ap_123',
        apNumber: 'AP-2025-0001',
        invoiceNumber: 'INV-001',
        invoiceDate: new Date(),
        dueDate: new Date(),
        vendorId: 'vendor_123',
        vendorName: 'ABC Supplies',
        vendorCode: 'V001',
        currency: 'IDR',
        lineItems: [],
        subtotal: 1000000,
        taxAmount: 0,
        totalAmount: 1000000,
        amountPaid: 0,
        amountDue: 1000000,
        status: 'approved',
        agingDays: 10,
        agingBracket: '0-30',
        payments: [],
        createdAt: new Date(),
        createdBy: 'user_123',
        updatedAt: new Date(),
        updatedBy: 'user_123',
      } as unknown as AccountsPayable;

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockAP,
          invoiceDate: { toDate: () => mockAP.invoiceDate },
          dueDate: { toDate: () => mockAP.dueDate },
          createdAt: { toDate: () => mockAP.createdAt },
          updatedAt: { toDate: () => mockAP.updatedAt },
        }),
      } as any);

      const payment = {
        amount: 1500000, // Exceeds amount due
        paymentDate: new Date(),
        paymentMethod: 'bank_transfer' as any,
        currency: 'IDR',
      } as any;

      await expect(service.recordPayment('ap_123', payment, 'user_456')).rejects.toThrow(
        'exceeds amount due'
      );
    });

    it('should prevent payment on paid AP', async () => {
      const mockPaidAP = {
        id: 'ap_123',
        apNumber: 'AP-2025-0001',
        invoiceNumber: 'INV-001',
        invoiceDate: new Date(),
        dueDate: new Date(),
        vendorId: 'vendor_123',
        vendorName: 'ABC Supplies',
        vendorCode: 'V001',
        currency: 'IDR',
        lineItems: [],
        subtotal: 1000000,
        taxAmount: 0,
        totalAmount: 1000000,
        amountPaid: 1000000,
        amountDue: 0,
        status: 'paid',
        agingDays: 10,
        agingBracket: '0-30',
        payments: [],
        createdAt: new Date(),
        createdBy: 'user_123',
        updatedAt: new Date(),
        updatedBy: 'user_123',
      } as unknown as AccountsPayable;

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockPaidAP,
          invoiceDate: { toDate: () => mockPaidAP.invoiceDate },
          dueDate: { toDate: () => mockPaidAP.dueDate },
          createdAt: { toDate: () => mockPaidAP.createdAt },
          updatedAt: { toDate: () => mockPaidAP.updatedAt },
        }),
      } as any);

      const payment = {
        amount: 500000,
        paymentDate: new Date(),
        paymentMethod: 'bank_transfer' as any,
        currency: 'IDR',
      } as any;

      await expect(service.recordPayment('ap_123', payment, 'user_456')).rejects.toThrow(
        'Cannot record payment'
      );
    });
  });

  describe('generateAgingReport', () => {
    it('should generate aging report with correct brackets', async () => {
      const now = new Date();
      const mockAPs = [
        // 0-30 days: 2 items
        {
          id: 'ap_1',
          invoiceDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
          amountDue: 1000000,
          status: 'pending',
        },
        {
          id: 'ap_2',
          invoiceDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
          amountDue: 2000000,
          status: 'pending',
        },
        // 31-60 days: 1 item
        {
          id: 'ap_3',
          invoiceDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
          amountDue: 3000000,
          status: 'pending',
        },
        // 90+ days: 1 item
        {
          id: 'ap_4',
          invoiceDate: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000),
          amountDue: 4000000,
          status: 'pending',
        },
        // Paid (should be excluded)
        {
          id: 'ap_5',
          invoiceDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          amountDue: 0,
          status: 'paid',
        },
      ];

      vi.mocked(collection).mockReturnValue('accounts_payable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockAPs.map((ap) => ({
          data: () => ({
            ...ap,
            invoiceDate: { toDate: () => ap.invoiceDate },
            dueDate: { toDate: () => new Date() },
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        })),
      } as any);

      const result = await service.generateAgingReport();

      expect(result.totalCount).toBe(4); // Excludes paid
      expect(result.totalAmount).toBe(10000000);
      expect(result.brackets).toHaveLength(4);

      const bracket030 = result.brackets.find((b) => b.bracket === '0-30');
      expect(bracket030?.count).toBe(2);
      expect(bracket030?.totalAmount).toBe(3000000);

      const bracket3160 = result.brackets.find((b) => b.bracket === '31-60');
      expect(bracket3160?.count).toBe(1);
      expect(bracket3160?.totalAmount).toBe(3000000);

      const bracket90plus = result.brackets.find((b) => b.bracket === '90+');
      expect(bracket90plus?.count).toBe(1);
      expect(bracket90plus?.totalAmount).toBe(4000000);
    });

    it('should calculate percentages correctly', async () => {
      const now = new Date();
      const mockAPs = [
        {
          id: 'ap_1',
          invoiceDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
          amountDue: 5000000,
          status: 'pending',
        },
        {
          id: 'ap_2',
          invoiceDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
          amountDue: 5000000,
          status: 'pending',
        },
      ];

      vi.mocked(collection).mockReturnValue('accounts_payable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockAPs.map((ap) => ({
          data: () => ({
            ...ap,
            invoiceDate: { toDate: () => ap.invoiceDate },
            dueDate: { toDate: () => new Date() },
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        })),
      } as any);

      const result = await service.generateAgingReport();

      const bracket030 = result.brackets.find((b) => b.bracket === '0-30');
      expect(bracket030?.percentage).toBe(50);

      const bracket3160 = result.brackets.find((b) => b.bracket === '31-60');
      expect(bracket3160?.percentage).toBe(50);
    });

    it('should handle empty AP list', async () => {
      vi.mocked(collection).mockReturnValue('accounts_payable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: [],
      } as any);

      const result = await service.generateAgingReport();

      expect(result.totalCount).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.brackets.every((b) => b.count === 0)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore errors gracefully in getAccountsPayable', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockRejectedValue(new Error('Firestore connection failed'));

      const result = await service.getAccountsPayable('ap_123');

      expect(result).toBeNull();
    });

    it('should throw error for invalid payment on non-existent AP', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      await expect(
        service.recordPayment(
          'nonexistent',
          { amount: 1000, paymentDate: new Date(), paymentMethod: 'cash', currency: 'IDR' } as any,
          'user_123'
        )
      ).rejects.toThrow('not found');
    });
  });
});

