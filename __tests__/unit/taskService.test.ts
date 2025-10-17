/**
 * Task Service Unit Tests
 */

import { createMockTask, createMockTasks } from '../../__mocks__/testDataFactory';

describe('TaskService', () => {
  describe('createTask', () => {
    it('should create a task with all required fields', () => {
      const task = createMockTask({
        title: 'Install HVAC System',
        description: 'Install and test HVAC system on floor 3',
        priority: 'high'
      });

      expect(task).toBeDefined();
      expect(task.title).toBe('Install HVAC System');
      expect(task.priority).toBe('high');
      expect(task.status).toBe('in-progress');
    });

    it('should create task with dependencies', () => {
      const task = createMockTask({
        dependencies: ['task-1', 'task-2']
      });

      expect(task.dependencies).toHaveLength(2);
      expect(task.dependencies).toContain('task-1');
    });

    it('should create task with subtasks', () => {
      const task = createMockTask({
        subtasks: [
          { id: 'sub-1', title: 'Subtask 1', completed: false },
          { id: 'sub-2', title: 'Subtask 2', completed: true }
        ]
      });

      expect(task.subtasks).toHaveLength(2);
      expect(task.subtasks[0].completed).toBe(false);
      expect(task.subtasks[1].completed).toBe(true);
    });
  });

  describe('batch creation', () => {
    it('should create multiple tasks', () => {
      const tasks = createMockTasks(10);

      expect(tasks).toHaveLength(10);
      expect(tasks[0].id).toBe('task-1');
      expect(tasks[9].id).toBe('task-10');
    });

    it('should create tasks for specific project', () => {
      const projectId = 'my-project-123';
      const tasks = createMockTasks(5, projectId);

      expect(tasks).toHaveLength(5);
      tasks.forEach(task => {
        expect(task.projectId).toBe(projectId);
      });
    });

    it('should vary task status', () => {
      const tasks = createMockTasks(9);
      
      const statuses = tasks.map(t => t.status);
      expect(statuses).toContain('todo');
      expect(statuses).toContain('in-progress');
      expect(statuses).toContain('completed');
    });
  });

  describe('task validation', () => {
    it('should have valid date format', () => {
      const task = createMockTask();

      expect(typeof task.startDate).toBe('string');
      expect(typeof task.dueDate).toBe('string');
      expect(typeof task.createdAt).toBe('string');
    });

    it('should have valid progress value', () => {
      const task = createMockTask({ progress: 75 });

      expect(task.progress).toBeGreaterThanOrEqual(0);
      expect(task.progress).toBeLessThanOrEqual(100);
    });

    it('should have valid priority', () => {
      const priorities = ['low', 'medium', 'high', 'critical'] as const;
      
      priorities.forEach(priority => {
        const task = createMockTask({ priority });
        expect(task.priority).toBe(priority);
      });
    });
  });
});
