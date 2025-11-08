/**
 * 🧪 TDD Feature 3: Session Timeout Warning Integration Tests
 * 
 * RED PHASE - Write Failing Tests First
 * 
 * User Story:
 * As a logged-in user, I want to receive a warning before my session expires
 * so that I can extend my session and avoid losing unsaved work.
 * 
 * Features to test:
 * 1. Warning modal appears 5 minutes before timeout
 * 2. Countdown timer displays remaining time
 * 3. "Extend Session" button refreshes the session
 * 4. "Logout Now" button logs user out immediately
 * 5. Auto-logout after countdown reaches zero
 * 6. Modal dismissal extends session
 * 7. User activity detection (keyboard/mouse)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SessionTimeoutWarning from '@/components/SessionTimeoutWarning';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Mock timers for testing
vi.useFakeTimers();

describe('Session Timeout Warning', () => {
  // ==========================================
  // 1. WARNING MODAL DISPLAY
  // ==========================================
  describe('Warning Modal Display', () => {
    it('should show warning modal 5 minutes before session timeout', async () => {
      const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
      const WARNING_TIME = 5 * 60 * 1000; // 5 minutes
      
      render(
        <AuthProvider>
          <SessionTimeoutWarning 
            sessionDuration={SESSION_DURATION}
            warningTime={WARNING_TIME}
          />
        </AuthProvider>
      );

      // Fast-forward to warning time (25 minutes)
      act(() => {
        vi.advanceTimersByTime(SESSION_DURATION - WARNING_TIME);
      });

      // Modal should now be visible
      await waitFor(() => {
        expect(screen.getByTestId('session-timeout-modal')).toBeInTheDocument();
      });

      expect(screen.getByText(/sesi anda akan berakhir/i)).toBeInTheDocument();
    });

    it('should not show modal before warning time', () => {
      const SESSION_DURATION = 30 * 60 * 1000;
      const WARNING_TIME = 5 * 60 * 1000;
      
      render(
        <AuthProvider>
          <SessionTimeoutWarning 
            sessionDuration={SESSION_DURATION}
            warningTime={WARNING_TIME}
          />
        </AuthProvider>
      );

      // Fast-forward to 10 minutes (before warning time)
      act(() => {
        vi.advanceTimersByTime(10 * 60 * 1000);
      });

      // Modal should NOT be visible
      expect(screen.queryByTestId('session-timeout-modal')).not.toBeInTheDocument();
    });

    it('should display session timeout icon', async () => {
      const SESSION_DURATION = 30 * 60 * 1000;
      const WARNING_TIME = 5 * 60 * 1000;
      
      render(
        <AuthProvider>
          <SessionTimeoutWarning 
            sessionDuration={SESSION_DURATION}
            warningTime={WARNING_TIME}
          />
        </AuthProvider>
      );

      act(() => {
        vi.advanceTimersByTime(SESSION_DURATION - WARNING_TIME);
      });

      await waitFor(() => {
        expect(screen.getByTestId('timeout-warning-icon')).toBeInTheDocument();
      });
    });
  });

  // ==========================================
  // 2. COUNTDOWN TIMER
  // ==========================================
  describe('Countdown Timer', () => {
    it('should display countdown timer with minutes and seconds', async () => {
      const SESSION_DURATION = 30 * 60 * 1000;
      const WARNING_TIME = 5 * 60 * 1000;
      
      render(
        <AuthProvider>
          <SessionTimeoutWarning 
            sessionDuration={SESSION_DURATION}
            warningTime={WARNING_TIME}
          />
        </AuthProvider>
      );

      act(() => {
        vi.advanceTimersByTime(SESSION_DURATION - WARNING_TIME);
      });

      // Should show 5:00 (5 minutes, 0 seconds)
      await waitFor(() => {
        expect(screen.getByTestId('countdown-timer')).toHaveTextContent('5:00');
      });
    });

    it('should countdown every second', async () => {
      const SESSION_DURATION = 30 * 60 * 1000;
      const WARNING_TIME = 5 * 60 * 1000;
      
      render(
        <AuthProvider>
          <SessionTimeoutWarning 
            sessionDuration={SESSION_DURATION}
            warningTime={WARNING_TIME}
          />
        </AuthProvider>
      );

      act(() => {
        vi.advanceTimersByTime(SESSION_DURATION - WARNING_TIME);
      });

      await waitFor(() => {
        expect(screen.getByTestId('countdown-timer')).toHaveTextContent('5:00');
      });

      // Advance 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByTestId('countdown-timer')).toHaveTextContent('4:59');
      });

      // Advance 59 more seconds (1 minute total)
      act(() => {
        vi.advanceTimersByTime(59 * 1000);
      });

      await waitFor(() => {
        expect(screen.getByTestId('countdown-timer')).toHaveTextContent('4:00');
      });
    });

    it('should format timer correctly (MM:SS)', async () => {
      const SESSION_DURATION = 30 * 60 * 1000;
      const WARNING_TIME = 90 * 1000; // 1:30
      
      render(
        <AuthProvider>
          <SessionTimeoutWarning 
            sessionDuration={SESSION_DURATION}
            warningTime={WARNING_TIME}
          />
        </AuthProvider>
      );

      act(() => {
        vi.advanceTimersByTime(SESSION_DURATION - WARNING_TIME);
      });

      await waitFor(() => {
        expect(screen.getByTestId('countdown-timer')).toHaveTextContent('1:30');
      });
    });

    it('should show red color when time is low (<1 minute)', async () => {
      const SESSION_DURATION = 30 * 60 * 1000;
      const WARNING_TIME = 45 * 1000; // 45 seconds
      
      render(
        <AuthProvider>
          <SessionTimeoutWarning 
            sessionDuration={SESSION_DURATION}
            warningTime={WARNING_TIME}
          />
        </AuthProvider>
      );

      act(() => {
        vi.advanceTimersByTime(SESSION_DURATION - WARNING_TIME);
      });

      await waitFor(() => {
        const timer = screen.getByTestId('countdown-timer');
        expect(timer).toHaveClass('text-red-600');
      });
    });
  });

  // ==========================================
  // 3. EXTEND SESSION ACTION
  // ==========================================
  describe('Extend Session', () => {
    it('should have "Extend Session" button', async () => {
      const SESSION_DURATION = 30 * 60 * 1000;
      const WARNING_TIME = 5 * 60 * 1000;
      
      render(
        <AuthProvider>
          <SessionTimeoutWarning 
            sessionDuration={SESSION_DURATION}
            warningTime={WARNING_TIME}
          />
        </AuthProvider>
      );

      act(() => {
        vi.advanceTimersByTime(SESSION_DURATION - WARNING_TIME);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /perpanjang sesi/i })).toBeInTheDocument();
      });
    });

    it('should close modal when "Extend Session" is clicked', async () => {
      const SESSION_DURATION = 30 * 60 * 1000;
      const WARNING_TIME = 5 * 60 * 1000;
      
      render(
        <AuthProvider>
          <SessionTimeoutWarning 
            sessionDuration={SESSION_DURATION}
            warningTime={WARNING_TIME}
          />
        </AuthProvider>
      );

      act(() => {
        vi.advanceTimersByTime(SESSION_DURATION - WARNING_TIME);
      });

      await waitFor(() => {
        expect(screen.getByTestId('session-timeout-modal')).toBeInTheDocument();
      });

      // Click extend button
      const extendButton = screen.getByRole('button', { name: /perpanjang sesi/i });
      fireEvent.click(extendButton);

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByTestId('session-timeout-modal')).not.toBeInTheDocument();
      });
    });

    it('should reset timer when session is extended', async () => {
      const SESSION_DURATION = 30 * 60 * 1000;
      const WARNING_TIME = 5 * 60 * 1000;
      
      render(
        <AuthProvider>
          <SessionTimeoutWarning 
            sessionDuration={SESSION_DURATION}
            warningTime={WARNING_TIME}
          />
        </AuthProvider>
      );

      // Trigger warning
      act(() => {
        vi.advanceTimersByTime(SESSION_DURATION - WARNING_TIME);
      });

      await waitFor(() => {
        expect(screen.getByTestId('session-timeout-modal')).toBeInTheDocument();
      });

      // Extend session
      fireEvent.click(screen.getByRole('button', { name: /perpanjang sesi/i }));

      // Modal closes
      await waitFor(() => {
        expect(screen.queryByTestId('session-timeout-modal')).not.toBeInTheDocument();
      });

      // Should NOT show modal again for another 25 minutes
      act(() => {
        vi.advanceTimersByTime(24 * 60 * 1000);
      });

      expect(screen.queryByTestId('session-timeout-modal')).not.toBeInTheDocument();
    });

    it('should call onExtend callback when provided', async () => {
      const SESSION_DURATION = 30 * 60 * 1000;
      const WARNING_TIME = 5 * 60 * 1000;
      const onExtend = vi.fn();
      
      render(
        <AuthProvider>
          <SessionTimeoutWarning 
            sessionDuration={SESSION_DURATION}
            warningTime={WARNING_TIME}
            onExtend={onExtend}
          />
        </AuthProvider>
      );

      act(() => {
        vi.advanceTimersByTime(SESSION_DURATION - WARNING_TIME);
      });

      await waitFor(() => {
        expect(screen.getByTestId('session-timeout-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /perpanjang sesi/i }));

      expect(onExtend).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================
  // 4. LOGOUT ACTION
  // ==========================================
  describe('Logout Action', () => {
    it('should have "Logout Now" button', async () => {
      const SESSION_DURATION = 30 * 60 * 1000;
      const WARNING_TIME = 5 * 60 * 1000;
      
      render(
        <AuthProvider>
          <SessionTimeoutWarning 
            sessionDuration={SESSION_DURATION}
            warningTime={WARNING_TIME}
          />
        </AuthProvider>
      );

      act(() => {
        vi.advanceTimersByTime(SESSION_DURATION - WARNING_TIME);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /keluar sekarang/i })).toBeInTheDocument();
      });
    });

    it('should call logout when "Logout Now" is clicked', async () => {
      const SESSION_DURATION = 30 * 60 * 1000;
      const WARNING_TIME = 5 * 60 * 1000;
      const onLogout = vi.fn();
      
      render(
        <AuthProvider>
          <SessionTimeoutWarning 
            sessionDuration={SESSION_DURATION}
            warningTime={WARNING_TIME}
            onLogout={onLogout}
          />
        </AuthProvider>
      );

      act(() => {
        vi.advanceTimersByTime(SESSION_DURATION - WARNING_TIME);
      });

      await waitFor(() => {
        expect(screen.getByTestId('session-timeout-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /keluar sekarang/i }));

      expect(onLogout).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================
  // 5. AUTO-LOGOUT
  // ==========================================
  describe('Auto-Logout', () => {
    it('should automatically logout when countdown reaches zero', async () => {
      const SESSION_DURATION = 30 * 60 * 1000;
      const WARNING_TIME = 5 * 1000; // 5 seconds for faster test
      const onLogout = vi.fn();
      
      render(
        <AuthProvider>
          <SessionTimeoutWarning 
            sessionDuration={SESSION_DURATION}
            warningTime={WARNING_TIME}
            onLogout={onLogout}
          />
        </AuthProvider>
      );

      // Trigger warning
      act(() => {
        vi.advanceTimersByTime(SESSION_DURATION - WARNING_TIME);
      });

      await waitFor(() => {
        expect(screen.getByTestId('session-timeout-modal')).toBeInTheDocument();
      });

      // Wait for countdown to reach zero
      act(() => {
        vi.advanceTimersByTime(WARNING_TIME);
      });

      // Should auto-logout
      await waitFor(() => {
        expect(onLogout).toHaveBeenCalledTimes(1);
      });
    });

    it('should display "Session Expired" message on auto-logout', async () => {
      const SESSION_DURATION = 30 * 60 * 1000;
      const WARNING_TIME = 5 * 1000;
      
      render(
        <AuthProvider>
          <SessionTimeoutWarning 
            sessionDuration={SESSION_DURATION}
            warningTime={WARNING_TIME}
          />
        </AuthProvider>
      );

      act(() => {
        vi.advanceTimersByTime(SESSION_DURATION - WARNING_TIME);
      });

      await waitFor(() => {
        expect(screen.getByTestId('session-timeout-modal')).toBeInTheDocument();
      });

      // Let countdown reach zero
      act(() => {
        vi.advanceTimersByTime(WARNING_TIME);
      });

      // Should show expired message
      await waitFor(() => {
        expect(screen.getByText(/sesi telah berakhir/i)).toBeInTheDocument();
      });
    });
  });

  // ==========================================
  // 6. USER ACTIVITY DETECTION
  // ==========================================
  describe('Activity Detection', () => {
    it('should reset timer on mouse movement', async () => {
      const SESSION_DURATION = 30 * 60 * 1000;
      const WARNING_TIME = 5 * 60 * 1000;
      
      render(
        <AuthProvider>
          <SessionTimeoutWarning 
            sessionDuration={SESSION_DURATION}
            warningTime={WARNING_TIME}
            detectActivity={true}
          />
        </AuthProvider>
      );

      // Fast-forward close to warning time
      act(() => {
        vi.advanceTimersByTime(SESSION_DURATION - WARNING_TIME - 1000);
      });

      // Simulate mouse movement
      act(() => {
        fireEvent.mouseMove(document);
      });

      // Advance past original warning time
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Modal should NOT appear (timer was reset)
      expect(screen.queryByTestId('session-timeout-modal')).not.toBeInTheDocument();
    });

    it('should reset timer on keyboard activity', async () => {
      const SESSION_DURATION = 30 * 60 * 1000;
      const WARNING_TIME = 5 * 60 * 1000;
      
      render(
        <AuthProvider>
          <SessionTimeoutWarning 
            sessionDuration={SESSION_DURATION}
            warningTime={WARNING_TIME}
            detectActivity={true}
          />
        </AuthProvider>
      );

      act(() => {
        vi.advanceTimersByTime(SESSION_DURATION - WARNING_TIME - 1000);
      });

      // Simulate keyboard activity
      act(() => {
        fireEvent.keyDown(document);
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.queryByTestId('session-timeout-modal')).not.toBeInTheDocument();
    });

    it('should reset timer on click activity', async () => {
      const SESSION_DURATION = 30 * 60 * 1000;
      const WARNING_TIME = 5 * 60 * 1000;
      
      render(
        <AuthProvider>
          <SessionTimeoutWarning 
            sessionDuration={SESSION_DURATION}
            warningTime={WARNING_TIME}
            detectActivity={true}
          />
        </AuthProvider>
      );

      act(() => {
        vi.advanceTimersByTime(SESSION_DURATION - WARNING_TIME - 1000);
      });

      // Simulate click
      act(() => {
        fireEvent.click(document);
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.queryByTestId('session-timeout-modal')).not.toBeInTheDocument();
    });
  });

  // ==========================================
  // 7. EDGE CASES & ERROR HANDLING
  // ==========================================
  describe('Edge Cases', () => {
    it('should handle multiple extend actions gracefully', async () => {
      const SESSION_DURATION = 30 * 60 * 1000;
      const WARNING_TIME = 5 * 60 * 1000;
      
      render(
        <AuthProvider>
          <SessionTimeoutWarning 
            sessionDuration={SESSION_DURATION}
            warningTime={WARNING_TIME}
          />
        </AuthProvider>
      );

      // Trigger warning multiple times
      for (let i = 0; i < 3; i++) {
        act(() => {
          vi.advanceTimersByTime(SESSION_DURATION - WARNING_TIME);
        });

        await waitFor(() => {
          expect(screen.getByTestId('session-timeout-modal')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /perpanjang sesi/i }));

        await waitFor(() => {
          expect(screen.queryByTestId('session-timeout-modal')).not.toBeInTheDocument();
        });
      }

      // Should handle all extends without errors
      expect(screen.queryByTestId('session-timeout-modal')).not.toBeInTheDocument();
    });

    it('should cleanup timers on unmount', () => {
      const SESSION_DURATION = 30 * 60 * 1000;
      const WARNING_TIME = 5 * 60 * 1000;
      
      const { unmount } = render(
        <AuthProvider>
          <SessionTimeoutWarning 
            sessionDuration={SESSION_DURATION}
            warningTime={WARNING_TIME}
          />
        </AuthProvider>
      );

      // Unmount component
      unmount();

      // Advance time - should not cause errors
      expect(() => {
        act(() => {
          vi.advanceTimersByTime(SESSION_DURATION);
        });
      }).not.toThrow();
    });

    it('should handle custom session durations', async () => {
      const SESSION_DURATION = 10 * 60 * 1000; // 10 minutes
      const WARNING_TIME = 2 * 60 * 1000; // 2 minutes
      
      render(
        <AuthProvider>
          <SessionTimeoutWarning 
            sessionDuration={SESSION_DURATION}
            warningTime={WARNING_TIME}
          />
        </AuthProvider>
      );

      act(() => {
        vi.advanceTimersByTime(SESSION_DURATION - WARNING_TIME);
      });

      await waitFor(() => {
        expect(screen.getByTestId('countdown-timer')).toHaveTextContent('2:00');
      });
    });
  });
});
