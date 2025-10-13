import { KPIMetrics, Task, RabItem, EVMMetrics } from '../types';

interface KPICalculationInput {
  tasks: Task[];
  rabItems: RabItem[];
  actualCosts: { [taskId: string]: number };
  budgetAtCompletion: number;
  evmMetrics?: EVMMetrics;
  qualityData?: {
    defects: number;
    totalDeliverables: number;
    reworkHours: number;
    totalHours: number;
  };
  resourceData?: {
    allocatedHours: number;
    actualHours: number;
    teamSize: number;
    productivity: number;
  };
  riskData?: {
    totalRisks: number;
    highRisks: number;
    mitigatedRisks: number;
    contingencyUsed: number;
    contingencyTotal: number;
  };
}

interface PerformanceTrend {
  period: string;
  value: number;
  target: number;
  variance: number;
}

export class KPIService {
  
  /**
   * Calculate comprehensive KPI metrics
   */
  static calculateKPIMetrics(input: KPICalculationInput): KPIMetrics {
    const { 
      tasks, 
      actualCosts, 
      budgetAtCompletion, 
      evmMetrics,
      qualityData,
      resourceData,
      riskData
    } = input;

    // Financial KPIs
    const financialKPIs = this.calculateFinancialKPIs(
      actualCosts, 
      budgetAtCompletion, 
      evmMetrics
    );

    // Schedule KPIs
    const scheduleKPIs = this.calculateScheduleKPIs(tasks, evmMetrics);

    // Quality KPIs
    const qualityKPIs = this.calculateQualityKPIs(qualityData);

    // Resource KPIs
    const resourceKPIs = this.calculateResourceKPIs(resourceData, tasks);

    // Risk KPIs
    const riskKPIs = this.calculateRiskKPIs(riskData);

    // Calculate overall health score
    const overallHealthScore = this.calculateOverallHealthScore({
      ...financialKPIs,
      ...scheduleKPIs,
      ...qualityKPIs,
      ...resourceKPIs,
      ...riskKPIs
    });

    // Determine performance trend
    const performanceTrend = this.determinePerformanceTrend({
      ...financialKPIs,
      ...scheduleKPIs,
      ...qualityKPIs,
      ...resourceKPIs,
      ...riskKPIs
    });

    return {
      ...financialKPIs,
      ...scheduleKPIs,
      ...qualityKPIs,
      ...resourceKPIs,
      ...riskKPIs,
      overallHealthScore,
      performanceTrend
    };
  }

  /**
   * Calculate Financial KPIs
   */
  private static calculateFinancialKPIs(
    actualCosts: { [taskId: string]: number },
    budgetAtCompletion: number,
    evmMetrics?: EVMMetrics
  ) {
    const totalActualCost = Object.values(actualCosts).reduce((sum, cost) => sum + cost, 0);
    const budgetUtilization = budgetAtCompletion > 0 ? (totalActualCost / budgetAtCompletion) * 100 : 0;
    
    const costVariancePercentage = evmMetrics 
      ? (evmMetrics.costVariance / budgetAtCompletion) * 100 
      : 0;

    // Simple ROI calculation based on project value vs cost
    const estimatedProjectValue = budgetAtCompletion * 1.3; // Assume 30% value creation
    const returnOnInvestment = totalActualCost > 0 
      ? ((estimatedProjectValue - totalActualCost) / totalActualCost) * 100 
      : 0;

    return {
      budgetUtilization: Math.round(budgetUtilization * 100) / 100,
      costVariancePercentage: Math.round(costVariancePercentage * 100) / 100,
      returnOnInvestment: Math.round(returnOnInvestment * 100) / 100
    };
  }

  /**
   * Calculate Schedule KPIs
   */
  private static calculateScheduleKPIs(tasks: Task[], evmMetrics?: EVMMetrics) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done' || task.status === 'completed').length;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const scheduleVariancePercentage = evmMetrics 
      ? (evmMetrics.scheduleVariance / evmMetrics.plannedValue) * 100 
      : 0;

    // Calculate milestone adherence
    const milestoneTasks = tasks.filter(task => task.priority === 'high');
    const completedMilestones = milestoneTasks.filter(task => task.status === 'done' || task.status === 'completed').length;
    const milestoneAdherence = milestoneTasks.length > 0 
      ? (completedMilestones / milestoneTasks.length) * 100 
      : 100;

    return {
      scheduleVariancePercentage: Math.round(scheduleVariancePercentage * 100) / 100,
      taskCompletionRate: Math.round(taskCompletionRate * 100) / 100,
      milestoneAdherence: Math.round(milestoneAdherence * 100) / 100
    };
  }

  /**
   * Calculate Quality KPIs
   */
  private static calculateQualityKPIs(qualityData?: {
    defects: number;
    totalDeliverables: number;
    reworkHours: number;
    totalHours: number;
  }) {
    if (!qualityData) {
      return {
        defectRate: 0,
        reworkPercentage: 0,
        qualityScore: 85 // Default score
      };
    }

    const { defects, totalDeliverables, reworkHours, totalHours } = qualityData;

    const defectRate = totalDeliverables > 0 ? (defects / totalDeliverables) * 100 : 0;
    const reworkPercentage = totalHours > 0 ? (reworkHours / totalHours) * 100 : 0;
    
    // Quality score based on defect rate and rework
    const qualityScore = Math.max(0, 100 - (defectRate * 10) - (reworkPercentage * 5));

    return {
      defectRate: Math.round(defectRate * 100) / 100,
      reworkPercentage: Math.round(reworkPercentage * 100) / 100,
      qualityScore: Math.round(qualityScore * 100) / 100
    };
  }

  /**
   * Calculate Resource KPIs
   */
  private static calculateResourceKPIs(
    resourceData?: {
      allocatedHours: number;
      actualHours: number;
      teamSize: number;
      productivity: number;
    },
    tasks?: Task[]
  ) {
    if (!resourceData) {
      return {
        resourceUtilization: 85, // Default value
        productivityIndex: 100,
        teamEfficiency: 90
      };
    }

    const { allocatedHours, actualHours, productivity } = resourceData;

    const resourceUtilization = allocatedHours > 0 
      ? (actualHours / allocatedHours) * 100 
      : 0;

    const productivityIndex = productivity || 100;

    // Team efficiency based on task completion vs time
    const teamEfficiency = tasks 
      ? this.calculateTeamEfficiency(tasks, actualHours) 
      : 90;

    return {
      resourceUtilization: Math.round(resourceUtilization * 100) / 100,
      productivityIndex: Math.round(productivityIndex * 100) / 100,
      teamEfficiency: Math.round(teamEfficiency * 100) / 100
    };
  }

  /**
   * Calculate Risk KPIs
   */
  private static calculateRiskKPIs(riskData?: {
    totalRisks: number;
    highRisks: number;
    mitigatedRisks: number;
    contingencyUsed: number;
    contingencyTotal: number;
  }) {
    if (!riskData) {
      return {
        riskExposure: 20, // Default low risk
        issueResolutionTime: 5, // Default 5 days
        contingencyUtilization: 15 // Default 15%
      };
    }

    const { totalRisks, highRisks, contingencyUsed, contingencyTotal } = riskData;

    const riskExposure = totalRisks > 0 ? (highRisks / totalRisks) * 100 : 0;
    
    // Simplified issue resolution time (assume 5 days average for now)
    const issueResolutionTime = 5;

    const contingencyUtilization = contingencyTotal > 0 
      ? (contingencyUsed / contingencyTotal) * 100 
      : 0;

    return {
      riskExposure: Math.round(riskExposure * 100) / 100,
      issueResolutionTime: Math.round(issueResolutionTime * 100) / 100,
      contingencyUtilization: Math.round(contingencyUtilization * 100) / 100
    };
  }

  /**
   * Calculate team efficiency
   */
  private static calculateTeamEfficiency(tasks: Task[], actualHours: number): number {
    const totalEstimatedHours = tasks.reduce((sum, task) => {
      // Assume 8 hours per day for task duration
      return sum + ((task.endDate ? new Date(task.endDate).getTime() : Date.now()) - 
                    (task.startDate ? new Date(task.startDate).getTime() : Date.now())) / (1000 * 60 * 60 * 24) * 8;
    }, 0);

    if (totalEstimatedHours === 0 || actualHours === 0) return 90;

    const efficiency = (totalEstimatedHours / actualHours) * 100;
    return Math.min(Math.max(efficiency, 0), 150); // Cap between 0-150%
  }

  /**
   * Calculate overall health score
   */
  private static calculateOverallHealthScore(metrics: any): number {
    const weights = {
      budget: 0.25,
      schedule: 0.25,
      quality: 0.25,
      resource: 0.15,
      risk: 0.10
    };

    // Normalize metrics to 0-100 scale
    const budgetScore = Math.max(0, 100 - Math.abs(metrics.costVariancePercentage));
    const scheduleScore = Math.max(0, 100 - Math.abs(metrics.scheduleVariancePercentage));
    const qualityScore = metrics.qualityScore || 85;
    const resourceScore = (metrics.resourceUtilization + metrics.teamEfficiency) / 2;
    const riskScore = Math.max(0, 100 - metrics.riskExposure);

    const weightedScore = 
      (budgetScore * weights.budget) +
      (scheduleScore * weights.schedule) +
      (qualityScore * weights.quality) +
      (resourceScore * weights.resource) +
      (riskScore * weights.risk);

    return Math.round(Math.max(0, Math.min(100, weightedScore)));
  }

  /**
   * Determine performance trend
   */
  private static determinePerformanceTrend(metrics: any): 'Improving' | 'Stable' | 'Declining' {
    let positiveIndicators = 0;
    let negativeIndicators = 0;

    // Analyze financial performance
    if (metrics.costVariancePercentage >= -5) positiveIndicators++;
    else if (metrics.costVariancePercentage < -10) negativeIndicators++;

    // Analyze schedule performance
    if (metrics.scheduleVariancePercentage >= -5) positiveIndicators++;
    else if (metrics.scheduleVariancePercentage < -10) negativeIndicators++;

    // Analyze quality
    if (metrics.qualityScore >= 80) positiveIndicators++;
    else if (metrics.qualityScore < 60) negativeIndicators++;

    // Analyze resource utilization
    if (metrics.resourceUtilization >= 80 && metrics.resourceUtilization <= 120) positiveIndicators++;
    else if (metrics.resourceUtilization < 60 || metrics.resourceUtilization > 140) negativeIndicators++;

    // Analyze risk exposure
    if (metrics.riskExposure <= 30) positiveIndicators++;
    else if (metrics.riskExposure > 50) negativeIndicators++;

    if (positiveIndicators > negativeIndicators + 1) return 'Improving';
    if (negativeIndicators > positiveIndicators + 1) return 'Declining';
    return 'Stable';
  }

  /**
   * Generate KPI trends over time
   */
  static generateKPITrends(
    historicalData: { date: Date; metrics: KPIMetrics }[]
  ): { [key: string]: PerformanceTrend[] } {
    const trends: { [key: string]: PerformanceTrend[] } = {};
    
    const kpiKeys = [
      'budgetUtilization',
      'taskCompletionRate',
      'qualityScore',
      'resourceUtilization',
      'overallHealthScore'
    ];

    kpiKeys.forEach(key => {
      trends[key] = historicalData.map((data) => {
        const value = (data.metrics as any)[key] || 0;
        const target = this.getKPITarget(key);
        
        return {
          period: data.date.toISOString().split('T')[0],
          value,
          target,
          variance: value - target
        };
      });
    });

    return trends;
  }

  /**
   * Get target values for KPIs
   */
  private static getKPITarget(kpiKey: string): number {
    const targets: { [key: string]: number } = {
      budgetUtilization: 100,
      taskCompletionRate: 100,
      qualityScore: 90,
      resourceUtilization: 90,
      overallHealthScore: 85,
      costVariancePercentage: 0,
      scheduleVariancePercentage: 0,
      defectRate: 2,
      reworkPercentage: 5,
      productivityIndex: 100,
      teamEfficiency: 90,
      riskExposure: 25,
      issueResolutionTime: 5,
      contingencyUtilization: 20,
      returnOnInvestment: 20,
      milestoneAdherence: 95
    };

    return targets[kpiKey] || 100;
  }

  /**
   * Calculate KPI performance ratings
   */
  static calculateKPIRatings(metrics: KPIMetrics): { [key: string]: 'Excellent' | 'Good' | 'Fair' | 'Poor' } {
    const ratings: { [key: string]: 'Excellent' | 'Good' | 'Fair' | 'Poor' } = {};
    
    // Financial KPIs
    ratings.budgetUtilization = this.getRating(metrics.budgetUtilization, [95, 105, 85, 115]);
    ratings.costVariance = this.getRating(Math.abs(metrics.costVariancePercentage), [2, 5, 10, 20]);
    ratings.roi = this.getRating(metrics.returnOnInvestment, [25, 15, 10, 5]);

    // Schedule KPIs
    ratings.scheduleVariance = this.getRating(Math.abs(metrics.scheduleVariancePercentage), [2, 5, 10, 20]);
    ratings.taskCompletion = this.getRating(metrics.taskCompletionRate, [95, 85, 75, 65]);
    ratings.milestoneAdherence = this.getRating(metrics.milestoneAdherence, [95, 85, 75, 65]);

    // Quality KPIs
    ratings.qualityScore = this.getRating(metrics.qualityScore, [90, 80, 70, 60]);
    ratings.defectRate = this.getRating(metrics.defectRate, [1, 3, 5, 10], true);
    ratings.reworkPercentage = this.getRating(metrics.reworkPercentage, [3, 7, 12, 20], true);

    // Resource KPIs
    ratings.resourceUtilization = this.getRating(metrics.resourceUtilization, [85, 75, 65, 55]);
    ratings.productivity = this.getRating(metrics.productivityIndex, [110, 95, 85, 75]);
    ratings.teamEfficiency = this.getRating(metrics.teamEfficiency, [95, 85, 75, 65]);

    // Risk KPIs
    ratings.riskExposure = this.getRating(metrics.riskExposure, [15, 25, 35, 50], true);
    ratings.contingencyUtilization = this.getRating(metrics.contingencyUtilization, [15, 25, 35, 50], true);

    // Overall
    ratings.overallHealth = this.getRating(metrics.overallHealthScore, [90, 80, 70, 60]);

    return ratings;
  }

  /**
   * Get rating based on thresholds
   */
  private static getRating(
    value: number, 
    thresholds: [number, number, number, number], 
    lowerIsBetter: boolean = false
  ): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
    const [excellent, good, fair] = thresholds;
    
    if (lowerIsBetter) {
      if (value <= excellent) return 'Excellent';
      if (value <= good) return 'Good';
      if (value <= fair) return 'Fair';
      return 'Poor';
    } else {
      if (value >= excellent) return 'Excellent';
      if (value >= good) return 'Good';
      if (value >= fair) return 'Fair';
      return 'Poor';
    }
  }

  /**
   * Generate KPI recommendations
   */
  static generateKPIRecommendations(
    metrics: KPIMetrics,
    ratings: { [key: string]: 'Excellent' | 'Good' | 'Fair' | 'Poor' }
  ): string[] {
    const recommendations: string[] = [];

    // Budget recommendations
    if (ratings.budgetUtilization === 'Poor' || metrics.costVariancePercentage < -10) {
      recommendations.push('Implement stricter cost controls and review budget allocations');
      recommendations.push('Conduct cost-benefit analysis for all remaining activities');
    }

    // Schedule recommendations
    if (ratings.scheduleVariance === 'Poor' || metrics.taskCompletionRate < 70) {
      recommendations.push('Review project timeline and consider fast-tracking critical activities');
      recommendations.push('Increase resource allocation to delayed tasks');
    }

    // Quality recommendations
    if (ratings.qualityScore === 'Poor' || metrics.defectRate > 5) {
      recommendations.push('Implement additional quality assurance checkpoints');
      recommendations.push('Provide additional training to team members');
    }

    // Resource recommendations
    if (ratings.resourceUtilization === 'Poor' || metrics.teamEfficiency < 70) {
      recommendations.push('Optimize resource allocation and eliminate bottlenecks');
      recommendations.push('Consider team restructuring or additional resources');
    }

    // Risk recommendations
    if (ratings.riskExposure === 'Poor' || metrics.riskExposure > 40) {
      recommendations.push('Implement additional risk mitigation strategies');
      recommendations.push('Increase contingency reserves and monitoring frequency');
    }

    // Overall health recommendations
    if (metrics.overallHealthScore < 70) {
      recommendations.push('Conduct comprehensive project health assessment');
      recommendations.push('Consider project restructuring or scope adjustments');
    }

    return recommendations;
  }
}