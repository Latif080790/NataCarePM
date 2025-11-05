import React, { useState, useCallback } from 'react';
import { X, Shield, Package, AlertTriangle, Calendar, FileText } from 'lucide-react';
import type { PPEInventory, PPEType } from '@/types/safety.types';

interface PPEFormProps {
  projectId: string;
  initialData?: Partial<PPEInventory>;
  onSubmit: (item: Omit<PPEInventory, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const PPEForm: React.FC<PPEFormProps> = ({
  projectId,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  // Form state
  const [formData, setFormData] = useState({
    type: initialData?.type || ('hard_hat' as PPEType),
    brand: initialData?.brand || '',
    model: initialData?.model || '',
    description: initialData?.description || '',
    totalQuantity: initialData?.totalQuantity || 0,
    availableQuantity: initialData?.availableQuantity || 0,
    assignedQuantity: initialData?.assignedQuantity || 0,
    damagedQuantity: initialData?.damagedQuantity || 0,
    reorderLevel: initialData?.reorderLevel || 0,
    reorderQuantity: initialData?.reorderQuantity || 0,
    unitCost: initialData?.unitCost || 0,
    storageLocation: initialData?.storageLocation || '',
    supplierName: initialData?.supplierName || '',
    certifications: initialData?.certifications || [],
    inspectionInterval: initialData?.inspectionInterval || 90,
    expiryDate: initialData?.expiryDate ? initialData.expiryDate.toISOString().slice(0, 10) : '',
    lastInspection: initialData?.lastInspection
      ? initialData.lastInspection.toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    nextInspection: initialData?.nextInspection
      ? initialData.nextInspection.toISOString().slice(0, 10)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 90 days
    notes: initialData?.notes || '',
    size: initialData?.size || '',
  });

  const [certificationInput, setCertificationInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Certification management
  const addCertification = useCallback(() => {
    if (certificationInput.trim() && !formData.certifications.includes(certificationInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        certifications: [...prev.certifications, certificationInput.trim()],
      }));
      setCertificationInput('');
    }
  }, [certificationInput, formData.certifications]);

  const removeCertification = useCallback((cert: string) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((c) => c !== cert),
    }));
  }, []);

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.totalQuantity < 0) newErrors.totalQuantity = 'Quantity cannot be negative';
    if (formData.reorderLevel < 0) newErrors.reorderLevel = 'Reorder level cannot be negative';
    if (formData.unitCost < 0) newErrors.unitCost = 'Unit cost cannot be negative';
    if (!formData.storageLocation.trim())
      newErrors.storageLocation = 'Storage location is required';
    if (formData.certifications.length === 0)
      newErrors.certifications = 'At least one certification is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      const ppeData: Omit<PPEInventory, 'id' | 'createdAt' | 'updatedAt'> = {
        projectId,
        type: formData.type,
        brand: formData.brand,
        model: formData.model,
        description: formData.description,
        totalQuantity: formData.totalQuantity,
        availableQuantity: formData.availableQuantity,
        assignedQuantity: formData.assignedQuantity,
        damagedQuantity: formData.damagedQuantity,
        size: formData.size || undefined,
        specifications: {},
        certifications: formData.certifications,
        inspectionInterval: formData.inspectionInterval,
        unitCost: formData.unitCost,
        totalValue: formData.totalQuantity * formData.unitCost,
        storageLocation: formData.storageLocation,
        reorderLevel: formData.reorderLevel,
        reorderQuantity: formData.reorderQuantity,
        supplierName: formData.supplierName || undefined,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
        lastInspection: formData.lastInspection ? new Date(formData.lastInspection) : undefined,
        nextInspection: formData.nextInspection ? new Date(formData.nextInspection) : undefined,
        notes: formData.notes || undefined,
      };

      await onSubmit(ppeData);
    },
    [formData, projectId, validateForm, onSubmit]
  );

  // Calculate total value
  const totalValue = formData.totalQuantity * formData.unitCost;

  // Check if stock is low
  const isLowStock = formData.availableQuantity <= formData.reorderLevel;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {initialData ? 'Edit PPE Item' : 'Add PPE to Inventory'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Personal Protective Equipment management
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto"
        >
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Item Details</h3>

            {/* PPE Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                PPE Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, type: e.target.value as PPEType }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                required
              >
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
            </div>

            {/* Brand and Model */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Brand *
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white ${
                    errors.brand ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="e.g., 3M, MSA, Honeywell"
                  required
                />
                {errors.brand && <p className="mt-1 text-sm text-red-600">{errors.brand}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model *
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white ${
                    errors.model ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Model number or name"
                  required
                />
                {errors.model && <p className="mt-1 text-sm text-red-600">{errors.model}</p>}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white ${
                  errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Detailed description of the PPE item..."
                required
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Inventory Management */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inventory</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Package className="w-4 h-4 inline mr-1" />
                  Total Quantity *
                </label>
                <input
                  type="number"
                  value={formData.totalQuantity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      totalQuantity: parseInt(e.target.value) || 0,
                    }))
                  }
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white ${
                    errors.totalQuantity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                />
                {errors.totalQuantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.totalQuantity}</p>
                )}
              </div>

              {/* Available Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Available
                </label>
                <input
                  type="number"
                  value={formData.availableQuantity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      availableQuantity: parseInt(e.target.value) || 0,
                    }))
                  }
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
                {isLowStock && (
                  <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Low stock
                  </p>
                )}
              </div>

              {/* Assigned Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assigned
                </label>
                <input
                  type="number"
                  value={formData.assignedQuantity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      assignedQuantity: parseInt(e.target.value) || 0,
                    }))
                  }
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Damaged Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Damaged
                </label>
                <input
                  type="number"
                  value={formData.damagedQuantity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      damagedQuantity: parseInt(e.target.value) || 0,
                    }))
                  }
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Total Value Display */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Total Inventory Value:</strong> ${totalValue.toFixed(2)}
              </p>
            </div>

            {/* Storage Location and Supplier */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Storage Location *
                </label>
                <input
                  type="text"
                  value={formData.storageLocation}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, storageLocation: e.target.value }))
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white ${
                    errors.storageLocation
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="e.g., Warehouse A, Shelf B-3"
                  required
                />
                {errors.storageLocation && (
                  <p className="mt-1 text-sm text-red-600">{errors.storageLocation}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Supplier Name
                </label>
                <input
                  type="text"
                  value={formData.supplierName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, supplierName: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Supplier or vendor name"
                />
              </div>
            </div>
          </div>

          {/* Certification & Compliance */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Certifications & Compliance
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Certifications * (e.g., ANSI Z89.1, EN 397, CSA Z94.1)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={certificationInput}
                  onChange={(e) => setCertificationInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="Add certification (press Enter)"
                />
                <button
                  type="button"
                  onClick={addCertification}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add
                </button>
              </div>
              {errors.certifications && (
                <p className="mt-1 text-sm text-red-600">{errors.certifications}</p>
              )}

              <div className="flex flex-wrap gap-2 mt-2">
                {formData.certifications.map((cert) => (
                  <div
                    key={cert}
                    className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full"
                  >
                    <span className="text-sm">{cert}</span>
                    <button
                      type="button"
                      onClick={() => removeCertification(cert)}
                      className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Inspection Interval (days)
                </label>
                <input
                  type="number"
                  value={formData.inspectionInterval}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      inspectionInterval: parseInt(e.target.value) || 90,
                    }))
                  }
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Inspection Schedule */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Inspection Schedule
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Last Inspection
                </label>
                <input
                  type="date"
                  value={formData.lastInspection}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, lastInspection: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Next Inspection
                </label>
                <input
                  type="date"
                  value={formData.nextInspection}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nextInspection: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Additional Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="Additional notes, special instructions, or maintenance requirements..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  {initialData ? 'Update Item' : 'Add to Inventory'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
