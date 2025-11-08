/**
 * Comprehensive Report View
 * Advanced Reporting System
 *
 * Enhanced reporting dashboard with advanced analytics, export capabilities, and customizable reports
 */

import React, { useState, useMemo } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import { predictiveAnalyticsService } from '@/api/predictiveAnalyticsService';
import { useProjectCalculations } from '@/hooks/useProjectCalculations';
import type { 
  CostForecast, 
  ScheduleForecast, 
  RiskForecast, 
  QualityForecast 
} from '@/types/predictive-analytics.types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/Card';
import { Button } from '@/components/Button';
import { 
  Download, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  Filter
} from 'lucide-react';
import { formatCurrency, getTodayDateString } from '@/constants';
import { Input, Select } from '@/components/FormControls';

interface ReportConfig {
  type: 'cost' | 'schedule' | 'risk' | 'quality' | 'comprehensive';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeCharts: boolean;
  includePredictions: boolean;
  includeRecommendations: boolean;
  dateRange: {
    start: string;
    end: string;
  };
  departments?: string[];
  riskLevels?: ('low' | 'medium' | 'high' | 'critical')[];
}

const ComprehensiveReportView: React.FC = () => {
  const { currentProject } = useProject();
  const { projectMetrics } = useProjectCalculations(currentProject);
  const { currentUser } = useAuth();
  
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'comprehensive',
    format: 'pdf',
    includeCharts: true,
    includePredictions: true,
    includeRecommendations: true,
    dateRange: {
      start: currentProject?.startDate || getTodayDateString(),
      end: getTodayDateString()
    }
  });
  
  const [forecasts, setForecasts] = useState<{
    cost?: CostForecast;
    schedule?: ScheduleForecast;
    risk?: RiskForecast;
    quality?: QualityForecast;
  }>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate forecasts when component mounts or config changes
  useMemo(() => {
    const generateForecasts = async () => {
      if (!currentProject?.id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await predictiveAnalyticsService.generateForecast({
          projectId: currentProject.id,
          forecastTypes: ['cost', 'schedule', 'risk', 'quality'],
          config: {}
        });
        
        setForecasts(response.forecasts);
      } catch (err) {
        setError('Failed to generate forecasts');
        console.error('Forecast generation error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    generateForecasts();
  }, [currentProject?.id]);

  const handleExport = async () => {
    if (!currentProject) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call an export service
      // For now, we'll simulate the export
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a download link
      const dataStr = JSON.stringify({
        project: currentProject,
        forecasts,
        config: reportConfig,
        generatedAt: new Date().toISOString(),
        generatedBy: currentUser?.name
      }, null, 2);
      
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      const exportFileDefaultName = `project-report-${currentProject.id}-${new Date().toISOString().split('T')[0]}.${reportConfig.format}`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
    } catch (err) {
      setError('Failed to export report');
      console.error('Export error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigChange = (field: keyof ReportConfig, value: any) => {
    setReportConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setReportConfig(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };

  if (!currentProject) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
            <p className="text-gray-500">Please select a project to view reports</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comprehensive Project Reports</h1>
          <p className="text-gray-600 mt-1">Advanced analytics and customizable reporting</p>
        </div>
        <Button 
          onClick={handleExport} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Report Configuration
            </CardTitle>
            <CardDescription>Customize your report settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <Select
                value={reportConfig.type}
                onChange={(e) => handleConfigChange('type', e.target.value)}
              >
                <option value="comprehensive">Comprehensive</option>
                <option value="cost">Cost Analysis</option>
                <option value="schedule">Schedule Forecast</option>
                <option value="risk">Risk Assessment</option>
                <option value="quality">Quality Metrics</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Export Format</label>
              <Select
                value={reportConfig.format}
                onChange={(e) => handleConfigChange('format', e.target.value)}
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <Input
                  type="date"
                  value={reportConfig.dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <Input
                  type="date"
                  value={reportConfig.dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Include Sections</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={reportConfig.includeCharts}
                    onChange={(e) => handleConfigChange('includeCharts', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Charts and Visualizations</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={reportConfig.includePredictions}
                    onChange={(e) => handleConfigChange('includePredictions', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Predictive Analytics</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={reportConfig.includeRecommendations}
                    onChange={(e) => handleConfigChange('includeRecommendations', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Recommendations</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Report Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Key Performance Indicators
              </CardTitle>
              <CardDescription>Current project metrics and performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-800 font-medium">Progress</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {projectMetrics.overallProgress?.toFixed(1) || '0.0'}%
                  </div>
                  <div className="text-xs text-blue-700 mt-1">Overall completion</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-800 font-medium">Budget</div>
                  <div className="text-2xl font-bold text-green-600">
                    {projectMetrics.evm?.cpi?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-xs text-green-700 mt-1">Cost Performance</div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-purple-800 font-medium">Schedule</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {projectMetrics.evm?.spi?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-xs text-purple-700 mt-1">Schedule Performance</div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-sm text-orange-800 font-medium">Risk Score</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {forecasts.risk?.overallRiskScore?.toFixed(0) || '0'}
                  </div>
                  <div className="text-xs text-orange-700 mt-1">Risk assessment</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Predictive Analytics */}
          {reportConfig.includePredictions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Predictive Analytics
                </CardTitle>
                <CardDescription>Forecasted project outcomes and trends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <>
                    {forecasts.cost && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Cost Forecast</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span>Projected Total Cost:</span>
                            <span className="font-bold">
                              {formatCurrency(forecasts.cost.totalForecastCost)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span>Current Variance:</span>
                            <span className={forecasts.cost.projectedOverrun > 0 ? 'text-red-600' : 'text-green-600'}>
                              {formatCurrency(forecasts.cost.projectedOverrun)} 
                              ({forecasts.cost.projectedOverrunPercentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            Confidence: {(forecasts.cost.confidenceScore * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    )}

                    {forecasts.schedule && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Schedule Forecast</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span>Estimated Completion:</span>
                            <span className="font-bold">
                              {forecasts.schedule.predictedCompletionDate?.toLocaleDateString() || 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span>On-time Probability:</span>
                            <span className={forecasts.schedule.onTimeProbability > 0.7 ? 'text-green-600' : 'text-red-600'}>
                              {(forecasts.schedule.onTimeProbability * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            Confidence: {(forecasts.schedule.confidenceScore * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Risk Assessment */}
          {forecasts.risk && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Risk Assessment
                </CardTitle>
                <CardDescription>Identified risks and mitigation strategies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <div className="font-medium">Overall Risk Level</div>
                      <div className="text-sm text-gray-600">Based on current project data</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      forecasts.risk.riskLevel === 'critical' ? 'bg-red-500 text-white' :
                      forecasts.risk.riskLevel === 'high' ? 'bg-orange-500 text-white' :
                      forecasts.risk.riskLevel === 'medium' ? 'bg-yellow-500 text-white' :
                      'bg-green-500 text-white'
                    }`}>
                      {forecasts.risk.riskLevel?.toUpperCase()}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Top Risk Factors</h4>
                    <div className="space-y-2">
                      {forecasts.risk.predictedRisks?.slice(0, 3).map((risk, index) => (
                        <div key={index} className="flex items-start p-3 border border-gray-200 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{risk.description}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Probability: {(risk.probability * 100).toFixed(0)}% | 
                              Impact: {risk.impact} | 
                              Score: {risk.riskScore}
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            risk.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            risk.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            risk.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {risk.severity}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {reportConfig.includeRecommendations && forecasts.risk && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Recommendations
                </CardTitle>
                <CardDescription>AI-generated suggestions for project improvement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {forecasts.risk.recommendations?.slice(0, 3).map((rec, index) => (
                    <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-sm">{rec.action}</div>
                        <div className="text-xs text-gray-600 mt-1">{rec.rationale}</div>
                      </div>
                    </div>
                  ))}
                  
                  {(!forecasts.risk.recommendations || forecasts.risk.recommendations.length === 0) && (
                    <div className="text-center py-4 text-gray-500">
                      No specific recommendations available at this time
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveReportView;