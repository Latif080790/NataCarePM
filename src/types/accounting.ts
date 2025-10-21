/**
 * Finance & Accounting Module - Type Definitions
 *
 * Comprehensive types for:
 * - Chart of Accounts
 * - Journal Entries
 * - Accounts Payable/Receivable
 * - Multi-Currency Support
 *
 * @module types/accounting
 */

// ============================================================================
// CHART OF ACCOUNTS
// ============================================================================

/**
 * Account types following standard accounting categories
 */
export type AccountType =
  | 'asset' // 1000-1999
  | 'liability' // 2000-2999
  | 'equity' // 3000-3999
  | 'revenue' // 4000-4999
  | 'expense' // 5000-5999
  | 'cost_of_sales'; // 5000-5099 (subset of expense)

/**
 * Account sub-types for more granular categorization
 */
export type AccountSubType =
  // Assets
  | 'current_asset'
  | 'fixed_asset'
  | 'other_asset'
  | 'cash'
  | 'accounts_receivable'
  | 'inventory'
  | 'prepaid_expense'
  | 'property_plant_equipment'
  // Liabilities
  | 'current_liability'
  | 'long_term_liability'
  | 'accounts_payable'
  | 'accrued_expense'
  | 'notes_payable'
  | 'loan_payable'
  // Equity
  | 'owners_equity'
  | 'retained_earnings'
  | 'capital_stock'
  // Revenue
  | 'operating_revenue'
  | 'other_revenue'
  | 'project_revenue'
  // Expense
  | 'operating_expense'
  | 'administrative_expense'
  | 'project_expense'
  | 'depreciation'
  | 'interest_expense';

/**
 * Account status
 */
export type AccountStatus = 'active' | 'inactive' | 'archived';

/**
 * Chart of Accounts - Individual Account
 */
export interface ChartOfAccount {
  id: string;
  accountNumber: string; // e.g., "1010" for Cash
  accountName: string; // e.g., "Cash on Hand"
  accountType: AccountType;
  accountSubType: AccountSubType;

  // Hierarchy
  parentAccountId?: string; // For sub-accounts
  level: number; // Hierarchy level (0 = top level)
  fullAccountNumber: string; // e.g., "1010-001" for sub-account

  // Balance tracking
  normalBalance: 'debit' | 'credit';
  currentBalance: number;
  balanceUpdatedAt: Date;

  // Multi-currency
  currency: string; // ISO 4217 code (USD, IDR, etc.)
  allowMultiCurrency: boolean;

  // Metadata
  description?: string;
  status: AccountStatus;
  isControlAccount: boolean; // Has sub-accounts
  isSystemAccount: boolean; // Created by system, cannot be deleted

  // Tax & Compliance
  taxCode?: string;
  requiresReconciliation: boolean;

  // Audit trail
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;

  // Additional properties
  notes?: string;
  tags?: string[];
}

/**
 * Account hierarchy node for tree display
 */
export interface AccountHierarchy extends ChartOfAccount {
  children?: AccountHierarchy[];
  depth: number;
}

/**
 * Account balance summary
 */
export interface AccountBalance {
  accountId: string;
  accountNumber: string;
  accountName: string;
  currency: string;
  debitBalance: number;
  creditBalance: number;
  netBalance: number;
  transactionCount: number;
  lastTransaction?: Date;
}

// ============================================================================
// JOURNAL ENTRIES
// ============================================================================

/**
 * Journal entry status workflow
 */
export type JournalEntryStatus =
  | 'draft' // Being created/edited
  | 'pending_approval' // Submitted for approval
  | 'approved' // Approved but not posted
  | 'posted' // Posted to ledger
  | 'void' // Voided/cancelled
  | 'reversed'; // Reversed by another entry

/**
 * Journal entry type
 */
export type JournalEntryType =
  | 'standard' // Regular entry
  | 'adjusting' // End-of-period adjustment
  | 'closing' // Closing entry
  | 'reversing' // Auto-reversing entry
  | 'recurring' // Template for recurring entries
  | 'opening_balance'; // Opening balances

/**
 * Individual journal entry line (debit or credit)
 */
export interface JournalEntryLine {
  id: string;
  lineNumber: number;
  accountId: string;
  accountNumber: string;
  accountName: string;

  // Debit or Credit
  debit: number;
  credit: number;

  // Multi-currency
  currency: string;
  exchangeRate?: number;
  debitBaseCurrency?: number; // Amount in base currency
  creditBaseCurrency?: number;

  // Description & Tracking
  description?: string;
  projectId?: string;
  departmentId?: string;
  costCenterId?: string;

  // Dimensions (for advanced tracking)
  dimensions?: {
    [key: string]: string; // e.g., { "location": "site_1", "phase": "construction" }
  };

  // Tax
  taxCode?: string;
  taxAmount?: number;
}

/**
 * Journal Entry (Main entity)
 */
export interface JournalEntry {
  id: string;
  entryNumber: string; // Auto-generated: JE-2024-0001
  entryDate: Date;
  postingDate?: Date;

  // Entry details
  entryType: JournalEntryType;
  description: string;
  reference?: string; // External reference (invoice #, PO #, etc.)

  // Lines (debits and credits)
  lines: JournalEntryLine[];

  // Validation
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean; // totalDebit === totalCredit

  // Multi-currency
  baseCurrency: string;
  totalDebitBaseCurrency: number;
  totalCreditBaseCurrency: number;

  // Workflow
  status: JournalEntryStatus;
  submittedBy?: string;
  submittedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  postedBy?: string;
  postedAt?: Date;
  voidedBy?: string;
  voidedAt?: Date;
  voidReason?: string;

  // Reversing entry
  reversingEntryId?: string;
  reversedEntryId?: string;
  autoReverse?: boolean;
  reverseDate?: Date;

  // Recurring entry
  isRecurring?: boolean;
  recurringSchedule?: RecurringSchedule;
  parentRecurringEntryId?: string;

  // Attachments & Notes
  attachments?: string[]; // File URLs
  notes?: string;
  internalNotes?: string;

  // Audit trail
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;

  // Integration
  sourceSystem?: string; // e.g., 'manual', 'ap_module', 'ar_module'
  sourceDocumentId?: string;

  // Additional
  tags?: string[];
  fiscalPeriod?: string; // e.g., "2024-Q1"
  fiscalYear?: number;
}

/**
 * Recurring schedule for automatic journal entries
 */
export interface RecurringSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  interval: number; // e.g., 1 for monthly, 3 for quarterly
  startDate: Date;
  endDate?: Date;
  nextRunDate: Date;
  lastRunDate?: Date;
  remainingOccurrences?: number; // null = infinite
  dayOfWeek?: number; // For weekly (0-6)
  dayOfMonth?: number; // For monthly (1-31)
  monthOfYear?: number; // For yearly (1-12)
}

/**
 * Journal entry template
 */
export interface JournalEntryTemplate {
  id: string;
  templateName: string;
  description: string;
  entryType: JournalEntryType;
  lines: Omit<JournalEntryLine, 'id' | 'debit' | 'credit'>[];
  tags?: string[];
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
  createdBy: string;
}

// ============================================================================
// ACCOUNTS PAYABLE (AP)
// ============================================================================

/**
 * Payable status
 */
export type PayableStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'disputed'
  | 'cancelled'
  | 'void';

/**
 * Payment terms
 */
export interface PaymentTerms {
  code: string; // e.g., "NET30", "2/10 NET30"
  description: string; // e.g., "Net 30 days"
  dueDays: number; // Days until due
  discountDays?: number; // Days for early payment discount
  discountPercentage?: number; // Discount % if paid early
}

/**
 * Vendor/Supplier information
 */
export interface Vendor {
  id: string;
  vendorCode: string;
  vendorName: string;
  legalName?: string;

  // Contact
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;

  // Address
  billingAddress: Address;
  shippingAddress?: Address;

  // Financial
  currency: string;
  paymentTerms: PaymentTerms;
  taxId?: string;
  bankAccounts: BankAccount[];

  // Credit management
  creditLimit?: number;
  currentBalance: number;

  // Status
  status: 'active' | 'inactive' | 'blocked';
  vendorType?: string; // e.g., 'material', 'service', 'equipment'

  // Rating
  rating?: number; // 1-5 stars
  performanceScore?: number; // 0-100

  // Audit
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;

  notes?: string;
  tags?: string[];
}

/**
 * Accounts Payable (Vendor Invoice)
 */
export interface AccountsPayable {
  id: string;
  apNumber: string; // AP-2024-0001
  invoiceNumber: string; // Vendor's invoice number
  invoiceDate: Date;
  dueDate: Date;

  // Vendor information
  vendorId: string;
  vendorName: string;
  vendorCode: string;

  // Amounts
  currency: string;
  subtotal: number;
  taxAmount: number;
  discountAmount?: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;

  // Exchange rate (if not base currency)
  exchangeRate?: number;
  amountBaseCurrency?: number;

  // Payment terms
  paymentTerms: PaymentTerms;
  earlyPaymentDiscount?: number;
  earlyPaymentDate?: Date;

  // Status & Aging
  status: PayableStatus;
  agingDays: number; // Days since invoice date
  agingBracket: '0-30' | '31-60' | '61-90' | '90+';

  // Line items
  lineItems: PayableLineItem[];

  // Reference
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  projectId?: string;
  projectName?: string;

  // Approval workflow
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  approvalNotes?: string;

  // Payment tracking
  payments: Payment[];
  lastPaymentDate?: Date;

  // Journal entry
  journalEntryId?: string;

  // Attachments
  attachments?: string[]; // Invoice PDF, receipts, etc.

  // Audit trail
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;

  notes?: string;
  internalNotes?: string;
  tags?: string[];
}

/**
 * Payable line item
 */
export interface PayableLineItem {
  id: string;
  lineNumber: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;

  // Accounting
  expenseAccountId: string;
  expenseAccountNumber: string;
  expenseAccountName: string;

  // Tax
  taxCode?: string;
  taxRate?: number;
  taxAmount?: number;

  // Project tracking
  projectId?: string;
  costCenterId?: string;

  // Reference
  purchaseOrderLineId?: string;
}

// ============================================================================
// ACCOUNTS RECEIVABLE (AR)
// ============================================================================

/**
 * Receivable status
 */
export type ReceivableStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'disputed'
  | 'write_off'
  | 'cancelled'
  | 'void';

/**
 * Customer information
 */
export interface Customer {
  id: string;
  customerCode: string;
  customerName: string;
  legalName?: string;

  // Contact
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;

  // Address
  billingAddress: Address;
  shippingAddress?: Address;

  // Financial
  currency: string;
  paymentTerms: PaymentTerms;
  taxId?: string;

  // Credit management
  creditLimit?: number;
  currentBalance: number;
  creditRating?: string; // e.g., 'A', 'B', 'C'

  // Status
  status: 'active' | 'inactive' | 'blocked';
  customerType?: string; // e.g., 'government', 'private', 'individual'

  // Audit
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;

  notes?: string;
  tags?: string[];
}

/**
 * Accounts Receivable (Customer Invoice)
 */
export interface AccountsReceivable {
  id: string;
  arNumber: string; // AR-2024-0001
  invoiceNumber: string; // Our invoice number
  invoiceDate: Date;
  dueDate: Date;

  // Customer information
  customerId: string;
  customerName: string;
  customerCode: string;

  // Amounts
  currency: string;
  subtotal: number;
  taxAmount: number;
  discountAmount?: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;

  // Exchange rate (if not base currency)
  exchangeRate?: number;
  amountBaseCurrency?: number;

  // Payment terms
  paymentTerms: PaymentTerms;
  earlyPaymentDiscount?: number;
  earlyPaymentDate?: Date;

  // Status & Aging
  status: ReceivableStatus;
  agingDays: number;
  agingBracket: '0-30' | '31-60' | '61-90' | '90+';

  // Line items
  lineItems: ReceivableLineItem[];

  // Reference
  projectId?: string;
  projectName?: string;
  contractId?: string;
  terminId?: string; // Payment milestone

  // Payment tracking
  payments: Payment[];
  lastPaymentDate?: Date;

  // Collection
  remindersSent: number;
  lastReminderDate?: Date;
  nextReminderDate?: Date;
  collectionNotes?: string;

  // Journal entry
  journalEntryId?: string;

  // Invoice delivery
  sentDate?: Date;
  sentMethod?: 'email' | 'mail' | 'hand_delivered';
  viewedDate?: Date;

  // Attachments
  attachments?: string[]; // Invoice PDF, contracts, etc.

  // Audit trail
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;

  notes?: string;
  internalNotes?: string;
  tags?: string[];
}

/**
 * Receivable line item
 */
export interface ReceivableLineItem {
  id: string;
  lineNumber: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;

  // Accounting
  revenueAccountId: string;
  revenueAccountNumber: string;
  revenueAccountName: string;

  // Tax
  taxCode?: string;
  taxRate?: number;
  taxAmount?: number;

  // Project tracking
  projectId?: string;

  // Reference
  rabItemId?: string;
}

// ============================================================================
// PAYMENT
// ============================================================================

/**
 * Payment method
 */
export type PaymentMethod =
  | 'cash'
  | 'check'
  | 'bank_transfer'
  | 'wire_transfer'
  | 'credit_card'
  | 'debit_card'
  | 'e_wallet'
  | 'other';

/**
 * Payment status
 */
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'reversed';

/**
 * Payment record
 */
export interface Payment {
  id: string;
  paymentNumber: string; // PAY-2024-0001
  paymentDate: Date;

  // Amount
  amount: number;
  currency: string;
  exchangeRate?: number;
  amountBaseCurrency?: number;

  // Method
  paymentMethod: PaymentMethod;
  paymentMethodDetails?: string; // e.g., "Check #12345"

  // Status
  status: PaymentStatus;

  // Bank details
  bankAccountId?: string;
  bankAccountName?: string;
  transactionId?: string; // Bank transaction ID
  clearingDate?: Date;

  // Reference
  referenceNumber?: string;
  referenceType?: 'ap' | 'ar' | 'expense' | 'other';
  referenceId?: string; // AP or AR ID

  // Accounting
  journalEntryId?: string;

  // Audit trail
  createdAt: Date;
  createdBy: string;
  notes?: string;

  // Attachments
  attachments?: string[]; // Payment proof, receipts
}

// ============================================================================
// MULTI-CURRENCY
// ============================================================================

/**
 * Currency definition
 */
export interface Currency {
  code: string; // ISO 4217 (USD, EUR, IDR, etc.)
  name: string; // US Dollar, Euro, Indonesian Rupiah
  symbol: string; // $, €, Rp
  decimalPlaces: number; // 2 for most, 0 for JPY, IDR

  // Display formatting
  thousandsSeparator: string; // ',' or '.'
  decimalSeparator: string; // '.' or ','
  symbolPosition: 'before' | 'after';

  // Status
  isActive: boolean;
  isBaseCurrency: boolean; // Company's base currency

  // Metadata
  country?: string;
  region?: string;
}

/**
 * Exchange rate
 */
export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;

  // Date range
  effectiveDate: Date;
  expiryDate?: Date;

  // Source
  source: 'manual' | 'api' | 'bank' | 'market';
  sourceDetails?: string;

  // Type
  rateType: 'spot' | 'forward' | 'historical' | 'budget';

  // Audit
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;

  notes?: string;
}

/**
 * Currency conversion result
 */
export interface CurrencyConversion {
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  exchangeRate: number;
  conversionDate: Date;
  source: string;
}

/**
 * Foreign exchange gain/loss
 */
export interface ForexGainLoss {
  id: string;
  transactionId: string;
  transactionType: 'ap' | 'ar' | 'payment' | 'receipt';

  // Original transaction
  originalAmount: number;
  originalCurrency: string;
  originalExchangeRate: number;
  originalDate: Date;

  // Settlement
  settlementAmount: number;
  settlementCurrency: string;
  settlementExchangeRate: number;
  settlementDate: Date;

  // Gain/Loss
  gainLossAmount: number;
  gainLossBaseCurrency: number;
  isRealized: boolean;

  // Accounting
  journalEntryId?: string;

  // Audit
  calculatedAt: Date;
  notes?: string;
}

// ============================================================================
// SHARED / COMMON TYPES
// ============================================================================

/**
 * Address
 */
export interface Address {
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  countryCode?: string; // ISO 3166-1 alpha-2
}

/**
 * Bank account
 */
export interface BankAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode?: string;
  branchName?: string;
  branchCode?: string;
  swiftCode?: string;
  iban?: string;
  currency: string;
  accountType: 'checking' | 'savings' | 'money_market';
  isDefault: boolean;
  isActive: boolean;
}

/**
 * Aging bracket for AR/AP
 */
export interface AgingBracket {
  bracket: '0-30' | '31-60' | '61-90' | '90+';
  count: number;
  totalAmount: number;
  percentage: number;
}

/**
 * Aging report
 */
export interface AgingReport {
  reportDate: Date;
  reportType: 'payable' | 'receivable';
  currency: string;

  brackets: AgingBracket[];
  totalCount: number;
  totalAmount: number;

  // Details
  details: (AccountsPayable | AccountsReceivable)[];

  generatedAt: Date;
  generatedBy: string;
}

/**
 * Financial period
 */
export interface FiscalPeriod {
  id: string;
  name: string; // e.g., "2024-Q1", "January 2024"
  startDate: Date;
  endDate: Date;
  fiscalYear: number;
  quarter?: number; // 1-4
  month?: number; // 1-12
  isClosed: boolean;
  closedDate?: Date;
  closedBy?: string;
}

/**
 * Trial balance line
 */
export interface TrialBalanceLine {
  accountId: string;
  accountNumber: string;
  accountName: string;
  accountType: AccountType;
  debitBalance: number;
  creditBalance: number;
  netBalance: number;
}

/**
 * Trial balance
 */
export interface TrialBalance {
  reportDate: Date;
  fiscalPeriod?: string;
  currency: string;

  lines: TrialBalanceLine[];

  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;

  generatedAt: Date;
  generatedBy: string;
}

/**
 * General ledger entry
 */
export interface GeneralLedgerEntry {
  id: string;
  accountId: string;
  accountNumber: string;
  accountName: string;

  transactionDate: Date;
  postingDate: Date;

  journalEntryId: string;
  journalEntryNumber: string;
  lineNumber: number;

  description: string;
  reference?: string;

  debit: number;
  credit: number;
  balance: number;

  currency: string;

  projectId?: string;
  departmentId?: string;

  createdAt: Date;
  createdBy: string;
}

// Types are already exported above, no need to re-export
