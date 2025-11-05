/**
 * GOODS RECEIPT MODAL COMPONENTS
 *
 * Modal components for Goods Receipt operations:
 * - CreateGRModal: Select PO and create new GR
 * - GRDetailsModal: View/edit GR details
 * - GRInspectionModal: Perform quality inspection
 * - PhotoUploadModal: Upload inspection photos
 *
 * Created: October 2025
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Calendar,
  Truck,
  User,
  FileText,
  Camera,
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Save,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { useToast } from '@/contexts/ToastContext';
import { hasPermission } from '@/constants';
import { Button } from './Button';
import { Input } from './FormControls';
import { Card } from './Card';
import {
  GoodsReceipt,
  CreateGRInput,
  InspectGRItemInput,
  QualityStatus,
} from '@/types/logistics';
import { PurchaseOrder } from '@/types';
import {
  createGoodsReceipt,
  inspectGRItem,
  addGRPhoto,
  validateGoodsReceipt,
} from '@/api/goodsReceiptService';

// ============================================================================
// CREATE GR MODAL
// ============================================================================

interface CreateGRModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateGRModal: React.FC<CreateGRModalProps> = ({ onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const { currentProject } = useProject();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [availablePOs, setAvailablePOs] = useState<PurchaseOrder[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  const [formData, setFormData] = useState({
    poId: '',
    receiptDate: new Date().toISOString().slice(0, 10),
    deliveryNote: '',
    vehicleNumber: '',
    driverName: '',
    receiverNotes: '',
  });

  useEffect(() => {
    loadAvailablePOs();
  }, []);

  const loadAvailablePOs = async () => {
    if (!currentProject) return;

    try {
      // TODO: Fetch approved/confirmed POs from API
      // For now, use mock data from ProjectContext
      const mockPOs: PurchaseOrder[] = [];
      setAvailablePOs(mockPOs);
    } catch (error) {
      console.error('Error loading POs:', error);
      addToast('Failed to load purchase orders', 'error');
    }
  };

  const handlePOSelect = (poId: string) => {
    const po = availablePOs.find((p) => p.id === poId);
    setSelectedPO(po || null);
    setFormData({ ...formData, poId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !currentProject) return;

    // Validation
    if (!formData.poId) {
      addToast('Please select a purchase order', 'error');
      return;
    }

    if (!formData.receiptDate) {
      addToast('Please enter receipt date', 'error');
      return;
    }

    try {
      setLoading(true);

      const input: CreateGRInput = {
        projectId: currentProject.id,
        poId: formData.poId,
        receiptDate: formData.receiptDate,
        deliveryNote: formData.deliveryNote,
        vehicleNumber: formData.vehicleNumber,
        driverName: formData.driverName,
        receiverNotes: formData.receiverNotes,
      };

      await createGoodsReceipt(input, currentUser.uid, currentUser.name || 'Unknown');
      addToast('Goods receipt created successfully', 'success');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating GR:', error);
      addToast(error.message || 'Failed to create goods receipt', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Package size={24} />
            <h2>Create Goods Receipt</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* PO Selection */}
            <div className="form-section">
              <h3>Purchase Order</h3>
              <div className="form-group">
                <label>Select PO *</label>
                <select
                  value={formData.poId}
                  onChange={(e) => handlePOSelect(e.target.value)}
                  required
                >
                  <option value="">-- Select Purchase Order --</option>
                  {availablePOs.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.poNumber} - {po.vendorName} - {po.totalAmount.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPO && (
                <div className="po-summary">
                  <h4>PO Details</h4>
                  <div className="summary-row">
                    <span>PO Number:</span>
                    <strong>{selectedPO.poNumber}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Vendor:</span>
                    <strong>{selectedPO.vendorName}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Items:</span>
                    <strong>{selectedPO.items.length}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Total Amount:</span>
                    <strong>{selectedPO.totalAmount.toLocaleString()}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Receipt Details */}
            <div className="form-section">
              <h3>Receipt Information</h3>

              <div className="form-group">
                <label>Receipt Date *</label>
                <Input
                  type="date"
                  value={formData.receiptDate}
                  onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
                  required
                  max={new Date().toISOString().slice(0, 10)}
                />
              </div>

              <div className="form-group">
                <label>Delivery Note Number</label>
                <Input
                  type="text"
                  placeholder="Vendor's delivery note number"
                  value={formData.deliveryNote}
                  onChange={(e) => setFormData({ ...formData, deliveryNote: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Vehicle Number</label>
                  <Input
                    type="text"
                    placeholder="B 1234 XYZ"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Driver Name</label>
                  <Input
                    type="text"
                    placeholder="Driver's name"
                    value={formData.driverName}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Receiver Notes</label>
                <textarea
                  className="form-control"
                  placeholder="Any notes about the delivery condition..."
                  value={formData.receiverNotes}
                  onChange={(e) => setFormData({ ...formData, receiverNotes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <Button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </Button>
            <Button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Goods Receipt'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// GR DETAILS MODAL
// ============================================================================

interface GRDetailsModalProps {
  gr: GoodsReceipt;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: (grId: string) => void;
  onComplete: (grId: string) => void;
}

export const GRDetailsModal: React.FC<GRDetailsModalProps> = ({
  gr,
  onClose,
  onUpdate,
  onDelete,
  onComplete,
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'photos'>('details');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getQualityColor = (status: QualityStatus): string => {
    switch (status) {
      case 'passed':
        return 'green';
      case 'partial':
        return 'yellow';
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content extra-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FileText size={24} />
            <div>
              <h2>{gr.grNumber}</h2>
              <p className="subtitle">Goods Receipt Details</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <FileText size={16} />
            Details
          </button>
          <button
            className={`tab ${activeTab === 'items' ? 'active' : ''}`}
            onClick={() => setActiveTab('items')}
          >
            <Package size={16} />
            Items ({gr.totalItems})
          </button>
          <button
            className={`tab ${activeTab === 'photos' ? 'active' : ''}`}
            onClick={() => setActiveTab('photos')}
          >
            <Camera size={16} />
            Photos ({gr.photos.length})
          </button>
        </div>

        <div className="modal-body">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="details-grid">
              <Card>
                <h3>Basic Information</h3>
                <div className="info-row">
                  <span className="label">GR Number:</span>
                  <span className="value">{gr.grNumber}</span>
                </div>
                <div className="info-row">
                  <span className="label">PO Number:</span>
                  <span className="value">{gr.poNumber}</span>
                </div>
                <div className="info-row">
                  <span className="label">Vendor:</span>
                  <span className="value">{gr.vendorName}</span>
                </div>
                <div className="info-row">
                  <span className="label">Receipt Date:</span>
                  <span className="value">{formatDate(gr.receiptDate)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Status:</span>
                  <span className={`status-badge status-${gr.status}`}>{gr.status}</span>
                </div>
                <div className="info-row">
                  <span className="label">Quality Status:</span>
                  <span
                    className={`status-badge status-${getQualityColor(gr.overallQualityStatus)}`}
                  >
                    {gr.overallQualityStatus}
                  </span>
                </div>
              </Card>

              <Card>
                <h3>Delivery Information</h3>
                {gr.deliveryNote && (
                  <div className="info-row">
                    <span className="label">Delivery Note:</span>
                    <span className="value">{gr.deliveryNote}</span>
                  </div>
                )}
                {gr.vehicleNumber && (
                  <div className="info-row">
                    <span className="label">Vehicle:</span>
                    <span className="value">{gr.vehicleNumber}</span>
                  </div>
                )}
                {gr.driverName && (
                  <div className="info-row">
                    <span className="label">Driver:</span>
                    <span className="value">{gr.driverName}</span>
                  </div>
                )}
              </Card>

              <Card>
                <h3>Summary</h3>
                <div className="info-row">
                  <span className="label">Total Items:</span>
                  <span className="value">{gr.totalItems}</span>
                </div>
                <div className="info-row">
                  <span className="label">Total Quantity:</span>
                  <span className="value">{gr.totalQuantity}</span>
                </div>
                <div className="info-row">
                  <span className="label">Total Value:</span>
                  <span className="value strong">{formatCurrency(gr.totalValue)}</span>
                </div>
              </Card>

              {gr.receiverNotes && (
                <Card>
                  <h3>Notes</h3>
                  <p>{gr.receiverNotes}</p>
                </Card>
              )}
            </div>
          )}

          {/* Items Tab */}
          {activeTab === 'items' && (
            <div className="items-table">
              <table>
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>PO Qty</th>
                    <th>Received</th>
                    <th>Accepted</th>
                    <th>Rejected</th>
                    <th>Quality</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {gr.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div>
                          <strong>{item.materialName}</strong>
                          {item.materialCode && (
                            <div className="text-sm text-gray">{item.materialCode}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        {item.poQuantity} {item.unit}
                      </td>
                      <td>
                        {item.receivedQuantity} {item.unit}
                      </td>
                      <td>
                        {item.acceptedQuantity} {item.unit}
                      </td>
                      <td className={item.rejectedQuantity > 0 ? 'text-red' : ''}>
                        {item.rejectedQuantity} {item.unit}
                      </td>
                      <td>
                        <span
                          className={`status-badge status-${getQualityColor(item.qualityStatus)}`}
                        >
                          {item.qualityStatus}
                        </span>
                      </td>
                      <td className="text-right">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className="photos-grid">
              {gr.photos.length === 0 ? (
                <div className="empty-state">
                  <Camera size={48} />
                  <p>No photos uploaded yet</p>
                </div>
              ) : (
                gr.photos.map((photo) => (
                  <div key={photo.id} className="photo-card">
                    <img src={photo.url} alt={photo.description || 'GR Photo'} />
                    <div className="photo-info">
                      <div className="photo-category">{photo.category}</div>
                      {photo.description && <p>{photo.description}</p>}
                      <div className="photo-meta">Uploaded: {formatDate(photo.uploadedAt)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {gr.status === 'draft' && hasPermission(currentUser, 'manage_logistics') && (
            <Button onClick={() => onDelete(gr.id)} className="btn-danger">
              <XCircle size={16} />
              Delete
            </Button>
          )}

          {gr.status === 'approved' && hasPermission(currentUser, 'manage_logistics') && (
            <Button onClick={() => onComplete(gr.id)} className="btn-success">
              <CheckCircle size={16} />
              Complete GR
            </Button>
          )}

          <Button onClick={onClose} className="btn-secondary">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// GR INSPECTION MODAL
// ============================================================================

interface GRInspectionModalProps {
  gr: GoodsReceipt;
  onClose: () => void;
  onSuccess: () => void;
}

export const GRInspectionModal: React.FC<GRInspectionModalProps> = ({ gr, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [inspectionData, setInspectionData] = useState<Record<string, InspectGRItemInput>>({});

  const currentItem = gr.items[currentItemIndex];
  const progress = ((currentItemIndex + 1) / gr.items.length) * 100;

  const handleItemInspection = (data: Partial<InspectGRItemInput>) => {
    setInspectionData({
      ...inspectionData,
      [currentItem.id]: {
        ...inspectionData[currentItem.id],
        grItemId: currentItem.id,
        acceptedQuantity: data.acceptedQuantity ?? currentItem.receivedQuantity,
        rejectedQuantity: data.rejectedQuantity ?? 0,
        qualityStatus: data.qualityStatus ?? 'pending',
        inspectionNotes: data.inspectionNotes,
        defectDescription: data.defectDescription,
        warehouseId: data.warehouseId,
        storageLocation: data.storageLocation,
      },
    });
  };

  const handleNext = () => {
    if (currentItemIndex < gr.items.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
    }
  };

  const handleSubmitInspection = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Inspect all items
      for (const itemId in inspectionData) {
        await inspectGRItem(inspectionData[itemId], currentUser.uid, currentUser.name || 'Unknown');
      }

      addToast('Inspection completed successfully', 'success');
      onSuccess();
    } catch (error: any) {
      console.error('Error submitting inspection:', error);
      addToast(error.message || 'Failed to submit inspection', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <CheckCircle size={24} />
            <div>
              <h2>Quality Inspection</h2>
              <p className="subtitle">{gr.grNumber}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="inspection-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-text">
            Item {currentItemIndex + 1} of {gr.items.length}
          </div>
        </div>

        <div className="modal-body">
          <Card>
            <h3>{currentItem.materialName}</h3>
            {currentItem.materialCode && (
              <p className="text-gray">Code: {currentItem.materialCode}</p>
            )}

            <div className="inspection-form">
              <div className="form-row">
                <div className="form-group">
                  <label>PO Quantity</label>
                  <Input type="number" value={currentItem.poQuantity} disabled />
                </div>
                <div className="form-group">
                  <label>Received Quantity</label>
                  <Input type="number" value={currentItem.receivedQuantity} disabled />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Accepted Quantity *</label>
                  <Input
                    type="number"
                    value={
                      inspectionData[currentItem.id]?.acceptedQuantity ??
                      currentItem.receivedQuantity
                    }
                    onChange={(e) =>
                      handleItemInspection({
                        acceptedQuantity: parseFloat(e.target.value),
                      })
                    }
                    min="0"
                    max={currentItem.receivedQuantity}
                  />
                </div>
                <div className="form-group">
                  <label>Rejected Quantity</label>
                  <Input
                    type="number"
                    value={inspectionData[currentItem.id]?.rejectedQuantity ?? 0}
                    onChange={(e) =>
                      handleItemInspection({
                        rejectedQuantity: parseFloat(e.target.value),
                      })
                    }
                    min="0"
                    max={currentItem.receivedQuantity}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Quality Status *</label>
                <select
                  value={inspectionData[currentItem.id]?.qualityStatus ?? 'pending'}
                  onChange={(e) =>
                    handleItemInspection({
                      qualityStatus: e.target.value as QualityStatus,
                    })
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="passed">Passed</option>
                  <option value="partial">Partial</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Inspection Notes</label>
                <textarea
                  className="form-control"
                  placeholder="Inspection findings..."
                  value={inspectionData[currentItem.id]?.inspectionNotes ?? ''}
                  onChange={(e) =>
                    handleItemInspection({
                      inspectionNotes: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>

              {(inspectionData[currentItem.id]?.rejectedQuantity ?? 0) > 0 && (
                <div className="form-group">
                  <label>Defect Description *</label>
                  <textarea
                    className="form-control"
                    placeholder="Describe the defects found..."
                    value={inspectionData[currentItem.id]?.defectDescription ?? ''}
                    onChange={(e) =>
                      handleItemInspection({
                        defectDescription: e.target.value,
                      })
                    }
                    rows={2}
                    required
                  />
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="modal-footer">
          <Button
            onClick={handlePrevious}
            disabled={currentItemIndex === 0}
            className="btn-secondary"
          >
            Previous
          </Button>

          {currentItemIndex < gr.items.length - 1 ? (
            <Button onClick={handleNext} className="btn-primary">
              Next Item
            </Button>
          ) : (
            <Button onClick={handleSubmitInspection} disabled={loading} className="btn-success">
              {loading ? 'Submitting...' : 'Complete Inspection'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default {
  CreateGRModal,
  GRDetailsModal,
  GRInspectionModal,
};
