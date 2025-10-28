import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useAccessibility, ScreenReaderOnly, FocusableDiv } from '@/hooks/useAccessibility';
import { SkipLink } from '@/components/SkipLink';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('Accessibility Features', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.className = '';
  });

  describe('useAccessibility Hook', () => {
    it('should initialize with default values', () => {
      let hookResult: any;
      
      const TestComponent: React.FC = () => {
        hookResult = useAccessibility();
        return <div>Test</div>;
      };
      
      render(<TestComponent />);
      
      expect(hookResult.isHighContrast).toBe(false);
      expect(hookResult.prefersReducedMotion).toBe(false);
      expect(hookResult.focusedElement).toBeNull();
      expect(hookResult.announcements).toEqual([]);
    });

    it('should toggle high contrast mode', () => {
      let hookResult: any;
      
      const TestComponent: React.FC = () => {
        hookResult = useAccessibility();
        return <div>Test</div>;
      };
      
      render(<TestComponent />);
      
      // Initially should not have high contrast class
      expect(document.documentElement.classList.contains('high-contrast')).toBe(false);
      
      // Toggle high contrast
      hookResult.toggleHighContrast();
      
      // Should now have high contrast class
      expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
      expect(hookResult.isHighContrast).toBe(true);
      
      // Toggle again
      hookResult.toggleHighContrast();
      
      // Should not have high contrast class
      expect(document.documentElement.classList.contains('high-contrast')).toBe(false);
      expect(hookResult.isHighContrast).toBe(false);
    });

    it('should announce messages to screen readers', () => {
      let hookResult: any;
      
      const TestComponent: React.FC = () => {
        hookResult = useAccessibility();
        return <div>Test</div>;
      };
      
      render(<TestComponent />);
      
      // Announce a message
      hookResult.announceToScreenReader('Test message');
      
      // Should have added to announcements array
      expect(hookResult.announcements).toContain('Test message');
      
      // Should have created live region
      const liveRegion = document.getElementById('accessibility-announcer');
      expect(liveRegion).toBeTruthy();
      expect(liveRegion?.textContent).toBe('Test message');
    });

    it('should focus elements by ID', () => {
      let hookResult: any;
      
      const TestComponent: React.FC = () => {
        hookResult = useAccessibility();
        return (
          <div>
            <button id="test-button">Test Button</button>
          </div>
        );
      };
      
      render(<TestComponent />);
      
      // Focus the element
      hookResult.focusElement('test-button');
      
      // Should have focused the element
      expect(document.activeElement?.id).toBe('test-button');
      expect(hookResult.focusedElement).toBe('test-button');
    });
  });

  describe('ScreenReaderOnly Component', () => {
    it('should render content that is only visible to screen readers', () => {
      render(
        <ScreenReaderOnly>
          <span>Screen reader content</span>
        </ScreenReaderOnly>
      );
      
      const element = screen.getByText('Screen reader content');
      expect(element).toBeTruthy();
      expect(element.className).toContain('sr-only');
    });
  });

  describe('FocusableDiv Component', () => {
    it('should render a div that can receive focus', () => {
      render(
        <FocusableDiv data-testid="focusable-div">
          <span>Focusable content</span>
        </FocusableDiv>
      );
      
      const element = screen.getByTestId('focusable-div');
      expect(element).toBeTruthy();
      expect(element).toHaveAttribute('tabIndex', '0');
    });

    it('should apply custom className', () => {
      render(
        <FocusableDiv className="custom-class" data-testid="focusable-div">
          <span>Focusable content</span>
        </FocusableDiv>
      );
      
      const element = screen.getByTestId('focusable-div');
      expect(element.className).toContain('custom-class');
      expect(element.className).toContain('focus:outline-none');
    });
  });

  describe('SkipLink Component', () => {
    it('should render a skip link with correct attributes', () => {
      render(<SkipLink />);
      
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeTruthy();
      expect(skipLink).toHaveAttribute('href', '#main-content');
      expect(skipLink.className).toContain('sr-only');
    });

    it('should become visible when focused', () => {
      render(<SkipLink />);
      
      const skipLink = screen.getByText('Skip to main content');
      fireEvent.focus(skipLink);
      
      // The focus styles are in CSS, so we can't easily test visibility
      // But we can verify it has the right classes
      expect(skipLink.className).toContain('focus:not-sr-only');
    });
  });
});