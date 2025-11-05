/**
 * Unit Tests for Project Service
 * Comprehensive test coverage for project management functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import {
  createProject,
  updateProject,
  deleteProject,
  getProject,
  getProjects,
  addProjectMember,
  removeProjectMember,
  updateProjectStatus,
} from '../../api/projectService';
import { db } from '../../firebaseConfig';
import type { Project, ProjectStatus } from '../../types';

// ========================================
// MOCKS
// ========================================

// Mock Firebase Firestore
vi.mock('../../firebaseConfig', () => ({
  db: {
    collection: vi.fn(),
  },
}));

// Mock Firebase functions
const mockDoc = vi.fn();
const mockGet = vi.fn();
const mockSet = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockGetDocs = vi.fn();

const mockCollection = vi.fn(() => ({
  doc: mockDoc,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
}));

const mockQuery = vi.fn(() => ({
  get: mockGetDocs,
}));

vi.mocked(db.collection).mockImplementation(mockCollection);

// Mock document references
const mockDocRef = {
  id: 'test-project-id',
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
  delete: mockDelete,
};

mockDoc.mockReturnValue(mockDocRef);
mockWhere.mockReturnValue(mockQuery);
mockOrderBy.mockReturnValue(mockQuery);
mockLimit.mockReturnValue(mockQuery);

// ========================================
// TEST DATA
// ========================================

const mockProject: Project = {
  id: 'test-project-id',
  name: 'Test Construction Project',
  description: 'A comprehensive construction project for testing',
  status: 'active' as ProjectStatus,
  budget: 1000000,
  spent: 250000,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  managerId: 'manager-user-id',
  members: ['user-1', 'user-2', 'user-3'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
  createdBy: 'admin-user-id',
};

const mockProjectData = {
  name: 'Test Construction Project',
  description: 'A comprehensive construction project for testing',
  budget: 1000000,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  managerId: 'manager-user-id',
};

// ========================================
// TEST SUITES
// ========================================

describe('Project Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createProject', () => {
    it('should create a project successfully', async () => {
      // Arrange
      const userId = 'admin-user-id';
      mockDoc.mockReturnValue(mockDocRef);
      mockSet.mockResolvedValue(undefined);

      // Act
      const result = await createProject(mockProjectData, userId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe(mockProjectData.name);
      expect(result.data?.createdBy).toBe(userId);
      expect(result.data?.status).toBe('planning');
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          name: mockProjectData.name,
          description: mockProjectData.description,
          budget: mockProjectData.budget,
          status: 'planning',
          createdBy: userId,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );
    });

    it('should validate required fields', async () => {
      // Arrange
      const invalidData = {
        name: '', // Invalid: empty name
        budget: -1000, // Invalid: negative budget
      };
      const userId = 'admin-user-id';

      // Act & Assert
      await expect(createProject(invalidData as any, userId)).rejects.toThrow();
    });

    it('should handle Firebase errors', async () => {
      // Arrange
      const userId = 'admin-user-id';
      const error = new Error('Firebase error');
      mockSet.mockRejectedValue(error);

      // Act
      const result = await createProject(mockProjectData, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PROJECT_CREATION_ERROR');
    });
  });

  describe('updateProject', () => {
    it('should update a project successfully', async () => {
      // Arrange
      const projectId = 'test-project-id';
      const updateData = {
        name: 'Updated Project Name',
        budget: 1500000,
      };
      const userId = 'admin-user-id';

      mockGet.mockResolvedValue({
        exists: () => true,
        data: () => mockProject,
      });
      mockUpdate.mockResolvedValue(undefined);

      // Act
      const result = await updateProject(projectId, updateData, userId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(updateData.name);
      expect(result.data?.budget).toBe(updateData.budget);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: updateData.name,
          budget: updateData.budget,
          updatedAt: expect.any(Date),
        })
      );
    });

    it('should return error for non-existent project', async () => {
      // Arrange
      const projectId = 'non-existent-id';
      const updateData = { name: 'New Name' };
      const userId = 'admin-user-id';

      mockGet.mockResolvedValue({
        exists: () => false,
      });

      // Act
      const result = await updateProject(projectId, updateData, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PROJECT_NOT_FOUND');
    });

    it('should validate budget constraints', async () => {
      // Arrange
      const projectId = 'test-project-id';
      const updateData = {
        budget: -50000, // Invalid: negative budget
      };
      const userId = 'admin-user-id';

      mockGet.mockResolvedValue({
        exists: () => true,
        data: () => mockProject,
      });

      // Act
      const result = await updateProject(projectId, updateData, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('deleteProject', () => {
    it('should delete a project successfully', async () => {
      // Arrange
      const projectId = 'test-project-id';
      const userId = 'admin-user-id';

      mockGet.mockResolvedValue({
        exists: () => true,
        data: () => mockProject,
      });
      mockDelete.mockResolvedValue(undefined);

      // Act
      const result = await deleteProject(projectId, userId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should prevent deletion of projects with active tasks', async () => {
      // Arrange
      const projectId = 'test-project-id';
      const userId = 'admin-user-id';
      const projectWithTasks = {
        ...mockProject,
        taskCount: 5, // Has active tasks
      };

      mockGet.mockResolvedValue({
        exists: () => true,
        data: () => projectWithTasks,
      });

      // Act
      const result = await deleteProject(projectId, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PROJECT_HAS_ACTIVE_TASKS');
    });

    it('should check user permissions', async () => {
      // Arrange
      const projectId = 'test-project-id';
      const userId = 'unauthorized-user-id';

      mockGet.mockResolvedValue({
        exists: () => true,
        data: () => mockProject, // Created by different user
      });

      // Act
      const result = await deleteProject(projectId, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('getProject', () => {
    it('should retrieve a project successfully', async () => {
      // Arrange
      const projectId = 'test-project-id';
      const userId = 'user-id';

      mockGet.mockResolvedValue({
        exists: () => true,
        data: () => mockProject,
      });

      // Act
      const result = await getProject(projectId, userId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(projectId);
      expect(result.data?.name).toBe(mockProject.name);
    });

    it('should return error for non-existent project', async () => {
      // Arrange
      const projectId = 'non-existent-id';
      const userId = 'user-id';

      mockGet.mockResolvedValue({
        exists: () => false,
      });

      // Act
      const result = await getProject(projectId, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PROJECT_NOT_FOUND');
    });
  });

  describe('getProjects', () => {
    it('should retrieve projects with pagination', async () => {
      // Arrange
      const userId = 'user-id';
      const options = {
        limit: 10,
        status: 'active' as ProjectStatus,
      };

      const mockProjects = [mockProject];
      mockGetDocs.mockResolvedValue({
        docs: mockProjects.map(project => ({
          id: project.id,
          data: () => project,
        })),
      });

      // Act
      const result = await getProjects(userId, options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.projects).toHaveLength(1);
      expect(result.data?.projects[0].id).toBe(mockProject.id);
      expect(mockWhere).toHaveBeenCalledWith('members', 'array-contains', userId);
      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('should filter by status', async () => {
      // Arrange
      const userId = 'user-id';
      const options = {
        status: 'completed' as ProjectStatus,
      };

      mockGetDocs.mockResolvedValue({
        docs: [],
      });

      // Act
      await getProjects(userId, options);

      // Assert
      expect(mockWhere).toHaveBeenCalledWith('status', '==', 'completed');
    });
  });

  describe('addProjectMember', () => {
    it('should add a member successfully', async () => {
      // Arrange
      const projectId = 'test-project-id';
      const memberId = 'new-member-id';
      const adderId = 'admin-user-id';

      mockGet.mockResolvedValue({
        exists: () => true,
        data: () => mockProject,
      });
      mockUpdate.mockResolvedValue(undefined);

      // Act
      const result = await addProjectMember(projectId, memberId, adderId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        members: [...mockProject.members, memberId],
        updatedAt: expect.any(Date),
      });
    });

    it('should prevent adding duplicate members', async () => {
      // Arrange
      const projectId = 'test-project-id';
      const memberId = 'user-1'; // Already in members
      const adderId = 'admin-user-id';

      mockGet.mockResolvedValue({
        exists: () => true,
        data: () => mockProject,
      });

      // Act
      const result = await addProjectMember(projectId, memberId, adderId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('MEMBER_ALREADY_EXISTS');
    });

    it('should check permissions', async () => {
      // Arrange
      const projectId = 'test-project-id';
      const memberId = 'new-member-id';
      const adderId = 'unauthorized-user-id';

      mockGet.mockResolvedValue({
        exists: () => true,
        data: () => mockProject,
      });

      // Act
      const result = await addProjectMember(projectId, memberId, adderId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('removeProjectMember', () => {
    it('should remove a member successfully', async () => {
      // Arrange
      const projectId = 'test-project-id';
      const memberId = 'user-2';
      const removerId = 'admin-user-id';

      mockGet.mockResolvedValue({
        exists: () => true,
        data: () => mockProject,
      });
      mockUpdate.mockResolvedValue(undefined);

      // Act
      const result = await removeProjectMember(projectId, memberId, removerId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        members: ['user-1', 'user-3'], // user-2 removed
        updatedAt: expect.any(Date),
      });
    });

    it('should prevent removing the last member', async () => {
      // Arrange
      const projectId = 'test-project-id';
      const memberId = 'user-1';
      const removerId = 'admin-user-id';
      const singleMemberProject = {
        ...mockProject,
        members: ['user-1'], // Only one member
      };

      mockGet.mockResolvedValue({
        exists: () => true,
        data: () => singleMemberProject,
      });

      // Act
      const result = await removeProjectMember(projectId, memberId, removerId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CANNOT_REMOVE_LAST_MEMBER');
    });
  });

  describe('updateProjectStatus', () => {
    it('should update project status successfully', async () => {
      // Arrange
      const projectId = 'test-project-id';
      const newStatus = 'completed' as ProjectStatus;
      const userId = 'admin-user-id';

      mockGet.mockResolvedValue({
        exists: () => true,
        data: () => mockProject,
      });
      mockUpdate.mockResolvedValue(undefined);

      // Act
      const result = await updateProjectStatus(projectId, newStatus, userId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        status: newStatus,
        updatedAt: expect.any(Date),
      });
    });

    it('should validate status transitions', async () => {
      // Arrange
      const projectId = 'test-project-id';
      const invalidStatus = 'invalid-status' as ProjectStatus;
      const userId = 'admin-user-id';

      mockGet.mockResolvedValue({
        exists: () => true,
        data: () => mockProject,
      });

      // Act
      const result = await updateProjectStatus(projectId, invalidStatus, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_STATUS_TRANSITION');
    });
  });

  // ========================================
  // EDGE CASES AND ERROR HANDLING
  // ========================================

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      const userId = 'user-id';
      const networkError = new Error('Network error');
      mockGet.mockRejectedValue(networkError);

      // Act
      const result = await getProject('test-id', userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PROJECT_FETCH_ERROR');
    });

    it('should handle permission errors', async () => {
      // Arrange
      const projectId = 'restricted-project-id';
      const userId = 'unauthorized-user-id';

      mockGet.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockProject,
          members: ['authorized-user-1', 'authorized-user-2'], // User not in members
        }),
      });

      // Act
      const result = await getProject(projectId, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should validate date ranges', async () => {
      // Arrange
      const invalidProjectData = {
        ...mockProjectData,
        startDate: new Date('2024-12-31'),
        endDate: new Date('2024-01-01'), // End before start
      };
      const userId = 'admin-user-id';

      // Act
      const result = await createProject(invalidProjectData, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });
  });

  // ========================================
  // PERFORMANCE TESTS
  // ========================================

  describe('Performance', () => {
    it('should handle large project lists efficiently', async () => {
      // Arrange
      const userId = 'user-id';
      const largeProjectList = Array.from({ length: 100 }, (_, i) => ({
        ...mockProject,
        id: `project-${i}`,
        name: `Project ${i}`,
      }));

      mockGetDocs.mockResolvedValue({
        docs: largeProjectList.map(project => ({
          id: project.id,
          data: () => project,
        })),
      });

      // Act
      const startTime = Date.now();
      const result = await getProjects(userId, { limit: 100 });
      const endTime = Date.now();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.projects).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
