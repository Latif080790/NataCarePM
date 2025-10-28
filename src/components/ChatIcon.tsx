/**
 * Chat Icon Component
 * Team Communication System
 *
 * Icon component for accessing the chat system with notification badge
 */

import React from 'react';
import { useMessage } from '@/contexts/MessageContext';

interface ChatIconProps {
  onClick: () => void;
  className?: string;
}

const ChatIcon: React.FC<ChatIconProps> = ({ onClick, className = '' }) => {
  const { unreadNotifications } = useMessage();

  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 ${className}`}
        aria-label="Open chat"
      >
        <svg
          className="w-6 h-6 text-gray-600 dark:text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>
      
      {unreadNotifications > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
          {unreadNotifications > 99 ? '99+' : unreadNotifications}
        </span>
      )}
    </div>
  );
};

export default ChatIcon;