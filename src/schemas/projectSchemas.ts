/**
 * Project Management Form Validation Schemas
 * Zod schemas for projects, tasks, milestones, WBS
 */

import { z } from 'zod';

/**
 * Project Status Enum
 */
export const ProjectStatus = z.enum(['draft', 'active', 'on-hold', 'completed', 'cancelled']);

/**
 * Project Priority Enum
 */
export const ProjectPriority = z.enum(['low', 'medium', 'high', 'critical']);

/**
 * Create/Update Project Schema
 */
export const projectSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Project name must be at least 3 characters')
      .max(200, 'Project name is too long')
      .trim(),
    description: z
      .string()
      .min(10, 'Project description must be at least 10 characters')
      .max(5000, 'Project description is too long (max 5000 characters)')
      .trim(),
    status: ProjectStatus.default('draft'),
    priority: ProjectPriority.default('medium'),
    startDate: z.coerce.date({
      message: 'Start date is required',
    }),
    endDate: z.coerce.date({
      message: 'End date is required',
    }),
    budget: z
      .number({
        message: 'Budget is required',
      })
      .positive('Budget must be greater than 0')
      .max(1000000000000, 'Budget is too large'),
    currency: z
      .string()
      .length(3, 'Currency must be a 3-letter ISO code (e.g., USD, EUR, IDR)')
      .toUpperCase()
      .default('IDR'),
    clientName: z
      .string()
      .min(2, 'Client name is too short')
      .max(200, 'Client name is too long')
      .trim()
      .optional(),
    clientEmail: z
      .string()
      .email('Please enter a valid email address')
      .optional()
      .or(z.literal('')),
    location: z
      .string()
      .min(2, 'Location is too short')
      .max(300, 'Location is too long')
      .trim()
      .optional(),
    tags: z.array(z.string().trim()).max(20, 'Maximum 20 tags allowed').optional(),
    managerId: z.string().min(1, 'Project manager is required'),
    teamMemberIds: z.array(z.string()).min(1, 'At least one team member is required').optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export type ProjectFormData = z.infer<typeof projectSchema>;

/**
 * Task Status Enum
 */
export const TaskStatus = z.enum([
  'backlog',
  'todo',
  'in-progress',
  'review',
  'completed',
  'blocked',
]);

/**
 * Task Priority Enum
 */
export const TaskPriority = z.enum(['low', 'medium', 'high', 'urgent']);

/**
 * Create/Update Task Schema
 */
export const taskSchema = z.object({
  title: z
    .string()
    .min(3, 'Task title must be at least 3 characters')
    .max(200, 'Task title is too long')
    .trim(),
  description: z.string().max(5000, 'Description is too long (max 5000 characters)').optional(),
  status: TaskStatus.default('todo'),
  priority: TaskPriority.default('medium'),
  projectId: z.string().min(1, 'Project ID is required'),
  assignedTo: z.string().min(1, 'Assignee is required'),
  dueDate: z.coerce.date({
    message: 'Due date is required',
  }),
  estimatedHours: z
    .number()
    .positive('Estimated hours must be greater than 0')
    .max(10000, 'Estimated hours is too large')
    .optional(),
  actualHours: z
    .number()
    .nonnegative('Actual hours cannot be negative')
    .max(10000, 'Actual hours is too large')
    .optional(),
  tags: z.array(z.string().trim()).max(10, 'Maximum 10 tags allowed').optional(),
  parentTaskId: z.string().optional(),
  dependsOn: z.array(z.string()).optional(),
  completionPercentage: z
    .number()
    .min(0, 'Completion percentage must be between 0 and 100')
    .max(100, 'Completion percentage must be between 0 and 100')
    .default(0),
});

export type TaskFormData = z.infer<typeof taskSchema>;

/**
 * Milestone Schema
 */
export const milestoneSchema = z.object({
  name: z
    .string()
    .min(3, 'Milestone name must be at least 3 characters')
    .max(200, 'Milestone name is too long')
    .trim(),
  description: z.string().max(2000, 'Description is too long (max 2000 characters)').optional(),
  projectId: z.string().min(1, 'Project ID is required'),
  dueDate: z.coerce.date({
    message: 'Due date is required',
  }),
  status: z.enum(['pending', 'in-progress', 'completed', 'delayed']).default('pending'),
  isKeyMilestone: z.boolean().default(false),
  deliverables: z.array(z.string().trim()).optional(),
});

export type MilestoneFormData = z.infer<typeof milestoneSchema>;

/**
 * WBS (Work Breakdown Structure) Item Schema
 */
export const wbsItemSchema = z.object({
  code: z
    .string()
    .regex(/^\d+(\.\d+)*$/, 'WBS code must be in format: 1.2.3')
    .trim(),
  name: z
    .string()
    .min(3, 'WBS item name must be at least 3 characters')
    .max(200, 'WBS item name is too long')
    .trim(),
  description: z.string().max(2000, 'Description is too long').optional(),
  projectId: z.string().min(1, 'Project ID is required'),
  parentId: z.string().optional(),
  level: z
    .number()
    .int('Level must be an integer')
    .min(1, 'Level must be at least 1')
    .max(10, 'Maximum nesting level is 10'),
  budget: z.number().nonnegative('Budget cannot be negative').optional(),
  estimatedHours: z.number().nonnegative('Estimated hours cannot be negative').optional(),
  assignedTo: z.string().optional(),
});

export type WBSItemFormData = z.infer<typeof wbsItemSchema>;

/**
 * Time Log Schema
 */
export const timeLogSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  date: z.coerce.date({
    message: 'Date is required',
  }),
  hours: z
    .number({
      message: 'Hours are required',
    })
    .positive('Hours must be greater than 0')
    .max(24, 'Hours cannot exceed 24 in a day'),
  description: z
    .string()
    .min(5, 'Please provide a brief description of work done')
    .max(1000, 'Description is too long')
    .trim(),
  isBillable: z.boolean().default(true),
});

export type TimeLogFormData = z.infer<typeof timeLogSchema>;

/**
 * Project Filter Schema
 */
export const projectFilterSchema = z.object({
  status: z.array(ProjectStatus).optional(),
  priority: z.array(ProjectPriority).optional(),
  managerId: z.string().optional(),
  search: z.string().max(200).optional(),
  startDateFrom: z.coerce.date().optional(),
  startDateTo: z.coerce.date().optional(),
  tags: z.array(z.string()).optional(),
});

export type ProjectFilterData = z.infer<typeof projectFilterSchema>;

/**
 * Task Filter Schema
 */
export const taskFilterSchema = z.object({
  status: z.array(TaskStatus).optional(),
  priority: z.array(TaskPriority).optional(),
  assignedTo: z.string().optional(),
  projectId: z.string().optional(),
  search: z.string().max(200).optional(),
  dueDateFrom: z.coerce.date().optional(),
  dueDateTo: z.coerce.date().optional(),
  tags: z.array(z.string()).optional(),
  onlyOverdue: z.boolean().optional(),
});

export type TaskFilterData = z.infer<typeof taskFilterSchema>;

/**
 * Bulk Task Update Schema
 */
export const bulkTaskUpdateSchema = z.object({
  taskIds: z.array(z.string()).min(1, 'At least one task must be selected'),
  updates: z
    .object({
      status: TaskStatus.optional(),
      priority: TaskPriority.optional(),
      assignedTo: z.string().optional(),
      dueDate: z.coerce.date().optional(),
      tags: z.array(z.string()).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, 'At least one field must be updated'),
});

export type BulkTaskUpdateData = z.infer<typeof bulkTaskUpdateSchema>;

/**
 * Project Clone Schema
 */
export const projectCloneSchema = z.object({
  sourceProjectId: z.string().min(1, 'Source project ID is required'),
  newName: z
    .string()
    .min(3, 'New project name must be at least 3 characters')
    .max(200, 'New project name is too long')
    .trim(),
  cloneTasks: z.boolean().default(true),
  cloneDocuments: z.boolean().default(false),
  cloneTeam: z.boolean().default(true),
  startDate: z.coerce.date({
    message: 'New start date is required',
  }),
});

export type ProjectCloneData = z.infer<typeof projectCloneSchema>;

/**
 * Validate project data
 * Helper function for easy validation
 */
export function validateProject(data: unknown) {
  return projectSchema.safeParse(data);
}

/**
 * Validate task data
 */
export function validateTask(data: unknown) {
  return taskSchema.safeParse(data);
}

/**
 * Validate milestone data
 */
export function validateMilestone(data: unknown) {
  return milestoneSchema.safeParse(data);
}

/**
 * Validate WBS item data
 */
export function validateWBSItem(data: unknown) {
  return wbsItemSchema.safeParse(data);
}

/**
 * Purchase Order (PO) Item Schema
 */
export const poItemSchema = z.object({
  materialName: z.string().min(1, 'Material name is required'),
  quantity: z.number()
    .min(0.01, 'Quantity must be greater than 0')
    .or(z.string().transform((val) => parseFloat(val)).refine((val) => val > 0, 'Quantity must be greater than 0')),
  unit: z.string().min(1, 'Unit is required'),
  pricePerUnit: z.number()
    .min(0, 'Price must be 0 or greater')
    .or(z.string().transform((val) => parseFloat(val)).refine((val) => val >= 0, 'Price must be 0 or greater')),
  totalPrice: z.number().min(0, 'Total price must be 0 or greater'),
});

export type POItemFormData = z.infer<typeof poItemSchema>;

/**
 * Purchase Order Creation Schema
 */
export const purchaseOrderSchema = z.object({
  prNumber: z.string()
    .min(3, 'PR Number must be at least 3 characters')
    .max(50, 'PR Number is too long (max 50 characters)')
    .regex(/^[A-Z0-9-]+$/i, 'PR Number can only contain letters, numbers, and hyphens')
    .trim(),
  items: z.array(poItemSchema)
    .min(1, 'At least one item is required')
    .refine(
      (items) => items.every((item) => item.materialName && item.quantity > 0),
      'All items must have a material name and quantity greater than 0'
    ),
});

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

/**
 * Validate Purchase Order data
 */
export function validatePurchaseOrder(data: unknown) {
  return purchaseOrderSchema.safeParse(data);
}
