/**
 * Offline Inspection List View
 * Phase 3.5: Mobile Offline Inspections
 *
 * Displays list of offline inspections with sync status
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Download,
  Upload,
} from 'lucide-react';
import { useOffline } from '@/contexts/OfflineContext';
import { format } from 'date-fns';

const OfflineInspectionListView: React.FC = () => {
  const navigate = useNavigate();
  const {
    isOnline,
    offlineInspections,
    pendingInspections,
    syncedInspections,
    conflictedInspections,
    syncStatus,
    syncNow,
  } = useOffline();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'synced' | 'conflict'>(
    'all'
  );
  const [syncing, setSyncing] = useState(false);

  // Filter inspections
  const filteredInspections = useMemo(() => {
    let filtered = offlineInspections;

    // Filter by status
    if (filterStatus === 'pending') {
      filtered = pendingInspections;
    } else if (filterStatus === 'synced') {
      filtered = syncedInspections;
    } else if (filterStatus === 'conflict') {
      filtered = conflictedInspections;
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (inspection) =>
          inspection.data.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inspection.data.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inspection.data.inspector.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [
    offlineInspections,
    pendingInspections,
    syncedInspections,
    conflictedInspections,
    filterStatus,
    searchTerm,
  ]);

  // Handle sync
  const handleSync = async () => {
    if (!isOnline) {
      alert('Cannot sync while offline');
      return;
    }

    setSyncing(true);
    try {
      await syncNow();
    } finally {
      setSyncing(false);
    }
  };

  // Get status badge
  const getStatusBadge = (inspection: (typeof offlineInspections)[0]) => {
    switch (inspection.syncStatus) {
      case 'synced':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Synced
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded text-xs font-medium">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'syncing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Syncing
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        );
      case 'conflict':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            Conflict
          </span>
        );
      default:
        return null;
    }
  };

  // Get result badge
  const getResultBadge = (result?: string) => {
    if (!result) return null;

    switch (result) {
      case 'pass':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Pass
          </span>
        );
      case 'fail':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Fail
          </span>
        );
      case 'conditional':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            Conditional
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Offline Inspections
            </h1>
            <button
              onClick={() => navigate('/inspections/offline/new')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              New
            </button>
          </div>

          {/* Network & Sync Status */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                isOnline
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
              }`}
            >
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {syncStatus.pending > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg">
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">{syncStatus.pending} pending</span>
              </div>
            )}

            {syncStatus.conflicts > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{syncStatus.conflicts} conflicts</span>
              </div>
            )}

            {isOnline && (
              <button
                onClick={handleSync}
                disabled={syncing || syncStatus.inProgress}
                className="ml-auto flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <RefreshCw
                  className={`w-4 h-4 ${syncing || syncStatus.inProgress ? 'animate-spin' : ''}`}
                />
                {syncing || syncStatus.inProgress ? 'Syncing...' : 'Sync Now'}
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search inspections..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {[
              { value: 'all', label: 'All', count: offlineInspections.length },
              { value: 'pending', label: 'Pending', count: pendingInspections.length },
              { value: 'synced', label: 'Synced', count: syncedInspections.length },
              { value: 'conflict', label: 'Conflicts', count: conflictedInspections.length },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value as any)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm ${
                  filterStatus === filter.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inspection List */}
      <div className="p-4">
        {filteredInspections.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
              <Download className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No inspections found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm
                ? 'Try adjusting your search or filters'
                : 'Create your first offline inspection to get started'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => navigate('/inspections/offline/new')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Create Inspection
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInspections.map((inspection) => (
              <div
                key={inspection.localId}
                onClick={() => navigate(`/inspections/offline/${inspection.localId}`)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md cursor-pointer transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {inspection.data.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {inspection.data.location}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(inspection)}
                    {getResultBadge(inspection.data.overallResult)}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>Inspector: {inspection.data.inspector}</span>
                  <span>•</span>
                  <span>{format(inspection.createdAt, 'MMM d, yyyy')}</span>
                </div>

                {inspection.data.checklist.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {inspection.data.checklist.length} checklist items
                    {inspection.attachments.length > 0 &&
                      ` • ${inspection.attachments.length} attachments`}
                  </div>
                )}

                {inspection.syncStatus === 'failed' && inspection.syncError && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
                    Sync error: {inspection.syncError}
                  </div>
                )}

                {!inspection.offlineMetadata.createdOffline && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                    Last modified offline:{' '}
                    {format(inspection.offlineMetadata.lastModifiedOffline, 'MMM d, HH:mm')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineInspectionListView;
