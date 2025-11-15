/**
 * Logistics Validation Schemas
 * 
 * Zod validation schemas for logistics operations:
 * - Goods Receipt (GR)
 * - Material Request (MR)
 * - Purchase Orders (PO)
 * 
 * Created: November 16, 2025
 */

import { z } from 'zod';
import {
  requiredTextSchema,
  optionalTextSchema,
  positiveNumberSchema,
  nonNegativeNumberSchema,
  dateStringSchema,
  optionalDescriptionSchema,
} from './commonValidation';

// ============================================
// GOODS RECEIPT SCHEMAS
// ============================================

/**
 * GR Item validation
 */
export const grItemSchema = z.object({
  id: requiredTextSchema.optional(),
  grId: z.string().optional(),
  poItemId: requiredTextSchema,
  materialCode: requiredTextSchema,
  materialName: requiredTextSchema,
  
  // Quantities
  poQuantity: positiveNumberSchema,
  previouslyReceived: nonNegativeNumberSchema.default(0),
  receivedQuantity: positiveNumberSchema,
  acceptedQuantity: nonNegativeNumberSchema.default(0),
  rejectedQuantity: nonNegativeNumberSchema.default(0),
  
  unit: requiredTextSchema,
  
  // Quality
  qualityStatus: z.enum(['pending', 'passed', 'failed', 'conditional']).default('pending'),
  defectPhotos: z.array(z.string()).optional(),
  
  // Pricing
  unitPrice: positiveNumberSchema,
  totalPrice: positiveNumberSchema,
  
  // Variance
  quantityVariance: z.number().default(0),
  variancePercentage: z.number().default(0),
}).refine(
  (data) => data.receivedQuantity <= data.poQuantity - data.previouslyReceived,
  {
    message: 'Jumlah diterima tidak boleh melebihi sisa PO',
    path: ['receivedQuantity'],
  }
).refine(
  (data) => data.acceptedQuantity + data.rejectedQuantity <= data.receivedQuantity,
  {
    message: 'Total accepted + rejected tidak boleh melebihi jumlah diterima',
    path: ['acceptedQuantity'],
  }
);

/**
 * Create Goods Receipt input validation
 */
export const createGRInputSchema = z.object({
  projectId: requiredTextSchema,
  poId: requiredTextSchema,
  receiptDate: dateStringSchema,
  deliveryNote: optionalTextSchema,
  vehicleNumber: optionalTextSchema,
  driverName: optionalTextSchema,
  receiverNotes: optionalDescriptionSchema,
});

/**
 * Update Goods Receipt input validation
 */
export const updateGRInputSchema = z.object({
  status: z.enum(['draft', 'submitted', 'approved', 'rejected', 'completed']).optional(),
  receiptDate: dateStringSchema.optional(),
  deliveryNote: optionalTextSchema,
  vehicleNumber: optionalTextSchema,
  driverName: optionalTextSchema,
  receiverNotes: optionalDescriptionSchema,
});

/**
 * Inspect GR Item input validation
 */
export const inspectGRItemInputSchema = z.object({
  itemId: requiredTextSchema,
  qualityStatus: z.enum(['passed', 'failed', 'conditional']),
  acceptedQuantity: nonNegativeNumberSchema,
  rejectedQuantity: nonNegativeNumberSchema,
  inspectionNotes: optionalDescriptionSchema,
  defectPhotos: z.array(z.string()).optional(),
}).refine(
  (data) => data.acceptedQuantity + data.rejectedQuantity > 0,
  {
    message: 'Total accepted + rejected harus lebih dari 0',
    path: ['acceptedQuantity'],
  }
);

// ============================================
// MATERIAL REQUEST SCHEMAS
// ============================================

/**
 * MR Item validation
 */
export const mrItemSchema = z.object({
  id: requiredTextSchema.optional(),
  materialCode: requiredTextSchema,
  materialName: requiredTextSchema,
  description: optionalDescriptionSchema,
  
  quantity: positiveNumberSchema,
  unit: requiredTextSchema,
  
  // Budget tracking
  estimatedUnitPrice: positiveNumberSchema.optional(),
  estimatedTotalPrice: positiveNumberSchema.optional(),
  
  // Purpose
  purpose: requiredTextSchema.max(200, 'Purpose maksimal 200 karakter'),
  wbsCode: optionalTextSchema,
  
  // Priority
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  
  // Stock info (populated by service)
  currentStock: nonNegativeNumberSchema.optional(),
  reorderPoint: nonNegativeNumberSchema.optional(),
  stockStatus: z.enum(['sufficient', 'low', 'out_of_stock']).optional(),
});

/**
 * Create Material Request input validation
 */
export const createMRInputSchema = z.object({
  projectId: requiredTextSchema,
  requestDate: dateStringSchema,
  requiredDate: dateStringSchema,
  department: requiredTextSchema,
  costCenter: optionalTextSchema,
  
  items: z.array(mrItemSchema).min(1, 'Minimal 1 item harus ditambahkan'),
  
  justification: requiredTextSchema.max(500, 'Justifikasi maksimal 500 karakter'),
  notes: optionalDescriptionSchema,
  
  // Approval
  approvalRequired: z.boolean().default(true),
  urgencyLevel: z.enum(['normal', 'urgent', 'emergency']).default('normal'),
}).refine(
  (data) => new Date(data.requiredDate) >= new Date(data.requestDate),
  {
    message: 'Required date harus setelah atau sama dengan request date',
    path: ['requiredDate'],
  }
);

/**
 * Update Material Request input validation
 */
export const updateMRInputSchema = z.object({
  status: z.enum(['draft', 'submitted', 'approved', 'rejected', 'partially_fulfilled', 'completed', 'cancelled']).optional(),
  requiredDate: dateStringSchema.optional(),
  department: requiredTextSchema.optional(),
  costCenter: optionalTextSchema,
  justification: requiredTextSchema.optional(),
  notes: optionalDescriptionSchema,
  approvalNotes: optionalDescriptionSchema,
});

/**
 * Approve/Reject Material Request input validation
 */
export const approveMRInputSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  approvalNotes: z.string()
    .min(1, 'Catatan approval wajib diisi')
    .max(500, 'Catatan approval maksimal 500 karakter')
    .trim(),
});

// ============================================
// PURCHASE ORDER SCHEMAS
// ============================================

/**
 * PO Item validation
 */
export const poItemSchema = z.object({
  id: requiredTextSchema.optional(),
  materialCode: requiredTextSchema,
  description: requiredTextSchema,
  quantity: positiveNumberSchema,
  unit: requiredTextSchema,
  unitPrice: positiveNumberSchema,
  totalPrice: positiveNumberSchema,
  
  // Delivery
  deliveryDate: dateStringSchema.optional(),
  deliveryLocation: optionalTextSchema,
  
  // Reference
  mrItemId: optionalTextSchema,
  wbsCode: optionalTextSchema,
}).refine(
  (data) => Math.abs(data.totalPrice - (data.quantity * data.unitPrice)) < 0.01,
  {
    message: 'Total price harus sama dengan quantity × unit price',
    path: ['totalPrice'],
  }
);

/**
 * Create Purchase Order input validation
 */
export const createPOInputSchema = z.object({
  projectId: requiredTextSchema,
  vendorId: requiredTextSchema,
  vendorName: requiredTextSchema,
  
  poDate: dateStringSchema,
  deliveryDate: dateStringSchema,
  paymentTerms: requiredTextSchema,
  
  items: z.array(poItemSchema).min(1, 'Minimal 1 item harus ditambahkan'),
  
  // Pricing
  subtotal: positiveNumberSchema,
  taxAmount: nonNegativeNumberSchema.default(0),
  discountAmount: nonNegativeNumberSchema.default(0),
  totalAmount: positiveNumberSchema,
  
  // Terms
  deliveryTerms: optionalTextSchema,
  notes: optionalDescriptionSchema,
  
  // Reference
  mrId: optionalTextSchema,
}).refine(
  (data) => new Date(data.deliveryDate) >= new Date(data.poDate),
  {
    message: 'Delivery date harus setelah atau sama dengan PO date',
    path: ['deliveryDate'],
  }
).refine(
  (data) => {
    const calculatedTotal = data.subtotal + data.taxAmount - data.discountAmount;
    return Math.abs(data.totalAmount - calculatedTotal) < 0.01;
  },
  {
    message: 'Total amount harus sama dengan subtotal + tax - discount',
    path: ['totalAmount'],
  }
);

// ============================================
// WAREHOUSE/INVENTORY SCHEMAS
// ============================================

/**
 * Inventory transaction validation
 */
export const inventoryTransactionSchema = z.object({
  materialCode: requiredTextSchema,
  transactionType: z.enum(['receipt', 'issue', 'adjustment', 'transfer']),
  quantity: positiveNumberSchema,
  unit: requiredTextSchema,
  
  // Reference
  referenceType: z.enum(['GR', 'MR', 'PO', 'adjustment', 'transfer']).optional(),
  referenceId: optionalTextSchema,
  
  // Location
  fromLocation: optionalTextSchema,
  toLocation: requiredTextSchema,
  
  // Metadata
  transactionDate: dateStringSchema,
  notes: optionalDescriptionSchema,
});

/**
 * Stock adjustment validation
 */
export const stockAdjustmentSchema = z.object({
  materialCode: requiredTextSchema,
  adjustmentType: z.enum(['increase', 'decrease']),
  quantity: positiveNumberSchema,
  reason: requiredTextSchema.max(200, 'Reason maksimal 200 karakter'),
  notes: optionalDescriptionSchema,
  approvedBy: optionalTextSchema,
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validate GR input with detailed error messages
 */
export function validateGRInput(input: unknown) {
  return createGRInputSchema.safeParse(input);
}

/**
 * Validate MR input with detailed error messages
 */
export function validateMRInput(input: unknown) {
  return createMRInputSchema.safeParse(input);
}

/**
 * Validate PO input with detailed error messages
 */
export function validatePOInput(input: unknown) {
  return createPOInputSchema.safeParse(input);
}

/**
 * Format validation errors for user-friendly display
 */
export function formatValidationErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
  });
}
