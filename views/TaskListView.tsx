import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Button } from '../components/Button';
import { Input, Select } from '../components/FormControls';
import { Task } from '../types';
import { taskService } from '../api/taskService';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskDetailModal from '../components/TaskDetailModal';
import { 
    PlusCircle, Search, Calendar, User as UserIcon, 
    Tag, CheckCircle
} from 'lucide-react';
import { formatDate } from '../constants';

interface TaskListViewProps {
    projectId: string;
}

export default function TaskListView({ projectId }: TaskListViewProps) {
    const { currentUser } = useAuth();
    const { currentProject } = useProject();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<Task['status'] | 'all'>('all');
    const [filterPriority, setFilterPriority] = useState<Task['priority'] | 'all'>('all');
    const [filterAssignee, setFilterAssignee] = useState<string>('all');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);

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

    // Filtered tasks
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            // Search filter
            if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase()) 
                && !task.description.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }

            // Status filter
            if (filterStatus !== 'all' && task.status !== filterStatus) {
                return false;
            }

            // Priority filter
            if (filterPriority !== 'all' && task.priority !== filterPriority) {
                return false;
            }

            // Assignee filter
            if (filterAssignee !== 'all' && !task.assignedTo.includes(filterAssignee)) {
                return false;
            }

            return true;
        });
    }, [tasks, searchTerm, filterStatus, filterPriority, filterAssignee]);

    // Task statistics
    const stats = useMemo(() => {
        return {
            total: tasks.length,
            todo: tasks.filter(t => t.status === 'todo').length,
            inProgress: tasks.filter(t => t.status === 'in-progress').length,
            done: tasks.filter(t => t.status === 'done').length,
            blocked: tasks.filter(t => t.status === 'blocked').length,
        };
    }, [tasks]);

    const getStatusColor = (status: Task['status']) => {
        switch (status) {
            case 'todo': return 'bg-gray-100 text-gray-800';
            case 'in-progress': return 'bg-blue-100 text-blue-800';
            case 'done': return 'bg-green-100 text-green-800';
            case 'blocked': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: Task['priority']) => {
        switch (priority) {
            case 'low': return 'bg-gray-100 text-gray-600';
            case 'medium': return 'bg-yellow-100 text-yellow-700';
            case 'high': return 'bg-orange-100 text-orange-700';
            case 'critical': return 'bg-red-100 text-red-700';
        }
    };

    const isOverdue = (dueDate: string) => {
        return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
    };

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setShowDetailModal(true);
    };

    const handleTaskCreated = (newTask: Task) => {
        setTasks(prev => [newTask, ...prev]);
    };

    const handleTaskUpdated = (updatedTask: Task) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    };

    const handleTaskDeleted = (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        setShowDetailModal(false);
        setSelectedTask(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Memuat tasks...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-palladium">Total Tasks</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-palladium">To Do</p>
                        <p className="text-2xl font-bold text-gray-600">{stats.todo}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-palladium">In Progress</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-palladium">Done</p>
                        <p className="text-2xl font-bold text-green-600">{stats.done}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-palladium">Blocked</p>
                        <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Task List Card */}
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle>Daftar Task</CardTitle>
                        <CardDescription>Kelola semua task proyek Anda</CardDescription>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)}>
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Buat Task Baru
                    </Button>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 mb-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-palladium" />
                                <Input
                                    type="text"
                                    placeholder="Cari task..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
                            <option value="all">Semua Status</option>
                            <option value="todo">To Do</option>
                            <option value="in-progress">In Progress</option>
                            <option value="done">Done</option>
                            <option value="blocked">Blocked</option>
                        </Select>
                        <Select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as any)}>
                            <option value="all">Semua Prioritas</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </Select>
                        {currentProject && (
                            <Select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
                                <option value="all">Semua Assignee</option>
                                <option value={currentUser?.id || ''}>Saya</option>
                                {currentProject.members.map(member => (
                                    <option key={member.id} value={member.id}>{member.name}</option>
                                ))}
                            </Select>
                        )}
                    </div>

                    {/* Task List */}
                    <div className="space-y-3">
                        {filteredTasks.length === 0 ? (
                            <div className="text-center py-12 text-palladium">
                                <p>Tidak ada task yang sesuai dengan filter.</p>
                            </div>
                        ) : (
                            filteredTasks.map(task => (
                                <div
                                    key={task.id}
                                    className="border border-violet-essence rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => handleTaskClick(task)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-lg">{task.title}</h3>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                                                    {task.status}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                            <p className="text-sm text-palladium mb-3">{task.description}</p>
                                            
                                            <div className="flex items-center gap-4 text-xs text-palladium">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span className={isOverdue(task.dueDate) ? 'text-red-600 font-semibold' : ''}>
                                                        {formatDate(task.dueDate)}
                                                        {isOverdue(task.dueDate) && ' (Overdue)'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <UserIcon className="w-3 h-3" />
                                                    <span>{task.assignedTo.length} assignee(s)</span>
                                                </div>
                                                {task.tags.length > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <Tag className="w-3 h-3" />
                                                        <span>{task.tags.join(', ')}</span>
                                                    </div>
                                                )}
                                                {task.subtasks.length > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" />
                                                        <span>
                                                            {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtasks
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="text-right">
                                                <div className="text-xs text-palladium mb-1">Progress</div>
                                                <div className="text-2xl font-bold">{task.progress}%</div>
                                            </div>
                                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-persimmon transition-all"
                                                    style={{ width: `${task.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

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
