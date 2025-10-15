import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Play,
  Pause,
  RefreshCw,
  Settings,
  TrendingUp,
  XCircle,
  Zap,
  Bell,
  Database,
  GitBranch
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { hasPermission } from '../constants';
import {
  getAutomationRules,
  getAutomationExecutions,
  toggleAutomationRule,
  retryFailedExecution,
  getIntegrationStatistics
} from '../api/automationService';
import { getNotifications, getUnreadCount } from '../api/notificationService';
import { getAuditLogs, getAuditStatistics } from '../api/auditService';
import {
  AutomationRule,
  AutomationExecution,
  AutomationStatus,
  Notification,
  AuditLog,
  IntegrationStatistics
} from '../types/automation';

const IntegrationDashboardView: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'executions' | 'notifications' | 'audit'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [recentExecutions, setRecentExecutions] = useState<AutomationExecution[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [statistics, setStatistics] = useState<IntegrationStatistics | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Filter states
  const [executionStatusFilter, setExecutionStatusFilter] = useState<AutomationStatus | 'all'>('all');
  const [ruleFilter, setRuleFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month'>('week');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load automation rules
      const rules = await getAutomationRules(false);
      setAutomationRules(rules);

      // Load recent executions
      const executions = await getAutomationExecutions(undefined, 50);
      setRecentExecutions(executions);

      // Load notifications if user has permission
      if (currentUser) {
        const notifs = await getNotifications({ recipientId: currentUser.id }, 20);
        setNotifications(notifs);

        const unread = await getUnreadCount(currentUser.id);
        setUnreadCount(unread);
      }

      // Load audit logs
      const logs = await getAuditLogs({ module: 'automation' }, 50);
      setAuditLogs(logs);

      // Load statistics
      const endDate = Timestamp.now();
      const startDate = Timestamp.fromMillis(endDate.toMillis() - (7 * 24 * 60 * 60 * 1000));
      const stats = await getIntegrationStatistics(startDate, endDate);
      setStatistics(stats);

    } catch (error: any) {
      addToast('Failed to load integration data', 'error');
      console.error('Error loading integration data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      await toggleAutomationRule(ruleId, !isActive);
      addToast(`Automation rule ${!isActive ? 'enabled' : 'disabled'}`, 'success');
      await loadData();
    } catch (error: any) {
      addToast('Failed to toggle automation rule', 'error');
      console.error('Error toggling rule:', error);
    }
  };

  const handleRetryExecution = async (executionId: string) => {
    try {
      await retryFailedExecution(executionId);
      addToast('Execution retry initiated', 'success');
      await loadData();
    } catch (error: any) {
      addToast('Failed to retry execution', 'error');
      console.error('Error retrying execution:', error);
    }
  };

  const getStatusIcon = (status: AutomationStatus) => {
    switch (status) {
      case AutomationStatus.SUCCESS:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case AutomationStatus.FAILED:
        return <XCircle className="w-4 h-4 text-red-500" />;
      case AutomationStatus.PROCESSING:
        return <Clock className="w-4 h-4 text-blue-500" />;
      case AutomationStatus.PENDING:
        return <Clock className="w-4 h-4 text-gray-500" />;
      case AutomationStatus.RETRY:
        return <RefreshCw className="w-4 h-4 text-orange-500" />;
      case AutomationStatus.CANCELLED:
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadgeColor = (status: AutomationStatus): string => {
    switch (status) {
      case AutomationStatus.SUCCESS:
        return 'bg-green-100 text-green-800';
      case AutomationStatus.FAILED:
        return 'bg-red-100 text-red-800';
      case AutomationStatus.PROCESSING:
        return 'bg-blue-100 text-blue-800';
      case AutomationStatus.PENDING:
        return 'bg-gray-100 text-gray-800';
      case AutomationStatus.RETRY:
        return 'bg-orange-100 text-orange-800';
      case AutomationStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredExecutions = recentExecutions.filter(execution => {
    if (executionStatusFilter !== 'all' && execution.status !== executionStatusFilter) {
      return false;
    }
    if (ruleFilter !== 'all' && execution.ruleId !== ruleFilter) {
      return false;
    }
    return true;
  });

  const canManage = currentUser && hasPermission(currentUser, 'manage_logistics');

  // Overview Tab
  const renderOverview = () => {
    if (!statistics) return null;

    const successRate = statistics.totalExecutions > 0
      ? (statistics.successfulExecutions / statistics.totalExecutions) * 100
      : 0;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Executions</p>
                <p className="text-2xl font-bold mt-1">{statistics.totalExecutions}</p>
              </div>
              <Activity className="w-10 h-10 text-blue-500" />
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Last 7 days
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {successRate.toFixed(1)}%
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <div className="mt-4 text-sm text-gray-500">
              {statistics.successfulExecutions} of {statistics.totalExecutions}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Rules</p>
                <p className="text-2xl font-bold mt-1">
                  {automationRules.filter(r => r.isActive).length}
                </p>
              </div>
              <Zap className="w-10 h-10 text-yellow-500" />
            </div>
            <div className="mt-4 text-sm text-gray-500">
              {automationRules.length} total rules
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Notifications</p>
                <p className="text-2xl font-bold mt-1">{unreadCount}</p>
              </div>
              <Bell className="w-10 h-10 text-purple-500" />
            </div>
            <div className="mt-4 text-sm text-gray-500">
              {notifications.length} total
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Recent Executions</h3>
            <button
              onClick={loadData}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="space-y-3">
            {statistics.recentExecutions.slice(0, 10).map((execution) => (
              <div
                key={execution.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(execution.status)}
                  <div>
                    <p className="font-medium">{execution.ruleName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(execution.startedAt.toMillis()).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm">
                      {execution.actionsSuccess}/{execution.actionsExecuted} actions
                    </p>
                    {execution.duration && (
                      <p className="text-xs text-gray-500">
                        {(execution.duration / 1000).toFixed(2)}s
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(execution.status)}`}>
                    {execution.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Failures */}
        {statistics.recentFailures.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-2 mb-6">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold">Recent Failures</h3>
            </div>

            <div className="space-y-3">
              {statistics.recentFailures.map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between p-4 bg-red-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-red-900">{execution.ruleName}</p>
                    {execution.error && (
                      <p className="text-sm text-red-700 mt-1">{execution.error.message}</p>
                    )}
                    <p className="text-xs text-red-600 mt-1">
                      {new Date(execution.startedAt.toMillis()).toLocaleString()}
                    </p>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => handleRetryExecution(execution.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Retry
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Rules Tab
  const renderRules = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Automation Rules</h3>
          {canManage && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Create Rule
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rule Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trigger
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Success Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              {canManage && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {automationRules.map((rule) => {
              const successRate = rule.executionCount > 0
                ? (rule.successCount / rule.executionCount) * 100
                : 0;

              return (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{rule.ruleName}</p>
                      {rule.description && (
                        <p className="text-sm text-gray-500">{rule.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {rule.trigger}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${successRate}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {successRate.toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {rule.successCount}/{rule.executionCount} executions
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        rule.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleRule(rule.id, rule.isActive)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {rule.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Executions Tab
  const renderExecutions = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={executionStatusFilter}
            onChange={(e) => setExecutionStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value={AutomationStatus.SUCCESS}>Success</option>
            <option value={AutomationStatus.FAILED}>Failed</option>
            <option value={AutomationStatus.PROCESSING}>Processing</option>
            <option value={AutomationStatus.PENDING}>Pending</option>
          </select>

          <select
            value={ruleFilter}
            onChange={(e) => setRuleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Rules</option>
            {automationRules.map((rule) => (
              <option key={rule.id} value={rule.id}>
                {rule.ruleName}
              </option>
            ))}
          </select>

          <button
            onClick={loadData}
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Executions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trigger
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExecutions.map((execution) => (
                <tr key={execution.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(execution.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(execution.status)}`}>
                        {execution.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium">{execution.ruleName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{execution.trigger}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(execution.startedAt.toMillis()).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {execution.duration ? `${(execution.duration / 1000).toFixed(2)}s` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm">
                      {execution.actionsSuccess}/{execution.actionsExecuted}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <GitBranch className="w-8 h-8 mr-3 text-blue-600" />
              Integration & Automation
            </h1>
            <p className="text-gray-600 mt-1">
              Monitor and manage system integrations and automation workflows
            </p>
          </div>
          {canManage && (
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'rules', label: 'Rules', icon: Zap },
            { id: 'executions', label: 'Executions', icon: Activity },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'audit', label: 'Audit Trail', icon: Database }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'rules' && renderRules()}
          {activeTab === 'executions' && renderExecutions()}
          {activeTab === 'notifications' && (
            <div className="text-center text-gray-500 py-12">
              Notifications view - Coming soon
            </div>
          )}
          {activeTab === 'audit' && (
            <div className="text-center text-gray-500 py-12">
              Audit trail view - Coming soon
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default IntegrationDashboardView;
