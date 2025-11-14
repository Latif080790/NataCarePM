/**
 * WBS Management View
 *
 * Comprehensive Work Breakdown Structure management interface with:
 * - Tree visualization with expand/collapse
 * - CRUD operations for WBS elements
 * - Drag-and-drop reordering
 * - Budget vs Actual tracking
 * - Integration with RAB and Chart of Accounts
 * - Hierarchy navigation
 * - Bulk operations
 *
 * @component WBSManagementView
 */

import React, { useState, useEffect, useMemo } from 'react';
import { CardPro } from '@/components/CardPro';
import { ButtonPro } from '@/components/ButtonPro';
import { InputPro } from '@/components/DesignSystem';
import { Modal } from '@/components/Modal';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  FolderTree,
  DollarSign,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { wbsService } from '@/api/wbsService';
import { WBSElement, WBSHierarchy } from '@/types/wbs';
import { formatCurrency, hasPermission } from '@/constants';

interface WBSManagementViewProps {
  projectId: string;
  projectName: string;
}

const WBSManagementView: React.FC<WBSManagementViewProps> = ({
  projectId,
  projectName,
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  // State
  const [hierarchy, setHierarchy] = useState<WBSHierarchy | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedElement, setSelectedElement] = useState<WBSElement | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Permissions
  const canManage = hasPermission(currentUser, 'edit_rab'); // Using edit_rab for WBS management

  // Load WBS hierarchy
  useEffect(() => {
    loadWBSHierarchy();
  }, [projectId]);

  const loadWBSHierarchy = async () => {
    try {
      setLoading(true);
      const data = await wbsService.getWBSHierarchy(projectId);
      setHierarchy({ ...data, projectName });

      // Auto-expand first level
      const firstLevelIds = new Set(data.rootElements.map((e) => e.id));
      setExpandedNodes(firstLevelIds);

      console.log(`✅ Loaded ${data.totalElements} WBS elements`);
    } catch (error) {
      console.error('❌ Error loading WBS hierarchy:', error);
      addToast('Gagal memuat struktur WBS', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toggle node expand/collapse
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Expand all nodes
  const expandAll = () => {
    if (!hierarchy) return;
    const allIds = new Set(hierarchy.flatList.map((e) => e.id));
    setExpandedNodes(allIds);
  };

  // Collapse all nodes
  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Get status badge color
  const getStatusColor = (status: WBSElement['status']) => {
    switch (status) {
      case 'Not Started':
        return 'bg-gray-100 text-gray-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'On Hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: WBSElement['status']) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'In Progress':
        return <Clock className="w-4 h-4" />;
      case 'On Hold':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Get variance badge color
  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-green-600'; // Under budget
    if (variance < 0) return 'text-red-600'; // Over budget
    return 'text-gray-600'; // On budget
  };

  // Render WBS tree node
  const renderWBSNode = (element: WBSElement, level: number = 0) => {
    const isExpanded = expandedNodes.has(element.id);
    const hasChildren = element.children && element.children.length > 0;
    const isSelected = selectedElement?.id === element.id;

    return (
      <div key={element.id} className="mb-1">
        {/* Node Row */}
        <div
          className={`
                        flex items-center p-3 rounded-lg cursor-pointer transition-colors
                        ${isSelected ? 'bg-violet-essence/30 border-l-4 border-violet-essence' : 'hover:bg-violet-essence/10'}
                        ${level > 0 ? `ml-${level * 6}` : ''}
                    `}
          style={{ marginLeft: `${level * 24}px` }}
          onClick={() => setSelectedElement(element)}
        >
          {/* Expand/Collapse Icon */}
          <div className="w-6 flex-shrink-0">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(element.id);
                }}
                className="hover:bg-gray-200 rounded p-1"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* WBS Code */}
          <div className="w-24 flex-shrink-0 font-mono text-sm font-semibold">{element.code}</div>

          {/* WBS Name */}
          <div className="flex-1 min-w-0 px-3">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-violet-essence flex-shrink-0" />
              <span className="font-medium truncate">{element.name}</span>
              {element.isDeliverable && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                  Deliverable
                </span>
              )}
            </div>
          </div>

          {/* Budget */}
          <div className="w-32 text-right text-sm">
            <div className="font-semibold">{formatCurrency(element.budgetAmount)}</div>
            <div className="text-xs text-gray-500">Budget</div>
          </div>

          {/* Actual */}
          <div className="w-32 text-right text-sm">
            <div className="font-semibold">{formatCurrency(element.actualAmount)}</div>
            <div className="text-xs text-gray-500">Actual</div>
          </div>

          {/* Variance */}
          <div
            className={`w-32 text-right text-sm font-semibold ${getVarianceColor(element.variance)}`}
          >
            {formatCurrency(Math.abs(element.variance))}
            <div className="text-xs">{element.variance >= 0 ? 'Under' : 'Over'}</div>
          </div>

          {/* Progress */}
          <div className="w-24 flex-shrink-0 px-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-violet-essence h-2 rounded-full transition-all"
                  style={{ width: `${element.progress}%` }}
                />
              </div>
              <span className="text-xs font-medium">{element.progress}%</span>
            </div>
          </div>

          {/* Status */}
          <div className="w-32 flex-shrink-0 px-3">
            <span
              className={`px-2 py-1 text-xs rounded-full font-semibold inline-flex items-center gap-1 ${getStatusColor(element.status)}`}
            >
              {getStatusIcon(element.status)}
              {element.status}
            </span>
          </div>

          {/* Actions */}
          {canManage && (
            <div className="w-24 flex-shrink-0 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElement(element);
                  setIsEditModalOpen(true);
                }}
                className="p-1 hover:bg-violet-essence/20 rounded"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(element);
                }}
                className="p-1 hover:bg-red-100 rounded text-red-600"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-6">
            {element.children.map((child) => renderWBSNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Handle create WBS element
  const handleCreate = async (formData: Partial<WBSElement>) => {
    if (!currentUser) return;

    try {
      await wbsService.createWBSElement(projectId, formData as any, currentUser);
      addToast('WBS element berhasil dibuat', 'success');
      loadWBSHierarchy();
      setIsCreateModalOpen(false);
    } catch (error: any) {
      addToast(error.message || 'Gagal membuat WBS element', 'error');
    }
  };

  // Handle update WBS element
  const handleUpdate = async (formData: Partial<WBSElement>) => {
    if (!currentUser || !selectedElement) return;

    try {
      await wbsService.updateWBSElement(selectedElement.id, formData, currentUser);
      addToast('WBS element berhasil diupdate', 'success');
      loadWBSHierarchy();
      setIsEditModalOpen(false);
    } catch (error: any) {
      addToast(error.message || 'Gagal mengupdate WBS element', 'error');
    }
  };

  // Handle delete WBS element
  const handleDelete = async (element: WBSElement) => {
    if (!currentUser) return;

    const confirmed = window.confirm(
      `Hapus WBS element "${element.code} - ${element.name}"?\n\n` +
        (element.children.length > 0
          ? `PERINGATAN: Element ini memiliki ${element.children.length} child elements yang juga akan dihapus!`
          : 'Element ini akan dihapus permanent.')
    );

    if (!confirmed) return;

    try {
      await wbsService.deleteWBSElement(
        element.id,
        element.children.length > 0, // deleteChildren
        currentUser
      );
      addToast('WBS element berhasil dihapus', 'success');
      loadWBSHierarchy();
      if (selectedElement?.id === element.id) {
        setSelectedElement(null);
      }
    } catch (error: any) {
      addToast('error', error.message || 'Gagal menghapus WBS element');
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    if (!hierarchy) return { budget: 0, actual: 0, commitments: 0, variance: 0 };

    return hierarchy.flatList.reduce(
      (acc, el) => ({
        budget: acc.budget + el.budgetAmount,
        actual: acc.actual + el.actualAmount,
        commitments: acc.commitments + el.commitments,
        variance: acc.variance + el.variance,
      }),
      { budget: 0, actual: 0, commitments: 0, variance: 0 }
    );
  }, [hierarchy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-essence mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat struktur WBS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <CardPro>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-night-black flex items-center gap-2">
                <FolderTree className="w-6 h-6" />
                Work Breakdown Structure (WBS)
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {projectName} • {hierarchy?.totalElements || 0} Elements •{' '}
                {hierarchy?.maxLevel || 0} Levels
              </p>
            </div>
            {canManage && (
              <ButtonPro variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah WBS Element
              </ButtonPro>
            )}
          </div>
        </div>
      </CardPro>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CardPro>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.budget)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </CardPro>

        <CardPro>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Actual Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.actual)}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </CardPro>

        <CardPro>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Commitments</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.commitments)}</p>
              </div>
              <FileText className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </CardPro>

        <CardPro>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Variance</p>
                <p className={`text-2xl font-bold ${getVarianceColor(totals.variance)}`}>
                  {formatCurrency(Math.abs(totals.variance))}
                </p>
                <p className="text-xs text-gray-500">
                  {totals.variance >= 0 ? 'Under Budget' : 'Over Budget'}
                </p>
              </div>
              {totals.variance >= 0 ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-500" />
              )}
            </div>
          </div>
        </CardPro>
      </div>

      {/* Filters and Controls */}
      <CardPro>
        <div className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <InputPro 
              placeholder="Cari WBS code atau nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />

            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="all">Semua Status</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>

            <div className="flex gap-2 ml-auto">
              <ButtonPro variant="outline" onClick={expandAll}>
                Expand All
              </ButtonPro>
              <ButtonPro variant="outline" onClick={collapseAll}>
                Collapse All
              </ButtonPro>
            </div>
          </div>
        </div>
      </CardPro>

      {/* WBS Tree */}
      <CardPro>
        <div className="p-6 pb-4">
          <h2 className="text-lg font-semibold">WBS Hierarchy</h2>
        </div>
        <div className="p-6 pt-0">
          {hierarchy && hierarchy.rootElements.length > 0 ? (
            <div className="space-y-1">
              {/* Table Header */}
              <div className="flex items-center p-3 bg-violet-essence/10 rounded-lg font-semibold text-sm border-b-2 border-violet-essence">
                <div className="w-6"></div>
                <div className="w-24">Code</div>
                <div className="flex-1 px-3">Name</div>
                <div className="w-32 text-right">Budget</div>
                <div className="w-32 text-right">Actual</div>
                <div className="w-32 text-right">Variance</div>
                <div className="w-24 px-3">Progress</div>
                <div className="w-32 px-3">Status</div>
                {canManage && <div className="w-24">Actions</div>}
              </div>

              {/* Tree Nodes */}
              {hierarchy.rootElements.map((element) => renderWBSNode(element, 0))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FolderTree className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Belum ada WBS Element</p>
              <p className="mb-4">Mulai dengan membuat root level WBS element</p>
              {canManage && (
                <ButtonPro variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Buat WBS Element Pertama
                </ButtonPro>
              )}
            </div>
          )}
        </div>
      </CardPro>

      {/* Create/Edit Modals */}
      <WBSFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        title="Tambah WBS Element"
        hierarchy={hierarchy}
      />

      <WBSFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdate}
        title="Edit WBS Element"
        initialData={selectedElement || undefined}
        hierarchy={hierarchy}
      />
    </div>
  );
};

// WBS Form Modal Component
interface WBSFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<WBSElement>) => void;
  title: string;
  initialData?: WBSElement;
  hierarchy: WBSHierarchy | null;
}

const WBSFormModal: React.FC<WBSFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialData,
  hierarchy,
}) => {
  const [formData, setFormData] = useState<Partial<WBSElement>>({
    code: '',
    name: '',
    description: '',
    parentId: null,
    level: 1,
    budgetAmount: 0,
    actualAmount: 0,
    commitments: 0,
    variance: 0,
    variancePercentage: 0,
    availableBudget: 0,
    status: 'Not Started',
    progress: 0,
    isDeliverable: false,
    isBillable: true,
    order: 0,
    ...initialData,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* WBS Code */}
        <div>
          <label className="block text-sm font-medium mb-1">
            WBS Code <span className="text-red-500">*</span>
          </label>
          <InputPro 
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g., 1.2.3"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Format: 1.2.3 (number.number.number)</p>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <InputPro 
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Foundation Work"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea 
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detailed description of work scope..."
            className="w-full px-3 py-2 border rounded-lg resize-none"
            rows={3}
          />
        </div>

        {/* Parent WBS */}
        <div>
          <label className="block text-sm font-medium mb-1">Parent WBS</label>
          <select 
            value={formData.parentId || ''}
            onChange={(e) => {
              const parentId = e.target.value || null;
              const parent = hierarchy?.flatList.find((el) => el.id === parentId);
              setFormData({
                ...formData,
                parentId,
                level: parent ? parent.level + 1 : 1,
              });
            }}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">-- Root Level --</option>
            {hierarchy?.flatList.map((el) => (
              <option key={el.id} value={el.id}>
                {el.code} - {el.name}
              </option>
            ))}
          </select>
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium mb-1">Budget Amount</label>
          <InputPro 
            type="number"
            value={formData.budgetAmount}
            onChange={(e) => setFormData({ ...formData, budgetAmount: Number(e.target.value) })}
            placeholder="0"
            min="0"
            step="1000"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select 
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as WBSElement['status'] })
            }
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Progress */}
        <div>
          <label className="block text-sm font-medium mb-1">Progress: {formData.progress}%</label>
          <InputPro 
            type="range"
            value={formData.progress}
            onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
            min="0"
            max="100"
            step="5"
            className="w-full"
          />
        </div>

        {/* Flags */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <InputPro 
              type="checkbox"
              checked={formData.isDeliverable}
              onChange={(e) => setFormData({ ...formData, isDeliverable: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Is Deliverable</span>
          </label>

          <label className="flex items-center gap-2">
            <InputPro 
              type="checkbox"
              checked={formData.isBillable}
              onChange={(e) => setFormData({ ...formData, isBillable: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Is Billable</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <ButtonPro type="button" variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </ButtonPro>
          <ButtonPro type="submit" variant="primary">
            <Save className="w-4 h-4 mr-2" />
            Save
          </ButtonPro>
        </div>
      </form>
    </Modal>
  );
};

export default WBSManagementView;

