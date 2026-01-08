/**
 * OFFLINE INDICATOR COMPONENT (Enhanced)
 * Visual indicator dengan sync status & queue info
 * Last Updated: December 16, 2025
 */

import React from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { ButtonPro } from './ButtonPro';

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  showSyncButton?: boolean;
}

export default function OfflineIndicator({ 
  position = 'bottom',
  showSyncButton = true 
}: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus();
  const {
    pendingCount,
    isSyncing,
    syncNow,
  } = useOfflineSync();

  // Hide jika online dan tidak ada pending
  if (isOnline && pendingCount === 0) {
    return null;
  }

  const positionClass = position === 'top' 
    ? 'top-0 mt-6' 
    : 'bottom-0 mb-6';

  return (
    <div 
      className={`fixed ${positionClass} left-1/2 -translate-x-1/2 z-[200] transition-all duration-300`}
    >
      <div 
        className={`
          px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 text-sm
          ${isOnline 
            ? 'bg-white text-gray-800 border border-gray-200' 
            : 'bg-yellow-500 text-white'
          }
        `}
      >
        {/* Icon */}
        {isOnline ? (
          <Wifi className="w-4 h-4 text-green-600" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}

        {/* Status Text */}
        <span className="font-medium">
          {!isOnline && 'Offline Mode - Data disimpan lokal'}
          {isOnline && pendingCount > 0 && `${pendingCount} item menunggu sync`}
        </span>

        {/* Sync Button */}
        {showSyncButton && isOnline && pendingCount > 0 && (
          <button
            onClick={syncNow}
            disabled={isSyncing}
            className={`
              ml-2 px-3 py-1 rounded text-xs font-medium
              flex items-center gap-1
              ${isSyncing 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
              }
            `}
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>
    </div>
  );
}

