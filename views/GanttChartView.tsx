import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Task } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/FormControls';
import { taskService } from '../api/taskService';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import TaskDetailModal from '../components/TaskDetailModal';
import CreateTaskModal from '../components/CreateTaskModal';
import { 
    Calendar, Plus, Filter, Search, Download, ZoomIn, ZoomOut, 
    RefreshCw, Settings, Eye, EyeOff, AlertTriangle, CheckCircle,
    ArrowRight, Clock, Target, Users, BarChart3, TrendingUp
} from 'lucide-react';
import { formatDate } from '../constants';

interface GanttChartViewProps {
    projectId?: string;
}

interface GanttTask {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    duration: number; // in days
    progress: number; // 0-100
    dependencies: string[];
    assignedTo: string[];
    priority: Task['priority'];
    status: Task['status'];
    isOnCriticalPath: boolean;
    level: number; // For dependency hierarchy
}

interface GanttSettings {
    timeScale: 'day' | 'week' | 'month';
    showWeekends: boolean;
    showCriticalPath: boolean;
    showDependencies: boolean;
    showProgress: boolean;
    autoSchedule: boolean;
}

const defaultSettings: GanttSettings = {
    timeScale: 'day',
    showWeekends: true,
    showCriticalPath: true,
    showDependencies: true,
    showProgress: true,
    autoSchedule: false
};

const statusColors = {
    'todo': '#6b7280',
    'in-progress': '#3b82f6', 
    'done': '#10b981',
    'blocked': '#ef4444'
};

const priorityColors = {
    'low': '#9ca3af',
    'medium': '#f59e0b',
    'high': '#f97316', 
    'critical': '#dc2626'
};

export default function GanttChartView({ projectId }: GanttChartViewProps) {
    const { currentUser } = useAuth();
    const { currentProject } = useProject();
    const { addToast } = useToast();
    
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<GanttSettings>(defaultSettings);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [draggedTask, setDraggedTask] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    
    const ganttRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);

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

    // Calculate project timeline and critical path
    const ganttData = useMemo(() => {
        if (tasks.length === 0) return { ganttTasks: [], projectStart: new Date(), projectEnd: new Date(), criticalPath: [] };
        
        // Convert tasks to gantt format
        const taskMap = new Map(tasks.map(task => [task.id, task]));
        const projectStart = new Date(Math.min(...tasks.map(t => new Date(t.dueDate).getTime() - 7 * 24 * 60 * 60 * 1000)));
        
        // Calculate task scheduling with dependencies
        const ganttTasks: GanttTask[] = [];
        const scheduled = new Set<string>();
        
        const scheduleTask = (task: Task): GanttTask => {
            if (scheduled.has(task.id)) {
                return ganttTasks.find(gt => gt.id === task.id)!;
            }
            
            let taskStart = new Date(projectStart);
            
            // Handle dependencies
            if (task.dependencies?.length > 0) {
                let latestEnd = new Date(projectStart);
                task.dependencies.forEach(depId => {
                    const depTask = taskMap.get(depId) as Task;
                    if (depTask) {
                        const depGantt = scheduleTask(depTask);
                        if (depGantt.endDate > latestEnd) {
                            latestEnd = new Date(depGantt.endDate);
                        }
                    }
                });
                taskStart = new Date(latestEnd.getTime() + 24 * 60 * 60 * 1000); // Next day
            }
            
            const daysUntilDue = Math.max(1, Math.ceil((new Date(task.dueDate).getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)));
            const taskEnd = new Date(taskStart.getTime() + daysUntilDue * 24 * 60 * 60 * 1000);
            
            const ganttTask: GanttTask = {
                id: task.id,
                title: task.title,
                startDate: taskStart,
                endDate: taskEnd,
                duration: daysUntilDue,
                progress: task.progress,
                dependencies: task.dependencies || [],
                assignedTo: task.assignedTo,
                priority: task.priority,
                status: task.status,
                isOnCriticalPath: false, // Will be calculated later
                level: 0
            };
            
            ganttTasks.push(ganttTask);
            scheduled.add(task.id);
            return ganttTask;
        };
        
        // Schedule all tasks
        tasks.forEach(scheduleTask);
        
        // Calculate critical path using simple algorithm
        const criticalPath = calculateCriticalPath(ganttTasks);
        ganttTasks.forEach(gt => {
            gt.isOnCriticalPath = criticalPath.includes(gt.id);
        });
        
        const projectEnd = new Date(Math.max(...ganttTasks.map(gt => gt.endDate.getTime())));
        
        return { ganttTasks, projectStart, projectEnd, criticalPath };
    }, [tasks, settings.autoSchedule]);

    // Simple critical path calculation
    const calculateCriticalPath = (ganttTasks: GanttTask[]): string[] => {
        // Find the longest path through the network
        const taskMap = new Map(ganttTasks.map(gt => [gt.id, gt]));
        
        // Find tasks with no successors (end tasks)
        const endTasks = ganttTasks.filter(gt => 
            !ganttTasks.some(other => other.dependencies.includes(gt.id))
        );
        
        if (endTasks.length === 0) return [];
        
        // Find the end task with the latest finish
        const latestEndTask = endTasks.reduce((latest, current) => 
            current.endDate > latest.endDate ? current : latest
        );
        
        // Trace back through dependencies to find critical path
        const tracePath = (taskId: string, visited = new Set<string>()): string[] => {
            if (visited.has(taskId)) return [];
            visited.add(taskId);
            
            const task = taskMap.get(taskId);
            if (!task || task.dependencies.length === 0) return [taskId];
            
            // Find the dependency with the latest finish that leads to this task
            let criticalDep = '';
            let latestFinish = new Date(0);
            
            task.dependencies.forEach(depId => {
                const depTask = taskMap.get(depId);
                if (depTask && depTask.endDate > latestFinish) {
                    latestFinish = depTask.endDate;
                    criticalDep = depId;
                }
            });
            
            if (criticalDep) {
                return [...tracePath(criticalDep, visited), taskId];
            }
            return [taskId];
        };
        
        return tracePath(latestEndTask.id);
    };

    // Filter tasks based on search and settings
    const filteredTasks = useMemo(() => {
        return ganttData.ganttTasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [ganttData.ganttTasks, searchTerm]);

    // Generate timeline headers
    const timelineHeaders = useMemo(() => {
        const { projectStart, projectEnd } = ganttData;
        const headers: { date: Date; label: string; isWeekend?: boolean }[] = [];
        
        const current = new Date(projectStart);
        const scale = settings.timeScale;
        
        while (current <= projectEnd) {
            const isWeekend = current.getDay() === 0 || current.getDay() === 6;
            
            if (scale === 'day') {
                headers.push({
                    date: new Date(current),
                    label: current.getDate().toString(),
                    isWeekend
                });
                current.setDate(current.getDate() + 1);
            } else if (scale === 'week') {
                headers.push({
                    date: new Date(current),
                    label: `W${Math.ceil(current.getDate() / 7)}`
                });
                current.setDate(current.getDate() + 7);
            } else {
                headers.push({
                    date: new Date(current),
                    label: current.toLocaleDateString('id', { month: 'short' })
                });
                current.setMonth(current.getMonth() + 1);
            }
        }
        
        return headers;
    }, [ganttData.projectStart, ganttData.projectEnd, settings.timeScale]);

    // Drag and drop handlers
    const handleTaskMouseDown = useCallback((e: React.MouseEvent, taskId: string) => {
        if (e.button !== 0) return; // Only left click
        
        e.preventDefault();
        setDraggedTask(taskId);
        
        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!draggedTask || !timelineRef.current) return;
        
        const timelineRect = timelineRef.current.getBoundingClientRect();
        const dayWidth = timelineRect.width / timelineHeaders.length;
        const newDayIndex = Math.floor((e.clientX - timelineRect.left - dragOffset.x) / dayWidth);
        
        // Update task position visually (you'd implement this with state)
        console.log(`Moving task ${draggedTask} to day ${newDayIndex}`);
    }, [draggedTask, dragOffset, timelineHeaders.length]);

    const handleMouseUp = useCallback(async (e: MouseEvent) => {
        if (!draggedTask || !timelineRef.current || !currentUser || !projectId) return;
        
        const timelineRect = timelineRef.current.getBoundingClientRect();
        const dayWidth = timelineRect.width / timelineHeaders.length;
        const newDayIndex = Math.floor((e.clientX - timelineRect.left - dragOffset.x) / dayWidth);
        
        if (newDayIndex >= 0 && newDayIndex < timelineHeaders.length) {
            const newDate = timelineHeaders[newDayIndex].date;
            
            try {
                await taskService.updateTask(projectId, draggedTask, {
                    dueDate: newDate.toISOString().split('T')[0]
                }, currentUser);
                
                addToast('Task berhasil dipindahkan', 'success');
            } catch (error: any) {
                addToast(`Error: ${error.message}`, 'error');
            }
        }
        
        setDraggedTask(null);
        setDragOffset({ x: 0, y: 0 });
    }, [draggedTask, dragOffset, timelineHeaders, projectId, currentUser, addToast]);

    // Mouse event listeners
    useEffect(() => {
        if (draggedTask) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [draggedTask, handleMouseMove, handleMouseUp]);

    const handleTaskClick = (task: GanttTask) => {
        const fullTask = tasks.find(t => t.id === task.id);
        if (fullTask) {
            setSelectedTask(fullTask);
            setShowDetailModal(true);
        }
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

    const exportGantt = () => {
        const exportData = {
            project: currentProject?.name,
            exportDate: new Date().toISOString(),
            tasks: filteredTasks.map(task => ({
                title: task.title,
                startDate: task.startDate.toISOString(),
                endDate: task.endDate.toISOString(),
                duration: task.duration,
                progress: task.progress,
                status: task.status,
                priority: task.priority,
                isOnCriticalPath: task.isOnCriticalPath
            })),
            criticalPath: ganttData.criticalPath
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gantt-chart-${currentProject?.name}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        addToast('Gantt chart exported successfully', 'success');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Memuat gantt chart...</p>
            </div>
        );
    }

    if (!projectId) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Silakan pilih proyek untuk melihat Gantt Chart</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-night-black">Interactive Gantt Chart</h1>
                    <p className="text-palladium">Timeline proyek dengan drag & drop dan analisis critical path</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setZoom(prev => Math.min(prev * 1.2, 3))}>
                        <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setZoom(prev => Math.max(prev / 1.2, 0.5))}>
                        <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={exportGantt}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                    </Button>
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Buat Task
                    </Button>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-palladium">Total Tasks</p>
                                <p className="text-2xl font-bold">{filteredTasks.length}</p>
                            </div>
                            <Target className="w-8 h-8 text-violet-essence" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-palladium">Critical Path</p>
                                <p className="text-2xl font-bold text-red-600">{ganttData.criticalPath.length}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-palladium">Project Duration</p>
                                <p className="text-2xl font-bold">
                                    {Math.ceil((ganttData.projectEnd.getTime() - ganttData.projectStart.getTime()) / (1000 * 60 * 60 * 24))} days
                                </p>
                            </div>
                            <Clock className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-palladium">Avg Progress</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {Math.round(filteredTasks.reduce((sum, t) => sum + t.progress, 0) / (filteredTasks.length || 1))}%
                                </p>
                            </div>
                            <BarChart3 className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Settings */}
            <div className="flex items-center gap-4 mb-6">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-palladium w-4 h-4" />
                        <Input
                            placeholder="Cari task..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <select
                        value={settings.timeScale}
                        onChange={(e) => setSettings(prev => ({ ...prev, timeScale: e.target.value as any }))}
                        className="px-3 py-2 border rounded-lg"
                    >
                        <option value="day">Day</option>
                        <option value="week">Week</option>
                        <option value="month">Month</option>
                    </select>
                </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Gantt Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={settings.showWeekends}
                                    onChange={(e) => setSettings(prev => ({ ...prev, showWeekends: e.target.checked }))}
                                    className="rounded"
                                />
                                <span className="text-sm">Show Weekends</span>
                            </label>
                            
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={settings.showCriticalPath}
                                    onChange={(e) => setSettings(prev => ({ ...prev, showCriticalPath: e.target.checked }))}
                                    className="rounded"
                                />
                                <span className="text-sm">Highlight Critical Path</span>
                            </label>
                            
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={settings.showDependencies}
                                    onChange={(e) => setSettings(prev => ({ ...prev, showDependencies: e.target.checked }))}
                                    className="rounded"
                                />
                                <span className="text-sm">Show Dependencies</span>
                            </label>
                            
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={settings.showProgress}
                                    onChange={(e) => setSettings(prev => ({ ...prev, showProgress: e.target.checked }))}
                                    className="rounded"
                                />
                                <span className="text-sm">Show Progress</span>
                            </label>
                            
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={settings.autoSchedule}
                                    onChange={(e) => setSettings(prev => ({ ...prev, autoSchedule: e.target.checked }))}
                                    className="rounded"
                                />
                                <span className="text-sm">Auto Schedule</span>
                            </label>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Gantt Chart */}
            <Card className="flex-1">
                <CardContent className="p-0 h-full">
                    <div ref={ganttRef} className="h-full overflow-auto" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                        <div className="min-w-[1200px]">
                            {/* Timeline Header */}
                            <div className="sticky top-0 z-10 bg-white border-b">
                                <div className="grid grid-cols-[300px,1fr]">
                                    <div className="p-3 border-r bg-gray-50 font-semibold">Task</div>
                                    <div 
                                        ref={timelineRef}
                                        className="grid border-r bg-gray-50"
                                        style={{ 
                                            gridTemplateColumns: `repeat(${timelineHeaders.length}, minmax(40px, 1fr))` 
                                        }}
                                    >
                                        {timelineHeaders.map((header, index) => (
                                            <div 
                                                key={index}
                                                className={`p-2 text-center text-xs border-r ${
                                                    header.isWeekend && !settings.showWeekends ? 'hidden' : ''
                                                } ${header.isWeekend ? 'bg-gray-100' : ''}`}
                                            >
                                                {header.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Task Rows */}
                            <div className="divide-y">
                                {filteredTasks.map((task, taskIndex) => {
                                    const startIndex = timelineHeaders.findIndex(h => 
                                        h.date.toDateString() === task.startDate.toDateString()
                                    );
                                    const endIndex = timelineHeaders.findIndex(h => 
                                        h.date.toDateString() === task.endDate.toDateString()
                                    );
                                    
                                    return (
                                        <div key={task.id} className="grid grid-cols-[300px,1fr] hover:bg-gray-50">
                                            {/* Task Info */}
                                            <div className="p-3 border-r flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${
                                                    task.isOnCriticalPath && settings.showCriticalPath ? 'bg-red-500' : 
                                                    statusColors[task.status]
                                                }`}></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{task.title}</p>
                                                    <div className="flex items-center gap-2 text-xs text-palladium">
                                                        <Users className="w-3 h-3" />
                                                        <span>{task.assignedTo.length}</span>
                                                        <span className={`px-1 py-0.5 rounded text-xs font-semibold ${
                                                            task.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                                            task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                            {task.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Timeline */}
                                            <div 
                                                className="relative grid items-center"
                                                style={{ 
                                                    gridTemplateColumns: `repeat(${timelineHeaders.length}, minmax(40px, 1fr))` 
                                                }}
                                            >
                                                {/* Task Bar */}
                                                {startIndex >= 0 && endIndex >= 0 && (
                                                    <div
                                                        className={`
                                                            absolute h-6 rounded cursor-move transition-all hover:h-8
                                                            ${task.isOnCriticalPath && settings.showCriticalPath ? 
                                                                'bg-red-500 border-red-600' : 
                                                                'bg-persimmon border-persimmon-dark'
                                                            }
                                                            ${draggedTask === task.id ? 'opacity-50' : ''}
                                                        `}
                                                        style={{
                                                            left: `${(startIndex / timelineHeaders.length) * 100}%`,
                                                            width: `${((endIndex - startIndex + 1) / timelineHeaders.length) * 100}%`,
                                                            zIndex: draggedTask === task.id ? 20 : 10
                                                        }}
                                                        onMouseDown={(e) => handleTaskMouseDown(e, task.id)}
                                                        onClick={() => handleTaskClick(task)}
                                                        title={`${task.title} (${formatDate(task.startDate.toISOString())} - ${formatDate(task.endDate.toISOString())})`}
                                                    >
                                                        {/* Progress Bar */}
                                                        {settings.showProgress && (
                                                            <div 
                                                                className="h-full bg-white bg-opacity-30 rounded"
                                                                style={{ width: `${task.progress}%` }}
                                                            />
                                                        )}
                                                        
                                                        {/* Task Label */}
                                                        <div className="absolute inset-0 flex items-center px-2 text-white text-xs font-semibold truncate">
                                                            {task.progress}%
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Dependencies */}
                                                {settings.showDependencies && task.dependencies.map(depId => {
                                                    const depTask = filteredTasks.find(t => t.id === depId);
                                                    if (!depTask) return null;
                                                    
                                                    const depEndIndex = timelineHeaders.findIndex(h => 
                                                        h.date.toDateString() === depTask.endDate.toDateString()
                                                    );
                                                    
                                                    if (depEndIndex >= 0 && startIndex >= 0) {
                                                        return (
                                                            <div
                                                                key={depId}
                                                                className="absolute border-t-2 border-blue-400 pointer-events-none"
                                                                style={{
                                                                    left: `${(depEndIndex / timelineHeaders.length) * 100}%`,
                                                                    width: `${((startIndex - depEndIndex) / timelineHeaders.length) * 100}%`,
                                                                    top: '50%'
                                                                }}
                                                            >
                                                                <ArrowRight className="absolute right-0 w-3 h-3 text-blue-400 -mt-1.5" />
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
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
