// React default import removed (using automatic JSX runtime)
import { useState } from 'react';
import { RabItem, AhspData, EnhancedRabItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/Card';
import { formatCurrency } from '@/constants';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import {
  Download,
  Calculator,
  TrendingUp,
  BarChart3,
  MapPin,
  AlertTriangle,
  Target,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import PriceEscalationManager from '@/components/PriceEscalationManager';
import VarianceAnalysisComponent from '@/components/VarianceAnalysisComponent';
import SensitivityAnalysisComponent from '@/components/SensitivityAnalysisComponent';
import RegionalPriceAdjustment from '@/components/RegionalPriceAdjustment';
import EnhancedRabService from '@/api/enhancedRabService';

interface EnhancedRabAhspViewProps {
  items: RabItem[];
  ahspData: AhspData;
  projectLocation?: string;
}

type AnalysisTab = 'overview' | 'escalation' | 'variance' | 'sensitivity' | 'regional';

export default function EnhancedRabAhspView({
  items,
  ahspData,
  projectLocation,
}: EnhancedRabAhspViewProps) {
  const [selectedItem, setSelectedItem] = useState<RabItem | null>(null);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('overview');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [enhancedItems, setEnhancedItems] = useState<EnhancedRabItem[]>(() =>
    items.map((item) =>
      EnhancedRabService.createEnhancedRabItem(item, {
        includeHistoricalData: true,
        calculateProjections: true,
        region: projectLocation,
      })
    )
  );

  // Safe guard: Check if items and ahspData are defined
  if (!items || !ahspData) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <p className="text-palladium">Loading data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalBudget = items.reduce(
    (sum, item) => sum + (item?.volume || 0) * (item?.hargaSatuan || 0),
    0
  );
  const totalEnhancedBudget = enhancedItems.reduce((sum, item) => {
    const adjustedPrice = EnhancedRabService.applyRegionalAdjustments(
      item.hargaSatuan,
      item.regionalFactors
    );
    return sum + item.volume * adjustedPrice;
  }, 0);

  const getAhspDetails = (ahspId: string) => {
    return {
      labors: ahspData?.labors?.[ahspId] || {},
      materials: ahspData?.materials?.[ahspId] || {},
    };
  };

  const handleExportCsv = () => {
    const headers = [
      'No',
      'Uraian Pekerjaan',
      'Volume',
      'Satuan',
      'Harga Dasar',
      'Labor Cost',
      'Material Cost',
      'Equipment Cost',
      'Regional Adjustment',
      'Escalation Rate',
      'Risk Level',
      'Adjusted Price',
      'Total',
    ];

    const rows = enhancedItems.map((item) => {
      const adjustedPrice = EnhancedRabService.applyRegionalAdjustments(
        item.hargaSatuan,
        item.regionalFactors
      );
      return [
        item.no,
        `"${item.uraian.replace(/"/g, '""')}"`,
        item.volume,
        item.satuan,
        item.hargaSatuan,
        item.costBreakdown.laborCost,
        item.costBreakdown.materialCost,
        item.costBreakdown.equipmentCost,
        adjustedPrice / item.hargaSatuan,
        item.escalationRate,
        item.budgetVariance.riskLevel,
        adjustedPrice,
        item.volume * adjustedPrice,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'enhanced_rab_analysis.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleItemExpansion = (itemId: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-red-50 text-red-700';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700';
      case 'low':
        return 'bg-green-50 text-green-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const tabConfig = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'escalation', label: 'Price Escalation', icon: TrendingUp },
    { id: 'variance', label: 'Variance Analysis', icon: Calculator },
    { id: 'sensitivity', label: 'Sensitivity Analysis', icon: Target },
    { id: 'regional', label: 'Regional Adjustment', icon: MapPin },
  ];

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-palladium">Total Items</p>
                <p className="text-2xl font-bold text-night-black">{items.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-persimmon" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-palladium">Base Budget</p>
                <p className="text-2xl font-bold text-night-black">{formatCurrency(totalBudget)}</p>
              </div>
              <Calculator className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-palladium">Adjusted Budget</p>
                <p className="text-2xl font-bold text-persimmon">
                  {formatCurrency(totalEnhancedBudget)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-persimmon" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-palladium">Budget Impact</p>
                <p
                  className={`text-2xl font-bold ${
                    totalEnhancedBudget > totalBudget ? 'text-red-500' : 'text-green-500'
                  }`}
                >
                  {(((totalEnhancedBudget - totalBudget) / totalBudget) * 100).toFixed(1)}%
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced RAB Table */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Enhanced RAB Analysis</CardTitle>
            <CardDescription>
              Comprehensive cost analysis with risk assessment and regional adjustments
            </CardDescription>
          </div>
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="w-4 h-4 mr-2" />
            Export Enhanced RAB
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-night-black">
              <thead className="bg-violet-essence/50 text-xs uppercase">
                <tr>
                  <th className="p-3">Item</th>
                  <th className="p-3 text-right">Base Price</th>
                  <th className="p-3 text-right">Cost Breakdown</th>
                  <th className="p-3 text-right">Regional Adj.</th>
                  <th className="p-3 text-right">Escalation</th>
                  <th className="p-3 text-center">Risk Level</th>
                  <th className="p-3 text-right">Final Price</th>
                  <th className="p-3 text-right">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {enhancedItems.map((item) => {
                  const hasAhspData = ahspData?.labors?.[item.ahspId];
                  const adjustedPrice = EnhancedRabService.applyRegionalAdjustments(
                    item.hargaSatuan,
                    item.regionalFactors
                  );
                  const projectedPrice = EnhancedRabService.calculatePriceEscalation(
                    adjustedPrice,
                    item.escalationRate,
                    12
                  );
                  const isExpanded = expandedItems.has(item.id);

                  return (
                    <>
                      <tr
                        key={item.id}
                        className="border-b border-violet-essence hover:bg-violet-essence/30"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleItemExpansion(item.id)}
                              className="text-persimmon hover:text-persimmon/80"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                            <div>
                              <button
                                onClick={() => setSelectedItem(item)}
                                className={`${hasAhspData ? 'text-persimmon hover:underline font-semibold' : 'text-palladium cursor-default'}`}
                                disabled={!hasAhspData}
                              >
                                <span className="font-medium">{item.no}</span>{' '}
                                {item.uraian || 'N/A'}
                              </button>
                              <p className="text-xs text-palladium">
                                {item.volume} {item.satuan} • {item.kategori}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right">{formatCurrency(item.hargaSatuan || 0)}</td>
                        <td className="p-3 text-right">
                          <div className="text-xs">
                            <div>L: {formatCurrency(item.costBreakdown.laborCost)}</div>
                            <div>M: {formatCurrency(item.costBreakdown.materialCost)}</div>
                            <div>E: {formatCurrency(item.costBreakdown.equipmentCost)}</div>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <span
                            className={`${adjustedPrice !== item.hargaSatuan ? 'text-orange-600 font-medium' : 'text-palladium'}`}
                          >
                            {((adjustedPrice / item.hargaSatuan - 1) * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span
                            className={`${item.escalationRate > 10 ? 'text-red-500' : item.escalationRate > 5 ? 'text-yellow-500' : 'text-green-500'}`}
                          >
                            {item.escalationRate.toFixed(1)}%/yr
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(item.budgetVariance.riskLevel)}`}
                          >
                            {item.budgetVariance.riskLevel.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right font-semibold text-persimmon">
                          {formatCurrency(projectedPrice)}
                        </td>
                        <td className="p-3 text-right font-semibold">
                          {formatCurrency((item.volume || 0) * projectedPrice)}
                        </td>
                      </tr>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <tr className="bg-violet-essence/10">
                          <td colSpan={8} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              <div>
                                <h5 className="font-medium mb-2">Cost Breakdown Detail</h5>
                                <div className="space-y-1">
                                  <div className="flex justify-between">
                                    <span>Labor ({item.costBreakdown.laborPercentage}%):</span>
                                    <span>{formatCurrency(item.costBreakdown.laborCost)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>
                                      Material ({item.costBreakdown.materialPercentage}%):
                                    </span>
                                    <span>{formatCurrency(item.costBreakdown.materialCost)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>
                                      Equipment ({item.costBreakdown.equipmentPercentage}%):
                                    </span>
                                    <span>{formatCurrency(item.costBreakdown.equipmentCost)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>
                                      Overhead ({item.costBreakdown.overheadPercentage}%):
                                    </span>
                                    <span>{formatCurrency(item.costBreakdown.overheadCost)}</span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h5 className="font-medium mb-2">Risk Factors</h5>
                                <div className="space-y-1">
                                  {item.sensitivityFactors.slice(0, 3).map((factor) => (
                                    <div key={factor.id} className="flex justify-between">
                                      <span>{factor.factor}:</span>
                                      <span className="text-red-500">±{factor.impact}%</span>
                                    </div>
                                  ))}
                                  {item.sensitivityFactors.length > 3 && (
                                    <div className="text-palladium">
                                      +{item.sensitivityFactors.length - 3} more factors
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h5 className="font-medium mb-2">Regional Factors</h5>
                                <div className="space-y-1">
                                  {item.regionalFactors
                                    .filter((f) => f.isActive)
                                    .map((factor) => (
                                      <div key={factor.id} className="flex justify-between">
                                        <span>{factor.region}:</span>
                                        <span
                                          className={`${factor.adjustmentFactor > 1 ? 'text-red-500' : 'text-green-500'}`}
                                        >
                                          {((factor.adjustmentFactor - 1) * 100).toFixed(1)}%
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-bold bg-violet-essence/50 text-base">
                  <td colSpan={6} className="p-4 text-right">
                    Total Enhanced Project Budget
                  </td>
                  <td className="p-4 text-right text-persimmon">
                    {formatCurrency(totalEnhancedBudget)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="text-sm">
                      <div>+{formatCurrency(totalEnhancedBudget - totalBudget)}</div>
                      <div className="text-xs text-palladium">
                        ({(((totalEnhancedBudget - totalBudget) / totalBudget) * 100).toFixed(1)}%)
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Navigation Tabs */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {tabConfig.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
                  onClick={() => setActiveTab(tab.id as AnalysisTab)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'escalation' && (
        <PriceEscalationManager
          rabItems={enhancedItems}
          onUpdateEscalation={(escalation) => {
            // Handle escalation updates
            console.log('Escalation updated:', escalation);
          }}
        />
      )}
      {activeTab === 'variance' && <VarianceAnalysisComponent rabItems={enhancedItems} />}
      {activeTab === 'sensitivity' && (
        <SensitivityAnalysisComponent
          rabItems={enhancedItems}
          onUpdateSensitivity={(itemId, factors) => {
            // Handle sensitivity updates
            setEnhancedItems((prev) =>
              prev.map((item) =>
                item.id === itemId ? { ...item, sensitivityFactors: factors } : item
              )
            );
          }}
        />
      )}
      {activeTab === 'regional' && (
        <RegionalPriceAdjustment
          rabItems={enhancedItems}
          onUpdateRegionalFactors={(itemId, factors) => {
            // Handle regional factor updates
            setEnhancedItems((prev) =>
              prev.map((item) =>
                item.id === itemId ? { ...item, regionalFactors: factors } : item
              )
            );
          }}
        />
      )}

      {/* AHSP Detail Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={`Detail AHSP: ${selectedItem.uraian}`}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-night-black mb-2">Tenaga Kerja</h4>
              <ul className="list-disc list-inside text-sm text-palladium space-y-1">
                {Object.entries(getAhspDetails(selectedItem.ahspId).labors || {}).map(
                  ([type, coef]) => (
                    <li key={type}>
                      {type}: {coef} OH
                    </li>
                  )
                )}
                {Object.keys(getAhspDetails(selectedItem.ahspId).labors || {}).length === 0 && (
                  <li className="text-palladium italic">Tidak ada data tenaga kerja</li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-night-black mb-2">Material</h4>
              <ul className="list-disc list-inside text-sm text-palladium space-y-1">
                {Object.entries(getAhspDetails(selectedItem.ahspId).materials || {}).map(
                  ([name, coef]) => (
                    <li key={name}>
                      {name}: {coef} {ahspData?.materialUnits?.[name] || '-'}
                    </li>
                  )
                )}
                {Object.keys(getAhspDetails(selectedItem.ahspId).materials || {}).length === 0 && (
                  <li className="text-palladium italic">Tidak ada data material</li>
                )}
              </ul>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
