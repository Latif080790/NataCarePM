/**
 * Enhanced Task Service Unit Tests
 * Tests for dependency management, critical path calculation, and resource allocation
 */

import { EnhancedTaskService } from '../../api/taskService.enhanced';
import { createMockUser, createMockTask } from '../../__mocks__/testDataFactory';
import { Task, User } from '../../types';
import { TaskDependency, ResourceAllocation } from '../../types/ai-resource.types';
import { describe, it, expect, beforeEach } from 'vitest';
import { vi } from 'vitest';

// Mock Firestore
const mockDoc = vi.fn();
const mockCollection = vi.fn();
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockWriteBatch = vi.fn();
const mockServerTimestamp = vi.fn();

// Mock Firebase functions
vi.mock('@/firebaseConfig', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => mockDoc(...args),
  collection: (...args: any[]) => mockCollection(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
  orderBy: (...args: any[]) => mockOrderBy(...args),
  writeBatch: (...args: any[]) => mockWriteBatch(...args),
  serverTimestamp: (...args: any[]) => mockServerTimestamp(...args),
}));

// Mock projectService
vi.mock('../../api/projectService', () => ({
  projectService: {
    addAuditLog: vi.fn().mockResolvedValue({ success: true, data: undefined })
  }
}));

// Mock utility functions
vi.mock('../../utils/responseWrapper', () => ({
  APIResponse: vi.fn(),
  APIError: vi.fn(),
  ErrorCodes: {
    INVALID_INPUT: 'INVALID_INPUT',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_FAILED: 'VALIDATION_FAILED'
  },
  safeAsync: vi.fn((fn) => fn())
}));

vi.mock('../../utils/retryWrapper', () => ({
  withRetry: vi.fn((fn) => fn())
}));

vi.mock('../../utils/validators', () => ({
  validators: {
    isValidProjectId: vi.fn().mockReturnValue({ valid: true }),
    isValidId: vi.fn().mockReturnValue(true),
    isValidString: vi.fn().mockReturnValue({ valid: true })
  }
}));

describe('EnhancedTaskService', () => {
  let mockUser: User;
  let mockTask: Task;
  const projectId = 'test-project-id';
  const taskId = 'test-task-id';

  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = createMockUser();
    mockTask = createMockTask();
    
    // Setup default mock returns
    mockDoc.mockReturnValue({ id: 'mock-doc-ref' });
    mockCollection.mockReturnValue({});
    mockQuery.mockReturnValue({});
    mockWhere.mockReturnValue({});
    mockOrderBy.mockReturnValue({});
    
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockTask,
      id: taskId
    });
    
    mockGetDocs.mockResolvedValue({
      docs: []
    });
    
    mockAddDoc.mockResolvedValue({
      id: 'new-doc-id'
    });
  });

  describe('addTaskDependency', () => {
    it('should add a task dependency successfully', async () => {
      const predecessorId = 'task-1';
      const successorId = 'task-2';
      const type = 'finish_to_start';
      const lagDays = 0;

      // Mock task documents
      const predecessorTask = createMockTask({ id: predecessorId });
      const successorTask = createMockTask({ id: successorId });
      
      mockGetDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => predecessorTask,
          id: predecessorId
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => successorTask,
          id: successorId
        });

      const result = await EnhancedTaskService.addTaskDependency(
        projectId,
        predecessorId,
        successorId,
        type,
        lagDays,
        mockUser
      );

      expect(result).toBeDefined();
      expect(mockAddDoc).toHaveBeenCalled();
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('should throw error when predecessor task not found', async () => {
      const predecessorId = 'task-1';
      const successorId = 'task-2';

      // Mock first task not found
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false
      });

      await expect(
        EnhancedTaskService.addTaskDependency(
          projectId,
          predecessorId,
          successorId,
          'finish_to_start',
          0,
          mockUser
        )
      ).rejects.toThrow('Predecessor task not found');
    });

    it('should throw error when successor task not found', async () => {
      const predecessorId = 'task-1';
      const successorId = 'task-2';

      // Mock first task found, second not found
      mockGetDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => createMockTask({ id: predecessorId }),
          id: predecessorId
        })
        .mockResolvedValueOnce({
          exists: () => false
        });

      await expect(
        EnhancedTaskService.addTaskDependency(
          projectId,
          predecessorId,
          successorId,
          'finish_to_start',
          0,
          mockUser
        )
      ).rejects.toThrow('Successor task not found');
    });
  });

  describe('removeTaskDependency', () => {
    it('should remove a task dependency successfully', async () => {
      const dependencyId = 'dependency-1';
      
      // Mock dependency document
      const mockDependency: TaskDependency = {
        predecessorTaskId: 'task-1',
        successorTaskId: 'task-2',
        dependencyType: 'finish_to_start',
        lagTime: 0
      };

      mockGetDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockDependency,
          id: dependencyId
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => createMockTask({ id: 'task-2' }),
          id: 'task-2'
        });

      await EnhancedTaskService.removeTaskDependency(projectId, dependencyId, mockUser);

      expect(mockDeleteDoc).toHaveBeenCalled();
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('should throw error when dependency not found', async () => {
      const dependencyId = 'dependency-1';

      mockGetDoc.mockResolvedValueOnce({
        exists: () => false
      });

      await expect(
        EnhancedTaskService.removeTaskDependency(projectId, dependencyId, mockUser)
      ).rejects.toThrow('Dependency not found');
    });
  });

  describe('getTaskDependencies', () => {
    it('should get task dependencies successfully', async () => {
      const taskId = 'task-1';
      
      // Mock dependencies
      const mockDependencies: TaskDependency[] = [
        {
          predecessorTaskId: 'task-1',
          successorTaskId: 'task-2',
          dependencyType: 'finish_to_start',
          lagTime: 0
        }
      ];

      mockGetDocs
        .mockResolvedValueOnce({
          docs: [{
            data: () => mockDependencies[0],
            id: 'dep-1'
          }]
        })
        .mockResolvedValueOnce({
          docs: []
        });

      const result = await EnhancedTaskService.getTaskDependencies(projectId, taskId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('calculateCriticalPath', () => {
    it('should calculate critical path successfully', async () => {
      const tasks: Task[] = [
        createMockTask({ id: 'task-1', startDate: '2025-01-01', endDate: '2025-01-05' }),
        createMockTask({ id: 'task-2', startDate: '2025-01-06', endDate: '2025-01-10' })
      ];
      
      const dependencies: TaskDependency[] = [
        {
          predecessorTaskId: 'task-1',
          successorTaskId: 'task-2',
          dependencyType: 'finish_to_start',
          lagTime: 0
        }
      ];

      const result = await EnhancedTaskService.calculateCriticalPath(projectId, tasks, dependencies);

      expect(result).toBeDefined();
      expect(result.criticalPath).toBeDefined();
      expect(result.criticalTasks).toBeDefined();
      expect(result.projectDuration).toBeDefined();
    });

    it('should handle tasks with no dependencies', async () => {
      const tasks: Task[] = [
        createMockTask({ id: 'task-1', startDate: '2025-01-01', endDate: '2025-01-05' }),
        createMockTask({ id: 'task-2', startDate: '2025-01-01', endDate: '2025-01-05' })
      ];
      
      const dependencies: TaskDependency[] = [];

      const result = await EnhancedTaskService.calculateCriticalPath(projectId, tasks, dependencies);

      expect(result).toBeDefined();
      expect(Array.isArray(result.criticalPath)).toBe(true);
      expect(Array.isArray(result.criticalTasks)).toBe(true);
    });
  });

  describe('allocateResource', () => {
    it('should allocate resource to task successfully', async () => {
      const taskId = 'task-1';
      const resourceId = 'resource-1';
      const allocatedUnits = 100;
      const startDate = '2025-01-01';
      const endDate = '2025-01-10';

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockTask,
        id: taskId
      });

      const result = await EnhancedTaskService.allocateResource(
        projectId,
        taskId,
        resourceId,
        allocatedUnits,
        startDate,
        endDate,
        mockUser
      );

      expect(result).toBeDefined();
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should throw error when task not found', async () => {
      const taskId = 'task-1';
      const resourceId = 'resource-1';
      const allocatedUnits = 100;
      const startDate = '2025-01-01';
      const endDate = '2025-01-10';

      mockGetDoc.mockResolvedValue({
        exists: () => false
      });

      await expect(
        EnhancedTaskService.allocateResource(
          projectId,
          taskId,
          resourceId,
          allocatedUnits,
          startDate,
          endDate,
          mockUser
        )
      ).rejects.toThrow('Task not found');
    });

    it('should throw error when start date is after end date', async () => {
      const taskId = 'task-1';
      const resourceId = 'resource-1';
      const allocatedUnits = 100;
      const startDate = '2025-01-10';
      const endDate = '2025-01-01';

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockTask,
        id: taskId
      });

      await expect(
        EnhancedTaskService.allocateResource(
          projectId,
          taskId,
          resourceId,
          allocatedUnits,
          startDate,
          endDate,
          mockUser
        )
      ).rejects.toThrow('Start date must be before end date');
    });
  });

  describe('getTaskResourceAllocations', () => {
    it('should get resource allocations for task successfully', async () => {
      const taskId = 'task-1';
      
      // Mock resource allocations
      const mockAllocations: ResourceAllocation[] = [
        {
          allocationId: 'alloc-1',
          resourceId: 'resource-1',
          resourceType: 'worker',
          projectId,
          taskId,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-10'),
          allocationPercentage: 100,
          estimatedCost: 1000,
          status: 'planned',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user-1'
        }
      ];

      mockGetDocs.mockResolvedValue({
        docs: [{
          data: () => mockAllocations[0],
          id: 'alloc-1'
        }]
      });

      const result = await EnhancedTaskService.getTaskResourceAllocations(projectId, taskId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('updateTaskSchedule', () => {
    it('should update task schedule successfully', async () => {
      const taskId = 'task-1';
      const updates = {
        startDate: '2025-01-01',
        endDate: '2025-01-10'
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockTask,
        id: taskId
      });

      await EnhancedTaskService.updateTaskSchedule(projectId, taskId, updates, mockUser);

      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('should throw error when task not found', async () => {
      const taskId = 'task-1';
      const updates = {
        startDate: '2025-01-01',
        endDate: '2025-01-10'
      };

      mockGetDoc.mockResolvedValue({
        exists: () => false
      });

      await expect(
        EnhancedTaskService.updateTaskSchedule(projectId, taskId, updates, mockUser)
      ).rejects.toThrow('Task not found');
    });
  });
});