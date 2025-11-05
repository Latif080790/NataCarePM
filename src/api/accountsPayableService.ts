/**
 * Accounts Payable (AP) Service
 *
 * Manages vendor invoices and payments
 * Supports:
 * - Vendor invoice management
 * - Aging reports
 * - Payment tracking
 * - Approval workflow
 * - Integration with Journal Entries
 *
 * @module api/accountsPayableService
 */

import { db } from '@/firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

import type {
  AccountsPayable,
  PayableStatus,
  PayableLineItem,
  Payment,
  AgingReport,
  AgingBracket,
} from '@/types/accounting';

import { withRetry } from '@/utils/retryWrapper';
import { APIError, ErrorCodes } from '@/utils/responseWrapper';
import { createScopedLogger } from '@/utils/logger';
import { validators } from '@/utils/validators';
import { journalEntriesService } from './journalService';

const logger = createScopedLogger('accountsPayableService');

const COLLECTIONS = {
  PAYABLES: 'accounts_payable',
  VENDORS: 'vendors',
  PAYMENTS: 'payments',
  AUDIT_TRAIL: 'ap_audit_trail',
} as const;

/**
 * Accounts Payable Service
 */
export class AccountsPayableService {
  /**
   * Generate next AP number
   */
  private async generateAPNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `AP-${year}-`;

    const q = query(
      collection(db, COLLECTIONS.PAYABLES),
      where('apNumber', '>=', prefix),
      where('apNumber', '<', `AP-${year + 1}-`),
      orderBy('apNumber', 'desc')
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return `${prefix}0001`;
    }

    const lastAP = snapshot.docs[0].data() as AccountsPayable;
    const lastNumber = parseInt(lastAP.apNumber.split('-')[2]);
    const nextNumber = (lastNumber + 1).toString().padStart(4, '0');

    return `${prefix}${nextNumber}`;
  }

  /**
   * Calculate aging days and bracket
   */
  private calculateAging(invoiceDate: Date): {
    agingDays: number;
    agingBracket: '0-30' | '31-60' | '61-90' | '90+';
  } {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - invoiceDate.getTime());
    const agingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let agingBracket: '0-30' | '31-60' | '61-90' | '90+';
    if (agingDays <= 30) {
      agingBracket = '0-30';
    } else if (agingDays <= 60) {
      agingBracket = '31-60';
    } else if (agingDays <= 90) {
      agingBracket = '61-90';
    } else {
      agingBracket = '90+';
    }

    return { agingDays, agingBracket };
  }

  /**
   * Create vendor invoice (accounts payable)
   *
   * @param apData - AP data
   * @param userId - User creating the AP
   * @returns Created accounts payable record
   *
   * @example
   * ```typescript
   * const ap = await service.createAccountsPayable({
   *   invoiceNumber: 'INV-001',
   *   invoiceDate: new Date(),
   *   dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
   *   vendorId: 'vendor_123',
   *   vendorName: 'ABC Supplies',
   *   vendorCode: 'V001',
   *   currency: 'IDR',
   *   lineItems: [
   *     { description: 'Materials', quantity: 10, unitPrice: 100000, amount: 1000000 }
   *   ],
   *   subtotal: 1000000,
   *   taxAmount: 110000,
   *   totalAmount: 1110000
   * }, 'user_123');
   * ```
   */
  async createAccountsPayable(
    apData: Omit<
      AccountsPayable,
      | 'id'
      | 'apNumber'
      | 'createdAt'
      | 'createdBy'
      | 'updatedAt'
      | 'updatedBy'
      | 'amountPaid'
      | 'amountDue'
      | 'status'
      | 'agingDays'
      | 'agingBracket'
      | 'payments'
    >,
    userId: string
  ): Promise<AccountsPayable> {
    try {
      // Validation
      if (!validators.isValidString(apData.invoiceNumber, 1, 50).valid) {
        throw new APIError(
          ErrorCodes.INVALID_INPUT,
          'Invoice number is required (1-50 characters)',
          400
        );
      }

      if (!apData.vendorId) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Vendor ID is required', 400);
      }

      if (!apData.lineItems || apData.lineItems.length === 0) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'At least one line item is required', 400);
      }

      // Generate AP number
      const apNumber = await this.generateAPNumber();
      const apId = `ap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Calculate aging
      const { agingDays, agingBracket } = this.calculateAging(apData.invoiceDate);

      // Enrich line items
      const enrichedLines: PayableLineItem[] = apData.lineItems.map((line, index) => ({
        ...line,
        id: `line_${index + 1}`,
        lineNumber: index + 1,
        expenseAccountId: line.expenseAccountId || 'default_expense_account',
        expenseAccountNumber: line.expenseAccountNumber || '5000',
        expenseAccountName: line.expenseAccountName || 'General Expense',
      }));

      const now = new Date();

      const ap: AccountsPayable = {
        ...apData,
        id: apId,
        apNumber,
        lineItems: enrichedLines,
        amountPaid: 0,
        amountDue: apData.totalAmount,
        status: 'pending',
        agingDays,
        agingBracket,
        payments: [],
        requiresApproval: apData.totalAmount > 10000000, // Requires approval if > 10M
        createdAt: now,
        createdBy: userId,
        updatedAt: now,
        updatedBy: userId,
      };

      // Save to Firestore
      const docRef = doc(db, COLLECTIONS.PAYABLES, apId);
      await withRetry(
        () =>
          setDoc(docRef, {
            ...ap,
            invoiceDate: Timestamp.fromDate(ap.invoiceDate),
            dueDate: Timestamp.fromDate(ap.dueDate),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }),
        { maxAttempts: 3 }
      );

      // Audit trail
      await this.addAuditEntry(apId, 'ap_created', userId, {
        apNumber,
        vendorName: ap.vendorName,
        totalAmount: ap.totalAmount,
      });

      logger.success('createAccountsPayable', 'AP created successfully', { apId, apNumber });

      return ap;
    } catch (error) {
      logger.error('createAccountsPayable', 'Failed to create AP', error as Error);
      throw error;
    }
  }

  /**
   * Get accounts payable by ID
   */
  async getAccountsPayable(apId: string): Promise<AccountsPayable | null> {
    try {
      const docRef = doc(db, COLLECTIONS.PAYABLES, apId);
      const docSnap = await withRetry(() => getDoc(docRef), { maxAttempts: 2 });

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        ...data,
        invoiceDate: data.invoiceDate?.toDate?.() || new Date(),
        dueDate: data.dueDate?.toDate?.() || new Date(),
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        approvedAt: data.approvedAt?.toDate?.(),
        lastPaymentDate: data.lastPaymentDate?.toDate?.(),
        payments: data.payments || [],
      } as AccountsPayable;
    } catch (error) {
      logger.error('getAccountsPayable', 'Failed to get AP', error as Error, { apId });
      return null;
    }
  }

  /**
   * Get all accounts payable
   */
  async getAllAccountsPayable(): Promise<AccountsPayable[]> {
    try {
      const q = query(collection(db, COLLECTIONS.PAYABLES), orderBy('invoiceDate', 'desc'));

      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          invoiceDate: data.invoiceDate?.toDate?.() || new Date(),
          dueDate: data.dueDate?.toDate?.() || new Date(),
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          payments: data.payments || [],
        } as AccountsPayable;
      });
    } catch (error) {
      logger.error('getAllAccountsPayable', 'Failed to get all AP', error as Error);
      return [];
    }
  }

  /**
   * Get accounts payable by status
   */
  async getAccountsPayableByStatus(status: PayableStatus): Promise<AccountsPayable[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.PAYABLES),
        where('status', '==', status),
        orderBy('dueDate', 'asc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          invoiceDate: data.invoiceDate?.toDate?.() || new Date(),
          dueDate: data.dueDate?.toDate?.() || new Date(),
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          payments: data.payments || [],
        } as AccountsPayable;
      });
    } catch (error) {
      logger.error('getAccountsPayableByStatus', 'Failed to get AP by status', error as Error, {
        status,
      });
      return [];
    }
  }

  /**
   * Get accounts payable by vendor
   */
  async getAccountsPayableByVendor(vendorId: string): Promise<AccountsPayable[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.PAYABLES),
        where('vendorId', '==', vendorId),
        orderBy('invoiceDate', 'desc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          invoiceDate: data.invoiceDate?.toDate?.() || new Date(),
          dueDate: data.dueDate?.toDate?.() || new Date(),
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          payments: data.payments || [],
        } as AccountsPayable;
      });
    } catch (error) {
      logger.error('getAccountsPayableByVendor', 'Failed to get AP by vendor', error as Error, {
        vendorId,
      });
      return [];
    }
  }

  /**
   * Approve accounts payable
   */
  async approveAccountsPayable(
    apId: string,
    userId: string,
    notes?: string
  ): Promise<AccountsPayable | null> {
    try {
      const ap = await this.getAccountsPayable(apId);
      if (!ap) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Accounts payable not found', 404);
      }

      if (ap.status !== 'pending') {
        throw new APIError(
          ErrorCodes.INVALID_OPERATION,
          `Cannot approve AP with status ${ap.status}`,
          400
        );
      }

      const docRef = doc(db, COLLECTIONS.PAYABLES, apId);
      await updateDoc(docRef, {
        status: 'approved',
        approvedBy: userId,
        approvedAt: serverTimestamp(),
        approvalNotes: notes || '',
        updatedAt: serverTimestamp(),
        updatedBy: userId,
      });

      // Audit trail
      await this.addAuditEntry(apId, 'ap_approved', userId, { notes });

      logger.success('approveAccountsPayable', 'AP approved successfully', { apId });

      return this.getAccountsPayable(apId);
    } catch (error) {
      logger.error('approveAccountsPayable', 'Failed to approve AP', error as Error, { apId });
      throw error;
    }
  }

  /**
   * Record payment for accounts payable
   */
  async recordPayment(
    apId: string,
    payment: Omit<
      Payment,
      'id' | 'paymentNumber' | 'createdAt' | 'createdBy' | 'referenceType' | 'referenceId'
    >,
    userId: string
  ): Promise<AccountsPayable | null> {
    try {
      const ap = await this.getAccountsPayable(apId);
      if (!ap) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Accounts payable not found', 404);
      }

      if (ap.status === 'paid' || ap.status === 'cancelled') {
        throw new APIError(
          ErrorCodes.INVALID_OPERATION,
          `Cannot record payment for AP with status ${ap.status}`,
          400
        );
      }

      if (payment.amount > ap.amountDue) {
        throw new APIError(
          ErrorCodes.INVALID_INPUT,
          `Payment amount (${payment.amount}) exceeds amount due (${ap.amountDue})`,
          400
        );
      }

      // Generate payment number
      const paymentNumber = `PAY-${Date.now()}`;
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const fullPayment: Payment = {
        ...payment,
        id: paymentId,
        paymentNumber,
        referenceType: 'ap',
        referenceId: apId,
        status: 'completed',
        createdAt: new Date(),
        createdBy: userId,
      };

      // Update AP
      const newAmountPaid = ap.amountPaid + payment.amount;
      const newAmountDue = ap.amountDue - payment.amount;
      const newStatus: PayableStatus = newAmountDue <= 0.01 ? 'paid' : 'partially_paid';

      const docRef = doc(db, COLLECTIONS.PAYABLES, apId);
      await updateDoc(docRef, {
        amountPaid: newAmountPaid,
        amountDue: newAmountDue,
        status: newStatus,
        lastPaymentDate: Timestamp.fromDate(payment.paymentDate),
        payments: [...ap.payments, fullPayment],
        updatedAt: serverTimestamp(),
        updatedBy: userId,
      });

      // Create journal entry for payment
      await this.createPaymentJournalEntry(ap, fullPayment, userId);

      // Audit trail
      await this.addAuditEntry(apId, 'payment_recorded', userId, {
        paymentAmount: payment.amount,
        paymentNumber,
      });

      logger.success('recordPayment', 'Payment recorded successfully', { apId, paymentId });

      return this.getAccountsPayable(apId);
    } catch (error) {
      logger.error('recordPayment', 'Failed to record payment', error as Error, { apId });
      throw error;
    }
  }

  /**
   * Create journal entry for payment
   */
  private async createPaymentJournalEntry(
    ap: AccountsPayable,
    payment: Payment,
    userId: string
  ): Promise<void> {
    try {
      await journalEntriesService.createJournalEntry(
        {
          entryDate: payment.paymentDate,
          description: `Payment for ${ap.apNumber} - ${ap.vendorName}`,
          reference: ap.apNumber,
          entryType: 'standard',
          status: 'draft',
          baseCurrency: ap.currency,
          totalDebitBaseCurrency: payment.amount,
          totalCreditBaseCurrency: payment.amount,
          lines: [
            {
              id: 'line_1',
              lineNumber: 1,
              accountId: 'accounts_payable_account', // Should be from chart of accounts
              accountNumber: '2010',
              accountName: 'Accounts Payable',
              debit: payment.amount,
              credit: 0,
              currency: ap.currency,
              description: `Payment to ${ap.vendorName}`,
            },
            {
              id: 'line_2',
              lineNumber: 2,
              accountId: payment.bankAccountId || 'cash_account',
              accountNumber: '1010',
              accountName: payment.bankAccountName || 'Cash',
              debit: 0,
              credit: payment.amount,
              currency: ap.currency,
              description: `Payment via ${payment.paymentMethod}`,
            },
          ],
        },
        userId
      );
    } catch (error) {
      logger.warn('createPaymentJournalEntry', 'Failed to create journal entry', { apId: ap.id });
    }
  }

  /**
   * Generate aging report
   */
  async generateAgingReport(): Promise<AgingReport> {
    try {
      const allAP = await this.getAllAccountsPayable();

      // Filter unpaid/partially paid
      const unpaidAP = allAP.filter(
        (ap) => ap.status !== 'paid' && ap.status !== 'cancelled' && ap.status !== 'void'
      );

      // Update aging for each
      const updatedAP = unpaidAP.map((ap) => {
        const { agingDays, agingBracket } = this.calculateAging(ap.invoiceDate);
        return { ...ap, agingDays, agingBracket };
      });

      // Group by bracket
      const brackets: AgingBracket[] = [
        { bracket: '0-30', count: 0, totalAmount: 0, percentage: 0 },
        { bracket: '31-60', count: 0, totalAmount: 0, percentage: 0 },
        { bracket: '61-90', count: 0, totalAmount: 0, percentage: 0 },
        { bracket: '90+', count: 0, totalAmount: 0, percentage: 0 },
      ];

      updatedAP.forEach((ap) => {
        const bracket = brackets.find((b) => b.bracket === ap.agingBracket);
        if (bracket) {
          bracket.count++;
          bracket.totalAmount += ap.amountDue;
        }
      });

      const totalAmount = brackets.reduce((sum, b) => sum + b.totalAmount, 0);

      // Calculate percentages
      brackets.forEach((bracket) => {
        bracket.percentage = totalAmount > 0 ? (bracket.totalAmount / totalAmount) * 100 : 0;
      });

      const report: AgingReport = {
        reportDate: new Date(),
        reportType: 'payable',
        currency: 'IDR', // Should be configurable
        brackets,
        totalCount: updatedAP.length,
        totalAmount,
        details: updatedAP,
        generatedAt: new Date(),
        generatedBy: 'system',
      };

      logger.success('generateAgingReport', 'Aging report generated', {
        totalCount: report.totalCount,
        totalAmount: report.totalAmount,
      });

      return report;
    } catch (error) {
      logger.error('generateAgingReport', 'Failed to generate aging report', error as Error);
      throw error;
    }
  }

  /**
   * Add audit trail entry
   */
  private async addAuditEntry(
    apId: string,
    action: string,
    userId: string,
    details?: any
  ): Promise<void> {
    try {
      const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const auditRef = doc(db, COLLECTIONS.AUDIT_TRAIL, auditId);

      await setDoc(auditRef, {
        id: auditId,
        apId,
        action,
        userId,
        details: details || {},
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      logger.warn('addAuditEntry', 'Failed to add audit entry', { apId, action });
    }
  }
}

// Export singleton instance
export const accountsPayableService = new AccountsPayableService();
