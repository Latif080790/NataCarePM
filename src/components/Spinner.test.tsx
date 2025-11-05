  import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner Component', () => {
  describe('Rendering', () => {
    it('should render spinner element', () => {
      render(<Spinner />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('should have loading text for screen readers', () => {
      render(<Spinner />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should have sr-only class on loading text', () => {
      const { container } = render(<Spinner />);
      
      const srText = container.querySelector('.sr-only');
      expect(srText).toBeInTheDocument();
      expect(srText?.textContent).toBe('Loading...');
    });

    it('should apply animate-spin class', () => {
      const { container } = render(<Spinner />);
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should apply rounded-full class for circular shape', () => {
      const { container } = render(<Spinner />);
      
      const spinner = container.querySelector('.rounded-full');
      expect(spinner).toBeInTheDocument();
    });

    it('should apply border styles', () => {
      const { container } = render(<Spinner />);
      
      const spinner = container.querySelector('.border-4.border-solid');
      expect(spinner).toBeInTheDocument();
    });

    it('should apply persimmon border color', () => {
      const { container } = render(<Spinner />);
      
      const spinner = container.querySelector('.border-persimmon');
      expect(spinner).toBeInTheDocument();
    });

    it('should apply transparent top border', () => {
      const { container } = render(<Spinner />);
      
      const spinner = container.querySelector('.border-t-transparent');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should apply medium size by default', () => {
      const { container } = render(<Spinner />);
      
      const spinner = container.querySelector('.h-8.w-8');
      expect(spinner).toBeInTheDocument();
    });

    it('should apply small size when size is sm', () => {
      const { container } = render(<Spinner size="sm" />);
      
      const spinner = container.querySelector('.h-5.w-5');
      expect(spinner).toBeInTheDocument();
    });

    it('should apply medium size when size is md', () => {
      const { container } = render(<Spinner size="md" />);
      
      const spinner = container.querySelector('.h-8.w-8');
      expect(spinner).toBeInTheDocument();
    });

    it('should apply large size when size is lg', () => {
      const { container } = render(<Spinner size="lg" />);
      
      const spinner = container.querySelector('.h-12.w-12');
      expect(spinner).toBeInTheDocument();
    });

    it('should not have small size classes when md is used', () => {
      const { container } = render(<Spinner size="md" />);
      
      const spinner = container.querySelector('.h-5.w-5');
      expect(spinner).not.toBeInTheDocument();
    });

    it('should not have large size classes when sm is used', () => {
      const { container } = render(<Spinner size="sm" />);
      
      const spinner = container.querySelector('.h-12.w-12');
      expect(spinner).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="status" for ARIA', () => {
      render(<Spinner />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('should have screen reader only text', () => {
      render(<Spinner />);
      
      // Screen reader text should be in the document
      const loadingText = screen.getByText('Loading...');
      expect(loadingText).toBeInTheDocument();
    });

    it('should hide loading text visually but keep for screen readers', () => {
      const { container } = render(<Spinner />);
      
      const srText = container.querySelector('.sr-only');
      expect(srText).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('should have all required classes for spinning animation', () => {
      const { container } = render(<Spinner />);
      
      const spinner = screen.getByRole('status');
      const classes = spinner.className;
      
      expect(classes).toContain('animate-spin');
      expect(classes).toContain('rounded-full');
      expect(classes).toContain('border-4');
      expect(classes).toContain('border-solid');
      expect(classes).toContain('border-persimmon');
      expect(classes).toContain('border-t-transparent');
    });

    it('should combine size classes with other styling classes', () => {
      const { container } = render(<Spinner size="lg" />);
      
      const spinner = screen.getByRole('status');
      const classes = spinner.className;
      
      expect(classes).toContain('h-12');
      expect(classes).toContain('w-12');
      expect(classes).toContain('animate-spin');
    });
  });

  describe('Multiple Instances', () => {
    it('should render multiple spinners with different sizes', () => {
      render(
        <>
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </>
      );
      
      const spinners = screen.getAllByRole('status');
      expect(spinners).toHaveLength(3);
    });

    it('should render multiple spinners independently', () => {
      render(
        <>
          <Spinner />
          <Spinner />
        </>
      );
      
      const spinners = screen.getAllByRole('status');
      expect(spinners).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined size prop gracefully', () => {
      const { container } = render(<Spinner size={undefined as any} />);
      
      // Should default to medium
      const spinner = container.querySelector('.h-8.w-8');
      expect(spinner).toBeInTheDocument();
    });

    it('should render consistently across re-renders', () => {
      const { container, rerender } = render(<Spinner size="sm" />);
      
      expect(container.querySelector('.h-5.w-5')).toBeInTheDocument();
      
      rerender(<Spinner size="lg" />);
      
      expect(container.querySelector('.h-12.w-12')).toBeInTheDocument();
      expect(container.querySelector('.h-5.w-5')).not.toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should work within a parent container', () => {
      render(
        <div className="flex justify-center items-center">
          <Spinner />
        </div>
      );
      
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('should work with custom wrapper classes', () => {
      render(
        <div data-testid="wrapper">
          <Spinner size="sm" />
        </div>
      );
      
      const wrapper = screen.getByTestId('wrapper');
      expect(wrapper).toBeInTheDocument();
      
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('should maintain structure with siblings', () => {
      render(
        <div>
          <p>Loading data...</p>
          <Spinner />
          <p>Please wait</p>
        </div>
      );
      
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Please wait')).toBeInTheDocument();
    });
  });
});
