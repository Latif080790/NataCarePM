/**
 * ButtonPro Component Tests
 * 
 * Tests for the professional button component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Plus, Trash2 } from 'lucide-react';
import { ButtonPro, ButtonProGroup } from './ButtonPro';

describe('ButtonPro', () => {
  describe('Basic Rendering', () => {
    it('should render button with children', () => {
      render(<ButtonPro>Click Me</ButtonPro>);
      
      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<ButtonPro className="custom-btn">Button</ButtonPro>);
      
      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-btn');
    });

    it('should pass through HTML button attributes', () => {
      render(<ButtonPro type="submit" name="submit-btn">Submit</ButtonPro>);
      
      const button = screen.getByRole('button') as HTMLButtonElement;
      expect(button.type).toBe('submit');
      expect(button.name).toBe('submit-btn');
    });
  });

  describe('Variants', () => {
    it('should render primary variant by default', () => {
      render(<ButtonPro>Primary</ButtonPro>);
      
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-blue-600');
      expect(button.className).toContain('text-white');
    });

    it('should render secondary variant', () => {
      render(<ButtonPro variant="secondary">Secondary</ButtonPro>);
      
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-gray-600');
      expect(button.className).toContain('text-white');
    });

    it('should render danger variant', () => {
      render(<ButtonPro variant="danger">Delete</ButtonPro>);
      
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-red-600');
      expect(button.className).toContain('text-white');
    });

    it('should render ghost variant', () => {
      render(<ButtonPro variant="ghost">Ghost</ButtonPro>);
      
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-transparent');
      expect(button.className).toContain('text-gray-700');
    });

    it('should render outline variant', () => {
      render(<ButtonPro variant="outline">Outline</ButtonPro>);
      
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-transparent');
      expect(button.className).toContain('border');
      expect(button.className).toContain('border-gray-300');
    });
  });

  describe('Sizes', () => {
    it('should render medium size by default', () => {
      render(<ButtonPro>Medium</ButtonPro>);
      
      const button = screen.getByRole('button');
      expect(button.className).toContain('px-4');
      expect(button.className).toContain('py-2');
      expect(button.className).toContain('text-base');
    });

    it('should render small size', () => {
      render(<ButtonPro size="sm">Small</ButtonPro>);
      
      const button = screen.getByRole('button');
      expect(button.className).toContain('px-3');
      expect(button.className).toContain('py-1.5');
      expect(button.className).toContain('text-sm');
    });

    it('should render large size', () => {
      render(<ButtonPro size="lg">Large</ButtonPro>);
      
      const button = screen.getByRole('button');
      expect(button.className).toContain('px-6');
      expect(button.className).toContain('py-3');
      expect(button.className).toContain('text-lg');
    });
  });

  describe('Icons', () => {
    it('should render icon on the left by default', () => {
      const { container } = render(
        <ButtonPro icon={Plus}>Add</ButtonPro>
      );
      
      const button = screen.getByRole('button');
      const svg = container.querySelector('svg');
      
      expect(svg).toBeInTheDocument();
      expect(button.textContent).toBe('Add');
    });

    it('should render icon on the right when specified', () => {
      const { container } = render(
        <ButtonPro icon={Plus} iconPosition="right">Add</ButtonPro>
      );
      
      const button = screen.getByRole('button');
      const svg = container.querySelector('svg');
      
      expect(svg).toBeInTheDocument();
      expect(button.textContent).toBe('Add');
    });

    it('should scale icon size with button size', () => {
      const { container: smallContainer } = render(
        <ButtonPro size="sm" icon={Plus}>Small</ButtonPro>
      );
      const { container: largeContainer } = render(
        <ButtonPro size="lg" icon={Plus}>Large</ButtonPro>
      );
      
      const smallIcon = smallContainer.querySelector('svg');
      const largeIcon = largeContainer.querySelector('svg');
      
      expect(smallIcon?.getAttribute('width')).toBe('16');
      expect(largeIcon?.getAttribute('width')).toBe('24');
    });
  });

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<ButtonPro disabled>Disabled</ButtonPro>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button.className).toContain('disabled:opacity-50');
    });

    it('should show loading state', () => {
      render(<ButtonPro isLoading>Loading</ButtonPro>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show spinner when loading', () => {
      const { container } = render(<ButtonPro isLoading>Save</ButtonPro>);
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should not show icon when loading', () => {
      const { container } = render(
        <ButtonPro icon={Plus} isLoading>Add</ButtonPro>
      );
      
      // Spinner should be present, but Plus icon should not
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBe(1); // Only the spinner
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Full Width', () => {
    it('should not be full width by default', () => {
      render(<ButtonPro>Button</ButtonPro>);
      
      const button = screen.getByRole('button');
      expect(button.className).not.toContain('w-full');
    });

    it('should be full width when specified', () => {
      render(<ButtonPro fullWidth>Full Width</ButtonPro>);
      
      const button = screen.getByRole('button');
      expect(button.className).toContain('w-full');
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<ButtonPro onClick={handleClick}>Click Me</ButtonPro>);
      
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<ButtonPro onClick={handleClick} disabled>Disabled</ButtonPro>);
      
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<ButtonPro onClick={handleClick} isLoading>Loading</ButtonPro>);
      
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have focus ring styles', () => {
      render(<ButtonPro>Focus Me</ButtonPro>);
      
      const button = screen.getByRole('button');
      expect(button.className).toContain('focus:outline-none');
      expect(button.className).toContain('focus:ring-2');
    });

    it('should be keyboard accessible', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<ButtonPro onClick={handleClick}>Press Enter</ButtonPro>);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalled();
    });
  });
});

describe('ButtonProGroup', () => {
  describe('Orientation', () => {
    it('should render horizontal by default', () => {
      const { container } = render(
        <ButtonProGroup>
          <ButtonPro>Button 1</ButtonPro>
          <ButtonPro>Button 2</ButtonPro>
        </ButtonProGroup>
      );
      
      const group = container.firstChild as HTMLElement;
      expect(group.className).toContain('flex-row');
    });

    it('should render vertical when specified', () => {
      const { container } = render(
        <ButtonProGroup orientation="vertical">
          <ButtonPro>Button 1</ButtonPro>
          <ButtonPro>Button 2</ButtonPro>
        </ButtonProGroup>
      );
      
      const group = container.firstChild as HTMLElement;
      expect(group.className).toContain('flex-col');
    });
  });

  describe('Rendering', () => {
    it('should render all children buttons', () => {
      render(
        <ButtonProGroup>
          <ButtonPro>Cancel</ButtonPro>
          <ButtonPro variant="primary">Save</ButtonPro>
          <ButtonPro variant="danger">Delete</ButtonPro>
        </ButtonProGroup>
      );
      
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ButtonProGroup className="custom-group">
          <ButtonPro>Button</ButtonPro>
        </ButtonProGroup>
      );
      
      const group = container.firstChild as HTMLElement;
      expect(group.className).toContain('custom-group');
    });

    it('should have gap between buttons', () => {
      const { container } = render(
        <ButtonProGroup>
          <ButtonPro>Button 1</ButtonPro>
          <ButtonPro>Button 2</ButtonPro>
        </ButtonProGroup>
      );
      
      const group = container.firstChild as HTMLElement;
      expect(group.className).toContain('gap-2');
    });
  });
});
