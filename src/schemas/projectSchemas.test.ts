/**
 * Unit Tests for Project Schemas
 * Tests validation rules for tasks, projects, PO, milestones
 */

import { describe, it, expect } from 'vitest';
import {
  taskSchema,
  projectSchema,
  purchaseOrderSchema,
  poItemSchema,
  milestoneSchema,
  type TaskFormData,
  type ProjectFormData,
  type PurchaseOrderFormData,
} from '@/schemas/projectSchemas';

describe('projectSchemas', () => {
  describe('taskSchema', () => {
    it('should validate correct task data', () => {
      const validTask: TaskFormData = {
        title: 'Implement Login Feature',
        description: 'Create login page with email and password authentication',
        status: 'todo',
        priority: 'high',
        projectId: 'proj-123',
        assignedTo: 'user-456',
        dueDate: new Date('2025-12-31'),
        estimatedHours: 8,
        tags: ['frontend', 'auth'],
        completionPercentage: 0,
      };

      const result = taskSchema.safeParse(validTask);
      expect(result.success).toBe(true);
    });

    it('should reject task with short title', () => {
      const invalidTask = {
        title: 'AB',
        description: 'Valid description here',
        projectId: 'proj-123',
        assignedTo: 'user-456',
        dueDate: new Date('2025-12-31'),
      };

      const result = taskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
      if (!result.success) {
        const titleError = result.error.issues.find((i) => i.path.includes('title'));
        expect(titleError?.message).toContain('at least 3 characters');
      }
    });

    it('should reject task without assignee', () => {
      const invalidTask = {
        title: 'Valid Task Title',
        description: 'Valid description',
        projectId: 'proj-123',
        assignedTo: '',
        dueDate: new Date('2025-12-31'),
      };

      const result = taskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
      if (!result.success) {
        const assigneeError = result.error.issues.find((i) => i.path.includes('assignedTo'));
        expect(assigneeError).toBeDefined();
      }
    });

    it('should default status to todo', () => {
      const task = {
        title: 'Valid Task',
        projectId: 'proj-123',
        assignedTo: 'user-456',
        dueDate: new Date('2025-12-31'),
      };

      const result = taskSchema.safeParse(task);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('todo');
      }
    });

    it('should default priority to medium', () => {
      const task = {
        title: 'Valid Task',
        projectId: 'proj-123',
        assignedTo: 'user-456',
        dueDate: new Date('2025-12-31'),
      };

      const result = taskSchema.safeParse(task);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe('medium');
      }
    });

    it('should validate estimated hours within range', () => {
      const task = {
        title: 'Valid Task',
        projectId: 'proj-123',
        assignedTo: 'user-456',
        dueDate: new Date('2025-12-31'),
        estimatedHours: 100,
      };

      const result = taskSchema.safeParse(task);
      expect(result.success).toBe(true);
    });

    it('should reject negative estimated hours', () => {
      const task = {
        title: 'Valid Task',
        projectId: 'proj-123',
        assignedTo: 'user-456',
        dueDate: new Date('2025-12-31'),
        estimatedHours: -5,
      };

      const result = taskSchema.safeParse(task);
      expect(result.success).toBe(false);
    });

    it('should validate completion percentage 0-100', () => {
      const task = {
        title: 'Valid Task',
        projectId: 'proj-123',
        assignedTo: 'user-456',
        dueDate: new Date('2025-12-31'),
        completionPercentage: 50,
      };

      const result = taskSchema.safeParse(task);
      expect(result.success).toBe(true);
    });

    it('should reject completion percentage > 100', () => {
      const task = {
        title: 'Valid Task',
        projectId: 'proj-123',
        assignedTo: 'user-456',
        dueDate: new Date('2025-12-31'),
        completionPercentage: 150,
      };

      const result = taskSchema.safeParse(task);
      expect(result.success).toBe(false);
    });
  });

  describe('projectSchema', () => {
    it('should validate correct project data', () => {
      const validProject: ProjectFormData = {
        name: 'Construction Project Alpha',
        description: 'Major construction project for new office building',
        status: 'active',
        priority: 'high',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        budget: 1000000,
        currency: 'IDR',
        clientName: 'ABC Corporation',
        clientEmail: 'client@abc.com',
        location: 'Jakarta, Indonesia',
        managerId: 'mgr-123',
        tags: ['construction', 'office'],
      };

      const result = projectSchema.safeParse(validProject);
      expect(result.success).toBe(true);
    });

    it('should reject if end date is before start date', () => {
      const invalidProject = {
        name: 'Test Project',
        description: 'Valid description',
        startDate: new Date('2025-12-31'),
        endDate: new Date('2025-01-01'),
        budget: 100000,
        managerId: 'mgr-123',
      };

      const result = projectSchema.safeParse(invalidProject);
      expect(result.success).toBe(false);
      if (!result.success) {
        const dateError = result.error.issues.find((i) => i.path.includes('endDate'));
        expect(dateError?.message).toContain('after start date');
      }
    });

    it('should default currency to IDR', () => {
      const project = {
        name: 'Test Project',
        description: 'Valid description',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        budget: 100000,
        managerId: 'mgr-123',
      };

      const result = projectSchema.safeParse(project);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe('IDR');
      }
    });

    it('should reject negative budget', () => {
      const invalidProject = {
        name: 'Test Project',
        description: 'Valid description',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        budget: -1000,
        managerId: 'mgr-123',
      };

      const result = projectSchema.safeParse(invalidProject);
      expect(result.success).toBe(false);
    });

    it('should trim project name', () => {
      const project = {
        name: '  Test Project  ',
        description: 'Valid description',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        budget: 100000,
        managerId: 'mgr-123',
      };

      const result = projectSchema.safeParse(project);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test Project');
      }
    });

    it('should validate email format for clientEmail', () => {
      const project = {
        name: 'Test Project',
        description: 'Valid description',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        budget: 100000,
        managerId: 'mgr-123',
        clientEmail: 'invalid-email',
      };

      const result = projectSchema.safeParse(project);
      expect(result.success).toBe(false);
    });
  });

  describe('purchaseOrderSchema', () => {
    it('should validate correct PO data', () => {
      const validPO: PurchaseOrderFormData = {
        prNumber: 'PR-00123',
        items: [
          {
            materialName: 'Cement',
            quantity: 100,
            unit: 'kg',
            pricePerUnit: 50000,
            totalPrice: 5000000,
          },
          {
            materialName: 'Steel',
            quantity: 50,
            unit: 'kg',
            pricePerUnit: 100000,
            totalPrice: 5000000,
          },
        ],
      };

      const result = purchaseOrderSchema.safeParse(validPO);
      expect(result.success).toBe(true);
    });

    it('should reject invalid PR number format', () => {
      const invalidPO = {
        prNumber: 'PR@#$',
        items: [
          {
            materialName: 'Cement',
            quantity: 100,
            unit: 'kg',
            pricePerUnit: 50000,
            totalPrice: 5000000,
          },
        ],
      };

      const result = purchaseOrderSchema.safeParse(invalidPO);
      expect(result.success).toBe(false);
      if (!result.success) {
        const prError = result.error.issues.find((i) => i.path.includes('prNumber'));
        expect(prError?.message).toContain('letters, numbers, and hyphens');
      }
    });

    it('should reject PO with empty items array', () => {
      const invalidPO = {
        prNumber: 'PR-00123',
        items: [],
      };

      const result = purchaseOrderSchema.safeParse(invalidPO);
      expect(result.success).toBe(false);
      if (!result.success) {
        const itemsError = result.error.issues.find((i) => i.path.includes('items'));
        // Match actual error message from schema
        expect(itemsError?.message).toContain('At least one item is required');
      }
    });

    it('should reject item with zero quantity', () => {
      const invalidPO = {
        prNumber: 'PR-00123',
        items: [
          {
            materialName: 'Cement',
            quantity: 0,
            unit: 'kg',
            pricePerUnit: 50000,
            totalPrice: 0,
          },
        ],
      };

      const result = purchaseOrderSchema.safeParse(invalidPO);
      expect(result.success).toBe(false);
    });

    it('should accept string quantities and convert to number', () => {
      const po = {
        prNumber: 'PR-00123',
        items: [
          {
            materialName: 'Cement',
            quantity: '100',
            unit: 'kg',
            pricePerUnit: '50000',
            totalPrice: 5000000,
          },
        ],
      };

      const result = purchaseOrderSchema.safeParse(po);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.items[0].quantity).toBe('number');
        expect(result.data.items[0].quantity).toBe(100);
      }
    });
  });

  describe('poItemSchema', () => {
    it('should validate correct PO item', () => {
      const validItem = {
        materialName: 'Cement',
        quantity: 100,
        unit: 'kg',
        pricePerUnit: 50000,
        totalPrice: 5000000,
      };

      const result = poItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('should reject item without material name', () => {
      const invalidItem = {
        materialName: '',
        quantity: 100,
        unit: 'kg',
        pricePerUnit: 50000,
        totalPrice: 5000000,
      };

      const result = poItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('should reject negative price', () => {
      const invalidItem = {
        materialName: 'Cement',
        quantity: 100,
        unit: 'kg',
        pricePerUnit: -1000,
        totalPrice: -100000,
      };

      const result = poItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });
  });

  describe('milestoneSchema', () => {
    it('should validate correct milestone', () => {
      const validMilestone = {
        name: 'Foundation Complete',
        description: 'Complete all foundation work',
        projectId: 'proj-123',
        dueDate: new Date('2025-06-30'),
        status: 'pending',
        isKeyMilestone: true,
      };

      const result = milestoneSchema.safeParse(validMilestone);
      expect(result.success).toBe(true);
    });

    it('should default status to pending', () => {
      const milestone = {
        name: 'Foundation Complete',
        projectId: 'proj-123',
        dueDate: new Date('2025-06-30'),
      };

      const result = milestoneSchema.safeParse(milestone);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('pending');
      }
    });

    it('should default isKeyMilestone to false', () => {
      const milestone = {
        name: 'Foundation Complete',
        projectId: 'proj-123',
        dueDate: new Date('2025-06-30'),
      };

      const result = milestoneSchema.safeParse(milestone);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isKeyMilestone).toBe(false);
      }
    });

    it('should reject milestone with short name', () => {
      const invalidMilestone = {
        name: 'AB',
        projectId: 'proj-123',
        dueDate: new Date('2025-06-30'),
      };

      const result = milestoneSchema.safeParse(invalidMilestone);
      expect(result.success).toBe(false);
    });
  });
});
