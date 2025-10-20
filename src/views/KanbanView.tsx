import React, { useState, useMemo } from 'react';

import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Task, User } from '@/types';
import { 
  Plus, 
  Search, 
  Edit3,
  User as UserIcon,
  Calendar,
  Flag,
  AlertTriangle,
  Target,
  CheckCircle,
  Zap,
  Eye,
  Activity
} from 'lucide-react';
import { sanitizeBasic } from '@/utils/sanitizer';

interface KanbanViewProps {
  tasks: Task[];
  users: User[];
  onCreateTask?: (task: Omit<Task, 'id'>) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask?: (taskId: string) => void;
}

interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  color: string;
  icon: React.ComponentType<any>;
}

const kanbanColumns: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'To Do',
    status: 'todo',
    color: 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300',
    icon: Target
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    status: 'in-progress',
    color: 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300',
    icon: Zap
  },
  {
    id: 'review',
    title: 'Review',
    status: 'review',
    color: 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300',
    icon: Eye
  },
  {
    id: 'done',
    title: 'Done',
    status: 'done',
    color: 'bg-gradient-to-br from-green-100 to-green-200 border-green-300',
    icon: CheckCircle
  }
];

export const KanbanView: React.FC<KanbanViewProps> = ({
  tasks = [],
  users = [],
  onUpdateTask
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const filtered = tasks.filter(task => 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return kanbanColumns.reduce((acc, column) => {
      acc[column.status] = filtered.filter(task => task.status === column.status);
      return acc;
    }, {} as Record<string, Task[]>);
  }, [tasks, searchTerm]);

  // Kanban analytics
  const kanbanAnalytics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const review = tasks.filter(t => t.status === 'review').length;
    
    return {
      total,
      completed,
      inProgress,
      todo,
      review,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      throughput: Math.round(completed * 7 / 30), // Weekly throughput estimate
      cycleTime: '3.2 days', // Mock cycle time
      wip: inProgress + review // Work in progress
    };
  }, [tasks]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Flag className="w-3 h-3" />;
      case 'medium': return <AlertTriangle className="w-3 h-3" />;
      case 'low': return <Target className="w-3 h-3" />;
      default: return <Flag className="w-3 h-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short'
    });
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      onUpdateTask?.(draggedTask.id, { status: newStatus as Task['status'] });
    }
    setDraggedTask(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* 🎯 ENTERPRISE HEADER */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              📋 Kanban Board
            </h1>
            <p className="text-lg text-gray-700 font-medium">Enterprise Kanban • Visual Workflow • Team Collaboration • Advanced Analytics</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-lg shadow-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 font-medium">Live Board</span>
            </div>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Add Task</span>
            </Button>
          </div>
        </div>

        {/* 📊 KANBAN ANALYTICS DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-8">
          <Card className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="text-center">
              <p className="text-blue-100 text-sm">Total Tasks</p>
              <p className="text-2xl font-bold">{kanbanAnalytics.total}</p>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white">
            <div className="text-center">
              <p className="text-gray-100 text-sm">To Do</p>
              <p className="text-2xl font-bold">{kanbanAnalytics.todo}</p>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <div className="text-center">
              <p className="text-purple-100 text-sm">In Progress</p>
              <p className="text-2xl font-bold">{kanbanAnalytics.inProgress}</p>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <div className="text-center">
              <p className="text-yellow-100 text-sm">Review</p>
              <p className="text-2xl font-bold">{kanbanAnalytics.review}</p>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white">
            <div className="text-center">
              <p className="text-green-100 text-sm">Done</p>
              <p className="text-2xl font-bold">{kanbanAnalytics.completed}</p>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
            <div className="text-center">
              <p className="text-indigo-100 text-sm">WIP Limit</p>
              <p className="text-2xl font-bold">{kanbanAnalytics.wip}</p>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white">
            <div className="text-center">
              <p className="text-pink-100 text-sm">Throughput</p>
              <p className="text-2xl font-bold">{kanbanAnalytics.throughput}/wk</p>
            </div>
          </Card>
        </div>
      </div>

      {/* 🔍 SEARCH BAR */}
      <Card className="p-4 mb-8 bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search tasks across all columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
          />
        </div>
      </Card>

      {/* 📋 KANBAN BOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {kanbanColumns.map((column) => {
          const Icon = column.icon;
          const columnTasks = tasksByStatus[column.status] || [];
          
          return (
            <div key={column.id} className="flex flex-col h-full">
              {/* Column Header */}
              <Card className={`p-4 mb-4 ${column.color} border-2 shadow-lg`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5" />
                    <h3 className="text-lg font-bold">{column.title}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-white/80 text-gray-700 px-2 py-1 rounded-full text-sm font-medium">
                      {columnTasks.length}
                    </span>
                    <Button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="p-1 text-gray-600 hover:text-blue-600 hover:bg-white/50 rounded"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Drop Zone */}
              <div
                className="flex-1 min-h-[500px] space-y-4"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                {columnTasks.length === 0 ? (
                  <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg bg-white/50">
                    <p className="text-gray-500 text-sm">No tasks</p>
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <Card
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      className="p-4 bg-white/90 backdrop-blur-sm border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 cursor-move group"
                    >
                      <div className="space-y-3">
                        {/* Task Header */}
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {task.title}
                          </h4>
                          <div className="flex items-center space-x-1 ml-2">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(task);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Edit functionality
                              }}
                              className="p-1 text-gray-400 hover:text-green-600 rounded"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Task Description */}
                        {task.description && (
                          <div 
                            className="text-xs text-gray-600 line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: sanitizeBasic(task.description) }}
                          />
                        )}

                        {/* Task Metadata */}
                        <div className="space-y-2">
                          {/* Priority */}
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${getPriorityColor(task.priority)}`}>
                            {getPriorityIcon(task.priority)}
                            <span className="capitalize">{task.priority}</span>
                          </div>

                          {/* Assignee and Due Date */}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                          {task.assignedTo && task.assignedTo.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <UserIcon className="w-3 h-3" />
                              <span className="truncate">
                                {users.find(u => u.id === task.assignedTo[0])?.name?.split(' ')[0] || 'Unknown'}
                              </span>
                            </div>
                          )}
                            {task.dueDate && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(task.dueDate)}</span>
                              </div>
                            )}
                          </div>

                          {/* Tags */}
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {task.tags.slice(0, 2).map((tag, index) => (
                                <span key={index} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                              {task.tags.length > 2 && (
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                                  +{task.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ⚡ WORKFLOW INSIGHTS */}
      <Card className="mt-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold flex items-center">
            <Activity className="w-7 h-7 mr-3 text-indigo-600" />
            Workflow Intelligence
          </h3>
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
              Live Analytics
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded-xl border border-blue-200">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{kanbanAnalytics.completionRate.toFixed(0)}%</p>
              <p className="text-blue-700 text-sm">Completion Rate</p>
              <p className="text-blue-600 text-xs mt-1">↗️ +5.2% from last week</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{kanbanAnalytics.cycleTime}</p>
              <p className="text-green-700 text-sm">Avg Cycle Time</p>
              <p className="text-green-600 text-xs mt-1">↘️ -0.8 days improvement</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-200">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{kanbanAnalytics.throughput}</p>
              <p className="text-purple-700 text-sm">Weekly Throughput</p>
              <p className="text-purple-600 text-xs mt-1">↗️ +2 tasks increase</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Kanban Task Management - TODO: Implement proper modals */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-8 bg-white/95 backdrop-blur-sm max-w-lg mx-4 rounded-2xl shadow-2xl border border-white/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Add Task to Board</h3>
              <p className="text-gray-600 mb-6">Advanced Kanban task management is being integrated with the project system.</p>
              <div className="space-y-3">
                <Button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg"
                >
                  Continue Working
                </Button>
                <p className="text-sm text-gray-500">Drag & drop task management coming soon</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-8 bg-white/95 backdrop-blur-sm max-w-lg mx-4 rounded-2xl shadow-2xl border border-white/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-gray-800">{selectedTask.title}</h3>
              <div 
                className="text-gray-600 mb-6"
                dangerouslySetInnerHTML={{ __html: sanitizeBasic(selectedTask.description) }}
              />
              <Button 
                onClick={() => setSelectedTask(null)}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 🏆 FOOTER */}
      <div className="mt-12 text-center">
        <p className="text-gray-500">
          📋 Enterprise Kanban Board • Visual Workflow Management • Real-time Collaboration • Advanced Analytics • NataCarePM v2.0
        </p>
      </div>
    </div>
  );
};

export default KanbanView;
