import { db } from '../firebaseConfig';
import { 
    collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, serverTimestamp, writeBatch
} from "firebase/firestore";
import { Task, Subtask, TaskComment, User } from '../types';
import { projectService } from './projectService';

// Helper to convert Firestore doc to TypeScript types
const docToType = <T>(document: any): T => {
    const data = document.data();
    return { ...data, id: document.id } as T;
};

export const taskService = {
    // --- Real-time streaming ---
    streamTasksByProject: (projectId: string, callback: (tasks: Task[]) => void) => {
        const q = query(
            collection(db, `projects/${projectId}/tasks`),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (querySnapshot) => {
            const tasks = querySnapshot.docs.map(d => docToType<Task>(d));
            callback(tasks);
        });
    },

    streamTaskComments: (projectId: string, taskId: string, callback: (comments: TaskComment[]) => void) => {
        const q = query(
            collection(db, `projects/${projectId}/tasks/${taskId}/comments`),
            orderBy('timestamp', 'asc')
        );
        return onSnapshot(q, (querySnapshot) => {
            const comments = querySnapshot.docs.map(d => docToType<TaskComment>(d));
            callback(comments);
        });
    },

    // --- Read operations ---
    getTasksByProject: async (projectId: string): Promise<Task[]> => {
        const q = query(
            collection(db, `projects/${projectId}/tasks`),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => docToType<Task>(d));
    },

    getTaskById: async (projectId: string, taskId: string): Promise<Task | null> => {
        const docRef = doc(db, `projects/${projectId}/tasks`, taskId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docToType<Task>(docSnap) : null;
    },

    getTasksByAssignee: async (projectId: string, userId: string): Promise<Task[]> => {
        const q = query(
            collection(db, `projects/${projectId}/tasks`),
            where('assignedTo', 'array-contains', userId),
            orderBy('dueDate', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => docToType<Task>(d));
    },

    // --- Write operations ---
    createTask: async (projectId: string, taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, user: User): Promise<string> => {
        const newTask = {
            ...taskData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        
        const docRef = await addDoc(collection(db, `projects/${projectId}/tasks`), newTask);
        
        // Add audit log
        await projectService.addAuditLog(
            projectId, 
            user, 
            `Membuat task baru: "${taskData.title}"`
        );
        
        return docRef.id;
    },

    updateTask: async (projectId: string, taskId: string, updates: Partial<Task>, user: User): Promise<void> => {
        const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
        await updateDoc(taskRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        
        // Add audit log
        await projectService.addAuditLog(
            projectId,
            user,
            `Memperbarui task #${taskId}`
        );
    },

    deleteTask: async (projectId: string, taskId: string, user: User): Promise<void> => {
        const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
        const task = await getDoc(taskRef);
        
        await deleteDoc(taskRef);
        
        // Add audit log
        await projectService.addAuditLog(
            projectId,
            user,
            `Menghapus task: "${task.data()?.title}"`
        );
    },

    // --- Subtask operations ---
    addSubtask: async (projectId: string, taskId: string, subtaskData: Omit<Subtask, 'id'>): Promise<void> => {
        const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
        const taskDoc = await getDoc(taskRef);
        
        if (!taskDoc.exists()) throw new Error('Task not found');
        
        const task = docToType<Task>(taskDoc);
        const newSubtask: Subtask = {
            ...subtaskData,
            id: `st_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        
        await updateDoc(taskRef, {
            subtasks: [...task.subtasks, newSubtask],
            updatedAt: serverTimestamp()
        });
        
        // Update progress
        await taskService.recalculateTaskProgress(projectId, taskId);
    },

    updateSubtask: async (projectId: string, taskId: string, subtaskId: string, updates: Partial<Subtask>): Promise<void> => {
        const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
        const taskDoc = await getDoc(taskRef);
        
        if (!taskDoc.exists()) throw new Error('Task not found');
        
        const task = docToType<Task>(taskDoc);
        const updatedSubtasks = task.subtasks.map(st => 
            st.id === subtaskId 
                ? { ...st, ...updates, completedAt: updates.completed ? new Date().toISOString() : st.completedAt }
                : st
        );
        
        await updateDoc(taskRef, {
            subtasks: updatedSubtasks,
            updatedAt: serverTimestamp()
        });
        
        // Update progress
        await taskService.recalculateTaskProgress(projectId, taskId);
    },

    deleteSubtask: async (projectId: string, taskId: string, subtaskId: string): Promise<void> => {
        const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
        const taskDoc = await getDoc(taskRef);
        
        if (!taskDoc.exists()) throw new Error('Task not found');
        
        const task = docToType<Task>(taskDoc);
        const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
        
        await updateDoc(taskRef, {
            subtasks: updatedSubtasks,
            updatedAt: serverTimestamp()
        });
        
        // Update progress
        await taskService.recalculateTaskProgress(projectId, taskId);
    },

    // --- Task progress calculation ---
    recalculateTaskProgress: async (projectId: string, taskId: string): Promise<void> => {
        const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
        const taskDoc = await getDoc(taskRef);
        
        if (!taskDoc.exists()) return;
        
        const task = docToType<Task>(taskDoc);
        
        if (task.subtasks.length === 0) {
            // No subtasks, progress based on status
            let progress = 0;
            if (task.status === 'in-progress') progress = 50;
            if (task.status === 'done') progress = 100;
            
            await updateDoc(taskRef, { progress });
        } else {
            // Calculate progress based on completed subtasks
            const completedCount = task.subtasks.filter(st => st.completed).length;
            const progress = Math.round((completedCount / task.subtasks.length) * 100);
            
            // Auto-update status based on progress
            let newStatus = task.status;
            if (progress === 0 && task.status !== 'blocked') newStatus = 'todo';
            if (progress > 0 && progress < 100 && task.status !== 'blocked') newStatus = 'in-progress';
            if (progress === 100) newStatus = 'done';
            
            await updateDoc(taskRef, { 
                progress,
                status: newStatus
            });
        }
    },

    // --- Assignment operations ---
    assignTask: async (projectId: string, taskId: string, userIds: string[], user: User): Promise<void> => {
        const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
        await updateDoc(taskRef, {
            assignedTo: userIds,
            updatedAt: serverTimestamp()
        });
        
        await projectService.addAuditLog(
            projectId,
            user,
            `Menugaskan task #${taskId} ke ${userIds.length} user(s)`
        );
    },

    // --- Comment operations ---
    addComment: async (projectId: string, taskId: string, content: string, user: User): Promise<void> => {
        await addDoc(collection(db, `projects/${projectId}/tasks/${taskId}/comments`), {
            taskId,
            content,
            authorId: user.id,
            authorName: user.name,
            authorAvatar: user.avatarUrl,
            timestamp: serverTimestamp()
        });
    },

    // --- Bulk operations ---
    updateMultipleTasks: async (projectId: string, updates: { taskId: string; data: Partial<Task> }[], user: User): Promise<void> => {
        const batch = writeBatch(db);
        
        updates.forEach(({ taskId, data }) => {
            const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
            batch.update(taskRef, {
                ...data,
                updatedAt: serverTimestamp()
            });
        });
        
        await batch.commit();
        
        await projectService.addAuditLog(
            projectId,
            user,
            `Memperbarui ${updates.length} task(s) secara batch`
        );
    },

    // --- Filter & Search ---
    filterTasks: async (
        projectId: string,
        filters: {
            status?: Task['status'];
            priority?: Task['priority'];
            assignedTo?: string;
            tags?: string[];
        }
    ): Promise<Task[]> => {
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
            q = query(q, where('tags', 'array-contains-any', filters.tags));
        }
        
        q = query(q, orderBy('createdAt', 'desc'));
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => docToType<Task>(d));
    }
};
