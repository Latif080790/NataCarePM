/**
 * Executive Dashboard Service
 * Phase 3.5: Quick Wins - Executive Dashboard
 *
 * Aggregates high-level KPIs and metrics for C-level decision making
 */

import {
  collection,
  getDocs,
  query,
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import type {
  ExecutiveDashboardData,
  ExecutiveKPI,
  ProjectPortfolioSummary,
  FinancialOverview,
  SchedulePerformance,
  ResourceUtilizationSummary,
  QualitySafetySummary,
  RiskDashboardSummary,
  ProductivityMetrics,
  ExecutiveAlert,
  TimeFrame,
  KPITrend,
  KPIStatus,
} from '@/types/executive.types';
import type { Project } from '@/types';

class ExecutiveService {
  /**
   * Get comprehensive executive dashboard data
   */
  async getDashboardData(
    timeFrame: TimeFrame = 'month',
    projectId?: string,
    customDateRange?: { start: Date; end: Date }
  ): Promise<ExecutiveDashboardData> {
    // Fetch all data in parallel for performance
    const [
      kpis,
      portfolio,
      financial,
      schedule,
      resources,
      qualitySafety,
      risks,
      productivity,
      alerts,
    ] = await Promise.all([
      this.calculateKPIs(),
      this.getPortfolioSummary(),
      this.getFinancialOverview(),
      this.getSchedulePerformance(),
      this.getResourceUtilization(),
      this.getQualitySafetySummary(),
      this.getRiskSummary(),
      this.getProductivityMetrics(),
      this.getExecutiveAlerts(),
    ]);

    return {
      projectId,
      timeFrame,
      customDateRange,
      kpis,
      portfolio,
      financial,
      schedule,
      resources,
      qualitySafety,
      risks,
      productivity,
      alerts,
      generatedAt: new Date(),
      refreshInterval: 300, // 5 minutes
    };
  }

  /**
   * Calculate key performance indicators
   */
  private async calculateKPIs(): Promise<ExecutiveKPI[]> {
    const [financial, schedule, quality, productivity] = await Promise.all([
      this.getFinancialOverview(),
      this.getSchedulePerformance(),
      this.getQualitySafetySummary(),
      this.getProductivityMetrics(),
    ]);

    const kpis: ExecutiveKPI[] = [
      // Financial KPIs
      {
        id: 'budget-variance',
        name: 'Budget Variance',
        category: 'financial',
        value: financial.variancePercentage,
        unit: '%',
        target: 0,
        trend: this.determineTrend(financial.variancePercentage, 0),
        trendPercentage: Math.abs(financial.variancePercentage),
        status: this.determineKPIStatus(financial.variancePercentage, 0, 5, 10, true),
        comparison: {
          previousPeriod: 0,
          change: financial.variancePercentage,
          changePercentage: 0,
        },
        description: 'Actual vs Planned Budget',
        calculatedAt: new Date(),
      },
      {
        id: 'gross-margin',
        name: 'Gross Margin',
        category: 'financial',
        value: financial.profitability.grossMargin,
        unit: '%',
        target: 20,
        trend: this.determineTrend(financial.profitability.grossMargin, 20),
        trendPercentage: Math.abs(financial.profitability.grossMargin - 20),
        status: this.determineKPIStatus(financial.profitability.grossMargin, 20, 15, 10, false),
        comparison: {
          previousPeriod: 20,
          change: financial.profitability.grossMargin - 20,
          changePercentage: ((financial.profitability.grossMargin - 20) / 20) * 100,
        },
        description: 'Revenue minus direct costs',
        calculatedAt: new Date(),
      },

      // Schedule KPIs
      {
        id: 'schedule-performance',
        name: 'Schedule Performance Index',
        category: 'schedule',
        value: schedule.schedulePerformanceIndex,
        unit: 'SPI',
        target: 1.0,
        trend: this.determineTrend(schedule.schedulePerformanceIndex, 1.0),
        trendPercentage: Math.abs((schedule.schedulePerformanceIndex - 1.0) * 100),
        status: this.determineKPIStatus(schedule.schedulePerformanceIndex, 1.0, 0.9, 0.8, false),
        comparison: {
          previousPeriod: 1.0,
          change: schedule.schedulePerformanceIndex - 1.0,
          changePercentage: ((schedule.schedulePerformanceIndex - 1.0) / 1.0) * 100,
        },
        description: 'Schedule efficiency indicator',
        calculatedAt: new Date(),
      },
      {
        id: 'on-time-delivery',
        name: 'On-Time Delivery',
        category: 'schedule',
        value:
          schedule.milestones.total > 0
            ? (schedule.milestones.completed / schedule.milestones.total) * 100
            : 0,
        unit: '%',
        target: 95,
        trend: 'stable',
        trendPercentage: 0,
        status: 'good',
        comparison: {
          previousPeriod: 95,
          change: 0,
          changePercentage: 0,
        },
        description: 'Milestones completed on time',
        calculatedAt: new Date(),
      },

      // Quality KPIs
      {
        id: 'quality-pass-rate',
        name: 'Quality Pass Rate',
        category: 'quality',
        value: quality.quality.inspections.passRate,
        unit: '%',
        target: 95,
        trend: this.determineTrend(quality.quality.inspections.passRate, 95),
        trendPercentage: Math.abs(quality.quality.inspections.passRate - 95),
        status: this.determineKPIStatus(quality.quality.inspections.passRate, 95, 90, 85, false),
        comparison: {
          previousPeriod: 95,
          change: quality.quality.inspections.passRate - 95,
          changePercentage: ((quality.quality.inspections.passRate - 95) / 95) * 100,
        },
        description: 'First-time inspection pass rate',
        calculatedAt: new Date(),
      },

      // Safety KPIs
      {
        id: 'safety-trir',
        name: 'Total Recordable Incident Rate',
        category: 'safety',
        value: safety.safety.rates.trir,
        unit: 'TRIR',
        target: 3.0,
        trend: this.determineTrend(safety.safety.rates.trir, 3.0, true),
        trendPercentage: Math.abs(safety.safety.rates.trir - 3.0),
        status: this.determineKPIStatus(safety.safety.rates.trir, 3.0, 4.0, 5.0, true),
        comparison: {
          previousPeriod: 3.0,
          change: safety.safety.rates.trir - 3.0,
          changePercentage: ((safety.safety.rates.trir - 3.0) / 3.0) * 100,
        },
        description: 'OSHA recordable incidents per 200,000 hours',
        calculatedAt: new Date(),
      },
      {
        id: 'days-since-incident',
        name: 'Days Since Last Incident',
        category: 'safety',
        value: safety.safety.daysSinceLastIncident,
        unit: 'days',
        target: 90,
        trend: 'up',
        trendPercentage: 0,
        status:
          safety.safety.daysSinceLastIncident >= 90
            ? 'excellent'
            : safety.safety.daysSinceLastIncident >= 60
              ? 'good'
              : safety.safety.daysSinceLastIncident >= 30
                ? 'warning'
                : 'critical',
        comparison: {
          previousPeriod: 90,
          change: 0,
          changePercentage: 0,
        },
        description: 'Consecutive safe work days',
        calculatedAt: new Date(),
      },

      // Productivity KPIs
      {
        id: 'cost-performance',
        name: 'Cost Performance Index',
        category: 'productivity',
        value: productivity.costPerformanceIndex,
        unit: 'CPI',
        target: 1.0,
        trend: this.determineTrend(productivity.costPerformanceIndex, 1.0),
        trendPercentage: Math.abs((productivity.costPerformanceIndex - 1.0) * 100),
        status: this.determineKPIStatus(productivity.costPerformanceIndex, 1.0, 0.9, 0.8, false),
        comparison: {
          previousPeriod: 1.0,
          change: productivity.costPerformanceIndex - 1.0,
          changePercentage: ((productivity.costPerformanceIndex - 1.0) / 1.0) * 100,
        },
        description: 'Cost efficiency indicator',
        calculatedAt: new Date(),
      },
      {
        id: 'labor-efficiency',
        name: 'Labor Efficiency',
        category: 'productivity',
        value: productivity.laborProductivity.efficiency,
        unit: '%',
        target: 85,
        trend: this.determineTrend(productivity.laborProductivity.efficiency, 85),
        trendPercentage: Math.abs(productivity.laborProductivity.efficiency - 85),
        status: this.determineKPIStatus(
          productivity.laborProductivity.efficiency,
          85,
          80,
          75,
          false
        ),
        comparison: {
          previousPeriod: 85,
          change: productivity.laborProductivity.efficiency - 85,
          changePercentage: ((productivity.laborProductivity.efficiency - 85) / 85) * 100,
        },
        description: 'Actual vs planned labor hours',
        calculatedAt: new Date(),
      },
    ];

    return kpis;
  }

  /**
   * Get project portfolio summary
   */
  private async getPortfolioSummary(): Promise<ProjectPortfolioSummary> {
    const projectsQuery = query(collection(db, 'projects'));

    let projects: Project[] = [];
    try {
      const snapshot = await getDocs(projectsQuery);
      projects = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];
    } catch (error) {
      logger.error('Error fetching projects', error as Error);
      if (error instanceof Error) {
        throw new Error(`Error fetching projects: ${error.message}`);
      }
      throw error;
    }

    // Calculate project values from RAB items
    const getProjectValue = (p: Project) => {
      return (
        p.items?.reduce((sum, item) => sum + (item.hargaSatuan || 0) * (item.volume || 0), 0) || 0
      );
    };

    const getProjectProgress = (p: Project) => {
      if (!p.items || p.items.length === 0) return 0;
      const totalVolume = p.items.reduce((sum, item) => sum + (item.volume || 0), 0);
      const completedVolume =
        p.dailyReports?.reduce((sum, report) => {
          return sum + (report.workProgress?.reduce((s, wp) => s + wp.completedVolume, 0) || 0);
        }, 0) || 0;
      return totalVolume > 0 ? (completedVolume / totalVolume) * 100 : 0;
    };

    // Simple status classification based on dates
    const isCompleted = (p: Project) => {
      const progress = getProjectProgress(p);
      return progress >= 100;
    };

    const activeProjects = projects.filter((p) => !isCompleted(p));
    const completedProjects = projects.filter((p) => isCompleted(p));
    const pausedProjects: Project[] = []; // Would need actual status field

    const totalValue = projects.reduce((sum, p) => sum + getProjectValue(p), 0);
    const completedValue = completedProjects.reduce((sum, p) => sum + getProjectValue(p), 0);

    // Calculate by phase (based on progress percentage)
    const byPhase = {
      planning: projects.filter((p) => getProjectProgress(p) < 25).length,
      design: projects.filter((p) => {
        const prog = getProjectProgress(p);
        return prog >= 25 && prog < 50;
      }).length,
      construction: projects.filter((p) => {
        const prog = getProjectProgress(p);
        return prog >= 50 && prog < 90;
      }).length,
      closeout: projects.filter((p) => getProjectProgress(p) >= 90).length,
    };

    // Calculate by status (simplified - based on schedule)
    const byStatus = {
      onTrack: activeProjects.filter((p) => {
        const startDate = new Date(p.startDate);
        const now = new Date();
        const daysPassed = Math.floor(
          (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const expectedProgress = Math.min((daysPassed / 180) * 100, 100); // Assume 180 days
        return getProjectProgress(p) >= expectedProgress;
      }).length,
      atRisk: activeProjects.filter((p) => {
        const startDate = new Date(p.startDate);
        const now = new Date();
        const daysPassed = Math.floor(
          (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const expectedProgress = Math.min((daysPassed / 180) * 100, 100);
        const progressDiff = expectedProgress - getProjectProgress(p);
        return progressDiff > 5 && progressDiff <= 15;
      }).length,
      delayed: activeProjects.filter((p) => {
        const startDate = new Date(p.startDate);
        const now = new Date();
        const daysPassed = Math.floor(
          (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const expectedProgress = Math.min((daysPassed / 180) * 100, 100);
        const progressDiff = expectedProgress - getProjectProgress(p);
        return progressDiff > 15;
      }).length,
    };

    // Top projects by value
    const topProjects = projects
      .sort((a, b) => getProjectValue(b) - getProjectValue(a))
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: p.name,
        value: getProjectValue(p),
        progress: getProjectProgress(p),
        status: isCompleted(p) ? 'completed' : 'active',
      }));

    return {
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      completedProjects: completedProjects.length,
      pausedProjects: pausedProjects.length,
      totalValue,
      completedValue,
      byPhase,
      byStatus,
      topProjects,
    };
  }

  /**
   * Get financial overview
   */
  private async getFinancialOverview(): Promise<FinancialOverview> {
    // This would aggregate from actual financial data
    // Simplified implementation for demonstration

    const totalBudget = 5000000;
    const actualCost = 3200000;
    const committedCost = 800000;
    const forecastCost = 4800000;

    const variance = totalBudget - actualCost;
    const variancePercentage = (variance / totalBudget) * 100;

    return {
      totalBudget,
      actualCost,
      committedCost,
      forecastCost,
      variance,
      variancePercentage,
      cashFlow: {
        incoming: 4500000,
        outgoing: 3200000,
        net: 1300000,
      },
      profitability: {
        grossProfit: totalBudget - actualCost,
        grossMargin: ((totalBudget - actualCost) / totalBudget) * 100,
        netProfit: 1200000,
        netMargin: (1200000 / totalBudget) * 100,
        roi: (1200000 / actualCost) * 100,
      },
      costBreakdown: [
        { category: 'Labor', planned: 2000000, actual: 1600000, variance: 400000 },
        { category: 'Materials', planned: 1500000, actual: 980000, variance: 520000 },
        { category: 'Equipment', planned: 800000, actual: 420000, variance: 380000 },
        { category: 'Subcontractors', planned: 500000, actual: 150000, variance: 350000 },
        { category: 'Other', planned: 200000, actual: 50000, variance: 150000 },
      ],
      monthlyTrend: this.generateMonthlyTrend(),
    };
  }

  /**
   * Get schedule performance
   */
  private async getSchedulePerformance(): Promise<SchedulePerformance> {
    // Simplified implementation
    const totalTasks = 1250;
    const completedTasks = 780;
    const inProgressTasks = 320;
    const overdueTasks = 45;

    const overallProgress = (completedTasks / totalTasks) * 100;
    const scheduledProgress = 68; // Should be based on planned dates

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      overallProgress,
      scheduledProgress,
      scheduleVariance: -5, // 5 days behind
      schedulePerformanceIndex: overallProgress / scheduledProgress,
      milestones: {
        total: 24,
        completed: 18,
        upcoming: 4,
        missed: 2,
      },
      criticalPath: {
        totalDuration: 180,
        completed: 120,
        remaining: 60,
        delays: 5,
      },
      upcomingMilestones: [
        {
          id: 'ms-1',
          name: 'Foundation Complete',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          daysRemaining: 7,
          progress: 85,
          status: 'on_track',
        },
        {
          id: 'ms-2',
          name: 'Structural Framework',
          date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          daysRemaining: 21,
          progress: 45,
          status: 'at_risk',
        },
      ],
    };
  }

  /**
   * Get resource utilization summary
   */
  private async getResourceUtilization(): Promise<ResourceUtilizationSummary> {
    return {
      totalResources: 450,
      activeResources: 385,
      laborUtilization: {
        available: 15000,
        allocated: 12500,
        utilized: 11200,
        idle: 1300,
        utilizationRate: (11200 / 12500) * 100,
      },
      equipmentUtilization: {
        total: 85,
        inUse: 68,
        available: 12,
        maintenance: 5,
        utilizationRate: (68 / 85) * 100,
      },
      materialStatus: {
        totalValue: 1500000,
        consumed: 980000,
        remaining: 520000,
        onOrder: 200000,
      },
      byCategory: [
        { category: 'Skilled Labor', total: 120, utilized: 105, utilizationRate: 87.5 },
        { category: 'General Labor', total: 180, utilized: 158, utilizationRate: 87.8 },
        { category: 'Heavy Equipment', total: 45, utilized: 38, utilizationRate: 84.4 },
        { category: 'Specialized Tools', total: 105, utilized: 84, utilizationRate: 80.0 },
      ],
      topBottlenecks: [
        {
          resource: 'Crane Operator',
          demandRate: 95,
          availabilityRate: 70,
          shortage: 25,
        },
        {
          resource: 'Excavator',
          demandRate: 88,
          availabilityRate: 75,
          shortage: 13,
        },
      ],
    };
  }

  /**
   * Get quality and safety summary
   */
  private async getQualitySafetySummary(): Promise<QualitySafetySummary> {
    return {
      quality: {
        inspections: {
          total: 156,
          passed: 142,
          failed: 14,
          passRate: (142 / 156) * 100,
        },
        defects: {
          total: 89,
          open: 23,
          closed: 66,
          critical: 5,
        },
        nonConformances: 12,
        reworkCost: 45000,
      },
      safety: {
        incidents: {
          total: 8,
          bySeverity: {
            minor: 5,
            moderate: 2,
            serious: 1,
            fatal: 0,
          },
          lostTimeInjuries: 1,
        },
        rates: {
          trir: 2.4,
          ltifr: 0.3,
        },
        daysSinceLastIncident: 45,
        trainingCompliance: 92,
        ppeCompliance: 96,
      },
    };
  }

  /**
   * Get risk dashboard summary
   */
  private async getRiskSummary(): Promise<RiskDashboardSummary> {
    return {
      totalRisks: 45,
      activeRisks: 28,
      bySeverity: {
        critical: 3,
        high: 8,
        medium: 15,
        low: 19,
      },
      byCategory: {
        Schedule: 12,
        Cost: 8,
        Quality: 6,
        Safety: 10,
        Resource: 5,
        External: 4,
      },
      topRisks: [
        {
          id: 'risk-1',
          title: 'Material Supply Chain Delays',
          probability: 0.7,
          impact: 0.8,
          score: 5.6,
          status: 'active',
          mitigationProgress: 60,
        },
        {
          id: 'risk-2',
          title: 'Weather Impact on Schedule',
          probability: 0.6,
          impact: 0.7,
          score: 4.2,
          status: 'active',
          mitigationProgress: 40,
        },
      ],
      riskExposure: 850000,
      contingencyReserve: 500000,
      utilizedReserve: 125000,
    };
  }

  /**
   * Get productivity metrics
   */
  private async getProductivityMetrics(): Promise<ProductivityMetrics> {
    const earnedValue = 3500000;
    const plannedValue = 3800000;
    const actualCost = 3200000;

    return {
      overallProductivity: (earnedValue / actualCost) * 100,
      costPerformanceIndex: earnedValue / actualCost,
      schedulePerformanceIndex: earnedValue / plannedValue,
      earnedValue,
      plannedValue,
      actualCost,
      estimateAtCompletion: 4800000,
      estimateToComplete: 1600000,
      varianceAtCompletion: 200000,
      laborProductivity: {
        hoursPlanned: 15000,
        hoursActual: 14200,
        efficiency: (15000 / 14200) * 100,
      },
      changeOrders: {
        total: 18,
        approved: 12,
        pending: 6,
        totalImpact: 350000,
      },
    };
  }

  /**
   * Get executive alerts
   */
  private async getExecutiveAlerts(): Promise<ExecutiveAlert[]> {
    // This would come from actual monitoring systems
    return [
      {
        id: 'alert-1',
        type: 'critical',
        category: 'schedule',
        title: 'Critical Path Delay',
        message: 'Foundation milestone is 3 days behind schedule',
        priority: 100,
        actionRequired: true,
        actionUrl: '/projects/proj-1/schedule',
        relatedEntityType: 'milestone',
        relatedEntityId: 'ms-1',
        acknowledged: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: 'alert-2',
        type: 'warning',
        category: 'financial',
        title: 'Budget Variance Threshold',
        message: 'Labor costs are 12% over budget this month',
        priority: 80,
        actionRequired: true,
        actionUrl: '/financial/analysis',
        acknowledged: false,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: 'alert-3',
        type: 'info',
        category: 'safety',
        title: 'Safety Training Due',
        message: '15 workers require safety recertification this week',
        priority: 60,
        actionRequired: false,
        acknowledged: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
    ];
  }


  /**
   * Helper: Determine KPI trend
   */
  private determineTrend(value: number, target: number, lowerIsBetter: boolean = false): KPITrend {
    const diff = value - target;
    const threshold = Math.abs(target * 0.05); // 5% threshold

    if (Math.abs(diff) <= threshold) {
      return 'stable';
    }

    if (lowerIsBetter) {
      return diff < 0 ? 'up' : 'down';
    } else {
      return diff > 0 ? 'up' : 'down';
    }
  }

  /**
   * Helper: Determine KPI status
   */
  private determineKPIStatus(
    value: number,
    excellent: number,
    good: number,
    warning: number,
    lowerIsBetter: boolean = false
  ): KPIStatus {
    if (lowerIsBetter) {
      if (value <= excellent) return 'excellent';
      if (value <= good) return 'good';
      if (value <= warning) return 'warning';
      return 'critical';
    } else {
      if (value >= excellent) return 'excellent';
      if (value >= good) return 'good';
      if (value >= warning) return 'warning';
      return 'critical';
    }
  }

  /**
   * Helper: Generate monthly trend data
   */
  private generateMonthlyTrend() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => ({
      month,
      budget: 800000 + index * 50000,
      actual: 720000 + index * 45000,
      forecast: 780000 + index * 48000,
    }));
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    // This would update the alert in the database
    logger.info(`Alert ${alertId} acknowledged by ${userId}`);
  }

  /**
   * Dismiss alert
   */
  async dismissAlert(alertId: string): Promise<void> {
    // This would update or delete the alert
    logger.info(`Alert ${alertId} dismissed`);
  }
}

export default new ExecutiveService();
