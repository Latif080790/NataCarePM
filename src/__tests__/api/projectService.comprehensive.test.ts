import { describe, it, expect, beforeEach, vi } from 'vitest';
import { projectService } from '../../api/projectService';
import type { DailyReport, PurchaseOrder, Document, Attendance } from '../../types';

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
const mockServerTimestamp = vi.fn();

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
  serverTimestamp: mockServerTimestamp,
}));

// Mock Firebase Storage
const mockRef = vi.fn();
const mockUploadBytes = vi.fn();
const mockGetDownloadURL = vi.fn();

vi.mock('firebase/storage', () => ({
  ref: mockRef,
  uploadBytes: mockUploadBytes,
  getDownloadURL: mockGetDownloadURL,
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
      return { success: false, error: { message: (error as Error).message } };
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
    isValidDate: vi.fn().mockReturnValue(true),
    isNonEmptyString: vi.fn().mockReturnValue(true),
    isNonEmptyArray: vi.fn().mockReturnValue(true),
    isValidString: vi.fn().mockReturnValue({ valid: true }),
    sanitizeString: vi.fn().mockImplementation((str) => str),
    isValidEnum: vi.fn().mockReturnValue(true),
  },
  firebaseValidators: {
    isValidBatchSize: vi.fn().mockReturnValue({ valid: true }),
  },
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

describe('projectService - Comprehensive Tests', () => {
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

  describe('getWorkspaces', () => {
    it('should fetch workspaces successfully', async () => {
      // Arrange
      const mockProjects = [{ id: 'project1', name: 'Project 1' }];
      const mockSnapshot = {
        docs: [{
          id: 'project1',
          data: () => ({ name: 'Project 1' }),
        }]
      };
      
      mockGetDocs.mockResolvedValue(mockSnapshot);

      // Act
      const result = await projectService.getWorkspaces();

      // Assert
      expect(result.success).toBe(true);
      expect(mockGetDocs).toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const errorMessage = 'Failed to fetch workspaces';
      mockGetDocs.mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await projectService.getWorkspaces();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe(errorMessage);
    });
  });

  describe('getProjectById', () => {
    it('should fetch project by ID successfully', async () => {
      // Arrange
      const projectId = 'project123';
      const mockProject = { id: projectId, name: 'Test Project' };
      const mockDocSnapshot = {
        exists: () => true,
        data: () => mockProject,
      };
      
      mockGetDoc.mockResolvedValue(mockDocSnapshot);

      // Act
      const result = await projectService.getProjectById(projectId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProject);
      expect(mockGetDoc).toHaveBeenCalled();
    });

    it('should handle project not found', async () => {
      // Arrange
      const projectId = 'nonexistent';
      const mockDocSnapshot = {
        exists: () => false,
      };
      
      mockGetDoc.mockResolvedValue(mockDocSnapshot);

      // Act
      const result = await projectService.getProjectById(projectId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('addDailyReport', () => {
    it('should add daily report successfully', async () => {
      // Arrange
      const projectId = 'project123';
      const reportData: Omit<DailyReport, 'id' | 'comments'> = {
        date: '2023-01-01',
        weather: 'Cerah',
        notes: 'Test notes',
        workforce: [],
        workProgress: [],
        materialsConsumed: [],
        photos: [],
      };
      const user = { id: 'user1', name: 'Test User' } as any;
      const mockDocRef = { id: 'report123' };
      
      mockAddDoc.mockResolvedValue(mockDocRef);

      // Act
      const result = await projectService.addDailyReport(projectId, reportData, user);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe('report123');
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should handle invalid date', async () => {
      // Arrange
      const projectId = 'project123';
      const reportData: Omit<DailyReport, 'id' | 'comments'> = {
        date: 'invalid-date',
        weather: 'Cerah',
        notes: 'Test notes',
        workforce: [],
        workProgress: [],
        materialsConsumed: [],
        photos: [],
      };
      const user = { id: 'user1', name: 'Test User' } as any;
      
      // Mock validator to return invalid
      vi.mocked(require('../../utils/validators').validators.isValidDate).mockReturnValue(false);

      // Act
      const result = await projectService.addDailyReport(projectId, reportData, user);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });
  });

  describe('updatePOStatus', () => {
    it('should update PO status successfully', async () => {
      // Arrange
      const projectId = 'project123';
      const poId = 'po123';
      const status: PurchaseOrder['status'] = 'Disetujuan';
      const user = { id: 'user1', name: 'Test User' } as any;
      const mockDocRef = {};
      const mockDocSnapshot = {
        data: () => ({ prNumber: 'PR-001' }),
      };
      
      mockDoc.mockReturnValue(mockDocRef);
      mockGetDoc.mockResolvedValue(mockDocSnapshot);

      // Act
      const result = await projectService.updatePOStatus(projectId, poId, status, user);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('should handle invalid status', async () => {
      // Arrange
      const projectId = 'project123';
      const poId = 'po123';
      const status = 'Invalid Status' as PurchaseOrder['status'];
      const user = { id: 'user1', name: 'Test User' } as any;
      
      // Mock validator to return invalid
      vi.mocked(require('../../utils/validators').validators.isValidEnum).mockReturnValue(false);

      // Act
      const result = await projectService.updatePOStatus(projectId, poId, status, user);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });
  });

  describe('addPurchaseOrder', () => {
    it('should add purchase order successfully', async () => {
      // Arrange
      const projectId = 'project123';
      const poData: Omit<PurchaseOrder, 'id' | 'status'> = {
        prNumber: 'PR-001',
        requestDate: '2023-01-01',
        requester: 'user1',
        vendorId: 'vendor1',
        items: [{ description: 'Item 1', quantity: 1, unit: 'pcs', materialName: 'Material', pricePerUnit: 100, totalPrice: 100 }],
      };
      const user = { id: 'user1', name: 'Test User' } as any;
      const mockDocRef = { id: 'po123' };
      
      mockAddDoc.mockResolvedValue(mockDocRef);

      // Act
      const result = await projectService.addPurchaseOrder(projectId, poData, user);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe('po123');
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should handle empty items', async () => {
      // Arrange
      const projectId = 'project123';
      const poData: Omit<PurchaseOrder, 'id' | 'status'> = {
        prNumber: 'PR-001',
        requestDate: '2023-01-01',
        requester: 'user1',
        vendorId: 'vendor1',
        items: [],
      };
      const user = { id: 'user1', name: 'Test User' } as any;
      
      // Mock validator to return false for empty array
      vi.mocked(require('../../utils/validators').validators.isNonEmptyArray).mockReturnValue(false);

      // Act
      const result = await projectService.addPurchaseOrder(projectId, poData, user);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });
  });

  describe('addDocument', () => {
    it('should add document successfully', async () => {
      // Arrange
      const projectId = 'project123';
      const docData: Omit<Document, 'id' | 'url'> = {
        name: 'Test Document',
        category: 'general',
        uploadDate: '2023-01-01',
      };
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const user = { id: 'user1', name: 'Test User' } as any;
      const mockUploadResult = { ref: {} };
      const mockUrl = 'https://example.com/test.pdf';
      const mockDocRef = { id: 'doc123' };
      
      mockUploadBytes.mockResolvedValue(mockUploadResult);
      mockGetDownloadURL.mockResolvedValue(mockUrl);
      mockAddDoc.mockResolvedValue(mockDocRef);

      // Act
      const result = await projectService.addDocument(projectId, docData, file, user);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe('doc123');
      expect(mockUploadBytes).toHaveBeenCalled();
      expect(mockGetDownloadURL).toHaveBeenCalled();
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should handle file size limit exceeded', async () => {
      // Arrange
      const projectId = 'project123';
      const docData: Omit<Document, 'id' | 'url'> = {
        name: 'Test Document',
        category: 'general',
        uploadDate: '2023-01-01',
      };
      // Create a large file (150MB)
      const largeFile = new File([new ArrayBuffer(150 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
      const user = { id: 'user1', name: 'Test User' } as any;

      // Act
      const result = await projectService.addDocument(projectId, docData, largeFile, user);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });
  });

  describe('updateAttendance', () => {
    it('should update attendance successfully', async () => {
      // Arrange
      const projectId = 'project123';
      const date = '2023-01-01';
      const updates: [string, Attendance['status']][] = [
        ['worker1', 'Hadir'],
        ['worker2', 'Alpa'],
      ];
      const user = { id: 'user1', name: 'Test User' } as any;
      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      const mockQuerySnapshot = {
        docs: [],
      };
      
      mockWriteBatch.mockReturnValue(mockBatch);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      // Act
      const result = await projectService.updateAttendance(projectId, date, updates, user);

      // Assert
      expect(result.success).toBe(true);
      expect(mockWriteBatch).toHaveBeenCalled();
      expect(mockBatch.set).toHaveBeenCalledTimes(updates.length);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should handle empty updates', async () => {
      // Arrange
      const projectId = 'project123';
      const date = '2023-01-01';
      const updates: [string, Attendance['status']][] = [];
      const user = { id: 'user1', name: 'Test User' } as any;
      
      // Mock validator to return false for empty array
      vi.mocked(require('../../utils/validators').validators.isNonEmptyArray).mockReturnValue(false);

      // Act
      const result = await projectService.updateAttendance(projectId, date, updates, user);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });
  });

  describe('addCommentToDailyReport', () => {
    it('should add comment to daily report successfully', async () => {
      // Arrange
      const projectId = 'project123';
      const reportId = 'report123';
      const content = 'Test comment';
      const user = { id: 'user1', name: 'Test User', avatarUrl: 'avatar.jpg' } as any;
      const mockDocRef = { id: 'comment123' };
      
      mockAddDoc.mockResolvedValue(mockDocRef);

      // Act
      const result = await projectService.addCommentToDailyReport(projectId, reportId, content, user);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe('comment123');
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should handle empty comment content', async () => {
      // Arrange
      const projectId = 'project123';
      const reportId = 'report123';
      const content = '';
      const user = { id: 'user1', name: 'Test User' } as any;
      
      // Mock validator to return invalid for empty string
      vi.mocked(require('../../utils/validators').validators.isValidString).mockReturnValue({ 
        valid: false, 
        errors: ['Content is required'] 
      });

      // Act
      const result = await projectService.addCommentToDailyReport(projectId, reportId, content, user);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_FAILED');
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