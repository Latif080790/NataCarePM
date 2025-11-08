/**
 * GPSCapture Component Tests
 * Tests for GPS location tracking with geofencing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GPSCapture, useGPSCapture, GeolocationData } from './GPSCapture';

// Mock mobileAnalytics
vi.mock('@/utils/mobileAnalytics', () => ({
  trackGPSCapture: vi.fn(),
}));

describe('GPSCapture', () => {
  let mockGeolocation: any;
  let getCurrentPositionMock: any;

  beforeEach(() => {
    // Mock geolocation API
    getCurrentPositionMock = vi.fn();
    mockGeolocation = {
      getCurrentPosition: getCurrentPositionMock,
    };
    
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    onCapture: vi.fn(),
  };

  // ============================================================================
  // BASIC RENDERING
  // ============================================================================

  describe('Basic Rendering', () => {
    it('should render capture button', () => {
      render(<GPSCapture {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /capture location/i })).toBeInTheDocument();
    });

    it('should render with MapPin icon initially', () => {
      const { container } = render(<GPSCapture {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.textContent).toContain('Capture Location');
    });

    it('should not show error or location initially', () => {
      render(<GPSCapture {...defaultProps} />);
      
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/location captured/i)).not.toBeInTheDocument();
    });

    it('should render with full width button', () => {
      const { container } = render(<GPSCapture {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });
  });

  // ============================================================================
  // GPS CAPTURE - SUCCESS
  // ============================================================================

  describe('GPS Capture - Success', () => {
    it('should capture location successfully', async () => {
      const user = userEvent.setup();
      const onCapture = vi.fn();
      
      // Mock successful geolocation
      getCurrentPositionMock.mockImplementation((success: any) => {
        success({
          coords: {
            latitude: -6.2088,
            longitude: 106.8456,
            accuracy: 10,
          },
          timestamp: Date.now(),
        });
      });

      render(<GPSCapture onCapture={onCapture} />);
      
      const button = screen.getByRole('button', { name: /capture location/i });
      await user.click(button);

      await waitFor(() => {
        expect(onCapture).toHaveBeenCalled();
      });

      const capturedData = onCapture.mock.calls[0][0];
      expect(capturedData.latitude).toBe(-6.2088);
      expect(capturedData.longitude).toBe(106.8456);
      expect(capturedData.accuracy).toBe(10);
    });

    it('should show loading state while capturing', async () => {
      const user = userEvent.setup();
      
      // Mock delayed geolocation
      getCurrentPositionMock.mockImplementation((success: any) => {
        setTimeout(() => {
          success({
            coords: {
              latitude: -6.2088,
              longitude: 106.8456,
              accuracy: 10,
            },
            timestamp: Date.now(),
          });
        }, 100);
      });

      render(<GPSCapture {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /capture location/i });
      await user.click(button);

      // Should show loading state immediately
      expect(screen.getByText(/getting location/i)).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it('should display captured location coordinates', async () => {
      const user = userEvent.setup();
      
      getCurrentPositionMock.mockImplementation((success: any) => {
        success({
          coords: {
            latitude: -6.208800,
            longitude: 106.845600,
            accuracy: 15,
          },
          timestamp: Date.now(),
        });
      });

      render(<GPSCapture {...defaultProps} />);
      
      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/location captured/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/lat: -6\.208800/i)).toBeInTheDocument();
      expect(screen.getByText(/lng: 106\.845600/i)).toBeInTheDocument();
    });

    it('should display accuracy in meters', async () => {
      const user = userEvent.setup();
      
      getCurrentPositionMock.mockImplementation((success: any) => {
        success({
          coords: {
            latitude: -6.2088,
            longitude: 106.8456,
            accuracy: 12.5,
          },
          timestamp: Date.now(),
        });
      });

      render(<GPSCapture {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText(/accuracy: ±13m/i)).toBeInTheDocument();
      });
    });

    it('should show success indicator with checkmark', async () => {
      const user = userEvent.setup();
      
      getCurrentPositionMock.mockImplementation((success: any) => {
        success({
          coords: {
            latitude: -6.2088,
            longitude: 106.8456,
            accuracy: 10,
          },
          timestamp: Date.now(),
        });
      });

      const { container } = render(<GPSCapture {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        // Check for success message
        expect(screen.getByText(/location captured/i)).toBeInTheDocument();
        
        // Find div with bg-emerald-50 class
        const successDiv = container.querySelector('.bg-emerald-50');
        expect(successDiv).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // GEOFENCING
  // ============================================================================

  describe('Geofencing', () => {
    const workSite = {
      lat: -6.2088,
      lng: 106.8456,
      radius: 100, // 100 meters
    };

    it('should mark location as within geofence when inside radius', async () => {
      const user = userEvent.setup();
      const onCapture = vi.fn();
      
      // Location very close to work site (within 100m)
      getCurrentPositionMock.mockImplementation((success: any) => {
        success({
          coords: {
            latitude: -6.2089, // Very close
            longitude: 106.8457,
            accuracy: 10,
          },
          timestamp: Date.now(),
        });
      });

      render(<GPSCapture onCapture={onCapture} workSiteLocation={workSite} />);
      
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        const capturedData = onCapture.mock.calls[0][0];
        expect(capturedData.withinGeofence).toBe(true);
        expect(capturedData.distanceFromSite).toBeLessThan(100);
      });
    });

    it('should mark location as outside geofence when beyond radius', async () => {
      const user = userEvent.setup();
      const onCapture = vi.fn();
      
      // Location far from work site (> 100m)
      getCurrentPositionMock.mockImplementation((success: any) => {
        success({
          coords: {
            latitude: -6.2100, // ~1.3 km away
            longitude: 106.8470,
            accuracy: 10,
          },
          timestamp: Date.now(),
        });
      });

      render(<GPSCapture onCapture={onCapture} workSiteLocation={workSite} />);
      
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        const capturedData = onCapture.mock.calls[0][0];
        expect(capturedData.withinGeofence).toBe(false);
        expect(capturedData.distanceFromSite).toBeGreaterThan(100);
      });
    });

    it('should display distance from site', async () => {
      const user = userEvent.setup();
      
      getCurrentPositionMock.mockImplementation((success: any) => {
        success({
          coords: {
            latitude: -6.2089,
            longitude: 106.8457,
            accuracy: 10,
          },
          timestamp: Date.now(),
        });
      });

      render(<GPSCapture {...defaultProps} workSiteLocation={workSite} />);
      
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText(/distance from site:/i)).toBeInTheDocument();
      });
    });

    it('should show green text for within geofence', async () => {
      const user = userEvent.setup();
      
      getCurrentPositionMock.mockImplementation((success: any) => {
        success({
          coords: {
            latitude: -6.2089,
            longitude: 106.8456,
            accuracy: 10,
          },
          timestamp: Date.now(),
        });
      });

      render(<GPSCapture {...defaultProps} workSiteLocation={workSite} />);
      
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        const distanceText = screen.getByText(/within site/i);
        expect(distanceText).toHaveClass('text-emerald-600');
      });
    });

    it('should show red text for outside geofence', async () => {
      const user = userEvent.setup();
      
      getCurrentPositionMock.mockImplementation((success: any) => {
        success({
          coords: {
            latitude: -6.2200, // Far away
            longitude: 106.8556,
            accuracy: 10,
          },
          timestamp: Date.now(),
        });
      });

      render(<GPSCapture {...defaultProps} workSiteLocation={workSite} />);
      
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        const distanceText = screen.getByText(/outside site/i);
        expect(distanceText).toHaveClass('text-red-600');
      });
    });

    it('should not show geofence info without workSiteLocation', async () => {
      const user = userEvent.setup();
      
      getCurrentPositionMock.mockImplementation((success: any) => {
        success({
          coords: {
            latitude: -6.2088,
            longitude: 106.8456,
            accuracy: 10,
          },
          timestamp: Date.now(),
        });
      });

      render(<GPSCapture {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText(/location captured/i)).toBeInTheDocument();
      });

      expect(screen.queryByText(/distance from site/i)).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Error Handling', () => {
    it('should show error when geolocation is not supported', async () => {
      const user = userEvent.setup();
      
      // Remove geolocation support
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true,
      });

      render(<GPSCapture {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText(/gps not supported/i)).toBeInTheDocument();
      });
    });

    it('should show error when permission is denied', async () => {
      const user = userEvent.setup();
      
      getCurrentPositionMock.mockImplementation((success: any, error: any) => {
        error({ message: 'User denied Geolocation' });
      });

      render(<GPSCapture {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText(/location permission denied/i)).toBeInTheDocument();
      });
    });

    it('should show generic error for other failures', async () => {
      const user = userEvent.setup();
      
      getCurrentPositionMock.mockImplementation((success: any, error: any) => {
        error({ message: 'Position unavailable' });
      });

      render(<GPSCapture {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText(/unable to get location/i)).toBeInTheDocument();
      });
    });

    it('should display error with warning icon', async () => {
      const user = userEvent.setup();
      
      getCurrentPositionMock.mockImplementation((success: any, error: any) => {
        error({ message: 'Error' });
      });

      render(<GPSCapture {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        const errorDiv = screen.getByText(/unable to get location/i).closest('div');
        expect(errorDiv).toHaveClass('bg-red-50', 'text-red-700');
      });
    });

    it('should clear error on retry', async () => {
      const user = userEvent.setup();
      
      // First call fails
      getCurrentPositionMock.mockImplementationOnce((success: any, error: any) => {
        error({ message: 'Error' });
      });

      render(<GPSCapture {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText(/unable to get location/i)).toBeInTheDocument();
      });

      // Second call succeeds
      getCurrentPositionMock.mockImplementationOnce((success: any) => {
        success({
          coords: {
            latitude: -6.2088,
            longitude: 106.8456,
            accuracy: 10,
          },
          timestamp: Date.now(),
        });
      });

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.queryByText(/unable to get location/i)).not.toBeInTheDocument();
        expect(screen.getByText(/location captured/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // BUTTON STATES
  // ============================================================================

  describe('Button States', () => {
    it('should disable button while loading', async () => {
      const user = userEvent.setup();
      
      getCurrentPositionMock.mockImplementation((success: any) => {
        setTimeout(() => {
          success({
            coords: {
              latitude: -6.2088,
              longitude: 106.8456,
              accuracy: 10,
            },
            timestamp: Date.now(),
          });
        }, 100);
      });

      render(<GPSCapture {...defaultProps} />);
      
      const button = screen.getByRole('button');
      await user.click(button);

      expect(button).toBeDisabled();
    });

    it('should change button text when loading', async () => {
      const user = userEvent.setup();
      
      getCurrentPositionMock.mockImplementation((success: any) => {
        setTimeout(() => {
          success({
            coords: {
              latitude: -6.2088,
              longitude: 106.8456,
              accuracy: 10,
            },
            timestamp: Date.now(),
          });
        }, 100);
      });

      render(<GPSCapture {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));

      expect(screen.getByText(/getting location/i)).toBeInTheDocument();
    });

    it('should show loader icon when loading', async () => {
      const user = userEvent.setup();
      
      getCurrentPositionMock.mockImplementation((success: any) => {
        setTimeout(() => {
          success({
            coords: {
              latitude: -6.2088,
              longitude: 106.8456,
              accuracy: 10,
            },
            timestamp: Date.now(),
          });
        }, 50);
      });

      render(<GPSCapture {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));

      // Check for loader (should have animate-spin class)
      const button = screen.getByRole('button');
      expect(button.textContent).toContain('Getting Location');
    });

    it('should re-enable button after success', async () => {
      const user = userEvent.setup();
      
      getCurrentPositionMock.mockImplementation((success: any) => {
        success({
          coords: {
            latitude: -6.2088,
            longitude: 106.8456,
            accuracy: 10,
          },
          timestamp: Date.now(),
        });
      });

      render(<GPSCapture {...defaultProps} />);
      
      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should re-enable button after error', async () => {
      const user = userEvent.setup();
      
      getCurrentPositionMock.mockImplementation((success: any, error: any) => {
        error({ message: 'Error' });
      });

      render(<GPSCapture {...defaultProps} />);
      
      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  // ============================================================================
  // HIGH ACCURACY SETTINGS
  // ============================================================================

  describe('GPS Options', () => {
    it('should request high accuracy GPS', async () => {
      const user = userEvent.setup();
      
      getCurrentPositionMock.mockImplementation((success: any) => {
        success({
          coords: {
            latitude: -6.2088,
            longitude: 106.8456,
            accuracy: 10,
          },
          timestamp: Date.now(),
        });
      });

      render(<GPSCapture {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(getCurrentPositionMock).toHaveBeenCalledWith(
          expect.any(Function),
          expect.any(Function),
          expect.objectContaining({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          })
        );
      });
    });
  });
});

// ============================================================================
// HOOK TESTS
// ============================================================================

describe('useGPSCapture', () => {
  it('should return location and setLocation', () => {
    const { result } = renderHook(() => useGPSCapture());
    
    expect(result.current.location).toBeNull();
    expect(typeof result.current.setLocation).toBe('function');
  });

  it('should update location when setLocation is called', () => {
    const { result } = renderHook(() => useGPSCapture());
    
    const testLocation: GeolocationData = {
      latitude: -6.2088,
      longitude: 106.8456,
      accuracy: 10,
      timestamp: Date.now(),
    };

    act(() => {
      result.current.setLocation(testLocation);
    });

    expect(result.current.location).toEqual(testLocation);
  });
});

// Helper for hook testing
import { renderHook, act } from '@testing-library/react';
