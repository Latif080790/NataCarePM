import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SchedulingService } from '../schedulingService';
import { Task, User } from '@/types';
import { TaskDependency } from '@/types/ai-resource.types';
import { SchedulingConstraint, ResourceConstraint, DateConstraint, PrecedenceConstraint, CalendarConstraint, ScheduleBaseline } from '../schedulingService';
import { ErrorCodes } from '@/utils/responseWrapper';

// Mock Firebase
vi.mock('@/firebaseConfig', () => ({
  db: {},
  auth: {},
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, collectionName) => ({ _collectionName: collectionName })),
  doc: vi.fn((_db, collectionName, docId) => ({ _collectionName: collectionName, _id: docId })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
}));

// Mock enhanced task service
vi.mock('../taskService.enhanced', () => ({
  enhancedTaskService: {
    calculateCriticalPath: vi.fn(),
  },
}));

import * as firestore from 'firebase/firestore';
import { enhancedTaskService } from '../taskService.enhanced';

// Helper function to create mock critical path response
const createMockCriticalPath = (taskIds: string[], duration: number) => ({
  success: true as const,
  data: {
    criticalPath: taskIds,
    criticalTasks: taskIds,
    projectDuration: duration,
    taskES: taskIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {} as Record<string, number>),
    taskEF: taskIds.reduce((acc, id) => ({ ...acc, [id]: duration }), {} as Record<string, number>),
    taskLS: taskIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {} as Record<string, number>),
    taskLF: taskIds.reduce((acc, id) => ({ ...acc, [id]: duration }), {} as Record<string, number>),
    taskFloat: taskIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {} as Record<string, number>),
  },
});

describe('SchedulingService', () => {
  let mockUser: User;
  let mockTasks: Task[];
  let mockDependencies: TaskDependency[];
  let mockProjectId: string;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockProjectId = 'PROJECT_123';
    
    mockUser = {
      id: 'USER_123',
      uid: 'USER_123',
      email: 'test@example.com',
      name: 'Test User',
      roleId: 'project-manager',
      avatarUrl: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as User;

    mockTasks = [
      {
        id: 'TASK_001',
        title: 'Task 1',
        description: 'First task',
        projectId: mockProjectId,
        status: 'in-progress' as const,
        priority: 'high' as const,
        startDate: '2025-01-01',
        endDate: '2025-01-10',
        dueDate: '2025-01-10',
        dependencies: [],
        subtasks: [],
        progress: 50,
        tags: [],
        assignedTo: ['USER_123'],
        createdBy: 'USER_123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'TASK_002',
        title: 'Task 2',
        description: 'Second task',
        projectId: mockProjectId,
        status: 'todo' as const,
        priority: 'medium' as const,
        startDate: '2025-01-11',
        endDate: '2025-01-20',
        dueDate: '2025-01-20',
        dependencies: ['TASK_001'],
        subtasks: [],
        progress: 0,
        tags: [],
        assignedTo: ['USER_456'],
        createdBy: 'USER_123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'TASK_003',
        title: 'Task 3',
        description: 'Third task',
        projectId: mockProjectId,
        status: 'todo' as const,
        priority: 'low' as const,
        startDate: '2025-01-21',
        endDate: '2025-01-30',
        dueDate: '2025-01-30',
        dependencies: ['TASK_002'],
        subtasks: [],
        progress: 0,
        tags: [],
        assignedTo: ['USER_789'],
        createdBy: 'USER_123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    mockDependencies = [
      {
        predecessorTaskId: 'TASK_001',
        successorTaskId: 'TASK_002',
        dependencyType: 'finish_to_start',
        lagTime: 0,
      },
      {
        predecessorTaskId: 'TASK_002',
        successorTaskId: 'TASK_003',
        dependencyType: 'finish_to_start',
        lagTime: 2,
      },
    ];
  });

  describe('detectScheduleConflicts', () => {
    it('should detect schedule conflicts successfully', async () => {
      const result = await SchedulingService.detectScheduleConflicts(
        mockProjectId,
        mockTasks,
        mockDependencies
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('resourceConflicts');
      expect(result.data).toHaveProperty('dateConflicts');
      expect(result.data).toHaveProperty('precedenceConflicts');
      expect(Array.isArray(result.data?.resourceConflicts)).toBe(true);
      expect(Array.isArray(result.data?.dateConflicts)).toBe(true);
      expect(Array.isArray(result.data?.precedenceConflicts)).toBe(true);
    });

    it('should handle invalid project ID', async () => {
      const result = await SchedulingService.detectScheduleConflicts(
        '',
        mockTasks,
        mockDependencies
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
      expect(result.error?.message).toContain('Project ID');
    });

    it('should handle empty task list', async () => {
      const result = await SchedulingService.detectScheduleConflicts(
        mockProjectId,
        [],
        mockDependencies
      );

      expect(result.success).toBe(true);
      expect(result.data?.resourceConflicts).toHaveLength(0);
      expect(result.data?.dateConflicts).toHaveLength(0);
      expect(result.data?.precedenceConflicts).toHaveLength(0);
    });

    it('should handle empty dependencies', async () => {
      const result = await SchedulingService.detectScheduleConflicts(
        mockProjectId,
        mockTasks,
        []
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('applyResourceLeveling', () => {
    it('should apply resource leveling successfully', async () => {
      const mockCriticalPath = createMockCriticalPath(
        ['TASK_001', 'TASK_002', 'TASK_003'],
        30
      );
      
      vi.mocked(enhancedTaskService.calculateCriticalPath).mockResolvedValue(mockCriticalPath);

      const result = await SchedulingService.applyResourceLeveling(
        mockProjectId,
        mockTasks,
        mockDependencies,
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.planId).toContain(mockProjectId);
      expect(result.data?.projectId).toBe(mockProjectId);
      expect(result.data?.tasks).toHaveLength(3);
      expect(result.data?.criticalPath).toEqual(['TASK_001', 'TASK_002', 'TASK_003']);
      expect(result.data?.dependencies).toEqual(mockDependencies);
    });

    it('should populate task schedules from tasks', async () => {
      const mockCriticalPath = createMockCriticalPath(['TASK_001'], 10);
      
      vi.mocked(enhancedTaskService.calculateCriticalPath).mockResolvedValue(mockCriticalPath);

      const result = await SchedulingService.applyResourceLeveling(
        mockProjectId,
        mockTasks,
        mockDependencies,
        mockUser
      );

      expect(result.success).toBe(true);
      const taskSchedule = result.data?.tasks.find(ts => ts.taskId === 'TASK_001');
      expect(taskSchedule).toBeDefined();
      expect(taskSchedule?.taskName).toBe('Task 1');
      expect(taskSchedule?.assignedResources).toEqual(['USER_123']);
      expect(taskSchedule?.duration).toBeGreaterThan(0);
    });

    it('should mark critical tasks correctly', async () => {
      const mockCriticalPath = createMockCriticalPath(['TASK_001', 'TASK_002'], 20);
      
      vi.mocked(enhancedTaskService.calculateCriticalPath).mockResolvedValue(mockCriticalPath);

      const result = await SchedulingService.applyResourceLeveling(
        mockProjectId,
        mockTasks,
        mockDependencies,
        mockUser
      );

      expect(result.success).toBe(true);
      const criticalTask1 = result.data?.tasks.find(ts => ts.taskId === 'TASK_001');
      const criticalTask2 = result.data?.tasks.find(ts => ts.taskId === 'TASK_002');
      const nonCriticalTask = result.data?.tasks.find(ts => ts.taskId === 'TASK_003');
      
      expect(criticalTask1?.isCritical).toBe(true);
      expect(criticalTask2?.isCritical).toBe(true);
      expect(nonCriticalTask?.isCritical).toBe(false);
    });

    it('should populate predecessors and successors from dependencies', async () => {
      const mockCriticalPath = createMockCriticalPath(
        ['TASK_001', 'TASK_002', 'TASK_003'],
        30
      );
      
      vi.mocked(enhancedTaskService.calculateCriticalPath).mockResolvedValue(mockCriticalPath);

      const result = await SchedulingService.applyResourceLeveling(
        mockProjectId,
        mockTasks,
        mockDependencies,
        mockUser
      );

      expect(result.success).toBe(true);
      const task1 = result.data?.tasks.find(ts => ts.taskId === 'TASK_001');
      const task2 = result.data?.tasks.find(ts => ts.taskId === 'TASK_002');
      const task3 = result.data?.tasks.find(ts => ts.taskId === 'TASK_003');
      
      expect(task1?.successors).toContain('TASK_002');
      expect(task2?.predecessors).toContain('TASK_001');
      expect(task2?.successors).toContain('TASK_003');
      expect(task3?.predecessors).toContain('TASK_002');
    });

    it('should handle critical path calculation failure gracefully', async () => {
      vi.mocked(enhancedTaskService.calculateCriticalPath).mockResolvedValue({
        success: false,
        error: { code: 'CALCULATION_ERROR', message: 'Failed to calculate critical path' },
      });

      const result = await SchedulingService.applyResourceLeveling(
        mockProjectId,
        mockTasks,
        mockDependencies,
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.data?.criticalPath).toEqual([]);
      expect(result.data?.tasks.every(ts => !ts.isCritical)).toBe(true);
    });

    it('should handle invalid project ID', async () => {
      const result = await SchedulingService.applyResourceLeveling(
        '',
        mockTasks,
        mockDependencies,
        mockUser
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
    });

    it('should handle invalid user ID', async () => {
      const invalidUser = { ...mockUser, id: '' };
      
      const result = await SchedulingService.applyResourceLeveling(
        mockProjectId,
        mockTasks,
        mockDependencies,
        invalidUser
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
    });

    it('should calculate total duration correctly', async () => {
      const mockCriticalPath = createMockCriticalPath(
        ['TASK_001', 'TASK_002', 'TASK_003'],
        30
      );
      
      vi.mocked(enhancedTaskService.calculateCriticalPath).mockResolvedValue(mockCriticalPath);

      const result = await SchedulingService.applyResourceLeveling(
        mockProjectId,
        mockTasks,
        mockDependencies,
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.data?.totalDuration).toBeGreaterThan(0);
      expect(typeof result.data?.totalDuration).toBe('number');
    });
  });

  describe('Scheduling Constraints', () => {
    describe('createConstraint', () => {
      it('should create resource constraint successfully', async () => {
        const mockDocRef = { id: 'CONSTRAINT_001' };
        vi.mocked(firestore.addDoc).mockResolvedValue(mockDocRef as any);

        const constraintData: Omit<ResourceConstraint, 'id' | 'createdAt' | 'createdBy'> = {
          projectId: mockProjectId,
          type: 'resource',
          description: 'Max 80% allocation',
          isActive: true,
          resourceId: 'RESOURCE_001',
          maxAllocation: 80,
          startDate: '2025-01-01',
          endDate: '2025-12-31',
        };

        const result = await SchedulingService.createConstraint(
          mockProjectId,
          constraintData,
          mockUser
        );

        expect(result.success).toBe(true);
        expect(result.data).toBe('CONSTRAINT_001');
        expect(firestore.addDoc).toHaveBeenCalled();
      });

      it('should create date constraint successfully', async () => {
        const mockDocRef = { id: 'CONSTRAINT_002' };
        vi.mocked(firestore.addDoc).mockResolvedValue(mockDocRef as any);

        const constraintData: Omit<DateConstraint, 'id' | 'createdAt' | 'createdBy'> = {
          projectId: mockProjectId,
          type: 'date',
          description: 'Task must start on specific date',
          isActive: true,
          taskId: 'TASK_001',
          constraintType: 'must_start_on',
          date: '2025-01-15',
        };

        const result = await SchedulingService.createConstraint(
          mockProjectId,
          constraintData,
          mockUser
        );

        expect(result.success).toBe(true);
        expect(result.data).toBe('CONSTRAINT_002');
      });

      it('should create precedence constraint successfully', async () => {
        const mockDocRef = { id: 'CONSTRAINT_003' };
        vi.mocked(firestore.addDoc).mockResolvedValue(mockDocRef as any);

        const constraintData: Omit<PrecedenceConstraint, 'id' | 'createdAt' | 'createdBy'> = {
          projectId: mockProjectId,
          type: 'precedence',
          description: 'Task dependency with lag time',
          isActive: true,
          predecessorTaskId: 'TASK_001',
          successorTaskId: 'TASK_002',
          lagTime: 24,
        };

        const result = await SchedulingService.createConstraint(
          mockProjectId,
          constraintData,
          mockUser
        );

        expect(result.success).toBe(true);
        expect(result.data).toBe('CONSTRAINT_003');
      });

      it('should create calendar constraint successfully', async () => {
        const mockDocRef = { id: 'CONSTRAINT_004' };
        vi.mocked(firestore.addDoc).mockResolvedValue(mockDocRef as any);

        const constraintData: Omit<CalendarConstraint, 'id' | 'createdAt' | 'createdBy'> = {
          projectId: mockProjectId,
          type: 'calendar',
          description: 'Standard work week',
          isActive: true,
          workingDays: [1, 2, 3, 4, 5],
          workingHours: {
            startHour: 8,
            endHour: 17,
          },
        };

        const result = await SchedulingService.createConstraint(
          mockProjectId,
          constraintData,
          mockUser
        );

        expect(result.success).toBe(true);
        expect(result.data).toBe('CONSTRAINT_004');
      });

      it('should handle invalid project ID', async () => {
        const constraintData: Omit<SchedulingConstraint, 'id' | 'createdAt' | 'createdBy'> = {
          projectId: '',
          type: 'resource',
          description: 'Test constraint',
          isActive: true,
        };

        const result = await SchedulingService.createConstraint(
          '',
          constraintData,
          mockUser
        );

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
      });

      it('should handle invalid user ID', async () => {
        const constraintData: Omit<SchedulingConstraint, 'id' | 'createdAt' | 'createdBy'> = {
          projectId: mockProjectId,
          type: 'resource',
          description: 'Test constraint',
          isActive: true,
        };

        const invalidUser = { ...mockUser, id: '' };

        const result = await SchedulingService.createConstraint(
          mockProjectId,
          constraintData,
          invalidUser
        );

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
      });
    });

    describe('getProjectConstraints', () => {
      it('should retrieve project constraints successfully', async () => {
        const mockConstraints = [
          {
            id: 'CONSTRAINT_001',
            projectId: mockProjectId,
            type: 'resource',
            description: 'Resource constraint',
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: 'USER_123',
          },
          {
            id: 'CONSTRAINT_002',
            projectId: mockProjectId,
            type: 'date',
            description: 'Date constraint',
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: 'USER_123',
          },
        ];

        const mockQuerySnapshot = {
          docs: mockConstraints.map(constraint => ({
            id: constraint.id,
            data: () => constraint,
          })),
        };

        vi.mocked(firestore.getDocs).mockResolvedValue(mockQuerySnapshot as any);

        const result = await SchedulingService.getProjectConstraints(mockProjectId);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
        expect(result.data?.[0].type).toBe('resource');
        expect(result.data?.[1].type).toBe('date');
      });

      it('should handle empty constraint list', async () => {
        const mockQuerySnapshot = {
          docs: [],
        };

        vi.mocked(firestore.getDocs).mockResolvedValue(mockQuerySnapshot as any);

        const result = await SchedulingService.getProjectConstraints(mockProjectId);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(0);
      });

      it('should handle invalid project ID', async () => {
        const result = await SchedulingService.getProjectConstraints('');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
      });
    });

    describe('updateConstraint', () => {
      it('should update constraint successfully', async () => {
        const mockDocSnap = {
          exists: () => true,
          data: () => ({
            projectId: mockProjectId,
            type: 'resource',
            description: 'Old description',
            isActive: true,
          }),
        };

        vi.mocked(firestore.getDoc).mockResolvedValue(mockDocSnap as any);
        vi.mocked(firestore.updateDoc).mockResolvedValue(undefined);

        const updates = {
          description: 'Updated description',
          isActive: false,
        };

        const result = await SchedulingService.updateConstraint(
          'CONSTRAINT_001',
          updates,
          mockUser
        );

        expect(result.success).toBe(true);
        expect(firestore.updateDoc).toHaveBeenCalled();
      });

      it('should handle constraint not found', async () => {
        const mockDocSnap = {
          exists: () => false,
        };

        vi.mocked(firestore.getDoc).mockResolvedValue(mockDocSnap as any);

        const result = await SchedulingService.updateConstraint(
          'NONEXISTENT',
          { isActive: false },
          mockUser
        );

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.NOT_FOUND);
      });

      it('should handle invalid user ID', async () => {
        const invalidUser = { ...mockUser, id: '' };

        const result = await SchedulingService.updateConstraint(
          'CONSTRAINT_001',
          { isActive: false },
          invalidUser
        );

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
      });
    });

    describe('deleteConstraint', () => {
      it('should delete constraint successfully', async () => {
        const mockDocSnap = {
          exists: () => true,
          data: () => ({
            projectId: mockProjectId,
            type: 'resource',
          }),
        };

        vi.mocked(firestore.getDoc).mockResolvedValue(mockDocSnap as any);
        vi.mocked(firestore.deleteDoc).mockResolvedValue(undefined);

        const result = await SchedulingService.deleteConstraint(
          'CONSTRAINT_001',
          mockUser
        );

        expect(result.success).toBe(true);
        expect(firestore.deleteDoc).toHaveBeenCalled();
      });

      it('should handle constraint not found', async () => {
        const mockDocSnap = {
          exists: () => false,
        };

        vi.mocked(firestore.getDoc).mockResolvedValue(mockDocSnap as any);

        const result = await SchedulingService.deleteConstraint(
          'NONEXISTENT',
          mockUser
        );

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.NOT_FOUND);
      });

      it('should handle invalid user ID', async () => {
        const invalidUser = { ...mockUser, id: '' };

        const result = await SchedulingService.deleteConstraint(
          'CONSTRAINT_001',
          invalidUser
        );

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
      });
    });
  });

  describe('Schedule Baselines', () => {
    describe('createBaseline', () => {
      it('should create schedule baseline successfully', async () => {
        const mockDocRef = { id: 'BASELINE_001' };
        vi.mocked(firestore.addDoc).mockResolvedValue(mockDocRef as any);

        const baselineData: Omit<ScheduleBaseline, 'id' | 'createdAt' | 'createdBy'> = {
          projectId: mockProjectId,
          name: 'Initial Baseline',
          description: 'First project baseline',
          taskSchedules: [
            {
              taskId: 'TASK_001',
              taskName: 'Task 1',
              startDate: new Date('2025-01-01'),
              endDate: new Date('2025-01-10'),
              duration: 10,
              isCritical: true,
              slack: 0,
              assignedResources: ['USER_123'],
              predecessors: [],
              successors: ['TASK_002'],
              estimatedCost: 10000,
              complexity: 5,
              riskLevel: 'medium',
            },
          ],
          dependencies: mockDependencies,
        };

        const result = await SchedulingService.createBaseline(
          mockProjectId,
          baselineData,
          mockUser
        );

        expect(result.success).toBe(true);
        expect(result.data).toBe('BASELINE_001');
        expect(firestore.addDoc).toHaveBeenCalled();
      });

      it('should handle invalid project ID', async () => {
        const baselineData: Omit<ScheduleBaseline, 'id' | 'createdAt' | 'createdBy'> = {
          projectId: '',
          name: 'Test Baseline',
          taskSchedules: [],
          dependencies: [],
        };

        const result = await SchedulingService.createBaseline(
          '',
          baselineData,
          mockUser
        );

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
      });

      it('should handle invalid user ID', async () => {
        const baselineData: Omit<ScheduleBaseline, 'id' | 'createdAt' | 'createdBy'> = {
          projectId: mockProjectId,
          name: 'Test Baseline',
          taskSchedules: [],
          dependencies: [],
        };

        const invalidUser = { ...mockUser, id: '' };

        const result = await SchedulingService.createBaseline(
          mockProjectId,
          baselineData,
          invalidUser
        );

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
      });
    });

    describe('getProjectBaselines', () => {
      it('should retrieve project baselines successfully', async () => {
        const mockBaselines = [
          {
            id: 'BASELINE_001',
            projectId: mockProjectId,
            name: 'Baseline 1',
            taskSchedules: [],
            dependencies: [],
            createdAt: new Date().toISOString(),
            createdBy: 'USER_123',
          },
          {
            id: 'BASELINE_002',
            projectId: mockProjectId,
            name: 'Baseline 2',
            taskSchedules: [],
            dependencies: [],
            createdAt: new Date().toISOString(),
            createdBy: 'USER_123',
          },
        ];

        const mockQuerySnapshot = {
          docs: mockBaselines.map(baseline => ({
            id: baseline.id,
            data: () => baseline,
          })),
        };

        vi.mocked(firestore.getDocs).mockResolvedValue(mockQuerySnapshot as any);

        const result = await SchedulingService.getProjectBaselines(mockProjectId);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
        expect(result.data?.[0].name).toBe('Baseline 1');
        expect(result.data?.[1].name).toBe('Baseline 2');
      });

      it('should handle empty baseline list', async () => {
        const mockQuerySnapshot = {
          docs: [],
        };

        vi.mocked(firestore.getDocs).mockResolvedValue(mockQuerySnapshot as any);

        const result = await SchedulingService.getProjectBaselines(mockProjectId);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(0);
      });

      it('should handle invalid project ID', async () => {
        const result = await SchedulingService.getProjectBaselines('');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
      });
    });

    describe('getBaseline', () => {
      it('should retrieve baseline by ID successfully', async () => {
        const mockBaseline = {
          id: 'BASELINE_001',
          projectId: mockProjectId,
          name: 'Test Baseline',
          taskSchedules: [],
          dependencies: [],
          createdAt: new Date().toISOString(),
          createdBy: 'USER_123',
        };

        const mockDocSnap = {
          exists: () => true,
          id: mockBaseline.id,
          data: () => mockBaseline,
        };

        vi.mocked(firestore.getDoc).mockResolvedValue(mockDocSnap as any);

        const result = await SchedulingService.getBaseline('BASELINE_001');

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.name).toBe('Test Baseline');
      });

      it('should handle baseline not found', async () => {
        const mockDocSnap = {
          exists: () => false,
        };

        vi.mocked(firestore.getDoc).mockResolvedValue(mockDocSnap as any);

        const result = await SchedulingService.getBaseline('NONEXISTENT');

        expect(result.success).toBe(true);
        expect(result.data).toBeNull();
      });
    });

    describe('compareWithBaseline', () => {
      it('should compare schedule with baseline successfully', async () => {
        const mockBaseline = {
          id: 'BASELINE_001',
          projectId: mockProjectId,
          name: 'Test Baseline',
          taskSchedules: [],
          dependencies: [],
          createdAt: new Date().toISOString(),
          createdBy: 'USER_123',
        };

        const mockDocSnap = {
          exists: () => true,
          id: mockBaseline.id,
          data: () => mockBaseline,
        };

        vi.mocked(firestore.getDoc).mockResolvedValue(mockDocSnap as any);

        const result = await SchedulingService.compareWithBaseline(
          mockProjectId,
          'BASELINE_001',
          mockTasks,
          mockDependencies
        );

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('scheduleVariance');
        expect(result.data).toHaveProperty('costVariance');
        expect(result.data).toHaveProperty('durationVariance');
        expect(result.data).toHaveProperty('taskVariances');
        expect(typeof result.data?.scheduleVariance).toBe('number');
        expect(typeof result.data?.costVariance).toBe('number');
        expect(typeof result.data?.durationVariance).toBe('number');
        expect(Array.isArray(result.data?.taskVariances)).toBe(true);
      });

      it('should handle baseline not found', async () => {
        const mockDocSnap = {
          exists: () => false,
        };

        vi.mocked(firestore.getDoc).mockResolvedValue(mockDocSnap as any);

        const result = await SchedulingService.compareWithBaseline(
          mockProjectId,
          'NONEXISTENT',
          mockTasks,
          mockDependencies
        );

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.NOT_FOUND);
      });

      it('should handle invalid project ID', async () => {
        const result = await SchedulingService.compareWithBaseline(
          '',
          'BASELINE_001',
          mockTasks,
          mockDependencies
        );

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.INVALID_INPUT);
      });
    });
  });
});
