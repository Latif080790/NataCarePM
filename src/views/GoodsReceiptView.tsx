/**
 * GOODS RECEIPT MANAGEMENT VIEW
 *
 * Comprehensive UI for Goods Receipt operations including:
 * - GR list with filtering and search
 * - Create GR from PO
 * - Quality inspection workflow
 * - Photo upload for defects
 * - Real-time status tracking
 * - Integration with Inventory and WBS
 *
 * Created: October 2025
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  Eye,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { useToast } from '@/contexts/ToastContext';
import { hasPermission } from '@/constants';
import { CardPro } from '@/components/CardPro';
import { ButtonPro } from '@/components/ButtonPro';
import { InputPro } from '@/components/DesignSystem';
import { GoodsReceipt, GRStatus, QualityStatus, GRFilterOptions } from '@/types/logistics';
import { ResponsiveTable, Column } from '@/components/ResponsiveTable';
import { useIsMobile } from '@/utils/mobileOptimization';
// import { PurchaseOrder } from '@/types';
import {
  getGoodsReceipts,
  submitGoodsReceipt,
  completeGoodsReceipt,
  deleteGoodsReceipt,
  getGRSummary,
} from '@/api/goodsReceiptService';
import { CreateGRModal, GRDetailsModal, GRInspectionModal } from '@/components/GoodsReceiptModals';
// interface GRFormData { ... } // Removed if unused
// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

// interface GRFormData { ... } // Removed if unused

const STATUS_CONFIG: Record<GRStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'gray', icon: <FileText size={16} /> },
  submitted: { label: 'Submitted', color: 'blue', icon: <Upload size={16} /> },
  inspecting: { label: 'Inspecting', color: 'yellow', icon: <Eye size={16} /> },
  approved: { label: 'Approved', color: 'green', icon: <CheckCircle size={16} /> },
  rejected: { label: 'Rejected', color: 'red', icon: <XCircle size={16} /> },
  completed: { label: 'Completed', color: 'green', icon: <CheckCircle size={16} /> },
  cancelled: { label: 'Cancelled', color: 'gray', icon: <XCircle size={16} /> },
};

const QUALITY_CONFIG: Record<
  QualityStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: { label: 'Pending', color: 'gray', icon: <Clock size={16} /> },
  passed: { label: 'Passed', color: 'green', icon: <CheckCircle size={16} /> },
  partial: { label: 'Partial', color: 'yellow', icon: <AlertTriangle size={16} /> },
  failed: { label: 'Failed', color: 'red', icon: <XCircle size={16} /> },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const GoodsReceiptView: React.FC = React.memo(() => {
  const { currentUser } = useAuth();
  const { currentProject } = useProject();
  const { addToast } = useToast();
  
  // Mobile optimization hooks
  const isMobile = useIsMobile();

  // State management
  const [grs, setGRs] = useState<GoodsReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGR, setSelectedGR] = useState<GoodsReceipt | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<GRStatus[]>([]);
  const [qualityFilter, setQualityFilter] = useState<QualityStatus[]>([]);

  // Summary stats
  const [summary, setSummary] = useState({
    totalGRs: 0,
    pendingInspection: 0,
    completedGRs: 0,
    totalValue: 0,
  });

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    if (currentProject) {
      loadGRs();
      loadSummary();
    }
  }, [currentProject]);

  const loadGRs = async () => {
    if (!currentProject) return;

    try {
      setLoading(true);
      const filters: GRFilterOptions = {
        projectId: currentProject.id,
        status: statusFilter.length > 0 ? statusFilter : undefined,
        qualityStatus: qualityFilter.length > 0 ? qualityFilter : undefined,
        searchTerm: searchTerm || undefined,
      };

      const data = await getGoodsReceipts(currentProject.id, filters);
      setGRs(data);
    } catch (error) {
      console.error('Error loading GRs:', error);
      addToast('Failed to load goods receipts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    if (!currentProject) return;

    try {
      const data = await getGRSummary(currentProject.id);
      setSummary(data);
    } catch (error) {
      console.error('Error loading GR summary:', error);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCreateGR = () => {
    if (!hasPermission(currentUser, 'manage_logistics')) {
      addToast('You do not have permission to create goods receipts', 'error');
      return;
    }
    setShowCreateModal(true);
  };

  const handleViewDetails = (gr: GoodsReceipt) => {
    setSelectedGR(gr);
    setShowDetailsModal(true);
  };

  const handleInspect = (gr: GoodsReceipt) => {
    if (!hasPermission(currentUser, 'manage_logistics')) {
      addToast('You do not have permission to inspect goods receipts', 'error');
      return;
    }
    setSelectedGR(gr);
    setShowInspectionModal(true);
  };

  const handleSubmitGR = async (grId: string) => {
    if (!currentUser) return;

    try {
      await submitGoodsReceipt(grId, currentUser.uid);
      addToast('Goods receipt submitted for inspection', 'success');
      loadGRs();
      loadSummary();
    } catch (error: any) {
      addToast(error.message || 'Failed to submit goods receipt', 'error');
    }
  };

  const handleCompleteGR = async (grId: string) => {
    if (!currentUser) return;

    try {
      await completeGoodsReceipt(grId, currentUser.uid);
      addToast('Goods receipt completed successfully', 'success');
      loadGRs();
      loadSummary();
      setShowDetailsModal(false);
    } catch (error: any) {
      addToast(error.message || 'Failed to complete goods receipt', 'error');
    }
  };

  const handleDeleteGR = async (grId: string) => {
    if (!currentUser || !hasPermission(currentUser, 'manage_logistics')) return;

    if (!confirm('Are you sure you want to delete this goods receipt?')) return;

    try {
      await deleteGoodsReceipt(grId);
      addToast('Goods receipt deleted successfully', 'success');
      loadGRs();
      loadSummary();
      setShowDetailsModal(false);
    } catch (error: any) {
      addToast(error.message || 'Failed to delete goods receipt', 'error');
    }
  };

  // ============================================================================
  // TABLE COLUMNS CONFIGURATION
  // ============================================================================

  const getGRColumns = (): Column<GoodsReceipt>[] => [
    {
      key: 'grNumber',
      label: 'GR Number',
      mobileLabel: 'GR#',
      sortable: true,
      render: (value) => <strong>{value}</strong>,
      width: '120px',
    },
    {
      key: 'poNumber',
      label: 'PO Number',
      mobileLabel: 'PO#',
      sortable: true,
      width: '120px',
    },
    {
      key: 'vendorName',
      label: 'Vendor',
      sortable: true,
      width: '180px',
    },
    {
      key: 'receiptDate',
      label: 'Receipt Date',
      mobileLabel: 'Date',
      sortable: true,
      render: (value) => formatDate(value),
      width: '120px',
    },
    {
      key: 'totalItems',
      label: 'Items',
      hiddenOnMobile: true,
      render: (value) => <span className="text-center">{value}</span>,
      width: '80px',
    },
    {
      key: 'totalValue',
      label: 'Total Value',
      mobileLabel: 'Value',
      sortable: true,
      render: (value) => formatCurrency(value),
      width: '140px',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => renderStatusBadge(value),
      width: '120px',
    },
    {
      key: 'overallQualityStatus',
      label: 'Quality',
      hiddenOnMobile: isMobile,
      render: (value) => renderQualityBadge(value),
      width: '120px',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, gr) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <ButtonPro
            variant="secondary"
            size="sm"
            onClick={() => handleViewDetails(gr)}
            title="View Details"
          >
            <Eye size={16} />
          </ButtonPro>

          {(gr.status === 'submitted' || gr.status === 'inspecting') &&
            hasPermission(currentUser, 'manage_logistics') && (
              <ButtonPro
                variant="primary"
                size="sm"
                onClick={() => handleInspect(gr)}
                title="Inspect"
              >
                <CheckCircle size={16} />
              </ButtonPro>
            )}

          {gr.status === 'draft' &&
            hasPermission(currentUser, 'manage_logistics') && (
              <ButtonPro
                variant="primary"
                size="sm"
                onClick={() => handleSubmitGR(gr.id)}
                title="Submit"
              >
                <Upload size={16} />
              </ButtonPro>
            )}

          {gr.status === 'approved' &&
            hasPermission(currentUser, 'manage_logistics') && (
              <ButtonPro
                variant="primary"
                size="sm"
                onClick={() => handleCompleteGR(gr.id)}
                title="Complete"
              >
                <CheckCircle size={16} />
              </ButtonPro>
            )}
        </div>
      ),
      width: '200px',
    },
  ];

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderStatusBadge = (status: GRStatus) => {
    const config = STATUS_CONFIG[status];
    return (
      <span className={`status-badge status-${config.color}`}>
        {config.icon}
        <span>{config.label}</span>
      </span>
    );
  };

  const renderQualityBadge = (quality: QualityStatus) => {
    const config = QUALITY_CONFIG[quality];
    return (
      <span className={`status-badge status-${config.color}`}>
        {config.icon}
        <span>{config.label}</span>
      </span>
    );
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

  const filteredGRs = useMemo(() => {
    let result = [...grs];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (gr) =>
          gr.grNumber.toLowerCase().includes(term) ||
          gr.poNumber.toLowerCase().includes(term) ||
          gr.vendorName.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter.length > 0) {
      result = result.filter((gr) => statusFilter.includes(gr.status));
    }

    // Apply quality filter
    if (qualityFilter.length > 0) {
      result = result.filter((gr) => qualityFilter.includes(gr.overallQualityStatus));
    }

    return result;
  }, [grs, searchTerm, statusFilter, qualityFilter]);

  // ============================================================================
  // PERMISSION CHECK
  // ============================================================================

  if (!hasPermission(currentUser, 'view_logistics')) {
    return (
      <div className="error-container">
        <XCircle size={48} />
        <h2>Access Denied</h2>
        <p>You do not have permission to view goods receipts.</p>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="goods-receipt-view">
      {/* Header */}
      <div className="view-header">
        <div className="header-content">
          <Package size={32} className="header-icon" />
          <div>
            <h1>Goods Receipt Management</h1>
            <p className="subtitle">Track and inspect material deliveries with quality control</p>
          </div>
        </div>

        {hasPermission(currentUser, 'manage_logistics') && (
          <ButtonPro variant="primary" icon={Plus} onClick={handleCreateGR}>
            Create Goods Receipt
          </ButtonPro>
        )}
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <CardPro className="summary-card">
          <div className="summary-icon blue">
            <Package size={24} />
          </div>
          <div className="summary-content">
            <div className="summary-value">{summary.totalGRs}</div>
            <div className="summary-label">Total Receipts</div>
          </div>
        </CardPro>

        <CardPro className="summary-card">
          <div className="summary-icon yellow">
            <Eye size={24} />
          </div>
          <div className="summary-content">
            <div className="summary-value">{summary.pendingInspection}</div>
            <div className="summary-label">Pending Inspection</div>
          </div>
        </CardPro>

        <CardPro className="summary-card">
          <div className="summary-icon green">
            <CheckCircle size={24} />
          </div>
          <div className="summary-content">
            <div className="summary-value">{summary.completedGRs}</div>
            <div className="summary-label">Completed</div>
          </div>
        </CardPro>

        <CardPro className="summary-card">
          <div className="summary-icon purple">
            <TrendingUp size={24} />
          </div>
          <div className="summary-content">
            <div className="summary-value">{formatCurrency(summary.totalValue)}</div>
            <div className="summary-label">Total Value</div>
          </div>
        </CardPro>
      </div>

      {/* Filters & Search */}
      <CardPro className="filter-card">
        <div className="filter-row">
          <div className="search-box">
            <Search size={20} />
            <InputPro 
              type="text"
              placeholder="Search by GR number, PO number, or vendor..."
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
                const status = e.target.value as GRStatus;
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
                const quality = e.target.value as QualityStatus;
                if (quality && !qualityFilter.includes(quality)) {
                  setQualityFilter([...qualityFilter, quality]);
                }
              }}
              className="focus:ring-2 focus:ring-blue-600 transition-shadow"
            >
              <option value="">Filter by Quality...</option>
              {Object.entries(QUALITY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {(statusFilter.length > 0 || qualityFilter.length > 0) && (
            <ButtonPro
              variant="secondary"
              onClick={() => {
                setStatusFilter([]);
                setQualityFilter([]);
              }}
            >
              Clear Filters
            </ButtonPro>
          )}
        </div>

        {/* Active Filters */}
        {(statusFilter.length > 0 || qualityFilter.length > 0) && (
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
            {qualityFilter.map((quality) => (
              <span key={quality} className="filter-tag">
                {QUALITY_CONFIG[quality].label}
                <button
                  onClick={() => setQualityFilter(qualityFilter.filter((q) => q !== quality))}
                  className="transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </CardPro>

      {/* GR List */}
      <CardPro className="gr-list-card">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading goods receipts...</p>
          </div>
        ) : filteredGRs.length === 0 ? (
          <div className="empty-state">
            <Package size={64} className="empty-icon" />
            <h3>No Goods Receipts Found</h3>
            <p>
              {searchTerm || statusFilter.length > 0 || qualityFilter.length > 0
                ? 'Try adjusting your filters or search term'
                : 'Create your first goods receipt to get started'}
            </p>
          </div>
        ) : (
          <ResponsiveTable
            data={filteredGRs}
            columns={getGRColumns()}
            keyExtractor={(gr) => gr.id}
            onRowClick={(gr) => handleViewDetails(gr)}
            loading={loading}
            searchable={false}
            pageSize={isMobile ? 10 : 20}
            className="gr-responsive-table"
          />
        )}
      </CardPro>

      {/* Modals */}
      {showCreateModal && (
        <CreateGRModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadGRs();
            loadSummary();
          }}
        />
      )}

      {showDetailsModal && selectedGR && (
        <GRDetailsModal
          gr={selectedGR}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedGR(null);
          }}
          onUpdate={() => {
            loadGRs();
            loadSummary();
          }}
          onDelete={handleDeleteGR}
          onComplete={handleCompleteGR}
        />
      )}

      {showInspectionModal && selectedGR && (
        <GRInspectionModal
          gr={selectedGR}
          onClose={() => {
            setShowInspectionModal(false);
            setSelectedGR(null);
          }}
          onSuccess={() => {
            setShowInspectionModal(false);
            setSelectedGR(null);
            loadGRs();
            loadSummary();
          }}
        />
      )}
    </div>
  );
});

GoodsReceiptView.displayName = 'GoodsReceiptView';

export default GoodsReceiptView;



