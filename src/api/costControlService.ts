import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import {
  CostControlSummary,
  EVMMetrics,
  BudgetVsActual,
  CostBreakdown,
  TrendAnalysis,
  TrendData,
  CashFlowProjection,
  CashFlowSummary,
  VarianceAnalysis,
  CostCategory,
  CostCategoryTotal,
  ModuleCostSummary,
  ForecastData,
  CostControlFilters,
  CostAlert,
  TrendAnomaly,
} from '@/types/costControl';

// ============================================================================
// MAIN AGGREGATION FUNCTION
// ============================================================================

export const getCostControlSummary = async (
  projectId: string,
  filters?: CostControlFilters
): Promise<CostControlSummary> => {
  try {
    // Aggregate data from all modules
    const [wbsData, financeData, logisticsData, inventoryData, progressData] = await Promise.all([
      aggregateWBSCosts(projectId, filters),
      aggregateFinanceCosts(projectId, filters),
      aggregateLogisticsCosts(projectId, filters),
      aggregateInventoryCosts(projectId, filters),
      getProgressData(projectId),
    ]);

    // Calculate EVM metrics
    const evmMetrics = calculateEVMMetrics(wbsData, financeData, progressData);

    // Calculate budget vs actual
    const budgetVsActual = calculateBudgetVsActual(
      wbsData,
      financeData,
      logisticsData,
      inventoryData
    );

    // Calculate cost breakdown
    const costBreakdown = calculateCostBreakdown(financeData, logisticsData, inventoryData);

    // Calculate trend analysis
    const trendAnalysis = await calculateTrendAnalysis(projectId, filters);

    // Calculate cash flow
    const cashFlowSummary = await calculateCashFlow(projectId, filters);

    // Calculate variance analysis
    const varianceAnalysis = calculateVarianceAnalysis(wbsData, evmMetrics);

    // Calculate totals
    const totalBudget = wbsData.reduce((sum, item) => sum + item.budget, 0);
    const totalActual = financeData.totalActual;
    const totalCommitted = financeData.totalCommitted;

    return {
      totalBudget,
      totalPlanned: evmMetrics.pv,
      totalEarned: evmMetrics.ev,
      totalActual,
      totalCommitted,
      totalRemaining: totalBudget - totalActual - totalCommitted,
      evmMetrics,
      budgetVsActual,
      costBreakdown,
      trendAnalysis,
      cashFlowSummary,
      varianceAnalysis,
      reportPeriod: {
        start: filters?.startDate || new Date(new Date().getFullYear(), 0, 1),
        end: filters?.endDate || new Date(),
      },
      generatedAt: Timestamp.now(),
      generatedBy: 'system',
    };
  } catch (error) {
    console.error('Error generating cost control summary:', error);
    throw error;
  }
};

// ============================================================================
// DATA AGGREGATION FUNCTIONS
// ============================================================================

interface WBSCostData {
  wbsCode: string;
  wbsName: string;
  level: number;
  budget: number;
  planned: number;
  earned: number;
  actual: number;
  committed: number;
  progress: number;
}

const aggregateWBSCosts = async (
  projectId: string,
  filters?: CostControlFilters
): Promise<WBSCostData[]> => {
  const wbsQuery = query(collection(db, 'wbs'), where('projectId', '==', projectId));

  const snapshot = await getDocs(wbsQuery);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      wbsCode: data.wbsCode,
      wbsName: data.wbsName,
      level: data.level,
      budget: data.budgetAmount || 0,
      planned: data.plannedAmount || 0,
      earned: data.earnedAmount || 0,
      actual: data.actualCost || 0,
      committed: data.committedAmount || 0,
      progress: data.progress || 0,
    };
  });
};

interface FinanceCostData {
  totalActual: number;
  totalCommitted: number;
  byCategory: Record<string, number>;
  transactions: any[];
}

const aggregateFinanceCosts = async (
  projectId: string,
  filters?: CostControlFilters
): Promise<FinanceCostData> => {
  // Aggregate from journal entries
  const journalQuery = query(
    collection(db, 'journalEntries'),
    where('projectId', '==', projectId),
    where('status', '==', 'posted')
  );

  const journalSnapshot = await getDocs(journalQuery);
  let totalActual = 0;
  const byCategory: Record<string, number> = {};

  journalSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    data.lines?.forEach((line: any) => {
      if (line.debit) {
        totalActual += line.debit;
        byCategory[line.accountCode] = (byCategory[line.accountCode] || 0) + line.debit;
      }
    });
  });

  // Aggregate committed costs from POs
  const poQuery = query(
    collection(db, 'purchaseOrders'),
    where('projectId', '==', projectId),
    where('status', 'in', ['approved', 'in_progress'])
  );

  const poSnapshot = await getDocs(poQuery);
  let totalCommitted = 0;

  poSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    totalCommitted += data.totalAmount || 0;
  });

  return {
    totalActual,
    totalCommitted,
    byCategory,
    transactions: journalSnapshot.docs.map((doc) => doc.data()),
  };
};

const aggregateLogisticsCosts = async (
  projectId: string,
  filters?: CostControlFilters
): Promise<{ totalCost: number; itemCount: number }> => {
  const grQuery = query(
    collection(db, 'goodsReceipts'),
    where('projectId', '==', projectId),
    where('status', '==', 'completed')
  );

  const snapshot = await getDocs(grQuery);
  let totalCost = 0;
  let itemCount = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    data.items?.forEach((item: any) => {
      totalCost += (item.receivedQuantity || 0) * (item.unitPrice || 0);
      itemCount++;
    });
  });

  return { totalCost, itemCount };
};

const aggregateInventoryCosts = async (
  projectId: string,
  filters?: CostControlFilters
): Promise<{ totalValue: number; transactionCount: number }> => {
  const transactionQuery = query(
    collection(db, 'inventoryTransactions'),
    where('projectId', '==', projectId),
    where('status', '==', 'completed')
  );

  const snapshot = await getDocs(transactionQuery);
  let totalValue = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    totalValue += data.totalCost || 0;
  });

  return {
    totalValue,
    transactionCount: snapshot.size,
  };
};

const getProgressData = async (projectId: string): Promise<number> => {
  const projectRef = doc(db, 'projects', projectId);
  const projectSnap = await getDoc(projectRef);

  if (!projectSnap.exists()) {
    return 0;
  }

  return projectSnap.data().progress || 0;
};

// ============================================================================
// EVM CALCULATIONS
// ============================================================================

export const calculateEVMMetrics = (
  wbsData: WBSCostData[],
  financeData: FinanceCostData,
  physicalProgress: number
): EVMMetrics => {
  // Calculate totals
  const bac = wbsData.reduce((sum, item) => sum + item.budget, 0);
  const pv = wbsData.reduce((sum, item) => sum + item.planned, 0);
  const ac = financeData.totalActual;
  const ev = bac * (physicalProgress / 100);

  // Cost variance and performance
  const cv = ev - ac;
  const cpi = ev > 0 ? ev / ac : 0;

  // Schedule variance and performance
  const sv = ev - pv;
  const spi = pv > 0 ? ev / pv : 0;

  // Forecasting
  const eac = cpi > 0 ? bac / cpi : bac;
  const etc = eac - ac;
  const vac = bac - eac;
  const tcpi = bac - ev > 0 && bac - ac > 0 ? (bac - ev) / (bac - ac) : 0;

  // Percentages
  const percentComplete = physicalProgress;
  const percentSpent = bac > 0 ? (ac / bac) * 100 : 0;

  // Status determination
  let status: EVMMetrics['status'] = 'on_track';
  if (cpi < 0.9 && spi < 0.9) {
    status = 'critical';
  } else if (cpi < 0.9) {
    status = 'over_budget';
  } else if (spi < 0.9) {
    status = 'behind_schedule';
  } else if (cpi > 1.1) {
    status = 'under_budget';
  } else if (spi > 1.1) {
    status = 'ahead_of_schedule';
  }

  // Health score (0-100)
  const healthScore = Math.min(100, Math.max(0, cpi * 50 + spi * 50));

  return {
    pv,
    ev,
    ac,
    cv,
    cpi,
    sv,
    spi,
    bac,
    eac,
    etc,
    vac,
    tcpi,
    percentComplete,
    percentSpent,
    status,
    healthScore,
    calculatedAt: Timestamp.now(),
  };
};

// ============================================================================
// BUDGET VS ACTUAL CALCULATIONS
// ============================================================================

const calculateBudgetVsActual = (
  wbsData: WBSCostData[],
  financeData: FinanceCostData,
  logisticsData: { totalCost: number },
  inventoryData: { totalValue: number }
): BudgetVsActual[] => {
  const categories: BudgetVsActual[] = [];

  // Group by WBS
  wbsData.forEach((wbs) => {
    const variance = wbs.budget - wbs.actual;
    const variancePercent = wbs.budget > 0 ? (variance / wbs.budget) * 100 : 0;

    let status: BudgetVsActual['status'] = 'within_budget';
    if (wbs.actual > wbs.budget) {
      status = 'over_budget';
    } else if (wbs.actual > wbs.budget * 0.9) {
      status = 'near_limit';
    } else if (wbs.budget - wbs.actual - wbs.committed <= 0) {
      status = 'depleted';
    }

    categories.push({
      category: wbs.wbsCode,
      categoryName: wbs.wbsName,
      budgetAmount: wbs.budget,
      actualAmount: wbs.actual,
      committedAmount: wbs.committed,
      remainingBudget: wbs.budget - wbs.actual - wbs.committed,
      variance,
      variancePercent,
      status,
      wbsCode: wbs.wbsCode,
      wbsName: wbs.wbsName,
    });
  });

  return categories;
};

// ============================================================================
// COST BREAKDOWN CALCULATIONS
// ============================================================================

const calculateCostBreakdown = (
  financeData: FinanceCostData,
  logisticsData: { totalCost: number; itemCount: number },
  inventoryData: { totalValue: number; transactionCount: number }
): CostBreakdown[] => {
  const totalCost = financeData.totalActual + logisticsData.totalCost + inventoryData.totalValue;

  const breakdowns: CostBreakdown[] = [
    {
      module: 'finance',
      moduleName: 'Finance & Accounting',
      totalCost: financeData.totalActual,
      percentage: totalCost > 0 ? (financeData.totalActual / totalCost) * 100 : 0,
      items: [],
      trend: 'stable',
    },
    {
      module: 'logistics',
      moduleName: 'Logistics & Procurement',
      totalCost: logisticsData.totalCost,
      percentage: totalCost > 0 ? (logisticsData.totalCost / totalCost) * 100 : 0,
      items: [],
      trend: 'stable',
    },
    {
      module: 'inventory',
      moduleName: 'Inventory Management',
      totalCost: inventoryData.totalValue,
      percentage: totalCost > 0 ? (inventoryData.totalValue / totalCost) * 100 : 0,
      items: [],
      trend: 'stable',
    },
  ];

  return breakdowns;
};

// ============================================================================
// TREND ANALYSIS
// ============================================================================

const calculateTrendAnalysis = async (
  projectId: string,
  filters?: CostControlFilters
): Promise<TrendAnalysis> => {
  // Get historical EVM data (mock for now - would come from historical records)
  const dataPoints: TrendData[] = [];

  // Generate sample trend data for last 12 months
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    dataPoints.push({
      date,
      pv: 1000000 * (12 - i),
      ev: 950000 * (12 - i),
      ac: 980000 * (12 - i),
      cpi: 0.95 + Math.random() * 0.1,
      spi: 0.92 + Math.random() * 0.1,
      forecastEAC: 12000000 + i * 50000,
    });
  }

  // Calculate averages
  const averageCPI = dataPoints.reduce((sum, dp) => sum + dp.cpi, 0) / dataPoints.length;
  const averageSPI = dataPoints.reduce((sum, dp) => sum + dp.spi, 0) / dataPoints.length;

  // Determine trends
  const recentCPI = dataPoints.slice(-3).map((dp) => dp.cpi);
  const olderCPI = dataPoints.slice(-6, -3).map((dp) => dp.cpi);
  const cpiTrend = recentCPI.reduce((a, b) => a + b) / recentCPI.length;
  const olderCPIAvg = olderCPI.reduce((a, b) => a + b) / olderCPI.length;

  const costTrend: TrendAnalysis['costTrend'] =
    cpiTrend > olderCPIAvg + 0.05
      ? 'improving'
      : cpiTrend < olderCPIAvg - 0.05
        ? 'deteriorating'
        : 'stable';

  const recentSPI = dataPoints.slice(-3).map((dp) => dp.spi);
  const olderSPI = dataPoints.slice(-6, -3).map((dp) => dp.spi);
  const spiTrend = recentSPI.reduce((a, b) => a + b) / recentSPI.length;
  const olderSPIAvg = olderSPI.reduce((a, b) => a + b) / olderSPI.length;

  const scheduleTrend: TrendAnalysis['scheduleTrend'] =
    spiTrend > olderSPIAvg + 0.05
      ? 'improving'
      : spiTrend < olderSPIAvg - 0.05
        ? 'deteriorating'
        : 'stable';

  // Detect anomalies
  const anomalies: TrendAnomaly[] = [];
  dataPoints.forEach((dp) => {
    if (dp.cpi < 0.85) {
      anomalies.push({
        date: dp.date,
        type: 'cost_spike',
        severity: 'high',
        description: 'Cost Performance Index dropped below 0.85',
        value: dp.cpi,
        threshold: 0.85,
      });
    }
  });

  return {
    dataPoints,
    averageCPI,
    averageSPI,
    costTrend,
    scheduleTrend,
    confidenceLevel: 'medium',
    anomalies,
  };
};

// ============================================================================
// CASH FLOW CALCULATIONS
// ============================================================================

const calculateCashFlow = async (
  projectId: string,
  filters?: CostControlFilters
): Promise<CashFlowSummary> => {
  const projections: CashFlowProjection[] = [];

  // Generate cash flow projections for next 12 months
  const now = new Date();
  let cumulativeFlow = 0;

  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthStr = monthDate.toLocaleString('default', { month: 'short', year: 'numeric' });

    const plannedInflow = 2000000;
    const actualInflow = i === 0 ? 1950000 : 0;
    const plannedOutflow = 1500000 + Math.random() * 200000;
    const actualOutflow = i === 0 ? plannedOutflow * 1.05 : 0;
    const forecastedOutflow = plannedOutflow * (0.95 + Math.random() * 0.1);

    const netCashFlow = (actualInflow || plannedInflow) - (actualOutflow || forecastedOutflow);
    cumulativeFlow += netCashFlow;

    projections.push({
      month: monthStr,
      monthDate,
      plannedInflow,
      actualInflow,
      plannedOutflow,
      actualOutflow,
      forecastedOutflow,
      netCashFlow,
      cumulativeCashFlow: cumulativeFlow,
      status: netCashFlow > 0 ? 'surplus' : netCashFlow < 0 ? 'deficit' : 'balanced',
    });
  }

  const totalPlannedInflow = projections.reduce((sum, p) => sum + p.plannedInflow, 0);
  const totalActualInflow = projections.reduce((sum, p) => sum + p.actualInflow, 0);
  const totalPlannedOutflow = projections.reduce((sum, p) => sum + p.plannedOutflow, 0);
  const totalActualOutflow = projections.reduce((sum, p) => sum + p.actualOutflow, 0);
  const totalForecastedOutflow = projections.reduce((sum, p) => sum + p.forecastedOutflow, 0);

  const cashFlowAlerts: any[] = [];

  return {
    projections,
    totalPlannedInflow,
    totalActualInflow,
    totalPlannedOutflow,
    totalActualOutflow,
    totalForecastedOutflow,
    currentBalance: cumulativeFlow,
    projectedBalance: cumulativeFlow,
    cashFlowAlerts,
  };
};

// ============================================================================
// VARIANCE ANALYSIS
// ============================================================================

const calculateVarianceAnalysis = (
  wbsData: WBSCostData[],
  evmMetrics: EVMMetrics
): VarianceAnalysis[] => {
  return wbsData.map((wbs) => {
    const costVariance = wbs.earned - wbs.actual;
    const scheduleVariance = wbs.earned - wbs.planned;
    const budgetVariance = wbs.budget - wbs.actual;

    const costVariancePercent = wbs.actual > 0 ? (costVariance / wbs.actual) * 100 : 0;
    const scheduleVariancePercent = wbs.planned > 0 ? (scheduleVariance / wbs.planned) * 100 : 0;
    const budgetVariancePercent = wbs.budget > 0 ? (budgetVariance / wbs.budget) * 100 : 0;

    const cpi = wbs.actual > 0 ? wbs.earned / wbs.actual : 0;
    const spi = wbs.planned > 0 ? wbs.earned / wbs.planned : 0;

    const costStatus: VarianceAnalysis['costStatus'] =
      costVariance > 0 ? 'favorable' : costVariance < 0 ? 'unfavorable' : 'neutral';

    const scheduleStatus: VarianceAnalysis['scheduleStatus'] =
      scheduleVariance > 0 ? 'favorable' : scheduleVariance < 0 ? 'unfavorable' : 'neutral';

    const overallStatus: VarianceAnalysis['overallStatus'] =
      cpi >= 0.95 && spi >= 0.95 ? 'on_track' : cpi < 0.85 || spi < 0.85 ? 'critical' : 'at_risk';

    return {
      wbsCode: wbs.wbsCode,
      wbsName: wbs.wbsName,
      level: wbs.level,
      budgetAmount: wbs.budget,
      plannedAmount: wbs.planned,
      earnedAmount: wbs.earned,
      actualAmount: wbs.actual,
      costVariance,
      scheduleVariance,
      budgetVariance,
      costVariancePercent,
      scheduleVariancePercent,
      budgetVariancePercent,
      cpi,
      spi,
      costStatus,
      scheduleStatus,
      overallStatus,
    };
  });
};

// ============================================================================
// FORECASTING
// ============================================================================

export const generateForecast = (evmMetrics: EVMMetrics): ForecastData => {
  const { bac, ac, ev, cpi, spi } = evmMetrics;

  // Calculate EAC using different methods
  const eacByCPI = cpi > 0 ? bac / cpi : bac;
  const eacBySPI = ac + (bac - ev) / spi;
  const eacByCPIAndSPI = ac + (bac - ev) / (cpi * spi);

  // Use CPI method as default
  const selectedEAC = eacByCPI;

  // Calculate remaining duration
  const daysRemaining = Math.ceil(((100 - evmMetrics.percentComplete) / spi) * 30);
  const forecastCompletionDate = new Date();
  forecastCompletionDate.setDate(forecastCompletionDate.getDate() + daysRemaining);

  // Confidence factors (0-100)
  const dataQuality = cpi > 0 && spi > 0 ? 85 : 50;
  const historicalAccuracy = 75; // Would be calculated from historical data
  const externalFactors = 70; // Would consider market conditions, etc.

  const confidenceLevel = (dataQuality + historicalAccuracy + externalFactors) / 3;

  return {
    forecastDate: new Date(),
    eacByCPI,
    eacBySPI,
    eacByCPIAndSPI,
    selectedEAC,
    selectedMethod: 'cpi',
    forecastCompletionDate,
    daysRemaining,
    confidenceLevel,
    confidenceFactors: {
      dataQuality,
      historicalAccuracy,
      externalFactors,
    },
    assumptions: [
      'Current performance trends continue',
      'No major scope changes',
      'Resources remain available',
      'External conditions remain stable',
    ],
  };
};

// ============================================================================
// COST ALERTS
// ============================================================================

export const generateCostAlerts = (
  evmMetrics: EVMMetrics,
  budgetVsActual: BudgetVsActual[]
): CostAlert[] => {
  const alerts: CostAlert[] = [];

  // Budget exceeded alerts
  budgetVsActual.forEach((item) => {
    if (item.status === 'over_budget') {
      alerts.push({
        id: `budget_${item.category}`,
        alertType: 'budget_exceeded',
        severity: item.variancePercent > 20 ? 'critical' : 'high',
        title: 'Budget Exceeded',
        message: `${item.categoryName} has exceeded budget by ${Math.abs(item.variancePercent).toFixed(1)}%`,
        affectedWBS: item.wbsCode,
        currentValue: item.actualAmount,
        thresholdValue: item.budgetAmount,
        variance: item.variance,
        triggeredAt: Timestamp.now(),
        recommendedActions: [
          'Review spending in this category',
          'Identify cost-saving opportunities',
          'Request budget reallocation if necessary',
        ],
        isAcknowledged: false,
        isResolved: false,
      });
    }
  });

  // CPI alerts
  if (evmMetrics.cpi < 0.9) {
    alerts.push({
      id: 'cpi_low',
      alertType: 'cpi_low',
      severity: evmMetrics.cpi < 0.8 ? 'critical' : 'high',
      title: 'Low Cost Performance',
      message: `Cost Performance Index is ${evmMetrics.cpi.toFixed(2)}, indicating cost overrun`,
      currentValue: evmMetrics.cpi,
      thresholdValue: 0.9,
      variance: evmMetrics.cpi - 0.9,
      triggeredAt: Timestamp.now(),
      recommendedActions: [
        'Analyze cost drivers',
        'Implement cost control measures',
        'Review vendor contracts',
        'Optimize resource allocation',
      ],
      isAcknowledged: false,
      isResolved: false,
    });
  }

  // SPI alerts
  if (evmMetrics.spi < 0.9) {
    alerts.push({
      id: 'spi_low',
      alertType: 'spi_low',
      severity: evmMetrics.spi < 0.8 ? 'critical' : 'high',
      title: 'Schedule Performance Issue',
      message: `Schedule Performance Index is ${evmMetrics.spi.toFixed(2)}, indicating schedule delay`,
      currentValue: evmMetrics.spi,
      thresholdValue: 0.9,
      variance: evmMetrics.spi - 0.9,
      triggeredAt: Timestamp.now(),
      recommendedActions: [
        'Review project schedule',
        'Identify bottlenecks',
        'Add resources if needed',
        'Fast-track critical activities',
      ],
      isAcknowledged: false,
      isResolved: false,
    });
  }

  return alerts;
};

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

export const exportToExcel = async (summary: CostControlSummary, options: any): Promise<Blob> => {
  // Placeholder for Excel export
  // Would use libraries like xlsx or exceljs
  console.log('Exporting to Excel:', summary);
  return new Blob(['Excel data'], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};

export const exportToPDF = async (summary: CostControlSummary, options: any): Promise<Blob> => {
  // Placeholder for PDF export
  // Would use libraries like jsPDF or pdfmake
  console.log('Exporting to PDF:', summary);
  return new Blob(['PDF data'], { type: 'application/pdf' });
};

// ============================================================================
// WBS BUDGET CHECKING (for Material Request validation)
// ============================================================================

/**
 * Get WBS budget status for a specific WBS code
 */
export const getWBSBudgetStatus = async (
  projectId: string,
  wbsCode: string
): Promise<{
  wbsCode: string;
  wbsName: string;
  budget: number;
  actual: number;
  committed: number;
  remainingBudget: number;
  variance: number;
  variancePercent: number;
  status: 'within_budget' | 'near_limit' | 'over_budget' | 'depleted';
} | null> => {
  try {
    // Query WBS data
    const wbsQuery = query(
      collection(db, 'wbs_elements'),
      where('projectId', '==', projectId),
      where('code', '==', wbsCode)
    );

    const wbsSnapshot = await getDocs(wbsQuery);

    if (wbsSnapshot.empty) {
      return null;
    }

    const doc = wbsSnapshot.docs[0];
    const wbs = doc.data();
    const budget = wbs.budgetAmount || 0;
    const actual = wbs.actualAmount || 0;
    const committed = wbs.commitments || 0;
    const remainingBudget = budget - actual - committed;
    const variance = budget - actual;
    const variancePercent = budget > 0 ? (variance / budget) * 100 : 0;

    let status: 'within_budget' | 'near_limit' | 'over_budget' | 'depleted' = 'within_budget';
    if (actual > budget) {
      status = 'over_budget';
    } else if (actual > budget * 0.9) {
      status = 'near_limit';
    } else if (remainingBudget <= 0) {
      status = 'depleted';
    }

    return {
      wbsCode: wbs.code,
      wbsName: wbs.name,
      budget,
      actual,
      committed,
      remainingBudget,
      variance,
      variancePercent,
      status,
    };
  } catch (error) {
    console.error('Error getting WBS budget status:', error);
    return null;
  }
};
