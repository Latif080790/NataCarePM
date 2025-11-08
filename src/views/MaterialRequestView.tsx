/**
 * MATERIAL REQUEST MANAGEMENT VIEW
 *
 * Comprehensive UI for Material Request operations including:
 * - MR list with filtering
 * - Create MR with inventory check
 * - Multi-level approval workflow
 * - Budget verification display
 * - MR to PO conversion
 * - Real-time status tracking
 *
 * Created: October 2025
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { useToast } from '@/contexts/ToastContext';
import { hasPermission } from '@/constants';
import { CardPro } from '@/components/CardPro';
import { ButtonPro } from '@/components/ButtonPro';
import { Input } from '@/components/FormControls';
import { MaterialRequest, MRStatus, MRPriority } from '@/types/logistics';
import {
  getMaterialRequests,
  submitMaterialRequest,
  deleteMaterialRequest,
  getMRSummary,
  getPendingApprovals,
} from '@/api/materialRequestService';
import {
  CreateMRModal,
  MRDetailsModal,
  ApprovalModal,
  ConvertToPOModal,
} from '@/components/MaterialRequestModals';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

const STATUS_CONFIG: Record<MRStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'gray', icon: <ClipboardList size={16} /> },
  submitted: { label: 'Submitted', color: 'blue', icon: <Clock size={16} /> },
  site_manager_review: { label: 'Site Manager Review', color: 'yellow', icon: <Clock size={16} /> },
  pm_review: { label: 'PM Review', color: 'yellow', icon: <Clock size={16} /> },
  budget_check: { label: 'Budget Check', color: 'yellow', icon: <DollarSign size={16} /> },
  approved: { label: 'Approved', color: 'green', icon: <CheckCircle size={16} /> },
  rejected: { label: 'Rejected', color: 'red', icon: <XCircle size={16} /> },
  converted_to_po: { label: 'Converted to PO', color: 'purple', icon: <ShoppingCart size={16} /> },
  completed: { label: 'Completed', color: 'green', icon: <CheckCircle size={16} /> },
  cancelled: { label: 'Cancelled', color: 'gray', icon: <XCircle size={16} /> },
};

const PRIORITY_CONFIG: Record<MRPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'gray' },
  medium: { label: 'Medium', color: 'blue' },
  high: { label: 'High', color: 'orange' },
  urgent: { label: 'Urgent', color: 'red' },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const MaterialRequestView: React.FC = () => {
  const { currentUser } = useAuth();
  const { currentProject } = useProject();
  const { addToast } = useToast();

  // State management
  const [mrs, setMRs] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMR, setSelectedMR] = useState<MaterialRequest | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MRStatus[]>([]);
  const [priorityFilter, setFilterPriority] = useState<MRPriority[]>([]);

  // Summary stats
  const [summary, setSummary] = useState({
    totalMRs: 0,
    pendingApproval: 0,
    approved: 0,
    totalEstimatedValue: 0,
  });

  // Pending approvals for current user
  const [pendingApprovals, setPendingApprovals] = useState<MaterialRequest[]>([]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    if (currentProject && currentUser) {
      loadMRs();
      loadSummary();
      loadPendingApprovals();
    }
  }, [currentProject, currentUser]);

  const loadMRs = async () => {
    if (!currentProject) return;

    try {
      setLoading(true);
      const filters = {
        status: statusFilter.length > 0 ? statusFilter : undefined,
        priority: priorityFilter.length > 0 ? priorityFilter : undefined,
      };

      const data = await getMaterialRequests(currentProject.id, filters);
      setMRs(data);
    } catch (error) {
      console.error('Error loading MRs:', error);
      addToast('Failed to load material requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    if (!currentProject) return;

    try {
      const data = await getMRSummary(currentProject.id);
      setSummary(data);
    } catch (error) {
      console.error('Error loading MR summary:', error);
    }
  };

  const loadPendingApprovals = async () => {
    if (!currentUser) return;

    try {
      // Determine user's role for approvals
      let role: 'site_manager' | 'pm' | 'budget_controller' | null = null;

      if (currentUser.roleId === 'site_manager') role = 'site_manager';
      else if (currentUser.roleId === 'pm') role = 'pm';
      else if (currentUser.roleId === 'finance') role = 'budget_controller';

      if (role) {
        const data = await getPendingApprovals(currentUser.uid, role);
        setPendingApprovals(data);
      }
    } catch (error) {
      console.error('Error loading pending approvals:', error);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCreateMR = () => {
    if (!hasPermission(currentUser, 'create_po')) {
      addToast('You do not have permission to create material requests', 'error');
      return;
    }
    setShowCreateModal(true);
  };

  const handleViewDetails = (mr: MaterialRequest) => {
    setSelectedMR(mr);
    setShowDetailsModal(true);
  };

  const handleApprove = (mr: MaterialRequest) => {
    setSelectedMR(mr);
    setShowApprovalModal(true);
  };

  const handleConvertToPO = (mr: MaterialRequest) => {
    if (!hasPermission(currentUser, 'create_po')) {
      addToast('You do not have permission to convert MR to PO', 'error');
      return;
    }
    setSelectedMR(mr);
    setShowConvertModal(true);
  };

  const handleSubmitMR = async (mrId: string) => {
    if (!currentUser) return;

    try {
      await submitMaterialRequest(mrId, currentUser.uid);
      addToast('Material request submitted for approval', 'success');
      loadMRs();
      loadSummary();
      loadPendingApprovals();
    } catch (error: any) {
      addToast(error.message || 'Failed to submit material request', 'error');
    }
  };

  const handleDeleteMR = async (mrId: string) => {
    if (!currentUser || !hasPermission(currentUser, 'create_po')) return;

    if (!confirm('Are you sure you want to delete this material request?')) return;

    try {
      await deleteMaterialRequest(mrId);
      addToast('Material request deleted successfully', 'success');
      loadMRs();
      loadSummary();
      setShowDetailsModal(false);
    } catch (error: any) {
      addToast(error.message || 'Failed to delete material request', 'error');
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderStatusBadge = (status: MRStatus) => {
    const config = STATUS_CONFIG[status];
    return (
      <span className={`status-badge status-${config.color}`}>
        {config.icon}
        <span>{config.label}</span>
      </span>
    );
  };

  const renderPriorityBadge = (priority: MRPriority) => {
    const config = PRIORITY_CONFIG[priority];
    return <span className={`status-badge status-${config.color}`}>{config.label}</span>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // ============================================================================
  // FILTERED DATA
  // ============================================================================

  const filteredMRs = useMemo(() => {
    let result = [...mrs];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (mr) =>
          mr.mrNumber.toLowerCase().includes(term) ||
          mr.purpose.toLowerCase().includes(term) ||
          mr.items.some((item) => item.materialName.toLowerCase().includes(term))
      );
    }

    // Apply status filter
    if (statusFilter.length > 0) {
      result = result.filter((mr) => statusFilter.includes(mr.status));
    }

    // Apply priority filter
    if (priorityFilter.length > 0) {
      result = result.filter((mr) => priorityFilter.includes(mr.priority));
    }

    return result;
  }, [mrs, searchTerm, statusFilter, priorityFilter]);

  // ============================================================================
  // PERMISSION CHECK
  // ============================================================================

  if (!hasPermission(currentUser, 'view_logistics')) {
    return (
      <div className="error-container">
        <XCircle size={48} />
        <h2>Access Denied</h2>
        <p>You do not have permission to view material requests.</p>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="material-request-view">
      {/* Header */}
      <div className="view-header">
        <div className="header-content">
          <ClipboardList size={32} className="header-icon" />
          <div>
            <h1>Material Request Management</h1>
            <p className="subtitle">Request materials with multi-level approval workflow</p>
          </div>
        </div>

        {hasPermission(currentUser, 'create_po') && (
          <ButtonPro variant="primary" icon={Plus} onClick={handleCreateMR}>
            Create Material Request
          </ButtonPro>
        )}
      </div>

      {/* Pending Approvals Alert */}
      {pendingApprovals.length > 0 && (
        <CardPro className="alert-card alert-warning">
          <AlertTriangle size={24} />
          <div>
            <h3>Pending Approvals</h3>
            <p>You have {pendingApprovals.length} material request(s) waiting for your approval.</p>
          </div>
          <ButtonPro
            variant="primary"
            onClick={() => setStatusFilter(['site_manager_review', 'pm_review', 'budget_check'])}
          >
            View Pending
          </ButtonPro>
        </CardPro>
      )}

      {/* Summary Cards */}
      <div className="summary-grid">
        <CardPro className="summary-card">
          <div className="summary-icon blue">
            <ClipboardList size={24} />
          </div>
          <div className="summary-content">
            <div className="summary-value">{summary.totalMRs}</div>
            <div className="summary-label">Total Requests</div>
          </div>
        </CardPro>

        <CardPro className="summary-card">
          <div className="summary-icon yellow">
            <Clock size={24} />
          </div>
          <div className="summary-content">
            <div className="summary-value">{summary.pendingApproval}</div>
            <div className="summary-label">Pending Approval</div>
          </div>
        </CardPro>

        <CardPro className="summary-card">
          <div className="summary-icon green">
            <CheckCircle size={24} />
          </div>
          <div className="summary-content">
            <div className="summary-value">{summary.approved}</div>
            <div className="summary-label">Approved</div>
          </div>
        </CardPro>

        <CardPro className="summary-card">
          <div className="summary-icon purple">
            <TrendingUp size={24} />
          </div>
          <div className="summary-content">
            <div className="summary-value">{formatCurrency(summary.totalEstimatedValue)}</div>
            <div className="summary-label">Total Value</div>
          </div>
        </CardPro>
      </div>

      {/* Filters & Search */}
      <CardPro className="filter-card">
        <div className="filter-row">
          <div className="search-box">
            <Search size={20} />
            <Input
              type="text"
              placeholder="Search by MR number, purpose, or material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="focus:ring-2 focus:ring-blue-600 transition-shadow"
            />
          </div>

          <div className="filter-group">
            <Filter size={20} />
            <select
              value=""
              onChange={(e) => {
                const status = e.target.value as MRStatus;
                if (status && !statusFilter.includes(status)) {
                  setStatusFilter([...statusFilter, status]);
                }
              }}
              className="focus:ring-2 focus:ring-blue-600 transition-shadow"
            >
              <option value="">Filter by Status...</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>

            <select
              value=""
              onChange={(e) => {
                const priority = e.target.value as MRPriority;
                if (priority && !priorityFilter.includes(priority)) {
                  setFilterPriority([...priorityFilter, priority]);
                }
              }}
              className="focus:ring-2 focus:ring-blue-600 transition-shadow"
            >
              <option value="">Filter by Priority...</option>
              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {(statusFilter.length > 0 || priorityFilter.length > 0) && (
            <ButtonPro
              variant="secondary"
              onClick={() => {
                setStatusFilter([]);
                setFilterPriority([]);
              }}
            >
              Clear Filters
            </ButtonPro>
          )}
        </div>

        {/* Active Filters */}
        {(statusFilter.length > 0 || priorityFilter.length > 0) && (
          <div className="active-filters">
            <span className="filter-label">Active Filters:</span>
            {statusFilter.map((status) => (
              <span key={status} className="filter-tag">
                {STATUS_CONFIG[status].label}
                <button onClick={() => setStatusFilter(statusFilter.filter((s) => s !== status))} className="transition-colors">
                  ×
                </button>
              </span>
            ))}
            {priorityFilter.map((priority) => (
              <span key={priority} className="filter-tag">
                {PRIORITY_CONFIG[priority].label}
                <button
                  onClick={() => setFilterPriority(priorityFilter.filter((p) => p !== priority))}
                  className="transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </CardPro>

      {/* MR List */}
      <CardPro className="mr-list-card">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading material requests...</p>
          </div>
        ) : filteredMRs.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={64} className="empty-icon" />
            <h3>No Material Requests Found</h3>
            <p>
              {searchTerm || statusFilter.length > 0 || priorityFilter.length > 0
                ? 'Try adjusting your filters or search term'
                : 'Create your first material request to get started'}
            </p>
          </div>
        ) : (
          <div className="mr-table">
            <table>
              <thead>
                <tr>
                  <th>MR Number</th>
                  <th>Purpose</th>
                  <th>Priority</th>
                  <th>Items</th>
                  <th>Estimated Value</th>
                  <th>Required Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMRs.map((mr) => (
                  <tr key={mr.id}>
                    <td>
                      <strong>{mr.mrNumber}</strong>
                    </td>
                    <td>{mr.purpose}</td>
                    <td>{renderPriorityBadge(mr.priority)}</td>
                    <td className="text-center">{mr.totalItems}</td>
                    <td className="text-right">{formatCurrency(mr.totalEstimatedValue)}</td>
                    <td>{formatDate(mr.requiredDate)}</td>
                    <td>{renderStatusBadge(mr.status)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleViewDetails(mr)}
                          className="btn-icon transition-colors"
                          title="View Details"
                        >
                          <ClipboardList size={16} />
                        </button>

                        {mr.status === 'draft' && hasPermission(currentUser, 'create_po') && (
                          <button
                            onClick={() => handleSubmitMR(mr.id)}
                            className="btn-icon btn-success transition-colors"
                            title="Submit"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}

                        {['site_manager_review', 'pm_review', 'budget_check'].includes(
                          mr.status
                        ) && (
                          <button
                            onClick={() => handleApprove(mr)}
                            className="btn-icon btn-primary transition-colors"
                            title="Review & Approve"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}

                        {mr.status === 'approved' &&
                          !mr.convertedToPO &&
                          hasPermission(currentUser, 'create_po') && (
                            <button
                              onClick={() => handleConvertToPO(mr)}
                              className="btn-icon btn-success transition-colors"
                              title="Convert to PO"
                            >
                              <ShoppingCart size={16} />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardPro>

      {/* Modals */}
      {showCreateModal && (
        <CreateMRModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadMRs();
            loadSummary();
            loadPendingApprovals();
          }}
        />
      )}

      {showDetailsModal && selectedMR && (
        <MRDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedMR(null);
          }}
          mrId={selectedMR.id}
          onDelete={() => handleDeleteMR(selectedMR.id)}
        />
      )}

      {showApprovalModal && selectedMR && (
        <ApprovalModal
          isOpen={showApprovalModal}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedMR(null);
          }}
          mr={selectedMR}
          onSuccess={() => {
            loadMRs();
            loadSummary();
            loadPendingApprovals();
          }}
        />
      )}

      {showConvertModal && selectedMR && (
        <ConvertToPOModal
          isOpen={showConvertModal}
          onClose={() => {
            setShowConvertModal(false);
            setSelectedMR(null);
          }}
          mr={selectedMR}
          onSuccess={() => {
            loadMRs();
            loadSummary();
          }}
        />
      )}
    </div>
  );
};

export default MaterialRequestView;
