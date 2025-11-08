/**
 * StateComponents Tests
 * Tests for Loading, Empty, Error, and Skeleton components
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  LoadingState,
  SkeletonLoader,
  EmptyState,
  ErrorState,
  TableLoadingSkeleton,
  CardLoadingSkeleton,
  ListLoadingSkeleton,
} from './StateComponents';
import { Plus, Trash2 } from 'lucide-react';

describe('StateComponents', () => {
  // ============================================================================
  // LoadingState Component
  // ============================================================================

  describe('LoadingState', () => {
    it('should render with default message', () => {
      render(<LoadingState />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(<LoadingState message="Loading projects..." />);
      
      expect(screen.getByText('Loading projects...')).toBeInTheDocument();
    });

    it('should render spinner with default medium size', () => {
      const { container } = render(<LoadingState />);
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('w-12', 'h-12');
    });

    it('should render small size variant', () => {
      const { container } = render(<LoadingState size="sm" />);
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('w-8', 'h-8');
      
      const text = screen.getByText('Loading...');
      expect(text).toHaveClass('text-sm');
    });

    it('should render large size variant', () => {
      const { container } = render(<LoadingState size="lg" />);
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('w-16', 'h-16');
      
      const text = screen.getByText('Loading...');
      expect(text).toHaveClass('text-lg');
    });

    it('should have blue spinner color', () => {
      const { container } = render(<LoadingState />);
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('text-blue-600');
    });

    it('should center content', () => {
      const { container } = render(<LoadingState />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });

  // ============================================================================
  // SkeletonLoader Component
  // ============================================================================

  describe('SkeletonLoader', () => {
    it('should render single skeleton by default', () => {
      const { container } = render(<SkeletonLoader />);
      
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(1);
    });

    it('should render multiple skeletons', () => {
      const { container } = render(<SkeletonLoader count={5} />);
      
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(5);
    });

    it('should apply default height', () => {
      const { container } = render(<SkeletonLoader />);
      
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toHaveClass('h-4');
    });

    it('should apply custom height', () => {
      const { container } = render(<SkeletonLoader height="h-8" />);
      
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toHaveClass('h-8');
    });

    it('should apply custom className', () => {
      const { container } = render(<SkeletonLoader className="my-custom-class" />);
      
      const wrapper = container.querySelector('.space-y-3');
      expect(wrapper).toHaveClass('my-custom-class');
    });

    it('should have gray background', () => {
      const { container } = render(<SkeletonLoader />);
      
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toHaveClass('bg-gray-200');
    });
  });

  // ============================================================================
  // EmptyState Component
  // ============================================================================

  describe('EmptyState', () => {
    it('should render title', () => {
      render(<EmptyState title="No data found" />);
      
      expect(screen.getByText('No data found')).toBeInTheDocument();
    });

    it('should render description when provided', () => {
      render(
        <EmptyState
          title="No projects"
          description="Get started by creating your first project"
        />
      );
      
      expect(screen.getByText('Get started by creating your first project')).toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      const { container } = render(<EmptyState title="No data" />);
      
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs).toHaveLength(0);
    });

    it('should render default inbox icon', () => {
      const { container } = render(<EmptyState title="Empty" />);
      
      const iconWrapper = container.querySelector('.bg-gray-100');
      expect(iconWrapper).toBeInTheDocument();
    });

    it('should render search icon for search variant', () => {
      render(<EmptyState title="No results" variant="search" />);
      
      // Search icon is rendered by lucide-react
      expect(screen.getByText('No results')).toBeInTheDocument();
    });

    it('should render folder icon for folder variant', () => {
      render(<EmptyState title="Empty folder" variant="folder" />);
      
      expect(screen.getByText('Empty folder')).toBeInTheDocument();
    });

    it('should render custom icon', () => {
      render(<EmptyState title="No data" icon={Trash2} />);
      
      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('should render action button when provided', () => {
      const handleClick = vi.fn();
      
      render(
        <EmptyState
          title="No projects"
          action={{
            label: 'Create Project',
            onClick: handleClick,
          }}
        />
      );
      
      expect(screen.getByRole('button', { name: /create project/i })).toBeInTheDocument();
    });

    it('should call action onClick when button is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(
        <EmptyState
          title="No data"
          action={{
            label: 'Add Data',
            onClick: handleClick,
          }}
        />
      );
      
      const button = screen.getByRole('button', { name: /add data/i });
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should render action button with icon', () => {
      render(
        <EmptyState
          title="No data"
          action={{
            label: 'Create',
            onClick: vi.fn(),
            icon: Plus,
          }}
        />
      );
      
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('should center content', () => {
      const { container } = render(<EmptyState title="Empty" />);
      
      const content = container.querySelector('.text-center');
      expect(content).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ErrorState Component
  // ============================================================================

  describe('ErrorState', () => {
    it('should render error message', () => {
      render(<ErrorState message="Network error occurred" />);
      
      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
    });

    it('should render default title', () => {
      render(<ErrorState message="Error" />);
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should render custom title', () => {
      render(<ErrorState title="Custom Error" message="Error details" />);
      
      expect(screen.getByText('Custom Error')).toBeInTheDocument();
      expect(screen.getByText('Error details')).toBeInTheDocument();
    });

    it('should render error icon by default', () => {
      const { container } = render(<ErrorState message="Error" />);
      
      const iconWrapper = container.querySelector('.bg-red-100');
      expect(iconWrapper).toBeInTheDocument();
    });

    it('should hide icon when showIcon is false', () => {
      const { container } = render(<ErrorState message="Error" showIcon={false} />);
      
      const iconWrapper = container.querySelector('.bg-red-100');
      expect(iconWrapper).not.toBeInTheDocument();
    });

    it('should render action button when provided', () => {
      render(
        <ErrorState
          message="Error"
          action={{
            label: 'Retry',
            onClick: vi.fn(),
          }}
        />
      );
      
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should call action onClick when button is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(
        <ErrorState
          message="Error"
          action={{
            label: 'Try Again',
            onClick: handleClick,
          }}
        />
      );
      
      const button = screen.getByRole('button', { name: /try again/i });
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should have red styling', () => {
      const { container } = render(<ErrorState message="Error" />);
      
      const card = container.querySelector('.border-red-200');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('bg-red-50');
    });

    it('should center content', () => {
      const { container } = render(<ErrorState message="Error" />);
      
      const content = container.querySelector('.text-center');
      expect(content).toBeInTheDocument();
    });
  });

  // ============================================================================
  // TableLoadingSkeleton Component
  // ============================================================================

  describe('TableLoadingSkeleton', () => {
    it('should render default 5 rows and 4 columns', () => {
      const { container } = render(<TableLoadingSkeleton />);
      
      const rows = container.querySelectorAll('.grid');
      // 1 header + 5 data rows = 6 total
      expect(rows).toHaveLength(6);
    });

    it('should render custom number of rows', () => {
      const { container } = render(<TableLoadingSkeleton rows={10} />);
      
      const rows = container.querySelectorAll('.grid');
      // 1 header + 10 data rows = 11 total
      expect(rows).toHaveLength(11);
    });

    it('should render custom number of columns', () => {
      const { container } = render(<TableLoadingSkeleton columns={6} />);
      
      const firstRow = container.querySelector('.grid');
      const cells = firstRow?.querySelectorAll('.animate-pulse');
      expect(cells).toHaveLength(6);
    });

    it('should have darker header skeleton', () => {
      const { container } = render(<TableLoadingSkeleton />);
      
      const headerRow = container.querySelector('.grid');
      const headerCells = headerRow?.querySelectorAll('.bg-gray-300');
      expect(headerCells?.length).toBeGreaterThan(0);
    });

    it('should have lighter data row skeletons', () => {
      const { container } = render(<TableLoadingSkeleton />);
      
      const allRows = container.querySelectorAll('.grid');
      const dataRow = allRows[1]; // Second row (first data row)
      const dataCells = dataRow?.querySelectorAll('.bg-gray-200');
      expect(dataCells?.length).toBeGreaterThan(0);
    });

    it('should animate all cells', () => {
      const { container } = render(<TableLoadingSkeleton rows={2} columns={3} />);
      
      const animatedCells = container.querySelectorAll('.animate-pulse');
      // (2 rows + 1 header) * 3 columns = 9 cells
      expect(animatedCells).toHaveLength(9);
    });
  });

  // ============================================================================
  // CardLoadingSkeleton Component
  // ============================================================================

  describe('CardLoadingSkeleton', () => {
    it('should render 3 cards by default', () => {
      const { container } = render(<CardLoadingSkeleton />);
      
      const cards = container.querySelectorAll('.p-6');
      expect(cards).toHaveLength(3);
    });

    it('should render custom number of cards', () => {
      const { container } = render(<CardLoadingSkeleton count={6} />);
      
      const cards = container.querySelectorAll('.p-6');
      expect(cards).toHaveLength(6);
    });

    it('should use grid layout', () => {
      const { container } = render(<CardLoadingSkeleton />);
      
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('should have skeleton lines in each card', () => {
      const { container } = render(<CardLoadingSkeleton count={1} />);
      
      const card = container.querySelector('.p-6');
      const skeletonLines = card?.querySelectorAll('.animate-pulse');
      expect(skeletonLines).toHaveLength(3);
    });

    it('should have varying widths for skeleton lines', () => {
      const { container } = render(<CardLoadingSkeleton count={1} />);
      
      const card = container.querySelector('.p-6');
      const lines = card?.querySelectorAll('.animate-pulse');
      
      expect(lines?.[0]).toHaveClass('w-3/4');
      expect(lines?.[1]).toHaveClass('w-full');
      expect(lines?.[2]).toHaveClass('w-5/6');
    });
  });

  // ============================================================================
  // ListLoadingSkeleton Component
  // ============================================================================

  describe('ListLoadingSkeleton', () => {
    it('should render 5 items by default', () => {
      const { container } = render(<ListLoadingSkeleton />);
      
      const items = container.querySelectorAll('.p-4');
      expect(items).toHaveLength(5);
    });

    it('should render custom number of items', () => {
      const { container } = render(<ListLoadingSkeleton count={8} />);
      
      const items = container.querySelectorAll('.p-4');
      expect(items).toHaveLength(8);
    });

    it('should have avatar skeleton in each item', () => {
      const { container } = render(<ListLoadingSkeleton count={1} />);
      
      const avatar = container.querySelector('.w-12.h-12.rounded-full');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass('animate-pulse');
    });

    it('should have text skeletons in each item', () => {
      const { container } = render(<ListLoadingSkeleton count={1} />);
      
      const item = container.querySelector('.p-4');
      const textLines = item?.querySelectorAll('.flex-1 .animate-pulse');
      expect(textLines).toHaveLength(2);
    });

    it('should use flex layout for items', () => {
      const { container } = render(<ListLoadingSkeleton count={1} />);
      
      const itemContent = container.querySelector('.flex.items-center');
      expect(itemContent).toBeInTheDocument();
    });

    it('should have varying widths for text lines', () => {
      const { container } = render(<ListLoadingSkeleton count={1} />);
      
      const textContainer = container.querySelector('.flex-1');
      const lines = textContainer?.querySelectorAll('.animate-pulse');
      
      expect(lines?.[0]).toHaveClass('w-1/3');
      expect(lines?.[1]).toHaveClass('w-2/3');
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration', () => {
    it('should render multiple state components together', () => {
      const { rerender } = render(<LoadingState />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      rerender(<EmptyState title="No data" />);
      expect(screen.getByText('No data')).toBeInTheDocument();
      
      rerender(<ErrorState message="Error occurred" />);
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
    });

    it('should switch between loading and content states', () => {
      const { rerender, container } = render(<CardLoadingSkeleton count={3} />);
      
      let skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
      
      rerender(<EmptyState title="Data loaded" />);
      skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(0);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle zero count for skeletons', () => {
      const { container } = render(<CardLoadingSkeleton count={0} />);
      
      const cards = container.querySelectorAll('.p-6');
      expect(cards).toHaveLength(0);
    });

    it('should handle very long error messages', () => {
      const longMessage = 'Error message '.repeat(50);
      render(<ErrorState message={longMessage} />);
      
      // Use partial text match for long strings
      expect(screen.getByText(/error message/i)).toBeInTheDocument();
    });

    it('should handle empty title in EmptyState', () => {
      render(<EmptyState title="" />);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toBe('');
    });

    it('should handle large skeleton counts', () => {
      const { container } = render(<SkeletonLoader count={100} />);
      
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(100);
    });
  });
});
