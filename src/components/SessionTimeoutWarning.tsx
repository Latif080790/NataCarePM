/**
 * ⏱️ Session Timeout Warning Component
 * 
 * Displays a modal warning when user session is about to expire
 * - Countdown timer showing remaining time
 * - Extend session button
 * - Logout button
 * - Auto-logout when timer reaches zero
 * - Activity detection (mouse, keyboard, click)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Modal } from '@/components/Modal';

interface SessionTimeoutWarningProps {
  sessionDuration?: number; // Total session duration in milliseconds (default: 30 min)
  warningTime?: number; // Show warning this many ms before timeout (default: 5 min)
  onExtend?: () => void;
  onLogout?: () => void;
  detectActivity?: boolean; // Auto-reset timer on user activity
}

const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  sessionDuration = 30 * 60 * 1000, // 30 minutes
  warningTime = 5 * 60 * 1000, // 5 minutes
  onExtend,
  onLogout,
  detectActivity = false,
}) => {
  const { logout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(warningTime);
  const [sessionExpired, setSessionExpired] = useState(false);
  
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  /**
   * Format time in MM:SS format
   */
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  /**
   * Handle logout
   */
  const handleLogout = useCallback(async () => {
    if (onLogout) {
      onLogout();
    } else {
      await logout();
    }
  }, [onLogout, logout]);

  /**
   * Show warning modal
   */
  const showWarning = useCallback(() => {
    setShowModal(true);
    setTimeRemaining(warningTime);
    setSessionExpired(false);
  }, [warningTime]);

  /**
   * Start countdown from warning time to zero
   */
  const startCountdown = useCallback(() => {
    let remaining = warningTime;
    setTimeRemaining(remaining);
    
    countdownTimerRef.current = setInterval(() => {
      remaining -= 1000;
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        // Auto-logout
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }
        setSessionExpired(true);
        handleLogout();
      }
    }, 1000);
  }, [warningTime, handleLogout]);

  /**
   * Reset session timer
   */
  const resetSessionTimer = useCallback(() => {
    // Clear existing timers
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    // Update last activity
    lastActivityRef.current = Date.now();

    // Close modal if open
    setShowModal(false);
    setSessionExpired(false);

    // Start new session timer
    sessionTimerRef.current = setTimeout(() => {
      showWarning();
      startCountdown();
    }, sessionDuration - warningTime);
  }, [sessionDuration, warningTime, showWarning, startCountdown]);

  /**
   * Handle extend session
   */
  const handleExtend = useCallback(() => {
    if (onExtend) {
      onExtend();
    }
    resetSessionTimer();
  }, [onExtend, resetSessionTimer]);

  /**
   * Handle user activity (mouse, keyboard, click)
   */
  const handleActivity = useCallback(() => {
    if (!detectActivity) return;
    
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    // Only reset if more than 1 minute since last activity
    // Prevents excessive timer resets
    if (timeSinceLastActivity > 60 * 1000) {
      resetSessionTimer();
    }
  }, [detectActivity, resetSessionTimer]);

  /**
   * Initialize session timer on mount
   */
  useEffect(() => {
    resetSessionTimer();

    // Activity listeners
    if (detectActivity) {
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('keydown', handleActivity);
      window.addEventListener('click', handleActivity);
    }

    // Cleanup on unmount
    return () => {
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      if (detectActivity) {
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        window.removeEventListener('click', handleActivity);
      }
    };
  }, [resetSessionTimer, detectActivity, handleActivity]);

  /**
   * Determine timer color based on remaining time
   */
  const getTimerColor = (): string => {
    if (timeRemaining < 60 * 1000) {
      return 'text-red-600'; // < 1 minute: red
    } else if (timeRemaining < 2 * 60 * 1000) {
      return 'text-yellow-600'; // < 2 minutes: yellow
    }
    return 'text-gray-900'; // > 2 minutes: normal
  };

  if (!showModal) {
    return null;
  }

  return (
    <div data-testid="session-timeout-modal">
      <Modal
        isOpen={showModal}
        onClose={() => {}} // Prevent closing by clicking outside
        title={sessionExpired ? 'Sesi Telah Berakhir' : 'Peringatan Sesi'}
      >
        <div className="session-timeout-content p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <span 
              data-testid="timeout-warning-icon"
              className="text-6xl"
            >
              {sessionExpired ? '🔒' : '⏰'}
            </span>
          </div>

          {/* Message */}
          <div className="text-center mb-6">
            {sessionExpired ? (
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Sesi Telah Berakhir
                </p>
                <p className="text-sm text-gray-600">
                  Anda akan diarahkan ke halaman login.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Sesi Anda Akan Berakhir
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Sesi Anda akan berakhir dalam waktu:
                </p>

                {/* Countdown Timer */}
                <div 
                  data-testid="countdown-timer"
                  className={`text-5xl font-bold ${getTimerColor()} mb-4`}
                >
                  {formatTime(timeRemaining)}
                </div>

                <p className="text-sm text-gray-600">
                  Klik "Perpanjang Sesi" untuk melanjutkan bekerja.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!sessionExpired && (
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleExtend}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Perpanjang Sesi
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors"
              >
                Keluar Sekarang
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SessionTimeoutWarning;

