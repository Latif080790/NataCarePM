import React, { useState, useEffect, useRef, useCallback } from 'react';

import { useRealtimeCollaboration } from '@/contexts/CollaborationContext';
import { useAuth } from '@/contexts/AuthContext.minimal';

interface LiveCursorsProps {
  containerId?: string;
  showLabels?: boolean;
  /** Enable cursor tracking (disable for performance) */
  enabled?: boolean;
}

interface CursorPosition {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
  timestamp: number;
}

export default function LiveCursors({
  containerId = 'app-container',
  showLabels = true,
  enabled = true,
}: LiveCursorsProps) {
  const { onlineUsers, updatePresence } = useRealtimeCollaboration();
  const { currentUser } = useAuth();
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const [isContainerReady, setIsContainerReady] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  // Throttle cursor updates to avoid overwhelming the database
  const throttleDelay = 100; // 100ms

  // Safe DOM element access with retry
  const getContainerElement = useCallback((): HTMLElement | null => {
    if (typeof document === 'undefined') return null;
    
    try {
      return document.getElementById(containerId) || document.body;
    } catch {
      return null;
    }
  }, [containerId]);

  // Initialize container with MutationObserver for dynamic DOM
  useEffect(() => {
    if (!enabled) return;
    
    isMountedRef.current = true;
    
    const initializeContainer = () => {
      const container = getContainerElement();
      if (container && isMountedRef.current) {
        containerRef.current = container;
        setIsContainerReady(true);
      }
    };

    // Try immediately
    initializeContainer();
    
    // Retry with requestAnimationFrame for smoother initialization
    const rafId = requestAnimationFrame(() => {
      if (!containerRef.current) {
        initializeContainer();
      }
    });

    return () => {
      isMountedRef.current = false;
      cancelAnimationFrame(rafId);
    };
  }, [containerId, enabled, getContainerElement]);

  // Handle mouse movement with safe DOM access
  useEffect(() => {
    if (!enabled || !isContainerReady || !currentUser) return;

    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMountedRef.current || !currentUser) return;

      const now = Date.now();
      if (now - lastUpdateRef.current < throttleDelay) return;
      lastUpdateRef.current = now;

      try {
        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert to percentage for responsive positioning
        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;

        updatePresence(window.location.pathname, false, {
          x: Math.max(0, Math.min(100, xPercent)),
          y: Math.max(0, Math.min(100, yPercent)),
        });
      } catch {
        // Silently fail on DOM access errors
      }
    };

    const handleMouseLeave = () => {
      if (!isMountedRef.current || !currentUser) return;
      try {
        updatePresence(window.location.pathname, false, undefined);
      } catch {
        // Silently fail
      }
    };

    // Add passive listeners to improve performance and prevent errors
    container.addEventListener('mousemove', handleMouseMove, { passive: true });
    container.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      try {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      } catch {
        // Silently fail on cleanup
      }
    };
  }, [enabled, isContainerReady, currentUser, updatePresence]);

  // Update cursor positions from online users
  useEffect(() => {
    if (!enabled || !currentUser) return;
    
    const now = Date.now();
    const validCursors: CursorPosition[] = [];

    onlineUsers.forEach((user) => {
      if (user.id === currentUser?.id) return; // Don't show own cursor
      if (!user.cursor) return;

      // Only show cursors from users active in the last 30 seconds
      const userLastSeen = user.lastSeen.getTime();
      if (now - userLastSeen > 30000) return;

      validCursors.push({
        userId: user.id,
        userName: user.displayName,
        x: user.cursor.x,
        y: user.cursor.y,
        color: user.cursor.color,
        timestamp: userLastSeen,
      });
    });

    setCursors(validCursors);
  }, [enabled, onlineUsers, currentUser]);

  // Don't render if disabled or container not ready
  if (!enabled || !isContainerReady) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {cursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute transition-all duration-100 ease-out"
          style={{
            left: `${cursor.x}%`,
            top: `${cursor.y}%`,
            transform: 'translate(-2px, -2px)',
          }}
        >
          {/* Cursor Pointer */}
          <div className="relative">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="drop-shadow-md">
              <path
                d="M3 3L17 9L10 10L9 17L3 3Z"
                fill={cursor.color}
                stroke="white"
                strokeWidth="1"
              />
            </svg>

            {/* User Label */}
            {showLabels && (
              <div
                className="absolute top-5 left-3 px-2 py-1 rounded-md text-xs font-medium text-white shadow-lg whitespace-nowrap animate-fade-in"
                style={{ backgroundColor: cursor.color }}
              >
                {cursor.userName}
              </div>
            )}

            {/* Cursor Trail Effect */}
            <div
              className="absolute -inset-1 rounded-full opacity-30 animate-ping"
              style={{ backgroundColor: cursor.color }}
            />
          </div>
        </div>
      ))}

      <style>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(-4px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }
            `}</style>
    </div>
  );
}

// Hook for collaborative text editing
export const useCollaborativeEditing = (elementId: string, context: string) => {
  const { updateTypingStatus } = useRealtimeCollaboration();
  const { currentUser } = useAuth();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const element = document.getElementById(elementId);
    if (!element || !currentUser) return;

    const handleInput = () => {
      updateTypingStatus(true, context);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set typing to false after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingStatus(false, context);
      }, 2000);
    };

    const handleBlur = () => {
      updateTypingStatus(false, context);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };

    element.addEventListener('input', handleInput);
    element.addEventListener('blur', handleBlur);

    return () => {
      element.removeEventListener('input', handleInput);
      element.removeEventListener('blur', handleBlur);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [elementId, context, currentUser, updateTypingStatus]);

  return {
    startTyping: () => updateTypingStatus(true, context),
    stopTyping: () => updateTypingStatus(false, context),
  };
};

// Component for showing typing indicators in specific areas
interface TypingIndicatorProps {
  context: string;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ context, className = '' }) => {
  const { typingUsers } = useRealtimeCollaboration();
  const { currentUser } = useAuth();

  const relevantTypingUsers = Object.values(typingUsers).filter(
    (user) => user.currentView === context && user.id !== currentUser?.id
  );

  if (relevantTypingUsers.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 text-sm text-blue-600 animate-fade-in ${className}`}>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
        <div
          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
          style={{ animationDelay: '0.1s' }}
        ></div>
        <div
          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
          style={{ animationDelay: '0.2s' }}
        ></div>
      </div>
      <span>
        {relevantTypingUsers.length === 1
          ? `${relevantTypingUsers[0].displayName} sedang mengetik...`
          : `${relevantTypingUsers.length} orang sedang mengetik...`}
      </span>
    </div>
  );
};

