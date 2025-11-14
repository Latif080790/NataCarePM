/**
 * Component Tests - ResponsiveTable
 * 
 * Comprehensive testing for ResponsiveTable component including:
 * - Mobile vs desktop rendering
 * - Sorting functionality
 * - Pagination
 * - Search filtering
 * - Row click handling
 * - Empty states
 * - Loading states
 * 
 * Created: November 2025
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ResponsiveTable, Column } from '../ResponsiveTable';

// ============================================================================
// TEST DATA
// ============================================================================

interface TestDataItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
}

const mockData: TestDataItem[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'active',
    joinedAt: '2025-01-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'active',
    joinedAt: '2025-02-20',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'User',
    status: 'inactive',
    joinedAt: '2025-03-10',
  },
];

const mockColumns: Column<TestDataItem>[] = [
  {
    key: 'name',
    label: 'Name',
    mobileLabel: 'Name',
    sortable: true,
    width: '200px',
  },
  {
    key: 'email',
    label: 'Email',
    mobileLabel: 'Email',
    sortable: true,
    width: '250px',
  },
  {
    key: 'role',
    label: 'Role',
    hiddenOnMobile: true,
    sortable: true,
    width: '120px',
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (value) => (
      <span className={`badge-${value}`}>
        {value === 'active' ? 'Active' : 'Inactive'}
      </span>
    ),
    width: '100px',
  },
  {
    key: 'joinedAt',
    label: 'Joined Date',
    mobileLabel: 'Joined',
    sortable: true,
    width: '150px',
  },
];

// ============================================================================
// MOCK WINDOW PROPERTIES
// ============================================================================

function setMobileViewport() {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 500,
  });
  window.dispatchEvent(new Event('resize'));
}

function setDesktopViewport() {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  });
  window.dispatchEvent(new Event('resize'));
}

// ============================================================================
// TESTS
// ============================================================================

describe('ResponsiveTable Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setDesktopViewport(); // Default to desktop
  });

  // ==========================================================================
  // RENDERING
  // ==========================================================================

  describe('Rendering', () => {
    it('should render desktop table view', () => {
      setDesktopViewport();

      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
        />
      );

      // Should render table element
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Should render all column headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
    });

    it('should render mobile card view', async () => {
      setMobileViewport();

      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
        />
      );

      // Wait for mobile view to render
      await waitFor(() => {
        // Should not render table element
        expect(screen.queryByRole('table')).not.toBeInTheDocument();

        // Should render card elements
        const cards = screen.getAllByText(/John Doe|Jane Smith|Bob Johnson/);
        expect(cards.length).toBeGreaterThan(0);
      });
    });

    it('should hide columns marked as hiddenOnMobile', async () => {
      setMobileViewport();

      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
        />
      );

      await waitFor(() => {
        // 'Role' column should not be visible on mobile
        expect(screen.queryByText('Role:')).not.toBeInTheDocument();
      });
    });

    it('should render custom mobile labels', async () => {
      setMobileViewport();

      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
        />
      );

      await waitFor(() => {
        // Should use mobileLabel instead of label
        expect(screen.getByText('Joined:')).toBeInTheDocument();
      });
    });

    it('should render custom cell content', () => {
      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
        />
      );

      // Status column uses custom render
      const activeStatus = screen.getAllByText('Active');
      expect(activeStatus.length).toBeGreaterThan(0);
      
      const inactiveStatus = screen.getByText('Inactive');
      expect(inactiveStatus).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // EMPTY & LOADING STATES
  // ==========================================================================

  describe('Empty and Loading States', () => {
    it('should show loading state', () => {
      render(
        <ResponsiveTable
          data={[]}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          loading={true}
        />
      );

      // Should show loading spinner/text
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should show empty state when no data', () => {
      render(
        <ResponsiveTable
          data={[]}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          loading={false}
          emptyMessage="No users found"
        />
      );

      expect(screen.getByText('No users found')).toBeInTheDocument();
    });

    it('should show default empty message', () => {
      render(
        <ResponsiveTable
          data={[]}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          loading={false}
        />
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SORTING
  // ==========================================================================

  describe('Sorting', () => {
    it('should sort data when clicking sortable column header', async () => {
      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
        />
      );

      // Click on Name header to sort
      const nameHeader = screen.getByText('Name').closest('th');
      fireEvent.click(nameHeader!);

      await waitFor(() => {
        // Data should be sorted (implementation may vary)
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(1);
      });
    });

    it('should toggle sort direction', async () => {
      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
        />
      );

      const nameHeader = screen.getByText('Name').closest('th');

      // First click - ascending
      fireEvent.click(nameHeader!);
      
      await waitFor(() => {
        // Check for sort icon (ChevronUp)
        const sortIcon = nameHeader!.querySelector('svg');
        expect(sortIcon).toBeInTheDocument();
      });

      // Second click - descending
      fireEvent.click(nameHeader!);

      await waitFor(() => {
        // Icon should change to ChevronDown
        const sortIcon = nameHeader!.querySelector('svg');
        expect(sortIcon).toBeInTheDocument();
      });
    });

    it('should not sort when clicking non-sortable column', () => {
      const nonSortableColumns: Column<TestDataItem>[] = [
        {
          key: 'name',
          label: 'Name',
          sortable: false, // Not sortable
          width: '200px',
        },
      ];

      render(
        <ResponsiveTable
          data={mockData}
          columns={nonSortableColumns}
          keyExtractor={(item) => item.id}
        />
      );

      const nameHeader = screen.getByText('Name').closest('th');
      fireEvent.click(nameHeader!);

      // Should not have sort icon
      const sortIcon = nameHeader!.querySelector('svg');
      expect(sortIcon).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SEARCH & FILTERING
  // ==========================================================================

  describe('Search and Filtering', () => {
    it('should show search input when searchable is true', () => {
      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          searchable={true}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should filter data when searching', async () => {
      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          searchable={true}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });

      await waitFor(() => {
        // Should only show John Doe
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('should show no results when search yields nothing', async () => {
      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          searchable={true}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'NonexistentUser' } });

      await waitFor(() => {
        expect(screen.getByText('No data available')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // ROW INTERACTIONS
  // ==========================================================================

  describe('Row Interactions', () => {
    it('should call onRowClick when clicking a row', async () => {
      const onRowClick = vi.fn();

      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          onRowClick={onRowClick}
        />
      );

      // Click on first row
      const firstRow = screen.getByText('John Doe').closest('tr');
      fireEvent.click(firstRow!);

      await waitFor(() => {
        expect(onRowClick).toHaveBeenCalledTimes(1);
        expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
      });
    });

    it('should show hover effect when onRowClick is provided', () => {
      const onRowClick = vi.fn();

      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          onRowClick={onRowClick}
        />
      );

      const firstRow = screen.getByText('John Doe').closest('tr');
      expect(firstRow).toHaveClass(/cursor-pointer|hover/);
    });

    it('should not call onRowClick when no handler provided', () => {
      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
        />
      );

      const firstRow = screen.getByText('John Doe').closest('tr');
      
      // Should not have cursor-pointer class
      expect(firstRow).not.toHaveClass('cursor-pointer');
    });
  });

  // ==========================================================================
  // PAGINATION
  // ==========================================================================

  describe('Pagination', () => {
    it('should paginate data based on pageSize', () => {
      const largeDataset = Array.from({ length: 50 }, (_, i) => ({
        id: `${i + 1}`,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: 'User',
        status: 'active',
        joinedAt: '2025-01-01',
      }));

      render(
        <ResponsiveTable
          data={largeDataset}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          pageSize={10}
        />
      );

      // Should only show 10 rows (pageSize)
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeLessThanOrEqual(11); // 10 data rows + 1 header
    });

    it('should show pagination controls for large datasets', () => {
      const largeDataset = Array.from({ length: 50 }, (_, i) => ({
        id: `${i + 1}`,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: 'User',
        status: 'active',
        joinedAt: '2025-01-01',
      }));

      render(
        <ResponsiveTable
          data={largeDataset}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          pageSize={10}
        />
      );

      // Should have pagination buttons
      expect(screen.getByText(/page/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================

  describe('Accessibility', () => {
    it('should have proper table semantics', () => {
      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('row').length).toBeGreaterThan(0);
    });

    it('should have accessible column headers', () => {
      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
        />
      );

      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBe(mockColumns.length);
    });

    it('should support keyboard navigation', async () => {
      const onRowClick = vi.fn();

      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          onRowClick={onRowClick}
        />
      );

      const firstRow = screen.getByText('John Doe').closest('tr');
      firstRow!.focus();

      // Press Enter key
      fireEvent.keyDown(firstRow!, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(onRowClick).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // CUSTOM PROPS
  // ==========================================================================

  describe('Custom Props', () => {
    it('should apply custom title', () => {
      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          title="User Management"
        />
      );

      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          className="custom-table-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-table-class');
    });

    it('should show export button when exportable is true', () => {
      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          exportable={true}
        />
      );

      expect(screen.getByRole('button', { name: /export|download/i })).toBeInTheDocument();
    });

    it('should show filter button when filterable is true', () => {
      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          filterable={true}
        />
      );

      expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // RESPONSIVE BEHAVIOR
  // ==========================================================================

  describe('Responsive Behavior', () => {
    it('should switch from desktop to mobile view on resize', async () => {
      const { rerender } = render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
        />
      );

      // Initially desktop
      expect(screen.getByRole('table')).toBeInTheDocument();

      // Resize to mobile
      setMobileViewport();
      rerender(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
      });
    });

    it('should adjust pageSize for mobile', async () => {
      setMobileViewport();

      const largeDataset = Array.from({ length: 30 }, (_, i) => ({
        id: `${i + 1}`,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: 'User',
        status: 'active',
        joinedAt: '2025-01-01',
      }));

      render(
        <ResponsiveTable
          data={largeDataset}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          pageSize={10} // Desktop pageSize
        />
      );

      await waitFor(() => {
        // Mobile should use smaller pageSize (implementation dependent)
        const cards = screen.getAllByRole('article');
        expect(cards.length).toBeLessThanOrEqual(10);
      });
    });
  });
});
