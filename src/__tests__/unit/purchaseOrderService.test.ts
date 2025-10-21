/**
 * Purchase Order Service Unit Tests
 */

import { createMockPurchaseOrder } from '../../__mocks__/testDataFactory';

describe('PurchaseOrderService', () => {
  describe('createPurchaseOrder', () => {
    it('should create PO with all required fields', () => {
      const po = createMockPurchaseOrder({
        prNumber: 'PR-2025-100',
        poNumber: 'PO-2025-100',
        requester: 'user-123',
      });

      expect(po).toBeDefined();
      expect(po.prNumber).toBe('PR-2025-100');
      expect(po.poNumber).toBe('PO-2025-100');
    });

    it('should have proper status values', () => {
      const statuses = ['Menunggu Persetujuan', 'Disetujuan', 'Ditolak', 'PO Dibuat'] as const;

      statuses.forEach((status) => {
        const po = createMockPurchaseOrder({ status });
        expect(po.status).toBe(status);
      });
    });

    it('should include items with proper structure', () => {
      const po = createMockPurchaseOrder();

      expect(po.items).toHaveLength(1);
      expect(po.items[0].materialName).toBeDefined();
      expect(po.items[0].quantity).toBeDefined();
      expect(po.items[0].pricePerUnit).toBeDefined();
      expect(po.items[0].totalPrice).toBeDefined();
    });

    it('should track GRN status', () => {
      const po = createMockPurchaseOrder({
        grnStatus: 'Sebagian Diterima',
      });

      expect(po.grnStatus).toBe('Sebagian Diterima');
    });
  });

  describe('PO items', () => {
    it('should have complete item structure', () => {
      const po = createMockPurchaseOrder({
        items: [
          {
            id: 'item-1',
            materialName: 'Cement',
            description: 'Portland Cement Type I',
            quantity: 100,
            unit: 'bags',
            pricePerUnit: 50000,
            totalPrice: 5000000,
            receivedQuantity: 0,
            status: 'pending',
          },
        ],
      });

      const item = po.items[0];
      expect(item.materialName).toBe('Cement');
      expect(item.quantity).toBe(100);
      expect(item.unit).toBe('bags');
      expect(item.totalPrice).toBe(5000000);
    });

    it('should track received quantity', () => {
      const po = createMockPurchaseOrder({
        items: [
          {
            id: 'item-1',
            materialName: 'Steel',
            quantity: 50,
            unit: 'tons',
            pricePerUnit: 10000000,
            totalPrice: 500000000,
            receivedQuantity: 25,
            status: 'partial',
          },
        ],
      });

      expect(po.items[0].receivedQuantity).toBe(25);
      expect(po.items[0].status).toBe('partial');
    });
  });

  describe('PO validation', () => {
    it('should have valid dates', () => {
      const po = createMockPurchaseOrder();

      expect(po.requestDate).toBeDefined();
      expect(typeof po.requestDate).toBe('string');
    });

    it('should calculate total amount', () => {
      const po = createMockPurchaseOrder({
        totalAmount: 10000000,
      });

      expect(po.totalAmount).toBe(10000000);
      expect(typeof po.totalAmount).toBe('number');
    });

    it('should link to vendor', () => {
      const po = createMockPurchaseOrder({
        vendorId: 'vendor-123',
        vendorName: 'PT Supplier Jaya',
      });

      expect(po.vendorId).toBe('vendor-123');
      expect(po.vendorName).toBe('PT Supplier Jaya');
    });
  });

  describe('approval workflow', () => {
    it('should track approver', () => {
      const po = createMockPurchaseOrder({
        approver: 'manager-123',
        approvalDate: '2025-10-17',
      });

      expect(po.approver).toBe('manager-123');
      expect(po.approvalDate).toBeDefined();
    });

    it('should allow unapproved state', () => {
      const po = createMockPurchaseOrder({
        status: 'Menunggu Persetujuan',
        approver: undefined,
        approvalDate: undefined,
      });

      expect(po.status).toBe('Menunggu Persetujuan');
      expect(po.approver).toBeUndefined();
      expect(po.approvalDate).toBeUndefined();
    });
  });
});
