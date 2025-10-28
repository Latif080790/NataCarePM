import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getCostControlSummary } from '../../api/costControlService';

// Mock Firebase methods
const mockCollection = vi.fn();
const mockGetDocs = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();

vi.mock('firebase/firestore', () => ({
  get collection() {
    return mockCollection;
  },
  get getDocs() {
    return mockGetDocs;
  },
  get query() {
    return mockQuery;
  },
  get where() {
    return mockWhere;
  },
  Timestamp: {
    now: vi.fn().mockReturnValue({
      toDate: () => new Date(),
      toMillis: () => Date.now(),
    }),
  },
}));

// Mock Firebase config
vi.mock('../../firebaseConfig', () => ({
  db: {},
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Cost Control Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Cost Control Summary Generation', () => {
    it('should successfully generate cost control summary', async () => {
      // Arrange
      const projectId = 'project123';
      
      // Mock WBS data
      const mockWBSData = [
        {
          wbsCode: 'WBS001',
          wbsName: 'Foundation Work',
          level: 1,
          budget: 100000000,
          planned: 50000000,
          earned: 45000000,
          actual: 48000000,
          committed: 5000000,
          progress: 0.45,
        }
      ];
      
      // Mock finance data
      const mockFinanceData = {
        totalActual: 48000000,
        totalCommitted: 5000000,
        byCategory: {
          'MAT001': 30000000,
          'LAB001': 18000000,
        },
        transactions: [
          {
            id: 'txn1',
            amount: 30000000,
            category: 'Materials',
          }
        ],
      };
      
      // Mock logistics data
      const mockLogisticsData = {
        totalCost: 2000000,
        itemCount: 5,
      };
      
      // Mock inventory data
      const mockInventoryData = {
        totalValue: 1500000,
        itemCount: 10,
      };
      
      // Mock progress data
      const mockProgressData = {
        plannedValue: 50000000,
        earnedValue: 45000000,
        actualCost: 48000000,
      };
      
      // Mock trend analysis data
      const mockTrendAnalysis = {
        period: 'monthly',
        data: [
          {
            period: '2023-01',
            planned: 10000000,
            earned: 9000000,
            actual: 9500000,
            variance: -500000,
          }
        ],
        anomalies: [],
      };
      
      // Mock cash flow data
      const mockCashFlowSummary = {
        totalInflow: 100000000,
        totalOutflow: 48000000,
        netCashFlow: 52000000,
        projections: [
          {
            month: '2023-02',
            projectedInflow: 50000000,
            projectedOutflow: 30000000,
            projectedBalance: 72000000,
          }
        ],
      };

      // Mock all the aggregation functions
      mockGetDocs.mockResolvedValueOnce({
        docs: mockWBSData.map(item => ({
          data: () => ({
            wbsCode: item.wbsCode,
            wbsName: item.wbsName,
            level: item.level,
            budgetAmount: item.budget,
            plannedAmount: item.planned,
            earnedAmount: item.earned,
            actualCost: item.actual,
            committedAmount: item.committed,
            progress: item.progress,
          }),
        })),
      });
      
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            data: () => ({
              lines: [
                { debit: 30000000, accountCode: 'MAT001' },
                { debit: 18000000, accountCode: 'LAB001' },
              ],
              status: 'posted',
            }),
          }
        ],
      });
      
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            data: () => ({
              totalAmount: 2000000,
              status: 'completed',
            }),
          }
        ],
      });
      
      mockGetDocs.mockResolvedValueOnce({
        docs: [],
      });

      // Act
      const result = await getCostControlSummary(projectId);

      // Assert
      expect(result).toBeDefined();
      expect(result.totalBudget).toBeGreaterThan(0);
      expect(result.evmMetrics).toBeDefined();
      expect(mockGetDocs).toHaveBeenCalledTimes(4);
    });

    it('should handle error when generating cost control summary', async () => {
      // Arrange
      const projectId = 'project123';
      const errorMessage = 'Database connection failed';
      
      mockGetDocs.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(getCostControlSummary(projectId)).rejects.toThrow(errorMessage);
    });
  });

  describe('EVM Metrics Calculation', () => {
    it('should calculate EVM metrics correctly', async () => {
      // Arrange
      const projectId = 'project123';
      
      // Mock data that would result in specific EVM metrics
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            data: () => ({
              budgetAmount: 100000000,
              plannedAmount: 50000000,
              earnedAmount: 45000000,
              actualCost: 48000000,
              committedAmount: 5000000,
              progress: 0.45,
            }),
          }
        ],
      });

      // Act
      const result = await getCostControlSummary(projectId);

      // Assert
      expect(result.evmMetrics).toBeDefined();
      expect(result.evmMetrics.pv).toBe(50000000); // Planned Value
      expect(result.evmMetrics.ev).toBe(45000000); // Earned Value
      expect(result.evmMetrics.ac).toBe(48000000); // Actual Cost
      expect(result.evmMetrics.cv).toBe(-3000000); // Cost Variance (EV - AC)
      expect(result.evmMetrics.sv).toBe(-5000000); // Schedule Variance (EV - PV)
      expect(result.evmMetrics.cpi).toBeCloseTo(0.9375); // Cost Performance Index (EV / AC)
      expect(result.evmMetrics.spi).toBeCloseTo(0.9); // Schedule Performance Index (EV / PV)
    });
  });

  describe('Budget vs Actual Analysis', () => {
    it('should calculate budget vs actual correctly', async () => {
      // Arrange
      const projectId = 'project123';
      
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            data: () => ({
              budgetAmount: 100000000,
              plannedAmount: 50000000,
              earnedAmount: 45000000,
              actualCost: 48000000,
              committedAmount: 5000000,
            }),
          }
        ],
      });

      // Act
      const result = await getCostControlSummary(projectId);

      // Assert
      expect(result.budgetVsActual).toBeDefined();
      expect(result.budgetVsActual.budget).toBe(100000000);
      expect(result.budgetVsActual.actual).toBe(48000000);
      expect(result.budgetVsActual.variance).toBe(52000000);
      expect(result.budgetVsActual.variancePercentage).toBe(52);
    });
  });

  describe('Cost Breakdown Analysis', () => {
    it('should calculate cost breakdown by category', async () => {
      // Arrange
      const projectId = 'project123';
      
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            data: () => ({
              budgetAmount: 100000000,
              plannedAmount: 50000000,
              earnedAmount: 45000000,
              actualCost: 48000000,
              committedAmount: 5000000,
            }),
          }
        ],
      });
      
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            data: () => ({
              lines: [
                { debit: 30000000, accountCode: 'MAT001' },
                { debit: 18000000, accountCode: 'LAB001' },
              ],
              status: 'posted',
            }),
          }
        ],
      });
      
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            data: () => ({
              totalAmount: 2000000,
              status: 'completed',
            }),
          }
        ],
      });
      
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            data: () => ({
              totalValue: 1500000,
            }),
          }
        ],
      });

      // Act
      const result = await getCostControlSummary(projectId);

      // Assert
      expect(result.costBreakdown).toBeDefined();
      expect(result.costBreakdown.materials).toBe(30000000);
      expect(result.costBreakdown.labor).toBe(18000000);
      expect(result.costBreakdown.logistics).toBe(2000000);
      expect(result.costBreakdown.inventory).toBe(1500000);
    });
  });
});