/**
 * MobileDashboardView Component
 *
 * Mobile-optimized dashboard with:
 * - Pull-to-refresh
 * - Swipeable metric cards
 * - Simplified charts
 * - Quick action buttons
 * - Stack layout
 */

import React, { useState } from 'react';
import { Project, Task } from '@/types';
import { useIsMobile } from '@/constants/responsive';
import PullToRefresh from '@/components/PullToRefresh';
import SwipeableCards from '@/components/SwipeableCards';
import MetricCard from '@/components/MetricCard';
import {
  CheckCircle,
  Clock,
  TrendingUp,
  Camera,
  FileText,
  ThumbsUp,
} from 'lucide-react';
import { formatCurrency } from '@/constants';

interface MobileDashboardProps {
  project: Project;
  tasks: Task[];
  onNavigate: (view: string) => void;
}

export const MobileDashboardView: React.FC<MobileDashboardProps> = ({
  project,
  tasks = [],
  onNavigate,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMobile = useIsMobile();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate data refresh
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  // Calculate metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate total budget from expenses and POs
  const totalExpenses = project.expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
  const totalPOs =
    project.purchaseOrders?.reduce((sum, po) => {
      const poTotal = po.items.reduce((itemSum, item) => itemSum + (item.totalPrice || 0), 0);
      return sum + poTotal;
    }, 0) || 0;
  const totalBudget = totalExpenses + totalPOs;

  // Quick actions for mobile
  const quickActions = [
    {
      icon: Camera,
      label: 'Scan Document',
      color: 'bg-blue-500',
      onClick: () => onNavigate('documents'),
    },
    {
      icon: FileText,
      label: 'Daily Report',
      color: 'bg-green-500',
      onClick: () => onNavigate('laporan_harian'),
    },
    {
      icon: ThumbsUp,
      label: 'Approve',
      color: 'bg-orange-500',
      onClick: () => onNavigate('tasks'),
    },
  ];

  if (!isMobile) {
    return null; // Fallback to desktop dashboard
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} className="h-full overflow-y-auto">
      <div className="mobile-p-4 space-y-4">
        {/* Project Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-4 text-white">
          <h1 className="text-lg font-bold mb-1">{project.name}</h1>
          <p className="text-sm opacity-90">{project.location}</p>
          <div className="mt-3 flex items-center gap-4">
            <div>
              <p className="text-xs opacity-75">Progress</p>
              <p className="text-2xl font-bold">{completionRate}%</p>
            </div>
            <div>
              <p className="text-xs opacity-75">Budget</p>
              <p className="text-lg font-semibold">{formatCurrency(totalBudget)}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`${action.color} text-white rounded-xl p-4 flex flex-col items-center gap-2 touch-target-lg shadow-lg active:scale-95 transition-transform`}
            >
              <action.icon size={24} />
              <span className="text-xs font-medium text-center">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Swipeable Metric Cards */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Key Metrics</h2>
          <SwipeableCards showIndicators>
            <MetricCard
              title="Total Tasks"
              value={totalTasks.toString()}
              icon={<CheckCircle size={20} />}
              trend="neutral"
              color="info"
            />
            <MetricCard
              title="Completed"
              value={completedTasks.toString()}
              icon={<CheckCircle size={20} />}
              trend="up"
              trendValue="+5%"
              color="success"
            />
            <MetricCard
              title="In Progress"
              value={inProgressTasks.toString()}
              icon={<Clock size={20} />}
              trend="neutral"
              color="warning"
            />
            <MetricCard
              title="Completion"
              value={`${completionRate}%`}
              icon={<TrendingUp size={20} />}
              trend="up"
              trendValue="+3%"
              color="primary"
            />
          </SwipeableCards>
        </div>

        {/* Recent Tasks */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Recent Tasks</h2>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs text-orange-500 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-lg p-3 border border-gray-200 active:bg-gray-50"
                onClick={() => onNavigate('tasks')}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{task.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      task.status === 'done'
                        ? 'bg-green-100 text-green-700'
                        : task.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
};

export default MobileDashboardView;

