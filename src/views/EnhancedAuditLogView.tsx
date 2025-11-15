/**
 * Enhanced Audit Log View
 * Day 4 - Comprehensive audit trail with advanced filtering and export
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Search, Filter, Download, RefreshCw, Eye, AlertCircle, CheckCircle, XCircle, Clock, FileSpreadsheet, FileText } from 'lucide-react';
import {
  CardPro,
  CardProHeader,
  CardProContent,
  CardProTitle,
  ButtonPro,
  BadgePro,
} from '@/components/DesignSystem';
import { getEnhancedAuditLogs, getEnhancedAuditStatistics } from '@/api/auditService.enhanced';
import { exportAuditLogs, getDefaultExportOptions } from '@/api/auditExport.service';
import {
  EnhancedAuditLog,
  EnhancedAuditLogFilters,
  EnhancedAuditStatistics,
  FieldChange,
  AuditExportOptions,
} from '@/types/audit.enhanced';
import { Timestamp } from 'firebase/firestore';
import { useToast } from '@/contexts/ToastContext';

export function EnhancedAuditLogView() {
  const { addToast } = useToast();
  const [logs, setLogs] = useState<EnhancedAuditLog[]>([]);
  const [statistics, setStatistics] = useState<EnhancedAuditStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<EnhancedAuditLog | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState<EnhancedAuditLogFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  // Load initial data
  useEffect(() => {
    loadAuditLogs();
    loadStatistics();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const result = await getEnhancedAuditLogs(filters, 100);
      setLogs(result.logs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await getEnhancedAuditStatistics(filters);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf' | 'csv' | 'json') => {
    try {
      setExporting(true);
      setShowExportMenu(false);

      const exportOptions: AuditExportOptions = {
        ...getDefaultExportOptions(),
        format,
      };

      await exportAuditLogs(logs, exportOptions);
      
      addToast(`Audit logs exported successfully to ${format.toUpperCase()}`, 'success');
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      addToast('Failed to export audit logs', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleApplyFilters = () => {
    const newFilters: EnhancedAuditLogFilters = { ...filters };

    // Apply date range
    if (dateRange.start) {
      newFilters.startDate = Timestamp.fromDate(new Date(dateRange.start));
    }
    if (dateRange.end) {
      newFilters.endDate = Timestamp.fromDate(new Date(dateRange.end));
    }

    // Apply search query
    if (searchQuery) {
      newFilters.searchQuery = searchQuery;
    }

    setFilters(newFilters);
    loadAuditLogs();
    loadStatistics();
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setDateRange({ start: '', end: '' });
    loadAuditLogs();
    loadStatistics();
  };

  const handleRefresh = () => {
    loadAuditLogs();
    loadStatistics();
  };

  const getStatusIcon = (status: EnhancedAuditLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'partial':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getImpactLevelColor = (level: EnhancedAuditLog['impactLevel']) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Audit Trail</h1>
          <p className="text-gray-600 mt-1">Comprehensive activity and change tracking</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting || logs.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export'}
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  Export to Excel
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-red-600" />
                  Export to PDF
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  Export to CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-purple-600" />
                  Export to JSON
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardPro className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Actions</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalActions}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardPro>
          <CardPro className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-green-600">{statistics.successfulActions}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardPro>
          <CardPro className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{statistics.failedActions}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardPro>
          <CardPro className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliance Rate</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.complianceRate.toFixed(1)}%</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardPro>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <CardPro className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search logs..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Module Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Module</label>
              <select
                value={filters.module || ''}
                onChange={(e) => setFilters({ ...filters, module: e.target.value || undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Modules</option>
                <option value="project">Project</option>
                <option value="procurement">Procurement</option>
                <option value="logistics">Logistics</option>
                <option value="finance">Finance</option>
                <option value="security">Security</option>
                <option value="system">System</option>
              </select>
            </div>

            {/* Action Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Action Type</label>
              <select
                value={filters.actionType as string || ''}
                onChange={(e) => setFilters({ ...filters, actionType: e.target.value || undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="create">Create</option>
                <option value="read">Read</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="approve">Approve</option>
                <option value="reject">Reject</option>
                <option value="execute">Execute</option>
                <option value="export">Export</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any || undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="partial">Partial</option>
              </select>
            </div>

            {/* Impact Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Impact Level</label>
              <select
                value={filters.impactLevel || ''}
                onChange={(e) => setFilters({ ...filters, impactLevel: e.target.value as any || undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-start-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </CardPro>
      )}

      {/* Audit Logs Table */}
      <CardPro className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Impact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Loading audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(log.timestamp.toDate(), 'MMM dd, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                      <div className="text-xs text-gray-500">{log.userRole}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{log.action}</div>
                      <div className="text-xs text-gray-500">{log.module}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{log.entityName || log.entityId}</div>
                      <div className="text-xs text-gray-500">{log.entityType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full border ${getImpactLevelColor(
                          log.impactLevel
                        )}`}
                      >
                        {log.impactLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(log.status)}
                        <span className="text-sm text-gray-900 capitalize">{log.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardPro>

      {/* Detail Modal */}
      {selectedLog && (
        <AuditLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}

// Detail Modal Component
interface AuditLogDetailModalProps {
  log: EnhancedAuditLog;
  onClose: () => void;
}

function AuditLogDetailModal({ log, onClose }: AuditLogDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Audit Log Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Action</p>
              <p className="text-base text-gray-900 mt-1">{log.action}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Timestamp</p>
              <p className="text-base text-gray-900 mt-1">
                {format(log.timestamp.toDate(), 'PPpp')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">User</p>
              <p className="text-base text-gray-900 mt-1">
                {log.userName} ({log.userRole})
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(log.status)}
                <span className="text-base text-gray-900 capitalize">{log.status}</span>
              </div>
            </div>
          </div>

          {/* Changes */}
          {log.changes && log.changes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Changes</h3>
              <div className="space-y-2">
                {log.changes.map((change, index) => (
                  <ChangeDisplay key={index} change={change} />
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Metadata</h3>
              <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Change Display Component
function ChangeDisplay({ change }: { change: FieldChange }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900">{change.fieldLabel}</span>
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            change.changeType === 'added'
              ? 'bg-green-100 text-green-800'
              : change.changeType === 'removed'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
          }`}
        >
          {change.changeType}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500 mb-1">Old Value:</p>
          <p className="text-gray-900 font-mono">{change.oldValueFormatted || 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-500 mb-1">New Value:</p>
          <p className="text-gray-900 font-mono">{change.newValueFormatted || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}

function getStatusIcon(status: EnhancedAuditLog['status']) {
  switch (status) {
    case 'success':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'partial':
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    default:
      return null;
  }
}

export default EnhancedAuditLogView;


