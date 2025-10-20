/**
 * 🚀 TASK SERVICE - ENTERPRISE EDITION
 * Fully refactored with comprehensive error handling, validation, and monitoring
 * Version: 2.0.0
 * Last Updated: October 2025
 */

import { db } from '@/firebaseConfig';
import { 
    collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where, 
    orderBy, onSnapshot, serverTimestamp, writeBatch, Unsubscribe, QueryDocumentSnapshot, DocumentData
} from "firebase/firestore";
import { Task, Subtask, TaskComment, User } from '@/types';
import { projectService } from './projectService';

// Import utilities
import { APIResponse, safeAsync, APIError, ErrorCodes } from '@/utils/responseWrapper';
import { validators, firebaseValidators } from '@/utils/validators';
import { withRetry } from '@/utils/retryWrapper';
import { createScopedLogger, logUserActivity } from '@/utils/log-helpers';

// Create scoped logger for this service
const taskLogger = createScopedLogger('taskService');

/**
 * Helper to convert Firestore doc to TypeScript types
 */
const docToType = <T>(document: QueryDocumentSnapshot<DocumentData>): T => {
    const data = document.data();
    return { ...data, id: document.id } as T;
};

/**
 * Validate project ID
 */
const validateProjectId = (projectId: string): void => {
    const validation = validators.isValidProjectId(projectId);
    if (!validation.valid) {
        taskLogger.warn('validateProjectId', 'Invalid project ID', { projectId, errors: validation.errors });
        throw new APIError(
            ErrorCodes.INVALID_INPUT,
            validation.errors[0] || 'Invalid project ID',
            400,
            { projectId, errors: validation.errors }
        );
    }
};

/**
 * Validate task ID
 */
const validateTaskId = (taskId: string): void => {
    if (!validators.isValidId(taskId)) {
        taskLogger.warn('validateTaskId', 'Invalid task ID', { taskId });
        throw new APIError(
            ErrorCodes.INVALID_INPUT,
            'Invalid task ID',
            400,
            { taskId }
        );
    }
};

/**
 * Validate user ID
 */
const validateUserId = (userId: string): void => {
    if (!validators.isValidId(userId)) {
        taskLogger.warn('validateUserId', 'Invalid user ID', { userId });
        throw new APIError(
            ErrorCodes.INVALID_INPUT,
            'Invalid user ID',
            400,
            { userId }
        );
    }
};

/**
 * Validate task status
 */
const validateTaskStatus = (status: string): void => {
    const validStatuses: Task['status'][] = ['todo', 'in-progress', 'done', 'blocked'];
    if (!validators.isValidEnum(status, validStatuses)) {
        throw new APIError(
            ErrorCodes.INVALID_INPUT,
            'Invalid task status',
            400,
            { status, validStatuses }
        );
    }
};

/**
 * Validate task priority
 */
const validateTaskPriority = (priority: string): void => {
    const validPriorities: Task['priority'][] = ['low', 'medium', 'high', 'critical'];
    if (!validators.isValidEnum(priority, validPriorities)) {
        throw new APIError(
            ErrorCodes.INVALID_INPUT,
            'Invalid task priority',
            400,
            { priority, validPriorities }
        );
    }
};

/**
 * Enhanced Task Service with full error handling
 */
export const taskService = {
    /**
     * Stream tasks by project with real-time updates
     * @param projectId - Project ID
     * @param callback - Callback function for updates
     * @param errorCallback - Optional error callback
     * @returns Unsubscribe function
     */
    streamTasksByProject: (
        projectId: string, 
        callback: (tasks: Task[]) => void,
        errorCallback?: (error: Error) => void
    ): Unsubscribe => {
        taskLogger.info('streamTasksByProject', 'Setting up tasks stream', { projectId });

        try {
            // Validate project ID
            validateProjectId(projectId);

            const q = query(
                collection(db, `projects/${projectId}/tasks`),
                orderBy('createdAt', 'desc')
            );
            
            return onSnapshot(
                q,
                (querySnapshot) => {
                    try {
                        const tasks = querySnapshot.docs.map((d: QueryDocumentSnapshot<DocumentData>) => docToType<Task>(d));
                        callback(tasks);
                        
                        taskLogger.debug('streamTasksByProject', 'Tasks updated', { 
                            projectId, 
                            count: tasks.length 
                        });
                    } catch (error) {
                        taskLogger.error(
                            'streamTasksByProject',
                            'Error processing snapshot',
                            error instanceof Error ? error : undefined,
                            { projectId }
                        );
                        errorCallback?.(error instanceof Error ? error : new Error(String(error)));
                    }
                },
                (error) => {
                    taskLogger.error('streamTasksByProject', 'Snapshot listener error', error, { projectId });
                    errorCallback?.(error);
                }
            );
        } catch (error) {
            taskLogger.error(
                'streamTasksByProject',
                'Failed to setup stream',
                error instanceof Error ? error : undefined,
                { projectId }
            );
            // Return no-op unsubscribe function
            return () => {};
        }
    },

    /**
     * Stream task comments with real-time updates
     * @param projectId - Project ID
     * @param taskId - Task ID
     * @param callback - Callback function for updates
     * @param errorCallback - Optional error callback
     * @returns Unsubscribe function
     */
    streamTaskComments: (
        projectId: string, 
        taskId: string, 
        callback: (comments: TaskComment[]) => void,
        errorCallback?: (error: Error) => void
    ): Unsubscribe => {
        taskLogger.info('streamTaskComments', 'Setting up comments stream', { projectId, taskId });

        try {
            // Validate IDs
            validateProjectId(projectId);
            validateTaskId(taskId);

            const q = query(
                collection(db, `projects/${projectId}/tasks/${taskId}/comments`),
                orderBy('timestamp', 'asc')
            );
            
            return onSnapshot(
                q,
                (querySnapshot) => {
                    try {
                        const comments = querySnapshot.docs.map((d: QueryDocumentSnapshot<DocumentData>) => docToType<TaskComment>(d));
                        callback(comments);
                        
                        taskLogger.debug('streamTaskComments', 'Comments updated', { 
                            projectId, 
                            taskId,
                            count: comments.length 
                        });
                    } catch (error) {
                        taskLogger.error(
                            'streamTaskComments',
                            'Error processing snapshot',
                            error instanceof Error ? error : undefined,
                            { projectId, taskId }
                        );
                        errorCallback?.(error instanceof Error ? error : new Error(String(error)));
                    }
                },
                (error) => {
                    taskLogger.error('streamTaskComments', 'Snapshot listener error', error, { projectId, taskId });
                    errorCallback?.(error);
                }
            );
        } catch (error) {
            taskLogger.error(
                'streamTaskComments',
                'Failed to setup stream',
                error instanceof Error ? error : undefined,
                { projectId, taskId }
            );
            return () => {};
        }
    },

    /**
     * Get all tasks by project
     * @param projectId - Project ID
     * @returns API response with tasks list
     */
    getTasksByProject: async (projectId: string): Promise<APIResponse<Task[]>> => {
        return await taskLogger.performance('getTasksByProject', async () => {
            return await safeAsync(
                async () => {
                    // Validate input
                    validateProjectId(projectId);

                    taskLogger.info('getTasksByProject', 'Fetching tasks', { projectId });

                    const q = query(
                        collection(db, `projects/${projectId}/tasks`),
                        orderBy('createdAt', 'desc')
                    );
                    
                    const snapshot = await withRetry(
                        () => getDocs(q),
                        {
                            maxAttempts: 3,
                            onRetry: (attempt: number, error: Error) => {
                                taskLogger.warn('getTasksByProject', `Retry attempt ${attempt}`, {
                                    projectId,
                                    error: error.message
                                });
                            }
                        }
                    );
                    
                    const tasks = snapshot.docs.map((d: QueryDocumentSnapshot<DocumentData>) => docToType<Task>(d));

                    taskLogger.success('getTasksByProject', 'Tasks fetched successfully', {
                        projectId,
                        count: tasks.length
                    });

                    return tasks;
                },
                'taskService.getTasksByProject'
            );
        });
    },

    /**
     * Get task by ID
     * @param projectId - Project ID
     * @param taskId - Task ID
     * @returns API response with task data
     */
    getTaskById: async (projectId: string, taskId: string): Promise<APIResponse<Task>> => {
        return await taskLogger.performance('getTaskById', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId);
                    validateTaskId(taskId);

                    taskLogger.info('getTaskById', 'Fetching task', { projectId, taskId });

                    const docRef = doc(db, `projects/${projectId}/tasks`, taskId);
                    const docSnap = await withRetry(
                        () => getDoc(docRef),
                        { maxAttempts: 3 }
                    );

                    if (!docSnap.exists()) {
                        throw new APIError(
                            ErrorCodes.NOT_FOUND,
                            'Task not found',
                            404,
                            { projectId, taskId }
                        );
                    }

                    const task = docToType<Task>(docSnap);

                    taskLogger.success('getTaskById', 'Task fetched successfully', {
                        projectId,
                        taskId,
                        taskTitle: task.title
                    });

                    return task;
                },
                'taskService.getTaskById'
            );
        });
    },

    /**
     * Get tasks assigned to a specific user
     * @param projectId - Project ID
     * @param userId - User ID
     * @returns API response with tasks list
     */
    getTasksByAssignee: async (projectId: string, userId: string): Promise<APIResponse<Task[]>> => {
        return await taskLogger.performance('getTasksByAssignee', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId);
                    validateUserId(userId);

                    taskLogger.info('getTasksByAssignee', 'Fetching assigned tasks', { projectId, userId });

                    const q = query(
                        collection(db, `projects/${projectId}/tasks`),
                        where('assignedTo', 'array-contains', userId),
                        orderBy('dueDate', 'asc')
                    );
                    
                    const snapshot = await withRetry(
                        () => getDocs(q),
                        { maxAttempts: 3 }
                    );
                    
                    const tasks = snapshot.docs.map((d: QueryDocumentSnapshot<DocumentData>) => docToType<Task>(d));

                    taskLogger.success('getTasksByAssignee', 'Assigned tasks fetched', {
                        projectId,
                        userId,
                        count: tasks.length
                    });

                    return tasks;
                },
                'taskService.getTasksByAssignee'
            );
        });
    },

    /**
     * Create a new task
     * @param projectId - Project ID
     * @param taskData - Task data
     * @param user - User creating task
     * @returns API response with task ID
     */
    createTask: async (
        projectId: string, 
        taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, 
        user: User
    ): Promise<APIResponse<string>> => {
        return await taskLogger.performance('createTask', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId);
                    validateUserId(user.id);

                    // Validate task data
                    const titleValidation = validators.isValidString(taskData.title, 1, 200);
                    if (!titleValidation.valid) {
                        throw new APIError(
                            ErrorCodes.VALIDATION_FAILED,
                            'Invalid task title',
                            400,
                            { errors: titleValidation.errors }
                        );
                    }

                    if (taskData.description && taskData.description.length > 5000) {
                        throw new APIError(
                            ErrorCodes.VALIDATION_FAILED,
                            'Task description too long (max 5000 characters)',
                            400,
                            { length: taskData.description.length }
                        );
                    }

                    validateTaskStatus(taskData.status);
                    validateTaskPriority(taskData.priority);

                    // Validate assignedTo array
                    if (taskData.assignedTo) {
                        const assigneeValidation = validators.isValidArray(taskData.assignedTo, 0, 50);
                        if (!assigneeValidation.valid) {
                            throw new APIError(
                                ErrorCodes.VALIDATION_FAILED,
                                'Invalid assignedTo array',
                                400,
                                { errors: assigneeValidation.errors }
                            );
                        }
                    }

                    taskLogger.info('createTask', 'Creating new task', {
                        projectId,
                        title: taskData.title,
                        userId: user.id
                    });

                    const newTask = {
                        ...taskData,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    };
                    
                    const docRef = await withRetry(
                        () => addDoc(collection(db, `projects/${projectId}/tasks`), newTask),
                        { maxAttempts: 3 }
                    );
                    
                    // Add audit log
                    const auditResult = await projectService.addAuditLog(
                        projectId, 
                        user, 
                        `Membuat task baru: "${taskData.title}"`
                    );

                    if (!auditResult.success) {
                        taskLogger.warn('createTask', 'Failed to add audit log', {
                            projectId,
                            taskId: docRef.id,
                            error: auditResult.error
                        });
                    }

                    // Log user activity
                    logUserActivity(user.id, 'CREATE_TASK', 'taskService', {
                        projectId,
                        taskId: docRef.id,
                        title: taskData.title
                    });

                    taskLogger.success('createTask', 'Task created successfully', {
                        projectId,
                        taskId: docRef.id,
                        title: taskData.title
                    });
                    
                    return docRef.id;
                },
                'taskService.createTask',
                user.id
            );
        });
    },

    /**
     * Update a task
     * @param projectId - Project ID
     * @param taskId - Task ID
     * @param updates - Partial task data to update
     * @param user - User updating task
     * @returns API response
     */
    updateTask: async (
        projectId: string, 
        taskId: string, 
        updates: Partial<Task>, 
        user: User
    ): Promise<APIResponse<void>> => {
        return await taskLogger.performance('updateTask', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId);
                    validateTaskId(taskId);
                    validateUserId(user.id);

                    // Validate updates
                    if (updates.title) {
                        const titleValidation = validators.isValidString(updates.title, 1, 200);
                        if (!titleValidation.valid) {
                            throw new APIError(
                                ErrorCodes.VALIDATION_FAILED,
                                'Invalid task title',
                                400,
                                { errors: titleValidation.errors }
                            );
                        }
                    }

                    if (updates.status) {
                        validateTaskStatus(updates.status);
                    }

                    if (updates.priority) {
                        validateTaskPriority(updates.priority);
                    }

                    taskLogger.info('updateTask', 'Updating task', { projectId, taskId, userId: user.id });

                    const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
                    
                    await withRetry(
                        () => updateDoc(taskRef, {
                            ...updates,
                            updatedAt: serverTimestamp()
                        }),
                        { maxAttempts: 3 }
                    );
                    
                    // Add audit log
                    const auditResult = await projectService.addAuditLog(
                        projectId,
                        user,
                        `Memperbarui task #${taskId}`
                    );

                    if (!auditResult.success) {
                        taskLogger.warn('updateTask', 'Failed to add audit log', {
                            projectId,
                            taskId,
                            error: auditResult.error
                        });
                    }

                    // Log user activity
                    logUserActivity(user.id, 'UPDATE_TASK', 'taskService', {
                        projectId,
                        taskId,
                        updates: Object.keys(updates)
                    });

                    taskLogger.success('updateTask', 'Task updated successfully', { projectId, taskId });
                },
                'taskService.updateTask',
                user.id
            );
        });
    },

    /**
     * Delete a task
     * @param projectId - Project ID
     * @param taskId - Task ID
     * @param user - User deleting task
     * @returns API response
     */
    deleteTask: async (projectId: string, taskId: string, user: User): Promise<APIResponse<void>> => {
        return await taskLogger.performance('deleteTask', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId);
                    validateTaskId(taskId);
                    validateUserId(user.id);

                    taskLogger.info('deleteTask', 'Deleting task', { projectId, taskId, userId: user.id });

                    const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
                    
                    // Get task data before deletion for audit log
                    const taskDoc = await withRetry(
                        () => getDoc(taskRef),
                        { maxAttempts: 2 }
                    );

                    if (!taskDoc.exists()) {
                        throw new APIError(
                            ErrorCodes.NOT_FOUND,
                            'Task not found',
                            404,
                            { projectId, taskId }
                        );
                    }

                    const taskTitle = taskDoc.data()?.title || 'Unknown';
                    
                    await withRetry(
                        () => deleteDoc(taskRef),
                        { maxAttempts: 3 }
                    );
                    
                    // Add audit log
                    const auditResult = await projectService.addAuditLog(
                        projectId,
                        user,
                        `Menghapus task: "${taskTitle}"`
                    );

                    if (!auditResult.success) {
                        taskLogger.warn('deleteTask', 'Failed to add audit log', {
                            projectId,
                            taskId,
                            error: auditResult.error
                        });
                    }

                    // Log user activity
                    logUserActivity(user.id, 'DELETE_TASK', 'taskService', {
                        projectId,
                        taskId,
                        title: taskTitle
                    });

                    taskLogger.success('deleteTask', 'Task deleted successfully', {
                        projectId,
                        taskId,
                        title: taskTitle
                    });
                },
                'taskService.deleteTask',
                user.id
            );
        });
    },

    /**
     * Add a subtask to a task
     * @param projectId - Project ID
     * @param taskId - Task ID
     * @param subtaskData - Subtask data
     * @returns API response
     */
    addSubtask: async (
        projectId: string, 
        taskId: string, 
        subtaskData: Omit<Subtask, 'id'>
    ): Promise<APIResponse<string>> => {
        return await taskLogger.performance('addSubtask', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId);
                    validateTaskId(taskId);

                    const titleValidation = validators.isValidString(subtaskData.title, 1, 200);
                    if (!titleValidation.valid) {
                        throw new APIError(
                            ErrorCodes.VALIDATION_FAILED,
                            'Invalid subtask title',
                            400,
                            { errors: titleValidation.errors }
                        );
                    }

                    taskLogger.info('addSubtask', 'Adding subtask', { projectId, taskId });

                    const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
                    const taskDoc = await withRetry(
                        () => getDoc(taskRef),
                        { maxAttempts: 2 }
                    );
                    
                    if (!taskDoc.exists()) {
                        throw new APIError(
                            ErrorCodes.NOT_FOUND,
                            'Task not found',
                            404,
                            { projectId, taskId }
                        );
                    }
                    
                    const task = docToType<Task>(taskDoc);
                    const newSubtask: Subtask = {
                        ...subtaskData,
                        id: `st_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    };
                    
                    await withRetry(
                        () => updateDoc(taskRef, {
                            subtasks: [...task.subtasks, newSubtask],
                            updatedAt: serverTimestamp()
                        }),
                        { maxAttempts: 3 }
                    );
                    
                    // Update progress
                    const progressResult = await taskService.recalculateTaskProgress(projectId, taskId);
                    if (!progressResult.success) {
                        taskLogger.warn('addSubtask', 'Failed to recalculate progress', {
                            projectId,
                            taskId,
                            error: progressResult.error
                        });
                    }

                    taskLogger.success('addSubtask', 'Subtask added successfully', {
                        projectId,
                        taskId,
                        subtaskId: newSubtask.id,
                        title: newSubtask.title
                    });

                    return newSubtask.id;
                },
                'taskService.addSubtask'
            );
        });
    },

    /**
     * Update a subtask
     * @param projectId - Project ID
     * @param taskId - Task ID
     * @param subtaskId - Subtask ID
     * @param updates - Partial subtask data to update
     * @returns API response
     */
    updateSubtask: async (
        projectId: string, 
        taskId: string, 
        subtaskId: string, 
        updates: Partial<Subtask>
    ): Promise<APIResponse<void>> => {
        return await taskLogger.performance('updateSubtask', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId);
                    validateTaskId(taskId);

                    if (!validators.isValidId(subtaskId)) {
                        throw new APIError(
                            ErrorCodes.INVALID_INPUT,
                            'Invalid subtask ID',
                            400,
                            { subtaskId }
                        );
                    }

                    if (updates.title) {
                        const titleValidation = validators.isValidString(updates.title, 1, 200);
                        if (!titleValidation.valid) {
                            throw new APIError(
                                ErrorCodes.VALIDATION_FAILED,
                                'Invalid subtask title',
                                400,
                                { errors: titleValidation.errors }
                            );
                        }
                    }

                    taskLogger.info('updateSubtask', 'Updating subtask', { projectId, taskId, subtaskId });

                    const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
                    const taskDoc = await withRetry(
                        () => getDoc(taskRef),
                        { maxAttempts: 2 }
                    );
                    
                    if (!taskDoc.exists()) {
                        throw new APIError(
                            ErrorCodes.NOT_FOUND,
                            'Task not found',
                            404,
                            { projectId, taskId }
                        );
                    }
                    
                    const task = docToType<Task>(taskDoc);
                    const subtaskExists = task.subtasks.some(st => st.id === subtaskId);

                    if (!subtaskExists) {
                        throw new APIError(
                            ErrorCodes.NOT_FOUND,
                            'Subtask not found',
                            404,
                            { projectId, taskId, subtaskId }
                        );
                    }

                    const updatedSubtasks = task.subtasks.map(st => 
                        st.id === subtaskId 
                            ? { 
                                ...st, 
                                ...updates, 
                                completedAt: updates.completed ? new Date().toISOString() : st.completedAt 
                            }
                            : st
                    );
                    
                    await withRetry(
                        () => updateDoc(taskRef, {
                            subtasks: updatedSubtasks,
                            updatedAt: serverTimestamp()
                        }),
                        { maxAttempts: 3 }
                    );
                    
                    // Update progress
                    const progressResult = await taskService.recalculateTaskProgress(projectId, taskId);
                    if (!progressResult.success) {
                        taskLogger.warn('updateSubtask', 'Failed to recalculate progress', {
                            projectId,
                            taskId,
                            error: progressResult.error
                        });
                    }

                    taskLogger.success('updateSubtask', 'Subtask updated successfully', {
                        projectId,
                        taskId,
                        subtaskId
                    });
                },
                'taskService.updateSubtask'
            );
        });
    },

    /**
     * Delete a subtask
     * @param projectId - Project ID
     * @param taskId - Task ID
     * @param subtaskId - Subtask ID
     * @returns API response
     */
    deleteSubtask: async (
        projectId: string, 
        taskId: string, 
        subtaskId: string
    ): Promise<APIResponse<void>> => {
        return await taskLogger.performance('deleteSubtask', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId);
                    validateTaskId(taskId);

                    if (!validators.isValidId(subtaskId)) {
                        throw new APIError(
                            ErrorCodes.INVALID_INPUT,
                            'Invalid subtask ID',
                            400,
                            { subtaskId }
                        );
                    }

                    taskLogger.info('deleteSubtask', 'Deleting subtask', { projectId, taskId, subtaskId });

                    const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
                    const taskDoc = await withRetry(
                        () => getDoc(taskRef),
                        { maxAttempts: 2 }
                    );
                    
                    if (!taskDoc.exists()) {
                        throw new APIError(
                            ErrorCodes.NOT_FOUND,
                            'Task not found',
                            404,
                            { projectId, taskId }
                        );
                    }
                    
                    const task = docToType<Task>(taskDoc);
                    const subtaskExists = task.subtasks.some(st => st.id === subtaskId);

                    if (!subtaskExists) {
                        throw new APIError(
                            ErrorCodes.NOT_FOUND,
                            'Subtask not found',
                            404,
                            { projectId, taskId, subtaskId }
                        );
                    }

                    const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
                    
                    await withRetry(
                        () => updateDoc(taskRef, {
                            subtasks: updatedSubtasks,
                            updatedAt: serverTimestamp()
                        }),
                        { maxAttempts: 3 }
                    );
                    
                    // Update progress
                    const progressResult = await taskService.recalculateTaskProgress(projectId, taskId);
                    if (!progressResult.success) {
                        taskLogger.warn('deleteSubtask', 'Failed to recalculate progress', {
                            projectId,
                            taskId,
                            error: progressResult.error
                        });
                    }

                    taskLogger.success('deleteSubtask', 'Subtask deleted successfully', {
                        projectId,
                        taskId,
                        subtaskId
                    });
                },
                'taskService.deleteSubtask'
            );
        });
    },

    /**
     * Recalculate task progress based on subtasks
     * @param projectId - Project ID
     * @param taskId - Task ID
     * @returns API response
     */
    recalculateTaskProgress: async (projectId: string, taskId: string): Promise<APIResponse<void>> => {
        return await taskLogger.performance('recalculateTaskProgress', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId);
                    validateTaskId(taskId);

                    taskLogger.info('recalculateTaskProgress', 'Recalculating progress', { projectId, taskId });

                    const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
                    const taskDoc = await withRetry(
                        () => getDoc(taskRef),
                        { maxAttempts: 2 }
                    );
                    
                    if (!taskDoc.exists()) {
                        taskLogger.warn('recalculateTaskProgress', 'Task not found', { projectId, taskId });
                        return;
                    }
                    
                    const task = docToType<Task>(taskDoc);
                    
                    if (task.subtasks.length === 0) {
                        // No subtasks, progress based on status
                        let progress = 0;
                        if (task.status === 'in-progress') progress = 50;
                        if (task.status === 'done') progress = 100;
                        
                        await withRetry(
                            () => updateDoc(taskRef, { progress }),
                            { maxAttempts: 2 }
                        );

                        taskLogger.debug('recalculateTaskProgress', 'Progress updated (no subtasks)', {
                            projectId,
                            taskId,
                            progress
                        });
                    } else {
                        // Calculate progress based on completed subtasks
                        const completedCount = task.subtasks.filter(st => st.completed).length;
                        const progress = Math.round((completedCount / task.subtasks.length) * 100);
                        
                        // Auto-update status based on progress
                        let newStatus = task.status;
                        if (progress === 0 && task.status !== 'blocked') newStatus = 'todo';
                        if (progress > 0 && progress < 100 && task.status !== 'blocked') newStatus = 'in-progress';
                        if (progress === 100) newStatus = 'done';
                        
                        await withRetry(
                            () => updateDoc(taskRef, { 
                                progress,
                                status: newStatus
                            }),
                            { maxAttempts: 2 }
                        );

                        taskLogger.debug('recalculateTaskProgress', 'Progress updated (with subtasks)', {
                            projectId,
                            taskId,
                            progress,
                            completedCount,
                            totalCount: task.subtasks.length,
                            newStatus
                        });
                    }

                    taskLogger.success('recalculateTaskProgress', 'Progress recalculated', { projectId, taskId });
                },
                'taskService.recalculateTaskProgress'
            );
        });
    },

    /**
     * Filter tasks by various criteria
     * @param projectId - Project ID
     * @param filters - Filter criteria
     * @returns API response with filtered tasks
     */
    filterTasks: async (projectId: string, filters: {
        status?: string;
        priority?: string;
        assignedTo?: string;
        search?: string;
    }): Promise<APIResponse<Task[]>> => {
        return await taskLogger.performance('filterTasks', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId);

                    if (filters.status) {
                        validateTaskStatus(filters.status);
                    }

                    if (filters.priority) {
                        validateTaskPriority(filters.priority);
                    }

                    if (filters.assignedTo) {
                        validateUserId(filters.assignedTo);
                    }

                    taskLogger.info('filterTasks', 'Filtering tasks', { projectId, filters });

                    const q = query(
                        collection(db, `projects/${projectId}/tasks`),
                        where(
                            filters.search ? 'title' : 'status',
                            filters.search ? 'array-contains' : '==',
                            filters.search || ''
                        ),
                        orderBy('dueDate', 'asc')
                    );
                    
                    const snapshot = await withRetry(
                        () => getDocs(q),
                        { maxAttempts: 3 }
                    );
                    
                    const tasks = snapshot.docs.map((d: QueryDocumentSnapshot<DocumentData>) => docToType<Task>(d));

                    taskLogger.success('filterTasks', 'Tasks filtered successfully', {
                        projectId,
                        resultCount: tasks.length,
                        filters
                    });

                    return tasks;
                },
                'taskService.filterTasks'
            );
        });
    }
};
