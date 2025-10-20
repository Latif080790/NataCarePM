import React, { useState, useEffect, useMemo } from 'react';

import { Card } from './Card';
import { Button } from './Button';
import { LineChart } from './LineChart';
import { GaugeChart } from './GaugeChart';
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  Clock,
  Users,
  Shield,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Activity,
  Award,
  Zap,
  Download,
  RefreshCw
} from 'lucide-react';
import { KPIService } from '@/api/kpiService';
import { KPIMetrics, Task, RabItem, EVMMetrics } from '@/types';

interface EnhancedProgressTrackingProps {
  projectId: string;
  tasks: Task[];
  rabItems: RabItem[];
  actualCosts: { [taskId: string]: number };
  budgetAtCompletion: number;
  evmMetrics?: EVMMetrics;
  historicalKPIData?: { date: Date; metrics: KPIMetrics }[];
  onKPIUpdate?: (metrics: KPIMetrics) => void;
}

export const EnhancedProgressTracking: React.FC<EnhancedProgressTrackingProps> = ({
  projectId,
  tasks,
  rabItems,
  actualCosts,
  budgetAtCompletion,
  evmMetrics,
  historicalKPIData = [],
  onKPIUpdate
}) => {
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetrics | null>(null);
  const [kpiRatings, setKpiRatings] = useState<{ [key: string]: 'Excellent' | 'Good' | 'Fair' | 'Poor' }>({});
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'schedule' | 'quality' | 'resources' | 'risks'>('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1m');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    calculateKPIMetrics();
  }, [projectId, tasks, rabItems, actualCosts, evmMetrics]);

  const calculateKPIMetrics = async () => {
    setIsLoading(true);
    try {
      // Mock quality, resource, and risk data for demonstration
      const qualityData = {
        defects: Math.floor(Math.random() * 5),
        totalDeliverables: 20,
        reworkHours: Math.floor(Math.random() * 40),
        totalHours: 800
      };

      const resourceData = {
        allocatedHours: 1000,
        actualHours: 850,
        teamSize: 8,
        productivity: 95 + Math.random() * 20
      };

      const riskData = {
        totalRisks: 15,
        highRisks: 3,
        mitigatedRisks: 8,
        contingencyUsed: budgetAtCompletion * 0.15,
        contingencyTotal: budgetAtCompletion * 0.20
      };

      const metrics = KPIService.calculateKPIMetrics({
        tasks,
        rabItems,
        actualCosts,
        budgetAtCompletion,
        evmMetrics,
        qualityData,
        resourceData,
        riskData
      });

      setKpiMetrics(metrics);
      onKPIUpdate?.(metrics);

      // Calculate ratings and recommendations
      const ratings = KPIService.calculateKPIRatings(metrics);
      const recs = KPIService.generateKPIRecommendations(metrics, ratings);
      
      setKpiRatings(ratings);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error calculating KPI metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getRatingColor = (rating: 'Excellent' | 'Good' | 'Fair' | 'Poor') => {
    switch (rating) {
      case 'Excellent': return 'text-green-600 bg-green-100';
      case 'Good': return 'text-blue-600 bg-blue-100';
      case 'Fair': return 'text-yellow-600 bg-yellow-100';
      case 'Poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: 'Improving' | 'Stable' | 'Declining') => {
    switch (trend) {
      case 'Improving': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'Stable': return <Activity className="w-4 h-4 text-blue-600" />;
      case 'Declining': return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
  };

  const prepareKPITrendData = () => {
    if (historicalKPIData.length === 0) return { planned: [], actual: [] };

    return {
      planned: historicalKPIData.map((data, index) => ({
        day: index + 1,
        cost: data.metrics.overallHealthScore
      })),
      actual: historicalKPIData.map((data, index) => ({
        day: index + 1,
        cost: data.metrics.taskCompletionRate
      }))
    };
  };

  if (!kpiMetrics) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 text-gray-400 animate-spin" />
            <p className="text-gray-600">Calculating KPI metrics...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <span className="font-medium text-gray-900">
                Overall Health Score: {kpiMetrics.overallHealthScore}/100
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(kpiMetrics.performanceTrend)}
              <span className="text-sm text-gray-600">
                Trend: {kpiMetrics.performanceTrend}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="1w">1 Week</option>
              <option value="1m">1 Month</option>
              <option value="3m">3 Months</option>
              <option value="6m">6 Months</option>
            </select>

            <Button
              onClick={calculateKPIMetrics}
              disabled={isLoading}
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'financial', label: 'Financial', icon: DollarSign },
            { id: 'schedule', label: 'Schedule', icon: Clock },
            { id: 'quality', label: 'Quality', icon: CheckCircle },
            { id: 'resources', label: 'Resources', icon: Users },
            { id: 'risks', label: 'Risks', icon: Shield }
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
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Health Score Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Overall Health Score</h3>
              <div className="h-48">
                <GaugeChart 
                  value={kpiMetrics.overallHealthScore} 
                  max={100} 
                  thresholds={[60, 80, 90]} 
                />
              </div>
              <div className="text-center mt-4">
                <div className="text-2xl font-bold text-gray-900">
                  {kpiMetrics.overallHealthScore}/100
                </div>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  getRatingColor(kpiRatings.overallHealth || 'Fair')
                }`}>
                  {kpiRatings.overallHealth || 'Fair'}
                </div>
              </div>
            </Card>

            <div className="lg:col-span-2 space-y-4">
              {/* Key Performance Indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-600">Budget</h4>
                    <DollarSign className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatPercentage(kpiMetrics.budgetUtilization)}
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    getRatingColor(kpiRatings.budgetUtilization || 'Good')
                  }`}>
                    {kpiRatings.budgetUtilization || 'Good'}
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-600">Schedule</h4>
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatPercentage(kpiMetrics.taskCompletionRate)}
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    getRatingColor(kpiRatings.taskCompletion || 'Good')
                  }`}>
                    {kpiRatings.taskCompletion || 'Good'}
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-600">Quality</h4>
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatPercentage(kpiMetrics.qualityScore)}
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    getRatingColor(kpiRatings.qualityScore || 'Good')
                  }`}>
                    {kpiRatings.qualityScore || 'Good'}
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-600">Resources</h4>
                    <Users className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatPercentage(kpiMetrics.resourceUtilization)}
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    getRatingColor(kpiRatings.resourceUtilization || 'Good')
                  }`}>
                    {kpiRatings.resourceUtilization || 'Good'}
                  </div>
                </Card>
              </div>

              {/* Performance Trend Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
                <div className="h-48">
                  <LineChart data={prepareKPITrendData()} width={600} height={192} />
                </div>
              </Card>
            </div>
          </div>

          {/* Quick Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Key Achievements</h3>
              <div className="space-y-3">
                {kpiMetrics.taskCompletionRate > 80 && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-gray-700">
                      Excellent task completion rate: {formatPercentage(kpiMetrics.taskCompletionRate)}
                    </p>
                  </div>
                )}
                {kpiMetrics.qualityScore > 85 && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Award className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-gray-700">
                      High quality standards maintained: {formatPercentage(kpiMetrics.qualityScore)}
                    </p>
                  </div>
                )}
                {Math.abs(kpiMetrics.costVariancePercentage) < 5 && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-gray-700">
                      Budget on track with minimal variance
                    </p>
                  </div>
                )}
                {kpiMetrics.resourceUtilization > 85 && kpiMetrics.resourceUtilization < 105 && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Zap className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-gray-700">
                      Optimal resource utilization achieved
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Areas for Improvement</h3>
              <div className="space-y-3">
                {recommendations.slice(0, 4).map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Budget Utilization</h3>
                <DollarSign className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatPercentage(kpiMetrics.budgetUtilization)}
              </div>
              <p className="text-sm text-gray-600">
                {formatCurrency(Object.values(actualCosts).reduce((a, b) => a + b, 0))} of {formatCurrency(budgetAtCompletion)}
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Cost Variance</h3>
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
              <div className={`text-2xl font-bold ${
                kpiMetrics.costVariancePercentage >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {kpiMetrics.costVariancePercentage >= 0 ? '+' : ''}{formatPercentage(kpiMetrics.costVariancePercentage)}
              </div>
              <p className="text-sm text-gray-600">
                {kpiMetrics.costVariancePercentage >= 0 ? 'Under budget' : 'Over budget'}
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">ROI</h3>
                <Target className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(kpiMetrics.returnOnInvestment)}
              </div>
              <p className="text-sm text-gray-600">
                Expected return on investment
              </p>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Task Completion</h3>
                <CheckCircle className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatPercentage(kpiMetrics.taskCompletionRate)}
              </div>
              <p className="text-sm text-gray-600">
                {tasks.filter(t => t.status === 'done' || t.status === 'completed').length} of {tasks.length} tasks completed
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Schedule Variance</h3>
                <Clock className="w-4 h-4 text-gray-400" />
              </div>
              <div className={`text-2xl font-bold ${
                kpiMetrics.scheduleVariancePercentage >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {kpiMetrics.scheduleVariancePercentage >= 0 ? '+' : ''}{formatPercentage(kpiMetrics.scheduleVariancePercentage)}
              </div>
              <p className="text-sm text-gray-600">
                {kpiMetrics.scheduleVariancePercentage >= 0 ? 'Ahead of schedule' : 'Behind schedule'}
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Milestone Adherence</h3>
                <Target className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(kpiMetrics.milestoneAdherence)}
              </div>
              <p className="text-sm text-gray-600">
                Critical milestones on track
              </p>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'quality' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Quality Score</h3>
                <Award className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(kpiMetrics.qualityScore)}
              </div>
              <p className="text-sm text-gray-600">
                Overall quality rating
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Defect Rate</h3>
                <AlertTriangle className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-red-600">
                {formatPercentage(kpiMetrics.defectRate)}
              </div>
              <p className="text-sm text-gray-600">
                Defects per deliverable
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Rework</h3>
                <RefreshCw className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {formatPercentage(kpiMetrics.reworkPercentage)}
              </div>
              <p className="text-sm text-gray-600">
                Time spent on rework
              </p>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Resource Utilization</h3>
                <Users className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatPercentage(kpiMetrics.resourceUtilization)}
              </div>
              <p className="text-sm text-gray-600">
                Team capacity utilization
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Productivity Index</h3>
                <Zap className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(kpiMetrics.productivityIndex)}
              </div>
              <p className="text-sm text-gray-600">
                Team productivity level
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Team Efficiency</h3>
                <Activity className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(kpiMetrics.teamEfficiency)}
              </div>
              <p className="text-sm text-gray-600">
                Overall team efficiency
              </p>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'risks' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Risk Exposure</h3>
                <Shield className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {formatPercentage(kpiMetrics.riskExposure)}
              </div>
              <p className="text-sm text-gray-600">
                High-risk items exposure
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Issue Resolution</h3>
                <Clock className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {kpiMetrics.issueResolutionTime.toFixed(0)} days
              </div>
              <p className="text-sm text-gray-600">
                Average resolution time
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Contingency Usage</h3>
                <DollarSign className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {formatPercentage(kpiMetrics.contingencyUtilization)}
              </div>
              <p className="text-sm text-gray-600">
                Contingency reserves used
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
