// Test Setup Configuration for Intelligent Document System
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Global test configuration
const TEST_CONFIG = {
  timeout: 30000,
  retries: 3,
  verbose: true,
  cleanupAfterTests: true,
};

// Mock implementations for services during testing
const mockServices = {
  intelligentDocumentService: {
    documents: new Map(),
    nextId: 1,

    createDocument: jest
      .fn()
      .mockImplementation(
        async (title, description, category, projectId, userId, file, templateId, options) => {
          const document = {
            id: `test-doc-${mockServices.intelligentDocumentService.nextId++}`,
            title,
            description,
            category,
            projectId,
            createdBy: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'draft',
            fileSize: file.size,
            mimeType: file.type,
            checksum: 'test-checksum',
            language: 'en',
            searchableContent: title + ' ' + description,
            keywords: [title.toLowerCase()],
            tags: [],
            collaborators: [userId],
            requiresSignature: false,
            templateId: templateId || null,
            ocrResults: options?.enableOCR
              ? {
                  extractedText: await file.text(),
                  confidence: 0.95,
                  language: 'en',
                  structuredData: {},
                  processingTime: 100,
                  errors: [],
                }
              : null,
            aiInsights: options?.enableAIProcessing
              ? [
                  {
                    id: 'test-insight-1',
                    type: 'compliance',
                    priority: 'medium',
                    title: 'Test AI Insight',
                    description: 'This is a test AI insight',
                    confidence: 0.8,
                    recommendations: ['Test recommendation'],
                    affectedSections: ['section1'],
                    generatedAt: new Date(),
                  },
                ]
              : [],
            allVersions: [
              {
                id: 'test-version-1',
                documentId: `test-doc-${mockServices.intelligentDocumentService.nextId}`,
                versionNumber: '1.0.0',
                createdAt: new Date(),
                createdBy: userId,
                comment: 'Initial version',
                changes: [],
                tags: [],
                isActive: true,
                parentVersionId: null,
                branchName: 'main',
              },
            ],
            signatures: [],
            encryptionStatus: {
              isEncrypted: false,
              algorithm: null,
              keyId: null,
              encryptedAt: null,
              encryptedBy: null,
            },
            auditTrail: [
              {
                action: 'create',
                userId,
                timestamp: new Date(),
                details: { title, category },
                ipAddress: '127.0.0.1',
                userAgent: 'test-agent',
              },
            ],
          };

          mockServices.intelligentDocumentService.documents.set(document.id, document);
          return document;
        }
      ),

    getDocument: jest.fn().mockImplementation((id) => {
      const document = mockServices.intelligentDocumentService.documents.get(id);
      if (!document) {
        throw new Error('Document not found');
      }
      return document;
    }),

    updateDocument: jest.fn().mockImplementation((id, updates, userId, comment) => {
      const document = mockServices.intelligentDocumentService.documents.get(id);
      if (!document) {
        throw new Error('Document not found');
      }

      if (document.createdBy !== userId && userId !== 'test_user' && userId !== 'validation_user') {
        throw new Error('Unauthorized access');
      }

      const updatedDocument = {
        ...document,
        ...updates,
        updatedAt: new Date(),
        allVersions: [
          {
            id: `test-version-${Date.now()}`,
            documentId: id,
            versionNumber: '1.1.0',
            createdAt: new Date(),
            createdBy: userId,
            comment: comment || 'Updated',
            changes: Object.keys(updates),
            tags: [],
            isActive: true,
            parentVersionId: document.allVersions[0]?.id,
            branchName: 'main',
          },
          ...document.allVersions.map((v: any) => ({ ...v, isActive: false })),
        ],
        auditTrail: [
          ...document.auditTrail,
          {
            action: 'update',
            userId,
            timestamp: new Date(),
            details: { updates, comment },
            ipAddress: '127.0.0.1',
            userAgent: 'test-agent',
          },
        ],
      };

      mockServices.intelligentDocumentService.documents.set(id, updatedDocument);
      return updatedDocument;
    }),

    deleteDocument: jest.fn().mockImplementation((id, userId) => {
      const document = mockServices.intelligentDocumentService.documents.get(id);
      if (!document) {
        throw new Error('Document not found');
      }

      if (document.createdBy !== userId && userId !== 'test_user' && userId !== 'validation_user') {
        throw new Error('Unauthorized access');
      }

      mockServices.intelligentDocumentService.documents.delete(id);
      return true;
    }),

    listAllDocuments: jest.fn().mockImplementation(() => {
      return Array.from(mockServices.intelligentDocumentService.documents.values());
    }),

    searchDocuments: jest.fn().mockImplementation((query, projectId) => {
      const documents = Array.from(mockServices.intelligentDocumentService.documents.values());
      const results = documents
        .filter((doc) => !projectId || doc.projectId === projectId)
        .filter(
          (doc) =>
            doc.title.toLowerCase().includes(query.toLowerCase()) ||
            doc.description?.toLowerCase().includes(query.toLowerCase()) ||
            doc.searchableContent.toLowerCase().includes(query.toLowerCase())
        )
        .map((doc) => ({
          document: doc,
          relevanceScore: 0.8,
          matchedFields: ['title'],
        }));
      return results;
    }),

    getDocumentsByProject: jest.fn().mockImplementation((projectId) => {
      return Array.from(mockServices.intelligentDocumentService.documents.values()).filter(
        (doc) => doc.projectId === projectId
      );
    }),

    processDocumentWithAI: jest.fn().mockResolvedValue(true),

    generateAIInsights: jest.fn().mockResolvedValue([]),

    autoGenerateDocument: jest
      .fn()
      .mockImplementation(async (templateId, data, projectId, userId) => {
        if (!data.project_name && !data.progress_percentage) {
          throw new Error('Missing required template variables');
        }

        const generatedContent = `Project: ${data.project_name}\nProgress: ${data.progress_percentage}%\nStatus: ${data.status}`;
        const file = new File([generatedContent], 'generated-document.txt', { type: 'text/plain' });

        return mockServices.intelligentDocumentService.createDocument(
          'Generated Document',
          'Auto-generated from template',
          'report',
          projectId,
          userId,
          file,
          templateId,
          { enableOCR: true, enableAIProcessing: true }
        );
      }),

    initiateSignatureWorkflow: jest
      .fn()
      .mockImplementation(async (documentId, signers, sequential, deadline, userId) => {
        return {
          id: `workflow-${Date.now()}`,
          documentId,
          title: `Signature workflow for document ${documentId}`,
          description: 'Auto-generated signature workflow',
          requiredSigners: signers,
          isSequential: sequential,
          deadline,
          createdBy: userId,
          createdAt: new Date(),
          isCompleted: false,
          isCancelled: false,
          signatures: [],
        };
      }),

    updateDocumentStatus: jest.fn().mockImplementation((id, status, userId, reason) => {
      const document = mockServices.intelligentDocumentService.documents.get(id);
      if (!document) {
        throw new Error('Document not found');
      }

      const updatedDocument = {
        ...document,
        status,
        updatedAt: new Date(),
        auditTrail: [
          ...document.auditTrail,
          {
            action: 'status_change',
            userId,
            timestamp: new Date(),
            details: { status, reason },
            ipAddress: '127.0.0.1',
            userAgent: 'test-agent',
          },
        ],
      };

      mockServices.intelligentDocumentService.documents.set(id, updatedDocument);
      return updatedDocument;
    }),

    encryptDocument: jest.fn().mockImplementation(async (id, userId) => {
      const document = mockServices.intelligentDocumentService.documents.get(id);
      if (document) {
        document.encryptionStatus = {
          isEncrypted: true,
          algorithm: 'AES-256',
          keyId: 'test-key-123',
          encryptedAt: new Date(),
          encryptedBy: userId,
        };
        document.auditTrail.push({
          action: 'encrypt',
          userId,
          timestamp: new Date(),
          details: { algorithm: 'AES-256' },
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        });
      }
    }),

    decryptDocument: jest.fn().mockImplementation(async (id, userId) => {
      const document = mockServices.intelligentDocumentService.documents.get(id);
      if (document) {
        document.encryptionStatus = {
          isEncrypted: false,
          algorithm: null,
          keyId: null,
          encryptedAt: null,
          encryptedBy: null,
        };
        document.auditTrail.push({
          action: 'decrypt',
          userId,
          timestamp: new Date(),
          details: {},
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        });
      }
    }),

    generateDocumentAnalytics: jest.fn().mockReturnValue({
      totalDocuments: 5,
      documentsByCategory: { report: 3, contract: 2 },
      documentsByStatus: { draft: 2, published: 3 },
      processingMetrics: {
        averageProcessingTime: 150,
        successRate: 0.95,
        ocrAccuracy: 0.92,
      },
    }),

    getProcessingMetrics: jest.fn().mockReturnValue({
      averageProcessingTime: 150,
      successRate: 0.95,
      ocrAccuracy: 0.92,
      totalProcessedDocuments: 100,
    }),
  },
};

// Setup mock implementations
beforeAll(async () => {
  console.log('🔧 Setting up test environment...');

  // Mock the API services
  vi.doMock('../api/intelligentDocumentService', () => mockServices.intelligentDocumentService);

  // Set test timeout
  // Note: Vitest handles timeouts differently, using test timeout configuration

  console.log('✅ Test environment setup complete');
});

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');

  if (TEST_CONFIG.cleanupAfterTests) {
    // Clear all mock data
    mockServices.intelligentDocumentService.documents.clear();
    mockServices.intelligentDocumentService.nextId = 1;
  }

  // Clear all mocks
  vi.clearAllMocks();

  console.log('✅ Test environment cleanup complete');
});

beforeEach(async () => {
  // Reset mock call counts before each test
  jest.clearAllMocks();
});

afterEach(async () => {
  // Optional: cleanup after each test
  if (TEST_CONFIG.cleanupAfterTests) {
    // Could implement per-test cleanup here
  }
});

// Global test utilities
(global as any).testUtils = {
  createMockFile: (content: string, filename: string, mimeType: string = 'text/plain') => {
    return new File([content], filename, { type: mimeType });
  },

  createMockDocument: async (overrides = {}) => {
    const defaults = {
      title: 'Test Document',
      description: 'Test description',
      category: 'other',
      projectId: 'test_project',
      userId: 'test_user',
    };

    const params = { ...defaults, ...overrides };
    const file = (global as any).testUtils.createMockFile('Test content', 'test.txt');

    return mockServices.intelligentDocumentService.createDocument(
      params.title,
      params.description,
      params.category,
      params.projectId,
      params.userId,
      file
    );
  },

  sleep: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

  generateRandomString: (length: number = 10) => {
    return Math.random()
      .toString(36)
      .substring(2, length + 2);
  },

  measureExecutionTime: async (fn: () => Promise<any>) => {
    const startTime = Date.now();
    const result = await fn();
    const endTime = Date.now();
    return {
      result,
      executionTime: endTime - startTime,
    };
  },
};

// Export test configuration for use in tests
export { TEST_CONFIG, mockServices };

console.log('📋 Test setup configuration loaded');
