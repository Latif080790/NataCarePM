/**
 * Safety Dashboard View
 * Phase 3.5: Quick Wins - Safety Management System
 *
 * Comprehensive safety metrics dashboard with OSHA-compliant KPIs,
 * real-time incident tracking, and actionable insights
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSafety } from '@/contexts/SafetyContext';
import { Spinner } from '@/components/Spinner';
import { Button } from '@/components/Button';

interface SafetyDashboardViewProps {
  projectId: string;
}

const SafetyDashboardView: React.FC<SafetyDashboardViewProps> = ({ projectId }) => {
  const {
    dashboardSummary,
    fetchDashboardSummary,
    metricsLoading,
  } = useSafety();

  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard data on mount and when period changes
  useEffect(() => {
    fetchDashboardSummary(projectId);
  }, [projectId, selectedPeriod]);

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardSummary(projectId);
    setRefreshing(false);
  };

  // Get current metrics based on selected period
  const currentMetrics = useMemo(() => {
    if (!dashboardSummary) return null;

    switch (selectedPeriod) {
      case 'month':
        return dashboardSummary.thisMonth;
      case 'quarter':
        // Would calculate quarter metrics
        return dashboardSummary.thisMonth;
      case 'year':
        return dashboardSummary.yearToDate;
      default:
        return dashboardSummary.thisMonth;
    }
  }, [dashboardSummary, selectedPeriod]);

  // Loading state
  if (metricsLoading && !dashboardSummary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // No data state
  if (!dashboardSummary || !currentMetrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No safety data available</p>
          <Button onClick={handleRefresh}>Load Data</Button>
        </div>
      </div>
    );
  }

  const { currentStatus, upcomingTraining, expiringCertifications, recentIncidents } =
    dashboardSummary;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Safety Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                OSHA-compliant safety metrics and real-time monitoring
              </p>
            </div>

            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              {/* Period Selector */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as typeof selectedPeriod)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">Year to Date</option>
              </select>

              {/* Refresh Button */}
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <svg
                  className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </Button>
            </div>
          </div>

          {/* Current Status Alerts */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Days Since Last Incident */}
            <div
              className={`p-4 rounded-lg border-2 ${
                currentStatus.daysSinceLastIncident >= 30
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                  : currentStatus.daysSinceLastIncident >= 7
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Days Since Last Incident
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {currentStatus.daysSinceLastIncident}
                  </p>
                </div>
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Active Incidents */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Incidents
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {currentStatus.activeIncidents}
                  </p>
                </div>
                <svg
                  className="w-12 h-12 text-yellow-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Critical Incidents */}
            <div
              className={`p-4 rounded-lg border-2 ${
                currentStatus.criticalIncidents > 0
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Critical Incidents
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {currentStatus.criticalIncidents}
                  </p>
                </div>
                <svg
                  className="w-12 h-12 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Open Findings */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Open Findings
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {currentStatus.openFindings}
                  </p>
                </div>
                <svg
                  className="w-12 h-12 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OSHA Metrics */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              OSHA Safety Rates
            </h3>
            <div className="space-y-4">
              {/* TRIR */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    TRIR (Total Recordable Incident Rate)
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {currentMetrics.rates.totalRecordableIncidentRate.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      currentMetrics.rates.totalRecordableIncidentRate < 2
                        ? 'bg-green-600'
                        : currentMetrics.rates.totalRecordableIncidentRate < 4
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                    }`}
                    style={{
                      width: `${Math.min((currentMetrics.rates.totalRecordableIncidentRate / 5) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Target: &lt; 2.0 (Industry average: 3.2)
                </p>
              </div>

              {/* LTIFR */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    LTIFR (Lost Time Injury Frequency Rate)
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {currentMetrics.rates.lostTimeInjuryFrequencyRate.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      currentMetrics.rates.lostTimeInjuryFrequencyRate < 1
                        ? 'bg-green-600'
                        : currentMetrics.rates.lostTimeInjuryFrequencyRate < 2
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                    }`}
                    style={{
                      width: `${Math.min((currentMetrics.rates.lostTimeInjuryFrequencyRate / 3) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Target: &lt; 1.0 (Industry average: 1.8)
                </p>
              </div>

              {/* Near Miss Rate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Near Miss Frequency Rate
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {currentMetrics.rates.nearMissFrequencyRate.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{
                      width: `${Math.min((currentMetrics.rates.nearMissFrequencyRate / 10) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Higher reporting is positive (proactive safety)
                </p>
              </div>
            </div>
          </div>

          {/* Incidents by Severity */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Incidents by Severity
            </h3>
            <div className="space-y-3">
              {Object.entries(currentMetrics.incidents.bySeverity).map(([severity, count]) => (
                <div key={severity}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {severity.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        severity === 'fatal' || severity === 'critical'
                          ? 'bg-red-600'
                          : severity === 'major'
                            ? 'bg-orange-600'
                            : severity === 'minor'
                              ? 'bg-yellow-600'
                              : 'bg-green-600'
                      }`}
                      style={{
                        width: `${currentMetrics.incidents.total > 0 ? (count / currentMetrics.incidents.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Incidents
                </span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {currentMetrics.incidents.total}
                </span>
              </div>
            </div>
          </div>

          {/* Training Compliance */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Training & Compliance
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Training Completion Rate
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {currentMetrics.training.completionRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      currentMetrics.training.completionRate >= 90
                        ? 'bg-green-600'
                        : currentMetrics.training.completionRate >= 70
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                    }`}
                    style={{ width: `${currentMetrics.training.completionRate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentMetrics.training.totalSessions}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Attendees</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentMetrics.training.totalAttendees}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Expired Certs</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {currentMetrics.training.expiredCertifications}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Expiring Soon</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {currentMetrics.training.upcomingExpirations}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Compliance */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Audit Performance
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Average Compliance Rate
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {currentMetrics.audits.averageComplianceRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      currentMetrics.audits.averageComplianceRate >= 90
                        ? 'bg-green-600'
                        : currentMetrics.audits.averageComplianceRate >= 75
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                    }`}
                    style={{ width: `${currentMetrics.audits.averageComplianceRate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Audits</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentMetrics.audits.total}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentMetrics.audits.completed}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Critical Findings</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {currentMetrics.audits.criticalFindings}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Open Findings</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {currentMetrics.audits.openFindings}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Training */}
        {upcomingTraining.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Upcoming Training Sessions
            </h3>
            <div className="space-y-3">
              {upcomingTraining.slice(0, 5).map((training) => (
                <div
                  key={training.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{training.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(training.scheduledDate).toLocaleDateString()} • {training.duration}{' '}
                      hours
                    </p>
                  </div>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {training.attendees.length} attendees
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expiring Certifications Alert */}
        {expiringCertifications.length > 0 && (
          <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Certifications Expiring Soon
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <p>
                    {expiringCertifications.length} certification(s) expiring within 30 days. Action
                    required.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Incidents */}
        {recentIncidents.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Recent Incidents
            </h3>
            <div className="space-y-3">
              {recentIncidents.slice(0, 5).map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          incident.severity === 'fatal' || incident.severity === 'critical'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : incident.severity === 'major'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                              : incident.severity === 'minor'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}
                      >
                        {incident.severity}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {incident.incidentNumber}
                      </span>
                    </div>
                    <p className="mt-1 font-medium text-gray-900 dark:text-white">
                      {incident.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(incident.occurredAt).toLocaleDateString()} • {incident.location}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      incident.status === 'closed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : incident.status === 'investigating'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}
                  >
                    {incident.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SafetyDashboardView;

