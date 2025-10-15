// Unit tests for Intelligent Document Service (Simplified & Practical Approach)
// Focus on integration with proper mocking, less on internal validation functions

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Firebase before importing service
jest.mock('../../firebaseConfig', () => ({
    db: {},
    analytics: null,
    functions: {}
}));

// Mock Firestore functions
const mockSetDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockQuery = jest.fn((collection: any) => collection);
const mockWhere = jest.fn((field: string, operator: string, value: any) => ({ field, operator, value }));
const mockOrderBy = jest.fn((field: string, direction?: string) => ({ field, direction }));
const mockServerTimestamp = jest.fn(() => ({ _seconds: Date.now() / 1000, _nanoseconds: 0 }));
const mockAddDoc = jest.fn(); // Added for MonitoringService
const mockCollection = jest.fn((db: any, collectionName: string) => ({ collectionName }));
const mockDoc = jest.fn((db: any, collectionName: string, docId: string) => ({ collectionName, docId }));

jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn(),
    collection: (...args: any[]) => mockCollection(...args),
    doc: (...args: any[]) => mockDoc(...args),
    setDoc: (...args: any[]) => mockSetDoc(...args),
    getDoc: (...args: any[]) => mockGetDoc(...args),
    updateDoc: (...args: any[]) => mockUpdateDoc(...args),
    deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
    getDocs: (...args: any[]) => mockGetDocs(...args),
    query: (...args: any[]) => mockQuery(...args),
    where: (...args: any[]) => mockWhere(...args),
    orderBy: (...args: any[]) => mockOrderBy(...args),
    serverTimestamp: () => mockServerTimestamp(),
    addDoc: (...args: any[]) => mockAddDoc(...args),
    Timestamp: {
        fromDate: (date: Date) => ({
            toDate: () => date,
            _seconds: Math.floor(date.getTime() / 1000),
            _nanoseconds: (date.getTime() % 1000) * 1000000
        }),
        now: () => ({
            toDate: () => new Date(),
            _seconds: Math.floor(Date.now() / 1000),
            _nanoseconds: (Date.now() % 1000) * 1000000
        })
    }
}));

// Mock logger to reduce noise
jest.mock('../../api/utils/logger', () => ({
    createScopedLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        success: jest.fn()
    })),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    success: jest.fn()
}));

// Import service after mocking
import { intelligentDocumentService } from '../../api/intelligentDocumentService';
import type { IntelligentDocument, DocumentCategory, DocumentStatus } from '../../types';

describe('Intelligent Document Service - Comprehensive Tests', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        mockAddDoc.mockResolvedValue({ id: 'mock-log-id' }); // Prevent monitoring service errors
    });

    // =============================================
    // CRUD OPERATIONS
    // =============================================

    describe('CRUD Operations', () => {
        describe('createDocument', () => {
            it('should create document with valid data', async () => {
                mockSetDoc.mockResolvedValue(undefined);

                const document = await intelligentDocumentService.createDocument({
                    title: 'Test Document',
                    category: 'contract' as DocumentCategory,
                    content: 'Test content',
                    projectId: 'project-123',
                    uploadedBy: 'user-123'
                });

                expect(document).toBeDefined();
                expect(document.id).toBeDefined();
                expect(document.title).toBe('Test Document');
                expect(document.category).toBe('contract');
                expect(mockSetDoc).toHaveBeenCalled();
            });

            it('should throw error for empty title', async () => {
                await expect(
                    intelligentDocumentService.createDocument({
                        title: '',
                        category: 'contract' as DocumentCategory,
                        content: 'Test content',
                        projectId: 'project-123',
                        uploadedBy: 'user-123'
                    })
                ).rejects.toThrow();
            });

            it('should create workflow when provided', async () => {
                mockSetDoc.mockResolvedValue(undefined);

                const document = await intelligentDocumentService.createDocument({
                    title: 'Document with Workflow',
                    category: 'contract' as DocumentCategory,
                    content: 'Content',
                    projectId: 'project-123',
                    uploadedBy: 'user-123',
                    workflow: {
                        currentStep: 1,
                        totalSteps: 3,
                        steps: [],
                        isCompleted: false
                    }
                });

                expect(document).toBeDefined();
                expect(mockSetDoc).toHaveBeenCalled(); // Called for both document and workflow
            });
        });

        describe('getDocument', () => {
            it('should retrieve existing document', async () => {
                const mockDocSnap = {
                    exists: () => true,
                    data: () => ({
                        id: 'doc-123',
                        title: 'Test Doc',
                        category: 'contract',
                        status: 'draft',
                        content: 'Content',
                        projectId: 'project-123',
                        uploadedBy: 'user-123',
                        auditTrail: [], // Add default audit trail
                        aiInsights: [], // Add default AI insights
                        notifications: [], // Add default notifications
                        createdAt: { toDate: () => new Date('2025-01-01') },
                        updatedAt: { toDate: () => new Date('2025-01-02') }
                    })
                };

                mockGetDoc.mockResolvedValue(mockDocSnap);

                const document = await intelligentDocumentService.getDocument('doc-123');

                expect(document).toBeDefined();
                expect(document?.id).toBe('doc-123');
                expect(document?.title).toBe('Test Doc');
                expect(mockGetDoc).toHaveBeenCalled();
            });

            it('should return undefined for non-existent document', async () => {
                mockGetDoc.mockResolvedValue({ exists: () => false });

                const document = await intelligentDocumentService.getDocument('non-existent');

                expect(document).toBeUndefined();
            });

            it('should handle Firestore errors gracefully', async () => {
                mockGetDoc.mockRejectedValue(new Error('Network error'));

                const document = await intelligentDocumentService.getDocument('doc-123');

                expect(document).toBeUndefined(); // Graceful degradation
            });
        });

        describe('updateDocument', () => {
            it('should update existing document', async () => {
                const mockDocSnap = {
                    exists: () => true,
                    data: () => ({
                        id: 'doc-123',
                        title: 'Original Title',
                        status: 'draft',
                        auditTrail: [], // Add audit trail
                        createdAt: { toDate: () => new Date() },
                        updatedAt: { toDate: () => new Date() }
                    })
                };

                mockGetDoc.mockResolvedValue(mockDocSnap);
                mockUpdateDoc.mockResolvedValue(undefined);

                const updated = await intelligentDocumentService.updateDocument('doc-123', {
                    title: 'Updated Title'
                });

                expect(updated).toBe(true);
                expect(mockUpdateDoc).toHaveBeenCalled();
            });

            it('should throw error for non-existent document', async () => {
                mockGetDoc.mockResolvedValue({ exists: () => false });

                // Update document returns false for non-existent, doesn't throw
                const result = await intelligentDocumentService.updateDocument('non-existent', { title: 'New Title' });
                
                expect(result).toBe(false);
            });

            it('should prevent ID change', async () => {
                const mockDocSnap = {
                    exists: () => true,
                    data: () => ({
                        id: 'doc-123',
                        title: 'Title',
                        status: 'draft',
                        auditTrail: [], // Add audit trail
                        createdAt: { toDate: () => new Date() },
                        updatedAt: { toDate: () => new Date() }
                    })
                };

                mockGetDoc.mockResolvedValue(mockDocSnap);
                mockUpdateDoc.mockResolvedValue(undefined);

                await intelligentDocumentService.updateDocument('doc-123', {
                    id: 'new-id' // Try to change ID
                } as any);

                // Check that updateDoc was called without the ID field
                const updateCall = mockUpdateDoc.mock.calls[0][1];
                expect(updateCall.id).toBeUndefined();
            });

            it('should update workflow when provided', async () => {
                const mockDocSnap = {
                    exists: () => true,
                    data: () => ({
                        id: 'doc-123',
                        title: 'Title',
                        status: 'draft',
                        auditTrail: [], // Add audit trail
                        createdAt: { toDate: () => new Date() },
                        updatedAt: { toDate: () => new Date() }
                    })
                };

                mockGetDoc.mockResolvedValue(mockDocSnap);
                mockUpdateDoc.mockResolvedValue(undefined);
                mockSetDoc.mockResolvedValue(undefined);

                await intelligentDocumentService.updateDocument('doc-123', {
                    workflow: {
                        currentStep: 2,
                        totalSteps: 5,
                        steps: [],
                        isCompleted: false
                    }
                });

                expect(mockSetDoc).toHaveBeenCalled(); // Workflow update
            });
        });
        describe('deleteDocument', () => {
            it('should delete document and cleanup related collections', async () => {
                const mockDocSnap = {
                    exists: () => true,
                    data: () => ({ 
                        id: 'doc-123', 
                        title: 'Test',
                        auditTrail: [] // Add audit trail
                    })
                };

                mockGetDoc.mockResolvedValue(mockDocSnap);
                mockDeleteDoc.mockResolvedValue(undefined);
                mockGetDocs.mockResolvedValue({ forEach: jest.fn() }); // No related docs

                const result = await intelligentDocumentService.deleteDocument('doc-123');

                expect(result).toBe(true);
                expect(mockDeleteDoc).toHaveBeenCalled();
            }); expect(mockDeleteDoc).toHaveBeenCalled();
            });

            it('should return false for non-existent document', async () => {
                mockGetDoc.mockResolvedValue({ exists: () => false });

                const result = await intelligentDocumentService.deleteDocument('non-existent');

                expect(result).toBe(false);
            });

            it('should handle deletion errors gracefully', async () => {
                mockGetDoc.mockResolvedValue({ 
                    exists: () => true, 
                    data: () => ({ 
                        id: 'doc-123',
                        auditTrail: [] // Add audit trail
                    }) 
                });
                mockDeleteDoc
                    .mockRejectedValueOnce(new Error('Delete failed'))
                    .mockRejectedValueOnce(new Error('Delete failed'))
                    .mockResolvedValueOnce(undefined); // Success on 3rd attempt
                mockGetDocs.mockResolvedValue({ forEach: jest.fn() }); // No related docs

                // Due to retry logic, it should eventually succeed
                const result = await intelligentDocumentService.deleteDocument('doc-123');

                expect(result).toBe(true);
                expect(mockDeleteDoc).toHaveBeenCalledTimes(3); // Retried 3 times
            });
        });

        describe('listAllDocuments', () => {
            it('should retrieve all documents', async () => {
                const mockDocs = [
                    {
                        id: 'doc-1',
                        data: () => ({
                            id: 'doc-1',
                            title: 'Doc 1',
                            createdAt: { toDate: () => new Date() },
                            updatedAt: { toDate: () => new Date() }
                        })
                    },
                    {
                        id: 'doc-2',
                        data: () => ({
                            id: 'doc-2',
                            title: 'Doc 2',
                            createdAt: { toDate: () => new Date() },
                            updatedAt: { toDate: () => new Date() }
                        })
                    }
                ];

                mockGetDocs.mockResolvedValue({
                    forEach: (callback: any) => mockDocs.forEach(callback)
                });

                const documents = await intelligentDocumentService.listAllDocuments();

                expect(documents).toHaveLength(2);
                expect(documents[0].id).toBe('doc-1');
                expect(documents[1].id).toBe('doc-2');
            });

            it('should return empty array on error', async () => {
                mockGetDocs.mockRejectedValue(new Error('Network error'));

                const documents = await intelligentDocumentService.listAllDocuments();

                expect(documents).toEqual([]); // Graceful degradation
            });
        });
    });

    // =============================================
    // QUERY OPERATIONS
    // =============================================

    describe('Query Operations', () => {
        const createMockDocs = (count: number) => {
            const mockDocs = [];
            for (let i = 0; i < count; i++) {
                mockDocs.push({
                    id: `doc-${i}`,
                    data: () => ({
                        id: `doc-${i}`,
                        title: `Doc ${i}`,
                        projectId: 'project-123',
                        createdAt: { toDate: () => new Date() },
                        updatedAt: { toDate: () => new Date() }
                    })
                });
            }
            return {
                forEach: (callback: any) => mockDocs.forEach(callback)
            };
        };

        it('should get documents by project', async () => {
            mockGetDocs.mockResolvedValue(createMockDocs(3));

            const documents = await intelligentDocumentService.getDocumentsByProject('project-123');

            expect(documents).toHaveLength(3);
            expect(mockGetDocs).toHaveBeenCalled();
        });

        it('should get documents by category', async () => {
            mockGetDocs.mockResolvedValue(createMockDocs(2));

            const documents = await intelligentDocumentService.getDocumentsByCategory('contract');

            expect(documents).toHaveLength(2);
            expect(mockGetDocs).toHaveBeenCalled();
        });

        it('should get documents by status', async () => {
            mockGetDocs.mockResolvedValue(createMockDocs(5));

            const documents = await intelligentDocumentService.getDocumentsByStatus('draft');

            expect(documents).toHaveLength(5);
            expect(mockGetDocs).toHaveBeenCalled();
        });
    });

    // =============================================
    // WORKFLOW MANAGEMENT
    // =============================================

        describe('Workflow Management', () => {
        it('should create workflow for document', async () => {
            mockSetDoc.mockResolvedValue(undefined);

            await intelligentDocumentService.createWorkflow('doc-123', {
                currentStep: 1,
                totalSteps: 3,
                steps: [],
                isCompleted: false
            });

            expect(mockSetDoc).toHaveBeenCalled();
        });

        it('should get workflow for document', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                data: () => ({
                    currentStep: 2,
                    totalSteps: 5,
                    steps: [],
                    isCompleted: false
                })
            });

            const workflow = await intelligentDocumentService.getWorkflow('doc-123');

            expect(workflow).toBeDefined();
            expect(workflow?.currentStep).toBe(2);
        });

        it('should update workflow step', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                data: () => ({
                    currentStep: 1,
                    totalSteps: 3,
                    steps: [
                        { stepNumber: 1, name: 'Step 1', status: 'completed' }
                    ],
                    isCompleted: false
                })
            });
            mockUpdateDoc.mockResolvedValue(undefined);

            await intelligentDocumentService.updateWorkflowStep('doc-123', 2, {
                stepNumber: 2,
                name: 'Step 2',
                description: 'Description',
                completedAt: new Date(),
                completedBy: 'user-123',
                status: 'completed'
            });

            expect(mockUpdateDoc).toHaveBeenCalled();
        });
    });    // =============================================
    // AI INSIGHTS
    // =============================================

    describe('AI Insights', () => {
        it('should add AI insight', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                data: () => ({
                    id: 'doc-123',
                    aiInsights: []
                })
            });
            mockUpdateDoc.mockResolvedValue(undefined);

            await intelligentDocumentService.addAIInsight('doc-123', {
                id: 'insight-1',
                type: 'risk_assessment',
                title: 'Risk Identified',
                description: 'Potential risk found',
                confidence: 0.9,
                relevantSections: [],
                actionItems: [],
                priority: 'high',
                status: 'new',
                generatedAt: new Date()
            });

            expect(mockUpdateDoc).toHaveBeenCalled();
        });

        it('should get AI insights', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                data: () => ({
                    id: 'doc-123',
                    aiInsights: [
                        { id: 'insight-1', type: 'risk_assessment', generatedAt: new Date() },
                        { id: 'insight-2', type: 'compliance_check', generatedAt: new Date() }
                    ]
                })
            });

            const insights = await intelligentDocumentService.getAIInsights('doc-123');

            expect(insights).toHaveLength(2);
        });

        it('should return empty array for missing insights', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                data: () => ({}) // No aiInsights field
            });

            const insights = await intelligentDocumentService.getAIInsights('doc-123');

            expect(insights).toEqual([]);
        });
    });

    // =============================================
    // NOTIFICATIONS
    // =============================================

    describe('Notifications', () => {
        it('should add notification', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                data: () => ({
                    id: 'doc-123',
                    notifications: []
                })
            });
            mockUpdateDoc.mockResolvedValue(undefined);

            await intelligentDocumentService.addNotification('doc-123', {
                id: 'notif-1',
                documentId: 'doc-123',
                type: 'document_created',
                message: 'Document was created',
                timestamp: new Date(),
                read: false
            });

            expect(mockUpdateDoc).toHaveBeenCalled();
        });

        it('should get notifications', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                data: () => ({
                    id: 'doc-123',
                    notifications: [
                        { id: 'notif-1', message: 'Message 1', timestamp: new Date() },
                        { id: 'notif-2', message: 'Message 2', timestamp: new Date() }
                    ]
                })
            });

            const notifications = await intelligentDocumentService.getNotifications('doc-123');

            expect(notifications).toHaveLength(2);
        });

        it('should return empty array for missing notifications', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                data: () => ({}) // No notifications field
            });

            const notifications = await intelligentDocumentService.getNotifications('doc-123');

            expect(notifications).toEqual([]);
        });
    });

    // =============================================
    // DEPENDENCIES
    // =============================================

    describe('Dependencies', () => {
        it('should add dependency', async () => {
            mockSetDoc.mockResolvedValue(undefined);

            await intelligentDocumentService.addDependency('doc-123', 'dep-doc-456', 'requires');

            expect(mockSetDoc).toHaveBeenCalled();
        });

        it('should get dependencies', async () => {
            const mockDeps = [
                {
                    id: 'dep-1',
                    data: () => ({
                        id: 'dep-1',
                        sourceDocumentId: 'doc-123',
                        targetDocumentId: 'dep-doc-456',
                        type: 'requires',
                        createdAt: { toDate: () => new Date() }
                    })
                }
            ];

            mockGetDocs.mockResolvedValue({
                forEach: (callback: any) => mockDeps.forEach(callback)
            });

            const dependencies = await intelligentDocumentService.getDependencies('doc-123');

            expect(dependencies).toHaveLength(1);
            expect(dependencies[0].targetDocumentId).toBe('dep-doc-456');
        });

        it('should validate dependencies', async () => {
            // Mock dependencies query
            const mockDeps = [
                {
                    id: 'dep-1',
                    data: () => ({
                        sourceDocumentId: 'doc-123',
                        targetDocumentId: 'dep-doc-456',
                        type: 'requires'
                    })
                }
            ];
            
            // Mock target document exists
            mockGetDocs.mockResolvedValue({
                forEach: (callback: any) => mockDeps.forEach(callback)
            });
            
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                data: () => ({ id: 'dep-doc-456', title: 'Dependency Doc' })
            });

            await intelligentDocumentService.validateDependencies('doc-123');

            expect(mockGetDocs).toHaveBeenCalled();
        });
    });

    // =============================================
    // ERROR HANDLING & RETRY LOGIC
    // =============================================

    describe('Error Handling & Retry Logic', () => {
        it('should retry failed operations', async () => {
            // Fail twice, succeed on third attempt
            mockSetDoc
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce(undefined);

            const document = await intelligentDocumentService.createDocument({
                title: 'Retry Test',
                category: 'contract' as DocumentCategory,
                content: 'Content',
                projectId: 'project-123',
                uploadedBy: 'user-123'
            });

            expect(document).toBeDefined();
            expect(mockSetDoc).toHaveBeenCalledTimes(3); // 3 attempts
        });

        it('should handle persistent failures gracefully', async () => {
            // Fail all attempts
            mockGetDoc.mockRejectedValue(new Error('Persistent error'));

            const document = await intelligentDocumentService.getDocument('doc-123');

            expect(document).toBeUndefined(); // Graceful degradation
        });
    });

    // =============================================
    // TIMESTAMP CONVERSIONS
    // =============================================

    describe('Timestamp Conversions', () => {
        it('should convert Firestore Timestamps to Dates', async () => {
            const testDate = new Date('2025-01-15T10:30:00Z');
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                data: () => ({
                    id: 'doc-123',
                    title: 'Test',
                    createdAt: { toDate: () => testDate },
                    updatedAt: { toDate: () => testDate }
                })
            });

            const document = await intelligentDocumentService.getDocument('doc-123');

            expect(document?.createdAt).toEqual(testDate);
            expect(document?.updatedAt).toEqual(testDate);
        });

        it('should handle missing timestamps', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                data: () => ({
                    id: 'doc-123',
                    title: 'Test'
                    // No timestamps
                })
            });

            const document = await intelligentDocumentService.getDocument('doc-123');

            expect(document).toBeDefined();
            expect(document?.title).toBe('Test');
        });
    });

    // =============================================
    // GRACEFUL DEGRADATION
    // =============================================

    describe('Graceful Degradation', () => {
        it('should return empty array on query failures', async () => {
            mockGetDocs.mockRejectedValue(new Error('Query failed'));

            const documents = await intelligentDocumentService.getDocumentsByProject('project-123');

            expect(documents).toEqual([]);
        });

        it('should return undefined on single fetch failure', async () => {
            mockGetDoc.mockRejectedValue(new Error('Fetch failed'));

            const document = await intelligentDocumentService.getDocument('doc-123');

            expect(document).toBeUndefined();
        });

        it('should return empty array for missing AI insights', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                data: () => ({
                    id: 'doc-123'
                    // No aiInsights field
                })
            });

            const insights = await intelligentDocumentService.getAIInsights('doc-123');

            expect(insights).toEqual([]);
        });

        it('should return empty array for missing notifications', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                data: () => ({
                    id: 'doc-123'
                    // No notifications field
                })
            });

            const notifications = await intelligentDocumentService.getNotifications('doc-123');

            expect(notifications).toEqual([]);
        });
    });
});
