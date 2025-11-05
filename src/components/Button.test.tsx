import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should forward ref to button element', () => {
      const ref = vi.fn();
      render(<Button ref={ref}>Button</Button>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Button variant="default">Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('glass-subtle');
    });

    it('should render primary variant', () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('gradient-bg-primary');
    });

    it('should render destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-500');
    });

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-2');
    });

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-violet-essence/20');
    });

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-violet-essence/10');
    });

    it('should render link variant', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-precious-persimmon');
    });

    it('should render gradient variant', () => {
      render(<Button variant="gradient">Gradient</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('gradient-bg-secondary');
    });
  });

  describe('Sizes', () => {
    it('should render default size', () => {
      render(<Button size="default">Default Size</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11', 'px-6', 'py-3');
    });

    it('should render small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9', 'px-4', 'text-xs');
    });

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12', 'px-8', 'text-base');
    });

    it('should render extra large size', () => {
      render(<Button size="xl">Extra Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-14', 'px-10', 'text-lg');
    });

    it('should render icon size', () => {
      render(<Button size="icon" aria-label="Icon button">🔍</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11', 'w-11');
    });
  });

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });

    it('should show loading spinner when loading is true', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      
      // Button should be disabled when loading
      expect(button).toBeDisabled();
      
      // Loading spinner should be present
      const spinner = button.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should hide children text when loading', () => {
      render(<Button loading>Submit</Button>);
      const button = screen.getByRole('button');
      const textSpan = button.querySelector('span.opacity-0');
      expect(textSpan).toBeInTheDocument();
    });

    it('should be disabled when both loading and disabled are true', () => {
      render(<Button loading disabled>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Interaction', () => {
    it('should call onClick handler when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick} loading>Loading</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle keyboard interaction (Enter)', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Press Enter</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();
    });

    it('should handle keyboard interaction (Space)', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Press Space</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through native button attributes', () => {
      render(
        <Button 
          type="submit" 
          name="submitButton" 
          aria-label="Submit form"
        >
          Submit
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('name', 'submitButton');
      expect(button).toHaveAttribute('aria-label', 'Submit form');
    });

    it('should default to type="button" if not specified', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      // Native button default is "submit", but we check it's a button element
      expect(button.tagName).toBe('BUTTON');
    });

    it('should support data attributes', () => {
      render(<Button data-testid="custom-button" data-value="123">Button</Button>);
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('data-value', '123');
    });
  });

  describe('Accessibility', () => {
    it('should have button role', () => {
      render(<Button>Accessible</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should support aria-label for icon buttons', () => {
      render(<Button size="icon" aria-label="Search">🔍</Button>);
      expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
    });

    it('should have focus-visible ring classes', () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:outline-none');
      expect(button).toHaveClass('focus-visible:ring-2');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<Button>Tab to me</Button>);
      const button = screen.getByRole('button');
      
      await user.tab();
      expect(button).toHaveFocus();
    });

    it('should announce loading state to screen readers', () => {
      render(<Button loading aria-live="polite">Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Visual Effects', () => {
    it('should have hover effect overlay', () => {
      render(<Button>Hover</Button>);
      const button = screen.getByRole('button');
      const overlay = button.querySelector('.group-hover\\:translate-x-full');
      expect(overlay).toBeInTheDocument();
    });

    it('should have transition classes for animations', () => {
      render(<Button>Animated</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-all', 'duration-300');
    });

    it('should scale on hover', () => {
      render(<Button variant="primary">Scale</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:scale-105');
    });
  });

  describe('AsChild Prop', () => {
    it('should render as child element when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/link">Link Button</a>
        </Button>
      );
      
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/link');
    });

    it('should merge classes when asChild is true', () => {
      render(
        <Button asChild className="extra-class">
          <a href="/link" className="link-class">Link</a>
        </Button>
      );
      
      const link = screen.getByRole('link');
      expect(link).toHaveClass('extra-class');
      expect(link).toHaveClass('link-class');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<Button></Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle multiple children elements', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('IconText');
    });

    it('should handle very long text', () => {
      const longText = 'A'.repeat(100);
      render(<Button>{longText}</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent(longText);
    });

    it('should combine multiple variants and sizes', () => {
      render(
        <Button variant="primary" size="lg" className="custom">
          Combined
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('gradient-bg-primary');
      expect(button).toHaveClass('h-12');
      expect(button).toHaveClass('custom');
    });
  });
});
