/**
 * 🔒 SESSION TIMEOUT HOOK
 * Automatically logs out users after 2 hours of inactivity
 * Tracks user activity (mouse, keyboard, scroll, touch events)
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Session timeout: 2 hours (in milliseconds)
const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours

// Activity check interval: 1 minute (in milliseconds)
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // 1 minute

// Warning time: 5 minutes before timeout (in milliseconds)
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes

// Local storage key for last activity timestamp
const LAST_ACTIVITY_KEY = 'lastActivity';

// Local storage key for session start timestamp
const SESSION_START_KEY = 'sessionStart';

export function useSessionTimeout() {
  const { logout, currentUser } = useAuth();
  const warningShownRef = useRef(false);
  const activityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Update last activity timestamp in localStorage
   */
  const updateActivity = useCallback(() => {
    if (currentUser) {
      const now = Date.now();
      localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());

      // Reset warning flag when user is active
      warningShownRef.current = false;

      // Set session start if not set
      if (!localStorage.getItem(SESSION_START_KEY)) {
        localStorage.setItem(SESSION_START_KEY, now.toString());
      }
    }
  }, [currentUser]);

  /**
   * Get time since last activity
   */
  const getTimeSinceLastActivity = useCallback((): number => {
    const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!lastActivityStr) return 0;

    const lastActivity = parseInt(lastActivityStr, 10);
    return Date.now() - lastActivity;
  }, []);

  /**
   * Get remaining session time
   */
  const getRemainingTime = useCallback((): number => {
    const timeSinceLastActivity = getTimeSinceLastActivity();
    return Math.max(0, SESSION_TIMEOUT - timeSinceLastActivity);
  }, [getTimeSinceLastActivity]);

  /**
   * Format milliseconds to human-readable time
   */
  const formatTime = useCallback((ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }, []);

  /**
   * Show warning before session expires
   */
  const showWarning = useCallback(() => {
    if (warningShownRef.current) return;

    const remainingTime = getRemainingTime();
    const remainingMinutes = Math.floor(remainingTime / 60000);

    const shouldContinue = window.confirm(
      `⚠️ Sesi Anda akan berakhir dalam ${remainingMinutes} menit!\n\n` +
        `Klik OK untuk melanjutkan sesi, atau Cancel untuk logout sekarang.`
    );

    if (shouldContinue) {
      // User wants to continue - update activity
      updateActivity();
      warningShownRef.current = false;
    } else {
      // User wants to logout
      handleLogout('User chose to logout from warning');
    }

    warningShownRef.current = true;
  }, [getRemainingTime, updateActivity]);

  /**
   * Handle logout due to timeout
   */
  const handleLogout = useCallback(
    (reason: string) => {
      console.log('🔒 Session timeout:', reason);

      // Clear session data
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      localStorage.removeItem(SESSION_START_KEY);

      // Show message to user
      alert(
        '🔒 Sesi Anda telah berakhir karena tidak ada aktivitas.\n\n' +
          'Silakan login kembali untuk melanjutkan.'
      );

      // Logout user
      logout();
    },
    [logout]
  );

  /**
   * Check for session timeout
   */
  const checkTimeout = useCallback(() => {
    if (!currentUser) return;

    const timeSinceLastActivity = getTimeSinceLastActivity();
    const remainingTime = SESSION_TIMEOUT - timeSinceLastActivity;

    // Session has expired
    if (timeSinceLastActivity >= SESSION_TIMEOUT) {
      handleLogout('Session expired due to inactivity');
      return;
    }

    // Show warning 5 minutes before timeout
    if (remainingTime <= WARNING_TIME && !warningShownRef.current) {
      showWarning();
    }

    // Log remaining time (for debugging)
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏰ Session remaining: ${formatTime(remainingTime)}`);
    }
  }, [currentUser, getTimeSinceLastActivity, handleLogout, showWarning, formatTime]);

  /**
   * Setup activity tracking and timeout checking
   */
  useEffect(() => {
    if (!currentUser) {
      // Clear session data when user logs out
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      localStorage.removeItem(SESSION_START_KEY);
      return;
    }

    // Initialize last activity timestamp
    updateActivity();

    // Activity events to track
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'focus',
    ];

    // Throttle activity updates to avoid excessive writes
    let activityTimeout: NodeJS.Timeout | null = null;
    const throttledUpdateActivity = () => {
      if (activityTimeout) return;

      activityTimeout = setTimeout(() => {
        updateActivity();
        activityTimeout = null;
      }, 5000); // Update at most once every 5 seconds
    };

    // Add event listeners for user activity
    activityEvents.forEach((event) => {
      window.addEventListener(event, throttledUpdateActivity, { passive: true });
    });

    // Start periodic timeout check
    activityCheckIntervalRef.current = setInterval(checkTimeout, ACTIVITY_CHECK_INTERVAL);

    // Cleanup function
    return () => {
      // Remove event listeners
      activityEvents.forEach((event) => {
        window.removeEventListener(event, throttledUpdateActivity);
      });

      // Clear interval
      if (activityCheckIntervalRef.current) {
        clearInterval(activityCheckIntervalRef.current);
      }

      // Clear activity timeout
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
    };
  }, [currentUser, updateActivity, checkTimeout]);

  /**
   * Return session info (for debugging/display)
   */
  return {
    isActive: !!currentUser,
    remainingTime: getRemainingTime(),
    sessionTimeout: SESSION_TIMEOUT,
    updateActivity,
  };
}

/**
 * Hook to display session info (optional)
 */
export function useSessionInfo() {
  const { isActive, remainingTime, sessionTimeout } = useSessionTimeout();

  const formatTime = (ms: number): string => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  return {
    isActive,
    remainingTime: formatTime(remainingTime),
    sessionDuration: formatTime(sessionTimeout),
    percentRemaining: (remainingTime / sessionTimeout) * 100,
  };
}
