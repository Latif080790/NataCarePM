import React from 'react';
import { Project, Task, Expense, PurchaseOrder, User } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Target,
  BarChart3,
  RefreshCw,
  Eye
} from 'lucide-react';
import { formatCurrency } from '../constants';

interface DashboardViewProps {
  projects: Project[];
  tasks: Task[];
  expenses: Expense[];
  purchaseOrders: PurchaseOrder[];
  users: User[];
}

const DashboardView: React.FC<DashboardViewProps> = ({
  projects = [],
  tasks = [],
  expenses = [],
  purchaseOrders = [],
  users = []
}) => {
  const totalProjects = projects.length;
  const activeTasks = tasks.filter(task => task.status === 'in-progress' || task.status === 'todo').length;
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const totalPOs = purchaseOrders.reduce((sum, po) => {
    const poTotal = po.items.reduce((itemSum, item) => itemSum + item.totalPrice, 0);
    return sum + poTotal;
  }, 0);
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const handleRefresh = () => {
    console.log('Dashboard refreshed');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div className="flex-1">
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                🚀 Enterprise Command Center
              </h1>
              <p className="text-lg text-gray-700 font-medium leading-relaxed">
                Advanced Analytics • Real-time Insights • Strategic KPIs • NataCarePM v2.0
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-lg shadow-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-medium">Live System</span>
              </div>
              <div className="flex items-center space-x-2 bg-blue-100 px-4 py-2 rounded-lg shadow-sm">
                <Eye className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700 font-medium">Monitoring Active</span>
              </div>
              <Button 
                onClick={handleRefresh}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 shadow-lg transition-all duration-300"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Analytics</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          <Card className="p-6 bg-white border-gray-200 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Projects</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{totalProjects}</p>
              </div>
              <Target className="w-12 h-12 text-blue-500 opacity-80" />
            </div>
          </Card>

          <Card className="p-6 bg-white border-gray-200 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Tasks</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{activeTasks}</p>
              </div>
              <BarChart3 className="w-12 h-12 text-green-500 opacity-80" />
            </div>
          </Card>

          <Card className="p-6 bg-white border-gray-200 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Expenses</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{formatCurrency(totalExpenses)}</p>
              </div>
              <DollarSign className="w-12 h-12 text-orange-500 opacity-80" />
            </div>
          </Card>

          <Card className="p-6 bg-white border-gray-200 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Purchase Orders</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{formatCurrency(totalPOs)}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-500 opacity-80" />
            </div>
          </Card>

          <Card className="p-6 bg-white border-gray-200 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Team Members</p>
                <p className="text-3xl font-bold text-indigo-600 mt-1">{users.length}</p>
              </div>
              <Users className="w-12 h-12 text-indigo-500 opacity-80" />
            </div>
          </Card>
        </div>

        {/* Performance Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <div className="mb-6">
              <h3 className="text-2xl font-bold flex items-center text-blue-800">
                <BarChart3 className="w-7 h-7 mr-3 text-blue-600" />
                Project Performance
              </h3>
            </div>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-blue-800 font-semibold">Task Completion Rate</span>
                  <span className="text-3xl font-bold text-blue-600">{taskCompletionRate}%</span>
                </div>
                <div className="mt-2 bg-blue-100 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${taskCompletionRate}%` }}
                  ></div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-blue-600">Completed</p>
                    <p className="text-2xl font-bold text-blue-700">{completedTasks}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-blue-600">In Progress</p>
                    <p className="text-2xl font-bold text-blue-700">{activeTasks}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
            <div className="mb-6">
              <h3 className="text-2xl font-bold flex items-center text-emerald-800">
                <DollarSign className="w-7 h-7 mr-3 text-emerald-600" />
                Financial Overview
              </h3>
            </div>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-800 font-semibold">Total Budget</span>
                  <span className="text-3xl font-bold text-emerald-600">{formatCurrency(totalExpenses + totalPOs)}</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-emerald-600">Expenses</p>
                    <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalExpenses)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-emerald-600">Purchase Orders</p>
                    <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalPOs)}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-500">
            🚀 Enterprise Command Center • AI-Powered Analytics • Real-time Intelligence • Strategic Insights • NataCarePM v2.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;