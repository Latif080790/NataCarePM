/**
 * Purchase Order & Financial Form Validation Schemas
 * Zod schemas for PO, invoices, payments, vendors
 */

import { z } from 'zod';

/**
 * PO Status Enum
 */
export const POStatus = z.enum([
  'draft',
  'pending-approval',
  'approved',
  'rejected',
  'sent',
  'partially-received',
  'received',
  'cancelled',
]);

/**
 * Payment Status Enum
 */
export const PaymentStatus = z.enum(['pending', 'partial', 'paid', 'overdue', 'cancelled']);

/**
 * Payment Method Enum
 */
export const PaymentMethod = z.enum([
  'cash',
  'bank-transfer',
  'check',
  'credit-card',
  'debit-card',
  'e-wallet',
]);

/**
 * Vendor Schema
 */
export const vendorSchema = z.object({
  name: z
    .string()
    .min(2, 'Vendor name must be at least 2 characters')
    .max(200, 'Vendor name is too long')
    .trim(),

  companyName: z
    .string()
    .min(2, 'Company name is too short')
    .max(200, 'Company name is too long')
    .trim()
    .optional(),

  email: z.string().email('Please enter a valid email address').toLowerCase(),

  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
    .optional(),

  address: z.string().min(10, 'Address is too short').max(500, 'Address is too long').trim(),

  city: z.string().max(100).trim(),

  country: z.string().length(2, 'Country must be a 2-letter ISO code').toUpperCase(),

  taxId: z.string().max(50, 'Tax ID is too long').optional(),

  paymentTerms: z
    .number()
    .int('Payment terms must be a whole number')
    .min(0, 'Payment terms cannot be negative')
    .max(365, 'Payment terms cannot exceed 1 year')
    .default(30),

  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),

  notes: z.string().max(1000).optional(),
});

export type VendorFormData = z.infer<typeof vendorSchema>;

/**
 * Purchase Order Item Schema
 */
export const poItemSchema = z.object({
  description: z
    .string()
    .min(3, 'Item description is too short')
    .max(500, 'Item description is too long')
    .trim(),

  quantity: z
    .number({
      message: 'Quantity is required',
    })
    .positive('Quantity must be greater than 0')
    .max(1000000, 'Quantity is too large'),

  unit: z.string().max(50, 'Unit is too long').trim(),

  unitPrice: z
    .number({
      message: 'Unit price is required',
    })
    .nonnegative('Unit price cannot be negative')
    .max(1000000000, 'Unit price is too large'),

  taxRate: z
    .number()
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100%')
    .default(0),

  discount: z
    .number()
    .min(0, 'Discount cannot be negative')
    .max(100, 'Discount cannot exceed 100%')
    .default(0),

  notes: z.string().max(500).optional(),
});

export type POItemData = z.infer<typeof poItemSchema>;

/**
 * Purchase Order Schema
 */
export const purchaseOrderSchema = z
  .object({
    poNumber: z
      .string()
      .min(3, 'PO number is too short')
      .max(50, 'PO number is too long')
      .regex(/^[A-Z0-9-]+$/, 'PO number can only contain uppercase letters, numbers, and hyphens')
      .trim(),

    projectId: z.string().min(1, 'Project ID is required'),

    vendorId: z.string().min(1, 'Vendor is required'),

    status: POStatus.default('draft'),

    orderDate: z.coerce.date({
      message: 'Order date is required',
    }),

    deliveryDate: z.coerce.date({
      message: 'Delivery date is required',
    }),

    items: z
      .array(poItemSchema)
      .min(1, 'At least one item is required')
      .max(100, 'Maximum 100 items allowed'),

    currency: z
      .string()
      .length(3, 'Currency must be a 3-letter ISO code')
      .toUpperCase()
      .default('IDR'),

    shippingAddress: z
      .string()
      .min(10, 'Shipping address is too short')
      .max(500, 'Shipping address is too long')
      .trim(),

    shippingCost: z.number().nonnegative('Shipping cost cannot be negative').default(0),

    paymentTerms: z.string().max(200, 'Payment terms is too long').default('Net 30'),

    notes: z.string().max(2000, 'Notes are too long').optional(),

    attachments: z.array(z.string().url()).max(20).optional(),
  })
  .refine((data) => data.deliveryDate >= data.orderDate, {
    message: 'Delivery date must be on or after order date',
    path: ['deliveryDate'],
  });

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

/**
 * Invoice Schema
 */
export const invoiceSchema = z
  .object({
    invoiceNumber: z
      .string()
      .min(3, 'Invoice number is too short')
      .max(50, 'Invoice number is too long')
      .regex(
        /^[A-Z0-9-]+$/,
        'Invoice number can only contain uppercase letters, numbers, and hyphens'
      )
      .trim(),

    poId: z.string().optional(),

    projectId: z.string().min(1, 'Project ID is required'),

    vendorId: z.string().min(1, 'Vendor is required'),

    invoiceDate: z.coerce.date({
      message: 'Invoice date is required',
    }),

    dueDate: z.coerce.date({
      message: 'Due date is required',
    }),

    items: z.array(poItemSchema).min(1, 'At least one item is required'),

    currency: z.string().length(3).toUpperCase().default('IDR'),

    paymentStatus: PaymentStatus.default('pending'),

    paymentMethod: PaymentMethod.optional(),

    paidAmount: z.number().nonnegative().default(0),

    notes: z.string().max(2000).optional(),
  })
  .refine((data) => data.dueDate >= data.invoiceDate, {
    message: 'Due date must be on or after invoice date',
    path: ['dueDate'],
  });

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

/**
 * Payment Schema
 */
export const paymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),

  amount: z
    .number({
      message: 'Amount is required',
    })
    .positive('Amount must be greater than 0'),

  paymentDate: z.coerce.date({
    message: 'Payment date is required',
  }),

  paymentMethod: PaymentMethod,

  referenceNumber: z.string().max(100, 'Reference number is too long').optional(),

  notes: z.string().max(1000).optional(),

  attachments: z.array(z.string().url()).max(10).optional(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

/**
 * Goods Receipt Schema
 */
export const goodsReceiptSchema = z.object({
  poId: z.string().min(1, 'Purchase Order ID is required'),

  receiptNumber: z
    .string()
    .min(3, 'Receipt number is too short')
    .max(50, 'Receipt number is too long')
    .trim(),

  receiptDate: z.coerce.date({
    message: 'Receipt date is required',
  }),

  receivedBy: z.string().min(1, 'Receiver name is required'),

  items: z
    .array(
      z.object({
        poItemId: z.string(),
        quantityReceived: z.number().positive('Quantity must be greater than 0'),
        condition: z.enum(['good', 'damaged', 'incomplete']),
        notes: z.string().max(500).optional(),
      })
    )
    .min(1, 'At least one item is required'),

  location: z.string().max(200).trim(),

  notes: z.string().max(2000).optional(),

  attachments: z.array(z.string().url()).max(10).optional(),
});

export type GoodsReceiptFormData = z.infer<typeof goodsReceiptSchema>;

/**
 * Budget Schema
 */
export const budgetSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),

  category: z
    .string()
    .min(2, 'Category name is too short')
    .max(100, 'Category name is too long')
    .trim(),

  budgetedAmount: z
    .number({
      message: 'Budgeted amount is required',
    })
    .nonnegative('Budgeted amount cannot be negative'),

  currency: z.string().length(3).toUpperCase().default('IDR'),

  fiscalYear: z
    .number()
    .int('Fiscal year must be a whole number')
    .min(2000, 'Fiscal year must be 2000 or later')
    .max(2100, 'Fiscal year must be before 2100'),

  notes: z.string().max(1000).optional(),
});

export type BudgetFormData = z.infer<typeof budgetSchema>;

/**
 * Expense Schema
 */
export const expenseSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),

  category: z.string().max(100).trim(),

  description: z
    .string()
    .min(5, 'Description is too short')
    .max(500, 'Description is too long')
    .trim(),

  amount: z
    .number({
      message: 'Amount is required',
    })
    .positive('Amount must be greater than 0'),

  currency: z.string().length(3).toUpperCase().default('IDR'),

  expenseDate: z.coerce.date({
    message: 'Expense date is required',
  }),

  paymentMethod: PaymentMethod,

  vendorId: z.string().optional(),

  receiptUrl: z.string().url('Please enter a valid URL').optional(),

  isBillable: z.boolean().default(false),

  notes: z.string().max(1000).optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;

/**
 * Calculate PO total
 */
export function calculatePOTotal(
  items: POItemData[],
  shippingCost: number = 0
): {
  subtotal: number;
  totalTax: number;
  totalDiscount: number;
  grandTotal: number;
} {
  let subtotal = 0;
  let totalTax = 0;
  let totalDiscount = 0;

  items.forEach((item) => {
    const itemTotal = item.quantity * item.unitPrice;
    const discountAmount = itemTotal * (item.discount / 100);
    const taxableAmount = itemTotal - discountAmount;
    const taxAmount = taxableAmount * (item.taxRate / 100);

    subtotal += itemTotal;
    totalDiscount += discountAmount;
    totalTax += taxAmount;
  });

  const grandTotal = subtotal - totalDiscount + totalTax + shippingCost;

  return {
    subtotal,
    totalTax,
    totalDiscount,
    grandTotal,
  };
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'IDR'): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Validate PO number format
 */
export function validatePONumber(poNumber: string): {
  valid: boolean;
  error?: string;
} {
  if (poNumber.length < 3) {
    return { valid: false, error: 'PO number is too short' };
  }

  if (!/^[A-Z0-9-]+$/.test(poNumber)) {
    return {
      valid: false,
      error: 'PO number can only contain uppercase letters, numbers, and hyphens',
    };
  }

  return { valid: true };
}
