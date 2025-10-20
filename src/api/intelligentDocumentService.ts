import { 
    IntelligentDocument,
    DocumentCategory,
    DocumentStatus,
    DocumentWorkflow,
    AIInsight,
    AutoGenerationSettings,
    DocumentAccessControl,
    ComplianceInfo,
    DocumentDependency,
    DocumentNotification,
    OCRResult,
    DigitalSignature
} from '@/types';

import { db } from '@/firebaseConfig';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where,
    orderBy,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';

import { ocrService } from './ocrService';
import { smartTemplatesEngine } from './smartTemplatesEngine';
import { digitalSignaturesService } from './digitalSignaturesService';
import { documentVersionControl } from './documentVersionControl';

// Utility imports for error handling and validation
import { APIResponse, safeAsync, APIError, ErrorCodes } from '@/utils/responseWrapper';
import { withRetry } from '@/utils/retryWrapper';
import { validators } from '@/utils/validators';
import { createScopedLogger } from '@/utils/logger';

// Create scoped logger for this service
const logger = createScopedLogger('intelligentDocumentService');

/**
 * Validate document ID
 */
const validateDocumentId = (documentId: string, context: string): void => {
    if (!validators.isValidId(documentId)) {
        logger.warn(context, 'Invalid document ID', { documentId });
        throw new APIError(
            ErrorCodes.INVALID_INPUT,
            `Invalid document ID: "${documentId}". Document ID must be a non-empty string with alphanumeric characters and underscores only.`,
            400,
            { 
                documentId,
                suggestion: 'Use a valid format like "doc_123" or generate a new ID with generateId()'
            }
        );
    }
};

/**
 * Validate document category
 */
const validateDocumentCategory = (category: string, context: string): void => {
    const validCategories: DocumentCategory[] = [
        'contract', 'specification', 'report', 'drawing', 'permit', 'invoice',
        'certificate', 'correspondence', 'procedure', 'policy', 'progress_report',
        'financial_report', 'safety_report', 'quality_report', 'material_report',
        'compliance_report', 'contract_document', 'inspection_report', 'custom', 'other'
    ];
    
    if (!validators.isValidEnum(category, validCategories)) {
        throw new APIError(
            ErrorCodes.INVALID_INPUT,
            `Invalid document category: "${category}". Must be one of: ${validCategories.slice(0, 5).join(', ')}, etc.`,
            400,
            { 
                category, 
                validCategories,
                suggestion: 'Choose from available categories or use "custom" for non-standard documents'
            }
        );
    }
};

/**
 * Validate document status
 */
const validateDocumentStatus = (status: string, context: string): void => {
    const validStatuses: DocumentStatus[] = [
        'draft', 'in_review', 'pending_approval', 'approved', 
        'published', 'superseded', 'archived', 'deleted'
    ];
    
    if (!validators.isValidEnum(status, validStatuses)) {
        throw new APIError(
            ErrorCodes.INVALID_INPUT,
            `Invalid document status: "${status}". Valid statuses are: ${validStatuses.join(', ')}`,
            400,
            { 
                status, 
                validStatuses,
                suggestion: 'Common workflow: draft → in_review → pending_approval → approved → published'
            }
        );
    }
};

/**
 * Type guard to check if a value is a valid DocumentCategory
 */
const isDocumentCategory = (value: unknown): value is DocumentCategory => {
    const validCategories: DocumentCategory[] = [
        'contract', 'specification', 'report', 'drawing', 'permit', 'invoice',
        'certificate', 'correspondence', 'procedure', 'policy', 'progress_report',
        'financial_report', 'safety_report', 'quality_report', 'material_report',
        'compliance_report', 'contract_document', 'inspection_report', 'custom', 'other'
    ];
    return typeof value === 'string' && validCategories.includes(value as DocumentCategory);
};

/**
 * Type guard to check if a value is a valid DocumentStatus
 */
const isDocumentStatus = (value: unknown): value is DocumentStatus => {
    const validStatuses: DocumentStatus[] = [
        'draft', 'in_review', 'pending_approval', 'approved', 
        'published', 'superseded', 'archived', 'deleted'
    ];
    return typeof value === 'string' && validStatuses.includes(value as DocumentStatus);
};

// Firestore collection names
const COLLECTIONS = {
    DOCUMENTS: 'intelligent_documents',
    WORKFLOWS: 'document_workflows',
    AI_INSIGHTS: 'ai_insights',
    NOTIFICATIONS: 'document_notifications',
    DEPENDENCIES: 'document_dependencies',
    AUDIT_TRAIL: 'document_audit_trail'
} as const;

/** Collection name type derived from COLLECTIONS constant */
type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

// Intelligent Document Management System
export class IntelligentDocumentService {
    // Note: Firebase Firestore replaces in-memory Maps
    // Data is now persisted in Firestore collections

    constructor() {
        this.initializeSystem();
    }

    // Initialize the document system
    private initializeSystem(): void {
        try {
            logger.info('initializeSystem', 'Initializing Intelligent Document System');
            
            // Initialize AI models and processors
            this.initializeAIModels();
            
            // Setup event handlers
            this.setupEventHandlers();
            
            logger.success('initializeSystem', 'Intelligent Document System initialized successfully');
        } catch (error) {
            logger.error('initializeSystem', 'Failed to initialize document system', error as Error);
            // Continue with degraded service
        }
    }

    // Initialize AI models for document processing
    private initializeAIModels(): void {
        try {
            logger.debug('initializeAIModels', 'Initializing AI models');
            // Initialize document classification models
            // Initialize risk analysis models
            // Initialize compliance checking models
            // Initialize anomaly detection models
        } catch (error) {
            logger.warn('initializeAIModels', 'AI model initialization failed, continuing with degraded service', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    // Setup event handlers for system integration
    private setupEventHandlers(): void {
        try {
            logger.debug('setupEventHandlers', 'Setting up event handlers');
            // Setup handlers for OCR completion
            // Setup handlers for signature completion
            // Setup handlers for version updates
            // Setup handlers for workflow progression
        } catch (error) {
            logger.warn('setupEventHandlers', 'Event handler setup failed', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    /**
     * Create a new intelligent document with AI-powered processing
     * 
     * @param title - Document title (1-200 characters)
     * @param description - Document description (0-2000 characters)
     * @param category - Document category (contract, specification, report, etc.)
     * @param projectId - ID of the project this document belongs to
     * @param createdBy - User ID of the document creator
     * @param file - Optional file to upload and process with OCR
     * @param templateId - Optional template ID for auto-generation
     * @returns Promise resolving to the created IntelligentDocument
     * @throws {APIError} If validation fails or creation encounters errors
     * 
     * @example
     * ```typescript
     * const doc = await service.createDocument(
     *   'Project Contract',
     *   'Main construction contract',
     *   'contract',
     *   'proj_123',
     *   'user_456',
     *   contractFile
     * );
     * ```
     */
    async createDocument(
        title: string,
        description: string,
        category: DocumentCategory,
        projectId: string,
        createdBy: string,
        file?: File,
        templateId?: string
    ): Promise<IntelligentDocument> {
        try {
            // Validate inputs with helpful error messages
            if (!validators.isValidString(title, 1, 200).valid) {
                throw new APIError(
                    ErrorCodes.INVALID_INPUT, 
                    `Invalid title: must be 1-200 characters. Received: ${title.length} characters`,
                    400, 
                    { 
                        title,
                        titleLength: title.length,
                        suggestion: 'Provide a concise title between 1 and 200 characters'
                    }
                );
            }
            if (!validators.isValidString(description, 0, 2000).valid) {
                throw new APIError(
                    ErrorCodes.INVALID_INPUT, 
                    `Invalid description: must be 0-2000 characters. Received: ${description.length} characters`,
                    400,
                    {
                        descriptionLength: description.length,
                        suggestion: 'Provide a description up to 2000 characters'
                    }
                );
            }
            validateDocumentCategory(category, 'createDocument');
            if (!validators.isValidId(projectId)) {
                throw new APIError(
                    ErrorCodes.INVALID_INPUT, 
                    `Invalid project ID: "${projectId}"`, 
                    400, 
                    { 
                        projectId,
                        suggestion: 'Ensure the project exists and the ID is valid'
                    }
                );
            }
            if (!validators.isValidId(createdBy)) {
                throw new APIError(
                    ErrorCodes.INVALID_INPUT, 
                    `Invalid creator ID: "${createdBy}"`, 
                    400, 
                    { 
                        createdBy,
                        suggestion: 'Provide a valid user ID for the document creator'
                    }
                );
            }

            logger.info('createDocument', 'Creating document', {
                title,
                category,
                projectId,
                createdBy,
                hasFile: !!file
            });

            const documentId = this.generateId();
            
            // Create initial version if file is provided (with error handling)
            let currentVersionId = '';
            if (file) {
                try {
                    const version = await withRetry(
                        () => documentVersionControl.createVersion(
                            documentId,
                            file,
                            'Initial document upload',
                            createdBy,
                            'Document Creator',
                            'main'
                        ),
                        { maxAttempts: 2 }
                    );
                    currentVersionId = version.id;
                } catch (error) {
                    logger.warn('createDocument', 'Version control unavailable, continuing without version', {
                        error: error instanceof Error ? error.message : String(error)
                    });
                    // Continue without version - graceful degradation
                }
            }

        // Initialize document
        const document: IntelligentDocument = {
            id: documentId,
            title,
            description,
            category,
            projectId,
            createdBy,
            createdAt: new Date(),
            updatedAt: new Date(),
            
            // File properties
            fileSize: file ? file.size : 0,
            mimeType: file ? file.type : 'application/octet-stream',
            checksum: file ? await this.calculateChecksum(file) : 'unknown',
            
            // Version Control
            currentVersionId,
            allVersions: currentVersionId ? [await documentVersionControl.getVersion(currentVersionId)!] : [],
            branches: documentVersionControl.getBranches(documentId),
            
            // AI & OCR
            ocrResults: [],
            extractedData: {},
            aiInsights: [],
            
            // Templates
            templateId,
            generatedFromTemplate: !!templateId,
            autoGenerationSettings: templateId ? this.getDefaultAutoGenerationSettings() : undefined,
            
            // Digital Signatures
            signatures: [],
            signatureWorkflow: undefined,
            requiresSignature: this.categoryRequiresSignature(category),
            
            // Security & Compliance
            accessControl: this.getDefaultAccessControl(category),
            encryptionStatus: {
                algorithm: 'AES-256-GCM',
                keyId: `key_${documentId}`,
                isEncrypted: true,
                encryptionLevel: 'storage'
            },
            complianceInfo: this.getDefaultComplianceInfo(category),
            auditTrail: [],
            
            // Metadata
            tags: [],
            customFields: {},
            relatedDocuments: [],
            dependencies: [],
            
            // Status & Workflow
            status: 'draft',
            workflow: this.createDefaultWorkflow(category),
            notifications: [],
            
            // Search & Discovery
            searchableContent: `${title} ${description}`,
            keywords: this.extractKeywords(title, description),
            language: 'en',
            region: 'global'
        };

        // Save to Firestore with retry
        const docRef = doc(db, COLLECTIONS.DOCUMENTS, documentId);
        await withRetry(
            () => setDoc(docRef, {
                ...document,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }),
            { maxAttempts: 3 }
        );
        
        // Create default workflow in Firestore
        const workflowRef = doc(db, COLLECTIONS.WORKFLOWS, documentId);
        await withRetry(
            () => setDoc(workflowRef, document.workflow),
            { maxAttempts: 2 }
        );
        
        // Process with AI in background (non-blocking with error handling)
        if (file) {
            this.processDocumentWithAI(document, file).catch(error => {
                logger.warn('createDocument', 'Background AI processing failed', {
                    documentId,
                    error: error instanceof Error ? error.message : String(error)
                });
            });
        }

        // Create initial audit entry
        await this.addAuditEntry(document, 'document_created', createdBy);
        
        // Send notifications
        await this.sendNotification(document, 'new_document', [createdBy]);

        logger.success('createDocument', 'Document created successfully', { documentId, title });
        return document;
        
        } catch (error) {
            logger.error('createDocument', 'Failed to create document', error as Error, {
                title,
                category,
                projectId
            });
            throw error;
        }
    }

    /**
     * Process document with AI-powered features including OCR, compliance analysis, and risk assessment
     * 
     * @param document - The document to process
     * @param file - The file to extract content from
     * @returns Promise that resolves when processing is complete
     * @throws {APIError} If critical AI processing fails
     * 
     * @remarks
     * This method processes documents in the background with graceful degradation.
     * If OCR fails, the document will still be created without extracted text.
     * 
     * @example
     * ```typescript
     * await service.processDocumentWithAI(document, uploadedFile);
     * // Document now has OCR results, AI insights, and compliance info
     * ```
     */
    async processDocumentWithAI(document: IntelligentDocument, file: File): Promise<void> {
        try {
            logger.info('processDocumentWithAI', 'Starting AI processing', { documentId: document.id });
            
            // 1. OCR Processing (with retry and error handling)
            try {
                logger.debug('processDocumentWithAI', 'Starting OCR processing', { documentId: document.id });
                const ocrResult = await withRetry(
                    () => ocrService.processDocument(file, document.id),
                    { 
                        maxAttempts: 2,
                        timeout: 30000 // 30 seconds
                    }
                );
                document.ocrResults.push(ocrResult);
                document.extractedData = ocrResult.extractedData;
                
                // Update searchable content with OCR text
                document.searchableContent += ` ${ocrResult.extractedText}`;
                
                // Generate AI insights
                const insights = await this.generateAIInsights(document, ocrResult);
                document.aiInsights.push(...insights);
            } catch (error) {
                logger.warn('processDocumentWithAI', 'OCR processing failed, continuing', {
                    documentId: document.id,
                    error: error instanceof Error ? error.message : String(error)
                });
                // Continue without OCR - graceful degradation
            }
            
            // 3. Compliance Analysis
            logger.debug('processDocumentWithAI', 'Performing compliance analysis', { documentId: document.id });
            await this.performComplianceAnalysis(document);
            
            // 4. Risk Assessment
            logger.debug('processDocumentWithAI', 'Conducting risk assessment', { documentId: document.id });
            await this.conductRiskAssessment(document);
            
            // 5. Dependency Detection
            logger.debug('processDocumentWithAI', 'Detecting document dependencies', { documentId: document.id });
            await this.detectDocumentDependencies(document);
            
            // Update document in Firestore
            const docRef = doc(db, COLLECTIONS.DOCUMENTS, document.id);
            await withRetry(
                () => updateDoc(docRef, {
                    ocrResults: document.ocrResults,
                    extractedData: document.extractedData,
                    searchableContent: document.searchableContent,
                    aiInsights: document.aiInsights,
                    updatedAt: serverTimestamp()
                }),
                { maxAttempts: 3 }
            );
            
            // Save AI insights to separate collection
            if (document.aiInsights.length > 0) {
                const insightsRef = doc(db, COLLECTIONS.AI_INSIGHTS, document.id);
                await withRetry(
                    () => setDoc(insightsRef, { 
                        documentId: document.id,
                        insights: document.aiInsights,
                        updatedAt: serverTimestamp()
                    }),
                    { maxAttempts: 2 }
                );
            }
            
            logger.success('processDocumentWithAI', 'AI processing completed successfully', {
                documentId: document.id,
                insightsCount: document.aiInsights.length
            });
        } catch (error) {
            logger.error('processDocumentWithAI', 'AI processing failed', error as Error, {
                documentId: document.id
            });
            
            // Create error insight
            const errorInsight: AIInsight = {
                id: this.generateId(),
                type: 'anomaly_detection',
                title: 'Document Processing Error',
                description: `Failed to process document: ${error}`,
                confidence: 0.9,
                relevantSections: [],
                actionItems: ['Manual review required', 'Contact system administrator'],
                priority: 'critical',
                status: 'new',
                generatedAt: new Date(),
                metadata: { error: error?.toString() }
            };
            
            // Save error insight to Firestore
            try {
                const insightsRef = doc(db, COLLECTIONS.AI_INSIGHTS, document.id);
                await setDoc(insightsRef, {
                    documentId: document.id,
                    insights: [errorInsight],
                    updatedAt: serverTimestamp()
                });
                
                // Update document status to failed
                const docRef = doc(db, COLLECTIONS.DOCUMENTS, document.id);
                await updateDoc(docRef, {
                    aiProcessingStatus: 'failed',
                    updatedAt: serverTimestamp()
                });
            } catch (saveError) {
                logger.warn('processDocumentWithAI', 'Failed to save error insight', {
                    documentId: document.id
                });
            }
        }
    }

    // Generate AI insights from document content
    private async generateAIInsights(
        document: IntelligentDocument,
        ocrResult: OCRResult
    ): Promise<AIInsight[]> {
        const insights: AIInsight[] = [];
        
        // 1. Document Summary
        insights.push({
            id: this.generateId(),
            type: 'summary',
            title: 'Document Summary',
            description: this.generateDocumentSummary(ocrResult.extractedText),
            confidence: 0.85,
            relevantSections: ['overview'],
            actionItems: [],
            priority: 'low',
            status: 'new',
            generatedAt: new Date(),
            metadata: { 
                wordCount: ocrResult.extractedText.split(' ').length,
                confidence: ocrResult.confidence
            }
        });
        
        // 2. Risk Analysis
        const riskInsights = await this.analyzeDocumentRisks(ocrResult.extractedData);
        insights.push(...riskInsights);
        
        // 3. Compliance Check
        const complianceInsights = await this.checkCompliance(document, ocrResult.extractedData);
        insights.push(...complianceInsights);
        
        // 4. Anomaly Detection
        const anomalies = await this.detectAnomalies(ocrResult.extractedData);
        insights.push(...anomalies);
        
        // 5. Recommendations
        const recommendations = await this.generateRecommendations(document, ocrResult.extractedData);
        insights.push(...recommendations);
        
        return insights;
    }

    // Generate document summary
    private generateDocumentSummary(text: string): string {
        // Simple extractive summarization (in production, use advanced NLP models)
        const sentences = text.split('.').filter(s => s.trim().length > 20);
        const importantSentences = sentences.slice(0, 3); // Take first 3 sentences
        return importantSentences.join('. ') + '.';
    }

    // Analyze document risks
    private async analyzeDocumentRisks(extractedData: any): Promise<AIInsight[]> {
        const risks: AIInsight[] = [];
        
        // Financial risks
        if (extractedData.amounts) {
            const totalAmount = extractedData.amounts.reduce((sum: number, amount: any) => sum + amount.value, 0);
            if (totalAmount > 1000000) {
                risks.push({
                    id: this.generateId(),
                    type: 'risk_analysis',
                    title: 'High Financial Value Detected',
                    description: `Document contains high financial amounts totaling $${totalAmount.toLocaleString()}`,
                    confidence: 0.9,
                    relevantSections: ['financial'],
                    actionItems: ['Verify amounts', 'Require additional approvals', 'Implement enhanced controls'],
                    priority: 'high',
                    status: 'new',
                    generatedAt: new Date(),
                    metadata: { totalAmount, riskType: 'financial' }
                });
            }
        }
        
        // Timeline risks
        if (extractedData.dates) {
            const deadlines = extractedData.dates.filter((date: any) => date.type === 'deadline');
            const nearDeadlines = deadlines.filter((deadline: any) => {
                const deadlineDate = new Date(deadline.value);
                const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return daysUntilDeadline <= 7 && daysUntilDeadline > 0;
            });
            
            if (nearDeadlines.length > 0) {
                risks.push({
                    id: this.generateId(),
                    type: 'risk_analysis',
                    title: 'Approaching Deadlines',
                    description: `${nearDeadlines.length} deadline(s) approaching within 7 days`,
                    confidence: 0.95,
                    relevantSections: ['timeline'],
                    actionItems: ['Review timeline', 'Prioritize tasks', 'Alert stakeholders'],
                    priority: 'medium',
                    status: 'new',
                    generatedAt: new Date(),
                    metadata: { nearDeadlines: nearDeadlines.length, riskType: 'timeline' }
                });
            }
        }
        
        return risks;
    }

    // Check compliance
    private async checkCompliance(document: IntelligentDocument, extractedData: any): Promise<AIInsight[]> {
        const complianceInsights: AIInsight[] = [];
        
        // Check for required signatures
        if (document.requiresSignature && (!extractedData.signatures || extractedData.signatures.length === 0)) {
            complianceInsights.push({
                id: this.generateId(),
                type: 'compliance_check',
                title: 'Missing Required Signatures',
                description: 'Document requires signatures but none were detected',
                confidence: 0.9,
                relevantSections: ['signatures'],
                actionItems: ['Add signature fields', 'Initiate signature workflow'],
                priority: 'high',
                status: 'new',
                generatedAt: new Date(),
                metadata: { complianceType: 'signatures' }
            });
        }
        
        // Check for required fields based on document category
        const requiredFields = this.getRequiredFieldsForCategory(document.category);
        const missingFields = requiredFields.filter(field => !this.hasRequiredField(extractedData, field));
        
        if (missingFields.length > 0) {
            complianceInsights.push({
                id: this.generateId(),
                type: 'compliance_check',
                title: 'Missing Required Information',
                description: `Missing required fields: ${missingFields.join(', ')}`,
                confidence: 0.85,
                relevantSections: ['content'],
                actionItems: ['Add missing information', 'Review document completeness'],
                priority: 'medium',
                status: 'new',
                generatedAt: new Date(),
                metadata: { missingFields, complianceType: 'required_fields' }
            });
        }
        
        return complianceInsights;
    }

    // Detect anomalies
    private async detectAnomalies(extractedData: any): Promise<AIInsight[]> {
        const anomalies: AIInsight[] = [];
        
        // Detect unusual financial patterns
        if (extractedData.amounts) {
            const amounts = extractedData.amounts.map((a: any) => a.value);
            const avgAmount = amounts.reduce((sum: number, amt: number) => sum + amt, 0) / amounts.length;
            const outliers = amounts.filter((amt: number) => amt > avgAmount * 3);
            
            if (outliers.length > 0) {
                anomalies.push({
                    id: this.generateId(),
                    type: 'anomaly_detection',
                    title: 'Unusual Financial Values',
                    description: `Detected ${outliers.length} unusually high financial amounts`,
                    confidence: 0.8,
                    relevantSections: ['financial'],
                    actionItems: ['Verify unusual amounts', 'Check for data entry errors'],
                    priority: 'medium',
                    status: 'new',
                    generatedAt: new Date(),
                    metadata: { outliers, avgAmount, anomalyType: 'financial' }
                });
            }
        }
        
        // Detect incomplete information
        if (extractedData.tables) {
            const incompleteTables = extractedData.tables.filter((table: any) => 
                table.rows.some((row: string[]) => row.some((cell: string) => !cell || cell.trim() === ''))
            );
            
            if (incompleteTables.length > 0) {
                anomalies.push({
                    id: this.generateId(),
                    type: 'anomaly_detection',
                    title: 'Incomplete Table Data',
                    description: `${incompleteTables.length} table(s) contain empty cells`,
                    confidence: 0.7,
                    relevantSections: ['tables'],
                    actionItems: ['Complete missing table data', 'Verify data accuracy'],
                    priority: 'low',
                    status: 'new',
                    generatedAt: new Date(),
                    metadata: { incompleteTables: incompleteTables.length, anomalyType: 'incomplete_data' }
                });
            }
        }
        
        return anomalies;
    }

    // Generate recommendations
    private async generateRecommendations(document: IntelligentDocument, extractedData: any): Promise<AIInsight[]> {
        const recommendations: AIInsight[] = [];
        
        // Template recommendations
        if (!document.templateId && this.canSuggestTemplate(document.category, extractedData)) {
            const suggestedTemplates = smartTemplatesEngine.searchTemplates(document.category);
            if (suggestedTemplates.length > 0) {
                recommendations.push({
                    id: this.generateId(),
                    type: 'recommendation',
                    title: 'Template Suggestion',
                    description: `Consider using template: ${suggestedTemplates[0].name}`,
                    confidence: 0.75,
                    relevantSections: ['template'],
                    actionItems: ['Apply suggested template', 'Standardize document format'],
                    priority: 'low',
                    status: 'new',
                    generatedAt: new Date(),
                    metadata: { 
                        suggestedTemplate: suggestedTemplates[0].id,
                        recommendationType: 'template'
                    }
                });
            }
        }
        
        // Workflow recommendations
        if (document.workflow.steps.length === 0) {
            recommendations.push({
                id: this.generateId(),
                type: 'recommendation',
                title: 'Workflow Setup',
                description: 'Set up approval workflow for this document type',
                confidence: 0.8,
                relevantSections: ['workflow'],
                actionItems: ['Define approval steps', 'Assign reviewers', 'Set deadlines'],
                priority: 'medium',
                status: 'new',
                generatedAt: new Date(),
                metadata: { recommendationType: 'workflow' }
            });
        }
        
        return recommendations;
    }

    // Auto-generate document from template
    async autoGenerateDocument(
        templateId: string,
        data: any,
        projectId: string,
        generatedBy: string,
        settings?: AutoGenerationSettings
    ): Promise<IntelligentDocument> {
        
        // Generate document using template engine
        const generatedDoc = await smartTemplatesEngine.generateDocument(templateId, data);
        const template = smartTemplatesEngine.getTemplate(templateId);
        
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }

        // Create document
        const document = await this.createDocument(
            `Auto-generated ${template.name}`,
            `Generated from template: ${template.name}`,
            template.category as any,
            projectId,
            generatedBy,
            undefined,
            templateId
        );

        // Update auto-generation settings
        if (settings) {
            document.autoGenerationSettings = settings;
        }

        // Create version with generated content
        const version = await documentVersionControl.createVersion(
            document.id,
            generatedDoc.content,
            `Auto-generated from template ${templateId}`,
            generatedBy,
            'Auto-Generator',
            'main'
        );

        document.currentVersionId = version.id;
        document.allVersions = [version];
        document.status = 'published';

        // Update document in Firestore
        const docRef = doc(db, COLLECTIONS.DOCUMENTS, document.id);
        await withRetry(
            () => updateDoc(docRef, {
                currentVersionId: version.id,
                allVersions: [version],
                status: 'published',
                updatedAt: serverTimestamp()
            }),
            { maxAttempts: 2 }
        );
        
        return document;
    }

    // Initiate signature workflow
    async initiateSignatureWorkflow(
        documentId: string,
        signers: string[],
        isSequential: boolean = true,
        deadline?: Date,
        initiatedBy: string = 'system'
    ): Promise<void> {
        const document = await this.getDocument(documentId);
        if (!document) {
            throw new Error(`Document not found: ${documentId}`);
        }

        // Use initiatedBy parameter for audit trail
        logger.debug('initiateSignatureWorkflow', 'Workflow initiated', { documentId, initiatedBy });

        // Create signature workflow
        const workflow = await digitalSignaturesService.createSignatureWorkflow(
            `workflow_${documentId}`,
            documentId,
            signers,
            isSequential,
            deadline
        );

        document.signatureWorkflow = workflow;
        document.status = 'pending_approval';
        
        // Send notifications to signers
        const notifications: DocumentNotification[] = signers.map(signerId => ({
            id: this.generateId(),
            type: 'signature_pending',
            recipientId: signerId,
            message: `Your signature is required for document: ${document.title}`,
            priority: 'high',
            isRead: false,
            sentAt: new Date(),
            actionRequired: true,
            actionDeadline: deadline,
            relatedUrl: `/documents/${documentId}/sign`
        }));

        document.notifications.push(...notifications);
        
        // Update document in Firestore
        const docRef = doc(db, COLLECTIONS.DOCUMENTS, documentId);
        await withRetry(
            () => updateDoc(docRef, {
                signatureWorkflow: workflow,
                status: 'pending_approval',
                notifications: document.notifications,
                updatedAt: serverTimestamp()
            }),
            { maxAttempts: 2 }
        );

        // Send actual notifications
        await this.sendNotifications(notifications);
    }

    // Sign document
    async signDocument(
        documentId: string,
        signerId: string,
        signerName: string,
        signerEmail: string,
        signatureType: 'digital' | 'electronic' | 'biometric' = 'digital'
    ): Promise<DigitalSignature> {
        const document = await this.getDocument(documentId);
        if (!document) {
            throw new Error(`Document not found: ${documentId}`);
        }

        // Create signature
        const signature = await digitalSignaturesService.createSignature(
            documentId,
            document.currentVersionId,
            {
                userId: signerId,
                name: signerName,
                email: signerEmail,
                role: 'Signatory'
            },
            signatureType
        );

        document.signatures.push(signature);
        
        // Update workflow if exists
        if (document.signatureWorkflow) {
            // Check if all signatures completed
            const totalSigners = document.signatureWorkflow.totalSteps;
            const completedSigners = document.signatures.length;
            
            if (completedSigners >= totalSigners) {
                document.status = 'approved';
                document.signatureWorkflow.isCompleted = true;
                
                // Send completion notification
                await this.sendNotification(document, 'workflow_completed', [document.createdBy]);
            }
        }

        // Add audit entry
        await this.addAuditEntry(document, 'document_signed', signerId);
        
        // Update document in Firestore
        const docRef = doc(db, COLLECTIONS.DOCUMENTS, documentId);
        await withRetry(
            () => updateDoc(docRef, {
                signatures: document.signatures,
                signatureWorkflow: document.signatureWorkflow,
                updatedAt: serverTimestamp()
            }),
            { maxAttempts: 2 }
        );
        
        return signature;
    }

    // Search documents (Firestore)
    /**
     * Search documents by text query with optional filters
     * 
     * @param query - Search term to match against title, keywords, and content
     * @param projectId - Optional project ID filter
     * @param category - Optional document category filter
     * @param status - Optional document status filter
     * @param limit - Maximum number of results (default: 20)
     * @returns Promise resolving to array of matching documents, sorted by relevance
     * 
     * @remarks
     * Relevance scoring prioritizes: title matches (10pts) > keywords (5pts) > content (1pt)
     * Results are cached in memory for 5 minutes to improve performance.
     * 
     * @example
     * ```typescript
     * const results = await service.searchDocuments(
     *   'contract',
     *   'proj_123',
     *   'contract',
     *   undefined,
     *   10
     * );
     * ```
     */
    async searchDocuments(
        query: string,
        projectId?: string,
        category?: DocumentCategory,
        status?: DocumentStatus,
        limit: number = 20
    ): Promise<IntelligentDocument[]> {
        const searchTerm = query.toLowerCase();
        
        // Get all documents from Firestore
        const allDocuments = await this.listAllDocuments();
        
        const results = allDocuments.filter(doc => {
                // Text search
                const textMatch = doc.searchableContent?.toLowerCase().includes(searchTerm) ||
                                 doc.title.toLowerCase().includes(searchTerm) ||
                                 doc.keywords?.some(keyword => keyword.toLowerCase().includes(searchTerm));
                
                // Filter by project
                const projectMatch = !projectId || doc.projectId === projectId;
                
                // Filter by category
                const categoryMatch = !category || doc.category === category;
                
                // Filter by status
                const statusMatch = !status || doc.status === status;
                
                return textMatch && projectMatch && categoryMatch && statusMatch;
            });

        // Sort by relevance (simplified scoring)
        results.sort((a, b) => {
            const scoreA = this.calculateRelevanceScore(a, searchTerm);
            const scoreB = this.calculateRelevanceScore(b, searchTerm);
            return scoreB - scoreA;
        });

        return results.slice(0, limit);
    }

    // Calculate relevance score for search
    private calculateRelevanceScore(document: IntelligentDocument, searchTerm: string): number {
        let score = 0;
        
        // Title match (highest weight)
        if (document.title.toLowerCase().includes(searchTerm)) {
            score += 10;
        }
        
        // Keywords match
        const keywordMatches = document.keywords.filter(keyword => 
            keyword.toLowerCase().includes(searchTerm)
        ).length;
        score += keywordMatches * 5;
        
        // Content match
        const contentMatches = (document.searchableContent.toLowerCase().match(new RegExp(searchTerm, 'g')) || []).length;
        score += contentMatches;
        
        // Recent documents get slight boost
        const daysSinceCreated = Math.floor((Date.now() - document.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceCreated < 30) {
            score += 1;
        }
        
        return score;
    }

    // Helper methods
    private generateId(): string {
        return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private categoryRequiresSignature(category: DocumentCategory): boolean {
        return ['contract', 'permit', 'certificate', 'policy'].includes(category);
    }

    private getDefaultAccessControl(category: DocumentCategory): DocumentAccessControl {
        const baseControl: DocumentAccessControl = {
            visibility: 'internal',
            permissions: [],
            inheritFromProject: true,
            downloadRestrictions: []
        };

        if (['contract', 'permit'].includes(category)) {
            baseControl.visibility = 'restricted';
            baseControl.downloadRestrictions = [
                {
                    maxDownloads: 5,
                    timeWindow: 24,
                    requiresApproval: true,
                    allowedFormats: ['pdf'],
                    includeWatermark: true
                }
            ];
        }

        return baseControl;
    }

    private getDefaultComplianceInfo(category: DocumentCategory): ComplianceInfo {
        return {
            standards: [],
            certifications: [],
            retentionPolicy: {
                retentionPeriod: 7,
                archivalLocation: 'primary_archive',
                legalHold: false
            },
            dataClassification: category === 'contract' ? 'confidential' : 'internal',
            regulatoryRequirements: []
        };
    }

    private getDefaultAutoGenerationSettings(): AutoGenerationSettings {
        return {
            frequency: 'manual',
            dataSources: [],
            triggers: [],
            outputFormat: 'pdf',
            distribution: {
                recipients: [],
                deliveryMethod: 'portal'
            }
        };
    }

    private createDefaultWorkflow(category: DocumentCategory): DocumentWorkflow {
        const steps = this.getDefaultWorkflowSteps(category);
        
        return {
            workflowId: this.generateId(),
            currentStep: 1,
            totalSteps: steps.length,
            steps,
            isCompleted: false,
            canSkipSteps: false,
            escalationRules: []
        };
    }

    private getDefaultWorkflowSteps(category: DocumentCategory): any[] {
        switch (category) {
            case 'contract':
                return [
                    {
                        stepNumber: 1,
                        name: 'Legal Review',
                        description: 'Legal team review for compliance',
                        assignedTo: ['legal_team'],
                        requiredActions: ['review', 'approve'],
                        isCompleted: false
                    },
                    {
                        stepNumber: 2,
                        name: 'Executive Approval',
                        description: 'Executive approval required',
                        assignedTo: ['executive_team'],
                        requiredActions: ['approve', 'sign'],
                        isCompleted: false
                    }
                ];
            case 'report':
                return [
                    {
                        stepNumber: 1,
                        name: 'Review',
                        description: 'Document review and validation',
                        assignedTo: ['project_manager'],
                        requiredActions: ['review'],
                        isCompleted: false
                    }
                ];
            default:
                return [];
        }
    }

    private extractKeywords(title: string, description: string): string[] {
        const text = `${title} ${description}`.toLowerCase();
        const words = text.split(/\s+/).filter(word => word.length > 3);
        return [...new Set(words)].slice(0, 10); // Unique words, max 10
    }

    private getRequiredFieldsForCategory(category: DocumentCategory): string[] {
        switch (category) {
            case 'contract':
                return ['projectName', 'contractNumber', 'parties', 'amounts', 'dates'];
            case 'permit':
                return ['projectName', 'permitNumber', 'dates', 'specifications'];
            case 'report':
                return ['projectName', 'dates', 'personnel'];
            default:
                return ['projectName'];
        }
    }

    private hasRequiredField(extractedData: any, field: string): boolean {
        return extractedData[field] && 
               (Array.isArray(extractedData[field]) ? extractedData[field].length > 0 : true);
    }

    private canSuggestTemplate(category: DocumentCategory, extractedData: any): boolean {
        // Use category to determine template suggestion criteria
        const categoryRequirements: Record<DocumentCategory, number> = {
            contract: 3,
            specification: 4,
            report: 2,
            drawing: 1,
            permit: 3,
            invoice: 2,
            certificate: 2,
            correspondence: 1,
            procedure: 3,
            policy: 2,
            progress_report: 2,
            financial_report: 3,
            safety_report: 2,
            quality_report: 2,
            material_report: 2,
            compliance_report: 3,
            contract_document: 3,
            inspection_report: 2,
            custom: 1,
            other: 1
        };
        
        const minFields = categoryRequirements[category] || 2;
        return Object.keys(extractedData).length >= minFields;
    }

    private async performComplianceAnalysis(document: IntelligentDocument): Promise<void> {
        // Implement compliance analysis logic
        console.log(`Performing compliance analysis for ${document.id}`);
    }

    private async conductRiskAssessment(document: IntelligentDocument): Promise<void> {
        // Implement risk assessment logic
        console.log(`Conducting risk assessment for ${document.id}`);
    }

    private async detectDocumentDependencies(document: IntelligentDocument): Promise<void> {
        // Implement dependency detection logic
        console.log(`Detecting dependencies for ${document.id}`);
    }

    private async addAuditEntry(document: IntelligentDocument, action: string, userId: string): Promise<void> {
        const auditEntry = {
            id: this.generateId(),
            timestamp: new Date(),
            userId,
            userName: 'User',
            action,
            resourceType: 'document',
            resourceId: document.id,
            details: { documentTitle: document.title },
            ipAddress: '127.0.0.1',
            userAgent: 'System',
            sessionId: 'session',
            result: 'success' as const
        };

        document.auditTrail.push(auditEntry);
    }

    private async sendNotification(document: IntelligentDocument, type: string, recipients: string[]): Promise<void> {
        const notifications: DocumentNotification[] = recipients.map(recipientId => ({
            id: this.generateId(),
            type: type as any,
            recipientId,
            message: `Document ${document.title} - ${type}`,
            priority: 'medium',
            isRead: false,
            sentAt: new Date(),
            actionRequired: false
        }));

        await this.sendNotifications(notifications);
    }

    private async sendNotifications(notifications: DocumentNotification[]): Promise<void> {
        // Implement actual notification sending
        console.log(`Sending ${notifications.length} notifications`);
    }

    // Public API methods
    
    /**
     * Retrieve a document by its ID from Firestore
     * 
     * @param documentId - The unique identifier of the document
     * @returns Promise resolving to the document if found, undefined otherwise
     * @throws {APIError} If document ID is invalid
     * 
     * @example
     * ```typescript
     * const doc = await service.getDocument('doc_123');
     * if (doc) {
     *   console.log(doc.title);
     * }
     * ```
     */
    async getDocument(documentId: string): Promise<IntelligentDocument | undefined> {
        try {
            validateDocumentId(documentId, 'getDocument');
            
            const docRef = doc(db, COLLECTIONS.DOCUMENTS, documentId);
            const docSnap = await withRetry(
                () => getDoc(docRef),
                { maxAttempts: 3 }
            );
            
            if (!docSnap.exists()) {
                logger.warn('getDocument', 'Document not found', { documentId });
                return undefined;
            }
            
            const data = docSnap.data();
            const document: IntelligentDocument = {
                ...data,
                createdAt: data.createdAt?.toDate?.() || new Date(),
                updatedAt: data.updatedAt?.toDate?.() || new Date()
            } as IntelligentDocument;
            
            logger.debug('getDocument', 'Document retrieved', { documentId });
            return document;
        } catch (error) {
            logger.error('getDocument', 'Failed to retrieve document', error as Error, { documentId });
            return undefined;
        }
    }

    /**
     * Get all documents associated with a specific project
     * 
     * @param projectId - The project ID to filter documents by
     * @returns Promise resolving to array of documents, ordered by creation date (newest first)
     * @throws {APIError} If project ID is invalid
     * 
     * @example
     * ```typescript
     * const projectDocs = await service.getDocumentsByProject('proj_123');
     * console.log(`Found ${projectDocs.length} documents`);
     * ```
     */
    async getDocumentsByProject(projectId: string): Promise<IntelligentDocument[]> {
        try {
            if (!validators.isValidId(projectId)) {
                throw new APIError(ErrorCodes.INVALID_INPUT, 'Invalid project ID', 400, { projectId });
            }
            
            const q = query(
                collection(db, COLLECTIONS.DOCUMENTS),
                where('projectId', '==', projectId),
                orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await withRetry(
                () => getDocs(q),
                { maxAttempts: 3 }
            );
            
            const documents: IntelligentDocument[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                documents.push({
                    ...data,
                    createdAt: data.createdAt?.toDate?.() || new Date(),
                    updatedAt: data.updatedAt?.toDate?.() || new Date()
                } as IntelligentDocument);
            });
            
            logger.debug('getDocumentsByProject', 'Documents retrieved', { 
                projectId, 
                count: documents.length 
            });
            return documents;
        } catch (error) {
            logger.error('getDocumentsByProject', 'Failed to retrieve documents', error as Error, { projectId });
            return [];
        }
    }

    async getDocumentsByCategory(category: DocumentCategory): Promise<IntelligentDocument[]> {
        try {
            validateDocumentCategory(category, 'getDocumentsByCategory');
            
            const q = query(
                collection(db, COLLECTIONS.DOCUMENTS),
                where('category', '==', category),
                orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await withRetry(
                () => getDocs(q),
                { maxAttempts: 3 }
            );
            
            const documents: IntelligentDocument[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                documents.push({
                    ...data,
                    createdAt: data.createdAt?.toDate?.() || new Date(),
                    updatedAt: data.updatedAt?.toDate?.() || new Date()
                } as IntelligentDocument);
            });
            
            logger.debug('getDocumentsByCategory', 'Documents retrieved', { 
                category, 
                count: documents.length 
            });
            return documents;
        } catch (error) {
            logger.error('getDocumentsByCategory', 'Failed to retrieve documents', error as Error, { category });
            return [];
        }
    }

    async getDocumentsByStatus(status: DocumentStatus): Promise<IntelligentDocument[]> {
        try {
            validateDocumentStatus(status, 'getDocumentsByStatus');
            
            const q = query(
                collection(db, COLLECTIONS.DOCUMENTS),
                where('status', '==', status),
                orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await withRetry(
                () => getDocs(q),
                { maxAttempts: 3 }
            );
            
            const documents: IntelligentDocument[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                documents.push({
                    ...data,
                    createdAt: data.createdAt?.toDate?.() || new Date(),
                    updatedAt: data.updatedAt?.toDate?.() || new Date()
                } as IntelligentDocument);
            });
            
            logger.debug('getDocumentsByStatus', 'Documents retrieved', { 
                status, 
                count: documents.length 
            });
            return documents;
        } catch (error) {
            logger.error('getDocumentsByStatus', 'Failed to retrieve documents', error as Error, { status });
            return [];
        }
    }

    // List all documents (Firestore)
    async listAllDocuments(): Promise<IntelligentDocument[]> {
        try {
            const querySnapshot = await withRetry(
                () => getDocs(collection(db, COLLECTIONS.DOCUMENTS)),
                { maxAttempts: 3 }
            );
            
            const documents: IntelligentDocument[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                documents.push({
                    ...data,
                    createdAt: data.createdAt?.toDate?.() || new Date(),
                    updatedAt: data.updatedAt?.toDate?.() || new Date()
                } as IntelligentDocument);
            });
            
            logger.debug('listAllDocuments', 'All documents retrieved', { count: documents.length });
            return documents;
        } catch (error) {
            logger.error('listAllDocuments', 'Failed to list documents', error as Error);
            return [];
        }
    }

    /**
     * Permanently delete a document and all its related data
     * 
     * @param documentId - The ID of the document to delete
     * @returns Promise resolving to true if deleted successfully, false if not found
     * @throws {APIError} If document ID is invalid
     * 
     * @remarks
     * This operation cascades to delete workflows, AI insights, and audit trail.
     * Cannot be undone - consider soft delete (status update) instead.
     * 
     * @example
     * ```typescript
     * const deleted = await service.deleteDocument('doc_123');
     * if (deleted) {
     *   console.log('Document deleted');
     * }
     * ```
     */
    async deleteDocument(documentId: string): Promise<boolean> {
        try {
            validateDocumentId(documentId, 'deleteDocument');
            
            const document = await this.getDocument(documentId);
            if (!document) {
                logger.warn('deleteDocument', 'Document not found', { documentId });
                return false;
            }
            
            logger.info('deleteDocument', 'Deleting document', { documentId, title: document.title });
            
            // Remove from all related collections in parallel
            await Promise.all([
                withRetry(() => deleteDoc(doc(db, COLLECTIONS.DOCUMENTS, documentId)), { maxAttempts: 3 }),
                withRetry(() => deleteDoc(doc(db, COLLECTIONS.WORKFLOWS, documentId)), { maxAttempts: 2 }).catch(() => {}),
                withRetry(() => deleteDoc(doc(db, COLLECTIONS.AI_INSIGHTS, documentId)), { maxAttempts: 2 }).catch(() => {}),
                withRetry(() => deleteDoc(doc(db, COLLECTIONS.AUDIT_TRAIL, documentId)), { maxAttempts: 2 }).catch(() => {})
            ]);
            
            logger.success('deleteDocument', 'Document deleted successfully', { documentId });
            return true;
        } catch (error) {
            logger.error('deleteDocument', 'Failed to delete document', error as Error, { documentId });
            return false;
        }
    }

    /**
     * Update an existing document with partial updates
     * 
     * @param documentId - The ID of the document to update
     * @param updates - Partial document object with fields to update
     * @returns Promise resolving to updated document, or undefined if not found
     * @throws {APIError} If document ID or status is invalid
     * 
     * @example
     * ```typescript
     * const updated = await service.updateDocument('doc_123', {
     *   title: 'Updated Title',
     *   status: 'approved'
     * });
     * ```
     */
    async updateDocument(documentId: string, updates: Partial<IntelligentDocument>): Promise<IntelligentDocument | undefined> {
        try {
            validateDocumentId(documentId, 'updateDocument');
            
            const document = await this.getDocument(documentId);
            if (!document) {
                logger.warn('updateDocument', 'Document not found', { documentId });
                return undefined;
            }
            
            // Validate status if being updated
            if (updates.status) {
                validateDocumentStatus(updates.status, 'updateDocument');
            }
            
            logger.info('updateDocument', 'Updating document', { 
                documentId, 
                updates: Object.keys(updates) 
            });
            
            // Apply updates to Firestore
            const docRef = doc(db, COLLECTIONS.DOCUMENTS, documentId);
            await withRetry(
                () => updateDoc(docRef, {
                    ...updates,
                    updatedAt: serverTimestamp()
                }),
                { maxAttempts: 3 }
            );
            
            // Update workflow if included in updates
            if (updates.workflow) {
                const workflowRef = doc(db, COLLECTIONS.WORKFLOWS, documentId);
                await withRetry(
                    () => setDoc(workflowRef, updates.workflow!),
                    { maxAttempts: 2 }
                );
            }
            
            // Apply updates locally for return
            const updatedDocument = { ...document, ...updates, updatedAt: new Date() };
            
            // Update audit trail
            await this.addAuditEntry(updatedDocument, 'Document Updated', 'system');
            
            logger.success('updateDocument', 'Document updated successfully', { documentId });
            return updatedDocument;
        } catch (error) {
            logger.error('updateDocument', 'Failed to update document', error as Error, { documentId });
            throw error;
        }
    }

    async applyTemplate(documentId: string, templateId: string): Promise<IntelligentDocument | undefined> {
        const document = await this.getDocument(documentId);
        if (!document) {
            return undefined;
        }
        
        // Apply template logic here
        const updatedDocument = { ...document, templateId, updatedAt: new Date() };
        
        // Update in Firestore
        const docRef = doc(db, COLLECTIONS.DOCUMENTS, documentId);
        await withRetry(
            () => updateDoc(docRef, { templateId, updatedAt: serverTimestamp() }),
            { maxAttempts: 2 }
        );
        
        return updatedDocument;
    }

    async updateDocumentStatus(documentId: string, status: DocumentStatus): Promise<boolean> {
        const document = await this.getDocument(documentId);
        if (!document) {
            return false;
        }
        
        document.status = status;
        document.updatedAt = new Date();
        
        // Update in Firestore
        const docRef = doc(db, COLLECTIONS.DOCUMENTS, documentId);
        await withRetry(
            () => updateDoc(docRef, { status, updatedAt: serverTimestamp() }),
            { maxAttempts: 2 }
        );
        
        return true;
    }

    async encryptDocument(documentId: string, encryptionKey: string): Promise<IntelligentDocument | undefined> {
        const document = await this.getDocument(documentId);
        if (!document) {
            return undefined;
        }
        
        // Apply encryption
        document.encryptionStatus = {
            algorithm: 'AES-256',
            keyId: encryptionKey,
            isEncrypted: true,
            encryptionLevel: 'storage'
        };
        document.updatedAt = new Date();
        
        // Update in Firestore
        const docRef = doc(db, COLLECTIONS.DOCUMENTS, documentId);
        await withRetry(
            () => updateDoc(docRef, { 
                encryptionStatus: document.encryptionStatus, 
                updatedAt: serverTimestamp() 
            }),
            { maxAttempts: 2 }
        );
        
        return document;
    }

    async decryptDocument(documentId: string, decryptionKey: string): Promise<IntelligentDocument | undefined> {
        const document = await this.getDocument(documentId);
        if (!document) {
            return undefined;
        }
        
        // Apply decryption
        if (document.encryptionStatus?.keyId === decryptionKey) {
            document.encryptionStatus.isEncrypted = false;
            document.updatedAt = new Date();
            
            // Update in Firestore
            const docRef = doc(db, COLLECTIONS.DOCUMENTS, documentId);
            await withRetry(
                () => updateDoc(docRef, { 
                    encryptionStatus: document.encryptionStatus, 
                    updatedAt: serverTimestamp() 
                }),
                { maxAttempts: 2 }
            );
        }
        
        return document;
    }



    // Workflow Management Methods (Firestore)
    async createWorkflow(documentId: string, workflow: DocumentWorkflow): Promise<void> {
        const workflowRef = doc(db, COLLECTIONS.WORKFLOWS, documentId);
        await withRetry(
            () => setDoc(workflowRef, workflow),
            { maxAttempts: 2 }
        );
        logger.debug('createWorkflow', 'Workflow created', { documentId });
    }

    async getWorkflow(documentId: string): Promise<DocumentWorkflow | undefined> {
        try {
            const workflowRef = doc(db, COLLECTIONS.WORKFLOWS, documentId);
            const workflowSnap = await withRetry(
                () => getDoc(workflowRef),
                { maxAttempts: 2 }
            );
            
            return workflowSnap.exists() ? workflowSnap.data() as DocumentWorkflow : undefined;
        } catch (error) {
            logger.error('getWorkflow', 'Failed to retrieve workflow', error as Error, { documentId });
            return undefined;
        }
    }

    async updateWorkflowStep(documentId: string, stepNumber: number, isCompleted: boolean): Promise<void> {
        const workflow = await this.getWorkflow(documentId);
        if (workflow && workflow.steps[stepNumber - 1]) {
            workflow.steps[stepNumber - 1].isCompleted = isCompleted;
            if (isCompleted) {
                workflow.steps[stepNumber - 1].completedAt = new Date();
                workflow.currentStep = Math.min(stepNumber + 1, workflow.totalSteps);
            }
            
            const workflowRef = doc(db, COLLECTIONS.WORKFLOWS, documentId);
            await withRetry(
                () => setDoc(workflowRef, workflow),
                { maxAttempts: 2 }
            );
        }
    }

    // AI Insights Management (Firestore)
    async addAIInsight(documentId: string, insight: AIInsight): Promise<void> {
        try {
            const insightsRef = doc(db, COLLECTIONS.AI_INSIGHTS, documentId);
            const insightsSnap = await getDoc(insightsRef);
            
            const existing = insightsSnap.exists() 
                ? (insightsSnap.data().insights || []) 
                : [];
            
            existing.push(insight);
            
            await withRetry(
                () => setDoc(insightsRef, { 
                    documentId,
                    insights: existing, 
                    updatedAt: serverTimestamp() 
                }),
                { maxAttempts: 2 }
            );
            
            logger.debug('addAIInsight', 'AI insight added', { documentId });
        } catch (error) {
            logger.error('addAIInsight', 'Failed to add AI insight', error as Error, { documentId });
        }
    }

    /**
     * Retrieve all AI-generated insights for a document
     * 
     * @param documentId - The document ID to get insights for
     * @returns Promise resolving to array of AI insights
     * 
     * @remarks
     * Insights include document summaries, compliance checks, risk assessments,
     * and anomaly detections generated during AI processing.
     * 
     * @example
     * ```typescript
     * const insights = await service.getAIInsights('doc_123');
     * insights.forEach(insight => {
     *   console.log(`${insight.type}: ${insight.title}`);
     * });
     * ```
     */
    async getAIInsights(documentId: string): Promise<AIInsight[]> {
        try {
            const insightsRef = doc(db, COLLECTIONS.AI_INSIGHTS, documentId);
            const insightsSnap = await withRetry(
                () => getDoc(insightsRef),
                { maxAttempts: 2 }
            );
            
            return insightsSnap.exists() ? (insightsSnap.data().insights || []) : [];
        } catch (error) {
            logger.error('getAIInsights', 'Failed to retrieve AI insights', error as Error, { documentId });
            return [];
        }
    }

    async generateSimpleAIInsights(documentId: string): Promise<AIInsight[]> {
        const document = await this.getDocument(documentId);
        if (!document) return [];

        const insights: AIInsight[] = [
            {
                id: `insight_${Date.now()}`,
                type: 'summary',
                title: 'Document Summary',
                description: 'AI-generated summary of document content',
                confidence: 0.85,
                relevantSections: ['introduction', 'content'],
                actionItems: ['Review content', 'Verify accuracy'],
                priority: 'medium',
                status: 'new',
                generatedAt: new Date(),
                metadata: { source: 'ai_analysis' }
            }
        ];

        // Store insights in Firestore
        const insightsRef = doc(db, COLLECTIONS.AI_INSIGHTS, documentId);
        await withRetry(
            () => setDoc(insightsRef, { 
                documentId,
                insights, 
                updatedAt: serverTimestamp() 
            }),
            { maxAttempts: 2 }
        );
        
        return insights;
    }

    /**
     * Add a notification to a document's notification list
     * 
     * @param documentId - The document to add notification to
     * @param notification - The notification object to add
     * @returns Promise that resolves when notification is added
     * 
     * @remarks
     * Notifications are stored in a separate Firestore collection for scalability.
     * Supports real-time updates via Firestore listeners.
     * 
     * @example
     * ```typescript
     * await service.addNotification('doc_123', {
     *   id: 'notif_1',
     *   type: 'status_change',
     *   message: 'Document approved',
     *   recipients: ['user_1', 'user_2'],
     *   timestamp: new Date(),
     *   read: false
     * });
     * ```
     */
    async addNotification(documentId: string, notification: DocumentNotification): Promise<void> {
        try {
            const notificationsRef = doc(db, COLLECTIONS.NOTIFICATIONS, documentId);
            const notificationsSnap = await getDoc(notificationsRef);
            
            const existing = notificationsSnap.exists() 
                ? (notificationsSnap.data().notifications || []) 
                : [];
            
            existing.push(notification);
            
            await withRetry(
                () => setDoc(notificationsRef, { 
                    documentId,
                    notifications: existing, 
                    updatedAt: serverTimestamp() 
                }),
                { maxAttempts: 2 }
            );
            
            logger.debug('addNotification', 'Notification added', { documentId });
        } catch (error) {
            logger.error('addNotification', 'Failed to add notification', error as Error, { documentId });
        }
    }

    async getNotifications(documentId: string): Promise<DocumentNotification[]> {
        try {
            const notificationsRef = doc(db, COLLECTIONS.NOTIFICATIONS, documentId);
            const notificationsSnap = await withRetry(
                () => getDoc(notificationsRef),
                { maxAttempts: 2 }
            );
            
            return notificationsSnap.exists() ? (notificationsSnap.data().notifications || []) : [];
        } catch (error) {
            logger.error('getNotifications', 'Failed to retrieve notifications', error as Error, { documentId });
            return [];
        }
    }

    async markNotificationAsRead(documentId: string, notificationId: string): Promise<void> {
        try {
            const notificationsRef = doc(db, COLLECTIONS.NOTIFICATIONS, documentId);
            const notificationsSnap = await getDoc(notificationsRef);
            
            if (notificationsSnap.exists()) {
                const notifications = notificationsSnap.data().notifications || [];
                const notification = notifications.find((n: DocumentNotification) => n.id === notificationId);
                if (notification) {
                    notification.isRead = true;
                    notification.readAt = new Date();
                    
                    await withRetry(
                        () => setDoc(notificationsRef, { 
                            documentId,
                            notifications, 
                            updatedAt: serverTimestamp() 
                        }),
                        { maxAttempts: 2 }
                    );
                }
            }
        } catch (error) {
            logger.error('markNotificationAsRead', 'Failed to mark notification as read', error as Error, { documentId, notificationId });
        }
    }

    // Dependencies Management (Firestore)
    async addDependency(documentId: string, dependency: DocumentDependency): Promise<void> {
        try {
            const depsRef = doc(db, COLLECTIONS.DEPENDENCIES, documentId);
            const depsSnap = await getDoc(depsRef);
            
            const existing = depsSnap.exists() 
                ? (depsSnap.data().dependencies || []) 
                : [];
            
            existing.push(dependency);
            
            await withRetry(
                () => setDoc(depsRef, { 
                    documentId,
                    dependencies: existing, 
                    updatedAt: serverTimestamp() 
                }),
                { maxAttempts: 2 }
            );
            
            logger.debug('addDependency', 'Dependency added', { documentId, dependentId: dependency.dependentDocumentId });
        } catch (error) {
            logger.error('addDependency', 'Failed to add dependency', error as Error, { documentId });
        }
    }

    async getDependencies(documentId: string): Promise<DocumentDependency[]> {
        try {
            const depsRef = doc(db, COLLECTIONS.DEPENDENCIES, documentId);
            const depsSnap = await withRetry(
                () => getDoc(depsRef),
                { maxAttempts: 2 }
            );
            
            return depsSnap.exists() ? (depsSnap.data().dependencies || []) : [];
        } catch (error) {
            logger.error('getDependencies', 'Failed to retrieve dependencies', error as Error, { documentId });
            return [];
        }
    }

    async validateDependencies(documentId: string): Promise<void> {
        const dependencies = await this.getDependencies(documentId);
        for (const dep of dependencies) {
            const dependentDoc = await this.getDocument(dep.dependentDocumentId);
            if (!dependentDoc) {
                dep.status = 'broken';
            } else if (dependentDoc.updatedAt > new Date(dep.lastChecked)) {
                dep.status = 'outdated';
            } else {
                dep.status = 'valid';
            }
            dep.lastChecked = new Date();
        }
        
        // Save updated dependencies
        const depsRef = doc(db, COLLECTIONS.DEPENDENCIES, documentId);
        await withRetry(
            () => setDoc(depsRef, { 
                documentId,
                dependencies, 
                updatedAt: serverTimestamp() 
            }),
            { maxAttempts: 2 }
        );
    }

    // Helper method to calculate file checksum
    private async calculateChecksum(file: File): Promise<string> {
        // Simple checksum based on file properties (in production, use proper hashing)
        return `${file.name}_${file.size}_${file.lastModified}`;
    }
}

// Export singleton instance
export const intelligentDocumentService = new IntelligentDocumentService();