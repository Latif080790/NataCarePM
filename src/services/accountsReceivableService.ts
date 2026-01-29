/**
 * Accounts Receivable (AR) Service
 *
 * Manages customer invoices and payments
 * Supports:
 * - Customer invoice management
 * - Aging reports
 * - Payment tracking
 * - Collection management
 * - Integration with Journal Entries
 *
 * @module api/accountsReceivableService
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
  AccountsReceivable,
  ReceivableStatus,
  ReceivableLineItem,
  Payment,
  AgingReport,
  AgingBracket,
} from '@/types/accounting';

import { withRetry } from '@/utils/retryWrapper';
import { APIError, ErrorCodes } from '@/utils/responseWrapper';
import { createScopedLogger } from '@/utils/logger';
import { validators } from '@/utils/validators';
import { journalEntriesService } from './journalService';

const logger = createScopedLogger('accountsReceivableService');

const COLLECTIONS = {
  RECEIVABLES: 'accounts_receivable',
  CUSTOMERS: 'customers',
  PAYMENTS: 'payments',
  AUDIT_TRAIL: 'ar_audit_trail',
  COLLECTION_NOTES: 'collection_notes',
} as const;

/**
 * Accounts Receivable Service
 */
export class AccountsReceivableService {
  /**
   * Generate next AR number
   */
  private async generateARNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `AR-${year}-`;

    const q = query(
      collection(db, COLLECTIONS.RECEIVABLES),
      where('arNumber', '>=', prefix),
      where('arNumber', '<', `AR-${year + 1}-`),
      orderBy('arNumber', 'desc')
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return `${prefix}0001`;
    }

    const lastAR = snapshot.docs[0].data() as AccountsReceivable;
    const lastNumber = parseInt(lastAR.arNumber.split('-')[2]);
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
   * Create customer invoice (accounts receivable)
   *
   * @param arData - AR data
   * @param userId - User creating the AR
   * @returns Created accounts receivable record
   *
   * @example
   * ```typescript
   * const ar = await service.createAccountsReceivable({
   *   invoiceNumber: 'INV-001',
   *   invoiceDate: new Date(),
   *   dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
   *   customerId: 'customer_123',
   *   customerName: 'XYZ Corp',
   *   customerCode: 'C001',
   *   currency: 'IDR',
   *   lineItems: [
   *     { description: 'Services', quantity: 10, unitPrice: 500000, amount: 5000000 }
   *   ],
   *   subtotal: 5000000,
   *   taxAmount: 550000,
   *   totalAmount: 5550000
   * }, 'user_123');
   * ```
   */
  async createAccountsReceivable(
    arData: Omit<
      AccountsReceivable,
      | 'id'
      | 'arNumber'
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
      | 'collectionNotes'
    >,
    userId: string
  ): Promise<AccountsReceivable> {
    try {
      // Validation
      if (!validators.isValidString(arData.invoiceNumber, 1, 50).valid) {
        throw new APIError(
          ErrorCodes.INVALID_INPUT,
          'Invoice number is required (1-50 characters)',
          400
        );
      }

      if (!arData.customerId) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Customer ID is required', 400);
      }

      if (!arData.lineItems || arData.lineItems.length === 0) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'At least one line item is required', 400);
      }

      // Generate AR number
      const arNumber = await this.generateARNumber();
      const arId = `ar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Calculate aging
      const { agingDays, agingBracket } = this.calculateAging(arData.invoiceDate);

      // Enrich line items
      const enrichedLines: ReceivableLineItem[] = arData.lineItems.map((line, index) => ({
        ...line,
        id: `line_${index + 1}`,
        lineNumber: index + 1,
        revenueAccountId: line.revenueAccountId || 'default_revenue_account',
        revenueAccountNumber: line.revenueAccountNumber || '4000',
        revenueAccountName: line.revenueAccountName || 'Sales Revenue',
      }));

      const now = new Date();

      const ar: AccountsReceivable = {
        ...arData,
        id: arId,
        arNumber,
        lineItems: enrichedLines,
        amountPaid: 0,
        amountDue: arData.totalAmount,
        status: 'sent',
        agingDays,
        agingBracket,
        payments: [],
        remindersSent: 0,
        createdAt: now,
        createdBy: userId,
        updatedAt: now,
        updatedBy: userId,
      };

      // Save to Firestore
      const docRef = doc(db, COLLECTIONS.RECEIVABLES, arId);
      await withRetry(
        () =>
          setDoc(docRef, {
            ...ar,
            invoiceDate: Timestamp.fromDate(ar.invoiceDate),
            dueDate: Timestamp.fromDate(ar.dueDate),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }),
        { maxAttempts: 3 }
      );

      // Create journal entry for invoice
      await this.createInvoiceJournalEntry(ar, userId);

      // Audit trail
      await this.addAuditEntry(arId, 'ar_created', userId, {
        arNumber,
        customerName: ar.customerName,
        totalAmount: ar.totalAmount,
      });

      logger.success('createAccountsReceivable', 'AR created successfully', { arId, arNumber });

      return ar;
    } catch (error) {
      logger.error('createAccountsReceivable', 'Failed to create AR', error as Error);
      throw error;
    }
  }

  /**
   * Create journal entry for invoice
   */
  private async createInvoiceJournalEntry(ar: AccountsReceivable, userId: string): Promise<void> {
    try {
      await journalEntriesService.createJournalEntry(
        {
          entryDate: ar.invoiceDate,
          description: `Invoice ${ar.arNumber} - ${ar.customerName}`,
          reference: ar.arNumber,
          entryType: 'standard',
          status: 'draft',
          baseCurrency: ar.currency,
          totalDebitBaseCurrency: ar.totalAmount,
          totalCreditBaseCurrency: ar.totalAmount,
          lines: [
            {
              id: 'line_1',
              lineNumber: 1,
              accountId: 'accounts_receivable_account',
              accountNumber: '1020',
              accountName: 'Accounts Receivable',
              debit: ar.totalAmount,
              credit: 0,
              currency: ar.currency,
              description: `Invoice to ${ar.customerName}`,
            },
            {
              id: 'line_2',
              lineNumber: 2,
              accountId: 'sales_revenue_account',
              accountNumber: '4000',
              accountName: 'Sales Revenue',
              debit: 0,
              credit: ar.subtotal,
              currency: ar.currency,
              description: 'Sales revenue',
            },
            {
              id: 'line_3',
              lineNumber: 3,
              accountId: 'tax_payable_account',
              accountNumber: '2100',
              accountName: 'Tax Payable',
              debit: 0,
              credit: ar.taxAmount || 0,
              currency: ar.currency,
              description: 'Sales tax',
            },
          ],
        },
        userId
      );
    } catch (error) {
      logger.warn('createInvoiceJournalEntry', 'Failed to create journal entry', { arId: ar.id });
    }
  }

  /**
   * Get accounts receivable by ID
   */
  async getAccountsReceivable(arId: string): Promise<AccountsReceivable | null> {
    try {
      const docRef = doc(db, COLLECTIONS.RECEIVABLES, arId);
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
        lastPaymentDate: data.lastPaymentDate?.toDate?.(),
        payments: data.payments || [],
        remindersSent: data.remindersSent || 0,
      } as AccountsReceivable;
    } catch (error) {
      logger.error('getAccountsReceivable', 'Failed to get AR', error as Error, { arId });
      return null;
    }
  }

  /**
   * Get all accounts receivable
   */
  async getAllAccountsReceivable(): Promise<AccountsReceivable[]> {
    try {
      const q = query(collection(db, COLLECTIONS.RECEIVABLES), orderBy('invoiceDate', 'desc'));

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
          remindersSent: data.remindersSent || 0,
        } as AccountsReceivable;
      });
    } catch (error) {
      logger.error('getAllAccountsReceivable', 'Failed to get all AR', error as Error);
      return [];
    }
  }

  /**
   * Get accounts receivable by status
   */
  async getAccountsReceivableByStatus(status: ReceivableStatus): Promise<AccountsReceivable[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.RECEIVABLES),
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
          remindersSent: data.remindersSent || 0,
        } as AccountsReceivable;
      });
    } catch (error) {
      logger.error('getAccountsReceivableByStatus', 'Failed to get AR by status', error as Error, {
        status,
      });
      return [];
    }
  }

  /**
   * Get accounts receivable by customer
   */
  async getAccountsReceivableByCustomer(customerId: string): Promise<AccountsReceivable[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.RECEIVABLES),
        where('customerId', '==', customerId),
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
          remindersSent: data.remindersSent || 0,
        } as AccountsReceivable;
      });
    } catch (error) {
      logger.error(
        'getAccountsReceivableByCustomer',
        'Failed to get AR by customer',
        error as Error,
        { customerId }
      );
      return [];
    }
  }

  /**
   * Record payment for accounts receivable
   */
  async recordPayment(
    arId: string,
    payment: Omit<
      Payment,
      'id' | 'paymentNumber' | 'createdAt' | 'createdBy' | 'referenceType' | 'referenceId'
    >,
    userId: string
  ): Promise<AccountsReceivable | null> {
    try {
      const ar = await this.getAccountsReceivable(arId);
      if (!ar) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Accounts receivable not found', 404);
      }

      if (ar.status === 'paid' || ar.status === 'cancelled' || ar.status === 'void') {
        throw new APIError(
          ErrorCodes.INVALID_OPERATION,
          `Cannot record payment for AR with status ${ar.status}`,
          400
        );
      }

      if (payment.amount > ar.amountDue) {
        throw new APIError(
          ErrorCodes.INVALID_INPUT,
          `Payment amount (${payment.amount}) exceeds amount due (${ar.amountDue})`,
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
        referenceType: 'ar',
        referenceId: arId,
        status: 'completed',
        createdAt: new Date(),
        createdBy: userId,
      };

      // Update AR
      const newAmountPaid = ar.amountPaid + payment.amount;
      const newAmountDue = ar.amountDue - payment.amount;
      const newStatus: ReceivableStatus = newAmountDue <= 0.01 ? 'paid' : 'partially_paid';

      const docRef = doc(db, COLLECTIONS.RECEIVABLES, arId);
      await updateDoc(docRef, {
        amountPaid: newAmountPaid,
        amountDue: newAmountDue,
        status: newStatus,
        lastPaymentDate: Timestamp.fromDate(payment.paymentDate),
        payments: [...ar.payments, fullPayment],
        updatedAt: serverTimestamp(),
        updatedBy: userId,
      });

      // Create journal entry for payment
      await this.createPaymentJournalEntry(ar, fullPayment, userId);

      // Audit trail
      await this.addAuditEntry(arId, 'payment_recorded', userId, {
        paymentAmount: payment.amount,
        paymentNumber,
      });

      logger.success('recordPayment', 'Payment recorded successfully', { arId, paymentId });

      return this.getAccountsReceivable(arId);
    } catch (error) {
      logger.error('recordPayment', 'Failed to record payment', error as Error, { arId });
      throw error;
    }
  }

  /**
   * Create journal entry for payment
   */
  private async createPaymentJournalEntry(
    ar: AccountsReceivable,
    payment: Payment,
    userId: string
  ): Promise<void> {
    try {
      await journalEntriesService.createJournalEntry(
        {
          entryDate: payment.paymentDate,
          description: `Payment for ${ar.arNumber} - ${ar.customerName}`,
          reference: ar.arNumber,
          entryType: 'standard',
          status: 'draft',
          baseCurrency: ar.currency,
          totalDebitBaseCurrency: payment.amount,
          totalCreditBaseCurrency: payment.amount,
          lines: [
            {
              id: 'line_1',
              lineNumber: 1,
              accountId: payment.bankAccountId || 'cash_account',
              accountNumber: '1010',
              accountName: payment.bankAccountName || 'Cash',
              debit: payment.amount,
              credit: 0,
              currency: ar.currency,
              description: `Payment from ${ar.customerName}`,
            },
            {
              id: 'line_2',
              lineNumber: 2,
              accountId: 'accounts_receivable_account',
              accountNumber: '1020',
              accountName: 'Accounts Receivable',
              debit: 0,
              credit: payment.amount,
              currency: ar.currency,
              description: `Payment received via ${payment.paymentMethod}`,
            },
          ],
        },
        userId
      );
    } catch (error) {
      logger.warn('createPaymentJournalEntry', 'Failed to create journal entry', { arId: ar.id });
    }
  }

  /**
   * Add collection note
   */
  async addCollectionNote(
    arId: string,
    note: string,
    userId: string
  ): Promise<AccountsReceivable | null> {
    try {
      const ar = await this.getAccountsReceivable(arId);
      if (!ar) {
        throw new APIError(ErrorCodes.NOT_FOUND, 'Accounts receivable not found', 404);
      }

      const existingNotes = ar.collectionNotes || '';
      const timestamp = new Date().toISOString();
      const newNote = `${timestamp} - ${note}\n${existingNotes}`;

      const docRef = doc(db, COLLECTIONS.RECEIVABLES, arId);
      await updateDoc(docRef, {
        collectionNotes: newNote,
        updatedAt: serverTimestamp(),
        updatedBy: userId,
      });

      // Audit trail
      await this.addAuditEntry(arId, 'collection_note_added', userId, { note });

      logger.success('addCollectionNote', 'Collection note added', { arId });

      return this.getAccountsReceivable(arId);
    } catch (error) {
      logger.error('addCollectionNote', 'Failed to add collection note', error as Error, { arId });
      throw error;
    }
  }

  /**
   * Mark as overdue (system job)
   */
  async markOverdueInvoices(): Promise<number> {
    try {
      const now = new Date();
      const allAR = await this.getAllAccountsReceivable();

      let count = 0;

      for (const ar of allAR) {
        if (
          (ar.status === 'sent' || ar.status === 'viewed' || ar.status === 'partially_paid') &&
          ar.dueDate < now
        ) {
          const docRef = doc(db, COLLECTIONS.RECEIVABLES, ar.id);
          await updateDoc(docRef, {
            status: 'overdue',
            updatedAt: serverTimestamp(),
          });
          count++;
        }
      }

      logger.success('markOverdueInvoices', `Marked ${count} invoices as overdue`);

      return count;
    } catch (error) {
      logger.error('markOverdueInvoices', 'Failed to mark overdue invoices', error as Error);
      return 0;
    }
  }

  /**
   * Generate aging report
   */
  async generateAgingReport(): Promise<AgingReport> {
    try {
      const allAR = await this.getAllAccountsReceivable();

      // Filter unpaid/partially paid
      const unpaidAR = allAR.filter(
        (ar) => ar.status !== 'paid' && ar.status !== 'cancelled' && ar.status !== 'void'
      );

      // Update aging for each
      const updatedAR = unpaidAR.map((ar) => {
        const { agingDays, agingBracket } = this.calculateAging(ar.invoiceDate);
        return { ...ar, agingDays, agingBracket };
      });

      // Group by bracket
      const brackets: AgingBracket[] = [
        { bracket: '0-30', count: 0, totalAmount: 0, percentage: 0 },
        { bracket: '31-60', count: 0, totalAmount: 0, percentage: 0 },
        { bracket: '61-90', count: 0, totalAmount: 0, percentage: 0 },
        { bracket: '90+', count: 0, totalAmount: 0, percentage: 0 },
      ];

      updatedAR.forEach((ar) => {
        const bracket = brackets.find((b) => b.bracket === ar.agingBracket);
        if (bracket) {
          bracket.count++;
          bracket.totalAmount += ar.amountDue;
        }
      });

      const totalAmount = brackets.reduce((sum, b) => sum + b.totalAmount, 0);

      // Calculate percentages
      brackets.forEach((bracket) => {
        bracket.percentage = totalAmount > 0 ? (bracket.totalAmount / totalAmount) * 100 : 0;
      });

      const report: AgingReport = {
        reportDate: new Date(),
        reportType: 'receivable',
        currency: 'IDR', // Should be configurable
        brackets,
        totalCount: updatedAR.length,
        totalAmount,
        details: updatedAR,
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
   * Send payment reminder to customer
   */
  async sendPaymentReminder(
    arId: string,
    userId: string,
    reminderType: 'gentle' | 'firm' | 'final' = 'gentle'
  ): Promise<void> {
    try {
      logger.info('sendPaymentReminder', 'Sending payment reminder', { arId, reminderType });

      const ar = await this.getAccountsReceivable(arId);
      if (!ar) {
        throw new Error('Accounts receivable not found');
      }

      // Import notification service
      const { createNotification } = await import('./notificationService');

      // Import notification types
      const { NotificationType, NotificationPriority, NotificationChannel } = await import(
        '../types/automation'
      );

      // Determine message based on reminder type and aging
      let title = '';
      let message = '';
      let notifType = NotificationType.INFO;
      let priority = NotificationPriority.NORMAL;
      let channels = [NotificationChannel.IN_APP];

      switch (reminderType) {
        case 'gentle':
          title = `Payment Reminder: Invoice ${ar.arNumber}`;
          message = `Invoice ${ar.arNumber} for ${ar.totalAmount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })} is due on ${new Date(ar.dueDate).toLocaleDateString()}. Please arrange payment at your earliest convenience.`;
          notifType = NotificationType.INFO;
          priority = NotificationPriority.NORMAL;
          channels = [NotificationChannel.IN_APP, NotificationChannel.EMAIL];
          break;
        case 'firm':
          title = `Payment Overdue: Invoice ${ar.arNumber}`;
          message = `Invoice ${ar.arNumber} for ${ar.totalAmount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })} is now ${ar.agingDays} days overdue. Please settle this invoice immediately.`;
          notifType = NotificationType.WARNING;
          priority = NotificationPriority.HIGH;
          channels = [NotificationChannel.IN_APP, NotificationChannel.EMAIL];
          break;
        case 'final':
          title = `FINAL NOTICE: Invoice ${ar.arNumber}`;
          message = `Invoice ${ar.arNumber} for ${ar.totalAmount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })} is ${ar.agingDays} days overdue. Immediate payment required.`;
          notifType = NotificationType.ERROR;
          priority = NotificationPriority.URGENT;
          channels = [
            NotificationChannel.IN_APP,
            NotificationChannel.EMAIL,
            NotificationChannel.SMS,
          ];
          break;
      }

      // Get customer contact info (from customer record via customerId)
      const customerId = (ar as any).customerId;

      // Create in-app notification
      await createNotification({
        recipientId: customerId || 'customer_' + arId,
        title,
        message,
        type: notifType,
        priority,
        channels,
        category: 'payment_reminder',
        relatedEntityType: 'accounts_receivable',
        relatedEntityId: arId,
        data: {
          arId,
          arNumber: ar.arNumber,
          amount: ar.totalAmount,
          dueDate: ar.dueDate,
          agingDays: ar.agingDays,
          reminderType,
        },
      });

      // Update AR with reminder sent timestamp
      const arRef = doc(db, COLLECTIONS.RECEIVABLES, arId);
      const lastReminderSent = new Date().toISOString();
      const reminderCount = ((ar as any).reminderCount || 0) + 1;

      await updateDoc(arRef, {
        lastReminderSent,
        reminderCount,
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      });

      // Add audit trail
      await this.addAuditEntry(arId, 'reminder_sent', userId, {
        reminderType,
        reminderCount,
        timestamp: lastReminderSent,
      });

      logger.success('sendPaymentReminder', 'Reminder sent successfully', {
        arId,
        reminderType,
        reminderCount,
      });
    } catch (error) {
      logger.error('sendPaymentReminder', 'Failed to send reminder', error as Error, { arId });
      throw error;
    }
  }

  /**
   * Send automated reminders for overdue invoices
   * Called by scheduled job/cron
   */
  async sendAutomatedReminders(): Promise<{
    gentle: number;
    firm: number;
    final: number;
  }> {
    try {
      logger.info('sendAutomatedReminders', 'Starting automated reminder process');

      const allARs = await this.getAllAccountsReceivable();
      const now = new Date();

      let gentleCount = 0;
      let firmCount = 0;
      let finalCount = 0;

      for (const ar of allARs) {
        if (ar.status === 'paid' || ar.status === 'cancelled' || ar.status === 'void') {
          continue;
        }

        const dueDate = new Date(ar.dueDate);
        const daysSinceDue = Math.floor(
          (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Get last reminder sent date
        const lastReminderSent = (ar as any).lastReminderSent;
        const daysSinceLastReminder = lastReminderSent
          ? Math.floor(
              (now.getTime() - new Date(lastReminderSent).getTime()) / (1000 * 60 * 60 * 24)
            )
          : 999;

        // Don't send reminders more than once every 3 days
        if (daysSinceLastReminder < 3) {
          continue;
        }

        // Gentle reminder: 3-7 days before due date
        if (daysSinceDue >= -7 && daysSinceDue <= -3) {
          await this.sendPaymentReminder(ar.id, 'system', 'gentle');
          gentleCount++;
        }
        // Firm reminder: 1-15 days overdue
        else if (daysSinceDue > 0 && daysSinceDue <= 15) {
          await this.sendPaymentReminder(ar.id, 'system', 'firm');
          firmCount++;
        }
        // Final reminder: 16+ days overdue
        else if (daysSinceDue > 15) {
          await this.sendPaymentReminder(ar.id, 'system', 'final');
          finalCount++;
        }
      }

      logger.success('sendAutomatedReminders', 'Automated reminders sent', {
        gentle: gentleCount,
        firm: firmCount,
        final: finalCount,
        total: gentleCount + firmCount + finalCount,
      });

      return { gentle: gentleCount, firm: firmCount, final: finalCount };
    } catch (error) {
      logger.error('sendAutomatedReminders', 'Failed to send automated reminders', error as Error);
      throw error;
    }
  }

  /**
   * Add audit trail entry
   */
  private async addAuditEntry(
    arId: string,
    action: string,
    userId: string,
    details?: any
  ): Promise<void> {
    try {
      const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const auditRef = doc(db, COLLECTIONS.AUDIT_TRAIL, auditId);

      await setDoc(auditRef, {
        id: auditId,
        arId,
        action,
        userId,
        details: details || {},
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      logger.warn('addAuditEntry', 'Failed to add audit entry', { arId, action });
    }
  }
}

// Export singleton instance
export const accountsReceivableService = new AccountsReceivableService();
