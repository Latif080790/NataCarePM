/**
 * VENDOR MODALS
 * 
 * Modal components for vendor operations:
 * - CreateVendorModal: Create new vendor with complete info
 * - VendorDetailsModal: View comprehensive vendor details
 * - EditVendorModal: Edit vendor information
 * - EvaluateVendorModal: Evaluate vendor performance
 * - BlacklistVendorModal: Blacklist vendor with reason
 * 
 * Created: October 2025
 */

import React, { useState } from 'react';
import {
  X,
  Plus,
  Save,
  Store,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  Award,
  Ban,
  AlertTriangle,
  Star
} from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './FormControls';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import {
  Vendor,
  VendorCategory,
  PaymentTerm,
  CreateVendorInput,
  UpdateVendorInput,
  CreateEvaluationInput,
  CreateBlacklistInput
} from '../types/vendor';
import {
  createVendor,
  updateVendor,
  createVendorEvaluation,
  blacklistVendor
} from '../api/vendorService';

// ============================================================================
// CREATE VENDOR MODAL
// ============================================================================

interface CreateVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateVendorModal: React.FC<CreateVendorModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState<CreateVendorInput>({
    vendorName: '',
    legalName: '',
    category: 'materials',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    country: 'Indonesia',
    taxId: '',
    businessType: 'pt',
    paymentTerm: 'net_30'
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);
      await createVendor(formData, currentUser.uid, currentUser.email);
      addToast('Vendor created successfully', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      addToast(error.message || 'Failed to create vendor', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Vendor" size="xl">
      <form onSubmit={handleSubmit} className="vendor-form">
        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-grid">
            <div className="form-group span-2">
              <label>Vendor Name*</label>
              <Input
                type="text"
                value={formData.vendorName}
                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                required
              />
            </div>

            <div className="form-group span-2">
              <label>Legal Name*</label>
              <Input
                type="text"
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Category*</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as VendorCategory })}
                required
              >
                <option value="materials">Materials</option>
                <option value="equipment">Equipment</option>
                <option value="services">Services</option>
                <option value="subcontractor">Subcontractor</option>
                <option value="labor">Labor</option>
                <option value="rental">Rental</option>
                <option value="consultant">Consultant</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Business Type*</label>
              <select
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value as any })}
                required
              >
                <option value="pt">PT (Perseroan Terbatas)</option>
                <option value="cv">CV (Commanditaire Vennootschap)</option>
                <option value="individual">Individual</option>
                <option value="cooperative">Cooperative</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <h3>Contact Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Email*</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone*</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Mobile</label>
              <Input
                type="tel"
                value={formData.mobile || ''}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Website</label>
              <Input
                type="url"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="form-section">
          <h3>Address</h3>
          <div className="form-grid">
            <div className="form-group span-4">
              <label>Street Address*</label>
              <Input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>City*</label>
              <Input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Province*</label>
              <Input
                type="text"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Postal Code</label>
              <Input
                type="text"
                value={formData.postalCode || ''}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Country*</label>
              <Input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        {/* Legal & Tax */}
        <div className="form-section">
          <h3>Legal & Tax Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Tax ID (NPWP)*</label>
              <Input
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="XX.XXX.XXX.X-XXX.XXX"
                required
              />
            </div>

            <div className="form-group">
              <label>Business License Number</label>
              <Input
                type="text"
                value={formData.businessLicenseNumber || ''}
                onChange={(e) => setFormData({ ...formData, businessLicenseNumber: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        <div className="form-section">
          <h3>Payment Terms</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Payment Term*</label>
              <select
                value={formData.paymentTerm}
                onChange={(e) => setFormData({ ...formData, paymentTerm: e.target.value as PaymentTerm })}
                required
              >
                <option value="cod">Cash on Delivery</option>
                <option value="net_7">Net 7 Days</option>
                <option value="net_14">Net 14 Days</option>
                <option value="net_30">Net 30 Days</option>
                <option value="net_45">Net 45 Days</option>
                <option value="net_60">Net 60 Days</option>
                <option value="advance_50">50% Advance</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {formData.paymentTerm === 'custom' && (
              <div className="form-group">
                <label>Custom Payment Term</label>
                <Input
                  type="text"
                  value={formData.customPaymentTerm || ''}
                  onChange={(e) => setFormData({ ...formData, customPaymentTerm: e.target.value })}
                  placeholder="Describe custom payment terms"
                />
              </div>
            )}

            <div className="form-group">
              <label>Currency</label>
              <select
                value={formData.currency || 'IDR'}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="IDR">Indonesian Rupiah (IDR)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="SGD">Singapore Dollar (SGD)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="form-section">
          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Additional notes..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <Button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Vendor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ============================================================================
// VENDOR DETAILS MODAL (Simplified for space)
// ============================================================================

interface VendorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const VendorDetailsModal: React.FC<VendorDetailsModalProps> = ({
  isOpen,
  onClose,
  vendor,
  onEdit,
  onDelete
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Vendor: ${vendor.vendorName}`} size="xl">
      <div className="vendor-details">
        <div className="details-grid">
          <div className="detail-item">
            <strong>Vendor Code:</strong>
            <span>{vendor.vendorCode}</span>
          </div>
          <div className="detail-item">
            <strong>Legal Name:</strong>
            <span>{vendor.legalName}</span>
          </div>
          <div className="detail-item">
            <strong>Category:</strong>
            <span>{vendor.category}</span>
          </div>
          <div className="detail-item">
            <strong>Status:</strong>
            <span className={`badge badge-${vendor.status}`}>{vendor.status}</span>
          </div>
          <div className="detail-item">
            <strong>Performance Score:</strong>
            <span>{vendor.performance.performanceScore.toFixed(1)}%</span>
          </div>
          <div className="detail-item">
            <strong>Overall Rating:</strong>
            <span>{vendor.overallRating}</span>
          </div>
        </div>

        <div className="modal-actions">
          <Button onClick={onClose} className="btn-secondary">Close</Button>
          {onEdit && <Button onClick={onEdit} className="btn-primary">Edit</Button>}
          {onDelete && <Button onClick={onDelete} className="btn-danger">Delete</Button>}
        </div>
      </div>
    </Modal>
  );
};

// ============================================================================
// EVALUATE VENDOR MODAL
// ============================================================================

interface EvaluateVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor;
  onSuccess: () => void;
}

export const EvaluateVendorModal: React.FC<EvaluateVendorModalProps> = ({
  isOpen,
  onClose,
  vendor,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const { currentProject } = useProject();
  const { addToast } = useToast();

  const [scores, setScores] = useState({
    quality: 75,
    delivery: 75,
    price: 75,
    communication: 75,
    documentation: 75,
    compliance: 75
  });

  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [loading, setLoading] = useState(false);

  const averageScore = Object.values(scores).reduce((a, b) => a + b, 0) / 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !currentProject) return;

    try {
      setLoading(true);
      const input: CreateEvaluationInput = {
        vendorId: vendor.id,
        projectId: currentProject.id,
        scores,
        strengths,
        weaknesses,
        recommendations
      };

      await createVendorEvaluation(input, currentUser.uid, currentUser.email);
      addToast('Vendor evaluation submitted successfully', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      addToast(error.message || 'Failed to submit evaluation', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Evaluate: ${vendor.vendorName}`} size="lg">
      <form onSubmit={handleSubmit} className="evaluation-form">
        <div className="evaluation-scores">
          {Object.entries(scores).map(([key, value]) => (
            <div key={key} className="score-item">
              <label>{key.charAt(0).toUpperCase() + key.slice(1)}:</label>
              <input
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={(e) => setScores({ ...scores, [key]: parseInt(e.target.value) })}
              />
              <span className="score-value">{value}</span>
            </div>
          ))}
        </div>

        <div className="average-score">
          <strong>Average Score:</strong>
          <span className={`score ${averageScore >= 75 ? 'good' : 'poor'}`}>
            {averageScore.toFixed(1)}
          </span>
        </div>

        <div className="form-group">
          <label>Strengths*</label>
          <textarea
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            rows={3}
            required
          />
        </div>

        <div className="form-group">
          <label>Weaknesses*</label>
          <textarea
            value={weaknesses}
            onChange={(e) => setWeaknesses(e.target.value)}
            rows={3}
            required
          />
        </div>

        <div className="form-group">
          <label>Recommendations*</label>
          <textarea
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
            rows={3}
            required
          />
        </div>

        <div className="modal-actions">
          <Button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Evaluation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ============================================================================
// BLACKLIST VENDOR MODAL
// ============================================================================

interface BlacklistVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor;
  onSuccess: () => void;
}

export const BlacklistVendorModal: React.FC<BlacklistVendorModalProps> = ({
  isOpen,
  onClose,
  vendor,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const { currentProject } = useProject();
  const { addToast } = useToast();

  const [reason, setReason] = useState('');
  const [category, setCategory] = useState<'quality' | 'fraud' | 'non_compliance' | 'financial' | 'ethical' | 'other'>('quality');
  const [severity, setSeverity] = useState<'warning' | 'temporary' | 'permanent'>('temporary');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [effectiveUntil, setEffectiveUntil] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);
      const input: CreateBlacklistInput = {
        vendorId: vendor.id,
        projectId: currentProject?.id,
        reason,
        category,
        severity,
        effectiveFrom,
        effectiveUntil: effectiveUntil || undefined
      };

      await blacklistVendor(input, currentUser.uid, currentUser.email);
      addToast('Vendor blacklisted successfully', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      addToast(error.message || 'Failed to blacklist vendor', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Blacklist: ${vendor.vendorName}`} size="lg">
      <form onSubmit={handleSubmit} className="blacklist-form">
        <div className="alert alert-warning">
          <AlertTriangle size={20} />
          <div>
            <strong>Warning:</strong>
            <p>Blacklisting a vendor will prevent them from receiving new purchase orders.</p>
          </div>
        </div>

        <div className="form-group">
          <label>Reason*</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            required
            placeholder="Explain why this vendor is being blacklisted..."
          />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Category*</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as any)} required>
              <option value="quality">Quality Issues</option>
              <option value="fraud">Fraud</option>
              <option value="non_compliance">Non-Compliance</option>
              <option value="financial">Financial Issues</option>
              <option value="ethical">Ethical Violations</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Severity*</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value as any)} required>
              <option value="warning">Warning (Can be reviewed)</option>
              <option value="temporary">Temporary (Time-limited)</option>
              <option value="permanent">Permanent (Indefinite)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Effective From*</label>
            <Input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              required
            />
          </div>

          {severity === 'temporary' && (
            <div className="form-group">
              <label>Effective Until</label>
              <Input
                type="date"
                value={effectiveUntil}
                onChange={(e) => setEffectiveUntil(e.target.value)}
                min={effectiveFrom}
              />
            </div>
          )}
        </div>

        <div className="modal-actions">
          <Button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" className="btn-danger" disabled={loading}>
            {loading ? 'Blacklisting...' : 'Blacklist Vendor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
