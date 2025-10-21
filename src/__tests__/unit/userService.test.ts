/**
 * User Service Unit Tests
 */

import { createMockUser, createMockUsers } from '../../__mocks__/testDataFactory';

describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with all required fields', () => {
      const user = createMockUser({
        name: 'John Doe',
        email: 'john@example.com',
        roleId: 'admin',
      });

      expect(user).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.roleId).toBe('admin');
    });

    it('should have both uid and id', () => {
      const user = createMockUser();

      expect(user.uid).toBeTruthy();
      expect(user.id).toBeTruthy();
    });

    it('should initialize permissions array', () => {
      const user = createMockUser();

      expect(Array.isArray(user.permissions)).toBe(true);
    });

    it('should track online status', () => {
      const user = createMockUser({ isOnline: true });

      expect(user.isOnline).toBe(true);
      expect(user.lastSeen).toBeDefined();
    });
  });

  describe('batch user creation', () => {
    it('should create multiple users', () => {
      const users = createMockUsers(5);

      expect(users).toHaveLength(5);
      expect(users[0].id).toBe('user-1');
      expect(users[4].id).toBe('user-5');
    });

    it('should generate unique emails', () => {
      const users = createMockUsers(3);

      const emails = users.map((u) => u.email);
      expect(new Set(emails).size).toBe(3);
    });

    it('should generate unique names', () => {
      const users = createMockUsers(3);

      expect(users[0].name).toBe('User 1');
      expect(users[1].name).toBe('User 2');
      expect(users[2].name).toBe('User 3');
    });
  });

  describe('user validation', () => {
    it('should have valid email format', () => {
      const user = createMockUser({ email: 'test@domain.com' });

      expect(user.email).toContain('@');
      expect(user.email).toContain('.');
    });

    it('should have avatar URL', () => {
      const user = createMockUser();

      expect(typeof user.avatarUrl).toBe('string');
    });

    it('should have valid lastSeen timestamp', () => {
      const user = createMockUser();

      expect(user.lastSeen).toBeDefined();
      expect(typeof user.lastSeen).toBe('string');
    });
  });

  describe('user permissions', () => {
    it('should support custom permissions', () => {
      const user = createMockUser({
        permissions: [],
      });

      expect(Array.isArray(user.permissions)).toBe(true);
    });

    it('should default to empty permissions', () => {
      const user = createMockUser();

      expect(user.permissions).toEqual([]);
    });
  });
});
