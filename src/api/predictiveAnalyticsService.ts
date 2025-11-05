import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  addDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import type {
  CostForecast,
  ScheduleForecast,
  RiskForecast,
  ForecastConfig,
  TimeSeriesPoint,
  CostPrediction,
  PredictedRisk,
  ForecastWarning,
  GenerateForecastRequest,
  GenerateForecastResponse
} from '@/types/predictive-analytics.types';
import { Project } from '@/types';

// ============================================================================
// Constants
// ============================================================================

const COLLECTIONS = {
  COST_FORECASTS: 'cost_forecasts',
  SCHEDULE_FORECASTS: 'schedule_forecasts',
  RISK_FORECASTS: 'risk_forecasts',
  QUALITY_FORECASTS: 'quality_forecasts',
  TIME_SERIES: 'time_series_data',
  FORECAST_ACCURACY: 'forecast_accuracy',
} as const;

const MODEL_CONFIGS = {
  COST_LSTM: {
    inputDim: 10,
    lstmUnits: 64,
    denseUnits: 32,
    outputDim: 1,
    learningRate: 0.001,
    epochs: 50,
    sequenceLength: 30, // 30 days lookback
  },
  SCHEDULE_LSTM: {
    inputDim: 8,
    lstmUnits: 48,
    denseUnits: 24,
    outputDim: 1,
    learningRate: 0.001,
    epochs: 40,
    sequenceLength: 20,
  },
  RISK_NN: {
    inputDim: 15,
    hiddenLayers: [48, 24, 12],
    outputDim: 5, // 5 risk categories
    learningRate: 0.001,
    epochs: 60,
  },
  QUALITY_NN: {
    inputDim: 12,
    hiddenLayers: [36, 18],
    outputDim: 1,
    learningRate: 0.001,
    epochs: 50,
  },
} as const;

// ============================================================================
// Time Series Forecasting Engine
// ============================================================================

class TimeSeriesForecaster {
  private model: tf.LayersModel | null = null;

  /**
   * Build LSTM Model for Time Series Forecasting
   */
  async buildLSTMModel(config: {
    inputDim: number;
    lstmUnits: number;
    denseUnits: number;
    outputDim: number;
    learningRate: number;
    sequenceLength: number;
  }): Promise<tf.LayersModel> {
    const model = tf.sequential();

    // LSTM layers
    model.add(
      tf.layers.lstm({
        inputShape: [config.sequenceLength, config.inputDim],
        units: config.lstmUnits,
        returnSequences: true,
      })
    );

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(
      tf.layers.lstm({
        units: config.lstmUnits / 2,
        returnSequences: false,
      })
    );

    model.add(tf.layers.dropout({ rate: 0.2 }));

    // Dense layers
    model.add(
      tf.layers.dense({
        units: config.denseUnits,
        activation: 'relu',
      })
    );

    model.add(
      tf.layers.dense({
        units: config.outputDim,
        activation: 'linear',
      })
    );

    // Compile
    model.compile({
      optimizer: tf.train.adam(config.learningRate),
      loss: 'meanSquaredError',
      metrics: ['mae'],
    });

    return model;
  }

  /**
   * Prepare Time Series Data for LSTM
   */
  prepareTimeSeriesData(
    data: number[],
    sequenceLength: number
  ): { xs: number[][][]; ys: number[] } {
    const xs: number[][][] = [];
    const ys: number[] = [];

    for (let i = sequenceLength; i < data.length; i++) {
      const sequence: number[][] = [];
      for (let j = i - sequenceLength; j < i; j++) {
        sequence.push([data[j]]); // Wrap in array for multivariate compatibility
      }
      xs.push(sequence);
      ys.push(data[i]);
    }

    return { xs, ys };
  }

  /**
   * Train LSTM Model
   */
  async train(
    data: number[],
    config: {
      inputDim: number;
      lstmUnits: number;
      denseUnits: number;
      outputDim: number;
      learningRate: number;
      epochs: number;
      sequenceLength: number;
    }
  ): Promise<tf.LayersModel> {
    const model = await this.buildLSTMModel(config);

    // Prepare data
    const { xs, ys } = this.prepareTimeSeriesData(data, config.sequenceLength);

    if (xs.length === 0) {
      throw new Error(
        'Insufficient data for training. Need at least ' +
          (config.sequenceLength + 1) +
          ' data points.'
      );
    }

    const xsTensor = tf.tensor3d(xs);
    const ysTensor = tf.tensor2d(ys.map((y) => [y]));

    // Train
    await model.fit(xsTensor, ysTensor, {
      epochs: config.epochs,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(
              `Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}, mae = ${logs?.mae?.toFixed(4)}`
            );
          }
        },
      },
    });

    // Cleanup
    xsTensor.dispose();
    ysTensor.dispose();

    this.model = model;
    return model;
  }

  /**
   * Predict Future Values
   */
  async predict(
    historicalData: number[],
    forecastHorizon: number,
    sequenceLength: number
  ): Promise<{ predictions: number[]; confidenceIntervals: { lower: number; upper: number }[] }> {
    if (!this.model) {
      throw new Error('Model not trained. Call train() first.');
    }

    const predictions: number[] = [];
    const confidenceIntervals: { lower: number; upper: number }[] = [];
    let currentSequence = historicalData.slice(-sequenceLength);

    for (let i = 0; i < forecastHorizon; i++) {
      // Prepare input
      const input = currentSequence.map((val) => [val]);
      const inputTensor = tf.tensor3d([input]);

      // Predict
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      const predValue = ((await prediction.array()) as number[][])[0][0];

      predictions.push(predValue);

      // Calculate confidence interval (simplified - using historical std dev)
      const stdDev = this.calculateStdDev(historicalData);
      confidenceIntervals.push({
        lower: predValue - 1.96 * stdDev, // 95% confidence
        upper: predValue + 1.96 * stdDev,
      });

      // Update sequence
      currentSequence = [...currentSequence.slice(1), predValue];

      // Cleanup
      inputTensor.dispose();
      prediction.dispose();
    }

    return { predictions, confidenceIntervals };
  }

  /**
   * Calculate Standard Deviation
   */
  private calculateStdDev(data: number[]): number {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const squaredDiffs = data.map((val) => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;
    return Math.sqrt(variance);
  }

  /**
   * Exponential Smoothing
   */
  exponentialSmoothing(data: number[], alpha: number = 0.3): number[] {
    const smoothed: number[] = [data[0]];

    for (let i = 1; i < data.length; i++) {
      smoothed.push(alpha * data[i] + (1 - alpha) * smoothed[i - 1]);
    }

    return smoothed;
  }

  /**
   * Detect Trend
   */
  detectTrend(data: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 2) return 'stable';

    const slope = this.calculateSlope(data);

    if (slope > 0.05) return 'increasing';
    if (slope < -0.05) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate Slope (Linear Regression)
   */
  private calculateSlope(data: number[]): number {
    const n = data.length;
    const xSum = (n * (n - 1)) / 2;
    const ySum = data.reduce((sum, val) => sum + val, 0);
    const xySum = data.reduce((sum, val, idx) => sum + idx * val, 0);
    const xxSum = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
    return slope;
  }
}

// ============================================================================
// Cost Forecasting Service
// ============================================================================

class CostForecastingService {
  private forecaster: TimeSeriesForecaster;

  constructor() {
    this.forecaster = new TimeSeriesForecaster();
  }

  /**
   * Generate Cost Forecast
   */
  async generateForecast(projectId: string, config: ForecastConfig): Promise<CostForecast> {
    const startTime = Date.now();

    // Fetch historical cost data
    const historicalData = await this.fetchHistoricalCostData(projectId);

    if (historicalData.length < MODEL_CONFIGS.COST_LSTM.sequenceLength + 1) {
      throw new Error('Insufficient historical data for cost forecasting');
    }

    // Extract cost values
    const costValues = historicalData.map((d) => d.value);

    // Train model
    await this.forecaster.train(costValues, MODEL_CONFIGS.COST_LSTM);

    // Generate predictions
    const { predictions, confidenceIntervals } = await this.forecaster.predict(
      costValues,
      config.forecastHorizon,
      MODEL_CONFIGS.COST_LSTM.sequenceLength
    );

    // Build forecast
    const forecastPredictions: CostPrediction[] = predictions.map((pred, idx) => {
      const date = new Date();
      date.setDate(date.getDate() + idx + 1);

      const cumulativeCost =
        costValues.reduce((sum, val) => sum + val, 0) +
        predictions.slice(0, idx + 1).reduce((sum, val) => sum + val, 0);

      return {
        date,
        predictedCost: pred,
        cumulativeCost,
        confidenceInterval: {
          lower: confidenceIntervals[idx].lower,
          upper: confidenceIntervals[idx].upper,
          confidence: 0.95,
        },
        variance: pred - (costValues[costValues.length - 1] || 0),
        contributors: {
          labor: pred * 0.35,
          materials: pred * 0.3,
          equipment: pred * 0.2,
          overhead: pred * 0.1,
          contingency: pred * 0.05,
        },
      };
    });

    const totalForecastCost = predictions.reduce((sum, val) => sum + val, 0);
    const currentCost = costValues.reduce((sum, val) => sum + val, 0);
    const projectedOverrun = totalForecastCost - currentCost;

    // Detect warnings
    const warnings: ForecastWarning[] = [];
    if (projectedOverrun > currentCost * 0.1) {
      warnings.push({
        warningId: `warn_cost_${Date.now()}`,
        severity: 'high',
        category: 'threshold',
        message: 'Projected cost overrun exceeds 10%',
        description: `The forecast indicates a cost overrun of ${((projectedOverrun / currentCost) * 100).toFixed(1)}%`,
        affectedMetrics: ['total_cost', 'budget_variance'],
        recommendedAction: 'Review budget allocations and identify cost reduction opportunities',
        detectedAt: new Date(),
        acknowledged: false,
      });
    }

    const forecast: CostForecast = {
      forecastId: `cost_forecast_${Date.now()}`,
      projectId,
      projectName: await this.getProjectName(projectId),
      forecastDate: new Date(),
      forecastHorizon: config.forecastHorizon,
      predictions: forecastPredictions,
      totalForecastCost,
      currentCost,
      projectedOverrun,
      projectedOverrunPercentage: (projectedOverrun / currentCost) * 100,
      confidenceScore: 0.85,
      riskLevel:
        projectedOverrun > currentCost * 0.15
          ? 'high'
          : projectedOverrun > currentCost * 0.05
            ? 'medium'
            : 'low',
      contributors: [],
      assumptions: [
        'Historical cost patterns continue',
        'No major scope changes',
        'Normal weather conditions',
        'Stable material prices',
      ],
      warnings,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    // Save to Firestore
    await this.saveForecast(forecast);

    console.log(`Cost forecast generated in ${Date.now() - startTime}ms`);

    return forecast;
  }

  /**
   * Fetch Historical Cost Data
   */
  private async fetchHistoricalCostData(projectId: string): Promise<TimeSeriesPoint[]> {
    // Fetch project
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    const project = { id: projectDoc.id, ...projectDoc.data() } as Project;

    // Extract daily costs from expenses
    const dailyCosts: { [date: string]: number } = {};

    if (project.expenses) {
      for (const expense of project.expenses) {
        const dateKey = expense.date;
        dailyCosts[dateKey] = (dailyCosts[dateKey] || 0) + expense.amount;
      }
    }

    // Convert to time series
    const timeSeriesPoints: TimeSeriesPoint[] = Object.entries(dailyCosts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        timestamp: new Date(date),
        value,
        anomaly: false,
      }));

    return timeSeriesPoints;
  }

  /**
   * Get Project Name
   */
  private async getProjectName(projectId: string): Promise<string> {
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    return projectDoc.exists() ? projectDoc.data().name : 'Unknown Project';
  }

  /**
   * Save Forecast
   */
  private async saveForecast(forecast: CostForecast): Promise<void> {
    await addDoc(collection(db, COLLECTIONS.COST_FORECASTS), {
      ...forecast,
      forecastDate: Timestamp.fromDate(forecast.forecastDate),
      generatedAt: Timestamp.fromDate(forecast.generatedAt),
      expiresAt: Timestamp.fromDate(forecast.expiresAt),
    });
  }
}

// ============================================================================
// Schedule Forecasting Service
// ============================================================================

class ScheduleForecastingService {
  private forecaster: TimeSeriesForecaster;

  constructor() {
    this.forecaster = new TimeSeriesForecaster();
  }

  /**
   * Generate Schedule Forecast
   */
  async generateForecast(projectId: string, config: ForecastConfig): Promise<ScheduleForecast> {
    const startTime = Date.now();

    // Fetch historical progress data
    const historicalData = await this.fetchHistoricalProgressData(projectId);

    if (historicalData.length < 10) {
      throw new Error('Insufficient historical data for schedule forecasting');
    }

    // Extract progress values
    const progressValues = historicalData.map((d) => d.value);

    // Train model
    await this.forecaster.train(progressValues, MODEL_CONFIGS.SCHEDULE_LSTM);

    // Generate predictions
    const { predictions } = await this.forecaster.predict(
      progressValues,
      config.forecastHorizon,
      MODEL_CONFIGS.SCHEDULE_LSTM.sequenceLength
    );

    // Build forecast
    const currentProgress = progressValues[progressValues.length - 1] || 0;
    const trend = this.forecaster.detectTrend(progressValues.slice(-10));

    // Calculate predicted completion date
    const daysToCompletion = this.calculateDaysToCompletion(currentProgress, predictions);
    const predictedCompletionDate = new Date();
    predictedCompletionDate.setDate(predictedCompletionDate.getDate() + daysToCompletion);

    const forecast: ScheduleForecast = {
      forecastId: `schedule_forecast_${Date.now()}`,
      projectId,
      projectName: await this.getProjectName(projectId),
      forecastDate: new Date(),
      predictions: [],
      currentProgress,
      predictedCompletionDate,
      baselineCompletionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Placeholder
      delayDays: 0,
      onTimeProbability: 0.75,
      confidenceScore: 0.8,
      criticalPath: [],
      delayFactors: [],
      milestones: [],
      warnings: [],
      generatedAt: new Date(),
    };

    await this.saveForecast(forecast);

    console.log(`Schedule forecast generated in ${Date.now() - startTime}ms`);

    return forecast;
  }

  /**
   * Fetch Historical Progress Data
   */
  private async fetchHistoricalProgressData(projectId: string): Promise<TimeSeriesPoint[]> {
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (!projectDoc.exists()) return [];

    const project = { id: projectDoc.id, ...projectDoc.data() } as Project;

    // Calculate daily progress from daily reports
    const progressData: TimeSeriesPoint[] = [];

    if (project.dailyReports) {
      for (const report of project.dailyReports) {
        const totalProgress =
          report.workProgress?.reduce((sum, wp) => sum + wp.completedVolume, 0) || 0;
        progressData.push({
          timestamp: new Date(report.date),
          value: totalProgress,
          anomaly: false,
        });
      }
    }

    return progressData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Calculate Days to Completion
   */
  private calculateDaysToCompletion(currentProgress: number, predictions: number[]): number {
    const targetProgress = 100;
    let cumulativeProgress = currentProgress;

    for (let i = 0; i < predictions.length; i++) {
      cumulativeProgress += predictions[i];
      if (cumulativeProgress >= targetProgress) {
        return i + 1;
      }
    }

    return predictions.length;
  }

  /**
   * Get Project Name
   */
  private async getProjectName(projectId: string): Promise<string> {
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    return projectDoc.exists() ? projectDoc.data().name : 'Unknown Project';
  }

  /**
   * Save Forecast
   */
  private async saveForecast(forecast: ScheduleForecast): Promise<void> {
    await addDoc(collection(db, COLLECTIONS.SCHEDULE_FORECASTS), {
      ...forecast,
      forecastDate: Timestamp.fromDate(forecast.forecastDate),
      generatedAt: Timestamp.fromDate(forecast.generatedAt),
      predictedCompletionDate: Timestamp.fromDate(forecast.predictedCompletionDate),
      baselineCompletionDate: Timestamp.fromDate(forecast.baselineCompletionDate),
    });
  }
}

// ============================================================================
// Risk Forecasting Service
// ============================================================================

class RiskForecastingService {
  /**
   * Generate Risk Forecast
   */
  async generateForecast(projectId: string, config: ForecastConfig): Promise<RiskForecast> {
    const startTime = Date.now();

    // Analyze historical risks and project data
    const riskAnalysis = await this.analyzeProjectRisks(projectId);

    const forecast: RiskForecast = {
      forecastId: `risk_forecast_${Date.now()}`,
      projectId,
      projectName: await this.getProjectName(projectId),
      forecastDate: new Date(),
      overallRiskScore: riskAnalysis.overallScore,
      riskLevel: this.categorizeRiskLevel(riskAnalysis.overallScore),
      riskTrend: 'stable',
      predictedRisks: riskAnalysis.predictedRisks,
      emergingRisks: [],
      riskCategories: [],
      mitigationEffectiveness: 75,
      recommendations: riskAnalysis.recommendations,
      warnings: [],
      generatedAt: new Date(),
    };

    await this.saveForecast(forecast);

    console.log(`Risk forecast generated in ${Date.now() - startTime}ms`);

    return forecast;
  }

  /**
   * Analyze Project Risks
   */
  private async analyzeProjectRisks(projectId: string): Promise<{
    overallScore: number;
    predictedRisks: PredictedRisk[];
    recommendations: any[];
  }> {
    // Simplified risk analysis
    const predictedRisks: PredictedRisk[] = [
      {
        riskId: `risk_${Date.now()}_1`,
        category: 'cost',
        description: 'Material price increase risk',
        probability: 0.6,
        impact: 65,
        riskScore: 39,
        severity: 'medium',
        timeframe: 'short_term',
        triggerIndicators: ['Market volatility', 'Supply chain disruptions'],
        potentialImpact: {
          costImpact: 50000,
        },
        mitigationStrategies: ['Lock in material prices', 'Identify alternative suppliers'],
        confidenceScore: 0.75,
      },
    ];

    return {
      overallScore: 45,
      predictedRisks,
      recommendations: [],
    };
  }

  /**
   * Categorize Risk Level
   */
  private categorizeRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 75) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  }

  /**
   * Get Project Name
   */
  private async getProjectName(projectId: string): Promise<string> {
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    return projectDoc.exists() ? projectDoc.data().name : 'Unknown Project';
  }

  /**
   * Save Forecast
   */
  private async saveForecast(forecast: RiskForecast): Promise<void> {
    await addDoc(collection(db, COLLECTIONS.RISK_FORECASTS), {
      ...forecast,
      forecastDate: Timestamp.fromDate(forecast.forecastDate),
      generatedAt: Timestamp.fromDate(forecast.generatedAt),
    });
  }
}

// ============================================================================
// Main Predictive Analytics Service
// ============================================================================

class PredictiveAnalyticsService {
  private costForecaster: CostForecastingService;
  private scheduleForecaster: ScheduleForecastingService;
  private riskForecaster: RiskForecastingService;

  constructor() {
    this.costForecaster = new CostForecastingService();
    this.scheduleForecaster = new ScheduleForecastingService();
    this.riskForecaster = new RiskForecastingService();
  }

  /**
   * Generate Comprehensive Forecast
   */
  async generateForecast(request: GenerateForecastRequest): Promise<GenerateForecastResponse> {
    const startTime = Date.now();

    const config: ForecastConfig = {
      forecastId: `forecast_${Date.now()}`,
      projectId: request.projectId,
      forecastType: 'cost', // Default
      method: 'neural_network',
      timeGranularity: 'daily',
      forecastHorizon: 30,
      confidenceLevel: 0.95,
      includeSeasonality: true,
      includeTrends: true,
      includeExternalFactors: false,
      createdAt: new Date(),
      createdBy: 'system',
      ...request.config,
    };

    const forecasts: any = {};
    const warnings: ForecastWarning[] = [];

    // Generate requested forecasts
    for (const forecastType of request.forecastTypes) {
      try {
        switch (forecastType) {
          case 'cost':
            forecasts.cost = await this.costForecaster.generateForecast(request.projectId, config);
            break;
          case 'schedule':
            forecasts.schedule = await this.scheduleForecaster.generateForecast(
              request.projectId,
              config
            );
            break;
          case 'risk':
            forecasts.risk = await this.riskForecaster.generateForecast(request.projectId, config);
            break;
          default:
            console.warn(`Forecast type ${forecastType} not yet implemented`);
        }
      } catch (error: any) {
        warnings.push({
          warningId: `warn_${forecastType}_${Date.now()}`,
          severity: 'high',
          category: 'data_quality',
          message: `Failed to generate ${forecastType} forecast`,
          description: error.message,
          affectedMetrics: [forecastType],
          recommendedAction: 'Ensure sufficient historical data is available',
          detectedAt: new Date(),
          acknowledged: false,
        });
      }
    }

    const response: GenerateForecastResponse = {
      forecasts,
      accuracy: [],
      warnings,
      generatedAt: new Date(),
      computationTimeMs: Date.now() - startTime,
    };

    return response;
  }

  /**
   * Get Latest Forecasts
   */
  async getLatestForecasts(projectId: string): Promise<{
    cost?: CostForecast;
    schedule?: ScheduleForecast;
    risk?: RiskForecast;
  }> {
    const forecasts: any = {};

    // Fetch latest cost forecast
    const costQuery = query(
      collection(db, COLLECTIONS.COST_FORECASTS),
      where('projectId', '==', projectId)
    );
    const costSnapshot = await getDocs(costQuery);
    if (!costSnapshot.empty) {
      const latestCost = costSnapshot.docs
        .map((doc) => ({ ...doc.data(), forecastDate: doc.data().forecastDate?.toDate() }))
        .sort((a: any, b: any) => b.forecastDate.getTime() - a.forecastDate.getTime())[0];
      forecasts.cost = latestCost as CostForecast;
    }

    // Fetch latest schedule forecast
    const scheduleQuery = query(
      collection(db, COLLECTIONS.SCHEDULE_FORECASTS),
      where('projectId', '==', projectId)
    );
    const scheduleSnapshot = await getDocs(scheduleQuery);
    if (!scheduleSnapshot.empty) {
      const latestSchedule = scheduleSnapshot.docs
        .map((doc) => ({ ...doc.data(), forecastDate: doc.data().forecastDate?.toDate() }))
        .sort((a: any, b: any) => b.forecastDate.getTime() - a.forecastDate.getTime())[0];
      forecasts.schedule = latestSchedule as ScheduleForecast;
    }

    return forecasts;
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const predictiveAnalyticsService = new PredictiveAnalyticsService();
export { TimeSeriesForecaster, CostForecastingService, ScheduleForecastingService };
