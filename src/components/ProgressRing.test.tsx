import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressRing from './ProgressRing';

describe('ProgressRing Component', () => {
  describe('Rendering', () => {
    it('should render progress ring', () => {
      const { container } = render(<ProgressRing progress={50} />);
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render with percentage text by default', () => {
      render(<ProgressRing progress={50} />);
      
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should render two circles (background and progress)', () => {
      const { container } = render(<ProgressRing progress={50} />);
      
      const circles = container.querySelectorAll('circle');
      expect(circles).toHaveLength(2);
    });

    it('should render with gradient definition', () => {
      const { container } = render(<ProgressRing progress={50} />);
      
      const gradient = container.querySelector('#primaryGradient');
      expect(gradient).toBeInTheDocument();
    });

    it('should have correct structure', () => {
      const { container } = render(<ProgressRing progress={50} />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('relative', 'inline-flex', 'items-center', 'justify-center');
    });
  });

  describe('Size Variants', () => {
    it('should render small size', () => {
      const { container } = render(<ProgressRing progress={50} size="sm" />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '80');
      expect(svg).toHaveAttribute('height', '80');
    });

    it('should render medium size by default', () => {
      const { container } = render(<ProgressRing progress={50} />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '120');
      expect(svg).toHaveAttribute('height', '120');
    });

    it('should render medium size explicitly', () => {
      const { container } = render(<ProgressRing progress={50} size="md" />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '120');
      expect(svg).toHaveAttribute('height', '120');
    });

    it('should render large size', () => {
      const { container } = render(<ProgressRing progress={50} size="lg" />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '160');
      expect(svg).toHaveAttribute('height', '160');
    });

    it('should apply text-lg for small size', () => {
      render(<ProgressRing progress={50} size="sm" />);
      
      const percentage = screen.getByText('50%');
      expect(percentage).toHaveClass('text-lg');
    });

    it('should apply text-2xl for medium size', () => {
      render(<ProgressRing progress={50} size="md" />);
      
      const percentage = screen.getByText('50%');
      expect(percentage).toHaveClass('text-2xl');
    });

    it('should apply text-3xl for large size', () => {
      render(<ProgressRing progress={50} size="lg" />);
      
      const percentage = screen.getByText('50%');
      expect(percentage).toHaveClass('text-3xl');
    });
  });

  describe('Color Variants', () => {
    it('should use primary gradient by default', () => {
      const { container } = render(<ProgressRing progress={50} />);
      
      const progressCircle = container.querySelectorAll('circle')[1];
      expect(progressCircle).toHaveAttribute('stroke', 'url(#primaryGradient)');
    });

    it('should use success color', () => {
      const { container } = render(<ProgressRing progress={50} color="success" />);
      
      const progressCircle = container.querySelectorAll('circle')[1];
      expect(progressCircle).toHaveAttribute('stroke', '#10b981');
    });

    it('should use warning color', () => {
      const { container } = render(<ProgressRing progress={50} color="warning" />);
      
      const progressCircle = container.querySelectorAll('circle')[1];
      expect(progressCircle).toHaveAttribute('stroke', '#f59e0b');
    });

    it('should use error color', () => {
      const { container } = render(<ProgressRing progress={50} color="error" />);
      
      const progressCircle = container.querySelectorAll('circle')[1];
      expect(progressCircle).toHaveAttribute('stroke', '#ef4444');
    });

    it('should have background circle with same color for all variants', () => {
      const { container } = render(<ProgressRing progress={50} color="success" />);
      
      const backgroundCircle = container.querySelectorAll('circle')[0];
      expect(backgroundCircle).toHaveAttribute('stroke', '#E6E4E6');
    });
  });

  describe('Progress Values', () => {
    it('should display 0% progress', () => {
      render(<ProgressRing progress={0} />);
      
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should display 50% progress', () => {
      render(<ProgressRing progress={50} />);
      
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should display 100% progress', () => {
      render(<ProgressRing progress={100} />);
      
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should round decimal progress values', () => {
      render(<ProgressRing progress={66.6} />);
      
      expect(screen.getByText('67%')).toBeInTheDocument();
    });

    it('should handle small decimal values', () => {
      render(<ProgressRing progress={0.4} />);
      
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle large decimal values', () => {
      render(<ProgressRing progress={99.9} />);
      
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Show Percentage', () => {
    it('should show percentage by default', () => {
      render(<ProgressRing progress={75} />);
      
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should hide percentage when showPercentage is false', () => {
      render(<ProgressRing progress={75} showPercentage={false} />);
      
      expect(screen.queryByText('75%')).not.toBeInTheDocument();
    });

    it('should show children when showPercentage is true', () => {
      render(
        <ProgressRing progress={75} showPercentage={true}>
          <span>Loading...</span>
        </ProgressRing>
      );
      
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show only children when showPercentage is false', () => {
      render(
        <ProgressRing progress={75} showPercentage={false}>
          <span>Custom Content</span>
        </ProgressRing>
      );
      
      expect(screen.queryByText('75%')).not.toBeInTheDocument();
      expect(screen.getByText('Custom Content')).toBeInTheDocument();
    });
  });

  describe('Children Content', () => {
    it('should render children below percentage', () => {
      render(
        <ProgressRing progress={50}>
          <span>Uploading</span>
        </ProgressRing>
      );
      
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('Uploading')).toBeInTheDocument();
    });

    it('should render without children', () => {
      render(<ProgressRing progress={50} />);
      
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should render complex children', () => {
      render(
        <ProgressRing progress={75}>
          <div>
            <span>5 of 10</span>
            <span>files</span>
          </div>
        </ProgressRing>
      );
      
      expect(screen.getByText('5 of 10')).toBeInTheDocument();
      expect(screen.getByText('files')).toBeInTheDocument();
    });

    it('should apply proper styling to children when shown with percentage', () => {
      const { container } = render(
        <ProgressRing progress={50}>
          <span>Loading</span>
        </ProgressRing>
      );
      
      const childrenContainer = container.querySelector('.text-body-small.visual-secondary');
      expect(childrenContainer).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('should accept custom className', () => {
      const { container } = render(<ProgressRing progress={50} className="custom-ring" />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-ring');
    });

    it('should merge custom className with default classes', () => {
      const { container } = render(<ProgressRing progress={50} className="my-4 mx-auto" />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('my-4', 'mx-auto', 'relative', 'inline-flex');
    });

    it('should work without custom className', () => {
      const { container } = render(<ProgressRing progress={50} />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('relative', 'inline-flex');
    });
  });

  describe('Stroke Width', () => {
    it('should use default stroke width', () => {
      const { container } = render(<ProgressRing progress={50} />);
      
      const circles = container.querySelectorAll('circle');
      expect(circles[0]).toHaveAttribute('stroke-width', '8');
      expect(circles[1]).toHaveAttribute('stroke-width', '8');
    });

    it('should accept custom stroke width', () => {
      const { container } = render(<ProgressRing progress={50} strokeWidth={12} />);
      
      const circles = container.querySelectorAll('circle');
      expect(circles[0]).toHaveAttribute('stroke-width', '12');
      expect(circles[1]).toHaveAttribute('stroke-width', '12');
    });

    it('should accept thin stroke width', () => {
      const { container } = render(<ProgressRing progress={50} strokeWidth={4} />);
      
      const circles = container.querySelectorAll('circle');
      expect(circles[0]).toHaveAttribute('stroke-width', '4');
      expect(circles[1]).toHaveAttribute('stroke-width', '4');
    });
  });

  describe('SVG Structure', () => {
    it('should have rotated SVG', () => {
      const { container } = render(<ProgressRing progress={50} />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('transform', '-rotate-90');
    });

    it('should have correct viewBox', () => {
      const { container } = render(<ProgressRing progress={50} size="md" />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 120 120');
    });

    it('should have transparent fill on circles', () => {
      const { container } = render(<ProgressRing progress={50} />);
      
      const circles = container.querySelectorAll('circle');
      expect(circles[0]).toHaveAttribute('fill', 'transparent');
      expect(circles[1]).toHaveAttribute('fill', 'transparent');
    });

    it('should have rounded line caps on progress circle', () => {
      const { container } = render(<ProgressRing progress={50} />);
      
      const progressCircle = container.querySelectorAll('circle')[1];
      expect(progressCircle).toHaveAttribute('stroke-linecap', 'round');
    });

    it('should have opacity on background circle', () => {
      const { container } = render(<ProgressRing progress={50} />);
      
      const backgroundCircle = container.querySelectorAll('circle')[0];
      expect(backgroundCircle).toHaveClass('opacity-20');
    });

    it('should have transition on progress circle', () => {
      const { container } = render(<ProgressRing progress={50} />);
      
      const progressCircle = container.querySelectorAll('circle')[1];
      expect(progressCircle).toHaveClass('transition-all', 'duration-1000', 'ease-out', 'drop-shadow-sm');
    });
  });

  describe('Gradient Definition', () => {
    it('should have linear gradient defined', () => {
      const { container } = render(<ProgressRing progress={50} />);
      
      const gradient = container.querySelector('#primaryGradient');
      expect(gradient).toBeInTheDocument();
      expect(gradient?.tagName.toLowerCase()).toBe('lineargradient');
    });

    it('should have gradient stops', () => {
      const { container } = render(<ProgressRing progress={50} />);
      
      const stops = container.querySelectorAll('stop');
      expect(stops).toHaveLength(2);
    });

    it('should have correct gradient colors', () => {
      const { container } = render(<ProgressRing progress={50} />);
      
      const stops = container.querySelectorAll('stop');
      expect(stops[0]).toHaveAttribute('stop-color', '#F87941');
      expect(stops[1]).toHaveAttribute('stop-color', '#F9B095');
    });
  });

  describe('Center Content Positioning', () => {
    it('should have absolute positioned center content', () => {
      const { container } = render(<ProgressRing progress={50} />);
      
      const centerContent = container.querySelector('.absolute.inset-0');
      expect(centerContent).toBeInTheDocument();
      expect(centerContent).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
    });

    it('should have gradient text on percentage', () => {
      render(<ProgressRing progress={50} />);
      
      const percentage = screen.getByText('50%');
      expect(percentage).toHaveClass('font-bold', 'gradient-text');
    });

    it('should have text-center class on percentage container', () => {
      const { container } = render(<ProgressRing progress={50} />);
      
      const textCenter = container.querySelector('.text-center');
      expect(textCenter).toBeInTheDocument();
    });
  });

  describe('Dynamic Updates', () => {
    it('should update percentage when progress changes', () => {
      const { rerender } = render(<ProgressRing progress={25} />);
      
      expect(screen.getByText('25%')).toBeInTheDocument();
      
      rerender(<ProgressRing progress={75} />);
      
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.queryByText('25%')).not.toBeInTheDocument();
    });

    it('should update circle stroke dash offset when progress changes', () => {
      const { container, rerender } = render(<ProgressRing progress={0} />);
      
      let progressCircle = container.querySelectorAll('circle')[1];
      const initialOffset = progressCircle.getAttribute('stroke-dashoffset');
      
      rerender(<ProgressRing progress={100} />);
      
      progressCircle = container.querySelectorAll('circle')[1];
      const finalOffset = progressCircle.getAttribute('stroke-dashoffset');
      
      expect(initialOffset).not.toBe(finalOffset);
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative progress values', () => {
      render(<ProgressRing progress={-10} />);
      
      expect(screen.getByText('-10%')).toBeInTheDocument();
    });

    it('should handle progress values over 100', () => {
      render(<ProgressRing progress={150} />);
      
      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    it('should handle progress value of 0', () => {
      render(<ProgressRing progress={0} />);
      
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle empty children', () => {
      render(
        <ProgressRing progress={50}>
          {''}
        </ProgressRing>
      );
      
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should work with multiple progress rings', () => {
      render(
        <div className="flex space-x-4">
          <ProgressRing progress={25} size="sm" />
          <ProgressRing progress={50} size="md" />
          <ProgressRing progress={75} size="lg" />
        </div>
      );
      
      expect(screen.getByText('25%')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should work with different colors', () => {
      render(
        <div>
          <ProgressRing progress={30} color="error" />
          <ProgressRing progress={60} color="warning" />
          <ProgressRing progress={90} color="success" />
        </div>
      );
      
      expect(screen.getByText('30%')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByText('90%')).toBeInTheDocument();
    });

    it('should work within a card layout', () => {
      render(
        <div className="card p-4">
          <h3>Upload Progress</h3>
          <ProgressRing progress={65}>
            <span>Uploading files...</span>
          </ProgressRing>
        </div>
      );
      
      expect(screen.getByText('Upload Progress')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
      expect(screen.getByText('Uploading files...')).toBeInTheDocument();
    });
  });
});
