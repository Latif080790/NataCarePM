import React, { useState, useEffect, useMemo } from 'react';

import { Card } from './Card';
import { Button } from './Button';
import { LineChart } from './LineChart';
import { 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  Target,
  Calendar,
  Calculator,
  PieChart,
  BarChart3,
  Download,
  RefreshCw
} from 'lucide-react';
import { FinancialForecastingService } from '@/api/financialForecastingService';
import { FinancialForecast } from '@/types';

interface FinancialForecastingComponentProps {
  projectId: string;
  currentBudget: number;
  historicalData: any[];
  onForecastUpdate?: (forecast: FinancialForecast) => void;
}

export const FinancialForecastingComponent: React.FC<FinancialForecastingComponentProps> = ({
  projectId,
  currentBudget,
  historicalData,
  onForecastUpdate
}) => {
  const [forecast, setForecast] = useState<FinancialForecast | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState(12);
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);
  const [activeTab, setActiveTab] = useState<'overview' | 'scenarios' | 'cashflow' | 'risks'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    generateForecast();
  }, [projectId, selectedTimeframe, confidenceLevel]);

  const generateForecast = async () => {
    setIsLoading(true);
    try {
      const forecastResult = FinancialForecastingService.generateFinancialForecast(
        projectId,
        {
          historicalData,
          currentBudget,
          timeframe: selectedTimeframe,
          confidenceLevel
        }
      );
      
      setForecast(forecastResult);
      onForecastUpdate?.(forecastResult);
    } catch (error) {
      console.error('Error generating forecast:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPerformanceColor = (value: number, type: 'variance' | 'risk' | 'confidence') => {
    if (type === 'variance') {
      if (value > 10) return 'text-red-600';
      if (value > 5) return 'text-yellow-600';
      return 'text-green-600';
    }
    if (type === 'risk') {
      if (value > 0.7) return 'text-red-600';
      if (value > 0.4) return 'text-yellow-600';
      return 'text-green-600';
    }
    if (type === 'confidence') {
      if (value < 0.7) return 'text-red-600';
      if (value < 0.85) return 'text-yellow-600';
      return 'text-green-600';
    }
    return 'text-gray-600';
  };

  const prepareForecastChartData = () => {
    if (!forecast) return { planned: [], actual: [] };

    const mostLikely = forecast.scenarios.find(s => s.name === 'Most Likely');
    if (!mostLikely) return { planned: [], actual: [] };

    return {
      planned: mostLikely.projections.map((p, index) => ({
        day: index + 1,
        cost: p.cumulativeCost
      })),
      actual: mostLikely.projections.map((p, index) => ({
        day: index + 1,
        cost: p.projectedCost
      }))
    };
  };

  const prepareCashFlowChartData = () => {
    if (!forecast) return { planned: [], actual: [] };

    return {
      planned: forecast.cashFlowProjections.map((cf, index) => ({
        day: index + 1,
        cost: cf.cumulativeCashFlow
      })),
      actual: forecast.cashFlowProjections.map((cf, index) => ({
        day: index + 1,
        cost: cf.netCashFlow
      }))
    };
  };

  if (!forecast) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 text-gray-400 animate-spin" />
            <p className="text-gray-600">Generating financial forecast...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium">Timeframe:</label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(Number(e.target.value))}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value={6}>6 Months</option>
              <option value={12}>12 Months</option>
              <option value={18}>18 Months</option>
              <option value={24}>24 Months</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium">Confidence Level:</label>
            <select
              value={confidenceLevel}
              onChange={(e) => setConfidenceLevel(Number(e.target.value))}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value={0.90}>90%</option>
              <option value={0.95}>95%</option>
              <option value={0.99}>99%</option>
            </select>
          </div>

          <Button
            onClick={generateForecast}
            disabled={isLoading}
            className="ml-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Forecast
          </Button>

          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'scenarios', label: 'Scenarios', icon: PieChart },
            { id: 'cashflow', label: 'Cash Flow', icon: DollarSign },
            { id: 'risks', label: 'Risk Analysis', icon: AlertTriangle }
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Key Metrics */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Forecast Accuracy</h3>
                <Calculator className="w-4 h-4 text-gray-400" />
              </div>
              <div className={`text-2xl font-bold ${getPerformanceColor(forecast.accuracy, 'confidence')}`}>
                {(forecast.accuracy * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Model confidence level</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Budget Variance</h3>
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
              <div className={`text-2xl font-bold ${getPerformanceColor(
                (forecast.riskAssessment.costVariance / currentBudget) * 100, 
                'variance'
              )}`}>
                {formatCurrency(forecast.riskAssessment.costVariance)}
              </div>
              <p className="text-sm text-gray-600">
                {((forecast.riskAssessment.costVariance / currentBudget) * 100).toFixed(1)}% of budget
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Risk Level</h3>
                <AlertTriangle className="w-4 h-4 text-gray-400" />
              </div>
              <div className={`text-lg font-bold ${
                forecast.riskAssessment.overallRiskLevel === 'High' ? 'text-red-600' :
                forecast.riskAssessment.overallRiskLevel === 'Medium' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {forecast.riskAssessment.overallRiskLevel}
              </div>
              <p className="text-sm text-gray-600">
                {(forecast.riskAssessment.probabilityOfOverrun * 100).toFixed(1)}% overrun probability
              </p>
            </Card>
          </div>

          {/* Forecast Chart */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Cost Projection Scenarios</h3>
              <div className="h-80">
                <LineChart data={prepareForecastChartData()} width={800} height={320} />
              </div>
            </Card>
          </div>

          {/* Recommendations */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Key Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {forecast.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <Target className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'scenarios' && (
        <div className="space-y-6">
          {forecast.scenarios.map((scenario, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{scenario.name} Scenario</h3>
                  <p className="text-sm text-gray-600">{scenario.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {(scenario.probability * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600">Probability</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Final Cost Projection</h4>
                  <div className="text-3xl font-bold text-blue-600">
                    {formatCurrency(scenario.projections[scenario.projections.length - 1].cumulativeCost)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Variance: {formatCurrency(
                      scenario.projections[scenario.projections.length - 1].cumulativeCost - currentBudget
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Impact Factors</h4>
                  <ul className="space-y-2">
                    {scenario.impactFactors.map((factor, factorIndex) => (
                      <li key={factorIndex} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'cashflow' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Cash Flow Projections</h3>
            <div className="h-80 mb-6">
              <LineChart data={prepareCashFlowChartData()} width={800} height={320} />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Cash Flow Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Planned Inflow
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Planned Outflow
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Cash Flow
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cumulative
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Working Capital
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {forecast.cashFlowProjections.slice(0, 12).map((projection, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Month {projection.period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {formatCurrency(projection.plannedInflow)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {formatCurrency(projection.plannedOutflow)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        projection.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(projection.netCashFlow)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        projection.cumulativeCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(projection.cumulativeCashFlow)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(projection.workingCapitalRequired)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'risks' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Budget at Risk</h3>
                <AlertTriangle className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(forecast.riskAssessment.budgetAtRisk)}
              </div>
              <p className="text-sm text-gray-600">
                {((forecast.riskAssessment.budgetAtRisk / currentBudget) * 100).toFixed(1)}% of budget
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Overrun Probability</h3>
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
              <div className={`text-2xl font-bold ${getPerformanceColor(
                forecast.riskAssessment.probabilityOfOverrun, 
                'risk'
              )}`}>
                {(forecast.riskAssessment.probabilityOfOverrun * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Likelihood of cost overrun</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Cost Variance</h3>
                <DollarSign className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(forecast.riskAssessment.costVariance)}
              </div>
              <p className="text-sm text-gray-600">Expected variance range</p>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Key Risk Factors</h3>
            <div className="space-y-4">
              {forecast.riskAssessment.keyRiskFactors.map((risk, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{risk.factor}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      risk.impact === 'High' ? 'bg-red-100 text-red-800' :
                      risk.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {risk.impact} Impact
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Probability</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${risk.probability * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{(risk.probability * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Mitigation Strategy</p>
                      <p className="text-sm text-gray-900">{risk.mitigation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Risk Mitigation Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {forecast.riskAssessment.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
