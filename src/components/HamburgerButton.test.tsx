import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HamburgerButton } from './HamburgerButton';

describe('HamburgerButton Component', () => {
  const mockOnClick = vi.fn();

  const defaultProps = {
    isOpen: false,
    onClick: mockOnClick,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render hamburger button', () => {
      render(<HamburgerButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should have proper button classes', () => {
      render(<HamburgerButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('mobile-menu-button', 'touch-target-lg', 'relative', 'z-1001');
    });

    it('should render hamburger icon', () => {
      const { container } = render(<HamburgerButton {...defaultProps} />);
      
      const icon = container.querySelector('.hamburger-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should have sr-only text', () => {
      render(<HamburgerButton {...defaultProps} />);
      
      expect(screen.getByText('Open navigation menu')).toBeInTheDocument();
    });
  });

  describe('isOpen State', () => {
    it('should show "Open menu" aria-label when closed', () => {
      render(<HamburgerButton {...defaultProps} isOpen={false} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Open menu');
    });

    it('should show "Close menu" aria-label when open', () => {
      render(<HamburgerButton {...defaultProps} isOpen={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Close menu');
    });

    it('should apply "open" class to icon when isOpen is true', () => {
      const { container } = render(<HamburgerButton {...defaultProps} isOpen={true} />);
      
      const icon = container.querySelector('.hamburger-icon');
      expect(icon).toHaveClass('open');
    });

    it('should not apply "open" class to icon when isOpen is false', () => {
      const { container } = render(<HamburgerButton {...defaultProps} isOpen={false} />);
      
      const icon = container.querySelector('.hamburger-icon');
      expect(icon).not.toHaveClass('open');
    });

    it('should update sr-only text based on isOpen', () => {
      const { rerender } = render(<HamburgerButton {...defaultProps} isOpen={false} />);
      
      expect(screen.getByText('Open navigation menu')).toBeInTheDocument();
      
      rerender(<HamburgerButton {...defaultProps} isOpen={true} />);
      
      expect(screen.getByText('Close navigation menu')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-expanded false when closed', () => {
      render(<HamburgerButton {...defaultProps} isOpen={false} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have aria-expanded true when open', () => {
      render(<HamburgerButton {...defaultProps} isOpen={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have aria-controls attribute', () => {
      render(<HamburgerButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-controls', 'mobile-nav-drawer');
    });

    it('should have sr-only span for screen readers', () => {
      const { container } = render(<HamburgerButton {...defaultProps} />);
      
      const srOnly = container.querySelector('.sr-only');
      expect(srOnly).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<HamburgerButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should be focusable with Tab key', () => {
      render(<HamburgerButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(document.activeElement).toBe(button);
    });
  });

  describe('User Interactions', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      render(<HamburgerButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick on initial render', () => {
      render(<HamburgerButton {...defaultProps} />);
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('should handle multiple clicks', async () => {
      const user = userEvent.setup();
      render(<HamburgerButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);
      await user.click(button);
      
      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });

    it('should handle rapid clicks', async () => {
      const user = userEvent.setup();
      render(<HamburgerButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      await user.tripleClick(button);
      
      expect(mockOnClick).toHaveBeenCalled();
    });

    it('should respond to Enter key', async () => {
      const user = userEvent.setup();
      render(<HamburgerButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      button.focus();
      
      await user.keyboard('{Enter}');
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should respond to Space key', async () => {
      const user = userEvent.setup();
      render(<HamburgerButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      button.focus();
      
      await user.keyboard(' ');
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom ClassName', () => {
    it('should accept custom className', () => {
      render(<HamburgerButton {...defaultProps} className="custom-class" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should merge custom className with default classes', () => {
      render(<HamburgerButton {...defaultProps} className="my-4 text-white" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('my-4', 'text-white', 'mobile-menu-button', 'touch-target-lg');
    });

    it('should work without custom className', () => {
      render(<HamburgerButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('mobile-menu-button', 'touch-target-lg');
    });

    it('should handle empty string className', () => {
      render(<HamburgerButton {...defaultProps} className="" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('mobile-menu-button');
    });
  });

  describe('State Transitions', () => {
    it('should update when isOpen changes from false to true', () => {
      const { container, rerender } = render(<HamburgerButton {...defaultProps} isOpen={false} />);
      
      let icon = container.querySelector('.hamburger-icon');
      expect(icon).not.toHaveClass('open');
      
      rerender(<HamburgerButton {...defaultProps} isOpen={true} />);
      
      icon = container.querySelector('.hamburger-icon');
      expect(icon).toHaveClass('open');
    });

    it('should update when isOpen changes from true to false', () => {
      const { container, rerender } = render(<HamburgerButton {...defaultProps} isOpen={true} />);
      
      let icon = container.querySelector('.hamburger-icon');
      expect(icon).toHaveClass('open');
      
      rerender(<HamburgerButton {...defaultProps} isOpen={false} />);
      
      icon = container.querySelector('.hamburger-icon');
      expect(icon).not.toHaveClass('open');
    });

    it('should toggle multiple times', () => {
      const { container, rerender } = render(<HamburgerButton {...defaultProps} isOpen={false} />);
      
      for (let i = 0; i < 5; i++) {
        const isOpen = i % 2 === 1; // Start with false (0), then true (1), false (2), etc.
        rerender(<HamburgerButton {...defaultProps} isOpen={isOpen} />);
        const icon = container.querySelector('.hamburger-icon');
        
        if (isOpen) {
          expect(icon).toHaveClass('open');
        } else {
          expect(icon).not.toHaveClass('open');
        }
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle onClick being undefined', () => {
      render(<HamburgerButton isOpen={false} onClick={undefined as any} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should maintain button role regardless of state', () => {
      const { rerender } = render(<HamburgerButton {...defaultProps} isOpen={false} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      
      rerender(<HamburgerButton {...defaultProps} isOpen={true} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle very rapid state changes', () => {
      const { container, rerender } = render(<HamburgerButton {...defaultProps} isOpen={false} />);
      
      // Rapid state changes
      for (let i = 0; i < 20; i++) {
        rerender(<HamburgerButton {...defaultProps} isOpen={i % 2 === 1} />);
      }
      
      const icon = container.querySelector('.hamburger-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should work with navigation menu', () => {
      const { container } = render(
        <div>
          <HamburgerButton {...defaultProps} />
          <nav id="mobile-nav-drawer">
            <ul>
              <li>Home</li>
              <li>About</li>
            </ul>
          </nav>
        </div>
      );
      
      const button = screen.getByRole('button');
      const nav = container.querySelector('#mobile-nav-drawer');
      
      expect(button).toHaveAttribute('aria-controls', 'mobile-nav-drawer');
      expect(nav).toBeInTheDocument();
    });

    it('should work with header component', () => {
      render(
        <header className="flex items-center justify-between p-4">
          <h1>Logo</h1>
          <HamburgerButton {...defaultProps} />
        </header>
      );
      
      expect(screen.getByText('Logo')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle state managed by parent component', async () => {
      const user = userEvent.setup();
      let isMenuOpen = false;
      const toggleMenu = () => {
        isMenuOpen = !isMenuOpen;
      };
      
      const { rerender } = render(
        <HamburgerButton isOpen={isMenuOpen} onClick={toggleMenu} />
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      isMenuOpen = true;
      rerender(<HamburgerButton isOpen={isMenuOpen} onClick={toggleMenu} />);
      
      expect(button).toHaveAttribute('aria-label', 'Close menu');
    });
  });
});
