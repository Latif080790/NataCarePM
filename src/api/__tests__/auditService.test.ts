/**
 * Test Suite: auditService
 * 
 * Tests audit trail and compliance logging functionality including:
 * - Core audit log creation and queries
 * - Entity-specific audit trails
 * - User activity tracking
 * - Specialized logging (PO, GR, MR, inventory, etc.)
 * - Audit statistics and analytics
 * - Compliance reporting
 * - Audit log archiving
 * 
 * Total Functions: 16
 * Estimated Tests: 22-25
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createAuditLog,
  getAuditLogs,
  getEntityAuditTrail,
  getUserActivityLog,
  logPOCreation,
  logPOApproval,
  logGRCreation,
  logMRApproval,
  logInventoryTransaction,
  logVendorEvaluation,
  logWBSBudgetUpdate,
  logProgressUpdate,
  logAutomationExecution,
  getAuditStatistics,
  generateComplianceReport,
  archiveOldAuditLogs,
} from '../auditService';

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({
      toDate: () => new Date('2025-11-13T10:00:00Z'),
      toMillis: () => 1731492000000,
    })),
    fromMillis: vi.fn((millis: number) => ({
      toDate: () => new Date(millis),
      toMillis: () => millis,
    })),
    fromDate: vi.fn((date: Date) => ({
      toDate: () => date,
      toMillis: () => date.getTime(),
    })),
  },
}));

// Mock Firebase config
vi.mock('@/firebaseConfig', () => ({
  db: {},
}));

import { collection, getDocs, addDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';

describe('auditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // CORE AUDIT LOG CREATION
  // ============================================================================

  describe('Core Audit Log Creation', () => {
    it('should create audit log with all required fields', async () => {
      const mockDocRef = { id: 'audit_123' };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);

      const result = await createAuditLog(
        {
          action: 'User Login',
          actionType: 'login',
          module: 'auth',
          entityType: 'user',
          entityId: 'user_123',
          entityName: 'John Doe',
          status: 'success',
          projectId: 'proj_456',
        },
        'user_123',
        'John Doe',
        'admin',
        '192.168.1.1',
        'session_789'
      );

      expect(result).toBe('audit_123');
      expect(addDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          action: 'User Login',
          actionType: 'login',
          module: 'auth',
          entityType: 'user',
          entityId: 'user_123',
          entityName: 'John Doe',
          userId: 'user_123',
          userName: 'John Doe',
          userRole: 'admin',
          userIp: '192.168.1.1',
          sessionId: 'session_789',
          status: 'success',
          projectId: 'proj_456',
        })
      );
    });

    it('should create audit log with optional fields omitted', async () => {
      const mockDocRef = { id: 'audit_456' };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);

      const result = await createAuditLog(
        {
          action: 'Data Export',
          actionType: 'export',
          module: 'reports',
          entityType: 'report',
          entityId: 'report_001',
          entityName: 'Monthly Report',
          status: 'success',
        },
        'user_789',
        'Jane Smith',
        'manager'
      );

      expect(result).toBe('audit_456');
      expect(addDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          action: 'Data Export',
          userIp: undefined,
          sessionId: undefined,
          projectId: undefined,
        })
      );
    });

    it('should create audit log with error details for failed action', async () => {
      const mockDocRef = { id: 'audit_error' };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);

      const result = await createAuditLog(
        {
          action: 'Delete Document',
          actionType: 'delete',
          module: 'documents',
          entityType: 'document',
          entityId: 'doc_123',
          entityName: 'Contract.pdf',
          status: 'failed',
          errorMessage: 'Permission denied',
        },
        'user_999',
        'Unauthorized User',
        'viewer'
      );

      expect(result).toBe('audit_error');
      expect(addDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          status: 'failed',
          errorMessage: 'Permission denied',
        })
      );
    });
  });

  // ============================================================================
  // AUDIT LOG QUERIES
  // ============================================================================

  describe('Audit Log Queries', () => {
    it('should get audit logs with default limit', async () => {
      const mockLogs = [
        {
          id: 'audit_1',
          action: 'User Login',
          userId: 'user_123',
          timestamp: Timestamp.now(),
        },
        {
          id: 'audit_2',
          action: 'Data Update',
          userId: 'user_456',
          timestamp: Timestamp.now(),
        },
      ];

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(orderBy).mockReturnValue({} as any);
      vi.mocked(limit).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockLogs.map((log) => ({
          id: log.id,
          data: () => log,
        })),
      } as any);

      const result = await getAuditLogs();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 'audit_1', action: 'User Login' });
      expect(limit).toHaveBeenCalledWith(100); // Default limit
    });

    it('should filter audit logs by userId', async () => {
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            id: 'audit_user_1',
            data: () => ({ action: 'Login', userId: 'user_123' }),
          },
        ],
      } as any);

      const result = await getAuditLogs({ userId: 'user_123' }, 50);

      expect(where).toHaveBeenCalledWith('userId', '==', 'user_123');
      expect(result).toHaveLength(1);
    });

    it('should filter audit logs by multiple criteria', async () => {
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: [],
      } as any);

      await getAuditLogs({
        userId: 'user_123',
        module: 'procurement',
        entityType: 'purchase_order',
        actionType: 'create',
        projectId: 'proj_456',
      });

      expect(where).toHaveBeenCalledWith('userId', '==', 'user_123');
      expect(where).toHaveBeenCalledWith('module', '==', 'procurement');
      expect(where).toHaveBeenCalledWith('entityType', '==', 'purchase_order');
      expect(where).toHaveBeenCalledWith('actionType', '==', 'create');
      expect(where).toHaveBeenCalledWith('projectId', '==', 'proj_456');
    });
  });

  // ============================================================================
  // ENTITY AUDIT TRAIL
  // ============================================================================

  describe('Entity Audit Trail', () => {
    it('should get audit trail for specific entity', async () => {
      const mockTrail = [
        { id: 'audit_1', action: 'Created', entityId: 'po_123' },
        { id: 'audit_2', action: 'Approved', entityId: 'po_123' },
        { id: 'audit_3', action: 'Modified', entityId: 'po_123' },
      ];

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockTrail.map((log) => ({
          id: log.id,
          data: () => log,
        })),
      } as any);

      const result = await getEntityAuditTrail('purchase_order', 'po_123', 50);

      expect(where).toHaveBeenCalledWith('entityType', '==', 'purchase_order');
      expect(where).toHaveBeenCalledWith('entityId', '==', 'po_123');
      expect(result).toHaveLength(3);
      expect(result[0].action).toBe('Created');
    });
  });

  // ============================================================================
  // USER ACTIVITY LOG
  // ============================================================================

  describe('User Activity Log', () => {
    it('should get user activity without date filter', async () => {
      const mockActivity = [
        { id: 'audit_1', action: 'Login', userId: 'user_123' },
        { id: 'audit_2', action: 'View Report', userId: 'user_123' },
      ];

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockActivity.map((log) => ({
          id: log.id,
          data: () => log,
        })),
      } as any);

      const result = await getUserActivityLog('user_123');

      expect(where).toHaveBeenCalledWith('userId', '==', 'user_123');
      expect(result).toHaveLength(2);
    });

    it('should get user activity with date range filter', async () => {
      const startDate = Timestamp.fromDate(new Date('2025-11-01'));
      const endDate = Timestamp.fromDate(new Date('2025-11-13'));

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            id: 'audit_filtered',
            data: () => ({ action: 'Data Entry', userId: 'user_123' }),
          },
        ],
      } as any);

      const result = await getUserActivityLog('user_123', startDate, endDate, 200);

      expect(where).toHaveBeenCalledWith('userId', '==', 'user_123');
      expect(where).toHaveBeenCalledWith('timestamp', '>=', startDate);
      expect(where).toHaveBeenCalledWith('timestamp', '<=', endDate);
      expect(limit).toHaveBeenCalledWith(200);
      expect(result).toHaveLength(1);
    });
  });

  // ============================================================================
  // SPECIALIZED LOGGING - PROCUREMENT
  // ============================================================================

  describe('Specialized Logging - Procurement', () => {
    it('should log PO creation', async () => {
      const mockDocRef = { id: 'audit_po_create' };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);

      const poData = {
        vendorName: 'ABC Supplier',
        totalAmount: 50000,
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
      };

      const result = await logPOCreation(
        'po_123',
        'PO-2025-001',
        poData,
        'user_456',
        'John Manager',
        'manager',
        'proj_789'
      );

      expect(result).toBe('audit_po_create');
      expect(addDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          action: 'Purchase Order Created',
          actionType: 'create',
          module: 'procurement',
          entityType: 'purchase_order',
          entityId: 'po_123',
          entityName: 'PO-2025-001',
          projectId: 'proj_789',
          metadata: {
            vendorName: 'ABC Supplier',
            totalAmount: 50000,
            itemCount: 3,
          },
        })
      );
    });

    it('should log PO approval', async () => {
      const mockDocRef = { id: 'audit_po_approve' };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);

      const result = await logPOApproval(
        'po_123',
        'PO-2025-001',
        'manager',
        'user_789',
        'Sarah Approver',
        'senior_manager',
        'proj_789'
      );

      expect(result).toBe('audit_po_approve');
      expect(addDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          action: 'Purchase Order Approved - manager',
          actionType: 'approve',
          module: 'procurement',
          metadata: {
            approvalStage: 'manager',
            approver: 'Sarah Approver',
          },
        })
      );
    });

    it('should log MR approval', async () => {
      const mockDocRef = { id: 'audit_mr_approve' };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);

      const result = await logMRApproval(
        'mr_456',
        'MR-2025-010',
        'supervisor',
        'user_111',
        'Tom Supervisor',
        'supervisor',
        'proj_789'
      );

      expect(result).toBe('audit_mr_approve');
      expect(addDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          action: 'Material Request Approved - supervisor',
          actionType: 'approve',
          module: 'procurement',
          entityType: 'material_request',
        })
      );
    });
  });

  // ============================================================================
  // SPECIALIZED LOGGING - LOGISTICS
  // ============================================================================

  describe('Specialized Logging - Logistics', () => {
    it('should log goods receipt creation', async () => {
      const mockDocRef = { id: 'audit_gr_create' };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);

      const grData = {
        poNumber: 'PO-2025-001',
        items: [{ id: '1' }, { id: '2' }],
        totalValue: 45000,
      };

      const result = await logGRCreation(
        'gr_789',
        'GR-2025-005',
        grData,
        'user_222',
        'Mike Warehouse',
        'warehouse_staff',
        'proj_789'
      );

      expect(result).toBe('audit_gr_create');
      expect(addDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          action: 'Goods Receipt Created',
          actionType: 'create',
          module: 'logistics',
          entityType: 'goods_receipt',
          metadata: {
            poNumber: 'PO-2025-001',
            receivedItems: 2,
            totalValue: 45000,
          },
        })
      );
    });
  });

  // ============================================================================
  // SPECIALIZED LOGGING - INVENTORY
  // ============================================================================

  describe('Specialized Logging - Inventory', () => {
    it('should log inventory transaction', async () => {
      const mockDocRef = { id: 'audit_inv_txn' };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);

      const items = [
        { id: 'item_1', quantity: 100 },
        { id: 'item_2', quantity: 50 },
        { id: 'item_3', quantity: 75 },
      ];

      const result = await logInventoryTransaction(
        'txn_333',
        'TXN-2025-020',
        'stock_in',
        items,
        'user_444',
        'Anna Inventory',
        'inventory_manager',
        'proj_789'
      );

      expect(result).toBe('audit_inv_txn');
      expect(addDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          action: 'Inventory Transaction - stock_in',
          actionType: 'create',
          module: 'inventory',
          entityType: 'inventory_transaction',
          metadata: {
            transactionType: 'stock_in',
            itemCount: 3,
            totalQuantity: 225, // 100 + 50 + 75
          },
        })
      );
    });
  });

  // ============================================================================
  // SPECIALIZED LOGGING - VENDOR
  // ============================================================================

  describe('Specialized Logging - Vendor', () => {
    it('should log vendor evaluation', async () => {
      const mockDocRef = { id: 'audit_vendor_eval' };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);

      const evaluationData = {
        overallScore: 85,
        rating: 'Good',
      };

      const result = await logVendorEvaluation(
        'vendor_555',
        'XYZ Corporation',
        evaluationData,
        'user_666',
        'Lisa Evaluator',
        'procurement_manager'
      );

      expect(result).toBe('audit_vendor_eval');
      expect(addDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          action: 'Vendor Evaluated',
          actionType: 'update',
          module: 'vendor',
          entityType: 'vendor',
          metadata: {
            overallScore: 85,
            rating: 'Good',
            evaluator: 'Lisa Evaluator',
          },
        })
      );
    });
  });

  // ============================================================================
  // SPECIALIZED LOGGING - FINANCE & PROJECT
  // ============================================================================

  describe('Specialized Logging - Finance & Project', () => {
    it('should log WBS budget update', async () => {
      const mockDocRef = { id: 'audit_wbs_budget' };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);

      const result = await logWBSBudgetUpdate(
        'wbs_777',
        'WBS-1.2.3',
        100000,
        120000,
        'user_888',
        'David Finance',
        'finance_manager',
        'proj_789'
      );

      expect(result).toBe('audit_wbs_budget');
      expect(addDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          action: 'WBS Budget Updated',
          actionType: 'update',
          module: 'finance',
          entityType: 'wbs',
          changes: [
            {
              field: 'budget',
              oldValue: 100000,
              newValue: 120000,
            },
          ],
          metadata: {
            variance: 20000,
            variancePercent: 20, // ((120000 - 100000) / 100000) * 100
          },
        })
      );
    });

    it('should log progress update', async () => {
      const mockDocRef = { id: 'audit_progress' };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);

      const result = await logProgressUpdate(
        'activity_999',
        'Foundation Work',
        50,
        75,
        'user_1010',
        'Chris Engineer',
        'site_engineer',
        'proj_789'
      );

      expect(result).toBe('audit_progress');
      expect(addDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          action: 'Progress Updated',
          actionType: 'update',
          module: 'project',
          entityType: 'activity',
          changes: [
            {
              field: 'progress',
              oldValue: 50,
              newValue: 75,
            },
          ],
          metadata: {
            progressChange: 25,
            updatedBy: 'Chris Engineer',
          },
        })
      );
    });
  });

  // ============================================================================
  // SPECIALIZED LOGGING - AUTOMATION
  // ============================================================================

  describe('Specialized Logging - Automation', () => {
    it('should log successful automation execution', async () => {
      const mockDocRef = { id: 'audit_auto_success' };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);

      const result = await logAutomationExecution(
        'auto_1111',
        'Daily Budget Alert',
        'scheduled',
        'success',
        undefined,
        'proj_789'
      );

      expect(result).toBe('audit_auto_success');
      expect(addDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          action: 'Automation Executed - Daily Budget Alert',
          actionType: 'execute',
          module: 'automation',
          entityType: 'automation_rule',
          status: 'success',
          userId: 'system',
          userName: 'System',
          userRole: 'system',
          metadata: {
            trigger: 'scheduled',
            executedAt: expect.any(String),
          },
        })
      );
    });

    it('should log failed automation execution with error', async () => {
      const mockDocRef = { id: 'audit_auto_failed' };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);

      const result = await logAutomationExecution(
        'auto_2222',
        'Email Notification',
        'event',
        'failed',
        'SMTP connection timeout',
        'proj_789'
      );

      expect(result).toBe('audit_auto_failed');
      expect(addDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          status: 'failed',
          errorMessage: 'SMTP connection timeout',
        })
      );
    });
  });

  // ============================================================================
  // AUDIT STATISTICS
  // ============================================================================

  describe('Audit Statistics', () => {
    it('should calculate audit statistics for date range', async () => {
      const mockLogs = [
        {
          id: 'audit_1',
          action: 'Login',
          module: 'auth',
          actionType: 'login',
          userId: 'user_123',
          userName: 'John Doe',
          status: 'success',
          timestamp: Timestamp.now(),
        },
        {
          id: 'audit_2',
          action: 'Create PO',
          module: 'procurement',
          actionType: 'create',
          userId: 'user_123',
          userName: 'John Doe',
          status: 'success',
          timestamp: Timestamp.now(),
        },
        {
          id: 'audit_3',
          action: 'Delete Document',
          module: 'documents',
          actionType: 'delete',
          userId: 'user_456',
          userName: 'Jane Smith',
          status: 'failed',
          timestamp: Timestamp.now(),
        },
        {
          id: 'audit_4',
          action: 'Update Budget',
          module: 'finance',
          actionType: 'update',
          userId: 'user_456',
          userName: 'Jane Smith',
          status: 'success',
          timestamp: Timestamp.now(),
        },
      ];

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockLogs.map((log) => ({
          id: log.id,
          data: () => log,
        })),
      } as any);

      const startDate = Timestamp.fromDate(new Date('2025-11-01'));
      const endDate = Timestamp.fromDate(new Date('2025-11-13'));

      const result = await getAuditStatistics(startDate, endDate);

      expect(result.totalActions).toBe(4);
      expect(result.successfulActions).toBe(3);
      expect(result.failedActions).toBe(1);
      expect(result.actionsByModule).toMatchObject({
        auth: 1,
        procurement: 1,
        documents: 1,
        finance: 1,
      });
      expect(result.actionsByType).toMatchObject({
        login: 1,
        create: 1,
        delete: 1,
        update: 1,
      });
      expect(result.mostActiveUsers).toHaveLength(2);
      expect(result.mostActiveUsers[0]).toMatchObject({
        userId: 'user_123',
        userName: 'John Doe',
        actionCount: 2,
      });
      expect(result.recentActivity).toHaveLength(4);
    });

    it('should filter statistics by projectId', async () => {
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: [],
      } as any);

      const startDate = Timestamp.fromDate(new Date('2025-11-01'));
      const endDate = Timestamp.fromDate(new Date('2025-11-13'));

      await getAuditStatistics(startDate, endDate, 'proj_specific');

      expect(where).toHaveBeenCalledWith('projectId', '==', 'proj_specific');
    });
  });

  // ============================================================================
  // COMPLIANCE REPORTING
  // ============================================================================

  describe('Compliance Reporting', () => {
    it('should generate compliance report', async () => {
      const mockLogs = [
        {
          id: 'audit_1',
          action: 'Approve Budget',
          actionType: 'approve',
          module: 'finance',
          userId: 'user_123',
          userName: 'John Manager',
          userRole: 'manager',
          status: 'success',
          timestamp: Timestamp.fromDate(new Date('2025-11-10')),
        },
        {
          id: 'audit_2',
          action: 'Delete Critical Data',
          actionType: 'delete',
          module: 'data',
          userId: 'user_456',
          userName: 'Jane Admin',
          userRole: 'admin',
          status: 'failed',
          timestamp: Timestamp.fromDate(new Date('2025-11-11')),
        },
        {
          id: 'audit_3',
          action: 'View Report',
          actionType: 'read',
          module: 'reports',
          userId: 'user_789',
          userName: 'Bob Viewer',
          userRole: 'viewer',
          status: 'success',
          timestamp: Timestamp.fromDate(new Date('2025-11-12')),
        },
      ];

      // Mock getAuditLogs to return mock data
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(orderBy).mockReturnValue({} as any);
      vi.mocked(limit).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockLogs.map((log) => ({
          id: log.id,
          data: () => log,
        })),
      } as any);

      const startDate = Timestamp.fromDate(new Date('2025-11-01'));
      const endDate = Timestamp.fromDate(new Date('2025-11-13'));

      const result = await generateComplianceReport(startDate, endDate);

      expect(result.totalActions).toBe(3);
      expect(result.criticalActions).toBe(2); // approve, delete
      expect(result.failedActions).toBe(1);
      expect(result.userActivity).toHaveLength(3);
      expect(result.userActivity[0]).toMatchObject({
        userId: 'user_123',
        userName: 'John Manager',
        userRole: 'manager',
        actionCount: 1,
      });
      expect(result.moduleActivity).toMatchObject({
        finance: 1,
        data: 1,
        reports: 1,
      });
      expect(result.anomalies).toHaveLength(1); // Failed delete
      expect(result.anomalies[0].actionType).toBe('delete');
    });
  });

  // ============================================================================
  // AUDIT LOG ARCHIVING
  // ============================================================================

  describe('Audit Log Archiving', () => {
    it('should count old audit logs for archiving', async () => {
      const oldLogs = Array.from({ length: 150 }, (_, i) => ({
        id: `audit_old_${i}`,
        timestamp: Timestamp.fromMillis(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days old
      }));

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        size: oldLogs.length,
        docs: oldLogs.map((log) => ({
          id: log.id,
          data: () => log,
        })),
      } as any);

      const result = await archiveOldAuditLogs(90); // Archive logs older than 90 days

      expect(result).toBe(150);
      expect(where).toHaveBeenCalledWith('timestamp', '<=', expect.any(Object));
    });

    it('should return 0 when no old logs exist', async () => {
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        size: 0,
        docs: [],
      } as any);

      const result = await archiveOldAuditLogs(365);

      expect(result).toBe(0);
    });
  });
});
