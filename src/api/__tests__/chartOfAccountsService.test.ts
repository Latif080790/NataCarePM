/**
 * Tests for Chart of Accounts Service
 *
 * Tests comprehensive accounting functionality including:
 * - Account number generation
 * - Account CRUD operations
 * - Account hierarchy management
 * - Balance tracking
 * - Validation and business rules
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChartOfAccountsService } from '../chartOfAccountsService';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
} from 'firebase/firestore';
import type { ChartOfAccount, AccountType, AccountBalance } from '@/types/accounting';

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
    debug: vi.fn(),
  })),
}));

vi.mock('@/utils/validators', () => ({
  validators: {
    isValidString: vi.fn((str: string) => ({ valid: str.length >= 1 && str.length <= 100 })),
  },
}));

describe('chartOfAccountsService', () => {
  let service: ChartOfAccountsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ChartOfAccountsService();
  });

  describe('Account Number Generation', () => {
    it('should generate first account number for asset type', async () => {
      const mockSnapshot = {
        empty: true,
        docs: [],
      };

      vi.mocked(collection).mockReturnValue('chart_of_accounts' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      // Need to test through createAccount since generateAccountNumber is private
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await service.createAccount(
        {
          accountName: 'Cash',
          accountType: 'asset',
          accountSubType: 'current_asset',
          currency: 'IDR',
          normalBalance: 'debit',
          status: 'active',
        } as any,
        'user_123'
      );

      expect(result.accountNumber).toBe('1000');
    });

    it('should generate next account number based on last account', async () => {
      const mockSnapshot = {
        empty: false,
        docs: [
          {
            data: () => ({
              accountNumber: '1005',
              accountType: 'asset',
            }),
          },
        ],
      };

      vi.mocked(collection).mockReturnValue('chart_of_accounts' as any);
      vi.mocked(query).mockReturnValue({} as any);
      
      // First getDocs: generate account number
      // Second getDocs: getAccountByNumber check (no match)
      let getDocsCallCount = 0;
      vi.mocked(getDocs).mockImplementation(() => {
        getDocsCallCount++;
        if (getDocsCallCount === 1) {
          return Promise.resolve(mockSnapshot as any);
        }
        // Second call: getAccountByNumber - no duplicate
        return Promise.resolve({ empty: true, docs: [] } as any);
      });

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await service.createAccount(
        {
          accountName: 'Bank Account',
          accountType: 'asset',
          accountSubType: 'current_asset',
          currency: 'IDR',
          normalBalance: 'debit',
          status: 'active',
        } as any,
        'user_123'
      );

      expect(result.accountNumber).toBe('1006');
    });

    it('should use different ranges for different account types', async () => {
      const mockSnapshot = {
        empty: true,
        docs: [],
      };

      vi.mocked(collection).mockReturnValue('chart_of_accounts' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      // Test liability (2000-2999)
      const liability = await service.createAccount(
        {
          accountName: 'Accounts Payable',
          accountType: 'liability',
          accountSubType: 'current_liability',
          currency: 'IDR',
          normalBalance: 'credit',
          status: 'active',
        } as any,
        'user_123'
      );

      expect(liability.accountNumber).toBe('2000');

      // Test revenue (4000-4999)
      const revenue = await service.createAccount(
        {
          accountName: 'Sales Revenue',
          accountType: 'revenue',
          accountSubType: 'operating_revenue',
          currency: 'IDR',
          normalBalance: 'credit',
          status: 'active',
        } as any,
        'user_123'
      );

      expect(revenue.accountNumber).toBe('4000');
    });
  });

  describe('createAccount', () => {
    it('should create account successfully with all fields', async () => {
      const accountData = {
        accountName: 'Cash on Hand',
        accountType: 'asset' as AccountType,
        accountSubType: 'current_asset',
        currency: 'IDR',
        normalBalance: 'debit' as const,
        status: 'active' as const,
        description: 'Cash at office',
      };

      const mockSnapshot = {
        empty: true,
        docs: [],
      };

      vi.mocked(collection).mockReturnValue('chart_of_accounts' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await service.createAccount(accountData as any, 'user_123');

      expect(result.id).toContain('acc_');
      expect(result.accountName).toBe('Cash on Hand');
      expect(result.accountType).toBe('asset');
      expect(result.accountNumber).toBe('1000');
      expect(result.currentBalance).toBe(0);
      expect(result.isControlAccount).toBe(false);
      expect(result.isSystemAccount).toBe(false);
      expect(result.createdBy).toBe('user_123');
      expect(setDoc).toHaveBeenCalledTimes(2); // Account + balance
    });

    it('should create sub-account with parent reference', async () => {
      const parentAccount: ChartOfAccount = {
        id: 'acc_parent',
        accountNumber: '1000',
        fullAccountNumber: '1000',
        accountName: 'Cash',
        accountType: 'asset',
        accountSubType: 'current_asset',
        currency: 'IDR',
        normalBalance: 'debit',
        level: 0,
        currentBalance: 0,
        balanceUpdatedAt: new Date(),
        isControlAccount: false,
        isSystemAccount: false,
        requiresReconciliation: false,
        allowMultiCurrency: false,
        status: 'active',
        createdAt: new Date(),
        createdBy: 'user_123',
        updatedAt: new Date(),
        updatedBy: 'user_123',
      };

      const mockSnapshot = {
        empty: false,
        docs: [
          {
            data: () => ({
              accountNumber: '1000',
              accountType: 'asset',
            }),
          },
        ],
      };

      vi.mocked(collection).mockReturnValue('chart_of_accounts' as any);
      vi.mocked(query).mockReturnValue({} as any);
      
      // First getDocs: generateAccountNumber
      // Second getDocs: getAccountByNumber (no duplicate)
      let getDocsCallCount = 0;
      vi.mocked(getDocs).mockImplementation(() => {
        getDocsCallCount++;
        if (getDocsCallCount === 1) {
          return Promise.resolve(mockSnapshot as any);
        }
        // No duplicate found
        return Promise.resolve({ empty: true, docs: [] } as any);
      });

      // getAccount for parent account
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => parentAccount,
      } as any);

      vi.mocked(setDoc).mockResolvedValue(undefined);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await service.createAccount(
        {
          accountName: 'Cash - Petty Cash',
          accountType: 'asset',
          accountSubType: 'current_asset',
          currency: 'IDR',
          normalBalance: 'debit',
          status: 'active',
          parentAccountId: 'acc_parent',
        } as any,
        'user_123'
      );

      expect(result.parentAccountId).toBe('acc_parent');
      expect(updateDoc).toHaveBeenCalled(); // Update parent to control account
    });

    it('should reject invalid account name', async () => {
      await expect(
        service.createAccount(
          {
            accountName: '', // Empty name
            accountType: 'asset',
            currency: 'IDR',
            normalBalance: 'debit',
          } as any,
          'user_123'
        )
      ).rejects.toThrow();
    });

    it('should reject duplicate account number', async () => {
      vi.mocked(collection).mockReturnValue('chart_of_accounts' as any);
      vi.mocked(query).mockReturnValue({} as any);
      
      // getAccountByNumber finds duplicate (accountNumber provided, so no generation)
      vi.mocked(getDocs).mockResolvedValue({
        empty: false,
        docs: [
          {
            data: () => ({
              accountNumber: '1000',
              accountName: 'Existing Account',
              createdAt: { toDate: () => new Date() },
              updatedAt: { toDate: () => new Date() },
              balanceUpdatedAt: { toDate: () => new Date() },
            }),
          },
        ],
      } as any);

      await expect(
        service.createAccount(
          {
            accountName: 'Duplicate Account',
            accountType: 'asset',
            currency: 'IDR',
            normalBalance: 'debit',
            accountNumber: '1000', // Explicitly provided, skips generation
          } as any,
          'user_123'
        )
      ).rejects.toThrow('already exists');
    });
  });

  describe('getAccount', () => {
    it('should get account by ID successfully', async () => {
      const mockAccount: ChartOfAccount = {
        id: 'acc_123',
        accountNumber: '1000',
        fullAccountNumber: '1000',
        accountName: 'Cash',
        accountType: 'asset',
        accountSubType: 'current_asset',
        currency: 'IDR',
        normalBalance: 'debit',
        level: 0,
        currentBalance: 1000000,
        balanceUpdatedAt: new Date(),
        isControlAccount: false,
        isSystemAccount: false,
        requiresReconciliation: false,
        allowMultiCurrency: false,
        status: 'active',
        createdAt: new Date(),
        createdBy: 'user_123',
        updatedAt: new Date(),
        updatedBy: 'user_123',
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockAccount,
          createdAt: { toDate: () => mockAccount.createdAt },
          updatedAt: { toDate: () => mockAccount.updatedAt },
          balanceUpdatedAt: { toDate: () => mockAccount.balanceUpdatedAt },
        }),
      } as any);

      const result = await service.getAccount('acc_123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('acc_123');
      expect(result?.accountName).toBe('Cash');
      expect(result?.currentBalance).toBe(1000000);
    });

    it('should return null for non-existent account', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await service.getAccount('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getAccountByNumber', () => {
    it('should get account by account number', async () => {
      const mockAccount: ChartOfAccount = {
        id: 'acc_123',
        accountNumber: '1000',
        fullAccountNumber: '1000',
        accountName: 'Cash',
        accountType: 'asset',
        accountSubType: 'current_asset',
        currency: 'IDR',
        normalBalance: 'debit',
        level: 0,
        currentBalance: 0,
        balanceUpdatedAt: new Date(),
        isControlAccount: false,
        isSystemAccount: false,
        requiresReconciliation: false,
        allowMultiCurrency: false,
        status: 'active',
        createdAt: new Date(),
        createdBy: 'user_123',
        updatedAt: new Date(),
        updatedBy: 'user_123',
      };

      vi.mocked(collection).mockReturnValue('chart_of_accounts' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        empty: false,
        docs: [
          {
            data: () => ({
              ...mockAccount,
              createdAt: { toDate: () => mockAccount.createdAt },
              updatedAt: { toDate: () => mockAccount.updatedAt },
              balanceUpdatedAt: { toDate: () => mockAccount.balanceUpdatedAt },
            }),
          },
        ],
      } as any);

      const result = await service.getAccountByNumber('1000');

      expect(result).not.toBeNull();
      expect(result?.accountNumber).toBe('1000');
    });

    it('should return null when account number not found', async () => {
      vi.mocked(collection).mockReturnValue('chart_of_accounts' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        empty: true,
        docs: [],
      } as any);

      const result = await service.getAccountByNumber('9999');

      expect(result).toBeNull();
    });
  });

  describe('getAllAccounts', () => {
    it('should get all accounts sorted by account number', async () => {
      const mockAccounts = [
        { id: 'acc_1', accountNumber: '1000', accountName: 'Cash' },
        { id: 'acc_2', accountNumber: '2000', accountName: 'Accounts Payable' },
        { id: 'acc_3', accountNumber: '4000', accountName: 'Revenue' },
      ];

      vi.mocked(collection).mockReturnValue('chart_of_accounts' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockAccounts.map((acc) => ({
          data: () => ({
            ...acc,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            balanceUpdatedAt: { toDate: () => new Date() },
          }),
        })),
      } as any);

      const result = await service.getAllAccounts();

      expect(result).toHaveLength(3);
      expect(result[0].accountNumber).toBe('1000');
      expect(result[2].accountNumber).toBe('4000');
    });

    it('should return empty array on error', async () => {
      vi.mocked(collection).mockReturnValue('chart_of_accounts' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockRejectedValue(new Error('Firestore error'));

      const result = await service.getAllAccounts();

      expect(result).toEqual([]);
    });
  });

  describe('getAccountsByType', () => {
    it('should get accounts filtered by type', async () => {
      const mockAssets = [
        { id: 'acc_1', accountNumber: '1000', accountName: 'Cash', accountType: 'asset' },
        { id: 'acc_2', accountNumber: '1100', accountName: 'Bank', accountType: 'asset' },
      ];

      vi.mocked(collection).mockReturnValue('chart_of_accounts' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockAssets.map((acc) => ({
          data: () => ({
            ...acc,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            balanceUpdatedAt: { toDate: () => new Date() },
          }),
        })),
      } as any);

      const result = await service.getAccountsByType('asset');

      expect(result).toHaveLength(2);
      expect(result.every((acc) => acc.accountType === 'asset')).toBe(true);
    });

    it('should return empty array when no accounts of type exist', async () => {
      vi.mocked(collection).mockReturnValue('chart_of_accounts' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: [],
      } as any);

      const result = await service.getAccountsByType('equity');

      expect(result).toEqual([]);
    });
  });

  describe('getAccountHierarchy', () => {
    it('should build account tree with parent-child relationships', async () => {
      const mockAccounts = [
        {
          id: 'acc_parent',
          accountNumber: '1000',
          accountName: 'Cash',
          parentAccountId: undefined,
          level: 0,
        },
        {
          id: 'acc_child1',
          accountNumber: '1001',
          accountName: 'Cash - Office',
          parentAccountId: 'acc_parent',
          level: 1,
        },
        {
          id: 'acc_child2',
          accountNumber: '1002',
          accountName: 'Cash - Petty',
          parentAccountId: 'acc_parent',
          level: 1,
        },
      ];

      vi.mocked(collection).mockReturnValue('chart_of_accounts' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockAccounts.map((acc) => ({
          data: () => ({
            ...acc,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            balanceUpdatedAt: { toDate: () => new Date() },
          }),
        })),
      } as any);

      const result = await service.getAccountHierarchy();

      expect(result).toHaveLength(1); // Only root account
      expect(result[0].id).toBe('acc_parent');
      expect(result[0].children).toHaveLength(2); // Two child accounts
      expect(result[0].children![0].depth).toBe(1);
    });

    it('should handle multiple root accounts', async () => {
      const mockAccounts = [
        { id: 'acc_1', accountNumber: '1000', accountName: 'Cash', parentAccountId: undefined },
        { id: 'acc_2', accountNumber: '2000', accountName: 'Liabilities', parentAccountId: undefined },
      ];

      vi.mocked(collection).mockReturnValue('chart_of_accounts' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockAccounts.map((acc) => ({
          data: () => ({
            ...acc,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            balanceUpdatedAt: { toDate: () => new Date() },
          }),
        })),
      } as any);

      const result = await service.getAccountHierarchy();

      expect(result).toHaveLength(2);
    });
  });

  describe('updateAccount', () => {
    it('should update account successfully', async () => {
      const existingAccount: ChartOfAccount = {
        id: 'acc_123',
        accountNumber: '1000',
        fullAccountNumber: '1000',
        accountName: 'Cash',
        accountType: 'asset',
        accountSubType: 'current_asset',
        currency: 'IDR',
        normalBalance: 'debit',
        level: 0,
        currentBalance: 0,
        balanceUpdatedAt: new Date(),
        isControlAccount: false,
        isSystemAccount: false,
        requiresReconciliation: false,
        allowMultiCurrency: false,
        status: 'active',
        createdAt: new Date(),
        createdBy: 'user_123',
        updatedAt: new Date(),
        updatedBy: 'user_123',
      };

      let getAccountCallCount = 0;
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockImplementation(() => {
        getAccountCallCount++;
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            ...existingAccount,
            accountName: getAccountCallCount === 1 ? 'Cash' : 'Updated Cash', // Second call after update
            createdAt: { toDate: () => existingAccount.createdAt },
            updatedAt: { toDate: () => existingAccount.updatedAt },
            balanceUpdatedAt: { toDate: () => existingAccount.balanceUpdatedAt },
          }),
        } as any);
      });

      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await service.updateAccount(
        'acc_123',
        { accountName: 'Updated Cash', description: 'Main cash account' },
        'user_456'
      );

      expect(updateDoc).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalled(); // Audit trail
      expect(result?.accountName).toBe('Updated Cash');
    });

    it('should throw error for non-existent account', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      await expect(service.updateAccount('nonexistent', { accountName: 'Test' }, 'user_123')).rejects.toThrow(
        'not found'
      );
    });

    it('should prevent updating system accounts', async () => {
      const systemAccount: ChartOfAccount = {
        id: 'acc_system',
        accountNumber: '1000',
        fullAccountNumber: '1000',
        accountName: 'System Cash',
        accountType: 'asset',
        accountSubType: 'current_asset',
        currency: 'IDR',
        normalBalance: 'debit',
        level: 0,
        currentBalance: 0,
        balanceUpdatedAt: new Date(),
        isControlAccount: false,
        isSystemAccount: true, // System account
        requiresReconciliation: false,
        allowMultiCurrency: false,
        status: 'active',
        createdAt: new Date(),
        createdBy: 'system',
        updatedAt: new Date(),
        updatedBy: 'system',
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...systemAccount,
          createdAt: { toDate: () => systemAccount.createdAt },
          updatedAt: { toDate: () => systemAccount.updatedAt },
          balanceUpdatedAt: { toDate: () => systemAccount.balanceUpdatedAt },
        }),
      } as any);

      await expect(service.updateAccount('acc_system', { accountName: 'Modified' }, 'user_123')).rejects.toThrow(
        'Cannot modify system accounts'
      );
    });
  });

  describe('deleteAccount', () => {
    it('should soft delete account (archive)', async () => {
      const account: ChartOfAccount = {
        id: 'acc_123',
        accountNumber: '1000',
        fullAccountNumber: '1000',
        accountName: 'Cash',
        accountType: 'asset',
        accountSubType: 'current_asset',
        currency: 'IDR',
        normalBalance: 'debit',
        level: 0,
        currentBalance: 0, // Zero balance
        balanceUpdatedAt: new Date(),
        isControlAccount: false, // No children
        isSystemAccount: false,
        requiresReconciliation: false,
        allowMultiCurrency: false,
        status: 'active',
        createdAt: new Date(),
        createdBy: 'user_123',
        updatedAt: new Date(),
        updatedBy: 'user_123',
      };

      let getAccountCallCount = 0;
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockImplementation(() => {
        getAccountCallCount++;
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            ...account,
            status: getAccountCallCount === 1 ? 'active' : 'archived',
            createdAt: { toDate: () => account.createdAt },
            updatedAt: { toDate: () => account.updatedAt },
            balanceUpdatedAt: { toDate: () => account.balanceUpdatedAt },
          }),
        } as any);
      });

      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await service.deleteAccount('acc_123', 'user_456');

      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should prevent deleting system accounts', async () => {
      const systemAccount: ChartOfAccount = {
        id: 'acc_system',
        accountNumber: '1000',
        fullAccountNumber: '1000',
        accountName: 'System Cash',
        accountType: 'asset',
        accountSubType: 'current_asset',
        currency: 'IDR',
        normalBalance: 'debit',
        level: 0,
        currentBalance: 0,
        balanceUpdatedAt: new Date(),
        isControlAccount: false,
        isSystemAccount: true,
        requiresReconciliation: false,
        allowMultiCurrency: false,
        status: 'active',
        createdAt: new Date(),
        createdBy: 'system',
        updatedAt: new Date(),
        updatedBy: 'system',
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...systemAccount,
          createdAt: { toDate: () => systemAccount.createdAt },
          updatedAt: { toDate: () => systemAccount.updatedAt },
          balanceUpdatedAt: { toDate: () => systemAccount.balanceUpdatedAt },
        }),
      } as any);

      await expect(service.deleteAccount('acc_system', 'user_123')).rejects.toThrow(
        'Cannot delete system accounts'
      );
    });

    it('should prevent deleting accounts with non-zero balance', async () => {
      const accountWithBalance: ChartOfAccount = {
        id: 'acc_123',
        accountNumber: '1000',
        fullAccountNumber: '1000',
        accountName: 'Cash',
        accountType: 'asset',
        accountSubType: 'current_asset',
        currency: 'IDR',
        normalBalance: 'debit',
        level: 0,
        currentBalance: 5000000, // Non-zero balance
        balanceUpdatedAt: new Date(),
        isControlAccount: false,
        isSystemAccount: false,
        requiresReconciliation: false,
        allowMultiCurrency: false,
        status: 'active',
        createdAt: new Date(),
        createdBy: 'user_123',
        updatedAt: new Date(),
        updatedBy: 'user_123',
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...accountWithBalance,
          createdAt: { toDate: () => accountWithBalance.createdAt },
          updatedAt: { toDate: () => accountWithBalance.updatedAt },
          balanceUpdatedAt: { toDate: () => accountWithBalance.balanceUpdatedAt },
        }),
      } as any);

      await expect(service.deleteAccount('acc_123', 'user_123')).rejects.toThrow('non-zero balance');
    });

    it('should prevent deleting control accounts with children', async () => {
      const controlAccount: ChartOfAccount = {
        id: 'acc_parent',
        accountNumber: '1000',
        fullAccountNumber: '1000',
        accountName: 'Cash',
        accountType: 'asset',
        accountSubType: 'current_asset',
        currency: 'IDR',
        normalBalance: 'debit',
        level: 0,
        currentBalance: 0,
        balanceUpdatedAt: new Date(),
        isControlAccount: true, // Has children
        isSystemAccount: false,
        requiresReconciliation: false,
        allowMultiCurrency: false,
        status: 'active',
        createdAt: new Date(),
        createdBy: 'user_123',
        updatedAt: new Date(),
        updatedBy: 'user_123',
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...controlAccount,
          createdAt: { toDate: () => controlAccount.createdAt },
          updatedAt: { toDate: () => controlAccount.updatedAt },
          balanceUpdatedAt: { toDate: () => controlAccount.balanceUpdatedAt },
        }),
      } as any);

      await expect(service.deleteAccount('acc_parent', 'user_123')).rejects.toThrow('sub-accounts');
    });

    it('should return false for non-existent account', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await service.deleteAccount('nonexistent', 'user_123');

      expect(result).toBe(false);
    });
  });

  describe('getAccountBalance', () => {
    it('should get account balance successfully', async () => {
      const mockBalance: AccountBalance = {
        accountId: 'acc_123',
        accountNumber: '1000',
        accountName: 'Cash',
        currency: 'IDR',
        debitBalance: 10000000,
        creditBalance: 5000000,
        netBalance: 5000000,
        transactionCount: 25,
        lastTransaction: new Date(),
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockBalance,
          lastTransaction: { toDate: () => mockBalance.lastTransaction },
        }),
      } as any);

      const result = await service.getAccountBalance('acc_123');

      expect(result).not.toBeNull();
      expect(result?.accountId).toBe('acc_123');
      expect(result?.netBalance).toBe(5000000);
      expect(result?.transactionCount).toBe(25);
    });

    it('should return null for non-existent balance', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await service.getAccountBalance('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateAccountBalance', () => {
    it('should update debit balance correctly for asset account', async () => {
      const assetAccount: ChartOfAccount = {
        id: 'acc_123',
        accountNumber: '1000',
        fullAccountNumber: '1000',
        accountName: 'Cash',
        accountType: 'asset',
        accountSubType: 'current_asset',
        currency: 'IDR',
        normalBalance: 'debit', // Normal balance
        level: 0,
        currentBalance: 1000000,
        balanceUpdatedAt: new Date(),
        isControlAccount: false,
        isSystemAccount: false,
        requiresReconciliation: false,
        allowMultiCurrency: false,
        status: 'active',
        createdAt: new Date(),
        createdBy: 'user_123',
        updatedAt: new Date(),
        updatedBy: 'user_123',
      };

      const mockBalance: AccountBalance = {
        accountId: 'acc_123',
        accountNumber: '1000',
        accountName: 'Cash',
        currency: 'IDR',
        debitBalance: 1000000,
        creditBalance: 0,
        netBalance: 1000000,
        transactionCount: 1,
      };

      vi.mocked(doc).mockReturnValue({} as any);
      
      let getDocCallCount = 0;
      vi.mocked(getDoc).mockImplementation(() => {
        getDocCallCount++;
        // First call: getAccount
        if (getDocCallCount === 1) {
          return Promise.resolve({
            exists: () => true,
            data: () => ({
              ...assetAccount,
              createdAt: { toDate: () => assetAccount.createdAt },
              updatedAt: { toDate: () => assetAccount.updatedAt },
              balanceUpdatedAt: { toDate: () => assetAccount.balanceUpdatedAt },
            }),
          } as any);
        }
        // Second call: getAccountBalance
        return Promise.resolve({
          exists: () => true,
          data: () => mockBalance,
        } as any);
      });

      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await service.updateAccountBalance('acc_123', 500000, 0);

      expect(updateDoc).toHaveBeenCalledTimes(2); // Account + balance
    });

    it('should update credit balance correctly for liability account', async () => {
      const liabilityAccount: ChartOfAccount = {
        id: 'acc_456',
        accountNumber: '2000',
        fullAccountNumber: '2000',
        accountName: 'Accounts Payable',
        accountType: 'liability',
        accountSubType: 'current_liability',
        currency: 'IDR',
        normalBalance: 'credit', // Normal balance
        level: 0,
        currentBalance: 2000000,
        balanceUpdatedAt: new Date(),
        isControlAccount: false,
        isSystemAccount: false,
        requiresReconciliation: false,
        allowMultiCurrency: false,
        status: 'active',
        createdAt: new Date(),
        createdBy: 'user_123',
        updatedAt: new Date(),
        updatedBy: 'user_123',
      };

      const mockBalance: AccountBalance = {
        accountId: 'acc_456',
        accountNumber: '2000',
        accountName: 'Accounts Payable',
        currency: 'IDR',
        debitBalance: 0,
        creditBalance: 2000000,
        netBalance: 2000000,
        transactionCount: 1,
      };

      vi.mocked(doc).mockReturnValue({} as any);
      
      let getDocCallCount = 0;
      vi.mocked(getDoc).mockImplementation(() => {
        getDocCallCount++;
        // First call: getAccount
        if (getDocCallCount === 1) {
          return Promise.resolve({
            exists: () => true,
            data: () => ({
              ...liabilityAccount,
              createdAt: { toDate: () => liabilityAccount.createdAt },
              updatedAt: { toDate: () => liabilityAccount.updatedAt },
              balanceUpdatedAt: { toDate: () => liabilityAccount.balanceUpdatedAt },
            }),
          } as any);
        }
        // Second call: getAccountBalance
        return Promise.resolve({
          exists: () => true,
          data: () => mockBalance,
        } as any);
      });

      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await service.updateAccountBalance('acc_456', 0, 500000);

      expect(updateDoc).toHaveBeenCalledTimes(2);
    });

    it('should throw error for non-existent account', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      await expect(service.updateAccountBalance('nonexistent', 1000, 0)).rejects.toThrow('not found');
    });
  });

  describe('searchAccounts', () => {
    it('should search accounts by account number', async () => {
      const mockAccounts = [
        {
          id: 'acc_1',
          accountNumber: '1000',
          accountName: 'Cash',
          description: 'Main cash account',
        },
        {
          id: 'acc_2',
          accountNumber: '1001',
          accountName: 'Bank',
          description: 'Bank account',
        },
        {
          id: 'acc_3',
          accountNumber: '2000',
          accountName: 'Payables',
          description: 'Vendor payables',
        },
      ];

      vi.mocked(collection).mockReturnValue('chart_of_accounts' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockAccounts.map((acc) => ({
          data: () => ({
            ...acc,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            balanceUpdatedAt: { toDate: () => new Date() },
          }),
        })),
      } as any);

      const result = await service.searchAccounts('100');

      expect(result).toHaveLength(2); // 1000 and 1001
      expect(result.every((acc) => acc.accountNumber.includes('100'))).toBe(true);
    });

    it('should search accounts by name', async () => {
      const mockAccounts = [
        {
          id: 'acc_1',
          accountNumber: '1000',
          accountName: 'Cash on Hand',
          description: '',
        },
        {
          id: 'acc_2',
          accountNumber: '1001',
          accountName: 'Cash in Bank',
          description: '',
        },
      ];

      vi.mocked(collection).mockReturnValue('chart_of_accounts' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockAccounts.map((acc) => ({
          data: () => ({
            ...acc,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            balanceUpdatedAt: { toDate: () => new Date() },
          }),
        })),
      } as any);

      const result = await service.searchAccounts('cash');

      expect(result).toHaveLength(2);
      expect(result.every((acc) => acc.accountName.toLowerCase().includes('cash'))).toBe(true);
    });

    it('should search accounts by description', async () => {
      const mockAccounts = [
        {
          id: 'acc_1',
          accountNumber: '1000',
          accountName: 'Account A',
          description: 'Main operating account',
        },
        {
          id: 'acc_2',
          accountNumber: '2000',
          accountName: 'Account B',
          description: 'Secondary account',
        },
      ];

      vi.mocked(collection).mockReturnValue('chart_of_accounts' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockAccounts.map((acc) => ({
          data: () => ({
            ...acc,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            balanceUpdatedAt: { toDate: () => new Date() },
          }),
        })),
      } as any);

      const result = await service.searchAccounts('operating');

      expect(result).toHaveLength(1);
      expect(result[0].description).toContain('operating');
    });

    it('should return empty array when no matches found', async () => {
      vi.mocked(collection).mockReturnValue('chart_of_accounts' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: [],
      } as any);

      const result = await service.searchAccounts('nonexistent');

      expect(result).toEqual([]);
    });

    it('should be case-insensitive', async () => {
      const mockAccounts = [
        {
          id: 'acc_1',
          accountNumber: '1000',
          accountName: 'CASH',
          description: '',
        },
      ];

      vi.mocked(collection).mockReturnValue('chart_of_accounts' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockAccounts.map((acc) => ({
          data: () => ({
            ...acc,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            balanceUpdatedAt: { toDate: () => new Date() },
          }),
        })),
      } as any);

      const result = await service.searchAccounts('cash');

      expect(result).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore errors gracefully', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockRejectedValue(new Error('Firestore connection failed'));

      const result = await service.getAccount('acc_123');

      expect(result).toBeNull();
    });

    it('should handle invalid account type in generation', async () => {
      const mockSnapshot = {
        empty: false,
        docs: [
          {
            data: () => ({
              accountNumber: '1999', // Last number in range
              accountType: 'asset',
            }),
          },
        ],
      };

      vi.mocked(collection).mockReturnValue('chart_of_accounts' as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      await expect(
        service.createAccount(
          {
            accountName: 'Test Account',
            accountType: 'asset',
            currency: 'IDR',
            normalBalance: 'debit',
          } as any,
          'user_123'
        )
      ).rejects.toThrow('No more account numbers available');
    });
  });
});
