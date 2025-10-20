/**
 * MATERIAL REQUEST MODALS
 * 
 * Modal components for Material Request operations:
 * - CreateMRModal: Create new MR with item entry and stock checking
 * - MRDetailsModal: View MR with approval timeline
 * - ApprovalModal: Approve/reject MR with notes
 * - ConvertToPOModal: Convert approved MR to PO
 * 
 * Created: October 2025
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  DollarSign,
  Calendar,
  User,
  MessageSquare,
  ShoppingCart,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './FormControls';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { useToast } from '@/contexts/ToastContext';
import {
  MaterialRequest,
  MRItem,
  MRStatus,
  MRPriority,
  ApprovalStage
} from '@/types/logistics';
import {
  createMaterialRequest,
  getMaterialRequestById,
  approveMaterialRequest,
  convertMRtoPO,
  validateMaterialRequest,
  checkBudgetAvailability
} from '@/api/materialRequestService';
import { checkStockLevel } from '@/api/inventoryTransactionService';

// ============================================================================
// CREATE MR MODAL
// ============================================================================

interface CreateMRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateMRModal: React.FC<CreateMRModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const { currentProject } = useProject();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    purpose: '',
    priority: 'medium' as MRPriority,
    requiredDate: '',
    deliveryLocation: '',
    notes: ''
  });

  const [items, setItems] = useState<Partial<MRItem>[]>([
    {
      materialCode: '',
      materialName: '',
      specification: '',
      unit: '',
      requestedQty: 0,
      estimatedUnitPrice: 0,
      estimatedTotal: 0,
      wbsCode: '',
      notes: ''
    }
  ]);

  const [stockInfo, setStockInfo] = useState<Record<string, { available: number; reserved: number }>>({});
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Check stock levels for items
  useEffect(() => {
    const checkStock = async () => {
      if (!currentProject) return;
      
      // Real stock checking implementation
      const stockPromises = items.map(async (item) => {
        if (item.materialCode && item.requestedQty) {
          try {
            // Check stock level for the material
            const stock = await checkStockLevel(
              item.materialCode,
              item.materialCode,
              item.requestedQty
            );
            return { 
              code: item.materialCode, 
              stock: {
                available: stock.available,
                currentStock: stock.currentStock,
                shortfall: stock.shortfall,
                message: stock.message,
                suggestions: stock.suggestions
              }
            };
          } catch (error) {
            console.error('Error checking stock:', error);
            return { 
              code: item.materialCode, 
              stock: { 
                available: false, 
                currentStock: 0,
                shortfall: item.requestedQty,
                message: 'Error checking stock',
                suggestions: []
              } 
            };
          }
        }
        return null;
      });

      const results = await Promise.all(stockPromises);
      const stockMap: Record<string, any> = {};
      results.forEach(result => {
        if (result) {
          stockMap[result.code] = result.stock;
        }
      });
      setStockInfo(stockMap);
    };

    checkStock();
  }, [items, currentProject]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        materialCode: '',
        materialName: '',
        specification: '',
        unit: '',
        requestedQty: 0,
        estimatedUnitPrice: 0,
        estimatedTotal: 0,
        wbsCode: '',
        notes: ''
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof MRItem, value: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };

    // Auto-calculate total
    if (field === 'requestedQty' || field === 'estimatedUnitPrice') {
      const qty = field === 'requestedQty' ? value : newItems[index].requestedQty || 0;
      const price = field === 'estimatedUnitPrice' ? value : newItems[index].estimatedUnitPrice || 0;
      newItems[index].estimatedTotal = qty * price;
    }

    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !currentProject) return;

    try {
      setLoading(true);
      setValidationErrors([]);

      // Validate items
      const validatedItems = items.filter(
        item => item.materialCode && item.materialName && (item.requestedQty || 0) > 0
      ) as MRItem[];

      if (validatedItems.length === 0) {
        throw new Error('Please add at least one valid item');
      }

      // Validate
      const mrData: Partial<MaterialRequest> = {
        ...formData,
        projectId: currentProject.id,
        requestedBy: currentUser.uid,
        items: validatedItems
      };

      const validation = await validateMaterialRequest(mrData as any);
      if (validation.errors.length > 0) {
        setValidationErrors(validation.errors);
        return;
      }

      // Create MR
      await createMaterialRequest(mrData as any, currentUser.uid, currentUser.email);
      
      addToast('Material request created successfully', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      addToast(error.message || 'Failed to create material request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const totalEstimatedValue = items.reduce(
    (sum, item) => sum + (item.estimatedTotal || 0),
    0
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Material Request"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="mr-form">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="alert alert-error">
            <AlertTriangle size={20} />
            <div>
              <strong>Validation Errors:</strong>
              <ul>
                {validationErrors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* General Information */}
        <div className="form-section">
          <h3>General Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Purpose*</label>
              <Input
                type="text"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Purpose of this material request"
                required
              />
            </div>

            <div className="form-group">
              <label>Priority*</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as MRPriority })}
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="form-group">
              <label>Required Date*</label>
              <Input
                type="date"
                value={formData.requiredDate}
                onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label>Delivery Location*</label>
              <Input
                type="text"
                value={formData.deliveryLocation}
                onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
                placeholder="Delivery address"
                required
              />
            </div>

            <div className="form-group span-2">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="form-section">
          <div className="section-header">
            <h3>Request Items</h3>
            <Button type="button" onClick={handleAddItem} className="btn-secondary btn-sm">
              <Plus size={16} />
              Add Item
            </Button>
          </div>

          <div className="items-list">
            {items.map((item, index) => {
              const stock = stockInfo[item.materialCode || ''];
              const showStockWarning = stock && stock.available < (item.requestedQty || 0);

              return (
                <div key={index} className="item-card">
                  <div className="item-header">
                    <span className="item-number">Item #{index + 1}</span>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="btn-icon btn-danger"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>

                  <div className="item-grid">
                    <div className="form-group">
                      <label>Material Code*</label>
                      <Input
                        type="text"
                        value={item.materialCode}
                        onChange={(e) => handleItemChange(index, 'materialCode', e.target.value)}
                        placeholder="MAT-XXX"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Material Name*</label>
                      <Input
                        type="text"
                        value={item.materialName}
                        onChange={(e) => handleItemChange(index, 'materialName', e.target.value)}
                        placeholder="Material name"
                        required
                      />
                    </div>

                    <div className="form-group span-2">
                      <label>Specification</label>
                      <Input
                        type="text"
                        value={item.specification}
                        onChange={(e) => handleItemChange(index, 'specification', e.target.value)}
                        placeholder="Technical specifications"
                      />
                    </div>

                    <div className="form-group">
                      <label>Unit*</label>
                      <Input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        placeholder="pcs, kg, m, etc."
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Requested Qty*</label>
                      <Input
                        type="number"
                        value={item.requestedQty}
                        onChange={(e) => handleItemChange(index, 'requestedQty', parseFloat(e.target.value))}
                        min="0.01"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Est. Unit Price*</label>
                      <Input
                        type="number"
                        value={item.estimatedUnitPrice}
                        onChange={(e) => handleItemChange(index, 'estimatedUnitPrice', parseFloat(e.target.value))}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Est. Total</label>
                      <Input
                        type="text"
                        value={new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        }).format(item.estimatedTotal || 0)}
                        readOnly
                        disabled
                      />
                    </div>

                    <div className="form-group">
                      <label>WBS Code</label>
                      <Input
                        type="text"
                        value={item.wbsCode}
                        onChange={(e) => handleItemChange(index, 'wbsCode', e.target.value)}
                        placeholder="1.2.3"
                      />
                    </div>

                    <div className="form-group span-3">
                      <label>Item Notes</label>
                      <Input
                        type="text"
                        value={item.notes}
                        onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                        placeholder="Additional notes for this item"
                      />
                    </div>
                  </div>

                  {/* Stock Information */}
                  {stock && (
                    <div className={`stock-info ${showStockWarning ? 'warning' : 'success'}`}>
                      <Package size={16} />
                      <span>
                        Current Stock: <strong>{stock.available}</strong> {item.unit} available
                        {stock.reserved > 0 && ` (${stock.reserved} reserved)`}
                      </span>
                      {showStockWarning && (
                        <span className="warning-text">
                          <AlertTriangle size={14} />
                          Insufficient stock
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="form-section">
          <div className="summary-box">
            <div className="summary-row">
              <span>Total Items:</span>
              <strong>{items.length}</strong>
            </div>
            <div className="summary-row">
              <span>Total Estimated Value:</span>
              <strong className="text-primary">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR'
                }).format(totalEstimatedValue)}
              </strong>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <Button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Material Request'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ============================================================================
// MR DETAILS MODAL
// ============================================================================

interface MRDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mrId: string;
  onDelete?: () => void;
}

export const MRDetailsModal: React.FC<MRDetailsModalProps> = ({
  isOpen,
  onClose,
  mrId,
  onDelete
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [mr, setMR] = useState<MaterialRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && mrId) {
      loadMR();
    }
  }, [isOpen, mrId]);

  const loadMR = async () => {
    try {
      setLoading(true);
      const data = await getMaterialRequestById(mrId);
      setMR(data);
    } catch (error) {
      addToast('Failed to load material request details', 'error');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Material Request Details">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading details...</p>
        </div>
      </Modal>
    );
  }

  if (!mr) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`MR ${mr.mrNumber}`} size="xl">
      <div className="mr-details">
        {/* Header Info */}
        <div className="details-section">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span className={`status-badge status-${mr.status}`}>
                {mr.status.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Priority:</span>
              <span className={`priority-badge priority-${mr.priority}`}>
                {mr.priority.toUpperCase()}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Created:</span>
              <span>{formatDate(mr.createdAt)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Required Date:</span>
              <span>{formatDate(mr.requiredDate)}</span>
            </div>
          </div>
        </div>

        {/* Purpose & Details */}
        <div className="details-section">
          <h3>Request Information</h3>
          <div className="info-grid">
            <div className="info-item span-2">
              <span className="info-label">Purpose:</span>
              <p>{mr.purpose}</p>
            </div>
            <div className="info-item">
              <span className="info-label">Delivery Location:</span>
              <p>{mr.deliveryLocation}</p>
            </div>
            {mr.notes && (
              <div className="info-item span-3">
                <span className="info-label">Notes:</span>
                <p>{mr.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="details-section">
          <h3>Request Items ({mr.items.length})</h3>
          <div className="items-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Material Code</th>
                  <th>Material Name</th>
                  <th>Specification</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Est. Unit Price</th>
                  <th>Est. Total</th>
                  <th>WBS</th>
                </tr>
              </thead>
              <tbody>
                {mr.items.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td><code>{item.materialCode}</code></td>
                    <td><strong>{item.materialName}</strong></td>
                    <td>{item.specification || '-'}</td>
                    <td className="text-right">{item.requestedQty}</td>
                    <td>{item.unit}</td>
                    <td className="text-right">{formatCurrency(item.estimatedUnitPrice)}</td>
                    <td className="text-right"><strong>{formatCurrency(item.estimatedTotal)}</strong></td>
                    <td>{item.wbsCode || '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={7} className="text-right"><strong>Total Estimated Value:</strong></td>
                  <td className="text-right">
                    <strong className="text-primary">{formatCurrency(mr.totalEstimatedValue)}</strong>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Approval Timeline */}
        {mr.approvalStages && mr.approvalStages.length > 0 && (
          <div className="details-section">
            <h3>Approval Timeline</h3>
            <div className="timeline">
              {mr.approvalStages.map((stage, index) => (
                <div key={index} className={`timeline-item ${stage.status}`}>
                  <div className="timeline-icon">
                    {stage.status === 'approved' && <CheckCircle size={20} />}
                    {stage.status === 'rejected' && <XCircle size={20} />}
                    {stage.status === 'pending' && <Clock size={20} />}
                  </div>
                  <div className="timeline-content">
                    <h4>{stage.stage.replace(/_/g, ' ').toUpperCase()}</h4>
                    <p className="timeline-approver">
                      <User size={14} />
                      {stage.approverName || 'Pending'}
                    </p>
                    {stage.approvedAt && (
                      <p className="timeline-date">
                        <Calendar size={14} />
                        {formatDate(stage.approvedAt)}
                      </p>
                    )}
                    {stage.notes && (
                      <p className="timeline-notes">
                        <MessageSquare size={14} />
                        {stage.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversion Info */}
        {mr.convertedToPO && mr.poId && (
          <div className="details-section">
            <div className="alert alert-success">
              <ShoppingCart size={20} />
              <div>
                <strong>Converted to Purchase Order</strong>
                <p>PO ID: {mr.poId}</p>
                <p>Converted on: {mr.convertedAt ? formatDate(mr.convertedAt) : '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <Button onClick={onClose} className="btn-secondary">
            Close
          </Button>
          {mr.status === 'draft' && onDelete && (
            <Button onClick={onDelete} className="btn-danger">
              <Trash2 size={16} />
              Delete MR
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

// ============================================================================
// APPROVAL MODAL
// ============================================================================

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  mr: MaterialRequest;
  onSuccess: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  mr,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [budgetInfo, setBudgetInfo] = useState<any>(null);

  useEffect(() => {
    if (mr.status === 'budget_check') {
      checkBudget();
    }
  }, [mr]);

  const checkBudget = async () => {
    try {
      // TODO: Priority 2 Integration - Implement WBS budget checking
      // const wbsCodes = [...new Set(mr.items.map(item => item.wbsCode).filter(Boolean))];
      // const budgetChecks = await Promise.all(
      //   wbsCodes.map(code => checkBudgetAvailability(mr.projectId, code as string, mr.totalEstimatedValue))
      // );
      // setBudgetInfo({ checks: budgetChecks, sufficient: budgetChecks.every(c => c.sufficient) });
      
      // Mock for now
      setBudgetInfo({ checks: [], sufficient: true });
    } catch (error) {
      console.error('Budget check failed:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Determine approver role
      let approverRole: 'site_manager' | 'pm' | 'budget_controller' | 'final_approver' = 'final_approver';
      if (mr.status === 'site_manager_review') approverRole = 'site_manager';
      else if (mr.status === 'pm_review') approverRole = 'pm';
      else if (mr.status === 'budget_check') approverRole = 'budget_controller';
      
      await approveMaterialRequest(
        {
          mrId: mr.id,
          approverRole,
          approved: action === 'approve',
          notes
        },
        currentUser.uid,
        currentUser.email
      );
      
      addToast(`Material request ${action === 'approve' ? 'approved' : 'rejected'} successfully`, 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      addToast(error.message || `Failed to ${action} material request`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review Material Request" size="lg">
      <form onSubmit={handleSubmit} className="approval-form">
        {/* MR Summary */}
        <div className="approval-summary">
          <h3>MR {mr.mrNumber}</h3>
          <p>{mr.purpose}</p>
          <div className="summary-stats">
            <div className="stat">
              <span>Items:</span>
              <strong>{mr.totalItems}</strong>
            </div>
            <div className="stat">
              <span>Total Value:</span>
              <strong>
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR'
                }).format(mr.totalEstimatedValue)}
              </strong>
            </div>
          </div>
        </div>

        {/* Budget Info */}
        {budgetInfo && (
          <div className={`alert ${budgetInfo.sufficient ? 'alert-success' : 'alert-error'}`}>
            {budgetInfo.sufficient ? (
              <>
                <CheckCircle size={20} />
                <div>
                  <strong>Budget Available</strong>
                  <p>Sufficient budget available for this request</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle size={20} />
                <div>
                  <strong>Insufficient Budget</strong>
                  <p>Budget allocation may be insufficient for this request</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Action Selection */}
        <div className="form-group">
          <label>Action*</label>
          <div className="radio-group">
            <label className="radio-option">
              <input
                type="radio"
                value="approve"
                checked={action === 'approve'}
                onChange={() => setAction('approve')}
              />
              <CheckCircle size={18} className="text-success" />
              <span>Approve</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                value="reject"
                checked={action === 'reject'}
                onChange={() => setAction('reject')}
              />
              <XCircle size={18} className="text-danger" />
              <span>Reject</span>
            </label>
          </div>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label>Notes{action === 'reject' && '*'}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={action === 'approve' ? 'Optional approval notes...' : 'Reason for rejection...'}
            rows={4}
            required={action === 'reject'}
          />
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <Button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            className={action === 'approve' ? 'btn-success' : 'btn-danger'}
            disabled={loading}
          >
            {loading ? 'Processing...' : action === 'approve' ? 'Approve MR' : 'Reject MR'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ============================================================================
// CONVERT TO PO MODAL
// ============================================================================

interface ConvertToPOModalProps {
  isOpen: boolean;
  onClose: () => void;
  mr: MaterialRequest;
  onSuccess: () => void;
}

export const ConvertToPOModal: React.FC<ConvertToPOModalProps> = ({
  isOpen,
  onClose,
  mr,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [vendorId, setVendorId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Create item mappings from MR items
      const itemMappings = mr.items.map(item => ({
        mrItemId: item.id,
        finalQuantity: item.requestedQty,
        finalUnitPrice: item.estimatedUnitPrice
      }));
      
      await convertMRtoPO(
        {
          mrId: mr.id,
          vendorId,
          itemMappings,
          deliveryDate: mr.requiredDate // Use MR required date as delivery date
        },
        currentUser.uid
      );
      
      addToast('Material request converted to PO successfully', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      addToast(error.message || 'Failed to convert MR to PO', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Convert to Purchase Order" size="lg">
      <form onSubmit={handleSubmit} className="convert-form">
        {/* MR Info */}
        <div className="info-box">
          <ShoppingCart size={24} />
          <div>
            <h3>MR {mr.mrNumber}</h3>
            <p>{mr.purpose}</p>
            <div className="info-stats">
              <span>{mr.totalItems} items</span>
              <span className="separator">•</span>
              <span className="text-primary"><strong>{formatCurrency(mr.totalEstimatedValue)}</strong></span>
            </div>
          </div>
        </div>

        {/* Alert */}
        <div className="alert alert-info">
          <AlertCircle size={20} />
          <div>
            <strong>Conversion Process</strong>
            <p>This will create a new Purchase Order with all items from this Material Request.</p>
          </div>
        </div>

        {/* Vendor Selection */}
        <div className="form-group">
          <label>Select Vendor*</label>
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            required
          >
            <option value="">-- Select Vendor --</option>
            {/* Vendor options would be loaded from vendor service */}
            <option value="vendor1">Vendor 1 - PT ABC</option>
            <option value="vendor2">Vendor 2 - PT XYZ</option>
          </select>
          <small className="form-hint">Select the vendor who will fulfill this order</small>
        </div>

        {/* Items Preview */}
        <div className="items-preview">
          <h4>Items to be included in PO:</h4>
          <ul>
            {mr.items.slice(0, 3).map((item, idx) => (
              <li key={idx}>
                <strong>{item.materialName}</strong> - {item.requestedQty} {item.unit}
              </li>
            ))}
            {mr.items.length > 3 && (
              <li className="text-muted">... and {mr.items.length - 3} more items</li>
            )}
          </ul>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <Button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Converting...' : 'Convert to Purchase Order'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
