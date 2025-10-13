import { EVMMetrics, EVMTrendData, Task, RabItem } from '../types';

interface EVMCalculationInput {
  tasks: Task[];
  rabItems: RabItem[];
  actualCosts: { [taskId: string]: number };
  currentDate: Date;
  projectStartDate: Date;
  budgetAtCompletion: number;
}

interface TaskProgress {
  taskId: string;
  plannedProgress: number;
  actualProgress: number;
  plannedCost: number;
  actualCost: number;
  earnedValue: number;
}

export class EVMService {
  
  /**
   * Calculate comprehensive EVM metrics
   */
  static calculateEVMMetrics(
    projectId: string,
    input: EVMCalculationInput
  ): EVMMetrics {
    const { tasks, rabItems, actualCosts, currentDate, projectStartDate, budgetAtCompletion } = input;
    
    // Calculate task progress and values
    const taskProgressData = this.calculateTaskProgress(tasks, rabItems, actualCosts, currentDate, projectStartDate);
    
    // Calculate core EVM values
    const plannedValue = this.calculatePlannedValue(taskProgressData);
    const earnedValue = this.calculateEarnedValue(taskProgressData);
    const actualCost = this.calculateActualCost(actualCosts);
    
    // Calculate performance indices
    const costPerformanceIndex = actualCost > 0 ? earnedValue / actualCost : 1;
    const schedulePerformanceIndex = plannedValue > 0 ? earnedValue / plannedValue : 1;
    
    // Calculate variances
    const costVariance = earnedValue - actualCost;
    const scheduleVariance = earnedValue - plannedValue;
    
    // Calculate forecasts
    const estimateAtCompletion = this.calculateEAC(budgetAtCompletion, costPerformanceIndex, earnedValue, actualCost);
    const estimateToComplete = estimateAtCompletion - actualCost;
    const varianceAtCompletion = budgetAtCompletion - estimateAtCompletion;
    
    // Calculate time-based metrics
    const timeMetrics = this.calculateTimeMetrics(tasks, currentDate, schedulePerformanceIndex);
    
    // Determine performance status and health score
    const performanceStatus = this.determinePerformanceStatus(costPerformanceIndex, schedulePerformanceIndex);
    const healthScore = this.calculateHealthScore(costPerformanceIndex, schedulePerformanceIndex, plannedValue, budgetAtCompletion);
    
    return {
      projectId,
      reportDate: currentDate,
      plannedValue,
      earnedValue,
      actualCost,
      budgetAtCompletion,
      costPerformanceIndex,
      schedulePerformanceIndex,
      costVariance,
      scheduleVariance,
      estimateAtCompletion,
      estimateToComplete,
      varianceAtCompletion,
      timeVariance: timeMetrics.timeVariance,
      estimatedTimeToComplete: timeMetrics.estimatedTimeToComplete,
      performanceStatus,
      healthScore
    };
  }

  /**
   * Calculate task progress data
   */
  private static calculateTaskProgress(
    tasks: Task[],
    rabItems: RabItem[],
    actualCosts: { [taskId: string]: number },
    currentDate: Date,
    projectStartDate: Date
  ): TaskProgress[] {
    return tasks.map(task => {
      // Find associated RAB item
      const rabItem = rabItems.find(rab => rab.id.toString() === task.id);
      const plannedCost = rabItem ? rabItem.volume * rabItem.hargaSatuan : 0;
      
      // Calculate planned progress based on schedule
      const plannedProgress = this.calculatePlannedProgress(task, currentDate, projectStartDate);
      
      // Get actual progress from task completion
      const actualProgress = task.progress / 100;
      
      // Calculate earned value
      const earnedValue = plannedCost * actualProgress;
      
      // Get actual cost
      const actualCost = actualCosts[task.id] || 0;
      
      return {
        taskId: task.id,
        plannedProgress,
        actualProgress,
        plannedCost,
        actualCost,
        earnedValue
      };
    });
  }

  /**
   * Calculate planned progress for a task
   */
  private static calculatePlannedProgress(
    task: Task,
    currentDate: Date,
    projectStartDate: Date
  ): number {
    const taskStartDate = new Date(task.startDate || projectStartDate);
    const taskEndDate = new Date(task.endDate || currentDate);
    
    // If task hasn't started yet
    if (currentDate < taskStartDate) {
      return 0;
    }
    
    // If task should be completed
    if (currentDate >= taskEndDate) {
      return 1;
    }
    
    // Calculate progress based on time elapsed
    const totalDuration = taskEndDate.getTime() - taskStartDate.getTime();
    const elapsed = currentDate.getTime() - taskStartDate.getTime();
    
    return totalDuration > 0 ? Math.min(elapsed / totalDuration, 1) : 0;
  }

  /**
   * Calculate total Planned Value (PV)
   */
  private static calculatePlannedValue(taskProgressData: TaskProgress[]): number {
    return taskProgressData.reduce((total, task) => {
      return total + (task.plannedCost * task.plannedProgress);
    }, 0);
  }

  /**
   * Calculate total Earned Value (EV)
   */
  private static calculateEarnedValue(taskProgressData: TaskProgress[]): number {
    return taskProgressData.reduce((total, task) => total + task.earnedValue, 0);
  }

  /**
   * Calculate total Actual Cost (AC)
   */
  private static calculateActualCost(actualCosts: { [taskId: string]: number }): number {
    return Object.values(actualCosts).reduce((total, cost) => total + cost, 0);
  }

  /**
   * Calculate Estimate at Completion (EAC)
   */
  private static calculateEAC(
    budgetAtCompletion: number,
    costPerformanceIndex: number,
    earnedValue: number,
    actualCost: number
  ): number {
    // Use different EAC formulas based on performance
    if (costPerformanceIndex > 0.95) {
      // Performance is good, use original budget for remaining work
      return actualCost + (budgetAtCompletion - earnedValue);
    } else if (costPerformanceIndex > 0.8) {
      // Performance is concerning, use CPI for remaining work
      return budgetAtCompletion / costPerformanceIndex;
    } else {
      // Performance is poor, assume poor performance continues
      return actualCost + ((budgetAtCompletion - earnedValue) / costPerformanceIndex);
    }
  }

  /**
   * Calculate time-based metrics
   */
  private static calculateTimeMetrics(
    tasks: Task[],
    currentDate: Date,
    schedulePerformanceIndex: number
  ): { timeVariance: number; estimatedTimeToComplete: number } {
    // Calculate overall project timeline
    const projectEndDate = tasks.reduce((latest, task) => {
      const taskEndDate = new Date(task.endDate || currentDate);
      return taskEndDate > latest ? taskEndDate : latest;
    }, new Date(0));
    
    const projectStartDate = tasks.reduce((earliest, task) => {
      const taskStartDate = new Date(task.startDate || currentDate);
      return taskStartDate < earliest ? taskStartDate : earliest;
    }, new Date());
    
    const plannedDuration = projectEndDate.getTime() - projectStartDate.getTime();
    const elapsedTime = currentDate.getTime() - projectStartDate.getTime();
    
    // Calculate time variance in days
    const expectedProgress = plannedDuration > 0 ? elapsedTime / plannedDuration : 0;
    const actualTimeProgress = schedulePerformanceIndex * expectedProgress;
    const timeVariance = (actualTimeProgress - expectedProgress) * (plannedDuration / (1000 * 60 * 60 * 24));
    
    // Estimate time to complete
    const remainingWork = 1 - actualTimeProgress;
    const estimatedTimeToComplete = schedulePerformanceIndex > 0 
      ? (remainingWork / schedulePerformanceIndex) * (plannedDuration / (1000 * 60 * 60 * 24))
      : (plannedDuration / (1000 * 60 * 60 * 24));
    
    return {
      timeVariance: Math.round(timeVariance),
      estimatedTimeToComplete: Math.round(estimatedTimeToComplete)
    };
  }

  /**
   * Determine overall performance status
   */
  private static determinePerformanceStatus(
    costPerformanceIndex: number,
    schedulePerformanceIndex: number
  ): 'On Track' | 'At Risk' | 'Critical' {
    const minIndex = Math.min(costPerformanceIndex, schedulePerformanceIndex);
    
    if (minIndex >= 0.95) return 'On Track';
    if (minIndex >= 0.8) return 'At Risk';
    return 'Critical';
  }

  /**
   * Calculate health score (0-100)
   */
  private static calculateHealthScore(
    costPerformanceIndex: number,
    schedulePerformanceIndex: number,
    plannedValue: number,
    budgetAtCompletion: number
  ): number {
    // Weight factors
    const costWeight = 0.4;
    const scheduleWeight = 0.4;
    const progressWeight = 0.2;
    
    // Normalize performance indices (cap at 1.0 for scoring)
    const normalizedCPI = Math.min(costPerformanceIndex, 1.0);
    const normalizedSPI = Math.min(schedulePerformanceIndex, 1.0);
    
    // Calculate progress score
    const progressScore = budgetAtCompletion > 0 ? Math.min(plannedValue / budgetAtCompletion, 1.0) : 0;
    
    // Calculate weighted health score
    const healthScore = (
      (normalizedCPI * costWeight) +
      (normalizedSPI * scheduleWeight) +
      (progressScore * progressWeight)
    ) * 100;
    
    return Math.round(Math.max(0, Math.min(100, healthScore)));
  }

  /**
   * Generate EVM trend data for charts
   */
  static generateEVMTrendData(
    tasks: Task[],
    rabItems: RabItem[],
    historicalActualCosts: { date: Date; costs: { [taskId: string]: number } }[],
    projectStartDate: Date,
    budgetAtCompletion: number
  ): EVMTrendData[] {
    const trendData: EVMTrendData[] = [];
    
    for (const historicalData of historicalActualCosts) {
      const metrics = this.calculateEVMMetrics('temp', {
        tasks,
        rabItems,
        actualCosts: historicalData.costs,
        currentDate: historicalData.date,
        projectStartDate,
        budgetAtCompletion
      });
      
      trendData.push({
        date: historicalData.date,
        plannedValue: metrics.plannedValue,
        earnedValue: metrics.earnedValue,
        actualCost: metrics.actualCost,
        cpi: metrics.costPerformanceIndex,
        spi: metrics.schedulePerformanceIndex
      });
    }
    
    return trendData.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Calculate Critical Path Method impact on EVM
   */
  static calculateCriticalPathImpact(
    tasks: Task[],
    evmMetrics: EVMMetrics
  ): {
    criticalTasks: string[];
    scheduleRisk: number;
    recommendations: string[];
  } {
    // Identify critical path tasks (simplified)
    const criticalTasks = tasks
      .filter(task => {
        // Tasks with zero float/slack are critical
        return task.priority === 'high' || task.progress < 50;
      })
      .map(task => task.id);
    
    // Calculate schedule risk based on critical path performance
    const criticalTasksCount = criticalTasks.length;
    const totalTasks = tasks.length;
    const criticalPathRatio = totalTasks > 0 ? criticalTasksCount / totalTasks : 0;
    
    const scheduleRisk = (1 - evmMetrics.schedulePerformanceIndex) * criticalPathRatio;
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (evmMetrics.schedulePerformanceIndex < 0.9) {
      recommendations.push('Focus resources on critical path activities');
      recommendations.push('Consider fast-tracking or crashing critical activities');
    }
    
    if (evmMetrics.costPerformanceIndex < 0.9) {
      recommendations.push('Review resource allocation efficiency');
      recommendations.push('Implement stricter cost controls');
    }
    
    if (criticalPathRatio > 0.3) {
      recommendations.push('Consider parallel processing where possible');
      recommendations.push('Increase monitoring frequency for critical tasks');
    }
    
    return {
      criticalTasks,
      scheduleRisk: Math.round(scheduleRisk * 100) / 100,
      recommendations
    };
  }

  /**
   * Forecast project completion based on current EVM performance
   */
  static forecastProjectCompletion(
    evmMetrics: EVMMetrics,
    tasks: Task[],
    projectStartDate: Date
  ): {
    forecastCompletionDate: Date;
    forecastCost: number;
    confidenceLevel: number;
    scenarios: {
      optimistic: { date: Date; cost: number };
      mostLikely: { date: Date; cost: number };
      pessimistic: { date: Date; cost: number };
    };
  } {
    // Calculate project duration
    const latestEndDate = tasks.reduce((latest, task) => {
      const taskEndDate = new Date(task.endDate || new Date());
      return taskEndDate > latest ? taskEndDate : latest;
    }, new Date(0));
    
    const originalDuration = latestEndDate.getTime() - projectStartDate.getTime();
    
    // Forecast completion based on SPI
    const forecastDuration = evmMetrics.schedulePerformanceIndex > 0 
      ? originalDuration / evmMetrics.schedulePerformanceIndex 
      : originalDuration * 1.5;
    
    const forecastCompletionDate = new Date(projectStartDate.getTime() + forecastDuration);
    
    // Calculate confidence level based on performance stability
    const performanceStability = Math.min(evmMetrics.costPerformanceIndex, evmMetrics.schedulePerformanceIndex);
    const confidenceLevel = Math.max(0.5, performanceStability);
    
    // Generate scenarios
    const scenarios = {
      optimistic: {
        date: new Date(forecastCompletionDate.getTime() * 0.9),
        cost: evmMetrics.estimateAtCompletion * 0.95
      },
      mostLikely: {
        date: forecastCompletionDate,
        cost: evmMetrics.estimateAtCompletion
      },
      pessimistic: {
        date: new Date(forecastCompletionDate.getTime() * 1.2),
        cost: evmMetrics.estimateAtCompletion * 1.15
      }
    };
    
    return {
      forecastCompletionDate,
      forecastCost: evmMetrics.estimateAtCompletion,
      confidenceLevel,
      scenarios
    };
  }
}