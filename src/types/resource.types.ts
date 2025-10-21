/**
 * Resource Management Type Definitions
 * Priority 3A: Resource Management System
 *
 * Comprehensive type system for managing human resources, equipment, and materials
 * in construction project management.
 */

/**
 * Resource Type Enum
 */
export type ResourceType = 'human' | 'equipment' | 'material';

/**
 * Resource Status
 */
export type ResourceStatus = 'available' | 'allocated' | 'maintenance' | 'unavailable' | 'retired';

/**
 * Resource Category
 */
export type ResourceCategory =
  // Human Resources
  | 'worker'
  | 'engineer'
  | 'supervisor'
  | 'subcontractor'
  | 'consultant'
  // Equipment
  | 'heavy_equipment'
  | 'vehicle'
  | 'tool'
  | 'machinery'
  | 'safety_equipment'
  // Materials
  | 'building_material'
  | 'finishing_material'
  | 'electrical'
  | 'plumbing'
  | 'hvac';

/**
 * Skill Level
 */
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * Certification Interface
 */
export interface Certification {
  id: string;
  name: string;
  issuingAuthority: string;
  issueDate: Date;
  expiryDate?: Date;
  certificateNumber: string;
  isValid: boolean;
  attachmentUrl?: string;
}

/**
 * Skill Interface
 */
export interface Skill {
  skillName: string;
  level: SkillLevel;
  yearsOfExperience: number;
  certifications?: string[];
}

/**
 * Availability Slot
 */
export interface AvailabilitySlot {
  startDate: Date;
  endDate: Date;
  hoursPerDay?: number;
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  isRecurring: boolean;
}

/**
 * Resource Metadata
 */
export interface ResourceMetadata {
  supplier?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  purchaseCost?: number;
  warrantyExpiry?: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  maintenanceInterval?: number; // hours or days
  specifications?: Record<string, any>;
  notes?: string;
}

/**
 * Main Resource Interface
 */
export interface Resource {
  id: string;
  type: ResourceType;
  name: string;
  category: ResourceCategory;
  description?: string;

  // Human Resource specific
  skills?: Skill[];
  certifications?: Certification[];
  employeeId?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };

  // Equipment specific
  capacity?: number; // load capacity, volume, etc.
  unit?: string; // ton, m3, etc.
  fuelType?: string;
  licensePlate?: string;

  // Material specific
  quantity?: number;
  unit_of_measure?: string; // kg, m, m2, m3, etc.
  minStockLevel?: number;
  reorderPoint?: number;

  // Common fields
  availability: AvailabilitySlot[];
  costPerHour?: number;
  costPerDay?: number;
  costPerUnit?: number;
  status: ResourceStatus;
  location?: string;
  metadata: ResourceMetadata;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

/**
 * Allocation Status
 */
export type AllocationStatus = 'planned' | 'confirmed' | 'active' | 'completed' | 'cancelled';

/**
 * Resource Allocation
 */
export interface ResourceAllocation {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: ResourceType;

  projectId: string;
  projectName: string;
  taskId?: string;
  taskName?: string;

  // Allocation period
  startDate: Date;
  endDate: Date;

  // Planned allocation
  plannedHours?: number;
  plannedQuantity?: number;
  plannedCost: number;

  // Actual allocation (filled during/after allocation)
  actualHours?: number;
  actualQuantity?: number;
  actualCost?: number;

  // Additional details
  allocationPercentage?: number; // 0-100
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: AllocationStatus;
  notes?: string;

  // Approval
  approvedBy?: string;
  approvedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Resource Utilization Metrics
 */
export interface ResourceUtilization {
  resourceId: string;
  resourceName: string;
  resourceType: ResourceType;

  // Time period
  periodStart: Date;
  periodEnd: Date;

  // Utilization metrics
  totalAvailableHours: number;
  totalAllocatedHours: number;
  totalActualHours: number;
  utilizationRate: number; // percentage (0-100)
  idleHours: number;
  overtimeHours?: number;

  // Cost metrics
  totalCost: number;
  costPerProductiveHour: number;
  revenueGenerated?: number;
  profitability?: number;

  // Performance metrics
  tasksCompleted: number;
  averageTaskDuration: number;
  qualityScore?: number;

  // Comparison
  comparedToPreviousPeriod?: {
    utilizationChange: number; // percentage change
    costChange: number;
    productivityChange: number;
  };
}

/**
 * Resource Conflict
 */
export interface ResourceConflict {
  resourceId: string;
  resourceName: string;
  conflictType: 'overallocation' | 'unavailability' | 'maintenance';

  allocations: {
    allocationId: string;
    projectId: string;
    projectName: string;
    startDate: Date;
    endDate: Date;
  }[];

  conflictPeriod: {
    start: Date;
    end: Date;
  };

  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedResolution?: string;
}

/**
 * Resource Forecast
 */
export interface ResourceForecast {
  resourceType: ResourceType;
  category: ResourceCategory;

  forecastPeriod: {
    start: Date;
    end: Date;
  };

  currentQuantity: number;
  projectedDemand: number;
  gap: number; // negative = surplus, positive = shortage

  recommendations: {
    action: 'hire' | 'purchase' | 'rent' | 'reallocate' | 'none';
    quantity: number;
    estimatedCost: number;
    urgency: 'immediate' | 'short_term' | 'long_term';
    reasoning: string;
  }[];

  confidence: number; // 0-100 percentage
}

/**
 * Resource Capacity Planning
 */
export interface CapacityPlan {
  projectId: string;
  projectName: string;

  planPeriod: {
    start: Date;
    end: Date;
  };

  resourceRequirements: {
    resourceType: ResourceType;
    category: ResourceCategory;
    requiredQuantity: number;
    requiredHours?: number;
    estimatedCost: number;
    criticalPath: boolean;
  }[];

  availableResources: {
    resourceType: ResourceType;
    category: ResourceCategory;
    availableQuantity: number;
    availableHours?: number;
  }[];

  gaps: {
    resourceType: ResourceType;
    category: ResourceCategory;
    shortfall: number;
    impact: 'none' | 'minor' | 'moderate' | 'severe' | 'critical';
    mitigation?: string;
  }[];

  status: 'adequate' | 'stretched' | 'insufficient';
}

/**
 * Resource Cost Summary
 */
export interface ResourceCostSummary {
  projectId: string;
  periodStart: Date;
  periodEnd: Date;

  byType: {
    type: ResourceType;
    plannedCost: number;
    actualCost: number;
    variance: number;
    variancePercentage: number;
  }[];

  byCategory: {
    category: ResourceCategory;
    plannedCost: number;
    actualCost: number;
    variance: number;
  }[];

  totalPlannedCost: number;
  totalActualCost: number;
  totalVariance: number;
  totalVariancePercentage: number;

  topCostDrivers: {
    resourceId: string;
    resourceName: string;
    cost: number;
    percentageOfTotal: number;
  }[];
}

/**
 * Resource Optimization Suggestion
 */
export interface OptimizationSuggestion {
  id: string;
  type: 'reallocation' | 'scheduling' | 'procurement' | 'retirement';
  priority: 'low' | 'medium' | 'high';

  currentSituation: string;
  problem: string;
  suggestion: string;

  affectedResources: string[];
  affectedProjects: string[];

  estimatedSavings?: number;
  estimatedEfficiencyGain?: number; // percentage
  implementationCost?: number;
  roi?: number;

  complexity: 'easy' | 'moderate' | 'complex';
  timeToImplement: number; // days

  createdAt: Date;
  status: 'pending' | 'reviewing' | 'approved' | 'implemented' | 'rejected';
}

/**
 * Resource Performance Metrics
 */
export interface ResourcePerformance {
  resourceId: string;
  resourceName: string;

  evaluationPeriod: {
    start: Date;
    end: Date;
  };

  metrics: {
    productivity: number; // 0-100
    quality: number; // 0-100
    reliability: number; // 0-100
    costEfficiency: number; // 0-100
    safetyRecord: number; // 0-100
  };

  overallScore: number; // 0-100
  rating: 'poor' | 'below_average' | 'average' | 'good' | 'excellent';

  achievements: string[];
  areasForImprovement: string[];

  evaluatedBy: string;
  evaluatedAt: Date;
}

/**
 * Resource Maintenance Record
 */
export interface MaintenanceRecord {
  id: string;
  resourceId: string;
  resourceName: string;

  maintenanceType: 'scheduled' | 'preventive' | 'corrective' | 'emergency';
  description: string;

  scheduledDate?: Date;
  actualDate: Date;
  completedDate?: Date;

  performedBy: string;
  cost: number;
  downtime: number; // hours

  partsReplaced?: {
    partName: string;
    quantity: number;
    cost: number;
  }[];

  findings?: string;
  recommendations?: string;

  nextMaintenanceDate?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

  attachments?: string[];
}

/**
 * Resource Filter Options
 */
export interface ResourceFilterOptions {
  type?: ResourceType[];
  category?: ResourceCategory[];
  status?: ResourceStatus[];
  location?: string[];
  availability?: {
    startDate: Date;
    endDate: Date;
  };
  skills?: string[];
  costRange?: {
    min: number;
    max: number;
  };
  searchTerm?: string;
}

/**
 * Resource Statistics
 */
export interface ResourceStatistics {
  total: number;
  byType: Record<ResourceType, number>;
  byCategory: Record<ResourceCategory, number>;
  byStatus: Record<ResourceStatus, number>;

  utilization: {
    average: number;
    high: number; // > 80%
    medium: number; // 50-80%
    low: number; // < 50%
  };

  costs: {
    totalMonthly: number;
    totalYearly: number;
    averagePerResource: number;
  };

  availability: {
    available: number;
    allocated: number;
    unavailable: number;
  };
}

export default Resource;
