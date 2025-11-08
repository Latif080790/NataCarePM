import { useState, useEffect, useMemo } from 'react';
import { Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { taskService } from '@/api/taskService';
import { useProject } from '@/contexts/ProjectContext';
import {
  Users,
  AlertTriangle,
  Clock,
  BarChart3,
  ChevronRight,
} from 'lucide-react';

interface ResourceAllocation {
  userId: string;
  userName: string;
  userEmail: string;
  totalTasks: number;
  totalHours: number; // Estimated hours
  capacity: number; // Weekly capacity in hours
  utilizationRate: number; // 0-100+
  tasks: Task[];
  overloaded: boolean;
  availableHours: number;
}

interface ResourceConflict {
  userId: string;
  userName: string;
  overloadHours: number;
  conflictingTasks: Task[];
  suggestions: string[];
}

export default function ResourceAllocationView() {
  const { currentProject } = useProject();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'overview' | 'detail'>('overview');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week');

  // Weekly capacity per person (default 40 hours)
  const WEEKLY_CAPACITY = 40;

  // Load tasks
  useEffect(() => {
    if (!currentProject?.id) return;

    setLoading(true);
    const unsubscribe = taskService.streamTasksByProject(
      currentProject.id,
      (fetchedTasks) => {
        setTasks(fetchedTasks.filter((t) => t.status !== 'done' && t.status !== 'completed'));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentProject]);

  // Calculate resource allocations
  const resourceAllocations = useMemo((): ResourceAllocation[] => {
    if (!currentProject?.members || tasks.length === 0) return [];

    const allocations: ResourceAllocation[] = currentProject.members.map((member) => {
      const memberTasks = tasks.filter((task) => task.assignedTo.includes(member.id));

      // Estimate hours based on priority and complexity
      const totalHours = memberTasks.reduce((sum, task) => {
        let estimatedHours = 8; // Default 1 day

        if (task.priority === 'critical') estimatedHours = 16;
        else if (task.priority === 'high') estimatedHours = 12;
        else if (task.priority === 'medium') estimatedHours = 8;
        else estimatedHours = 4;

        return sum + estimatedHours;
      }, 0);

      const capacity = timeRange === 'week' ? WEEKLY_CAPACITY : timeRange === 'month' ? WEEKLY_CAPACITY * 4 : WEEKLY_CAPACITY * 12;
      const utilizationRate = (totalHours / capacity) * 100;
      const overloaded = utilizationRate > 100;
      const availableHours = Math.max(0, capacity - totalHours);

      return {
        userId: member.id,
        userName: member.name || member.email,
        userEmail: member.email,
        totalTasks: memberTasks.length,
        totalHours,
        capacity,
        utilizationRate,
        tasks: memberTasks,
        overloaded,
        availableHours,
      };
    });

    return allocations.sort((a, b) => b.utilizationRate - a.utilizationRate);
  }, [currentProject, tasks, timeRange]);

  // Detect resource conflicts
  const conflicts = useMemo((): ResourceConflict[] => {
    return resourceAllocations
      .filter((alloc) => alloc.overloaded)
      .map((alloc) => {
        const overloadHours = alloc.totalHours - alloc.capacity;
        const conflictingTasks = alloc.tasks
          .filter((t) => t.priority === 'critical' || t.priority === 'high')
          .slice(0, 5);

        const suggestions: string[] = [];

        // Suggest task reassignment
        const availableMembers = resourceAllocations.filter(
          (a) => !a.overloaded && a.availableHours >= 8
        );
        if (availableMembers.length > 0) {
          suggestions.push(
            `Reassign ${Math.ceil(overloadHours / 8)} tasks to: ${availableMembers.map((a) => a.userName).join(', ')}`
          );
        }

        // Suggest deadline extension
        suggestions.push(`Extend deadline for ${conflictingTasks.length} low-priority tasks`);

        // Suggest external help
        if (overloadHours > 40) {
          suggestions.push('Consider hiring additional resources or contractors');
        }

        return {
          userId: alloc.userId,
          userName: alloc.userName,
          overloadHours,
          conflictingTasks,
          suggestions,
        };
      });
  }, [resourceAllocations]);

  // Team statistics
  const teamStats = useMemo(() => {
    const totalMembers = resourceAllocations.length;
    const overloadedMembers = resourceAllocations.filter((a) => a.overloaded).length;
    const underutilizedMembers = resourceAllocations.filter((a) => a.utilizationRate < 50).length;
    const avgUtilization =
      resourceAllocations.reduce((sum, a) => sum + a.utilizationRate, 0) / (totalMembers || 1);
    const totalCapacity = resourceAllocations.reduce((sum, a) => sum + a.capacity, 0);
    const totalAllocated = resourceAllocations.reduce((sum, a) => sum + a.totalHours, 0);

    return {
      totalMembers,
      overloadedMembers,
      underutilizedMembers,
      avgUtilization,
      totalCapacity,
      totalAllocated,
      availableCapacity: totalCapacity - totalAllocated,
    };
  }, [resourceAllocations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resource data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Resource Allocation</h1>
        <p className="text-gray-600 mt-2">Manage team workload and capacity planning</p>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex bg-white rounded-lg shadow-sm border">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-l-lg transition-colors ${
              timeRange === 'week' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 transition-colors ${
              timeRange === 'month' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setTimeRange('quarter')}
            className={`px-4 py-2 rounded-r-lg transition-colors ${
              timeRange === 'quarter'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            This Quarter
          </button>
        </div>

        <div className="flex bg-white rounded-lg shadow-sm border ml-auto">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-4 py-2 rounded-l-lg transition-colors ${
              viewMode === 'overview'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode('detail')}
            className={`px-4 py-2 rounded-r-lg transition-colors ${
              viewMode === 'detail' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Detail
          </button>
        </div>
      </div>

      {/* Team Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Team Members</p>
                <p className="text-2xl font-bold text-gray-900">{teamStats.totalMembers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Utilization</p>
                <p className="text-2xl font-bold text-green-600">
                  {teamStats.avgUtilization.toFixed(0)}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overloaded</p>
                <p className="text-2xl font-bold text-red-600">{teamStats.overloadedMembers}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Capacity</p>
                <p className="text-2xl font-bold text-blue-600">
                  {teamStats.availableCapacity.toFixed(0)}h
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Conflicts Alert */}
      {conflicts.length > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              Resource Conflicts Detected ({conflicts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conflicts.map((conflict) => (
                <div key={conflict.userId} className="bg-white p-4 rounded-lg border border-red-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{conflict.userName}</h4>
                      <p className="text-sm text-red-600">
                        Overloaded by {conflict.overloadHours.toFixed(0)} hours
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                      {conflict.conflictingTasks.length} critical tasks
                    </span>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Suggestions:</p>
                    <ul className="space-y-1">
                      {conflict.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resource Allocation List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Workload Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {resourceAllocations.map((allocation) => (
              <div
                key={allocation.userId}
                className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                  allocation.overloaded
                    ? 'bg-red-50 border-red-200'
                    : allocation.utilizationRate < 50
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                      {allocation.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{allocation.userName}</h4>
                      <p className="text-sm text-gray-600">{allocation.userEmail}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {allocation.utilizationRate.toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500">Utilization</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>
                      {allocation.totalHours.toFixed(0)}h / {allocation.capacity}h
                    </span>
                    <span>{allocation.totalTasks} tasks</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        allocation.overloaded
                          ? 'bg-red-500'
                          : allocation.utilizationRate < 50
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(allocation.utilizationRate, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Task Summary */}
                {viewMode === 'detail' && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Critical:</span>{' '}
                        <span className="font-semibold text-red-600">
                          {allocation.tasks.filter((t) => t.priority === 'critical').length}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">High:</span>{' '}
                        <span className="font-semibold text-orange-600">
                          {allocation.tasks.filter((t) => t.priority === 'high').length}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Medium:</span>{' '}
                        <span className="font-semibold text-yellow-600">
                          {allocation.tasks.filter((t) => t.priority === 'medium').length}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Low:</span>{' '}
                        <span className="font-semibold text-gray-600">
                          {allocation.tasks.filter((t) => t.priority === 'low').length}
                        </span>
                      </div>
                    </div>

                    {allocation.tasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 truncate flex-1">
                            {task.title}
                          </span>
                          <span
                            className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${
                              task.priority === 'critical'
                                ? 'bg-red-100 text-red-700'
                                : task.priority === 'high'
                                  ? 'bg-orange-100 text-orange-700'
                                  : task.priority === 'medium'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    ))}

                    {allocation.tasks.length > 3 && (
                      <p className="text-xs text-gray-500 mt-2">
                        +{allocation.tasks.length - 3} more tasks
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
