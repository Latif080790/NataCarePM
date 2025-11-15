import React, { useState, useEffect, useMemo } from 'react';

import { Button } from '@/components/Button';
import { Task } from '@/types';
import { taskService } from '@/api/taskService';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { useToast } from '@/contexts/ToastContext';
import TaskDetailModal from '@/components/TaskDetailModal';
import CreateTaskModal from '@/components/CreateTaskModal';
import { Plus, Users, Calendar, Tag, Clock, AlertCircle, CheckCircle, Ban } from 'lucide-react';
import { formatDate } from '@/constants';

interface KanbanBoardViewProps {
  projectId: string;
}

interface Column {
  id: Task['status'];
  title: string;
  color: string;
  icon: React.ReactNode;
}

const columns: Column[] = [
  {
    id: 'todo',
    title: 'To Do',
    color: 'bg-gray-100 border-gray-300',
    icon: <Clock className="w-4 h-4 text-gray-500" />,
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    color: 'bg-blue-100 border-blue-300',
    icon: <AlertCircle className="w-4 h-4 text-blue-500" />,
  },
  {
    id: 'done',
    title: 'Done',
    color: 'bg-green-100 border-green-300',
    icon: <CheckCircle className="w-4 h-4 text-green-500" />,
  },
  {
    id: 'blocked',
    title: 'Blocked',
    color: 'bg-red-100 border-red-300',
    icon: <Ban className="w-4 h-4 text-red-500" />,
  },
];

export default function KanbanBoardView({ projectId }: KanbanBoardViewProps) {
  const { currentUser } = useAuth();
  const { currentProject } = useProject();
  const { addToast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Real-time task updates
  useEffect(() => {
    if (!projectId) return;

    setLoading(true);
    const unsubscribe = taskService.streamTasksByProject(projectId, (fetchedTasks) => {
      setTasks(fetchedTasks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<Task['status'], Task[]> = {
      todo: [],
      'in-progress': [],
      review: [],
      done: [],
      completed: [],
      blocked: [],
    };

    tasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    return grouped;
  }, [tasks]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setShowDetailModal(false);
    setSelectedTask(null);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: Task['status']) => {
    e.preventDefault();

    if (!draggedTask || !currentUser || !currentProject) return;

    if (draggedTask.status === newStatus) return; // No change needed

    try {
      await taskService.updateTask(
        currentProject.id,
        draggedTask.id,
        { status: newStatus },
        currentUser
      );

      addToast(`Task moved to ${newStatus}`, 'success');
    } catch (error: any) {
      console.error('Error updating task status:', error);
      addToast(`Failed to move task: ${error.message}`, 'error');
    }

    setDraggedTask(null);
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'low':
        return 'border-l-gray-400';
      case 'medium':
        return 'border-l-yellow-400';
      case 'high':
        return 'border-l-orange-400';
      case 'critical':
        return 'border-l-red-400';
    }
  };

  const isOverdue = (dueDate: string) => {
    return (
      new Date(dueDate) < new Date() &&
      new Date(dueDate).toDateString() !== new Date().toDateString()
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Memuat kanban board...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-night-black">Kanban Board</h1>
          <p className="text-palladium">Drag dan drop untuk memindahkan task antar status</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Buat Task Baru
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-hidden">
        {columns.map((column) => (
          <div
            key={column.id}
            className={`flex flex-col border-2 border-dashed rounded-lg p-4 ${column.color} transition-colors`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {column.icon}
                <h3 className="font-semibold">{column.title}</h3>
              </div>
              <span className="bg-white px-2 py-1 rounded-full text-xs font-semibold">
                {tasksByStatus[column.id].length}
              </span>
            </div>

            {/* Tasks */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-250px)]">
              {tasksByStatus[column.id].map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleTaskClick(task)}
                  className={`
                                        bg-white rounded-lg p-3 shadow-sm border-l-4 cursor-pointer
                                        hover:shadow-md transition-shadow duration-200
                                        ${getPriorityColor(task.priority)}
                                        ${draggedTask?.id === task.id ? 'opacity-50' : ''}
                                        ${isOverdue(task.dueDate) && task.status !== 'done' ? 'ring-2 ring-red-300' : ''}
                                    `}
                >
                  {/* Task Title */}
                  <h4 className="font-medium text-sm mb-2 line-clamp-2">{task.title}</h4>

                  {/* Task Info */}
                  <div className="space-y-2 text-xs text-palladium">
                    {/* Due Date */}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span
                        className={
                          isOverdue(task.dueDate) && task.status !== 'done'
                            ? 'text-red-600 font-semibold'
                            : ''
                        }
                      >
                        {formatDate(task.dueDate)}
                        {isOverdue(task.dueDate) && task.status !== 'done' && ' (Overdue)'}
                      </span>
                    </div>

                    {/* Assignees */}
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{task.assignedTo.length} assignee(s)</span>
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-persimmon h-1 rounded-full transition-all"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold">{task.progress}%</span>
                    </div>

                    {/* Subtasks */}
                    {task.subtasks.length > 0 && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>
                          {task.subtasks.filter((st) => st.completed).length}/{task.subtasks.length}{' '}
                          subtasks
                        </span>
                      </div>
                    )}

                    {/* Tags */}
                    {task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {task.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-1 py-0.5 bg-violet-essence text-night-black text-xs rounded"
                          >
                            <Tag className="w-2 h-2 mr-1" />
                            {tag}
                          </span>
                        ))}
                        {task.tags.length > 2 && (
                          <span className="text-xs text-palladium">
                            +{task.tags.length - 2} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Priority Indicator */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`
                                                px-1 py-0.5 rounded text-xs font-semibold
                                                ${task.priority === 'low' && 'bg-gray-100 text-gray-600'}
                                                ${task.priority === 'medium' && 'bg-yellow-100 text-yellow-700'}
                                                ${task.priority === 'high' && 'bg-orange-100 text-orange-700'}
                                                ${task.priority === 'critical' && 'bg-red-100 text-red-700'}
                                            `}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {tasksByStatus[column.id].length === 0 && (
                <div className="text-center py-8 text-palladium">
                  <p className="text-sm">Tidak ada task</p>
                  <p className="text-xs">Drag task ke sini atau buat task baru</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTask && showDetailModal && (
        <TaskDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />
      )}
    </div>
  );
}

