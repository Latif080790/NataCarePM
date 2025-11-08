/**
 * Milestone View
 *
 * Comprehensive milestone management interface with:
 * - Timeline visualization
 * - Progress tracking
 * - Dependency management
 * - Upcoming/overdue filtering
 * - Create/update functionality
 *
 * @component MilestoneView
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Milestone } from '@/types';
import { milestoneService } from '@/api/milestoneService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input, Textarea, Select } from '@/components/FormControls';
import {
  Plus,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  Edit,
  Trash2,
  Target,
} from 'lucide-react';
import { formatDate } from '@/constants';

interface MilestoneViewProps {
  projectId: string;
}

interface MilestoneFormData {
  name: string;
  description?: string;
  dueDate: string;
  status: Milestone['status'];
  isKeyMilestone: boolean;
  deliverables?: string;
  assignedTo: string[];
  dependencies: string[];
}

export const MilestoneView: React.FC<MilestoneViewProps> = ({ projectId }) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  // State
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Milestone['status']>('all');
  const [filterType, setFilterType] = useState<'all' | 'key' | 'regular'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [formData, setFormData] = useState<MilestoneFormData>({
    name: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    isKeyMilestone: false,
    deliverables: '',
    assignedTo: [],
    dependencies: [],
  });

  // Load milestones
  useEffect(() => {
    loadMilestones();
  }, [projectId]);

  const loadMilestones = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const response = await milestoneService.getProjectMilestones(projectId);
      
      if (response.success) {
        setMilestones(response.data || []);
      } else {
        setError(response.error?.message || 'Failed to load milestones');
        addToast('Failed to load milestones', 'error');
      }
    } catch (err) {
      console.error('Error loading milestones:', err);
      setError('Failed to load milestones');
      addToast('Failed to load milestones', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    return milestones.filter((milestone) => {
      // Search filter
      const matchesSearch = 
        milestone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (milestone.description && milestone.description.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status filter
      const matchesStatus = filterStatus === 'all' || milestone.status === filterStatus;

      // Type filter
      const matchesType = 
        filterType === 'all' || 
        (filterType === 'key' && milestone.isKeyMilestone) || 
        (filterType === 'regular' && !milestone.isKeyMilestone);

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [milestones, searchTerm, filterStatus, filterType]);

  // Get status color
  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'delayed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      addToast('You must be logged in to perform this action', 'error');
      return;
    }

    try {
      if (editingMilestone) {
        // Update existing milestone
        const updates: Partial<Milestone> = {
          name: formData.name,
          description: formData.description,
          dueDate: formData.dueDate,
          status: formData.status,
          isKeyMilestone: formData.isKeyMilestone,
          deliverables: formData.deliverables ? formData.deliverables.split(',').map(d => d.trim()) : [],
          assignedTo: formData.assignedTo,
          dependencies: formData.dependencies,
        };

        const response = await milestoneService.updateMilestone(
          editingMilestone.id,
          updates,
          currentUser
        );

        if (response.success) {
          addToast('Milestone updated successfully', 'success');
          setEditingMilestone(null);
          setShowCreateModal(false);
          loadMilestones();
        } else {
          addToast(response.error?.message || 'Failed to update milestone', 'error');
        }
      } else {
        // Create new milestone
        const milestoneData: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
          projectId,
          name: formData.name,
          description: formData.description,
          dueDate: formData.dueDate,
          status: formData.status,
          isKeyMilestone: formData.isKeyMilestone,
          deliverables: formData.deliverables ? formData.deliverables.split(',').map(d => d.trim()) : [],
          progress: 0,
          dependencies: formData.dependencies,
          assignedTo: formData.assignedTo,
        };

        const response = await milestoneService.createMilestone(
          projectId,
          milestoneData,
          currentUser
        );

        if (response.success) {
          addToast('Milestone created successfully', 'success');
          setShowCreateModal(false);
          loadMilestones();
        } else {
          addToast(response.error?.message || 'Failed to create milestone', 'error');
        }
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        isKeyMilestone: false,
        deliverables: '',
        assignedTo: [],
        dependencies: [],
      });
    } catch (err) {
      console.error('Error saving milestone:', err);
      addToast('Failed to save milestone', 'error');
    }
  };

  // Handle edit milestone
  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      name: milestone.name,
      description: milestone.description || '',
      dueDate: milestone.dueDate,
      status: milestone.status,
      isKeyMilestone: milestone.isKeyMilestone,
      deliverables: milestone.deliverables?.join(', ') || '',
      assignedTo: milestone.assignedTo,
      dependencies: milestone.dependencies,
    });
    setShowCreateModal(true);
  };

  // Handle delete milestone
  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!currentUser) {
      addToast('You must be logged in to perform this action', 'error');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this milestone?');
    if (!confirmed) return;

    try {
      const response = await milestoneService.deleteMilestone(milestoneId, currentUser);
      
      if (response.success) {
        addToast('Milestone deleted successfully', 'success');
        loadMilestones();
      } else {
        addToast(response.error?.message || 'Failed to delete milestone', 'error');
      }
    } catch (err) {
      console.error('Error deleting milestone:', err);
      addToast('Failed to delete milestone', 'error');
    }
  };

  // Handle progress update
  const handleProgressUpdate = async (milestoneId: string, progress: number) => {
    if (!currentUser) {
      addToast('You must be logged in to perform this action', 'error');
      return;
    }

    try {
      const response = await milestoneService.updateMilestoneProgress(
        milestoneId,
        { milestoneId, progress },
        currentUser
      );

      if (response.success) {
        addToast('Milestone progress updated', 'success');
        loadMilestones();
      } else {
        addToast(response.error?.message || 'Failed to update progress', 'error');
      }
    } catch (err) {
      console.error('Error updating progress:', err);
      addToast('Failed to update progress', 'error');
    }
  };

  // Close modal and reset form
  const closeModal = () => {
    setShowCreateModal(false);
    setEditingMilestone(null);
    setFormData({
      name: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      isKeyMilestone: false,
      deliverables: '',
      assignedTo: [],
      dependencies: [],
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading milestones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center text-red-600">
          <AlertCircle className="w-12 h-12 mb-4" />
          <p className="text-lg font-medium mb-2">Error Loading Milestones</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadMilestones}>Retry</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Milestone Management</h1>
          <p className="text-gray-600">Track and manage project milestones</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Milestone
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Milestones</p>
              <p className="text-2xl font-bold">{milestones.length}</p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {milestones.filter(m => m.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {milestones.filter(m => m.status === 'in-progress').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {milestones.filter(m => 
                  m.status !== 'completed' && 
                  new Date(m.dueDate) < new Date()
                ).length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search milestones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full sm:w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="delayed">Delayed</option>
          </Select>
          
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="w-full sm:w-auto"
          >
            <option value="all">All Types</option>
            <option value="key">Key Milestones</option>
            <option value="regular">Regular Milestones</option>
          </Select>
        </div>
      </Card>

      {/* Milestones List */}
      <div className="space-y-4">
        {filteredMilestones.length === 0 ? (
          <Card className="p-12 text-center">
            <Target className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No milestones found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first milestone to get started'}
            </p>
            {!searchTerm && filterStatus === 'all' && filterType === 'all' && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Milestone
              </Button>
            )}
          </Card>
        ) : (
          filteredMilestones.map((milestone) => (
            <Card key={milestone.id} className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {milestone.isKeyMilestone ? (
                        <Target className="w-6 h-6 text-yellow-500" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{milestone.name}</h3>
                        {milestone.isKeyMilestone && (
                          <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Key
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${getStatusColor(milestone.status)}`}>
                          {milestone.status.replace('-', ' ')}
                        </span>
                      </div>
                      
                      {milestone.description && (
                        <p className="text-gray-600 text-sm mb-2">{milestone.description}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {formatDate(milestone.dueDate)}</span>
                        </div>
                        
                        {milestone.assignedTo.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span>{milestone.assignedTo.length} assignee(s)</span>
                          </div>
                        )}
                        
                        {milestone.deliverables && milestone.deliverables.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span>{milestone.deliverables.length} deliverable(s)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                  <div className="w-48">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{milestone.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${milestone.progress}%` }}
                      ></div>
                    </div>
                    
                    {/* Progress slider for quick updates */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={milestone.progress}
                      onChange={(e) => handleProgressUpdate(milestone.id, parseInt(e.target.value))}
                      className="w-full mt-2"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditMilestone(milestone)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteMilestone(milestone.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Dependencies */}
              {milestone.dependencies.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 mb-2">
                    Dependencies: {milestone.dependencies.length} task(s)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {milestone.dependencies.slice(0, 3).map((dep, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded"
                      >
                        Task {dep}
                      </span>
                    ))}
                    {milestone.dependencies.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                        +{milestone.dependencies.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6">
                {editingMilestone ? 'Edit Milestone' : 'Create New Milestone'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Milestone Name *
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Foundation Complete"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe this milestone..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date *
                    </label>
                    <Input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="delayed">Delayed</option>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isKeyMilestone"
                    checked={formData.isKeyMilestone}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Key Milestone
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deliverables (comma separated)
                  </label>
                  <Input
                    name="deliverables"
                    value={formData.deliverables}
                    onChange={handleInputChange}
                    placeholder="e.g., Foundation inspection report, Concrete strength test"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingMilestone ? 'Update Milestone' : 'Create Milestone'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MilestoneView;