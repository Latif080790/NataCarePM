/**
 * Test Data Factory
 * Simplified factory functions to create mock data for testing
 */

import type { 
  Project, 
  Task, 
  IntelligentDocument, 
  User,
  PurchaseOrder,
  DocumentCategory,
  DocumentStatus 
} from '../types';

export const createMockUser = (overrides?: Partial<User>): User => ({
  uid: 'test-user-uid',
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  roleId: 'admin-role',
  avatarUrl: '',
  isOnline: true,
  lastSeen: '2025-01-01T00:00:00.000Z',
  permissions: [],
  ...overrides
});

export const createMockProject = (overrides?: Partial<Project>): Project => ({
  id: 'test-project-id',
  name: 'Test Project',
  location: 'Test Location',
  startDate: '2025-01-01',
  items: [],
  members: [],
  dailyReports: [],
  attendances: [],
  expenses: [],
  documents: [],
  purchaseOrders: [],
  inventory: [],
  termins: [],
  auditLog: [],
  aiInsight: undefined,
  ...overrides
});

export const createMockTask = (overrides?: Partial<Task>): Task => ({
  id: 'test-task-id',
  projectId: 'test-project-id',
  title: 'Test Task',
  description: 'Test task description',
  status: 'in-progress',
  priority: 'medium',
  assignedTo: ['test-user-id'],
  createdBy: 'test-user-id',
  startDate: '2025-01-01',
  dueDate: '2025-01-31',
  dependencies: [],
  subtasks: [],
  progress: 50,
  tags: ['test'],
  rabItemId: undefined,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...overrides
});

export const createMockDocument = (overrides?: Partial<IntelligentDocument>): IntelligentDocument => ({
  id: 'test-document-id',
  title: 'Test Document',
  description: 'Test document description',
  category: 'contract' as DocumentCategory,
  projectId: 'test-project-id',
  createdBy: 'test-user-id',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  
  // File Information
  currentVersionId: 'version-1',
  allVersions: [],
  branches: [],
  
  // AI & OCR
  ocrResults: [],
  extractedData: {
    projectName: 'Test Project',
    contractNumber: 'CONTRACT-001',
    dates: [],
    amounts: [],
    materials: [],
    personnel: [],
    coordinates: [],
    specifications: [],
    signatures: [],
    tables: [],
    customFields: {}
  },
  aiInsights: [],
  
  // Templates & Generation
  templateId: undefined,
  generatedFromTemplate: false,
  autoGenerationSettings: undefined,
  
  // Digital Signatures
  signatures: [],
  signatureWorkflow: undefined,
  requiresSignature: false,
  
  // Security & Compliance
  accessControl: {
    visibility: 'internal',
    permissions: [],
    inheritFromProject: true,
    watermark: undefined,
    downloadRestrictions: []
  },
  encryptionStatus: {
    algorithm: '',
    keyId: '',
    isEncrypted: false,
    encryptionLevel: 'none'
  },
  complianceInfo: {
    standards: [],
    certifications: [],
    retentionPolicy: {
      retentionPeriod: 7,
      archivalLocation: 'main-archive',
      destructionDate: undefined,
      legalHold: false
    },
    dataClassification: 'internal',
    regulatoryRequirements: []
  },
  auditTrail: [],
  
  // Metadata & Classification
  tags: ['test', 'document'],
  customFields: {},
  relatedDocuments: [],
  dependencies: [],
  
  // Status & Workflow
  status: 'pending' as DocumentStatus,
  workflow: {
    workflowId: 'workflow-1',
    currentStep: 1,
    totalSteps: 3,
    steps: [],
    isCompleted: false,
    canSkipSteps: false,
    escalationRules: []
  },
  notifications: [],
  
  // Additional properties
  collaborators: [],
  fileSize: 1024000,
  mimeType: 'application/pdf',
  checksum: 'mock-checksum-12345',
  
  // Search & Discovery
  searchableContent: 'Sample extracted text from document',
  keywords: ['test', 'document', 'contract'],
  language: 'en',
  region: 'ID',
  
  ...overrides
});

export const createMockPurchaseOrder = (overrides?: Partial<PurchaseOrder>): PurchaseOrder => ({
  id: 'test-po-id',
  prNumber: 'PR-2025-001',
  poNumber: 'PO-2025-001',
  status: 'Menunggu Persetujuan',
  requester: 'test-user-id',
  requestDate: '2025-01-01',
  approver: undefined,
  approvalDate: undefined,
  vendorId: 'vendor-1',
  vendorName: 'Test Vendor Inc.',
  totalAmount: 50000,
  grnStatus: 'Belum Diterima',
  items: [
    {
      id: 'item-1',
      materialName: 'Test Material',
      description: 'Test Item 1',
      quantity: 10,
      unit: 'pcs',
      pricePerUnit: 5000,
      totalPrice: 50000,
      receivedQuantity: 0,
      status: 'pending'
    }
  ],
  notes: undefined,
  ...overrides
});

export const createMockFile = (
  name: string = 'test-file.pdf',
  type: string = 'application/pdf',
  size: number = 1024000
): File => {
  const blob = new Blob(['mock file content'], { type });
  return new File([blob], name, { type, lastModified: Date.now() });
};

// Batch creation helpers
export const createMockUsers = (count: number = 5): User[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockUser({
      id: `user-${i + 1}`,
      uid: `user-uid-${i + 1}`,
      email: `user${i + 1}@example.com`,
      name: `User ${i + 1}`
    })
  );
};

export const createMockProjects = (count: number = 5): Project[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockProject({
      id: `project-${i + 1}`,
      name: `Project ${i + 1}`,
      location: `Location ${i + 1}`
    })
  );
};

export const createMockTasks = (count: number = 10, projectId?: string): Task[] => {
  const statuses = ['todo', 'in-progress', 'completed'] as const;
  return Array.from({ length: count }, (_, i) => 
    createMockTask({
      id: `task-${i + 1}`,
      title: `Task ${i + 1}`,
      projectId: projectId || `project-${Math.floor(i / 2) + 1}`,
      status: statuses[i % 3]
    })
  );
};

export const createMockDocuments = (count: number = 10, projectId?: string): IntelligentDocument[] => {
  const categories: DocumentCategory[] = ['contract', 'permit', 'drawing', 'report', 'specification'];
  
  return Array.from({ length: count }, (_, i) => 
    createMockDocument({
      id: `document-${i + 1}`,
      title: `Document ${i + 1}`,
      projectId: projectId || `project-${Math.floor(i / 2) + 1}`,
      category: categories[i % categories.length]
    })
  );
};
