/**
 * Chart of Accounts Service
 * 
 * Manages the chart of accounts with Firebase Firestore integration
 * Supports:
 * - CRUD operations for accounts
 * - Account hierarchy management
 * - Account balance tracking
 * - Multi-currency accounts
 * 
 * @module api/accountingService
 */

import { db } from '../firebaseConfig';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    writeBatch
} from 'firebase/firestore';

import type {
    ChartOfAccount,
    AccountType,
    AccountSubType,
    AccountStatus,
    AccountBalance,
    AccountHierarchy
} from '../types/accounting';

import { withRetry } from './utils/retryWrapper';
import { APIError, ErrorCodes } from './utils/responseWrapper';
import { createScopedLogger } from './utils/logger';
import { validators } from './utils/validators';

const logger = createScopedLogger('accountingService');

const COLLECTIONS = {
    ACCOUNTS: 'chart_of_accounts',
    BALANCES: 'account_balances',
    AUDIT_TRAIL: 'account_audit_trail'
} as const;

/**
 * Chart of Accounts Service
 */
export class ChartOfAccountsService {
    
    /**
     * Generate next account number for a given type
     */
    private async generateAccountNumber(accountType: AccountType): Promise<string> {
        const ranges: Record<AccountType, {start: number, end: number}> = {
            'asset': { start: 1000, end: 1999 },
            'liability': { start: 2000, end: 2999 },
            'equity': { start: 3000, end: 3999 },
            'revenue': { start: 4000, end: 4999 },
            'expense': { start: 5000, end: 5999 },
            'cost_of_sales': { start: 5000, end: 5099 }
        };
        
        const range = ranges[accountType];
        
        // Get existing accounts in this range
        const accountsRef = collection(db, COLLECTIONS.ACCOUNTS);
        const q = query(
            accountsRef,
            where('accountType', '==', accountType),
            orderBy('accountNumber', 'desc')
        );
        
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            return range.start.toString();
        }
        
        const lastAccount = snapshot.docs[0].data() as ChartOfAccount;
        const lastNumber = parseInt(lastAccount.accountNumber);
        
        if (lastNumber >= range.end) {
            throw new APIError(
                ErrorCodes.INVALID_INPUT,
                `No more account numbers available for type ${accountType}`,
                400
            );
        }
        
        return (lastNumber + 1).toString();
    }
    
    /**
     * Create a new account
     * 
     * @param account - Account data (without id and auto-generated fields)
     * @param userId - User creating the account
     * @returns Created account with generated ID
     * 
     * @example
     * ```typescript
     * const account = await service.createAccount({
     *   accountName: 'Cash on Hand',
     *   accountType: 'asset',
     *   accountSubType: 'cash',
     *   currency: 'IDR',
     *   normalBalance: 'debit',
     *   status: 'active'
     * }, 'user_123');
     * ```
     */
    async createAccount(
        accountData: Omit<ChartOfAccount, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'currentBalance' | 'balanceUpdatedAt'>,
        userId: string
    ): Promise<ChartOfAccount> {
        try {
            // Validation
            if (!validators.isValidString(accountData.accountName, 1, 100).valid) {
                throw new APIError(
                    ErrorCodes.INVALID_INPUT,
                    'Account name must be between 1 and 100 characters',
                    400
                );
            }
            
            // Generate account number if not provided
            const accountNumber = accountData.accountNumber || 
                await this.generateAccountNumber(accountData.accountType);
            
            // Check for duplicate account number
            const existingAccount = await this.getAccountByNumber(accountNumber);
            if (existingAccount) {
                throw new APIError(
                    ErrorCodes.DUPLICATE,
                    `Account number ${accountNumber} already exists`,
                    400
                );
            }
            
            // Generate ID
            const accountId = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const now = new Date();
            
            const account: ChartOfAccount = {
                ...accountData,
                id: accountId,
                accountNumber,
                fullAccountNumber: accountData.parentAccountId 
                    ? `${accountNumber}-${Date.now().toString().slice(-3)}`
                    : accountNumber,
                level: accountData.level || 0,
                currentBalance: 0,
                balanceUpdatedAt: now,
                isControlAccount: false,
                isSystemAccount: false,
                requiresReconciliation: accountData.requiresReconciliation || false,
                allowMultiCurrency: accountData.allowMultiCurrency || false,
                status: accountData.status || 'active',
                createdAt: now,
                createdBy: userId,
                updatedAt: now,
                updatedBy: userId
            };
            
            // Save to Firestore
            const docRef = doc(db, COLLECTIONS.ACCOUNTS, accountId);
            await withRetry(
                () => setDoc(docRef, {
                    ...account,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    balanceUpdatedAt: serverTimestamp()
                }),
                { maxAttempts: 3 }
            );
            
            // If this is a sub-account, update parent to be control account
            if (accountData.parentAccountId) {
                await this.updateParentControlStatus(accountData.parentAccountId);
            }
            
            // Initialize balance record
            await this.initializeBalance(accountId);
            
            // Audit trail
            await this.addAuditEntry(accountId, 'account_created', userId, {
                accountName: account.accountName,
                accountNumber: account.accountNumber
            });
            
            logger.success('createAccount', 'Account created successfully', { 
                accountId, 
                accountNumber 
            });
            
            return account;
            
        } catch (error) {
            logger.error('createAccount', 'Failed to create account', error as Error);
            throw error;
        }
    }
    
    /**
     * Get account by ID
     */
    async getAccount(accountId: string): Promise<ChartOfAccount | null> {
        try {
            const docRef = doc(db, COLLECTIONS.ACCOUNTS, accountId);
            const docSnap = await withRetry(
                () => getDoc(docRef),
                { maxAttempts: 2 }
            );
            
            if (!docSnap.exists()) {
                return null;
            }
            
            const data = docSnap.data();
            return {
                ...data,
                createdAt: data.createdAt?.toDate?.() || new Date(),
                updatedAt: data.updatedAt?.toDate?.() || new Date(),
                balanceUpdatedAt: data.balanceUpdatedAt?.toDate?.() || new Date()
            } as ChartOfAccount;
            
        } catch (error) {
            logger.error('getAccount', 'Failed to get account', error as Error, { accountId });
            return null;
        }
    }
    
    /**
     * Get account by account number
     */
    async getAccountByNumber(accountNumber: string): Promise<ChartOfAccount | null> {
        try {
            const q = query(
                collection(db, COLLECTIONS.ACCOUNTS),
                where('accountNumber', '==', accountNumber)
            );
            
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                return null;
            }
            
            const data = snapshot.docs[0].data();
            return {
                ...data,
                createdAt: data.createdAt?.toDate?.() || new Date(),
                updatedAt: data.updatedAt?.toDate?.() || new Date(),
                balanceUpdatedAt: data.balanceUpdatedAt?.toDate?.() || new Date()
            } as ChartOfAccount;
            
        } catch (error) {
            logger.error('getAccountByNumber', 'Failed to get account', error as Error, { accountNumber });
            return null;
        }
    }
    
    /**
     * Get all accounts
     */
    async getAllAccounts(): Promise<ChartOfAccount[]> {
        try {
            const q = query(
                collection(db, COLLECTIONS.ACCOUNTS),
                orderBy('accountNumber', 'asc')
            );
            
            const snapshot = await getDocs(q);
            
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    createdAt: data.createdAt?.toDate?.() || new Date(),
                    updatedAt: data.updatedAt?.toDate?.() || new Date(),
                    balanceUpdatedAt: data.balanceUpdatedAt?.toDate?.() || new Date()
                } as ChartOfAccount;
            });
            
        } catch (error) {
            logger.error('getAllAccounts', 'Failed to get accounts', error as Error);
            return [];
        }
    }
    
    /**
     * Get accounts by type
     */
    async getAccountsByType(accountType: AccountType): Promise<ChartOfAccount[]> {
        try {
            const q = query(
                collection(db, COLLECTIONS.ACCOUNTS),
                where('accountType', '==', accountType),
                orderBy('accountNumber', 'asc')
            );
            
            const snapshot = await getDocs(q);
            
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    createdAt: data.createdAt?.toDate?.() || new Date(),
                    updatedAt: data.updatedAt?.toDate?.() || new Date(),
                    balanceUpdatedAt: data.balanceUpdatedAt?.toDate?.() || new Date()
                } as ChartOfAccount;
            });
            
        } catch (error) {
            logger.error('getAccountsByType', 'Failed to get accounts by type', error as Error, { accountType });
            return [];
        }
    }
    
    /**
     * Get account hierarchy (tree structure)
     */
    async getAccountHierarchy(): Promise<AccountHierarchy[]> {
        try {
            const allAccounts = await this.getAllAccounts();
            
            // Build tree structure
            const accountMap = new Map<string, AccountHierarchy>();
            const rootAccounts: AccountHierarchy[] = [];
            
            // First pass: Create map
            allAccounts.forEach(account => {
                accountMap.set(account.id, {
                    ...account,
                    children: [],
                    depth: 0
                });
            });
            
            // Second pass: Build hierarchy
            allAccounts.forEach(account => {
                const hierarchyAccount = accountMap.get(account.id)!;
                
                if (account.parentAccountId) {
                    const parent = accountMap.get(account.parentAccountId);
                    if (parent) {
                        hierarchyAccount.depth = parent.depth + 1;
                        parent.children!.push(hierarchyAccount);
                    }
                } else {
                    rootAccounts.push(hierarchyAccount);
                }
            });
            
            return rootAccounts;
            
        } catch (error) {
            logger.error('getAccountHierarchy', 'Failed to build hierarchy', error as Error);
            return [];
        }
    }
    
    /**
     * Update account
     */
    async updateAccount(
        accountId: string,
        updates: Partial<ChartOfAccount>,
        userId: string
    ): Promise<ChartOfAccount | null> {
        try {
            const existing = await this.getAccount(accountId);
            if (!existing) {
                throw new APIError(
                    ErrorCodes.NOT_FOUND,
                    `Account ${accountId} not found`,
                    404
                );
            }
            
            // Prevent updating system accounts
            if (existing.isSystemAccount && !updates.isSystemAccount) {
                throw new APIError(
                    ErrorCodes.FORBIDDEN,
                    'Cannot modify system accounts',
                    403
                );
            }
            
            const docRef = doc(db, COLLECTIONS.ACCOUNTS, accountId);
            await withRetry(
                () => updateDoc(docRef, {
                    ...updates,
                    updatedAt: serverTimestamp(),
                    updatedBy: userId
                }),
                { maxAttempts: 3 }
            );
            
            // Audit trail
            await this.addAuditEntry(accountId, 'account_updated', userId, { updates });
            
            logger.success('updateAccount', 'Account updated successfully', { accountId });
            
            return this.getAccount(accountId);
            
        } catch (error) {
            logger.error('updateAccount', 'Failed to update account', error as Error, { accountId });
            throw error;
        }
    }
    
    /**
     * Delete account (soft delete by setting status to archived)
     */
    async deleteAccount(accountId: string, userId: string): Promise<boolean> {
        try {
            const account = await this.getAccount(accountId);
            if (!account) {
                return false;
            }
            
            // Check if account is system account
            if (account.isSystemAccount) {
                throw new APIError(
                    ErrorCodes.FORBIDDEN,
                    'Cannot delete system accounts',
                    403
                );
            }
            
            // Check if account has balance
            if (account.currentBalance !== 0) {
                throw new APIError(
                    ErrorCodes.INVALID_OPERATION,
                    'Cannot delete account with non-zero balance',
                    400
                );
            }
            
            // Check if account has children
            if (account.isControlAccount) {
                throw new APIError(
                    ErrorCodes.INVALID_OPERATION,
                    'Cannot delete account with sub-accounts',
                    400
                );
            }
            
            // Soft delete
            await this.updateAccount(accountId, { status: 'archived' }, userId);
            
            // Audit trail
            await this.addAuditEntry(accountId, 'account_deleted', userId, {
                accountName: account.accountName
            });
            
            logger.success('deleteAccount', 'Account deleted successfully', { accountId });
            
            return true;
            
        } catch (error) {
            logger.error('deleteAccount', 'Failed to delete account', error as Error, { accountId });
            throw error;
        }
    }
    
    /**
     * Get account balance
     */
    async getAccountBalance(accountId: string): Promise<AccountBalance | null> {
        try {
            const balanceRef = doc(db, COLLECTIONS.BALANCES, accountId);
            const balanceSnap = await getDoc(balanceRef);
            
            if (!balanceSnap.exists()) {
                return null;
            }
            
            const data = balanceSnap.data();
            return {
                ...data,
                lastTransaction: data.lastTransaction?.toDate?.()
            } as AccountBalance;
            
        } catch (error) {
            logger.error('getAccountBalance', 'Failed to get balance', error as Error, { accountId });
            return null;
        }
    }
    
    /**
     * Update account balance (called by journal entry posting)
     */
    async updateAccountBalance(
        accountId: string,
        debitAmount: number,
        creditAmount: number
    ): Promise<void> {
        try {
            const account = await this.getAccount(accountId);
            if (!account) {
                throw new APIError(ErrorCodes.NOT_FOUND, 'Account not found', 404);
            }
            
            const netChange = account.normalBalance === 'debit' 
                ? (debitAmount - creditAmount)
                : (creditAmount - debitAmount);
            
            const newBalance = account.currentBalance + netChange;
            
            // Update account
            const accountRef = doc(db, COLLECTIONS.ACCOUNTS, accountId);
            await updateDoc(accountRef, {
                currentBalance: newBalance,
                balanceUpdatedAt: serverTimestamp()
            });
            
            // Update balance record
            const balanceRef = doc(db, COLLECTIONS.BALANCES, accountId);
            const balanceSnap = await getDoc(balanceRef);
            
            if (balanceSnap.exists()) {
                const currentData = balanceSnap.data() as AccountBalance;
                await updateDoc(balanceRef, {
                    debitBalance: currentData.debitBalance + debitAmount,
                    creditBalance: currentData.creditBalance + creditAmount,
                    netBalance: newBalance,
                    transactionCount: currentData.transactionCount + 1,
                    lastTransaction: serverTimestamp()
                });
            }
            
            logger.debug('updateAccountBalance', 'Balance updated', { accountId, newBalance });
            
        } catch (error) {
            logger.error('updateAccountBalance', 'Failed to update balance', error as Error, { accountId });
            throw error;
        }
    }
    
    /**
     * Initialize balance record for new account
     */
    private async initializeBalance(accountId: string): Promise<void> {
        try {
            const account = await this.getAccount(accountId);
            if (!account) return;
            
            const balance: AccountBalance = {
                accountId: account.id,
                accountNumber: account.accountNumber,
                accountName: account.accountName,
                currency: account.currency,
                debitBalance: 0,
                creditBalance: 0,
                netBalance: 0,
                transactionCount: 0
            };
            
            const balanceRef = doc(db, COLLECTIONS.BALANCES, accountId);
            await setDoc(balanceRef, balance);
            
        } catch (error) {
            logger.warn('initializeBalance', 'Failed to initialize balance', { accountId });
        }
    }
    
    /**
     * Update parent account to be a control account
     */
    private async updateParentControlStatus(parentAccountId: string): Promise<void> {
        try {
            const parentRef = doc(db, COLLECTIONS.ACCOUNTS, parentAccountId);
            await updateDoc(parentRef, {
                isControlAccount: true,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            logger.warn('updateParentControlStatus', 'Failed to update parent', { parentAccountId });
        }
    }
    
    /**
     * Add audit trail entry
     */
    private async addAuditEntry(
        accountId: string,
        action: string,
        userId: string,
        details?: any
    ): Promise<void> {
        try {
            const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const auditRef = doc(db, COLLECTIONS.AUDIT_TRAIL, auditId);
            
            await setDoc(auditRef, {
                id: auditId,
                accountId,
                action,
                userId,
                details: details || {},
                timestamp: serverTimestamp()
            });
            
        } catch (error) {
            logger.warn('addAuditEntry', 'Failed to add audit entry', { accountId, action });
        }
    }
    
    /**
     * Search accounts by name or number
     */
    async searchAccounts(searchTerm: string): Promise<ChartOfAccount[]> {
        try {
            const allAccounts = await this.getAllAccounts();
            
            const term = searchTerm.toLowerCase();
            
            return allAccounts.filter(account => 
                account.accountNumber.toLowerCase().includes(term) ||
                account.accountName.toLowerCase().includes(term) ||
                account.description?.toLowerCase().includes(term)
            );
            
        } catch (error) {
            logger.error('searchAccounts', 'Failed to search accounts', error as Error, { searchTerm });
            return [];
        }
    }
}

// Export singleton instance
export const chartOfAccountsService = new ChartOfAccountsService();
