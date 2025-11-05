import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateTaskModal from './CreateTaskModal';
import { taskService } from '@/api/taskService';
import type { User, Project, Task } from '@/types';

// Mock all context hooks
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/contexts/ProjectContext', () => ({
  useProject: vi.fn(),
}));

vi.mock('@/contexts/ToastContext', () => ({
  useToast: vi.fn(),
}));

// Mock taskService
vi.mock('@/api/taskService', () => ({
  taskService: {
    createTask: vi.fn(),
    getTaskById: vi.fn(),
  },
}));

// Mock Modal component
vi.mock('./Modal', () => ({
  Modal: ({ isOpen, children, title }: any) => 
    isOpen ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

// Import mocked hooks
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { useToast } from '@/contexts/ToastContext';

describe('CreateTaskModal Component', () => {
  const mockUser: User = {
    uid: 'firebase-uid-1',
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    roleId: 'admin',
    avatarUrl: 'https://example.com/avatar.jpg',
  };

  const mockUser2: User = {
    uid: 'firebase-uid-2',
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    roleId: 'member',
    avatarUrl: 'https://example.com/avatar2.jpg',
  };

  const mockProject: Project = {
    id: 'project-1',
    name: 'Test Project',
    location: 'Test Location',
    startDate: '2024-01-01',
    members: [mockUser, mockUser2],
    items: [
      {
        id: 1,
        no: '1.1',
        uraian: 'Foundation Work',
        satuan: 'm2',
        volume: 100,
        hargaSatuan: 50000,
        kategori: 'Pekerjaan Tanah',
        ahspId: 'AHSP-001',
      },
      {
        id: 2,
        no: '1.2',
        uraian: 'Steel Structure',
        satuan: 'kg',
        volume: 500,
        hargaSatuan: 15000,
        kategori: 'Pekerjaan Struktur',
        ahspId: 'AHSP-002',
      },
    ],
    dailyReports: [],
    attendances: [],
    expenses: [],
    documents: [],
    purchaseOrders: [],
    inventory: [],
    termins: [],
    auditLog: [],
  };

  const mockAddToast = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnTaskCreated = vi.fn();

  const renderComponent = (props = {}) => {
    const defaultProps = {
      isOpen: true,
      onClose: mockOnClose,
      onTaskCreated: mockOnTaskCreated,
      ...props,
    };

    return render(<CreateTaskModal {...defaultProps} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock return values
    vi.mocked(useAuth).mockReturnValue({
      currentUser: mockUser,
      loading: false,
    } as any);
    
    vi.mocked(useProject).mockReturnValue({
      currentProject: mockProject,
    } as any);
    
    vi.mocked(useToast).mockReturnValue({
      addToast: mockAddToast,
    } as any);
  });

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      renderComponent();
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('Buat Task Baru')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      renderComponent({ isOpen: false });
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should render all form fields', () => {
      renderComponent();
      expect(screen.getByLabelText(/judul task/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/deskripsi/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/prioritas/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tanggal target/i)).toBeInTheDocument();
    });

    it('should render priority options', () => {
      renderComponent();
      const prioritySelect = screen.getByLabelText(/prioritas/i);
      expect(prioritySelect).toBeInTheDocument();
      // Options are inside select element
      expect(screen.getByRole('combobox', { name: /prioritas/i })).toBeInTheDocument();
    });

    it('should render status options', () => {
      renderComponent();
      const statusSelect = screen.getByLabelText(/status/i);
      expect(statusSelect).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument();
    });

    it('should render team members list', () => {
      renderComponent();
      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
      expect(screen.getByText(mockUser2.name)).toBeInTheDocument();
    });

    it('should render RAB items dropdown', () => {
      renderComponent();
      expect(screen.getByText(/pilih item rab/i)).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /batal/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /buat task/i })).toBeInTheDocument();
    });
  });

  describe('Form Input', () => {
    it('should update title field on input', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const titleInput = screen.getByLabelText(/judul task/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'New Task Title');
      
      expect(titleInput).toHaveValue('New Task Title');
    });

    it('should update description field on input', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const descInput = screen.getByLabelText(/deskripsi/i);
      await user.clear(descInput);
      await user.type(descInput, 'Task description here');
      
      expect(descInput).toHaveValue('Task description here');
    });

    it('should show character count for description', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const descInput = screen.getByLabelText(/deskripsi/i);
      await user.type(descInput, 'Test description');
      
      await waitFor(() => {
        expect(screen.getByText(/\d+\/1000/)).toBeInTheDocument();
      });
    });

    it('should update priority selection', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const prioritySelect = screen.getByLabelText(/prioritas/i);
      await user.selectOptions(prioritySelect, 'high');
      
      expect(prioritySelect).toHaveValue('high');
    });

    it('should update status selection', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOptions(statusSelect, 'in-progress');
      
      expect(statusSelect).toHaveValue('in-progress');
    });

    it('should update due date', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const dateInput = screen.getByLabelText(/tanggal target/i);
      await user.clear(dateInput);
      await user.type(dateInput, '2024-12-31');
      
      expect(dateInput).toHaveValue('2024-12-31');
    });
  });

  describe('Assignee Management', () => {
    it('should toggle assignee selection', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const checkboxes = screen.getAllByRole('checkbox');
      const firstCheckbox = checkboxes[0];
      
      await user.click(firstCheckbox);
      expect(firstCheckbox).toBeChecked();
      
      await user.click(firstCheckbox);
      expect(firstCheckbox).not.toBeChecked();
    });

    it('should update selected count', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      
      await waitFor(() => {
        expect(screen.getByText(/1 dari 2 team member dipilih/i)).toBeInTheDocument();
      });
    });

    it('should allow multiple assignees', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);
      
      await waitFor(() => {
        expect(screen.getByText(/2 dari 2 team member dipilih/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tag Management', () => {
    it('should add tag via button click', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const tagInput = screen.getByPlaceholderText(/tambahkan tag/i);
      await user.type(tagInput, 'urgent');
      
      const addButton = screen.getByRole('button', { name: /tambah tag/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('urgent')).toBeInTheDocument();
      });
    });

    it('should add tag via Enter key', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const tagInput = screen.getByPlaceholderText(/tambahkan tag/i);
      await user.type(tagInput, 'important{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText('important')).toBeInTheDocument();
      });
    });

    it('should not add duplicate tags', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const tagInput = screen.getByPlaceholderText(/tambahkan tag/i);
      await user.type(tagInput, 'duplicate');
      await user.click(screen.getByRole('button', { name: /tambah tag/i }));
      
      await user.clear(tagInput);
      await user.type(tagInput, 'duplicate');
      await user.click(screen.getByRole('button', { name: /tambah tag/i }));
      
      const tags = screen.getAllByText('duplicate');
      expect(tags).toHaveLength(1);
    });

    it('should not add empty or whitespace-only tags', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const tagInput = screen.getByPlaceholderText(/tambahkan tag/i);
      const addButton = screen.getByRole('button', { name: /tambah tag/i });
      
      await user.type(tagInput, '   ');
      await user.click(addButton);
      
      expect(screen.queryByRole('button', { name: /^   $/ })).not.toBeInTheDocument();
    });

    it('should remove tag via X button', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const tagInput = screen.getByPlaceholderText(/tambahkan tag/i);
      await user.type(tagInput, 'removeme{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText('removeme')).toBeInTheDocument();
      });
      
      const removeButton = screen.getByRole('button', { name: /hapus tag removeme/i });
      await user.click(removeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('removeme')).not.toBeInTheDocument();
      });
    });

    it('should display all added tags', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const tagInput = screen.getByPlaceholderText(/tambahkan tag/i);
      
      await user.type(tagInput, 'tag1{Enter}');
      await user.type(tagInput, 'tag2{Enter}');
      await user.type(tagInput, 'tag3{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText('tag1')).toBeInTheDocument();
        expect(screen.getByText('tag2')).toBeInTheDocument();
        expect(screen.getByText('tag3')).toBeInTheDocument();
      });
    });
  });

  describe('RAB Item Selection', () => {
    it('should select RAB item from dropdown', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const rabSelect = screen.getByLabelText(/item rab/i);
      await user.selectOptions(rabSelect, '1');
      
      expect(rabSelect).toHaveValue('1');
    });

    it('should clear RAB item selection', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const rabSelect = screen.getByLabelText(/item rab/i);
      await user.selectOptions(rabSelect, '1');
      await user.selectOptions(rabSelect, '');
      
      expect(rabSelect).toHaveValue('');
    });
  });

  describe('Form Validation', () => {
    it('should show error when title is empty', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const submitButton = screen.getByRole('button', { name: /buat task/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/judul.*required/i)).toBeInTheDocument();
      });
    });

    it('should show error when description is empty', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const titleInput = screen.getByLabelText(/judul task/i);
      await user.type(titleInput, 'Valid Title');
      
      const submitButton = screen.getByRole('button', { name: /buat task/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/deskripsi.*required/i)).toBeInTheDocument();
      });
    });

    it('should clear errors when user starts typing', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Trigger validation error
      const submitButton = screen.getByRole('button', { name: /buat task/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/judul.*required/i)).toBeInTheDocument();
      });
      
      // Start typing
      const titleInput = screen.getByLabelText(/judul task/i);
      await user.type(titleInput, 'New Title');
      
      await waitFor(() => {
        expect(screen.queryByText(/judul.*required/i)).not.toBeInTheDocument();
      });
    });

    it('should validate minimum title length', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const titleInput = screen.getByLabelText(/judul task/i);
      await user.type(titleInput, 'AB'); // Less than 3 characters
      
      const submitButton = screen.getByRole('button', { name: /buat task/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/judul.*minimum.*3/i)).toBeInTheDocument();
      });
    });

    it('should validate minimum description length', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const titleInput = screen.getByLabelText(/judul task/i);
      await user.type(titleInput, 'Valid Title');
      
      const descInput = screen.getByLabelText(/deskripsi/i);
      await user.type(descInput, 'Short'); // Less than 10 characters
      
      const submitButton = screen.getByRole('button', { name: /buat task/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/deskripsi.*minimum.*10/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    const validFormData = {
      title: 'Test Task',
      description: 'This is a valid task description',
    };

    beforeEach(() => {
      const mockTask: Task = {
        id: 'task-1',
        projectId: 'project-1',
        title: validFormData.title,
        description: validFormData.description,
        status: 'todo',
        priority: 'medium',
        dueDate: '2024-01-01',
        assignedTo: [],
        tags: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'user-1',
        dependencies: [],
        subtasks: [],
        progress: 0,
      };

      vi.mocked(taskService.createTask).mockResolvedValue({
        success: true,
        data: 'task-1',
      });
      
      vi.mocked(taskService.getTaskById).mockResolvedValue({
        success: true,
        data: mockTask,
      });
    });

    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await user.type(screen.getByLabelText(/judul task/i), validFormData.title);
      await user.type(screen.getByLabelText(/deskripsi/i), validFormData.description);
      
      const submitButton = screen.getByRole('button', { name: /buat task/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(taskService.createTask).toHaveBeenCalled();
      });
    });

    it('should show success toast on successful submission', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await user.type(screen.getByLabelText(/judul task/i), validFormData.title);
      await user.type(screen.getByLabelText(/deskripsi/i), validFormData.description);
      
      await user.click(screen.getByRole('button', { name: /buat task/i }));
      
      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'success',
          })
        );
      });
    });

    it('should call onTaskCreated callback', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await user.type(screen.getByLabelText(/judul task/i), validFormData.title);
      await user.type(screen.getByLabelText(/deskripsi/i), validFormData.description);
      
      await user.click(screen.getByRole('button', { name: /buat task/i }));
      
      await waitFor(() => {
        expect(mockOnTaskCreated).toHaveBeenCalled();
      });
    });

    it('should close modal on successful submission', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await user.type(screen.getByLabelText(/judul task/i), validFormData.title);
      await user.type(screen.getByLabelText(/deskripsi/i), validFormData.description);
      
      await user.click(screen.getByRole('button', { name: /buat task/i }));
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show error toast on failed submission', async () => {
      vi.mocked(taskService.createTask).mockRejectedValue(new Error('API Error'));
      
      const user = userEvent.setup();
      renderComponent();
      
      await user.type(screen.getByLabelText(/judul task/i), validFormData.title);
      await user.type(screen.getByLabelText(/deskripsi/i), validFormData.description);
      
      await user.click(screen.getByRole('button', { name: /buat task/i }));
      
      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
          })
        );
      });
    });

    it('should disable form during submission', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await user.type(screen.getByLabelText(/judul task/i), validFormData.title);
      await user.type(screen.getByLabelText(/deskripsi/i), validFormData.description);
      
      const submitButton = screen.getByRole('button', { name: /buat task/i });
      await user.click(submitButton);
      
      // Should show loading state
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('should include tags in submission', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await user.type(screen.getByLabelText(/judul task/i), validFormData.title);
      await user.type(screen.getByLabelText(/deskripsi/i), validFormData.description);
      
      const tagInput = screen.getByPlaceholderText(/tambahkan tag/i);
      await user.type(tagInput, 'urgent{Enter}');
      
      await user.click(screen.getByRole('button', { name: /buat task/i }));
      
      await waitFor(() => {
        expect(taskService.createTask).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: expect.arrayContaining(['urgent']),
          })
        );
      });
    });

    it('should include RAB item in submission', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await user.type(screen.getByLabelText(/judul task/i), validFormData.title);
      await user.type(screen.getByLabelText(/deskripsi/i), validFormData.description);
      
      const rabSelect = screen.getByLabelText(/item rab/i);
      await user.selectOptions(rabSelect, '1');
      
      await user.click(screen.getByRole('button', { name: /buat task/i }));
      
      await waitFor(() => {
        expect(taskService.createTask).toHaveBeenCalledWith(
          expect.objectContaining({
            rabItemId: 1,
          })
        );
      });
    });
  });

  describe('Cancel & Reset', () => {
    it('should reset form on cancel', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const titleInput = screen.getByLabelText(/judul task/i);
      await user.type(titleInput, 'Test');
      
      const cancelButton = screen.getByRole('button', { name: /batal/i });
      await user.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should clear all fields on cancel', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await user.type(screen.getByLabelText(/judul task/i), 'Test Title');
      await user.type(screen.getByLabelText(/deskripsi/i), 'Test Description');
      
      const cancelButton = screen.getByRole('button', { name: /batal/i });
      await user.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing project gracefully', () => {
      vi.mocked(useProject).mockReturnValue({
        currentProject: null,
      } as any);
      
      renderComponent();
      
      const submitButton = screen.getByRole('button', { name: /buat task/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('should handle missing user gracefully', () => {
      vi.mocked(useAuth).mockReturnValue({
        currentUser: null,
      } as any);
      
      renderComponent();
      
      const submitButton = screen.getByRole('button', { name: /buat task/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('should handle project with no members', () => {
      const emptyProject = { ...mockProject, members: [] };
      vi.mocked(useProject).mockReturnValue({
        currentProject: emptyProject,
      } as any);
      
      renderComponent();
      
      expect(screen.getByText(/0 dari 0 team member dipilih/i)).toBeInTheDocument();
    });

    it('should handle project with no RAB items', () => {
      const emptyProject = { ...mockProject, items: [] };
      vi.mocked(useProject).mockReturnValue({
        currentProject: emptyProject,
      } as any);
      
      renderComponent();
      
      const rabSelect = screen.getByLabelText(/item rab/i);
      expect(rabSelect).toBeInTheDocument();
    });

    it('should trim whitespace from inputs', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await user.type(screen.getByLabelText(/judul task/i), '  Trimmed Title  ');
      await user.type(screen.getByLabelText(/deskripsi/i), '  Trimmed Description  ');
      
      await user.click(screen.getByRole('button', { name: /buat task/i }));
      
      await waitFor(() => {
        expect(taskService.createTask).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Trimmed Title',
            description: 'Trimmed Description',
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form labels', () => {
      renderComponent();
      
      expect(screen.getByLabelText(/judul task/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/deskripsi/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/prioritas/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });

    it('should have proper form structure', () => {
      renderComponent();
      
      const form = screen.getByRole('form', { name: /buat task baru/i });
      expect(form).toBeInTheDocument();
    });

    it('should display validation errors with proper attributes', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await user.click(screen.getByRole('button', { name: /buat task/i }));
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/judul.*required/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });
});
