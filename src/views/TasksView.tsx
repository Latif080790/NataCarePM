import React, { useState, useMemo } from 'react';

import { CardPro } from '@/components/CardPro';
import { ButtonPro } from '@/components/ButtonPro';
import { InputPro, SelectPro } from '@/components/FormComponents';
import { EmptyState } from '@/components/StateComponents';
import { Task, User } from '@/types';
import {
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  User as UserIcon,
  Calendar,
  Tag,
  Edit3,
  Trash2,
  Eye,
  Flag,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { sanitizeBasic } from '@/utils/sanitizer';

interface TasksViewProps {
  tasks: Task[];
  users: User[];
  onCreateTask?: (task: Omit<Task, 'id'>) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask?: (taskId: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ tasks = [], users = [], onDeleteTask }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Enhanced task filtering and search
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  // Task analytics
  const taskAnalytics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
    const pending = tasks.filter((t) => t.status === 'todo').length;
    const overdue = tasks.filter((t) => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < new Date() && t.status !== 'done';
    }).length;

    return {
      total,
      completed,
      inProgress,
      pending,
      overdue,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }, [tasks]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'text-green-600 bg-green-100';
      case 'in-progress':
        return 'text-blue-600 bg-blue-100';
      case 'todo':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Flag className="w-4 h-4" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4" />;
      case 'low':
        return <Target className="w-4 h-4" />;
      default:
        return <Flag className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Task Management Center
            </h1>
            <p className="text-lg text-gray-600">
              Enterprise Task Tracking • Team Collaboration • Performance Insights
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 font-medium">Live Updates</span>
            </div>
            <ButtonPro
              variant="primary"
              icon={Plus}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create New Task
            </ButtonPro>
          </div>
        </div>

        {/* Task Analytics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <CardPro className="p-4 bg-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Tasks</p>
                <p className="text-3xl font-bold">{taskAnalytics.total}</p>
              </div>
              <Target className="w-8 h-8 text-blue-200" />
            </div>
          </CardPro>

          <CardPro className="p-4 bg-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Completed</p>
                <p className="text-3xl font-bold">{taskAnalytics.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </CardPro>

          <CardPro className="p-4 bg-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">In Progress</p>
                <p className="text-3xl font-bold">{taskAnalytics.inProgress}</p>
              </div>
              <Zap className="w-8 h-8 text-purple-200" />
            </div>
          </CardPro>

          <CardPro className="p-4 bg-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Pending</p>
                <p className="text-3xl font-bold">{taskAnalytics.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-200" />
            </div>
          </CardPro>

          <CardPro className="p-4 bg-red-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Overdue</p>
                <p className="text-3xl font-bold">{taskAnalytics.overdue}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-200" />
            </div>
          </CardPro>

          <CardPro className="p-4 bg-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm">Completion</p>
                <p className="text-3xl font-bold">{taskAnalytics.completionRate.toFixed(0)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-indigo-200" />
            </div>
          </CardPro>
        </div>
      </div>

      {/* Search and Filters */}
      <CardPro className="p-6 mb-8" variant="elevated">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <InputPro
                type="text"
                placeholder="Search tasks by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <SelectPro
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'todo', label: 'To Do' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'done', label: 'Done' },
              ]}
            />

            <SelectPro
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Priority' },
                { value: 'high', label: 'High Priority' },
                { value: 'medium', label: 'Medium Priority' },
                { value: 'low', label: 'Low Priority' },
              ]}
            />
          </div>
        </div>
      </CardPro>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <EmptyState
            title="No tasks found"
            description={
              searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first task to get started'
            }
            icon={Target}
          />
        ) : (
          filteredTasks.map((task) => (
            <CardPro
              key={task.id}
              hoverable
              className="p-6 cursor-pointer"
              onClick={() => setSelectedTask(task)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {task.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                    >
                      {task.status.replace('-', ' ').toUpperCase()}
                    </span>
                    <div
                      className={`flex items-center space-x-1 ${getPriorityColor(task.priority)}`}
                    >
                      {getPriorityIcon(task.priority)}
                      <span className="text-sm font-medium capitalize">{task.priority}</span>
                    </div>
                  </div>

                  {task.description && (
                    <div
                      className="text-gray-600 mb-4 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: sanitizeBasic(task.description) }}
                    />
                  )}

                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    {task.assignedTo && task.assignedTo.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <UserIcon className="w-4 h-4" />
                        <span>
                          {users.find((u) => u.id === task.assignedTo[0])?.name || 'Unknown'}
                        </span>
                      </div>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(task.dueDate)}</span>
                      </div>
                    )}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Tag className="w-4 h-4" />
                        <span>{task.tags.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setSelectedTask(task);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      // Edit functionality
                    }}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (window.confirm('Apakah Anda yakin ingin menghapus task ini?')) {
                        onDeleteTask?.(task.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardPro>
          ))
        )}
      </div>

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <CardPro className="p-8 max-w-lg mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Create New Task</h3>
              <p className="text-gray-600 mb-6">
                Task management system is being integrated with Firebase backend.
              </p>
              <div className="space-y-3">
                <ButtonPro
                  variant="primary"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-full"
                >
                  Continue Working
                </ButtonPro>
                <p className="text-sm text-gray-500">Full task management will be available soon</p>
              </div>
            </div>
          </CardPro>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <CardPro className="p-8 max-w-lg mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-gray-800">{selectedTask.title}</h3>
              <div
                className="text-gray-600 mb-6"
                dangerouslySetInnerHTML={{ __html: sanitizeBasic(selectedTask.description) }}
              />
              <ButtonPro
                variant="primary"
                onClick={() => setSelectedTask(null)}
                className="w-full"
              >
                Close
              </ButtonPro>
            </div>
          </CardPro>
        </div>
      )}

      {/* 🏆 FOOTER */}
      <div className="mt-12 text-center">
        <p className="text-gray-500">
          🎯 Enterprise Task Management • AI-Powered Analytics • Real-time Collaboration • Strategic
          Planning • NataCarePM v2.0
        </p>
      </div>
    </div>
  );
};

export default TasksView;

