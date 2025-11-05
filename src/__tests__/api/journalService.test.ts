/**
 * Unit Tests for Journal Entries Service
 * Comprehensive test coverage for accounting journal functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { JournalEntriesService } from '../../api/journalService';
import { db } from '../../firebaseConfig';
import type { JournalEntry, JournalEntryLine, JournalEntryStatus } from '../../types/accounting';

// ========================================
// MOCKS
// ========================================

// Mock Firebase Firestore
vi.mock('../../firebaseConfig', () => ({
  db: {},
}));

// Mock Firebase functions
const mockDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockQuery = vi.fn();
const mockCollection = vi.fn();
const mockServerTimestamp = vi.fn(() => new Date());
const mockWriteBatch = vi.fn(() => ({
  set: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  commit: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  serverTimestamp: mockServerTimestamp,
  Timestamp: {
    fromDate: vi.fn((date) => ({ toDate: () => date })),
    now: vi.fn(() => ({ toDate: () => new Date() })),
  },
  writeBatch: mockWriteBatch,
}));

// Mock chartOfAccountsService
vi.mock('../../api/chartOfAccountsService', () => ({
  chartOfAccountsService: {
    getAccount: vi.fn(),
    updateAccountBalance: vi.fn(),
  },
}));

// Mock utilities
vi.mock('../../utils/validators', () => ({
  validators: {
    isValidString: vi.fn(() => ({ valid: true })),
  },
}));

vi.mock('../../utils/retryWrapper', () => ({
  withRetry: vi.fn((fn) => fn()),
}));

vi.mock('../../utils/logger', () => ({
  createScopedLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
    debug: vi.fn(),
  })),
}));

vi.mock('../../utils/responseWrapper', () => ({
  APIError: class APIError extends Error {
    constructor(code: string, message: string, status: number, details?: any) {
      super(message);
      this.name = 'APIError';
    }
  },
  ErrorCodes: {
    INVALID_INPUT: 'INVALID_INPUT',
    NOT_FOUND: 'NOT_FOUND',
    INVALID_OPERATION: 'INVALID_OPERATION',
  },
}));

// ========================================
// TEST DATA
// ========================================

const mockJournalEntry: JournalEntry = {
  id: 'je_123',
  entryNumber: 'JE-2024-0001',
  entryDate: new Date('2024-01-15'),
  description: 'Purchase office supplies',
  reference: 'PO-001',
  entryType: 'standard',
  lines: [
    {
      id: 'line_1',
      lineNumber: 1,
      accountId: 'acc_1',
      accountNumber: '5001',
      accountName: 'Office Supplies',
      debit: 100000,
      credit: 0,
      description: 'Office supplies purchase',
      currency: 'IDR',
    },
    {
      id: 'line_2',
      lineNumber: 2,
      accountId: 'acc_2',
      accountNumber: '1001',
      accountName: 'Cash on Hand',
      debit: 0,
      credit: 100000,
      description: 'Cash payment',
      currency: 'IDR',
    },
  ],
  totalDebit: 100000,
  totalCredit: 100000,
  isBalanced: true,
  status: 'draft',
  baseCurrency: 'IDR',
  totalDebitBaseCurrency: 100000,
  totalCreditBaseCurrency: 100000,
  createdAt: new Date(),
  createdBy: 'user-1',
  updatedAt: new Date(),
  updatedBy: 'user-1',
};

const mockEntryData = {
  entryDate: new Date('2024-01-15'),
  description: 'Purchase office supplies',
  reference: 'PO-001',
  entryType: 'standard' as const,
  lines: [
    {
      accountId: 'acc_1',
      debit: 100000,
      credit: 0,
      description: 'Office supplies purchase',
    },
    {
      accountId: 'acc_2',
      debit: 0,
      credit: 100000,
      description: 'Cash payment',
    },
  ],
};

// ========================================
// TEST SUITES
// ========================================

describe('JournalEntriesService', () => {
  let service: JournalEntriesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new JournalEntriesService();

    // Setup default mocks
    mockCollection.mockReturnValue('collection-ref');
    mockDoc.mockReturnValue('doc-ref');
    mockQuery.mockReturnValue('query-ref');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createJournalEntry', () => {
    it('should create a balanced journal entry successfully', async () => {
      // Arrange
      const userId = 'user-1';

      // Mock account lookups
      const mockChartOfAccountsService = await import('../../api/chartOfAccountsService');
      mockChartOfAccountsService.chartOfAccountsService.getAccount
        .mockResolvedValueOnce({
          id: 'acc_1',
          accountNumber: '5001',
          accountName: 'Office Supplies',
          currency: 'IDR',
        })
        .mockResolvedValueOnce({
          id: 'acc_2',
          accountNumber: '1001',
          accountName: 'Cash on Hand',
          currency: 'IDR',
        });

      // Mock no existing entries for number generation
      mockGetDocs.mockResolvedValueOnce({
        empty: true,
        docs: [],
      });

      // Mock creation
      mockSetDoc.mockResolvedValue(undefined);

      // Act
      const result = await service.createJournalEntry(mockEntryData, userId);

      // Assert
      expect(result.entryNumber).toMatch(/^JE-2024-0001$/);
      expect(result.totalDebit).toBe(100000);
      expect(result.totalCredit).toBe(100000);
      expect(result.isBalanced).toBe(true);
      expect(result.status).toBe('draft');
      expect(result.lines).toHaveLength(2);
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should reject unbalanced journal entries', async () => {
      // Arrange
      const userId = 'user-1';
      const unbalancedData = {
        ...mockEntryData,
        lines: [
          { accountId: 'acc_1', debit: 100000, credit: 0 },
          { accountId: 'acc_2', debit: 0, credit: 50000 }, // Unbalanced
        ],
      };

      // Act & Assert
      await expect(service.createJournalEntry(unbalancedData, userId)).rejects.toThrow(
        'Journal entry is not balanced'
      );
    });

    it('should reject entries with invalid lines', async () => {
      // Arrange
      const userId = 'user-1';
      const invalidData = {
        ...mockEntryData,
        lines: [
          { accountId: 'acc_1', debit: 100000, credit: 50000 }, // Both debit and credit
        ],
      };

      // Act & Assert
      await expect(service.createJournalEntry(invalidData, userId)).rejects.toThrow(
        'Cannot have both debit and credit'
      );
    });

    it('should reject entries with no lines', async () => {
      // Arrange
      const userId = 'user-1';
      const noLinesData = {
        ...mockEntryData,
        lines: [],
      };

      // Act & Assert
      await expect(service.createJournalEntry(noLinesData, userId)).rejects.toThrow(
        'must have at least 2 lines'
      );
    });

    it('should generate sequential entry numbers', async () => {
      // Arrange
      const userId = 'user-1';

      // Mock existing entry
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{
          data: () => ({ entryNumber: 'JE-2024-0005' }),
        }],
      });

      const mockChartOfAccountsService = await import('../../api/chartOfAccountsService');
      mockChartOfAccountsService.chartOfAccountsService.getAccount
        .mockResolvedValue({
          id: 'acc_1',
          accountNumber: '5001',
          accountName: 'Office Supplies',
          currency: 'IDR',
        });

      mockSetDoc.mockResolvedValue(undefined);

      // Act
      const result = await service.createJournalEntry(mockEntryData, userId);

      // Assert
      expect(result.entryNumber).toBe('JE-2024-0006');
    });
  });

  describe('getJournalEntry', () => {
    it('should retrieve a journal entry successfully', async () => {
      // Arrange
      const entryId = 'je_123';
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockJournalEntry,
          entryDate: { toDate: () => new Date() },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      });

      // Act
      const result = await service.getJournalEntry(entryId);

      // Assert
      expect(result?.id).toBe(entryId);
      expect(result?.entryNumber).toBe('JE-2024-0001');
      expect(result?.description).toBe('Purchase office supplies');
    });

    it('should return null for non-existent entry', async () => {
      // Arrange
      const entryId = 'non-existent';
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      // Act
      const result = await service.getJournalEntry(entryId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getAllJournalEntries', () => {
    it('should retrieve all journal entries ordered by date', async () => {
      // Arrange
      const mockEntries = [
        { ...mockJournalEntry, entryNumber: 'JE-2024-0002' },
        { ...mockJournalEntry, entryNumber: 'JE-2024-0001' },
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockEntries.map(entry => ({
          data: () => ({
            ...entry,
            entryDate: { toDate: () => new Date() },
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        })),
      });

      // Act
      const result = await service.getAllJournalEntries();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].entryNumber).toBe('JE-2024-0002'); // Should be ordered by date desc
    });
  });

  describe('getJournalEntriesByStatus', () => {
    it('should filter entries by status', async () => {
      // Arrange
      const status: JournalEntryStatus = 'approved';
      const mockApprovedEntries = [
        { ...mockJournalEntry, status: 'approved' },
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockApprovedEntries.map(entry => ({
          data: () => ({
            ...entry,
            entryDate: { toDate: () => new Date() },
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        })),
      });

      // Act
      const result = await service.getJournalEntriesByStatus(status);

      // Assert
      expect(result).toHaveLength(1);
      expect(result.every(entry => entry.status === 'approved')).toBe(true);
    });
  });

  describe('updateJournalEntry', () => {
    it('should update a draft entry successfully', async () => {
      // Arrange
      const entryId = 'je_123';
      const updates = {
        description: 'Updated description',
      };
      const userId = 'user-1';

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockJournalEntry,
          entryDate: { toDate: () => new Date() },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      // Act
      const result = await service.updateJournalEntry(entryId, updates, userId);

      // Assert
      expect(result?.description).toBe('Updated description');
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('should prevent updating posted entries', async () => {
      // Arrange
      const entryId = 'je_123';
      const updates = { description: 'New description' };
      const userId = 'user-1';

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockJournalEntry,
          status: 'posted',
          entryDate: { toDate: () => new Date() },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      });

      // Act & Assert
      await expect(service.updateJournalEntry(entryId, updates, userId)).rejects.toThrow(
        'Cannot update posted journal entries'
      );
    });

    it('should validate updated lines balance', async () => {
      // Arrange
      const entryId = 'je_123';
      const updates = {
        lines: [
          { accountId: 'acc_1', debit: 150000, credit: 0 }, // Unbalanced
          { accountId: 'acc_2', debit: 0, credit: 100000 },
        ],
      };
      const userId = 'user-1';

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockJournalEntry,
          entryDate: { toDate: () => new Date() },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      });

      // Act & Assert
      await expect(service.updateJournalEntry(entryId, updates, userId)).rejects.toThrow(
        'not balanced'
      );
    });
  });

  describe('submitForApproval', () => {
    it('should submit draft entry for approval', async () => {
      // Arrange
      const entryId = 'je_123';
      const userId = 'user-1';

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockJournalEntry,
          status: 'draft',
          isBalanced: true,
          entryDate: { toDate: () => new Date() },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      // Act
      const result = await service.submitForApproval(entryId, userId);

      // Assert
      expect(result?.status).toBe('pending_approval');
      expect(result?.submittedBy).toBe(userId);
    });

    it('should reject unbalanced entries', async () => {
      // Arrange
      const entryId = 'je_123';
      const userId = 'user-1';

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockJournalEntry,
          status: 'draft',
          isBalanced: false,
          entryDate: { toDate: () => new Date() },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      });

      // Act & Assert
      await expect(service.submitForApproval(entryId, userId)).rejects.toThrow(
        'Cannot submit unbalanced entry'
      );
    });
  });

  describe('approveEntry', () => {
    it('should approve pending entry', async () => {
      // Arrange
      const entryId = 'je_123';
      const userId = 'user-1';

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockJournalEntry,
          status: 'pending_approval',
          entryDate: { toDate: () => new Date() },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      // Act
      const result = await service.approveEntry(entryId, userId);

      // Assert
      expect(result?.status).toBe('approved');
      expect(result?.approvedBy).toBe(userId);
    });

    it('should reject non-pending entries', async () => {
      // Arrange
      const entryId = 'je_123';
      const userId = 'user-1';

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockJournalEntry,
          status: 'draft',
          entryDate: { toDate: () => new Date() },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      });

      // Act & Assert
      await expect(service.approveEntry(entryId, userId)).rejects.toThrow(
        'Cannot approve entry with status draft'
      );
    });
  });

  describe('postEntry', () => {
    it('should post approved entry successfully', async () => {
      // Arrange
      const entryId = 'je_123';
      const userId = 'user-1';

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockJournalEntry,
          status: 'approved',
          isBalanced: true,
          entryDate: { toDate: () => new Date() },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      const mockChartOfAccountsService = await import('../../api/chartOfAccountsService');
      mockChartOfAccountsService.chartOfAccountsService.updateAccountBalance.mockResolvedValue(undefined);

      // Act
      const result = await service.postEntry(entryId, userId);

      // Assert
      expect(result?.status).toBe('posted');
      expect(result?.postedBy).toBe(userId);
      expect(mockChartOfAccountsService.chartOfAccountsService.updateAccountBalance).toHaveBeenCalledTimes(2);
    });

    it('should reject unbalanced entries', async () => {
      // Arrange
      const entryId = 'je_123';
      const userId = 'user-1';

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockJournalEntry,
          status: 'approved',
          isBalanced: false,
          entryDate: { toDate: () => new Date() },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      });

      // Act & Assert
      await expect(service.postEntry(entryId, userId)).rejects.toThrow(
        'Cannot post unbalanced entry'
      );
    });
  });

  describe('voidEntry', () => {
    it('should void draft entry', async () => {
      // Arrange
      const entryId = 'je_123';
      const reason = 'Entry no longer needed';
      const userId = 'user-1';

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockJournalEntry,
          status: 'draft',
          entryDate: { toDate: () => new Date() },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      // Act
      const result = await service.voidEntry(entryId, reason, userId);

      // Assert
      expect(result?.status).toBe('void');
      expect(result?.voidedBy).toBe(userId);
      expect(result?.voidReason).toBe(reason);
    });

    it('should create reversing entry for posted entries', async () => {
      // Arrange
      const entryId = 'je_123';
      const reason = 'Correcting error';
      const userId = 'user-1';

      const postedEntry = {
        ...mockJournalEntry,
        status: 'posted',
        entryDate: { toDate: () => new Date() },
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => postedEntry,
      });

      // Mock reversing entry creation
      const mockChartOfAccountsService = await import('../../api/chartOfAccountsService');
      mockChartOfAccountsService.chartOfAccountsService.getAccount.mockResolvedValue({
        id: 'acc_1',
        accountNumber: '5001',
        accountName: 'Office Supplies',
        currency: 'IDR',
      });

      mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
      mockSetDoc.mockResolvedValue(undefined);
      mockUpdateDoc.mockResolvedValue(undefined);

      // Act
      const result = await service.voidEntry(entryId, reason, userId);

      // Assert
      expect(result?.status).toBe('void');
      expect(result?.reversingEntryId).toBeDefined();
    });
  });

  describe('deleteJournalEntry', () => {
    it('should delete draft entry successfully', async () => {
      // Arrange
      const entryId = 'je_123';
      const userId = 'user-1';

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockJournalEntry,
          status: 'draft',
          entryDate: { toDate: () => new Date() },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      });
      mockDeleteDoc.mockResolvedValue(undefined);

      // Act
      const result = await service.deleteJournalEntry(entryId, userId);

      // Assert
      expect(result).toBe(true);
      expect(mockDeleteDoc).toHaveBeenCalled();
    });

    it('should prevent deleting non-draft entries', async () => {
      // Arrange
      const entryId = 'je_123';
      const userId = 'user-1';

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockJournalEntry,
          status: 'approved',
          entryDate: { toDate: () => new Date() },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      });

      // Act & Assert
      await expect(service.deleteJournalEntry(entryId, userId)).rejects.toThrow(
        'Can only delete draft entries'
      );
    });
  });

  // ========================================
  // ERROR HANDLING TESTS
  // ========================================

  describe('Error Handling', () => {
    it('should handle Firebase errors gracefully', async () => {
      // Arrange
      const entryId = 'je_123';
      const firebaseError = new Error('Firebase connection failed');
      mockGetDoc.mockRejectedValue(firebaseError);

      // Act
      const result = await service.getJournalEntry(entryId);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle account not found errors', async () => {
      // Arrange
      const userId = 'user-1';
      const mockChartOfAccountsService = await import('../../api/chartOfAccountsService');
      mockChartOfAccountsService.chartOfAccountsService.getAccount.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createJournalEntry(mockEntryData, userId)).rejects.toThrow(
        'Account not found'
      );
    });

    it('should handle validation errors', async () => {
      // Arrange
      const userId = 'user-1';
      const invalidData = {
        ...mockEntryData,
        description: '', // Invalid empty description
      };

      // Act & Assert
      await expect(service.createJournalEntry(invalidData, userId)).rejects.toThrow();
    });
  });

  // ========================================
  // EDGE CASES
  // ========================================

  describe('Edge Cases', () => {
    it('should handle entries with many lines', async () => {
      // Arrange
      const userId = 'user-1';
      const manyLinesData = {
        ...mockEntryData,
        lines: Array.from({ length: 50 }, (_, i) => ({
          accountId: `acc_${i + 1}`,
          debit: i % 2 === 0 ? 1000 : 0,
          credit: i % 2 === 1 ? 1000 : 0,
        })),
      };

      const mockChartOfAccountsService = await import('../../api/chartOfAccountsService');
      mockChartOfAccountsService.chartOfAccountsService.getAccount.mockResolvedValue({
        id: 'acc_1',
        accountNumber: '1001',
        accountName: 'Test Account',
        currency: 'IDR',
      });

      mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
      mockSetDoc.mockResolvedValue(undefined);

      // Act
      const result = await service.createJournalEntry(manyLinesData, userId);

      // Assert
      expect(result.lines).toHaveLength(50);
      expect(result.totalDebit).toBe(25000); // 25 lines with debit
      expect(result.totalCredit).toBe(25000); // 25 lines with credit
    });

    it('should handle multi-currency entries', async () => {
      // Arrange
      const userId = 'user-1';
      const multiCurrencyData = {
        ...mockEntryData,
        baseCurrency: 'USD',
        lines: [
          {
            accountId: 'acc_1',
            debit: 1000,
            credit: 0,
            currency: 'USD',
          },
          {
            accountId: 'acc_2',
            debit: 0,
            credit: 1000,
            currency: 'USD',
          },
        ],
      };

      const mockChartOfAccountsService = await import('../../api/chartOfAccountsService');
      mockChartOfAccountsService.chartOfAccountsService.getAccount.mockResolvedValue({
        id: 'acc_1',
        accountNumber: '1001',
        accountName: 'Test Account',
        currency: 'USD',
      });

      mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
      mockSetDoc.mockResolvedValue(undefined);

      // Act
      const result = await service.createJournalEntry(multiCurrencyData, userId);

      // Assert
      expect(result.baseCurrency).toBe('USD');
      expect(result.lines[0].currency).toBe('USD');
    });

    it('should handle zero amount lines', async () => {
      // Arrange
      const userId = 'user-1';
      const zeroAmountData = {
        ...mockEntryData,
        lines: [
          { accountId: 'acc_1', debit: 0, credit: 0 }, // Invalid
          { accountId: 'acc_2', debit: 100000, credit: 0 },
          { accountId: 'acc_3', debit: 0, credit: 100000 },
        ],
      };

      // Act & Assert
      await expect(service.createJournalEntry(zeroAmountData, userId)).rejects.toThrow(
        'Must have either debit or credit amount'
      );
    });
  });
});
