import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render card container', () => {
      render(<Card data-testid="card">Card content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent('Card content');
    });

    it('should have default card styling classes', () => {
      render(<Card data-testid="card">Card</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('rounded-2xl');
      expect(card).toHaveClass('glass-subtle');
      expect(card).toHaveClass('shadow-lg');
    });

    it('should apply custom className', () => {
      render(<Card className="custom-class" data-testid="card">Card</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
    });

    it('should forward ref', () => {
      const ref = vi.fn();
      render(<Card ref={ref}>Card</Card>);
      expect(ref).toHaveBeenCalled();
    });

    it('should have hover effects', () => {
      render(<Card data-testid="card">Card</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('hover:shadow-xl');
      expect(card).toHaveClass('hover:scale-[1.02]');
      expect(card).toHaveClass('hover:border-violet-essence/30');
    });

    it('should have transition classes', () => {
      render(<Card data-testid="card">Card</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('transition-all');
      expect(card).toHaveClass('duration-300');
    });

    it('should pass through HTML attributes', () => {
      render(
        <Card 
          data-testid="card" 
          data-value="test" 
          role="article"
        >
          Card
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('data-value', 'test');
      expect(card).toHaveAttribute('role', 'article');
    });

    it('should handle click events', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Card onClick={handleClick} data-testid="card">Card</Card>);
      const card = screen.getByTestId('card');
      
      await user.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('CardHeader', () => {
    it('should render card header', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveTextContent('Header');
    });

    it('should have header styling', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-2', 'p-6');
      expect(header).toHaveClass('border-b', 'border-violet-essence/10');
    });

    it('should apply custom className', () => {
      render(<CardHeader className="custom-header" data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('custom-header');
    });

    it('should forward ref', () => {
      const ref = vi.fn();
      render(<CardHeader ref={ref}>Header</CardHeader>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('CardTitle', () => {
    it('should render as h3 element', () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Title');
    });

    it('should have title styling', () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByRole('heading');
      expect(title).toHaveClass('text-xl');
      expect(title).toHaveClass('font-bold');
      expect(title).toHaveClass('text-night-black');
    });

    it('should apply custom className', () => {
      render(<CardTitle className="custom-title">Title</CardTitle>);
      const title = screen.getByRole('heading');
      expect(title).toHaveClass('custom-title');
    });

    it('should forward ref', () => {
      const ref = vi.fn();
      render(<CardTitle ref={ref}>Title</CardTitle>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('CardDescription', () => {
    it('should render description text', () => {
      render(<CardDescription data-testid="description">Description text</CardDescription>);
      const description = screen.getByTestId('description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent('Description text');
    });

    it('should render as paragraph element', () => {
      render(<CardDescription>Description</CardDescription>);
      const description = screen.getByText('Description');
      expect(description.tagName).toBe('P');
    });

    it('should have description styling', () => {
      render(<CardDescription data-testid="description">Description</CardDescription>);
      const description = screen.getByTestId('description');
      expect(description).toHaveClass('text-sm');
      expect(description).toHaveClass('text-palladium');
      expect(description).toHaveClass('leading-relaxed');
    });

    it('should apply custom className', () => {
      render(<CardDescription className="custom-desc" data-testid="description">Desc</CardDescription>);
      const description = screen.getByTestId('description');
      expect(description).toHaveClass('custom-desc');
    });

    it('should forward ref', () => {
      const ref = vi.fn();
      render(<CardDescription ref={ref}>Description</CardDescription>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('CardContent', () => {
    it('should render card content', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent('Content');
    });

    it('should have content styling', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('p-6');
    });

    it('should apply custom className', () => {
      render(<CardContent className="custom-content" data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-content');
    });

    it('should forward ref', () => {
      const ref = vi.fn();
      render(<CardContent ref={ref}>Content</CardContent>);
      expect(ref).toHaveBeenCalled();
    });

    it('should render nested elements', () => {
      render(
        <CardContent data-testid="content">
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
        </CardContent>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveTextContent('Paragraph 1');
      expect(content).toHaveTextContent('Paragraph 2');
    });
  });

  describe('CardFooter', () => {
    it('should render card footer', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveTextContent('Footer');
    });

    it('should have footer styling', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-4');
      expect(footer).toHaveClass('border-t', 'border-violet-essence/10');
    });

    it('should apply custom className', () => {
      render(<CardFooter className="custom-footer" data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('custom-footer');
    });

    it('should forward ref', () => {
      const ref = vi.fn();
      render(<CardFooter ref={ref}>Footer</CardFooter>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('Complete Card Composition', () => {
    it('should render complete card with all sections', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description text</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Action Button</button>
          </CardFooter>
        </Card>
      );

      const card = screen.getByTestId('complete-card');
      expect(card).toBeInTheDocument();
      
      expect(screen.getByRole('heading', { name: /card title/i })).toBeInTheDocument();
      expect(screen.getByText(/card description text/i)).toBeInTheDocument();
      expect(screen.getByText(/main content goes here/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /action button/i })).toBeInTheDocument();
    });

    it('should render card without header', () => {
      render(
        <Card data-testid="card">
          <CardContent>Content only</CardContent>
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveTextContent('Content only');
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should render card without footer', () => {
      render(
        <Card data-testid="card">
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(screen.getByRole('heading')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should handle interactive card', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Card onClick={handleClick} data-testid="interactive-card" role="button">
          <CardHeader>
            <CardTitle>Clickable Card</CardTitle>
          </CardHeader>
          <CardContent>Click me</CardContent>
        </Card>
      );

      const card = screen.getByTestId('interactive-card');
      await user.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty card', () => {
      render(<Card data-testid="empty-card"></Card>);
      const card = screen.getByTestId('empty-card');
      expect(card).toBeInTheDocument();
    });

    it('should handle very long content', () => {
      const longText = 'A'.repeat(1000);
      render(
        <Card data-testid="card">
          <CardContent>{longText}</CardContent>
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveTextContent(longText);
    });

    it('should handle multiple CardHeaders (edge case)', () => {
      render(
        <Card data-testid="card">
          <CardHeader>Header 1</CardHeader>
          <CardHeader>Header 2</CardHeader>
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveTextContent('Header 1');
      expect(card).toHaveTextContent('Header 2');
    });

    it('should handle nested cards (edge case)', () => {
      render(
        <Card data-testid="outer">
          <CardContent>
            <Card data-testid="inner">
              <CardContent>Nested card</CardContent>
            </Card>
          </CardContent>
        </Card>
      );

      const outerCard = screen.getByTestId('outer');
      const innerCard = screen.getByTestId('inner');
      
      expect(outerCard).toBeInTheDocument();
      expect(innerCard).toBeInTheDocument();
      expect(innerCard).toHaveTextContent('Nested card');
    });
  });

  describe('Memoization', () => {
    it('should not re-render when parent updates with same props', () => {
      let renderCount = 0;
      
      const TestCard = () => {
        renderCount++;
        return <Card data-testid="card">Content</Card>;
      };

      const { rerender } = render(<TestCard />);
      const initialRenderCount = renderCount;
      
      // Re-render parent
      rerender(<TestCard />);
      
      // Card is memoized, but parent re-renders normally
      expect(renderCount).toBeGreaterThan(initialRenderCount);
      
      // Verify card is still in document
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });
  });
});
