import React, { useState, useEffect } from 'react';

import { Project, Task, Expense, PurchaseOrder, User } from '@/types';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';
import QuickAccessPanel from '@/components/QuickAccessPanel';
import MetricCard from '@/components/MetricCard';
import ProgressRing from '@/components/ProgressRing';
import SimpleBarChart from '@/components/SimpleBarChart';
import { SCurveChart } from '@/components/SCurveChart';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { MonitoringAlertsPanel } from '@/components/MonitoringAlertsPanel';
import { QuickStatsSummary } from '@/components/QuickStatsSummary';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Target,
  BarChart3,
  RefreshCw,
  Eye,
  Activity,
  Zap,
  Award,
  Clock,
  CheckCircle,
  ChevronDown
} from 'lucide-react';
import { formatCurrency } from '@/constants';

interface DashboardViewProps {
  projects: Project[];
  tasks: Task[];
  expenses: Expense[];
  purchaseOrders: PurchaseOrder[];
  users: User[];
  onNavigate?: (viewName: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  projects = [],
  tasks = [],
  expenses = [],
  purchaseOrders = [],
  users = [],
  onNavigate = () => {}
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  // Simulate initial data load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Get current project or use first project
  const currentProject = projects[selectedProjectIndex] || projects[0];

  // S-Curve data (Planned vs Actual)
  const sCurveData = [
    { month: 'Jan', planned: 5, actual: 4 },
    { month: 'Feb', planned: 15, actual: 12 },
    { month: 'Mar', planned: 30, actual: 28 },
    { month: 'Apr', planned: 50, actual: 45 },
    { month: 'May', planned: 70, actual: 65 },
    { month: 'Jun', planned: 85, actual: 75 },
    { month: 'Jul', planned: 95, actual: 85 },
    { month: 'Aug', planned: 100, actual: 92 }
  ];

  // Enhanced metrics calculations
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.id).length; // All projects are considered active for now
  const activeTasks = tasks.filter(task => task.status === 'in-progress' || task.status === 'todo').length;
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const totalPOs = purchaseOrders.reduce((sum, po) => {
    const poTotal = po.items.reduce((itemSum, item) => itemSum + (item.totalPrice || 0), 0);
    return sum + poTotal;
  }, 0);
  
  // Calculate total budget - fallback to calculated expenses if no budget defined
  const totalBudget = totalExpenses + totalPOs;
  const actualSpent = totalExpenses + totalPOs;
  
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  
  // Performance metrics
  const overdueTasks = tasks.filter(task => {
    const dueDate = new Date(task.dueDate);
    return dueDate < new Date() && task.status !== 'done';
  }).length;
  
  const budgetUtilization = totalBudget > 0 ? Math.round((actualSpent / totalBudget) * 100) : 0;
  const budgetRemaining = totalBudget - actualSpent;
  const budgetStatus = budgetUtilization > 90 ? 'warning' : budgetUtilization > 75 ? 'caution' : 'good';

  // Chart data
  const taskStatusData = [
    { label: 'Completed', value: completedTasks, color: '#10b981' },
    { label: 'In Progress', value: activeTasks, color: '#F87941' },
    { label: 'Overdue', value: overdueTasks, color: '#ef4444' }
  ];

  const budgetData = [
    { label: 'Expenses', value: totalExpenses, color: '#F87941' },
    { label: 'Purchase Orders', value: totalPOs, color: '#F9B095' }
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsRefreshing(false);
    console.log('Dashboard refreshed');
  };

  const breadcrumbItems = [
    { name: 'Home', onClick: () => onNavigate('dashboard') },
    { name: 'Dashboard' }
  ];

  if (isLoading) {
    return (
      <div className="layout-page">
        <div className="layout-content spacing-section">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="layout-page">
      <div className="layout-content spacing-section">
        {/* Compact Header with Project Selector */}
        <div className="glass-enhanced rounded-xl mb-6 p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Project Selector - Prominent Position */}
            {projects.length > 0 && (
              <div className="relative flex-1 max-w-md">
                <button
                  onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                  className="flex items-center justify-between w-full px-4 py-2.5 bg-white border-2 border-slate-200 hover:border-orange-400 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  aria-label="Select project"
                  aria-expanded={showProjectDropdown}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Target className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <div className="text-left flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-800 truncate">
                        {currentProject?.name || 'Select Project'}
                      </div>
                      {currentProject?.location && (
                        <div className="text-xs text-slate-500 truncate">{currentProject.location}</div>
                      )}
                    </div>
                  </div>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform flex-shrink-0 ml-2 ${showProjectDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showProjectDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowProjectDropdown(false)}
                    />
                    <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto custom-scrollbar">
                      {projects.map((project, index) => (
                        <button
                          key={project.id}
                          onClick={() => {
                            setSelectedProjectIndex(index);
                            setShowProjectDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b border-slate-100 last:border-b-0 ${
                            index === selectedProjectIndex ? 'bg-orange-50 border-l-3 border-l-orange-500' : ''
                          }`}
                          aria-label={`Select ${project.name}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-slate-800 truncate">{project.name}</div>
                              <div className="text-xs text-slate-500 mt-0.5 truncate">{project.location}</div>
                            </div>
                            {index === selectedProjectIndex && (
                              <CheckCircle className="w-4 h-4 text-orange-500 flex-shrink-0 ml-2" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                loading={isRefreshing}
                disabled={isRefreshing}
                className="btn-secondary h-10 px-3"
                aria-label="Refresh dashboard data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                onClick={() => onNavigate('laporan')} 
                className="btn-primary h-10 px-4"
                aria-label="View reports"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Reports</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Enterprise Command Center - Compact Version */}
        <Card className="card-enhanced mb-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Enterprise Command Center</h2>
                <p className="text-xs text-slate-500">
                  Last update: {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 px-2 py-1 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-700">Live</span>
              </div>
            </div>
          </div>
          
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 glass-subtle rounded-lg">
              <Target className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-800">{activeProjects}</div>
              <div className="text-xs text-slate-600">Active Projects</div>
            </div>
            <div className="text-center p-3 glass-subtle rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-800">{taskCompletionRate}%</div>
              <div className="text-xs text-slate-600">Task Completion</div>
            </div>
            <div className="text-center p-3 glass-subtle rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-800">{budgetUtilization}%</div>
              <div className="text-xs text-slate-600">Budget Used</div>
            </div>
            <div className="text-center p-3 glass-subtle rounded-lg">
              <Users className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-800">{users.length}</div>
              <div className="text-xs text-slate-600">Team Members</div>
            </div>
          </div>
        </Card>

        {/* S-Curve Chart (Rencana vs Realisasi) */}
        <Card className="card-enhanced mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <span>S-Curve Analysis</span>
              </h2>
              <p className="text-sm text-slate-600 mt-1">Progress Rencana vs Realisasi</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm text-slate-700 font-medium">Rencana</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-slate-700 font-medium">Realisasi</span>
              </div>
            </div>
          </div>
          
          <div className="h-64 sm:h-72">
            <SCurveChart data={sCurveData} />
          </div>
        </Card>

        {/* Quick Access Panel */}
        <div className="whitespace-component">
          <QuickAccessPanel onNavigate={onNavigate} />
        </div>

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 whitespace-component">
          {/* Key Performance Indicators */}
          <Card className="card-enhanced col-span-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">Key Performance Indicators</h2>
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline font-medium">Real-time data</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
              <MetricCard
                title="Active Projects"
                value={activeProjects}
                subValue={`${totalProjects} total projects`}
                trend="up"
                trendValue="+12%"
                icon={<Target className="w-6 h-6" />}
                color="primary"
              />

              <MetricCard
                title="Active Tasks"
                value={activeTasks}
                subValue={`${overdueTasks} overdue`}
                trend="down"
                trendValue="-3%"
                icon={<Activity className="w-6 h-6" />}
                color="info"
              />

              <MetricCard
                title="Completion Rate"
                value={`${taskCompletionRate}%`}
                subValue={`${completedTasks} completed`}
                trend="up"
                trendValue="+8%"
                icon={<Award className="w-6 h-6" />}
                color="success"
              />

              <MetricCard
                title="Budget Used"
                value={`${budgetUtilization}%`}
                subValue={formatCurrency(totalBudget)}
                trend="up"
                trendValue="+15%"
                icon={<DollarSign className="w-6 h-6" />}
                color="warning"
              />
            </div>
          </Card>

          {/* Task Performance */}
          <Card className="card-enhanced">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <span>Task Performance</span>
              </h3>
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-green-50 border border-green-200">
                <Activity className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-700 font-semibold">Analytics</span>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Completion Ring */}
              <div className="flex items-center justify-center py-4">
                <ProgressRing
                  progress={taskCompletionRate}
                  size="lg"
                  color="primary"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-800">{taskCompletionRate}%</div>
                    <span className="text-xs text-slate-600">Completion</span>
                  </div>
                </ProgressRing>
              </div>

              {/* Task Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="text-xl font-bold text-green-600">{completedTasks}</div>
                  <div className="text-xs text-slate-600 mt-1">Completed</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-xl font-bold text-blue-600">{activeTasks}</div>
                  <div className="text-xs text-slate-600 mt-1">In Progress</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="text-xl font-bold text-red-600">{overdueTasks}</div>
                  <div className="text-xs text-slate-600 mt-1">Overdue</div>
                </div>
              </div>

              {/* Task Status Chart */}
              <div className="mt-4">
                <SimpleBarChart
                  data={taskStatusData}
                  showValues={true}
                />
              </div>
            </div>
          </Card>

          {/* Financial Overview */}
          <Card className="card-enhanced">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                </div>
                <span>Financial Overview</span>
              </h3>
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-green-50 border border-green-200">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-700 font-semibold">Tracking</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Total Budget Card */}
              <div className="glass-subtle rounded-xl p-5 border border-orange-200">
                <div className="text-center mb-4">
                  <span className="text-sm font-semibold text-slate-600 block mb-2">Total Budget</span>
                  <div className="text-3xl font-bold text-slate-800 mb-1">
                    {totalBudget > 0 ? formatCurrency(totalBudget) : 'Rp 0'}
                  </div>
                  <div className="text-xs text-slate-500">Combined allocation</div>
                </div>
                
                {/* Budget Progress Bar */}
                {totalBudget > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-600 mb-2 font-medium">
                      <span>Spent: {formatCurrency(actualSpent)}</span>
                      <span>{budgetUtilization}%</span>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          budgetStatus === 'warning' ? 'bg-red-500' : 
                          budgetStatus === 'caution' ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-slate-600 font-medium">
                        Remaining: {formatCurrency(Math.max(budgetRemaining, 0))}
                      </span>
                      {budgetStatus === 'warning' && (
                        <span className="text-xs text-red-600 font-bold">⚠️ Over Budget</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Breakdown Chart */}
              <div className="mt-4">
                <div className="text-sm font-semibold text-slate-700 mb-3">Budget Breakdown</div>
                <SimpleBarChart
                  data={budgetData}
                  showValues={true}
                />
              </div>
            </div>
          </Card>

          {/* Team Overview */}
          <Card className="card-enhanced">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <span>Team Overview</span>
              </h3>
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-blue-700 font-semibold">Live</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Team Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center glass-subtle rounded-xl p-4 border border-purple-200">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-xs text-slate-600 mb-1 font-medium">Active Members</p>
                  <p className="text-2xl font-bold text-slate-800">{users.length || 0}</p>
                </div>
                <div className="text-center glass-subtle rounded-xl p-4 border border-green-200">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-xs text-slate-600 mb-1 font-medium">Projects</p>
                  <p className="text-2xl font-bold text-green-600">{totalProjects || 1}</p>
                </div>
              </div>
              
              {/* Performance Score */}
              <div className="glass-subtle rounded-xl p-5 border border-orange-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-slate-700">Performance Score</span>
                  <span className="text-2xl font-bold text-orange-600">85%</span>
                </div>
                
                <div className="space-y-2">
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full transition-all duration-500"
                      style={{ width: '85%' }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>Poor</span>
                    <span>Good</span>
                    <span>Excellent</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* AI-Powered Analytics & Monitoring Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 whitespace-component">
          {/* AI Insights Panel */}
          <AIInsightsPanel 
            projectData={currentProject}
            onRefresh={handleRefresh}
          />
          
          {/* Monitoring & Alerts Panel */}
          <MonitoringAlertsPanel 
            onActionClick={(alert) => {
              console.log('Alert action:', alert);
              // Handle alert actions based on type
              if (alert.action === 'review-budget') {
                onNavigate('keuangan');
              } else if (alert.action === 'view-tasks') {
                onNavigate('tugas');
              } else if (alert.action === 'view-report') {
                onNavigate('laporan');
              }
            }}
          />

          {/* Quick Stats Summary */}
          <QuickStatsSummary
            activeProjects={activeProjects}
            totalTasks={tasks.length}
            completedTasks={completedTasks}
            budget={totalBudget}
            spent={actualSpent}
            teamMembers={users.length}
          />
        </div>

        {/* Recent Activity */}
        <Card className="card-enhanced whitespace-component">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-heading-2 visual-primary">Recent Activity</h3>
            <Button onClick={() => onNavigate('activity')} className="btn-secondary">
              View All Activity
            </Button>
          </div>
          
          <div className="space-y-4">
            {/* Placeholder activity items */}
            <div className="flex items-center space-x-4 p-4 glass-subtle rounded-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-essence to-no-way-rose/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-precious-persimmon" />
              </div>
              <div className="flex-1">
                <p className="text-body font-medium">New task created: "Update dashboard components"</p>
                <p className="text-body-small">2 minutes ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 glass-subtle rounded-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-essence to-no-way-rose/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-precious-persimmon" />
              </div>
              <div className="flex-1">
                <p className="text-body font-medium">Team member John Doe joined Project Alpha</p>
                <p className="text-body-small">1 hour ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 glass-subtle rounded-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-essence to-no-way-rose/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-precious-persimmon" />
              </div>
              <div className="flex-1">
                <p className="text-body font-medium">Budget approved for Q4 initiatives</p>
                <p className="text-body-small">3 hours ago</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center whitespace-section">
          <div className="glass-enhanced rounded-3xl p-8 mx-auto max-w-4xl">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-2xl gradient-bg-primary flex items-center justify-center floating">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-heading-1 gradient-text">NataCarePM Enterprise</h3>
            </div>
            <p className="text-body-large visual-secondary">
              Professional Project Management • Real-time Analytics • Enterprise Grade Security
            </p>
            <div className="flex items-center justify-center space-x-6 mt-6">
              <div className="flex items-center space-x-2 text-body-small">
                <Zap className="w-4 h-4 text-success" />
                <span>Real-time Data</span>
              </div>
              <div className="flex items-center space-x-2 text-body-small">
                <Award className="w-4 h-4 text-precious-persimmon" />
                <span>Enterprise Grade</span>
              </div>
              <div className="flex items-center space-x-2 text-body-small">
                <Activity className="w-4 h-4 text-info" />
                <span>Live Monitoring</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
