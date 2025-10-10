import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { Task } from '../types';
import { taskService } from '../api/taskService';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import TaskDetailModal from '../components/TaskDetailModal';
import CreateTaskModal from '../components/CreateTaskModal';
import { 
    Plus, Settings, RefreshCw, ZoomIn, ZoomOut, Download, Eye, 
    ArrowRight, AlertCircle, CheckCircle, Clock, Ban, Target
} from 'lucide-react';
import { formatDate } from '../constants';

interface DependencyGraphViewProps {
    projectId: string;
}

interface TaskNode {
    id: string;
    task: Task;
    x: number;
    y: number;
    level: number;
    dependencies: string[];
}

interface Edge {
    from: string;
    to: string;
    type: 'dependency' | 'blocker';
}

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

export default function DependencyGraphView({ projectId }: DependencyGraphViewProps) {
    const { currentUser } = useAuth();
    const { currentProject } = useProject();
    const { addToast } = useToast();
    
    const svgRef = useRef<SVGSVGElement>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [nodes, setNodes] = useState<TaskNode[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [viewMode, setViewMode] = useState<'dependency' | 'timeline'>('dependency');

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

    // Build dependency graph
    useEffect(() => {
        if (tasks.length === 0) return;
        
        const graph = buildDependencyGraph(tasks);
        setNodes(graph.nodes);
        setEdges(graph.edges);
    }, [tasks, viewMode]);

    const buildDependencyGraph = (tasks: Task[]) => {
        const taskMap = new Map(tasks.map(task => [task.id, task]));
        const nodes: TaskNode[] = [];
        const edges: Edge[] = [];
        
        if (viewMode === 'dependency') {
            // Build dependency-based layout
            const visited = new Set<string>();
            const levels = new Map<string, number>();
            
            // Calculate levels using topological sort
            const calculateLevels = (taskId: string, level = 0): number => {
                if (visited.has(taskId)) return levels.get(taskId) || 0;
                
                visited.add(taskId);
                const task = taskMap.get(taskId);
                if (!task) return level;
                
                let maxLevel = level;
                task.dependencies.forEach(depId => {
                    const depLevel = calculateLevels(depId, level + 1);
                    maxLevel = Math.max(maxLevel, depLevel + 1);
                });
                
                levels.set(taskId, maxLevel);
                return maxLevel;
            };
            
            // Calculate levels for all tasks
            tasks.forEach(task => calculateLevels(task.id));
            
            // Group tasks by level
            const levelGroups = new Map<number, Task[]>();
            tasks.forEach(task => {
                const level = levels.get(task.id) || 0;
                if (!levelGroups.has(level)) {
                    levelGroups.set(level, []);
                }
                levelGroups.get(level)!.push(task);
            });
            
            // Position nodes
            const nodeWidth = 200;
            const nodeHeight = 100;
            const levelSpacing = 300;
            const nodeSpacing = 120;
            
            Array.from(levelGroups.entries()).forEach(([level, levelTasks]) => {
                const startY = -(levelTasks.length - 1) * nodeSpacing / 2;
                
                levelTasks.forEach((task, index) => {
                    nodes.push({
                        id: task.id,
                        task,
                        x: level * levelSpacing,
                        y: startY + index * nodeSpacing,
                        level,
                        dependencies: task.dependencies
                    });
                });
            });
            
            // Create edges for dependencies
            tasks.forEach(task => {
                task.dependencies.forEach(depId => {
                    if (taskMap.has(depId)) {
                        edges.push({
                            from: depId,
                            to: task.id,
                            type: 'dependency'
                        });
                    }
                });
            });
            
        } else {
            // Timeline-based layout
            const sortedTasks = [...tasks].sort((a, b) => 
                new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            );
            
            const dayWidth = 50;
            const swimlaneHeight = 120;
            const baseDate = new Date(Math.min(...tasks.map(t => new Date(t.dueDate).getTime())));
            
            sortedTasks.forEach((task, index) => {
                const daysDiff = Math.floor(
                    (new Date(task.dueDate).getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
                );
                
                nodes.push({
                    id: task.id,
                    task,
                    x: daysDiff * dayWidth,
                    y: index * swimlaneHeight,
                    level: index,
                    dependencies: task.dependencies
                });
            });
            
            // Create edges for dependencies in timeline view
            tasks.forEach(task => {
                task.dependencies.forEach(depId => {
                    if (taskMap.has(depId)) {
                        edges.push({
                            from: depId,
                            to: task.id,
                            type: 'dependency'
                        });
                    }
                });
            });
        }
        
        return { nodes, edges };
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

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev * 1.2, 3));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev / 1.2, 0.3));
    };

    const handleResetView = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    const exportGraph = () => {
        if (!svgRef.current) return;
        
        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `dependency-graph-${new Date().toISOString().split('T')[0]}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        addToast('Dependency graph exported successfully', 'success');
    };

    const getCriticalPath = () => {
        // Simplified critical path calculation
        const taskMap = new Map(tasks.map(task => [task.id, task]));
        const criticalTasks = tasks.filter(task => {
            // Tasks that are overdue or have high priority dependencies
            const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'done';
            const hasHighPriorityDeps = task.dependencies.some(depId => {
                const depTask = taskMap.get(depId);
                return depTask && (depTask.priority === 'high' || depTask.priority === 'critical');
            });
            return isOverdue || task.priority === 'critical' || hasHighPriorityDeps;
        });
        
        return criticalTasks.map(task => task.id);
    };

    const criticalPathIds = getCriticalPath();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Memuat dependency graph...</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-night-black">Dependency Graph</h1>
                    <p className="text-palladium">Visualisasi network dependencies antar tasks</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={viewMode === 'dependency' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('dependency')}
                    >
                        <Target className="w-4 h-4 mr-2" />
                        Dependencies
                    </Button>
                    <Button
                        variant={viewMode === 'timeline' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('timeline')}
                    >
                        <Clock className="w-4 h-4 mr-2" />
                        Timeline
                    </Button>
                    <Button variant="ghost" size="sm" onClick={exportGraph}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Buat Task
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-palladium">Total Tasks</p>
                                <p className="text-2xl font-bold">{tasks.length}</p>
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
                                <p className="text-2xl font-bold text-red-600">{criticalPathIds.length}</p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-palladium">Dependencies</p>
                                <p className="text-2xl font-bold">{edges.length}</p>
                            </div>
                            <ArrowRight className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-palladium">Blocked Tasks</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {tasks.filter(t => t.status === 'blocked').length}
                                </p>
                            </div>
                            <Ban className="w-8 h-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                        <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                        <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleResetView}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-palladium ml-2">
                        Zoom: {Math.round(zoom * 100)}%
                    </span>
                </div>
                
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span>Critical Path</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span>In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span>Done</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-500 rounded"></div>
                        <span>To Do</span>
                    </div>
                </div>
            </div>

            {/* Graph */}
            <Card className="flex-1">
                <CardContent className="p-0 h-full">
                    <div className="w-full h-full overflow-hidden relative">
                        <svg
                            ref={svgRef}
                            className="w-full h-full"
                            viewBox={`${-500 + pan.x} ${-300 + pan.y} ${1000 / zoom} ${600 / zoom}`}
                            style={{ cursor: 'grab' }}
                        >
                            {/* Grid */}
                            <defs>
                                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
                                </pattern>
                            </defs>
                            <rect x="-2000" y="-2000" width="4000" height="4000" fill="url(#grid)" />

                            {/* Edges */}
                            {edges.map((edge, index) => {
                                const fromNode = nodes.find(n => n.id === edge.from);
                                const toNode = nodes.find(n => n.id === edge.to);
                                
                                if (!fromNode || !toNode) return null;
                                
                                const isCritical = criticalPathIds.includes(edge.from) || criticalPathIds.includes(edge.to);
                                
                                return (
                                    <g key={index}>
                                        <line
                                            x1={fromNode.x + 100}
                                            y1={fromNode.y + 50}
                                            x2={toNode.x}
                                            y2={toNode.y + 50}
                                            stroke={isCritical ? '#dc2626' : '#6b7280'}
                                            strokeWidth={isCritical ? 3 : 2}
                                            strokeDasharray={edge.type === 'blocker' ? '5,5' : 'none'}
                                            markerEnd="url(#arrowhead)"
                                        />
                                    </g>
                                );
                            })}

                            {/* Arrow marker */}
                            <defs>
                                <marker
                                    id="arrowhead"
                                    markerWidth="10"
                                    markerHeight="7"
                                    refX="9"
                                    refY="3.5"
                                    orient="auto"
                                >
                                    <polygon
                                        points="0 0, 10 3.5, 0 7"
                                        fill="#6b7280"
                                    />
                                </marker>
                            </defs>

                            {/* Nodes */}
                            {nodes.map(node => {
                                const isCritical = criticalPathIds.includes(node.id);
                                const isOverdue = new Date(node.task.dueDate) < new Date() && node.task.status !== 'done';
                                
                                return (
                                    <g key={node.id}>
                                        <rect
                                            x={node.x}
                                            y={node.y}
                                            width="180"
                                            height="80"
                                            rx="8"
                                            fill="white"
                                            stroke={isCritical ? '#dc2626' : statusColors[node.task.status]}
                                            strokeWidth={isCritical ? 3 : 2}
                                            className="cursor-pointer hover:shadow-lg transition-shadow"
                                            onClick={() => handleTaskClick(node.task)}
                                        />
                                        
                                        {/* Status indicator */}
                                        <rect
                                            x={node.x}
                                            y={node.y}
                                            width="180"
                                            height="8"
                                            rx="8 8 0 0"
                                            fill={statusColors[node.task.status]}
                                        />
                                        
                                        {/* Priority indicator */}
                                        <rect
                                            x={node.x + 165}
                                            y={node.y + 12}
                                            width="4"
                                            height="56"
                                            fill={priorityColors[node.task.priority]}
                                        />
                                        
                                        {/* Task title */}
                                        <text
                                            x={node.x + 8}
                                            y={node.y + 25}
                                            className="text-sm font-semibold fill-night-black"
                                            style={{ fontSize: '12px' }}
                                        >
                                            {node.task.title.length > 20 
                                                ? node.task.title.substring(0, 20) + '...'
                                                : node.task.title
                                            }
                                        </text>
                                        
                                        {/* Due date */}
                                        <text
                                            x={node.x + 8}
                                            y={node.y + 42}
                                            className={`text-xs ${isOverdue ? 'fill-red-600' : 'fill-palladium'}`}
                                            style={{ fontSize: '10px' }}
                                        >
                                            Due: {formatDate(node.task.dueDate)}
                                            {isOverdue && ' (Overdue)'}
                                        </text>
                                        
                                        {/* Progress bar */}
                                        <rect
                                            x={node.x + 8}
                                            y={node.y + 52}
                                            width="140"
                                            height="4"
                                            fill="#e5e7eb"
                                            rx="2"
                                        />
                                        <rect
                                            x={node.x + 8}
                                            y={node.y + 52}
                                            width={140 * (node.task.progress / 100)}
                                            height="4"
                                            fill="#059669"
                                            rx="2"
                                        />
                                        
                                        {/* Progress text */}
                                        <text
                                            x={node.x + 8}
                                            y={node.y + 68}
                                            className="text-xs fill-palladium"
                                            style={{ fontSize: '10px' }}
                                        >
                                            {node.task.progress}% • {node.task.assignedTo.length} assignee(s)
                                        </text>
                                        
                                        {/* Dependency count */}
                                        {node.task.dependencies.length > 0 && (
                                            <circle
                                                cx={node.x + 165}
                                                cy={node.y + 25}
                                                r="8"
                                                fill="#ef4444"
                                            />
                                        )}
                                        {node.task.dependencies.length > 0 && (
                                            <text
                                                x={node.x + 165}
                                                y={node.y + 29}
                                                className="text-xs fill-white text-center"
                                                style={{ fontSize: '10px', textAnchor: 'middle' }}
                                            >
                                                {node.task.dependencies.length}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}
                        </svg>
                        
                        {nodes.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center text-palladium">
                                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-semibold mb-2">Tidak ada tasks</p>
                                    <p className="text-sm">Buat task baru untuk melihat dependency graph</p>
                                </div>
                            </div>
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