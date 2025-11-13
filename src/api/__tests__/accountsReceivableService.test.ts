/**
 * Tests for Accounts Receivable Service
 *
 * Tests comprehensive customer payment functionality including:
 * - Invoice creation and management
 * - Payment recording and tracking
 * - Aging report generation
 * - Collection management
 * - Payment reminders (gentle, firm, final)
 * - Automated reminder system
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountsReceivableService } from '../accountsReceivableService';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
} from 'firebase/firestore';
import type { AccountsReceivable, ReceivableStatus } from '@/types/accounting';

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
  addDoc: vi.fn().mockResolvedValue({ id: 'notification_123' }),
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
    now: vi.fn(() => ({
      toDate: () => new Date(),
      seconds: Math.floor(Date.now() / 1000),
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
    info: vi.fn(),
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

// Mock notification service
vi.mock('./notificationService', () => ({
  createNotification: vi.fn().mockResolvedValue({ id: 'notif_123' }),
}));

// Mock notification types
vi.mock('../types/automation', () => ({
  NotificationType: {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
  },
  NotificationPriority: {
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent',
  },
  NotificationChannel: {
    IN_APP: 'in_app',
    EMAIL: 'email',
    SMS: 'sms',
  },
}));

describe('accountsReceivableService', () => {
  let service: AccountsReceivableService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AccountsReceivableService();
  });

  describe('AR Number Generation', () => {
    it('should generate first AR number for current year', async () => {
      const year = new Date().getFullYear();
      const mockSnapshot = {
        empty: true,
        docs: [],
      };

      vi.mocked(collection).mockReturnValue('accounts_receivable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await service.createAccountsReceivable(
        {
          invoiceNumber: 'INV-001',
          invoiceDate: new Date('2025-01-15'),
          dueDate: new Date('2025-02-15'),
          customerId: 'customer_123',
          customerName: 'XYZ Corp',
          customerCode: 'C001',
          currency: 'IDR',
          lineItems: [
            {
              description: 'Services',
              quantity: 10,
              unitPrice: 500000,
              amount: 5000000,
            } as any,
          ],
          subtotal: 5000000,
          taxAmount: 0,
          totalAmount: 5000000,
        } as any,
        'user_123'
      );

      expect(result.arNumber).toBe(`AR-${year}-0001`);
    });

    it('should generate next AR number in sequence', async () => {
      const year = new Date().getFullYear();
      const mockSnapshot = {
        empty: false,
        docs: [
          {
            data: () => ({
              arNumber: `AR-${year}-0003`,
            }),
          },
        ],
      };

      vi.mocked(collection).mockReturnValue('accounts_receivable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await service.createAccountsReceivable(
        {
          invoiceNumber: 'INV-002',
          invoiceDate: new Date(),
          dueDate: new Date(),
          customerId: 'customer_123',
          customerName: 'XYZ Corp',
          customerCode: 'C001',
          currency: 'IDR',
          lineItems: [{ description: 'Test', quantity: 1, unitPrice: 100, amount: 100 } as any],
          subtotal: 100,
          taxAmount: 0,
          totalAmount: 100,
        } as any,
        'user_123'
      );

      expect(result.arNumber).toBe(`AR-${year}-0004`);
    });
  });

  describe('Aging Calculation', () => {
    it('should calculate aging bracket 0-30 days', async () => {
      const mockSnapshot = {
        empty: true,
        docs: [],
      };

      vi.mocked(collection).mockReturnValue('accounts_receivable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() - 20); // 20 days ago

      const result = await service.createAccountsReceivable(
        {
          invoiceNumber: 'INV-001',
          invoiceDate,
          dueDate: new Date(),
          customerId: 'customer_123',
          customerName: 'XYZ Corp',
          customerCode: 'C001',
          currency: 'IDR',
          lineItems: [{ description: 'Test', quantity: 1, unitPrice: 100, amount: 100 } as any],
          subtotal: 100,
          taxAmount: 0,
          totalAmount: 100,
        } as any,
        'user_123'
      );

      expect(result.agingBracket).toBe('0-30');
    });

    it('should calculate aging bracket 90+ days', async () => {
      const mockSnapshot = {
        empty: true,
        docs: [],
      };

      vi.mocked(collection).mockReturnValue('accounts_receivable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() - 100); // 100 days ago

      const result = await service.createAccountsReceivable(
        {
          invoiceNumber: 'INV-002',
          invoiceDate,
          dueDate: new Date(),
          customerId: 'customer_123',
          customerName: 'XYZ Corp',
          customerCode: 'C001',
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

  describe('createAccountsReceivable', () => {
    it('should create AR with all fields correctly populated', async () => {
      const mockSnapshot = {
        empty: true,
        docs: [],
      };

      vi.mocked(collection).mockReturnValue('accounts_receivable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const invoiceDate = new Date('2025-01-15');
      const dueDate = new Date('2025-02-15');

      const result = await service.createAccountsReceivable(
        {
          invoiceNumber: 'INV-001',
          invoiceDate,
          dueDate,
          customerId: 'customer_123',
          customerName: 'XYZ Corp',
          customerCode: 'C001',
          currency: 'IDR',
          lineItems: [
            {
              description: 'Professional Services',
              quantity: 40,
              unitPrice: 250000,
              amount: 10000000,
            } as any,
          ],
          subtotal: 10000000,
          taxAmount: 1100000,
          totalAmount: 11100000,
        } as any,
        'user_123'
      );

      expect(result.id).toContain('ar_');
      expect(result.arNumber).toContain('AR-2025-');
      expect(result.invoiceNumber).toBe('INV-001');
      expect(result.customerName).toBe('XYZ Corp');
      expect(result.totalAmount).toBe(11100000);
      expect(result.amountPaid).toBe(0);
      expect(result.amountDue).toBe(11100000);
      expect(result.status).toBe('sent');
      expect(result.lineItems).toHaveLength(1);
      expect(result.lineItems[0].lineNumber).toBe(1);
      expect(result.payments).toEqual([]);
      expect(result.remindersSent).toBe(0);
      expect(result.createdBy).toBe('user_123');
    });

    it('should enrich line items with default revenue accounts', async () => {
      const mockSnapshot = {
        empty: true,
        docs: [],
      };

      vi.mocked(collection).mockReturnValue('accounts_receivable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await service.createAccountsReceivable(
        {
          invoiceNumber: 'INV-001',
          invoiceDate: new Date(),
          dueDate: new Date(),
          customerId: 'customer_123',
          customerName: 'XYZ Corp',
          customerCode: 'C001',
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
      expect(result.lineItems[0].revenueAccountId).toBe('default_revenue_account');
      expect(result.lineItems[0].revenueAccountNumber).toBe('4000');

      expect(result.lineItems[1].id).toBe('line_2');
      expect(result.lineItems[1].lineNumber).toBe(2);
    });

    it('should reject AR without invoice number', async () => {
      await expect(
        service.createAccountsReceivable(
          {
            invoiceNumber: '',
            invoiceDate: new Date(),
            dueDate: new Date(),
            customerId: 'customer_123',
            customerName: 'XYZ',
            customerCode: 'C001',
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

    it('should reject AR without customer ID', async () => {
      await expect(
        service.createAccountsReceivable(
          {
            invoiceNumber: 'INV-001',
            invoiceDate: new Date(),
            dueDate: new Date(),
            customerId: '',
            customerName: 'XYZ',
            customerCode: 'C001',
            currency: 'IDR',
            lineItems: [{ description: 'Test', quantity: 1, unitPrice: 100, amount: 100 } as any],
            subtotal: 100,
            taxAmount: 0,
            totalAmount: 100,
          } as any,
          'user_123'
        )
      ).rejects.toThrow('Customer ID is required');
    });

    it('should reject AR without line items', async () => {
      await expect(
        service.createAccountsReceivable(
          {
            invoiceNumber: 'INV-001',
            invoiceDate: new Date(),
            dueDate: new Date(),
            customerId: 'customer_123',
            customerName: 'XYZ',
            customerCode: 'C001',
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

  describe('getAccountsReceivable', () => {
    it('should get AR by ID successfully', async () => {
      const mockAR = {
        id: 'ar_123',
        arNumber: 'AR-2025-0001',
        invoiceNumber: 'INV-001',
        invoiceDate: new Date('2025-01-15'),
        dueDate: new Date('2025-02-15'),
        customerId: 'customer_123',
        customerName: 'XYZ Corp',
        customerCode: 'C001',
        currency: 'IDR',
        lineItems: [],
        subtotal: 5000000,
        taxAmount: 550000,
        totalAmount: 5550000,
        amountPaid: 0,
        amountDue: 5550000,
        status: 'sent',
        agingDays: 10,
        agingBracket: '0-30',
        payments: [],
        remindersSent: 0,
        createdAt: new Date(),
        createdBy: 'user_123',
        updatedAt: new Date(),
        updatedBy: 'user_123',
      } as unknown as AccountsReceivable;

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockAR,
          invoiceDate: { toDate: () => mockAR.invoiceDate },
          dueDate: { toDate: () => mockAR.dueDate },
          createdAt: { toDate: () => mockAR.createdAt },
          updatedAt: { toDate: () => mockAR.updatedAt },
        }),
      } as any);

      const result = await service.getAccountsReceivable('ar_123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('ar_123');
      expect(result?.arNumber).toBe('AR-2025-0001');
      expect(result?.customerName).toBe('XYZ Corp');
    });

    it('should return null for non-existent AR', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await service.getAccountsReceivable('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getAllAccountsReceivable', () => {
    it('should get all AR sorted by invoice date', async () => {
      const mockARs = [
        { id: 'ar_1', arNumber: 'AR-2025-0001', invoiceDate: new Date('2025-01-15') },
        { id: 'ar_2', arNumber: 'AR-2025-0002', invoiceDate: new Date('2025-01-20') },
      ];

      vi.mocked(collection).mockReturnValue('accounts_receivable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockARs.map((ar) => ({
          data: () => ({
            ...ar,
            invoiceDate: { toDate: () => ar.invoiceDate },
            dueDate: { toDate: () => new Date() },
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        })),
      } as any);

      const result = await service.getAllAccountsReceivable();

      expect(result).toHaveLength(2);
      expect(result[0].arNumber).toBe('AR-2025-0001');
    });

    it('should return empty array on error', async () => {
      vi.mocked(collection).mockReturnValue('accounts_receivable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockRejectedValue(new Error('Firestore error'));

      const result = await service.getAllAccountsReceivable();

      expect(result).toEqual([]);
    });
  });

  describe('getAccountsReceivableByStatus', () => {
    it('should get AR filtered by status', async () => {
      const mockSentARs = [
        {
          id: 'ar_1',
          arNumber: 'AR-2025-0001',
          status: 'sent',
          dueDate: new Date('2025-02-15'),
        },
        {
          id: 'ar_2',
          arNumber: 'AR-2025-0002',
          status: 'sent',
          dueDate: new Date('2025-02-20'),
        },
      ];

      vi.mocked(collection).mockReturnValue('accounts_receivable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockSentARs.map((ar) => ({
          data: () => ({
            ...ar,
            invoiceDate: { toDate: () => new Date() },
            dueDate: { toDate: () => ar.dueDate },
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        })),
      } as any);

      const result = await service.getAccountsReceivableByStatus('sent' as ReceivableStatus);

      expect(result).toHaveLength(2);
      expect(result.every((ar) => ar.status === 'sent')).toBe(true);
    });
  });

  describe('getAccountsReceivableByCustomer', () => {
    it('should get AR for specific customer', async () => {
      const mockCustomerARs = [
        {
          id: 'ar_1',
          arNumber: 'AR-2025-0001',
          customerId: 'customer_123',
          customerName: 'XYZ Corp',
        },
        {
          id: 'ar_2',
          arNumber: 'AR-2025-0002',
          customerId: 'customer_123',
          customerName: 'XYZ Corp',
        },
      ];

      vi.mocked(collection).mockReturnValue('accounts_receivable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockCustomerARs.map((ar) => ({
          data: () => ({
            ...ar,
            invoiceDate: { toDate: () => new Date() },
            dueDate: { toDate: () => new Date() },
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        })),
      } as any);

      const result = await service.getAccountsReceivableByCustomer('customer_123');

      expect(result).toHaveLength(2);
      expect(result.every((ar) => ar.customerId === 'customer_123')).toBe(true);
    });
  });

  describe('recordPayment', () => {
    it('should record full payment successfully', async () => {
      const mockAR = {
        id: 'ar_123',
        arNumber: 'AR-2025-0001',
        invoiceNumber: 'INV-001',
        invoiceDate: new Date(),
        dueDate: new Date(),
        customerId: 'customer_123',
        customerName: 'XYZ Corp',
        customerCode: 'C001',
        currency: 'IDR',
        lineItems: [],
        subtotal: 5000000,
        taxAmount: 0,
        totalAmount: 5000000,
        amountPaid: 0,
        amountDue: 5000000,
        status: 'sent',
        agingDays: 10,
        agingBracket: '0-30',
        payments: [],
        remindersSent: 0,
        createdAt: new Date(),
        createdBy: 'user_123',
        updatedAt: new Date(),
        updatedBy: 'user_123',
      } as unknown as AccountsReceivable;

      let getCallCount = 0;
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockImplementation(() => {
        getCallCount++;
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            ...mockAR,
            amountPaid: getCallCount === 1 ? 0 : 5000000,
            amountDue: getCallCount === 1 ? 5000000 : 0,
            status: getCallCount === 1 ? 'sent' : 'paid',
            invoiceDate: { toDate: () => mockAR.invoiceDate },
            dueDate: { toDate: () => mockAR.dueDate },
            createdAt: { toDate: () => mockAR.createdAt },
            updatedAt: { toDate: () => mockAR.updatedAt },
          }),
        } as any);
      });

      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const payment = {
        amount: 5000000,
        paymentDate: new Date(),
        paymentMethod: 'bank_transfer' as any,
        bankAccountId: 'bank_001',
        bankAccountName: 'BCA Main',
        currency: 'IDR',
      } as any;

      const result = await service.recordPayment('ar_123', payment, 'user_456');

      expect(updateDoc).toHaveBeenCalled();
      expect(result?.status).toBe('paid');
      expect(result?.amountPaid).toBe(5000000);
      expect(result?.amountDue).toBe(0);
    });

    it('should record partial payment', async () => {
      const mockAR = {
        id: 'ar_123',
        arNumber: 'AR-2025-0001',
        invoiceNumber: 'INV-001',
        invoiceDate: new Date(),
        dueDate: new Date(),
        customerId: 'customer_123',
        customerName: 'XYZ Corp',
        customerCode: 'C001',
        currency: 'IDR',
        lineItems: [],
        subtotal: 10000000,
        taxAmount: 0,
        totalAmount: 10000000,
        amountPaid: 0,
        amountDue: 10000000,
        status: 'sent',
        agingDays: 10,
        agingBracket: '0-30',
        payments: [],
        remindersSent: 0,
        createdAt: new Date(),
        createdBy: 'user_123',
        updatedAt: new Date(),
        updatedBy: 'user_123',
      } as unknown as AccountsReceivable;

      let getCallCount = 0;
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockImplementation(() => {
        getCallCount++;
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            ...mockAR,
            amountPaid: getCallCount === 1 ? 0 : 6000000,
            amountDue: getCallCount === 1 ? 10000000 : 4000000,
            status: getCallCount === 1 ? 'sent' : 'partially_paid',
            invoiceDate: { toDate: () => mockAR.invoiceDate },
            dueDate: { toDate: () => mockAR.dueDate },
            createdAt: { toDate: () => mockAR.createdAt },
            updatedAt: { toDate: () => mockAR.updatedAt },
          }),
        } as any);
      });

      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const payment = {
        amount: 6000000,
        paymentDate: new Date(),
        paymentMethod: 'bank_transfer' as any,
        currency: 'IDR',
      } as any;

      const result = await service.recordPayment('ar_123', payment, 'user_456');

      expect(result?.status).toBe('partially_paid');
      expect(result?.amountPaid).toBe(6000000);
      expect(result?.amountDue).toBe(4000000);
    });

    it('should prevent payment exceeding amount due', async () => {
      const mockAR = {
        id: 'ar_123',
        arNumber: 'AR-2025-0001',
        invoiceNumber: 'INV-001',
        invoiceDate: new Date(),
        dueDate: new Date(),
        customerId: 'customer_123',
        customerName: 'XYZ Corp',
        customerCode: 'C001',
        currency: 'IDR',
        lineItems: [],
        subtotal: 5000000,
        taxAmount: 0,
        totalAmount: 5000000,
        amountPaid: 0,
        amountDue: 5000000,
        status: 'sent',
        agingDays: 10,
        agingBracket: '0-30',
        payments: [],
        remindersSent: 0,
        createdAt: new Date(),
        createdBy: 'user_123',
        updatedAt: new Date(),
        updatedBy: 'user_123',
      } as unknown as AccountsReceivable;

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockAR,
          invoiceDate: { toDate: () => mockAR.invoiceDate },
          dueDate: { toDate: () => mockAR.dueDate },
          createdAt: { toDate: () => mockAR.createdAt },
          updatedAt: { toDate: () => mockAR.updatedAt },
        }),
      } as any);

      const payment = {
        amount: 6000000, // Exceeds amount due
        paymentDate: new Date(),
        paymentMethod: 'bank_transfer' as any,
        currency: 'IDR',
      } as any;

      await expect(service.recordPayment('ar_123', payment, 'user_456')).rejects.toThrow(
        'exceeds amount due'
      );
    });

    it('should prevent payment on paid AR', async () => {
      const mockPaidAR = {
        id: 'ar_123',
        arNumber: 'AR-2025-0001',
        invoiceNumber: 'INV-001',
        invoiceDate: new Date(),
        dueDate: new Date(),
        customerId: 'customer_123',
        customerName: 'XYZ Corp',
        customerCode: 'C001',
        currency: 'IDR',
        lineItems: [],
        subtotal: 5000000,
        taxAmount: 0,
        totalAmount: 5000000,
        amountPaid: 5000000,
        amountDue: 0,
        status: 'paid',
        agingDays: 10,
        agingBracket: '0-30',
        payments: [],
        remindersSent: 0,
        createdAt: new Date(),
        createdBy: 'user_123',
        updatedAt: new Date(),
        updatedBy: 'user_123',
      } as unknown as AccountsReceivable;

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockPaidAR,
          invoiceDate: { toDate: () => mockPaidAR.invoiceDate },
          dueDate: { toDate: () => mockPaidAR.dueDate },
          createdAt: { toDate: () => mockPaidAR.createdAt },
          updatedAt: { toDate: () => mockPaidAR.updatedAt },
        }),
      } as any);

      const payment = {
        amount: 1000000,
        paymentDate: new Date(),
        paymentMethod: 'bank_transfer' as any,
        currency: 'IDR',
      } as any;

      await expect(service.recordPayment('ar_123', payment, 'user_456')).rejects.toThrow(
        'Cannot record payment'
      );
    });
  });

  describe('addCollectionNote', () => {
    it('should add collection note successfully', async () => {
      const mockAR = {
        id: 'ar_123',
        arNumber: 'AR-2025-0001',
        collectionNotes: 'Previous note',
      } as unknown as AccountsReceivable;

      let getCallCount = 0;
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockImplementation(() => {
        getCallCount++;
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            ...mockAR,
            collectionNotes: getCallCount === 1 ? 'Previous note' : expect.stringContaining('Called customer'),
            invoiceDate: { toDate: () => new Date() },
            dueDate: { toDate: () => new Date() },
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        } as any);
      });

      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await service.addCollectionNote('ar_123', 'Called customer - promised payment next week', 'user_456');

      expect(updateDoc).toHaveBeenCalled();
      expect(result).not.toBeNull();
    });

    it('should throw error for non-existent AR', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      await expect(service.addCollectionNote('nonexistent', 'Note', 'user_123')).rejects.toThrow(
        'not found'
      );
    });
  });

  describe('markOverdueInvoices', () => {
    it('should mark overdue invoices', async () => {
      const now = new Date();
      const pastDue = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

      const mockARs = [
        {
          id: 'ar_1',
          status: 'sent',
          dueDate: pastDue,
        },
        {
          id: 'ar_2',
          status: 'viewed',
          dueDate: pastDue,
        },
        {
          id: 'ar_3',
          status: 'paid',
          dueDate: pastDue,
        },
      ];

      vi.mocked(collection).mockReturnValue('accounts_receivable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockARs.map((ar) => ({
          data: () => ({
            ...ar,
            invoiceDate: { toDate: () => new Date() },
            dueDate: { toDate: () => ar.dueDate },
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        })),
      } as any);

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await service.markOverdueInvoices();

      expect(result).toBe(2); // ar_1 and ar_2 (not ar_3 which is paid)
      expect(updateDoc).toHaveBeenCalledTimes(2);
    });

    it('should return 0 when no overdue invoices', async () => {
      const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const mockARs = [
        {
          id: 'ar_1',
          status: 'sent',
          dueDate: future,
        },
      ];

      vi.mocked(collection).mockReturnValue('accounts_receivable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockARs.map((ar) => ({
          data: () => ({
            ...ar,
            invoiceDate: { toDate: () => new Date() },
            dueDate: { toDate: () => ar.dueDate },
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        })),
      } as any);

      const result = await service.markOverdueInvoices();

      expect(result).toBe(0);
    });
  });

  describe('generateAgingReport', () => {
    it('should generate aging report with correct brackets', async () => {
      const now = new Date();
      const mockARs = [
        // 0-30 days: 2 items
        {
          id: 'ar_1',
          invoiceDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
          amountDue: 2000000,
          status: 'sent',
        },
        {
          id: 'ar_2',
          invoiceDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
          amountDue: 3000000,
          status: 'sent',
        },
        // 31-60 days: 1 item
        {
          id: 'ar_3',
          invoiceDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
          amountDue: 5000000,
          status: 'overdue',
        },
        // 90+ days: 1 item
        {
          id: 'ar_4',
          invoiceDate: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000),
          amountDue: 10000000,
          status: 'overdue',
        },
        // Paid (should be excluded)
        {
          id: 'ar_5',
          invoiceDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          amountDue: 0,
          status: 'paid',
        },
      ];

      vi.mocked(collection).mockReturnValue('accounts_receivable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockARs.map((ar) => ({
          data: () => ({
            ...ar,
            invoiceDate: { toDate: () => ar.invoiceDate },
            dueDate: { toDate: () => new Date() },
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        })),
      } as any);

      const result = await service.generateAgingReport();

      expect(result.totalCount).toBe(4); // Excludes paid
      expect(result.totalAmount).toBe(20000000);
      expect(result.brackets).toHaveLength(4);

      const bracket030 = result.brackets.find((b) => b.bracket === '0-30');
      expect(bracket030?.count).toBe(2);
      expect(bracket030?.totalAmount).toBe(5000000);

      const bracket3160 = result.brackets.find((b) => b.bracket === '31-60');
      expect(bracket3160?.count).toBe(1);
      expect(bracket3160?.totalAmount).toBe(5000000);

      const bracket90plus = result.brackets.find((b) => b.bracket === '90+');
      expect(bracket90plus?.count).toBe(1);
      expect(bracket90plus?.totalAmount).toBe(10000000);
    });

    it('should calculate percentages correctly', async () => {
      const now = new Date();
      const mockARs = [
        {
          id: 'ar_1',
          invoiceDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
          amountDue: 5000000,
          status: 'sent',
        },
        {
          id: 'ar_2',
          invoiceDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
          amountDue: 5000000,
          status: 'overdue',
        },
      ];

      vi.mocked(collection).mockReturnValue('accounts_receivable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockARs.map((ar) => ({
          data: () => ({
            ...ar,
            invoiceDate: { toDate: () => ar.invoiceDate },
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
  });

  describe('sendPaymentReminder', () => {
    it('should send gentle reminder', async () => {
      const mockAR = {
        id: 'ar_123',
        arNumber: 'AR-2025-0001',
        totalAmount: 5000000,
        dueDate: new Date(),
        agingDays: 5,
      } as unknown as AccountsReceivable;

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockAR,
          invoiceDate: { toDate: () => new Date() },
          dueDate: { toDate: () => mockAR.dueDate },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      } as any);

      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      await service.sendPaymentReminder('ar_123', 'user_456', 'gentle');

      expect(updateDoc).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalled(); // Audit trail
    });

    it('should send firm reminder for overdue', async () => {
      const mockAR = {
        id: 'ar_123',
        arNumber: 'AR-2025-0001',
        totalAmount: 5000000,
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        agingDays: 40,
      } as unknown as AccountsReceivable;

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockAR,
          invoiceDate: { toDate: () => new Date() },
          dueDate: { toDate: () => mockAR.dueDate },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      } as any);

      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      await service.sendPaymentReminder('ar_123', 'user_456', 'firm');

      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('sendAutomatedReminders', () => {
    it('should send automated reminders based on aging', async () => {
      const now = new Date();

      const mockARs = [
        // Gentle: 5 days before due
        {
          id: 'ar_1',
          status: 'sent',
          dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          lastReminderSent: undefined,
        },
        // Firm: 5 days overdue
        {
          id: 'ar_2',
          status: 'overdue',
          dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          lastReminderSent: undefined,
        },
        // Final: 20 days overdue
        {
          id: 'ar_3',
          status: 'overdue',
          dueDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
          lastReminderSent: undefined,
        },
        // Paid (skip)
        {
          id: 'ar_4',
          status: 'paid',
          dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        },
      ];

      vi.mocked(collection).mockReturnValue('accounts_receivable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockARs.map((ar) => ({
          data: () => ({
            ...ar,
            invoiceDate: { toDate: () => new Date() },
            dueDate: { toDate: () => ar.dueDate },
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        })),
      } as any);

      // Mock getAccountsReceivable for sendPaymentReminder calls
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: 'ar_123',
          arNumber: 'AR-2025-0001',
          totalAmount: 5000000,
          dueDate: new Date(),
          agingDays: 5,
          invoiceDate: { toDate: () => new Date() },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      } as any);

      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await service.sendAutomatedReminders();

      expect(result.gentle).toBe(1);
      expect(result.firm).toBe(1);
      expect(result.final).toBe(1);
    });

    it('should skip recently reminded invoices', async () => {
      const now = new Date();
      const recentReminder = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const mockARs = [
        {
          id: 'ar_1',
          status: 'overdue',
          dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          lastReminderSent: recentReminder.toISOString(),
        },
      ];

      vi.mocked(collection).mockReturnValue('accounts_receivable' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockARs.map((ar) => ({
          data: () => ({
            ...ar,
            invoiceDate: { toDate: () => new Date() },
            dueDate: { toDate: () => ar.dueDate },
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        })),
      } as any);

      const result = await service.sendAutomatedReminders();

      expect(result.gentle).toBe(0);
      expect(result.firm).toBe(0);
      expect(result.final).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore errors gracefully', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockRejectedValue(new Error('Firestore connection failed'));

      const result = await service.getAccountsReceivable('ar_123');

      expect(result).toBeNull();
    });

    it('should throw error for payment on non-existent AR', async () => {
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
