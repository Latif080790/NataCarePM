/**
 * Integration Context
 * 
 * Provides integration state and functions to components throughout the application
 */

import * as React from 'react';
import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { integrationGateway, IntegrationConfig } from '@/api/integrationGateway';
import { erpIntegrationService } from '@/services/erpIntegrationService';
import { crmIntegrationService } from '@/services/crmIntegrationService';
import { accountingIntegrationService } from '@/services/accountingIntegrationService';
import { logger } from '@/utils/logger.enhanced';

// Type definitions
interface IntegrationState {
  integrations: IntegrationConfig[];
  loading: boolean;
  error: string | null;
  syncStatus: {
    lastSync: Date | null;
    isSyncing: boolean;
    syncError: string | null;
  };
}

type IntegrationAction =
  | { type: 'SET_INTEGRATIONS'; payload: IntegrationConfig[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SYNC_STATUS'; payload: Partial<IntegrationState['syncStatus']> }
  | { type: 'ADD_INTEGRATION'; payload: IntegrationConfig }
  | { type: 'UPDATE_INTEGRATION'; payload: IntegrationConfig }
  | { type: 'REMOVE_INTEGRATION'; payload: string };

// Initial state
const initialState: IntegrationState = {
  integrations: [],
  loading: false,
  error: null,
  syncStatus: {
    lastSync: null,
    isSyncing: false,
    syncError: null
  }
};

// Reducer
function integrationReducer(state: IntegrationState, action: IntegrationAction): IntegrationState {
  switch (action.type) {
    case 'SET_INTEGRATIONS':
      return {
        ...state,
        integrations: action.payload,
        loading: false,
        error: null
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case 'SET_SYNC_STATUS':
      return {
        ...state,
        syncStatus: {
          ...state.syncStatus,
          ...action.payload
        }
      };
    
    case 'ADD_INTEGRATION':
      return {
        ...state,
        integrations: [...state.integrations, action.payload]
      };
    
    case 'UPDATE_INTEGRATION':
      return {
        ...state,
        integrations: state.integrations.map(integration => 
          integration.id === action.payload.id ? action.payload : integration
        )
      };
    
    case 'REMOVE_INTEGRATION':
      return {
        ...state,
        integrations: state.integrations.filter(integration => 
          integration.id !== action.payload
        )
      };
    
    default:
      return state;
  }
}

// Context
interface IntegrationContextType extends IntegrationState {
  // Integration management
  fetchIntegrations: () => Promise<void>;
  createIntegration: (config: IntegrationConfig) => Promise<boolean>;
  updateIntegration: (id: string, config: Partial<IntegrationConfig>) => Promise<boolean>;
  deleteIntegration: (id: string) => Promise<boolean>;
  
  // Sync operations
  syncAllData: () => Promise<void>;
  syncIntegration: (id: string) => Promise<boolean>;
  
  // ERP integration
  fetchERPData: () => Promise<void>;
  
  // CRM integration
  fetchCRMData: () => Promise<void>;
  
  // Accounting integration
  fetchAccountingData: () => Promise<void>;
}

const IntegrationContext = createContext<IntegrationContextType | undefined>(undefined);

// Provider component
export const IntegrationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(integrationReducer, initialState);

  // Fetch all integrations on mount
  useEffect(() => {
    fetchIntegrations();
  }, []);

  // Fetch all integrations
  const fetchIntegrations = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await integrationGateway.getIntegrations();
      
      if (response.success && response.data) {
        dispatch({ type: 'SET_INTEGRATIONS', payload: response.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error?.message || 'Failed to fetch integrations' });
      }
    } catch (error) {
      logger.error('Failed to fetch integrations in context', error instanceof Error ? error : new Error(String(error)));
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch integrations' });
    }
  };

  // Create integration
  const createIntegration = async (config: IntegrationConfig): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await integrationGateway.createIntegration(config);
      
      if (response.success && response.data) {
        dispatch({ type: 'ADD_INTEGRATION', payload: response.data });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error?.message || 'Failed to create integration' });
        return false;
      }
    } catch (error) {
      logger.error('Failed to create integration in context', error instanceof Error ? error : new Error(String(error)));
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create integration' });
      return false;
    }
  };

  // Update integration
  const updateIntegration = async (id: string, config: Partial<IntegrationConfig>): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await integrationGateway.updateIntegration(id, config);
      
      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_INTEGRATION', payload: response.data });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error?.message || 'Failed to update integration' });
        return false;
      }
    } catch (error) {
      logger.error('Failed to update integration in context', error instanceof Error ? error : new Error(String(error)));
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update integration' });
      return false;
    }
  };

  // Delete integration
  const deleteIntegration = async (id: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await integrationGateway.deleteIntegration(id);
      
      if (response.success) {
        dispatch({ type: 'REMOVE_INTEGRATION', payload: id });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error?.message || 'Failed to delete integration' });
        return false;
      }
    } catch (error) {
      logger.error('Failed to delete integration in context', error instanceof Error ? error : new Error(String(error)));
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete integration' });
      return false;
    }
  };

  // Sync all data
  const syncAllData = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_SYNC_STATUS', payload: { isSyncing: true, syncError: null } });
      
      // In a real implementation, this would sync data with all enabled integrations
      // For now, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      dispatch({ 
        type: 'SET_SYNC_STATUS', 
        payload: { 
          isSyncing: false, 
          lastSync: new Date(),
          syncError: null
        } 
      });
      
      logger.info('All data synced successfully');
    } catch (error) {
      logger.error('Failed to sync all data', error instanceof Error ? error : new Error(String(error)));
      dispatch({ 
        type: 'SET_SYNC_STATUS', 
        payload: { 
          isSyncing: false, 
          syncError: 'Failed to sync data'
        } 
      });
    }
  };

  // Sync specific integration
  const syncIntegration = async (id: string): Promise<boolean> => {
    try {
      // In a real implementation, this would sync data with a specific integration
      // For now, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      logger.info('Integration synced successfully', { integrationId: id });
      return true;
    } catch (error) {
      logger.error('Failed to sync integration', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  };

  // Fetch ERP data
  const fetchERPData = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Fetch ERP data
      await erpIntegrationService.getProjects();
      await erpIntegrationService.getTasks();
      await erpIntegrationService.getResources();
      
      dispatch({ type: 'SET_LOADING', payload: false });
      logger.info('ERP data fetched successfully');
    } catch (error) {
      logger.error('Failed to fetch ERP data', error instanceof Error ? error : new Error(String(error)));
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch ERP data' });
    }
  };

  // Fetch CRM data
  const fetchCRMData = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Fetch CRM data
      await crmIntegrationService.getContacts();
      await crmIntegrationService.getOpportunities();
      await crmIntegrationService.getAccounts();
      
      dispatch({ type: 'SET_LOADING', payload: false });
      logger.info('CRM data fetched successfully');
    } catch (error) {
      logger.error('Failed to fetch CRM data', error instanceof Error ? error : new Error(String(error)));
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch CRM data' });
    }
  };

  // Fetch accounting data
  const fetchAccountingData = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Fetch accounting data
      await accountingIntegrationService.getChartOfAccounts();
      await accountingIntegrationService.getJournalEntries();
      await accountingIntegrationService.getInvoices();
      
      dispatch({ type: 'SET_LOADING', payload: false });
      logger.info('Accounting data fetched successfully');
    } catch (error) {
      logger.error('Failed to fetch accounting data', error instanceof Error ? error : new Error(String(error)));
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch accounting data' });
    }
  };

  // Context value
  const contextValue: IntegrationContextType = {
    ...state,
    fetchIntegrations,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    syncAllData,
    syncIntegration,
    fetchERPData,
    fetchCRMData,
    fetchAccountingData
  };

  return (
    <IntegrationContext.Provider value={contextValue}>
      {children}
    </IntegrationContext.Provider>
  );
};

// Hook to use integration context
export const useIntegration = (): IntegrationContextType => {
  const context = useContext(IntegrationContext);
  
  if (context === undefined) {
    throw new Error('useIntegration must be used within an IntegrationProvider');
  }
  
  return context;
};

export default IntegrationContext;