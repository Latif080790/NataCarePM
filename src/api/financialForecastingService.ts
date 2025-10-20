import { 
  FinancialForecast, 
  CashFlowProjection, 
  RiskAssessment, 
  ForecastScenario,
  PredictiveModel
} from '@/types';

interface ForecastInput {
  historicalData: any[];
  currentBudget: number;
  timeframe: number; // months
  confidenceLevel: number;
}

interface TrendAnalysis {
  slope: number;
  correlation: number;
  seasonality: number[];
  volatility: number;
}

export class FinancialForecastingService {
  
  /**
   * Generate comprehensive financial forecast
   */
  static generateFinancialForecast(
    projectId: string,
    forecastInput: ForecastInput
  ): FinancialForecast {
    const { historicalData, currentBudget, timeframe, confidenceLevel } = forecastInput;
    
    // Analyze historical trends
    const trendAnalysis = this.analyzeTrends(historicalData);
    
    // Generate base forecast
    const baseForecast = this.generateBaseForecast(
      currentBudget, 
      timeframe, 
      trendAnalysis
    );
    
    // Create multiple scenarios
    const scenarios = this.generateScenarios(baseForecast);
    
    // Assess risks
    const riskAssessment = this.assessFinancialRisks(scenarios, trendAnalysis);
    
    // Generate cash flow projections
    const cashFlowProjections = this.generateCashFlowProjections(
      baseForecast, 
      scenarios, 
      timeframe
    );
    
    return {
      projectId,
      forecastDate: new Date(),
      timeframe,
      confidenceLevel,
      baseForecast,
      scenarios,
      riskAssessment,
      cashFlowProjections,
      recommendations: this.generateRecommendations(scenarios, riskAssessment),
      accuracy: this.calculateForecastAccuracy(historicalData, trendAnalysis)
    };
  }

  /**
   * Analyze historical trends and patterns
   */
  private static analyzeTrends(historicalData: any[]): TrendAnalysis {
    if (historicalData.length < 3) {
      return {
        slope: 0,
        correlation: 0,
        seasonality: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        volatility: 0.1
      };
    }

    const values = historicalData.map(d => d.value);
    const n = values.length;
    
    // Calculate linear regression slope
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += (i - xMean) ** 2;
    }
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    
    // Calculate correlation coefficient
    const correlation = this.calculateCorrelation(values);
    
    // Detect seasonality patterns
    const seasonality = this.detectSeasonality(historicalData);
    
    // Calculate volatility
    const volatility = this.calculateVolatility(values);
    
    return {
      slope,
      correlation,
      seasonality,
      volatility
    };
  }

  /**
   * Generate base forecast using predictive modeling
   */
  private static generateBaseForecast(
    currentBudget: number,
    timeframe: number,
    trendAnalysis: TrendAnalysis
  ): PredictiveModel {
    const projections: {
      period: number;
      projectedCost: number;
      cumulativeCost: number;
      confidence: number;
      variance: number;
    }[] = [];
    
    for (let month = 1; month <= timeframe; month++) {
      // Apply trend and seasonality
      const trendFactor = 1 + (trendAnalysis.slope * month * 0.01);
      const seasonalFactor = trendAnalysis.seasonality[month % 12];
      const volatilityFactor = 1 + (Math.random() - 0.5) * trendAnalysis.volatility;
      
      const projectedValue = currentBudget * trendFactor * seasonalFactor * volatilityFactor;
      
      projections.push({
        period: month,
        projectedCost: projectedValue,
        cumulativeCost: projections.reduce((sum, p) => sum + p.projectedCost, 0) + projectedValue,
        confidence: Math.max(0.95 - (month * 0.02), 0.7), // Decreasing confidence over time
        variance: projectedValue * trendAnalysis.volatility
      });
    }
    
    return {
      type: 'linear_regression',
      accuracy: 0.85,
      projections,
      parameters: {
        slope: trendAnalysis.slope,
        seasonality: trendAnalysis.seasonality,
        volatility: trendAnalysis.volatility
      }
    };
  }

  /**
   * Generate multiple forecast scenarios
   */
  private static generateScenarios(
    baseForecast: PredictiveModel
  ): ForecastScenario[] {
    const scenarios: ForecastScenario[] = [];
    
    // Optimistic scenario (20% better)
    scenarios.push({
      name: 'Optimistic',
      probability: 0.2,
      description: 'Best case scenario dengan minimal delays dan cost overruns',
      projections: baseForecast.projections.map(p => ({
        ...p,
        projectedCost: p.projectedCost * 0.8,
        cumulativeCost: p.cumulativeCost * 0.8
      })),
      impactFactors: [
        'Optimal resource utilization',
        'No material price increases',
        'Weather favorable',
        'No scope changes'
      ]
    });
    
    // Most likely scenario (base)
    scenarios.push({
      name: 'Most Likely',
      probability: 0.6,
      description: 'Expected scenario berdasarkan historical data dan current trends',
      projections: baseForecast.projections,
      impactFactors: [
        'Normal resource efficiency',
        'Moderate price escalation',
        'Standard weather conditions',
        'Minor scope adjustments'
      ]
    });
    
    // Pessimistic scenario (30% worse)
    scenarios.push({
      name: 'Pessimistic',
      probability: 0.2,
      description: 'Worst case scenario dengan significant challenges',
      projections: baseForecast.projections.map(p => ({
        ...p,
        projectedCost: p.projectedCost * 1.3,
        cumulativeCost: p.cumulativeCost * 1.3
      })),
      impactFactors: [
        'Resource constraints',
        'Material shortage and price spikes',
        'Adverse weather conditions',
        'Major scope changes',
        'Regulatory delays'
      ]
    });
    
    return scenarios;
  }

  /**
   * Assess financial risks
   */
  private static assessFinancialRisks(
    scenarios: ForecastScenario[],
    trendAnalysis: TrendAnalysis
  ): RiskAssessment {
    const worstCase = scenarios.find(s => s.name === 'Pessimistic');
    const bestCase = scenarios.find(s => s.name === 'Optimistic');
    const mostLikely = scenarios.find(s => s.name === 'Most Likely');
    
    if (!worstCase || !bestCase || !mostLikely) {
      throw new Error('Missing required scenarios');
    }
    
    const finalWorstCost = worstCase.projections[worstCase.projections.length - 1].cumulativeCost;
    const finalBestCost = bestCase.projections[bestCase.projections.length - 1].cumulativeCost;
    const finalLikelyCost = mostLikely.projections[mostLikely.projections.length - 1].cumulativeCost;
    
    const costVariance = finalWorstCost - finalBestCost;
    const riskLevel = this.calculateRiskLevel(trendAnalysis.volatility, costVariance / finalLikelyCost);
    
    return {
      overallRiskLevel: riskLevel,
      costVariance,
      budgetAtRisk: Math.max(0, finalWorstCost - finalLikelyCost),
      probabilityOfOverrun: this.calculateOverrunProbability(scenarios),
      keyRiskFactors: [
        {
          factor: 'Market Volatility',
          impact: trendAnalysis.volatility > 0.2 ? 'High' : 'Medium',
          probability: trendAnalysis.volatility,
          mitigation: 'Implement price hedging strategies'
        },
        {
          factor: 'Scope Creep',
          impact: 'Medium',
          probability: 0.3,
          mitigation: 'Strict change control process'
        },
        {
          factor: 'Resource Availability',
          impact: 'High',
          probability: 0.25,
          mitigation: 'Diversify supplier base'
        }
      ],
      recommendations: this.generateRiskMitigationRecommendations(riskLevel),
      // Additional properties for component compatibility
      id: `risk_${Date.now()}`,
      documentId: 'forecast_doc',
      riskLevel: riskLevel.toLowerCase() as any,
      factors: ['Market Volatility', 'Scope Creep', 'Resource Availability'],
      mitigationStrategies: this.generateRiskMitigationRecommendations(riskLevel),
      complianceIssues: []
    };
  }

  /**
   * Generate cash flow projections
   */
  private static generateCashFlowProjections(
    baseForecast: PredictiveModel,
    scenarios: ForecastScenario[],
    timeframe: number
  ): CashFlowProjection[] {
    const projections: CashFlowProjection[] = [];
    
    for (let month = 1; month <= timeframe; month++) {
      const baseProjection = baseForecast.projections[month - 1];
      const optimisticScenario = scenarios.find(s => s.name === 'Optimistic');
      const pessimisticScenario = scenarios.find(s => s.name === 'Pessimistic');
      
      if (!optimisticScenario || !pessimisticScenario) continue;
      
      const optimisticProjection = optimisticScenario.projections[month - 1];
      const pessimisticProjection = pessimisticScenario.projections[month - 1];
      
      // Calculate payment timing (typically 30-60 days after work completion)
      const paymentDelay = 1; // months
      const paymentMonth = Math.min(month + paymentDelay, timeframe);
      
      projections.push({
        period: month,
        plannedInflow: baseProjection.projectedCost * 0.9, // 90% of work value
        plannedOutflow: baseProjection.projectedCost,
        optimisticInflow: optimisticProjection.projectedCost * 0.9,
        pessimisticInflow: pessimisticProjection.projectedCost * 0.9,
        netCashFlow: (baseProjection.projectedCost * 0.9) - baseProjection.projectedCost,
        cumulativeCashFlow: projections.reduce((sum, p) => sum + p.netCashFlow, 0) + 
                           ((baseProjection.projectedCost * 0.9) - baseProjection.projectedCost),
        workingCapitalRequired: baseProjection.projectedCost * 0.15,
        paymentTiming: paymentMonth
      });
    }
    
    return projections;
  }

  /**
   * Generate actionable recommendations
   */
  private static generateRecommendations(
    scenarios: ForecastScenario[],
    riskAssessment: RiskAssessment
  ): string[] {
    const recommendations: string[] = [];
    
    if (riskAssessment.overallRiskLevel === 'High') {
      recommendations.push('Implement enhanced risk monitoring and early warning systems');
      recommendations.push('Consider increasing contingency reserves by 15-20%');
      recommendations.push('Establish alternative supplier relationships');
    }
    
    if (riskAssessment.probabilityOfOverrun > 0.4) {
      recommendations.push('Review and tighten scope control processes');
      recommendations.push('Implement more frequent budget reviews (bi-weekly)');
      recommendations.push('Consider value engineering opportunities');
    }
    
    const pessimisticScenario = scenarios.find(s => s.name === 'Pessimistic');
    if (pessimisticScenario) {
      const finalCost = pessimisticScenario.projections[pessimisticScenario.projections.length - 1].cumulativeCost;
      const mostLikelyScenario = scenarios.find(s => s.name === 'Most Likely');
      if (mostLikelyScenario) {
        const mostLikelyCost = mostLikelyScenario.projections[mostLikelyScenario.projections.length - 1].cumulativeCost;
        const variance = ((finalCost - mostLikelyCost) / mostLikelyCost) * 100;
        
        if (variance > 25) {
          recommendations.push('Consider phased implementation to reduce exposure');
          recommendations.push('Develop detailed contingency plans for high-impact scenarios');
        }
      }
    }
    
    recommendations.push('Implement automated cost tracking and variance reporting');
    recommendations.push('Establish clear escalation procedures for budget deviations');
    
    return recommendations;
  }

  // Helper methods
  private static calculateCorrelation(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    
    const meanX = (n - 1) / 2;
    const meanY = values.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (i - meanX) * (values[i] - meanY);
      denomX += (i - meanX) ** 2;
      denomY += (values[i] - meanY) ** 2;
    }
    
    return denomX * denomY === 0 ? 0 : numerator / Math.sqrt(denomX * denomY);
  }

  private static detectSeasonality(historicalData: any[]): number[] {
    const seasonality = new Array(12).fill(1);
    
    if (historicalData.length < 12) return seasonality;
    
    const monthlyAverage = new Array(12).fill(0);
    const monthlyCounts = new Array(12).fill(0);
    
    historicalData.forEach(data => {
      const month = new Date(data.date).getMonth();
      monthlyAverage[month] += data.value;
      monthlyCounts[month]++;
    });
    
    const overallAverage = historicalData.reduce((sum, d) => sum + d.value, 0) / historicalData.length;
    
    for (let i = 0; i < 12; i++) {
      if (monthlyCounts[i] > 0) {
        seasonality[i] = (monthlyAverage[i] / monthlyCounts[i]) / overallAverage;
      }
    }
    
    return seasonality;
  }

  private static calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0.1;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance) / mean;
  }

  private static calculateRiskLevel(volatility: number, costVarianceRatio: number): 'Low' | 'Medium' | 'High' {
    const riskScore = volatility + costVarianceRatio;
    
    if (riskScore > 0.4) return 'High';
    if (riskScore > 0.2) return 'Medium';
    return 'Low';
  }

  private static calculateOverrunProbability(scenarios: ForecastScenario[]): number {
    const pessimisticProb = scenarios.find(s => s.name === 'Pessimistic')?.probability || 0.2;
    const optimisticProb = scenarios.find(s => s.name === 'Optimistic')?.probability || 0.2;
    
    // Probability of any cost overrun (even minor)
    return pessimisticProb + (1 - pessimisticProb - optimisticProb) * 0.3;
  }

  private static calculateForecastAccuracy(historicalData: any[], trendAnalysis: TrendAnalysis): number {
    if (historicalData.length < 3) return 0.7;
    
    // Base accuracy on correlation and volatility
    const baseAccuracy = 0.95;
    const correlationPenalty = (1 - Math.abs(trendAnalysis.correlation)) * 0.2;
    const volatilityPenalty = Math.min(trendAnalysis.volatility, 0.3) * 0.5;
    
    return Math.max(0.5, baseAccuracy - correlationPenalty - volatilityPenalty);
  }

  private static generateRiskMitigationRecommendations(riskLevel: 'Low' | 'Medium' | 'High'): string[] {
    const baseRecommendations = [
      'Monitor key performance indicators weekly',
      'Maintain updated risk register',
      'Review forecasts monthly'
    ];
    
    if (riskLevel === 'Medium') {
      baseRecommendations.push(
        'Increase contingency reserves',
        'Implement bi-weekly risk assessments',
        'Develop backup supplier relationships'
      );
    } else if (riskLevel === 'High') {
      baseRecommendations.push(
        'Increase contingency reserves significantly',
        'Implement daily risk monitoring',
        'Prepare detailed contingency plans',
        'Consider risk insurance options',
        'Establish crisis management protocols'
      );
    }
    
    return baseRecommendations;
  }
}