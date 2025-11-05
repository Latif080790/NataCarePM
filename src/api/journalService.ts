/**
 * Journal Entries Service
 *
 * Manages journal entries with double-entry bookkeeping validation
 * Supports:
 * - Double-entry validation (debits = credits)
 * - Journal entry approval workflow
 * - Posting to general ledger
 * - Recurring entries
 * - Entry reversal
 * - Multi-currency entries
 *
 * @module api/journalService
 */

import { db } from '@/firebaseConfig';
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
  writeBatch,
} from 'firebase/firestore';

import type {
  JournalEntry,
  JournalEntryLine,
  JournalEntryStatus,
  GeneralLedgerEntry,
} from '@/types/accounting';

import { withRetry } from '@/utils/retryWrapper';
import { APIError, ErrorCodes } from '@/utils/responseWrapper';
import { createScopedLogger } from '@/utils/logger';

import { chartOfAccountsService } from './chartOfAccountsService';

const logger = createScopedLogger('journalService');

const COLLECTIONS = {
  JOURNAL_ENTRIES: 'journal_entries',
  GENERAL_LEDGER: 'general_ledger',
  TEMPLATES: 'journal_templates',
  AUDIT_TRAIL: 'journal_audit_trail',
} as const;

/**
 * Journal Entries Service
 */
export class JournalEntriesService {
  /**
   * Generate next journal entry number
   */
  private async generateEntryNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `JE-${year}-`;

    // Get last entry for this year
    const q = query(
      collection(db, COLLECTIONS.JOURNAL_ENTRIES),
      where('entryNumber', '>=', prefix),
      where('entryNumber', '<', `JE-${year + 1}-`),
      orderBy('entryNumber', 'desc')
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return `${prefix}0001`;
    }

    const lastEntry = snapshot.docs[0].data() as JournalEntry;
    const lastNumber = parseInt(lastEntry.entryNumber.split('-')[2]);
    const nextNumber = (lastNumber + 1).toString().padStart(4, '0');

    return `${prefix}${nextNumber}`;
  }

  /**
   * Validate journal entry (double-entry bookkeeping)
   *
   * @throws {APIError} If validation fails
   */
  private validateEntry(entry: Partial<JournalEntry>): void {
    // Check lines exist
    if (!entry.lines || entry.lines.length < 2) {
      throw new APIError(
        ErrorCodes.INVALID_INPUT,
        'Journal entry must have at least 2 lines (debit and credit)',
        400,
        { suggestion: 'Add at least one debit and one credit line' }
      );
    }

    // Calculate totals
    const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0);

    // Check balance (within 0.01 tolerance for rounding)
    const difference = Math.abs(totalDebit - totalCredit);
    if (difference > 0.01) {
      throw new APIError(
        ErrorCodes.INVALID_INPUT,
        `Journal entry is not balanced. Debits (${totalDebit}) must equal Credits (${totalCredit}). Difference: ${difference}`,
        400,
        {
          totalDebit,
          totalCredit,
          difference,
          suggestion: 'Adjust line amounts to balance debits and credits',
        }
      );
    }

    // Validate each line
    entry.lines.forEach((line, index) => {
      // Check that line has either debit or credit (not both, not neither)
      if (line.debit > 0 && line.credit > 0) {
        throw new APIError(
          ErrorCodes.INVALID_INPUT,
          `Line ${index + 1}: Cannot have both debit and credit`,
          400
        );
      }

      if (line.debit === 0 && line.credit === 0) {
        throw new APIError(
          ErrorCodes.INVALID_INPUT,
          `Line ${index + 1}: Must have either debit or credit amount`,
          400
        );
      }

      // Validate account exists
      if (!line.accountId) {
        throw new APIError(ErrorCodes.INVALID_INPUT, `Line ${index + 1}: Account is required`, 400);
      }
    });
  }

  /**
   * Create a new journal entry
   *
   * @param entryData - Journal entry data
   * @param userId - User creating the entry
   * @returns Created journal entry
   *
   * @example
   * ```typescript
   * const entry = await service.createJournalEntry({
   *   entryDate: new Date(),
   *   description: 'Purchase supplies',
   *   entryType: 'standard',
   *   lines: [
   *     { accountId: 'acc_1', debit: 1000, credit: 0, description: 'Supplies' },
   *     { accountId: 'acc_2', debit: 0, credit: 1000, description: 'Cash' }
   *   ]
   * }, 'user_123');
   * ```
   */
  async createJournalEntry(
    entryData: Omit<
      JournalEntry,
      | 'id'
      | 'entryNumber'
      | 'createdAt'
      | 'createdBy'
      | 'updatedAt'
      | 'updatedBy'
      | 'totalDebit'
      | 'totalCredit'
      | 'isBalanced'
    >,
    userId: string
  ): Promise<JournalEntry> {
    try {
      // Validate entry
      this.validateEntry(entryData);

      // Generate entry number
      const entryNumber = await this.generateEntryNumber();
      const entryId = `je_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Calculate totals
      const totalDebit = entryData.lines.reduce((sum, line) => sum + line.debit, 0);
      const totalCredit = entryData.lines.reduce((sum, line) => sum + line.credit, 0);
      const isBalanced = Math.abs(totalDebit - totalCredit) <= 0.01;

      // Enrich lines with account details
      const enrichedLines = await Promise.all(
        entryData.lines.map(async (line, index) => {
          const account = await chartOfAccountsService.getAccount(line.accountId);
          if (!account) {
            throw new APIError(
              ErrorCodes.NOT_FOUND,
              `Account not found for line ${index + 1}`,
              404
            );
          }

          return {
            ...line,
            id: `line_${index + 1}`,
            lineNumber: index + 1,
            accountNumber: account.accountNumber,
            accountName: account.accountName,
            currency: line.currency || account.currency,
          };
        })
      );

      const now = new Date();

      const entry: JournalEntry = {
        ...entryData,
        id: entryId,
        entryNumber,
        lines: enrichedLines,
        totalDebit,
        totalCredit,
        isBalanced,
        status: entryData.status || 'draft',
        baseCurrency: entryData.baseCurrency || 'IDR',
        totalDebitBaseCurrency: totalDebit,
        totalCreditBaseCurrency: totalCredit,
        createdAt: now,
        createdBy: userId,
        updatedAt: now,
        updatedBy: userId,
      };

      // Save to Firestore
      const docRef = doc(db, COLLECTIONS.JOURNAL_ENTRIES, entryId);
      await withRetry(
        () =>
          setDoc(docRef, {
            ...entry,
            entryDate: Timestamp.fromDate(entry.entryDate),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }),
        { maxAttempts: 3 }
      );

      // Audit trail
      await this.addAuditEntry(entryId, 'entry_created', userId, {
        entryNumber,
        description: entry.description,
      });

      logger.success('createJournalEntry', 'Journal entry created successfully', {
        entryId,
        entryNumber,
      });

      return entry;
    } catch (error) {
      logger.error('createJournalEntry', 'Failed to create journal entry', error as Error);
      throw error;
    }
  }

  /**
   * Get journal entry by ID
   */
  async getJournalEntry(entryId: string): Promise<JournalEntry | null> {
    try {
      const docRef = doc(db, COLLECTIONS.JOURNAL_ENTRIES, entryId);
      const docSnap = await withRetry(() => getDoc(docRef), { maxAttempts: 2 });

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        ...data,
        entryDate: data.entryDate?.toDate?.() || new Date(),
        postingDate: data.postingDate?.toDate?.(),
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        submittedAt: data.submittedAt?.toDate?.(),
        approvedAt: data.approvedAt?.toDate?.(),
        postedAt: data.postedAt?.toDate?.(),
        voidedAt: data.voidedAt?.toDate?.(),
      } as JournalEntry;
    } catch (error) {
      logger.error('getJournalEntry', 'Failed to get journal entry', error as Error, { entryId });
      return null;
    }
  }

  /**
   * Get all journal entries
   */
  async getAllJournalEntries(): Promise<JournalEntry[]> {
    try {
      const q = query(collection(db, COLLECTIONS.JOURNAL_ENTRIES), orderBy('entryDate', 'desc'));

      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          entryDate: data.entryDate?.toDate?.() || new Date(),
          postingDate: data.postingDate?.toDate?.(),
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          submittedAt: data.submittedAt?.toDate?.(),
          approvedAt: data.approvedAt?.toDate?.(),
          postedAt: data.postedAt?.toDate?.(),
          voidedAt: data.voidedAt?.toDate?.(),
        } as JournalEntry;
      });
    } catch (error) {
      logger.error('getAllJournalEntries', 'Failed to get journal entries', error as Error);
      return [];
    }
  }

  /**
   * Get journal entries by status
   */
  async getJournalEntriesByStatus(status: JournalEntryStatus): Promise<JournalEntry[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.JOURNAL_ENTRIES),
        where('status', '==', status),
        orderBy('entryDate', 'desc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          entryDate: data.entryDate?.toDate?.() || new Date(),
          postingDate: data.postingDate?.toDate?.(),
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        } as JournalEntry;
      });
    } catch (error) {
      logger.error('getJournalEntriesByStatus', 'Failed to get entries by status', error as Error, {
        status,
      });
      return [];
    }
  }

  /**
   * Update journal entry
   */
  async updateJournalEntry(
    entryId: string,
    updates: Partial<JournalEntry>,
    userId: string
  ): Promise<JournalEntry | null> {
    try {
      const existing = await this.getJournalEntry(entryId);
      if (!existing) {
        throw new APIError(ErrorCodes.NOT_FOUND, `Journal entry ${entryId} not found`, 404);
      }

      // Cannot update posted entries
      if (existing.status === 'posted') {
        throw new APIError(
          ErrorCodes.INVALID_OPERATION,
          'Cannot update posted journal entries. Create a reversing entry instead.',
          400
        );
      }

      // If updating lines, validate
      if (updates.lines) {
        this.validateEntry({ ...existing, ...updates });

        // Recalculate totals
        const totalDebit = updates.lines.reduce((sum, line) => sum + line.debit, 0);
        const totalCredit = updates.lines.reduce((sum, line) => sum + line.credit, 0);

        updates.totalDebit = totalDebit;
        updates.totalCredit = totalCredit;
        updates.isBalanced = Math.abs(totalDebit - totalCredit) <= 0.01;
      }

      const docRef = doc(db, COLLECTIONS.JOURNAL_ENTRIES, entryId);
      await withRetry(
        () =>
          updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp(),
            updatedBy: userId,
          }),
        { maxAttempts: 3 }
      );

      // Audit trail
      await this.addAuditEntry(entryId, 'entry_updated', userId, { updates });

      logger.success('updateJournalEntry', 'Journal entry updated successfully', { entryId });

      return this.getJournalEntry(entryId);
    } catch (error) {
      logger.error('updateJournalEntry', 'Failed to update journal entry', error as Error, {
        entryId,
      });
      throw error;
    }
  }

  /**
   * Submit journal entry for approval
   */
  async submitForApproval(entryId: string, userId: string): Promise<JournalEntry | null> {
    try {
      const entry = await this.getJournalEntry(entryId);
      if (!entry) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Journal entry not found', 404);
      }

      if (entry.status !== 'draft') {
        throw new APIError(
          ErrorCodes.INVALID_OPERATION,
          `Cannot submit entry with status ${entry.status}`,
          400
        );
      }

      if (!entry.isBalanced) {
        throw new APIError(ErrorCodes.INVALID_OPERATION, 'Cannot submit unbalanced entry', 400);
      }

      return this.updateJournalEntry(
        entryId,
        {
          status: 'pending_approval',
          submittedBy: userId,
          submittedAt: new Date(),
        },
        userId
      );
    } catch (error) {
      logger.error('submitForApproval', 'Failed to submit entry', error as Error, { entryId });
      throw error;
    }
  }

  /**
   * Approve journal entry
   */
  async approveEntry(entryId: string, userId: string): Promise<JournalEntry | null> {
    try {
      const entry = await this.getJournalEntry(entryId);
      if (!entry) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Journal entry not found', 404);
      }

      if (entry.status !== 'pending_approval') {
        throw new APIError(
          ErrorCodes.INVALID_OPERATION,
          `Cannot approve entry with status ${entry.status}`,
          400
        );
      }

      return this.updateJournalEntry(
        entryId,
        {
          status: 'approved',
          approvedBy: userId,
          approvedAt: new Date(),
        },
        userId
      );
    } catch (error) {
      logger.error('approveEntry', 'Failed to approve entry', error as Error, { entryId });
      throw error;
    }
  }

  /**
   * Post journal entry to general ledger
   * This updates account balances
   */
  async postEntry(entryId: string, userId: string): Promise<JournalEntry | null> {
    try {
      const entry = await this.getJournalEntry(entryId);
      if (!entry) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Journal entry not found', 404);
      }

      if (entry.status !== 'approved' && entry.status !== 'draft') {
        throw new APIError(
          ErrorCodes.INVALID_OPERATION,
          `Cannot post entry with status ${entry.status}`,
          400
        );
      }

      if (!entry.isBalanced) {
        throw new APIError(ErrorCodes.INVALID_OPERATION, 'Cannot post unbalanced entry', 400);
      }

      // Post to general ledger
      await this.postToGeneralLedger(entry);

      // Update account balances
      for (const line of entry.lines) {
        await chartOfAccountsService.updateAccountBalance(line.accountId, line.debit, line.credit);
      }

      // Update entry status
      const updatedEntry = await this.updateJournalEntry(
        entryId,
        {
          status: 'posted',
          postingDate: new Date(),
          postedBy: userId,
          postedAt: new Date(),
        },
        userId
      );

      logger.success('postEntry', 'Journal entry posted successfully', { entryId });

      return updatedEntry;
    } catch (error) {
      logger.error('postEntry', 'Failed to post entry', error as Error, { entryId });
      throw error;
    }
  }

  /**
   * Post journal entry lines to general ledger
   */
  private async postToGeneralLedger(entry: JournalEntry): Promise<void> {
    try {
      const batch = writeBatch(db);

      for (const line of entry.lines) {
        const ledgerId = `gl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const ledgerRef = doc(db, COLLECTIONS.GENERAL_LEDGER, ledgerId);

        const ledgerEntry: GeneralLedgerEntry = {
          id: ledgerId,
          accountId: line.accountId,
          accountNumber: line.accountNumber,
          accountName: line.accountName,
          transactionDate: entry.entryDate,
          postingDate: entry.postingDate || new Date(),
          journalEntryId: entry.id,
          journalEntryNumber: entry.entryNumber,
          lineNumber: line.lineNumber,
          description: line.description || entry.description,
          reference: entry.reference,
          debit: line.debit,
          credit: line.credit,
          balance: 0, // Will be calculated
          currency: line.currency,
          projectId: line.projectId,
          departmentId: line.departmentId,
          createdAt: new Date(),
          createdBy: entry.createdBy,
        };

        batch.set(ledgerRef, {
          ...ledgerEntry,
          transactionDate: Timestamp.fromDate(ledgerEntry.transactionDate),
          postingDate: Timestamp.fromDate(ledgerEntry.postingDate),
          createdAt: serverTimestamp(),
        });
      }

      await batch.commit();
    } catch (error) {
      logger.error('postToGeneralLedger', 'Failed to post to general ledger', error as Error);
      throw error;
    }
  }

  /**
   * Void journal entry
   */
  async voidEntry(entryId: string, reason: string, userId: string): Promise<JournalEntry | null> {
    try {
      const entry = await this.getJournalEntry(entryId);
      if (!entry) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Journal entry not found', 404);
      }

      if (entry.status === 'void') {
        throw new APIError(ErrorCodes.INVALID_OPERATION, 'Entry is already void', 400);
      }

      // If posted, create reversing entry
      if (entry.status === 'posted') {
        await this.createReversingEntry(entry, userId, reason);
      }

      return this.updateJournalEntry(
        entryId,
        {
          status: 'void',
          voidedBy: userId,
          voidedAt: new Date(),
          voidReason: reason,
        },
        userId
      );
    } catch (error) {
      logger.error('voidEntry', 'Failed to void entry', error as Error, { entryId });
      throw error;
    }
  }

  /**
   * Create reversing entry for posted journal entry
   */
  private async createReversingEntry(
    originalEntry: JournalEntry,
    userId: string,
    reason: string
  ): Promise<JournalEntry> {
    try {
      // Reverse the lines (swap debits and credits)
      const reversedLines: JournalEntryLine[] = originalEntry.lines.map((line) => ({
        ...line,
        id: `line_${line.lineNumber}`,
        debit: line.credit,
        credit: line.debit,
        description: `Reversal: ${line.description || ''}`,
      }));

      const reversingEntry = await this.createJournalEntry(
        {
          entryDate: new Date(),
          description: `Reversal of ${originalEntry.entryNumber}: ${reason}`,
          reference: originalEntry.entryNumber,
          entryType: 'reversing',
          lines: reversedLines,
          reversedEntryId: originalEntry.id,
          status: 'approved',
          baseCurrency: originalEntry.baseCurrency,
          totalDebitBaseCurrency: originalEntry.totalCreditBaseCurrency,
          totalCreditBaseCurrency: originalEntry.totalDebitBaseCurrency,
        },
        userId
      );

      // Post immediately
      await this.postEntry(reversingEntry.id, userId);

      // Link original entry to reversing entry
      await this.updateJournalEntry(
        originalEntry.id,
        { reversingEntryId: reversingEntry.id },
        userId
      );

      return reversingEntry;
    } catch (error) {
      logger.error('createReversingEntry', 'Failed to create reversing entry', error as Error);
      throw error;
    }
  }

  /**
   * Add audit trail entry
   */
  private async addAuditEntry(
    entryId: string,
    action: string,
    userId: string,
    details?: any
  ): Promise<void> {
    try {
      const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const auditRef = doc(db, COLLECTIONS.AUDIT_TRAIL, auditId);

      await setDoc(auditRef, {
        id: auditId,
        entryId,
        action,
        userId,
        details: details || {},
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      logger.warn('addAuditEntry', 'Failed to add audit entry', { entryId, action });
    }
  }

  /**
   * Delete journal entry (only drafts)
   */
  async deleteJournalEntry(entryId: string, userId: string): Promise<boolean> {
    try {
      const entry = await this.getJournalEntry(entryId);
      if (!entry) {
        return false;
      }

      if (entry.status !== 'draft') {
        throw new APIError(
          ErrorCodes.INVALID_OPERATION,
          'Can only delete draft entries. Use void for other statuses.',
          400
        );
      }

      const docRef = doc(db, COLLECTIONS.JOURNAL_ENTRIES, entryId);
      await withRetry(() => deleteDoc(docRef), { maxAttempts: 2 });

      // Audit trail
      await this.addAuditEntry(entryId, 'entry_deleted', userId, {
        entryNumber: entry.entryNumber,
      });

      logger.success('deleteJournalEntry', 'Journal entry deleted successfully', { entryId });

      return true;
    } catch (error) {
      logger.error('deleteJournalEntry', 'Failed to delete journal entry', error as Error, {
        entryId,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const journalEntriesService = new JournalEntriesService();
