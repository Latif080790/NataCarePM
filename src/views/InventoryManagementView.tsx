import React, { useState, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Warehouse,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { useToast } from '@/contexts/ToastContext';
import { hasPermission } from '@/constants';
import {
  getMaterials,
  getInventorySummary,
  getStockAlerts,
  deleteMaterial
} from '@/api/inventoryService';
import {
  InventoryMaterial,
  InventorySummary,
  StockAlert,
  MaterialCategory,
  MaterialStatus,
  StockAlertType
} from '@/types/inventory';
import {
  MaterialModal,
  MaterialDetailsModal,
  TransactionModal
} from '@/components/InventoryModals';

const InventoryManagementView: React.FC = () => {
  const { currentUser } = useAuth();
  const { currentProject } = useProject();
  const { addToast } = useToast();
  
  // State
  const [materials, setMaterials] = useState<InventoryMaterial[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<MaterialStatus | 'all'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'normal'>('all');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showStockCountModal, setShowStockCountModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<InventoryMaterial | null>(null);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMaterials(),
        loadSummary(),
        loadAlerts()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      addToast('Error loading inventory data', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const loadMaterials = async () => {
    try {
      const filters: any = {};
      
      if (selectedCategory !== 'all') {
        filters.category = selectedCategory;
      }
      
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus;
      }
      
      if (stockFilter === 'low') {
        filters.lowStock = true;
      } else if (stockFilter === 'out') {
        filters.outOfStock = true;
      }
      
      if (searchQuery.length >= 3) {
        filters.search = searchQuery;
      }
      
      const data = await getMaterials(filters);
      setMaterials(data);
    } catch (error) {
      console.error('Error loading materials:', error);
      throw error;
    }
  };
  
  const loadSummary = async () => {
    if (!currentProject?.id) {
      console.warn('No project selected');
      return;
    }

    try {
      const data = await getInventorySummary(currentProject.id);
      setSummary(data);
    } catch (error) {
      console.error('Error loading summary:', error);
      throw error;
    }
  };
  
  const loadAlerts = async () => {
    try {
      const data = await getStockAlerts(false); // Unresolved alerts only
      setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
      throw error;
    }
  };
  
  useEffect(() => {
    if (!loading) {
      loadMaterials();
    }
  }, [selectedCategory, selectedStatus, stockFilter]);
  
  useEffect(() => {
    if (searchQuery.length >= 3 || searchQuery.length === 0) {
      loadMaterials();
    }
  }, [searchQuery]);
  
  const handleDeleteMaterial = async (materialId: string) => {
    if (!window.confirm('Are you sure you want to discontinue this material? It will be marked as inactive.')) {
      return;
    }
    
    try {
      await deleteMaterial(materialId);
      addToast('Material discontinued successfully', 'success');
      loadMaterials();
      loadSummary();
    } catch (error) {
      console.error('Error deleting material:', error);
      addToast('Error discontinuing material', 'error');
    }
  };
  
  const getCategoryLabel = (category: MaterialCategory): string => {
    const labels: Record<MaterialCategory, string> = {
      [MaterialCategory.RAW_MATERIAL]: 'Raw Material',
      [MaterialCategory.CONSUMABLE]: 'Consumable',
      [MaterialCategory.SPARE_PART]: 'Spare Part',
      [MaterialCategory.TOOL]: 'Tool',
      [MaterialCategory.EQUIPMENT]: 'Equipment',
      [MaterialCategory.CHEMICAL]: 'Chemical',
      [MaterialCategory.SAFETY_EQUIPMENT]: 'Safety Equipment',
      [MaterialCategory.OFFICE_SUPPLY]: 'Office Supply',
      [MaterialCategory.OTHER]: 'Other'
    };
    return labels[category];
  };
  
  const getStatusBadgeClass = (status: MaterialStatus): string => {
    const classes: Record<MaterialStatus, string> = {
      [MaterialStatus.ACTIVE]: 'bg-green-100 text-green-800',
      [MaterialStatus.INACTIVE]: 'bg-gray-100 text-gray-800',
      [MaterialStatus.DISCONTINUED]: 'bg-orange-100 text-orange-800',
      [MaterialStatus.OBSOLETE]: 'bg-red-100 text-red-800'
    };
    return classes[status];
  };
  
  const getStockStatusColor = (material: InventoryMaterial): string => {
    if (material.currentStock === 0) return 'text-red-600';
    if (material.currentStock <= material.minimumStock) return 'text-orange-600';
    if (material.currentStock >= material.maximumStock) return 'text-blue-600';
    return 'text-green-600';
  };
  
  const getStockStatusIcon = (material: InventoryMaterial) => {
    if (material.currentStock === 0) return <XCircle className="h-4 w-4" />;
    if (material.currentStock <= material.minimumStock) return <AlertTriangle className="h-4 w-4" />;
    if (material.currentStock >= material.maximumStock) return <TrendingUp className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Package className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-sm text-gray-500">Materials catalog and stock management</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {currentUser && hasPermission(currentUser, 'manage_logistics') && (
            <>
              <button
                onClick={() => setShowStockCountModal(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Stock Count
              </button>
              <button
                onClick={() => setShowTransactionModal(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Transaction
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Stock Alerts */}
      {alerts.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-3" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                {alerts.length} stock alert{alerts.length !== 1 ? 's' : ''} require attention
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {alerts.slice(0, 3).map(alert => (
                  <span key={alert.id} className="text-xs text-yellow-700">
                    {alert.materialName} - {alert.alertType.replace('_', ' ')}
                  </span>
                ))}
                {alerts.length > 3 && (
                  <span className="text-xs text-yellow-700">
                    and {alerts.length - 3} more...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Materials</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalMaterials}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Materials</p>
                <p className="text-2xl font-bold text-green-600">{summary.activeMaterials}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">{summary.lowStockItems}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{summary.outOfStockItems}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(summary.totalValue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Warehouses</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalWarehouses}</p>
              </div>
              <Warehouse className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {Object.values(MaterialCategory).map(cat => (
              <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
            ))}
          </select>
          
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value={MaterialStatus.ACTIVE}>Active</option>
            <option value={MaterialStatus.INACTIVE}>Inactive</option>
            <option value={MaterialStatus.DISCONTINUED}>Discontinued</option>
            <option value={MaterialStatus.OBSOLETE}>Obsolete</option>
          </select>
          
          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Stock Levels</option>
            <option value="normal">Normal Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>
      
      {/* Materials Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min / Max
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {materials.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No materials found
                  </td>
                </tr>
              ) : (
                materials.map(material => (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedMaterial(material);
                          setShowDetailsModal(true);
                        }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {material.materialCode}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{material.materialName}</div>
                      {material.description && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">{material.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {getCategoryLabel(material.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`${getStockStatusColor(material)}`}>
                          {getStockStatusIcon(material)}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {material.currentStock} {material.baseUom}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {material.availableStock} {material.baseUom}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {material.minimumStock} / {material.maximumStock}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(material.totalValue)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadgeClass(material.status)}`}>
                        {material.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedMaterial(material);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {currentUser && hasPermission(currentUser, 'manage_logistics') && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedMaterial(material);
                                setShowEditModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-800"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteMaterial(material.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Discontinue"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modals */}
      {showCreateModal && (
        <MaterialModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadMaterials();
            loadSummary();
          }}
        />
      )}
      
      {showDetailsModal && selectedMaterial && (
        <MaterialDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedMaterial(null);
          }}
          material={selectedMaterial}
          onEdit={() => {
            setShowDetailsModal(false);
            setShowEditModal(true);
          }}
          onDelete={() => handleDeleteMaterial(selectedMaterial.id)}
        />
      )}
      
      {showEditModal && selectedMaterial && (
        <MaterialModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMaterial(null);
          }}
          onSuccess={() => {
            loadMaterials();
            loadSummary();
          }}
          material={selectedMaterial}
        />
      )}
      
      {showTransactionModal && (
        <TransactionModal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          onSuccess={() => {
            loadMaterials();
            loadSummary();
          }}
        />
      )}
      
      {showStockCountModal && (
        <div>Stock Count Modal - TODO</div>
      )}
    </div>
  );
};

export default InventoryManagementView;
