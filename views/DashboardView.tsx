import React, { useState, useEffect } from 'react';

import { Project, Task, Expense, PurchaseOrder, User } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import QuickAccessPanel from '../components/QuickAccessPanel';
import MetricCard from '../components/MetricCard';
import ProgressRing from '../components/ProgressRing';
import SimpleBarChart from '../components/SimpleBarChart';
import { SCurveChart } from '../components/SCurveChart';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { AIInsightsPanel } from '../components/AIInsightsPanel';
import { MonitoringAlertsPanel } from '../components/MonitoringAlertsPanel';
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
import { formatCurrency } from '../constants';

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
        {/* Header Section with Project Selector */}
        <div className="layout-header glass-enhanced rounded-2xl mb-6 p-4 md:p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between w-full gap-4">
            <div className="flex-1 w-full lg:w-auto">
              <BreadcrumbNavigation items={breadcrumbItems} className="mb-3" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl lg:text-display-2 gradient-text">Enterprise Command Center</h1>
                  <p className="text-xs md:text-sm text-body-small">
                    Terakhir diperbarui: {lastUpdated.toLocaleTimeString('id-ID')}
                  </p>
                </div>
                
                {/* Project Selector Dropdown */}
                {projects.length > 0 && (
                  <div className="relative w-full sm:w-auto">
                    <button
                      onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                      className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/30 rounded-lg transition-all duration-200 w-full sm:w-auto justify-between sm:justify-start"
                      aria-label="Select project"
                      aria-expanded={showProjectDropdown}
                    >
                      <span className="text-sm font-semibold text-slate-200">
                        {currentProject?.name || 'Select Project'}
                      </span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showProjectDropdown && (
                      <div className="absolute top-full mt-2 right-0 w-full sm:w-80 bg-slate-800 border border-slate-600/50 rounded-lg shadow-2xl z-50 max-h-64 overflow-y-auto">
                        {projects.map((project, index) => (
                          <button
                            key={project.id}
                            onClick={() => {
                              setSelectedProjectIndex(index);
                              setShowProjectDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-slate-700/50 transition-colors ${
                              index === selectedProjectIndex ? 'bg-orange-500/10 border-l-2 border-orange-500' : ''
                            }`}
                            aria-label={`Select ${project.name}`}
                          >
                            <div className="text-sm font-medium text-slate-200">{project.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{project.location}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Button
                onClick={handleRefresh}
                loading={isRefreshing}
                disabled={isRefreshing}
                className="btn-secondary flex-1 sm:flex-initial"
                aria-label="Refresh dashboard data"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button 
                onClick={() => onNavigate('laporan')} 
                className="btn-primary flex-1 sm:flex-initial"
                aria-label="View reports"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Reports</span>
              </Button>
            </div>
          </div>
        </div>

        {/* S-Curve Chart (Rencana vs Realisasi) */}
        <Card className="card-enhanced mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-lg md:text-xl lg:text-heading-2 visual-primary flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <span>S-Curve Analysis</span>
              </h2>
              <p className="text-xs md:text-sm text-body-small mt-1">Progress Rencana vs Realisasi</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-xs text-slate-400">Rencana</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs text-slate-400">Realisasi</span>
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
              <h2 className="text-lg md:text-xl lg:text-heading-2 visual-primary">Key Performance Indicators</h2>
              <div className="flex items-center space-x-2 text-xs md:text-sm text-body-small">
                <Clock className="w-4 h-4 text-palladium" />
                <span className="hidden sm:inline">Real-time data</span>
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
              <h3 className="text-heading-2 visual-primary flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <span>Task Performance</span>
              </h3>
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-success-bg">
                <Activity className="w-4 h-4 text-success" />
                <span className="text-caption text-success">Analytics</span>
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
                    <div className="text-2xl font-bold text-slate-100">{taskCompletionRate}%</div>
                    <span className="text-xs text-slate-400">Completion</span>
                  </div>
                </ProgressRing>
              </div>

              {/* Task Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="text-lg font-bold text-green-400">{completedTasks}</div>
                  <div className="text-xs text-slate-400 mt-1">Completed</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="text-lg font-bold text-orange-400">{activeTasks}</div>
                  <div className="text-xs text-slate-400 mt-1">In Progress</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="text-lg font-bold text-red-400">{overdueTasks}</div>
                  <div className="text-xs text-slate-400 mt-1">Overdue</div>
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
        
        {/* Enhanced Header Section */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl gradient-bg-primary flex items-center justify-center shadow-lg floating">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-responsive-2xl font-bold gradient-text mb-2">
                    🚀 Enterprise Command Center
                  </h1>
                  <p className="text-lg text-palladium font-medium">
                    Advanced Analytics • Real-time Insights • Strategic KPIs • NataCarePM v2.0
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center space-x-2 glass rounded-xl px-4 py-3 shadow-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <Zap className="w-4 h-4 text-green-600" />
                <span className="text-green-700 font-semibold">Live System</span>
              </div>
              
              <div className="flex items-center space-x-2 glass rounded-xl px-4 py-3 shadow-sm">
                <Eye className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700 font-semibold">Monitoring Active</span>
              </div>
              
              <Button 
                onClick={handleRefresh}
                className="btn-primary gap-2 px-6 py-3 lift-on-hover"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Analytics</span>
              </Button>
            </div>
          </div>
        </div>

          {/* Financial Overview */}
          <Card className="card-enhanced">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-heading-2 visual-primary flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-essence to-no-way-rose/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-precious-persimmon" />
                </div>
                <span>Financial Overview</span>
              </h3>
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-success-bg">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-caption text-success">Tracking</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Total Budget Card */}
              <div className="glass-subtle rounded-xl p-5">
                <div className="text-center mb-4">
                  <span className="text-sm font-semibold text-slate-400 block mb-2">Total Budget</span>
                  <div className="text-3xl font-bold text-slate-100 mb-1">
                    {totalBudget > 0 ? formatCurrency(totalBudget) : 'Rp 0'}
                  </div>
                  <div className="text-xs text-slate-500">Combined allocation</div>
                </div>
                
                {/* Budget Progress Bar */}
                {totalBudget > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                      <span>Spent: {formatCurrency(actualSpent)}</span>
                      <span>{budgetUtilization}%</span>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
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
                      <span className="text-xs text-slate-500">
                        Remaining: {formatCurrency(Math.max(budgetRemaining, 0))}
                      </span>
                      {budgetStatus === 'warning' && (
                        <span className="text-xs text-red-400 font-semibold">⚠️ Over Budget</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Breakdown Chart */}
              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-400 mb-3">Budget Breakdown</div>
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
              <h3 className="text-heading-2 visual-primary flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <span>Team Overview</span>
              </h3>
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-info-bg">
                <Activity className="w-4 h-4 text-info" />
                <span className="text-caption text-info">Live</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Team Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center glass-subtle rounded-xl p-4 border border-purple-500/20">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-400" />
                  </div>
                  <p className="text-xs text-slate-400 mb-1">Active Members</p>
                  <p className="text-2xl font-bold text-slate-100">{users.length || 0}</p>
                </div>
                <div className="text-center glass-subtle rounded-xl p-4 border border-green-500/20">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <p className="text-xs text-slate-400 mb-1">Projects</p>
                  <p className="text-2xl font-bold text-green-400">{totalProjects || 1}</p>
                </div>
              </div>
              
              {/* Performance Score */}
              <div className="glass-subtle rounded-xl p-5 border border-orange-500/20">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-slate-300">Performance Score</span>
                  <span className="text-2xl font-bold text-orange-400">85%</span>
                </div>
                
                <div className="space-y-2">
                  <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full transition-all duration-500"
                      style={{ width: '85%' }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-slate-500">
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 whitespace-component">
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
