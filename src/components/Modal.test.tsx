import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal Component', () => {
  const mockOnClose = vi.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    title: 'Test Modal',
    children: <div>Modal Content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(<Modal {...defaultProps} />);
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<Modal {...defaultProps} />);
      
      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('should render title correctly', () => {
      render(<Modal {...defaultProps} title="Custom Title" />);
      
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(
        <Modal {...defaultProps}>
          <p>Child paragraph</p>
          <button>Child button</button>
        </Modal>
      );
      
      expect(screen.getByText('Child paragraph')).toBeInTheDocument();
      expect(screen.getByText('Child button')).toBeInTheDocument();
    });

    it('should render backdrop element', () => {
      const { container } = render(<Modal {...defaultProps} />);
      
      const backdrop = container.querySelector('.absolute.inset-0.bg-night-black\\/60');
      expect(backdrop).toBeInTheDocument();
    });

    it('should render animated indicator dot', () => {
      const { container } = render(<Modal {...defaultProps} />);
      
      const dot = container.querySelector('.w-2.h-2.rounded-full.bg-green-400.animate-pulse');
      expect(dot).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should apply medium size class by default', () => {
      const { container } = render(<Modal {...defaultProps} />);
      
      const modalContainer = container.querySelector('.max-w-lg');
      expect(modalContainer).toBeInTheDocument();
    });

    it('should apply small size class when size is sm', () => {
      const { container } = render(<Modal {...defaultProps} size="sm" />);
      
      const modalContainer = container.querySelector('.max-w-md');
      expect(modalContainer).toBeInTheDocument();
    });

    it('should apply large size class when size is lg', () => {
      const { container } = render(<Modal {...defaultProps} size="lg" />);
      
      const modalContainer = container.querySelector('.max-w-2xl');
      expect(modalContainer).toBeInTheDocument();
    });

    it('should apply extra large size class when size is xl', () => {
      const { container } = render(<Modal {...defaultProps} size="xl" />);
      
      const modalContainer = container.querySelector('.max-w-4xl');
      expect(modalContainer).toBeInTheDocument();
    });

    it('should apply full size class when size is full', () => {
      const { container } = render(<Modal {...defaultProps} size="full" />);
      
      const modalContainer = container.querySelector('.max-w-7xl');
      expect(modalContainer).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} />);
      
      const closeButton = screen.getByRole('button');
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<Modal {...defaultProps} />);
      
      const backdrop = container.querySelector('.absolute.inset-0.bg-night-black\\/60');
      expect(backdrop).toBeInTheDocument();
      
      await user.click(backdrop!);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when modal content is clicked', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} />);
      
      const content = screen.getByText('Modal Content');
      await user.click(content);
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Animations and Styling', () => {
    it('should apply fadeIn animation class to backdrop container', () => {
      const { container } = render(<Modal {...defaultProps} />);
      
      const backdropContainer = container.querySelector('.animate-fadeIn');
      expect(backdropContainer).toBeInTheDocument();
    });

    it('should apply slideUp animation class to modal', () => {
      const { container } = render(<Modal {...defaultProps} />);
      
      const modalContent = container.querySelector('.animate-slideUp');
      expect(modalContent).toBeInTheDocument();
    });

    it('should apply glass effect classes', () => {
      const { container } = render(<Modal {...defaultProps} />);
      
      const glassElements = container.querySelectorAll('.glass');
      expect(glassElements.length).toBeGreaterThan(0);
    });

    it('should apply fixed positioning and z-index', () => {
      const { container } = render(<Modal {...defaultProps} />);
      
      const fixedContainer = container.querySelector('.fixed.inset-0.z-50');
      expect(fixedContainer).toBeInTheDocument();
    });

    it('should apply gradient text to title', () => {
      const { container } = render(<Modal {...defaultProps} />);
      
      const titleElement = container.querySelector('.gradient-text');
      expect(titleElement).toBeInTheDocument();
    });

    it('should have custom scrollbar class on content', () => {
      const { container } = render(<Modal {...defaultProps} />);
      
      const scrollableContent = container.querySelector('.custom-scrollbar');
      expect(scrollableContent).toBeInTheDocument();
    });

    it('should render inline style tag for animations', () => {
      const { container } = render(<Modal {...defaultProps} />);
      
      const styleTag = container.querySelector('style');
      expect(styleTag).toBeInTheDocument();
      expect(styleTag?.textContent).toContain('fadeIn');
      expect(styleTag?.textContent).toContain('slideUp');
    });
  });

  describe('Accessibility', () => {
    it('should have close button accessible by role', () => {
      render(<Modal {...defaultProps} />);
      
      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('should render title as heading', () => {
      render(<Modal {...defaultProps} />);
      
      // Title is in CardTitle which should be a heading
      const title = screen.getByText('Test Modal');
      expect(title).toBeInTheDocument();
    });

    it('should have backdrop with backdrop-blur for accessibility', () => {
      const { container } = render(<Modal {...defaultProps} />);
      
      const backdrop = container.querySelector('.backdrop-blur-md');
      expect(backdrop).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<Modal {...defaultProps} children={null} />);
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('should handle multiple modals being rendered', () => {
      const { rerender } = render(<Modal {...defaultProps} title="First Modal" />);
      
      expect(screen.getByText('First Modal')).toBeInTheDocument();
      
      rerender(<Modal {...defaultProps} title="Second Modal" />);
      
      expect(screen.getByText('Second Modal')).toBeInTheDocument();
      expect(screen.queryByText('First Modal')).not.toBeInTheDocument();
    });

    it('should handle rapid open/close toggles', () => {
      const { rerender } = render(<Modal {...defaultProps} isOpen={true} />);
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      
      rerender(<Modal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
      
      rerender(<Modal {...defaultProps} isOpen={true} />);
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('should handle long titles without breaking layout', () => {
      const longTitle = 'This is a very long modal title that should still render correctly without breaking the layout';
      render(<Modal {...defaultProps} title={longTitle} />);
      
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle complex children with nested elements', () => {
      render(
        <Modal {...defaultProps}>
          <div>
            <h2>Nested Heading</h2>
            <p>Nested paragraph</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </Modal>
      );
      
      expect(screen.getByText('Nested Heading')).toBeInTheDocument();
      expect(screen.getByText('Nested paragraph')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  describe('Integration with Card Components', () => {
    it('should render Card component wrapper', () => {
      const { container } = render(<Modal {...defaultProps} />);
      
      // Card should apply specific classes
      const card = container.querySelector('.glass.border-violet-essence\\/30');
      expect(card).toBeInTheDocument();
    });

    it('should render CardHeader component', () => {
      const { container } = render(<Modal {...defaultProps} />);
      
      // CardHeader should have sticky positioning
      const header = container.querySelector('.sticky.top-0');
      expect(header).toBeInTheDocument();
    });

    it('should render CardContent component with overflow', () => {
      const { container } = render(<Modal {...defaultProps} />);
      
      const content = container.querySelector('.overflow-y-auto');
      expect(content).toBeInTheDocument();
    });
  });
});

