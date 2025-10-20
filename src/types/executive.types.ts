/**
 * Executive Dashboard Type Definitions
 * Phase 3.5: Quick Wins - Executive Dashboard
 * 
 * High-level KPIs, metrics, and real-time project insights
 */

export type KPITrend = 'up' | 'down' | 'stable';
export type KPIStatus = 'excellent' | 'good' | 'warning' | 'critical';
export type TimeFrame = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

/**
 * Key Performance Indicator
 */
export interface ExecutiveKPI {
  id: string;
  name: string;
  category: 'financial' | 'schedule' | 'quality' | 'safety' | 'productivity' | 'resource';
  
  value: number;
  unit: string;
  target?: number;
  
  trend: KPITrend;
  trendPercentage: number;
  
  status: KPIStatus;
  
  comparison: {
    previousPeriod: number;
    change: number;
    changePercentage: number;
  };
  
  sparklineData?: number[]; // Last 7-30 data points
  
  description?: string;
  calculatedAt: Date;
}

/**
 * Project Portfolio Summary
 */
export interface ProjectPortfolioSummary {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  pausedProjects: number;
  
  totalValue: number;
  completedValue: number;
  
  byPhase: {
    planning: number;
    design: number;
    construction: number;
    closeout: number;
  };
  
  byStatus: {
    onTrack: number;
    atRisk: number;
    delayed: number;
  };
  
  topProjects: {
    id: string;
    name: string;
    value: number;
    progress: number;
    status: string;
  }[];
}

/**
 * Financial Overview
 */
export interface FinancialOverview {
  totalBudget: number;
  actualCost: number;
  committedCost: number;
  forecastCost: number;
  
  variance: number;
  variancePercentage: number;
  
  cashFlow: {
    incoming: number;
    outgoing: number;
    net: number;
  };
  
  profitability: {
    grossProfit: number;
    grossMargin: number;
    netProfit: number;
    netMargin: number;
    roi: number;
  };
  
  costBreakdown: {
    category: string;
    planned: number;
    actual: number;
    variance: number;
  }[];
  
  monthlyTrend: {
    month: string;
    budget: number;
    actual: number;
    forecast: number;
  }[];
}

/**
 * Schedule Performance
 */
export interface SchedulePerformance {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  
  overallProgress: number;
  scheduledProgress: number;
  
  scheduleVariance: number; // days
  schedulePerformanceIndex: number; // SPI
  
  milestones: {
    total: number;
    completed: number;
    upcoming: number;
    missed: number;
  };
  
  criticalPath: {
    totalDuration: number;
    completed: number;
    remaining: number;
    delays: number;
  };
  
  upcomingMilestones: {
    id: string;
    name: string;
    date: Date;
    daysRemaining: number;
    progress: number;
    status: 'on_track' | 'at_risk' | 'delayed';
  }[];
}

/**
 * Resource Utilization Summary
 */
export interface ResourceUtilizationSummary {
  totalResources: number;
  activeResources: number;
  
  laborUtilization: {
    available: number;
    allocated: number;
    utilized: number;
    idle: number;
    utilizationRate: number;
  };
  
  equipmentUtilization: {
    total: number;
    inUse: number;
    available: number;
    maintenance: number;
    utilizationRate: number;
  };
  
  materialStatus: {
    totalValue: number;
    consumed: number;
    remaining: number;
    onOrder: number;
  };
  
  byCategory: {
    category: string;
    total: number;
    utilized: number;
    utilizationRate: number;
  }[];
  
  topBottlenecks: {
    resource: string;
    demandRate: number;
    availabilityRate: number;
    shortage: number;
  }[];
}

/**
 * Quality & Safety Summary
 */
export interface QualitySafetySummary {
  quality: {
    inspections: {
      total: number;
      passed: number;
      failed: number;
      passRate: number;
    };
    defects: {
      total: number;
      open: number;
      closed: number;
      critical: number;
    };
    nonConformances: number;
    reworkCost: number;
  };
  
  safety: {
    incidents: {
      total: number;
      bySeverity: Record<string, number>;
      lostTimeInjuries: number;
    };
    rates: {
      trir: number; // Total Recordable Incident Rate
      ltifr: number; // Lost Time Injury Frequency Rate
    };
    daysSinceLastIncident: number;
    trainingCompliance: number;
    ppeCompliance: number;
  };
}

/**
 * Risk Dashboard Summary
 */
export interface RiskDashboardSummary {
  totalRisks: number;
  activeRisks: number;
  
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  
  byCategory: Record<string, number>;
  
  topRisks: {
    id: string;
    title: string;
    probability: number;
    impact: number;
    score: number;
    status: string;
    mitigationProgress: number;
  }[];
  
  riskExposure: number;
  contingencyReserve: number;
  utilizedReserve: number;
}

/**
 * Productivity Metrics
 */
export interface ProductivityMetrics {
  overallProductivity: number; // percentage
  
  costPerformanceIndex: number; // CPI
  schedulePerformanceIndex: number; // SPI
  
  earnedValue: number;
  plannedValue: number;
  actualCost: number;
  
  estimateAtCompletion: number;
  estimateToComplete: number;
  varianceAtCompletion: number;
  
  laborProductivity: {
    hoursPlanned: number;
    hoursActual: number;
    efficiency: number;
  };
  
  changeOrders: {
    total: number;
    approved: number;
    pending: number;
    totalImpact: number;
  };
}

/**
 * Alert & Notification
 */
export interface ExecutiveAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  category: 'financial' | 'schedule' | 'quality' | 'safety' | 'resource' | 'risk';
  
  title: string;
  message: string;
  
  priority: number;
  
  actionRequired: boolean;
  actionUrl?: string;
  
  relatedEntityType?: string;
  relatedEntityId?: string;
  
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * Executive Dashboard Data
 */
export interface ExecutiveDashboardData {
  projectId?: string; // If null, shows all projects
  timeFrame: TimeFrame;
  customDateRange?: {
    start: Date;
    end: Date;
  };
  
  kpis: ExecutiveKPI[];
  
  portfolio: ProjectPortfolioSummary;
  financial: FinancialOverview;
  schedule: SchedulePerformance;
  resources: ResourceUtilizationSummary;
  qualitySafety: QualitySafetySummary;
  risks: RiskDashboardSummary;
  productivity: ProductivityMetrics;
  
  alerts: ExecutiveAlert[];
  
  generatedAt: Date;
  refreshInterval: number; // seconds
}

/**
 * Dashboard Widget Configuration
 */
export interface DashboardWidget {
  id: string;
  type: 
    | 'kpi_card'
    | 'line_chart'
    | 'bar_chart'
    | 'pie_chart'
    | 'gauge'
    | 'table'
    | 'timeline'
    | 'map'
    | 'alert_list';
  
  title: string;
  dataSource: string;
  
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  config: Record<string, any>;
  
  refreshInterval?: number;
  lastRefresh?: Date;
  
  visible: boolean;
}

/**
 * Dashboard Layout
 */
export interface DashboardLayout {
  id: string;
  name: string;
  userId: string;
  
  isDefault: boolean;
  
  widgets: DashboardWidget[];
  
  filters: {
    projectIds?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
    categories?: string[];
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export default ExecutiveDashboardData;
