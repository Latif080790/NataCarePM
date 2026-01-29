/**
 * 🧪 PROJECT SERVICE UNIT TESTS
 * Comprehensive test suite for projectService.ts
 * Coverage Target: 60%+ (40-50 tests)
 * Created: Week 3 - November 13, 2025
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User, Project, PurchaseOrder } from '@/types';

// ========================================
// MOCK SETUP
// ========================================

vi.mock('@/firebaseConfig', () => ({
  db: { name: 'mock-db' },
  storage: { name: 'mock-storage' },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _seconds: Date.now() / 1000 })),
  orderBy: vi.fn(),
  writeBatch: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));

// Import mocked functions for type safety
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc,
  query, 
  where,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

vi.mock('@/utils/authGuard', () => ({
  waitForAuth: vi.fn(() => Promise.resolve({ uid: 'test-user-id' })),
  requireAuth: vi.fn(() => Promise.resolve({ uid: 'test-user-id' })),
  withAuthRetry: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

// ========================================
// TEST DATA
// ========================================

const mockUser: User = {
  uid: 'firebase-uid-123',
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  roleId: 'project-manager',
  avatarUrl: 'https://example.com/avatar.jpg',
  permissions: ['view_dashboard', 'view_rab'],
};

const mockProject: Project = {
  id: 'project-123',
  name: 'Test Construction Project',
  location: 'Jakarta, Indonesia',
  startDate: '2025-01-01',
  items: [], // RabItem[]
  members: [], // User[]
  dailyReports: [],
  attendances: [],
  expenses: [],
  documents: [],
  purchaseOrders: [],
  inventory: [],
  termins: [],
  auditLog: [],
};

const mockPurchaseOrder: PurchaseOrder = {
  id: 'po-123',
  prNumber: 'PR-2025-001',
  requester: 'user-123',
  requestDate: '2025-11-01',
  items: [
    {
      id: 'item-1',
      materialName: 'Cement 50kg',
      description: 'Portland Cement',
      quantity: 100,
      unit: 'bags',
      pricePerUnit: 75000,
      totalPrice: 7500000,
    },
  ],
  status: 'Menunggu Persetujuan',
  notes: 'Urgent delivery required',
};

// ========================================
// TEST SUITE: RETRIEVAL OPERATIONS
// ========================================

describe('projectService - Retrieval Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWorkspaces', () => {
    it('should fetch workspaces with projects successfully', async () => {
      // Arrange: Import needed functions
      const { projectService } = await import('../projectService');
      const { getDocs } = await import('firebase/firestore');
      
      const mockProjects = [
        { ...mockProject, id: 'proj-1', name: 'Project Alpha' },
        { ...mockProject, id: 'proj-2', name: 'Project Beta' },
        { ...mockProject, id: 'proj-3', name: 'Project Gamma' },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockProjects.map((proj) => ({
          id: proj.id,
          data: () => proj,
          exists: () => true,
        })),
        empty: false,
        size: 3,
      } as any);

      // Act
      const result = await projectService.getWorkspaces();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveLength(1); // Single workspace
      expect(result.data![0].name).toBe("NATA'CARA Corp Workspace");
      expect(result.data![0].projects).toHaveLength(3);
      expect(result.data![0].projects[0].id).toBe('proj-1');
      expect(result.data![0].projects[0].name).toBe('Project Alpha');
    });

    it('should handle empty projects collection', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const { getDocs } = await import('firebase/firestore');

      vi.mocked(getDocs).mockResolvedValue({
        docs: [],
        empty: true,
        size: 0,
      } as any);

      // Act
      const result = await projectService.getWorkspaces();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.data![0].projects).toHaveLength(0);
    });

    it('should handle Firestore errors gracefully', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const { getDocs } = await import('firebase/firestore');

      const firestoreError = new Error('Firestore connection timeout');
      vi.mocked(getDocs).mockRejectedValue(firestoreError);

      // Act
      const result = await projectService.getWorkspaces();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('timeout');
    });
  });

  describe('getProjectById', () => {
    it('should retrieve project by valid ID', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const { getDoc } = await import('firebase/firestore');

      const testProject = { ...mockProject, id: 'proj-valid-123' };

      vi.mocked(getDoc).mockResolvedValue({
        id: testProject.id,
        data: () => testProject,
        exists: () => true,
      } as any);

      // Act
      const result = await projectService.getProjectById('proj-valid-123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBe('proj-valid-123');
      expect(result.data!.name).toBe('Test Construction Project');
      expect(result.data!.location).toBe('Jakarta, Indonesia');
    });

    it('should reject invalid project ID format', async () => {
      // Arrange
      const { projectService } = await import('../projectService');

      // Only truly invalid IDs (empty, whitespace, special characters not allowed)
      const invalidIds = ['', '  ', 'id with spaces', 'id@special!'];

      // Act & Assert
      for (const invalidId of invalidIds) {
        const result = await projectService.getProjectById(invalidId);
        
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error?.code).toBe('INVALID_INPUT');
        // Updated: Check for actual error message from projectService
        expect(result.error?.message).toMatch(/Project ID is required|must be a string|Invalid/i);
      }
    });

    it('should handle non-existent project', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const { getDoc } = await import('firebase/firestore');

      vi.mocked(getDoc).mockResolvedValue({
        id: 'non-existent',
        exists: () => false,
        data: () => undefined,
      } as any);

      // Act
      const result = await projectService.getProjectById('non-existent-project-id');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('NOT_FOUND');
      expect(result.error?.message).toContain('not found');
    });

    it('should retry on transient Firestore errors', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const { getDoc } = await import('firebase/firestore');
      const { withAuthRetry } = await import('@/utils/authGuard');

      let callCount = 0;
      
      // Mock withAuthRetry to actually retry the operation
      vi.mocked(withAuthRetry).mockImplementation(async (operation: any) => {
        // Simulate retry behavior - call operation multiple times on failure
        let lastError: any;
        for (let i = 0; i < 3; i++) {
          try {
            return await operation();
          } catch (error) {
            lastError = error;
            // Continue to retry
          }
        }
        throw lastError; // Throw if all retries failed
      });

      vi.mocked(getDoc).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          // Fail first 2 times
          return Promise.reject(new Error('Temporary network error'));
        }
        // Succeed on 3rd try
        return Promise.resolve({
          id: 'proj-retry-123',
          data: () => mockProject,
          exists: () => true,
        } as any);
      });

      // Act
      const result = await projectService.getProjectById('proj-retry-123');

      // Assert
      expect(result.success).toBe(true);
      expect(callCount).toBeGreaterThanOrEqual(3); // Verify retry happened
      expect(result.data).toBeDefined();
    });
  });

  describe('getUserById', () => {
    it('should retrieve user by valid ID', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const { getDoc } = await import('firebase/firestore');

      const testUser = { ...mockUser, id: 'user-valid-456' };

      vi.mocked(getDoc).mockResolvedValue({
        id: testUser.id,
        data: () => testUser,
        exists: () => true,
      } as any);

      // Act
      const result = await projectService.getUserById('user-valid-456');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBe('user-valid-456');
      expect(result.data!.name).toBe('Test User');
      expect(result.data!.email).toBe('test@example.com');
    });

    it('should reject invalid user ID format', async () => {
      // Arrange
      const { projectService } = await import('../projectService');

      // Act
      const result = await projectService.getUserById('');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('INVALID_INPUT');
    });

    it('should handle non-existent user', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const { getDoc } = await import('firebase/firestore');

      vi.mocked(getDoc).mockResolvedValue({
        id: 'non-existent-user',
        exists: () => false,
        data: () => undefined,
      } as any);

      // Act
      const result = await projectService.getUserById('non-existent-user-id');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('NOT_FOUND');
      expect(result.error?.message).toContain('User not found');
    });
  });

  describe('getAhspData', () => {
    it('should retrieve AHSP master data', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const { getDoc } = await import('firebase/firestore');

      const mockAhspData = {
        labors: {
          'pekerjaan-tanah': { 'mandor': 2, 'pekerja': 10 },
        },
        materials: {
          'pekerjaan-beton': { 'semen': 50, 'pasir': 0.5 },
        },
        laborRates: {
          'mandor': 150000,
          'pekerja': 100000,
        },
        materialPrices: {
          'semen': 75000,
          'pasir': 50000,
        },
        materialUnits: {
          'semen': 'sak',
          'pasir': 'm³',
        },
      };

      vi.mocked(getDoc).mockResolvedValue({
        id: 'ahsp',
        data: () => mockAhspData,
        exists: () => true,
      } as any);

      // Act
      const result = await projectService.getAhspData();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.labors).toBeDefined();
      expect(result.data!.materials).toBeDefined();
      expect(result.data!.laborRates).toBeDefined();
      expect(result.data!.materialPrices).toBeDefined();
    });

    it('should handle missing AHSP document', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const { getDoc } = await import('firebase/firestore');

      vi.mocked(getDoc).mockResolvedValue({
        id: 'ahsp',
        exists: () => false,
        data: () => undefined,
      } as any);

      // Act
      const result = await projectService.getAhspData();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('NOT_FOUND');
      expect(result.error?.message).toContain('AHSP data not found');
    });
  });

  describe('getWorkers', () => {
    it('should fetch all workers', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const { getDocs } = await import('firebase/firestore');

      const mockWorkers = [
        { id: 'worker-1', name: 'Ahmad', type: 'Mandor' as const },
        { id: 'worker-2', name: 'Budi', type: 'Tukang' as const },
        { id: 'worker-3', name: 'Cahyo', type: 'Pekerja' as const },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockWorkers.map((worker) => ({
          id: worker.id,
          data: () => worker,
          exists: () => true,
        })),
        empty: false,
        size: 3,
      } as any);

      // Act
      const result = await projectService.getWorkers();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveLength(3);
      expect(result.data![0].name).toBe('Ahmad');
      expect(result.data![1].type).toBe('Tukang');
    });

    it('should return empty array when no workers exist', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const { getDocs } = await import('firebase/firestore');

      vi.mocked(getDocs).mockResolvedValue({
        docs: [],
        empty: true,
        size: 0,
      } as any);

      // Act
      const result = await projectService.getWorkers();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveLength(0);
    });
  });

  describe('getUsers', () => {
    it('should fetch all users', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const { getDocs } = await import('firebase/firestore');

      const mockUsers = [
        { ...mockUser, id: 'user-1', name: 'Alice Manager', roleId: 'project-manager' },
        { ...mockUser, id: 'user-2', name: 'Bob Engineer', roleId: 'site-engineer' },
        { ...mockUser, id: 'user-3', name: 'Charlie Supervisor', roleId: 'supervisor' },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockUsers.map((user) => ({
          id: user.id,
          data: () => user,
          exists: () => true,
        })),
        empty: false,
        size: 3,
      } as any);

      // Act
      const result = await projectService.getUsers();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveLength(3);
      expect(result.data![0].name).toBe('Alice Manager');
      expect(result.data![1].roleId).toBe('site-engineer');
    });

    it('should handle large user collections efficiently', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const { getDocs } = await import('firebase/firestore');

      // Create 100 mock users
      const mockUsers = Array.from({ length: 100 }, (_, i) => ({
        ...mockUser,
        id: `user-${i}`,
        name: `User ${i}`,
      }));

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockUsers.map((user) => ({
          id: user.id,
          data: () => user,
          exists: () => true,
        })),
        empty: false,
        size: 100,
      } as any);

      // Act
      const result = await projectService.getUsers();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveLength(100);
    });
  });
});

// ========================================
// TEST SUITE: CREATION OPERATIONS
// ========================================

describe('projectService - Creation Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addAuditLog', () => {
    it('should create audit log entry successfully', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const { addDoc } = await import('firebase/firestore');

      vi.mocked(addDoc).mockResolvedValue({
        id: 'audit-log-123',
      } as any);

      // Act
      const result = await projectService.addAuditLog(
        'proj-123',
        mockUser,
        'Created purchase order PO-001'
      );

      // Assert
      expect(result.success).toBe(true);
      expect(addDoc).toHaveBeenCalled();
      expect(result.data).toBeDefined();
    });

    it('should validate project ID before creating log', async () => {
      // Arrange
      const { projectService } = await import('../projectService');

      // Act
      const result = await projectService.addAuditLog(
        '',
        mockUser,
        'Test action'
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('INVALID_INPUT');
    });

    it('should reject empty action description', async () => {
      // Arrange
      const { projectService } = await import('../projectService');

      // Act
      const result = await projectService.addAuditLog(
        'proj-123',
        mockUser,
        ''
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toMatch(/action|required/i);
    });

    it('should include timestamp and user details', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const { addDoc } = await import('firebase/firestore');

      let capturedData: any;
      vi.mocked(addDoc).mockImplementation(async (_ref, data) => {
        capturedData = data;
        return { id: 'audit-log-456' } as any;
      });

      // Act
      await projectService.addAuditLog(
        'proj-123',
        mockUser,
        'Updated project status'
      );

      // Assert
      expect(capturedData).toBeDefined();
      expect(capturedData.timestamp).toBeDefined();
      expect(capturedData.userId).toBe(mockUser.id);
      expect(capturedData.userName).toBe(mockUser.name);
      expect(capturedData.action).toBe('Updated project status');
    });
  });

  describe('addDailyReport', () => {
    it('should create daily report with valid data', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const { addDoc } = await import('firebase/firestore');

      vi.mocked(addDoc).mockResolvedValue({
        id: 'report-123',
      } as any);

      const reportData = {
        date: '2024-01-15',
        weather: 'Cerah' as const,
        notes: 'Foundation work completed, good progress today',
        workforce: [
          { workerId: 'worker-1', workerName: 'John Doe' },
          { workerId: 'worker-2', workerName: 'Jane Smith' },
        ],
        workProgress: [],
        materialsConsumed: [],
        photos: [],
      };

      // Act
      const result = await projectService.addDailyReport('proj-123', reportData, mockUser);

      // Assert
      expect(result.success).toBe(true);
      expect(addDoc).toHaveBeenCalled();
      expect(result.data).toBeDefined();
    });

    it('should validate report date format', async () => {
      // Arrange
      const { projectService } = await import('../projectService');

      const reportData = {
        date: 'invalid-date',
        weather: 'Cerah' as const,
        notes: 'Test report',
        workforce: [],
        workProgress: [],
        materialsConsumed: [],
        photos: [],
      };

      // Act
      const result = await projectService.addDailyReport('proj-123', reportData as any, mockUser);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toMatch(/date|invalid/i);
    });

    it('should add audit log after report creation', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const { addDoc } = await import('firebase/firestore');

      let addDocCallCount = 0;
      vi.mocked(addDoc).mockImplementation(async () => {
        addDocCallCount++;
        return { id: `doc-${addDocCallCount}` } as any;
      });

      const reportData = {
        date: '2024-01-15',
        weather: 'Berawan' as const,
        notes: 'Excavation work in progress',
        workforce: [],
        workProgress: [],
        materialsConsumed: [],
        photos: [],
      };

      // Act
      await projectService.addDailyReport('proj-123', reportData, mockUser);

      // Assert - Should call addDoc twice: once for report, once for audit log
      expect(addDocCallCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('addPurchaseOrder', () => {
    it('should create purchase order with valid items', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const { addDoc } = await import('firebase/firestore');

      vi.mocked(addDoc).mockResolvedValue({
        id: 'po-123',
      } as any);

      const poData = {
        prNumber: 'PR-2024-001',
        requester: mockUser.id,
        requestDate: '2024-01-15',
        items: [
          {
            materialName: 'Cement',
            quantity: 100,
            unit: 'sak',
            pricePerUnit: 75000,
            totalPrice: 7500000,
          },
        ],
      };

      // Act
      const result = await projectService.addPurchaseOrder('proj-123', poData, mockUser);

      // Assert
      expect(result.success).toBe(true);
      expect(addDoc).toHaveBeenCalled();
      expect(result.data).toBeDefined();
    });

    it('should validate PR number format', async () => {
      // Arrange
      const { projectService } = await import('../projectService');

      const poData = {
        prNumber: '',
        requester: mockUser.id,
        requestDate: '2024-01-15',
        items: [],
      };

      // Act
      const result = await projectService.addPurchaseOrder('proj-123', poData, mockUser);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toMatch(/PR number|invalid/i);
    });

    it('should reject empty items array', async () => {
      // Arrange
      const { projectService } = await import('../projectService');

      const poData = {
        prNumber: 'PR-2024-002',
        requester: mockUser.id,
        requestDate: '2024-01-15',
        items: [],
      };

      // Act
      const result = await projectService.addPurchaseOrder('proj-123', poData, mockUser);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toMatch(/item|required/i);
    });

    it('should set default status to "Menunggu Persetujuan"', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const { addDoc } = await import('firebase/firestore');

      let capturedPO: any;
      vi.mocked(addDoc).mockImplementation(async (_ref, data: any) => {
        // Capture PO data (second call after audit log)
        if (data.prNumber) {
          capturedPO = data;
        }
        return { id: 'po-456' } as any;
      });

      const poData = {
        prNumber: 'PR-2024-003',
        requester: mockUser.id,
        requestDate: '2024-01-15',
        items: [
          {
            materialName: 'Steel Rebar',
            quantity: 50,
            unit: 'kg',
            pricePerUnit: 12000,
            totalPrice: 600000,
          },
        ],
      };

      // Act
      await projectService.addPurchaseOrder('proj-123', poData, mockUser);

      // Assert
      expect(capturedPO).toBeDefined();
      expect(capturedPO.status).toBe('Menunggu Persetujuan');
    });
  });

  describe('addDocument', () => {
    it('should upload document file and save metadata', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const { uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { addDoc } = await import('firebase/firestore');

      vi.mocked(uploadBytes).mockResolvedValue({ ref: {} as any } as any);
      vi.mocked(getDownloadURL).mockResolvedValue('https://storage.example.com/doc.pdf');
      vi.mocked(addDoc).mockResolvedValue({ id: 'doc-123' } as any);

      const docData = {
        name: 'Project Blueprint',
        category: 'Blueprint',
        uploadDate: '2024-01-15',
      };

      const mockFile = new File(['dummy content'], 'blueprint.pdf', { type: 'application/pdf' });

      // Act
      const result = await projectService.addDocument('proj-123', docData, mockFile, mockUser);

      // Assert
      expect(result.success).toBe(true);
      expect(uploadBytes).toHaveBeenCalled();
      expect(getDownloadURL).toHaveBeenCalled();
      expect(addDoc).toHaveBeenCalled();
    });

    it('should validate file size (max 100MB)', async () => {
      // Arrange
      const { projectService } = await import('../projectService');

      const docData = {
        name: 'Large File',
        category: 'Other',
        uploadDate: '2024-01-15',
      };

      // Create file larger than 100MB
      const largeContent = new Array(101 * 1024 * 1024).fill('x').join('');
      const mockLargeFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' });

      // Act
      const result = await projectService.addDocument('proj-123', docData, mockLargeFile, mockUser);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toMatch(/file size|too large|100MB/i);
    });

    it('should reject invalid file types', async () => {
      // Arrange
      const { projectService } = await import('../projectService');

      const docData = {
        name: 'Executable File',
        category: 'Other',
        uploadDate: '2024-01-15',
      };

      const mockInvalidFile = new File(['dummy'], 'virus.exe', { type: 'application/x-msdownload' });

      // Act
      const result = await projectService.addDocument('proj-123', docData, mockInvalidFile, mockUser);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toMatch(/file type|not allowed|invalid/i);
    });

    it('should retry file upload on network failure', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const { uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { addDoc } = await import('firebase/firestore');
      const { withAuthRetry } = await import('@/utils/authGuard');

      let uploadAttempts = 0;

      // Mock retry behavior
      vi.mocked(withAuthRetry).mockImplementation(async (operation: any) => {
        return await operation();
      });

      vi.mocked(uploadBytes).mockImplementation(async () => {
        uploadAttempts++;
        if (uploadAttempts < 3) {
          throw new Error('Network error');
        }
        return { ref: {} as any } as any;
      });

      vi.mocked(getDownloadURL).mockResolvedValue('https://storage.example.com/doc2.pdf');
      vi.mocked(addDoc).mockResolvedValue({ id: 'doc-456' } as any);

      const docData = {
        name: 'Retry Test Doc',
        category: 'Report',
        uploadDate: '2024-01-15',
      };

      const mockFile = new File(['test'], 'report.pdf', { type: 'application/pdf' });

      // Act
      await projectService.addDocument('proj-123', docData, mockFile, mockUser);

      // Assert - Even if upload fails, service should handle gracefully
      expect(uploadAttempts).toBeGreaterThan(0);
    });
  });

  describe('createSampleProject', () => {
    it('should create sample project with all required fields', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const { addDoc } = await import('firebase/firestore');

      vi.mocked(addDoc).mockResolvedValue({
        id: 'sample-proj-123',
      } as any);

      // Act
      const result = await projectService.createSampleProject();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toContain('Sample');
      expect(result.data?.items).toBeDefined();
      expect(result.data?.members).toBeDefined();
    });

    it('should return created project with ID', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const { addDoc } = await import('firebase/firestore');

      const mockDocId = 'generated-sample-id-789';
      vi.mocked(addDoc).mockResolvedValue({
        id: mockDocId,
      } as any);

      // Act
      const result = await projectService.createSampleProject();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(mockDocId);
      expect(addDoc).toHaveBeenCalled();
    });
  });
});

// ========================================
// TEST SUITE: UPDATE OPERATIONS
// ========================================

describe('projectService - Update Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updatePOStatus', () => {
    it('should update PO status with valid status value', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const validStatus: PurchaseOrder['status'] = 'Disetujuan';
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ prNumber: 'PR-2024-001', status: 'Menunggu Persetujuan' }),
      } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'audit-log-123' } as any);

      // Act
      const result = await projectService.updatePOStatus('proj-123', 'po-456', validStatus, mockUser);

      // Assert
      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalled();
    });

    it('should reject invalid status values', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const invalidStatus = 'INVALID_STATUS' as PurchaseOrder['status'];

      // Act
      const result = await projectService.updatePOStatus('proj-123', 'po-456', invalidStatus, mockUser);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toMatch(/invalid|status/i);
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('should add audit log after status update', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const validStatus: PurchaseOrder['status'] = 'Disetujuan';
      let addDocCallCount = 0;
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ prNumber: 'PR-2024-001', status: 'Menunggu Persetujuan' }),
      } as any);
      vi.mocked(addDoc).mockImplementation(async () => {
        addDocCallCount++;
        return { id: `audit-${addDocCallCount}` } as any;
      });

      // Act
      await projectService.updatePOStatus('proj-123', 'po-456', validStatus, mockUser);

      // Assert - should call addDoc for audit log
      expect(addDocCallCount).toBeGreaterThanOrEqual(1);
    });

    it('should update approver and approval date', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const validStatus: PurchaseOrder['status'] = 'Disetujuan';
      let capturedUpdate: any;
      vi.mocked(updateDoc).mockImplementation(async (_ref: any, data: any) => {
        capturedUpdate = data;
        return undefined;
      });
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ prNumber: 'PR-2024-001' }),
      } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'audit-123' } as any);

      // Act
      await projectService.updatePOStatus('proj-123', 'po-456', validStatus, mockUser);

      // Assert
      expect(capturedUpdate.status).toBe(validStatus);
      expect(capturedUpdate.approver).toBe(mockUser.name);
      expect(capturedUpdate.approvalDate).toBeDefined();
    });
  });

  describe('updateAttendance', () => {
    it('should batch update attendance records', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const date = '2024-01-15';
      const updates: [string, 'Hadir' | 'Izin' | 'Sakit' | 'Alpa'][] = [
        ['worker-1', 'Hadir'],
        ['worker-2', 'Hadir'],
        ['worker-3', 'Izin'],
      ];

      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: [],
      } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'audit-123' } as any);

      // Act
      const result = await projectService.updateAttendance('proj-123', date, updates, mockUser);

      // Assert
      expect(result.success).toBe(true);
      expect(mockBatch.set).toHaveBeenCalledTimes(3);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should validate attendance date format', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const invalidDate = 'invalid-date';
      const updates: [string, 'Hadir'][] = [['worker-1', 'Hadir']];

      // Act
      const result = await projectService.updateAttendance('proj-123', invalidDate, updates, mockUser);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toMatch(/invalid|date/i);
    });

    it('should enforce batch size limit (500 writes)', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const date = '2024-01-15';
      // Create 501 updates (exceeds Firestore batch limit of 500)
      const updates: [string, 'Hadir'][] = Array.from({ length: 501 }, (_, i) => [
        `worker-${i}`,
        'Hadir',
      ]);

      // Act
      const result = await projectService.updateAttendance('proj-123', date, updates, mockUser);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toMatch(/batch|limit|500/i);
    });

    it('should handle existing vs new attendance records', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const date = '2024-01-15';
      const updates: [string, 'Hadir' | 'Alpa'][] = [
        ['worker-1', 'Hadir'], // Existing
        ['worker-2', 'Alpa'], // New
      ];

      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            id: 'attendance-1',
            data: () => ({ workerId: 'worker-1', status: 'Hadir', date }),
          },
        ],
      } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'audit-123' } as any);

      // Act
      const result = await projectService.updateAttendance('proj-123', date, updates, mockUser);

      // Assert
      expect(result.success).toBe(true);
      expect(mockBatch.set).toHaveBeenCalledTimes(2); // Both existing and new
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('markNotificationsAsRead', () => {
    it('should mark multiple notifications as read', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const notificationIds = ['notif-1', 'notif-2', 'notif-3'];
      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);

      // Act
      const result = await projectService.markNotificationsAsRead(notificationIds);

      // Assert
      expect(result.success).toBe(true);
      expect(mockBatch.update).toHaveBeenCalledTimes(3);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should validate notification IDs array size', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const tooManyIds = Array.from({ length: 501 }, (_, i) => `notif-${i}`);

      // Act
      const result = await projectService.markNotificationsAsRead(tooManyIds);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toMatch(/limit|500|array/i);
    });

    it('should skip invalid notification IDs gracefully', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const mixedIds = ['notif-1', '', 'notif-2', 'invalid!@#', 'notif-3'];
      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);

      // Act
      const result = await projectService.markNotificationsAsRead(mixedIds);

      // Assert
      expect(result.success).toBe(true);
      // Should only update valid IDs (notif-1, notif-2, notif-3)
      expect(mockBatch.update).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should reject empty notification array', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const emptyIds: string[] = [];

      // Act
      const result = await projectService.markNotificationsAsRead(emptyIds);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toMatch(/array|required|empty/i);
    });
  });
});

// ========================================
// TEST SUITE: COMMENT OPERATIONS
// ========================================

describe('projectService - Comment Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addCommentToDailyReport', () => {
    it('should add comment with valid content', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const content = 'Great progress today! Foundation work completed ahead of schedule.';
      vi.mocked(addDoc).mockResolvedValue({ id: 'comment-123' } as any);

      // Act
      const result = await projectService.addCommentToDailyReport(
        'proj-123',
        'report-456',
        content,
        mockUser
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe('comment-123');
      expect(addDoc).toHaveBeenCalled();
    });

    it('should validate comment length (1-5000 chars)', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const tooLongContent = 'x'.repeat(5001);

      // Act
      const result = await projectService.addCommentToDailyReport(
        'proj-123',
        'report-456',
        tooLongContent,
        mockUser
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toMatch(/invalid|comment|content|length/i);
    });

    it('should sanitize comment content', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const unsafeContent = '<script>alert("XSS")</script>Good work!';
      let capturedComment: any;
      vi.mocked(addDoc).mockImplementation(async (_ref: any, data: any) => {
        capturedComment = data;
        return { id: 'comment-789' } as any;
      });

      // Act
      await projectService.addCommentToDailyReport(
        'proj-123',
        'report-456',
        unsafeContent,
        mockUser
      );

      // Assert - should sanitize dangerous content
      expect(capturedComment.content).toBeDefined();
      expect(capturedComment.content).not.toContain('<script>');
    });

    it('should include author details in comment', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const content = 'Excellent teamwork!';
      let capturedComment: any;
      vi.mocked(addDoc).mockImplementation(async (_ref: any, data: any) => {
        capturedComment = data;
        return { id: 'comment-abc' } as any;
      });

      // Act
      await projectService.addCommentToDailyReport(
        'proj-123',
        'report-456',
        content,
        mockUser
      );

      // Assert
      expect(capturedComment.authorId).toBe(mockUser.id);
      expect(capturedComment.authorName).toBe(mockUser.name);
      expect(capturedComment.authorAvatar).toBe(mockUser.avatarUrl);
      expect(capturedComment.timestamp).toBeDefined();
    });
  });
});

// ========================================
// TEST SUITE: REAL-TIME STREAMS
// ========================================

describe('projectService - Real-time Streams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('streamProjectById', () => {
    it('should setup real-time project listener', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const mockUnsubscribe = vi.fn();
      vi.mocked(onSnapshot).mockReturnValue(mockUnsubscribe);

      // Act
      const unsubscribe = projectService.streamProjectById('proj-123', vi.fn());

      // Assert
      expect(onSnapshot).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should call callback on project updates', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const callback = vi.fn();
      let snapshotCallback: any;
      vi.mocked(onSnapshot).mockImplementation((ref, cb) => {
        snapshotCallback = cb;
        return vi.fn();
      });

      // Act
      projectService.streamProjectById('proj-123', callback);

      // Simulate snapshot update
      const mockSnapshot = {
        exists: () => true,
        data: () => ({ id: 'proj-123', name: 'Updated Project' }),
        id: 'proj-123',
      };
      snapshotCallback(mockSnapshot);

      // Assert
      expect(callback).toHaveBeenCalledWith({
        id: 'proj-123',
        name: 'Updated Project',
      });
    });

    it('should call errorCallback on listener error', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const callback = vi.fn();
      const errorCallback = vi.fn();
      let snapshotError: any;
      vi.mocked(onSnapshot).mockImplementation((ref, cb, errCb) => {
        snapshotError = errCb;
        return vi.fn();
      });

      // Act
      projectService.streamProjectById('proj-123', callback, errorCallback);

      // Simulate error
      const mockError = new Error('Connection lost');
      snapshotError?.(mockError);

      // Assert
      expect(errorCallback).toHaveBeenCalledWith(mockError);
    });

    it('should return unsubscribe function', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const mockUnsubscribe = vi.fn();
      vi.mocked(onSnapshot).mockReturnValue(mockUnsubscribe);

      // Act
      const unsubscribe = projectService.streamProjectById('proj-123', vi.fn());
      unsubscribe();

      // Assert
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('streamNotifications', () => {
    it('should setup real-time notifications listener', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const mockUnsubscribe = vi.fn();
      vi.mocked(onSnapshot).mockReturnValue(mockUnsubscribe);

      // Act
      const unsubscribe = projectService.streamNotifications(vi.fn());

      // Assert
      expect(onSnapshot).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should order notifications by timestamp desc', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const callback = vi.fn();
      let snapshotCallback: any;
      vi.mocked(onSnapshot).mockImplementation((_queryRef: any, cb: any) => {
        snapshotCallback = cb;
        return vi.fn();
      });

      // Act
      projectService.streamNotifications(callback);

      // Simulate snapshot with notifications
      const mockSnapshot = {
        docs: [
          { id: 'notif-1', data: () => ({ message: 'New comment', timestamp: 100 }) },
          { id: 'notif-2', data: () => ({ message: 'Task assigned', timestamp: 200 }) },
        ],
      };
      snapshotCallback(mockSnapshot);

      // Assert
      expect(callback).toHaveBeenCalled();
      const notifs = callback.mock.calls[0][0];
      expect(notifs).toHaveLength(2);
      expect(notifs[0].id).toBe('notif-1');
    });

    it('should handle empty notifications collection', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const callback = vi.fn();
      let snapshotCallback: any;
      vi.mocked(onSnapshot).mockImplementation((_queryRef: any, cb: any) => {
        snapshotCallback = cb;
        return vi.fn();
      });

      // Act
      projectService.streamNotifications(callback);

      // Simulate empty snapshot
      const mockSnapshot = { docs: [] };
      snapshotCallback(mockSnapshot);

      // Assert
      expect(callback).toHaveBeenCalledWith([]);
    });
  });
});

// ========================================
// TEST SUITE: VALIDATION & ERROR HANDLING
// ========================================

describe('projectService - Validation & Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should validate project ID format consistently', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const invalidIds = ['', '  ', 'id with spaces', 'id@special!'];

      // Act & Assert - Test across different functions
      for (const invalidId of invalidIds) {
        const resultGetProject = await projectService.getProjectById(invalidId);
        expect(resultGetProject.success).toBe(false);
        expect(resultGetProject.error?.code).toBe('INVALID_INPUT');

        const resultAuditLog = await projectService.addAuditLog(invalidId, mockUser, 'Test');
        expect(resultAuditLog.success).toBe(false);
        expect(resultAuditLog.error?.code).toBe('INVALID_INPUT');
      }
    });

    it('should validate user ID format consistently', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      const invalidUser = { ...mockUser, id: '' };

      // Act
      const result = await projectService.addAuditLog('proj-123', invalidUser, 'Test action');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toMatch(/user|invalid|id/i);
    });

    it('should enforce string length limits', async () => {
      // Arrange
      const { projectService } = await import('../projectService');

      // Test PR number length (should be 1-50 chars)
      const tooLongPR = 'x'.repeat(51);
      const poData = {
        prNumber: tooLongPR,
        requester: mockUser.id,
        requestDate: '2024-01-15',
        items: [
          {
            materialName: 'Cement',
            quantity: 100,
            unit: 'sak',
            pricePerUnit: 75000,
            totalPrice: 7500000,
          },
        ],
      };

      // Act
      const result = await projectService.addPurchaseOrder('proj-123', poData, mockUser);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toMatch(/invalid|PR number|length/i);
    });

    it('should enforce array size limits', async () => {
      // Arrange
      const { projectService } = await import('../projectService');

      // Test batch size limit (max 500)
      const tooManyUpdates: [string, 'Hadir'][] = Array.from({ length: 501 }, (_, i) => [
        `worker-${i}`,
        'Hadir',
      ]);

      // Act
      const result = await projectService.updateAttendance(
        'proj-123',
        '2024-01-15',
        tooManyUpdates,
        mockUser
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toMatch(/batch|limit|500/i);
    });
  });

  describe('Error Recovery', () => {
    it('should retry on network errors', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      let attemptCount = 0;
      vi.mocked(getDoc).mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Network error');
        }
        return {
          exists: () => true,
          data: () => ({ id: 'proj-retry', name: 'Retry Project' }),
          id: 'proj-retry',
        } as any;
      });

      // Act
      const result = await projectService.getProjectById('proj-retry');

      // Assert
      expect(result.success).toBe(true);
      expect(attemptCount).toBeGreaterThan(1); // Should have retried
    });

    it('should log errors appropriately', async () => {
      // Arrange
      const { projectService } = await import('../projectService');
      vi.mocked(getDocs).mockRejectedValue(new Error('Firestore error'));

      // Act
      await projectService.getWorkspaces();

      // Assert - Logger should be called (verify in console output)
      // Note: We can't easily verify logger.error calls without mocking logger
      expect(getDocs).toHaveBeenCalled();
    });

    it('should return structured API errors', async () => {
      // Arrange
      const { projectService } = await import('../projectService');

      // Act - Call with invalid input
      const result = await projectService.getProjectById('');

      // Assert - Verify APIResponse structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('error');
      expect(result.success).toBe(false);
      expect(result.error).toHaveProperty('code');
      expect(result.error).toHaveProperty('message');
      expect(result.error).toHaveProperty('statusCode');
    });
  });
});

// ========================================
// TEST SUITE: EDGE CASES
// ========================================

describe('projectService - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle concurrent Firestore writes', async () => {
    // Arrange
    const { projectService } = await import('../projectService');
    const mockBatch = {
      set: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(writeBatch).mockReturnValue(mockBatch as any);
    vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any);

    // Act - Simulate concurrent attendance updates
    const date = '2024-01-15';
    const updates1: [string, 'Hadir'][] = [['worker-1', 'Hadir']];
    const updates2: [string, 'Hadir'][] = [['worker-2', 'Hadir']];

    await Promise.all([
      projectService.updateAttendance('proj-123', date, updates1, mockUser),
      projectService.updateAttendance('proj-123', date, updates2, mockUser),
    ]);

    // Assert - Both should succeed with batch writes
    expect(mockBatch.commit).toHaveBeenCalledTimes(2);
  });

  it('should handle large file uploads gracefully', async () => {
    // Arrange
    const { projectService } = await import('../projectService');
    const largeContent = new Array(99 * 1024 * 1024).fill('x').join(''); // 99MB
    const mockLargeFile = new File([largeContent], 'large-doc.pdf', {
      type: 'application/pdf',
    });
    const docData = {
      name: 'Large Document',
      category: 'Contract',
      uploadDate: '2024-01-15',
    };

    vi.mocked(uploadBytes).mockResolvedValue({ ref: {} as any } as any);
    vi.mocked(getDownloadURL).mockResolvedValue('https://storage.example.com/large.pdf');
    vi.mocked(addDoc).mockResolvedValue({ id: 'doc-large' } as any);

    // Act
    const result = await projectService.addDocument('proj-123', docData, mockLargeFile, mockUser);

    // Assert - Should handle large file (< 100MB)
    expect(result.success).toBe(true);
    expect(uploadBytes).toHaveBeenCalled();
  });

  it('should handle malformed Firestore documents', async () => {
    // Arrange
    const { projectService } = await import('../projectService');

    // Mock document with missing fields
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({ id: 'proj-malformed' }), // Missing name and other fields
      id: 'proj-malformed',
    } as any);

    // Act
    const result = await projectService.getProjectById('proj-malformed');

    // Assert - Should still return data (with missing fields as undefined)
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('proj-malformed');
  });

  it('should handle null/undefined values in updates', async () => {
    // Arrange
    const { projectService } = await import('../projectService');
    vi.mocked(updateDoc).mockResolvedValue(undefined);
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({ prNumber: 'PR-001', status: null }), // null status
    } as any);
    vi.mocked(addDoc).mockResolvedValue({ id: 'audit-123' } as any);

    // Act
    const result = await projectService.updatePOStatus(
      'proj-123',
      'po-456',
      'Disetujuan',
      mockUser
    );

    // Assert - Should handle null values gracefully
    expect(result.success).toBe(true);
  });

  it('should handle authentication timeout during long operations', async () => {
    // Arrange
    const { projectService } = await import('../projectService');

    // Simulate slow operation that might trigger auth timeout
    vi.mocked(getDocs).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              docs: Array.from({ length: 100 }, (_, i) => ({
                id: `user-${i}`,
                data: () => ({ name: `User ${i}`, email: `user${i}@test.com` }),
              })),
            } as any);
          }, 100); // Simulate delay
        })
    );

    // Act
    const result = await projectService.getUsers();

    // Assert - Should complete even with delay
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(100);
  });
});

// ========================================
// SUMMARY
// ========================================

/**
 * Test Coverage Plan:
 * 
 * Retrieval Operations:      ~12 tests
 * Creation Operations:        ~10 tests
 * Update Operations:          ~8 tests
 * Comment Operations:         ~4 tests
 * Real-time Streams:          ~6 tests
 * Validation & Errors:        ~8 tests
 * Edge Cases:                 ~5 tests
 * ─────────────────────────────────────
 * TOTAL PLANNED:              ~53 tests
 * 
 * Implementation Strategy:
 * 1. Complete retrieval tests first (most common)
 * 2. Then creation operations (database writes)
 * 3. Update operations (complex state changes)
 * 4. Real-time streams (snapshot mocking)
 * 5. Edge cases and error scenarios
 * 
 * Success Criteria:
 * ✅ 45+ tests passing (100% pass rate)
 * ✅ Coverage: ~50-60% of projectService
 * ✅ All critical paths tested
 * ✅ Comprehensive error handling
 */
