import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EnhancedErrorBoundary, { useEnhancedErrorBoundary } from '@/components/EnhancedErrorBoundary';

// Mock the logger
jest.mock('@/utils/logger.enhanced', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock the monitoring service
jest.mock('@/api/monitoringService', () => ({
  monitoringService: {
    logError: jest.fn()
  }
}));

// Mock i18n
jest.mock('@/i18n', () => ({
  i18n: {
    getCurrentLanguage: () => 'en',
    t: (key: string) => {
      const translations: Record<string, string> = {
        'errors.serverError': 'An unexpected server error occurred',
        'errors.errorReport': 'Error Report',
        'errors.errorId': 'Error ID',
        'errors.errorMessage': 'Error Message',
        'errors.timestamp': 'Timestamp',
        'errors.stackTrace': 'Stack Trace',
        'errors.tryAgain': 'Try Again',
        'errors.reloadPage': 'Reload Page',
        'errors.goHome': 'Go Home',
        'errors.speakError': 'Speak Error',
        'errors.needSupport': 'Need Enterprise Support?',
        'errors.supportDescription': 'Our enterprise support team is available 24/7',
        'errors.contactSupport': 'Contact support at',
        'errors.enterpriseSupport': '24/7 Enterprise Support',
        'errors.advancedRecovery': 'Advanced Error Recovery & Monitoring',
        'errors.unknownError': 'Unknown error occurred'
      };
      return translations[key] || key;
    }
  },
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'errors.serverError': 'An unexpected server error occurred',
        'errors.errorReport': 'Error Report',
        'errors.errorId': 'Error ID',
        'errors.errorMessage': 'Error Message',
        'errors.timestamp': 'Timestamp',
        'errors.stackTrace': 'Stack Trace',
        'errors.tryAgain': 'Try Again',
        'errors.reloadPage': 'Reload Page',
        'errors.goHome': 'Go Home',
        'errors.speakError': 'Speak Error',
        'errors.needSupport': 'Need Enterprise Support?',
        'errors.supportDescription': 'Our enterprise support team is available 24/7',
        'errors.contactSupport': 'Contact support at',
        'errors.enterpriseSupport': '24/7 Enterprise Support',
        'errors.advancedRecovery': 'Advanced Error Recovery & Monitoring',
        'errors.unknownError': 'Unknown error occurred'
      };
      return translations[key] || key;
    }
  })
}));

describe('EnhancedErrorBoundary', () => {
  // Suppress console.error for cleaner test output
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  const ProblematicComponent: React.FC = () => {
    throw new Error('Test error');
  };

  const WorkingComponent: React.FC = () => {
    return <div>Working Component</div>;
  };

  it('should render children when there is no error', () => {
    render(
      <EnhancedErrorBoundary>
        <WorkingComponent />
      </EnhancedErrorBoundary>
    );

    expect(screen.getByText('Working Component')).toBeInTheDocument();
  });

  it('should catch errors and display error UI', () => {
    render(
      <EnhancedErrorBoundary>
        <ProblematicComponent />
      </EnhancedErrorBoundary>
    );

    // Should display error message
    expect(screen.getByText('An unexpected server error occurred')).toBeInTheDocument();
    
    // Should display error report section
    expect(screen.getByText('Error Report')).toBeInTheDocument();
    
    // Should display error ID
    expect(screen.getByText('Error ID:')).toBeInTheDocument();
    
    // Should display error message
    expect(screen.getByText('Test error')).toBeInTheDocument();
    
    // Should display timestamp
    expect(screen.getByText('Timestamp:')).toBeInTheDocument();
    
    // Should display action buttons
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
    expect(screen.getByText('Go Home')).toBeInTheDocument();
    expect(screen.getByText('Speak Error')).toBeInTheDocument();
  });

  it('should handle retry action', () => {
    const { rerender } = render(
      <EnhancedErrorBoundary>
        <ProblematicComponent />
      </EnhancedErrorBoundary>
    );

    // Error UI should be displayed
    expect(screen.getByText('An unexpected server error occurred')).toBeInTheDocument();

    // Click retry button
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    // After retry, should show the working component
    rerender(
      <EnhancedErrorBoundary>
        <WorkingComponent />
      </EnhancedErrorBoundary>
    );

    expect(screen.getByText('Working Component')).toBeInTheDocument();
  });

  it('should handle reload action', () => {
    // Mock window.location.reload
    const reloadMock = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true
    });

    render(
      <EnhancedErrorBoundary>
        <ProblematicComponent />
      </EnhancedErrorBoundary>
    );

    // Click reload button
    const reloadButton = screen.getByText('Reload Page');
    fireEvent.click(reloadButton);

    // Should call window.location.reload
    expect(reloadMock).toHaveBeenCalled();
  });

  it('should handle go home action', () => {
    // Mock window.location.href
    delete (window as any).location;
    (window as any).location = { href: '' };

    render(
      <EnhancedErrorBoundary>
        <ProblematicComponent />
      </EnhancedErrorBoundary>
    );

    // Click go home button
    const goHomeButton = screen.getByText('Go Home');
    fireEvent.click(goHomeButton);

    // Should redirect to home
    expect(window.location.href).toBe('/');
  });

  it('should use custom fallback when provided', () => {
    const CustomFallback = () => <div>Custom Error Fallback</div>;

    render(
      <EnhancedErrorBoundary fallback={<CustomFallback />}>
        <ProblematicComponent />
      </EnhancedErrorBoundary>
    );

    // Should display custom fallback instead of default error UI
    expect(screen.getByText('Custom Error Fallback')).toBeInTheDocument();
    expect(screen.queryByText('An unexpected server error occurred')).not.toBeInTheDocument();
  });

  it('should log errors to monitoring service', () => {
    const mockLogError = jest.fn();
    jest.mock('@/api/monitoringService', () => ({
      monitoringService: {
        logError: mockLogError
      }
    }));

    render(
      <EnhancedErrorBoundary>
        <ProblematicComponent />
      </EnhancedErrorBoundary>
    );

    // Should call monitoring service
    expect(mockLogError).toHaveBeenCalledWith({
      message: 'Test error',
      stack: expect.any(String),
      severity: 'critical',
      component: 'ErrorBoundary',
      action: 'componentDidCatch'
    });
  });
});

describe('useEnhancedErrorBoundary Hook', () => {
  it('should provide translation function', () => {
    let hookResult: any;
    
    const TestComponent: React.FC = () => {
      hookResult = useEnhancedErrorBoundary();
      return <div>Test</div>;
    };
    
    render(<TestComponent />);
    
    expect(hookResult.t).toBeInstanceOf(Function);
  });

  it('should throw errors programmatically', () => {
    let hookResult: any;
    
    const TestComponent: React.FC = () => {
      hookResult = useEnhancedErrorBoundary();
      return <div>Test</div>;
    };
    
    render(<TestComponent />);
    
    // Should throw string error
    expect(() => hookResult.throwError('Test string error')).toThrow('Test string error');
    
    // Should throw Error object
    const testError = new Error('Test Error object');
    expect(() => hookResult.throwError(testError)).toThrow('Test Error object');
  });
});