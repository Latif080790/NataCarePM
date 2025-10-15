/**
 * 🚀 TASK SERVICE - ENTERPRISE EDITION
 * Fully refactored with comprehensive error handling, validation, and monitoring
 * Version: 2.0.0
 * Last Updated: October 2025
 */

import { db } from '../firebaseConfig';
import { 
    collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where, 
    orderBy, onSnapshot, serverTimestamp, writeBatch, Unsubscribe
} from "firebase/firestore";
import { Task, Subtask, TaskComment, User } from '../types';
import { projectService } from './projectService';

// Import utilities
import { APIResponse, wrapResponse, wrapError, safeAsync, APIError, ErrorCodes } from './utils/responseWrapper';
import { validators, firebaseValidators, ValidationResult } from './utils/validators';
import { withRetry } from './utils/retryWrapper';
import { createScopedLogger, logUserActivity } from './utils/logger';

// Create scoped logger for this service
const logger = createScopedLogger('taskService');

/**
 * Helper to convert Firestore doc to TypeScript types
 */
const docToType = <T>(document: any): T => {
    const data = document.data();
    return { ...data, id: document.id } as T;
};

/**
 * Validate project ID
 */
const validateProjectId = (projectId: string, context: string): void => {
    const validation = validators.isValidProjectId(projectId);
    if (!validation.valid) {
        logger.warn(context, 'Invalid project ID', { projectId, errors: validation.errors });
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
const validateTaskId = (taskId: string, context: string): void => {
    if (!validators.isValidId(taskId)) {
        logger.warn(context, 'Invalid task ID', { taskId });
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
const validateUserId = (userId: string, context: string): void => {
    if (!validators.isValidId(userId)) {
        logger.warn(context, 'Invalid user ID', { userId });
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
const validateTaskStatus = (status: string, context: string): void => {
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
const validateTaskPriority = (priority: string, context: string): void => {
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
        logger.info('streamTasksByProject', 'Setting up tasks stream', { projectId });

        try {
            // Validate project ID
            validateProjectId(projectId, 'streamTasksByProject');

            const q = query(
                collection(db, `projects/${projectId}/tasks`),
                orderBy('createdAt', 'desc')
            );
            
            return onSnapshot(
                q,
                (querySnapshot) => {
                    try {
                        const tasks = querySnapshot.docs.map(d => docToType<Task>(d));
                        callback(tasks);
                        
                        logger.debug('streamTasksByProject', 'Tasks updated', { 
                            projectId, 
                            count: tasks.length 
                        });
                    } catch (error) {
                        logger.error(
                            'streamTasksByProject',
                            'Error processing snapshot',
                            error instanceof Error ? error : undefined,
                            { projectId }
                        );
                        errorCallback?.(error instanceof Error ? error : new Error(String(error)));
                    }
                },
                (error) => {
                    logger.error('streamTasksByProject', 'Snapshot listener error', error, { projectId });
                    errorCallback?.(error);
                }
            );
        } catch (error) {
            logger.error(
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
        logger.info('streamTaskComments', 'Setting up comments stream', { projectId, taskId });

        try {
            // Validate IDs
            validateProjectId(projectId, 'streamTaskComments');
            validateTaskId(taskId, 'streamTaskComments');

            const q = query(
                collection(db, `projects/${projectId}/tasks/${taskId}/comments`),
                orderBy('timestamp', 'asc')
            );
            
            return onSnapshot(
                q,
                (querySnapshot) => {
                    try {
                        const comments = querySnapshot.docs.map(d => docToType<TaskComment>(d));
                        callback(comments);
                        
                        logger.debug('streamTaskComments', 'Comments updated', { 
                            projectId, 
                            taskId,
                            count: comments.length 
                        });
                    } catch (error) {
                        logger.error(
                            'streamTaskComments',
                            'Error processing snapshot',
                            error instanceof Error ? error : undefined,
                            { projectId, taskId }
                        );
                        errorCallback?.(error instanceof Error ? error : new Error(String(error)));
                    }
                },
                (error) => {
                    logger.error('streamTaskComments', 'Snapshot listener error', error, { projectId, taskId });
                    errorCallback?.(error);
                }
            );
        } catch (error) {
            logger.error(
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
        return await logger.performance('getTasksByProject', async () => {
            return await safeAsync(
                async () => {
                    // Validate input
                    validateProjectId(projectId, 'getTasksByProject');

                    logger.info('getTasksByProject', 'Fetching tasks', { projectId });

                    const q = query(
                        collection(db, `projects/${projectId}/tasks`),
                        orderBy('createdAt', 'desc')
                    );
                    
                    const snapshot = await withRetry(
                        () => getDocs(q),
                        {
                            maxAttempts: 3,
                            onRetry: (attempt, error) => {
                                logger.warn('getTasksByProject', `Retry attempt ${attempt}`, {
                                    projectId,
                                    error: error.message
                                });
                            }
                        }
                    );
                    
                    const tasks = snapshot.docs.map(d => docToType<Task>(d));

                    logger.success('getTasksByProject', 'Tasks fetched successfully', {
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
        return await logger.performance('getTaskById', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId, 'getTaskById');
                    validateTaskId(taskId, 'getTaskById');

                    logger.info('getTaskById', 'Fetching task', { projectId, taskId });

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

                    logger.success('getTaskById', 'Task fetched successfully', {
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
        return await logger.performance('getTasksByAssignee', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId, 'getTasksByAssignee');
                    validateUserId(userId, 'getTasksByAssignee');

                    logger.info('getTasksByAssignee', 'Fetching assigned tasks', { projectId, userId });

                    const q = query(
                        collection(db, `projects/${projectId}/tasks`),
                        where('assignedTo', 'array-contains', userId),
                        orderBy('dueDate', 'asc')
                    );
                    
                    const snapshot = await withRetry(
                        () => getDocs(q),
                        { maxAttempts: 3 }
                    );
                    
                    const tasks = snapshot.docs.map(d => docToType<Task>(d));

                    logger.success('getTasksByAssignee', 'Assigned tasks fetched', {
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
        return await logger.performance('createTask', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId, 'createTask');
                    validateUserId(user.id, 'createTask');

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

                    validateTaskStatus(taskData.status, 'createTask');
                    validateTaskPriority(taskData.priority, 'createTask');

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

                    logger.info('createTask', 'Creating new task', {
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
                        logger.warn('createTask', 'Failed to add audit log', {
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

                    logger.success('createTask', 'Task created successfully', {
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
        return await logger.performance('updateTask', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId, 'updateTask');
                    validateTaskId(taskId, 'updateTask');
                    validateUserId(user.id, 'updateTask');

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
                        validateTaskStatus(updates.status, 'updateTask');
                    }

                    if (updates.priority) {
                        validateTaskPriority(updates.priority, 'updateTask');
                    }

                    logger.info('updateTask', 'Updating task', { projectId, taskId, userId: user.id });

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
                        logger.warn('updateTask', 'Failed to add audit log', {
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

                    logger.success('updateTask', 'Task updated successfully', { projectId, taskId });
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
        return await logger.performance('deleteTask', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId, 'deleteTask');
                    validateTaskId(taskId, 'deleteTask');
                    validateUserId(user.id, 'deleteTask');

                    logger.info('deleteTask', 'Deleting task', { projectId, taskId, userId: user.id });

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
                        logger.warn('deleteTask', 'Failed to add audit log', {
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

                    logger.success('deleteTask', 'Task deleted successfully', {
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
        return await logger.performance('addSubtask', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId, 'addSubtask');
                    validateTaskId(taskId, 'addSubtask');

                    const titleValidation = validators.isValidString(subtaskData.title, 1, 200);
                    if (!titleValidation.valid) {
                        throw new APIError(
                            ErrorCodes.VALIDATION_FAILED,
                            'Invalid subtask title',
                            400,
                            { errors: titleValidation.errors }
                        );
                    }

                    logger.info('addSubtask', 'Adding subtask', { projectId, taskId });

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
                        logger.warn('addSubtask', 'Failed to recalculate progress', {
                            projectId,
                            taskId,
                            error: progressResult.error
                        });
                    }

                    logger.success('addSubtask', 'Subtask added successfully', {
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
        return await logger.performance('updateSubtask', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId, 'updateSubtask');
                    validateTaskId(taskId, 'updateSubtask');

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

                    logger.info('updateSubtask', 'Updating subtask', { projectId, taskId, subtaskId });

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
                        logger.warn('updateSubtask', 'Failed to recalculate progress', {
                            projectId,
                            taskId,
                            error: progressResult.error
                        });
                    }

                    logger.success('updateSubtask', 'Subtask updated successfully', {
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
        return await logger.performance('deleteSubtask', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId, 'deleteSubtask');
                    validateTaskId(taskId, 'deleteSubtask');

                    if (!validators.isValidId(subtaskId)) {
                        throw new APIError(
                            ErrorCodes.INVALID_INPUT,
                            'Invalid subtask ID',
                            400,
                            { subtaskId }
                        );
                    }

                    logger.info('deleteSubtask', 'Deleting subtask', { projectId, taskId, subtaskId });

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
                        logger.warn('deleteSubtask', 'Failed to recalculate progress', {
                            projectId,
                            taskId,
                            error: progressResult.error
                        });
                    }

                    logger.success('deleteSubtask', 'Subtask deleted successfully', {
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
        return await logger.performance('recalculateTaskProgress', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId, 'recalculateTaskProgress');
                    validateTaskId(taskId, 'recalculateTaskProgress');

                    logger.info('recalculateTaskProgress', 'Recalculating progress', { projectId, taskId });

                    const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
                    const taskDoc = await withRetry(
                        () => getDoc(taskRef),
                        { maxAttempts: 2 }
                    );
                    
                    if (!taskDoc.exists()) {
                        logger.warn('recalculateTaskProgress', 'Task not found', { projectId, taskId });
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

                        logger.debug('recalculateTaskProgress', 'Progress updated (no subtasks)', {
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

                        logger.debug('recalculateTaskProgress', 'Progress updated (with subtasks)', {
                            projectId,
                            taskId,
                            progress,
                            completedCount,
                            totalCount: task.subtasks.length,
                            newStatus
                        });
                    }

                    logger.success('recalculateTaskProgress', 'Progress recalculated', { projectId, taskId });
                },
                'taskService.recalculateTaskProgress'
            );
        });
    },

    /**
     * Assign task to users
     * @param projectId - Project ID
     * @param taskId - Task ID
     * @param userIds - Array of user IDs
     * @param user - User performing assignment
     * @returns API response
     */
    assignTask: async (
        projectId: string, 
        taskId: string, 
        userIds: string[], 
        user: User
    ): Promise<APIResponse<void>> => {
        return await logger.performance('assignTask', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId, 'assignTask');
                    validateTaskId(taskId, 'assignTask');
                    validateUserId(user.id, 'assignTask');

                    const userIdsValidation = validators.isValidArray(userIds, 1, 50);
                    if (!userIdsValidation.valid) {
                        throw new APIError(
                            ErrorCodes.VALIDATION_FAILED,
                            'Invalid user IDs array',
                            400,
                            { errors: userIdsValidation.errors }
                        );
                    }

                    // Validate each user ID
                    userIds.forEach((uid, index) => {
                        if (!validators.isValidId(uid)) {
                            throw new APIError(
                                ErrorCodes.INVALID_INPUT,
                                `Invalid user ID at index ${index}`,
                                400,
                                { userId: uid, index }
                            );
                        }
                    });

                    logger.info('assignTask', 'Assigning task', {
                        projectId,
                        taskId,
                        userCount: userIds.length,
                        userId: user.id
                    });

                    const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
                    
                    await withRetry(
                        () => updateDoc(taskRef, {
                            assignedTo: userIds,
                            updatedAt: serverTimestamp()
                        }),
                        { maxAttempts: 3 }
                    );
                    
                    // Add audit log
                    const auditResult = await projectService.addAuditLog(
                        projectId,
                        user,
                        `Menugaskan task #${taskId} ke ${userIds.length} user(s)`
                    );

                    if (!auditResult.success) {
                        logger.warn('assignTask', 'Failed to add audit log', {
                            projectId,
                            taskId,
                            error: auditResult.error
                        });
                    }

                    // Log user activity
                    logUserActivity(user.id, 'ASSIGN_TASK', 'taskService', {
                        projectId,
                        taskId,
                        assignedCount: userIds.length
                    });

                    logger.success('assignTask', 'Task assigned successfully', {
                        projectId,
                        taskId,
                        userCount: userIds.length
                    });
                },
                'taskService.assignTask',
                user.id
            );
        });
    },

    /**
     * Add comment to task
     * @param projectId - Project ID
     * @param taskId - Task ID
     * @param content - Comment content
     * @param user - User adding comment
     * @returns API response with comment ID
     */
    addComment: async (
        projectId: string, 
        taskId: string, 
        content: string, 
        user: User
    ): Promise<APIResponse<string>> => {
        return await logger.performance('addComment', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId, 'addComment');
                    validateTaskId(taskId, 'addComment');
                    validateUserId(user.id, 'addComment');

                    const contentValidation = validators.isValidString(content, 1, 5000);
                    if (!contentValidation.valid) {
                        throw new APIError(
                            ErrorCodes.VALIDATION_FAILED,
                            'Invalid comment content',
                            400,
                            { errors: contentValidation.errors }
                        );
                    }

                    logger.info('addComment', 'Adding comment', { projectId, taskId, userId: user.id });

                    const docRef = await withRetry(
                        () => addDoc(collection(db, `projects/${projectId}/tasks/${taskId}/comments`), {
                            taskId,
                            content: validators.sanitizeString(content),
                            authorId: user.id,
                            authorName: user.name,
                            authorAvatar: user.avatarUrl,
                            timestamp: serverTimestamp()
                        }),
                        { maxAttempts: 3 }
                    );

                    // Log user activity
                    logUserActivity(user.id, 'ADD_TASK_COMMENT', 'taskService', {
                        projectId,
                        taskId,
                        commentId: docRef.id
                    });

                    logger.success('addComment', 'Comment added successfully', {
                        projectId,
                        taskId,
                        commentId: docRef.id
                    });

                    return docRef.id;
                },
                'taskService.addComment',
                user.id
            );
        });
    },

    /**
     * Update multiple tasks in batch
     * @param projectId - Project ID
     * @param updates - Array of task updates
     * @param user - User performing updates
     * @returns API response
     */
    updateMultipleTasks: async (
        projectId: string, 
        updates: { taskId: string; data: Partial<Task> }[], 
        user: User
    ): Promise<APIResponse<void>> => {
        return await logger.performance('updateMultipleTasks', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId, 'updateMultipleTasks');
                    validateUserId(user.id, 'updateMultipleTasks');

                    const updatesValidation = validators.isValidArray(updates, 1, 500);
                    if (!updatesValidation.valid) {
                        throw new APIError(
                            ErrorCodes.VALIDATION_FAILED,
                            'Invalid updates array',
                            400,
                            { errors: updatesValidation.errors }
                        );
                    }

                    // Validate batch size
                    const batchValidation = firebaseValidators.isValidBatchSize(updates.length);
                    if (!batchValidation.valid) {
                        throw new APIError(
                            ErrorCodes.VALIDATION_FAILED,
                            batchValidation.errors[0],
                            400,
                            { updateCount: updates.length }
                        );
                    }

                    // Validate each task ID
                    updates.forEach((update, index) => {
                        if (!validators.isValidId(update.taskId)) {
                            throw new APIError(
                                ErrorCodes.INVALID_INPUT,
                                `Invalid task ID at index ${index}`,
                                400,
                                { taskId: update.taskId, index }
                            );
                        }
                    });

                    logger.info('updateMultipleTasks', 'Updating multiple tasks', {
                        projectId,
                        updateCount: updates.length,
                        userId: user.id
                    });

                    const batch = writeBatch(db);
                    
                    updates.forEach(({ taskId, data }) => {
                        const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
                        batch.update(taskRef, {
                            ...data,
                            updatedAt: serverTimestamp()
                        });
                    });
                    
                    await withRetry(
                        () => batch.commit(),
                        {
                            maxAttempts: 3,
                            onRetry: (attempt, error) => {
                                logger.warn('updateMultipleTasks', `Batch commit retry ${attempt}`, {
                                    projectId,
                                    updateCount: updates.length,
                                    error: error.message
                                });
                            }
                        }
                    );
                    
                    // Add audit log
                    const auditResult = await projectService.addAuditLog(
                        projectId,
                        user,
                        `Memperbarui ${updates.length} task(s) secara batch`
                    );

                    if (!auditResult.success) {
                        logger.warn('updateMultipleTasks', 'Failed to add audit log', {
                            projectId,
                            error: auditResult.error
                        });
                    }

                    // Log user activity
                    logUserActivity(user.id, 'BATCH_UPDATE_TASKS', 'taskService', {
                        projectId,
                        updateCount: updates.length
                    });

                    logger.success('updateMultipleTasks', 'Tasks updated successfully', {
                        projectId,
                        updateCount: updates.length
                    });
                },
                'taskService.updateMultipleTasks',
                user.id
            );
        });
    },

    /**
     * Filter tasks by criteria
     * CRITICAL: Handles Firestore array-contains-any limit (max 10 items)
     * @param projectId - Project ID
     * @param filters - Filter criteria
     * @returns API response with filtered tasks
     */
    filterTasks: async (
        projectId: string,
        filters: {
            status?: Task['status'];
            priority?: Task['priority'];
            assignedTo?: string;
            tags?: string[];
        }
    ): Promise<APIResponse<Task[]>> => {
        return await logger.performance('filterTasks', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId, 'filterTasks');

                    if (filters.status) {
                        validateTaskStatus(filters.status, 'filterTasks');
                    }

                    if (filters.priority) {
                        validateTaskPriority(filters.priority, 'filterTasks');
                    }

                    if (filters.assignedTo) {
                        validateUserId(filters.assignedTo, 'filterTasks');
                    }

                    // CRITICAL: Validate tags array (Firestore limit: max 10 items for array-contains-any)
                    if (filters.tags && filters.tags.length > 0) {
                        const tagsValidation = firebaseValidators.isValidArrayContainsAny(filters.tags);
                        if (!tagsValidation.valid) {
                            throw new APIError(
                                ErrorCodes.VALIDATION_FAILED,
                                tagsValidation.errors[0],
                                400,
                                { tagCount: filters.tags.length, maxAllowed: 10 }
                            );
                        }
                    }

                    logger.info('filterTasks', 'Filtering tasks', { projectId, filters });

                    let q = query(collection(db, `projects/${projectId}/tasks`));
                    
                    if (filters.status) {
                        q = query(q, where('status', '==', filters.status));
                    }
                    
                    if (filters.priority) {
                        q = query(q, where('priority', '==', filters.priority));
                    }
                    
                    if (filters.assignedTo) {
                        q = query(q, where('assignedTo', 'array-contains', filters.assignedTo));
                    }
                    
                    if (filters.tags && filters.tags.length > 0) {
                        // Safe to use array-contains-any because we validated max 10 items
                        q = query(q, where('tags', 'array-contains-any', filters.tags));
                    }
                    
                    q = query(q, orderBy('createdAt', 'desc'));
                    
                    const snapshot = await withRetry(
                        () => getDocs(q),
                        {
                            maxAttempts: 3,
                            onRetry: (attempt, error) => {
                                logger.warn('filterTasks', `Query retry ${attempt}`, {
                                    projectId,
                                    error: error.message
                                });
                            }
                        }
                    );
                    
                    const tasks = snapshot.docs.map(d => docToType<Task>(d));

                    logger.success('filterTasks', 'Tasks filtered successfully', {
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
