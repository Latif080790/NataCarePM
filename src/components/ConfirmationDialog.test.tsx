/**
 * ConfirmationDialog Component Tests
 * Tests for confirmation dialog with action buttons
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmationDialog from './ConfirmationDialog';

describe('ConfirmationDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Confirm Action',
    description: 'Are you sure you want to proceed?',
  };

  // ============================================================================
  // BASIC RENDERING
  // ============================================================================

  describe('Basic Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<ConfirmationDialog {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
    });

    it('should render with custom title and description', () => {
      render(
        <ConfirmationDialog
          {...defaultProps}
          title="Delete User"
          description="This action cannot be undone"
        />
      );
      
      expect(screen.getByText('Delete User')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone')).toBeInTheDocument();
    });

    it('should render both action buttons', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      
      expect(screen.getByText('Batal')).toBeInTheDocument();
      expect(screen.getByText('Hapus')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // STRUCTURE & STYLING
  // ============================================================================

  describe('Structure & Styling', () => {
    it('should render with backdrop overlay', () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} />);
      
      const backdrop = container.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
      expect(backdrop).toBeInTheDocument();
    });

    it('should render dialog with correct styling', () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} />);
      
      const dialog = container.querySelector('.bg-white.rounded-lg.p-6');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveClass('shadow-xl', 'w-full', 'max-w-md');
    });

    it('should render title with correct styling', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      
      const title = screen.getByText('Confirm Action');
      expect(title.tagName).toBe('H2');
      expect(title).toHaveClass('text-lg', 'font-bold', 'mb-4');
    });

    it('should render description with correct styling', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      
      const description = screen.getByText('Are you sure you want to proceed?');
      expect(description.tagName).toBe('P');
      expect(description).toHaveClass('text-sm', 'text-gray-600', 'mb-6');
    });

    it('should position buttons at the end', () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} />);
      
      const buttonContainer = container.querySelector('.flex.justify-end.gap-4');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  // ============================================================================
  // INTERACTIONS
  // ============================================================================

  describe('Interactions', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      
      render(<ConfirmationDialog {...defaultProps} onClose={onClose} />);
      
      const cancelButton = screen.getByText('Batal');
      await user.click(cancelButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      
      render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);
      
      const confirmButton = screen.getByText('Hapus');
      await user.click(confirmButton);
      
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should not call handlers when buttons are clicked on closed dialog', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onConfirm = vi.fn();
      
      render(
        <ConfirmationDialog
          {...defaultProps}
          isOpen={false}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      );
      
      // Dialog should not render, so buttons should not exist
      expect(screen.queryByText('Batal')).not.toBeInTheDocument();
      expect(screen.queryByText('Hapus')).not.toBeInTheDocument();
      
      expect(onClose).not.toHaveBeenCalled();
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // BUTTON VARIANTS
  // ============================================================================

  describe('Button Variants', () => {
    it('should render cancel button with outline variant', () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} />);
      
      const cancelButton = screen.getByText('Batal').closest('button');
      expect(cancelButton).toBeInTheDocument();
      // ButtonPro with outline variant should be rendered
    });

    it('should render confirm button with primary variant and custom styling', () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} />);
      
      const confirmButton = screen.getByText('Hapus').closest('button');
      expect(confirmButton).toBeInTheDocument();
      expect(confirmButton).toHaveClass('bg-red-600', 'hover:bg-red-700');
    });
  });

  // ============================================================================
  // Z-INDEX & OVERLAY
  // ============================================================================

  describe('Z-Index & Overlay', () => {
    it('should render with high z-index to appear above other content', () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} />);
      
      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toHaveClass('z-50');
    });

    it('should center dialog on screen', () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} />);
      
      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toHaveClass('flex', 'justify-center', 'items-center');
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty title', () => {
      render(<ConfirmationDialog {...defaultProps} title="" />);
      
      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toBeInTheDocument();
      expect(title.textContent).toBe('');
    });

    it('should handle empty description', () => {
      render(<ConfirmationDialog {...defaultProps} description="" />);
      
      const description = screen.getByText('', { selector: 'p' });
      expect(description).toBeInTheDocument();
    });

    it('should handle very long title', () => {
      const longTitle = 'A'.repeat(200);
      render(<ConfirmationDialog {...defaultProps} title={longTitle} />);
      
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle very long description', () => {
      const longDescription = 'This is a very long description. '.repeat(50);
      render(<ConfirmationDialog {...defaultProps} description={longDescription} />);
      
      // Use partial text match for long strings
      expect(screen.getByText(/this is a very long description/i)).toBeInTheDocument();
    });

    it('should handle multiple clicks on confirm button', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      
      render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);
      
      const confirmButton = screen.getByText('Hapus');
      await user.click(confirmButton);
      await user.click(confirmButton);
      await user.click(confirmButton);
      
      expect(onConfirm).toHaveBeenCalledTimes(3);
    });
  });

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  describe('Accessibility', () => {
    it('should render title as h2 heading', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      
      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toHaveTextContent('Confirm Action');
    });

    it('should render buttons as clickable elements', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('should render description as paragraph', () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} />);
      
      const description = container.querySelector('p');
      expect(description).toBeInTheDocument();
      expect(description?.textContent).toBe('Are you sure you want to proceed?');
    });
  });
});
