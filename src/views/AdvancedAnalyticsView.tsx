/**
 * Advanced Analytics Dashboard
 * 
 * Enhanced analytics dashboard with predictive capabilities and real-time data visualization
 */

import React, { useState, useEffect, useMemo } from 'react';
import { logger } from '@/utils/logger.enhanced';
import { performanceMonitor } from '@/utils/performance/performanceMonitor';
import { useOptimizedRendering } from '@/hooks/useOptimizedRendering';

interface AnalyticsData {
  projectMetrics: {
    completionRate: number;
    budgetUtilization: number;
    timelineAdherence: number;
    riskScore: number;
  };
  resourceAllocation: {
    labor: number;
    materials: number;
    equipment: number;
  };
  performanceTrends: {
    date: string;
    productivity: number;
    quality: number;
    efficiency: number;
  }[];
  predictiveInsights: {
    riskFactors: string[];
    opportunities: string[];
    recommendations: string[];
  };
}

// Simple chart component
const SimpleBarChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center">
          <div className="w-24 text-sm text-gray-600">{item.label}</div>
          <div className="flex-1 flex items-center">
            <div 
              className="h-6 rounded-sm" 
              style={{ 
                width: `${(item.value / maxValue) * 100}%`, 
                backgroundColor: item.color 
              }}
            ></div>
            <span className="ml-2 text-sm font-medium">{item.value}%</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Simple pie chart component
const SimplePieChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40 rounded-full border-4 border-gray-200">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const rotation = data.slice(0, index).reduce((sum, prev) => sum + (prev.value / total) * 360, 0);
          
          return (
            <div
              key={index}
              className="absolute inset-0 rounded-full"
              style={{
                clipPath: `conic-gradient(from ${rotation}deg, ${item.color} 0deg, ${item.color} ${percentage}deg, transparent ${percentage}deg)`,
                backgroundColor: item.color,
              }}
            ></div>
          );
        })}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div 
              className="w-4 h-4 rounded-sm mr-2" 
              style={{ backgroundColor: item.color }}
            ></div>
            <span className="text-sm">{item.label}: {item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdvancedAnalyticsView: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isLoading, setIsLoading] = useState(true);

  // Performance monitoring
  const performanceMark = useMemo(() => {
    return performanceMonitor.startTiming('AdvancedAnalyticsView_render');
  }, []);

  // Optimized data processing
  const processedData = useOptimizedRendering(
    () => {
      if (!analyticsData) return null;
      
      return {
        projectMetricsData: [
          { label: 'Completion', value: analyticsData.projectMetrics.completionRate, color: '#3B82F6' },
          { label: 'Budget', value: analyticsData.projectMetrics.budgetUtilization, color: '#EF4444' },
          { label: 'Timeline', value: analyticsData.projectMetrics.timelineAdherence, color: '#10B981' },
          { label: 'Risk', value: analyticsData.projectMetrics.riskScore, color: '#8B5CF6' },
        ],
        resourceAllocationData: [
          { label: 'Labor', value: analyticsData.resourceAllocation.labor, color: '#EF4444' },
          { label: 'Materials', value: analyticsData.resourceAllocation.materials, color: '#3B82F6' },
          { label: 'Equipment', value: analyticsData.resourceAllocation.equipment, color: '#F59E0B' },
        ],
        performanceTrendData: analyticsData.performanceTrends,
      };
    },
    [analyticsData],
    { enableMemoization: true, enableCache: true, cacheKey: 'analytics_charts' }
  );

  // Simulate data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data - in a real implementation, this would come from an API
        const mockData: AnalyticsData = {
          projectMetrics: {
            completionRate: 78,
            budgetUtilization: 65,
            timelineAdherence: 82,
            riskScore: 25,
          },
          resourceAllocation: {
            labor: 45,
            materials: 35,
            equipment: 20,
          },
          performanceTrends: [
            { date: 'Jan', productivity: 75, quality: 80, efficiency: 70 },
            { date: 'Feb', productivity: 78, quality: 82, efficiency: 72 },
            { date: 'Mar', productivity: 82, quality: 85, efficiency: 75 },
            { date: 'Apr', productivity: 85, quality: 87, efficiency: 78 },
            { date: 'May', productivity: 88, quality: 89, efficiency: 80 },
            { date: 'Jun', productivity: 90, quality: 91, efficiency: 82 },
          ],
          predictiveInsights: {
            riskFactors: [
              'Weather delays in Q3',
              'Resource shortage for electrical work',
              'Potential budget overrun in materials'
            ],
            opportunities: [
              'Early completion of foundation work',
              'Cost savings in labor allocation',
              'Improved supplier negotiation terms'
            ],
            recommendations: [
              'Reallocate 2 workers from finishing to framing',
              'Negotiate bulk purchase for concrete materials',
              'Schedule electrical work during dry season'
            ],
          },
        };
        
        setAnalyticsData(mockData);
      } catch (error) {
        logger.error('Failed to fetch analytics data', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setIsLoading(false);
        performanceMonitor.endTiming(performanceMark, 'AdvancedAnalyticsView_render');
      }
    };
    
    fetchData();
  }, [timeRange, performanceMark]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData || !processedData) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Data Unavailable</h3>
          <p className="text-red-700 mt-1">Unable to load analytics data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time insights and predictive analytics for your projects</p>
        </div>
        <div className="flex items-center space-x-2">
          <label htmlFor="timeRange" className="text-sm font-medium text-gray-700">Time Range:</label>
          <select
            id="timeRange"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Completion Rate</h3>
              <p className="text-2xl font-semibold text-gray-900">{analyticsData.projectMetrics.completionRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-3">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Budget Utilization</h3>
              <p className="text-2xl font-semibold text-gray-900">{analyticsData.projectMetrics.budgetUtilization}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-yellow-100 p-3">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Timeline Adherence</h3>
              <p className="text-2xl font-semibold text-gray-900">{analyticsData.projectMetrics.timelineAdherence}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-red-100 p-3">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Risk Score</h3>
              <p className="text-2xl font-semibold text-gray-900">{analyticsData.projectMetrics.riskScore}/100</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Metrics Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Project Metrics Overview</h3>
          <div className="h-64 flex items-center justify-center">
            <SimpleBarChart data={processedData.projectMetricsData} />
          </div>
        </div>

        {/* Resource Allocation Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Resource Allocation</h3>
          <div className="h-64 flex items-center justify-center">
            <SimplePieChart data={processedData.resourceAllocationData} />
          </div>
        </div>

        {/* Performance Trends */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Trends</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Productivity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedData.performanceTrendData.map((trend, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trend.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${trend.productivity}%` }}
                          ></div>
                        </div>
                        {trend.productivity}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${trend.quality}%` }}
                          ></div>
                        </div>
                        {trend.quality}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-yellow-600 h-2 rounded-full" 
                            style={{ width: `${trend.efficiency}%` }}
                          ></div>
                        </div>
                        {trend.efficiency}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Predictive Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Factors */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Risk Factors
          </h3>
          <ul className="space-y-2">
            {analyticsData.predictiveInsights.riskFactors.map((risk, index) => (
              <li key={index} className="flex items-start">
                <svg className="h-5 w-5 text-red-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-gray-700">{risk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Opportunities */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Opportunities
          </h3>
          <ul className="space-y-2">
            {analyticsData.predictiveInsights.opportunities.map((opportunity, index) => (
              <li key={index} className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700">{opportunity}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Recommendations
          </h3>
          <ul className="space-y-2">
            {analyticsData.predictiveInsights.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsView;