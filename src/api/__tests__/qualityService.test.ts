/**
 * Quality Service Tests
 * NataCarePM - Week 6 Day 4
 *
 * Comprehensive test suite for qualityService
 * Tests quality inspections, defect management, metrics calculation, filtering
 *
 * Service Pattern: Class-based with Firestore integration
 * Dependencies: Firebase Firestore
 *
 * Test Coverage:
 * - Inspection CRUD Operations
 * - Inspection Number Generation
 * - Pass Rate Calculation
 * - Defect CRUD Operations
 * - Defect Number Generation
 * - Filtering (Inspections & Defects)
 * - Quality Metrics Calculation
 * - Timestamp Conversions
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import qualityService from '../qualityService';
import type {
  QualityInspection,
  Defect,
  InspectionType,
  InspectionStatus,
  InspectionResult,
  DefectSeverity,
  DefectStatus,
  ChecklistItem,
  QualityFilterOptions,
  DefectFilterOptions
} from '@/types/quality.types';
import {
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';

// ============================================================================
// Mock Firebase Firestore
// ============================================================================

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  Timestamp: {
    fromDate: vi.fn((date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0
    }))
  }
}));

vi.mock('@/firebaseConfig', () => ({
  db: {}
}));

// ============================================================================
// Test Setup & Mock Data
// ============================================================================

describe('Quality Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProjectId = 'proj-001';
  const mockUserId = 'user-001';

  const createMockChecklist = (): ChecklistItem[] => [
    {
      id: 'item-1',
      itemNumber: '1.1',
      description: 'Foundation depth check',
      acceptanceCriteria: 'Minimum 2m depth',
      result: 'pass' as InspectionResult,
      measuredValue: 2.5,
      requiredValue: 2.0,
      unit: 'm'
    },
    {
      id: 'item-2',
      itemNumber: '1.2',
      description: 'Concrete strength test',
      acceptanceCriteria: 'Minimum 25 MPa',
      result: 'pass' as InspectionResult,
      measuredValue: 28,
      requiredValue: 25,
      unit: 'MPa'
    },
    {
      id: 'item-3',
      itemNumber: '1.3',
      description: 'Reinforcement spacing',
      acceptanceCriteria: 'Maximum 200mm spacing',
      result: 'fail' as InspectionResult,
      measuredValue: 250,
      requiredValue: 200,
      unit: 'mm',
      notes: 'Spacing exceeds specification'
    },
    {
      id: 'item-4',
      itemNumber: '1.4',
      description: 'Surface finishing',
      acceptanceCriteria: 'Smooth finish, no cracks',
      result: 'conditional' as InspectionResult,
      notes: 'Minor surface imperfections'
    }
  ];

  const createMockInspection = (overrides: Partial<Omit<QualityInspection, 'id' | 'inspectionNumber' | 'createdAt' | 'updatedAt' | 'passedItems' | 'failedItems' | 'conditionalItems' | 'totalItems' | 'passRate'>> = {}): Omit<QualityInspection, 'id' | 'inspectionNumber' | 'createdAt' | 'updatedAt' | 'passedItems' | 'failedItems' | 'conditionalItems' | 'totalItems' | 'passRate'> => ({
    projectId: mockProjectId,
    inspectionType: 'structural' as InspectionType,
    title: 'Foundation Inspection',
    description: 'Structural inspection of foundation work',
    scheduledDate: new Date('2025-01-15'),
    inspector: mockUserId,
    location: 'Building A - Foundation',
    checklist: createMockChecklist(),
    photos: [],
    overallResult: 'conditional' as InspectionResult,
    defectsFound: [],
    notes: 'Inspection completed with minor issues',
    status: 'completed' as InspectionStatus,
    ...overrides
  });

  const createMockDefect = (overrides: Partial<Omit<Defect, 'id' | 'defectNumber' | 'createdAt' | 'updatedAt'>> = {}): Omit<Defect, 'id' | 'defectNumber' | 'createdAt' | 'updatedAt'> => ({
    projectId: mockProjectId,
    title: 'Reinforcement Spacing Issue',
    description: 'Reinforcement bars spaced at 250mm instead of 200mm',
    severity: 'major' as DefectSeverity,
    category: 'workmanship',
    location: 'Building A - Foundation',
    photos: [],
    identifiedBy: mockUserId,
    identifiedDate: new Date('2025-01-15'),
    correctiveAction: 'Re-position reinforcement bars to meet specification',
    status: 'open' as DefectStatus,
    ...overrides
  });

  // ============================================================================
  // Test Group 1: Inspection Number Generation
  // ============================================================================

  describe('Inspection Number Generation', () => {
    it('should generate sequential inspection numbers', async () => {
      const mockInspection = createMockInspection();
      const mockDocRef = { id: 'inspection-001' };

      (addDoc as Mock).mockResolvedValue(mockDocRef);
      (getDocs as Mock).mockResolvedValue({ size: 5, docs: [] });

      const result = await qualityService.createInspection(mockInspection);

      const year = new Date().getFullYear();
      expect(result.inspectionNumber).toBe(`QI-${year}-006`); // 5 + 1 = 006
    });

    it('should pad inspection numbers with zeros', async () => {
      const mockInspection = createMockInspection();
      const mockDocRef = { id: 'inspection-002' };

      (addDoc as Mock).mockResolvedValue(mockDocRef);
      (getDocs as Mock).mockResolvedValue({ size: 0, docs: [] });

      const result = await qualityService.createInspection(mockInspection);

      const year = new Date().getFullYear();
      expect(result.inspectionNumber).toBe(`QI-${year}-001`); // 0 + 1 = 001
    });

    it('should handle large inspection counts', async () => {
      const mockInspection = createMockInspection();
      const mockDocRef = { id: 'inspection-large' };

      (addDoc as Mock).mockResolvedValue(mockDocRef);
      (getDocs as Mock).mockResolvedValue({ size: 99, docs: [] });

      const result = await qualityService.createInspection(mockInspection);

      const year = new Date().getFullYear();
      expect(result.inspectionNumber).toBe(`QI-${year}-100`); // 99 + 1 = 100
    });
  });

  // ============================================================================
  // Test Group 2: Pass Rate Calculation
  // ============================================================================

  describe('Pass Rate Calculation', () => {
    it('should calculate pass rate correctly for mixed results', async () => {
      const mockInspection = createMockInspection({
        checklist: createMockChecklist() // 2 pass, 1 fail, 1 conditional
      });

      const mockDocRef = { id: 'inspection-pass-rate' };
      (addDoc as Mock).mockResolvedValue(mockDocRef);
      (getDocs as Mock).mockResolvedValue({ size: 0, docs: [] });

      const result = await qualityService.createInspection(mockInspection);

      expect(result.totalItems).toBe(4);
      expect(result.passedItems).toBe(2);
      expect(result.failedItems).toBe(1);
      expect(result.conditionalItems).toBe(1);
      expect(result.passRate).toBe(50); // 2/4 * 100
    });

    it('should calculate 100% pass rate for all passed items', async () => {
      const allPassChecklist: ChecklistItem[] = [
        {
          id: 'item-1',
          itemNumber: '1.1',
          description: 'Test 1',
          acceptanceCriteria: 'Pass',
          result: 'pass' as InspectionResult
        },
        {
          id: 'item-2',
          itemNumber: '1.2',
          description: 'Test 2',
          acceptanceCriteria: 'Pass',
          result: 'pass' as InspectionResult
        }
      ];

      const mockInspection = createMockInspection({
        checklist: allPassChecklist
      });

      const mockDocRef = { id: 'inspection-100-pass' };
      (addDoc as Mock).mockResolvedValue(mockDocRef);
      (getDocs as Mock).mockResolvedValue({ size: 0, docs: [] });

      const result = await qualityService.createInspection(mockInspection);

      expect(result.passRate).toBe(100);
      expect(result.passedItems).toBe(2);
      expect(result.failedItems).toBe(0);
    });

    it('should calculate 0% pass rate for all failed items', async () => {
      const allFailChecklist: ChecklistItem[] = [
        {
          id: 'item-1',
          itemNumber: '1.1',
          description: 'Test 1',
          acceptanceCriteria: 'Fail',
          result: 'fail' as InspectionResult
        },
        {
          id: 'item-2',
          itemNumber: '1.2',
          description: 'Test 2',
          acceptanceCriteria: 'Fail',
          result: 'fail' as InspectionResult
        }
      ];

      const mockInspection = createMockInspection({
        checklist: allFailChecklist
      });

      const mockDocRef = { id: 'inspection-0-pass' };
      (addDoc as Mock).mockResolvedValue(mockDocRef);
      (getDocs as Mock).mockResolvedValue({ size: 0, docs: [] });

      const result = await qualityService.createInspection(mockInspection);

      expect(result.passRate).toBe(0);
      expect(result.failedItems).toBe(2);
      expect(result.passedItems).toBe(0);
    });

    it('should handle empty checklist', async () => {
      const mockInspection = createMockInspection({
        checklist: []
      });

      const mockDocRef = { id: 'inspection-empty' };
      (addDoc as Mock).mockResolvedValue(mockDocRef);
      (getDocs as Mock).mockResolvedValue({ size: 0, docs: [] });

      const result = await qualityService.createInspection(mockInspection);

      expect(result.totalItems).toBe(0);
      expect(result.passRate).toBe(0);
    });
  });

  // ============================================================================
  // Test Group 3: Inspection CRUD Operations
  // ============================================================================

  describe('Inspection CRUD Operations', () => {
    it('should create inspection with all required fields', async () => {
      const mockInspection = createMockInspection();
      const mockDocRef = { id: 'inspection-new' };

      (addDoc as Mock).mockResolvedValue(mockDocRef);
      (getDocs as Mock).mockResolvedValue({ size: 0, docs: [] });

      const result = await qualityService.createInspection(mockInspection);

      expect(result.id).toBe('inspection-new');
      expect(result.inspectionNumber).toMatch(/^QI-\d{4}-\d{3}$/);
      expect(result.title).toBe(mockInspection.title);
      expect(result.status).toBe('completed');
      expect(result.passRate).toBe(50);
    });

    it('should get inspection by ID', async () => {
      const mockInspection: QualityInspection = {
        ...createMockInspection(),
        id: 'inspection-get',
        inspectionNumber: 'QI-2025-001',
        passedItems: 2,
        failedItems: 1,
        conditionalItems: 1,
        totalItems: 4,
        passRate: 50,
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15')
      };

      const mockDocSnap = {
        exists: () => true,
        id: 'inspection-get',
        data: () => ({
          ...mockInspection,
          scheduledDate: Timestamp.fromDate(mockInspection.scheduledDate),
          actualDate: mockInspection.actualDate ? Timestamp.fromDate(mockInspection.actualDate) : null,
          completedDate: mockInspection.completedDate ? Timestamp.fromDate(mockInspection.completedDate) : null,
          createdAt: Timestamp.fromDate(mockInspection.createdAt),
          updatedAt: Timestamp.fromDate(mockInspection.updatedAt)
        })
      };

      (doc as Mock).mockReturnValue({});
      (getDoc as Mock).mockResolvedValue(mockDocSnap);

      const result = await qualityService.getInspectionById('inspection-get');

      expect(result).toBeDefined();
      expect(result?.id).toBe('inspection-get');
      expect(result?.title).toBe(mockInspection.title);
      expect(result?.passRate).toBe(50);
    });

    it('should return null for non-existent inspection', async () => {
      const mockDocSnap = {
        exists: () => false
      };

      (doc as Mock).mockReturnValue({});
      (getDoc as Mock).mockResolvedValue(mockDocSnap);

      const result = await qualityService.getInspectionById('non-existent');

      expect(result).toBeNull();
    });

    it('should get all inspections for project', async () => {
      const mockInspections: QualityInspection[] = [
        {
          ...createMockInspection(),
          id: 'inspection-1',
          inspectionNumber: 'QI-2025-001',
          passedItems: 2,
          failedItems: 1,
          conditionalItems: 1,
          totalItems: 4,
          passRate: 50,
          createdAt: new Date('2025-01-15'),
          updatedAt: new Date('2025-01-15')
        }
      ];

      const mockQuerySnapshot = {
        docs: mockInspections.map(i => ({
          id: i.id,
          data: () => ({
            ...i,
            scheduledDate: Timestamp.fromDate(i.scheduledDate),
            actualDate: i.actualDate ? Timestamp.fromDate(i.actualDate) : null,
            completedDate: i.completedDate ? Timestamp.fromDate(i.completedDate) : null,
            createdAt: Timestamp.fromDate(i.createdAt),
            updatedAt: Timestamp.fromDate(i.updatedAt)
          })
        }))
      };

      (query as Mock).mockReturnValue({});
      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);
      (where as Mock).mockReturnValue({});
      (orderBy as Mock).mockReturnValue({});

      const result = await qualityService.getInspections(mockProjectId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('inspection-1');
    });
  });

  // ============================================================================
  // Test Group 4: Inspection Filtering
  // ============================================================================

  describe('Inspection Filtering', () => {
    const createMockInspections = (): QualityInspection[] => [
      {
        ...createMockInspection({
          inspectionType: 'structural',
          status: 'completed'
        }),
        id: 'inspection-filter-1',
        inspectionNumber: 'QI-2025-001',
        passedItems: 2,
        failedItems: 1,
        conditionalItems: 1,
        totalItems: 4,
        passRate: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        ...createMockInspection({
          inspectionType: 'foundation',
          status: 'scheduled'
        }),
        id: 'inspection-filter-2',
        inspectionNumber: 'QI-2025-002',
        passedItems: 0,
        failedItems: 0,
        conditionalItems: 0,
        totalItems: 0,
        passRate: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should filter inspections by type', async () => {
      const mockInspections = createMockInspections();
      const mockQuerySnapshot = {
        docs: mockInspections.map(i => ({
          id: i.id,
          data: () => ({
            ...i,
            scheduledDate: Timestamp.fromDate(i.scheduledDate),
            actualDate: i.actualDate ? Timestamp.fromDate(i.actualDate) : null,
            completedDate: i.completedDate ? Timestamp.fromDate(i.completedDate) : null,
            createdAt: Timestamp.fromDate(i.createdAt),
            updatedAt: Timestamp.fromDate(i.updatedAt)
          })
        }))
      };

      (query as Mock).mockReturnValue({});
      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);
      (where as Mock).mockReturnValue({});
      (orderBy as Mock).mockReturnValue({});

      const filters: QualityFilterOptions = {
        inspectionType: ['structural']
      };

      await qualityService.getInspections(mockProjectId, filters);

      expect(where).toHaveBeenCalledWith('inspectionType', 'in', ['structural']);
    });

    it('should filter inspections by status', async () => {
      const mockInspections = createMockInspections();
      const mockQuerySnapshot = {
        docs: mockInspections.map(i => ({
          id: i.id,
          data: () => ({
            ...i,
            scheduledDate: Timestamp.fromDate(i.scheduledDate),
            actualDate: i.actualDate ? Timestamp.fromDate(i.actualDate) : null,
            completedDate: i.completedDate ? Timestamp.fromDate(i.completedDate) : null,
            createdAt: Timestamp.fromDate(i.createdAt),
            updatedAt: Timestamp.fromDate(i.updatedAt)
          })
        }))
      };

      (query as Mock).mockReturnValue({});
      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);
      (where as Mock).mockReturnValue({});
      (orderBy as Mock).mockReturnValue({});

      const filters: QualityFilterOptions = {
        status: ['completed', 'scheduled']
      };

      await qualityService.getInspections(mockProjectId, filters);

      expect(where).toHaveBeenCalledWith('status', 'in', ['completed', 'scheduled']);
    });

    it('should order inspections by scheduled date descending', async () => {
      const mockInspections = createMockInspections();
      const mockQuerySnapshot = {
        docs: mockInspections.map(i => ({
          id: i.id,
          data: () => ({
            ...i,
            scheduledDate: Timestamp.fromDate(i.scheduledDate),
            actualDate: i.actualDate ? Timestamp.fromDate(i.actualDate) : null,
            completedDate: i.completedDate ? Timestamp.fromDate(i.completedDate) : null,
            createdAt: Timestamp.fromDate(i.createdAt),
            updatedAt: Timestamp.fromDate(i.updatedAt)
          })
        }))
      };

      (query as Mock).mockReturnValue({});
      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);
      (where as Mock).mockReturnValue({});
      (orderBy as Mock).mockReturnValue({});

      await qualityService.getInspections(mockProjectId);

      expect(orderBy).toHaveBeenCalledWith('scheduledDate', 'desc');
    });
  });

  // ============================================================================
  // Test Group 5: Defect Number Generation
  // ============================================================================

  describe('Defect Number Generation', () => {
    it('should generate sequential defect numbers', async () => {
      const mockDefect = createMockDefect();
      const mockDocRef = { id: 'defect-001' };

      (addDoc as Mock).mockResolvedValue(mockDocRef);
      (getDocs as Mock).mockResolvedValue({ size: 10, docs: [] });

      const result = await qualityService.createDefect(mockDefect);

      const year = new Date().getFullYear();
      expect(result.defectNumber).toBe(`DEF-${year}-011`); // 10 + 1 = 011
    });

    it('should pad defect numbers with zeros', async () => {
      const mockDefect = createMockDefect();
      const mockDocRef = { id: 'defect-002' };

      (addDoc as Mock).mockResolvedValue(mockDocRef);
      (getDocs as Mock).mockResolvedValue({ size: 0, docs: [] });

      const result = await qualityService.createDefect(mockDefect);

      const year = new Date().getFullYear();
      expect(result.defectNumber).toBe(`DEF-${year}-001`); // 0 + 1 = 001
    });
  });

  // ============================================================================
  // Test Group 6: Defect CRUD Operations
  // ============================================================================

  describe('Defect CRUD Operations', () => {
    it('should create defect with all required fields', async () => {
      const mockDefect = createMockDefect();
      const mockDocRef = { id: 'defect-new' };

      (addDoc as Mock).mockResolvedValue(mockDocRef);
      (getDocs as Mock).mockResolvedValue({ size: 0, docs: [] });

      const result = await qualityService.createDefect(mockDefect);

      expect(result.id).toBe('defect-new');
      expect(result.defectNumber).toMatch(/^DEF-\d{4}-\d{3}$/);
      expect(result.title).toBe(mockDefect.title);
      expect(result.severity).toBe('major');
      expect(result.status).toBe('open');
    });

    it('should get defects for project', async () => {
      const mockDefects: Defect[] = [
        {
          ...createMockDefect(),
          id: 'defect-1',
          defectNumber: 'DEF-2025-001',
          createdAt: new Date('2025-01-15'),
          updatedAt: new Date('2025-01-15')
        }
      ];

      const mockQuerySnapshot = {
        docs: mockDefects.map(d => ({
          id: d.id,
          data: () => ({
            ...d,
            identifiedDate: Timestamp.fromDate(d.identifiedDate),
            dueDate: d.dueDate ? Timestamp.fromDate(d.dueDate) : null,
            createdAt: Timestamp.fromDate(d.createdAt),
            updatedAt: Timestamp.fromDate(d.updatedAt),
            closedAt: d.closedAt ? Timestamp.fromDate(d.closedAt) : undefined
          })
        }))
      };

      (query as Mock).mockReturnValue({});
      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);
      (where as Mock).mockReturnValue({});
      (orderBy as Mock).mockReturnValue({});

      const result = await qualityService.getDefects(mockProjectId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('defect-1');
    });

    it('should update defect', async () => {
      const mockDocRef = {};

      (doc as Mock).mockReturnValue(mockDocRef);
      (updateDoc as Mock).mockResolvedValue(undefined);

      await qualityService.updateDefect('defect-update', {
        status: 'resolved' as DefectStatus,
        resolution: {
          description: 'Reinforcement repositioned',
          resolvedBy: mockUserId,
          resolvedDate: new Date('2025-01-20'),
          reworkHours: 8
        }
      });

      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          status: 'resolved'
        })
      );
    });
  });

  // ============================================================================
  // Test Group 7: Defect Filtering
  // ============================================================================

  describe('Defect Filtering', () => {
    const createMockDefects = (): Defect[] => [
      {
        ...createMockDefect({
          severity: 'critical',
          status: 'open'
        }),
        id: 'defect-filter-1',
        defectNumber: 'DEF-2025-001',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        ...createMockDefect({
          severity: 'minor',
          status: 'resolved'
        }),
        id: 'defect-filter-2',
        defectNumber: 'DEF-2025-002',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should filter defects by severity', async () => {
      const mockDefects = createMockDefects();
      const mockQuerySnapshot = {
        docs: mockDefects.map(d => ({
          id: d.id,
          data: () => ({
            ...d,
            identifiedDate: Timestamp.fromDate(d.identifiedDate),
            dueDate: d.dueDate ? Timestamp.fromDate(d.dueDate) : null,
            createdAt: Timestamp.fromDate(d.createdAt),
            updatedAt: Timestamp.fromDate(d.updatedAt)
          })
        }))
      };

      (query as Mock).mockReturnValue({});
      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);
      (where as Mock).mockReturnValue({});
      (orderBy as Mock).mockReturnValue({});

      const filters: DefectFilterOptions = {
        severity: ['critical', 'major']
      };

      await qualityService.getDefects(mockProjectId, filters);

      expect(where).toHaveBeenCalledWith('severity', 'in', ['critical', 'major']);
    });

    it('should filter defects by status', async () => {
      const mockDefects = createMockDefects();
      const mockQuerySnapshot = {
        docs: mockDefects.map(d => ({
          id: d.id,
          data: () => ({
            ...d,
            identifiedDate: Timestamp.fromDate(d.identifiedDate),
            dueDate: d.dueDate ? Timestamp.fromDate(d.dueDate) : null,
            createdAt: Timestamp.fromDate(d.createdAt),
            updatedAt: Timestamp.fromDate(d.updatedAt)
          })
        }))
      };

      (query as Mock).mockReturnValue({});
      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);
      (where as Mock).mockReturnValue({});
      (orderBy as Mock).mockReturnValue({});

      const filters: DefectFilterOptions = {
        status: ['open', 'in_progress']
      };

      await qualityService.getDefects(mockProjectId, filters);

      expect(where).toHaveBeenCalledWith('status', 'in', ['open', 'in_progress']);
    });

    it('should order defects by identified date descending', async () => {
      const mockDefects = createMockDefects();
      const mockQuerySnapshot = {
        docs: mockDefects.map(d => ({
          id: d.id,
          data: () => ({
            ...d,
            identifiedDate: Timestamp.fromDate(d.identifiedDate),
            dueDate: d.dueDate ? Timestamp.fromDate(d.dueDate) : null,
            createdAt: Timestamp.fromDate(d.createdAt),
            updatedAt: Timestamp.fromDate(d.updatedAt)
          })
        }))
      };

      (query as Mock).mockReturnValue({});
      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);
      (where as Mock).mockReturnValue({});
      (orderBy as Mock).mockReturnValue({});

      await qualityService.getDefects(mockProjectId);

      expect(orderBy).toHaveBeenCalledWith('identifiedDate', 'desc');
    });
  });

  // ============================================================================
  // Test Group 8: Quality Metrics Calculation
  // ============================================================================

  describe('Quality Metrics Calculation', () => {
    it('should calculate inspection metrics', async () => {
      const mockInspections: QualityInspection[] = [
        {
          ...createMockInspection({
            scheduledDate: new Date('2025-01-15'),
            status: 'completed',
            overallResult: 'pass'
          }),
          id: 'inspection-metrics-1',
          inspectionNumber: 'QI-2025-001',
          passedItems: 4,
          failedItems: 0,
          conditionalItems: 0,
          totalItems: 4,
          passRate: 100,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          ...createMockInspection({
            scheduledDate: new Date('2025-01-20'),
            status: 'completed',
            overallResult: 'fail'
          }),
          id: 'inspection-metrics-2',
          inspectionNumber: 'QI-2025-002',
          passedItems: 1,
          failedItems: 3,
          conditionalItems: 0,
          totalItems: 4,
          passRate: 25,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockQuerySnapshot = {
        docs: mockInspections.map(i => ({
          id: i.id,
          data: () => ({
            ...i,
            scheduledDate: Timestamp.fromDate(i.scheduledDate),
            actualDate: i.actualDate ? Timestamp.fromDate(i.actualDate) : null,
            completedDate: i.completedDate ? Timestamp.fromDate(i.completedDate) : null,
            createdAt: Timestamp.fromDate(i.createdAt),
            updatedAt: Timestamp.fromDate(i.updatedAt)
          })
        }))
      };

      (query as Mock).mockReturnValue({});
      (getDocs as Mock).mockResolvedValueOnce(mockQuerySnapshot); // First call: getInspections
      (getDocs as Mock).mockResolvedValueOnce({ docs: [] }); // Second call: getDefects
      (where as Mock).mockReturnValue({});
      (orderBy as Mock).mockReturnValue({});

      const periodStart = new Date('2025-01-01');
      const periodEnd = new Date('2025-01-31');

      const metrics = await qualityService.getQualityMetrics(mockProjectId, periodStart, periodEnd);

      expect(metrics.inspections.total).toBe(2);
      expect(metrics.inspections.completed).toBe(2);
      expect(metrics.inspections.passed).toBe(1);
      expect(metrics.inspections.failed).toBe(1);
      expect(metrics.inspections.passRate).toBe(50); // 1/2 * 100
    });

    it('should calculate defect metrics', async () => {
      const mockDefects: Defect[] = [
        {
          ...createMockDefect({
            severity: 'critical',
            status: 'open',
            identifiedDate: new Date('2025-01-15')
          }),
          id: 'defect-metrics-1',
          defectNumber: 'DEF-2025-001',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          ...createMockDefect({
            severity: 'major',
            status: 'closed',
            identifiedDate: new Date('2025-01-20')
          }),
          id: 'defect-metrics-2',
          defectNumber: 'DEF-2025-002',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          ...createMockDefect({
            severity: 'minor',
            status: 'open',
            identifiedDate: new Date('2025-01-25')
          }),
          id: 'defect-metrics-3',
          defectNumber: 'DEF-2025-003',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockDefectsSnapshot = {
        docs: mockDefects.map(d => ({
          id: d.id,
          data: () => ({
            ...d,
            identifiedDate: Timestamp.fromDate(d.identifiedDate),
            dueDate: d.dueDate ? Timestamp.fromDate(d.dueDate) : null,
            createdAt: Timestamp.fromDate(d.createdAt),
            updatedAt: Timestamp.fromDate(d.updatedAt)
          })
        }))
      };

      (query as Mock).mockReturnValue({});
      (getDocs as Mock).mockResolvedValueOnce({ docs: [] }); // First call: getInspections
      (getDocs as Mock).mockResolvedValueOnce(mockDefectsSnapshot); // Second call: getDefects
      (where as Mock).mockReturnValue({});
      (orderBy as Mock).mockReturnValue({});

      const periodStart = new Date('2025-01-01');
      const periodEnd = new Date('2025-01-31');

      const metrics = await qualityService.getQualityMetrics(mockProjectId, periodStart, periodEnd);

      expect(metrics.defects.total).toBe(3);
      expect(metrics.defects.open).toBe(2);
      expect(metrics.defects.closed).toBe(1);
      expect(metrics.defects.bySeverity.critical).toBe(1);
      expect(metrics.defects.bySeverity.major).toBe(1);
      expect(metrics.defects.bySeverity.minor).toBe(1);
    });

    it('should calculate quality metrics (pass rate and defect rate)', async () => {
      const mockInspections: QualityInspection[] = [
        {
          ...createMockInspection({
            scheduledDate: new Date('2025-01-15'),
            status: 'completed',
            overallResult: 'pass'
          }),
          id: 'inspection-quality-1',
          inspectionNumber: 'QI-2025-001',
          passedItems: 4,
          failedItems: 0,
          conditionalItems: 0,
          totalItems: 4,
          passRate: 100,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          ...createMockInspection({
            scheduledDate: new Date('2025-01-20'),
            status: 'completed',
            overallResult: 'pass'
          }),
          id: 'inspection-quality-2',
          inspectionNumber: 'QI-2025-002',
          passedItems: 3,
          failedItems: 1,
          conditionalItems: 0,
          totalItems: 4,
          passRate: 75,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockDefects: Defect[] = [
        {
          ...createMockDefect({
            identifiedDate: new Date('2025-01-15'),
            costImpact: 5000,
            resolution: {
              description: 'Fixed',
              resolvedBy: mockUserId,
              resolvedDate: new Date('2025-01-20'),
              reworkHours: 8
            }
          }),
          id: 'defect-quality-1',
          defectNumber: 'DEF-2025-001',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          ...createMockDefect({
            identifiedDate: new Date('2025-01-20'),
            costImpact: 3000,
            resolution: {
              description: 'Fixed',
              resolvedBy: mockUserId,
              resolvedDate: new Date('2025-01-22'),
              reworkHours: 4
            }
          }),
          id: 'defect-quality-2',
          defectNumber: 'DEF-2025-002',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockInspectionsSnapshot = {
        docs: mockInspections.map(i => ({
          id: i.id,
          data: () => ({
            ...i,
            scheduledDate: Timestamp.fromDate(i.scheduledDate),
            actualDate: i.actualDate ? Timestamp.fromDate(i.actualDate) : null,
            completedDate: i.completedDate ? Timestamp.fromDate(i.completedDate) : null,
            createdAt: Timestamp.fromDate(i.createdAt),
            updatedAt: Timestamp.fromDate(i.updatedAt)
          })
        }))
      };

      const mockDefectsSnapshot = {
        docs: mockDefects.map(d => ({
          id: d.id,
          data: () => ({
            ...d,
            identifiedDate: Timestamp.fromDate(d.identifiedDate),
            dueDate: d.dueDate ? Timestamp.fromDate(d.dueDate) : null,
            createdAt: Timestamp.fromDate(d.createdAt),
            updatedAt: Timestamp.fromDate(d.updatedAt),
            resolution: d.resolution ? {
              ...d.resolution,
              resolvedDate: Timestamp.fromDate(d.resolution.resolvedDate)
            } : undefined
          })
        }))
      };

      (query as Mock).mockReturnValue({});
      (getDocs as Mock).mockResolvedValueOnce(mockInspectionsSnapshot);
      (getDocs as Mock).mockResolvedValueOnce(mockDefectsSnapshot);
      (where as Mock).mockReturnValue({});
      (orderBy as Mock).mockReturnValue({});

      const periodStart = new Date('2025-01-01');
      const periodEnd = new Date('2025-01-31');

      const metrics = await qualityService.getQualityMetrics(mockProjectId, periodStart, periodEnd);

      expect(metrics.quality.firstTimePassRate).toBe(100); // 2/2 * 100
      expect(metrics.quality.defectRate).toBe(1); // 2 defects / 2 inspections
      expect(metrics.quality.reworkCost).toBe(8000); // 5000 + 3000
      expect(metrics.quality.reworkHours).toBe(12); // 8 + 4
    });
  });

  // ============================================================================
  // Test Group 9: Timestamp Conversions
  // ============================================================================

  describe('Timestamp Conversions', () => {
    it('should convert Date to Timestamp when creating inspection', async () => {
      const mockInspection = createMockInspection({
        scheduledDate: new Date('2025-01-15'),
        actualDate: new Date('2025-01-16'),
        completedDate: new Date('2025-01-17')
      });

      const mockDocRef = { id: 'inspection-timestamp' };
      (addDoc as Mock).mockResolvedValue(mockDocRef);
      (getDocs as Mock).mockResolvedValue({ size: 0, docs: [] });

      await qualityService.createInspection(mockInspection);

      expect(Timestamp.fromDate).toHaveBeenCalledWith(mockInspection.scheduledDate);
      expect(Timestamp.fromDate).toHaveBeenCalledWith(mockInspection.actualDate);
      expect(Timestamp.fromDate).toHaveBeenCalledWith(mockInspection.completedDate);
    });

    it('should convert Timestamp to Date when getting inspection', async () => {
      const mockInspection: QualityInspection = {
        ...createMockInspection(),
        id: 'inspection-ts-convert',
        inspectionNumber: 'QI-2025-001',
        passedItems: 2,
        failedItems: 1,
        conditionalItems: 1,
        totalItems: 4,
        passRate: 50,
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15')
      };

      const mockDocSnap = {
        exists: () => true,
        id: 'inspection-ts-convert',
        data: () => ({
          ...mockInspection,
          scheduledDate: Timestamp.fromDate(mockInspection.scheduledDate),
          createdAt: Timestamp.fromDate(mockInspection.createdAt),
          updatedAt: Timestamp.fromDate(mockInspection.updatedAt)
        })
      };

      (doc as Mock).mockReturnValue({});
      (getDoc as Mock).mockResolvedValue(mockDocSnap);

      const result = await qualityService.getInspectionById('inspection-ts-convert');

      expect(result?.scheduledDate).toBeInstanceOf(Date);
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle null timestamps for optional dates', async () => {
      const mockInspection: QualityInspection = {
        ...createMockInspection(),
        id: 'inspection-null-ts',
        inspectionNumber: 'QI-2025-001',
        actualDate: undefined,
        completedDate: undefined,
        passedItems: 2,
        failedItems: 1,
        conditionalItems: 1,
        totalItems: 4,
        passRate: 50,
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15')
      };

      const mockDocSnap = {
        exists: () => true,
        id: 'inspection-null-ts',
        data: () => ({
          ...mockInspection,
          scheduledDate: Timestamp.fromDate(mockInspection.scheduledDate),
          actualDate: null,
          completedDate: null,
          createdAt: Timestamp.fromDate(mockInspection.createdAt),
          updatedAt: Timestamp.fromDate(mockInspection.updatedAt)
        })
      };

      (doc as Mock).mockReturnValue({});
      (getDoc as Mock).mockResolvedValue(mockDocSnap);

      const result = await qualityService.getInspectionById('inspection-null-ts');

      expect(result?.actualDate).toBeUndefined();
      expect(result?.completedDate).toBeUndefined();
    });
  });
});
