/**
 * AI Resource Optimization Type Definitions
 * NataCarePM - Phase 4: AI & Analytics
 * 
 * Comprehensive types for AI-powered resource allocation,
 * ML-based scheduling, and optimization recommendations
 */

// No imports needed - all types are self-contained or reference from main types via module
// Project, Worker, Equipment, Material types exist in ../types.ts if needed for references

// ============================================================================
// ML Model Types
// ============================================================================

export type MLModelType = 
  | 'neural_network'
  | 'lstm'
  | 'random_forest'
  | 'genetic_algorithm'
  | 'gradient_boosting'
  | 'linear_regression';

export type ModelStatus = 'training' | 'ready' | 'updating' | 'error';

export interface MLModelMetadata {
  modelId: string;
  name: string;
  type: MLModelType;
  version: string;
  status: ModelStatus;
  accuracy: number; // 0-1
  trainedAt?: Date;
  trainingSamples: number;
  features: string[];
  hyperparameters: Record<string, any>;
  performanceMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    mse?: number; // Mean Squared Error (regression)
    rmse?: number; // Root Mean Squared Error
    mae?: number; // Mean Absolute Error
    r2Score?: number; // R-squared (regression)
  };
  trainingHistory: {
    epoch: number;
    loss: number;
    accuracy: number;
    valLoss?: number;
    valAccuracy?: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// ============================================================================
// Resource Types
// ============================================================================

export interface ResourceCapability {
  skill: string;
  proficiencyLevel: 1 | 2 | 3 | 4 | 5; // 1=Beginner, 5=Expert
  yearsExperience: number;
  certifications: string[];
  lastUsed?: Date;
}

export interface ResourceAvailability {
  resourceId: string;
  resourceType: 'worker' | 'equipment' | 'material';
  startDate: Date;
  endDate: Date;
  availabilityPercentage: number; // 0-100
  conflicts: ResourceConflict[];
  currentAllocation?: ResourceAllocation;
}

export interface ResourceConflict {
  conflictId: string;
  projectId: string;
  projectName: string;
  taskId?: string;
  taskName?: string;
  startDate: Date;
  endDate: Date;
  allocationPercentage: number;
  priority: number; // 1-5, 5=highest
  canReschedule: boolean;
  reschedulingCost?: number;
}

export interface ResourceAllocation {
  allocationId: string;
  resourceId: string;
  resourceType: 'worker' | 'equipment' | 'material';
  projectId: string;
  taskId?: string;
  startDate: Date;
  endDate: Date;
  allocationPercentage: number; // 0-100
  estimatedCost: number;
  actualCost?: number;
  status: 'planned' | 'allocated' | 'in_use' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// ============================================================================
// Optimization Request Types
// ============================================================================

export interface ResourceOptimizationRequest {
  requestId: string;
  projectIds: string[];
  optimizationGoal: OptimizationGoal;
  constraints: OptimizationConstraints;
  preferences: OptimizationPreferences;
  timeHorizon: {
    startDate: Date;
    endDate: Date;
  };
  requestedAt: Date;
  requestedBy: string;
}

export type OptimizationGoal = 
  | 'minimize_cost'
  | 'minimize_duration'
  | 'maximize_quality'
  | 'balance_cost_time'
  | 'maximize_utilization'
  | 'minimize_idle_time';

export interface OptimizationConstraints {
  budgetLimit?: number;
  deadlineDate?: Date;
  requiredSkills?: string[];
  mandatoryResources?: string[]; // Resource IDs that must be used
  excludedResources?: string[]; // Resource IDs that cannot be used
  maxWorkersPerTask?: number;
  minQualityScore?: number; // 0-100
  workingHours?: {
    startHour: number; // 0-23
    endHour: number; // 0-23
    workingDays: number[]; // 0=Sunday, 6=Saturday
  };
  maxOvertimeHours?: number;
  safetyRequirements?: string[];
}

export interface OptimizationPreferences {
  preferLocalWorkers?: boolean;
  preferCertifiedWorkers?: boolean;
  preferOwnedEquipment?: boolean; // vs rented
  allowSubcontracting?: boolean;
  allowOvertime?: boolean;
  prioritizeExperience?: boolean;
  costWeight?: number; // 0-1, default 0.5
  timeWeight?: number; // 0-1, default 0.5
  qualityWeight?: number; // 0-1, default 0.5
}

// ============================================================================
// Optimization Result Types
// ============================================================================

export interface OptimizationResult {
  resultId: string;
  requestId: string;
  status: 'success' | 'partial' | 'failed';
  confidenceScore: number; // 0-1
  recommendations: ResourceRecommendation[];
  schedulingPlan: SchedulingPlan;
  performanceMetrics: OptimizationMetrics;
  alternatives: AlternativeScenario[];
  warnings: OptimizationWarning[];
  computedAt: Date;
  computationTimeMs: number;
}

export interface ResourceRecommendation {
  recommendationId: string;
  taskId: string;
  taskName: string;
  projectId: string;
  resourceType: 'worker' | 'equipment' | 'material';
  recommendedResources: RecommendedResource[];
  reasoning: string;
  confidenceScore: number; // 0-1
  estimatedCost: number;
  estimatedDuration: number; // hours
  qualityScore: number; // 0-100
  riskScore: number; // 0-100
}

export interface RecommendedResource {
  resourceId: string;
  resourceName: string;
  resourceType: 'worker' | 'equipment' | 'material';
  matchScore: number; // 0-1, how well it matches requirements
  allocationPercentage: number; // 0-100
  startDate: Date;
  endDate: Date;
  estimatedCost: number;
  capabilities?: ResourceCapability[];
  availability: ResourceAvailability;
  alternatives?: string[]; // Alternative resource IDs
}

export interface SchedulingPlan {
  planId: string;
  projectId: string;
  tasks: TaskSchedule[];
  criticalPath: string[]; // Task IDs on critical path
  totalDuration: number; // hours
  totalCost: number;
  resourceUtilization: ResourceUtilization[];
  milestones: ScheduleMilestone[];
  dependencies: TaskDependency[];
  bufferTime: number; // hours
}

export interface TaskSchedule {
  taskId: string;
  taskName: string;
  startDate: Date;
  endDate: Date;
  duration: number; // hours
  isCritical: boolean;
  slack: number; // hours of slack time
  assignedResources: string[]; // Resource IDs
  predecessors: string[]; // Task IDs
  successors: string[]; // Task IDs
  estimatedCost: number;
  complexity: number; // 1-10
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ResourceUtilization {
  resourceId: string;
  resourceName: string;
  resourceType: 'worker' | 'equipment' | 'material';
  totalAllocatedHours: number;
  availableHours: number;
  utilizationPercentage: number; // 0-100
  idleTime: number; // hours
  overtimeHours: number;
  costEfficiency: number; // 0-1
  schedule: {
    date: Date;
    allocatedHours: number;
    tasks: string[]; // Task IDs
  }[];
}

export interface ScheduleMilestone {
  milestoneId: string;
  name: string;
  targetDate: Date;
  completionPercentage: number; // 0-100
  isAchieved: boolean;
  dependentTasks: string[]; // Task IDs
}

export interface TaskDependency {
  predecessorTaskId: string;
  successorTaskId: string;
  dependencyType: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  lagTime?: number; // hours (can be negative for lead time)
}

// ============================================================================
// Alternative Scenarios
// ============================================================================

export interface AlternativeScenario {
  scenarioId: string;
  scenarioName: string;
  description: string;
  totalCost: number;
  totalDuration: number; // hours
  qualityScore: number; // 0-100
  riskScore: number; // 0-100
  resourceChanges: {
    taskId: string;
    originalResourceId: string;
    alternativeResourceId: string;
    costDifference: number;
    timeDifference: number; // hours
    qualityImpact: number; // -100 to +100
  }[];
  pros: string[];
  cons: string[];
  recommendationScore: number; // 0-1
}

// ============================================================================
// Optimization Metrics
// ============================================================================

export interface OptimizationMetrics {
  costSavings: number; // Amount saved vs baseline
  costSavingsPercentage: number; // 0-100
  timeSavings: number; // Hours saved vs baseline
  timeSavingsPercentage: number; // 0-100
  resourceUtilizationAvg: number; // 0-100
  resourceUtilizationImprovement: number; // Percentage points
  qualityScoreAvg: number; // 0-100
  riskScoreAvg: number; // 0-100
  conflictsResolved: number;
  conflictsRemaining: number;
  feasibilityScore: number; // 0-1
  robustnessScore: number; // 0-1, how well it handles changes
}

export interface OptimizationWarning {
  warningId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'resource_conflict' | 'budget_overrun' | 'schedule_delay' | 'quality_risk' | 'safety_concern';
  message: string;
  affectedTaskIds: string[];
  affectedResourceIds: string[];
  recommendedAction: string;
  estimatedImpact: {
    costImpact?: number;
    timeImpact?: number; // hours
    qualityImpact?: number; // 0-100
  };
}

// ============================================================================
// ML Training Data Types
// ============================================================================

export interface TrainingDataPoint {
  dataId: string;
  projectId: string;
  taskId?: string;
  features: {
    // Task characteristics
    taskComplexity: number; // 1-10
    taskDuration: number; // hours
    requiredSkills: string[];
    budgetAmount: number;
    
    // Resource characteristics
    workerExperienceYears: number;
    workerProficiencyLevel: number; // 1-5
    equipmentAge: number; // years
    equipmentCondition: number; // 1-5
    
    // Environmental factors
    season: 'spring' | 'summer' | 'fall' | 'winter';
    weatherConditions: string;
    siteAccessibility: number; // 1-5
    
    // Historical performance
    previousProjectsCount: number;
    averageDelayDays: number;
    averageCostOverrun: number; // percentage
    
    // Additional features
    [key: string]: any;
  };
  labels: {
    actualDuration: number; // hours
    actualCost: number;
    qualityScore: number; // 0-100
    successRate: number; // 0-1
    delayDays: number;
    costOverrunPercentage: number;
  };
  timestamp: Date;
}

export interface TrainingDataset {
  datasetId: string;
  name: string;
  description: string;
  dataPoints: TrainingDataPoint[];
  splitRatio: {
    training: number; // 0-1
    validation: number; // 0-1
    testing: number; // 0-1
  };
  normalizationParams?: {
    mean: number[];
    std: number[];
    min: number[];
    max: number[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Genetic Algorithm Types
// ============================================================================

export interface GeneticAlgorithmConfig {
  populationSize: number;
  maxGenerations: number;
  mutationRate: number; // 0-1
  crossoverRate: number; // 0-1
  elitismRate: number; // 0-1
  fitnessFunction: 'cost' | 'time' | 'quality' | 'composite';
  selectionMethod: 'tournament' | 'roulette' | 'rank';
  tournamentSize?: number;
  convergenceThreshold?: number;
}

export interface Individual {
  genome: ResourceAllocation[];
  fitness: number;
  generation: number;
  age: number;
}

export interface GeneticAlgorithmResult {
  bestIndividual: Individual;
  bestFitness: number;
  generationsRun: number;
  convergenceGeneration?: number;
  fitnessHistory: number[];
  executionTimeMs: number;
}

// ============================================================================
// Schedule Recommendation Types
// ============================================================================

export interface SchedulingRecommendation {
  recommendationId: string;
  projectId: string;
  recommendationType: 'reallocation' | 'rescheduling' | 'resource_addition' | 'priority_change';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  reasoning: string;
  affectedTasks: string[];
  affectedResources: string[];
  estimatedImpact: {
    costChange: number;
    timeChange: number; // hours
    qualityChange: number; // -100 to +100
    riskChange: number; // -100 to +100
  };
  implementationSteps: string[];
  deadline?: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'implemented';
  createdAt: Date;
  createdBy: string; // 'AI' or user ID
}

// ============================================================================
// Resource Prediction Types
// ============================================================================

export interface ResourceDemandForecast {
  forecastId: string;
  projectId: string;
  resourceType: 'worker' | 'equipment' | 'material';
  forecastPeriod: {
    startDate: Date;
    endDate: Date;
  };
  predictions: {
    date: Date;
    demandQuantity: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
    confidenceLevel: number; // 0-1
  }[];
  peakDemandDate: Date;
  peakDemandQuantity: number;
  totalDemand: number;
  generatedAt: Date;
}

export interface ResourceBottleneck {
  bottleneckId: string;
  resourceId: string;
  resourceName: string;
  resourceType: 'worker' | 'equipment' | 'material';
  severity: 'low' | 'medium' | 'high' | 'critical';
  startDate: Date;
  endDate: Date;
  demandVsCapacity: {
    demand: number;
    capacity: number;
    shortfall: number;
    shortfallPercentage: number; // 0-100
  };
  affectedProjects: string[];
  affectedTasks: string[];
  recommendations: string[];
  estimatedDelayDays: number;
  estimatedCostImpact: number;
}

// ============================================================================
// Export Consolidated Types
// ============================================================================

export interface AIResourceOptimizationState {
  models: MLModelMetadata[];
  activeOptimization?: ResourceOptimizationRequest;
  optimizationResults: OptimizationResult[];
  recommendations: SchedulingRecommendation[];
  resourceAllocations: ResourceAllocation[];
  demandForecasts: ResourceDemandForecast[];
  bottlenecks: ResourceBottleneck[];
  isLoading: boolean;
  error: string | null;
}
