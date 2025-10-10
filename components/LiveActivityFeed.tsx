import React, { useState, useEffect, useRef } from 'react';
import { Notification } from '../types';
import { Bell, Check } from 'lucide-react';
import NotificationPanel from './NotificationPanel';

interface LiveActivityFeedProps {
  notifications: Notification[];
  onReadAll: () => void;
}

export function LiveActivityFeed({ notifications, onReadAll }: LiveActivityFeedProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const feedRef = useRef<HTMLDivElement>(null);

  const togglePanel = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      onReadAll();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (feedRef.current && !feedRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={feedRef}>
      <button 
        onClick={togglePanel} 
        className="relative p-2 rounded-full hover:bg-violet-essence/50 text-palladium hover:text-night-black"
        aria-label={`Pemberitahuan, ${unreadCount} belum dibaca`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-persimmon ring-2 ring-white" />
        )}
      </button>
      
      {isOpen && (
        <NotificationPanel notifications={notifications} onClose={() => setIsOpen(false)} />
      )}
    </div>
  );
}