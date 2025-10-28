import { describe, it, expect, vi, afterEach } from 'vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { taskService } from './src/api/taskService';
import { db } from '@/firebaseConfig';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { Task } from '@/types';

// Mocking Firebase Firestore functions
vi.mock('firebase/firestore', async (importActual) => {
  const actual = await importActual<typeof import('firebase/firestore')>();
  return {
    ...actual,
    collection: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
  };
});

const mockTask: Task = {
  id: 'task-123',
  projectId: 'proj-abc',
  title: 'Test Task',
  description: 'A task for testing purposes',
  status: 'todo',
  priority: 'medium',
  dueDate: '2025-12-31',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  createdBy: 'user-xyz',
  assignedTo: ['user-abc'],
  dependencies: [],
  subtasks: [],
  progress: 0,
  tags: ['testing'],
};

describe('taskService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Get Tasks by Project
  it('should fetch tasks for a given project ID', async () => {
    (getDocs as import('vitest').Mock).mockResolvedValue({
      docs: [{ id: 'task-123', data: () => ({ ...mockTask, id: undefined }) }],
    });

    const tasks = await taskService.getTasksByProject('proj-abc');

    expect(tasks.success).toBe(true);
    expect(tasks.data).toHaveLength(1);
    expect(tasks.data?.[0].title).toBe('Test Task');
    expect(getDocs).toHaveBeenCalled();
  });

  // Test 2: Get Task by ID
  it('should fetch a single task by its ID', async () => {
    (getDoc as import('vitest').Mock).mockResolvedValue({
      exists: () => true,
      id: 'task-123',
      data: () => ({ ...mockTask, id: undefined }),
    });

    const result = await taskService.getTaskById('proj-abc', 'task-123');

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('task-123');
    expect(getDoc).toHaveBeenCalled();
  });

  // Test 3: Create Task
  it('should create a new task and return its ID', async () => {
    (addDoc as import('vitest').Mock).mockResolvedValue({ id: 'new-task-456' });
    const newTaskData = { ...mockTask, id: undefined, title: 'New Task' };

    const result = await taskService.createTask('proj-abc', newTaskData as any, {
      id: 'user-xyz',
    } as any);

    expect(result.success).toBe(true);
    expect(result.data).toBe('new-task-456');
    expect(addDoc).toHaveBeenCalled();
  });

  // Test 4: Update Task
  it('should update an existing task', async () => {
    (updateDoc as import('vitest').Mock).mockResolvedValue(undefined);
    const updates = { status: 'in-progress' as const, progress: 50 };

    const result = await taskService.updateTask('proj-abc', 'task-123', updates, {
      id: 'user-xyz',
    } as any);

    expect(result.success).toBe(true);
    expect(updateDoc).toHaveBeenCalled();
  });

  // Test 5: Handle Error on Fetch
  it('should return an error object when fetching tasks fails', async () => {
    (getDocs as import('vitest').Mock).mockRejectedValue(new Error('Firestore permission denied'));
    const result = await taskService.getTasksByProject('proj-abc');
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Firestore permission denied');
  });
});