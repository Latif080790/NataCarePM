/**
 * PWA Install Prompt Component
 *
 * Features:
 * - Detects installability
 * - Shows install prompt UI
 * - Handles install events
 * - Tracks install analytics
 * - iOS-specific instructions
 * - Android-specific flow
 *
 * Usage:
 * ```tsx
 * <PWAInstallPrompt />
 * ```
 */

import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  delay?: number; // Delay before showing prompt (ms)
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  onInstall,
  onDismiss,
  delay = 5000,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Check if user has dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedAt = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissal = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);

    // Don't show if dismissed within last 7 days
    if (daysSinceDismissal < 7) {
      return;
    }

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('[PWA] beforeinstallprompt event fired');

      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Show prompt after delay
      setTimeout(() => {
        setShowPrompt(true);
      }, delay);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      setIsInstalled(true);
      setShowPrompt(false);
      onInstall?.();

      // Track analytics
      if ((window as any).gtag) {
        (window as any).gtag('event', 'pwa_installed', {
          event_category: 'PWA',
          event_label: 'App Installed',
        });
      }
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [delay, onInstall]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('[PWA] No install prompt available');
      return;
    }

    try {
      // Show install prompt
      await deferredPrompt.prompt();

      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] User choice:', outcome);

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');

        // Track analytics
        if ((window as any).gtag) {
          (window as any).gtag('event', 'pwa_install_accepted', {
            event_category: 'PWA',
            event_label: 'Install Accepted',
          });
        }
      } else {
        console.log('[PWA] User dismissed the install prompt');
        handleDismiss();
      }

      // Clear deferred prompt
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    onDismiss?.();

    // Track analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', 'pwa_install_dismissed', {
        event_category: 'PWA',
        event_label: 'Install Dismissed',
      });
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Don't show if not ready
  if (!showPrompt && !isIOS) {
    return null;
  }

  // iOS-specific instructions
  if (isIOS && showPrompt) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 shadow-2xl border-t border-slate-200 dark:border-slate-700 p-4 sm:p-6 animate-slide-up">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Install NataCarePM
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Get the app experience on your iPhone
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  To install on iOS:
                </p>
                <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    Tap the <strong>Share</strong> button
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z" />
                    </svg>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    Select <strong>"Add to Home Screen"</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    Tap <strong>"Add"</strong>
                  </li>
                </ol>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Works offline • Push notifications • Fast & reliable
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Android/Desktop install prompt
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 max-w-md animate-slide-up">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">Install NataCarePM</h3>
              <p className="text-white/90 text-sm">Get the full app experience</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <ul className="space-y-2 mb-4">
            <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <svg
                className="w-5 h-5 text-green-500 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Works offline
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <svg
                className="w-5 h-5 text-green-500 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Instant loading
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <svg
                className="w-5 h-5 text-green-500 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Push notifications
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <svg
                className="w-5 h-5 text-green-500 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Native app feel
            </li>
          </ul>

          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Install Now
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
