import React, { useState, useEffect } from 'react';
import { Project, Task, Expense, PurchaseOrder, User } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import QuickAccessPanel from '../components/QuickAccessPanel';
import MetricCard from '../components/MetricCard';
import ProgressRing from '../components/ProgressRing';
import SimpleBarChart from '../components/SimpleBarChart';
import { LineChart } from '../components/LineChart';
import { SCurveChart } from '../components/SCurveChart';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
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
  ArrowUp,
  ArrowDown,
  Calendar,
  Clock,
  AlertTriangle,
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
    const poTotal = po.items.reduce((itemSum, item) => itemSum + item.totalPrice, 0);
    return sum + poTotal;
  }, 0);
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  
  // Performance metrics
  const overdueTasks = tasks.filter(task => {
    const dueDate = new Date(task.dueDate);
    return dueDate < new Date() && task.status !== 'done';
  }).length;
  
  const totalBudget = totalExpenses + totalPOs;
  const budgetUtilization = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0;

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

          {/* Performance Analytics */}
          <Card className="card-enhanced">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-heading-2 visual-primary">Task Performance</h3>
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-success-bg">
                <BarChart3 className="w-4 h-4 text-success" />
                <span className="text-caption text-success">Analytics</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center mb-6">
              <ProgressRing
                progress={taskCompletionRate}
                size="lg"
                color="primary"
              >
                <span className="text-caption">Completion</span>
              </ProgressRing>
            </div>

            <SimpleBarChart
              data={taskStatusData}
              showValues={true}
            />
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
                Financial Overview
              </h3>
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-success-bg">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-caption text-success">Tracking</span>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="glass-subtle rounded-xl p-6 text-center">
                <div className="mb-4">
                  <span className="text-body font-semibold visual-secondary">Total Budget</span>
                </div>
                <div className="text-heading-1 visual-accent mb-2">
                  {formatCurrency(totalBudget)}
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-precious-persimmon"></div>
                  <span className="text-body-small">Combined allocation</span>
                </div>
              </div>

              <SimpleBarChart
                data={budgetData}
                showValues={true}
              />
            </div>
          </Card>

          {/* Team Performance */}
          <Card className="card-enhanced">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-heading-2 visual-primary flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-essence to-no-way-rose/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-precious-persimmon" />
                </div>
                Team Overview
              </h3>
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-info-bg">
                <Activity className="w-4 h-4 text-info" />
                <span className="text-caption text-info">Live</span>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="grid-cards-2">
                <div className="text-center glass-subtle rounded-xl p-4">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-gradient-to-br from-violet-essence to-no-way-rose/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-precious-persimmon" />
                  </div>
                  <p className="text-body-small mb-1">Active Members</p>
                  <p className="text-heading-3 visual-primary">{users.length}</p>
                </div>
                <div className="text-center glass-subtle rounded-xl p-4">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-gradient-to-br from-violet-essence to-no-way-rose/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                  <p className="text-body-small mb-1">Projects</p>
                  <p className="text-heading-3 visual-success">{totalProjects}</p>
                </div>
              </div>
              
              <div className="glass-subtle rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-body font-semibold">Performance Score</span>
                  <span className="text-heading-3 visual-accent">85%</span>
                </div>
                
                <div className="relative">
                  <div className="w-full bg-violet-essence rounded-full h-3 mb-2">
                    <div 
                      className="gradient-bg-primary h-3 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                      style={{ width: '85%' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-caption">
                    <span>Poor</span>
                    <span>Good</span>
                    <span>Excellent</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
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