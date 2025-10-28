import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { projectService } from '../../api/projectService';

// Mock Firebase methods
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
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(),
}));

// Mock Firebase config
vi.mock('../../firebaseConfig', () => ({
  db: {},
  storage: {},
}));

// Mock utilities
vi.mock('../../utils/responseWrapper', () => {
  const originalModule = vi.importActual('../../utils/responseWrapper');
  return {
    ...originalModule,
    safeAsync: vi.fn().mockImplementation(async (fn) => {
      try {
        const result = await fn();
        return { success: true, data: result };
      } catch (error) {
        return { 
          success: false, 
          error: { 
            message: error.message || 'Unknown error',
            code: 'UNKNOWN_ERROR'
          } 
        };
      }
    }),
  };
});

vi.mock('../../utils/validators', () => ({
  validators: {
    isValidProjectId: vi.fn().mockReturnValue({ valid: true }),
    isValidId: vi.fn().mockReturnValue(true),
    isValidArray: vi.fn().mockReturnValue({ valid: true }),
    sanitizeString: vi.fn().mockImplementation((str) => str),
    isValidString: vi.fn().mockReturnValue({ valid: true }),
    isValidDate: vi.fn().mockReturnValue(true),
    isNonEmptyArray: vi.fn().mockReturnValue(true),
    isNonEmptyString: vi.fn().mockReturnValue(true),
    isValidEnum: vi.fn().mockReturnValue(true),
  },
  firebaseValidators: {
    isValidBatchSize: vi.fn().mockReturnValue({ valid: true }),
  },
}));

vi.mock('../../utils/retryWrapper', () => ({
  withRetry: vi.fn().mockImplementation(async (fn) => await fn()),
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    time: vi.fn(),
    timeEnd: vi.fn(),
  },
}));

// Mock file handling
const mockUploadBytes = vi.fn();
const mockGetDownloadURL = vi.fn();

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: mockUploadBytes,
  getDownloadURL: mockGetDownloadURL,
}));

describe('Project Management Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Project Retrieval Flow', () => {
    it('should successfully retrieve project by ID', async () => {
      // Arrange
      const projectId = 'project123';
      const mockProject = {
        id: projectId,
        name: 'Test Project',
        location: 'Jakarta',
        startDate: '2023-01-01',
        items: [],
        members: [],
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProject,
        id: projectId,
      });

      // Act
      const result = await projectService.getProjectById(projectId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProject);
      expect(mockGetDoc).toHaveBeenCalled();
    });

    it('should handle retrieval of non-existent project', async () => {
      // Arrange
      const projectId = 'nonexistent123';
      
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      // Act
      const result = await projectService.getProjectById(projectId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('Daily Report Management Flow', () => {
    it('should successfully add daily report to project', async () => {
      // Arrange
      const projectId = 'project123';
      const userId = 'user123';
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'user@example.com',
        roleId: 'project_manager',
      };
      
      const dailyReport = {
        date: '2023-01-01',
        weather: 'Cerah' as const,
        notes: 'Test report',
        workforce: [],
        workProgress: [],
        materialsConsumed: [],
        photos: [],
      };

      const mockDocRef = { id: 'report123' };
      mockAddDoc.mockResolvedValue(mockDocRef);
      mockUpdateDoc.mockResolvedValue(undefined);

      // Act
      const result = await projectService.addDailyReport(projectId, dailyReport, mockUser);

      // Assert
      expect(result.success).toBe(true);
      expect(mockAddDoc).toHaveBeenCalled();
      expect(mockUpdateDoc).toHaveBeenCalled(); // For audit log
    });

    it('should handle adding report with invalid project ID', async () => {
      // Arrange
      const projectId = '';
      const mockUser = {
        id: 'user123',
        name: 'Test User',
        email: 'user@example.com',
        roleId: 'project_manager',
      };
      
      const dailyReport = {
        date: '2023-01-01',
        weather: 'Cerah' as const,
        notes: 'Test report',
        workforce: [],
        workProgress: [],
        materialsConsumed: [],
        photos: [],
      };

      // Mock validation to fail
      vi.mocked(require('../../utils/validators').validators.isValidProjectId)
        .mockReturnValueOnce({ valid: false, errors: ['Invalid project ID'] });

      // Act
      const result = await projectService.addDailyReport(projectId, dailyReport, mockUser);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid project ID');
    });
  });

  describe('Purchase Order Management Flow', () => {
    it('should successfully create purchase order', async () => {
      // Arrange
      const projectId = 'project123';
      const userId = 'user123';
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'user@example.com',
        roleId: 'procurement',
      };
      
      const purchaseOrder = {
        prNumber: 'PR-001',
        items: [
          {
            materialName: 'Cement',
            quantity: 100,
            unit: 'bags',
            pricePerUnit: 50000,
            totalPrice: 5000000,
          }
        ],
        requester: 'user123',
        requestDate: '2023-01-01',
      };

      const mockDocRef = { id: 'po123' };
      mockAddDoc.mockResolvedValue(mockDocRef);
      mockUpdateDoc.mockResolvedValue(undefined);

      // Act
      const result = await projectService.addPurchaseOrder(projectId, purchaseOrder, mockUser);

      // Assert
      expect(result.success).toBe(true);
      expect(mockAddDoc).toHaveBeenCalled();
      expect(mockUpdateDoc).toHaveBeenCalled(); // For audit log
    });

    it('should successfully update purchase order status', async () => {
      // Arrange
      const projectId = 'project123';
      const poId = 'po123';
      const userId = 'user123';
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'user@example.com',
        roleId: 'project_manager',
      };
      
      const newStatus = 'Disetujui' as const;

      mockUpdateDoc.mockResolvedValue(undefined);

      // Act
      const result = await projectService.updatePOStatus(projectId, poId, newStatus, mockUser);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUpdateDoc).toHaveBeenCalled();
    });
  });

  describe('Document Management Flow', () => {
    it('should successfully add document to project', async () => {
      // Arrange
      const projectId = 'project123';
      const userId = 'user123';
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'user@example.com',
        roleId: 'project_manager',
      };
      
      const document = {
        name: 'Test Document',
        category: 'contract',
        uploadDate: '2023-01-01',
      };
      
      const mockFile = new File([''], 'test.pdf', { type: 'application/pdf' });
      
      const mockDocRef = { id: 'doc123' };
      mockAddDoc.mockResolvedValue(mockDocRef);
      mockUploadBytes.mockResolvedValue({ ref: {} });
      mockGetDownloadURL.mockResolvedValue('https://example.com/document.pdf');

      // Act
      const result = await projectService.addDocument(projectId, document, mockFile, mockUser);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUploadBytes).toHaveBeenCalled();
      expect(mockGetDownloadURL).toHaveBeenCalled();
      expect(mockAddDoc).toHaveBeenCalled();
    });
  });

  describe('Attendance Management Flow', () => {
    it('should successfully update attendance records', async () => {
      // Arrange
      const projectId = 'project123';
      const date = '2023-01-01';
      const userId = 'user123';
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'user@example.com',
        roleId: 'project_manager',
      };
      
      const updates: [string, any][] = [
        ['worker1', 'Hadir'],
        ['worker2', 'Izin'],
      ];
      
      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      
      mockWriteBatch.mockReturnValue(mockBatch);
      mockGetDocs.mockResolvedValue({ docs: [] });

      // Act
      const result = await projectService.updateAttendance(projectId, date, updates, mockUser);

      // Assert
      expect(result.success).toBe(true);
      expect(mockWriteBatch).toHaveBeenCalled();
      expect(mockBatch.set).toHaveBeenCalledTimes(updates.length);
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('Comment Management Flow', () => {
    it('should successfully add comment to daily report', async () => {
      // Arrange
      const projectId = 'project123';
      const reportId = 'report123';
      const content = 'This is a test comment';
      const userId = 'user123';
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'user@example.com',
        roleId: 'project_manager',
      };
      
      const mockDocRef = { id: 'comment123' };
      mockAddDoc.mockResolvedValue(mockDocRef);
      mockUpdateDoc.mockResolvedValue(undefined);

      // Act
      const result = await projectService.addCommentToDailyReport(projectId, reportId, content, mockUser);

      // Assert
      expect(result.success).toBe(true);
      expect(mockAddDoc).toHaveBeenCalled();
      expect(mockUpdateDoc).toHaveBeenCalled(); // For audit log
    });
  });

  describe('Real-time Updates Flow', () => {
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

  describe('Batch Operations Flow', () => {
    it('should successfully mark notifications as read', async () => {
      // Arrange
      const notificationIds = ['notif1', 'notif2', 'notif3'];
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
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Validation failed');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle database connection errors gracefully', async () => {
      // Arrange
      const projectId = 'project123';
      const errorMessage = 'Database connection failed';
      
      mockGetDoc.mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await projectService.getProjectById(projectId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe(errorMessage);
    });

    it('should handle concurrent operations properly', async () => {
      // Arrange
      const projectId = 'project123';
      const mockProject = {
        id: projectId,
        name: 'Test Project',
        location: 'Jakarta',
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProject,
        id: projectId,
      });

      // Act - Simulate concurrent calls
      const results = await Promise.all([
        projectService.getProjectById(projectId),
        projectService.getProjectById(projectId),
        projectService.getProjectById(projectId),
      ]);

      // Assert - All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockProject);
      });
    });
  });
});