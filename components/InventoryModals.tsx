import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Timestamp } from 'firebase/firestore';
import {
  createMaterial,
  updateMaterial,
  createTransaction,
  createStockCount,
  startStockCount,
  updateStockCountItem,
  completeStockCount,
  approveStockCount,
  getWarehouses,
  getMaterialById
} from '../api/inventoryService';
import {
  CreateMaterialInput,
  UpdateMaterialInput,
  InventoryMaterial,
  MaterialCategory,
  UnitOfMeasure,
  ValuationMethod,
  TransactionType,
  Warehouse
} from '../types/inventory';

// ============================================================================
// CREATE/EDIT MATERIAL MODAL
// ============================================================================

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  material?: InventoryMaterial; // If editing
}

export const MaterialModal: React.FC<MaterialModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  material
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    materialName: '',
    category: MaterialCategory.RAW_MATERIAL,
    description: '',
    specification: '',
    manufacturer: '',
    brand: '',
    model: '',
    baseUom: UnitOfMeasure.PIECE,
    minimumStock: 0,
    maximumStock: 0,
    reorderQuantity: 0,
    valuationMethod: ValuationMethod.AVERAGE,
    standardCost: 0,
    isBatchTracked: false,
    isSerialTracked: false,
    isExpiryTracked: false,
    shelfLife: 0,
    expiryWarningDays: 0,
    defaultWarehouseId: '',
    preferredVendorId: '',
    leadTime: 0,
    wbsCode: '',
    costCenter: '',
    glAccount: '',
    notes: ''
  });
  
  useEffect(() => {
    if (isOpen) {
      loadWarehouses();
      if (material) {
        // Populate form for editing
        setFormData({
          materialName: material.materialName,
          category: material.category,
          description: material.description || '',
          specification: material.specification || '',
          manufacturer: material.manufacturer || '',
          brand: material.brand || '',
          model: material.model || '',
          baseUom: material.baseUom,
          minimumStock: material.minimumStock,
          maximumStock: material.maximumStock,
          reorderQuantity: material.reorderQuantity,
          valuationMethod: material.valuationMethod,
          standardCost: material.standardCost || 0,
          isBatchTracked: material.isBatchTracked,
          isSerialTracked: material.isSerialTracked,
          isExpiryTracked: material.isExpiryTracked,
          shelfLife: material.shelfLife || 0,
          expiryWarningDays: material.expiryWarningDays || 0,
          defaultWarehouseId: material.defaultWarehouseId || '',
          preferredVendorId: material.preferredVendorId || '',
          leadTime: material.leadTime || 0,
          wbsCode: material.wbsCode || '',
          costCenter: material.costCenter || '',
          glAccount: material.glAccount || '',
          notes: material.notes || ''
        });
      }
    }
  }, [isOpen, material]);
  
  const loadWarehouses = async () => {
    try {
      const data = await getWarehouses();
      setWarehouses(data);
    } catch (error) {
      console.error('Error loading warehouses:', error);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    setLoading(true);
    try {
      if (material) {
        // Update existing material
        const updateData: UpdateMaterialInput = formData;
        await updateMaterial(material.id, updateData, currentUser.uid, currentUser.name || currentUser.email);
        addToast('Material updated successfully', 'success');
      } else {
        // Create new material
        const createData: CreateMaterialInput = formData;
        await createMaterial(createData, currentUser.uid, currentUser.name || currentUser.email);
        addToast('Material created successfully', 'success');
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving material:', error);
      addToast(error.message || 'Error saving material', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {material ? 'Edit Material' : 'Add New Material'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.materialName}
                    onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as MaterialCategory })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={MaterialCategory.RAW_MATERIAL}>Raw Material</option>
                    <option value={MaterialCategory.CONSUMABLE}>Consumable</option>
                    <option value={MaterialCategory.SPARE_PART}>Spare Part</option>
                    <option value={MaterialCategory.TOOL}>Tool</option>
                    <option value={MaterialCategory.EQUIPMENT}>Equipment</option>
                    <option value={MaterialCategory.CHEMICAL}>Chemical</option>
                    <option value={MaterialCategory.SAFETY_EQUIPMENT}>Safety Equipment</option>
                    <option value={MaterialCategory.OFFICE_SUPPLY}>Office Supply</option>
                    <option value={MaterialCategory.OTHER}>Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Unit of Measure <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.baseUom}
                    onChange={(e) => setFormData({ ...formData, baseUom: e.target.value as UnitOfMeasure })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={UnitOfMeasure.PIECE}>Piece</option>
                    <option value={UnitOfMeasure.KILOGRAM}>Kilogram</option>
                    <option value={UnitOfMeasure.LITER}>Liter</option>
                    <option value={UnitOfMeasure.METER}>Meter</option>
                    <option value={UnitOfMeasure.BOX}>Box</option>
                    <option value={UnitOfMeasure.PACK}>Pack</option>
                    <option value={UnitOfMeasure.SET}>Set</option>
                  </select>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specification</label>
                  <input
                    type="text"
                    value={formData.specification}
                    onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Stock Management */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Management</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.minimumStock}
                    onChange={(e) => setFormData({ ...formData, minimumStock: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.maximumStock}
                    onChange={(e) => setFormData({ ...formData, maximumStock: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reorder Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.reorderQuantity}
                    onChange={(e) => setFormData({ ...formData, reorderQuantity: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Valuation */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Valuation</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valuation Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.valuationMethod}
                    onChange={(e) => setFormData({ ...formData, valuationMethod: e.target.value as ValuationMethod })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={ValuationMethod.FIFO}>FIFO (First In First Out)</option>
                    <option value={ValuationMethod.LIFO}>LIFO (Last In First Out)</option>
                    <option value={ValuationMethod.AVERAGE}>Weighted Average</option>
                    <option value={ValuationMethod.STANDARD}>Standard Cost</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Standard Cost (IDR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.standardCost}
                    onChange={(e) => setFormData({ ...formData, standardCost: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Tracking Options */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tracking Options</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.isBatchTracked}
                    onChange={(e) => setFormData({ ...formData, isBatchTracked: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Track by Batch/Lot Number</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.isSerialTracked}
                    onChange={(e) => setFormData({ ...formData, isSerialTracked: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Track by Serial Number</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.isExpiryTracked}
                    onChange={(e) => setFormData({ ...formData, isExpiryTracked: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Track Expiry Dates</span>
                </label>
              </div>
              
              {formData.isExpiryTracked && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shelf Life (days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.shelfLife}
                      onChange={(e) => setFormData({ ...formData, shelfLife: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Warning (days before)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.expiryWarningDays}
                      onChange={(e) => setFormData({ ...formData, expiryWarningDays: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Location & Vendor */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location & Vendor</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Warehouse
                  </label>
                  <select
                    value={formData.defaultWarehouseId}
                    onChange={(e) => setFormData({ ...formData, defaultWarehouseId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.warehouseName}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lead Time (days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.leadTime}
                    onChange={(e) => setFormData({ ...formData, leadTime: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Accounting Integration */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Accounting Integration</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">WBS Code</label>
                  <input
                    type="text"
                    value={formData.wbsCode}
                    onChange={(e) => setFormData({ ...formData, wbsCode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cost Center</label>
                  <input
                    type="text"
                    value={formData.costCenter}
                    onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GL Account</label>
                  <input
                    type="text"
                    value={formData.glAccount}
                    onChange={(e) => setFormData({ ...formData, glAccount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? 'Saving...' : material ? 'Update Material' : 'Create Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// MATERIAL DETAILS MODAL
// ============================================================================

interface MaterialDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: InventoryMaterial;
  onEdit: () => void;
  onDelete: () => void;
}

export const MaterialDetailsModal: React.FC<MaterialDetailsModalProps> = ({
  isOpen,
  onClose,
  material,
  onEdit,
  onDelete
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{material.materialName}</h2>
            <p className="text-sm text-gray-500 mt-1">{material.materialCode}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Category:</span>
                <span className="ml-2 font-medium">{material.category}</span>
              </div>
              <div>
                <span className="text-gray-500">Base UOM:</span>
                <span className="ml-2 font-medium">{material.baseUom}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Description:</span>
                <p className="mt-1 text-gray-900">{material.description || '-'}</p>
              </div>
            </div>
          </div>
          
          {/* Stock Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Stock Information</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Current Stock:</span>
                <p className="text-lg font-bold text-gray-900">{material.currentStock} {material.baseUom}</p>
              </div>
              <div>
                <span className="text-gray-500">Available:</span>
                <p className="text-lg font-bold text-green-600">{material.availableStock} {material.baseUom}</p>
              </div>
              <div>
                <span className="text-gray-500">Reserved:</span>
                <p className="text-lg font-bold text-orange-600">{material.reservedStock} {material.baseUom}</p>
              </div>
              <div>
                <span className="text-gray-500">Minimum Stock:</span>
                <p className="font-medium text-gray-900">{material.minimumStock} {material.baseUom}</p>
              </div>
              <div>
                <span className="text-gray-500">Maximum Stock:</span>
                <p className="font-medium text-gray-900">{material.maximumStock} {material.baseUom}</p>
              </div>
              <div>
                <span className="text-gray-500">Reorder Qty:</span>
                <p className="font-medium text-gray-900">{material.reorderQuantity} {material.baseUom}</p>
              </div>
            </div>
          </div>
          
          {/* Valuation */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Valuation</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Method:</span>
                <span className="ml-2 font-medium">{material.valuationMethod.toUpperCase()}</span>
              </div>
              <div>
                <span className="text-gray-500">Total Value:</span>
                <span className="ml-2 font-bold text-green-600">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR'
                  }).format(material.totalValue)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Discontinue
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TRANSACTION MODAL (IN/OUT/ADJUSTMENT)
// ============================================================================

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [materials, setMaterials] = useState<InventoryMaterial[]>([]);
  
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.IN);
  const [warehouseId, setWarehouseId] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  
  const [items, setItems] = useState<Array<{
    materialId: string;
    quantity: number;
    unitCost: number;
  }>>([{ materialId: '', quantity: 0, unitCost: 0 }]);
  
  useEffect(() => {
    if (isOpen) {
      loadWarehouses();
      loadMaterials();
    }
  }, [isOpen]);
  
  const loadWarehouses = async () => {
    try {
      const data = await getWarehouses();
      setWarehouses(data);
      if (data.length > 0) setWarehouseId(data[0].id);
    } catch (error) {
      console.error('Error loading warehouses:', error);
    }
  };
  
  const loadMaterials = async () => {
    try {
      const { getMaterials } = await import('../api/inventoryService');
      const data = await getMaterials();
      setMaterials(data);
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  };
  
  const addItem = () => {
    setItems([...items, { materialId: '', quantity: 0, unitCost: 0 }]);
  };
  
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };
  
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    // Validation
    if (items.some(item => !item.materialId || item.quantity === 0)) {
      addToast('Please fill all item details', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const transactionData = {
        transactionType,
        transactionDate: Timestamp.now(),
        items: await Promise.all(items.map(async (item) => {
          const material = await getMaterialById(item.materialId);
          return {
            materialId: item.materialId,
            quantity: item.quantity,
            uom: material?.baseUom || UnitOfMeasure.PIECE,
            unitCost: item.unitCost
          };
        })),
        warehouseId,
        reason,
        notes
      };
      
      await createTransaction(transactionData, currentUser.uid, currentUser.name || currentUser.email);
      addToast('Transaction created successfully', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      addToast(error.message || 'Error creating transaction', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">New Inventory Transaction</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value as TransactionType)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={TransactionType.IN}>Goods In</option>
                  <option value={TransactionType.OUT}>Goods Out</option>
                  <option value={TransactionType.ADJUSTMENT}>Stock Adjustment</option>
                  <option value={TransactionType.TRANSFER}>Transfer</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.warehouseName}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Transaction Items</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </button>
              </div>
              
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <select
                      required
                      value={item.materialId}
                      onChange={(e) => updateItem(index, 'materialId', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select Material</option>
                      {materials.map(mat => (
                        <option key={mat.id} value={mat.id}>
                          {mat.materialCode} - {mat.materialName}
                        </option>
                      ))}
                    </select>
                    
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      placeholder="Quantity"
                      value={item.quantity || ''}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      placeholder="Unit Cost"
                      value={item.unitCost || ''}
                      onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value))}
                      className="w-40 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {transactionType === TransactionType.ADJUSTMENT && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
