import React, { useState, useEffect, useRef } from 'react';

import { useRealtimeCollaboration } from '@/contexts/RealtimeCollaborationContext';
import { useAuth } from '@/contexts/AuthContext';

interface LiveCursorsProps {
  containerId?: string;
  showLabels?: boolean;
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
}: LiveCursorsProps) {
  const { onlineUsers, updatePresence } = useRealtimeCollaboration();
  const { currentUser } = useAuth();
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const containerRef = useRef<HTMLElement | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Throttle cursor updates to avoid overwhelming the database
  const throttleDelay = 100; // 100ms

  useEffect(() => {
    // Get the container element
    const container = document.getElementById(containerId) || document.body;
    containerRef.current = container;

    const handleMouseMove = (e: MouseEvent) => {
      if (!currentUser) return;

      const now = Date.now();
      if (now - lastUpdateRef.current < throttleDelay) return;
      lastUpdateRef.current = now;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Convert to percentage for responsive positioning
      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;

      updatePresence(window.location.pathname, false, {
        x: Math.max(0, Math.min(100, xPercent)),
        y: Math.max(0, Math.min(100, yPercent)),
      });
    };

    const handleMouseLeave = () => {
      if (!currentUser) return;
      updatePresence(window.location.pathname, false, undefined);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [containerId, currentUser, updatePresence]);

  // Update cursor positions from online users
  useEffect(() => {
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
  }, [onlineUsers, currentUser]);

  if (!containerRef.current) return null;

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

