import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { FinancialForecastingComponent } from '../components/FinancialForecastingComponent';
import { EVMDashboard } from '../components/EVMDashboard';
import { EnhancedProgressTracking } from '../components/EnhancedProgressTracking';
import EnhancedRabAhspView from './EnhancedRabAhspView';
import { 
  BarChart3, 
  TrendingUp, 
  Target,
  DollarSign,
  Users,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';

import { taskService } from '../api/taskService';
import { FinancialForecast, EVMMetrics, KPIMetrics, Task, RabItem, AhspData } from '../types';

export const IntegratedAnalyticsView: React.FC = () => {
  const { currentProject } = useProject();
  const [activeTab, setActiveTab] = useState<'overview' | 'forecasting' | 'evm' | 'kpis' | 'rab'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Data states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rabItems, setRabItems] = useState<RabItem[]>([]);
  const [ahspData] = useState<AhspData>({
    labors: {},
    materials: {},
    laborRates: {},
    materialPrices: {},
    materialUnits: {}
  });
  const [actualCosts, setActualCosts] = useState<{ [taskId: string]: number }>({});
  const [budgetAtCompletion, setBudgetAtCompletion] = useState(0);
  const [projectStartDate, setProjectStartDate] = useState(new Date());
  
  // Analytics states
  const [financialForecast, setFinancialForecast] = useState<FinancialForecast | null>(null);
  const [evmMetrics, setEvmMetrics] = useState<EVMMetrics | null>(null);
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetrics | null>(null);

  useEffect(() => {
    if (currentProject) {
      loadProjectData();
    }
  }, [currentProject, refreshKey]);

  const loadProjectData = async () => {
    if (!currentProject) return;
    
    setIsLoading(true);
    try {
      // Load tasks
      const projectTasks = await taskService.getTasksByProject(currentProject.id);
      setTasks(projectTasks);

      // Load RAB items (mock data for demonstration)
      const mockRabItems: RabItem[] = [
        {
          id: 1,
          no: "1",
          uraian: "Pekerjaan Persiapan",
          volume: 1,
          satuan: "LS",
          hargaSatuan: 50000000,
          kategori: "Persiapan",
          ahspId: "PREP001",
          duration: 5,
          dependsOn: undefined
        },
        {
          id: 2,
          no: "2",
          uraian: "Pekerjaan Struktur",
          volume: 100,
          satuan: "m3",
          hargaSatuan: 800000,
          kategori: "Struktur",
          ahspId: "STR001",
          duration: 30,
          dependsOn: 1
        },
        {
          id: 3,
          no: "3",
          uraian: "Pekerjaan Finishing",
          volume: 200,
          satuan: "m2",
          hargaSatuan: 350000,
          kategori: "Finishing",
          ahspId: "FIN001",
          duration: 20,
          dependsOn: 2
        }
      ];
      setRabItems(mockRabItems);

      // Calculate budget at completion
      const totalBudget = mockRabItems.reduce((sum, item) => sum + (item.volume * item.hargaSatuan), 0);
      setBudgetAtCompletion(totalBudget);

      // Mock actual costs
      const mockActualCosts: { [taskId: string]: number } = {};
      projectTasks.forEach(task => {
        mockActualCosts[task.id] = Math.random() * 20000000 + 5000000;
      });
      setActualCosts(mockActualCosts);

      // Set project start date
      setProjectStartDate(new Date(currentProject.startDate || Date.now()));

    } catch (error) {
      console.error('Error loading project data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleExportReport = () => {
    // Implement comprehensive report export
    console.log('Exporting comprehensive analytics report...');
  };

  const getOverallHealthStatus = () => {
    if (!kpiMetrics) return { status: 'Unknown', color: 'text-gray-600', icon: AlertTriangle };
    
    if (kpiMetrics.overallHealthScore >= 85) {
      return { status: 'Excellent', color: 'text-green-600', icon: CheckCircle };
    } else if (kpiMetrics.overallHealthScore >= 70) {
      return { status: 'Good', color: 'text-blue-600', icon: CheckCircle };
    } else if (kpiMetrics.overallHealthScore >= 55) {
      return { status: 'Fair', color: 'text-yellow-600', icon: AlertTriangle };
    } else {
      return { status: 'Poor', color: 'text-red-600', icon: AlertTriangle };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (!currentProject) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Project Selected</h2>
          <p className="text-gray-600">Please select a project to view analytics dashboard.</p>
        </Card>
      </div>
    );
  }

  const healthStatus = getOverallHealthStatus();
  const StatusIcon = healthStatus.icon;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Integrated Analytics Dashboard
            </h1>
            <p className="text-gray-600">
              Comprehensive project analysis for {currentProject.name}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-5 h-5 ${healthStatus.color}`} />
              <span className={`font-medium ${healthStatus.color}`}>
                {healthStatus.status}
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                disabled={isLoading}
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh All
              </Button>
              
              <Button onClick={handleExportReport}>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">Total Budget</h3>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(budgetAtCompletion)}
          </div>
          <p className="text-sm text-gray-600">
            Project budget allocation
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">EVM Health</h3>
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            {evmMetrics?.healthScore || 0}/100
          </div>
          <p className="text-sm text-gray-600">
            EVM performance score
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">Task Progress</h3>
            <Target className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {kpiMetrics?.taskCompletionRate.toFixed(1) || 0}%
          </div>
          <p className="text-sm text-gray-600">
            {tasks.filter(t => t.status === 'done' || t.status === 'completed').length} of {tasks.length} completed
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">Risk Level</h3>
            <AlertTriangle className="w-4 h-4 text-gray-400" />
          </div>
          <div className={`text-2xl font-bold ${
            (kpiMetrics?.riskExposure || 0) > 40 ? 'text-red-600' : 
            (kpiMetrics?.riskExposure || 0) > 25 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {evmMetrics?.performanceStatus || 'Unknown'}
          </div>
          <p className="text-sm text-gray-600">
            Current risk status
          </p>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'forecasting', label: 'Financial Forecasting', icon: TrendingUp },
              { id: 'evm', label: 'EVM Analysis', icon: Target },
              { id: 'kpis', label: 'KPI Dashboard', icon: Users },
              { id: 'rab', label: 'Enhanced RAB', icon: DollarSign }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Project Summary Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Financial Health</h3>
                  {financialForecast ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Forecast Accuracy:</span>
                        <span className="font-medium">{(financialForecast.accuracy * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Risk Level:</span>
                        <span className={`font-medium ${
                          financialForecast.riskAssessment.overallRiskLevel === 'Low' ? 'text-green-600' :
                          financialForecast.riskAssessment.overallRiskLevel === 'Medium' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {financialForecast.riskAssessment.overallRiskLevel}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Budget at Risk:</span>
                        <span className="font-medium">
                          {formatCurrency(financialForecast.riskAssessment.budgetAtRisk)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Loading financial forecast...</p>
                  )}
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">EVM Performance</h3>
                  {evmMetrics ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">CPI:</span>
                        <span className={`font-medium ${
                          evmMetrics.costPerformanceIndex >= 1.0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {evmMetrics.costPerformanceIndex.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">SPI:</span>
                        <span className={`font-medium ${
                          evmMetrics.schedulePerformanceIndex >= 1.0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {evmMetrics.schedulePerformanceIndex.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">EAC:</span>
                        <span className="font-medium">
                          {formatCurrency(evmMetrics.estimateAtCompletion)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Loading EVM metrics...</p>
                  )}
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">KPI Summary</h3>
                  {kpiMetrics ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Overall Health:</span>
                        <span className="font-medium">{kpiMetrics.overallHealthScore}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quality Score:</span>
                        <span className="font-medium">{kpiMetrics.qualityScore.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trend:</span>
                        <span className={`font-medium ${
                          kpiMetrics.performanceTrend === 'Improving' ? 'text-green-600' :
                          kpiMetrics.performanceTrend === 'Declining' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                          {kpiMetrics.performanceTrend}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Loading KPI metrics...</p>
                  )}
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    onClick={() => setActiveTab('forecasting')}
                    variant="outline"
                    className="h-20 flex-col"
                  >
                    <TrendingUp className="w-6 h-6 mb-2" />
                    <span>View Forecasting</span>
                  </Button>
                  
                  <Button
                    onClick={() => setActiveTab('evm')}
                    variant="outline"
                    className="h-20 flex-col"
                  >
                    <Target className="w-6 h-6 mb-2" />
                    <span>EVM Analysis</span>
                  </Button>
                  
                  <Button
                    onClick={() => setActiveTab('kpis')}
                    variant="outline"
                    className="h-20 flex-col"
                  >
                    <Users className="w-6 h-6 mb-2" />
                    <span>KPI Dashboard</span>
                  </Button>
                  
                  <Button
                    onClick={() => setActiveTab('rab')}
                    variant="outline"
                    className="h-20 flex-col"
                  >
                    <DollarSign className="w-6 h-6 mb-2" />
                    <span>Enhanced RAB</span>
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'forecasting' && tasks.length > 0 && (
            <FinancialForecastingComponent
              projectId={currentProject.id}
              currentBudget={budgetAtCompletion}
              historicalData={[]} // Mock historical data
              onForecastUpdate={setFinancialForecast}
            />
          )}

          {activeTab === 'evm' && tasks.length > 0 && (
            <EVMDashboard
              projectId={currentProject.id}
              tasks={tasks}
              rabItems={rabItems}
              actualCosts={actualCosts}
              projectStartDate={projectStartDate}
              budgetAtCompletion={budgetAtCompletion}
              onMetricsUpdate={setEvmMetrics}
            />
          )}

          {activeTab === 'kpis' && tasks.length > 0 && (
            <EnhancedProgressTracking
              projectId={currentProject.id}
              tasks={tasks}
              rabItems={rabItems}
              actualCosts={actualCosts}
              budgetAtCompletion={budgetAtCompletion}
              evmMetrics={evmMetrics || undefined}
              onKPIUpdate={setKpiMetrics}
            />
          )}

          {activeTab === 'rab' && (
            <EnhancedRabAhspView 
              items={rabItems} 
              ahspData={ahspData}
              projectLocation={currentProject?.location || 'Jakarta'}
            />
          )}
        </div>
      </div>
    </div>
  );
};