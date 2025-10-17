/**
 * Unit Tests for Intelligent Document Service
 * Phase 2.5: Comprehensive Testing
 * 
 * Coverage:
 * - CRUD Operations (create, read, update, delete, list, query)
 * - Error Handling & Retry Logic
 * - Validation Functions
 * - AI Processing
 * - Workflow Management
 * - Notifications & Dependencies
 * - Timestamp Conversions
 * - Graceful Degradation
 * 
 * Target: 80%+ Code Coverage
 */

import { intelligentDocumentService } from '../../api/intelligentDocumentService';
import type { 
    IntelligentDocument, 
    DocumentCategory, 
    DocumentStatus,
    DocumentWorkflow,
    AIInsight,
    DocumentNotification,
    DocumentDependency
} from '../../types';

// Mock Firebase Firestore
jest.mock('../../firebaseConfig', () => ({
    db: {},
    storage: {},
}));

// Mock Firestore functions
const mockSetDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockDoc = jest.fn();
const mockCollection = jest.fn();
const mockServerTimestamp = jest.fn(() => new Date());

jest.mock('firebase/firestore', () => ({
    doc: (...args: any[]) => mockDoc(...args),
    collection: (...args: any[]) => mockCollection(...args),
    getDoc: (...args: any[]) => mockGetDoc(...args),
    getDocs: (...args: any[]) => mockGetDocs(...args),
    setDoc: (...args: any[]) => mockSetDoc(...args),
    updateDoc: (...args: any[]) => mockUpdateDoc(...args),
    deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
    query: (...args: any[]) => mockQuery(...args),
    where: (...args: any[]) => mockWhere(...args),
    orderBy: (...args: any[]) => mockOrderBy(...args),
    serverTimestamp: () => mockServerTimestamp(),
    Timestamp: {
        now: () => ({ toDate: () => new Date() }),
        fromDate: (date: Date) => ({ toDate: () => date })
    }
}));

// Mock logger to avoid console noise in tests
jest.mock('../../api/utils/logger', () => ({
    createScopedLogger: () => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        success: jest.fn()
    })
}));

describe('IntelligentDocumentService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('CRUD Operations', () => {
        describe('createDocument', () => {
            it('should create a new document with valid data', async () => {
                const mockDocRef = { id: 'doc-123' };
                mockDoc.mockReturnValue(mockDocRef);
                mockSetDoc.mockResolvedValue(undefined);

                const document = await intelligentDocumentService.createDocument(
                    'Test Document',
                    'Test document description',
                    'contracts' as DocumentCategory,
                    'project-1',
                    'user-1',
                    new File(['test'], 'test.pdf', { type: 'application/pdf' })
                );

                expect(document).toBeDefined();
                expect(document.title).toBe('Test Document');
                expect(document.category).toBe('contract');
                expect(document.projectId).toBe('project-1');
                expect(mockSetDoc).toHaveBeenCalled();
            });

            it('should throw error for invalid title', async () => {
                await expect(
                    intelligentDocumentService.createDocument(
                        '', // Empty title
                        'Empty title test',
                        'contracts' as DocumentCategory,
                        'project-1',
                        'user-1',
                        new File(['test'], 'test.pdf')
                    )
                ).rejects.toThrow();
            });

            it('should throw error for invalid category', async () => {
                await expect(
                    intelligentDocumentService.createDocument(
                        'Test Document',
                        'Test description',
                        'invalid' as DocumentCategory,
                        'project-1',
                        'user-1',
                        new File(['test'], 'test.pdf')
                    )
                ).rejects.toThrow();
            });

            it('should create workflow and store in separate collection', async () => {
                const mockDocRef = { id: 'doc-123' };
                mockDoc.mockReturnValue(mockDocRef);
                mockSetDoc.mockResolvedValue(undefined);

                await intelligentDocumentService.createDocument(
                    'Test Document',
                    'Test description',
                    'contracts' as DocumentCategory,
                    'project-1',
                    'user-1',
                    new File(['test'], 'test.pdf')
                );

                // Should call setDoc twice: once for document, once for workflow
                expect(mockSetDoc).toHaveBeenCalledTimes(2);
            });
        });

        describe('getDocument', () => {
            it('should retrieve an existing document', async () => {
                const mockDocSnap = {
                    exists: () => true,
                    data: () => ({
                        id: 'doc-123',
                        title: 'Test Document',
                        category: 'contract',
                        projectId: 'project-1',
                        status: 'draft',
                        createdAt: { toDate: () => new Date('2025-01-01') },
                        updatedAt: { toDate: () => new Date('2025-01-02') }
                    })
                };

                mockGetDoc.mockResolvedValue(mockDocSnap);

                const document = await intelligentDocumentService.getDocument('doc-123');

                expect(document).toBeDefined();
                expect(document?.id).toBe('doc-123');
                expect(document?.title).toBe('Test Document');
                expect(mockGetDoc).toHaveBeenCalled();
            });

            it('should return undefined for non-existent document', async () => {
                const mockDocSnap = {
                    exists: () => false
                };

                mockGetDoc.mockResolvedValue(mockDocSnap);

                const document = await intelligentDocumentService.getDocument('non-existent');

                expect(document).toBeUndefined();
            });

            it('should handle Firestore errors gracefully', async () => {
                mockGetDoc.mockRejectedValue(new Error('Network error'));

                const document = await intelligentDocumentService.getDocument('doc-123');

                expect(document).toBeUndefined();
            });

            it('should validate document ID before querying', async () => {
                await expect(
                    intelligentDocumentService.getDocument('')
                ).rejects.toThrow();
            });
        });

        describe('updateDocument', () => {
            it('should update an existing document', async () => {
                // Mock existing document
                const mockDocSnap = {
                    exists: () => true,
                    data: () => ({
                        id: 'doc-123',
                        title: 'Old Title',
                        status: 'draft',
                        createdAt: { toDate: () => new Date() },
                        updatedAt: { toDate: () => new Date() }
                    })
                };

                mockGetDoc.mockResolvedValue(mockDocSnap);
                mockUpdateDoc.mockResolvedValue(undefined);

                const updatedDoc = await intelligentDocumentService.updateDocument('doc-123', {
                    title: 'New Title',
                    status: 'published' as DocumentStatus
                });

                expect(updatedDoc).toBeDefined();
                expect(updatedDoc?.title).toBe('New Title');
                expect(mockUpdateDoc).toHaveBeenCalled();
            });

            it('should throw error for non-existent document', async () => {
                const mockDocSnap = {
                    exists: () => false
                };

                mockGetDoc.mockResolvedValue(mockDocSnap);

                await expect(
                    intelligentDocumentService.updateDocument('non-existent', { title: 'New' })
                ).rejects.toThrow('Document not found');
            });

            it('should prevent ID change during update', async () => {
                const mockDocSnap = {
                    exists: () => true,
                    data: () => ({
                        id: 'doc-123',
                        title: 'Original',
                        createdAt: { toDate: () => new Date() },
                        updatedAt: { toDate: () => new Date() }
                    })
                };

                mockGetDoc.mockResolvedValue(mockDocSnap);
                mockUpdateDoc.mockResolvedValue(undefined);

                const updatedDoc = await intelligentDocumentService.updateDocument('doc-123', {
                    id: 'different-id', // Try to change ID
                    title: 'New Title'
                } as any);

                expect(updatedDoc?.id).toBe('doc-123'); // ID should remain unchanged
            });

            it('should update workflow if included in updates', async () => {
                const mockDocSnap = {
                    exists: () => true,
                    data: () => ({
                        id: 'doc-123',
                        title: 'Test',
                        createdAt: { toDate: () => new Date() },
                        updatedAt: { toDate: () => new Date() }
                    })
                };

                const mockWorkflow: DocumentWorkflow = {
                    workflowId: 'test-workflow-1',
                    currentStep: 2,
                    totalSteps: 5,
                    steps: [],
                    isCompleted: false,
                    canSkipSteps: false,
                    escalationRules: []
                };

                mockGetDoc.mockResolvedValue(mockDocSnap);
                mockUpdateDoc.mockResolvedValue(undefined);
                mockSetDoc.mockResolvedValue(undefined);

                await intelligentDocumentService.updateDocument('doc-123', {
                    workflow: mockWorkflow
                });

                // Should update document and workflow
                expect(mockUpdateDoc).toHaveBeenCalled();
                expect(mockSetDoc).toHaveBeenCalled();
            });
        });

        describe('deleteDocument', () => {
            it('should delete document and related collections', async () => {
                const mockDocSnap = {
                    exists: () => true,
                    data: () => ({
                        id: 'doc-123',
                        title: 'Test',
                        createdAt: { toDate: () => new Date() },
                        updatedAt: { toDate: () => new Date() }
                    })
                };

                mockGetDoc.mockResolvedValue(mockDocSnap);
                mockDeleteDoc.mockResolvedValue(undefined);

                const result = await intelligentDocumentService.deleteDocument('doc-123');

                expect(result).toBe(true);
                // Should delete from multiple collections
                expect(mockDeleteDoc).toHaveBeenCalledTimes(4);
            });

            it('should return false for non-existent document', async () => {
                const mockDocSnap = {
                    exists: () => false
                };

                mockGetDoc.mockResolvedValue(mockDocSnap);

                const result = await intelligentDocumentService.deleteDocument('non-existent');

                expect(result).toBe(false);
            });

            it('should handle deletion errors gracefully', async () => {
                const mockDocSnap = {
                    exists: () => true,
                    data: () => ({
                        id: 'doc-123',
                        title: 'Test',
                        createdAt: { toDate: () => new Date() },
                        updatedAt: { toDate: () => new Date() }
                    })
                };

                mockGetDoc.mockResolvedValue(mockDocSnap);
                mockDeleteDoc.mockRejectedValue(new Error('Delete failed'));

                const result = await intelligentDocumentService.deleteDocument('doc-123');

                expect(result).toBe(false);
            });
        });

        describe('listAllDocuments', () => {
            it('should retrieve all documents', async () => {
                const mockQuerySnapshot = {
                    forEach: (callback: any) => {
                        [
                            {
                                data: () => ({
                                    id: 'doc-1',
                                    title: 'Doc 1',
                                    createdAt: { toDate: () => new Date() },
                                    updatedAt: { toDate: () => new Date() }
                                })
                            },
                            {
                                data: () => ({
                                    id: 'doc-2',
                                    title: 'Doc 2',
                                    createdAt: { toDate: () => new Date() },
                                    updatedAt: { toDate: () => new Date() }
                                })
                            }
                        ].forEach(callback);
                    }
                };

                mockGetDocs.mockResolvedValue(mockQuerySnapshot);

                const documents = await intelligentDocumentService.listAllDocuments();

                expect(documents).toHaveLength(2);
                expect(documents[0].id).toBe('doc-1');
                expect(documents[1].id).toBe('doc-2');
            });

            it('should return empty array on error', async () => {
                mockGetDocs.mockRejectedValue(new Error('Network error'));

                const documents = await intelligentDocumentService.listAllDocuments();

                expect(documents).toEqual([]);
            });
        });

        describe('Query Operations', () => {
            const createMockQuerySnapshot = (docs: any[]) => ({
                forEach: (callback: any) => docs.forEach(callback)
            });

            it('should get documents by project', async () => {
                const mockDocs = [
                    {
                        data: () => ({
                            id: 'doc-1',
                            projectId: 'project-1',
                            title: 'Doc 1',
                            createdAt: { toDate: () => new Date() },
                            updatedAt: { toDate: () => new Date() }
                        })
                    }
                ];

                mockGetDocs.mockResolvedValue(createMockQuerySnapshot(mockDocs));

                const documents = await intelligentDocumentService.getDocumentsByProject('project-1');

                expect(documents).toHaveLength(1);
                expect(documents[0].projectId).toBe('project-1');
            });

            it('should get documents by category', async () => {
                const mockDocs = [
                    {
                        data: () => ({
                            id: 'doc-1',
                            category: 'contract',
                            title: 'Contract Doc',
                            createdAt: { toDate: () => new Date() },
                            updatedAt: { toDate: () => new Date() }
                        })
                    }
                ];

                mockGetDocs.mockResolvedValue(createMockQuerySnapshot(mockDocs));

                const documents = await intelligentDocumentService.getDocumentsByCategory('contract' as DocumentCategory);

                expect(documents).toHaveLength(1);
                expect(documents[0].category).toBe('contract');
            });

            it('should get documents by status', async () => {
                const mockDocs = [
                    {
                        data: () => ({
                            id: 'doc-1',
                            status: 'published',
                            title: 'Published Doc',
                            createdAt: { toDate: () => new Date() },
                            updatedAt: { toDate: () => new Date() }
                        })
                    }
                ];

                mockGetDocs.mockResolvedValue(createMockQuerySnapshot(mockDocs));

                const documents = await intelligentDocumentService.getDocumentsByStatus('published' as DocumentStatus);

                expect(documents).toHaveLength(1);
                expect(documents[0].status).toBe('published');
            });
        });
    });

    describe('Validation Functions', () => {
        it('should validate document ID', () => {
            expect(() => 
                intelligentDocumentService.getDocument('')
            ).rejects.toThrow();
        });

        it('should validate document category', async () => {
            await expect(
                intelligentDocumentService.createDocument(
                    'Test',
                    'Test description',
                    'invalid-category' as DocumentCategory,
                    'project-1',
                    'user-1',
                    new File(['test'], 'test.pdf')
                )
            ).rejects.toThrow();
        });

        it('should validate document status', async () => {
            const mockDocSnap = {
                exists: () => true,
                data: () => ({
                    id: 'doc-123',
                    title: 'Test',
                    status: 'draft',
                    createdAt: { toDate: () => new Date() },
                    updatedAt: { toDate: () => new Date() }
                })
            };

            mockGetDoc.mockResolvedValue(mockDocSnap);

            await expect(
                intelligentDocumentService.updateDocument('doc-123', {
                    status: 'invalid-status' as DocumentStatus
                })
            ).rejects.toThrow();
        });
    });

    describe('Workflow Management', () => {
        it('should create workflow for document', async () => {
            const workflow: DocumentWorkflow = {
                workflowId: 'test-workflow-2',
                currentStep: 1,
                totalSteps: 3,
                steps: [],
                isCompleted: false,
                canSkipSteps: false,
                escalationRules: []
            };

            mockSetDoc.mockResolvedValue(undefined);

            await intelligentDocumentService.createWorkflow('doc-123', workflow);

            expect(mockSetDoc).toHaveBeenCalled();
        });

        it('should get workflow for document', async () => {
            const mockWorkflowSnap = {
                exists: () => true,
                data: () => ({
                    currentStep: 2,
                    totalSteps: 5,
                    steps: [],
                    isCompleted: false
                })
            };

            mockGetDoc.mockResolvedValue(mockWorkflowSnap);

            const workflow = await intelligentDocumentService.getWorkflow('doc-123');

            expect(workflow).toBeDefined();
            expect(workflow?.currentStep).toBe(2);
        });

        it('should update workflow step', async () => {
            const mockWorkflowSnap = {
                exists: () => true,
                data: () => ({
                    currentStep: 1,
                    totalSteps: 3,
                    steps: [
                        { stepNumber: 1, name: 'Step 1', isCompleted: false },
                        { stepNumber: 2, name: 'Step 2', isCompleted: false }
                    ],
                    isCompleted: false
                })
            };

            mockGetDoc.mockResolvedValue(mockWorkflowSnap);
            mockSetDoc.mockResolvedValue(undefined);

            await intelligentDocumentService.updateWorkflowStep('doc-123', 1, true);

            expect(mockSetDoc).toHaveBeenCalled();
        });
    });

    describe('AI Insights', () => {
        it('should add AI insight', async () => {
            const mockInsightsSnap = {
                exists: () => false
            };

            const insight: AIInsight = {
                id: 'insight-1',
                type: 'summary',
                title: 'Test Insight',
                description: 'Test description',
                confidence: 0.9,
                relevantSections: [],
                actionItems: [],
                priority: 'medium',
                status: 'new',
                generatedAt: new Date(),
                metadata: {}
            };

            mockGetDoc.mockResolvedValue(mockInsightsSnap);
            mockSetDoc.mockResolvedValue(undefined);

            await intelligentDocumentService.addAIInsight('doc-123', insight);

            expect(mockSetDoc).toHaveBeenCalled();
        });

        it('should get AI insights', async () => {
            const mockInsightsSnap = {
                exists: () => true,
                data: () => ({
                    insights: [
                        {
                            id: 'insight-1',
                            type: 'summary',
                            title: 'Test',
                            confidence: 0.9
                        }
                    ]
                })
            };

            mockGetDoc.mockResolvedValue(mockInsightsSnap);

            const insights = await intelligentDocumentService.getAIInsights('doc-123');

            expect(insights).toHaveLength(1);
            expect(insights[0].id).toBe('insight-1');
        });
    });

    describe('Notifications', () => {
        it('should add notification', async () => {
            const mockNotificationsSnap = {
                exists: () => false
            };

            const notification: DocumentNotification = {
                id: 'notif-1',
                type: 'signature_pending',
                recipientId: 'user-1',
                message: 'Test notification',
                priority: 'high',
                isRead: false,
                sentAt: new Date(),
                actionRequired: true
            };

            mockGetDoc.mockResolvedValue(mockNotificationsSnap);
            mockSetDoc.mockResolvedValue(undefined);

            await intelligentDocumentService.addNotification('doc-123', notification);

            expect(mockSetDoc).toHaveBeenCalled();
        });

        it('should get notifications', async () => {
            const mockNotificationsSnap = {
                exists: () => true,
                data: () => ({
                    notifications: [
                        {
                            id: 'notif-1',
                            type: 'signature_pending',
                            recipientId: 'user-1',
                            message: 'Test'
                        }
                    ]
                })
            };

            mockGetDoc.mockResolvedValue(mockNotificationsSnap);

            const notifications = await intelligentDocumentService.getNotifications('doc-123');

            expect(notifications).toHaveLength(1);
            expect(notifications[0].id).toBe('notif-1');
        });
    });

    describe('Dependencies', () => {
        it('should add dependency', async () => {
            const mockDepsSnap = {
                exists: () => false
            };

            const dependency: DocumentDependency = {
                dependentDocumentId: 'doc-2',
                dependencyType: 'reference',
                description: 'Test dependency',
                isRequired: true,
                status: 'valid',
                lastChecked: new Date()
            };

            mockGetDoc.mockResolvedValue(mockDepsSnap);
            mockSetDoc.mockResolvedValue(undefined);

            await intelligentDocumentService.addDependency('doc-1', dependency);

            expect(mockSetDoc).toHaveBeenCalled();
        });

        it('should get dependencies', async () => {
            const mockDepsSnap = {
                exists: () => true,
                data: () => ({
                    dependencies: [
                        {
                            dependentDocumentId: 'doc-2',
                            dependencyType: 'reference',
                            status: 'valid'
                        }
                    ]
                })
            };

            mockGetDoc.mockResolvedValue(mockDepsSnap);

            const dependencies = await intelligentDocumentService.getDependencies('doc-1');

            expect(dependencies).toHaveLength(1);
            expect(dependencies[0].dependentDocumentId).toBe('doc-2');
        });

        it('should validate dependencies', async () => {
            const mockDepsSnap = {
                exists: () => true,
                data: () => ({
                    dependencies: [
                        {
                            dependentDocumentId: 'doc-2',
                            dependencyType: 'reference',
                            status: 'valid',
                            lastChecked: new Date('2025-01-01')
                        }
                    ]
                })
            };

            const mockDocSnap = {
                exists: () => true,
                data: () => ({
                    id: 'doc-2',
                    updatedAt: { toDate: () => new Date('2025-01-02') }
                })
            };

            mockGetDoc
                .mockResolvedValueOnce(mockDepsSnap)
                .mockResolvedValueOnce(mockDocSnap);
            mockSetDoc.mockResolvedValue(undefined);

            await intelligentDocumentService.validateDependencies('doc-1');

            expect(mockSetDoc).toHaveBeenCalled();
        });
    });

    describe('Error Handling & Retry Logic', () => {
        it('should retry failed operations', async () => {
            mockSetDoc
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce(undefined);

            const document = await intelligentDocumentService.createDocument(
                'Test Document',
                'Test description',
                'contracts' as DocumentCategory,
                'project-1',
                'user-1',
                new File(['test'], 'test.pdf')
            );

            expect(document).toBeDefined();
            // Should have retried 3 times
            expect(mockSetDoc).toHaveBeenCalledTimes(3);
        });

        it('should handle persistent failures gracefully', async () => {
            mockGetDoc.mockRejectedValue(new Error('Persistent error'));

            const document = await intelligentDocumentService.getDocument('doc-123');

            expect(document).toBeUndefined();
        });
    });

    describe('Timestamp Conversions', () => {
        it('should convert Firestore Timestamps to Dates', async () => {
            const testDate = new Date('2025-01-15');
            const mockDocSnap = {
                exists: () => true,
                data: () => ({
                    id: 'doc-123',
                    title: 'Test',
                    createdAt: { toDate: () => testDate },
                    updatedAt: { toDate: () => testDate }
                })
            };

            mockGetDoc.mockResolvedValue(mockDocSnap);

            const document = await intelligentDocumentService.getDocument('doc-123');

            expect(document?.createdAt).toBeInstanceOf(Date);
            expect(document?.createdAt.toISOString()).toBe(testDate.toISOString());
        });

        it('should handle missing timestamps gracefully', async () => {
            const mockDocSnap = {
                exists: () => true,
                data: () => ({
                    id: 'doc-123',
                    title: 'Test',
                    // Missing createdAt and updatedAt
                })
            };

            mockGetDoc.mockResolvedValue(mockDocSnap);

            const document = await intelligentDocumentService.getDocument('doc-123');

            expect(document?.createdAt).toBeInstanceOf(Date);
            expect(document?.updatedAt).toBeInstanceOf(Date);
        });
    });

    describe('Graceful Degradation', () => {
        it('should return empty arrays on query failures', async () => {
            mockGetDocs.mockRejectedValue(new Error('Query failed'));

            const documents = await intelligentDocumentService.getDocumentsByProject('project-1');

            expect(documents).toEqual([]);
        });

        it('should return undefined on single document fetch failure', async () => {
            mockGetDoc.mockRejectedValue(new Error('Fetch failed'));

            const document = await intelligentDocumentService.getDocument('doc-123');

            expect(document).toBeUndefined();
        });

        it('should return empty array for missing AI insights', async () => {
            const mockInsightsSnap = {
                exists: () => false
            };

            mockGetDoc.mockResolvedValue(mockInsightsSnap);

            const insights = await intelligentDocumentService.getAIInsights('doc-123');

            expect(insights).toEqual([]);
        });

        it('should return empty array for missing notifications', async () => {
            const mockNotificationsSnap = {
                exists: () => false
            };

            mockGetDoc.mockResolvedValue(mockNotificationsSnap);

            const notifications = await intelligentDocumentService.getNotifications('doc-123');

            expect(notifications).toEqual([]);
        });
    });
});
