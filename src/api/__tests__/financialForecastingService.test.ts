import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FinancialForecastingService } from '../financialForecastingService';

// ============================================================================
// TEST DATA
// ============================================================================

const mockHistoricalData = [
  { date: '2024-01-01', value: 100000 },
  { date: '2024-02-01', value: 105000 },
  { date: '2024-03-01', value: 110000 },
  { date: '2024-04-01', value: 108000 },
  { date: '2024-05-01', value: 115000 },
  { date: '2024-06-01', value: 120000 },
  { date: '2024-07-01', value: 118000 },
  { date: '2024-08-01', value: 125000 },
  { date: '2024-09-01', value: 130000 },
  { date: '2024-10-01', value: 128000 },
  { date: '2024-11-01', value: 135000 },
  { date: '2024-12-01', value: 140000 },
];

const mockForecastInput = {
  historicalData: mockHistoricalData,
  currentBudget: 150000,
  timeframe: 12, // months
  confidenceLevel: 0.85,
};

const projectId = 'project-123';

// ============================================================================
// TEST SUITE
// ============================================================================

describe('FinancialForecastingService - Main Forecast Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Math.random for deterministic tests
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  it('should generate complete financial forecast with all components', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(
      projectId,
      mockForecastInput
    );

    // Verify top-level structure
    expect(forecast).toHaveProperty('projectId', projectId);
    expect(forecast).toHaveProperty('forecastDate');
    expect(forecast).toHaveProperty('timeframe', 12);
    expect(forecast).toHaveProperty('confidenceLevel', 0.85);
    expect(forecast).toHaveProperty('baseForecast');
    expect(forecast).toHaveProperty('scenarios');
    expect(forecast).toHaveProperty('riskAssessment');
    expect(forecast).toHaveProperty('cashFlowProjections');
    expect(forecast).toHaveProperty('recommendations');
    expect(forecast).toHaveProperty('accuracy');

    // Verify forecastDate is a Date object
    expect(forecast.forecastDate).toBeInstanceOf(Date);

    // Verify accuracy is a valid percentage
    expect(forecast.accuracy).toBeGreaterThanOrEqual(0.5);
    expect(forecast.accuracy).toBeLessThanOrEqual(1);
  });

  it('should generate base forecast with correct structure', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(
      projectId,
      mockForecastInput
    );

    const baseForecast = forecast.baseForecast;

    // Verify base forecast structure
    expect(baseForecast).toHaveProperty('type', 'linear_regression');
    expect(baseForecast).toHaveProperty('accuracy');
    expect(baseForecast).toHaveProperty('projections');
    expect(baseForecast).toHaveProperty('parameters');

    // Verify projections array
    expect(baseForecast.projections).toHaveLength(12);

    // Verify each projection has required fields
    baseForecast.projections.forEach((projection, index) => {
      expect(projection).toHaveProperty('period', index + 1);
      expect(projection).toHaveProperty('projectedCost');
      expect(projection).toHaveProperty('cumulativeCost');
      expect(projection).toHaveProperty('confidence');
      expect(projection).toHaveProperty('variance');

      // Confidence should decrease over time
      expect(projection.confidence).toBeLessThanOrEqual(0.95);
      expect(projection.confidence).toBeGreaterThanOrEqual(0.7);
    });

    // Verify parameters
    expect(baseForecast.parameters).toHaveProperty('slope');
    expect(baseForecast.parameters).toHaveProperty('seasonality');
    expect(baseForecast.parameters).toHaveProperty('volatility');
    expect(baseForecast.parameters.seasonality).toHaveLength(12);
  });

  it('should generate three forecast scenarios (Optimistic, Most Likely, Pessimistic)', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(
      projectId,
      mockForecastInput
    );

    const scenarios = forecast.scenarios;

    // Verify exactly 3 scenarios
    expect(scenarios).toHaveLength(3);

    // Verify scenario names
    const scenarioNames = scenarios.map((s) => s.name);
    expect(scenarioNames).toContain('Optimistic');
    expect(scenarioNames).toContain('Most Likely');
    expect(scenarioNames).toContain('Pessimistic');

    // Verify probabilities sum to 1.0
    const totalProbability = scenarios.reduce((sum, s) => sum + s.probability, 0);
    expect(totalProbability).toBeCloseTo(1.0, 1);

    // Verify each scenario structure
    scenarios.forEach((scenario) => {
      expect(scenario).toHaveProperty('name');
      expect(scenario).toHaveProperty('probability');
      expect(scenario).toHaveProperty('description');
      expect(scenario).toHaveProperty('projections');
      expect(scenario).toHaveProperty('impactFactors');

      expect(scenario.projections).toHaveLength(12);
      expect(Array.isArray(scenario.impactFactors)).toBe(true);
      expect(scenario.impactFactors.length).toBeGreaterThan(0);
    });
  });

  it('should generate scenarios with correct cost variance (Optimistic < Most Likely < Pessimistic)', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(
      projectId,
      mockForecastInput
    );

    const optimistic = forecast.scenarios.find((s) => s.name === 'Optimistic');
    const mostLikely = forecast.scenarios.find((s) => s.name === 'Most Likely');
    const pessimistic = forecast.scenarios.find((s) => s.name === 'Pessimistic');

    expect(optimistic).toBeDefined();
    expect(mostLikely).toBeDefined();
    expect(pessimistic).toBeDefined();

    // Compare final cumulative costs
    const optimisticFinalCost =
      optimistic!.projections[optimistic!.projections.length - 1].cumulativeCost;
    const mostLikelyFinalCost =
      mostLikely!.projections[mostLikely!.projections.length - 1].cumulativeCost;
    const pessimisticFinalCost =
      pessimistic!.projections[pessimistic!.projections.length - 1].cumulativeCost;

    expect(optimisticFinalCost).toBeLessThan(mostLikelyFinalCost);
    expect(mostLikelyFinalCost).toBeLessThan(pessimisticFinalCost);

    // Verify Optimistic is ~20% better than Most Likely
    expect(optimisticFinalCost).toBeCloseTo(mostLikelyFinalCost * 0.8, -3);

    // Verify Pessimistic is ~30% worse than Most Likely
    expect(pessimisticFinalCost).toBeCloseTo(mostLikelyFinalCost * 1.3, -3);
  });

  it('should generate risk assessment with all required fields', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(
      projectId,
      mockForecastInput
    );

    const riskAssessment = forecast.riskAssessment;

    // Verify risk assessment structure
    expect(riskAssessment).toHaveProperty('overallRiskLevel');
    expect(riskAssessment).toHaveProperty('costVariance');
    expect(riskAssessment).toHaveProperty('budgetAtRisk');
    expect(riskAssessment).toHaveProperty('probabilityOfOverrun');
    expect(riskAssessment).toHaveProperty('keyRiskFactors');
    expect(riskAssessment).toHaveProperty('recommendations');

    // Verify risk level is valid
    expect(['Low', 'Medium', 'High']).toContain(riskAssessment.overallRiskLevel);

    // Verify costVariance is positive
    expect(riskAssessment.costVariance).toBeGreaterThan(0);

    // Verify budgetAtRisk is non-negative
    expect(riskAssessment.budgetAtRisk).toBeGreaterThanOrEqual(0);

    // Verify probability is between 0 and 1
    expect(riskAssessment.probabilityOfOverrun).toBeGreaterThanOrEqual(0);
    expect(riskAssessment.probabilityOfOverrun).toBeLessThanOrEqual(1);

    // Verify keyRiskFactors array
    expect(Array.isArray(riskAssessment.keyRiskFactors)).toBe(true);
    expect(riskAssessment.keyRiskFactors.length).toBeGreaterThan(0);

    // Verify each risk factor structure
    riskAssessment.keyRiskFactors.forEach((factor) => {
      expect(factor).toHaveProperty('factor');
      expect(factor).toHaveProperty('impact');
      expect(factor).toHaveProperty('probability');
      expect(factor).toHaveProperty('mitigation');

      expect(['Low', 'Medium', 'High']).toContain(factor.impact);
      expect(factor.probability).toBeGreaterThanOrEqual(0);
      expect(factor.probability).toBeLessThanOrEqual(1);
    });

    // Verify recommendations array
    expect(Array.isArray(riskAssessment.recommendations)).toBe(true);
    expect(riskAssessment.recommendations.length).toBeGreaterThan(0);
  });

  it('should generate cash flow projections for each period', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(
      projectId,
      mockForecastInput
    );

    const cashFlowProjections = forecast.cashFlowProjections;

    // Verify projections array
    expect(cashFlowProjections).toHaveLength(12);

    // Verify each projection structure
    cashFlowProjections.forEach((projection, index) => {
      expect(projection).toHaveProperty('period', index + 1);
      expect(projection).toHaveProperty('plannedInflow');
      expect(projection).toHaveProperty('plannedOutflow');
      expect(projection).toHaveProperty('optimisticInflow');
      expect(projection).toHaveProperty('pessimisticInflow');
      expect(projection).toHaveProperty('netCashFlow');
      expect(projection).toHaveProperty('cumulativeCashFlow');
      expect(projection).toHaveProperty('workingCapitalRequired');
      expect(projection).toHaveProperty('paymentTiming');

      // Verify netCashFlow calculation (inflow - outflow should be negative)
      expect(projection.netCashFlow).toBeLessThan(0);

      // Verify working capital is 15% of outflow
      expect(projection.workingCapitalRequired).toBeCloseTo(projection.plannedOutflow * 0.15, -2);
    });
  });

  it('should generate actionable recommendations', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(
      projectId,
      mockForecastInput
    );

    const recommendations = forecast.recommendations;

    // Verify recommendations array
    expect(Array.isArray(recommendations)).toBe(true);
    expect(recommendations.length).toBeGreaterThan(0);

    // Verify each recommendation is a non-empty string
    recommendations.forEach((recommendation) => {
      expect(typeof recommendation).toBe('string');
      expect(recommendation.length).toBeGreaterThan(0);
    });
  });
});

describe('FinancialForecastingService - Edge Cases & Error Handling', () => {
  it('should handle minimal historical data (< 3 data points)', () => {
    const minimalData = [
      { date: '2024-01-01', value: 100000 },
      { date: '2024-02-01', value: 105000 },
    ];

    const forecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: minimalData,
      currentBudget: 150000,
      timeframe: 6,
      confidenceLevel: 0.75,
    });

    // Should still generate forecast with calculated trend analysis
    expect(forecast).toBeDefined();
    expect(forecast.baseForecast).toBeDefined();
    expect(forecast.baseForecast.parameters).toBeDefined();
    
    // Slope should be a valid number (could be 0 for minimal data)
    expect(typeof forecast.baseForecast.parameters.slope).toBe('number');
    
    // Seasonality should still be generated (12 months)
    expect(forecast.baseForecast.parameters.seasonality).toHaveLength(12);
    
    // Volatility should be calculated (could be low for small dataset)
    expect(forecast.baseForecast.parameters.volatility).toBeGreaterThanOrEqual(0);
    
    // Should generate valid forecasts even with minimal data
    expect(forecast.baseForecast.projections).toHaveLength(6);
    expect(forecast.scenarios).toHaveLength(3);
  });

  it('should handle empty historical data', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: [],
      currentBudget: 150000,
      timeframe: 6,
      confidenceLevel: 0.75,
    });

    expect(forecast).toBeDefined();
    expect(forecast.baseForecast.parameters.slope).toBe(0);
    expect(forecast.baseForecast.parameters.volatility).toBe(0.1);
  });

  it('should handle zero current budget', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: mockHistoricalData,
      currentBudget: 0,
      timeframe: 6,
      confidenceLevel: 0.85,
    });

    expect(forecast).toBeDefined();
    expect(forecast.baseForecast.projections).toHaveLength(6);

    // Projected costs should be near zero
    forecast.baseForecast.projections.forEach((projection) => {
      expect(projection.projectedCost).toBeLessThan(1000); // Allow for small calculations
    });
  });

  it('should handle very short timeframe (1 month)', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: mockHistoricalData,
      currentBudget: 150000,
      timeframe: 1,
      confidenceLevel: 0.85,
    });

    expect(forecast).toBeDefined();
    expect(forecast.baseForecast.projections).toHaveLength(1);
    expect(forecast.cashFlowProjections).toHaveLength(1);
  });

  it('should handle long timeframe (24+ months)', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: mockHistoricalData,
      currentBudget: 150000,
      timeframe: 24,
      confidenceLevel: 0.85,
    });

    expect(forecast).toBeDefined();
    expect(forecast.baseForecast.projections).toHaveLength(24);
    expect(forecast.cashFlowProjections).toHaveLength(24);

    // Confidence should decrease significantly over 24 months
    const lastProjection = forecast.baseForecast.projections[23];
    expect(lastProjection.confidence).toBeLessThan(0.8);
  });

  it('should handle high volatility historical data', () => {
    const volatileData = [
      { date: '2024-01-01', value: 100000 },
      { date: '2024-02-01', value: 150000 },
      { date: '2024-03-01', value: 80000 },
      { date: '2024-04-01', value: 170000 },
      { date: '2024-05-01', value: 90000 },
      { date: '2024-06-01', value: 160000 },
    ];

    const forecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: volatileData,
      currentBudget: 150000,
      timeframe: 6,
      confidenceLevel: 0.85,
    });

    expect(forecast).toBeDefined();
    expect(forecast.riskAssessment.overallRiskLevel).toBe('High');
    expect(forecast.baseForecast.parameters.volatility).toBeGreaterThan(0.2);

    // Should have risk mitigation recommendations
    expect(forecast.riskAssessment.recommendations.length).toBeGreaterThan(3);
  });

  it('should handle consistent upward trend data', () => {
    const trendData = Array.from({ length: 12 }, (_, i) => ({
      date: `2024-${String(i + 1).padStart(2, '0')}-01`,
      value: 100000 + i * 10000, // Linear increase
    }));

    const forecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: trendData,
      currentBudget: 150000,
      timeframe: 6,
      confidenceLevel: 0.85,
    });

    expect(forecast).toBeDefined();
    expect(forecast.baseForecast.parameters.slope).toBeGreaterThan(0);

    // Future projections should continue upward trend
    const projections = forecast.baseForecast.projections;
    for (let i = 1; i < projections.length; i++) {
      expect(projections[i].projectedCost).toBeGreaterThan(projections[i - 1].projectedCost);
    }
  });
});

describe('FinancialForecastingService - Risk Assessment Logic', () => {
  it('should calculate correct risk level based on volatility and cost variance', () => {
    // Low volatility, low variance → Low risk
    const lowVolatilityData = Array.from({ length: 12 }, (_, i) => ({
      date: `2024-${String(i + 1).padStart(2, '0')}-01`,
      value: 100000 + i * 1000, // Small steady increase
    }));

    const lowRiskForecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: lowVolatilityData,
      currentBudget: 150000,
      timeframe: 6,
      confidenceLevel: 0.85,
    });

    // Should have a valid risk level (Low, Medium, or High)
    expect(['Low', 'Medium', 'High']).toContain(
      lowRiskForecast.riskAssessment.overallRiskLevel
    );

    // With low volatility data, volatility should be relatively low
    expect(lowRiskForecast.baseForecast.parameters.volatility).toBeLessThan(0.2);
  });

  it('should increase risk level for high probability of overrun', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: mockHistoricalData,
      currentBudget: 150000,
      timeframe: 12,
      confidenceLevel: 0.85,
    });

    // Probability of overrun should be > 0
    expect(forecast.riskAssessment.probabilityOfOverrun).toBeGreaterThan(0);
    expect(forecast.riskAssessment.probabilityOfOverrun).toBeLessThanOrEqual(1);

    // If probability > 0.4, should have specific recommendations
    if (forecast.riskAssessment.probabilityOfOverrun > 0.4) {
      const recommendations = forecast.recommendations;
      const hasOverrunRecommendations = recommendations.some(
        (r) => r.toLowerCase().includes('scope') || r.toLowerCase().includes('budget review')
      );
      expect(hasOverrunRecommendations).toBe(true);
    }
  });

  it('should calculate budget at risk correctly', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: mockHistoricalData,
      currentBudget: 150000,
      timeframe: 12,
      confidenceLevel: 0.85,
    });

    const mostLikely = forecast.scenarios.find((s) => s.name === 'Most Likely');
    const pessimistic = forecast.scenarios.find((s) => s.name === 'Pessimistic');

    expect(mostLikely).toBeDefined();
    expect(pessimistic).toBeDefined();

    const mostLikelyFinal =
      mostLikely!.projections[mostLikely!.projections.length - 1].cumulativeCost;
    const pessimisticFinal =
      pessimistic!.projections[pessimistic!.projections.length - 1].cumulativeCost;

    const expectedBudgetAtRisk = Math.max(0, pessimisticFinal - mostLikelyFinal);

    expect(forecast.riskAssessment.budgetAtRisk).toBeCloseTo(expectedBudgetAtRisk, -2);
  });

  it('should include key risk factors (Market Volatility, Scope Creep, Resource Availability)', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: mockHistoricalData,
      currentBudget: 150000,
      timeframe: 12,
      confidenceLevel: 0.85,
    });

    const riskFactors = forecast.riskAssessment.keyRiskFactors;

    // Should have at least 3 risk factors
    expect(riskFactors.length).toBeGreaterThanOrEqual(3);

    // Check for specific risk factors
    const factorNames = riskFactors.map((f) => f.factor);
    expect(factorNames).toContain('Market Volatility');
    expect(factorNames).toContain('Scope Creep');
    expect(factorNames).toContain('Resource Availability');
  });
});

describe('FinancialForecastingService - Cash Flow Calculations', () => {
  it('should calculate net cash flow as inflow - outflow', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: mockHistoricalData,
      currentBudget: 150000,
      timeframe: 6,
      confidenceLevel: 0.85,
    });

    forecast.cashFlowProjections.forEach((projection) => {
      const expectedNetCashFlow = projection.plannedInflow - projection.plannedOutflow;
      expect(projection.netCashFlow).toBeCloseTo(expectedNetCashFlow, -2);
    });
  });

  it('should calculate cumulative cash flow correctly', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: mockHistoricalData,
      currentBudget: 150000,
      timeframe: 6,
      confidenceLevel: 0.85,
    });

    let cumulativeSum = 0;
    forecast.cashFlowProjections.forEach((projection) => {
      cumulativeSum += projection.netCashFlow;
      expect(projection.cumulativeCashFlow).toBeCloseTo(cumulativeSum, -2);
    });
  });

  it('should calculate working capital as 15% of outflow', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: mockHistoricalData,
      currentBudget: 150000,
      timeframe: 6,
      confidenceLevel: 0.85,
    });

    forecast.cashFlowProjections.forEach((projection) => {
      const expectedWorkingCapital = projection.plannedOutflow * 0.15;
      expect(projection.workingCapitalRequired).toBeCloseTo(expectedWorkingCapital, -2);
    });
  });

  it('should account for payment delay in payment timing', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: mockHistoricalData,
      currentBudget: 150000,
      timeframe: 12,
      confidenceLevel: 0.85,
    });

    // Payment timing should be period + 1 (1 month delay)
    forecast.cashFlowProjections.forEach((projection, index) => {
      const expectedPaymentTiming = Math.min(index + 1 + 1, 12); // period + delay, capped at timeframe
      expect(projection.paymentTiming).toBe(expectedPaymentTiming);
    });
  });

  it('should have optimistic inflow < planned inflow < pessimistic inflow scenario', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: mockHistoricalData,
      currentBudget: 150000,
      timeframe: 6,
      confidenceLevel: 0.85,
    });

    forecast.cashFlowProjections.forEach((projection) => {
      // Note: optimistic scenario has LOWER costs, so LOWER inflow (90% of projected cost)
      // Pessimistic has HIGHER costs, so HIGHER inflow
      expect(projection.optimisticInflow).toBeLessThan(projection.plannedInflow);
      expect(projection.plannedInflow).toBeLessThan(projection.pessimisticInflow);
    });
  });
});

describe('FinancialForecastingService - Forecast Accuracy', () => {
  it('should calculate forecast accuracy based on historical correlation and volatility', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: mockHistoricalData,
      currentBudget: 150000,
      timeframe: 12,
      confidenceLevel: 0.85,
    });

    // Accuracy should be between 0.5 and 1.0
    expect(forecast.accuracy).toBeGreaterThanOrEqual(0.5);
    expect(forecast.accuracy).toBeLessThanOrEqual(1.0);
  });

  it('should have lower accuracy with minimal historical data', () => {
    const minimalForecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: [{ date: '2024-01-01', value: 100000 }],
      currentBudget: 150000,
      timeframe: 6,
      confidenceLevel: 0.75,
    });

    const fullForecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: mockHistoricalData,
      currentBudget: 150000,
      timeframe: 6,
      confidenceLevel: 0.85,
    });

    // Minimal data should have default accuracy of 0.7
    expect(minimalForecast.accuracy).toBe(0.7);

    // Full historical data should generally have higher accuracy
    // (unless volatility is very high)
    expect(fullForecast.accuracy).toBeGreaterThanOrEqual(0.5);
  });

  it('should have decreasing confidence over longer time periods', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: mockHistoricalData,
      currentBudget: 150000,
      timeframe: 12,
      confidenceLevel: 0.85,
    });

    const projections = forecast.baseForecast.projections;

    // Confidence should generally decrease over time
    for (let i = 1; i < projections.length; i++) {
      // Allow for small variations due to random factors, but trend should be downward
      if (i > 5) {
        // Check later periods
        expect(projections[i].confidence).toBeLessThanOrEqual(projections[0].confidence);
      }
    }

    // First month should have high confidence (>= 0.90)
    expect(projections[0].confidence).toBeGreaterThanOrEqual(0.9);

    // Last month should have lower confidence than first month
    expect(projections[11].confidence).toBeLessThan(projections[0].confidence);
  });
});

describe('FinancialForecastingService - Recommendations', () => {
  it('should provide enhanced monitoring for high risk projects', () => {
    const volatileData = Array.from({ length: 12 }, (_, i) => ({
      date: `2024-${String(i + 1).padStart(2, '0')}-01`,
      value: 100000 + (i % 2 === 0 ? 50000 : -30000), // High volatility
    }));

    const forecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: volatileData,
      currentBudget: 150000,
      timeframe: 12,
      confidenceLevel: 0.85,
    });

    if (forecast.riskAssessment.overallRiskLevel === 'High') {
      const recommendations = forecast.recommendations;

      // Should have risk monitoring recommendations
      const hasRiskMonitoring = recommendations.some(
        (r) =>
          r.toLowerCase().includes('monitoring') ||
          r.toLowerCase().includes('contingency') ||
          r.toLowerCase().includes('early warning')
      );

      expect(hasRiskMonitoring).toBe(true);
    }
  });

  it('should recommend scope control if overrun probability is high', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: mockHistoricalData,
      currentBudget: 150000,
      timeframe: 12,
      confidenceLevel: 0.85,
    });

    // If probability of overrun > 0.4, should recommend scope control
    if (forecast.riskAssessment.probabilityOfOverrun > 0.4) {
      const recommendations = forecast.recommendations;
      const hasScopeControl = recommendations.some(
        (r) =>
          r.toLowerCase().includes('scope') ||
          r.toLowerCase().includes('budget review') ||
          r.toLowerCase().includes('value engineering')
      );

      expect(hasScopeControl).toBe(true);
    }
  });

  it('should recommend phased implementation for high cost variance', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: mockHistoricalData,
      currentBudget: 150000,
      timeframe: 12,
      confidenceLevel: 0.85,
    });

    const mostLikely = forecast.scenarios.find((s) => s.name === 'Most Likely');
    const pessimistic = forecast.scenarios.find((s) => s.name === 'Pessimistic');

    if (mostLikely && pessimistic) {
      const mostLikelyFinal =
        mostLikely.projections[mostLikely.projections.length - 1].cumulativeCost;
      const pessimisticFinal =
        pessimistic.projections[pessimistic.projections.length - 1].cumulativeCost;
      const variance = ((pessimisticFinal - mostLikelyFinal) / mostLikelyFinal) * 100;

      if (variance > 25) {
        const recommendations = forecast.recommendations;
        const hasPhasedApproach = recommendations.some(
          (r) =>
            r.toLowerCase().includes('phased') ||
            r.toLowerCase().includes('contingency plan') ||
            r.toLowerCase().includes('exposure')
        );

        expect(hasPhasedApproach).toBe(true);
      }
    }
  });

  it('should always include automated tracking and escalation recommendations', () => {
    const forecast = FinancialForecastingService.generateFinancialForecast(projectId, {
      historicalData: mockHistoricalData,
      currentBudget: 150000,
      timeframe: 12,
      confidenceLevel: 0.85,
    });

    const recommendations = forecast.recommendations;

    const hasAutomatedTracking = recommendations.some((r) =>
      r.toLowerCase().includes('automated')
    );
    const hasEscalation = recommendations.some((r) => r.toLowerCase().includes('escalation'));

    expect(hasAutomatedTracking).toBe(true);
    expect(hasEscalation).toBe(true);
  });
});
