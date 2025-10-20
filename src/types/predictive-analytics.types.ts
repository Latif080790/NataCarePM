/**
 * Predictive Analytics Type Definitions
 * NataCarePM - Phase 4.2: AI & Analytics
 * 
 * Comprehensive types for cost forecasting, schedule prediction,
 * risk analysis, and quality prediction using ML models
 */

// ============================================================================
// Forecast Types
// ============================================================================

export type ForecastType = 
  | 'cost'
  | 'schedule'
  | 'risk'
  | 'quality'
  | 'resource_demand'
  | 'material_price';

export type ForecastMethod = 
  | 'time_series'
  | 'regression'
  | 'neural_network'
  | 'ensemble'
  | 'exponential_smoothing'
  | 'arima';

export type TimeGranularity = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface ForecastConfig {
  forecastId: string;
  projectId: string;
  forecastType: ForecastType;
  method: ForecastMethod;
  timeGranularity: TimeGranularity;
  forecastHorizon: number; // Number of periods to forecast
  confidenceLevel: number; // 0.90, 0.95, 0.99
  includeSeasonality: boolean;
  includeTrends: boolean;
  includeExternalFactors: boolean;
  createdAt: Date;
  createdBy: string;
}

// ============================================================================
// Cost Forecasting Types
// ============================================================================

export interface CostForecast {
  forecastId: string;
  projectId: string;
  projectName: string;
  forecastDate: Date;
  forecastHorizon: number; // days
  predictions: CostPrediction[];
  totalForecastCost: number;
  currentCost: number;
  projectedOverrun: number;
  projectedOverrunPercentage: number;
  confidenceScore: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  contributors: CostContributor[];
  assumptions: string[];
  warnings: ForecastWarning[];
  generatedAt: Date;
  expiresAt: Date;
}

export interface CostPrediction {
  date: Date;
  predictedCost: number;
  cumulativeCost: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    confidence: number; // 0.90, 0.95, 0.99
  };
  variance: number;
  contributors: {
    labor: number;
    materials: number;
    equipment: number;
    overhead: number;
    contingency: number;
  };
}

export interface CostContributor {
  category: 'labor' | 'materials' | 'equipment' | 'overhead' | 'other';
  item: string;
  currentCost: number;
  forecastCost: number;
  variance: number;
  variancePercentage: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  impactScore: number; // 0-100
  recommendations: string[];
}

// ============================================================================
// Schedule Prediction Types
// ============================================================================

export interface ScheduleForecast {
  forecastId: string;
  projectId: string;
  projectName: string;
  forecastDate: Date;
  predictions: SchedulePrediction[];
  currentProgress: number; // 0-100
  predictedCompletionDate: Date;
  baselineCompletionDate: Date;
  delayDays: number;
  onTimeProbability: number; // 0-1
  confidenceScore: number; // 0-1
  criticalPath: string[]; // Task IDs
  delayFactors: DelayFactor[];
  milestones: MilestonePrediction[];
  warnings: ForecastWarning[];
  generatedAt: Date;
}

export interface SchedulePrediction {
  date: Date;
  predictedProgress: number; // 0-100
  plannedProgress: number; // 0-100
  variance: number; // percentage points
  confidenceInterval: {
    lower: number;
    upper: number;
    confidence: number;
  };
  velocityTrend: 'accelerating' | 'steady' | 'decelerating';
  estimatedTasksCompleted: number;
  estimatedTasksRemaining: number;
}

export interface DelayFactor {
  factorId: string;
  category: 'weather' | 'resources' | 'materials' | 'dependencies' | 'changes' | 'other';
  description: string;
  impactDays: number;
  probability: number; // 0-1
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
  status: 'identified' | 'monitoring' | 'mitigated' | 'occurred';
}

export interface MilestonePrediction {
  milestoneId: string;
  milestoneName: string;
  plannedDate: Date;
  predictedDate: Date;
  delayDays: number;
  completionProbability: number; // 0-1
  dependencies: string[]; // Task IDs
  risks: string[];
  status: 'on_track' | 'at_risk' | 'delayed' | 'completed';
}

// ============================================================================
// Risk Prediction Types
// ============================================================================

export interface RiskForecast {
  forecastId: string;
  projectId: string;
  projectName: string;
  forecastDate: Date;
  overallRiskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskTrend: 'improving' | 'stable' | 'deteriorating';
  predictedRisks: PredictedRisk[];
  emergingRisks: EmergingRisk[];
  riskCategories: RiskCategoryScore[];
  mitigationEffectiveness: number; // 0-100
  recommendations: RiskRecommendation[];
  warnings: ForecastWarning[];
  generatedAt: Date;
}

export interface PredictedRisk {
  riskId: string;
  category: 'cost' | 'schedule' | 'quality' | 'safety' | 'technical' | 'external';
  description: string;
  probability: number; // 0-1
  impact: number; // 0-100
  riskScore: number; // probability * impact
  severity: 'low' | 'medium' | 'high' | 'critical';
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  predictedOccurrenceDate?: Date;
  triggerIndicators: string[];
  potentialImpact: {
    costImpact?: number;
    scheduleImpact?: number; // days
    qualityImpact?: number; // 0-100
    safetyImpact?: number; // 0-100
  };
  mitigationStrategies: string[];
  confidenceScore: number; // 0-1
}

export interface EmergingRisk {
  riskId: string;
  description: string;
  earlyWarningSignals: string[];
  detectionDate: Date;
  currentProbability: number; // 0-1
  projectedProbability: number; // 0-1
  timeToMaterialize: number; // days
  preventionActions: string[];
  monitoringMetrics: string[];
}

export interface RiskCategoryScore {
  category: string;
  currentScore: number; // 0-100
  forecastScore: number; // 0-100
  trend: 'improving' | 'stable' | 'deteriorating';
  topRisks: string[]; // Risk IDs
  contributionPercentage: number; // 0-100
}

export interface RiskRecommendation {
  recommendationId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action: string;
  rationale: string;
  expectedBenefit: string;
  implementationCost?: number;
  implementationTime?: number; // days
  affectedRisks: string[]; // Risk IDs
  deadline?: Date;
}

// ============================================================================
// Quality Prediction Types
// ============================================================================

export interface QualityForecast {
  forecastId: string;
  projectId: string;
  projectName: string;
  forecastDate: Date;
  overallQualityScore: number; // 0-100
  qualityTrend: 'improving' | 'stable' | 'declining';
  predictions: QualityPrediction[];
  defectForecast: DefectForecast;
  inspectionResults: InspectionForecast;
  qualityMetrics: QualityMetric[];
  improvementOpportunities: ImprovementOpportunity[];
  warnings: ForecastWarning[];
  generatedAt: Date;
}

export interface QualityPrediction {
  date: Date;
  predictedQualityScore: number; // 0-100
  targetQualityScore: number; // 0-100
  variance: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    confidence: number;
  };
  contributingFactors: {
    workmanship: number; // 0-100
    materials: number; // 0-100
    equipment: number; // 0-100
    processes: number; // 0-100
    supervision: number; // 0-100
  };
}

export interface DefectForecast {
  predictedDefectCount: number;
  defectRate: number; // defects per unit
  defectTrend: 'increasing' | 'decreasing' | 'stable';
  defectsByCategory: {
    category: string;
    predictedCount: number;
    severity: 'minor' | 'moderate' | 'major' | 'critical';
    reworkCost: number;
    reworkTime: number; // hours
  }[];
  preventionRecommendations: string[];
}

export interface InspectionForecast {
  upcomingInspections: {
    inspectionType: string;
    scheduledDate: Date;
    predictedPassRate: number; // 0-100
    anticipatedIssues: string[];
    preparationRecommendations: string[];
  }[];
  inspectionTrend: {
    passRate: number; // 0-100
    trend: 'improving' | 'stable' | 'declining';
    complianceScore: number; // 0-100
  };
}

export interface QualityMetric {
  metricName: string;
  currentValue: number;
  forecastValue: number;
  targetValue: number;
  unit: string;
  status: 'on_target' | 'at_risk' | 'off_target';
  trend: 'improving' | 'stable' | 'declining';
  actionRequired: boolean;
}

export interface ImprovementOpportunity {
  opportunityId: string;
  area: string;
  description: string;
  currentPerformance: number; // 0-100
  potentialPerformance: number; // 0-100
  improvementGain: number; // percentage points
  implementationCost?: number;
  implementationTime?: number; // days
  priority: 'low' | 'medium' | 'high';
  recommendations: string[];
}

// ============================================================================
// Time Series Analysis Types
// ============================================================================

export interface TimeSeriesData {
  dataId: string;
  projectId: string;
  metric: string;
  dataPoints: TimeSeriesPoint[];
  frequency: TimeGranularity;
  startDate: Date;
  endDate: Date;
  statistics: TimeSeriesStatistics;
  patterns: TimeSeriesPattern[];
}

export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  actual?: number; // For comparison with predictions
  anomaly: boolean;
  factors?: Record<string, any>;
}

export interface TimeSeriesStatistics {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: boolean;
  autocorrelation: number;
  stationarity: boolean;
}

export interface TimeSeriesPattern {
  patternType: 'trend' | 'seasonality' | 'cycle' | 'anomaly';
  description: string;
  startDate: Date;
  endDate?: Date;
  strength: number; // 0-1
  confidence: number; // 0-1
}

// ============================================================================
// Model Performance Types
// ============================================================================

export interface ForecastAccuracy {
  modelId: string;
  forecastType: ForecastType;
  method: ForecastMethod;
  metrics: {
    mae: number; // Mean Absolute Error
    rmse: number; // Root Mean Squared Error
    mape: number; // Mean Absolute Percentage Error
    r2Score: number; // R-squared
    accuracy: number; // 0-1
  };
  backtestResults: BacktestResult[];
  lastUpdated: Date;
}

export interface BacktestResult {
  testId: string;
  testDate: Date;
  forecastHorizon: number;
  actualValues: number[];
  predictedValues: number[];
  errors: number[];
  accuracy: number; // 0-1
  confidenceCalibration: number; // How well confidence intervals match actual variance
}

// ============================================================================
// Warning and Alert Types
// ============================================================================

export interface ForecastWarning {
  warningId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'accuracy' | 'data_quality' | 'threshold' | 'trend' | 'anomaly';
  message: string;
  description: string;
  affectedMetrics: string[];
  recommendedAction: string;
  detectedAt: Date;
  acknowledged: boolean;
}

// ============================================================================
// External Factors Types
// ============================================================================

export interface ExternalFactor {
  factorId: string;
  name: string;
  category: 'economic' | 'weather' | 'market' | 'regulatory' | 'seasonal';
  currentValue: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  impact: 'low' | 'medium' | 'high';
  correlation: number; // -1 to 1
  source: string;
  lastUpdated: Date;
}

export interface WeatherForecast {
  forecastId: string;
  location: string;
  forecastDate: Date;
  predictions: WeatherPrediction[];
  workableeDays: number;
  weatherRiskScore: number; // 0-100
  impactOnSchedule: number; // days
  recommendations: string[];
}

export interface WeatherPrediction {
  date: Date;
  condition: 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'extreme';
  temperature: { min: number; max: number };
  precipitation: number; // mm or inches
  windSpeed: number;
  workable: boolean;
  safetyRating: 'safe' | 'caution' | 'unsafe';
}

// ============================================================================
// Scenario Analysis Types
// ============================================================================

export interface ScenarioAnalysis {
  analysisId: string;
  projectId: string;
  baselineScenario: Scenario;
  alternativeScenarios: Scenario[];
  comparison: ScenarioComparison;
  recommendations: string[];
  createdAt: Date;
}

export interface Scenario {
  scenarioId: string;
  name: string;
  description: string;
  assumptions: string[];
  forecasts: {
    cost?: CostForecast;
    schedule?: ScheduleForecast;
    risk?: RiskForecast;
    quality?: QualityForecast;
  };
  probability: number; // 0-1
  outcomes: {
    totalCost: number;
    completionDate: Date;
    overallRisk: number; // 0-100
    qualityScore: number; // 0-100
  };
}

export interface ScenarioComparison {
  metrics: {
    metricName: string;
    baseline: number;
    scenarios: { scenarioId: string; value: number; variance: number }[];
  }[];
  bestCase: string; // Scenario ID
  worstCase: string; // Scenario ID
  mostLikely: string; // Scenario ID
  sensitivityAnalysis: {
    factor: string;
    impact: number; // How much this factor affects outcomes
  }[];
}

// ============================================================================
// Predictive Analytics State
// ============================================================================

export interface PredictiveAnalyticsState {
  costForecasts: CostForecast[];
  scheduleForecasts: ScheduleForecast[];
  riskForecasts: RiskForecast[];
  qualityForecasts: QualityForecast[];
  timeSeriesData: TimeSeriesData[];
  forecastAccuracy: ForecastAccuracy[];
  externalFactors: ExternalFactor[];
  scenarioAnalyses: ScenarioAnalysis[];
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface GenerateForecastRequest {
  projectId: string;
  forecastTypes: ForecastType[];
  config: Partial<ForecastConfig>;
  includeScenarios?: boolean;
  includeExternalFactors?: boolean;
}

export interface GenerateForecastResponse {
  forecasts: {
    cost?: CostForecast;
    schedule?: ScheduleForecast;
    risk?: RiskForecast;
    quality?: QualityForecast;
  };
  scenarios?: ScenarioAnalysis;
  accuracy: ForecastAccuracy[];
  warnings: ForecastWarning[];
  generatedAt: Date;
  computationTimeMs: number;
}

export interface UpdateForecastRequest {
  forecastId: string;
  actualData: {
    date: Date;
    actualValue: number;
    metric: string;
  }[];
}

export interface ForecastComparisonRequest {
  forecastIds: string[];
  comparisonMetrics: string[];
}

export interface ForecastComparisonResponse {
  forecasts: (CostForecast | ScheduleForecast | RiskForecast | QualityForecast)[];
  comparison: {
    metric: string;
    values: { forecastId: string; value: number; accuracy?: number }[];
  }[];
  bestPerforming: string; // Forecast ID
  recommendations: string[];
}
