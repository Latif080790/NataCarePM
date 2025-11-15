/**
 * Integration Dashboard View
 * 
 * Central dashboard for managing all third-party integrations
 */

import React, { useState } from 'react';
import { useIntegration } from '@/contexts/IntegrationContext';
import { logger } from '@/utils/logger.enhanced';

// Type definitions
interface IntegrationForm {
  id: string;
  name: string;
  type: 'erp' | 'crm' | 'accounting' | 'hr' | 'custom';
  baseUrl: string;
  authType: 'oauth2' | 'api_key' | 'basic' | 'saml';
  clientId: string;
  clientSecret: string;
  enabled: boolean;
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
}

const IntegrationDashboardView: React.FC = React.memo(() => {
  const {
    integrations,
    loading,
    error,
    syncStatus,
    fetchIntegrations,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    syncAllData
  } = useIntegration();
  
  const [showForm, setShowForm] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<string | null>(null);
  const [formData, setFormData] = useState<IntegrationForm>({
    id: '',
    name: '',
    type: 'erp',
    baseUrl: '',
    authType: 'oauth2',
    clientId: '',
    clientSecret: '',
    enabled: true,
    syncFrequency: 'hourly'
  });
  
  const [localError, setLocalError] = useState<string | null>(null);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    try {
      // Validate required fields
      if (!formData.name || !formData.baseUrl) {
        setLocalError('Name and Base URL are required');
        return;
      }
      
      if (editingIntegration) {
        // Update existing integration
        const success = await updateIntegration(editingIntegration, {
          ...formData,
          credentials: {
            clientId: formData.clientId,
            clientSecret: formData.clientSecret
          }
        });
        
        if (!success) {
          setLocalError('Failed to update integration');
          return;
        }
        
        setEditingIntegration(null);
      } else {
        // Create new integration
        const newIntegration = {
          ...formData,
          id: formData.id || `int-${Date.now()}`,
          credentials: {
            clientId: formData.clientId,
            clientSecret: formData.clientSecret
          }
        };
        
        const success = await createIntegration(newIntegration);
        
        if (!success) {
          setLocalError('Failed to create integration');
          return;
        }
      }
      
      // Reset form
      setFormData({
        id: '',
        name: '',
        type: 'erp',
        baseUrl: '',
        authType: 'oauth2',
        clientId: '',
        clientSecret: '',
        enabled: true,
        syncFrequency: 'hourly'
      });
      
      setShowForm(false);
    } catch (err) {
      logger.error('Failed to save integration', err instanceof Error ? err : new Error(String(err)));
      setLocalError('An unexpected error occurred');
    }
  };

  // Handle edit integration
  const handleEdit = (id: string) => {
    const integration = integrations.find(int => int.id === id);
    if (integration) {
      setFormData({
        id: integration.id,
        name: integration.name,
        type: integration.type,
        baseUrl: integration.baseUrl,
        authType: integration.authType,
        clientId: integration.credentials?.clientId || '',
        clientSecret: integration.credentials?.clientSecret || '',
        enabled: integration.enabled,
        syncFrequency: integration.syncFrequency
      });
      setEditingIntegration(id);
      setShowForm(true);
    }
  };

  // Handle delete integration
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this integration?')) {
      try {
        const success = await deleteIntegration(id);
        if (!success) {
          setLocalError('Failed to delete integration');
        }
      } catch (err) {
        logger.error('Failed to delete integration', err instanceof Error ? err : new Error(String(err)));
        setLocalError('An unexpected error occurred');
      }
    }
  };

  // Handle sync all data
  const handleSyncAll = async () => {
    try {
      await syncAllData();
    } catch (err) {
      logger.error('Failed to sync all data', err instanceof Error ? err : new Error(String(err)));
      setLocalError('Failed to sync data');
    }
  };

  // Get integration type label
  const getIntegrationTypeLabel = (type: string) => {
    switch (type) {
      case 'erp': return 'ERP System';
      case 'crm': return 'CRM System';
      case 'accounting': return 'Accounting System';
      case 'hr': return 'HR System';
      case 'custom': return 'Custom Integration';
      default: return type;
    }
  };

  // Get sync frequency label
  const getSyncFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'realtime': return 'Real-time';
      case 'hourly': return 'Hourly';
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      default: return frequency;
    }
  };

  // Get status badge
  const getStatusBadge = (enabled: boolean) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        enabled 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {enabled ? 'Enabled' : 'Disabled'}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integration Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage all third-party system integrations</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleSyncAll}
            disabled={syncStatus.isSyncing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {syncStatus.isSyncing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing...
              </>
            ) : (
              'Sync All Data'
            )}
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingIntegration(null);
              setFormData({
                id: '',
                name: '',
                type: 'erp',
                baseUrl: '',
                authType: 'oauth2',
                clientId: '',
                clientSecret: '',
                enabled: true,
                syncFrequency: 'hourly'
              });
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Add Integration
          </button>
        </div>
      </div>

      {/* Sync Status */}
      {syncStatus.lastSync && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="text-sm text-blue-700">
              Last synced: {syncStatus.lastSync.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {(error || localError) && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="text-sm text-red-700">
              {error || localError}
            </p>
          </div>
        </div>
      )}

      {/* Integration Form */}
      {showForm && (
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingIntegration ? 'Edit Integration' : 'Add New Integration'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="erp">ERP System</option>
                  <option value="crm">CRM System</option>
                  <option value="accounting">Accounting System</option>
                  <option value="hr">HR System</option>
                  <option value="custom">Custom Integration</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-700">Base URL</label>
                <input
                  type="url"
                  id="baseUrl"
                  name="baseUrl"
                  value={formData.baseUrl}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="authType" className="block text-sm font-medium text-gray-700">Auth Type</label>
                <select
                  id="authType"
                  name="authType"
                  value={formData.authType}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="oauth2">OAuth 2.0</option>
                  <option value="api_key">API Key</option>
                  <option value="basic">Basic Auth</option>
                  <option value="saml">SAML</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">Client ID</label>
                <input
                  type="text"
                  id="clientId"
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700">Client Secret</label>
                <input
                  type="password"
                  id="clientSecret"
                  name="clientSecret"
                  value={formData.clientSecret}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="syncFrequency" className="block text-sm font-medium text-gray-700">Sync Frequency</label>
                <select
                  id="syncFrequency"
                  name="syncFrequency"
                  value={formData.syncFrequency}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="realtime">Real-time</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              
              <div className="flex items-center pt-6">
                <input
                  id="enabled"
                  name="enabled"
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
                  Enabled
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {editingIntegration ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Integrations List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Active Integrations</h2>
          <p className="mt-1 text-sm text-gray-500">
            {integrations.length} integration{integrations.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : integrations.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No integrations</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a new integration.
            </p>
            <div className="mt-6">
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingIntegration(null);
                  setFormData({
                    id: '',
                    name: '',
                    type: 'erp',
                    baseUrl: '',
                    authType: 'oauth2',
                    clientId: '',
                    clientSecret: '',
                    enabled: true,
                    syncFrequency: 'hourly'
                  });
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Integration
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Integration
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sync Frequency
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Sync
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {integrations.map((integration) => (
                  <tr key={integration.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-md flex items-center justify-center">
                          <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                          </svg>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{integration.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{integration.baseUrl}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getIntegrationTypeLabel(integration.type)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(integration.enabled)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getSyncFrequencyLabel(integration.syncFrequency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {integration.lastSync 
                        ? new Date(integration.lastSync).toLocaleDateString() 
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(integration.id)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(integration.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
});

IntegrationDashboardView.displayName = 'IntegrationDashboardView';

export default IntegrationDashboardView;