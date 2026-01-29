/**
 * Project Service Unit Tests
 * Comprehensive tests for projectService CRUD operations and business logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { projectService } from './projectService';
import type { Project, Workspace, User } from '@/types';

// Mock Firebase modules
vi.mock('@/firebaseConfig', () => ({
  db: {},
  storage: {},
}));

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(),
    getDocs: vi.fn(),
    getDoc: vi.fn(),
    doc: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    onSnapshot: vi.fn(),
    serverTimestamp: vi.fn(() => new Date()),
    orderBy: vi.fn(),
    writeBatch: vi.fn(),
  };
});

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));

// Mock utilities
vi.mock('@/utils/validators', () => ({
  validators: {
    isValidProjectId: vi.fn((id: string) => ({ valid: !!id, errors: [] })),
    isValidId: vi.fn((id: string) => !!id),
  },
  firebaseValidators: {
    validateProjectData: vi.fn(() => ({ valid: true, errors: [] })),
  },
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    time: vi.fn(),
    timeEnd: vi.fn(),
  },
}));

describe('projectService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getWorkspaces', () => {
    it('should fetch workspaces successfully', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const mockWorkspaces: Workspace[] = [
        {
          id: 'ws-1',
          name: 'Workspace 1',
          projects: [],
        },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockWorkspaces.map((ws) => ({
          id: ws.id,
          data: () => ws,
          exists: () => true,
        })),
      } as any);

      const result = await projectService.getWorkspaces();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].name).toBe('Workspace 1');
    });

    it('should handle errors when fetching workspaces', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      vi.mocked(getDocs).mockRejectedValue(new Error('Network error'));

      const result = await projectService.getWorkspaces();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('workspace');
    });

    it('should return empty array when no workspaces exist', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      vi.mocked(getDocs).mockResolvedValue({
        docs: [],
      } as any);

      const result = await projectService.getWorkspaces();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('getProjectById', () => {
    it('should fetch project by ID successfully', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      const mockProject: Project = {
        id: 'proj-123',
        name: 'Test Project',
        location: 'Test Location',
        startDate: '2024-01-01',
        items: [],
        members: [],
        dailyReports: [],
        attendances: [],
        expenses: [],
        documents: [],
        purchaseOrders: [],
        inventory: [],
        termins: [],
        auditLog: [],
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: mockProject.id,
        data: () => mockProject,
      } as any);

      const result = await projectService.getProjectById('proj-123');

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Test Project');
      expect(result.data?.id).toBe('proj-123');
    });

    it('should return error for non-existent project', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await projectService.getProjectById('non-existent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should validate project ID before fetching', async () => {
      const { validators } = await import('@/utils/validators');
      
      vi.mocked(validators.isValidProjectId).mockReturnValue({
        valid: false,
        errors: ['Invalid project ID format'],
      });

      const result = await projectService.getProjectById('');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });

    it('should handle Firebase errors gracefully', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      vi.mocked(getDoc).mockRejectedValue(new Error('Permission denied'));

      const result = await projectService.getProjectById('proj-123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getUserById', () => {
    it('should fetch user by ID successfully', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      const mockUser: User = {
        uid: 'firebase-uid-123',
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        roleId: 'role-admin',
        avatarUrl: '',
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: mockUser.id,
        data: () => mockUser,
      } as any);

      const result = await projectService.getUserById('user-123');

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('John Doe');
      expect(result.data?.email).toBe('john@example.com');
    });

    it('should return error for invalid user ID', async () => {
      const { validators } = await import('@/utils/validators');
      
      vi.mocked(validators.isValidId).mockReturnValue(false);

      const result = await projectService.getUserById('');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });
  });

  describe('getWorkers', () => {
    it('should fetch all workers successfully', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const mockWorkers = [
        { id: 'w1', name: 'Worker 1', position: 'Engineer' },
        { id: 'w2', name: 'Worker 2', position: 'Foreman' },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockWorkers.map((w) => ({
          id: w.id,
          data: () => w,
          exists: () => true,
        })),
      } as any);

      const result = await projectService.getWorkers();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].name).toBe('Worker 1');
    });

    it('should handle empty worker list', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      vi.mocked(getDocs).mockResolvedValue({
        docs: [],
      } as any);

      const result = await projectService.getWorkers();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('addDailyReport', () => {
    it('should add daily report successfully', async () => {
      const { addDoc, updateDoc } = await import('firebase/firestore');
      
      const reportData = {
        date: '2024-01-15',
        weather: 'Cerah' as const,
        workProgress: [],
        workforce: [],
        materialsConsumed: [],
        photos: [],
        notes: 'No issues',
      };

      const mockDocRef = { id: 'report-123' };
      const mockUser = { id: 'user-123', name: 'Test User' } as User;
      
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await projectService.addDailyReport('proj-123', reportData as any, mockUser);

      expect(result.success).toBe(true);
      expect(addDoc).toHaveBeenCalled();
    });

    it('should validate project ID before adding report', async () => {
      const { validators } = await import('@/utils/validators');
      
      vi.mocked(validators.isValidProjectId).mockReturnValue({
        valid: false,
        errors: ['Invalid ID'],
      });

      const mockUser = { id: 'user-123', name: 'Test User' } as User;
      const result = await projectService.addDailyReport('', {} as any, mockUser);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });

    it('should handle Firebase errors during report creation', async () => {
      const { addDoc } = await import('firebase/firestore');
      
      vi.mocked(addDoc).mockRejectedValue(new Error('Firestore error'));

      const reportData = {
        date: '2024-01-15',
        weather: 'Cerah' as const,
        workProgress: [],
        workforce: [],
        materialsConsumed: [],
        photos: [],
        notes: '',
      };

      const mockUser = { id: 'user-123', name: 'Test User' } as User;
      const result = await projectService.addDailyReport('proj-123', reportData as any, mockUser);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('addPurchaseOrder', () => {
    it('should add purchase order successfully', async () => {
      const { addDoc, updateDoc } = await import('firebase/firestore');
      
      const poData = {
        prNumber: 'PR-001',
        items: [
          {
            materialName: 'Cement',
            quantity: 10,
            unit: 'sak',
            pricePerUnit: 1000,
            totalPrice: 10000,
          },
        ],
        requester: 'user-123',
        requestDate: '2024-01-15',
      };

      const mockDocRef = { id: 'po-123' };
      const mockUser = { id: 'user-123', name: 'Test User' } as User;
      
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await projectService.addPurchaseOrder('proj-123', poData as any, mockUser);

      expect(result.success).toBe(true);
      expect(addDoc).toHaveBeenCalled();
    });

    it('should validate PO data before creation', async () => {
      const { validators } = await import('@/utils/validators');
      
      vi.mocked(validators.isValidProjectId).mockReturnValue({
        valid: false,
        errors: ['Invalid project ID'],
      });

      const mockUser = { id: 'user-123', name: 'Test User' } as User;
      const result = await projectService.addPurchaseOrder('', {} as any, mockUser);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });
  });

  describe('updatePOStatus', () => {
    it('should update PO status successfully', async () => {
      const { getDoc, updateDoc } = await import('firebase/firestore');
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ status: 'Menunggu Persetujuan' }),
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const mockUser = { id: 'user-123', name: 'Test User' } as User;

      const result = await projectService.updatePOStatus(
        'proj-123',
        'po-123',
        'Disetujuan',
        mockUser
      );

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should return error for non-existent PO', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const mockUser = { id: 'user-123', name: 'Test User' } as User;

      const result = await projectService.updatePOStatus(
        'proj-123',
        'po-999',
        'Disetujuan',
        mockUser
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('updateAttendance', () => {
    it('should update attendance records successfully', async () => {
      const { writeBatch } = await import('firebase/firestore');
      
      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);

      const updates: [string, 'Hadir' | 'Sakit'][] = [
        ['w1', 'Hadir'],
        ['w2', 'Sakit'],
      ];
      const mockUser = { id: 'user-123', name: 'Test User' } as User;

      const result = await projectService.updateAttendance('proj-123', '2024-01-15', updates, mockUser);

      expect(result.success).toBe(true);
      expect(mockBatch.set).toHaveBeenCalledTimes(updates.length);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should validate project ID before updating attendance', async () => {
      const { validators } = await import('@/utils/validators');
      
      vi.mocked(validators.isValidProjectId).mockReturnValue({
        valid: false,
        errors: ['Invalid ID'],
      });

      const mockUser = { id: 'user-123', name: 'Test User' } as User;

      const result = await projectService.updateAttendance('', '2024-01-15', [], mockUser);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });

    it('should handle batch write errors', async () => {
      const { writeBatch } = await import('firebase/firestore');
      
      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockRejectedValue(new Error('Batch write failed')),
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);

      const updates: [string, 'Hadir'][] = [['w1', 'Hadir']];
      const mockUser = { id: 'user-123', name: 'Test User' } as User;

      const result = await projectService.updateAttendance('proj-123', '2024-01-15', updates, mockUser);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('markNotificationsAsRead', () => {
    it('should mark notifications as read successfully', async () => {
      const { writeBatch } = await import('firebase/firestore');
      
      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);

      const notificationIds = ['notif-1', 'notif-2', 'notif-3'];

      const result = await projectService.markNotificationsAsRead(notificationIds);

      expect(result.success).toBe(true);
      expect(mockBatch.update).toHaveBeenCalledTimes(notificationIds.length);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should handle empty notification IDs array', async () => {
      const result = await projectService.markNotificationsAsRead([]);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Validation failed');
    });

    it('should handle batch update errors', async () => {
      const { writeBatch } = await import('firebase/firestore');
      
      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockRejectedValue(new Error('Update failed')),
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);

      const result = await projectService.markNotificationsAsRead(['notif-1']);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('streamProjectById', () => {
    it('should setup project stream successfully', () => {
      const firestore = require('firebase/firestore');
      const mockUnsubscribe = vi.fn();
      vi.mocked(firestore.onSnapshot).mockReturnValue(mockUnsubscribe);

      const callback = vi.fn();
      const errorCallback = vi.fn();

      const unsubscribe = projectService.streamProjectById(
        'proj-123',
        callback,
        errorCallback
      );

      expect(typeof unsubscribe).toBe('function');
      expect(firestore.onSnapshot).toHaveBeenCalled();
    });

    it('should call error callback when project not found', () => {
      const firestore = require('firebase/firestore');
      
      const mockCallback = vi.fn((_, snapshotCallback) => {
        // Simulate snapshot with non-existent document
        snapshotCallback({ exists: () => false });
        return vi.fn();
      });
      vi.mocked(firestore.onSnapshot).mockImplementation(mockCallback as any);

      const callback = vi.fn();
      const errorCallback = vi.fn();

      projectService.streamProjectById('proj-999', callback, errorCallback);

      // Error callback should be called
      expect(errorCallback).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      vi.mocked(getDocs).mockRejectedValue(new Error('Network error'));

      const result = await projectService.getWorkspaces();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should provide meaningful error messages', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await projectService.getProjectById('missing-project');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBeTruthy();
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should log errors appropriately', async () => {
      const { logger } = await import('@/utils/logger');
      const { getDocs } = await import('firebase/firestore');
      
      const error = new Error('Test error');
      vi.mocked(getDocs).mockRejectedValue(error);

      await projectService.getWorkspaces();

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
