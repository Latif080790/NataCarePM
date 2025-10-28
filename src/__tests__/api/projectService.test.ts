import { describe, it, expect, beforeEach, vi } from 'vitest';
import { projectService } from '../../api/projectService';
import type { Project, Notification } from '../../types';

// Mock Firebase
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOnSnapshot = vi.fn();
const mockAddDoc = vi.fn();
const mockWriteBatch = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  query: mockQuery,
  where: mockWhere,
  onSnapshot: mockOnSnapshot,
  addDoc: mockAddDoc,
  writeBatch: mockWriteBatch,
}));

// Mock Firebase config
vi.mock('@/firebaseConfig', () => ({
  db: {},
  storage: {},
}));

// Mock utilities
vi.mock('../../utils/responseWrapper', () => ({
  APIResponse: vi.fn(),
  safeAsync: vi.fn().mockImplementation(async (fn) => {
    try {
      const result = await fn();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: { message: error.message } };
    }
  }),
  APIError: vi.fn(),
  ErrorCodes: {
    INVALID_INPUT: 'INVALID_INPUT',
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    NOT_FOUND: 'NOT_FOUND',
  },
}));

// Mock validators
vi.mock('../../utils/validators', () => ({
  validators: {
    isValidProjectId: vi.fn().mockReturnValue({ valid: true }),
    isValidId: vi.fn().mockReturnValue(true),
    isValidArray: vi.fn().mockReturnValue({ valid: true }),
    sanitizeString: vi.fn().mockImplementation((str) => str),
  },
  firebaseValidators: {},
}));

// Mock retry wrapper
vi.mock('../../utils/retryWrapper', () => ({
  withRetry: vi.fn().mockImplementation(async (fn) => await fn()),
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    time: vi.fn(),
    timeEnd: vi.fn(),
  },
}));

describe('projectService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('streamProjectById', () => {
    it('should setup project stream successfully', () => {
      // Arrange
      const projectId = 'project123';
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      
      mockOnSnapshot.mockReturnValue(mockUnsubscribe);

      // Act
      const unsubscribe = projectService.streamProjectById(projectId, mockCallback);

      // Assert
      expect(typeof unsubscribe).toBe('function');
      expect(mockOnSnapshot).toHaveBeenCalled();
    });

    it('should handle invalid project ID', () => {
      // Arrange
      const projectId = '';
      const mockCallback = vi.fn();
      
      // This would throw in real implementation

      // Act & Assert
      expect(() => {
        projectService.streamProjectById(projectId, mockCallback);
      }).not.toThrow(); // Should handle gracefully
    });
  });

  describe('streamNotifications', () => {
    it('should setup notifications stream successfully', () => {
      // Arrange
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      
      mockOnSnapshot.mockReturnValue(mockUnsubscribe);

      // Act
      const unsubscribe = projectService.streamNotifications(mockCallback);

      // Assert
      expect(typeof unsubscribe).toBe('function');
      expect(mockOnSnapshot).toHaveBeenCalled();
    });
  });

  describe('markNotificationsAsRead', () => {
    it('should mark notifications as read successfully', async () => {
      // Arrange
      const notificationIds = ['notif1', 'notif2'];
      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      
      mockWriteBatch.mockReturnValue(mockBatch);

      // Act
      const result = await projectService.markNotificationsAsRead(notificationIds);

      // Assert
      expect(result.success).toBe(true);
      expect(mockWriteBatch).toHaveBeenCalled();
      expect(mockBatch.update).toHaveBeenCalledTimes(notificationIds.length);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should handle empty notification IDs array', async () => {
      // Arrange
      const notificationIds: string[] = [];

      // Act
      const result = await projectService.markNotificationsAsRead(notificationIds);

      // Assert
      expect(result.success).toBe(false); // Should fail validation
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const notificationIds = ['notif1', 'notif2'];
      const errorMessage = 'Failed to mark notifications';
      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockRejectedValue(new Error(errorMessage)),
      };
      
      mockWriteBatch.mockReturnValue(mockBatch);

      // Act
      const result = await projectService.markNotificationsAsRead(notificationIds);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe(errorMessage);
    });
  });
});