import { Timestamp } from 'firebase/firestore';

// ============================================================================
// EVM (Earned Value Management) TYPES
// ============================================================================

export interface EVMMetrics {
  // Planned Value
  pv: number; // Planned Value (BCWS - Budgeted Cost of Work Scheduled)

  // Earned Value
  ev: number; // Earned Value (BCWP - Budgeted Cost of Work Performed)

  // Actual Cost
  ac: number; // Actual Cost (ACWP - Actual Cost of Work Performed)

  // Cost Performance
  cv: number; // Cost Variance (EV - AC)
  cpi: number; // Cost Performance Index (EV / AC)

  // Schedule Performance
  sv: number; // Schedule Variance (EV - PV)
  spi: number; // Schedule Performance Index (EV / PV)

  // Forecasting
  bac: number; // Budget at Completion
  eac: number; // Estimate at Completion
  etc: number; // Estimate to Complete (EAC - AC)
  vac: number; // Variance at Completion (BAC - EAC)
  tcpi: number; // To-Complete Performance Index

  // Percentage metrics
  percentComplete: number; // Physical progress %
  percentSpent: number; // (AC / BAC) * 100

  // Status
  status:
    | 'on_track'
    | 'over_budget'
    | 'under_budget'
    | 'behind_schedule'
    | 'ahead_of_schedule'
    | 'critical';
  healthScore: number; // 0-100, calculated from CPI and SPI

  // Time-based
  calculatedAt: Timestamp;
  projectStartDate?: Date;
  projectEndDate?: Date;
  forecastCompletionDate?: Date;
}

// ============================================================================
// BUDGET VS ACTUAL
// ============================================================================

export interface BudgetVsActual {
  category: string;
  categoryName: string;
  budgetAmount: number;
  actualAmount: number;
  committedAmount: number;
  remainingBudget: number;
  variance: number;
  variancePercent: number;
  status: 'within_budget' | 'over_budget' | 'near_limit' | 'depleted';

  // Breakdown by subcategory
  subcategories?: BudgetVsActual[];

  // WBS relationship
  wbsCode?: string;
  wbsName?: string;

  // Time period
  periodStart?: Date;
  periodEnd?: Date;
}

// ============================================================================
// COST BREAKDOWN
// ============================================================================

export interface CostBreakdown {
  module: string;
  moduleName: string;
  totalCost: number;
  percentage: number;

  // Detailed breakdown
  items: CostBreakdownItem[];

  // Trends
  previousPeriodCost?: number;
  changeAmount?: number;
  changePercent?: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface CostBreakdownItem {
  itemId: string;
  itemName: string;
  itemType: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  wbsCode?: string;
  date: Date;
}

// ============================================================================
// TREND ANALYSIS
// ============================================================================

export interface TrendData {
  date: Date;
  pv: number;
  ev: number;
  ac: number;
  cpi: number;
  spi: number;
  forecastEAC: number;
}

export interface TrendAnalysis {
  dataPoints: TrendData[];

  // Statistical analysis
  averageCPI: number;
  averageSPI: number;
  costTrend: 'improving' | 'deteriorating' | 'stable';
  scheduleTrend: 'improving' | 'deteriorating' | 'stable';

  // Predictions
  predictedCompletionDate?: Date;
  confidenceLevel: 'high' | 'medium' | 'low';

  // Alerts
  anomalies: TrendAnomaly[];
}

export interface TrendAnomaly {
  date: Date;
  type: 'cost_spike' | 'schedule_delay' | 'performance_drop' | 'budget_exceeded';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  value: number;
  threshold: number;
}

// ============================================================================
// CASH FLOW PROJECTION
// ============================================================================

export interface CashFlowProjection {
  month: string;
  monthDate: Date;

  // Inflows
  plannedInflow: number;
  actualInflow: number;

  // Outflows
  plannedOutflow: number;
  actualOutflow: number;
  forecastedOutflow: number;

  // Balance
  netCashFlow: number;
  cumulativeCashFlow: number;

  // Status
  status: 'surplus' | 'deficit' | 'balanced';
}

export interface CashFlowSummary {
  projections: CashFlowProjection[];

  // Totals
  totalPlannedInflow: number;
  totalActualInflow: number;
  totalPlannedOutflow: number;
  totalActualOutflow: number;
  totalForecastedOutflow: number;

  // Current status
  currentBalance: number;
  projectedBalance: number;

  // Alerts
  cashFlowAlerts: CashFlowAlert[];
}

export interface CashFlowAlert {
  month: string;
  type: 'deficit_warning' | 'surplus_opportunity' | 'payment_due' | 'funding_required';
  severity: 'low' | 'medium' | 'high' | 'critical';
  amount: number;
  description: string;
}

// ============================================================================
// VARIANCE ANALYSIS
// ============================================================================

export interface VarianceAnalysis {
  wbsCode: string;
  wbsName: string;
  level: number;

  // Budget
  budgetAmount: number;
  plannedAmount: number;
  earnedAmount: number;
  actualAmount: number;

  // Variances
  costVariance: number;
  scheduleVariance: number;
  budgetVariance: number;

  // Percentages
  costVariancePercent: number;
  scheduleVariancePercent: number;
  budgetVariancePercent: number;

  // Performance indices
  cpi: number;
  spi: number;

  // Status
  costStatus: 'favorable' | 'unfavorable' | 'neutral';
  scheduleStatus: 'favorable' | 'unfavorable' | 'neutral';
  overallStatus: 'on_track' | 'at_risk' | 'critical';

  // Children
  children?: VarianceAnalysis[];
}

// ============================================================================
// COST CONTROL SUMMARY
// ============================================================================

export interface CostControlSummary {
  // Top-level metrics
  totalBudget: number;
  totalPlanned: number;
  totalEarned: number;
  totalActual: number;
  totalCommitted: number;
  totalRemaining: number;

  // EVM
  evmMetrics: EVMMetrics;

  // Budget performance
  budgetVsActual: BudgetVsActual[];

  // Cost breakdown
  costBreakdown: CostBreakdown[];

  // Trends
  trendAnalysis: TrendAnalysis;

  // Cash flow
  cashFlowSummary: CashFlowSummary;

  // Variance
  varianceAnalysis: VarianceAnalysis[];

  // Time period
  reportPeriod: {
    start: Date;
    end: Date;
  };

  // Generation info
  generatedAt: Timestamp;
  generatedBy: string;
}

// ============================================================================
// COST CATEGORY
// ============================================================================

export enum CostCategory {
  LABOR = 'labor',
  MATERIALS = 'materials',
  EQUIPMENT = 'equipment',
  SUBCONTRACTOR = 'subcontractor',
  OVERHEAD = 'overhead',
  CONTINGENCY = 'contingency',
  PROFIT = 'profit',
  OTHER = 'other',
}

export interface CostCategoryTotal {
  category: CostCategory;
  categoryName: string;
  budget: number;
  planned: number;
  earned: number;
  actual: number;
  variance: number;
  variancePercent: number;
  cpi: number;
}

// ============================================================================
// MODULE COST SUMMARY
// ============================================================================

export interface ModuleCostSummary {
  module: string;
  moduleName: string;

  // Aggregated costs
  totalCost: number;
  costByCategory: Record<CostCategory, number>;

  // Item counts
  itemCount: number;

  // WBS relationship
  affectedWBS: string[];

  // Period
  periodStart: Date;
  periodEnd: Date;
}

// ============================================================================
// FORECAST DATA
// ============================================================================

export interface ForecastData {
  forecastDate: Date;

  // EAC forecasting methods
  eacByCPI: number; // BAC / CPI
  eacBySPI: number; // AC + (BAC - EV) / SPI
  eacByCPIAndSPI: number; // AC + [(BAC - EV) / (CPI * SPI)]
  eacManual?: number; // Manual forecast

  // Selected EAC
  selectedEAC: number;
  selectedMethod: 'cpi' | 'spi' | 'cpi_spi' | 'manual';

  // Completion forecast
  forecastCompletionDate: Date;
  daysRemaining: number;

  // Confidence
  confidenceLevel: number; // 0-100
  confidenceFactors: {
    dataQuality: number;
    historicalAccuracy: number;
    externalFactors: number;
  };

  // Assumptions
  assumptions: string[];
}

// ============================================================================
// PERFORMANCE INDICATORS
// ============================================================================

export interface PerformanceIndicator {
  id: string;
  name: string;
  description: string;

  // Current value
  currentValue: number;
  targetValue: number;
  unit: string;

  // Status
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  trend: 'improving' | 'declining' | 'stable';

  // Thresholds
  excellentThreshold: number;
  goodThreshold: number;
  fairThreshold: number;
  poorThreshold: number;

  // Historical data
  historicalValues: {
    date: Date;
    value: number;
  }[];
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface CostControlFilters {
  projectId?: string;
  wbsCodes?: string[];
  categories?: CostCategory[];
  startDate?: Date;
  endDate?: Date;
  modules?: string[];
  includeCommitted?: boolean;
  includeForecasts?: boolean;
}

// ============================================================================
// EXPORT OPTIONS
// ============================================================================

export interface ExportOptions {
  format: 'excel' | 'pdf' | 'csv';
  includeCharts: boolean;
  includeTrends: boolean;
  includeVarianceAnalysis: boolean;
  includeCashFlow: boolean;
  includeDetailedBreakdown: boolean;
  dateRange: {
    start: Date;
    end: Date;
  };
  filters?: CostControlFilters;
}

// ============================================================================
// DRILL-DOWN DATA
// ============================================================================

export interface DrillDownData {
  level: 'project' | 'wbs' | 'category' | 'item';
  parentId?: string;
  parentName?: string;

  // Current level data
  items: DrillDownItem[];

  // Aggregated totals
  totalBudget: number;
  totalActual: number;
  totalVariance: number;

  // Navigation
  canDrillDown: boolean;
  canDrillUp: boolean;
}

export interface DrillDownItem {
  id: string;
  name: string;
  type: string;
  budget: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'on_budget' | 'over_budget' | 'under_budget';
  hasChildren: boolean;
}

// ============================================================================
// ALERT CONFIGURATION
// ============================================================================

export interface CostAlert {
  id: string;
  alertType: 'budget_exceeded' | 'cpi_low' | 'spi_low' | 'variance_high' | 'cash_flow_deficit';
  severity: 'low' | 'medium' | 'high' | 'critical';

  // Alert details
  title: string;
  message: string;
  affectedWBS?: string;
  affectedModule?: string;

  // Values
  currentValue: number;
  thresholdValue: number;
  variance: number;

  // Timestamp
  triggeredAt: Timestamp;

  // Actions
  recommendedActions: string[];

  // Status
  isAcknowledged: boolean;
  acknowledgedAt?: Timestamp;
  acknowledgedBy?: string;
  isResolved: boolean;
  resolvedAt?: Timestamp;
}

// ============================================================================
// DASHBOARD CONFIGURATION
// ============================================================================

export interface DashboardConfig {
  userId: string;

  // Widget visibility
  widgets: {
    evmMetrics: boolean;
    budgetVsActual: boolean;
    costBreakdown: boolean;
    trendChart: boolean;
    cashFlowChart: boolean;
    varianceTable: boolean;
    kpiCards: boolean;
    alerts: boolean;
  };

  // Default filters
  defaultFilters: CostControlFilters;

  // Refresh interval (minutes)
  refreshInterval: number;

  // Chart preferences
  chartPreferences: {
    colorScheme: 'default' | 'colorblind' | 'grayscale';
    showGridLines: boolean;
    showLegend: boolean;
    animateCharts: boolean;
  };

  // Saved views
  savedViews: {
    name: string;
    filters: CostControlFilters;
  }[];
}
