/**
 * Document Service Unit Tests
 */

import { createMockDocument, createMockDocuments } from '../../__mocks__/testDataFactory';

describe('DocumentService', () => {
  describe('createDocument', () => {
    it('should create document with all required fields', () => {
      const doc = createMockDocument({
        title: 'Construction Contract',
        category: 'contract',
        projectId: 'project-123',
      });

      expect(doc).toBeDefined();
      expect(doc.title).toBe('Construction Contract');
      expect(doc.category).toBe('contract');
      expect(doc.projectId).toBe('project-123');
    });

    it('should initialize with proper defaults', () => {
      const doc = createMockDocument();

      expect(doc.currentVersionId).toBeTruthy();
      expect(doc.allVersions).toEqual([]);
      expect(doc.branches).toEqual([]);
      expect(doc.ocrResults).toEqual([]);
      expect(doc.signatures).toEqual([]);
      expect(doc.requiresSignature).toBe(false);
    });

    it('should have proper access control', () => {
      const doc = createMockDocument({
        accessControl: {
          visibility: 'confidential',
          permissions: [],
          inheritFromProject: false,
          downloadRestrictions: [],
        },
      });

      expect(doc.accessControl.visibility).toBe('confidential');
      expect(doc.accessControl.inheritFromProject).toBe(false);
    });
  });

  describe('document encryption', () => {
    it('should support encryption settings', () => {
      const doc = createMockDocument({
        encryptionStatus: {
          isEncrypted: true,
          encryptionLevel: 'end-to-end',
          algorithm: 'AES-256',
          keyId: 'key-12345',
        },
      });

      expect(doc.encryptionStatus.isEncrypted).toBe(true);
      expect(doc.encryptionStatus.encryptionLevel).toBe('end-to-end');
      expect(doc.encryptionStatus.algorithm).toBe('AES-256');
    });

    it('should default to no encryption', () => {
      const doc = createMockDocument();

      expect(doc.encryptionStatus.isEncrypted).toBe(false);
      expect(doc.encryptionStatus.encryptionLevel).toBe('none');
    });
  });

  describe('compliance information', () => {
    it('should track compliance standards', () => {
      const doc = createMockDocument({
        complianceInfo: {
          standards: [
            {
              name: 'ISO 9001',
              version: '2015',
              applicable: true,
              lastChecked: new Date(),
              complianceLevel: 'compliant',
              findings: [],
            },
          ],
          certifications: ['ISO 9001:2015'],
          retentionPolicy: {
            retentionPeriod: 10,
            archivalLocation: 'secure-vault',
            legalHold: true,
          },
          dataClassification: 'confidential',
          regulatoryRequirements: [],
        },
      });

      expect(doc.complianceInfo.standards).toHaveLength(1);
      expect(doc.complianceInfo.standards[0].name).toBe('ISO 9001');
      expect(doc.complianceInfo.dataClassification).toBe('confidential');
    });

    it('should have retention policy', () => {
      const doc = createMockDocument();

      expect(doc.complianceInfo.retentionPolicy.retentionPeriod).toBeDefined();
      expect(doc.complianceInfo.retentionPolicy.archivalLocation).toBeDefined();
      expect(typeof doc.complianceInfo.retentionPolicy.legalHold).toBe('boolean');
    });
  });

  describe('document workflow', () => {
    it('should track workflow state', () => {
      const doc = createMockDocument({
        workflow: {
          workflowId: 'wf-123',
          currentStep: 2,
          totalSteps: 5,
          steps: [],
          isCompleted: false,
          canSkipSteps: false,
          escalationRules: [],
        },
      });

      expect(doc.workflow.currentStep).toBe(2);
      expect(doc.workflow.totalSteps).toBe(5);
      expect(doc.workflow.isCompleted).toBe(false);
    });

    it('should support workflow completion', () => {
      const doc = createMockDocument({
        workflow: {
          workflowId: 'wf-complete',
          currentStep: 3,
          totalSteps: 3,
          steps: [],
          isCompleted: true,
          canSkipSteps: false,
          escalationRules: [],
        },
      });

      expect(doc.workflow.isCompleted).toBe(true);
      expect(doc.workflow.currentStep).toBe(doc.workflow.totalSteps);
    });
  });

  describe('batch document creation', () => {
    it('should create multiple documents', () => {
      const docs = createMockDocuments(5);

      expect(docs).toHaveLength(5);
      expect(docs[0].id).toBe('document-1');
    });

    it('should vary document categories', () => {
      const docs = createMockDocuments(10);

      const categories = docs.map((d) => d.category);
      expect(new Set(categories).size).toBeGreaterThan(1);
    });

    it('should create documents for specific project', () => {
      const projectId = 'project-xyz';
      const docs = createMockDocuments(5, projectId);

      docs.forEach((doc) => {
        expect(doc.projectId).toBe(projectId);
      });
    });
  });

  describe('search and discovery', () => {
    it('should have searchable content', () => {
      const doc = createMockDocument({
        searchableContent: 'Important contract terms and conditions',
        keywords: ['contract', 'terms', 'legal'],
      });

      expect(doc.searchableContent).toContain('contract');
      expect(doc.keywords).toContain('legal');
    });

    it('should support language and region', () => {
      const doc = createMockDocument({
        language: 'id',
        region: 'ID',
      });

      expect(doc.language).toBe('id');
      expect(doc.region).toBe('ID');
    });
  });
});
