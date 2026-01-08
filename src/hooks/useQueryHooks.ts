/**
 * React Query Hooks for Project Data
 * Phase 5: Scale & Optimize - Advanced Caching
 * 
 * Provides cached, deduplicated data fetching for:
 * - Projects
 * - RAB Items
 * - Inventory (Materials)
 * - Tasks
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { queryKeys, STALE_TIMES, CACHE_TIMES } from '@/config/queryClient';
import { projectService } from '@/api/projectService';
import { rabAhspService } from '@/api/rabAhspService';
import { getMaterials } from '@/api/inventoryService';
import { taskService } from '@/api/taskService';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext.minimal'; // Use minimal version
import type { Project, RabItem, Task } from '@/types';
import type { InventoryMaterial } from '@/types/inventory';

// ============================================
// PROJECT HOOKS
// ============================================

/**
 * Fetch all projects (via workspaces)
 */
export function useProjects(options?: Partial<UseQueryOptions<Project[]>>) {
  return useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: async () => {
      const result = await projectService.getWorkspaces();
      if (!result.data) return [];
      // Flatten projects from all workspaces
      return result.data.flatMap(ws => ws.projects || []);
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
    gcTime: CACHE_TIMES.LONG,
    ...options,
  });
}

/**
 * Fetch single project details
 */
export function useProject(projectId: string | undefined, options?: Partial<UseQueryOptions<Project | null>>) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId ?? ''),
    queryFn: async () => {
      if (!projectId) return null;
      const result = await projectService.getProjectById(projectId);
      return result.data ?? null;
    },
    enabled: !!projectId,
    staleTime: STALE_TIMES.SEMI_STATIC,
    ...options,
  });
}

// ============================================
// RAB (BUDGET) HOOKS
// ============================================

/**
 * Fetch RAB items for a project
 */
export function useRabItems(projectId: string | undefined, options?: Partial<UseQueryOptions<RabItem[]>>) {
  return useQuery({
    queryKey: queryKeys.rab.list(projectId ?? ''),
    queryFn: async () => {
      if (!projectId) return [];
      const result = await rabAhspService.getRabItemsByProject(projectId);
      return result.data ?? [];
    },
    enabled: !!projectId,
    staleTime: STALE_TIMES.SEMI_STATIC,
    gcTime: CACHE_TIMES.LONG,
    ...options,
  });
}

/**
 * Fetch single RAB item
 */
export function useRabItem(projectId: string | undefined, itemId: string | number | undefined) {
  return useQuery({
    queryKey: queryKeys.rab.item(projectId ?? '', String(itemId ?? '')),
    queryFn: async () => {
      if (!projectId || !itemId) return null;
      const numericId = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;
      if (isNaN(numericId)) return null;
      const result = await rabAhspService.getRabItemById(projectId, numericId);
      return result.data ?? null;
    },
    enabled: !!projectId && !!itemId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Mutation to create RAB item
 */
export function useCreateRabItem() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ projectId, item }: { projectId: string; item: Omit<RabItem, 'id'> }) => {
      const result = await rabAhspService.createRabItem(projectId, item);
      return result.data;
    },
    onSuccess: (_, { projectId }) => {
      // Invalidate RAB list cache
      queryClient.invalidateQueries({ queryKey: queryKeys.rab.list(projectId) });
      addToast('Item RAB berhasil ditambahkan', 'success');
    },
    onError: (error) => {
      addToast(`Gagal menambah item RAB: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    },
  });
}

/**
 * Mutation to update RAB item
 */
export function useUpdateRabItem() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ projectId, itemId, updates }: { projectId: string; itemId: string | number; updates: Partial<RabItem> }) => {
      const numericId = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;
      const result = await rabAhspService.updateRabItem(projectId, numericId, updates);
      return result.data;
    },
    onSuccess: (_, { projectId, itemId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rab.list(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.rab.item(projectId, String(itemId)) });
      addToast('Item RAB berhasil diupdate', 'success');
    },
    onError: (error) => {
      addToast(`Gagal update item RAB: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    },
  });
}

// ============================================
// INVENTORY HOOKS
// ============================================

/**
 * Fetch inventory materials (global, not project-specific)
 */
export function useInventoryMaterials(options?: Partial<UseQueryOptions<InventoryMaterial[]>>) {
  return useQuery({
    queryKey: queryKeys.inventory.list('all'),
    queryFn: async () => {
      const materials = await getMaterials();
      return materials;
    },
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: CACHE_TIMES.MEDIUM,
    ...options,
  });
}

/**
 * Fetch low stock inventory materials
 */
export function useLowStockMaterials() {
  return useQuery({
    queryKey: queryKeys.inventory.lowStock('all'),
    queryFn: async () => {
      const materials = await getMaterials();
      // Filter items where currentStock < minimumStock
      return materials.filter(m => m.currentStock < m.minimumStock);
    },
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

// ============================================
// TASK HOOKS
// ============================================

/**
 * Fetch tasks for a project
 */
export function useTasks(projectId: string | undefined, options?: Partial<UseQueryOptions<Task[]>>) {
  return useQuery({
    queryKey: queryKeys.tasks.list(projectId ?? ''),
    queryFn: async () => {
      if (!projectId) return [];
      const result = await taskService.getTasksByProject(projectId);
      return result.data ?? [];
    },
    enabled: !!projectId,
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: CACHE_TIMES.MEDIUM,
    ...options,
  });
}

/**
 * Fetch overdue tasks (client-side filtering)
 */
export function useOverdueTasks(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tasks.overdue(projectId ?? ''),
    queryFn: async () => {
      if (!projectId) return [];
      const result = await taskService.getTasksByProject(projectId);
      const now = new Date();
      // Filter overdue tasks (past due date and not completed)
      return (result.data ?? []).filter(task => {
        if (!task.dueDate || task.status === 'completed' || task.status === 'done') return false;
        return new Date(task.dueDate) < now;
      });
    },
    enabled: !!projectId,
    staleTime: STALE_TIMES.REALTIME,
  });
}

/**
 * Mutation to create task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ projectId, task }: { projectId: string; task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> }) => {
      if (!currentUser) throw new Error('User not authenticated');
      const result = await taskService.createTask(projectId, task, currentUser);
      return result.data;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list(projectId) });
      addToast('Task berhasil ditambahkan', 'success');
    },
    onError: (error) => {
      addToast(`Gagal menambah task: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    },
  });
}

/**
 * Mutation to update task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ projectId, taskId, updates }: { projectId: string; taskId: string; updates: Partial<Task> }) => {
      if (!currentUser) throw new Error('User not authenticated');
      const result = await taskService.updateTask(projectId, taskId, updates, currentUser);
      return result.data;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.overdue(projectId) });
      addToast('Task berhasil diupdate', 'success');
    },
    onError: (error) => {
      addToast(`Gagal update task: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    },
  });
}

// ============================================
// PREFETCH UTILITIES
// ============================================

/**
 * Prefetch project data for navigation
 */
export function usePrefetchProject() {
  const queryClient = useQueryClient();

  return (projectId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.projects.detail(projectId),
      queryFn: async () => {
        const result = await projectService.getProjectById(projectId);
        return result.data ?? null;
      },
      staleTime: STALE_TIMES.SEMI_STATIC,
    });

    // Also prefetch related data
    queryClient.prefetchQuery({
      queryKey: queryKeys.rab.list(projectId),
      queryFn: async () => {
        const result = await rabAhspService.getRabItemsByProject(projectId);
        return result.data ?? [];
      },
      staleTime: STALE_TIMES.SEMI_STATIC,
    });
  };
}

/**
 * Invalidate all project-related caches
 */
export function useInvalidateProjectCache() {
  const queryClient = useQueryClient();

  return (projectId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.rab.list(projectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory.list(projectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list(projectId) });
  };
}

export default {
  useProjects,
  useProject,
  useRabItems,
  useRabItem,
  useCreateRabItem,
  useUpdateRabItem,
  useInventoryMaterials,
  useLowStockMaterials,
  useTasks,
  useOverdueTasks,
  useCreateTask,
  useUpdateTask,
  usePrefetchProject,
  useInvalidateProjectCache,
};
