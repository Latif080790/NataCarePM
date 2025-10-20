import { 
    EnhancedRabItem, 
    CostBreakdown, 
    PriceHistory, 
    VarianceAnalysis,
    SensitivityFactor,
    RegionalPriceFactor,
    MarketFactor,
    ProjectRiskProfile
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
            totalCost: laborCost + materialCost + equipmentCost + overheadCost + profitMargin
        };
    }

    /**
     * Analyze price variance between budget and actual
     */
    static calculateVarianceAnalysis(
        budgetedCost: number,
        actualCost: number,
        scheduledDays: number,
        actualDays: number
    ): VarianceAnalysis {
        const costVariance = actualCost - budgetedCost;
        const costVariancePercentage = budgetedCost > 0 ? (costVariance / budgetedCost) * 100 : 0;
        const timeVariance = actualDays - scheduledDays;
        const timeVariancePercentage = scheduledDays > 0 ? (timeVariance / scheduledDays) * 100 : 0;
        
        // Performance index calculation (lower is better for costs)
        const performanceIndex = budgetedCost > 0 ? actualCost / budgetedCost : 1;
        
        // Determine trend based on variance patterns
        let trend: 'improving' | 'deteriorating' | 'stable' = 'stable';
        if (costVariancePercentage > 5) trend = 'deteriorating';
        else if (costVariancePercentage < -5) trend = 'improving';
        
        // Risk level assessment
        let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
        const totalVarianceImpact = Math.abs(costVariancePercentage) + Math.abs(timeVariancePercentage);
        
        if (totalVarianceImpact > 20) riskLevel = 'critical';
        else if (totalVarianceImpact > 10) riskLevel = 'high';
        else if (totalVarianceImpact > 5) riskLevel = 'medium';
        
        return {
            budgetedCost,
            actualCost,
            costVariance,
            costVariancePercentage,
            timeVariance,
            timeVariancePercentage,
            performanceIndex,
            trend,
            riskLevel
        };
    }

    /**
     * Calculate sensitivity analysis for risk factors
     */
    static calculateSensitivityAnalysis(
        sensitivityFactors: Omit<SensitivityFactor, 'id' | 'lastAssessment'>[]
    ): SensitivityFactor[] {
        return sensitivityFactors.map((factor, index) => ({
            ...factor,
            id: `sensitivity_${index + 1}`,
            lastAssessment: new Date().toISOString(),
            // Calculate weighted impact
            impact: factor.impact * (factor.probability / 100)
        }));
    }

    /**
     * Apply regional price adjustments
     */
    static applyRegionalAdjustments(
        basePrice: number,
        regionalFactors: RegionalPriceFactor[]
    ): number {
        let adjustedPrice = basePrice;
        
        const activeFactors = regionalFactors.filter(factor => 
            factor.isActive && 
            new Date(factor.effectiveDate) <= new Date() &&
            new Date(factor.expiryDate) >= new Date()
        );
        
        for (const factor of activeFactors) {
            adjustedPrice *= factor.adjustmentFactor;
        }
        
        return adjustedPrice;
    }

    /**
     * Calculate price escalation based on market factors
     */
    static calculatePriceEscalation(
        basePrice: number,
        escalationRate: number,
        monthsFromBase: number,
        marketFactors: MarketFactor[] = []
    ): number {
        // Base escalation calculation
        const monthlyRate = escalationRate / 12 / 100;
        let escalatedPrice = basePrice * Math.pow(1 + monthlyRate, monthsFromBase);
        
        // Apply market factor adjustments
        for (const factor of marketFactors) {
            const factorImpact = factor.weight * (factor.currentValue / 100);
            escalatedPrice *= (1 + factorImpact);
        }
        
        return escalatedPrice;
    }

    /**
     * Generate price history analysis
     */
    static analyzePriceHistory(priceHistory: PriceHistory[]): {
        averagePrice: number;
        priceVolatility: number;
        trend: 'increasing' | 'decreasing' | 'stable';
        reliability: number;
    } {
        if (priceHistory.length === 0) {
            return {
                averagePrice: 0,
                priceVolatility: 0,
                trend: 'stable',
                reliability: 0
            };
        }
        
        const prices = priceHistory.map(h => h.price);
        const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        
        // Calculate price volatility (standard deviation)
        const variance = prices.reduce((sum, price) => sum + Math.pow(price - averagePrice, 2), 0) / prices.length;
        const priceVolatility = Math.sqrt(variance) / averagePrice * 100;
        
        // Determine trend (compare first and last quarters)
        const firstQuarter = prices.slice(0, Math.max(1, Math.floor(prices.length / 4)));
        const lastQuarter = prices.slice(-Math.max(1, Math.floor(prices.length / 4)));
        
        const firstAvg = firstQuarter.reduce((sum, price) => sum + price, 0) / firstQuarter.length;
        const lastAvg = lastQuarter.reduce((sum, price) => sum + price, 0) / lastQuarter.length;
        
        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        const changePercentage = ((lastAvg - firstAvg) / firstAvg) * 100;
        
        if (changePercentage > 5) trend = 'increasing';
        else if (changePercentage < -5) trend = 'decreasing';
        
        // Calculate reliability based on data recency and source quality
        const avgReliability = priceHistory.reduce((sum, h) => sum + h.reliability, 0) / priceHistory.length;
        const recencyFactor = this.calculateRecencyFactor(priceHistory);
        const reliability = (avgReliability + recencyFactor) / 2;
        
        return {
            averagePrice,
            priceVolatility,
            trend,
            reliability
        };
    }

    /**
     * Calculate data recency factor for reliability assessment
     */
    private static calculateRecencyFactor(priceHistory: PriceHistory[]): number {
        const now = new Date();
        let totalWeight = 0;
        let weightedScore = 0;
        
        for (const history of priceHistory) {
            const dataAge = (now.getTime() - new Date(history.date).getTime()) / (1000 * 60 * 60 * 24); // days
            const weight = Math.max(0, 100 - dataAge); // More recent = higher weight
            
            totalWeight += weight;
            weightedScore += weight * (dataAge < 30 ? 100 : dataAge < 90 ? 75 : dataAge < 180 ? 50 : 25);
        }
        
        return totalWeight > 0 ? weightedScore / totalWeight : 0;
    }

    /**
     * Generate comprehensive risk assessment
     */
    static generateRiskAssessment(
        enhancedItem: EnhancedRabItem
    ): ProjectRiskProfile {
        const riskFactors = [];
        
        // Price volatility risk
        if (enhancedItem.priceHistory.length > 0) {
            const historyAnalysis = this.analyzePriceHistory(enhancedItem.priceHistory);
            if (historyAnalysis.priceVolatility > 15) {
                riskFactors.push({
                    id: `price_volatility_${enhancedItem.id}`,
                    category: 'market' as const,
                    description: 'High price volatility detected in historical data',
                    probability: Math.min(90, historyAnalysis.priceVolatility * 2),
                    impact: 70,
                    riskScore: 0,
                    status: 'monitored' as const
                });
            }
        }
        
        // Escalation risk
        if (enhancedItem.escalationRate > 10) {
            riskFactors.push({
                id: `escalation_risk_${enhancedItem.id}`,
                category: 'financial' as const,
                description: 'High escalation rate may impact project budget',
                probability: 75,
                impact: enhancedItem.escalationRate * 5,
                riskScore: 0,
                status: 'identified' as const
            });
        }
        
        // Calculate risk scores
        riskFactors.forEach(factor => {
            factor.riskScore = (factor.probability * factor.impact) / 100;
        });
        
        // Overall risk assessment
        const avgRiskScore = riskFactors.length > 0 
            ? riskFactors.reduce((sum, factor) => sum + factor.riskScore, 0) / riskFactors.length 
            : 0;
            
        let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (avgRiskScore > 60) overallRisk = 'critical';
        else if (avgRiskScore > 40) overallRisk = 'high';
        else if (avgRiskScore > 20) overallRisk = 'medium';
        
        return {
            id: `risk_profile_${enhancedItem.id}`,
            overallRisk,
            costRisk: Math.min(50, enhancedItem.escalationRate + (enhancedItem.budgetVariance.costVariancePercentage || 0)),
            scheduleRisk: Math.abs(enhancedItem.budgetVariance.timeVariancePercentage || 0),
            qualityRisk: avgRiskScore,
            riskFactors,
            mitigationStrategies: [],
            lastAssessment: new Date().toISOString()
        };
    }

    /**
     * Create enhanced RAB item from basic RAB item
     */
    static createEnhancedRabItem(
        basicItem: any,
        options: {
            includeHistoricalData?: boolean;
            calculateProjections?: boolean;
            region?: string;
        } = {}
    ): EnhancedRabItem {
        const now = new Date().toISOString();
        
        // Calculate cost breakdown
        const costBreakdown = this.calculateCostBreakdown(basicItem.hargaSatuan);
        
        // Initialize empty arrays for enhanced data
        const priceHistory: PriceHistory[] = [];
        const sensitivityFactors: SensitivityFactor[] = [];
        const regionalFactors: RegionalPriceFactor[] = [];
        
        // Add sample sensitivity factors
        if (options.calculateProjections) {
            sensitivityFactors.push(
                {
                    id: 'material_price_risk',
                    factor: 'Material Price Fluctuation',
                    impact: 15,
                    probability: 60,
                    riskType: 'cost_increase',
                    mitigation: 'Long-term supplier contracts',
                    lastAssessment: now
                },
                {
                    id: 'labor_availability',
                    factor: 'Labor Availability',
                    impact: 20,
                    probability: 40,
                    riskType: 'cost_increase',
                    mitigation: 'Multi-source recruitment strategy',
                    lastAssessment: now
                }
            );
        }
        
        // Add regional factors if region specified
        if (options.region && options.region !== 'Jakarta') {
            regionalFactors.push({
                id: `regional_${options.region}`,
                region: options.region,
                adjustmentFactor: options.region.includes('Remote') ? 1.15 : 1.05,
                category: 'all',
                effectiveDate: now,
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                reason: `Regional adjustment for ${options.region}`,
                isActive: true
            });
        }
        
        // Basic variance analysis (will be updated with real data)
        const budgetVariance = this.calculateVarianceAnalysis(
            basicItem.hargaSatuan,
            basicItem.hargaSatuan, // Same as budget initially
            30, // Default 30 days
            30  // Same initially
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
            dataSource: 'enhanced_calculation'
        };
    }
}

export default EnhancedRabService;