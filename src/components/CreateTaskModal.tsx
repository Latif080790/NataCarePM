import { useState, FormEvent } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input, Select, Textarea } from './FormControls';
import { Task, User, RabItem } from '@/types';
import { taskService } from '@/api/taskService';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { useToast } from '@/contexts/ToastContext';
import { Spinner } from './Spinner';
import { Calendar, Tag, AlertCircle, Plus, X } from 'lucide-react';
import { getTodayDateString } from '@/constants';

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
  });

  const [newTag, setNewTag] = useState('');
  const [availableUsers] = useState<User[]>(currentProject?.members || []);
  const [availableRabItems] = useState<RabItem[]>(currentProject?.items || []);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Judul task wajib diisi';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Judul task minimal 3 karakter';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Judul task maksimal 100 karakter';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Deskripsi task wajib diisi';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Deskripsi minimal 10 karakter';
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Deskripsi maksimal 1000 karakter';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Tanggal deadline wajib diisi';
    } else {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        newErrors.dueDate = 'Tanggal deadline tidak boleh di masa lalu';
      }
    }

    if (formData.assignedTo.length === 0) {
      newErrors.assignedTo = 'Minimal satu user harus ditugaskan';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        dependencies: [],
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
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-night-black mb-1">Judul Task *</label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
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
