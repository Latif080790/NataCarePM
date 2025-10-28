/**
 * Rate Limiter Security Tests
 * Comprehensive test suite for rateLimiter.ts
 */

import { rateLimiter, RateLimitResult } from '../../utils/rateLimiter';

describe('RateLimiter - Security Tests', () => {
  // Clean up before each test
  beforeEach(() => {
    rateLimiter.clear();
  });

  // Clean up after all tests
  afterAll(() => {
    rateLimiter.destroy();
  });

  describe('Login Rate Limiting', () => {
    const identifier = 'test@example.com';
    const type = 'login';

    it('should allow first login attempt', () => {
      const result = rateLimiter.checkLimit(identifier, type);

      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(4); // 5 max - 1 = 4
      expect(result.message).toContain('4 attempts remaining');
    });

    it('should track multiple attempts within window', () => {
      // Attempt 1
      let result = rateLimiter.checkLimit(identifier, type);
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(4);

      // Attempt 2
      result = rateLimiter.checkLimit(identifier, type);
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(3);

      // Attempt 3
      result = rateLimiter.checkLimit(identifier, type);
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(2);
    });

    it('should block after max attempts (brute force protection)', () => {
      // Exhaust 5 attempts
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit(identifier, type);
      }

      // 6th attempt should be blocked
      const result = rateLimiter.checkLimit(identifier, type);

      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
      expect(result.blockedUntil).toBeDefined();
      expect(result.message).toContain('locked for 30 minutes');
    });

    it('should remain blocked during block period', () => {
      // Exhaust attempts
      for (let i = 0; i < 6; i++) {
        rateLimiter.checkLimit(identifier, type);
      }

      // Check multiple times - should still be blocked
      const result1 = rateLimiter.checkLimit(identifier, type);
      const result2 = rateLimiter.checkLimit(identifier, type);

      expect(result1.allowed).toBe(false);
      expect(result2.allowed).toBe(false);
      expect(result1.message).toEqual(result2.message);
    });

    it('should reset after successful login', () => {
      // Make 3 attempts
      for (let i = 0; i < 3; i++) {
        rateLimiter.checkLimit(identifier, type);
      }

      // Reset (simulate successful login)
      rateLimiter.reset(identifier, type);

      // Next attempt should be like first attempt
      const result = rateLimiter.checkLimit(identifier, type);
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(4);
    });

    it('should handle different users independently', () => {
      const user1 = 'user1@example.com';
      const user2 = 'user2@example.com';

      // User 1 makes 3 attempts
      for (let i = 0; i < 3; i++) {
        rateLimiter.checkLimit(user1, type);
      }

      // User 2 should have fresh limit
      const result = rateLimiter.checkLimit(user2, type);
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(4);

      // User 1 should still have 2 remaining
      const result1 = rateLimiter.checkLimit(user1, type);
      expect(result1.remainingAttempts).toBe(1);
    });

    it('should provide accurate time estimates in block message', () => {
      // Exhaust attempts
      for (let i = 0; i < 6; i++) {
        rateLimiter.checkLimit(identifier, type);
      }

      const result = rateLimiter.checkLimit(identifier, type);

      expect(result.message).toMatch(/locked for \d+ more minute/);
      expect(result.message).toMatch(/Please try again at/);
      expect(result.blockedUntil).toBeInstanceOf(Date);
    });
  });

  describe('2FA Rate Limiting', () => {
    const identifier = 'user123';
    const type = '2fa';

    it('should allow 3 attempts for 2FA', () => {
      const result1 = rateLimiter.checkLimit(identifier, type);
      const result2 = rateLimiter.checkLimit(identifier, type);
      const result3 = rateLimiter.checkLimit(identifier, type);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result3.allowed).toBe(true);
      expect(result3.remainingAttempts).toBe(0);
    });

    it('should block after 3 failed 2FA attempts', () => {
      // Exhaust 3 attempts
      for (let i = 0; i < 3; i++) {
        rateLimiter.checkLimit(identifier, type);
      }

      // 4th attempt blocked
      const result = rateLimiter.checkLimit(identifier, type);
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('locked for 15 minutes');
    });

    it('should reset 2FA limit after successful verification', () => {
      // Make 2 attempts
      rateLimiter.checkLimit(identifier, type);
      rateLimiter.checkLimit(identifier, type);

      // Reset after successful verification
      rateLimiter.reset(identifier, type);

      // Should be back to 3 attempts
      const result = rateLimiter.checkLimit(identifier, type);
      expect(result.remainingAttempts).toBe(2);
    });
  });

  describe('API Rate Limiting', () => {
    const identifier = '192.168.1.100';
    const type = 'api';

    it('should allow 100 API calls per minute', () => {
      let lastResult: RateLimitResult | null = null;

      for (let i = 0; i < 100; i++) {
        lastResult = rateLimiter.checkLimit(identifier, type);
      }

      expect(lastResult?.allowed).toBe(true);
      expect(lastResult?.remainingAttempts).toBe(0);
    });

    it('should block after 100 API calls', () => {
      // Make 100 calls
      for (let i = 0; i < 100; i++) {
        rateLimiter.checkLimit(identifier, type);
      }

      // 101st call should be blocked
      const result = rateLimiter.checkLimit(identifier, type);
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('locked for 5 minutes');
    });
  });

  describe('Password Reset Rate Limiting', () => {
    const identifier = 'user@example.com';
    const type = 'password-reset';

    it('should allow 3 password reset requests per hour', () => {
      const result1 = rateLimiter.checkLimit(identifier, type);
      const result2 = rateLimiter.checkLimit(identifier, type);
      const result3 = rateLimiter.checkLimit(identifier, type);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result3.allowed).toBe(true);
      expect(result3.remainingAttempts).toBe(0);
    });

    it('should block after 3 password reset requests', () => {
      for (let i = 0; i < 3; i++) {
        rateLimiter.checkLimit(identifier, type);
      }

      const result = rateLimiter.checkLimit(identifier, type);
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('locked for 60 minutes');
    });
  });

  describe('Registration Rate Limiting', () => {
    const identifier = '192.168.1.1';
    const type = 'registration';

    it('should allow 3 registration attempts per hour', () => {
      const result1 = rateLimiter.checkLimit(identifier, type);
      const result2 = rateLimiter.checkLimit(identifier, type);
      const result3 = rateLimiter.checkLimit(identifier, type);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result3.allowed).toBe(true);
    });

    it('should block after 3 registration attempts (prevents spam)', () => {
      for (let i = 0; i < 3; i++) {
        rateLimiter.checkLimit(identifier, type);
      }

      const result = rateLimiter.checkLimit(identifier, type);
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('locked for 120 minutes');
    });
  });

  describe('Email Rate Limiting', () => {
    const identifier = 'sender@example.com';
    const type = 'email';

    it('should allow 10 emails per hour', () => {
      let lastResult: RateLimitResult | null = null;

      for (let i = 0; i < 10; i++) {
        lastResult = rateLimiter.checkLimit(identifier, type);
      }

      expect(lastResult?.allowed).toBe(true);
      expect(lastResult?.remainingAttempts).toBe(0);
    });

    it('should block after 10 emails (prevents spam)', () => {
      for (let i = 0; i < 10; i++) {
        rateLimiter.checkLimit(identifier, type);
      }

      const result = rateLimiter.checkLimit(identifier, type);
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('locked for 60 minutes');
    });
  });

  describe('Manual Blocking', () => {
    it('should allow manual blocking of user', () => {
      const identifier = 'suspicious@example.com';
      const type = 'login';

      // Manually block for 1 hour
      rateLimiter.block(identifier, type, 60 * 60 * 1000);

      const result = rateLimiter.checkLimit(identifier, type);
      expect(result.allowed).toBe(false);
      expect(result.blockedUntil).toBeDefined();
    });

    it('should use default block duration if not specified', () => {
      const identifier = 'user@example.com';
      const type = 'login';

      rateLimiter.block(identifier, type);

      const result = rateLimiter.checkLimit(identifier, type);
      expect(result.allowed).toBe(false);
    });
  });

  describe('Status Checking', () => {
    it('should return current status for identifier', () => {
      const identifier = 'user@example.com';
      const type = 'login';

      // Make 2 attempts
      rateLimiter.checkLimit(identifier, type);
      rateLimiter.checkLimit(identifier, type);

      const status = rateLimiter.getStatus(identifier, type);
      expect(status.attempts).toBe(2);
      expect(status.blocked).toBe(false);
      expect(status.remainingAttempts).toBe(3);
    });

    it('should show blocked status', () => {
      const identifier = 'user@example.com';
      const type = 'login';

      // Exhaust attempts
      for (let i = 0; i < 6; i++) {
        rateLimiter.checkLimit(identifier, type);
      }

      const status = rateLimiter.getStatus(identifier, type);
      expect(status.blocked).toBe(true);
      expect(status.remainingAttempts).toBe(0);
    });

    it('should return clean status for new identifier', () => {
      const status = rateLimiter.getStatus('new@example.com', 'login');

      expect(status.attempts).toBe(0);
      expect(status.blocked).toBe(false);
      expect(status.remainingAttempts).toBe(5);
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', () => {
      // Create some activity
      rateLimiter.checkLimit('user1@example.com', 'login');
      rateLimiter.checkLimit('user2@example.com', 'api');

      // Block one user
      for (let i = 0; i < 6; i++) {
        rateLimiter.checkLimit('user3@example.com', 'login');
      }

      const stats = rateLimiter.getStats();

      expect(stats.totalEntries).toBe(3);
      expect(stats.blockedEntries).toBe(1);
      expect(stats.configuredTypes).toContain('login');
      expect(stats.configuredTypes).toContain('api');
      expect(stats.configuredTypes).toContain('2fa');
    });
  });

  describe('Custom Configuration', () => {
    it('should allow setting custom rate limit config', () => {
      const customType = 'custom-action';

      rateLimiter.setConfig(customType, {
        windowMs: 5000, // 5 seconds
        maxAttempts: 2,
        blockDurationMs: 10000, // 10 seconds
      });

      const result1 = rateLimiter.checkLimit('user@example.com', customType);
      const result2 = rateLimiter.checkLimit('user@example.com', customType);
      const result3 = rateLimiter.checkLimit('user@example.com', customType);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result3.allowed).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown rate limit type gracefully', () => {
      const result = rateLimiter.checkLimit('user@example.com', 'unknown-type');

      expect(result.allowed).toBe(true);
      expect(result.message).toContain('No rate limit configured');
    });

    it('should handle rapid successive calls', () => {
      const identifier = 'rapid@example.com';
      const type = 'login';
      const results: RateLimitResult[] = [];

      // Make 10 rapid calls
      for (let i = 0; i < 10; i++) {
        results.push(rateLimiter.checkLimit(identifier, type));
      }

      // First 5 should be allowed
      expect(results.slice(0, 5).every((r) => r.allowed)).toBe(true);

      // Remaining should be blocked
      expect(results.slice(5).every((r) => !r.allowed)).toBe(true);
    });

    it('should handle empty identifier gracefully', () => {
      const result = rateLimiter.checkLimit('', 'login');
      expect(result.allowed).toBe(true);
    });
  });

  describe('Cleanup Functionality', () => {
    it('should not crash on cleanup', () => {
      // Add some entries
      rateLimiter.checkLimit('user1@example.com', 'login');
      rateLimiter.checkLimit('user2@example.com', 'api');

      // Manual cleanup should not throw
      expect(() => rateLimiter.cleanup()).not.toThrow();
    });

    it('should clear all entries on demand', () => {
      // Add entries
      rateLimiter.checkLimit('user1@example.com', 'login');
      rateLimiter.checkLimit('user2@example.com', 'api');

      let stats = rateLimiter.getStats();
      expect(stats.totalEntries).toBeGreaterThan(0);

      // Clear
      rateLimiter.clear();

      stats = rateLimiter.getStats();
      expect(stats.totalEntries).toBe(0);
    });
  });

  describe('Security Attack Scenarios', () => {
    it('should prevent distributed brute force (multiple IPs)', () => {
      const type = 'login';
      const targetEmail = 'victim@example.com';

      // Simulate attacks from different IPs
      const ips = ['192.168.1.1', '192.168.1.2', '192.168.1.3'];

      ips.forEach((ip) => {
        for (let i = 0; i < 6; i++) {
          rateLimiter.checkLimit(`${ip}:${targetEmail}`, type);
        }
      });

      // All IPs should be blocked
      ips.forEach((ip) => {
        const result = rateLimiter.checkLimit(`${ip}:${targetEmail}`, type);
        expect(result.allowed).toBe(false);
      });
    });

    it('should prevent credential stuffing attacks', () => {
      const type = 'login';
      const emails = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
        'user4@example.com',
        'user5@example.com',
        'user6@example.com',
      ];

      // Each email gets blocked after 5 attempts
      emails.forEach((email) => {
        for (let i = 0; i < 6; i++) {
          rateLimiter.checkLimit(email, type);
        }

        const result = rateLimiter.checkLimit(email, type);
        expect(result.allowed).toBe(false);
      });
    });

    it('should prevent DoS via API flooding', () => {
      const identifier = '192.168.1.100';
      const type = 'api';

      // Attempt to flood API (101 calls)
      for (let i = 0; i < 101; i++) {
        rateLimiter.checkLimit(identifier, type);
      }

      const result = rateLimiter.checkLimit(identifier, type);
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('Account locked');
    });
  });

  describe('Time-based Tests', () => {
    it('should provide reset time information', () => {
      const identifier = 'user@example.com';
      const type = 'login';

      const result = rateLimiter.checkLimit(identifier, type);

      expect(result.resetAt).toBeDefined();
      expect(result.resetAt).toBeInstanceOf(Date);
      expect(result.resetAt!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should provide accurate blocked until time', () => {
      const identifier = 'user@example.com';
      const type = 'login';

      // Exhaust attempts
      for (let i = 0; i < 6; i++) {
        rateLimiter.checkLimit(identifier, type);
      }

      const result = rateLimiter.checkLimit(identifier, type);

      expect(result.blockedUntil).toBeDefined();
      expect(result.blockedUntil).toBeInstanceOf(Date);

      // Should be blocked for approximately 30 minutes (1800000 ms)
      const blockDuration = result.blockedUntil!.getTime() - Date.now();
      expect(blockDuration).toBeGreaterThan(1700000); // At least 28 minutes
      expect(blockDuration).toBeLessThan(1900000); // At most 32 minutes
    });
  });
});
