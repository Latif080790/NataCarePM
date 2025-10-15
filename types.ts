export type Permission = 
    | 'view_dashboard'
    | 'view_rab'
    | 'edit_rab'
    | 'view_gantt'
    | 'view_daily_reports'
    | 'create_daily_reports'
    | 'view_progress'
    | 'update_progress'
    | 'view_attendance'
    | 'manage_attendance'
    | 'view_finances'
    | 'manage_expenses'
    | 'view_evm'
    | 'view_logistics'
    | 'manage_logistics'  // Added for Goods Receipt operations
    | 'create_po'
    | 'approve_po'
    | 'manage_inventory'
    | 'view_documents'
    | 'manage_documents'
    | 'view_reports'
    | 'view_users'
    | 'manage_users'
    | 'view_master_data'
    | 'manage_master_data'
    | 'view_audit_trail'
    | 'view_monitoring'
    | 'manage_monitoring';

export interface Role {
    id: string;
    name: string;
    permissions: Permission[];
}

export interface RabItem {
    id: number;
    no: string;
    uraian: string;
    volume: number;
    satuan: string;
    hargaSatuan: number;
    kategori: string;
    ahspId: string;
    duration?: number;
    dependsOn?: number;
    wbsElementId?: string;  // Link to WBS Element
}

// Enhanced RAB with detailed cost analysis
export interface EnhancedRabItem extends RabItem {
    // Cost breakdown components
    costBreakdown: CostBreakdown;
    
    // Price history and escalation
    priceHistory: PriceHistory[];
    escalationRate: number;
    
    // Variance analysis
    budgetVariance: VarianceAnalysis;
    
    // Sensitivity analysis
    sensitivityFactors: SensitivityFactor[];
    
    // Regional adjustments
    regionalFactors: RegionalPriceFactor[];
    
    // Enhanced metadata
    lastUpdated: string;
    updatedBy: string;
    dataSource: string;
}

export interface CostBreakdown {
    laborCost: number;
    laborPercentage: number;
    materialCost: number;
    materialPercentage: number;
    equipmentCost: number;
    equipmentPercentage: number;
    overheadCost: number;
    overheadPercentage: number;
    profitMargin: number;
    profitPercentage: number;
    totalCost: number;
}

export interface PriceHistory {
    id: string;
    date: string;
    price: number;
    supplier: string;
    location: string;
    marketCondition: 'stable' | 'rising' | 'falling' | 'volatile';
    dataSource: 'supplier_quote' | 'market_survey' | 'historical_data' | 'competitor_analysis';
    reliability: number; // 0-100 scale
    notes?: string;
}

export interface VarianceAnalysis {
    budgetedCost: number;
    actualCost: number;
    costVariance: number; // Actual - Budget
    costVariancePercentage: number;
    timeVariance: number; // Days ahead/behind schedule
    timeVariancePercentage: number;
    performanceIndex: number; // Efficiency ratio
    trend: 'improving' | 'deteriorating' | 'stable';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface SensitivityFactor {
    id: string;
    factor: string; // e.g., "Steel Price", "Labor Availability", "Weather"
    impact: number; // Percentage impact on total cost
    probability: number; // 0-100 probability of occurrence
    riskType: 'cost_increase' | 'cost_decrease' | 'schedule_delay' | 'quality_impact';
    mitigation: string;
    lastAssessment: string;
}

export interface RegionalPriceFactor {
    id: string;
    region: string;
    adjustmentFactor: number; // Multiplier (1.0 = baseline)
    category: 'labor' | 'material' | 'equipment' | 'overhead' | 'all';
    effectiveDate: string;
    expiryDate: string;
    reason: string; // e.g., "Remote location", "High demand area"
    isActive: boolean;
}

export interface User {
    uid: string; // Firebase UID
    id: string; // Application ID
    name: string;
    email: string;
    roleId: string; // Links to a Role
    avatarUrl: string;
    isOnline?: boolean;
    lastSeen?: string;
    permissions?: Permission[];
}

export interface Project {
    id: string;
    name: string;
    location: string;
    startDate: string;
    items: RabItem[];
    members: User[];
    dailyReports: DailyReport[];
    attendances: Attendance[];
    expenses: Expense[];
    documents: Document[];
    purchaseOrders: PurchaseOrder[];
    inventory: InventoryItem[];
    termins: Termin[];
    auditLog: AuditLog[];
    aiInsight?: AiInsight; // Optional AI-generated insight
}

export interface Workspace {
    id: string;
    name: string;
    projects: Project[];
}

export interface WorkProgress {
    rabItemId: number;
    completedVolume: number;
}

// Price Escalation Management
export interface PriceEscalation {
    id: string;
    rabItemId: number;
    escalationType: 'material' | 'labor' | 'equipment' | 'fuel' | 'overhead';
    basePrice: number;
    currentPrice: number;
    escalationRate: number; // Annual percentage
    projectedPrice: number;
    effectiveDate: string;
    projectionDate: string;
    marketFactors: MarketFactor[];
    escalationTriggers: EscalationTrigger[];
    isActive: boolean;
    lastCalculated: string;
}

export interface MarketFactor {
    id: string;
    factor: string; // e.g., "Inflation", "Oil Price", "Currency Exchange"
    currentValue: number;
    historicalValues: HistoricalValue[];
    weight: number; // Influence weight 0-1
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    source: string;
    lastUpdated: string;
}

export interface HistoricalValue {
    date: string;
    value: number;
    source: string;
}

export interface EscalationTrigger {
    id: string;
    triggerType: 'time_based' | 'percentage_based' | 'market_based' | 'manual';
    threshold: number;
    action: 'recalculate' | 'alert' | 'auto_adjust' | 'review_required';
    isActive: boolean;
    lastTriggered?: string;
}

// Enhanced Project with price analysis
export interface EnhancedProject extends Project {
    enhancedItems: EnhancedRabItem[];
    priceEscalations: PriceEscalation[];
    marketAnalysis: MarketAnalysis;
    riskProfile: ProjectRiskProfile;
    priceBaseline: PriceBaseline;
}

export interface MarketAnalysis {
    id: string;
    projectId: string;
    analysisDate: string;
    marketCondition: 'favorable' | 'neutral' | 'challenging' | 'volatile';
    keyRisks: string[];
    opportunities: string[];
    recommendations: string[];
    confidenceLevel: number; // 0-100
    nextReviewDate: string;
}

export interface ProjectRiskProfile {
    id: string;
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    costRisk: number; // Percentage potential cost increase
    scheduleRisk: number; // Percentage potential delay
    qualityRisk: number; // Risk score 0-100
    riskFactors: RiskFactor[];
    mitigationStrategies: MitigationStrategy[];
    lastAssessment: string;
}

export interface RiskFactor {
    id: string;
    category: 'technical' | 'financial' | 'environmental' | 'regulatory' | 'market';
    description: string;
    probability: number; // 0-100
    impact: number; // 0-100
    riskScore: number; // probability * impact
    status: 'identified' | 'monitored' | 'mitigated' | 'closed';
}

export interface MitigationStrategy {
    id: string;
    riskFactorId: string;
    strategy: string;
    cost: number;
    effectiveness: number; // 0-100
    status: 'planned' | 'implemented' | 'monitoring' | 'completed';
    responsiblePerson: string;
    targetDate: string;
}

export interface PriceBaseline {
    id: string;
    projectId: string;
    baselineDate: string;
    totalBaseline: number;
    categoryBaselines: Record<string, number>;
    escalationAssumptions: EscalationAssumption[];
    reviewSchedule: string[];
    approvedBy: string;
    version: string;
}

export interface EscalationAssumption {
    category: string;
    annualRate: number;
    rationale: string;
    marketBasis: string;
    confidenceLevel: number;
}

export interface MaterialConsumption {
    materialName: string;
    quantity: number;
    unit: string;
}

export interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    timestamp: string;
}

export interface DailyReport {
    id: string;
    date: string;
    weather: 'Cerah' | 'Berawan' | 'Hujan';
    notes: string;
    workforce: { workerId: string, workerName: string }[];
    workProgress: WorkProgress[];
    materialsConsumed: MaterialConsumption[];
    photos: string[];
    comments?: Comment[];
}

export interface Worker {
    id: string;
    name: string;
    type: 'Pekerja' | 'Tukang' | 'Mandor' | 'Kepala Tukang';
}

export interface Attendance {
    date: string;
    workerId: string;
    status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';
}

export interface Expense {
    id:string;
    description: string;
    amount: number;
    date: string;
    type: 'Material' | 'Alat' | 'Upah Tenaga Kerja' | 'Lain-lain';
    rabItemId?: number;
    wbsElementId?: string;  // Link to WBS Element
    invoiceId?: string; // Link to an invoice
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    poId: string;
    vendorId: string;
    amount: number;
    issueDate: string;
    dueDate: string;
    status: 'Belum Dibayar' | 'Dibayar Sebagian' | 'Lunas';
    payments: Payment[];
}

export interface Payment {
    id: string;
    amount: number;
    paymentDate: string;
    notes?: string;
}

export interface Vendor {
    id: string;
    name: string;
    category: string;
    contactPerson: string;
    phone: string;
}

export interface AhspData {
    labors: { [key: string]: { [workerType: string]: number } };
    materials: { [key: string]: { [materialName: string]: number } };
    laborRates: { [workerType: string]: number };
    materialPrices: { [materialName: string]: number };
    materialUnits: { [materialName: string]: string };
}

export interface ProjectMetrics {
    totalBudget: number;
    actualCost: number;
    plannedValue: number;
    earnedValue: number;
    remainingBudget: number;
    overallProgress: number;
    evm: {
        cpi: number;
        spi: number;
        sv: number;
        cv: number;
    };
    sCurveData: {
        planned: { day: number, cost: number }[];
        actual: { day: number, cost: number }[];
    };
}

export interface POItem {
    id?: string;  // Add for tracking
    materialCode?: string;  // Add for material reference
    materialName: string;
    description?: string;  // Add for better description
    quantity: number;
    unit: string;
    pricePerUnit: number;
    unitPrice?: number;  // Alias for pricePerUnit
    totalPrice: number;
    receivedQuantity?: number;  // Track received quantity for GR
    status?: 'pending' | 'partial' | 'completed';  // Item-level status
}

export interface PurchaseOrder {
    id: string;
    prNumber: string;
    poNumber?: string;
    status: 'Menunggu Persetujuan' | 'Disetujuan' | 'Ditolak' | 'PO Dibuat' | 'Dipesan' | 'Diterima Sebagian' | 'Diterima Penuh';
    items: POItem[];
    requester: string;
    requestDate: string;
    approver?: string;
    approvalDate?: string;
    vendorId?: string;
    vendorName?: string;  // Add vendor name for easy display
    totalAmount?: number;  // Add for total PO amount
    wbsElementId?: string;  // Link to WBS Element for cost tracking
    grnStatus?: 'Belum Diterima' | 'Sebagian Diterima' | 'Lengkap';
    notes?: string;
}

export interface InventoryItem {
    materialName: string;
    quantity: number;
    unit: string;
}

export interface Document {
    id: string; // Changed from number to string for consistency
    name: string;
    category: string;
    uploadDate: string;
    url: string;
}

export interface Termin {
    id: string;
    description: string;
    percentage: number;
    amount: number;
    date: string;
    status: 'Direncanakan' | 'Dibayar';
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    isRead: boolean;
    timestamp: string;
    linkTo?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    action: string; // e.g., "Created PO PR-12345", "Updated attendance for 2023-10-27"
}

export interface AiInsight {
    summary: string;
    risks: string[];
    predictions?: string;
    generatedAt: string;
    recommendations?: string[];
    timestamp?: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    parts: { text: string }[];
    createdAt: string;
    actionId?: string;
}

export interface AiAssistantAction {
    id: string;
    title: string;
    description: string;
    prompt: string;
    icon: string;
}

// Task Management Types
export interface Task {
    id: string;
    projectId: string;
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'review' | 'done' | 'blocked' | 'completed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    assignedTo: string[]; // User IDs
    createdBy: string; // User ID
    startDate?: string; // Task start date
    endDate?: string; // Task end date
    dueDate: string;
    dependencies: string[]; // Task IDs
    subtasks: Subtask[];
    progress: number; // 0-100
    tags: string[];
    rabItemId?: number; // Link to RAB item if applicable
    createdAt: string;
    updatedAt: string;
}

export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
    assignedTo?: string; // User ID
    completedAt?: string;
}

export interface TaskComment {
    id: string;
    taskId: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    timestamp: string;
}

// Financial Forecasting Types
export interface FinancialForecast {
    projectId: string;
    forecastDate: Date;
    timeframe: number; // months
    confidenceLevel: number;
    baseForecast: PredictiveModel;
    scenarios: ForecastScenario[];
    riskAssessment: RiskAssessment;
    cashFlowProjections: CashFlowProjection[];
    recommendations: string[];
    accuracy: number;
}

export interface PredictiveModel {
    type: 'linear_regression' | 'polynomial' | 'exponential' | 'seasonal';
    accuracy: number;
    projections: {
        period: number;
        projectedCost: number;
        cumulativeCost: number;
        confidence: number;
        variance: number;
    }[];
    parameters: {
        slope?: number;
        seasonality?: number[];
        volatility?: number;
        [key: string]: any;
    };
}

export interface ForecastScenario {
    name: string;
    probability: number;
    description: string;
    projections: {
        period: number;
        projectedCost: number;
        cumulativeCost: number;
        confidence?: number;
        variance?: number;
    }[];
    impactFactors: string[];
}

export interface RiskAssessment {
    overallRiskLevel: 'Low' | 'Medium' | 'High';
    costVariance: number;
    budgetAtRisk: number;
    probabilityOfOverrun: number;
    keyRiskFactors: {
        factor: string;
        impact: 'Low' | 'Medium' | 'High';
        probability: number;
        mitigation: string;
    }[];
    recommendations: string[];
    // Additional properties for component compatibility
    id?: string;
    documentId?: string;
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    factors?: string[];
    mitigation?: string[];
    mitigationStrategies?: string[];
    complianceIssues?: string[];
    assessedAt?: Date;
    assessedBy?: string;
}

export interface CashFlowProjection {
    period: number;
    plannedInflow: number;
    plannedOutflow: number;
    optimisticInflow: number;
    pessimisticInflow: number;
    netCashFlow: number;
    cumulativeCashFlow: number;
    workingCapitalRequired: number;
    paymentTiming: number;
}

// EVM (Earned Value Management) Types
export interface EVMMetrics {
    projectId: string;
    reportDate: Date;
    plannedValue: number; // PV - Planned Value
    earnedValue: number; // EV - Earned Value
    actualCost: number; // AC - Actual Cost
    budgetAtCompletion: number; // BAC - Budget at Completion
    
    // Performance Indices
    costPerformanceIndex: number; // CPI = EV/AC
    schedulePerformanceIndex: number; // SPI = EV/PV
    
    // Variances
    costVariance: number; // CV = EV - AC
    scheduleVariance: number; // SV = EV - PV
    
    // Forecasts
    estimateAtCompletion: number; // EAC
    estimateToComplete: number; // ETC
    varianceAtCompletion: number; // VAC = BAC - EAC
    
    // Time-based metrics
    timeVariance: number; // TV in days
    estimatedTimeToComplete: number; // days
    
    // Performance status
    performanceStatus: 'On Track' | 'At Risk' | 'Critical';
    healthScore: number; // 0-100
}

export interface EVMTrendData {
    date: Date;
    plannedValue: number;
    earnedValue: number;
    actualCost: number;
    cpi: number;
    spi: number;
}

export interface KPIMetrics {
    // Financial KPIs
    budgetUtilization: number; // percentage
    costVariancePercentage: number;
    returnOnInvestment: number;
    
    // Schedule KPIs
    scheduleVariancePercentage: number;
    taskCompletionRate: number;
    milestoneAdherence: number;
    
    // Quality KPIs
    defectRate: number;
    reworkPercentage: number;
    qualityScore: number;
    
    // Resource KPIs
    resourceUtilization: number;
    productivityIndex: number;
    teamEfficiency: number;
    
    // Risk KPIs
    riskExposure: number;
    issueResolutionTime: number;
    contingencyUtilization: number;
    
    // Overall performance
    overallHealthScore: number;
    performanceTrend: 'Improving' | 'Stable' | 'Declining';
}

// ==================== INTELLIGENT DOCUMENT SYSTEM ====================

// AI-Powered OCR Types
export interface OCRResult {
    id: string;
    documentId: string;
    extractedText: string;
    confidence: number;
    boundingBoxes: BoundingBox[];
    extractedData: ExtractedData;
    processingTime: number;
    timestamp: Date;
    status: 'processing' | 'completed' | 'failed';
    errorMessage?: string;
    // Additional properties for component compatibility
    structuredData?: { [key: string]: any };
    language?: string;
}

export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    confidence: number;
    fieldType?: string;
}

export interface ExtractedData {
    // Construction Document Fields
    projectName?: string;
    contractNumber?: string;
    dates?: ExtractedDate[];
    amounts?: ExtractedAmount[];
    materials?: ExtractedMaterial[];
    personnel?: ExtractedPersonnel[];
    coordinates?: ExtractedCoordinate[];
    specifications?: ExtractedSpecification[];
    signatures?: ExtractedSignature[];
    tables?: ExtractedTable[];
    customFields?: { [key: string]: any };
}

export interface ExtractedDate {
    value: string;
    confidence: number;
    type: 'start_date' | 'end_date' | 'milestone' | 'deadline' | 'other';
    boundingBox: BoundingBox;
}

export interface ExtractedAmount {
    value: number;
    currency: string;
    confidence: number;
    type: 'total_cost' | 'material_cost' | 'labor_cost' | 'equipment_cost' | 'other';
    boundingBox: BoundingBox;
}

export interface ExtractedMaterial {
    name: string;
    quantity: number;
    unit: string;
    unitPrice?: number;
    confidence: number;
    boundingBox: BoundingBox;
}

export interface ExtractedPersonnel {
    name: string;
    role: string;
    contact?: string;
    confidence: number;
    boundingBox: BoundingBox;
}

export interface ExtractedCoordinate {
    latitude?: number;
    longitude?: number;
    elevation?: number;
    description: string;
    confidence: number;
    boundingBox: BoundingBox;
}

export interface ExtractedSpecification {
    category: string;
    description: string;
    value?: string;
    unit?: string;
    confidence: number;
    boundingBox: BoundingBox;
}

export interface ExtractedSignature {
    signerName?: string;
    signatureDate?: string;
    role?: string;
    confidence: number;
    boundingBox: BoundingBox;
    isValid: boolean;
}

export interface ExtractedTable {
    headers: string[];
    rows: string[][];
    confidence: number;
    boundingBox: BoundingBox;
    category?: string;
}

// Smart Templates Types
export interface DocumentTemplate {
    id: string;
    name: string;
    category: TemplateCategory;
    description: string;
    version: string;
    structure: TemplateStructure;
    dataMapping: DataMapping[];
    outputFormat: OutputFormat;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    tags: string[];
    metadata: TemplateMetadata;
    // Additional properties for component compatibility
    content?: string;
    variables?: TemplateVariable[];
    isPublic?: boolean;
    usageCount?: number;
}

export type TemplateCategory = 
    | 'contract'
    | 'specification'
    | 'drawing'
    | 'report'
    | 'permit'
    | 'invoice'
    | 'certificate'
    | 'correspondence'
    | 'procedure'
    | 'policy'
    | 'progress_report' 
    | 'financial_report' 
    | 'safety_report' 
    | 'quality_report'
    | 'material_report'
    | 'compliance_report'
    | 'contract_document'
    | 'inspection_report'
    | 'custom'
    | 'other';

export interface TemplateStructure {
    sections: TemplateSection[];
    header?: TemplateHeader;
    footer?: TemplateFooter;
    styling: TemplateStyle;
}

export interface TemplateSection {
    id: string;
    title: string;
    order: number;
    type: 'text' | 'table' | 'chart' | 'image' | 'signature' | 'dynamic';
    content?: string;
    dataSource?: string;
    isRequired: boolean;
    conditions?: TemplateCondition[];
    formatting: SectionFormatting;
}

export interface TemplateHeader {
    content: string;
    includeDate: boolean;
    includeLogo: boolean;
    includeProjectInfo: boolean;
    formatting: SectionFormatting;
}

export interface TemplateFooter {
    content: string;
    includePageNumbers: boolean;
    includeSignatures: boolean;
    formatting: SectionFormatting;
}

export interface TemplateStyle {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    margins: { top: number; right: number; bottom: number; left: number; };
    colors: { primary: string; secondary: string; text: string; background: string; };
    spacing: { section: number; paragraph: number; };
}

export interface DataMapping {
    templateFieldId: string;
    dataSource: string;
    fieldPath: string;
    transformation?: DataTransformation;
    defaultValue?: any;
    validation?: ValidationRule[];
}

export interface DataTransformation {
    type: 'format' | 'calculate' | 'aggregate' | 'filter' | 'custom';
    parameters: { [key: string]: any };
    customFunction?: string;
}

export interface ValidationRule {
    type: 'required' | 'type' | 'range' | 'pattern' | 'custom';
    parameters: { [key: string]: any };
    errorMessage: string;
}

export interface TemplateCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists';
    value: any;
    action: 'show' | 'hide' | 'required' | 'optional';
}

export interface SectionFormatting {
    alignment: 'left' | 'center' | 'right' | 'justify';
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    color?: string;
    backgroundColor?: string;
    padding?: { top: number; right: number; bottom: number; left: number; };
    border?: BorderStyle;
}

export interface BorderStyle {
    width: number;
    style: 'solid' | 'dashed' | 'dotted';
    color: string;
}

export type OutputFormat = 'pdf' | 'docx' | 'html' | 'xlsx' | 'json';

export interface TemplateMetadata {
    industry: string;
    regulatory: string[];
    language: string;
    region: string;
    lastUsed?: Date;
    usageCount: number;
    rating?: number;
    reviews?: TemplateReview[];
}

export interface TemplateReview {
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    date: Date;
}

// Digital Signatures Types
export type SignatureStandard = 'eidas' | 'esign' | 'ueta' | 'indonesia' | 'custom';
export type SignatureMethod = 'digital' | 'electronic' | 'biometric';

export interface TemplateVariable {
    name: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'list';
    defaultValue?: any;
    description?: string;
    required?: boolean;
    validation?: string;
}

export interface ComplianceRule {
    id: string;
    name: string;
    description: string;
    type: 'mandatory' | 'optional' | 'conditional';
    severity: 'low' | 'medium' | 'high' | 'critical';
    checkFunction: (document: any) => boolean;
}

// This interface is duplicated - see the main RiskAssessment interface above

export interface DigitalSignature {
    id: string;
    documentId: string;
    documentVersionId: string;
    signerInfo: SignerInfo;
    signatureData: SignatureData;
    certificate: SignatureCertificate;
    timestamp: Date;
    status: SignatureStatus;
    metadata: SignatureMetadata;
    verification: SignatureVerification;
    legalCompliance: LegalCompliance;
    // Additional properties for component compatibility
    isRevoked?: boolean;
    expiresAt?: Date;
    isValid?: boolean;
    signerName?: string;
    signerEmail?: string;
    signedAt?: Date;
    standard?: SignatureStandard;
    signatureMethod?: SignatureMethod;
    certificateId?: string;
    algorithm?: string;
    reason?: string;
}

export interface SignerInfo {
    userId: string;
    name: string;
    email: string;
    role: string;
    organization: string;
    ipAddress: string;
    deviceInfo: string;
    location?: GeolocationCoordinates;
    authMethod: 'password' | 'otp' | 'biometric' | 'certificate';
}

export interface SignatureData {
    type: 'digital' | 'electronic' | 'biometric';
    data: string; // Base64 encoded signature data
    algorithm: string;
    hashValue: string;
    encryptionKey?: string;
    biometricData?: BiometricData;
}

export interface BiometricData {
    type: 'fingerprint' | 'face' | 'voice' | 'handwriting';
    template: string;
    confidence: number;
    quality: number;
}

export interface SignatureCertificate {
    id: string;
    issuer: string;
    subject: string;
    serialNumber: string;
    validFrom: Date;
    validTo: Date;
    algorithm: string;
    publicKey: string;
    certificateChain: string[];
    revocationStatus: 'valid' | 'revoked' | 'expired' | 'unknown';
    trustLevel: 'high' | 'medium' | 'low';
}

export type SignatureStatus = 
    | 'pending' 
    | 'signed' 
    | 'verified' 
    | 'invalid' 
    | 'expired' 
    | 'revoked'
    | 'disputed';

export interface SignatureMetadata {
    reason: string;
    location: string;
    contactInfo: string;
    signingTime: Date;
    timeStampAuthority?: string;
    documentHash: string;
    pageNumber?: number;
    signatureBox?: BoundingBox;
    workflow: SignatureWorkflow;
}

export interface SignatureWorkflow {
    workflowId: string;
    step: number;
    totalSteps: number;
    nextSigners: string[];
    completedSigners: string[];
    isRequired: boolean;
    deadline?: Date;
    reminderSchedule?: Date[];
    // Additional properties for component compatibility
    id?: string;
    documentId?: string;
    requiredSigners?: string[];
    signatures?: DigitalSignature[];
    title?: string;
    description?: string;
    createdBy?: string;
    createdAt?: Date;
    isCompleted?: boolean;
    isCancelled?: boolean;
}

export interface SignatureVerification {
    isValid: boolean;
    verifiedAt: Date;
    verifiedBy: string;
    verificationMethod: string;
    integrityCheck: boolean;
    certificateValid: boolean;
    timestampValid: boolean;
    revocationChecked: boolean;
    errors: string[];
    warnings: string[];
    verificationReport: string;
}

export interface LegalCompliance {
    standard: 'eIDAS' | 'ESIGN' | 'UETA' | 'ISO27001' | 'SOX' | 'custom';
    level: 'basic' | 'advanced' | 'qualified';
    jurisdiction: string;
    auditTrail: AuditTrailEntry[];
    retention: RetentionPolicy;
    dataProtection: DataProtectionCompliance;
}

export interface RetentionPolicy {
    retentionPeriod: number; // in years
    archivalLocation: string;
    destructionDate?: Date;
    legalHold: boolean;
}

export interface DataProtectionCompliance {
    gdprCompliant: boolean;
    dataProcessingBasis: string;
    consentTimestamp?: Date;
    dataSubjectRights: string[];
    crossBorderTransfer: boolean;
    adequacyDecision?: string;
}

// Document Version Control Types
export interface DocumentVersion {
    id: string;
    documentId: string;
    versionNumber: string;
    majorVersion: number;
    minorVersion: number;
    patchVersion: number;
    parentVersionId?: string;
    branchName: string;
    commitMessage: string;
    authorId: string;
    authorName: string;
    timestamp: Date;
    fileMetadata: FileMetadata;
    contentHash: string;
    changeSet: ChangeSet[];
    status: VersionStatus;
    tags: VersionTag[];
    mergeInfo?: MergeInfo;
    conflictResolution?: ConflictResolution[];
    // Additional properties for component compatibility
    comment?: string;
    createdBy?: string;
    createdAt?: Date;
}

export interface FileMetadata {
    fileName: string;
    fileSize: number;
    mimeType: string;
    encoding: string;
    checksum: string;
    storageLocation: string;
    compressionRatio?: number;
    encryptionInfo?: EncryptionInfo;
}

export interface EncryptionInfo {
    algorithm: string;
    keyId: string;
    isEncrypted: boolean;
    encryptionLevel: 'none' | 'transport' | 'storage' | 'end-to-end';
}

export interface ChangeSet {
    type: 'insert' | 'delete' | 'modify' | 'move' | 'rename';
    path: string;
    oldValue?: any;
    newValue?: any;
    lineNumber?: number;
    characterPosition?: number;
    metadata?: { [key: string]: any };
}

export type VersionStatus = 
    | 'draft' 
    | 'review' 
    | 'approved' 
    | 'published' 
    | 'archived' 
    | 'deprecated'
    | 'locked';

export interface VersionTag {
    name: string;
    type: 'release' | 'milestone' | 'feature' | 'hotfix' | 'custom';
    description?: string;
    metadata?: { [key: string]: any };
}

export interface MergeInfo {
    fromBranch: string;
    toBranch: string;
    mergeStrategy: 'fast-forward' | 'recursive' | 'ours' | 'theirs' | 'manual';
    conflictsDetected: boolean;
    mergedAt: Date;
    mergedBy: string;
    mergeCommitId: string;
}

export interface ConflictResolution {
    conflictType: 'content' | 'metadata' | 'structure' | 'permission';
    conflictPath: string;
    resolution: 'accept_current' | 'accept_incoming' | 'merge_manual' | 'custom';
    resolvedBy: string;
    resolvedAt: Date;
    resolutionDetails: string;
}

export interface DocumentBranch {
    id: string;
    name: string;
    documentId: string;
    parentBranchId?: string;
    createdBy: string;
    createdAt: Date;
    lastCommitId: string;
    lastActivityAt: Date;
    isDefault: boolean;
    isProtected: boolean;
    mergeRules: MergeRule[];
    access: BranchAccess;
    status: 'active' | 'merged' | 'abandoned' | 'protected';
}

export interface MergeRule {
    type: 'require_review' | 'require_approval' | 'require_signature' | 'auto_merge';
    condition: string;
    approvers?: string[];
    minimumApprovals?: number;
}

export interface BranchAccess {
    canRead: string[];
    canWrite: string[];
    canMerge: string[];
    canDelete: string[];
    inheritFromParent: boolean;
}

// Main Document System Types
export interface IntelligentDocument {
    id: string;
    title: string;
    description?: string;
    category: DocumentCategory;
    projectId: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    
    // File Information
    currentVersionId: string;
    allVersions: DocumentVersion[];
    branches: DocumentBranch[];
    
    // AI & OCR
    ocrResults: OCRResult[];
    extractedData: ExtractedData;
    aiInsights: AIInsight[];
    
    // Templates & Generation
    templateId?: string;
    generatedFromTemplate: boolean;
    autoGenerationSettings?: AutoGenerationSettings;
    
    // Digital Signatures
    signatures: DigitalSignature[];
    signatureWorkflow?: SignatureWorkflow;
    requiresSignature: boolean;
    
    // Security & Compliance
    accessControl: DocumentAccessControl;
    encryptionStatus: EncryptionInfo;
    complianceInfo: ComplianceInfo;
    auditTrail: AuditTrailEntry[];
    
    // Metadata & Classification
    tags: string[];
    customFields: { [key: string]: any };
    relatedDocuments: string[];
    dependencies: DocumentDependency[];
    
    // Status & Workflow
    status: DocumentStatus;
    workflow: DocumentWorkflow;
    notifications: DocumentNotification[];
    
    // Additional properties for component compatibility
    collaborators?: string[];
    fileSize: number;
    mimeType: string;
    checksum: string;
    
    // Search & Discovery
    searchableContent: string;
    keywords: string[];
    language: string;
    region: string;
}

export type DocumentCategory = 
    | 'contract'
    | 'specification'
    | 'drawing'
    | 'report'
    | 'permit'
    | 'invoice'
    | 'certificate'
    | 'correspondence'
    | 'procedure'
    | 'policy'
    | 'progress_report' 
    | 'financial_report' 
    | 'safety_report' 
    | 'quality_report'
    | 'material_report'
    | 'compliance_report'
    | 'contract_document'
    | 'inspection_report'
    | 'custom'
    | 'other'
    | 'policy'
    | 'other';

export interface AIInsight {
    id: string;
    type: 'summary' | 'risk_analysis' | 'compliance_check' | 'anomaly_detection' | 'recommendation';
    title: string;
    description: string;
    confidence: number;
    relevantSections: string[];
    actionItems: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'new' | 'reviewed' | 'acknowledged' | 'resolved' | 'dismissed';
    generatedAt: Date;
    metadata: { [key: string]: any };
    // Additional properties for component compatibility
    recommendations?: string[];
    affectedSections?: string[];
}

export interface AutoGenerationSettings {
    frequency: 'manual' | 'daily' | 'weekly' | 'monthly' | 'on_data_change';
    dataSources: string[];
    triggers: GenerationTrigger[];
    outputFormat: OutputFormat;
    distribution: DistributionSettings;
}

export interface GenerationTrigger {
    type: 'data_threshold' | 'time_based' | 'event_based' | 'user_action';
    condition: string;
    parameters: { [key: string]: any };
}

export interface DistributionSettings {
    recipients: string[];
    deliveryMethod: 'email' | 'portal' | 'api' | 'print';
    schedule?: DistributionSchedule;
}

export interface DistributionSchedule {
    frequency: string;
    time: string;
    timezone: string;
    excludeWeekends: boolean;
    excludeHolidays: boolean;
}

export interface DocumentAccessControl {
    visibility: 'public' | 'internal' | 'restricted' | 'confidential';
    permissions: DocumentPermission[];
    inheritFromProject: boolean;
    watermark?: WatermarkSettings;
    downloadRestrictions: DownloadRestriction[];
}

export interface DocumentPermission {
    userId: string;
    userName: string;
    role: string;
    permissions: DocumentAction[];
    grantedBy: string;
    grantedAt: Date;
    expiresAt?: Date;
    conditions?: PermissionCondition[];
}

export type DocumentAction = 
    | 'view' 
    | 'download' 
    | 'edit' 
    | 'comment' 
    | 'share' 
    | 'delete' 
    | 'version' 
    | 'sign' 
    | 'approve';

export interface PermissionCondition {
    type: 'ip_range' | 'time_window' | 'device_type' | 'location' | 'vpn_required';
    parameters: { [key: string]: any };
}

export interface WatermarkSettings {
    text: string;
    opacity: number;
    position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    fontSize: number;
    color: string;
    includeTimestamp: boolean;
    includeUserInfo: boolean;
}

export interface DownloadRestriction {
    maxDownloads?: number;
    timeWindow?: number; // hours
    requiresApproval: boolean;
    allowedFormats: string[];
    includeWatermark: boolean;
}

export interface ComplianceInfo {
    standards: ComplianceStandard[];
    certifications: string[];
    retentionPolicy: RetentionPolicy;
    dataClassification: DataClassification;
    regulatoryRequirements: RegulatoryRequirement[];
}

export interface ComplianceStandard {
    name: string;
    version: string;
    applicable: boolean;
    lastChecked: Date;
    complianceLevel: 'compliant' | 'partial' | 'non_compliant' | 'unknown';
    findings: ComplianceFinding[];
}

export interface ComplianceFinding {
    type: 'violation' | 'warning' | 'recommendation';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    remediation: string;
    dueDate?: Date;
    status: 'open' | 'in_progress' | 'resolved' | 'waived';
}

export type DataClassification = 
    | 'public' 
    | 'internal' 
    | 'confidential' 
    | 'restricted' 
    | 'top_secret';

export interface RegulatoryRequirement {
    regulation: string;
    jurisdiction: string;
    applicability: string;
    requirements: string[];
    complianceDeadline?: Date;
    status: 'compliant' | 'pending' | 'non_compliant';
}

export interface DocumentDependency {
    dependentDocumentId: string;
    dependencyType: 'reference' | 'prerequisite' | 'derived_from' | 'supersedes' | 'related';
    description?: string;
    isRequired: boolean;
    lastChecked: Date;
    status: 'valid' | 'broken' | 'outdated' | 'circular';
}

export type DocumentStatus = 
    | 'draft' 
    | 'in_review' 
    | 'pending_approval' 
    | 'approved' 
    | 'published' 
    | 'superseded' 
    | 'archived' 
    | 'deleted';

export interface DocumentWorkflow {
    workflowId: string;
    currentStep: number;
    totalSteps: number;
    steps: WorkflowStep[];
    isCompleted: boolean;
    canSkipSteps: boolean;
    escalationRules: EscalationRule[];
}

export interface WorkflowStep {
    stepNumber: number;
    name: string;
    description: string;
    assignedTo: string[];
    requiredActions: DocumentAction[];
    deadline?: Date;
    isCompleted: boolean;
    completedBy?: string;
    completedAt?: Date;
    comments?: string;
    attachments?: string[];
}

export interface EscalationRule {
    condition: string;
    delayHours: number;
    escalateTo: string[];
    actionType: 'notify' | 'reassign' | 'auto_approve' | 'cancel';
}

export interface DocumentNotification {
    id: string;
    type: 'new_version' | 'review_required' | 'approval_needed' | 'signature_pending' | 'deadline_approaching' | 'workflow_completed';
    recipientId: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    isRead: boolean;
    sentAt: Date;
    readAt?: Date;
    actionRequired: boolean;
    actionDeadline?: Date;
    relatedUrl?: string;
}

export interface AuditTrailEntry {
    id: string;
    timestamp: Date;
    userId: string;
    userName: string;
    action: string;
    resourceType: string;
    resourceId: string;
    details: { [key: string]: any };
    ipAddress: string;
    userAgent: string;
    sessionId: string;
    result: 'success' | 'failure' | 'partial';
    errorMessage?: string;
}
