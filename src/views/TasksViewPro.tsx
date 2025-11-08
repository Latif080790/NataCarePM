/**
 * TasksViewPro - Professional Tasks Management View
 * 
 * Enterprise-grade task management with consistent design system.
 * Uses EnterpriseLayout, TablePro, and all design system components.
 */

import React, { useState, useMemo } from 'react';
import {
  EnterpriseLayout,
  SectionLayout,
  StatCardPro,
  StatCardGrid,
  TablePro,
  ColumnDef,
  ButtonPro,
  BadgePro,
  ModalPro,
  AlertPro,
  EmptyState,
  LoadingState,
} from '@/components/DesignSystem';
import { Task, User } from '@/types';
import {
  Plus,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Target,
  Zap,
  Flag,
  Edit3,
  Trash2,
  Eye,
  FileText,
} from 'lucide-react';

interface TasksViewProProps {
  tasks: Task[];
  users: User[];
  onCreateTask?: (task: Omit<Task, 'id'>) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask?: (taskId: string) => void;
  isLoading?: boolean;
}

export const TasksViewPro: React.FC<TasksViewProProps> = ({
  tasks = [],
  users = [],
  onDeleteTask,
  isLoading = false,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      done: { variant: 'success' as const, label: 'Completed' },
      'in-progress': { variant: 'primary' as const, label: 'In Progress' },
      todo: { variant: 'default' as const, label: 'To Do' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: 'default' as const,
      label: status,
    };

    return <BadgePro variant={config.variant}>{config.label}</BadgePro>;
  };

  // Priority badge helper
  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { variant: 'error' as const, icon: Flag },
      medium: { variant: 'warning' as const, icon: AlertTriangle },
      low: { variant: 'success' as const, icon: Target },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || {
      variant: 'default' as const,
      icon: Flag,
    };

    return (
      <BadgePro variant={config.variant} icon={config.icon} size="sm">
        {priority}
      </BadgePro>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Table columns definition
  const columns: ColumnDef<Task>[] = [
    {
      key: 'title',
      header: 'Task',
      sortable: true,
      render: (task) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-gray-900">{task.title}</span>
          {task.description && (
            <span className="text-sm text-gray-500 truncate max-w-md">
              {task.description}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      align: 'center',
      render: (task) => getStatusBadge(task.status),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      align: 'center',
      render: (task) => getPriorityBadge(task.priority),
    },
    {
      key: 'assignedTo',
      header: 'Assignee',
      render: (task) => {
        const assignee = users.find((u) => u.id === (Array.isArray(task.assignedTo) ? task.assignedTo[0] : task.assignedTo));
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-semibold">
              {assignee?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm text-gray-700">
              {assignee?.name || 'Unassigned'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: (task) =>
        task.dueDate ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(task.dueDate)}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">No due date</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (task) => (
        <div className="flex items-center justify-end gap-2">
          <ButtonPro
            variant="ghost"
            size="sm"
            icon={Eye}
            onClick={() => setSelectedTask(task)}
          />
          <ButtonPro
            variant="ghost"
            size="sm"
            icon={Edit3}
            onClick={() => {
              /* Edit handler */
            }}
          />
          <ButtonPro
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => onDeleteTask?.(task.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <EnterpriseLayout
      title="Task Management"
      subtitle="Manage and track all project tasks efficiently"
      breadcrumbs={[
        { label: 'Projects', href: '/' },
        { label: 'Tasks' },
      ]}
      actions={
        <ButtonPro variant="primary" icon={Plus} onClick={() => setIsCreateModalOpen(true)}>
          New Task
        </ButtonPro>
      }
    >
      {/* Key Metrics Section */}
      <SectionLayout title="Overview" className="mb-8">
        <StatCardGrid>
          <StatCardPro
            title="Total Tasks"
            value={taskAnalytics.total}
            icon={Target}
            variant="primary"
            description="All tasks"
          />
          <StatCardPro
            title="Completed"
            value={taskAnalytics.completed}
            icon={CheckCircle}
            variant="success"
            trend={{
              value: taskAnalytics.completionRate,
              label: 'completion rate',
            }}
          />
          <StatCardPro
            title="In Progress"
            value={taskAnalytics.inProgress}
            icon={Zap}
            variant="primary"
            description="Active tasks"
          />
          <StatCardPro
            title="Overdue"
            value={taskAnalytics.overdue}
            icon={AlertTriangle}
            variant={taskAnalytics.overdue > 0 ? 'warning' : 'default'}
            description="Requires attention"
          />
        </StatCardGrid>
      </SectionLayout>

      {/* Warning for overdue tasks */}
      {taskAnalytics.overdue > 0 && (
        <div className="mb-6">
          <AlertPro variant="warning" title="Overdue Tasks">
            You have {taskAnalytics.overdue} overdue task(s) that require immediate attention.
          </AlertPro>
        </div>
      )}

      {/* Tasks Table Section */}
      <SectionLayout title="All Tasks" description="View and manage all project tasks">
        {isLoading ? (
          <LoadingState message="Loading tasks..." />
        ) : (
          <TablePro
            data={tasks}
            columns={columns}
            searchable
            searchPlaceholder="Search tasks by title or description..."
            onRowClick={(task) => setSelectedTask(task)}
            hoverable
            stickyHeader
            emptyMessage="No tasks found. Create your first task to get started."
          />
        )}
      </SectionLayout>

      {/* Task Detail Modal */}
      {selectedTask && (
        <ModalPro
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title={selectedTask.title}
          size="lg"
          footer={
            <div className="flex gap-3 justify-end">
              <ButtonPro variant="outline" onClick={() => setSelectedTask(null)}>
                Close
              </ButtonPro>
              <ButtonPro variant="primary" icon={Edit3}>
                Edit Task
              </ButtonPro>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Task Details */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
              <p className="text-gray-600">{selectedTask.description || 'No description provided'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Status</h4>
                {getStatusBadge(selectedTask.status)}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Priority</h4>
                {getPriorityBadge(selectedTask.priority)}
              </div>
            </div>

            {selectedTask.dueDate && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Due Date</h4>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(selectedTask.dueDate)}</span>
                </div>
              </div>
            )}

            {selectedTask.assignedTo && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Assigned To</h4>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                    {users.find((u) => u.id === (Array.isArray(selectedTask.assignedTo) ? selectedTask.assignedTo[0] : selectedTask.assignedTo))?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-gray-700">
                    {users.find((u) => u.id === (Array.isArray(selectedTask.assignedTo) ? selectedTask.assignedTo[0] : selectedTask.assignedTo))?.name || 'Unknown User'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </ModalPro>
      )}

      {/* Create Task Modal Placeholder */}
      <ModalPro
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Task"
        size="lg"
      >
        <EmptyState
          icon={FileText}
          title="Task Creation Form"
          description="Task creation form will be implemented here with proper form validation."
        />
      </ModalPro>
    </EnterpriseLayout>
  );
};

export default TasksViewPro;
