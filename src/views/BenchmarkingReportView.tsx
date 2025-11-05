import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Award, 
  AlertTriangle,
  CheckCircle,
  Info,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/Card';
import { Button } from '@/components/Button';
import { Select } from '@/components/FormControls';

import { useProject } from '@/contexts/ProjectContext';
import { advancedBenchmarkingService } from '@/api';
import type { ProjectBenchmarkComparison, IndustryInsight } from '@/api/advancedBenchmarkingService';

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// Ranking badge component
const RankingBadge: React.FC<{ ranking: string }> = ({ ranking }) => {
  const rankingStyles = {
    excellent: 'bg-success/20 text-success border-success',
    good: 'bg-info/20 text-info border-info',
    average: 'bg-warning/20 text-warning border-warning',
    below_average: 'bg-orange-500/20 text-orange-500 border-orange-500',
    poor: 'bg-destructive/20 text-destructive border-destructive'
  };

  const rankingLabels = {
    excellent: 'Excellent',
    good: 'Good',
    average: 'Average',
    below_average: 'Below Average',
    poor: 'Poor'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${rankingStyles[ranking as keyof typeof rankingStyles] || 'bg-gray-200 text-gray-800 border-gray-300'}`}>
      {rankingLabels[ranking as keyof typeof rankingLabels] || ranking}
    </span>
  );
};

// Trend indicator component
const TrendIndicator: React.FC<{ value: number }> = ({ value }) => {
  if (value > 2) {
    return <TrendingUp className="w-4 h-4 text-success" />;
  } else if (value < -2) {
    return <TrendingDown className="w-4 h-4 text-destructive" />;
  } else {
    return <Minus className="w-4 h-4 text-gray-500" />;
  }
};

// Metric performance badge
const PerformanceBadge: React.FC<{ performance: string }> = ({ performance }) => {
  const performanceStyles = {
    excellent: 'bg-success/20 text-success',
    good: 'bg-info/20 text-info',
    average: 'bg-warning/20 text-warning',
    below_average: 'bg-orange-500/20 text-orange-500',
    poor: 'bg-destructive/20 text-destructive'
  };

  const performanceLabels = {
    excellent: 'Excellent',
    good: 'Good',
    average: 'Average',
    below_average: 'Below Avg',
    poor: 'Poor'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${performanceStyles[performance as keyof typeof performanceStyles] || 'bg-gray-200 text-gray-800'}`}>
      {performanceLabels[performance as keyof typeof performanceLabels] || performance}
    </span>
  );
};

// Insight card component
const InsightCard: React.FC<{ insight: IndustryInsight }> = ({ insight }) => {
  const getIcon = () => {
    switch (insight.category) {
      case 'best_practice':
        return <Award className="w-5 h-5 text-success" />;
      case 'risk':
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'opportunity':
        return <TrendingUp className="w-5 h-5 text-info" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getImpactColor = () => {
    switch (insight.impact) {
      case 'high':
        return 'border-destructive';
      case 'medium':
        return 'border-warning';
      default:
        return 'border-info';
    }
  };

  return (
    <Card className={`border-l-4 ${getImpactColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm">{insight.title}</h4>
            <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
            <p className="text-xs text-gray-500 mt-2">{insight.recommendation}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Benchmarking Report View Component
const BenchmarkingReportView: React.FC = () => {
  const { currentProject } = useProject();
  const [benchmarkData, setBenchmarkData] = useState<ProjectBenchmarkComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeHorizon, setTimeHorizon] = useState<number>(6);
  const [predictiveData, setPredictiveData] = useState<any[] | null>(null);
  const [showPredictive, setShowPredictive] = useState(false);

  // Fetch benchmark data
  useEffect(() => {
    const fetchBenchmarkData = async () => {
      if (!currentProject) return;

      try {
        setLoading(true);
        setError(null);

        // In a real implementation, this would fetch actual project data
        // For now, we'll simulate the data structure
        const projectData = {
          project: currentProject,
          tasks: [], // Would be populated with actual tasks
          rabItems: currentProject.items || [],
          workers: [], // Would be populated with actual workers
          resources: [], // Would be populated with actual resources
          expenses: [], // Would be populated with actual expenses
          dailyReports: currentProject.dailyReports || [],
          evmMetrics: undefined // Would be populated with actual EVM metrics
        };

        const result = await advancedBenchmarkingService.compareWithIndustry(projectData);
        
        if (result.success) {
          setBenchmarkData(result.data!);
        } else {
          setError(result.error?.message || 'Failed to fetch benchmark data');
        }
      } catch (err) {
        setError('Failed to fetch benchmark data');
        console.error('Error fetching benchmark data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBenchmarkData();
  }, [currentProject]);

  // Generate predictive data
  const generatePredictiveData = async () => {
    if (!benchmarkData) return;

    try {
      const result = await advancedBenchmarkingService.generatePredictiveBenchmark(benchmarkData, timeHorizon);
      
      if (result.success) {
        // Transform data for charts
        const chartData = result.data!.map(metric => ({
          name: metric.metricName,
          current: metric.currentProjectValue,
          projected: metric.projectedValue,
          industry: metric.industryProjectedValue
        }));
        setPredictiveData(chartData);
        setShowPredictive(true);
      }
    } catch (err) {
      console.error('Error generating predictive data:', err);
    }
  };

  // Prepare data for charts
  const chartData = useMemo(() => {
    if (!benchmarkData) return [];

    return benchmarkData.metrics.map(metric => ({
      name: metric.metricName,
      project: metric.projectValue,
      industry: metric.industryAverage,
      percentile: metric.percentile,
      variance: metric.variancePercentage
    }));
  }, [benchmarkData]);

  // Prepare data for performance pie chart
  const performanceData = useMemo(() => {
    if (!benchmarkData) return [];

    const performanceCounts: Record<string, number> = {
      excellent: 0,
      good: 0,
      average: 0,
      below_average: 0,
      poor: 0
    };

    benchmarkData.metrics.forEach(metric => {
      performanceCounts[metric.performance] = (performanceCounts[metric.performance] || 0) + 1;
    });

    return Object.entries(performanceCounts)
      .filter(([_, count]) => count > 0)
      .map(([performance, count]) => ({
        name: performance.charAt(0).toUpperCase() + performance.slice(1).replace('_', ' '),
        value: count,
        performance
      }));
  }, [benchmarkData]);

  // Handle export
  const handleExport = () => {
    // In a real implementation, this would generate and download the report
    alert('Export functionality would be implemented here');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!benchmarkData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Benchmark Data Available</h3>
          <p className="text-gray-500">Benchmark data could not be generated for this project.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Benchmarking Report</h1>
          <p className="text-gray-600 mt-1">
            Compare your project performance against industry standards
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={generatePredictiveData} variant="primary">
            <TrendingUp className="w-4 h-4 mr-2" />
            Generate Predictive Analysis
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Performance</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {benchmarkData.overallPerformance.percentile}%
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Award className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <RankingBadge ranking={benchmarkData.overallPerformance.ranking} />
              <p className="text-xs text-gray-500 mt-2">
                {benchmarkData.overallPerformance.ranking === 'excellent' 
                  ? 'Outperforming industry standards' 
                  : benchmarkData.overallPerformance.ranking === 'good' 
                    ? 'Meeting industry standards' 
                    : 'Below industry standards'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Strengths</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {benchmarkData.overallPerformance.strengths.length}
                </p>
              </div>
              <div className="p-3 bg-success/10 rounded-full">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500">
                Areas where you excel
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Improvement Areas</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {benchmarkData.overallPerformance.improvementAreas.length}
                </p>
              </div>
              <div className="p-3 bg-warning/10 rounded-full">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500">
                Areas for improvement
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Industry Insights</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {benchmarkData.industryInsights.length}
                </p>
              </div>
              <div className="p-3 bg-info/10 rounded-full">
                <Info className="w-6 h-6 text-info" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500">
                Actionable insights
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Distribution</CardTitle>
            <CardDescription>
              Distribution of metrics across performance levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={performanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent as number * 100).toFixed(0)}%`}
                  >
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Metrics']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Comparison</CardTitle>
            <CardDescription>
              Your project vs industry average
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip formatter={(value) => [Number(value).toFixed(2), 'Value']} />
                  <Legend />
                  <Bar dataKey="project" name="Your Project" fill="#0088FE" />
                  <Bar dataKey="industry" name="Industry Average" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics Comparison</CardTitle>
          <CardDescription>
            Detailed comparison of each metric against industry benchmarks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metric
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Your Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry Avg
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variance (%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentile
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {benchmarkData.metrics.map((metric) => (
                  <tr key={metric.metricId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {metric.metricName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.projectValue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.industryAverage.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <span className={metric.variancePercentage >= 0 ? 'text-success' : 'text-destructive'}>
                          {metric.variancePercentage >= 0 ? '+' : ''}
                          {metric.variancePercentage.toFixed(2)}%
                        </span>
                        <TrendIndicator value={metric.variancePercentage} />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <span>{metric.percentile.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <PerformanceBadge performance={metric.performance} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Predictive Analysis (if generated) */}
      {showPredictive && predictiveData && (
        <Card>
          <CardHeader>
            <CardTitle>Predictive Analysis</CardTitle>
            <CardDescription>
              Projected performance over the next {timeHorizon} months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Time Horizon:</span>
                <Select 
                  value={timeHorizon.toString()} 
                  onChange={(e) => setTimeHorizon(Number(e.target.value))}
                >
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                </Select>
                <Button onClick={generatePredictiveData} size="sm">
                  Update
                </Button>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={predictiveData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip formatter={(value) => [Number(value).toFixed(2), 'Value']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="current" 
                    name="Current Value" 
                    stroke="#0088FE" 
                    strokeWidth={2} 
                    dot={{ r: 4 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="projected" 
                    name="Projected Value" 
                    stroke="#FFBB28" 
                    strokeWidth={2} 
                    strokeDasharray="3 3"
                    dot={{ r: 4 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="industry" 
                    name="Industry Projection" 
                    stroke="#00C49F" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    dot={{ r: 4 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Industry Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Industry Insights</CardTitle>
          <CardDescription>
            Actionable insights based on industry trends and your performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {benchmarkData.industryInsights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benchmarkData.industryInsights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No industry insights available at this time.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
          <CardDescription>
            Based on your performance and industry benchmarks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {benchmarkData.overallPerformance.improvementAreas.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Focus Areas for Improvement:</h4>
              <ul className="list-disc list-inside space-y-2">
                {benchmarkData.overallPerformance.improvementAreas.map((area, index) => (
                  <li key={index} className="text-gray-700">
                    Improve performance in <span className="font-medium">{area}</span>
                  </li>
                ))}
              </ul>
              
              <h4 className="font-medium text-gray-900 mt-6">Best Practices:</h4>
              <ul className="list-disc list-inside space-y-2">
                {benchmarkData.overallPerformance.strengths.map((strength, index) => (
                  <li key={index} className="text-gray-700">
                    Maintain excellence in <span className="font-medium">{strength}</span> and consider sharing best practices
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
              <p className="text-gray-700">Your project is performing well across all metrics!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BenchmarkingReportView;