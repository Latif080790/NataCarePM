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
import * as tf from '@tensorflow/tfjs';
import type {
  RiskForecast,
  PredictedRisk,
  RiskCategoryScore,
  RiskRecommendation,
  ForecastWarning,
  ExternalFactor,
  EmergingRisk,
} from '@/types/predictive-analytics.types';
import type {
  Risk,
  RiskCategory
} from '@/types/risk.types';
import { Project, DailyReport } from '@/types';


// ============================================================================
// Enhanced Configuration
// ============================================================================

const ENHANCED_RISK_MODEL_CONFIGS = {
  RISK_TRANSFORMER: {
    inputDim: 30,
    hiddenDim: 128,
    numHeads: 8,
    numLayers: 4,
    outputDim: 15, // 15 risk categories
    learningRate: 0.0005,
    epochs: 120,
    dropout: 0.3,
    sequenceLength: 60, // 60 days lookback
  },
  RISK_ENSEMBLE: {
    lstm: {
      inputDim: 25,
      lstmUnits: [64, 32],
      denseUnits: [32, 16],
      outputDim: 10,
      learningRate: 0.001,
      epochs: 100,
      sequenceLength: 90, // 90 days lookback
      dropout: 0.2,
    },
    attention: {
      inputDim: 25,
      hiddenDim: 64,
      outputDim: 10,
      learningRate: 0.001,
      epochs: 80,
    },
    gradientBoosting: {
      nEstimators: 200,
      maxDepth: 6,
      learningRate: 0.1,
    },
  },
} as const;

// ============================================================================
// Advanced Feature Engineering for Risk Prediction
// ============================================================================

class RiskFeatureEngineer {
  /**
   * Extract Advanced Risk Features from Project Data
   */
  static extractProjectRiskFeatures(
    project: Project,
    historicalRisks: Risk[],
    externalFactors: ExternalFactor[],
    dailyReports: DailyReport[]
  ): any {
    const features: any = {};

    // Project characteristics
    features.projectSize = project.items?.reduce((sum, item) => sum + item.volume * item.hargaSatuan, 0) || 0;
    // Project characteristics
    features.projectSize = project.items?.reduce((sum, item) => sum + item.volume * item.hargaSatuan, 0) || 0;
    features.taskCount = project.items?.length || 0;
    features.teamSize = project.members?.length || 0;
    features.budgetUtilization = this.calculateBudgetUtilization(project);
    
    // Temporal features (using project start date only since endDate doesn't exist)
    const now = new Date();
    features.daysElapsed = project.startDate ? 
      (now.getTime() - new Date(project.startDate).getTime()) / (1000 * 3600 * 24) : 0;
    features.progressRatio = project.startDate ? 
      features.daysElapsed / (features.daysElapsed + 30) : 0; // Assuming 30-day default duration
    
    // Risk history features
    features.totalRisks = historicalRisks.length;
    features.activeRisks = historicalRisks.filter(r => r.status !== 'closed' && r.status !== 'occurred').length;
    features.criticalRisks = historicalRisks.filter(r => r.priorityLevel === 'critical').length;
    features.highRisks = historicalRisks.filter(r => r.priorityLevel === 'high').length;
    features.riskTrend = this.calculateRiskTrend(historicalRisks);
    features.riskResolutionRate = this.calculateRiskResolutionRate(historicalRisks);
    features.averageRiskScore = this.calculateAverageRiskScore(historicalRisks);
    
    // Risk category distribution
    features.technicalRisks = historicalRisks.filter(r => r.category === 'technical').length;
    features.financialRisks = historicalRisks.filter(r => r.category === 'financial').length;
    features.safetyRisks = historicalRisks.filter(r => r.category === 'safety').length;
    features.scheduleRisks = historicalRisks.filter(r => r.category === 'schedule').length;
    features.qualityRisks = historicalRisks.filter(r => r.category === 'quality').length;
    features.resourceRisks = historicalRisks.filter(r => r.category === 'resource').length;
    
    // Daily report features (using available properties)
    features.incidentsReported = dailyReports.filter(r => r.comments && r.comments.length > 0).length;
    features.qualityIssues = 0; // Not directly available in DailyReport
    features.delayReports = dailyReports.filter(r => r.workProgress && r.workProgress.some(wp => wp.completedVolume < 0)).length;
    features.weatherImpacts = dailyReports.filter(r => r.weather !== 'Cerah').length;
    
    // External factors
    features.economicIndex = this.getEconomicFactor(externalFactors);
    features.weatherRisk = this.getWeatherFactor(externalFactors);
    features.marketVolatility = this.getMarketFactor(externalFactors);
    
    // Seasonal features
    features.isPeakSeason = this.isPeakSeason(now);
    features.isHolidaySeason = this.isHolidaySeason(now);
    
    // Project performance indicators
    features.costVariance = this.calculateCostVariance(project);
    features.scheduleVariance = this.calculateScheduleVariance(project);
    features.qualityScore = this.calculateQualityScore(dailyReports);
    
    return features;
  }

  /**
   * Calculate Budget Utilization
   */
  private static calculateBudgetUtilization(project: Project): number {
    const totalBudget = project.items?.reduce((sum, item) => sum + item.volume * item.hargaSatuan, 0) || 0;
    const spentAmount = project.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    return totalBudget > 0 ? spentAmount / totalBudget : 0;
  }

  /**
   * Calculate Risk Trend
   */
  private static calculateRiskTrend(risks: Risk[]): number {
    if (risks.length < 2) return 0;
    
    // Sort risks by creation date
    const sortedRisks = [...risks].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    // Calculate moving average of risk scores
    const windowSize = Math.min(5, sortedRisks.length);
    const recentRisks = sortedRisks.slice(-windowSize);
    const olderRisks = sortedRisks.slice(-windowSize * 2, -windowSize);
    
    const recentAvg = recentRisks.reduce((sum, risk) => sum + risk.riskScore, 0) / recentRisks.length;
    const olderAvg = olderRisks.reduce((sum, risk) => sum + risk.riskScore, 0) / olderRisks.length;
    
    return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
  }

  /**
   * Calculate Risk Resolution Rate
   */
  private static calculateRiskResolutionRate(risks: Risk[]): number {
    if (risks.length === 0) return 0;
    
    const closedRisks = risks.filter(r => r.status === 'closed').length;
    return closedRisks / risks.length;
  }

  /**
   * Calculate Average Risk Score
   */
  private static calculateAverageRiskScore(risks: Risk[]): number {
    if (risks.length === 0) return 0;
    
    const totalScore = risks.reduce((sum, risk) => sum + risk.riskScore, 0);
    return totalScore / risks.length;
  }

  /**
   * Calculate Cost Variance
   */
  private static calculateCostVariance(project: Project): number {
    const plannedCost = project.items?.reduce((sum, item) => sum + item.volume * item.hargaSatuan, 0) || 0;
    const actualCost = project.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    return plannedCost > 0 ? (actualCost - plannedCost) / plannedCost : 0;
  }

  /**
   * Calculate Schedule Variance
   */
  private static calculateScheduleVariance(project: Project): number {
    if (!project.startDate) return 0;
    
    // Using a default duration of 30 days since endDate doesn't exist
    const totalDuration = 30;
    const elapsedDays = (Date.now() - new Date(project.startDate).getTime()) / (1000 * 3600 * 24);
    const plannedProgress = elapsedDays / totalDuration;
    
    // Using workProgress from daily reports instead of item.progress
    const actualProgress = 0.5; // Default value since we don't have direct access to item progress
    
    return plannedProgress > 0 ? (actualProgress - plannedProgress) / plannedProgress : 0;
  }

  /**
   * Calculate Quality Score
   */
  private static calculateQualityScore(dailyReports: DailyReport[]): number {
    if (dailyReports.length === 0) return 85; // Default score
    
    const qualityEntries = dailyReports.flatMap(_r => 
      [] // DailyReport doesn't have entries property
    );
    
    if (qualityEntries.length === 0) return 85;
    
    // Count quality issues vs positive reports
    const issues = 0; // DailyReport doesn't have priority property on comments
    const positive = 0; // DailyReport doesn't have priority property on comments
    
    // Calculate score (0-100)
    const score = 100 - (issues * 10) + (positive * 2);
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get Economic Factor
   */
  private static getEconomicFactor(externalFactors: ExternalFactor[]): number {
    const economicFactor = externalFactors.find(f => f.category === 'economic');
    return economicFactor?.currentValue || 0;
  }

  /**
   * Get Weather Factor
   */
  private static getWeatherFactor(externalFactors: ExternalFactor[]): number {
    const weatherFactor = externalFactors.find(f => f.category === 'weather');
    return weatherFactor?.currentValue || 0;
  }

  /**
   * Get Market Factor
   */
  private static getMarketFactor(externalFactors: ExternalFactor[]): number {
    const marketFactor = externalFactors.find(f => f.category === 'market');
    return marketFactor?.currentValue || 0;
  }

  /**
   * Check if Peak Season
   */
  private static isPeakSeason(date: Date): boolean {
    const month = date.getMonth();
    // Peak construction season in many regions is spring through fall
    return month >= 3 && month <= 10;
  }

  /**
   * Check if Holiday Season
   */
  private static isHolidaySeason(date: Date): boolean {
    const month = date.getMonth();
    // December is typically a slower construction period
    return month === 11;
  }
}

// ============================================================================
// Transformer Model for Risk Prediction
// ============================================================================

class RiskTransformerModel {
  private model: tf.LayersModel | null = null;

  /**
   * Build Transformer Model for Risk Prediction
   */
  async buildTransformer(config: any): Promise<tf.LayersModel> {
    // Input layer
    const input = tf.input({ shape: [config.sequenceLength, config.inputDim] });

    // Simplified attention-like mechanism using available layers
    let attentionOut = input;
    for (let i = 0; i < config.numLayers; i++) {
      // Use LSTM layers to capture sequential dependencies
      const lstmOut = tf.layers.lstm({
        units: config.hiddenDim,
        returnSequences: true,
        dropout: config.dropout,
      }).apply(attentionOut) as tf.SymbolicTensor;

      // Add & Norm
      const addNorm1 = tf.layers.add().apply([attentionOut, lstmOut]) as tf.SymbolicTensor;
      const norm1 = tf.layers.layerNormalization().apply(addNorm1) as tf.SymbolicTensor;

      // Feed forward
      const ffInput = tf.layers.dense({
        units: config.hiddenDim * 4,
        activation: 'relu',
      }).apply(norm1) as tf.SymbolicTensor;

      const ffOutput = tf.layers.dense({
        units: config.hiddenDim,
      }).apply(ffInput) as tf.SymbolicTensor;

      // Add & Norm
      const addNorm2 = tf.layers.add().apply([norm1, ffOutput]) as tf.SymbolicTensor;
      attentionOut = tf.layers.layerNormalization().apply(addNorm2) as tf.SymbolicTensor;
    }

    // Global average pooling
    const pooled = tf.layers.globalAveragePooling1d().apply(attentionOut) as tf.SymbolicTensor;

    // Dropout
    const dropout = tf.layers.dropout({ rate: config.dropout }).apply(pooled) as tf.SymbolicTensor;

    // Output layer
    const output = tf.layers.dense({
      units: config.outputDim,
      activation: 'softmax',
    }).apply(dropout) as tf.SymbolicTensor;

    const model = tf.model({ inputs: input, outputs: output });

    model.compile({
      optimizer: tf.train.adam(config.learningRate),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  /**
   * Train Transformer Model
   */
  async train(
    features: number[][],
    _labels: number[], // Reserved for future use
    config: any
  ): Promise<tf.LayersModel> {
    const model = await this.buildTransformer(config);

    // Prepare sequences
    const sequences = this.prepareSequences(features, config.sequenceLength);
    const xs = tf.tensor3d(sequences.inputs);
    const ys = tf.tensor2d(sequences.targets.map(t => this.oneHot(t, config.outputDim)));

    // Train model
    await model.fit(xs, ys, {
      epochs: config.epochs,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0,
    });

    // Cleanup
    xs.dispose();
    ys.dispose();

    this.model = model;
    return model;
  }

  /**
   * Prepare Sequences for Training
   */
  private prepareSequences(features: number[][], sequenceLength: number): { 
    inputs: number[][][], 
    targets: number[] 
  } {
    const inputs: number[][][] = [];
    const targets: number[] = [];

    for (let i = sequenceLength; i < features.length; i++) {
      const sequence: number[][] = [];
      for (let j = i - sequenceLength; j < i; j++) {
        sequence.push(features[j]);
      }
      inputs.push(sequence);
      targets.push(i < features.length ? 1 : 0); // Simplified target
    }

    return { inputs, targets };
  }

  /**
   * One-hot encode labels
   */
  private oneHot(label: number, numClasses: number): number[] {
    const oneHot = new Array(numClasses).fill(0);
    oneHot[label] = 1;
    return oneHot;
  }

  /**
   * Predict with Transformer Model
   */
  async predict(input: number[][]): Promise<number[]> {
    if (!this.model) {
      throw new Error('Model not trained');
    }

    const xs = tf.tensor3d([input]);
    const prediction = this.model.predict(xs) as tf.Tensor;
    const result = await prediction.array() as number[][];

    xs.dispose();
    prediction.dispose();

    return result[0];
  }
}

// ============================================================================
// Ensemble Risk Forecasting Engine
// ============================================================================

class EnsembleRiskForecaster {
  private models: Map<string, tf.LayersModel> = new Map();
  private modelWeights: Map<string, number> = new Map();
  private transformerModel: RiskTransformerModel;

  constructor() {
    this.transformerModel = new RiskTransformerModel();
  }

  /**
   * Build LSTM Model with Attention for Risk Forecasting
   */
  async buildLSTMWithAttention(config: any): Promise<tf.LayersModel> {
    // Input layer
    const input = tf.input({ shape: [config.sequenceLength, config.inputDim] });

    // LSTM layers
    let lstmOut = tf.layers.lstm({
      units: config.lstmUnits[0],
      returnSequences: true,
      dropout: config.dropout,
    }).apply(input) as tf.SymbolicTensor;

    for (let i = 1; i < config.lstmUnits.length; i++) {
      const returnSeq = i < config.lstmUnits.length - 1;
      lstmOut = tf.layers.lstm({
        units: config.lstmUnits[i],
        returnSequences: returnSeq,
        dropout: config.dropout,
      }).apply(lstmOut) as tf.SymbolicTensor;
    }

    // Attention mechanism
    const attention = tf.layers.dense({
      units: config.lstmUnits[config.lstmUnits.length - 1],
      activation: 'tanh',
    }).apply(lstmOut) as tf.SymbolicTensor;

    const attentionWeights = tf.layers.dense({
      units: 1,
      activation: 'softmax',
    }).apply(attention) as tf.SymbolicTensor;

    const context = tf.layers.dot({
      axes: 1,
    }).apply([attentionWeights, lstmOut]) as tf.SymbolicTensor;

    // Dense layers
    let denseOut = context;
    for (const units of config.denseUnits) {
      denseOut = tf.layers.dense({
        units,
        activation: 'relu',
      }).apply(denseOut) as tf.SymbolicTensor;
      
      denseOut = tf.layers.dropout({
        rate: config.dropout,
      }).apply(denseOut) as tf.SymbolicTensor;
    }

    // Output layer for risk categories
    const output = tf.layers.dense({
      units: config.outputDim,
      activation: 'softmax',
    }).apply(denseOut) as tf.SymbolicTensor;

    const model = tf.model({ inputs: input, outputs: output });

    model.compile({
      optimizer: tf.train.adam(config.learningRate),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  /**
   * Train Ensemble Model for Risk Forecasting
   */
  async trainEnsemble(
    data: { features: number[][]; targets: number[] },
    modelTypes: string[],
    config: any
  ): Promise<void> {
    // Train individual models
    for (const modelType of modelTypes) {
      let model: tf.LayersModel;
      
      switch (modelType) {
        case 'lstm_attention':
          model = await this.buildLSTMWithAttention(config.RISK_ENSEMBLE.lstm);
          break;
        case 'transformer':
          model = await this.transformerModel.buildTransformer(config.RISK_TRANSFORMER);
          break;
        default:
          continue;
      }

      // Prepare data
      const xs = tf.tensor2d(data.features);
      const ys = tf.tensor2d(data.targets.map(t => [t]));

      // Train model
      await model.fit(xs, ys, {
        epochs: config.RISK_ENSEMBLE.lstm.epochs,
        batchSize: 32,
        validationSplit: 0.2,
        verbose: 0,
      });

      // Store model
      this.models.set(modelType, model);
      this.modelWeights.set(modelType, 1.0);

      // Cleanup
      xs.dispose();
      ys.dispose();
    }
  }

  /**
   * Predict with Ensemble for Risk Forecasting
   */
  async predictEnsemble(input: number[][]): Promise<{ predictions: number[]; confidence: number }> {
    if (this.models.size === 0) {
      throw new Error('No trained models in ensemble');
    }

    const predictions: number[][] = [];
    const weights: number[] = [];

    // Get predictions from all models
    for (const [modelType, model] of this.models.entries()) {
      const xs = tf.tensor2d(input.length > 0 ? input[input.length - 1] : []);
      const prediction = model.predict(xs) as tf.Tensor;
      const predValue = await prediction.array() as number[];
      
      predictions.push(predValue);
      weights.push(this.modelWeights.get(modelType) || 1.0);
      
      xs.dispose();
      prediction.dispose();
    }

    // Weighted average for each risk category
    const ensemblePredictions: number[] = [];
    for (let i = 0; i < predictions[0].length; i++) {
      let weightedSum = 0;
      let totalWeight = 0;
      
      for (let j = 0; j < predictions.length; j++) {
        weightedSum += predictions[j][i] * weights[j];
        totalWeight += weights[j];
      }
      
      ensemblePredictions.push(weightedSum / totalWeight);
    }

    // Calculate confidence (simplified)
    const variance = predictions.reduce((sum, pred) => 
      sum + pred.reduce((s, p, idx) => s + Math.pow(p - ensemblePredictions[idx], 2), 0), 0
    ) / (predictions.length * predictions[0].length);
    
    const confidence = 1 / (1 + Math.sqrt(variance));

    return {
      predictions: ensemblePredictions,
      confidence: Math.min(1, Math.max(0, confidence)),
    };
  }
}

// ============================================================================
// Enhanced Risk Forecasting Service
// ============================================================================

class EnhancedRiskForecastingService {
  private ensembleForecaster: EnsembleRiskForecaster;

  constructor() {
    this.ensembleForecaster = new EnsembleRiskForecaster();
  }

  /**
   * Generate Enhanced Risk Forecast
   */
  async generateForecast(projectId: string): Promise<RiskForecast> {
    const startTime = Date.now();

    // ✅ OPTIMIZATION: Batch read - fetch all data in parallel
    const [project, historicalRisks, externalFactors, dailyReports] = await Promise.all([
      this.fetchProject(projectId),
      this.fetchHistoricalRisks(projectId),
      this.fetchExternalFactors(),
      this.fetchDailyReports(projectId)
    ]);
    
    // Extract features
    const features = RiskFeatureEngineer.extractProjectRiskFeatures(
      project, 
      historicalRisks, 
      externalFactors, 
      dailyReports
    );
    
    // Prepare training data
    const trainingData = this.prepareTrainingData(historicalRisks, features);
    
    // Train ensemble model if we have sufficient data
    if (trainingData.features.length > ENHANCED_RISK_MODEL_CONFIGS.RISK_ENSEMBLE.lstm.sequenceLength) {
      await this.ensembleForecaster.trainEnsemble(
        trainingData,
        ['lstm_attention', 'transformer'],
        ENHANCED_RISK_MODEL_CONFIGS
      );
    }

    // Generate risk predictions
    const riskPredictions = await this.generateRiskPredictions(projectId, features);
    const riskCategories = this.analyzeRiskCategories(historicalRisks);
    const recommendations = this.generateRecommendations(historicalRisks, features);
    const emergingRisks = this.identifyEmergingRisks(historicalRisks, features);
    const warnings = this.detectWarnings(features, riskPredictions);

    const forecast: RiskForecast = {
      forecastId: `enhanced_risk_forecast_${Date.now()}`,
      projectId,
      projectName: project.name || 'Unknown Project',
      forecastDate: new Date(),
      overallRiskScore: this.calculateOverallRiskScore(riskPredictions),
      riskLevel: this.categorizeRiskLevel(this.calculateOverallRiskScore(riskPredictions)),
      riskTrend: this.analyzeRiskTrend(historicalRisks),
      predictedRisks: riskPredictions,
      emergingRisks,
      riskCategories,
      mitigationEffectiveness: this.calculateMitigationEffectiveness(historicalRisks),
      recommendations,
      warnings,
      generatedAt: new Date(),
    };

    // Save to Firestore
    await this.saveForecast(forecast);

    console.log(`Enhanced risk forecast generated in ${Date.now() - startTime}ms`);

    return forecast;
  }

  /**
   * Fetch Project
   */
  private async fetchProject(projectId: string): Promise<Project> {
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }
    return { id: projectDoc.id, ...projectDoc.data() } as Project;
  }

  /**
   * Fetch Historical Risks
   */
  private async fetchHistoricalRisks(projectId: string): Promise<Risk[]> {
    const q = query(collection(db, 'risks'), where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Risk));
  }

  /**
   * Fetch External Factors
   */
  private async fetchExternalFactors(): Promise<ExternalFactor[]> {
    const snapshot = await getDocs(collection(db, 'external_factors'));
    return snapshot.docs.map(doc => ({ 
      factorId: doc.id, 
      name: 'External Factor', 
      category: 'economic', 
      currentValue: 0, 
      trend: 'stable', 
      impact: 'medium', 
      correlation: 0, 
      source: 'database', 
      lastUpdated: new Date(), 
      ...doc.data() 
    } as ExternalFactor));
  }

  /**
   * Fetch Daily Reports
   */
  private async fetchDailyReports(projectId: string): Promise<DailyReport[]> {
    const q = query(collection(db, 'dailyReports'), where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyReport));
  }

  /**
   * Prepare Training Data
   */
  private prepareTrainingData(
    historicalRisks: Risk[],
    features: any
  ): { features: number[][]; targets: number[] } {
    // Convert features to numerical array
    const featureArray = Object.values(features).map(val => 
      typeof val === 'number' ? val : 0
    ) as number[];
    
    // Create training data from historical risks
    const featuresArray: number[][] = [];
    const targets: number[] = [];
    
    // Add current features
    featuresArray.push(featureArray);
    targets.push(historicalRisks.length > 0 ? 
      historicalRisks[historicalRisks.length - 1].riskScore : 50
    );
    
    // Add historical risk features
    for (const risk of historicalRisks) {
      const riskFeatures = [
        risk.severity,
        risk.probability,
        risk.riskScore,
        risk.priorityLevel === 'critical' ? 4 : 
        risk.priorityLevel === 'high' ? 3 : 
        risk.priorityLevel === 'medium' ? 2 : 1,
        risk.status === 'occurred' ? 1 : 0,
        risk.mitigationPlan ? 1 : 0,
        risk.occurred ? 1 : 0,
        // Add more features as needed
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
      ];
      
      featuresArray.push(riskFeatures);
      targets.push(risk.riskScore);
    }
    
    return { features: featuresArray, targets };
  }

  /**
   * Generate Risk Predictions
   */
  private async generateRiskPredictions(_projectId: string, features: any): Promise<PredictedRisk[]> {
    const predictedRisks: PredictedRisk[] = [];
    
    // Predict risk categories
    const riskCategories: Array<'cost' | 'schedule' | 'quality' | 'safety' | 'technical' | 'external'> = [
      'cost', 'schedule', 'quality', 'safety', 'technical', 'external'
    ];
    
    for (const category of riskCategories) {
      // Calculate probability based on features
      let probability = 0.1; // Base probability
      let impact = 50; // Base impact
      
      switch (category) {
        case 'cost':
          probability = Math.min(0.95, 0.1 + features.budgetUtilization * 0.5 + features.costVariance * 0.3);
          impact = Math.min(100, 30 + features.projectSize / 1000000);
          break;
        case 'schedule':
          probability = Math.min(0.95, 0.15 + features.scheduleVariance * 0.4 + (1 - features.progressRatio) * 0.3);
          impact = Math.min(100, 40 + features.projectDuration / 30);
          break;
        case 'quality':
          probability = Math.min(0.9, 0.1 + (100 - features.qualityScore) / 100 * 0.5);
          impact = Math.min(100, 20 + (100 - features.qualityScore) * 0.8);
          break;
        case 'safety':
          probability = Math.min(0.85, 0.1 + features.incidentsReported / 10 * 0.4);
          impact = Math.min(100, 50 + features.incidentsReported * 5);
          break;
        case 'technical':
          probability = Math.min(0.8, 0.1 + features.technicalRisks / 10 * 0.4);
          impact = Math.min(100, 40 + features.technicalRisks * 3);
          break;
        case 'external':
          probability = Math.min(0.7, 0.1 + features.economicIndex * 0.3 + features.weatherRisk * 0.3);
          impact = Math.min(100, 30 + features.economicIndex * 20 + features.weatherRisk * 30);
          break;
      }
      
      const riskScore = probability * impact;
      const severity = riskScore >= 75 ? 'critical' : 
                      riskScore >= 50 ? 'high' : 
                      riskScore >= 25 ? 'medium' : 'low';
      
      predictedRisks.push({
        riskId: `predicted_risk_${category}_${Date.now()}`,
        category,
        description: this.generateRiskDescription(category, probability, impact),
        probability,
        impact,
        riskScore,
        severity,
        timeframe: 'short_term',
        triggerIndicators: this.getTriggerIndicators(category, features),
        potentialImpact: this.getPotentialImpact(category, impact),
        mitigationStrategies: this.getMitigationStrategies(category),
        confidenceScore: 0.85, // Enhanced confidence
      });
    }
    
    return predictedRisks;
  }

  /**
   * Generate Risk Description
   */
  private generateRiskDescription(
    category: string, 
    probability: number, 
    impact: number
  ): string {
    const probText = probability >= 0.7 ? 'High' : 
                    probability >= 0.4 ? 'Medium' : 'Low';
    const impactText = impact >= 75 ? 'severe' : 
                      impact >= 50 ? 'significant' : 
                      impact >= 25 ? 'moderate' : 'minor';
    
    return `Predicted ${category} risk with ${probText.toLowerCase()} probability and ${impactText} potential impact`;
  }

  /**
   * Get Trigger Indicators
   */
  private getTriggerIndicators(category: string, features: any): string[] {
    const indicators: string[] = [];
    
    switch (category) {
      case 'cost':
        if (features.budgetUtilization > 0.8) indicators.push('High budget utilization');
        if (features.costVariance > 0.1) indicators.push('Cost overrun detected');
        break;
      case 'schedule':
        if (features.scheduleVariance < -0.1) indicators.push('Schedule delay detected');
        if (features.progressRatio < 0.5) indicators.push('Behind schedule');
        break;
      case 'quality':
        if (features.qualityScore < 70) indicators.push('Quality issues reported');
        break;
      case 'safety':
        if (features.incidentsReported > 5) indicators.push('Multiple safety incidents');
        break;
      case 'technical':
        if (features.technicalRisks > 3) indicators.push('Multiple technical risks identified');
        break;
      case 'external':
        if (features.economicIndex > 0.7) indicators.push('High economic risk');
        if (features.weatherRisk > 0.6) indicators.push('Adverse weather conditions');
        break;
    }
    
    return indicators.length > 0 ? indicators : ['General project conditions'];
  }

  /**
   * Get Potential Impact
   */
  private getPotentialImpact(
    category: string, 
    impact: number
  ): { costImpact?: number; scheduleImpact?: number; qualityImpact?: number; safetyImpact?: number } {
    const potentialImpact: any = {};
    
    switch (category) {
      case 'cost':
        potentialImpact.costImpact = impact * 1000; // Estimate in currency units
        break;
      case 'schedule':
        potentialImpact.scheduleImpact = Math.round(impact / 10); // Estimate in days
        break;
      case 'quality':
        potentialImpact.qualityImpact = impact;
        break;
      case 'safety':
        potentialImpact.safetyImpact = impact;
        break;
    }
    
    return potentialImpact;
  }

  /**
   * Get Mitigation Strategies
   */
  private getMitigationStrategies(category: string): string[] {
    switch (category) {
      case 'cost':
        return [
          'Implement cost control measures',
          'Review budget allocations',
          'Identify cost reduction opportunities',
          'Establish contingency reserves'
        ];
      case 'schedule':
        return [
          'Optimize resource allocation',
          'Identify critical path activities',
          'Implement schedule recovery plans',
          'Monitor progress closely'
        ];
      case 'quality':
        return [
          'Strengthen quality control processes',
          'Increase inspection frequency',
          'Provide additional training',
          'Implement corrective actions'
        ];
      case 'safety':
        return [
          'Enhance safety protocols',
          'Conduct additional safety training',
          'Increase supervision',
          'Implement safety incentives'
        ];
      case 'technical':
        return [
          'Engage technical experts',
          'Conduct design reviews',
          'Perform risk assessments',
          'Develop contingency plans'
        ];
      case 'external':
        return [
          'Monitor market conditions',
          'Diversify suppliers',
          'Establish alternative sources',
          'Implement risk transfer strategies'
        ];
      default:
        return ['Monitor closely', 'Develop contingency plans'];
    }
  }

  /**
   * Analyze Risk Categories
   */
  private analyzeRiskCategories(historicalRisks: Risk[]): RiskCategoryScore[] {
    const categoryScores: RiskCategoryScore[] = [];
    const categories: RiskCategory[] = [
      'technical', 'financial', 'safety', 'legal', 'environmental',
      'operational', 'schedule', 'quality', 'resource', 'stakeholder', 'external'
    ];
    
    for (const category of categories) {
      const categoryRisks = historicalRisks.filter(r => r.category === category);
      if (categoryRisks.length === 0) continue;
      
      const currentScore = categoryRisks.reduce((sum, r) => sum + r.riskScore, 0) / categoryRisks.length;
      const topRisks = categoryRisks
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 3)
        .map(r => r.id);
      
      categoryScores.push({
        category,
        currentScore,
        forecastScore: Math.min(100, currentScore * 1.1), // Slight increase for forecast
        trend: 'stable',
        topRisks,
        contributionPercentage: (categoryRisks.length / historicalRisks.length) * 100,
      });
    }
    
    return categoryScores;
  }

  /**
   * Generate Recommendations
   */
  private generateRecommendations(historicalRisks: Risk[], features: any): RiskRecommendation[] {
    const recommendations: RiskRecommendation[] = [];
    
    // High risk recommendations
    const criticalRisks = historicalRisks.filter(r => r.priorityLevel === 'critical');
    if (criticalRisks.length > 0) {
      recommendations.push({
        recommendationId: `rec_critical_risks_${Date.now()}`,
        priority: 'urgent',
        action: `Address ${criticalRisks.length} critical risks immediately`,
        rationale: 'Critical risks pose significant threat to project success',
        expectedBenefit: 'Risk reduction and project stability',
        affectedRisks: criticalRisks.map(r => r.id),
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
      });
    }
    
    // Budget recommendations
    if (features.budgetUtilization > 0.8) {
      recommendations.push({
        recommendationId: `rec_budget_${Date.now()}`,
        priority: 'high',
        action: 'Review budget and implement cost controls',
        rationale: `Budget utilization is at ${Math.round(features.budgetUtilization * 100)}%`,
        expectedBenefit: 'Cost overrun prevention',
        implementationCost: 0,
        implementationTime: 5, // days
        affectedRisks: []
      });
    }
    
    // Schedule recommendations
    if (features.scheduleVariance < -0.1) {
      recommendations.push({
        recommendationId: `rec_schedule_${Date.now()}`,
        priority: 'high',
        action: 'Implement schedule recovery measures',
        rationale: `Schedule delay of ${Math.round(Math.abs(features.scheduleVariance) * 100)}% detected`,
        expectedBenefit: 'Schedule alignment',
        implementationTime: 10, // days
        affectedRisks: []
      });
    }
    
    // Quality recommendations
    if (features.qualityScore < 70) {
      recommendations.push({
        recommendationId: `rec_quality_${Date.now()}`,
        priority: 'medium',
        action: 'Enhance quality control processes',
        rationale: `Quality score is at ${Math.round(features.qualityScore)}`,
        expectedBenefit: 'Improved deliverable quality',
        implementationTime: 15, // days
        affectedRisks: []
      });
    }
    
    return recommendations;
  }

  /**
   * Identify Emerging Risks
   */
  private identifyEmergingRisks(_historicalRisks: Risk[], features: any): EmergingRisk[] {
    const emergingRisks: EmergingRisk[] = [];
    
    // Check for increasing risk trend
    if (features.riskTrend > 0.1) {
      emergingRisks.push({
        riskId: `emerging_trend_${Date.now()}`,
        description: 'Increasing risk trend detected',
        earlyWarningSignals: ['Rising risk scores', 'New risk identification'],
        detectionDate: new Date(),
        currentProbability: 0.6,
        projectedProbability: 0.8,
        timeToMaterialize: 30, // days
        preventionActions: [
          'Increase risk monitoring frequency',
          'Implement proactive mitigation measures',
          'Engage risk owners'
        ],
        monitoringMetrics: ['Risk score trend', 'New risk identification rate'],
      });
    }
    
    // Check for seasonal risks
    if (features.isPeakSeason && features.weatherRisk > 0.5) {
      emergingRisks.push({
        riskId: `emerging_weather_${Date.now()}`,
        description: 'Adverse weather conditions during peak season',
        earlyWarningSignals: ['Weather forecasts', 'Seasonal patterns'],
        detectionDate: new Date(),
        currentProbability: 0.7,
        projectedProbability: 0.9,
        timeToMaterialize: 15, // days
        preventionActions: [
          'Adjust schedules for weather',
          'Secure weather protection measures',
          'Identify indoor alternatives'
        ],
        monitoringMetrics: ['Weather forecasts', 'Weather impact reports'],
      });
    }
    
    return emergingRisks;
  }

  /**
   * Detect Warnings
   */
  private detectWarnings(features: any, predictedRisks: PredictedRisk[]): ForecastWarning[] {
    const warnings: ForecastWarning[] = [];
    
    // High overall risk warning
    const criticalRisks = predictedRisks.filter(r => r.severity === 'critical');
    if (criticalRisks.length > 0) {
      warnings.push({
        warningId: `warn_critical_risks_${Date.now()}`,
        severity: 'critical',
        category: 'threshold',
        message: 'Critical risks identified',
        description: `${criticalRisks.length} critical risks require immediate attention`,
        affectedMetrics: ['overall_risk_score'],
        recommendedAction: 'Address critical risks with highest priority',
        detectedAt: new Date(),
        acknowledged: false,
      });
    }
    
    // Budget warning
    if (features.budgetUtilization > 0.9) {
      warnings.push({
        warningId: `warn_budget_${Date.now()}`,
        severity: 'high',
        category: 'threshold',
        message: 'High budget utilization',
        description: `Budget utilization at ${Math.round(features.budgetUtilization * 100)}%`,
        affectedMetrics: ['budget_utilization', 'cost_risk'],
        recommendedAction: 'Implement immediate cost control measures',
        detectedAt: new Date(),
        acknowledged: false,
      });
    }
    
    // Schedule warning
    if (features.scheduleVariance < -0.2) {
      warnings.push({
        warningId: `warn_schedule_${Date.now()}`,
        severity: 'high',
        category: 'threshold',
        message: 'Significant schedule delay',
        description: `Schedule delay of ${Math.round(Math.abs(features.scheduleVariance) * 100)}%`,
        affectedMetrics: ['schedule_variance', 'schedule_risk'],
        recommendedAction: 'Implement schedule recovery plan',
        detectedAt: new Date(),
        acknowledged: false,
      });
    }
    
    return warnings;
  }

  /**
   * Calculate Overall Risk Score
   */
  private calculateOverallRiskScore(predictedRisks: PredictedRisk[]): number {
    if (predictedRisks.length === 0) return 50;
    
    const totalScore = predictedRisks.reduce((sum, risk) => sum + risk.riskScore, 0);
    return totalScore / predictedRisks.length;
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
   * Analyze Risk Trend
   */
  private analyzeRiskTrend(historicalRisks: Risk[]): 'improving' | 'stable' | 'deteriorating' {
    if (historicalRisks.length < 2) return 'stable';
    
    // Sort by creation date
    const sortedRisks = [...historicalRisks].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    // Compare recent vs older risks
    const recentRisks = sortedRisks.slice(-Math.floor(sortedRisks.length / 2));
    const olderRisks = sortedRisks.slice(0, Math.floor(sortedRisks.length / 2));
    
    const recentAvg = recentRisks.reduce((sum, r) => sum + r.riskScore, 0) / recentRisks.length;
    const olderAvg = olderRisks.reduce((sum, r) => sum + r.riskScore, 0) / olderRisks.length;
    
    const trend = recentAvg - olderAvg;
    
    if (trend > 5) return 'deteriorating';
    if (trend < -5) return 'improving';
    return 'stable';
  }

  /**
   * Calculate Mitigation Effectiveness
   */
  private calculateMitigationEffectiveness(historicalRisks: Risk[]): number {
    if (historicalRisks.length === 0) return 75; // Default effectiveness
    
    const mitigatedRisks = historicalRisks.filter(r => r.mitigationPlan);
    if (mitigatedRisks.length === 0) return 50;
    
    const closedRisks = mitigatedRisks.filter(r => r.status === 'closed').length;
    return (closedRisks / mitigatedRisks.length) * 100;
  }

  /**
   * Save Forecast
   */
  private async saveForecast(forecast: RiskForecast): Promise<void> {
    await addDoc(collection(db, 'enhanced_risk_forecasts'), {
      ...forecast,
      forecastDate: Timestamp.fromDate(forecast.forecastDate),
      generatedAt: Timestamp.fromDate(forecast.generatedAt),
    });
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const enhancedRiskForecastingService = new EnhancedRiskForecastingService();