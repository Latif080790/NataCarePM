/**
 * CardPro Component Tests
 * 
 * Tests for the professional card component and all its sub-components.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CardPro,
  CardProHeader,
  CardProContent,
  CardProFooter,
  CardProTitle,
  CardProDescription,
} from './CardPro';

describe('CardPro', () => {
  describe('Basic Rendering', () => {
    it('should render children correctly', () => {
      render(
        <CardPro>
          <div>Test Content</div>
        </CardPro>
      );
      
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <CardPro className="custom-class">
          <div>Content</div>
        </CardPro>
      );
      
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('custom-class');
    });
  });

  describe('Variants', () => {
    it('should render default variant with correct styles', () => {
      const { container } = render(<CardPro>Content</CardPro>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.className).toContain('bg-white');
      expect(card.className).toContain('border');
      expect(card.className).toContain('border-gray-200');
    });

    it('should render outlined variant', () => {
      const { container } = render(<CardPro variant="outlined">Content</CardPro>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.className).toContain('bg-transparent');
      expect(card.className).toContain('border-2');
      expect(card.className).toContain('border-gray-300');
    });

    it('should render elevated variant with shadow', () => {
      const { container } = render(<CardPro variant="elevated">Content</CardPro>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.className).toContain('bg-white');
      expect(card.className).toContain('shadow-md');
    });

    it('should render flat variant', () => {
      const { container } = render(<CardPro variant="flat">Content</CardPro>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.className).toContain('bg-gray-50');
    });
  });

  describe('Padding', () => {
    it('should apply no padding when padding="none"', () => {
      const { container } = render(<CardPro padding="none">Content</CardPro>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.className).toContain('p-0');
    });

    it('should apply small padding when padding="sm"', () => {
      const { container } = render(<CardPro padding="sm">Content</CardPro>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.className).toContain('p-3');
    });

    it('should apply medium padding by default', () => {
      const { container } = render(<CardPro>Content</CardPro>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.className).toContain('p-6');
    });

    it('should apply large padding when padding="lg"', () => {
      const { container } = render(<CardPro padding="lg">Content</CardPro>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.className).toContain('p-8');
    });
  });

  describe('Interactivity', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <CardPro onClick={handleClick}>
          <div>Clickable Content</div>
        </CardPro>
      );
      
      const card = screen.getByText('Clickable Content').parentElement;
      await user.click(card!);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should apply hover styles when hoverable is true', () => {
      const { container } = render(<CardPro hoverable>Content</CardPro>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.className).toContain('hover:shadow-lg');
      expect(card.className).toContain('cursor-pointer');
    });

    it('should apply hover styles when onClick is provided', () => {
      const { container } = render(
        <CardPro onClick={() => {}}>Content</CardPro>
      );
      const card = container.firstChild as HTMLElement;
      
      expect(card.className).toContain('hover:shadow-lg');
      expect(card.className).toContain('cursor-pointer');
    });

    it('should not apply hover styles by default', () => {
      const { container } = render(<CardPro>Content</CardPro>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.className).not.toContain('hover:shadow-lg');
      expect(card.className).not.toContain('cursor-pointer');
    });
  });

  describe('CardProHeader', () => {
    it('should render header with children', () => {
      render(
        <CardProHeader>
          <h3>Header Content</h3>
        </CardProHeader>
      );
      
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('should apply border and spacing styles', () => {
      const { container } = render(
        <CardProHeader>Header</CardProHeader>
      );
      const header = container.firstChild as HTMLElement;
      
      expect(header.className).toContain('border-b');
      expect(header.className).toContain('pb-4');
      expect(header.className).toContain('mb-4');
    });

    it('should accept custom className', () => {
      const { container } = render(
        <CardProHeader className="custom-header">Header</CardProHeader>
      );
      const header = container.firstChild as HTMLElement;
      
      expect(header.className).toContain('custom-header');
    });
  });

  describe('CardProContent', () => {
    it('should render content with children', () => {
      render(
        <CardProContent>
          <p>Main content</p>
        </CardProContent>
      );
      
      expect(screen.getByText('Main content')).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      const { container } = render(
        <CardProContent className="custom-content">Content</CardProContent>
      );
      const content = container.firstChild as HTMLElement;
      
      expect(content.className).toContain('custom-content');
    });
  });

  describe('CardProFooter', () => {
    it('should render footer with children', () => {
      render(
        <CardProFooter>
          <button>Action</button>
        </CardProFooter>
      );
      
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('should apply border and spacing styles', () => {
      const { container } = render(
        <CardProFooter>Footer</CardProFooter>
      );
      const footer = container.firstChild as HTMLElement;
      
      expect(footer.className).toContain('border-t');
      expect(footer.className).toContain('pt-4');
      expect(footer.className).toContain('mt-4');
    });

    it('should accept custom className', () => {
      const { container } = render(
        <CardProFooter className="custom-footer">Footer</CardProFooter>
      );
      const footer = container.firstChild as HTMLElement;
      
      expect(footer.className).toContain('custom-footer');
    });
  });

  describe('CardProTitle', () => {
    it('should render title with correct styles', () => {
      render(<CardProTitle>Card Title</CardProTitle>);
      
      const title = screen.getByText('Card Title');
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H3');
      expect(title.className).toContain('font-semibold');
      expect(title.className).toContain('text-gray-900');
    });

    it('should accept custom className', () => {
      render(<CardProTitle className="custom-title">Title</CardProTitle>);
      
      const title = screen.getByText('Title');
      expect(title.className).toContain('custom-title');
    });
  });

  describe('CardProDescription', () => {
    it('should render description with correct styles', () => {
      render(<CardProDescription>Card description</CardProDescription>);
      
      const description = screen.getByText('Card description');
      expect(description).toBeInTheDocument();
      expect(description.tagName).toBe('P');
      expect(description.className).toContain('text-gray-600');
    });

    it('should accept custom className', () => {
      render(<CardProDescription className="custom-desc">Description</CardProDescription>);
      
      const description = screen.getByText('Description');
      expect(description.className).toContain('custom-desc');
    });
  });

  describe('Composition', () => {
    it('should render complete card with all sub-components', () => {
      render(
        <CardPro variant="elevated">
          <CardProHeader>
            <CardProTitle>Dashboard</CardProTitle>
            <CardProDescription>Project overview</CardProDescription>
          </CardProHeader>
          <CardProContent>
            <p>Main content here</p>
          </CardProContent>
          <CardProFooter>
            <button>Save</button>
          </CardProFooter>
        </CardPro>
      );
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Project overview')).toBeInTheDocument();
      expect(screen.getByText('Main content here')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should work with minimal composition', () => {
      render(
        <CardPro>
          <CardProTitle>Simple Card</CardProTitle>
          <p>Just some content</p>
        </CardPro>
      );
      
      expect(screen.getByText('Simple Card')).toBeInTheDocument();
      expect(screen.getByText('Just some content')).toBeInTheDocument();
    });
  });
});

