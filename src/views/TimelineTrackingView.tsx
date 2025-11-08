import { useState, useEffect, useMemo } from 'react';
import { Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { taskService } from '@/api/taskService';
import { useProject } from '@/contexts/ProjectContext';
import { useToast } from '@/contexts/ToastContext';
import {
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  Zap,
  Flag,
} from 'lucide-react';
import { formatDate } from '@/constants';

interface TimelineTrackingViewProps {
  projectId?: string;
}

interface Milestone {
  id: string;
  name: string;
  targetDate: Date;
  actualDate?: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  tasks: Task[];
  progress: number;
  delayDays: number;
}

interface ProgressForecast {
  currentProgress: number;
  projectedCompletion: Date;
  targetCompletion: Date;
  isOnTrack: boolean;
  daysAhead: number;
  daysDelayed: number;
  velocity: number; // Tasks completed per day
}

interface DelayAlert {
  id: string;
  taskId: string;
  taskTitle: string;
  dueDate: Date;
  daysOverdue: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  assignees: string[];
  blockedTasks: number;
}

export default function TimelineTrackingView({ projectId }: TimelineTrackingViewProps) {
  const { currentProject } = useProject();
  const { addToast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<'week' | 'month' | 'quarter' | 'all'>('month');
  const [showDelayedOnly, setShowDelayedOnly] = useState(false);

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

  // Calculate milestones
  const milestones = useMemo((): Milestone[] => {
    if (!tasks.length) return [];

    // Group tasks by month as milestones
    const milestoneMap = new Map<string, Task[]>();

    tasks.forEach((task) => {
      const dueDate = new Date(task.dueDate);
      const key = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!milestoneMap.has(key)) {
        milestoneMap.set(key, []);
      }
      milestoneMap.get(key)!.push(task);
    });

    // Convert to milestone objects
    const milestonesArray: Milestone[] = Array.from(milestoneMap.entries()).map(([key, milestoneTasks]) => {
      const [year, month] = key.split('-').map(Number);
      const targetDate = new Date(year, month - 1, 1);
      const lastDayOfMonth = new Date(year, month, 0);

      const completedTasks = milestoneTasks.filter((t) => t.status === 'completed');
      const progress = milestoneTasks.length > 0 
        ? Math.round((completedTasks.length / milestoneTasks.length) * 100)
        : 0;

      // Check if milestone is delayed
      const today = new Date();
      const isOverdue = today > lastDayOfMonth && progress < 100;
      const delayDays = isOverdue 
        ? Math.ceil((today.getTime() - lastDayOfMonth.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const status: Milestone['status'] = 
        progress === 100 ? 'completed' :
        isOverdue ? 'delayed' :
        progress > 0 ? 'in-progress' : 'pending';

      return {
        id: key,
        name: targetDate.toLocaleDateString('id', { month: 'long', year: 'numeric' }),
        targetDate,
        status,
        tasks: milestoneTasks,
        progress,
        delayDays,
      };
    });

    return milestonesArray.sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());
  }, [tasks]);

  // Calculate progress forecast
  const progressForecast = useMemo((): ProgressForecast | null => {
    if (!tasks.length || !currentProject) return null;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const currentProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate velocity (tasks completed per day)
    const projectStart = currentProject.startDate ? new Date(currentProject.startDate) : new Date();
    const today = new Date();
    const daysElapsed = Math.max(1, Math.ceil((today.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)));
    const velocity = completedTasks / daysElapsed;

    // Project completion date based on velocity
    const remainingTasks = totalTasks - completedTasks;
    const daysToComplete = velocity > 0 ? Math.ceil(remainingTasks / velocity) : 365;
    const projectedCompletion = new Date(today);
    projectedCompletion.setDate(projectedCompletion.getDate() + daysToComplete);

    // Target completion date - use end of year as default
    // TODO: Add targetEndDate field to Project type in future
    const targetCompletion = new Date(today.getFullYear(), 11, 31);

    const diffDays = Math.ceil((targetCompletion.getTime() - projectedCompletion.getTime()) / (1000 * 60 * 60 * 24));
    const isOnTrack = diffDays >= 0;

    return {
      currentProgress,
      projectedCompletion,
      targetCompletion,
      isOnTrack,
      daysAhead: isOnTrack ? diffDays : 0,
      daysDelayed: !isOnTrack ? Math.abs(diffDays) : 0,
      velocity,
    };
  }, [tasks, currentProject]);

  // Calculate delay alerts
  const delayAlerts = useMemo((): DelayAlert[] => {
    const today = new Date();
    const alerts: DelayAlert[] = [];

    tasks.forEach((task) => {
      if (task.status === 'completed') return;

      const dueDate = new Date(task.dueDate);
      const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysOverdue > 0) {
        // Count blocked tasks (tasks that depend on this one)
        const blockedTasks = tasks.filter(
          (t) => t.dependencies && t.dependencies.includes(task.id)
        ).length;

        const severity: DelayAlert['severity'] = 
          daysOverdue > 14 || blockedTasks > 3 ? 'critical' :
          daysOverdue > 7 || blockedTasks > 1 ? 'high' :
          daysOverdue > 3 ? 'medium' : 'low';

        alerts.push({
          id: `alert-${task.id}`,
          taskId: task.id,
          taskTitle: task.title,
          dueDate,
          daysOverdue,
          severity,
          assignees: task.assignedTo,
          blockedTasks,
        });
      }
    });

    // Sort by severity and days overdue
    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      return severityDiff !== 0 ? severityDiff : b.daysOverdue - a.daysOverdue;
    });
  }, [tasks]);

  const filteredMilestones = useMemo(() => {
    if (!showDelayedOnly) return milestones;
    return milestones.filter((m) => m.status === 'delayed');
  }, [milestones, showDelayedOnly]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-persimmon"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-night-black">Timeline Tracking</h1>
          <p className="text-palladium mt-1">
            Monitor project milestones, forecast completion, and track delays
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showDelayedOnly}
              onChange={(e) => setShowDelayedOnly(e.target.checked)}
              className="rounded"
            />
            Show delayed only
          </label>
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value as any)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Progress Forecast */}
      {progressForecast && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-persimmon" />
              Progress Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Current Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-palladium">Current Progress</span>
                  <span className="text-2xl font-bold text-persimmon">
                    {progressForecast.currentProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-persimmon h-2 rounded-full transition-all"
                    style={{ width: `${progressForecast.currentProgress}%` }}
                  />
                </div>
                <p className="text-xs text-palladium">
                  Velocity: {progressForecast.velocity.toFixed(2)} tasks/day
                </p>
              </div>

              {/* Projected Completion */}
              <div className="space-y-2">
                <span className="text-sm text-palladium">Projected Completion</span>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="font-semibold">
                    {formatDate(progressForecast.projectedCompletion.toISOString())}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-palladium">
                    Target: {formatDate(progressForecast.targetCompletion.toISOString())}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <span className="text-sm text-palladium">Project Status</span>
                {progressForecast.isOnTrack ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-6 h-6" />
                    <div>
                      <p className="font-semibold">On Track</p>
                      <p className="text-sm">{progressForecast.daysAhead} days ahead</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-6 h-6" />
                    <div>
                      <p className="font-semibold">Delayed</p>
                      <p className="text-sm">{progressForecast.daysDelayed} days behind</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delay Alerts */}
      {delayAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delay Alerts ({delayAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {delayAlerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.severity === 'critical'
                      ? 'bg-red-50 border-red-600'
                      : alert.severity === 'high'
                        ? 'bg-orange-50 border-orange-600'
                        : alert.severity === 'medium'
                          ? 'bg-yellow-50 border-yellow-600'
                          : 'bg-gray-50 border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-night-black">{alert.taskTitle}</h4>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            alert.severity === 'critical'
                              ? 'bg-red-600 text-white'
                              : alert.severity === 'high'
                                ? 'bg-orange-600 text-white'
                                : alert.severity === 'medium'
                                  ? 'bg-yellow-600 text-white'
                                  : 'bg-gray-600 text-white'
                          }`}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-palladium">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{alert.daysOverdue} days overdue</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {formatDate(alert.dueDate.toISOString())}</span>
                        </div>
                        {alert.blockedTasks > 0 && (
                          <div className="flex items-center gap-1 text-red-600">
                            <Zap className="w-4 h-4" />
                            <span>Blocking {alert.blockedTasks} tasks</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Navigate to task detail or take action
                        addToast('Task detail view coming soon', 'info');
                      }}
                    >
                      View Task
                    </Button>
                  </div>
                </div>
              ))}
              {delayAlerts.length > 10 && (
                <p className="text-center text-sm text-palladium">
                  ... and {delayAlerts.length - 10} more delayed tasks
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-persimmon" />
            Milestones ({filteredMilestones.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMilestones.map((milestone, index) => (
              <div key={milestone.id} className="relative">
                {/* Connector Line */}
                {index < filteredMilestones.length - 1 && (
                  <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-gray-300" />
                )}

                <div className="flex gap-4">
                  {/* Milestone Icon */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      milestone.status === 'completed'
                        ? 'bg-green-500'
                        : milestone.status === 'delayed'
                          ? 'bg-red-500'
                          : milestone.status === 'in-progress'
                            ? 'bg-blue-500'
                            : 'bg-gray-400'
                    }`}
                  >
                    {milestone.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : milestone.status === 'delayed' ? (
                      <AlertTriangle className="w-5 h-5 text-white" />
                    ) : (
                      <Flag className="w-5 h-5 text-white" />
                    )}
                  </div>

                  {/* Milestone Content */}
                  <div className="flex-1 pb-8">
                    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg text-night-black">
                            {milestone.name}
                          </h4>
                          <p className="text-sm text-palladium">
                            Target: {formatDate(milestone.targetDate.toISOString())}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-persimmon">{milestone.progress}%</p>
                          {milestone.status === 'delayed' && (
                            <p className="text-xs text-red-600 font-semibold">
                              {milestone.delayDays} days delayed
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            milestone.status === 'completed'
                              ? 'bg-green-500'
                              : milestone.status === 'delayed'
                                ? 'bg-red-500'
                                : 'bg-blue-500'
                          }`}
                          style={{ width: `${milestone.progress}%` }}
                        />
                      </div>

                      {/* Task Summary */}
                      <div className="flex items-center gap-4 text-sm text-palladium">
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4" />
                          <span>{milestone.tasks.length} tasks</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>
                            {milestone.tasks.filter((t) => t.status === 'completed').length} completed
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {milestone.tasks.filter((t) => t.status === 'in-progress').length} in progress
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredMilestones.length === 0 && (
              <div className="text-center py-12 text-palladium">
                <Flag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No milestones found</p>
                {showDelayedOnly && <p className="text-sm mt-1">Try disabling "Show delayed only"</p>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-night-black">{tasks.length}</p>
                <p className="text-sm text-palladium">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-night-black">
                  {tasks.filter((t) => t.status === 'completed').length}
                </p>
                <p className="text-sm text-palladium">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-night-black">
                  {tasks.filter((t) => t.status === 'in-progress').length}
                </p>
                <p className="text-sm text-palladium">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-night-black">{delayAlerts.length}</p>
                <p className="text-sm text-palladium">Delayed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
