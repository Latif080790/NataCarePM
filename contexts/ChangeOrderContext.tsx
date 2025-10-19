/**
 * Change Order Management Context
 * Priority 3C: Change Order Management System
 * 
 * Provides global state management for change orders,
 * approval workflows, and impact analysis.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { changeOrderService } from '../api/changeOrderService';
import type {
  ChangeOrder,
  ChangeOrderStatus,
  ChangeOrderType,
  ChangeOrderSummary,
  ChangeOrderFilterOptions,
  ApprovalDecision,
} from '../types/changeOrder.types';

/**
 * Change Order Context State Interface
 */
interface ChangeOrderContextState {
  // Change Orders
  changeOrders: ChangeOrder[];
  selectedChangeOrder: ChangeOrder | null;
  changeOrdersLoading: boolean;
  changeOrdersError: string | null;
  
  // Summary
  summary: ChangeOrderSummary | null;
  summaryLoading: boolean;
  
  // Filters
  filters: ChangeOrderFilterOptions;
  
  // Actions - Change Orders
  fetchChangeOrders: (projectId: string, filters?: ChangeOrderFilterOptions) => Promise<void>;
  fetchChangeOrderById: (changeOrderId: string) => Promise<ChangeOrder | null>;
  createChangeOrder: (changeOrder: Omit<ChangeOrder, 'id' | 'changeNumber' | 'createdAt' | 'updatedAt'>) => Promise<ChangeOrder>;
  updateChangeOrder: (changeOrderId: string, updates: Partial<ChangeOrder>) => Promise<void>;
  deleteChangeOrder: (changeOrderId: string) => Promise<void>;
  setSelectedChangeOrder: (changeOrder: ChangeOrder | null) => void;
  setFilters: (filters: ChangeOrderFilterOptions) => void;
  
  // Actions - Approval Workflow
  processApproval: (changeOrderId: string, decision: ApprovalDecision, comments: string, approverUserId: string) => Promise<void>;
  
  // Actions - Summary
  fetchSummary: (projectId: string) => Promise<void>;
  
  // Utility
  getChangeOrdersByStatus: (status: ChangeOrderStatus) => ChangeOrder[];
  getChangeOrdersByType: (type: ChangeOrderType) => ChangeOrder[];
  getPendingApprovals: () => ChangeOrder[];
  getTotalCostImpact: () => number;
  getTotalScheduleImpact: () => number;
  refreshChangeOrders: (projectId: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Create Context
 */
const ChangeOrderContext = createContext<ChangeOrderContextState | undefined>(undefined);

/**
 * Change Order Provider Props
 */
interface ChangeOrderProviderProps {
  children: ReactNode;
}

/**
 * Change Order Provider Component
 */
export const ChangeOrderProvider: React.FC<ChangeOrderProviderProps> = ({ children }) => {
  // State
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [selectedChangeOrder, setSelectedChangeOrder] = useState<ChangeOrder | null>(null);
  const [changeOrdersLoading, setChangeOrdersLoading] = useState(false);
  const [changeOrdersError, setChangeOrdersError] = useState<string | null>(null);
  
  const [summary, setSummary] = useState<ChangeOrderSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  
  const [filters, setFilters] = useState<ChangeOrderFilterOptions>({});

  /**
   * Fetch change orders with optional filters
   */
  const fetchChangeOrders = useCallback(async (projectId: string, filterOptions?: ChangeOrderFilterOptions) => {
    setChangeOrdersLoading(true);
    setChangeOrdersError(null);
    
    try {
      const fetchedChangeOrders = await changeOrderService.getChangeOrders(projectId, filterOptions || filters);
      setChangeOrders(fetchedChangeOrders);
    } catch (error: any) {
      console.error('[ChangeOrderContext] Error fetching change orders:', error);
      setChangeOrdersError(error.message || 'Failed to fetch change orders');
    } finally {
      setChangeOrdersLoading(false);
    }
  }, [filters]);

  /**
   * Fetch change order by ID
   */
  const fetchChangeOrderById = useCallback(async (changeOrderId: string): Promise<ChangeOrder | null> => {
    try {
      const changeOrder = await changeOrderService.getChangeOrderById(changeOrderId);
      if (changeOrder) {
        // Update in list if exists
        setChangeOrders(prev => {
          const index = prev.findIndex(co => co.id === changeOrderId);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = changeOrder;
            return updated;
          }
          return prev;
        });
      }
      return changeOrder;
    } catch (error: any) {
      console.error('[ChangeOrderContext] Error fetching change order:', error);
      setChangeOrdersError(error.message || 'Failed to fetch change order');
      return null;
    }
  }, []);

  /**
   * Create new change order
   */
  const createChangeOrder = useCallback(async (
    changeOrder: Omit<ChangeOrder, 'id' | 'changeNumber' | 'createdAt' | 'updatedAt'>
  ): Promise<ChangeOrder> => {
    setChangeOrdersLoading(true);
    setChangeOrdersError(null);
    
    try {
      const newChangeOrder = await changeOrderService.createChangeOrder(changeOrder);
      setChangeOrders(prev => [newChangeOrder, ...prev]);
      return newChangeOrder;
    } catch (error: any) {
      console.error('[ChangeOrderContext] Error creating change order:', error);
      setChangeOrdersError(error.message || 'Failed to create change order');
      throw error;
    } finally {
      setChangeOrdersLoading(false);
    }
  }, []);

  /**
   * Update change order
   */
  const updateChangeOrder = useCallback(async (
    changeOrderId: string,
    updates: Partial<ChangeOrder>
  ): Promise<void> => {
    setChangeOrdersLoading(true);
    setChangeOrdersError(null);
    
    try {
      await changeOrderService.updateChangeOrder(changeOrderId, updates);
      
      // Update in local state
      setChangeOrders(prev => prev.map(co => 
        co.id === changeOrderId ? { ...co, ...updates, updatedAt: new Date() } : co
      ));
      
      // Update selected change order if it's the one being updated
      if (selectedChangeOrder?.id === changeOrderId) {
        setSelectedChangeOrder(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
      }
    } catch (error: any) {
      console.error('[ChangeOrderContext] Error updating change order:', error);
      setChangeOrdersError(error.message || 'Failed to update change order');
      throw error;
    } finally {
      setChangeOrdersLoading(false);
    }
  }, [selectedChangeOrder]);

  /**
   * Delete change order
   */
  const deleteChangeOrder = useCallback(async (changeOrderId: string): Promise<void> => {
    setChangeOrdersLoading(true);
    setChangeOrdersError(null);
    
    try {
      await changeOrderService.deleteChangeOrder(changeOrderId);
      
      // Remove from local state
      setChangeOrders(prev => prev.filter(co => co.id !== changeOrderId));
      
      // Clear selected change order if it's the one being deleted
      if (selectedChangeOrder?.id === changeOrderId) {
        setSelectedChangeOrder(null);
      }
    } catch (error: any) {
      console.error('[ChangeOrderContext] Error deleting change order:', error);
      setChangeOrdersError(error.message || 'Failed to delete change order');
      throw error;
    } finally {
      setChangeOrdersLoading(false);
    }
  }, [selectedChangeOrder]);

  /**
   * Process approval decision
   */
  const processApproval = useCallback(async (
    changeOrderId: string,
    decision: ApprovalDecision,
    comments: string,
    approverUserId: string
  ): Promise<void> => {
    setChangeOrdersLoading(true);
    setChangeOrdersError(null);
    
    try {
      await changeOrderService.processApproval(changeOrderId, decision, comments, approverUserId);
      
      // Refresh change order to get updated workflow
      await fetchChangeOrderById(changeOrderId);
    } catch (error: any) {
      console.error('[ChangeOrderContext] Error processing approval:', error);
      setChangeOrdersError(error.message || 'Failed to process approval');
      throw error;
    } finally {
      setChangeOrdersLoading(false);
    }
  }, [fetchChangeOrderById]);

  /**
   * Fetch summary statistics
   */
  const fetchSummary = useCallback(async (projectId: string): Promise<void> => {
    setSummaryLoading(true);
    
    try {
      const summaryData = await changeOrderService.getSummary(projectId);
      setSummary(summaryData);
    } catch (error: any) {
      console.error('[ChangeOrderContext] Error fetching summary:', error);
      setChangeOrdersError(error.message || 'Failed to fetch summary');
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  /**
   * Get change orders by status
   */
  const getChangeOrdersByStatus = useCallback((status: ChangeOrderStatus): ChangeOrder[] => {
    return changeOrders.filter(co => co.status === status);
  }, [changeOrders]);

  /**
   * Get change orders by type
   */
  const getChangeOrdersByType = useCallback((type: ChangeOrderType): ChangeOrder[] => {
    return changeOrders.filter(co => co.changeType === type);
  }, [changeOrders]);

  /**
   * Get pending approvals
   */
  const getPendingApprovals = useCallback((): ChangeOrder[] => {
    return changeOrders.filter(co => 
      ['submitted', 'under_review', 'pending_approval'].includes(co.status)
    );
  }, [changeOrders]);

  /**
   * Get total cost impact
   */
  const getTotalCostImpact = useCallback((): number => {
    return changeOrders.reduce((total, co) => total + co.costImpact, 0);
  }, [changeOrders]);

  /**
   * Get total schedule impact
   */
  const getTotalScheduleImpact = useCallback((): number => {
    return changeOrders.reduce((total, co) => total + co.scheduleImpact, 0);
  }, [changeOrders]);

  /**
   * Refresh change orders and summary
   */
  const refreshChangeOrders = useCallback(async (projectId: string): Promise<void> => {
    await fetchChangeOrders(projectId);
    await fetchSummary(projectId);
  }, [fetchChangeOrders, fetchSummary]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setChangeOrdersError(null);
  }, []);

  /**
   * Context value
   */
  const value: ChangeOrderContextState = {
    // Change Orders
    changeOrders,
    selectedChangeOrder,
    changeOrdersLoading,
    changeOrdersError,
    
    // Summary
    summary,
    summaryLoading,
    
    // Filters
    filters,
    
    // Actions - Change Orders
    fetchChangeOrders,
    fetchChangeOrderById,
    createChangeOrder,
    updateChangeOrder,
    deleteChangeOrder,
    setSelectedChangeOrder,
    setFilters,
    
    // Actions - Approval Workflow
    processApproval,
    
    // Actions - Summary
    fetchSummary,
    
    // Utility
    getChangeOrdersByStatus,
    getChangeOrdersByType,
    getPendingApprovals,
    getTotalCostImpact,
    getTotalScheduleImpact,
    refreshChangeOrders,
    clearError,
  };

  return (
    <ChangeOrderContext.Provider value={value}>
      {children}
    </ChangeOrderContext.Provider>
  );
};

/**
 * Custom hook to use Change Order Context
 */
export const useChangeOrder = (): ChangeOrderContextState => {
  const context = useContext(ChangeOrderContext);
  
  if (context === undefined) {
    throw new Error('useChangeOrder must be used within a ChangeOrderProvider');
  }
  
  return context;
};

export default ChangeOrderContext;
