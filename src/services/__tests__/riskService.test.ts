/**
 * Risk Service Tests
 * NataCarePM - Week 6 Day 3
 *
 * Comprehensive test suite for riskService
 * Tests risk CRUD, risk scoring, mitigation tracking, status management, dashboard stats
 *
 * Service Pattern: Class-based with Firestore integration
 * Dependencies: Firebase Firestore
 *
 * Test Coverage:
 * - Risk CRUD Operations
 * - Risk Scoring & Priority Calculation
 * - Risk Status Management & History Tracking
 * - Risk Reviews
 * - Risk Filtering
 * - Dashboard Statistics
 * - Alert Creation
 * - Risk Number Generation
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import riskService from '../riskService';
import type {
  Risk,
  RiskSeverity,
  RiskProbability,
  RiskStatus,
  RiskCategory,
  RiskReview,
  RiskFilterOptions
} from '@/types/risk.types';
import {
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
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

describe('Risk Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProjectId = 'proj-001';
  const mockUserId = 'user-001';

  const createMockRisk = (overrides: Partial<Omit<Risk, 'id' | 'createdAt' | 'updatedAt' | 'riskScore' | 'priorityLevel' | 'reviewHistory' | 'statusHistory'>> = {}): Omit<Risk, 'id' | 'createdAt' | 'updatedAt' | 'riskScore' | 'priorityLevel' | 'reviewHistory' | 'statusHistory'> => ({
    projectId: mockProjectId,
    riskNumber: 'RISK-2025-001',
    title: 'Foundation Soil Issue',
    description: 'Unstable soil conditions detected',
    category: 'technical' as RiskCategory,
    severity: 4 as RiskSeverity,
    probability: 3 as RiskProbability,
    impactAreas: {
      cost: {
        estimated: 50000,
        currency: 'USD',
        description: 'Additional foundation work'
      },
      schedule: {
        delayDays: 14,
        criticalPath: true,
        description: 'Delay in foundation completion'
      }
    },
    estimatedImpact: 50000,
    owner: mockUserId,
    identifiedBy: mockUserId,
    stakeholders: [mockUserId],
    status: 'identified' as RiskStatus,
    identifiedDate: new Date('2025-01-15'),
    attachments: [],
    ...overrides
  });

  // ============================================================================
  // Test Group 1: Risk Scoring & Priority Calculation
  // ============================================================================

  describe('Risk Scoring & Priority Calculation', () => {
    it('should calculate critical priority for score >= 16', async () => {
      const mockRisk = createMockRisk({
        severity: 5 as RiskSeverity,
        probability: 4 as RiskProbability
      });

      const mockDocRef = { id: 'risk-001' };
      (addDoc as Mock).mockResolvedValue(mockDocRef);
      (getDocs as Mock).mockResolvedValue({ size: 0, docs: [] });

      const result = await riskService.createRisk(mockRisk);

      expect(result.riskScore).toBe(20); // 5 × 4
      expect(result.priorityLevel).toBe('critical');
    });

    it('should calculate high priority for score >= 10 and < 16', async () => {
      const mockRisk = createMockRisk({
        severity: 4 as RiskSeverity,
        probability: 3 as RiskProbability
      });

      const mockDocRef = { id: 'risk-002' };
      (addDoc as Mock).mockResolvedValue(mockDocRef);
      (getDocs as Mock).mockResolvedValue({ size: 0, docs: [] });

      const result = await riskService.createRisk(mockRisk);

      expect(result.riskScore).toBe(12); // 4 × 3
      expect(result.priorityLevel).toBe('high');
    });

    it('should calculate medium priority for score >= 5 and < 10', async () => {
      const mockRisk = createMockRisk({
        severity: 3 as RiskSeverity,
        probability: 2 as RiskProbability
      });

      const mockDocRef = { id: 'risk-003' };
      (addDoc as Mock).mockResolvedValue(mockDocRef);
      (getDocs as Mock).mockResolvedValue({ size: 0, docs: [] });

      const result = await riskService.createRisk(mockRisk);

      expect(result.riskScore).toBe(6); // 3 × 2
      expect(result.priorityLevel).toBe('medium');
    });

    it('should calculate low priority for score < 5', async () => {
      const mockRisk = createMockRisk({
        severity: 2 as RiskSeverity,
        probability: 2 as RiskProbability
      });

      const mockDocRef = { id: 'risk-004' };
      (addDoc as Mock).mockResolvedValue(mockDocRef);
      (getDocs as Mock).mockResolvedValue({ size: 0, docs: [] });

      const result = await riskService.createRisk(mockRisk);

      expect(result.riskScore).toBe(4); // 2 × 2
      expect(result.priorityLevel).toBe('low');
    });

    it('should recalculate score when severity changes', async () => {
      const mockCurrentRisk: Risk = {
        ...createMockRisk({
          severity: 3 as RiskSeverity,
          probability: 2 as RiskProbability
        }),
        id: 'risk-005',
        riskScore: 6,
        priorityLevel: 'medium',
        reviewHistory: [],
        statusHistory: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockDocRef = {};
      const mockDocSnap = {
        exists: () => true,
        id: 'risk-005',
        data: () => ({
          ...mockCurrentRisk,
          createdAt: Timestamp.fromDate(mockCurrentRisk.createdAt),
          updatedAt: Timestamp.fromDate(mockCurrentRisk.updatedAt),
          identifiedDate: Timestamp.fromDate(mockCurrentRisk.identifiedDate)
        })
      };

      (doc as Mock).mockReturnValue(mockDocRef);
      (getDoc as Mock).mockResolvedValue(mockDocSnap);
      (updateDoc as Mock).mockResolvedValue(undefined);

      await riskService.updateRisk('risk-005', { severity: 5 as RiskSeverity }, mockUserId);

      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          severity: 5,
          riskScore: 10, // 5 × 2
          priorityLevel: 'high'
        })
      );
    });

    it('should recalculate score when probability changes', async () => {
      const mockCurrentRisk: Risk = {
        ...createMockRisk({
          severity: 3 as RiskSeverity,
          probability: 2 as RiskProbability
        }),
        id: 'risk-006',
        riskScore: 6,
        priorityLevel: 'medium',
        reviewHistory: [],
        statusHistory: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockDocRef = {};
      const mockDocSnap = {
        exists: () => true,
        id: 'risk-006',
        data: () => ({
          ...mockCurrentRisk,
          createdAt: Timestamp.fromDate(mockCurrentRisk.createdAt),
          updatedAt: Timestamp.fromDate(mockCurrentRisk.updatedAt),
          identifiedDate: Timestamp.fromDate(mockCurrentRisk.identifiedDate)
        })
      };

      (doc as Mock).mockReturnValue(mockDocRef);
      (getDoc as Mock).mockResolvedValue(mockDocSnap);
      (updateDoc as Mock).mockResolvedValue(undefined);

      await riskService.updateRisk('risk-006', { probability: 5 as RiskProbability }, mockUserId);

      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          probability: 5,
          riskScore: 15, // 3 × 5
          priorityLevel: 'high'
        })
      );
    });
  });

  // ============================================================================
  // Test Group 2: Risk CRUD Operations
  // ============================================================================

  describe('Risk CRUD Operations', () => {
    it('should create a new risk with all required fields', async () => {
      const mockRisk = createMockRisk();
      const mockDocRef = { id: 'risk-new' };

      (addDoc as Mock).mockResolvedValue(mockDocRef);
      (getDocs as Mock).mockResolvedValue({ size: 5, docs: [] });

      const result = await riskService.createRisk(mockRisk);

      expect(result.id).toBe('risk-new');
      expect(result.riskNumber).toBe('RISK-2025-006'); // size 5 + 1
      expect(result.title).toBe(mockRisk.title);
      expect(result.status).toBe('identified');
      expect(result.statusHistory).toHaveLength(1);
      expect(result.statusHistory[0].newStatus).toBe('identified');
      expect(result.statusHistory[0].reason).toBe('Initial creation');
    });

    it('should get risk by ID', async () => {
      const mockRisk: Risk = {
        ...createMockRisk(),
        id: 'risk-get',
        riskScore: 12,
        priorityLevel: 'high',
        reviewHistory: [],
        statusHistory: [],
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15')
      };

      const mockDocSnap = {
        exists: () => true,
        id: 'risk-get',
        data: () => ({
          ...mockRisk,
          createdAt: Timestamp.fromDate(mockRisk.createdAt),
          updatedAt: Timestamp.fromDate(mockRisk.updatedAt),
          identifiedDate: Timestamp.fromDate(mockRisk.identifiedDate)
        })
      };

      (doc as Mock).mockReturnValue({});
      (getDoc as Mock).mockResolvedValue(mockDocSnap);

      const result = await riskService.getRiskById('risk-get');

      expect(result).toBeDefined();
      expect(result?.id).toBe('risk-get');
      expect(result?.title).toBe(mockRisk.title);
    });

    it('should return null for non-existent risk', async () => {
      const mockDocSnap = {
        exists: () => false
      };

      (doc as Mock).mockReturnValue({});
      (getDoc as Mock).mockResolvedValue(mockDocSnap);

      const result = await riskService.getRiskById('non-existent');

      expect(result).toBeNull();
    });

    it('should update risk', async () => {
      const mockCurrentRisk: Risk = {
        ...createMockRisk(),
        id: 'risk-update',
        riskScore: 12,
        priorityLevel: 'high',
        reviewHistory: [],
        statusHistory: [],
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15')
      };

      const mockDocRef = {};
      const mockDocSnap = {
        exists: () => true,
        id: 'risk-update',
        data: () => ({
          ...mockCurrentRisk,
          createdAt: Timestamp.fromDate(mockCurrentRisk.createdAt),
          updatedAt: Timestamp.fromDate(mockCurrentRisk.updatedAt),
          identifiedDate: Timestamp.fromDate(mockCurrentRisk.identifiedDate)
        })
      };

      (doc as Mock).mockReturnValue(mockDocRef);
      (getDoc as Mock).mockResolvedValue(mockDocSnap);
      (updateDoc as Mock).mockResolvedValue(undefined);

      await riskService.updateRisk('risk-update', { 
        title: 'Updated Risk Title' 
      }, mockUserId);

      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          title: 'Updated Risk Title'
        })
      );
    });

    it('should delete risk', async () => {
      const mockDocRef = {};

      (doc as Mock).mockReturnValue(mockDocRef);
      (deleteDoc as Mock).mockResolvedValue(undefined);

      await riskService.deleteRisk('risk-delete');

      expect(deleteDoc).toHaveBeenCalledWith(mockDocRef);
    });

    it('should throw error when updating non-existent risk', async () => {
      const mockDocSnap = {
        exists: () => false
      };

      (doc as Mock).mockReturnValue({});
      (getDoc as Mock).mockResolvedValue(mockDocSnap);

      await expect(
        riskService.updateRisk('non-existent', { title: 'New Title' }, mockUserId)
      ).rejects.toThrow('Risk not found');
    });
  });

  // ============================================================================
  // Test Group 3: Risk Status Management
  // ============================================================================

  describe('Risk Status Management', () => {
    it('should track status change in history', async () => {
      const mockCurrentRisk: Risk = {
        ...createMockRisk(),
        id: 'risk-status',
        riskScore: 12,
        priorityLevel: 'high',
        reviewHistory: [],
        statusHistory: [{
          timestamp: new Date('2025-01-15'),
          changedBy: mockUserId,
          previousStatus: null as any,
          newStatus: 'identified',
          reason: 'Initial creation'
        }],
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15')
      };

      const mockDocRef = {};
      const mockDocSnap = {
        exists: () => true,
        id: 'risk-status',
        data: () => ({
          ...mockCurrentRisk,
          createdAt: Timestamp.fromDate(mockCurrentRisk.createdAt),
          updatedAt: Timestamp.fromDate(mockCurrentRisk.updatedAt),
          identifiedDate: Timestamp.fromDate(mockCurrentRisk.identifiedDate),
          statusHistory: mockCurrentRisk.statusHistory.map(s => ({
            ...s,
            timestamp: Timestamp.fromDate(s.timestamp)
          }))
        })
      };

      (doc as Mock).mockReturnValue(mockDocRef);
      (getDoc as Mock).mockResolvedValue(mockDocSnap);
      (updateDoc as Mock).mockResolvedValue(undefined);

      await riskService.updateRisk('risk-status', { 
        status: 'assessed' as RiskStatus
      }, mockUserId);

      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          status: 'assessed',
          statusHistory: expect.arrayContaining([
            expect.objectContaining({
              previousStatus: 'identified',
              newStatus: 'assessed',
              changedBy: mockUserId
            })
          ])
        })
      );
    });

    it('should not add status history if status unchanged', async () => {
      const mockCurrentRisk: Risk = {
        ...createMockRisk(),
        id: 'risk-same-status',
        riskScore: 12,
        priorityLevel: 'high',
        reviewHistory: [],
        statusHistory: [],
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15')
      };

      const mockDocRef = {};
      const mockDocSnap = {
        exists: () => true,
        id: 'risk-same-status',
        data: () => ({
          ...mockCurrentRisk,
          createdAt: Timestamp.fromDate(mockCurrentRisk.createdAt),
          updatedAt: Timestamp.fromDate(mockCurrentRisk.updatedAt),
          identifiedDate: Timestamp.fromDate(mockCurrentRisk.identifiedDate)
        })
      };

      (doc as Mock).mockReturnValue(mockDocRef);
      (getDoc as Mock).mockResolvedValue(mockDocSnap);
      (updateDoc as Mock).mockResolvedValue(undefined);

      await riskService.updateRisk('risk-same-status', { 
        title: 'Updated Title'
        // status not changed
      }, mockUserId);

      const updateCall = (updateDoc as Mock).mock.calls[0][1];
      expect(updateCall.statusHistory).toBeUndefined();
    });
  });

  // ============================================================================
  // Test Group 4: Risk Number Generation
  // ============================================================================

  describe('Risk Number Generation', () => {
    it('should generate sequential risk numbers', async () => {
      const mockRisk = createMockRisk();
      const mockDocRef = { id: 'risk-num-001' };

      (addDoc as Mock).mockResolvedValue(mockDocRef);
      (getDocs as Mock).mockResolvedValue({ size: 10, docs: [] });

      const result = await riskService.createRisk(mockRisk);

      const year = new Date().getFullYear();
      expect(result.riskNumber).toBe(`RISK-${year}-011`); // 10 + 1 = 011
    });

    it('should pad risk numbers with zeros', async () => {
      const mockRisk = createMockRisk();
      const mockDocRef = { id: 'risk-num-002' };

      (addDoc as Mock).mockResolvedValue(mockDocRef);
      (getDocs as Mock).mockResolvedValue({ size: 0, docs: [] });

      const result = await riskService.createRisk(mockRisk);

      const year = new Date().getFullYear();
      expect(result.riskNumber).toBe(`RISK-${year}-001`); // 0 + 1 = 001
    });
  });

  // ============================================================================
  // Test Group 5: Alert Creation
  // ============================================================================

  describe('Alert Creation', () => {
    it('should create alert for critical priority risk', async () => {
      const mockRisk = createMockRisk({
        severity: 5 as RiskSeverity,
        probability: 5 as RiskProbability
      });

      const mockDocRef = { id: 'risk-critical' };
      (addDoc as Mock).mockResolvedValue(mockDocRef);
      (getDocs as Mock).mockResolvedValue({ size: 0, docs: [] });

      await riskService.createRisk(mockRisk);

      // Should have been called twice: once for risk, once for alert
      expect(addDoc).toHaveBeenCalledTimes(2);
      
      const alertCall = (addDoc as Mock).mock.calls[1];
      expect(alertCall[1]).toMatchObject({
        riskId: 'risk-critical',
        alertType: 'high_score',
        severity: 'urgent'
      });
    });

    it('should create alert for high priority risk', async () => {
      const mockRisk = createMockRisk({
        severity: 4 as RiskSeverity,
        probability: 3 as RiskProbability
      });

      const mockDocRef = { id: 'risk-high' };
      (addDoc as Mock).mockResolvedValue(mockDocRef);
      (getDocs as Mock).mockResolvedValue({ size: 0, docs: [] });

      await riskService.createRisk(mockRisk);

      expect(addDoc).toHaveBeenCalledTimes(2);
      
      const alertCall = (addDoc as Mock).mock.calls[1];
      expect(alertCall[1]).toMatchObject({
        riskId: 'risk-high',
        severity: 'high'
      });
    });

    it('should not create alert for medium priority risk', async () => {
      const mockRisk = createMockRisk({
        severity: 3 as RiskSeverity,
        probability: 2 as RiskProbability
      });

      const mockDocRef = { id: 'risk-medium' };
      (addDoc as Mock).mockResolvedValue(mockDocRef);
      (getDocs as Mock).mockResolvedValue({ size: 0, docs: [] });

      await riskService.createRisk(mockRisk);

      // Only called once for risk, not for alert
      expect(addDoc).toHaveBeenCalledTimes(1);
    });

    it('should not create alert for low priority risk', async () => {
      const mockRisk = createMockRisk({
        severity: 2 as RiskSeverity,
        probability: 2 as RiskProbability
      });

      const mockDocRef = { id: 'risk-low' };
      (addDoc as Mock).mockResolvedValue(mockDocRef);
      (getDocs as Mock).mockResolvedValue({ size: 0, docs: [] });

      await riskService.createRisk(mockRisk);

      expect(addDoc).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // Test Group 6: Risk Filtering
  // ============================================================================

  describe('Risk Filtering', () => {
    const createMockRisks = (): Risk[] => [
      {
        ...createMockRisk({
          title: 'Technical Risk 1',
          category: 'technical',
          status: 'identified',
          severity: 4,
          probability: 3
        }),
        id: 'risk-filter-1',
        riskScore: 12,
        priorityLevel: 'high',
        reviewHistory: [],
        statusHistory: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        ...createMockRisk({
          title: 'Financial Risk 2',
          category: 'financial',
          status: 'mitigating',
          severity: 3,
          probability: 2
        }),
        id: 'risk-filter-2',
        riskScore: 6,
        priorityLevel: 'medium',
        reviewHistory: [],
        statusHistory: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        ...createMockRisk({
          title: 'Safety Risk 3',
          category: 'safety',
          status: 'closed',
          severity: 5,
          probability: 4
        }),
        id: 'risk-filter-3',
        riskScore: 20,
        priorityLevel: 'critical',
        reviewHistory: [],
        statusHistory: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should filter risks by category', async () => {
      const mockRisks = createMockRisks();
      const mockQuerySnapshot = {
        docs: mockRisks.map(r => ({
          id: r.id,
          data: () => ({
            ...r,
            createdAt: Timestamp.fromDate(r.createdAt),
            updatedAt: Timestamp.fromDate(r.updatedAt),
            identifiedDate: Timestamp.fromDate(r.identifiedDate)
          })
        }))
      };

      (query as Mock).mockReturnValue({});
      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);
      (where as Mock).mockReturnValue({});
      (orderBy as Mock).mockReturnValue({});

      const filters: RiskFilterOptions = {
        category: ['technical']
      };

      await riskService.getRisks(mockProjectId, filters);

      // Verify where was called with category filter
      expect(where).toHaveBeenCalledWith('category', 'in', ['technical']);
    });

    it('should filter risks by status', async () => {
      const mockRisks = createMockRisks();
      const mockQuerySnapshot = {
        docs: mockRisks.map(r => ({
          id: r.id,
          data: () => ({
            ...r,
            createdAt: Timestamp.fromDate(r.createdAt),
            updatedAt: Timestamp.fromDate(r.updatedAt),
            identifiedDate: Timestamp.fromDate(r.identifiedDate)
          })
        }))
      };

      (query as Mock).mockReturnValue({});
      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);
      (where as Mock).mockReturnValue({});
      (orderBy as Mock).mockReturnValue({});

      const filters: RiskFilterOptions = {
        status: ['identified', 'mitigating']
      };

      await riskService.getRisks(mockProjectId, filters);

      expect(where).toHaveBeenCalledWith('status', 'in', ['identified', 'mitigating']);
    });

    it('should filter risks by priority level', async () => {
      const mockRisks = createMockRisks();
      const mockQuerySnapshot = {
        docs: mockRisks.map(r => ({
          id: r.id,
          data: () => ({
            ...r,
            createdAt: Timestamp.fromDate(r.createdAt),
            updatedAt: Timestamp.fromDate(r.updatedAt),
            identifiedDate: Timestamp.fromDate(r.identifiedDate)
          })
        }))
      };

      (query as Mock).mockReturnValue({});
      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);
      (where as Mock).mockReturnValue({});
      (orderBy as Mock).mockReturnValue({});

      const filters: RiskFilterOptions = {
        priorityLevel: ['high', 'critical']
      };

      await riskService.getRisks(mockProjectId, filters);

      expect(where).toHaveBeenCalledWith('priorityLevel', 'in', ['high', 'critical']);
    });

    it('should filter risks by search term (client-side)', async () => {
      const mockRisks = createMockRisks();
      const mockQuerySnapshot = {
        docs: mockRisks.map(r => ({
          id: r.id,
          data: () => ({
            ...r,
            createdAt: Timestamp.fromDate(r.createdAt),
            updatedAt: Timestamp.fromDate(r.updatedAt),
            identifiedDate: Timestamp.fromDate(r.identifiedDate)
          })
        }))
      };

      (query as Mock).mockReturnValue({});
      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);
      (where as Mock).mockReturnValue({});
      (orderBy as Mock).mockReturnValue({});

      const filters: RiskFilterOptions = {
        searchTerm: 'Technical'
      };

      const result = await riskService.getRisks(mockProjectId, filters);

      // Should only return risks with 'Technical' in title
      expect(result.every(r => r.title.includes('Technical'))).toBe(true);
    });

    it('should filter risks by score range (client-side)', async () => {
      const mockRisks = createMockRisks();
      const mockQuerySnapshot = {
        docs: mockRisks.map(r => ({
          id: r.id,
          data: () => ({
            ...r,
            createdAt: Timestamp.fromDate(r.createdAt),
            updatedAt: Timestamp.fromDate(r.updatedAt),
            identifiedDate: Timestamp.fromDate(r.identifiedDate)
          })
        }))
      };

      (query as Mock).mockReturnValue({});
      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);
      (where as Mock).mockReturnValue({});
      (orderBy as Mock).mockReturnValue({});

      const filters: RiskFilterOptions = {
        scoreRange: { min: 10, max: 15 }
      };

      const result = await riskService.getRisks(mockProjectId, filters);

      // Should only return risks with score between 10 and 15
      expect(result.every(r => r.riskScore >= 10 && r.riskScore <= 15)).toBe(true);
    });

    it('should order risks by score descending', async () => {
      const mockRisks = createMockRisks();
      const mockQuerySnapshot = {
        docs: mockRisks.map(r => ({
          id: r.id,
          data: () => ({
            ...r,
            createdAt: Timestamp.fromDate(r.createdAt),
            updatedAt: Timestamp.fromDate(r.updatedAt),
            identifiedDate: Timestamp.fromDate(r.identifiedDate)
          })
        }))
      };

      (query as Mock).mockReturnValue({});
      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);
      (where as Mock).mockReturnValue({});
      (orderBy as Mock).mockReturnValue({});

      await riskService.getRisks(mockProjectId);

      expect(orderBy).toHaveBeenCalledWith('riskScore', 'desc');
    });
  });

  // ============================================================================
  // Test Group 7: Risk Reviews
  // ============================================================================

  describe('Risk Reviews', () => {
    it('should create risk review', async () => {
      const mockRisk: Risk = {
        ...createMockRisk(),
        id: 'risk-review',
        riskScore: 12,
        priorityLevel: 'high',
        reviewHistory: [],
        statusHistory: [],
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15')
      };

      const mockDocRef = {};
      const mockDocSnap = {
        exists: () => true,
        id: 'risk-review',
        data: () => ({
          ...mockRisk,
          createdAt: Timestamp.fromDate(mockRisk.createdAt),
          updatedAt: Timestamp.fromDate(mockRisk.updatedAt),
          identifiedDate: Timestamp.fromDate(mockRisk.identifiedDate)
        })
      };

      (doc as Mock).mockReturnValue(mockDocRef);
      (getDoc as Mock).mockResolvedValue(mockDocSnap);
      (updateDoc as Mock).mockResolvedValue(undefined);

      const review: Omit<RiskReview, 'id'> = {
        reviewDate: new Date('2025-02-01'),
        reviewedBy: mockUserId,
        currentSeverity: 3 as RiskSeverity,
        currentProbability: 2 as RiskProbability,
        currentScore: 6,
        changes: [
          {
            field: 'severity',
            oldValue: 4,
            newValue: 3,
            reason: 'Mitigation measures implemented'
          }
        ],
        findings: 'Risk reduced after mitigation',
        recommendations: 'Continue monitoring',
        nextReviewDate: new Date('2025-03-01')
      };

      await riskService.createReview('risk-review', review);

      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          reviewHistory: expect.arrayContaining([
            expect.objectContaining({
              reviewedBy: mockUserId,
              findings: 'Risk reduced after mitigation'
            })
          ])
        })
      );
    });

    it('should update lastReviewedAt when creating review', async () => {
      const mockRisk: Risk = {
        ...createMockRisk(),
        id: 'risk-review-date',
        riskScore: 12,
        priorityLevel: 'high',
        reviewHistory: [],
        statusHistory: [],
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15')
      };

      const mockDocRef = {};
      const mockDocSnap = {
        exists: () => true,
        id: 'risk-review-date',
        data: () => ({
          ...mockRisk,
          createdAt: Timestamp.fromDate(mockRisk.createdAt),
          updatedAt: Timestamp.fromDate(mockRisk.updatedAt),
          identifiedDate: Timestamp.fromDate(mockRisk.identifiedDate)
        })
      };

      (doc as Mock).mockReturnValue(mockDocRef);
      (getDoc as Mock).mockResolvedValue(mockDocSnap);
      (updateDoc as Mock).mockResolvedValue(undefined);

      const reviewDate = new Date('2025-02-01');
      const review: Omit<RiskReview, 'id'> = {
        reviewDate,
        reviewedBy: mockUserId,
        currentSeverity: 3 as RiskSeverity,
        currentProbability: 2 as RiskProbability,
        currentScore: 6,
        changes: [],
        findings: 'Review findings',
        recommendations: 'Recommendations',
        nextReviewDate: new Date('2025-03-01')
      };

      await riskService.createReview('risk-review-date', review);

      const updateCall = (updateDoc as Mock).mock.calls[0][1];
      expect(updateCall.lastReviewedAt).toBeDefined();
    });

    it('should throw error when creating review for non-existent risk', async () => {
      const mockDocSnap = {
        exists: () => false
      };

      (doc as Mock).mockReturnValue({});
      (getDoc as Mock).mockResolvedValue(mockDocSnap);

      const review: Omit<RiskReview, 'id'> = {
        reviewDate: new Date(),
        reviewedBy: mockUserId,
        currentSeverity: 3 as RiskSeverity,
        currentProbability: 2 as RiskProbability,
        currentScore: 6,
        changes: [],
        findings: 'Test',
        recommendations: 'Test',
        nextReviewDate: new Date()
      };

      await expect(
        riskService.createReview('non-existent', review)
      ).rejects.toThrow('Risk not found');
    });
  });

  // ============================================================================
  // Test Group 8: Dashboard Statistics
  // ============================================================================

  describe('Dashboard Statistics', () => {
    it('should calculate dashboard statistics', async () => {
      const mockRisks: Risk[] = [
        {
          ...createMockRisk({ status: 'identified', severity: 5, probability: 4 }),
          id: 'risk-stats-1',
          riskScore: 20,
          priorityLevel: 'critical',
          reviewHistory: [],
          statusHistory: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          ...createMockRisk({ status: 'mitigating', severity: 4, probability: 3 }),
          id: 'risk-stats-2',
          riskScore: 12,
          priorityLevel: 'high',
          reviewHistory: [],
          statusHistory: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          ...createMockRisk({ status: 'closed', severity: 2, probability: 2 }),
          id: 'risk-stats-3',
          riskScore: 4,
          priorityLevel: 'low',
          reviewHistory: [],
          statusHistory: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockQuerySnapshot = {
        docs: mockRisks.map(r => ({
          id: r.id,
          data: () => ({
            ...r,
            createdAt: Timestamp.fromDate(r.createdAt),
            updatedAt: Timestamp.fromDate(r.updatedAt),
            identifiedDate: Timestamp.fromDate(r.identifiedDate)
          })
        }))
      };

      (query as Mock).mockReturnValue({});
      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);
      (where as Mock).mockReturnValue({});
      (orderBy as Mock).mockReturnValue({});

      const stats = await riskService.getDashboardStats(mockProjectId);

      expect(stats.overview.totalRisks).toBe(3);
      expect(stats.overview.activeRisks).toBe(2); // identified + mitigating
      expect(stats.overview.closedRisks).toBe(1);
      expect(stats.distribution.byPriority.critical).toBe(1);
      expect(stats.distribution.byPriority.high).toBe(1);
      expect(stats.distribution.byPriority.low).toBe(1);
    });

    it('should calculate financial metrics in dashboard stats', async () => {
      const mockRisks: Risk[] = [
        {
          ...createMockRisk({ 
            estimatedImpact: 50000,
            mitigationPlan: {
              strategy: 'mitigate',
              description: 'Test',
              actions: [],
              estimatedCost: 10000,
              targetCompletionDate: new Date()
            }
          }),
          id: 'risk-fin-1',
          riskScore: 12,
          priorityLevel: 'high',
          reviewHistory: [],
          statusHistory: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          ...createMockRisk({ 
            estimatedImpact: 30000,
            occurred: {
              date: new Date(),
              actualImpact: {},
              actualCost: 25000,
              lessonsLearned: 'Test',
              preventiveMeasures: 'Test'
            }
          }),
          id: 'risk-fin-2',
          riskScore: 8,
          priorityLevel: 'medium',
          reviewHistory: [],
          statusHistory: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockQuerySnapshot = {
        docs: mockRisks.map(r => ({
          id: r.id,
          data: () => ({
            ...r,
            createdAt: Timestamp.fromDate(r.createdAt),
            updatedAt: Timestamp.fromDate(r.updatedAt),
            identifiedDate: Timestamp.fromDate(r.identifiedDate),
            occurred: r.occurred ? {
              ...r.occurred,
              date: Timestamp.fromDate(r.occurred.date)
            } : undefined
          })
        }))
      };

      (query as Mock).mockReturnValue({});
      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);
      (where as Mock).mockReturnValue({});
      (orderBy as Mock).mockReturnValue({});

      const stats = await riskService.getDashboardStats(mockProjectId);

      expect(stats.financial.totalEstimatedImpact).toBe(80000); // 50000 + 30000
      expect(stats.financial.totalActualImpact).toBe(25000); // Only occurred risk
      expect(stats.financial.mitigationCosts).toBe(10000); // From mitigation plan
    });
  });
});
