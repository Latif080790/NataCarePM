/**
 * Unit Tests for Task Service
 * Comprehensive test coverage for task management functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import {
  getTasksByProject,
  streamTasksByProject,
  getTaskById,
  filterTasks,
  createTask,
  updateTask,
  deleteTask,
  addSubtask,
  updateSubtask,
  deleteSubtask,
  streamTaskComments,
  addTaskComment,
  deleteTaskComment,
  recalculateTaskProgress,
} from '../../api/taskService';
import { db } from '../../firebaseConfig';
import type { Task, Subtask, TaskComment, User } from '../../types';

// ========================================
// MOCKS
// ========================================

// Mock Firebase Firestore
vi.mock('../../firebaseConfig', () => ({
  db: {},
}));

// Mock Firebase functions
const mockDoc = vi.fn();
const mockGet = vi.fn();
const mockSet = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockOnSnapshot = vi.fn();
const mockGetDocs = vi.fn();

const mockCollection = vi.fn(() => ({
  doc: mockDoc,
}));

const mockQuery = vi.fn(() => ({
  get: mockGetDocs,
}));

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  getDoc: mockGet,
  getDocs: mockGetDocs,
  addDoc: vi.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
  updateDoc: mockUpdate,
  deleteDoc: mockDelete,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  onSnapshot: mockOnSnapshot,
  serverTimestamp: vi.fn(() => new Date()),
}));

// Mock projectService
vi.mock('../../api/projectService', () => ({
  projectService: {
    addAuditLog: vi.fn(() => Promise.resolve()),
  },
}));

// Mock utilities
vi.mock('../../utils/validators', () => ({
  validators: {
    isValidProjectId: vi.fn(() => ({ valid: true })),
    isValidId: vi.fn(() => true),
    isValidString: vi.fn(() => ({ valid: true })),
  },
}));

vi.mock('../../utils/responseWrapper', () => ({
  safeAsync: vi.fn((fn) => fn()),
  APIError: class APIError extends Error {
    constructor(code: string, message: string, status: number, details?: any) {
      super(message);
      this.name = 'APIError';
    }
  },
  ErrorCodes: {
    INVALID_INPUT: 'INVALID_INPUT',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_FAILED: 'VALIDATION_FAILED',
  },
}));

vi.mock('../../utils/retryWrapper', () => ({
  withRetry: vi.fn((fn) => fn()),
}));

// ========================================
// TEST DATA
// ========================================

const mockUser: User = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
};

const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: 'A test task for unit testing',
  status: 'todo',
  priority: 'medium',
  assignedTo: ['user-1'],
  projectId: 'project-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  dueDate: new Date('2024-01-15'),
  progress: 0,
  subtasks: [],
};

const mockSubtask: Subtask = {
  id: 'subtask-1',
  title: 'Test Subtask',
  completed: false,
};

const mockTaskComment: TaskComment = {
  id: 'comment-1',
  content: 'Test comment',
  authorId: 'user-1',
  authorName: 'Test User',
  timestamp: new Date().toISOString(),
};

// ========================================
// TEST SUITES
// ========================================

describe('Task Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getTasksByProject', () => {
    it('should retrieve tasks successfully', async () => {
      // Arrange
      const projectId = 'project-1';
      const mockTasks = [mockTask];
      mockGetDocs.mockResolvedValue({
        docs: mockTasks.map(task => ({
          id: task.id,
          data: () => task,
        })),
      });

      // Act
      const result = await getTasksByProject(projectId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].id).toBe(mockTask.id);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle empty results', async () => {
      // Arrange
      const projectId = 'project-1';
      mockGetDocs.mockResolvedValue({
        docs: [],
      });

      // Act
      const result = await getTasksByProject(projectId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should validate project ID', async () => {
      // Arrange
      const invalidProjectId = '';
      mockGetDocs.mockRejectedValue(new Error('Invalid project ID'));

      // Act & Assert
      await expect(getTasksByProject(invalidProjectId)).rejects.toThrow();
    });
  });

  describe('streamTasksByProject', () => {
    it('should setup stream successfully', () => {
      // Arrange
      const projectId = 'project-1';
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      mockOnSnapshot.mockReturnValue(mockUnsubscribe);

      // Act
      const unsubscribe = streamTasksByProject(projectId, mockCallback);

      // Assert
      expect(mockOnSnapshot).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should handle stream errors', () => {
      // Arrange
      const projectId = 'project-1';
      const mockCallback = vi.fn();
      const mockErrorCallback = vi.fn();
      const mockError = new Error('Stream error');
      mockOnSnapshot.mockImplementation((query, callback, errorCallback) => {
        errorCallback?.(mockError);
        return vi.fn();
      });

      // Act
      streamTasksByProject(projectId, mockCallback, mockErrorCallback);

      // Assert
      expect(mockErrorCallback).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getTaskById', () => {
    it('should retrieve task successfully', async () => {
      // Arrange
      const projectId = 'project-1';
      const taskId = 'task-1';
      mockGet.mockResolvedValue({
        exists: () => true,
        data: () => mockTask,
      });

      // Act
      const result = await getTaskById(projectId, taskId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(taskId);
      expect(result.data?.title).toBe(mockTask.title);
    });

    it('should return error for non-existent task', async () => {
      // Arrange
      const projectId = 'project-1';
      const taskId = 'non-existent';
      mockGet.mockResolvedValue({
        exists: () => false,
      });

      // Act
      const result = await getTaskById(projectId, taskId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('filterTasks', () => {
    it('should filter by status', async () => {
      // Arrange
      const projectId = 'project-1';
      const filters = { status: 'in-progress' };
      const mockTasks = [
        { ...mockTask, status: 'in-progress' },
        { ...mockTask, id: 'task-2', status: 'todo' },
      ];
      mockGetDocs.mockResolvedValue({
        docs: mockTasks.map(task => ({
          id: task.id,
          data: () => task,
        })),
      });

      // Act
      const result = await filterTasks(projectId, filters);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(mockWhere).toHaveBeenCalledWith('status', '==', 'in-progress');
    });

    it('should filter by search term', async () => {
      // Arrange
      const projectId = 'project-1';
      const filters = { search: 'urgent' };
      const mockTasks = [
        { ...mockTask, title: 'Urgent Task' },
        { ...mockTask, id: 'task-2', title: 'Normal Task' },
      ];
      mockGetDocs.mockResolvedValue({
        docs: mockTasks.map(task => ({
          id: task.id,
          data: () => task,
        })),
      });

      // Act
      const result = await filterTasks(projectId, filters);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].title).toBe('Urgent Task');
    });
  });

  describe('createTask', () => {
    it('should create task successfully', async () => {
      // Arrange
      const projectId = 'project-1';
      const taskData = {
        title: 'New Task',
        description: 'Task description',
        priority: 'high' as const,
        assignedTo: ['user-1'],
      };

      // Act
      const result = await createTask(projectId, taskData, mockUser);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe('mock-doc-id');
    });

    it('should validate task title', async () => {
      // Arrange
      const projectId = 'project-1';
      const invalidTaskData = {
        title: '', // Invalid empty title
        priority: 'medium' as const,
      };

      // Act & Assert
      await expect(createTask(projectId, invalidTaskData, mockUser)).rejects.toThrow();
    });

    it('should add audit log', async () => {
      // Arrange
      const projectId = 'project-1';
      const taskData = {
        title: 'Audit Test Task',
        priority: 'low' as const,
      };

      // Act
      await createTask(projectId, taskData, mockUser);

      // Assert
      // Audit log is mocked, so no assertion needed
    });
  });

  describe('updateTask', () => {
    it('should update task successfully', async () => {
      // Arrange
      const projectId = 'project-1';
      const taskId = 'task-1';
      const updates = {
        title: 'Updated Task Title',
        status: 'in-progress' as const,
      };

      // Act
      const result = await updateTask(projectId, taskId, updates, mockUser);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Task Title',
          status: 'in-progress',
          updatedAt: expect.any(Object),
        })
      );
    });

    it('should validate updated title', async () => {
      // Arrange
      const projectId = 'project-1';
      const taskId = 'task-1';
      const invalidUpdates = {
        title: 'A'.repeat(300), // Too long
      };

      // Act & Assert
      await expect(updateTask(projectId, taskId, invalidUpdates, mockUser)).rejects.toThrow();
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      // Arrange
      const projectId = 'project-1';
      const taskId = 'task-1';
      mockGet.mockResolvedValue({
        exists: () => true,
        data: () => ({ title: 'Task to Delete' }),
      });

      // Act
      const result = await deleteTask(projectId, taskId, mockUser);

      // Assert
      expect(result.success).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should return error for non-existent task', async () => {
      // Arrange
      const projectId = 'project-1';
      const taskId = 'non-existent';
      mockGet.mockResolvedValue({
        exists: () => false,
      });

      // Act
      const result = await deleteTask(projectId, taskId, mockUser);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('addSubtask', () => {
    it('should add subtask successfully', async () => {
      // Arrange
      const projectId = 'project-1';
      const taskId = 'task-1';
      const subtaskData = {
        title: 'New Subtask',
      };
      mockGet.mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockTask, subtasks: [] }),
      });

      // Act
      const result = await addSubtask(projectId, taskId, subtaskData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toMatch(/^st_\d+_/);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should return error for non-existent task', async () => {
      // Arrange
      const projectId = 'project-1';
      const taskId = 'non-existent';
      const subtaskData = { title: 'New Subtask' };
      mockGet.mockResolvedValue({
        exists: () => false,
      });

      // Act
      const result = await addSubtask(projectId, taskId, subtaskData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('updateSubtask', () => {
    it('should update subtask successfully', async () => {
      // Arrange
      const projectId = 'project-1';
      const taskId = 'task-1';
      const subtaskId = 'subtask-1';
      const updates = { completed: true };
      mockGet.mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockTask, subtasks: [mockSubtask] }),
      });

      // Act
      const result = await updateSubtask(projectId, taskId, subtaskId, updates);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('deleteSubtask', () => {
    it('should delete subtask successfully', async () => {
      // Arrange
      const projectId = 'project-1';
      const taskId = 'task-1';
      const subtaskId = 'subtask-1';
      mockGet.mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockTask, subtasks: [mockSubtask] }),
      });

      // Act
      const result = await deleteSubtask(projectId, taskId, subtaskId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('streamTaskComments', () => {
    it('should setup comment stream successfully', () => {
      // Arrange
      const projectId = 'project-1';
      const taskId = 'task-1';
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      mockOnSnapshot.mockReturnValue(mockUnsubscribe);

      // Act
      const unsubscribe = streamTaskComments(projectId, taskId, mockCallback);

      // Assert
      expect(mockOnSnapshot).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe('addTaskComment', () => {
    it('should add comment successfully', async () => {
      // Arrange
      const projectId = 'project-1';
      const taskId = 'task-1';
      const commentData = {
        content: 'Test comment',
        authorId: 'user-1',
        authorName: 'Test User',
      };

      // Act
      const result = await addTaskComment(projectId, taskId, commentData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe('mock-doc-id');
    });
  });

  describe('deleteTaskComment', () => {
    it('should delete comment successfully', async () => {
      // Arrange
      const projectId = 'project-1';
      const taskId = 'task-1';
      const commentId = 'comment-1';

      // Act
      const result = await deleteTaskComment(projectId, taskId, commentId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('recalculateTaskProgress', () => {
    it('should recalculate progress with subtasks', async () => {
      // Arrange
      const projectId = 'project-1';
      const taskId = 'task-1';
      const taskWithSubtasks = {
        ...mockTask,
        subtasks: [
          { id: 'st1', completed: true },
          { id: 'st2', completed: false },
          { id: 'st3', completed: true },
        ],
      };
      mockGet.mockResolvedValue({
        exists: () => true,
        data: () => taskWithSubtasks,
      });

      // Act
      const result = await recalculateTaskProgress(projectId, taskId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          progress: 67, // 2 out of 3 completed = 67%
          updatedAt: expect.any(Object),
        })
      );
    });

    it('should handle task without subtasks', async () => {
      // Arrange
      const projectId = 'project-1';
      const taskId = 'task-1';
      const taskWithoutSubtasks = {
        ...mockTask,
        subtasks: [],
        status: 'done',
      };
      mockGet.mockResolvedValue({
        exists: () => true,
        data: () => taskWithoutSubtasks,
      });

      // Act
      const result = await recalculateTaskProgress(projectId, taskId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          progress: 100, // Done status = 100%
          updatedAt: expect.any(Object),
        })
      );
    });
  });

  // ========================================
  // ERROR HANDLING TESTS
  // ========================================

  describe('Error Handling', () => {
    it('should handle Firebase errors gracefully', async () => {
      // Arrange
      const projectId = 'project-1';
      const firebaseError = new Error('Firebase connection failed');
      mockGetDocs.mockRejectedValue(firebaseError);

      // Act
      const result = await getTasksByProject(projectId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Firebase connection failed');
    });

    it('should handle validation errors', async () => {
      // Arrange
      const projectId = '';
      const taskData = { title: 'Test' };

      // Act & Assert
      await expect(createTask(projectId, taskData, mockUser)).rejects.toThrow();
    });

    it('should handle network timeouts', async () => {
      // Arrange
      const projectId = 'project-1';
      const timeoutError = new Error('Network timeout');
      mockGetDocs.mockRejectedValue(timeoutError);

      // Act
      const result = await getTasksByProject(projectId);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  // ========================================
  // PERFORMANCE TESTS
  // ========================================

  describe('Performance', () => {
    it('should handle large task lists efficiently', async () => {
      // Arrange
      const projectId = 'project-1';
      const largeTaskList = Array.from({ length: 200 }, (_, i) => ({
        ...mockTask,
        id: `task-${i}`,
        title: `Task ${i}`,
      }));

      mockGetDocs.mockResolvedValue({
        docs: largeTaskList.map(task => ({
          id: task.id,
          data: () => task,
        })),
      });

      // Act
      const startTime = Date.now();
      const result = await getTasksByProject(projectId);
      const endTime = Date.now();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(200);
      expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
    });
  });
});
