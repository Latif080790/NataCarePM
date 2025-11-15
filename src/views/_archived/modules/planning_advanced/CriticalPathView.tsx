/**
 * Critical Path View
 *
 * Displays critical path analysis with detailed scheduling information
 * Shows task sequence, durations, and scheduling metrics
 *
 * @component CriticalPathView
 */

import React, { useState, useEffect } from 'react';
import { Task } from '@/types';
import { TaskDependency } from '@/types/ai-resource.types';
import { enhancedTaskService } from '@/api/taskService.enhanced';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import {
  AlertTriangle,
  Calendar,
  Clock,
  Target,
  BarChart3,
  RefreshCw,
  Download,
} from 'lucide-react';

interface CriticalPathViewProps {
  projectId: string;
  tasks: Task[];
  onTaskSelect?: (taskId: string) => void;
}

interface CriticalPathAnalysis {
  criticalPath: string[];
  criticalTasks: string[];
  projectDuration: number;
  taskES: Record<string, number>; // Earliest Start
  taskEF: Record<string, number>; // Earliest Finish
  taskLS: Record<string, number>; // Latest Start
  taskLF: Record<string, number>; // Latest Finish
  taskFloat: Record<string, number>; // Total Float
}

interface TaskScheduleInfo {
  task: Task;
  es: number; // Earliest Start
  ef: number; // Earliest Finish
  ls: number; // Latest Start
  lf: number; // Latest Finish
  float: number; // Total Float
  isCritical: boolean;
}

export const CriticalPathView: React.FC<CriticalPathViewProps> = ({
  projectId,
  tasks,
  onTaskSelect,
}) => {
  const [analysis, setAnalysis] = useState<CriticalPathAnalysis | null>(null);
  const [taskScheduleInfo, setTaskScheduleInfo] = useState<TaskScheduleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'sequence' | 'float' | 'duration'>('sequence');

  useEffect(() => {
    loadCriticalPathAnalysis();
  }, [projectId, tasks]);

  const loadCriticalPathAnalysis = async () => {
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

      if (criticalPathResponse.success && criticalPathResponse.data) {
        const analysisData = criticalPathResponse.data;
        setAnalysis(analysisData);

        // Create task schedule info
        const scheduleInfo: TaskScheduleInfo[] = tasks.map((task) => ({
          task,
          es: analysisData.taskES[task.id] || 0,
          ef: analysisData.taskEF[task.id] || 0,
          ls: analysisData.taskLS[task.id] || 0,
          lf: analysisData.taskLF[task.id] || 0,
          float: analysisData.taskFloat[task.id] || 0,
          isCritical: analysisData.criticalTasks.includes(task.id),
        }));

        // Sort by sequence (critical path first, then by ES)
        scheduleInfo.sort((a, b) => {
          if (a.isCritical && !b.isCritical) return -1;
          if (!a.isCritical && b.isCritical) return 1;
          
          switch (sortBy) {
            case 'sequence':
              return a.es - b.es;
            case 'float':
              return a.float - b.float;
            case 'duration':
              const aDuration = (a.task.endDate && a.task.startDate) 
                ? new Date(a.task.endDate).getTime() - new Date(a.task.startDate).getTime()
                : 0;
              const bDuration = (b.task.endDate && b.task.startDate) 
                ? new Date(b.task.endDate).getTime() - new Date(b.task.startDate).getTime()
                : 0;
              return bDuration - aDuration;
            default:
              return a.es - b.es;
          }
        });

        setTaskScheduleInfo(scheduleInfo);
      }
    } catch (err) {
      console.error('Error loading critical path analysis:', err);
      setError('Failed to load critical path analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadCriticalPathAnalysis();
  };

  const handleExport = () => {
    if (!analysis) return;

    const csvContent = [
      ['Task ID', 'Task Name', 'Status', 'Priority', 'ES', 'EF', 'LS', 'LF', 'Float', 'Is Critical'],
      ...taskScheduleInfo.map(info => [
        info.task.id,
        info.task.title,
        info.task.status,
        info.task.priority,
        info.es.toFixed(2),
        info.ef.toFixed(2),
        info.ls.toFixed(2),
        info.lf.toFixed(2),
        info.float.toFixed(2),
        info.isCritical ? 'Yes' : 'No'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `critical-path-analysis-${projectId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFloatColor = (float: number) => {
    if (float <= 0) return 'text-red-600 bg-red-50';
    if (float <= 2) return 'text-orange-600 bg-orange-50';
    if (float <= 5) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'review':
        return 'bg-amber-100 text-amber-800';
      case 'done':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 text-blue-500 animate-spin" />
          <p className="text-gray-600">Analyzing critical path...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center text-red-600">
          <AlertTriangle className="w-12 h-12 mb-4" />
          <p className="text-lg font-medium mb-2">Error Loading Analysis</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh}>Retry</Button>
        </div>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center text-gray-600">
          <BarChart3 className="w-12 h-12 mb-4" />
          <p className="text-lg font-medium mb-2">No Analysis Available</p>
          <p className="text-gray-600 mb-4">Critical path analysis could not be generated</p>
          <Button onClick={handleRefresh}>Retry Analysis</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Project Duration</p>
              <p className="text-2xl font-bold">{analysis.projectDuration} days</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical Tasks</p>
              <p className="text-2xl font-bold text-red-600">{analysis.criticalTasks.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical Path</p>
              <p className="text-2xl font-bold">{analysis.criticalPath.length} tasks</p>
            </div>
            <Target className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold">{tasks.length}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Critical Path Analysis</h3>
            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
              {analysis.criticalPath.length} critical tasks
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="sequence">Sort by Sequence</option>
              <option value="float">Sort by Float</option>
              <option value="duration">Sort by Duration</option>
            </select>

            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>

            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Critical Path Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ES
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Float
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {taskScheduleInfo.map((info) => {
                const duration = info.task.startDate && info.task.endDate
                  ? Math.ceil(
                      (new Date(info.task.endDate).getTime() - new Date(info.task.startDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : 0;

                return (
                  <tr
                    key={info.task.id}
                    className={info.isCritical ? 'bg-red-50' : 'hover:bg-gray-50'}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              info.isCritical
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-200 text-gray-800'
                            }`}
                          >
                            {info.isCritical ? (
                              <AlertTriangle className="h-4 w-4" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {info.task.title}
                          </div>
                          <div className="text-sm text-gray-500">{info.task.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          info.task.status
                        )}`}
                      >
                        {info.task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(
                          info.task.priority
                        )}`}
                      >
                        {info.task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {duration} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {info.es.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {info.ef.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {info.ls.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {info.lf.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getFloatColor(
                          info.float
                        )}`}
                      >
                        {info.float.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTaskSelect?.(info.task.id)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Critical Path Visualization */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Critical Path Sequence</h3>
        <div className="flex flex-wrap gap-2">
          {analysis.criticalPath.map((taskId, index) => {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return null;

            return (
              <div
                key={taskId}
                className="flex items-center px-3 py-2 bg-red-100 border border-red-300 rounded-lg"
              >
                <span className="text-sm font-medium text-red-800">
                  {index + 1}. {task.title}
                </span>
              </div>
            );
          })}
        </div>
        {analysis.criticalPath.length === 0 && (
          <p className="text-gray-500 italic">No critical path identified</p>
        )}
      </Card>

      {/* Recommendations */}
      {analysis.criticalTasks.length > 0 && (
        <Card className="p-6 bg-amber-50 border-amber-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Recommendations
          </h3>
          <div className="space-y-2">
            <p className="text-amber-800">
              <strong>{analysis.criticalTasks.length} critical tasks</strong> require immediate attention to avoid project delays.
            </p>
            <ul className="list-disc list-inside text-amber-700 space-y-1">
              <li>Prioritize resources for critical tasks</li>
              <li>Monitor progress daily on critical path activities</li>
              <li>Identify potential risks that could impact critical tasks</li>
              <li>Consider fast-tracking or crashing critical activities if needed</li>
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CriticalPathView;
