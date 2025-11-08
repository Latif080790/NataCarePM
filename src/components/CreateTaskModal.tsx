import { useState, FormEvent, useMemo, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input, Select, Textarea } from './FormControls';
import { Task, User, RabItem } from '@/types';
import { taskService } from '@/api/taskService';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { useToast } from '@/contexts/ToastContext';
import { Spinner } from './Spinner';
import { Calendar, Tag, AlertCircle, Plus, X, GitBranch, Info } from 'lucide-react';
import { getTodayDateString } from '@/constants';
import { taskSchema } from '@/schemas/projectSchemas';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: (task: Task) => void;
}

export default function CreateTaskModal({ isOpen, onClose, onTaskCreated }: CreateTaskModalProps) {
  const { currentUser } = useAuth();
  const { currentProject } = useProject();
  const { addToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    status: 'todo' as Task['status'],
    dueDate: getTodayDateString(),
    assignedTo: [] as string[],
    tags: [] as string[],
    rabItemId: undefined as number | undefined,
    dependencies: [] as string[], // Task IDs that this task depends on
  });

  const [newTag, setNewTag] = useState('');
  const [availableUsers] = useState<User[]>(currentProject?.members || []);
  const [availableRabItems] = useState<RabItem[]>(currentProject?.items || []);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Load available tasks when modal opens
  useEffect(() => {
    if (isOpen && currentProject) {
      setLoadingTasks(true);
      taskService.getTasksByProject(currentProject.id)
        .then((response: any) => {
          if (response.success) {
            // Only show incomplete tasks that can be dependencies
            const incompleteTasks = response.data.filter(
              (task: Task) => task.status !== 'completed'
            );
            setAvailableTasks(incompleteTasks);
          }
        })
        .catch((error: any) => {
          console.error('Error loading tasks:', error);
        })
        .finally(() => {
          setLoadingTasks(false);
        });
    }
  }, [isOpen, currentProject]);

  // Check for circular dependencies
  const checkCircularDependency = (taskId: string, visited: Set<string> = new Set()): boolean => {
    if (visited.has(taskId)) {
      return true; // Circular dependency detected
    }

    visited.add(taskId);

    const task = availableTasks.find((t) => t.id === taskId);
    if (!task || !task.dependencies) {
      return false;
    }

    for (const depId of task.dependencies) {
      if (checkCircularDependency(depId, new Set(visited))) {
        return true;
      }
    }

    return false;
  };

  // Get dependency warnings
  const dependencyWarnings = useMemo(() => {
    const warnings: string[] = [];
    
    for (const depId of formData.dependencies) {
      if (checkCircularDependency(depId)) {
        const task = availableTasks.find((t) => t.id === depId);
        warnings.push(`Circular dependency detected with "${task?.title}"`);
      }
    }

    return warnings;
  }, [formData.dependencies, availableTasks]);

  // Validation using Zod schema
  const validateForm = (): boolean => {
    if (!currentProject) {
      setValidationErrors(['Project tidak ditemukan']);
      return false;
    }

    const result = taskSchema.safeParse({
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      projectId: currentProject.id,
      assignedTo: formData.assignedTo[0] || '', // Schema expects single assignee
      dueDate: formData.dueDate,
      tags: formData.tags,
    });

    if (!result.success) {
      const errorMessages = result.error.issues.map((err) =>
        err.path.length > 0 ? `${err.path.join('.')}: ${err.message}` : err.message
      );
      setValidationErrors(errorMessages);
      setErrors(
        result.error.issues.reduce((acc, err) => {
          const key = err.path[0] as string;
          if (key) acc[key] = err.message;
          return acc;
        }, {} as Record<string, string>)
      );
      return false;
    }

    setValidationErrors([]);
    setErrors({});
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !currentProject || !currentUser) {
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
        projectId: currentProject.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate,
        assignedTo: formData.assignedTo,
        createdBy: currentUser.id,
        dependencies: formData.dependencies,
        subtasks: [],
        progress: 0,
        tags: formData.tags,
        rabItemId: formData.rabItemId,
      };

      const taskIdResponse = await taskService.createTask(currentProject.id, taskData, currentUser);
      const taskId = taskIdResponse.success ? taskIdResponse.data : '';

      if (!taskId) {
        throw new Error('Failed to create task');
      }

      // Get created task for callback
      const createdTaskResponse = await taskService.getTaskById(currentProject.id, taskId);
      const createdTask = createdTaskResponse.success ? createdTaskResponse.data : null;

      addToast('Task berhasil dibuat!', 'success');

      if (createdTask && onTaskCreated) {
        onTaskCreated(createdTask);
      }

      handleReset();
      onClose();
    } catch (error: any) {
      console.error('Error creating task:', error);
      addToast(`Gagal membuat task: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form reset
  const handleReset = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      dueDate: getTodayDateString(),
      assignedTo: [],
      tags: [],
      rabItemId: undefined,
      dependencies: [],
    });
    setNewTag('');
    setErrors({});
  };

  // Handle close
  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Handle tag management
  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, trimmedTag],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // Handle assignee management
  const handleToggleAssignee = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(userId)
        ? prev.assignedTo.filter((id) => id !== userId)
        : [...prev.assignedTo, userId],
    }));
  };

  // Handle dependency management
  const handleToggleDependency = (taskId: string) => {
    setFormData((prev) => ({
      ...prev,
      dependencies: prev.dependencies.includes(taskId)
        ? prev.dependencies.filter((id) => id !== taskId)
        : [...prev.dependencies, taskId],
    }));
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'low':
        return 'text-gray-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-orange-600';
      case 'critical':
        return 'text-red-600';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Buat Task Baru" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Validation Errors Summary */}
        {validationErrors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800 mb-1">Validation Errors</h4>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-night-black mb-1">Judul Task *</label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, title: e.target.value }));
              setValidationErrors([]);
              setErrors({});
            }}
            placeholder="Masukkan judul task yang jelas dan deskriptif"
            disabled={isSubmitting}
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-night-black mb-1">Deskripsi *</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Jelaskan detail task, acceptance criteria, dan deliverable yang diharapkan"
            rows={4}
            disabled={isSubmitting}
            className={errors.description ? 'border-red-500' : ''}
          />
          {errors.description && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.description}
            </p>
          )}
          <p className="text-xs text-palladium mt-1">{formData.description.length}/1000 karakter</p>
        </div>

        {/* Priority & Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-night-black mb-1">Prioritas</label>
            <Select
              value={formData.priority}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, priority: e.target.value as Task['priority'] }))
              }
              disabled={isSubmitting}
            >
              <option value="low">🟢 Low Priority</option>
              <option value="medium">🟡 Medium Priority</option>
              <option value="high">🟠 High Priority</option>
              <option value="critical">🔴 Critical Priority</option>
            </Select>
            <p className={`text-xs mt-1 ${getPriorityColor(formData.priority)}`}>
              {formData.priority === 'low' && 'Dapat dikerjakan kapan saja'}
              {formData.priority === 'medium' && 'Prioritas normal, selesaikan sesuai jadwal'}
              {formData.priority === 'high' && 'Perlu perhatian khusus dan penyelesaian cepat'}
              {formData.priority === 'critical' && 'Sangat urgent, harus segera diselesaikan'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-night-black mb-1">Status Awal</label>
            <Select
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.value as Task['status'] }))
              }
              disabled={isSubmitting}
            >
              <option value="todo">📝 To Do</option>
              <option value="in-progress">⚡ In Progress</option>
              <option value="blocked">🚫 Blocked</option>
            </Select>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-night-black mb-1">
            Tanggal Deadline *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-palladium" />
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
              disabled={isSubmitting}
              className={`pl-10 ${errors.dueDate ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.dueDate && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.dueDate}
            </p>
          )}
        </div>

        {/* Assignees */}
        <div>
          <label className="block text-sm font-medium text-night-black mb-1">
            Assign ke Team Members *
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto border border-violet-essence rounded-md p-3">
            {availableUsers.map((user) => (
              <label
                key={user.id}
                className="flex items-center space-x-2 cursor-pointer hover:bg-violet-essence/20 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={formData.assignedTo.includes(user.id)}
                  onChange={() => handleToggleAssignee(user.id)}
                  disabled={isSubmitting}
                  className="rounded border-gray-300"
                />
                <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full" />
                <span className="text-sm">{user.name}</span>
                <span className="text-xs text-palladium">({user.roleId})</span>
              </label>
            ))}
          </div>
          {errors.assignedTo && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.assignedTo}
            </p>
          )}
          <p className="text-xs text-palladium mt-1">
            {formData.assignedTo.length} dari {availableUsers.length} team member dipilih
          </p>
        </div>

        {/* RAB Item Link */}
        <div>
          <label className="block text-sm font-medium text-night-black mb-1">
            Link ke Item RAB (Opsional)
          </label>
          <Select
            value={formData.rabItemId || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                rabItemId: e.target.value ? parseInt(e.target.value) : undefined,
              }))
            }
            disabled={isSubmitting}
          >
            <option value="">-- Pilih Item RAB --</option>
            {availableRabItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.no} - {item.uraian}
              </option>
            ))}
          </Select>
          <p className="text-xs text-palladium mt-1">
            Link task ke item pekerjaan dalam RAB untuk tracking progres
          </p>
        </div>

        {/* Task Dependencies */}
        <div>
          <label className="block text-sm font-medium text-night-black mb-1 flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Task Dependencies (Predecessor Tasks)
          </label>
          
          {loadingTasks ? (
            <div className="flex items-center justify-center py-4 border border-violet-essence rounded-md">
              <Spinner size="sm" />
              <span className="ml-2 text-sm text-palladium">Loading tasks...</span>
            </div>
          ) : availableTasks.length === 0 ? (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-sm text-palladium text-center">
              <Info className="w-5 h-5 mx-auto mb-2 text-gray-400" />
              No available tasks to set as dependencies
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-violet-essence rounded-md p-3">
                {availableTasks.map((task) => (
                  <label
                    key={task.id}
                    className="flex items-start space-x-2 cursor-pointer hover:bg-violet-essence/20 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.dependencies.includes(task.id)}
                      onChange={() => handleToggleDependency(task.id)}
                      disabled={isSubmitting}
                      className="rounded border-gray-300 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{task.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          task.priority === 'critical' ? 'bg-red-100 text-red-700' :
                          task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {task.priority}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                          task.status === 'blocked' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {task.status}
                        </span>
                        {task.dueDate && (
                          <span className="text-xs text-palladium">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              
              {formData.dependencies.length > 0 && (
                <p className="text-xs text-palladium mt-2">
                  {formData.dependencies.length} task(s) selected as dependencies - this task will be blocked until they are completed
                </p>
              )}

              {/* Circular Dependency Warnings */}
              {dependencyWarnings.length > 0 && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-semibold text-red-800 mb-1">Dependency Conflicts</h5>
                      <ul className="text-xs text-red-700 space-y-1">
                        {dependencyWarnings.map((warning, idx) => (
                          <li key={idx}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          <p className="text-xs text-palladium mt-1 flex items-start gap-1">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>
              Select tasks that must be completed before this task can start. Dependencies help maintain proper work sequence and prevent conflicts.
            </span>
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-night-black mb-1">Tags</label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Tambah tag (contoh: frontend, backend, urgent)"
                disabled={isSubmitting}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={isSubmitting || !newTag.trim()}
                size="sm"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 bg-violet-essence text-night-black text-xs rounded-full"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      disabled={isSubmitting}
                      className="ml-1 hover:bg-red-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-violet-essence">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner size="sm" />
                Membuat Task...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Buat Task
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
