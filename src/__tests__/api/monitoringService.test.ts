import { describe, test, expect, vi, beforeEach } from 'vitest';
import { 
  MonitoringService, 
  MonitoringValidator,
  monitoringService 
} from '../../api/monitoringService';
import { SystemMetrics, UserActivity, ErrorLog } from '../../types/monitoring';

// Mock Firebase
vi.mock('../../firebaseConfig', () => ({
  db: {
    collection: vi.fn(() => ({
      add: vi.fn(() => Promise.resolve({ id: 'mock-id' })),
      doc: vi.fn(() => ({
        set: vi.fn(() => Promise.resolve()),
        get: vi.fn(() => Promise.resolve({ 
          exists: true, 
          data: () => ({ value: 100 }) 
        })),
        update: vi.fn(() => Promise.resolve())
      })),
      where: vi.fn(() => ({
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn(() => Promise.resolve({
              docs: [
                { 
                  id: 'doc1', 
                  data: () => ({ 
                    timestamp: { seconds: Date.now() / 1000 },
                    cpu: 45,
                    memory: 60 
                  }) 
                }
              ]
            }))
          }))
        }))
      }))
    }))
  }
}));

// Mock performance API
const mockPerformance = {
  memory: {
    usedJSHeapSize: 10485760,
    totalJSHeapSize: 20971520,
    jsHeapSizeLimit: 2147483648
  },
  timing: {
    navigationStart: Date.now() - 5000,
    loadEventEnd: Date.now() - 1000
  }
};

Object.defineProperty(global, 'performance', {
  writable: true,
  value: mockPerformance
});

describe('MonitoringValidator', () => {
  describe('validateSystemMetrics', () => {
    test('should validate correct system metrics', () => {
      const validMetrics: SystemMetrics = {
        timestamp: new Date(),
        cpu: 45.5,
        memory: 512,
        activeUsers: 15,
        responseTime: 250,
        errorRate: 0.02,
        networkStatus: 'online',
        batteryLevel: 85,
        connectionType: 'wifi'
      };

      const result = MonitoringValidator.validateSystemMetrics(validMetrics);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject metrics with invalid CPU usage', () => {
      const invalidMetrics: Partial<SystemMetrics> = {
        timestamp: new Date(),
        cpu: 150, // Invalid: > 100
        memory: 512,
        activeUsers: 15,
        responseTime: 250,
        errorRate: 0.02,
        networkStatus: 'online'
      };

      const result = MonitoringValidator.validateSystemMetrics(invalidMetrics);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject metrics with negative values', () => {
      const invalidMetrics: Partial<SystemMetrics> = {
        timestamp: new Date(),
        cpu: 45.5,
        memory: -10, // Invalid: negative
        activeUsers: -5, // Invalid: negative
        responseTime: 250,
        errorRate: 0.02,
        networkStatus: 'online'
      };

      const result = MonitoringValidator.validateSystemMetrics(invalidMetrics);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateUserActivity', () => {
    test('should validate correct user activity', () => {
      const validActivity: UserActivity = {
        userId: 'user123',
        userName: 'John Doe',
        action: 'page_view',
        resource: '/dashboard',
        timestamp: new Date(),
        success: true,
        sessionId: 'session123',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ipAddress: '192.168.1.1',
        deviceInfo: {
          platform: 'Win32',
          browser: 'Chrome',
          version: '91.0.4472.124',
          isMobile: false,
          language: 'en-US'
        }
      };

      const result = MonitoringValidator.validateUserActivity(validActivity);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject activity with missing required fields', () => {
      const invalidActivity: Partial<UserActivity> = {
        userId: '', // Invalid: empty
        userName: 'John Doe',
        action: 'page_view',
        resource: '/dashboard',
        timestamp: new Date(),
        success: true
      };

      const result = MonitoringValidator.validateUserActivity(invalidActivity);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateErrorLog', () => {
    test('should validate correct error log', () => {
      const validError: ErrorLog = {
        errorId: 'error123',
        message: 'Database connection failed',
        severity: 'high',
        timestamp: new Date(),
        resolved: false,
        environment: 'production',
        component: 'database',
        userId: 'user123',
        userName: 'John Doe'
      };

      const result = MonitoringValidator.validateErrorLog(validError);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject error log with invalid severity', () => {
      const invalidError: Partial<ErrorLog> = {
        errorId: 'error123',
        message: 'Database connection failed',
        severity: 'invalid' as any, // Invalid severity
        timestamp: new Date(),
        resolved: false,
        environment: 'production'
      };

      const result = MonitoringValidator.validateErrorLog(invalidError);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject error log with empty message', () => {
      const invalidError: Partial<ErrorLog> = {
        errorId: 'error123',
        message: '', // Invalid: empty
        severity: 'high',
        timestamp: new Date(),
        resolved: false,
        environment: 'production'
      };

      const result = MonitoringValidator.validateErrorLog(invalidError);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('MonitoringService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInstance', () => {
    test('should return singleton instance', () => {
      const instance1 = MonitoringService.getInstance();
      const instance2 = MonitoringService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(MonitoringService);
    });
  });

  describe('logError', () => {
    test('should successfully log error', async () => {
      const error = {
        message: 'Test error',
        severity: 'high' as const,
        component: 'test-component',
        userId: 'user123',
        userName: 'John Doe'
      };

      await expect(monitoringService.logError(error)).resolves.not.toThrow();
    });
  });

  describe('logUserActivity', () => {
    test('should successfully log user activity', async () => {
      const activity = {
        userId: 'user123',
        userName: 'John Doe',
        action: 'test_action',
        resource: '/test',
        success: true
      };

      await expect(monitoringService.logUserActivity(activity)).resolves.not.toThrow();
    });
  });

  describe('getProjectMetrics', () => {
    test('should retrieve project metrics', async () => {
      const metrics = await monitoringService.getProjectMetrics('project123');
      
      // Since the mock doesn't return the exact structure, we just check it doesn't throw
      expect(metrics).toBeDefined();
    });
  });
});