/**
 * Task Dependency Graph Component
 *
 * Visualizes task dependencies using a force-directed graph
 * Shows critical path and task relationships
 *
 * @component TaskDependencyGraph
 */

import React, { useState, useEffect, useRef } from 'react';
import { Task, User } from '@/types';
import { TaskDependency } from '@/types/ai-resource.types';
import { enhancedTaskService } from '@/api/taskService.enhanced';
import { Card } from './Card';
import { Button } from './Button';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  Info,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface TaskNode {
  id: string;
  title: string;
  status: Task['status'];
  priority: Task['priority'];
  progress: number;
  isCritical: boolean;
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  fx: number | null; // fixed x
  fy: number | null; // fixed y
}

interface TaskLink {
  source: string;
  target: string;
  type: TaskDependency['dependencyType'];
  lagTime: number;
}

interface TaskDependencyGraphProps {
  projectId: string;
  tasks: Task[];
  currentUser: User;
  onTaskSelect?: (taskId: string) => void;
}

export const TaskDependencyGraph: React.FC<TaskDependencyGraphProps> = ({
  projectId,
  tasks,
  currentUser,
  onTaskSelect,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<TaskNode[]>([]);
  const [links, setLinks] = useState<TaskLink[]>([]);
  const [criticalPath, setCriticalPath] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  // Animation frame reference
  const animationRef = useRef<number>(0);
  const lastUpdateTime = useRef<number>(0);

  // Initialize graph data
  useEffect(() => {
    loadGraphData();
  }, [projectId, tasks]);

  // Start/stop animation
  useEffect(() => {
    if (isAnimating) {
      lastUpdateTime.current = performance.now();
      animate();
    } else {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isAnimating]);

  const loadGraphData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all task dependencies
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

      // Calculate critical path
      const criticalPathResponse = await enhancedTaskService.calculateCriticalPath(
        projectId,
        tasks,
        allDependencies
      );

      let criticalTasks: string[] = [];
      if (criticalPathResponse.success && criticalPathResponse.data) {
        criticalTasks = criticalPathResponse.data.criticalTasks;
        setCriticalPath(criticalPathResponse.data.criticalPath);
      }

      // Create nodes
      const taskNodes: TaskNode[] = tasks.map((task, index) => {
        // Position nodes in a circle initially
        const angle = (index / tasks.length) * 2 * Math.PI;
        const radius = Math.min(window.innerWidth, window.innerHeight) * 0.3;
        
        return {
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          progress: task.progress,
          isCritical: criticalTasks.includes(task.id),
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
          fx: null,
          fy: null,
        };
      });

      // Create links
      const taskLinks: TaskLink[] = allDependencies.map((dep) => ({
        source: dep.predecessorTaskId,
        target: dep.successorTaskId,
        type: dep.dependencyType,
        lagTime: dep.lagTime || 0,
      }));

      setNodes(taskNodes);
      setLinks(taskLinks);
    } catch (err) {
      console.error('Error loading graph data:', err);
      setError('Failed to load task dependencies');
    } finally {
      setLoading(false);
    }
  };

  // Physics simulation for force-directed graph
  const animate = () => {
    const now = performance.now();
    const deltaTime = Math.min(100, now - lastUpdateTime.current) / 1000; // Cap at 100ms
    lastUpdateTime.current = now;

    setNodes((prevNodes) => {
      // Constants for physics simulation
      const repulsionStrength = 300;
      const linkDistance = 150;
      const linkStrength = 1;
      const centerStrength = 0.1;
      const friction = 0.9;

      // Create node map for quick lookup
      const nodeMap = new Map<string, TaskNode>();
      prevNodes.forEach((node) => nodeMap.set(node.id, node));

      // Calculate forces
      const newNodes = prevNodes.map((node) => {
        let fx = 0;
        let fy = 0;

        // Skip fixed nodes
        if (node.fx !== null && node.fy !== null) {
          return {
            ...node,
            x: node.fx,
            y: node.fy,
            vx: 0,
            vy: 0,
          };
        }

        // Repulsion forces (prevent nodes from overlapping)
        prevNodes.forEach((otherNode) => {
          if (node.id === otherNode.id) return;

          const dx = node.x - otherNode.x;
          const dy = node.y - otherNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          // Avoid division by zero and extreme forces
          if (distance < 100) {
            const force = repulsionStrength / (distance * distance);
            fx += (dx / distance) * force;
            fy += (dy / distance) * force;
          }
        });

        // Attraction forces (pull connected nodes together)
        links.forEach((link) => {
          if (link.source === node.id) {
            const targetNode = nodeMap.get(link.target);
            if (targetNode) {
              const dx = targetNode.x - node.x;
              const dy = targetNode.y - node.y;
              const distance = Math.sqrt(dx * dx + dy * dy) || 1;
              const displacement = distance - linkDistance;
              
              const force = displacement * linkStrength;
              fx += (dx / distance) * force;
              fy += (dy / distance) * force;
            }
          } else if (link.target === node.id) {
            const sourceNode = nodeMap.get(link.source);
            if (sourceNode) {
              const dx = sourceNode.x - node.x;
              const dy = sourceNode.y - node.y;
              const distance = Math.sqrt(dx * dx + dy * dy) || 1;
              const displacement = distance - linkDistance;
              
              const force = displacement * linkStrength;
              fx += (dx / distance) * force;
              fy += (dy / distance) * force;
            }
          }
        });

        // Center attraction (pull nodes toward center)
        const centerDx = -node.x;
        const centerDy = -node.y;
        const centerDistance = Math.sqrt(centerDx * centerDx + centerDy * centerDy) || 1;
        fx += (centerDx / centerDistance) * centerStrength * centerDistance;
        fy += (centerDy / centerDistance) * centerStrength * centerDistance;

        // Update velocity
        let newVx = (node.vx + fx * deltaTime) * friction;
        let newVy = (node.vy + fy * deltaTime) * friction;

        // Limit velocity to prevent extreme movements
        const maxVelocity = 1000;
        const velocity = Math.sqrt(newVx * newVx + newVy * newVy);
        if (velocity > maxVelocity) {
          newVx = (newVx / velocity) * maxVelocity;
          newVy = (newVy / velocity) * maxVelocity;
        }

        // Update position
        const newX = node.x + newVx * deltaTime;
        const newY = node.y + newVy * deltaTime;

        return {
          ...node,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
        };
      });

      return newNodes;
    });

    animationRef.current = requestAnimationFrame(animate);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.3));
  };

  const handleResetView = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedTask(nodeId);
    if (onTaskSelect) {
      onTaskSelect(nodeId);
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return '#6b7280'; // gray
      case 'in-progress':
        return '#3b82f6'; // blue
      case 'review':
        return '#f59e0b'; // amber
      case 'done':
      case 'completed':
        return '#10b981'; // green
      case 'blocked':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'low':
        return '#10b981'; // green
      case 'medium':
        return '#f59e0b'; // amber
      case 'high':
        return '#f97316'; // orange
      case 'critical':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getDependencyColor = (type: TaskDependency['dependencyType']) => {
    switch (type) {
      case 'finish_to_start':
        return '#3b82f6'; // blue
      case 'start_to_start':
        return '#10b981'; // green
      case 'finish_to_finish':
        return '#8b5cf6'; // violet
      case 'start_to_finish':
        return '#f59e0b'; // amber
      default:
        return '#6b7280'; // gray
    }
  };

  const getDependencyMarker = (type: TaskDependency['dependencyType']) => {
    switch (type) {
      case 'finish_to_start':
        return 'arrow';
      case 'start_to_start':
        return 'circle';
      case 'finish_to_finish':
        return 'square';
      case 'start_to_finish':
        return 'diamond';
      default:
        return 'arrow';
    }
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading task dependencies...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center h-96 text-red-600">
          <AlertTriangle className="w-12 h-12 mb-4" />
          <p className="text-lg font-medium mb-2">Error Loading Dependencies</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadGraphData}>Retry</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Task Dependency Graph</h3>
          <div className="relative group">
            <Info className="w-4 h-4 text-gray-500 cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
              Visualize task dependencies and critical path
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Critical Path: {criticalPath.length} tasks</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAnimating(!isAnimating)}
            title={isAnimating ? 'Pause animation' : 'Resume animation'}
          >
            {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetView}
            title="Reset view"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="relative border rounded-lg overflow-hidden bg-gray-50" style={{ height: '600px' }}>
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox={`${panX - 400 / zoom} ${panY - 300 / zoom} ${800 / zoom} ${600 / zoom}`}
        >
          {/* Links (Dependencies) */}
          {links.map((link, index) => {
            const sourceNode = nodes.find(n => n.id === link.source);
            const targetNode = nodes.find(n => n.id === link.target);
            
            if (!sourceNode || !targetNode) return null;
            
            const dx = targetNode.x - sourceNode.x;
            const dy = targetNode.y - sourceNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance === 0) return null;
            
            const nx = dx / distance;
            const ny = dy / distance;
            
            // Adjust for node radius
            const sourceRadius = 30;
            const targetRadius = 30;
            
            const startX = sourceNode.x + nx * sourceRadius;
            const startY = sourceNode.y + ny * sourceRadius;
            const endX = targetNode.x - nx * targetRadius;
            const endY = targetNode.y - ny * targetRadius;
            
            return (
              <g key={index}>
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke={getDependencyColor(link.type)}
                  strokeWidth={link.lagTime !== 0 ? 2 : 1.5}
                  strokeDasharray={link.lagTime !== 0 ? '5,5' : 'none'}
                  markerEnd={`url(#arrow-${link.type})`}
                />
                {link.lagTime !== 0 && (
                  <text
                    x={(startX + endX) / 2}
                    y={(startY + endY) / 2 - 10}
                    textAnchor="middle"
                    fontSize="10"
                    fill={getDependencyColor(link.type)}
                  >
                    {link.lagTime > 0 ? `+${link.lagTime}h` : `${link.lagTime}h`}
                  </text>
                )}
              </g>
            );
          })}
          
          {/* Arrow markers for different dependency types */}
          <defs>
            <marker
              id="arrow-finish_to_start"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill={getDependencyColor('finish_to_start')} />
            </marker>
            <marker
              id="arrow-start_to_start"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <circle cx="3" cy="3" r="3" fill={getDependencyColor('start_to_start')} />
            </marker>
            <marker
              id="arrow-finish_to_finish"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <rect x="0" y="0" width="6" height="6" fill={getDependencyColor('finish_to_finish')} />
            </marker>
            <marker
              id="arrow-start_to_finish"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon points="3,0 6,3 3,6 0,3" fill={getDependencyColor('start_to_finish')} />
            </marker>
          </defs>
          
          {/* Nodes (Tasks) */}
          {nodes.map((node) => (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onClick={() => handleNodeClick(node.id)}
              className="cursor-pointer"
            >
              {/* Node circle */}
              <circle
                r={node.isCritical ? 30 : 25}
                fill={selectedTask === node.id ? '#f0f9ff' : '#ffffff'}
                stroke={node.isCritical ? '#ef4444' : getStatusColor(node.status)}
                strokeWidth={node.isCritical ? 3 : 2}
                className="transition-all duration-200"
              />
              
              {/* Progress ring */}
              <circle
                r="20"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="3"
              />
              <circle
                r="20"
                fill="none"
                stroke={getStatusColor(node.status)}
                strokeWidth="3"
                strokeDasharray={`${(node.progress / 100) * 125.66} 125.66`}
                strokeLinecap="round"
                transform="rotate(-90)"
              />
              
              {/* Task title */}
              <text
                y="-5"
                textAnchor="middle"
                fontSize="10"
                fontWeight="500"
                fill="#1f2937"
                className="pointer-events-none"
              >
                {node.title.length > 12 ? `${node.title.substring(0, 10)}...` : node.title}
              </text>
              
              {/* Progress percentage */}
              <text
                y="10"
                textAnchor="middle"
                fontSize="8"
                fill="#6b7280"
                className="pointer-events-none"
              >
                {node.progress}%
              </text>
              
              {/* Priority indicator */}
              <circle
                cx="15"
                cy="-15"
                r="5"
                fill={getPriorityColor(node.priority)}
                stroke="#ffffff"
                strokeWidth="1"
              />
            </g>
          ))}
        </svg>
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm p-3 rounded-lg border shadow-sm">
          <h4 className="text-sm font-medium mb-2">Legend</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-red-700"></div>
              <span>Critical Task</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="12" height="12" className="text-blue-500">
                <line x1="0" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrow-finish_to_start)" />
              </svg>
              <span>Finish-to-Start</span>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-3 rounded-lg border shadow-sm">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Tasks:</span>
              <span className="font-medium">{nodes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dependencies:</span>
              <span className="font-medium">{links.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Critical Path:</span>
              <span className="font-medium text-red-600">{criticalPath.length}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Selected Task Info */}
      {selectedTask && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">
                {nodes.find(n => n.id === selectedTask)?.title}
              </h4>
              <p className="text-sm text-gray-600">
                Status: {tasks.find(t => t.id === selectedTask)?.status} • 
                Progress: {nodes.find(n => n.id === selectedTask)?.progress}%
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTask(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};