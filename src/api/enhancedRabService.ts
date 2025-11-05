import {
  EnhancedRabItem,
  CostBreakdown,
  PriceHistory,
  VarianceAnalysis,
  SensitivityFactor,
  RegionalPriceFactor,
  MarketFactor
} from '@/types';

export class EnhancedRabService {
  /**
   * Calculate detailed cost breakdown for a RAB item
   */
  static calculateCostBreakdown(
    basePrice: number,
    laborPercentage: number = 35,
    materialPercentage: number = 45,
    equipmentPercentage: number = 15,
    overheadPercentage: number = 3,
    profitPercentage: number = 2
  ): CostBreakdown {
    const laborCost = basePrice * (laborPercentage / 100);
    const materialCost = basePrice * (materialPercentage / 100);
    const equipmentCost = basePrice * (equipmentPercentage / 100);
    const overheadCost = basePrice * (overheadPercentage / 100);
    const profitMargin = basePrice * (profitPercentage / 100);

    return {
      laborCost,
      laborPercentage,
      materialCost,
      materialPercentage,
      equipmentCost,
      equipmentPercentage,
      overheadCost,
      overheadPercentage,
      profitMargin,
      profitPercentage,
      totalCost: laborCost + materialCost + equipmentCost + overheadCost + profitMargin,
    };
  }

  /**
   * Analyze price variance between budget and actual
   */
  static calculateVarianceAnalysis(
    budgetedCost: number,
    actualCost: number,
    plannedDuration: number,
    actualDuration: number
  ): VarianceAnalysis {
    const costVariance = actualCost - budgetedCost;
    const costVariancePercentage = budgetedCost !== 0 ? (costVariance / budgetedCost) * 100 : 0;
    
    const timeVariance = actualDuration - plannedDuration;
    const timeVariancePercentage = plannedDuration !== 0 ? (timeVariance / plannedDuration) * 100 : 0;
    
    const performanceIndex = budgetedCost !== 0 ? actualCost / budgetedCost : 1;
    
    let trend: 'improving' | 'deteriorating' | 'stable' = 'stable';
    if (costVariancePercentage < -5) trend = 'improving';
    else if (costVariancePercentage > 5) trend = 'deteriorating';
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (Math.abs(costVariancePercentage) > 15) riskLevel = 'critical';
    else if (Math.abs(costVariancePercentage) > 10) riskLevel = 'high';
    else if (Math.abs(costVariancePercentage) > 5) riskLevel = 'medium';

    return {
      budgetedCost,
      actualCost,
      costVariance,
      costVariancePercentage,
      timeVariance,
      timeVariancePercentage,
      performanceIndex,
      trend,
      riskLevel,
    };
  }

  /**
   * Calculate price escalation based on rate and factors
   */
  static calculatePriceEscalation(
    basePrice: number,
    escalationRate: number,
    months: number,
    marketFactors: MarketFactor[] = []
  ): number {
    const monthlyRate = escalationRate / 12 / 100;
    let projectedPrice = basePrice * Math.pow(1 + monthlyRate, months);

    // Apply market factor adjustments
    for (const factor of marketFactors) {
      const factorImpact = factor.weight * (factor.currentValue / 100 - 1);
      projectedPrice *= 1 + factorImpact;
    }

    return projectedPrice;
  }

  /**
   * Apply regional price adjustments
   */
  static applyRegionalAdjustments(
    basePrice: number,
    regionalFactors: RegionalPriceFactor[]
  ): number {
    let adjustedPrice = basePrice;

    for (const factor of regionalFactors) {
      if (factor.isActive) {
        adjustedPrice *= factor.adjustmentFactor;
      }
    }

    return adjustedPrice;
  }

  /**
   * Create enhanced RAB item with all analysis
   */
  static createEnhancedRabItem(
    basicItem: any, // Using any to avoid complex type issues
    options: {
      includeHistoricalData?: boolean;
      calculateProjections?: boolean;
      region?: string;
    } = {}
  ): EnhancedRabItem {
    const now = new Date().toISOString();
    
    // Calculate cost breakdown
    const costBreakdown = this.calculateCostBreakdown(
      basicItem.hargaSatuan,
      35, // labor percentage
      45, // material percentage
      15, // equipment percentage
      3,  // overhead percentage
      2   // profit percentage
    );

    // Create price history (mock data)
    const priceHistory: PriceHistory[] = options.includeHistoricalData
      ? [
          {
            id: 'history_1',
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
            price: basicItem.hargaSatuan * 0.95, // 5% lower
            supplier: 'Market Data',
            location: 'Jakarta',
            marketCondition: 'falling',
            dataSource: 'market_survey',
            reliability: 85,
            notes: 'Previous quarter pricing',
          },
          {
            id: 'history_2',
            date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
            price: basicItem.hargaSatuan * 0.92, // 8% lower
            supplier: 'Market Data',
            location: 'Jakarta',
            marketCondition: 'falling',
            dataSource: 'market_survey',
            reliability: 80,
            notes: 'Previous pricing cycle',
          },
        ]
      : [];

    // Create sensitivity factors
    const sensitivityFactors: SensitivityFactor[] = [
      {
        id: 'sens_1',
        factor: 'Material Price Fluctuation',
        impact: 15,
        probability: 70,
        riskType: 'cost_increase',
        mitigation: 'Multi-supplier strategy',
        lastAssessment: now,
      },
      {
        id: 'sens_2',
        factor: 'Labor Availability',
        impact: 10,
        probability: 40,
        riskType: 'schedule_delay',
        mitigation: 'Flexible workforce planning',
        lastAssessment: now,
      },
    ];

    // Create regional factors
    const regionalFactors: RegionalPriceFactor[] = [];
    if (options.region) {
      regionalFactors.push({
        id: `regional_${options.region}`,
        region: options.region,
        adjustmentFactor: options.region.includes('Remote') ? 1.15 : 1.05,
        category: 'all',
        effectiveDate: now,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        reason: `Regional adjustment for ${options.region}`,
        isActive: true,
      });
    }

    // Create variance analysis
    const budgetVariance = this.calculateVarianceAnalysis(
      basicItem.hargaSatuan,
      basicItem.hargaSatuan, // Same as budget initially
      30, // Default 30 days
      30 // Same initially
    );

    return {
      ...basicItem,
      costBreakdown,
      priceHistory,
      escalationRate: 8.5, // Default annual escalation rate
      budgetVariance,
      sensitivityFactors,
      regionalFactors,
      lastUpdated: now,
      updatedBy: 'system',
      dataSource: 'calculated',
    };
  }
}

export default EnhancedRabService;