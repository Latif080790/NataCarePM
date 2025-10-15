/**
 * 🚀 PROJECT SERVICE - ENTERPRISE EDITION
 * Fully refactored with comprehensive error handling, validation, and monitoring
 * Version: 2.0.0
 * Last Updated: October 2025
 */

import { db, storage } from '../firebaseConfig';
import { 
    collection, getDocs, getDoc, doc, addDoc, updateDoc, query, where, onSnapshot, 
    serverTimestamp, orderBy, writeBatch, Unsubscribe 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
    Workspace, AhspData, DailyReport, Attendance, Document, PurchaseOrder, Worker, User, Notification, Project 
} from '../types';

// Import utilities
import { APIResponse, wrapResponse, wrapError, safeAsync, APIError, ErrorCodes } from './utils/responseWrapper';
import { validators, firebaseValidators, validateProject, ValidationResult } from './utils/validators';
import { withRetry } from './utils/retryWrapper';
import { createScopedLogger, logUserActivity } from './utils/logger';

// Create scoped logger for this service
const logger = createScopedLogger('projectService');

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
 * Enhanced Project Service with full error handling
 */
export const projectService = {
    /**
     * Stream project by ID with real-time updates
     * @param projectId - Project ID to stream
     * @param callback - Callback function for updates
     * @param errorCallback - Optional error callback
     * @returns Unsubscribe function
     */
    streamProjectById: (
        projectId: string, 
        callback: (project: Project) => void,
        errorCallback?: (error: Error) => void
    ): Unsubscribe => {
        logger.info('streamProjectById', 'Setting up project stream', { projectId });

        try {
            // Validate project ID
            validateProjectId(projectId, 'streamProjectById');

            const projectRef = doc(db, "projects", projectId);
            
            return onSnapshot(
                projectRef,
                async (docSnapshot) => {
                    try {
                        if (docSnapshot.exists()) {
                            const projectData = docToType<Project>(docSnapshot);
                            
                            // Fetch subcollections with retry
                            const subCollections = [
                                'dailyReports', 'attendances', 'expenses', 'documents', 
                                'purchaseOrders', 'inventory', 'termins', 'auditLog'
                            ];
                            
                            for (const sc of subCollections) {
                                try {
                                    const scQuery = query(
                                        collection(db, `projects/${projectId}/${sc}`), 
                                        orderBy('timestamp', 'desc')
                                    );
                                    
                                    const scSnapshot = await withRetry(
                                        () => getDocs(scQuery),
                                        {
                                            maxAttempts: 2,
                                            onRetry: (attempt, error) => {
                                                logger.warn(
                                                    'streamProjectById',
                                                    `Retrying fetch for ${sc} (attempt ${attempt})`,
                                                    { projectId, subcollection: sc, error: error.message }
                                                );
                                            }
                                        }
                                    );
                                    
                                    (projectData as any)[sc] = scSnapshot.docs.map(d => docToType(d));
                                } catch (error) {
                                    // Non-blocking: if subcollection fails, continue with empty array
                                    logger.warn(
                                        'streamProjectById',
                                        `Failed to fetch subcollection: ${sc}`,
                                        { projectId, subcollection: sc, error }
                                    );
                                    (projectData as any)[sc] = [];
                                }
                            }
                            
                            callback(projectData);
                            
                            logger.debug('streamProjectById', 'Project data updated', { projectId });
                        } else {
                            const error = new APIError(
                                ErrorCodes.NOT_FOUND,
                                'Project not found',
                                404,
                                { projectId }
                            );
                            
                            logger.error('streamProjectById', 'Project not found', error, { projectId });
                            errorCallback?.(error);
                        }
                    } catch (error) {
                        logger.error(
                            'streamProjectById',
                            'Error processing snapshot',
                            error instanceof Error ? error : undefined,
                            { projectId }
                        );
                        errorCallback?.(error instanceof Error ? error : new Error(String(error)));
                    }
                },
                (error) => {
                    logger.error('streamProjectById', 'Snapshot listener error', error, { projectId });
                    errorCallback?.(error);
                }
            );
        } catch (error) {
            logger.error('streamProjectById', 'Failed to setup stream', error instanceof Error ? error : undefined, { projectId });
            // Return no-op unsubscribe function
            return () => {};
        }
    },

    /**
     * Stream notifications with real-time updates
     * @param callback - Callback function for updates
     * @param errorCallback - Optional error callback
     * @returns Unsubscribe function
     */
    streamNotifications: (
        callback: (notifications: Notification[]) => void,
        errorCallback?: (error: Error) => void
    ): Unsubscribe => {
        logger.info('streamNotifications', 'Setting up notifications stream');

        try {
            const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
            
            return onSnapshot(
                q,
                (querySnapshot) => {
                    try {
                        const notifs = querySnapshot.docs.map(d => docToType<Notification>(d));
                        callback(notifs);
                        
                        logger.debug('streamNotifications', 'Notifications updated', { count: notifs.length });
                    } catch (error) {
                        logger.error('streamNotifications', 'Error processing notifications', error instanceof Error ? error : undefined);
                        errorCallback?.(error instanceof Error ? error : new Error(String(error)));
                    }
                },
                (error) => {
                    logger.error('streamNotifications', 'Snapshot listener error', error);
                    errorCallback?.(error);
                }
            );
        } catch (error) {
            logger.error('streamNotifications', 'Failed to setup stream', error instanceof Error ? error : undefined);
            return () => {};
        }
    },

    /**
     * Get all workspaces with projects
     * @returns API response with workspaces
     */
    getWorkspaces: async (): Promise<APIResponse<Workspace[]>> => {
        return await logger.performance('getWorkspaces', async () => {
            return await safeAsync(
                async () => {
                    logger.info('getWorkspaces', 'Fetching workspaces');

                    // Fetch projects with retry
                    const projectsSnapshot = await withRetry(
                        () => getDocs(collection(db, "projects")),
                        {
                            maxAttempts: 3,
                            onRetry: (attempt, error) => {
                                logger.warn('getWorkspaces', `Retry attempt ${attempt}`, { error: error.message });
                            }
                        }
                    );

                    const projects = projectsSnapshot.docs.map(d => docToType<Project>(d));

                    // In a real app with multiple workspaces, you'd fetch and structure them properly
                    const workspaces: Workspace[] = [
                        { 
                            id: 'ws1', 
                            name: "NATA'CARA Corp Workspace", 
                            projects 
                        }
                    ];

                    logger.success('getWorkspaces', 'Workspaces fetched successfully', { 
                        count: workspaces.length,
                        projectCount: projects.length 
                    });

                    return workspaces;
                },
                'projectService.getWorkspaces'
            );
        });
    },

    /**
     * Get project by ID
     * @param projectId - Project ID
     * @returns API response with project data
     */
    getProjectById: async (projectId: string): Promise<APIResponse<Project>> => {
        return await logger.performance('getProjectById', async () => {
            return await safeAsync(
                async () => {
                    // Validate input
                    validateProjectId(projectId, 'getProjectById');

                    logger.info('getProjectById', 'Fetching project', { projectId });

                    // Fetch with retry
                    const docRef = doc(db, "projects", projectId);
                    const docSnap = await withRetry(
                        () => getDoc(docRef),
                        {
                            maxAttempts: 3,
                            onRetry: (attempt, error) => {
                                logger.warn('getProjectById', `Retry attempt ${attempt}`, { 
                                    projectId, 
                                    error: error.message 
                                });
                            }
                        }
                    );

                    if (!docSnap.exists()) {
                        throw new APIError(
                            ErrorCodes.NOT_FOUND,
                            'Project not found',
                            404,
                            { projectId }
                        );
                    }

                    const project = docToType<Project>(docSnap);

                    logger.success('getProjectById', 'Project fetched successfully', { 
                        projectId,
                        projectName: project.name 
                    });

                    return project;
                },
                'projectService.getProjectById'
            );
        });
    },

    /**
     * Get user by ID
     * @param userId - User ID
     * @returns API response with user data
     */
    getUserById: async (userId: string): Promise<APIResponse<User>> => {
        return await logger.performance('getUserById', async () => {
            return await safeAsync(
                async () => {
                    // Validate input
                    validateUserId(userId, 'getUserById');

                    logger.info('getUserById', 'Fetching user', { userId });

                    const docRef = doc(db, "users", userId);
                    const docSnap = await withRetry(
                        () => getDoc(docRef),
                        { maxAttempts: 3 }
                    );

                    if (!docSnap.exists()) {
                        throw new APIError(
                            ErrorCodes.NOT_FOUND,
                            'User not found',
                            404,
                            { userId }
                        );
                    }

                    const user = docToType<User>(docSnap);

                    logger.success('getUserById', 'User fetched successfully', { 
                        userId,
                        userName: user.name 
                    });

                    return user;
                },
                'projectService.getUserById'
            );
        });
    },

    /**
     * Get AHSP master data
     * @returns API response with AHSP data
     */
    getAhspData: async (): Promise<APIResponse<AhspData>> => {
        return await logger.performance('getAhspData', async () => {
            return await safeAsync(
                async () => {
                    logger.info('getAhspData', 'Fetching AHSP data');

                    const docSnap = await withRetry(
                        () => getDoc(doc(db, "masterData", "ahsp")),
                        { maxAttempts: 3 }
                    );

                    if (!docSnap.exists()) {
                        throw new APIError(
                            ErrorCodes.NOT_FOUND,
                            'AHSP data not found',
                            404
                        );
                    }

                    const data = docSnap.data() as AhspData;

                    logger.success('getAhspData', 'AHSP data fetched successfully');

                    return data;
                },
                'projectService.getAhspData'
            );
        });
    },

    /**
     * Get all workers
     * @returns API response with workers list
     */
    getWorkers: async (): Promise<APIResponse<Worker[]>> => {
        return await logger.performance('getWorkers', async () => {
            return await safeAsync(
                async () => {
                    logger.info('getWorkers', 'Fetching workers');

                    const snapshot = await withRetry(
                        () => getDocs(collection(db, "workers")),
                        { maxAttempts: 3 }
                    );

                    const workers = snapshot.docs.map(d => docToType<Worker>(d));

                    logger.success('getWorkers', 'Workers fetched successfully', { count: workers.length });

                    return workers;
                },
                'projectService.getWorkers'
            );
        });
    },

    /**
     * Get all users
     * @returns API response with users list
     */
    getUsers: async (): Promise<APIResponse<User[]>> => {
        return await logger.performance('getUsers', async () => {
            return await safeAsync(
                async () => {
                    logger.info('getUsers', 'Fetching users');

                    const snapshot = await withRetry(
                        () => getDocs(collection(db, "users")),
                        { maxAttempts: 3 }
                    );

                    const users = snapshot.docs.map(d => docToType<User>(d));

                    logger.success('getUsers', 'Users fetched successfully', { count: users.length });

                    return users;
                },
                'projectService.getUsers'
            );
        });
    },

    /**
     * Add audit log entry
     * @param projectId - Project ID
     * @param user - User performing action
     * @param action - Action description
     * @returns API response
     */
    addAuditLog: async (projectId: string, user: User, action: string): Promise<APIResponse<string>> => {
        return await logger.performance('addAuditLog', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId, 'addAuditLog');
                    validateUserId(user.id, 'addAuditLog');

                    if (!validators.isNonEmptyString(action)) {
                        throw new APIError(
                            ErrorCodes.INVALID_INPUT,
                            'Action description is required',
                            400
                        );
                    }

                    logger.info('addAuditLog', 'Adding audit log', { projectId, userId: user.id, action });

                    const docRef = await withRetry(
                        () => addDoc(collection(db, `projects/${projectId}/auditLog`), {
                            timestamp: serverTimestamp(),
                            userId: user.id,
                            userName: user.name,
                            action
                        }),
                        { maxAttempts: 3 }
                    );

                    // Log user activity
                    logUserActivity(user.id, 'AUDIT_LOG', 'projectService', {
                        projectId,
                        action
                    });

                    logger.success('addAuditLog', 'Audit log added', { 
                        projectId, 
                        logId: docRef.id,
                        action 
                    });

                    return docRef.id;
                },
                'projectService.addAuditLog',
                user.id
            );
        });
    },

    /**
     * Update purchase order status
     * @param projectId - Project ID
     * @param poId - Purchase order ID
     * @param status - New status
     * @param user - User performing update
     * @returns API response
     */
    updatePOStatus: async (
        projectId: string, 
        poId: string, 
        status: PurchaseOrder['status'], 
        user: User
    ): Promise<APIResponse<void>> => {
        return await logger.performance('updatePOStatus', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId, 'updatePOStatus');
                    validateUserId(user.id, 'updatePOStatus');

                    if (!validators.isValidId(poId)) {
                        throw new APIError(
                            ErrorCodes.INVALID_INPUT,
                            'Invalid purchase order ID',
                            400,
                            { poId }
                        );
                    }

                    const validStatuses: PurchaseOrder['status'][] = [
                        'Menunggu Persetujuan', 
                        'Disetujuan', 
                        'Ditolak', 
                        'PO Dibuat',
                        'Dipesan',
                        'Diterima Sebagian',
                        'Diterima Penuh'
                    ];

                    if (!validators.isValidEnum(status, validStatuses)) {
                        throw new APIError(
                            ErrorCodes.INVALID_INPUT,
                            'Invalid purchase order status',
                            400,
                            { status, validStatuses }
                        );
                    }

                    logger.info('updatePOStatus', 'Updating PO status', { 
                        projectId, 
                        poId, 
                        status,
                        userId: user.id 
                    });

                    const poRef = doc(db, `projects/${projectId}/purchaseOrders`, poId);

                    // Update with retry
                    await withRetry(
                        () => updateDoc(poRef, { 
                            status, 
                            approver: user.name, 
                            approvalDate: new Date().toISOString() 
                        }),
                        { maxAttempts: 3 }
                    );

                    // Get PO data for audit log
                    const po = (await getDoc(poRef)).data();
                    
                    // Add audit log
                    await projectService.addAuditLog(
                        projectId, 
                        user, 
                        `Memperbarui status PO #${po?.prNumber} menjadi ${status}.`
                    );

                    // Log user activity
                    logUserActivity(user.id, 'UPDATE_PO_STATUS', 'projectService', {
                        projectId,
                        poId,
                        status,
                        prNumber: po?.prNumber
                    });

                    logger.success('updatePOStatus', 'PO status updated', { 
                        projectId, 
                        poId, 
                        status 
                    });
                },
                'projectService.updatePOStatus',
                user.id
            );
        });
    },

    /**
     * Add daily report
     * @param projectId - Project ID
     * @param reportData - Report data
     * @param user - User creating report
     * @returns API response with report ID
     */
    addDailyReport: async (
        projectId: string, 
        reportData: Omit<DailyReport, 'id' | 'comments'>, 
        user: User
    ): Promise<APIResponse<string>> => {
        return await logger.performance('addDailyReport', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId, 'addDailyReport');
                    validateUserId(user.id, 'addDailyReport');

                    if (!validators.isValidDate(reportData.date)) {
                        throw new APIError(
                            ErrorCodes.INVALID_INPUT,
                            'Invalid report date',
                            400,
                            { date: reportData.date }
                        );
                    }

                    logger.info('addDailyReport', 'Adding daily report', { 
                        projectId, 
                        date: reportData.date,
                        userId: user.id 
                    });

                    const docRef = await withRetry(
                        () => addDoc(collection(db, `projects/${projectId}/dailyReports`), { 
                            ...reportData, 
                            timestamp: new Date(reportData.date) 
                        }),
                        { maxAttempts: 3 }
                    );

                    // Add audit log
                    await projectService.addAuditLog(
                        projectId, 
                        user, 
                        `Menambahkan laporan harian untuk tanggal ${reportData.date}.`
                    );

                    // Log user activity
                    logUserActivity(user.id, 'CREATE_DAILY_REPORT', 'projectService', {
                        projectId,
                        reportId: docRef.id,
                        date: reportData.date
                    });

                    logger.success('addDailyReport', 'Daily report added', { 
                        projectId, 
                        reportId: docRef.id,
                        date: reportData.date 
                    });

                    return docRef.id;
                },
                'projectService.addDailyReport',
                user.id
            );
        });
    },

    /**
     * Add purchase order
     * @param projectId - Project ID
     * @param poData - Purchase order data
     * @param user - User creating PO
     * @returns API response with PO ID
     */
    addPurchaseOrder: async (
        projectId: string, 
        poData: Omit<PurchaseOrder, 'id' | 'status'>, 
        user: User
    ): Promise<APIResponse<string>> => {
        return await logger.performance('addPurchaseOrder', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId, 'addPurchaseOrder');
                    validateUserId(user.id, 'addPurchaseOrder');

                    // Validate PO data
                    const validation = validators.isValidString(poData.prNumber, 1, 50);
                    if (!validation.valid) {
                        throw new APIError(
                            ErrorCodes.VALIDATION_FAILED,
                            'Invalid PR number',
                            400,
                            { errors: validation.errors }
                        );
                    }

                    if (!validators.isNonEmptyArray(poData.items)) {
                        throw new APIError(
                            ErrorCodes.INVALID_INPUT,
                            'At least one item is required',
                            400
                        );
                    }

                    logger.info('addPurchaseOrder', 'Adding purchase order', { 
                        projectId, 
                        prNumber: poData.prNumber,
                        itemCount: poData.items.length,
                        userId: user.id 
                    });

                    const docRef = await withRetry(
                        () => addDoc(collection(db, `projects/${projectId}/purchaseOrders`), { 
                            ...poData, 
                            status: 'Menunggu Persetujuan' as PurchaseOrder['status'],
                            timestamp: new Date(poData.requestDate)
                        }),
                        { maxAttempts: 3 }
                    );

                    // Add audit log
                    await projectService.addAuditLog(
                        projectId, 
                        user, 
                        `Membuat Purchase Order baru: ${poData.prNumber}.`
                    );

                    // Log user activity
                    logUserActivity(user.id, 'CREATE_PURCHASE_ORDER', 'projectService', {
                        projectId,
                        poId: docRef.id,
                        prNumber: poData.prNumber,
                        itemCount: poData.items.length
                    });

                    logger.success('addPurchaseOrder', 'Purchase order added', { 
                        projectId, 
                        poId: docRef.id,
                        prNumber: poData.prNumber 
                    });

                    return docRef.id;
                },
                'projectService.addPurchaseOrder',
                user.id
            );
        });
    },

    /**
     * Add document with file upload
     * @param projectId - Project ID
     * @param docData - Document metadata
     * @param file - File to upload
     * @param user - User uploading document
     * @returns API response with document ID
     */
    addDocument: async (
        projectId: string, 
        docData: Omit<Document, 'id' | 'url'>, 
        file: File, 
        user: User
    ): Promise<APIResponse<string>> => {
        return await logger.performance('addDocument', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId, 'addDocument');
                    validateUserId(user.id, 'addDocument');

                    if (!validators.isNonEmptyString(docData.name)) {
                        throw new APIError(
                            ErrorCodes.INVALID_INPUT,
                            'Document name is required',
                            400
                        );
                    }

                    // Validate file
                    if (!file || !(file instanceof File)) {
                        throw new APIError(
                            ErrorCodes.INVALID_INPUT,
                            'Valid file is required',
                            400
                        );
                    }

                    // Check file size (max 100MB)
                    const maxSize = 100 * 1024 * 1024;
                    if (file.size > maxSize) {
                        throw new APIError(
                            ErrorCodes.INVALID_INPUT,
                            'File size exceeds 100MB limit',
                            400,
                            { fileSize: file.size, maxSize }
                        );
                    }

                    logger.info('addDocument', 'Uploading document', { 
                        projectId, 
                        fileName: file.name,
                        fileSize: file.size,
                        userId: user.id 
                    });

                    // Upload file with retry
                    const storageRef = ref(storage, `projects/${projectId}/documents/${Date.now()}_${file.name}`);
                    
                    const uploadResult = await withRetry(
                        () => uploadBytes(storageRef, file),
                        {
                            maxAttempts: 3,
                            onRetry: (attempt, error) => {
                                logger.warn('addDocument', `File upload retry ${attempt}`, {
                                    projectId,
                                    fileName: file.name,
                                    error: error.message
                                });
                            }
                        }
                    );

                    const url = await withRetry(
                        () => getDownloadURL(uploadResult.ref),
                        { maxAttempts: 3 }
                    );

                    logger.info('addDocument', 'File uploaded, saving metadata', { 
                        projectId,
                        fileName: file.name,
                        url 
                    });

                    // Save document metadata
                    const docRef = await withRetry(
                        () => addDoc(collection(db, `projects/${projectId}/documents`), { 
                            ...docData, 
                            url, 
                            timestamp: new Date(docData.uploadDate)
                        }),
                        { maxAttempts: 3 }
                    );

                    // Add audit log
                    await projectService.addAuditLog(
                        projectId, 
                        user, 
                        `Mengunggah dokumen baru: ${docData.name}.`
                    );

                    // Log user activity
                    logUserActivity(user.id, 'UPLOAD_DOCUMENT', 'projectService', {
                        projectId,
                        documentId: docRef.id,
                        fileName: file.name,
                        fileSize: file.size
                    });

                    logger.success('addDocument', 'Document uploaded successfully', { 
                        projectId, 
                        documentId: docRef.id,
                        fileName: file.name 
                    });

                    return docRef.id;
                },
                'projectService.addDocument',
                user.id
            );
        });
    },

    /**
     * Update attendance records
     * @param projectId - Project ID
     * @param date - Attendance date
     * @param updates - Array of worker ID and status pairs
     * @param user - User updating attendance
     * @returns API response
     */
    updateAttendance: async (
        projectId: string, 
        date: string, 
        updates: [string, Attendance['status']][], 
        user: User
    ): Promise<APIResponse<void>> => {
        return await logger.performance('updateAttendance', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId, 'updateAttendance');
                    validateUserId(user.id, 'updateAttendance');

                    if (!validators.isValidDate(date)) {
                        throw new APIError(
                            ErrorCodes.INVALID_INPUT,
                            'Invalid attendance date',
                            400,
                            { date }
                        );
                    }

                    if (!validators.isNonEmptyArray(updates)) {
                        throw new APIError(
                            ErrorCodes.INVALID_INPUT,
                            'At least one attendance update is required',
                            400
                        );
                    }

                    // Validate batch size (Firestore limit: 500 writes)
                    const batchValidation = firebaseValidators.isValidBatchSize(updates.length);
                    if (!batchValidation.valid) {
                        throw new APIError(
                            ErrorCodes.INVALID_INPUT,
                            batchValidation.errors[0],
                            400,
                            { updateCount: updates.length }
                        );
                    }

                    logger.info('updateAttendance', 'Updating attendance records', { 
                        projectId, 
                        date,
                        updateCount: updates.length,
                        userId: user.id 
                    });

                    const batch = writeBatch(db);
                    const attendanceCol = collection(db, `projects/${projectId}/attendances`);

                    // Query for existing docs on that date
                    const q = query(attendanceCol, where("date", "==", date));
                    const existingDocs = await withRetry(
                        () => getDocs(q),
                        { maxAttempts: 3 }
                    );

                    const existingMap = new Map(existingDocs.docs.map(d => [d.data().workerId, d.id]));

                    // Prepare batch updates
                    updates.forEach(([workerId, status]) => {
                        const docId = existingMap.get(workerId);
                        const docRef = docId 
                            ? doc(attendanceCol, docId) 
                            : doc(attendanceCol);
                        
                        batch.set(docRef, { 
                            workerId, 
                            status, 
                            date, 
                            timestamp: new Date(date) 
                        });
                    });

                    // Commit batch with retry
                    await withRetry(
                        () => batch.commit(),
                        {
                            maxAttempts: 3,
                            onRetry: (attempt, error) => {
                                logger.warn('updateAttendance', `Batch commit retry ${attempt}`, {
                                    projectId,
                                    date,
                                    error: error.message
                                });
                            }
                        }
                    );

                    // Add audit log
                    await projectService.addAuditLog(
                        projectId, 
                        user, 
                        `Memperbarui absensi untuk tanggal ${date}.`
                    );

                    // Log user activity
                    logUserActivity(user.id, 'UPDATE_ATTENDANCE', 'projectService', {
                        projectId,
                        date,
                        updateCount: updates.length
                    });

                    logger.success('updateAttendance', 'Attendance updated', { 
                        projectId, 
                        date,
                        updateCount: updates.length 
                    });
                },
                'projectService.updateAttendance',
                user.id
            );
        });
    },

    /**
     * Add comment to daily report
     * @param projectId - Project ID
     * @param reportId - Report ID
     * @param content - Comment content
     * @param user - User adding comment
     * @returns API response with comment ID
     */
    addCommentToDailyReport: async (
        projectId: string, 
        reportId: string, 
        content: string, 
        user: User
    ): Promise<APIResponse<string>> => {
        return await logger.performance('addCommentToDailyReport', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    validateProjectId(projectId, 'addCommentToDailyReport');
                    validateUserId(user.id, 'addCommentToDailyReport');

                    if (!validators.isValidId(reportId)) {
                        throw new APIError(
                            ErrorCodes.INVALID_INPUT,
                            'Invalid report ID',
                            400,
                            { reportId }
                        );
                    }

                    const contentValidation = validators.isValidString(content, 1, 5000);
                    if (!contentValidation.valid) {
                        throw new APIError(
                            ErrorCodes.VALIDATION_FAILED,
                            'Invalid comment content',
                            400,
                            { errors: contentValidation.errors }
                        );
                    }

                    logger.info('addCommentToDailyReport', 'Adding comment to daily report', { 
                        projectId, 
                        reportId,
                        userId: user.id 
                    });

                    const commentsCol = collection(db, `projects/${projectId}/dailyReports/${reportId}/comments`);
                    
                    const docRef = await withRetry(
                        () => addDoc(commentsCol, {
                            content: validators.sanitizeString(content),
                            authorId: user.id,
                            authorName: user.name,
                            authorAvatar: user.avatarUrl,
                            timestamp: serverTimestamp()
                        }),
                        { maxAttempts: 3 }
                    );

                    // Add audit log
                    await projectService.addAuditLog(
                        projectId, 
                        user, 
                        `Menambahkan komentar pada laporan harian.`
                    );

                    // Log user activity
                    logUserActivity(user.id, 'ADD_COMMENT', 'projectService', {
                        projectId,
                        reportId,
                        commentId: docRef.id
                    });

                    logger.success('addCommentToDailyReport', 'Comment added', { 
                        projectId, 
                        reportId,
                        commentId: docRef.id 
                    });

                    return docRef.id;
                },
                'projectService.addCommentToDailyReport',
                user.id
            );
        });
    },

    /**
     * Mark notifications as read
     * @param notificationIds - Array of notification IDs
     * @returns API response
     */
    markNotificationsAsRead: async (notificationIds: string[]): Promise<APIResponse<void>> => {
        return await logger.performance('markNotificationsAsRead', async () => {
            return await safeAsync(
                async () => {
                    // Validate inputs
                    const idsValidation = validators.isValidArray(notificationIds, 1, 500);
                    if (!idsValidation.valid) {
                        throw new APIError(
                            ErrorCodes.VALIDATION_FAILED,
                            idsValidation.errors[0],
                            400,
                            { count: notificationIds.length }
                        );
                    }

                    logger.info('markNotificationsAsRead', 'Marking notifications as read', { 
                        count: notificationIds.length 
                    });

                    const batch = writeBatch(db);
                    
                    notificationIds.forEach(id => {
                        if (validators.isValidId(id)) {
                            const notifRef = doc(db, 'notifications', id);
                            batch.update(notifRef, { isRead: true });
                        } else {
                            logger.warn('markNotificationsAsRead', 'Invalid notification ID skipped', { id });
                        }
                    });

                    await withRetry(
                        () => batch.commit(),
                        {
                            maxAttempts: 3,
                            onRetry: (attempt, error) => {
                                logger.warn('markNotificationsAsRead', `Batch commit retry ${attempt}`, {
                                    count: notificationIds.length,
                                    error: error.message
                                });
                            }
                        }
                    );

                    logger.success('markNotificationsAsRead', 'Notifications marked as read', { 
                        count: notificationIds.length 
                    });
                },
                'projectService.markNotificationsAsRead'
            );
        });
    }
};
