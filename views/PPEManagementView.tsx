import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Shield, Plus, Search, Filter, Package, AlertTriangle, TrendingDown, 
  DollarSign, Calendar, CheckCircle, XCircle, Users, Download 
} from 'lucide-react';
import { useSafety } from '@/contexts/SafetyContext';
import { PPEForm } from '@/components/safety/PPEForm';
import type { PPEInventory, PPEType } from '@/types/safety.types';

interface PPEManagementViewProps {
  projectId: string;
}

export const PPEManagementView: React.FC<PPEManagementViewProps> = ({ projectId }) => {
  const {
    ppeInventory,
    ppeAssignments,
    ppeLoading,
    ppeError,
    fetchPPEInventory,
    createPPEItem,
    updatePPEItem,
  } = useSafety();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<PPEType | 'all'>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PPEInventory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch PPE data
  useEffect(() => {
    fetchPPEInventory(projectId);
  }, [projectId, fetchPPEInventory]);

  // Filter PPE items
  const filteredItems = useMemo(() => {
    return ppeInventory.filter(item => {
      const matchesSearch = !searchQuery || 
        item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || item.type === selectedType;
      const matchesStockFilter = !showLowStockOnly || item.availableQuantity <= item.reorderLevel;
      return matchesSearch && matchesType && matchesStockFilter;
    });
  }, [ppeInventory, searchQuery, selectedType, showLowStockOnly]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalItems = ppeInventory.length;
    const totalValue = ppeInventory.reduce((sum, item) => sum + item.totalValue, 0);
    const lowStockItems = ppeInventory.filter(item => item.availableQuantity <= item.reorderLevel).length;
    const outOfStockItems = ppeInventory.filter(item => item.availableQuantity === 0).length;
    const totalAssigned = ppeAssignments.filter(a => a.status === 'active').length;
    const damagedItems = ppeInventory.reduce((sum, item) => sum + item.damagedQuantity, 0);

    return {
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      totalAssigned,
      damagedItems,
    };
  }, [ppeInventory, ppeAssignments]);

  // Handle create PPE
  const handleCreatePPE = useCallback(async (itemData: Omit<PPEInventory, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsSubmitting(true);
    try {
      await createPPEItem(itemData);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating PPE item:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [createPPEItem]);

  // Handle update PPE
  const handleUpdatePPE = useCallback(async (itemData: Omit<PPEInventory, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedItem) return;
    
    setIsSubmitting(true);
    try {
      await updatePPEItem(selectedItem.id, itemData);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error updating PPE item:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedItem, updatePPEItem]);

  // Get stock status color
  const getStockStatusColor = (item: PPEInventory): string => {
    if (item.availableQuantity === 0) return 'text-red-600 dark:text-red-400';
    if (item.availableQuantity <= item.reorderLevel) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  // Get stock status badge
  const getStockStatusBadge = (item: PPEInventory) => {
    if (item.availableQuantity === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-full text-xs font-medium">
          <XCircle className="w-3 h-3" />
          Out of Stock
        </span>
      );
    }
    if (item.availableQuantity <= item.reorderLevel) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-medium">
          <AlertTriangle className="w-3 h-3" />
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
        <CheckCircle className="w-3 h-3" />
        In Stock
      </span>
    );
  };

  if (ppeError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200">{ppeError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
            PPE Inventory Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track and manage Personal Protective Equipment
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add PPE Item
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {statistics.totalItems}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            PPE types in inventory
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                ${statistics.totalValue.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Inventory value
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {statistics.lowStockItems}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <TrendingDown className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Items need reorder
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Assignments</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {statistics.totalAssigned}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Currently assigned
          </p>
        </div>
      </div>

      {/* Alerts */}
      {statistics.outOfStockItems > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200 font-medium">
              {statistics.outOfStockItems} item{statistics.outOfStockItems > 1 ? 's' : ''} out of stock - Immediate reorder required
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search PPE items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="hard_hat">Hard Hat</option>
            <option value="safety_glasses">Safety Glasses</option>
            <option value="gloves">Gloves</option>
            <option value="safety_boots">Safety Boots</option>
            <option value="high_vis_vest">High-Visibility Vest</option>
            <option value="respirator">Respirator</option>
            <option value="fall_harness">Fall Harness</option>
            <option value="hearing_protection">Hearing Protection</option>
            <option value="face_shield">Face Shield</option>
          </select>

          {/* Low Stock Filter */}
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showLowStockOnly
                ? 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Low Stock Only
          </button>
        </div>
      </div>

      {/* PPE Items Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {ppeLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading PPE inventory...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No PPE items found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              {searchQuery || selectedType !== 'all' || showLowStockOnly
                ? 'Try adjusting your filters'
                : 'Click "Add PPE Item" to add your first item'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Certifications
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Inventory
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.map((item) => (
                  <tr 
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.brand} {item.model}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.type.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.certifications.slice(0, 2).map((cert, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded text-xs"
                          >
                            {cert}
                          </span>
                        ))}
                        {item.certifications.length > 2 && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                            +{item.certifications.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${getStockStatusColor(item)}`}>
                            {item.availableQuantity}/{item.totalQuantity}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">available</span>
                        </div>
                        {item.assignedQuantity > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.assignedQuantity} assigned
                          </p>
                        )}
                        {item.damagedQuantity > 0 && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            {item.damagedQuantity} damaged
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStockStatusBadge(item)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          ${item.totalValue.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ${item.unitCost.toFixed(2)} each
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 dark:text-white">{item.storageLocation}</p>
                      {item.nextInspection && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          Inspect: {new Date(item.nextInspection).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                        }}
                        className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-sm font-medium"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || selectedItem) && (
        <PPEForm
          projectId={projectId}
          initialData={selectedItem || undefined}
          onSubmit={selectedItem ? handleUpdatePPE : handleCreatePPE}
          onCancel={() => {
            setShowCreateForm(false);
            setSelectedItem(null);
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};
