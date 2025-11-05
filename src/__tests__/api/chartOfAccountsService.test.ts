/**
 * Unit Tests for Chart of Accounts Service
 * Comprehensive test coverage for accounting functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { ChartOfAccountsService } from '../../api/chartOfAccountsService';
import { db } from '../../firebaseConfig';
import type { ChartOfAccount, AccountType, AccountBalance } from '../../types/accounting';

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
    now: vi.fn(() => ({ toDate: () => new Date() })),
  },
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn(),
  })),
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
    DUPLICATE: 'DUPLICATE',
    FORBIDDEN: 'FORBIDDEN',
    INVALID_OPERATION: 'INVALID_OPERATION',
  },
}));

// ========================================
// TEST DATA
// ========================================

const mockAccount: ChartOfAccount = {
  id: 'acc_123',
  accountNumber: '1001',
  fullAccountNumber: '1001',
  accountName: 'Cash on Hand',
  accountType: 'asset' as AccountType,
  accountSubType: 'cash',
  description: 'Primary cash account',
  currency: 'IDR',
  normalBalance: 'debit',
  level: 0,
  parentAccountId: undefined,
  isControlAccount: false,
  isSystemAccount: false,
  requiresReconciliation: true,
  allowMultiCurrency: false,
  status: 'active',
  currentBalance: 1000000,
  balanceUpdatedAt: new Date(),
  createdAt: new Date(),
  createdBy: 'user-1',
  updatedAt: new Date(),
  updatedBy: 'user-1',
};

const mockAccountData = {
  accountName: 'Petty Cash',
  accountType: 'asset' as AccountType,
  accountSubType: 'cash',
  currency: 'IDR',
  normalBalance: 'debit' as const,
  description: 'Small cash expenses',
};

// ========================================
// TEST SUITES
// ========================================

describe('ChartOfAccountsService', () => {
  let service: ChartOfAccountsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ChartOfAccountsService();

    // Setup default mocks
    mockCollection.mockReturnValue('collection-ref');
    mockDoc.mockReturnValue('doc-ref');
    mockQuery.mockReturnValue('query-ref');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createAccount', () => {
    it('should create an account successfully', async () => {
      // Arrange
      const userId = 'user-1';

      // Mock no existing accounts for number generation
      mockGetDocs.mockResolvedValueOnce({
        empty: true,
        docs: [],
      });

      // Mock account creation
      mockSetDoc.mockResolvedValue(undefined);

      // Mock balance initialization
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockAccount,
      });

      // Act
      const result = await service.createAccount(mockAccountData, userId);

      // Assert
      expect(result.accountName).toBe(mockAccountData.accountName);
      expect(result.accountType).toBe(mockAccountData.accountType);
      expect(result.accountNumber).toBe('1000'); // First asset account
      expect(result.createdBy).toBe(userId);
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should generate sequential account numbers', async () => {
      // Arrange
      const userId = 'user-1';

      // Mock existing account with number 1002
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{
          data: () => ({ accountNumber: '1002' }),
        }],
      });

      mockSetDoc.mockResolvedValue(undefined);
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockAccount,
      });

      // Act
      const result = await service.createAccount(mockAccountData, userId);

      // Assert
      expect(result.accountNumber).toBe('1003'); // Next sequential number
    });

    it('should validate account name', async () => {
      // Arrange
      const userId = 'user-1';
      const invalidData = {
        ...mockAccountData,
        accountName: '', // Invalid empty name
      };

      // Act & Assert
      await expect(service.createAccount(invalidData, userId)).rejects.toThrow();
    });

    it('should prevent duplicate account numbers', async () => {
      // Arrange
      const userId = 'user-1';
      const duplicateData = {
        ...mockAccountData,
        accountNumber: '1001', // Existing number
      };

      // Mock existing account
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{
          data: () => mockAccount,
        }],
      });

      // Act & Assert
      await expect(service.createAccount(duplicateData, userId)).rejects.toThrow('DUPLICATE');
    });

    it('should handle sub-accounts correctly', async () => {
      // Arrange
      const userId = 'user-1';
      const subAccountData = {
        ...mockAccountData,
        parentAccountId: 'acc_123',
        level: 1,
      };

      mockGetDocs.mockResolvedValueOnce({
        empty: true,
        docs: [],
      });
      mockSetDoc.mockResolvedValue(undefined);
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockAccount,
      });

      // Act
      const result = await service.createAccount(subAccountData, userId);

      // Assert
      expect(result.parentAccountId).toBe('acc_123');
      expect(result.level).toBe(1);
      expect(result.fullAccountNumber).toMatch(/^1000-\d{3}$/);
    });
  });

  describe('getAccount', () => {
    it('should retrieve an account successfully', async () => {
      // Arrange
      const accountId = 'acc_123';
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockAccount,
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          balanceUpdatedAt: { toDate: () => new Date() },
        }),
      });

      // Act
      const result = await service.getAccount(accountId);

      // Assert
      expect(result?.id).toBe(accountId);
      expect(result?.accountName).toBe(mockAccount.accountName);
    });

    it('should return null for non-existent account', async () => {
      // Arrange
      const accountId = 'non-existent';
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      // Act
      const result = await service.getAccount(accountId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getAccountByNumber', () => {
    it('should find account by number', async () => {
      // Arrange
      const accountNumber = '1001';
      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [{
          data: () => ({
            ...mockAccount,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            balanceUpdatedAt: { toDate: () => new Date() },
          }),
        }],
      });

      // Act
      const result = await service.getAccountByNumber(accountNumber);

      // Assert
      expect(result?.accountNumber).toBe(accountNumber);
    });

    it('should return null when account not found', async () => {
      // Arrange
      const accountNumber = '9999';
      mockGetDocs.mockResolvedValue({
        empty: true,
        docs: [],
      });

      // Act
      const result = await service.getAccountByNumber(accountNumber);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getAllAccounts', () => {
    it('should retrieve all accounts ordered by number', async () => {
      // Arrange
      const mockAccounts = [
        { ...mockAccount, accountNumber: '2001' },
        { ...mockAccount, accountNumber: '1001' },
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockAccounts.map(account => ({
          data: () => ({
            ...account,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            balanceUpdatedAt: { toDate: () => new Date() },
          }),
        })),
      });

      // Act
      const result = await service.getAllAccounts();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].accountNumber).toBe('2001'); // Should be ordered
      expect(result[1].accountNumber).toBe('1001');
    });
  });

  describe('getAccountsByType', () => {
    it('should filter accounts by type', async () => {
      // Arrange
      const accountType: AccountType = 'asset';
      const mockAssetAccounts = [
        { ...mockAccount, accountType: 'asset' },
        { ...mockAccount, id: 'acc_124', accountType: 'asset' },
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockAssetAccounts.map(account => ({
          data: () => ({
            ...account,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            balanceUpdatedAt: { toDate: () => new Date() },
          }),
        })),
      });

      // Act
      const result = await service.getAccountsByType(accountType);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every(acc => acc.accountType === 'asset')).toBe(true);
    });
  });

  describe('getAccountHierarchy', () => {
    it('should build account hierarchy correctly', async () => {
      // Arrange
      const parentAccount = { ...mockAccount, id: 'parent', isControlAccount: true };
      const childAccount = {
        ...mockAccount,
        id: 'child',
        parentAccountId: 'parent',
        level: 1,
      };

      mockGetDocs.mockResolvedValue({
        docs: [
          {
            data: () => ({
              ...parentAccount,
              createdAt: { toDate: () => new Date() },
              updatedAt: { toDate: () => new Date() },
              balanceUpdatedAt: { toDate: () => new Date() },
            }),
          },
          {
            data: () => ({
              ...childAccount,
              createdAt: { toDate: () => new Date() },
              updatedAt: { toDate: () => new Date() },
              balanceUpdatedAt: { toDate: () => new Date() },
            }),
          },
        ],
      });

      // Act
      const result = await service.getAccountHierarchy();

      // Assert
      expect(result).toHaveLength(1); // One root account
      expect(result[0].id).toBe('parent');
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children![0].id).toBe('child');
      expect(result[0].children![0].depth).toBe(1);
    });
  });

  describe('updateAccount', () => {
    it('should update account successfully', async () => {
      // Arrange
      const accountId = 'acc_123';
      const updates = {
        accountName: 'Updated Account Name',
        description: 'Updated description',
      };
      const userId = 'user-1';

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockAccount,
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          balanceUpdatedAt: { toDate: () => new Date() },
        }),
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      // Act
      const result = await service.updateAccount(accountId, updates, userId);

      // Assert
      expect(result?.accountName).toBe(updates.accountName);
      expect(result?.description).toBe(updates.description);
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('should prevent updating system accounts', async () => {
      // Arrange
      const accountId = 'acc_123';
      const updates = { accountName: 'New Name' };
      const userId = 'user-1';
      const systemAccount = { ...mockAccount, isSystemAccount: true };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...systemAccount,
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          balanceUpdatedAt: { toDate: () => new Date() },
        }),
      });

      // Act & Assert
      await expect(service.updateAccount(accountId, updates, userId)).rejects.toThrow('FORBIDDEN');
    });
  });

  describe('deleteAccount', () => {
    it('should delete account successfully', async () => {
      // Arrange
      const accountId = 'acc_123';
      const userId = 'user-1';

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockAccount,
          currentBalance: 0, // Zero balance
          isControlAccount: false, // No children
          isSystemAccount: false,
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          balanceUpdatedAt: { toDate: () => new Date() },
        }),
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      // Act
      const result = await service.deleteAccount(accountId, userId);

      // Assert
      expect(result).toBe(true);
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ status: 'archived' })
      );
    });

    it('should prevent deleting accounts with balance', async () => {
      // Arrange
      const accountId = 'acc_123';
      const userId = 'user-1';

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockAccount,
          currentBalance: 50000, // Non-zero balance
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          balanceUpdatedAt: { toDate: () => new Date() },
        }),
      });

      // Act & Assert
      await expect(service.deleteAccount(accountId, userId)).rejects.toThrow('INVALID_OPERATION');
    });

    it('should prevent deleting control accounts', async () => {
      // Arrange
      const accountId = 'acc_123';
      const userId = 'user-1';

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockAccount,
          currentBalance: 0,
          isControlAccount: true, // Has children
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          balanceUpdatedAt: { toDate: () => new Date() },
        }),
      });

      // Act & Assert
      await expect(service.deleteAccount(accountId, userId)).rejects.toThrow('INVALID_OPERATION');
    });
  });

  describe('getAccountBalance', () => {
    it('should retrieve account balance', async () => {
      // Arrange
      const accountId = 'acc_123';
      const mockBalance: AccountBalance = {
        accountId: 'acc_123',
        accountNumber: '1001',
        accountName: 'Cash on Hand',
        currency: 'IDR',
        debitBalance: 1000000,
        creditBalance: 0,
        netBalance: 1000000,
        transactionCount: 5,
        lastTransaction: new Date(),
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockBalance,
          lastTransaction: { toDate: () => new Date() },
        }),
      });

      // Act
      const result = await service.getAccountBalance(accountId);

      // Assert
      expect(result?.netBalance).toBe(1000000);
      expect(result?.transactionCount).toBe(5);
    });

    it('should return null for accounts without balance records', async () => {
      // Arrange
      const accountId = 'acc_123';
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      // Act
      const result = await service.getAccountBalance(accountId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateAccountBalance', () => {
    it('should update balance for debit normal accounts', async () => {
      // Arrange
      const accountId = 'acc_123';
      const debitAmount = 50000;
      const creditAmount = 10000;

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockAccount,
          normalBalance: 'debit',
          currentBalance: 1000000,
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          balanceUpdatedAt: { toDate: () => new Date() },
        }),
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      // Act
      await service.updateAccountBalance(accountId, debitAmount, creditAmount);

      // Assert
      // New balance = 1000000 + (50000 - 10000) = 1040000
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          currentBalance: 1040000,
        })
      );
    });

    it('should update balance for credit normal accounts', async () => {
      // Arrange
      const accountId = 'acc_123';
      const debitAmount = 10000;
      const creditAmount = 50000;
      const liabilityAccount = { ...mockAccount, normalBalance: 'credit' };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...liabilityAccount,
          currentBalance: 500000,
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          balanceUpdatedAt: { toDate: () => new Date() },
        }),
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      // Act
      await service.updateAccountBalance(accountId, debitAmount, creditAmount);

      // Assert
      // New balance = 500000 + (50000 - 10000) = 540000
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          currentBalance: 540000,
        })
      );
    });
  });

  describe('searchAccounts', () => {
    it('should search by account name', async () => {
      // Arrange
      const searchTerm = 'cash';
      const mockAccounts = [
        { ...mockAccount, accountName: 'Cash on Hand' },
        { ...mockAccount, id: 'acc_124', accountName: 'Petty Cash' },
        { ...mockAccount, id: 'acc_125', accountName: 'Accounts Receivable' },
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockAccounts.map(account => ({
          data: () => ({
            ...account,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            balanceUpdatedAt: { toDate: () => new Date() },
          }),
        })),
      });

      // Act
      const result = await service.searchAccounts(searchTerm);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every(acc => acc.accountName.toLowerCase().includes('cash'))).toBe(true);
    });

    it('should search by account number', async () => {
      // Arrange
      const searchTerm = '100';
      const mockAccounts = [
        { ...mockAccount, accountNumber: '1001' },
        { ...mockAccount, id: 'acc_124', accountNumber: '2001' },
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockAccounts.map(account => ({
          data: () => ({
            ...account,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            balanceUpdatedAt: { toDate: () => new Date() },
          }),
        })),
      });

      // Act
      const result = await service.searchAccounts(searchTerm);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].accountNumber).toBe('1001');
    });
  });

  // ========================================
  // ERROR HANDLING TESTS
  // ========================================

  describe('Error Handling', () => {
    it('should handle Firebase errors gracefully', async () => {
      // Arrange
      const accountId = 'acc_123';
      const firebaseError = new Error('Firebase connection failed');
      mockGetDoc.mockRejectedValue(firebaseError);

      // Act
      const result = await service.getAccount(accountId);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle account number exhaustion', async () => {
      // Arrange
      const userId = 'user-1';
      const accountData = { ...mockAccountData, accountType: 'asset' };

      // Mock account with max number
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{
          data: () => ({ accountNumber: '1999' }), // Max asset number
        }],
      });

      // Act & Assert
      await expect(service.createAccount(accountData, userId)).rejects.toThrow('No more account numbers');
    });

    it('should validate input parameters', async () => {
      // Arrange
      const invalidData = {
        accountName: 'A'.repeat(200), // Too long
        accountType: 'invalid' as AccountType,
      };
      const userId = 'user-1';

      // Act & Assert
      await expect(service.createAccount(invalidData as any, userId)).rejects.toThrow();
    });
  });

  // ========================================
  // EDGE CASES
  // ========================================

  describe('Edge Cases', () => {
    it('should handle accounts with special characters in names', async () => {
      // Arrange
      const userId = 'user-1';
      const specialNameData = {
        ...mockAccountData,
        accountName: 'Cash & Petty Cash (USD)',
      };

      mockGetDocs.mockResolvedValueOnce({
        empty: true,
        docs: [],
      });
      mockSetDoc.mockResolvedValue(undefined);
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockAccount,
      });

      // Act
      const result = await service.createAccount(specialNameData, userId);

      // Assert
      expect(result.accountName).toBe(specialNameData.accountName);
    });

    it('should handle multi-currency accounts', async () => {
      // Arrange
      const userId = 'user-1';
      const multiCurrencyData = {
        ...mockAccountData,
        allowMultiCurrency: true,
        currency: 'USD',
      };

      mockGetDocs.mockResolvedValueOnce({
        empty: true,
        docs: [],
      });
      mockSetDoc.mockResolvedValue(undefined);
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockAccount,
      });

      // Act
      const result = await service.createAccount(multiCurrencyData, userId);

      // Assert
      expect(result.allowMultiCurrency).toBe(true);
      expect(result.currency).toBe('USD');
    });

    it('should handle reconciliation-required accounts', async () => {
      // Arrange
      const userId = 'user-1';
      const reconciliationData = {
        ...mockAccountData,
        requiresReconciliation: true,
        accountSubType: 'bank',
      };

      mockGetDocs.mockResolvedValueOnce({
        empty: true,
        docs: [],
      });
      mockSetDoc.mockResolvedValue(undefined);
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockAccount,
      });

      // Act
      const result = await service.createAccount(reconciliationData, userId);

      // Assert
      expect(result.requiresReconciliation).toBe(true);
      expect(result.accountSubType).toBe('bank');
    });
  });
});
