import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress } from './Progress';

describe('Progress Component', () => {
  describe('Rendering', () => {
    it('should render progress bar', () => {
      const { container } = render(<Progress value={50} />);
      
      const progressBar = container.querySelector('.bg-violet-essence\\/50');
      expect(progressBar).toBeInTheDocument();
    });

    it('should render with default structure', () => {
      const { container } = render(<Progress value={50} />);
      
      const progressContainer = container.firstChild as HTMLElement;
      expect(progressContainer).toBeInTheDocument();
      expect(progressContainer).toHaveClass('relative', 'h-2', 'w-full', 'overflow-hidden', 'rounded-full');
    });

    it('should render inner progress indicator', () => {
      const { container } = render(<Progress value={50} />);
      
      const indicator = container.querySelector('.bg-persimmon');
      expect(indicator).toBeInTheDocument();
    });

    it('should have transition classes on indicator', () => {
      const { container } = render(<Progress value={50} />);
      
      const indicator = container.querySelector('.bg-persimmon');
      expect(indicator).toHaveClass('h-full', 'w-full', 'flex-1', 'transition-all');
    });
  });

  describe('Value Handling', () => {
    it('should render with 0% progress', () => {
      const { container } = render(<Progress value={0} />);
      
      const indicator = container.querySelector('.bg-persimmon') as HTMLElement;
      expect(indicator).toBeInTheDocument();
      expect(indicator.style.transform).toBe('translateX(-100%)');
    });

    it('should render with 50% progress', () => {
      const { container } = render(<Progress value={50} />);
      
      const indicator = container.querySelector('.bg-persimmon') as HTMLElement;
      expect(indicator.style.transform).toBe('translateX(-50%)');
    });

    it('should render with 100% progress', () => {
      const { container } = render(<Progress value={100} />);
      
      const indicator = container.querySelector('.bg-persimmon') as HTMLElement;
      expect(indicator.style.transform).toBe('translateX(-0%)');
    });

    it('should render with 25% progress', () => {
      const { container } = render(<Progress value={25} />);
      
      const indicator = container.querySelector('.bg-persimmon') as HTMLElement;
      expect(indicator.style.transform).toBe('translateX(-75%)');
    });

    it('should render with 75% progress', () => {
      const { container } = render(<Progress value={75} />);
      
      const indicator = container.querySelector('.bg-persimmon') as HTMLElement;
      expect(indicator.style.transform).toBe('translateX(-25%)');
    });
  });

  describe('Value Normalization', () => {
    it('should clamp negative values to 0', () => {
      const { container } = render(<Progress value={-10} />);
      
      const indicator = container.querySelector('.bg-persimmon') as HTMLElement;
      expect(indicator.style.transform).toBe('translateX(-100%)');
    });

    it('should clamp values above 100 to 100', () => {
      const { container } = render(<Progress value={150} />);
      
      const indicator = container.querySelector('.bg-persimmon') as HTMLElement;
      expect(indicator.style.transform).toBe('translateX(-0%)');
    });

    it('should handle very large values', () => {
      const { container } = render(<Progress value={9999} />);
      
      const indicator = container.querySelector('.bg-persimmon') as HTMLElement;
      expect(indicator.style.transform).toBe('translateX(-0%)');
    });

    it('should handle very negative values', () => {
      const { container } = render(<Progress value={-9999} />);
      
      const indicator = container.querySelector('.bg-persimmon') as HTMLElement;
      expect(indicator.style.transform).toBe('translateX(-100%)');
    });

    it('should handle decimal values', () => {
      const { container } = render(<Progress value={33.33} />);
      
      const indicator = container.querySelector('.bg-persimmon') as HTMLElement;
      expect(indicator.style.transform).toBe('translateX(-66.67%)');
    });

    it('should handle zero explicitly', () => {
      const { container } = render(<Progress value={0} />);
      
      const indicator = container.querySelector('.bg-persimmon') as HTMLElement;
      expect(indicator.style.transform).toBe('translateX(-100%)');
    });
  });

  describe('Custom ClassName', () => {
    it('should accept custom className', () => {
      const { container } = render(<Progress value={50} className="custom-class" />);
      
      const progressContainer = container.firstChild as HTMLElement;
      expect(progressContainer).toHaveClass('custom-class');
    });

    it('should merge custom className with default classes', () => {
      const { container } = render(<Progress value={50} className="h-4 bg-blue-500" />);
      
      const progressContainer = container.firstChild as HTMLElement;
      expect(progressContainer).toHaveClass('h-4', 'bg-blue-500');
      expect(progressContainer).toHaveClass('relative', 'w-full', 'overflow-hidden', 'rounded-full');
    });

    it('should work without custom className', () => {
      const { container } = render(<Progress value={50} />);
      
      const progressContainer = container.firstChild as HTMLElement;
      expect(progressContainer).toHaveClass('relative', 'h-2', 'w-full');
    });
  });

  describe('HTML Attributes', () => {
    it('should accept data attributes', () => {
      render(<Progress value={50} data-testid="progress-bar" />);
      
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    });

    it('should accept aria attributes', () => {
      render(
        <Progress value={50} aria-label="Upload progress" role="progressbar" />
      );
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-label', 'Upload progress');
    });

    it('should accept id attribute', () => {
      const { container } = render(<Progress value={50} id="my-progress" />);
      
      const progressBar = container.querySelector('#my-progress');
      expect(progressBar).toBeInTheDocument();
    });

    it('should spread rest props', () => {
      const { container } = render(
        <Progress value={50} data-custom="value" title="Progress: 50%" />
      );
      
      const progressContainer = container.firstChild as HTMLElement;
      expect(progressContainer).toHaveAttribute('data-custom', 'value');
      expect(progressContainer).toHaveAttribute('title', 'Progress: 50%');
    });
  });

  describe('Styling', () => {
    it('should have background color on container', () => {
      const { container } = render(<Progress value={50} />);
      
      const progressContainer = container.firstChild as HTMLElement;
      expect(progressContainer).toHaveClass('bg-violet-essence/50');
    });

    it('should have persimmon color on indicator', () => {
      const { container } = render(<Progress value={50} />);
      
      const indicator = container.querySelector('.bg-persimmon');
      expect(indicator).toBeInTheDocument();
    });

    it('should have rounded-full class', () => {
      const { container } = render(<Progress value={50} />);
      
      const progressContainer = container.firstChild as HTMLElement;
      expect(progressContainer).toHaveClass('rounded-full');
    });

    it('should have overflow-hidden class', () => {
      const { container } = render(<Progress value={50} />);
      
      const progressContainer = container.firstChild as HTMLElement;
      expect(progressContainer).toHaveClass('overflow-hidden');
    });

    it('should have default height of h-2', () => {
      const { container } = render(<Progress value={50} />);
      
      const progressContainer = container.firstChild as HTMLElement;
      expect(progressContainer).toHaveClass('h-2');
    });

    it('should have full width', () => {
      const { container } = render(<Progress value={50} />);
      
      const progressContainer = container.firstChild as HTMLElement;
      expect(progressContainer).toHaveClass('w-full');
    });
  });

  describe('Dynamic Updates', () => {
    it('should update transform when value changes', () => {
      const { container, rerender } = render(<Progress value={0} />);
      
      let indicator = container.querySelector('.bg-persimmon') as HTMLElement;
      expect(indicator.style.transform).toBe('translateX(-100%)');
      
      rerender(<Progress value={50} />);
      indicator = container.querySelector('.bg-persimmon') as HTMLElement;
      expect(indicator.style.transform).toBe('translateX(-50%)');
      
      rerender(<Progress value={100} />);
      indicator = container.querySelector('.bg-persimmon') as HTMLElement;
      expect(indicator.style.transform).toBe('translateX(-0%)');
    });

    it('should handle rapid value changes', () => {
      const { container, rerender } = render(<Progress value={10} />);
      
      for (let i = 20; i <= 100; i += 10) {
        rerender(<Progress value={i} />);
        const indicator = container.querySelector('.bg-persimmon') as HTMLElement;
        expect(indicator.style.transform).toBe(`translateX(-${100 - i}%)`);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined value as 0', () => {
      const { container } = render(<Progress value={undefined as any} />);
      
      const indicator = container.querySelector('.bg-persimmon') as HTMLElement;
      expect(indicator.style.transform).toBe('translateX(-100%)');
    });

    it('should handle null value as 0', () => {
      const { container } = render(<Progress value={null as any} />);
      
      const indicator = container.querySelector('.bg-persimmon') as HTMLElement;
      expect(indicator.style.transform).toBe('translateX(-100%)');
    });

    it('should handle NaN value as 0', () => {
      const { container } = render(<Progress value={NaN} />);
      
      const indicator = container.querySelector('.bg-persimmon') as HTMLElement;
      expect(indicator.style.transform).toBe('translateX(-100%)');
    });

    it('should handle very small decimal values', () => {
      const { container } = render(<Progress value={0.01} />);
      
      const indicator = container.querySelector('.bg-persimmon') as HTMLElement;
      expect(indicator.style.transform).toBe('translateX(-99.99%)');
    });

    it('should handle values close to 100', () => {
      const { container } = render(<Progress value={99.99} />);
      
      const indicator = container.querySelector('.bg-persimmon') as HTMLElement;
      expect(indicator.style.transform).toBe('translateX(-0.010000000000005116%)');
    });
  });

  describe('Integration', () => {
    it('should work within a parent container', () => {
      const { container } = render(
        <div className="w-64">
          <Progress value={50} />
        </div>
      );
      
      const progressBar = container.querySelector('.bg-violet-essence\\/50');
      expect(progressBar).toBeInTheDocument();
    });

    it('should work with label', () => {
      render(
        <div>
          <label htmlFor="file-progress">Upload Progress</label>
          <Progress value={75} id="file-progress" aria-label="Upload progress" />
        </div>
      );
      
      expect(screen.getByText('Upload Progress')).toBeInTheDocument();
      expect(screen.getByLabelText('Upload progress')).toBeInTheDocument();
    });

    it('should work with multiple progress bars', () => {
      const { container } = render(
        <div className="space-y-2">
          <Progress value={25} />
          <Progress value={50} />
          <Progress value={75} />
        </div>
      );
      
      const progressBars = container.querySelectorAll('.bg-persimmon');
      expect(progressBars).toHaveLength(3);
    });

    it('should work with percentage text', () => {
      render(
        <div>
          <Progress value={60} />
          <span>60%</span>
        </div>
      );
      
      expect(screen.getByText('60%')).toBeInTheDocument();
    });
  });
});

