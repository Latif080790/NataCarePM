import React from 'react';
import { Card } from './Card';
import {
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Target,
  Activity,
} from 'lucide-react';

interface QuickStatsSummaryProps {
  activeProjects?: number;
  totalTasks?: number;
  completedTasks?: number;
  budget?: number;
  spent?: number;
  teamMembers?: number;
}

export const QuickStatsSummary: React.FC<QuickStatsSummaryProps> = ({
  activeProjects = 0,
  totalTasks = 0,
  completedTasks = 0,
  budget = 0,
  spent = 0,
  teamMembers = 0,
}) => {
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const budgetUtilization = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const pendingTasks = totalTasks - completedTasks;

  const stats = [
    {
      icon: <Target className="w-5 h-5 text-purple-600" />,
      label: 'Active Projects',
      value: activeProjects,
      color: 'from-purple-50 to-purple-100 border-purple-200',
      textColor: 'text-purple-700',
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      label: 'Task Completion',
      value: `${completionRate}%`,
      color: 'from-green-50 to-green-100 border-green-200',
      textColor: 'text-green-700',
    },
    {
      icon: <AlertCircle className="w-5 h-5 text-orange-600" />,
      label: 'Pending Tasks',
      value: pendingTasks,
      color: 'from-orange-50 to-orange-100 border-orange-200',
      textColor: 'text-orange-700',
    },
    {
      icon: <DollarSign className="w-5 h-5 text-blue-600" />,
      label: 'Budget Used',
      value: `${budgetUtilization}%`,
      color: 'from-blue-50 to-blue-100 border-blue-200',
      textColor: 'text-blue-700',
    },
    {
      icon: <Users className="w-5 h-5 text-indigo-600" />,
      label: 'Team Members',
      value: teamMembers,
      color: 'from-indigo-50 to-indigo-100 border-indigo-200',
      textColor: 'text-indigo-700',
    },
    {
      icon: <Activity className="w-5 h-5 text-pink-600" />,
      label: 'Performance Score',
      value: '85%',
      color: 'from-pink-50 to-pink-100 border-pink-200',
      textColor: 'text-pink-700',
    },
  ];

  return (
    <Card className="card-enhanced">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Quick Stats</h3>
            <p className="text-xs text-slate-600 font-medium">Project overview at a glance</p>
          </div>
        </div>

        <div className="flex items-center space-x-1 px-2 py-1 bg-green-50 rounded-lg border border-green-200">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-green-700">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl bg-gradient-to-br ${stat.color} border-2 transition-all hover:scale-105 hover:shadow-md cursor-pointer`}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">{stat.icon}</div>
              <div className="flex-1 min-w-0">
                <div className={`text-xl font-bold ${stat.textColor} mb-0.5`}>{stat.value}</div>
                <div className="text-xs text-slate-600 font-medium truncate">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Summary */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700">Overall Progress</span>
          <span className="text-xs font-bold text-indigo-600">{completionRate}%</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-600">
          <span className="font-medium">
            {completedTasks} of {totalTasks} tasks
          </span>
          <span className="font-medium">{pendingTasks} remaining</span>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <Clock className="w-3 h-3" />
          <span className="font-medium">Updated just now</span>
        </div>
        <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
          View Details →
        </button>
      </div>
    </Card>
  );
};
