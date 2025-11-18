// React default import removed (using automatic JSX runtime)
import { useState, useEffect, useMemo, Component, ErrorInfo, ReactNode, Suspense, lazy } from 'react';
import { logger } from '@/utils/logger.enhanced';
import { RabItem, AhspData, EnhancedRabItem } from '@/types';
import { CardPro } from '@/components/DesignSystem';
import { formatCurrency } from '@/constants';
import { Modal } from '@/components/Modal';
import { ButtonPro } from '@/components/DesignSystem';
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
  CheckSquare,
} from 'lucide-react';

// Lazy load advanced analysis components to isolate errors
const PriceEscalationManager = lazy(() => import('@/components/PriceEscalationManager').catch(err => {
  logger.error('Failed to load PriceEscalationManager', err, { component: 'EnhancedRabAhspView' });
  return { default: () => <div className="p-4 text-red-600">Failed to load Price Escalation Manager</div> };
}));

const VarianceAnalysisComponent = lazy(() => import('@/components/VarianceAnalysisComponent').catch(err => {
  logger.error('Failed to load VarianceAnalysisComponent', err, { component: 'EnhancedRabAhspView' });
  return { default: () => <div className="p-4 text-red-600">Failed to load Variance Analysis</div> };
}));

const SensitivityAnalysisComponent = lazy(() => import('@/components/SensitivityAnalysisComponent').catch(err => {
  logger.error('Failed to load SensitivityAnalysisComponent', err, { component: 'EnhancedRabAhspView' });
  return { default: () => <div className="p-4 text-red-600">Failed to load Sensitivity Analysis</div> };
}));

const RegionalPriceAdjustment = lazy(() => import('@/components/RegionalPriceAdjustment').catch(err => {
  logger.error('Failed to load RegionalPriceAdjustment', err, { component: 'EnhancedRabAhspView' });
  return { default: () => <div className="p-4 text-red-600">Failed to load Regional Price Adjustment</div> };
}));

import EnhancedRabService from '@/api/enhancedRabService';
import { useProject } from '@/contexts/ProjectContext';
import { useToast } from '@/contexts/ToastContext';

// Error Boundary untuk catch React error #31
class RabErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Error caught in RAB Error Boundary', error, { 
      component: 'RabErrorBoundary',
      errorInfo: errorInfo.componentStack,
      message: error.message,
      stack: error.stack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <CardPro>
          <div className="p-6 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Error Loading RAB & AHSP
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {this.state.error?.message || 'Unknown error occurred'}
            </p>
            <pre className="text-xs bg-slate-100 p-4 rounded overflow-auto max-h-64 text-left">
              {this.state.error?.stack}
            </pre>
            <ButtonPro
              variant="primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="mt-4"
            >
              Reload Page
            </ButtonPro>
          </div>
        </CardPro>
      );
    }

    return this.props.children;
  }
}

interface EnhancedRabAhspViewProps {
  items?: RabItem[];
  ahspData?: AhspData;
  projectLocation?: string;
  projectId?: string;
  onNavigate?: (viewId: string, params?: any) => void;
}

type AnalysisTab = 'overview' | 'escalation' | 'variance' | 'sensitivity' | 'regional';

// Main component function
function EnhancedRabAhspView({
  items: propsItems,
  ahspData: propsAhspData,
  projectLocation,
  onNavigate,
}: EnhancedRabAhspViewProps) {
  const { currentProject } = useProject();
  const { addToast } = useToast();
  
  const [items, setItems] = useState<RabItem[]>(propsItems || []);
  const [ahspData, setAhspData] = useState<AhspData | null>(propsAhspData || null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<RabItem | null>(null);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('overview');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  
  // ✅ Fetch data if not provided via props
  useEffect(() => {
    const fetchData = async () => {
      if (propsItems && propsAhspData) {
        // Data already provided via props
        setItems(propsItems);
        setAhspData(propsAhspData);
        setLoading(false);
        return;
      }

      // Fetch data from project
      if (!currentProject?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // TODO: Replace with actual API calls when ready
        // const rabItems = await rabService.getRabItems(currentProject.id);
        // const ahsp = await ahspService.getAhspData(currentProject.id);
        
        // For now, use sample data or empty array
        setItems([]);
        setAhspData(null);
        
        // ✅ FIX: addToast signature is (message, type) not ({type, message})
        addToast('RAB & AHSP data will be loaded from your project', 'info');
      } catch (error) {
        logger.error('Error fetching RAB data', error as Error, { 
          component: 'EnhancedRabAhspView',
          projectId: currentProject?.id
        });
        // ✅ FIX: addToast signature is (message, type) not ({type, message})
        addToast('Failed to load RAB data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentProject?.id, propsItems, propsAhspData, addToast]);
  
  // ✅ FIX: Initialize enhancedItems safely - only map if items exists
  const [enhancedItems, setEnhancedItems] = useState<EnhancedRabItem[]>([]);

  // Update enhancedItems when items change
  useEffect(() => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      setEnhancedItems([]);
      return;
    }
    
    const enhanced = items.map((item) =>
      EnhancedRabService.createEnhancedRabItem(item, {
        includeHistoricalData: true,
        calculateProjections: true,
        region: projectLocation || currentProject?.location,
      })
    );
    setEnhancedItems(enhanced);
  }, [items, projectLocation, currentProject?.location]);

  // Loading state
  if (loading) {
    return (
      <CardPro>
        <div className="p-6">
          <div className="flex items-center justify-center p-8">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-slate-700">Loading RAB & AHSP data...</p>
            </div>
          </div>
        </div>
      </CardPro>
    );
  }

  // No data state - IMPROVED with better messaging
  if (!items || items.length === 0) {
    logger.debug('No RAB items available', { component: 'EnhancedRabAhspView' });
    return (
      <CardPro>
        <div className="p-6">
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <AlertTriangle className="w-16 h-16 text-amber-500" />
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-900">No RAB Data Available</p>
              <p className="text-sm text-slate-600 mt-2">
                There are no RAB items in this project yet.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                RAB items need to be added to your project in Firestore.
              </p>
            </div>
          </div>
        </div>
      </CardPro>
    );
  }

  // Missing AHSP data - show RAB but with limited functionality
  if (!ahspData) {
    logger.debug('No AHSP data available', { component: 'EnhancedRabAhspView' });
  }

  logger.debug('Rendering RAB view', { component: 'EnhancedRabAhspView', itemCount: items.length });

  // Memoize expensive budget calculations - only recalculate when items change
  const totalBudget = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + (item?.volume || 0) * (item?.hargaSatuan || 0),
      0
    );
  }, [items]);

  const totalEnhancedBudget = useMemo(() => {
    return enhancedItems.reduce((sum, item) => {
      const adjustedPrice = EnhancedRabService.applyRegionalAdjustments(
        item.hargaSatuan,
        item.regionalFactors
      );
      return sum + item.volume * adjustedPrice;
    }, 0);
  }, [enhancedItems]);

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
    if (link.parentNode) {
      document.body.removeChild(link);
    }
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
        <CardPro>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-palladium">Total Items</p>
                <p className="text-2xl font-bold text-night-black">{items.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-persimmon" />
            </div>
          </div>
        </CardPro>

        <CardPro>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-palladium">Base Budget</p>
                <p className="text-2xl font-bold text-night-black">{formatCurrency(totalBudget)}</p>
              </div>
              <Calculator className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </CardPro>

        <CardPro>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-palladium">Adjusted Budget</p>
                <p className="text-2xl font-bold text-persimmon">
                  {formatCurrency(totalEnhancedBudget)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-persimmon" />
            </div>
          </div>
        </CardPro>

        <CardPro>
          <div className="p-4">
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
          </div>
        </CardPro>
      </div>

      {/* Enhanced RAB Table */}
      <CardPro>
        <div className="p-6 pb-4 flex flex-row justify-between items-center border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-night-black">Enhanced RAB Analysis</h2>
            <p className="text-sm text-palladium mt-1">
              Comprehensive cost analysis with risk assessment and regional adjustments
            </p>
          </div>
          <ButtonPro variant="outline" onClick={handleExportCsv}>
            <Download className="w-4 h-4 mr-2" />
            Export Enhanced RAB
          </ButtonPro>
        </div>
        <div className="p-6 pt-4">
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
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enhancedItems.map((item) => {
                  const hasAhspData = ahspData?.labors?.[item.ahspId];
                  
                  // ⚡ PERFORMANCE: Memoize expensive calculations
                  // These calculations run on every render - wrap in useMemo hook outside map
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
                        <td className="p-3 text-right">
                          <ButtonPro 
                            variant="outline" 
                            onClick={() => onNavigate && onNavigate('rab_approval', { rabItemId: item.id })}
                          >
                            <CheckSquare className="w-4 h-4 mr-1" />
                            Approval
                          </ButtonPro>
                        </td>
                      </tr>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <tr className="bg-violet-essence/10">
                          <td colSpan={9} className="p-4">
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
                  <td colSpan={7} className="p-4 text-right">
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
        </div>
      </CardPro>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Navigation Tabs */}
      <CardPro>
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {tabConfig.map((tab) => {
              const Icon = tab.icon;
              return (
                <ButtonPro
                  key={tab.id}
                  variant={activeTab === tab.id ? 'primary' : 'outline'}
                  onClick={() => setActiveTab(tab.id as AnalysisTab)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </ButtonPro>
              );
            })}
          </div>
        </div>
      </CardPro>

      {/* Tab Content */}
      <Suspense fallback={
        <CardPro>
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading analysis component...</p>
          </div>
        </CardPro>
      }>
        {(() => {
          try {
            logger.debug('Rendering RAB tab', { component: 'EnhancedRabAhspView', activeTab });
            
            if (activeTab === 'overview') {
              return renderOverviewTab();
            }
            
            if (activeTab === 'escalation') {
              return (
                <PriceEscalationManager
                  rabItems={enhancedItems}
                  onUpdateEscalation={(escalation) => {
                    logger.info('Price escalation updated', { escalation });
                  }}
                />
              );
            }
            
            if (activeTab === 'variance') {
              return <VarianceAnalysisComponent rabItems={enhancedItems} />;
            }
            
            if (activeTab === 'sensitivity') {
              return (
                <SensitivityAnalysisComponent
                  rabItems={enhancedItems}
                  onUpdateSensitivity={(itemId, factors) => {
                    setEnhancedItems((prev) =>
                      prev.map((item) =>
                        item.id === itemId ? { ...item, sensitivityFactors: factors } : item
                      )
                    );
                  }}
                />
              );
            }
            
            if (activeTab === 'regional') {
              return (
                <RegionalPriceAdjustment
                  rabItems={enhancedItems}
                  onUpdateRegionalFactors={(itemId, factors) => {
                    setEnhancedItems((prev) =>
                      prev.map((item) =>
                        item.id === itemId ? { ...item, regionalFactors: factors } : item
                      )
                    );
                  }}
                />
              );
            }
            
            return null;
          } catch (err) {
            logger.error('Tab render error', err as Error, { 
              component: 'EnhancedRabAhspView', 
              activeTab 
            });
            return (
              <CardPro>
                <div className="p-6 text-center">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 font-semibold">Error Rendering Tab</p>
                  <p className="text-sm text-slate-600 mt-2">{String(err)}</p>
                  <ButtonPro
                    variant="outline"
                    onClick={() => setActiveTab('overview')}
                    className="mt-4"
                  >
                    Back to Overview
                  </ButtonPro>
                </div>
              </CardPro>
            );
          }
        })()}
      </Suspense>

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

// Export with Error Boundary wrapper
export default function EnhancedRabAhspViewWithBoundary(props: EnhancedRabAhspViewProps) {
  return (
    <RabErrorBoundary>
      <EnhancedRabAhspView {...props} />
    </RabErrorBoundary>
  );
}


