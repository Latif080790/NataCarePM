/**
 * Scheduling Optimization View
 *
 * Advanced scheduling optimization interface with:
 * - Resource leveling
 * - Conflict detection
 * - Constraint management
 * - Schedule baseline comparison
 *
 * @component SchedulingOptimizationView
 */

import React, { useState, useEffect } from 'react';
import { Task } from '@/types';
import { TaskDependency } from '@/types/ai-resource.types';
import { schedulingService } from '@/api/schedulingService';
import { enhancedTaskService } from '@/api/taskService.enhanced';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { useToast } from '@/contexts/ToastContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input, Textarea, Select } from '@/components/FormControls';
import {
  AlertTriangle,
  CheckCircle,
  Settings,
  Plus,
  Trash2,
  Calendar,
  Target,
  BarChart3,
  Zap,
} from 'lucide-react';
import { formatDate } from '@/constants';

interface SchedulingOptimizationViewProps {
  projectId: string;
  tasks: Task[];
}

export const SchedulingOptimizationView: React.FC<SchedulingOptimizationViewProps> = ({
  projectId,
  tasks,
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [constraints, setConstraints] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any>(null);
  const [showCreateConstraintModal, setShowCreateConstraintModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'conflicts' | 'constraints' | 'baselines'>('conflicts');
  const [formData, setFormData] = useState({
    type: 'resource' as 'resource' | 'date' | 'precedence' | 'calendar',
    description: '',
    resourceId: '',
    maxAllocation: 100,
    taskId: '',
    constraintType: 'must_start_on' as 'must_start_on' | 'must_finish_on' | 'start_no_earlier_than' | 'start_no_later_than' | 'finish_no_earlier_than' | 'finish_no_later_than',
    date: new Date().toISOString().split('T')[0],
    predecessorTaskId: '',
    successorTaskId: '',
    lagTime: 0,
    workingDays: [1, 2, 3, 4, 5], // Mon-Fri
    startHour: 8,
    endHour: 17,
  });

  // Load data
  useEffect(() => {
    loadSchedulingData();
  }, [projectId]);

  const loadSchedulingData = async () => {
    if (!projectId || !currentUser) return;

    try {
      setLoading(true);
      
      // Load constraints
      const constraintsResponse = await schedulingService.getProjectConstraints(projectId);
      if (constraintsResponse.success) {
        setConstraints(constraintsResponse.data || []);
      }

      // Load task dependencies
      const allDependencies: TaskDependency[] = [];
      for (const task of tasks) {
        try {
          const response = await enhancedTaskService.getTaskDependencies(projectId, task.id);
          if (response.success && response.data) {
            allDependencies.push(...response.data);
          }
        } catch (err) {
          console.warn(`Failed to load dependencies for task ${task.id}:`, err);
        }
      }

      // Detect conflicts
      const conflictsResponse = await schedulingService.detectScheduleConflicts(
        projectId,
        tasks,
        allDependencies
      );
      
      if (conflictsResponse.success) {
        setConflicts(conflictsResponse.data);
      }

      setError(null);
    } catch (err) {
      console.error('Error loading scheduling data:', err);
      setError('Failed to load scheduling data');
      addToast('Failed to load scheduling data', 'error');
    } finally {
      setLoading(false);
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
      // Prepare constraint data based on type
      let constraintData: any = {
        projectId,
        type: formData.type,
        description: formData.description,
        isActive: true,
      };

      switch (formData.type) {
        case 'resource':
          constraintData = {
            ...constraintData,
            resourceId: formData.resourceId,
            maxAllocation: formData.maxAllocation,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
          };
          break;
        case 'date':
          constraintData = {
            ...constraintData,
            taskId: formData.taskId,
            constraintType: formData.constraintType,
            date: formData.date,
          };
          break;
        case 'precedence':
          constraintData = {
            ...constraintData,
            predecessorTaskId: formData.predecessorTaskId,
            successorTaskId: formData.successorTaskId,
            lagTime: formData.lagTime,
          };
          break;
        case 'calendar':
          constraintData = {
            ...constraintData,
            workingDays: formData.workingDays,
            workingHours: {
              startHour: formData.startHour,
              endHour: formData.endHour,
            },
          };
          break;
      }

      const response = await schedulingService.createConstraint(
        projectId,
        constraintData,
        currentUser
      );

      if (response.success) {
        addToast('Constraint created successfully', 'success');
        setShowCreateConstraintModal(false);
        loadSchedulingData();
        
        // Reset form
        setFormData({
          type: 'resource',
          description: '',
          resourceId: '',
          maxAllocation: 100,
          taskId: '',
          constraintType: 'must_start_on',
          date: new Date().toISOString().split('T')[0],
          predecessorTaskId: '',
          successorTaskId: '',
          lagTime: 0,
          workingDays: [1, 2, 3, 4, 5],
          startHour: 8,
          endHour: 17,
        });
      } else {
        addToast(response.error?.message || 'Failed to create constraint', 'error');
      }
    } catch (err) {
      console.error('Error creating constraint:', err);
      addToast('Failed to create constraint', 'error');
    }
  };

  // Handle apply resource leveling
  const handleApplyResourceLeveling = async () => {
    if (!currentUser) {
      addToast('You must be logged in to perform this action', 'error');
      return;
    }

    try {
      // Load task dependencies
      const allDependencies: TaskDependency[] = [];
      for (const task of tasks) {
        try {
          const response = await enhancedTaskService.getTaskDependencies(projectId, task.id);
          if (response.success && response.data) {
            allDependencies.push(...response.data);
          }
        } catch (err) {
          console.warn(`Failed to load dependencies for task ${task.id}:`, err);
        }
      }

      const response = await schedulingService.applyResourceLeveling(
        projectId,
        tasks,
        allDependencies,
        currentUser
      );

      if (response.success) {
        addToast('Resource leveling applied successfully', 'success');
        loadSchedulingData();
      } else {
        addToast(response.error?.message || 'Failed to apply resource leveling', 'error');
      }
    } catch (err) {
      console.error('Error applying resource leveling:', err);
      addToast('Failed to apply resource leveling', 'error');
    }
  };

  // Handle delete constraint
  const handleDeleteConstraint = async (constraintId: string) => {
    if (!currentUser) {
      addToast('You must be logged in to perform this action', 'error');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this constraint?');
    if (!confirmed) return;

    try {
      const response = await schedulingService.deleteConstraint(constraintId, currentUser);
      
      if (response.success) {
        addToast('Constraint deleted successfully', 'success');
        loadSchedulingData();
      } else {
        addToast(response.error?.message || 'Failed to delete constraint', 'error');
      }
    } catch (err) {
      console.error('Error deleting constraint:', err);
      addToast('Failed to delete constraint', 'error');
    }
  };

  // Close modal
  const closeModal = () => {
    setShowCreateConstraintModal(false);
    setFormData({
      type: 'resource',
      description: '',
      resourceId: '',
      maxAllocation: 100,
      taskId: '',
      constraintType: 'must_start_on',
      date: new Date().toISOString().split('T')[0],
      predecessorTaskId: '',
      successorTaskId: '',
      lagTime: 0,
      workingDays: [1, 2, 3, 4, 5],
      startHour: 8,
      endHour: 17,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading scheduling data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center text-red-600">
          <AlertTriangle className="w-12 h-12 mb-4" />
          <p className="text-lg font-medium mb-2">Error Loading Scheduling Data</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadSchedulingData}>Retry</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scheduling Optimization</h1>
          <p className="text-gray-600">Manage constraints, detect conflicts, and optimize schedules</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleApplyResourceLeveling}>
            <Zap className="w-4 h-4 mr-2" />
            Apply Resource Leveling
          </Button>
          <Button onClick={() => setShowCreateConstraintModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Constraint
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resource Conflicts</p>
              <p className="text-2xl font-bold text-red-600">
                {conflicts?.resourceConflicts?.length || 0}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Date Conflicts</p>
              <p className="text-2xl font-bold text-orange-600">
                {conflicts?.dateConflicts?.length || 0}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Precedence Issues</p>
              <p className="text-2xl font-bold text-yellow-600">
                {conflicts?.precedenceConflicts?.length || 0}
              </p>
            </div>
            <Target className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Constraints</p>
              <p className="text-2xl font-bold">{constraints.length}</p>
            </div>
            <Settings className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('conflicts')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'conflicts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Conflicts ({(conflicts?.resourceConflicts?.length || 0) + (conflicts?.dateConflicts?.length || 0) + (conflicts?.precedenceConflicts?.length || 0)})
          </button>
          <button
            onClick={() => setActiveTab('constraints')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'constraints'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Constraints ({constraints.length})
          </button>
          <button
            onClick={() => setActiveTab('baselines')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'baselines'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Baselines (0)
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'conflicts' && (
        <div className="space-y-6">
          {/* Resource Conflicts */}
          {conflicts?.resourceConflicts?.length > 0 ? (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Resource Conflicts
              </h2>
              <div className="space-y-3">
                {conflicts.resourceConflicts.map((conflict: any, index: number) => (
                  <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-red-800">Resource Overallocation</h3>
                        <p className="text-sm text-red-700">
                          Resource {conflict.resourceId} is overallocated by {conflict.overallocation}%
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Resource Conflicts</h3>
              <p className="text-gray-500">All resources are properly allocated</p>
            </Card>
          )}

          {/* Date Conflicts */}
          {conflicts?.dateConflicts?.length > 0 ? (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                Date Conflicts
              </h2>
              <div className="space-y-3">
                {conflicts.dateConflicts.map((conflict: any, index: number) => (
                  <div key={index} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-orange-800">Date Constraint Violation</h3>
                        <p className="text-sm text-orange-700">
                          Task {conflict.taskId} violates {conflict.constraintType} constraint
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Date Conflicts</h3>
              <p className="text-gray-500">All date constraints are satisfied</p>
            </Card>
          )}

          {/* Precedence Conflicts */}
          {conflicts?.precedenceConflicts?.length > 0 ? (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-yellow-500" />
                Precedence Conflicts
              </h2>
              <div className="space-y-3">
                {conflicts.precedenceConflicts.map((conflict: any, index: number) => (
                  <div key={index} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-yellow-800">Dependency Violation</h3>
                        <p className="text-sm text-yellow-700">
                          Task {conflict.successorTaskId} starts before predecessor {conflict.predecessorTaskId} completes
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Precedence Conflicts</h3>
              <p className="text-gray-500">All task dependencies are satisfied</p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'constraints' && (
        <div className="space-y-6">
          {constraints.length === 0 ? (
            <Card className="p-12 text-center">
              <Settings className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Constraints</h3>
              <p className="text-gray-500 mb-4">Add constraints to control your schedule</p>
              <Button onClick={() => setShowCreateConstraintModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Constraint
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {constraints.map((constraint) => (
                <Card key={constraint.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900 capitalize">{constraint.type} Constraint</h3>
                      <p className="text-sm text-gray-600 mt-1">{constraint.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => handleDeleteConstraint(constraint.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Created {formatDate(constraint.createdAt)}
                  </div>
                  <div className="mt-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      constraint.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {constraint.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'baselines' && (
        <Card className="p-12 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Schedule Baselines</h3>
          <p className="text-gray-500 mb-4">Save and compare schedule baselines</p>
          <Button disabled>
            <Plus className="w-4 h-4 mr-2" />
            Create Baseline
          </Button>
        </Card>
      )}

      {/* Create Constraint Modal */}
      {showCreateConstraintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6">Create Scheduling Constraint</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Constraint Type
                  </label>
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    <option value="resource">Resource Constraint</option>
                    <option value="date">Date Constraint</option>
                    <option value="precedence">Precedence Constraint</option>
                    <option value="calendar">Calendar Constraint</option>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe this constraint..."
                    rows={2}
                    required
                  />
                </div>
                
                {/* Resource Constraint Fields */}
                {formData.type === 'resource' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Resource ID
                      </label>
                      <Input
                        name="resourceId"
                        value={formData.resourceId}
                        onChange={handleInputChange}
                        placeholder="Enter resource ID"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Allocation (%)
                      </label>
                      <Input
                        type="number"
                        name="maxAllocation"
                        value={formData.maxAllocation}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        required
                      />
                    </div>
                  </>
                )}
                
                {/* Date Constraint Fields */}
                {formData.type === 'date' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Task ID
                      </label>
                      <Select
                        name="taskId"
                        value={formData.taskId}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select a task</option>
                        {tasks.map(task => (
                          <option key={task.id} value={task.id}>{task.title}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Constraint Type
                      </label>
                      <Select
                        name="constraintType"
                        value={formData.constraintType}
                        onChange={handleInputChange}
                      >
                        <option value="must_start_on">Must Start On</option>
                        <option value="must_finish_on">Must Finish On</option>
                        <option value="start_no_earlier_than">Start No Earlier Than</option>
                        <option value="start_no_later_than">Start No Later Than</option>
                        <option value="finish_no_earlier_than">Finish No Earlier Than</option>
                        <option value="finish_no_later_than">Finish No Later Than</option>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <Input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </>
                )}
                
                {/* Precedence Constraint Fields */}
                {formData.type === 'precedence' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Predecessor Task
                      </label>
                      <Select
                        name="predecessorTaskId"
                        value={formData.predecessorTaskId}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select predecessor task</option>
                        {tasks.map(task => (
                          <option key={task.id} value={task.id}>{task.title}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Successor Task
                      </label>
                      <Select
                        name="successorTaskId"
                        value={formData.successorTaskId}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select successor task</option>
                        {tasks.map(task => (
                          <option key={task.id} value={task.id}>{task.title}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lag Time (hours)
                      </label>
                      <Input
                        type="number"
                        name="lagTime"
                        value={formData.lagTime}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>
                  </>
                )}
                
                {/* Calendar Constraint Fields */}
                {formData.type === 'calendar' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Working Days
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                          <label key={day} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.workingDays.includes(index)}
                              onChange={(e) => {
                                const newDays = e.target.checked
                                  ? [...formData.workingDays, index].sort()
                                  : formData.workingDays.filter(d => d !== index);
                                setFormData(prev => ({ ...prev, workingDays: newDays }));
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm">{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Hour
                        </label>
                        <Input
                          type="number"
                          name="startHour"
                          value={formData.startHour}
                          onChange={handleInputChange}
                          min="0"
                          max="23"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Hour
                        </label>
                        <Input
                          type="number"
                          name="endHour"
                          value={formData.endHour}
                          onChange={handleInputChange}
                          min="0"
                          max="23"
                        />
                      </div>
                    </div>
                  </>
                )}
                
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Constraint
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

export default SchedulingOptimizationView;