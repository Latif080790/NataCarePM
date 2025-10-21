/**
 * 🚀 TASK SERVICE - ENTERPRISE EDITION
 * Fully refactored with comprehensive error handling, validation, and monitoring
 * Version: 2.0.0
 * Last Updated: October 2025
 */

import { db } from '@/firebaseConfig';
import { APIResponse, APIError, ErrorCodes, safeAsync } from '@/utils/responseWrapper';
import { withRetry } from '@/utils/retryWrapper';
import { validators } from '@/utils/validators';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { User } from '@/types';
import { projectService } from './projectService';

const docToType = <T>(docSnap: any): T => ({ ...(docSnap.data() as any), id: docSnap.id }) as T;

const validateProjectId = (projectId: string): void => {
  const validation = validators.isValidProjectId(projectId);
  if (!validation.valid)
    throw new APIError(
      ErrorCodes.INVALID_INPUT,
      validation.errors[0] || 'Invalid project ID',
      400,
      { projectId, errors: validation.errors }
    );
};
const validateTaskId = (taskId: string): void => {
  if (!validators.isValidId(taskId))
    throw new APIError(ErrorCodes.INVALID_INPUT, 'Invalid task ID', 400, { taskId });
};
const validateUserId = (userId: string): void => {
  if (!validators.isValidId(userId))
    throw new APIError(ErrorCodes.INVALID_INPUT, 'Invalid user ID', 400, { userId });
};

import { Unsubscribe, onSnapshot, where } from 'firebase/firestore';
import { Task, Subtask, TaskComment } from '@/types';

// --- Subtask helpers ---
const generateSubtaskId = () => `st_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// --- Task Service ---
export const taskService = {
  getTasksByProject: async (projectId: string): Promise<APIResponse<Task[]>> => {
    return await safeAsync(async () => {
      validateProjectId(projectId);
      const q = query(collection(db, `projects/${projectId}/tasks`), orderBy('createdAt', 'desc'));
      const snapshot = await withRetry(() => getDocs(q), { maxAttempts: 3 });
      return snapshot.docs.map((d: any) => docToType<Task>(d));
    }, 'taskService.getTasksByProject');
  },
  streamTasksByProject: (
    projectId: string,
    callback: (tasks: Task[]) => void,
    errorCallback?: (error: Error) => void
  ): Unsubscribe => {
    try {
      validateProjectId(projectId);
      const q = query(collection(db, `projects/${projectId}/tasks`), orderBy('createdAt', 'desc'));
      return onSnapshot(
        q,
        (qs) => {
          try {
            callback(qs.docs.map((d: any) => docToType<Task>(d)));
          } catch (e) {
            errorCallback?.(e instanceof Error ? e : new Error(String(e)));
          }
        },
        (err) => errorCallback?.(err instanceof Error ? err : new Error(String(err)))
      );
    } catch (err) {
      errorCallback?.(err instanceof Error ? err : new Error(String(err)));
      return () => {};
    }
  },
  getTaskById: async (projectId: string, taskId: string): Promise<APIResponse<Task>> => {
    return await safeAsync(async () => {
      validateProjectId(projectId);
      validateTaskId(taskId);
      const docRef = doc(db, `projects/${projectId}/tasks`, taskId);
      const snap = await withRetry(() => getDoc(docRef), { maxAttempts: 3 });
      if (!snap.exists())
        throw new APIError(ErrorCodes.NOT_FOUND, 'Task not found', 404, { projectId, taskId });
      return docToType<Task>(snap);
    }, 'taskService.getTaskById');
  },
  filterTasks: async (
    projectId: string,
    filters: { status?: string; priority?: string; assignedTo?: string; search?: string }
  ): Promise<APIResponse<Task[]>> => {
    return await safeAsync(async () => {
      validateProjectId(projectId);
      let q = query(collection(db, `projects/${projectId}/tasks`));
      // Filtering (expand as needed)
      // Note: Firestore does not support complex multi-field queries easily
      // For demo, only filter by status/priority/assignedTo if provided
      if (filters.status) q = query(q, where('status', '==', filters.status));
      if (filters.priority) q = query(q, where('priority', '==', filters.priority));
      if (filters.assignedTo)
        q = query(q, where('assignedTo', 'array-contains', filters.assignedTo));
      const snapshot = await withRetry(() => getDocs(q), { maxAttempts: 3 });
      let tasks = snapshot.docs.map((d: any) => docToType<Task>(d));
      if (filters.search) {
        const s = filters.search.toLowerCase();
        tasks = tasks.filter(
          (t) => t.title.toLowerCase().includes(s) || t.description?.toLowerCase().includes(s)
        );
      }
      return tasks;
    }, 'taskService.filterTasks');
  },
  createTask: async (
    projectId: string,
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
    user: User
  ): Promise<APIResponse<string>> => {
    return await safeAsync(
      async () => {
        validateProjectId(projectId);
        validateUserId(user.id);
        const titleValidation = validators.isValidString(taskData.title, 1, 200);
        if (!titleValidation.valid)
          throw new APIError(ErrorCodes.VALIDATION_FAILED, 'Invalid task title', 400, {
            errors: titleValidation.errors,
          });
        const docRef = await withRetry(
          () =>
            addDoc(collection(db, `projects/${projectId}/tasks`), {
              ...taskData,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }),
          { maxAttempts: 3 }
        );
        try {
          await projectService.addAuditLog(
            projectId,
            user,
            `Membuat task baru: "${taskData.title}"`
          );
        } catch {}
        return docRef.id;
      },
      'taskService.createTask',
      user.id
    );
  },
  updateTask: async (
    projectId: string,
    taskId: string,
    updates: Partial<Task>,
    user: User
  ): Promise<APIResponse<void>> => {
    return await safeAsync(
      async () => {
        validateProjectId(projectId);
        validateTaskId(taskId);
        validateUserId(user.id);
        if (updates.title) {
          const titleValidation = validators.isValidString(updates.title, 1, 200);
          if (!titleValidation.valid)
            throw new APIError(ErrorCodes.VALIDATION_FAILED, 'Invalid task title', 400, {
              errors: titleValidation.errors,
            });
        }
        const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
        await withRetry(() => updateDoc(taskRef, { ...updates, updatedAt: serverTimestamp() }), {
          maxAttempts: 3,
        });
        try {
          await projectService.addAuditLog(projectId, user, `Memperbarui task #${taskId}`);
        } catch {}
        return;
      },
      'taskService.updateTask',
      user.id
    );
  },
  deleteTask: async (projectId: string, taskId: string, user: User): Promise<APIResponse<void>> => {
    return await safeAsync(
      async () => {
        validateProjectId(projectId);
        validateTaskId(taskId);
        validateUserId(user.id);
        const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
        const taskDoc = await withRetry(() => getDoc(taskRef), { maxAttempts: 2 });
        if (!taskDoc.exists())
          throw new APIError(ErrorCodes.NOT_FOUND, 'Task not found', 404, { projectId, taskId });
        await withRetry(() => deleteDoc(taskRef), { maxAttempts: 3 });
        try {
          await projectService.addAuditLog(
            projectId,
            user,
            `Menghapus task: "${taskDoc.data()?.title || 'Unknown'}"`
          );
        } catch {}
        return;
      },
      'taskService.deleteTask',
      user.id
    );
  },
  // --- Subtask CRUD ---
  addSubtask: async (
    projectId: string,
    taskId: string,
    subtaskData: Omit<Subtask, 'id'>
  ): Promise<APIResponse<string>> => {
    return await safeAsync(async () => {
      validateProjectId(projectId);
      validateTaskId(taskId);
      const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
      const taskSnap = await withRetry(() => getDoc(taskRef), { maxAttempts: 2 });
      if (!taskSnap.exists())
        throw new APIError(ErrorCodes.NOT_FOUND, 'Task not found', 404, { projectId, taskId });
      const task = docToType<Task>(taskSnap);
      const newSubtask: Subtask = { ...subtaskData, id: generateSubtaskId(), completed: false };
      await withRetry(
        () =>
          updateDoc(taskRef, {
            subtasks: [...(task.subtasks || []), newSubtask],
            updatedAt: serverTimestamp(),
          }),
        { maxAttempts: 3 }
      );
      return newSubtask.id;
    }, 'taskService.addSubtask');
  },
  updateSubtask: async (
    projectId: string,
    taskId: string,
    subtaskId: string,
    updates: Partial<Subtask>
  ): Promise<APIResponse<void>> => {
    return await safeAsync(async () => {
      validateProjectId(projectId);
      validateTaskId(taskId);
      const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
      const taskSnap = await withRetry(() => getDoc(taskRef), { maxAttempts: 2 });
      if (!taskSnap.exists())
        throw new APIError(ErrorCodes.NOT_FOUND, 'Task not found', 404, { projectId, taskId });
      const task = docToType<Task>(taskSnap);
      const updatedSubtasks = (task.subtasks || []).map((st) =>
        st.id === subtaskId ? { ...st, ...updates } : st
      );
      await withRetry(
        () => updateDoc(taskRef, { subtasks: updatedSubtasks, updatedAt: serverTimestamp() }),
        { maxAttempts: 3 }
      );
      return;
    }, 'taskService.updateSubtask');
  },
  deleteSubtask: async (
    projectId: string,
    taskId: string,
    subtaskId: string
  ): Promise<APIResponse<void>> => {
    return await safeAsync(async () => {
      validateProjectId(projectId);
      validateTaskId(taskId);
      const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
      const taskSnap = await withRetry(() => getDoc(taskRef), { maxAttempts: 2 });
      if (!taskSnap.exists())
        throw new APIError(ErrorCodes.NOT_FOUND, 'Task not found', 404, { projectId, taskId });
      const task = docToType<Task>(taskSnap);
      const updatedSubtasks = (task.subtasks || []).filter((st) => st.id !== subtaskId);
      await withRetry(
        () => updateDoc(taskRef, { subtasks: updatedSubtasks, updatedAt: serverTimestamp() }),
        { maxAttempts: 3 }
      );
      return;
    }, 'taskService.deleteSubtask');
  },
  // --- Task Comments ---
  streamTaskComments: (
    projectId: string,
    taskId: string,
    callback: (comments: TaskComment[]) => void,
    errorCallback?: (error: Error) => void
  ): Unsubscribe => {
    try {
      validateProjectId(projectId);
      validateTaskId(taskId);
      const q = query(
        collection(db, `projects/${projectId}/tasks/${taskId}/comments`),
        orderBy('timestamp', 'asc')
      );
      return onSnapshot(
        q,
        (qs) => {
          try {
            callback(qs.docs.map((d: any) => docToType<TaskComment>(d)));
          } catch (e) {
            errorCallback?.(e instanceof Error ? e : new Error(String(e)));
          }
        },
        (err) => errorCallback?.(err instanceof Error ? err : new Error(String(err)))
      );
    } catch (err) {
      errorCallback?.(err instanceof Error ? err : new Error(String(err)));
      return () => {};
    }
  },
  addTaskComment: async (
    projectId: string,
    taskId: string,
    comment: Omit<TaskComment, 'id' | 'timestamp'>
  ): Promise<APIResponse<string>> => {
    return await safeAsync(async () => {
      validateProjectId(projectId);
      validateTaskId(taskId);
      const docRef = await withRetry(
        () =>
          addDoc(collection(db, `projects/${projectId}/tasks/${taskId}/comments`), {
            ...comment,
            timestamp: new Date().toISOString(),
          }),
        { maxAttempts: 3 }
      );
      return docRef.id;
    }, 'taskService.addTaskComment');
  },
  deleteTaskComment: async (
    projectId: string,
    taskId: string,
    commentId: string
  ): Promise<APIResponse<void>> => {
    return await safeAsync(async () => {
      validateProjectId(projectId);
      validateTaskId(taskId);
      const commentRef = doc(db, `projects/${projectId}/tasks/${taskId}/comments`, commentId);
      await withRetry(() => deleteDoc(commentRef), { maxAttempts: 3 });
      return;
    }, 'taskService.deleteTaskComment');
  },
  // --- Progress Calculation ---
  recalculateTaskProgress: async (
    projectId: string,
    taskId: string
  ): Promise<APIResponse<void>> => {
    return await safeAsync(async () => {
      validateProjectId(projectId);
      validateTaskId(taskId);
      const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
      const taskSnap = await withRetry(() => getDoc(taskRef), { maxAttempts: 2 });
      if (!taskSnap.exists()) return;
      const task = docToType<Task>(taskSnap);
      const subtasks = task.subtasks || [];
      let progress = 0;
      if (subtasks.length === 0)
        progress = task.status === 'done' ? 100 : task.status === 'in-progress' ? 50 : 0;
      else {
        const completed = subtasks.filter((st) => st.completed).length;
        progress = Math.round((completed / subtasks.length) * 100);
      }
      await withRetry(() => updateDoc(taskRef, { progress, updatedAt: serverTimestamp() }), {
        maxAttempts: 2,
      });
      return;
    }, 'taskService.recalculateTaskProgress');
  },
};
