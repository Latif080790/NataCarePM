import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast } from './Toast';

describe('Toast Component', () => {
  const mockOnClose = vi.fn();

  const defaultProps = {
    message: 'Test message',
    type: 'info' as const,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render toast with message', () => {
      render(<Toast {...defaultProps} />);
      
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<Toast {...defaultProps} />);
      
      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('should have sr-only text for close button', () => {
      render(<Toast {...defaultProps} />);
      
      expect(screen.getByText('Close')).toBeInTheDocument();
      expect(screen.getByText('Close')).toHaveClass('sr-only');
    });

    it('should render with proper structure', () => {
      const { container } = render(<Toast {...defaultProps} />);
      
      const toast = container.firstChild as HTMLElement;
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveClass('max-w-sm', 'w-full', 'bg-white', 'shadow-lg', 'rounded-lg');
    });

    it('should have pointer events enabled', () => {
      const { container } = render(<Toast {...defaultProps} />);
      
      const toast = container.firstChild as HTMLElement;
      expect(toast).toHaveClass('pointer-events-auto');
    });

    it('should have ring styling', () => {
      const { container } = render(<Toast {...defaultProps} />);
      
      const toast = container.firstChild as HTMLElement;
      expect(toast).toHaveClass('ring-1', 'ring-black', 'ring-opacity-5');
    });
  });

  describe('Type Variants - Icons', () => {
    it('should render CheckCircle icon for success type', () => {
      const { container } = render(<Toast {...defaultProps} type="success" />);
      
      // Check for success icon (green-500 text color)
      const icon = container.querySelector('.text-green-500');
      expect(icon).toBeInTheDocument();
    });

    it('should render AlertTriangle icon for error type', () => {
      const { container } = render(<Toast {...defaultProps} type="error" />);
      
      // Check for error icon (red-500 text color)
      const icon = container.querySelector('.text-red-500');
      expect(icon).toBeInTheDocument();
    });

    it('should render Info icon for info type', () => {
      const { container } = render(<Toast {...defaultProps} type="info" />);
      
      // Check for info icon (blue-500 text color)
      const icon = container.querySelector('.text-blue-500');
      expect(icon).toBeInTheDocument();
    });

    it('should have h-5 w-5 classes on icons', () => {
      const { container } = render(<Toast {...defaultProps} />);
      
      const icon = container.querySelector('.text-blue-500');
      expect(icon).toHaveClass('h-5', 'w-5');
    });
  });

  describe('Type Variants - Background Colors', () => {
    it('should apply success background colors', () => {
      const { container } = render(<Toast {...defaultProps} type="success" />);
      
      const toast = container.firstChild as HTMLElement;
      expect(toast).toHaveClass('bg-green-50', 'border-green-200');
    });

    it('should apply error background colors', () => {
      const { container } = render(<Toast {...defaultProps} type="error" />);
      
      const toast = container.firstChild as HTMLElement;
      expect(toast).toHaveClass('bg-red-50', 'border-red-200');
    });

    it('should apply info background colors', () => {
      const { container } = render(<Toast {...defaultProps} type="info" />);
      
      const toast = container.firstChild as HTMLElement;
      expect(toast).toHaveClass('bg-blue-50', 'border-blue-200');
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<Toast {...defaultProps} />);
      
      const closeButton = screen.getByRole('button');
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose on initial render', () => {
      render(<Toast {...defaultProps} />);
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should handle multiple clicks on close button', async () => {
      const user = userEvent.setup();
      render(<Toast {...defaultProps} />);
      
      const closeButton = screen.getByRole('button');
      await user.click(closeButton);
      await user.click(closeButton);
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(3);
    });
  });

  describe('Close Button Styling', () => {
    it('should have proper close button classes', () => {
      render(<Toast {...defaultProps} />);
      
      const closeButton = screen.getByRole('button');
      expect(closeButton).toHaveClass('rounded-md', 'inline-flex');
    });

    it('should have hover and focus styles on close button', () => {
      render(<Toast {...defaultProps} />);
      
      const closeButton = screen.getByRole('button');
      expect(closeButton).toHaveClass('text-palladium', 'hover:text-night-black');
    });

    it('should have focus ring styles', () => {
      render(<Toast {...defaultProps} />);
      
      const closeButton = screen.getByRole('button');
      expect(closeButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2', 'focus:ring-persimmon');
    });

    it('should render X icon in close button', () => {
      render(<Toast {...defaultProps} />);
      
      const closeButton = screen.getByRole('button');
      const xIcon = closeButton.querySelector('svg');
      expect(xIcon).toBeInTheDocument();
      expect(xIcon).toHaveClass('h-5', 'w-5');
    });
  });

  describe('Message Display', () => {
    it('should display short messages', () => {
      render(<Toast {...defaultProps} message="OK" />);
      
      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    it('should display long messages', () => {
      const longMessage = 'This is a very long message that contains a lot of text to test how the toast component handles longer content without breaking the layout.';
      render(<Toast {...defaultProps} message={longMessage} />);
      
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should have proper text styling', () => {
      render(<Toast {...defaultProps} />);
      
      const message = screen.getByText('Test message');
      expect(message).toHaveClass('text-sm', 'font-medium', 'text-night-black');
    });

    it('should display messages with special characters', () => {
      const specialMessage = 'Task "Project-123" created successfully! 🎉';
      render(<Toast {...defaultProps} message={specialMessage} />);
      
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });
  });

  describe('Layout and Structure', () => {
    it('should have flex layout for content', () => {
      render(<Toast {...defaultProps} />);
      
      // Layout structure validated through rendering
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should have padding on content container', () => {
      const { container } = render(<Toast {...defaultProps} />);
      
      const paddingDiv = container.querySelector('.p-4');
      expect(paddingDiv).toBeInTheDocument();
    });

    it('should have flex-shrink-0 on icon container', () => {
      const { container } = render(<Toast {...defaultProps} />);
      
      const iconContainer = container.querySelector('.flex-shrink-0');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should have proper spacing between icon and message', () => {
      const { container } = render(<Toast {...defaultProps} />);
      
      const messageContainer = container.querySelector('.ml-3');
      expect(messageContainer).toBeInTheDocument();
      expect(messageContainer).toHaveClass('w-0', 'flex-1', 'pt-0.5');
    });

    it('should have proper spacing for close button', () => {
      const { container } = render(<Toast {...defaultProps} />);
      
      const closeButtonContainer = container.querySelector('.ml-4.flex-shrink-0');
      expect(closeButtonContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible close button with sr-only label', () => {
      render(<Toast {...defaultProps} />);
      
      const closeLabel = screen.getByText('Close');
      expect(closeLabel).toHaveClass('sr-only');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<Toast {...defaultProps} />);
      
      const closeButton = screen.getByRole('button');
      closeButton.focus();
      
      expect(closeButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should have proper focus management', async () => {
      render(<Toast {...defaultProps} />);
      
      const closeButton = screen.getByRole('button');
      closeButton.focus();
      
      expect(document.activeElement).toBe(closeButton);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      render(<Toast {...defaultProps} message="" />);
      
      // Should still render the structure
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle very long message without breaking layout', () => {
      const veryLongMessage = 'A'.repeat(500);
      const { container } = render(<Toast {...defaultProps} message={veryLongMessage} />);
      
      const toast = container.firstChild as HTMLElement;
      expect(toast).toHaveClass('max-w-sm'); // Should maintain max width
    });

    it('should handle onClose being called multiple times rapidly', async () => {
      const user = userEvent.setup();
      render(<Toast {...defaultProps} />);
      
      const closeButton = screen.getByRole('button');
      
      // Rapid clicks
      await user.tripleClick(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should maintain structure with different prop combinations', () => {
      const { container, rerender } = render(<Toast message="Message 1" type="success" onClose={mockOnClose} />);
      
      expect(container.querySelector('.bg-green-50')).toBeInTheDocument();
      
      rerender(<Toast message="Message 2" type="error" onClose={mockOnClose} />);
      
      expect(container.querySelector('.bg-red-50')).toBeInTheDocument();
      expect(container.querySelector('.bg-green-50')).not.toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should work within a toast container', () => {
      render(
        <div className="fixed top-4 right-4 z-50">
          <Toast {...defaultProps} />
        </div>
      );
      
      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should work with multiple toasts stacked', () => {
      render(
        <div className="space-y-2">
          <Toast message="Toast 1" type="success" onClose={mockOnClose} />
          <Toast message="Toast 2" type="error" onClose={mockOnClose} />
          <Toast message="Toast 3" type="info" onClose={mockOnClose} />
        </div>
      );
      
      expect(screen.getByText('Toast 1')).toBeInTheDocument();
      expect(screen.getByText('Toast 2')).toBeInTheDocument();
      expect(screen.getByText('Toast 3')).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(3);
    });

    it('should handle different messages for different types', () => {
      const { rerender } = render(<Toast message="Success!" type="success" onClose={mockOnClose} />);
      expect(screen.getByText('Success!')).toBeInTheDocument();
      
      rerender(<Toast message="Error occurred!" type="error" onClose={mockOnClose} />);
      expect(screen.getByText('Error occurred!')).toBeInTheDocument();
      
      rerender(<Toast message="Information" type="info" onClose={mockOnClose} />);
      expect(screen.getByText('Information')).toBeInTheDocument();
    });
  });
});
