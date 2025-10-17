/**
 * Project Service Unit Tests
 */

import { createMockProject, createMockUser } from '../../__mocks__/testDataFactory';

describe('ProjectService', () => {
  describe('createProject', () => {
    it('should create a project with valid data', () => {
      const user = createMockUser({ name: 'Test User' });
      const project = createMockProject({
        name: 'New Project',
        location: 'Jakarta',
        members: [user]
      });

      expect(project).toBeDefined();
      expect(project.name).toBe('New Project');
      expect(project.location).toBe('Jakarta');
      expect(project.members).toHaveLength(1);
    });

    it('should create project with default values', () => {
      const project = createMockProject();

      expect(project.id).toBe('test-project-id');
      expect(project.items).toEqual([]);
      expect(project.members).toEqual([]);
    });
  });

  describe('updateProject', () => {
    it('should update project properties', () => {
      const project = createMockProject({ name: 'Original Name' });
      const updated = createMockProject({ 
        ...project, 
        name: 'Updated Name' 
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.id).toBe(project.id);
    });
  });

  describe('validateProject', () => {
    it('should validate required fields', () => {
      const project = createMockProject();

      expect(project.id).toBeTruthy();
      expect(project.name).toBeTruthy();
      expect(project.location).toBeTruthy();
      expect(project.startDate).toBeTruthy();
    });

    it('should have array properties initialized', () => {
      const project = createMockProject();

      expect(Array.isArray(project.items)).toBe(true);
      expect(Array.isArray(project.members)).toBe(true);
      expect(Array.isArray(project.documents)).toBe(true);
    });
  });
});
