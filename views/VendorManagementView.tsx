/**
 * VENDOR MANAGEMENT VIEW
 * 
 * Comprehensive vendor management UI including:
 * - Vendor list with advanced filtering
 * - Performance dashboard
 * - Evaluation history
 * - Blacklist management
 * - Contact & bank account management
 * 
 * Created: October 2025
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  Plus,
  Search,
  Filter,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Award,
  Ban,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { hasPermission } from '../constants';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/FormControls';
import {
  Vendor,
  VendorStatus,
  VendorCategory,
  PerformanceRating,
  VendorSummary
} from '../types/vendor';
import {
  getVendors,
  getVendorById,
  deleteVendor,
  approveVendor,
  getVendorSummary,
  searchVendors
} from '../api/vendorService';
import {
  CreateVendorModal,
  VendorDetailsModal,
  EvaluateVendorModal,
  BlacklistVendorModal
} from '../components/VendorModals';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

const STATUS_CONFIG: Record<VendorStatus, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: 'Active', color: 'green', icon: <CheckCircle size={16} /> },
  inactive: { label: 'Inactive', color: 'gray', icon: <XCircle size={16} /> },
  blacklisted: { label: 'Blacklisted', color: 'red', icon: <Ban size={16} /> },
  under_review: { label: 'Under Review', color: 'yellow', icon: <AlertTriangle size={16} /> },
  suspended: { label: 'Suspended', color: 'orange', icon: <XCircle size={16} /> },
  pending_approval: { label: 'Pending Approval', color: 'blue', icon: <AlertTriangle size={16} /> }
};

const CATEGORY_CONFIG: Record<VendorCategory, { label: string; icon: React.ReactNode }> = {
  materials: { label: 'Materials', icon: <Store size={16} /> },
  equipment: { label: 'Equipment', icon: <Store size={16} /> },
  services: { label: 'Services', icon: <Store size={16} /> },
  subcontractor: { label: 'Subcontractor', icon: <Store size={16} /> },
  labor: { label: 'Labor', icon: <Store size={16} /> },
  rental: { label: 'Rental', icon: <Store size={16} /> },
  consultant: { label: 'Consultant', icon: <Store size={16} /> },
  other: { label: 'Other', icon: <Store size={16} /> }
};

const RATING_CONFIG: Record<PerformanceRating, { label: string; color: string; stars: number }> = {
  excellent: { label: 'Excellent', color: 'green', stars: 5 },
  good: { label: 'Good', color: 'blue', stars: 4 },
  satisfactory: { label: 'Satisfactory', color: 'yellow', stars: 3 },
  poor: { label: 'Poor', color: 'red', stars: 2 },
  not_rated: { label: 'Not Rated', color: 'gray', stars: 0 }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const VendorManagementView: React.FC = () => {
  const { currentUser } = useAuth();
  const { currentProject } = useProject();
  const { addToast } = useToast();

  // State management
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEvaluateModal, setShowEvaluateModal] = useState(false);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VendorStatus[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<VendorCategory[]>([]);
  const [ratingFilter, setRatingFilter] = useState<PerformanceRating[]>([]);
  
  // Summary stats
  const [summary, setSummary] = useState<VendorSummary | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    loadVendors();
    loadSummary();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const filters = {
        status: statusFilter.length > 0 ? statusFilter : undefined,
        category: categoryFilter.length > 0 ? categoryFilter : undefined,
        rating: ratingFilter.length > 0 ? ratingFilter : undefined
      };
      
      const data = await getVendors(filters);
      setVendors(data);
    } catch (error) {
      console.error('Error loading vendors:', error);
      addToast('Failed to load vendors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await getVendorSummary();
      setSummary(data);
    } catch (error) {
      console.error('Error loading vendor summary:', error);
    }
  };

  useEffect(() => {
    loadVendors();
  }, [statusFilter, categoryFilter, ratingFilter]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCreateVendor = () => {
    if (!hasPermission(currentUser, 'manage_master_data')) {
      addToast('You do not have permission to create vendors', 'error');
      return;
    }
    setShowCreateModal(true);
  };

  const handleViewDetails = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowDetailsModal(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    if (!hasPermission(currentUser, 'manage_master_data')) {
      addToast('You do not have permission to edit vendors', 'error');
      return;
    }
    setSelectedVendor(vendor);
    setShowEditModal(true);
  };

  const handleEvaluateVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowEvaluateModal(true);
  };

  const handleBlacklistVendor = (vendor: Vendor) => {
    if (!hasPermission(currentUser, 'manage_master_data')) {
      addToast('You do not have permission to blacklist vendors', 'error');
      return;
    }
    setSelectedVendor(vendor);
    setShowBlacklistModal(true);
  };

  const handleApproveVendor = async (vendorId: string) => {
    if (!currentUser || !hasPermission(currentUser, 'manage_master_data')) return;
    
    try {
      await approveVendor(vendorId, currentUser.uid);
      addToast('Vendor approved successfully', 'success');
      loadVendors();
      loadSummary();
    } catch (error: any) {
      addToast(error.message || 'Failed to approve vendor', 'error');
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!currentUser || !hasPermission(currentUser, 'manage_master_data')) return;
    
    if (!confirm('Are you sure you want to deactivate this vendor?')) return;
    
    try {
      await deleteVendor(vendorId, currentUser.uid);
      addToast('Vendor deactivated successfully', 'success');
      loadVendors();
      loadSummary();
      setShowDetailsModal(false);
    } catch (error: any) {
      addToast(error.message || 'Failed to deactivate vendor', 'error');
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length >= 3) {
      try {
        const results = await searchVendors(term);
        setVendors(results);
      } catch (error) {
        console.error('Error searching vendors:', error);
      }
    } else if (term.length === 0) {
      loadVendors();
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderStatusBadge = (status: VendorStatus) => {
    const config = STATUS_CONFIG[status];
    return (
      <span className={`status-badge status-${config.color}`}>
        {config.icon}
        <span>{config.label}</span>
      </span>
    );
  };

  const renderRatingBadge = (rating: PerformanceRating) => {
    const config = RATING_CONFIG[rating];
    return (
      <span className={`rating-badge rating-${config.color}`}>
        {[...Array(config.stars)].map((_, i) => (
          <Star key={i} size={14} fill="currentColor" />
        ))}
        <span>{config.label}</span>
      </span>
    );
  };

  const renderPerformanceIndicator = (score: number) => {
    let color = 'red';
    let icon = <TrendingDown size={16} />;
    
    if (score >= 80) {
      color = 'green';
      icon = <TrendingUp size={16} />;
    } else if (score >= 60) {
      color = 'yellow';
      icon = <TrendingUp size={16} />;
    }
    
    return (
      <span className={`performance-indicator text-${color}`}>
        {icon}
        <span>{score.toFixed(1)}%</span>
      </span>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  // ============================================================================
  // FILTERED DATA
  // ============================================================================

  const filteredVendors = useMemo(() => {
    let result = [...vendors];
    
    if (searchTerm && searchTerm.length < 3) {
      const term = searchTerm.toLowerCase();
      result = result.filter(v =>
        v.vendorName.toLowerCase().includes(term) ||
        v.vendorCode.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [vendors, searchTerm]);

  // ============================================================================
  // PERMISSION CHECK
  // ============================================================================

  if (!hasPermission(currentUser, 'view_master_data')) {
    return (
      <div className="error-container">
        <XCircle size={48} />
        <h2>Access Denied</h2>
        <p>You do not have permission to view vendor management.</p>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="vendor-management-view">
      {/* Header */}
      <div className="view-header">
        <div className="header-content">
          <Store size={32} className="header-icon" />
          <div>
            <h1>Vendor Management</h1>
            <p className="subtitle">
              Manage vendors, track performance, and evaluate suppliers
            </p>
          </div>
        </div>
        
        {hasPermission(currentUser, 'manage_master_data') && (
          <Button onClick={handleCreateVendor} className="btn-primary">
            <Plus size={20} />
            Add Vendor
          </Button>
        )}
      </div>

      {/* Pending Approvals Alert */}
      {summary && summary.pendingApprovals > 0 && hasPermission(currentUser, 'manage_master_data') && (
        <Card className="alert-card alert-warning">
          <AlertTriangle size={24} />
          <div>
            <h3>Pending Vendor Approvals</h3>
            <p>{summary.pendingApprovals} vendor(s) awaiting approval.</p>
          </div>
          <Button 
            onClick={() => setStatusFilter(['pending_approval'])}
            className="btn-warning"
          >
            View Pending
          </Button>
        </Card>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="summary-grid">
          <Card className="summary-card">
            <div className="summary-icon blue">
              <Store size={24} />
            </div>
            <div className="summary-content">
              <div className="summary-value">{summary.totalVendors}</div>
              <div className="summary-label">Total Vendors</div>
            </div>
          </Card>

          <Card className="summary-card">
            <div className="summary-icon green">
              <CheckCircle size={24} />
            </div>
            <div className="summary-content">
              <div className="summary-value">{summary.activeVendors}</div>
              <div className="summary-label">Active Vendors</div>
            </div>
          </Card>

          <Card className="summary-card">
            <div className="summary-icon red">
              <Ban size={24} />
            </div>
            <div className="summary-content">
              <div className="summary-value">{summary.blacklistedVendors}</div>
              <div className="summary-label">Blacklisted</div>
            </div>
          </Card>

          <Card className="summary-card">
            <div className="summary-icon purple">
              <TrendingUp size={24} />
            </div>
            <div className="summary-content">
              <div className="summary-value">{summary.averagePerformanceScore.toFixed(1)}%</div>
              <div className="summary-label">Avg Performance</div>
            </div>
          </Card>

          <Card className="summary-card">
            <div className="summary-icon yellow">
              <Award size={24} />
            </div>
            <div className="summary-content">
              <div className="summary-value">{summary.averageOnTimeDeliveryRate.toFixed(1)}%</div>
              <div className="summary-label">On-Time Delivery</div>
            </div>
          </Card>

          <Card className="summary-card">
            <div className="summary-icon blue">
              <BarChart3 size={24} />
            </div>
            <div className="summary-content">
              <div className="summary-value">{formatCurrency(summary.totalPOValue)}</div>
              <div className="summary-label">Total PO Value</div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters & Search */}
      <Card className="filter-card">
        <div className="filter-row">
          <div className="search-box">
            <Search size={20} />
            <Input
              type="text"
              placeholder="Search by vendor name, code, or tax ID..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <Filter size={20} />
            <select
              value=""
              onChange={(e) => {
                const status = e.target.value as VendorStatus;
                if (status && !statusFilter.includes(status)) {
                  setStatusFilter([...statusFilter, status]);
                }
              }}
            >
              <option value="">Filter by Status...</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            <select
              value=""
              onChange={(e) => {
                const category = e.target.value as VendorCategory;
                if (category && !categoryFilter.includes(category)) {
                  setCategoryFilter([...categoryFilter, category]);
                }
              }}
            >
              <option value="">Filter by Category...</option>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            <select
              value=""
              onChange={(e) => {
                const rating = e.target.value as PerformanceRating;
                if (rating && !ratingFilter.includes(rating)) {
                  setRatingFilter([...ratingFilter, rating]);
                }
              }}
            >
              <option value="">Filter by Rating...</option>
              {Object.entries(RATING_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {(statusFilter.length > 0 || categoryFilter.length > 0 || ratingFilter.length > 0) && (
            <Button
              onClick={() => {
                setStatusFilter([]);
                setCategoryFilter([]);
                setRatingFilter([]);
              }}
              className="btn-secondary"
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Active Filters */}
        {(statusFilter.length > 0 || categoryFilter.length > 0 || ratingFilter.length > 0) && (
          <div className="active-filters">
            <span className="filter-label">Active Filters:</span>
            {statusFilter.map(status => (
              <span key={status} className="filter-tag">
                {STATUS_CONFIG[status].label}
                <button onClick={() => setStatusFilter(statusFilter.filter(s => s !== status))}>
                  ×
                </button>
              </span>
            ))}
            {categoryFilter.map(cat => (
              <span key={cat} className="filter-tag">
                {CATEGORY_CONFIG[cat].label}
                <button onClick={() => setCategoryFilter(categoryFilter.filter(c => c !== cat))}>
                  ×
                </button>
              </span>
            ))}
            {ratingFilter.map(rating => (
              <span key={rating} className="filter-tag">
                {RATING_CONFIG[rating].label}
                <button onClick={() => setRatingFilter(ratingFilter.filter(r => r !== rating))}>
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Vendor List */}
      <Card className="vendor-list-card">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading vendors...</p>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="empty-state">
            <Store size={64} className="empty-icon" />
            <h3>No Vendors Found</h3>
            <p>
              {searchTerm || statusFilter.length > 0 || categoryFilter.length > 0
                ? 'Try adjusting your filters or search term'
                : 'Add your first vendor to get started'}
            </p>
          </div>
        ) : (
          <div className="vendor-table">
            <table>
              <thead>
                <tr>
                  <th>Vendor Code</th>
                  <th>Vendor Name</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Rating</th>
                  <th>Performance</th>
                  <th>Total PO Value</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map(vendor => (
                  <tr key={vendor.id} className={vendor.isBlacklisted ? 'row-blacklisted' : ''}>
                    <td>
                      <strong>{vendor.vendorCode}</strong>
                    </td>
                    <td>
                      <div>
                        <div className="vendor-name">{vendor.vendorName}</div>
                        <small className="text-muted">{vendor.legalName}</small>
                      </div>
                    </td>
                    <td>{CATEGORY_CONFIG[vendor.category].label}</td>
                    <td>{renderStatusBadge(vendor.status)}</td>
                    <td>{renderRatingBadge(vendor.overallRating)}</td>
                    <td>{renderPerformanceIndicator(vendor.performance.performanceScore)}</td>
                    <td className="text-right">{formatCurrency(vendor.performance.totalPOValue)}</td>
                    <td>
                      <div className="action-buttons">
                        <Button
                          onClick={() => handleViewDetails(vendor)}
                          className="btn-icon"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </Button>
                        
                        {vendor.status === 'pending_approval' && hasPermission(currentUser, 'manage_master_data') && (
                          <Button
                            onClick={() => handleApproveVendor(vendor.id)}
                            className="btn-icon btn-success"
                            title="Approve Vendor"
                          >
                            <CheckCircle size={16} />
                          </Button>
                        )}

                        {hasPermission(currentUser, 'manage_master_data') && (
                          <Button
                            onClick={() => handleEditVendor(vendor)}
                            className="btn-icon btn-primary"
                            title="Edit Vendor"
                          >
                            <Edit size={16} />
                          </Button>
                        )}

                        {vendor.status === 'active' && vendor.performance.totalPOs > 0 && (
                          <Button
                            onClick={() => handleEvaluateVendor(vendor)}
                            className="btn-icon btn-warning"
                            title="Evaluate Vendor"
                          >
                            <Award size={16} />
                          </Button>
                        )}

                        {vendor.status === 'active' && !vendor.isBlacklisted && hasPermission(currentUser, 'manage_master_data') && (
                          <Button
                            onClick={() => handleBlacklistVendor(vendor)}
                            className="btn-icon btn-danger"
                            title="Blacklist Vendor"
                          >
                            <Ban size={16} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modals */}
      {showCreateModal && (
        <CreateVendorModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadVendors();
            loadSummary();
          }}
        />
      )}

      {showDetailsModal && selectedVendor && (
        <VendorDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedVendor(null);
          }}
          vendor={selectedVendor}
          onEdit={() => {
            setShowDetailsModal(false);
            setShowEditModal(true);
          }}
          onDelete={() => handleDeleteVendor(selectedVendor.id)}
        />
      )}

      {showEditModal && selectedVendor && (
        <CreateVendorModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedVendor(null);
          }}
          onSuccess={() => {
            loadVendors();
            loadSummary();
          }}
        />
      )}

      {showEvaluateModal && selectedVendor && (
        <EvaluateVendorModal
          isOpen={showEvaluateModal}
          onClose={() => {
            setShowEvaluateModal(false);
            setSelectedVendor(null);
          }}
          vendor={selectedVendor}
          onSuccess={() => {
            loadVendors();
            loadSummary();
          }}
        />
      )}

      {showBlacklistModal && selectedVendor && (
        <BlacklistVendorModal
          isOpen={showBlacklistModal}
          onClose={() => {
            setShowBlacklistModal(false);
            setSelectedVendor(null);
          }}
          vendor={selectedVendor}
          onSuccess={() => {
            loadVendors();
            loadSummary();
          }}
        />
      )}
    </div>
  );
};

export default VendorManagementView;
