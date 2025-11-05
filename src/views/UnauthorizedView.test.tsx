import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import UnauthorizedView from './UnauthorizedView';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('UnauthorizedView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  describe('Rendering', () => {
    it('should render unauthorized view', () => {
      renderWithRouter(<UnauthorizedView />);
      
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('should render error message', () => {
      renderWithRouter(<UnauthorizedView />);
      
      expect(screen.getByText(/You don't have permission to access this page/i)).toBeInTheDocument();
    });

    it('should render ShieldAlert icon', () => {
      const { container } = renderWithRouter(<UnauthorizedView />);
      
      const icon = container.querySelector('.text-red-600');
      expect(icon).toBeInTheDocument();
    });

    it('should render Go Back button', () => {
      renderWithRouter(<UnauthorizedView />);
      
      expect(screen.getByText('Go Back')).toBeInTheDocument();
    });

    it('should render Go to Dashboard button', () => {
      renderWithRouter(<UnauthorizedView />);
      
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    });

    it('should render Home icon in dashboard button', () => {
      renderWithRouter(<UnauthorizedView />);
      
      const dashboardButton = screen.getByText('Go to Dashboard').closest('button');
      expect(dashboardButton).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should have centered layout', () => {
      const { container } = renderWithRouter(<UnauthorizedView />);
      
      const wrapper = container.querySelector('.min-h-screen.bg-gray-50');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('should have card with shadow', () => {
      const { container } = renderWithRouter(<UnauthorizedView />);
      
      const card = container.querySelector('.bg-white.rounded-lg.shadow-lg');
      expect(card).toBeInTheDocument();
    });

    it('should have icon container with red background', () => {
      const { container } = renderWithRouter(<UnauthorizedView />);
      
      const iconContainer = container.querySelector('.bg-red-100.rounded-full');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should have proper text styling', () => {
      renderWithRouter(<UnauthorizedView />);
      
      const heading = screen.getByText('Access Denied');
      expect(heading).toHaveClass('text-2xl', 'font-bold', 'text-gray-900');
    });

    it('should have responsive button layout', () => {
      const { container } = renderWithRouter(<UnauthorizedView />);
      
      const buttonContainer = container.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('Button Styling', () => {
    it('should style Go Back button correctly', () => {
      renderWithRouter(<UnauthorizedView />);
      
      const backButton = screen.getByText('Go Back');
      expect(backButton).toHaveClass('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');
    });

    it('should style Dashboard button correctly', () => {
      renderWithRouter(<UnauthorizedView />);
      
      const dashboardButton = screen.getByText('Go to Dashboard');
      expect(dashboardButton).toHaveClass('bg-blue-600', 'text-white', 'hover:bg-blue-700');
    });

    it('should have transition classes on buttons', () => {
      renderWithRouter(<UnauthorizedView />);
      
      const backButton = screen.getByText('Go Back');
      const dashboardButton = screen.getByText('Go to Dashboard');
      
      expect(backButton).toHaveClass('transition-colors');
      expect(dashboardButton).toHaveClass('transition-colors');
    });
  });

  describe('User Interactions', () => {
    it('should call navigate(-1) when Go Back is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UnauthorizedView />);
      
      const backButton = screen.getByText('Go Back');
      await user.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith(-1);
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it('should call navigate("/") when Dashboard button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UnauthorizedView />);
      
      const dashboardButton = screen.getByText('Go to Dashboard');
      await user.click(dashboardButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it('should not navigate on initial render', () => {
      renderWithRouter(<UnauthorizedView />);
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should handle multiple clicks on Go Back', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UnauthorizedView />);
      
      const backButton = screen.getByText('Go Back');
      await user.click(backButton);
      await user.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith(-1);
      expect(mockNavigate).toHaveBeenCalledTimes(2);
    });

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UnauthorizedView />);
      
      const backButton = screen.getByText('Go Back');
      backButton.focus();
      
      await user.keyboard('{Enter}');
      
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithRouter(<UnauthorizedView />);
      
      const heading = screen.getByText('Access Denied');
      expect(heading.tagName).toBe('H1');
    });

    it('should have focusable buttons', () => {
      renderWithRouter(<UnauthorizedView />);
      
      const backButton = screen.getByText('Go Back');
      const dashboardButton = screen.getByText('Go to Dashboard');
      
      backButton.focus();
      expect(document.activeElement).toBe(backButton);
      
      dashboardButton.focus();
      expect(document.activeElement).toBe(dashboardButton);
    });

    it('should have button roles', () => {
      renderWithRouter(<UnauthorizedView />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('should have descriptive button text', () => {
      renderWithRouter(<UnauthorizedView />);
      
      expect(screen.getByText('Go Back')).toBeInTheDocument();
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('should display full error message', () => {
      renderWithRouter(<UnauthorizedView />);
      
      const message = screen.getByText(/Please contact your administrator if you believe this is an error/i);
      expect(message).toBeInTheDocument();
    });

    it('should have proper paragraph styling', () => {
      renderWithRouter(<UnauthorizedView />);
      
      const message = screen.getByText(/You don't have permission/i);
      expect(message).toHaveClass('text-gray-600');
    });

    it('should render all text content', () => {
      renderWithRouter(<UnauthorizedView />);
      
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText(/You don't have permission/i)).toBeInTheDocument();
      expect(screen.getByText('Go Back')).toBeInTheDocument();
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    });
  });

  describe('Icon Display', () => {
    it('should render icon in circular container', () => {
      const { container } = renderWithRouter(<UnauthorizedView />);
      
      const iconContainer = container.querySelector('.w-16.h-16.bg-red-100.rounded-full');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should center icon in container', () => {
      const { container } = renderWithRouter(<UnauthorizedView />);
      
      const iconContainer = container.querySelector('.rounded-full');
      expect(iconContainer).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('should render Home icon with proper size', () => {
      const { container } = renderWithRouter(<UnauthorizedView />);
      
      const dashboardButton = screen.getByText('Go to Dashboard').closest('button');
      const homeIcon = dashboardButton?.querySelector('svg');
      expect(homeIcon).toHaveClass('w-4', 'h-4');
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive padding', () => {
      const { container } = renderWithRouter(<UnauthorizedView />);
      
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('p-4');
    });

    it('should have max-width constraint', () => {
      const { container } = renderWithRouter(<UnauthorizedView />);
      
      const card = container.querySelector('.max-w-md');
      expect(card).toBeInTheDocument();
    });

    it('should have responsive button layout classes', () => {
      const { container } = renderWithRouter(<UnauthorizedView />);
      
      const buttonContainer = container.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should render without crashing', () => {
      expect(() => renderWithRouter(<UnauthorizedView />)).not.toThrow();
    });

    it('should handle rapid button clicks', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UnauthorizedView />);
      
      const backButton = screen.getByText('Go Back');
      
      await user.tripleClick(backButton);
      
      expect(mockNavigate).toHaveBeenCalled();
    });

    it('should work without BrowserRouter (using MemoryRouter)', () => {
      const { container } = render(<UnauthorizedView />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should work within application routing', () => {
      renderWithRouter(<UnauthorizedView />);
      
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('should navigate correctly in sequence', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UnauthorizedView />);
      
      const backButton = screen.getByText('Go Back');
      await user.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith(-1);
      
      const dashboardButton = screen.getByText('Go to Dashboard');
      await user.click(dashboardButton);
      expect(mockNavigate).toHaveBeenCalledWith('/');
      
      expect(mockNavigate).toHaveBeenCalledTimes(2);
    });
  });
});
