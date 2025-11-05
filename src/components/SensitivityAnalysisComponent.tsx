import React, { useState, useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './Card';
import { Button } from './Button';
import { Input, Select } from './FormControls';
import { Modal } from './Modal';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  Plus,
  X,
  Calculator,
  BarChart3,
} from 'lucide-react';
import { EnhancedRabItem, SensitivityFactor } from '@/types';
import { formatCurrency } from '@/constants';

interface SensitivityAnalysisComponentProps {
  rabItems: EnhancedRabItem[];
  onUpdateSensitivity?: (itemId: number, factors: SensitivityFactor[]) => void;
}

export const SensitivityAnalysisComponent: React.FC<SensitivityAnalysisComponentProps> = ({
  rabItems,
  onUpdateSensitivity,
}) => {
  const [selectedItem, setSelectedItem] = useState<EnhancedRabItem | null>(null);
  const [showFactorModal, setShowFactorModal] = useState(false);
  const [newFactor, setNewFactor] = useState<Partial<SensitivityFactor>>({
    factor: '',
    impact: 0,
    probability: 0,
    riskType: 'cost_increase',
    mitigation: '',
  });
  const [analysisType, setAnalysisType] = useState<'tornado' | 'monte_carlo' | 'scenario'>(
    'tornado'
  );

  // Pre-defined risk factors template
  const riskFactorTemplates = [
    {
      factor: 'Material Price Volatility',
      impact: 15,
      probability: 70,
      riskType: 'cost_increase' as const,
      mitigation: 'Long-term supply contracts',
    },
    {
      factor: 'Labor Shortage',
      impact: 25,
      probability: 50,
      riskType: 'cost_increase' as const,
      mitigation: 'Multiple recruitment channels',
    },
    {
      factor: 'Weather Delays',
      impact: 10,
      probability: 60,
      riskType: 'schedule_delay' as const,
      mitigation: 'Weather contingency planning',
    },
    {
      factor: 'Equipment Breakdown',
      impact: 20,
      probability: 30,
      riskType: 'schedule_delay' as const,
      mitigation: 'Preventive maintenance program',
    },
    {
      factor: 'Regulatory Changes',
      impact: 30,
      probability: 25,
      riskType: 'cost_increase' as const,
      mitigation: 'Regulatory monitoring system',
    },
    {
      factor: 'Currency Fluctuation',
      impact: 12,
      probability: 80,
      riskType: 'cost_increase' as const,
      mitigation: 'Currency hedging strategy',
    },
  ];

  // Calculate overall project sensitivity
  const projectSensitivity = useMemo(() => {
    const allFactors = rabItems.flatMap((item) => item.sensitivityFactors);
    const totalImpact = allFactors.reduce(
      (sum, factor) => sum + (factor.impact * factor.probability) / 100,
      0
    );
    const avgImpact = allFactors.length > 0 ? totalImpact / allFactors.length : 0;

    const riskCategories = allFactors.reduce(
      (acc, factor) => {
        acc[factor.riskType] = (acc[factor.riskType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const highRiskFactors = allFactors.filter(
      (factor) => (factor.impact * factor.probability) / 100 > 15
    ).length;

    return {
      totalFactors: allFactors.length,
      avgImpact,
      highRiskFactors,
      riskCategories,
      overallRisk: avgImpact > 20 ? 'high' : avgImpact > 10 ? 'medium' : 'low',
    };
  }, [rabItems]);

  // Generate tornado diagram data
  const generateTornadoData = (item: EnhancedRabItem) => {
    return item.sensitivityFactors
      .map((factor) => ({
        ...factor,
        expectedImpact: (factor.impact * factor.probability) / 100,
        lowScenario: item.hargaSatuan * (1 - factor.impact / 100),
        highScenario: item.hargaSatuan * (1 + factor.impact / 100),
      }))
      .sort((a, b) => b.expectedImpact - a.expectedImpact);
  };

  // Monte Carlo simulation (simplified)
  const runMonteCarloSimulation = (item: EnhancedRabItem, iterations: number = 1000) => {
    const results = [];

    for (let i = 0; i < iterations; i++) {
      let totalImpact = 0;

      for (const factor of item.sensitivityFactors) {
        const random = Math.random() * 100;
        if (random <= factor.probability) {
          const impactVariation = (Math.random() - 0.5) * 2; // -1 to 1
          totalImpact += factor.impact * (1 + impactVariation * 0.3); // ±30% variation
        }
      }

      const finalPrice = item.hargaSatuan * (1 + totalImpact / 100);
      results.push(finalPrice);
    }

    results.sort((a, b) => a - b);

    return {
      mean: results.reduce((sum, val) => sum + val, 0) / results.length,
      p10: results[Math.floor(results.length * 0.1)],
      p50: results[Math.floor(results.length * 0.5)],
      p90: results[Math.floor(results.length * 0.9)],
      min: results[0],
      max: results[results.length - 1],
    };
  };

  const getRiskColor = (riskType: string) => {
    switch (riskType) {
      case 'cost_increase':
        return 'text-red-500 bg-red-50';
      case 'cost_decrease':
        return 'text-green-500 bg-green-50';
      case 'schedule_delay':
        return 'text-yellow-500 bg-yellow-50';
      case 'quality_impact':
        return 'text-purple-500 bg-purple-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  const getRiskIcon = (riskType: string) => {
    switch (riskType) {
      case 'cost_increase':
        return <TrendingUp className="w-4 h-4" />;
      case 'cost_decrease':
        return <TrendingDown className="w-4 h-4" />;
      case 'schedule_delay':
        return <AlertTriangle className="w-4 h-4" />;
      case 'quality_impact':
        return <Shield className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const addNewFactor = () => {
    if (!selectedItem || !newFactor.factor) return;

    const factor: SensitivityFactor = {
      id: `factor_${Date.now()}`,
      factor: newFactor.factor,
      impact: newFactor.impact || 0,
      probability: newFactor.probability || 0,
      riskType: newFactor.riskType || 'cost_increase',
      mitigation: newFactor.mitigation || '',
      lastAssessment: new Date().toISOString(),
    };

    const updatedFactors = [...selectedItem.sensitivityFactors, factor];
    if (onUpdateSensitivity) {
      onUpdateSensitivity(selectedItem.id, updatedFactors);
    }

    setNewFactor({
      factor: '',
      impact: 0,
      probability: 0,
      riskType: 'cost_increase',
      mitigation: '',
    });
    setShowFactorModal(false);
  };

  const removeFactor = (factorId: string) => {
    if (!selectedItem) return;

    const updatedFactors = selectedItem.sensitivityFactors.filter((f) => f.id !== factorId);
    if (onUpdateSensitivity) {
      onUpdateSensitivity(selectedItem.id, updatedFactors);
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-palladium">Total Risk Factors</p>
                <p className="text-2xl font-bold text-night-black">
                  {projectSensitivity.totalFactors}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-persimmon" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-palladium">Avg Risk Impact</p>
                <p className="text-2xl font-bold text-persimmon">
                  {projectSensitivity.avgImpact.toFixed(1)}%
                </p>
              </div>
              <Target className="w-8 h-8 text-persimmon" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-palladium">High Risk Items</p>
                <p className="text-2xl font-bold text-red-500">
                  {projectSensitivity.highRiskFactors}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-palladium">Overall Risk</p>
                <p
                  className={`text-2xl font-bold ${
                    projectSensitivity.overallRisk === 'high'
                      ? 'text-red-500'
                      : projectSensitivity.overallRisk === 'medium'
                        ? 'text-yellow-500'
                        : 'text-green-500'
                  }`}
                >
                  {projectSensitivity.overallRisk.toUpperCase()}
                </p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Jenis Analisis Sensitivitas</CardTitle>
          <CardDescription>Pilih metode analisis untuk evaluasi risiko</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={analysisType === 'tornado' ? 'default' : 'outline'}
              onClick={() => setAnalysisType('tornado')}
            >
              Tornado Analysis
            </Button>
            <Button
              variant={analysisType === 'monte_carlo' ? 'default' : 'outline'}
              onClick={() => setAnalysisType('monte_carlo')}
            >
              Monte Carlo Simulation
            </Button>
            <Button
              variant={analysisType === 'scenario' ? 'default' : 'outline'}
              onClick={() => setAnalysisType('scenario')}
            >
              Scenario Analysis
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RAB Items with Sensitivity Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Analisis Sensitivitas per Item RAB</CardTitle>
          <CardDescription>
            Klik item untuk melihat analisis detail dan mengelola faktor risiko
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-violet-essence/50 text-xs uppercase">
                <tr>
                  <th className="p-3 text-left">Item</th>
                  <th className="p-3 text-center">Risk Factors</th>
                  <th className="p-3 text-right">Base Price</th>
                  <th className="p-3 text-right">Risk Impact</th>
                  <th className="p-3 text-right">Potential Range</th>
                  <th className="p-3 text-center">Risk Level</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rabItems.map((item) => {
                  const totalRisk = item.sensitivityFactors.reduce(
                    (sum, factor) => sum + (factor.impact * factor.probability) / 100,
                    0
                  );
                  const minPrice = item.hargaSatuan * (1 - totalRisk / 100);
                  const maxPrice = item.hargaSatuan * (1 + totalRisk / 100);

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-violet-essence hover:bg-violet-essence/30"
                    >
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-night-black">{item.uraian}</p>
                          <p className="text-xs text-palladium">{item.kategori}</p>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {item.sensitivityFactors.slice(0, 3).map((factor) => (
                            <span
                              key={factor.id}
                              className={`px-2 py-1 rounded-full text-xs ${getRiskColor(factor.riskType)}`}
                            >
                              {factor.factor.substring(0, 10)}...
                            </span>
                          ))}
                          {item.sensitivityFactors.length > 3 && (
                            <span className="text-xs text-palladium">
                              +{item.sensitivityFactors.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatCurrency(item.hargaSatuan)}
                      </td>
                      <td className="p-3 text-right">
                        <div>
                          <p
                            className={`font-medium ${
                              totalRisk > 20
                                ? 'text-red-500'
                                : totalRisk > 10
                                  ? 'text-yellow-500'
                                  : 'text-green-500'
                            }`}
                          >
                            ±{totalRisk.toFixed(1)}%
                          </p>
                          <p className="text-xs text-palladium">
                            {formatCurrency(Math.abs(maxPrice - item.hargaSatuan))}
                          </p>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div>
                          <p className="text-green-600 text-xs">{formatCurrency(minPrice)}</p>
                          <p className="text-red-600 text-xs">{formatCurrency(maxPrice)}</p>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            totalRisk > 20
                              ? 'text-red-600 bg-red-100'
                              : totalRisk > 10
                                ? 'text-yellow-600 bg-yellow-100'
                                : 'text-green-600 bg-green-100'
                          }`}
                        >
                          {totalRisk > 20 ? 'HIGH' : totalRisk > 10 ? 'MEDIUM' : 'LOW'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}>
                          <Calculator className="w-4 h-4 mr-1" />
                          Analyze
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={`Sensitivity Analysis: ${selectedItem.uraian}`}
        >
          <div className="space-y-6">
            {/* Analysis Results based on type */}
            {analysisType === 'tornado' && (
              <div>
                <h4 className="font-medium text-night-black mb-3">Tornado Diagram</h4>
                <div className="space-y-2">
                  {generateTornadoData(selectedItem).map((factor) => (
                    <div key={factor.id} className="flex items-center gap-3">
                      <div className="w-32 text-sm truncate">{factor.factor}</div>
                      <div className="flex-1 relative">
                        <div className="h-6 bg-gray-200 rounded-lg relative">
                          <div
                            className="h-full bg-gradient-to-r from-green-400 to-red-400 rounded-lg"
                            style={{ width: `${Math.min(100, factor.expectedImpact * 2)}%` }}
                          />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-between text-xs px-2">
                          <span>{formatCurrency(factor.lowScenario)}</span>
                          <span>{formatCurrency(factor.highScenario)}</span>
                        </div>
                      </div>
                      <div className="w-16 text-sm text-right">
                        {factor.expectedImpact.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysisType === 'monte_carlo' && (
              <div>
                <h4 className="font-medium text-night-black mb-3">Monte Carlo Results</h4>
                {(() => {
                  const results = runMonteCarloSimulation(selectedItem);
                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">P10 (Optimistic):</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(results.p10)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">P50 (Most Likely):</span>
                          <span className="font-medium">{formatCurrency(results.p50)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">P90 (Pessimistic):</span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(results.p90)}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Mean:</span>
                          <span className="font-medium">{formatCurrency(results.mean)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Range:</span>
                          <span className="font-medium">
                            {formatCurrency(results.max - results.min)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Risk Factors Management */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-night-black">Risk Factors</h4>
                <Button variant="outline" size="sm" onClick={() => setShowFactorModal(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Factor
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedItem.sensitivityFactors.map((factor) => (
                  <div key={factor.id} className="p-3 border border-violet-essence rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getRiskIcon(factor.riskType)}
                          <span className="font-medium text-sm">{factor.factor}</span>
                        </div>
                        <div className="text-xs text-palladium mb-2">
                          Impact: {factor.impact}% • Probability: {factor.probability}%
                        </div>
                        <p className="text-xs text-palladium">{factor.mitigation}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => removeFactor(factor.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Factor Modal */}
      {showFactorModal && (
        <Modal
          isOpen={showFactorModal}
          onClose={() => setShowFactorModal(false)}
          title="Add Risk Factor"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Risk Factor</label>
              <Input
                value={newFactor.factor || ''}
                onChange={(e) => setNewFactor({ ...newFactor, factor: e.target.value })}
                placeholder="e.g., Material price volatility"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Impact (%)</label>
                <Input
                  type="number"
                  value={newFactor.impact || 0}
                  onChange={(e) => setNewFactor({ ...newFactor, impact: Number(e.target.value) })}
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Probability (%)</label>
                <Input
                  type="number"
                  value={newFactor.probability || 0}
                  onChange={(e) =>
                    setNewFactor({ ...newFactor, probability: Number(e.target.value) })
                  }
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Risk Type</label>
              <Select
                value={newFactor.riskType || 'cost_increase'}
                onChange={(e) => setNewFactor({ ...newFactor, riskType: e.target.value as any })}
              >
                <option value="cost_increase">Cost Increase</option>
                <option value="cost_decrease">Cost Decrease</option>
                <option value="schedule_delay">Schedule Delay</option>
                <option value="quality_impact">Quality Impact</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mitigation Strategy</label>
              <Input
                value={newFactor.mitigation || ''}
                onChange={(e) => setNewFactor({ ...newFactor, mitigation: e.target.value })}
                placeholder="e.g., Long-term supply contracts"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={addNewFactor} className="flex-1">
                Add Factor
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFactorModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>

            {/* Quick Templates */}
            <div>
              <h5 className="text-sm font-medium mb-2">Quick Templates:</h5>
              <div className="grid grid-cols-2 gap-2">
                {riskFactorTemplates.map((template, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setNewFactor(template)}
                    className="text-xs"
                  >
                    {template.factor}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SensitivityAnalysisComponent;
