/**
 * Incident Management View
 * Phase 3.5: Quick Wins - Safety Management System
 *
 * Comprehensive incident reporting, investigation, and tracking
 * OSHA-compliant with full evidence management
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSafety } from '@/contexts/SafetyContext';
import type { IncidentSeverity, IncidentStatus } from '@/types/safety.types';
import { Spinner } from '@/components/Spinner';
import { Button } from '@/components/Button';

interface IncidentManagementViewProps {
  projectId: string;
}

const IncidentManagementView: React.FC<IncidentManagementViewProps> = ({ projectId }) => {
  const {
    incidents,
    incidentsLoading,
    fetchIncidents,
    getCriticalIncidents,
    getOpenIncidents,
  } = useSafety();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<IncidentSeverity | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<IncidentStatus | 'all'>('all');

  useEffect(() => {
    fetchIncidents(projectId);
  }, [projectId]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const matchesSearch =
        !searchQuery ||
        incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.incidentNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeverity = selectedSeverity === 'all' || incident.severity === selectedSeverity;
      const matchesStatus = selectedStatus === 'all' || incident.status === selectedStatus;
      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [incidents, searchQuery, selectedSeverity, selectedStatus]);

  const getSeverityColor = (severity: IncidentSeverity): string => {
    const colors = {
      fatal: 'bg-red-900 text-white',
      critical: 'bg-red-600 text-white',
      major: 'bg-orange-500 text-white',
      minor: 'bg-yellow-500 text-gray-900',
      near_miss: 'bg-green-500 text-white',
    };
    return colors[severity];
  };

  const getStatusColor = (status: IncidentStatus): string => {
    const colors = {
      reported: 'bg-blue-100 text-blue-800',
      investigating: 'bg-yellow-100 text-yellow-800',
      corrective_action: 'bg-purple-100 text-purple-800',
      closed: 'bg-green-100 text-green-800',
      reopened: 'bg-orange-100 text-orange-800',
    };
    return colors[status];
  };

  if (incidentsLoading && incidents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Incident Management
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                OSHA-compliant incident reporting
              </p>
            </div>
            <Button className="bg-red-600 hover:bg-red-700 text-white">Report Incident</Button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{incidents.length}</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <p className="text-xs text-yellow-700">Open</p>
              <p className="text-2xl font-bold text-yellow-900">{getOpenIncidents().length}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <p className="text-xs text-red-700">Critical</p>
              <p className="text-2xl font-bold text-red-900">{getCriticalIncidents().length}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-xs text-blue-700">Investigating</p>
              <p className="text-2xl font-bold text-blue-900">
                {incidents.filter((i) => i.status === 'investigating').length}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-xs text-green-700">Closed</p>
              <p className="text-2xl font-bold text-green-900">
                {incidents.filter((i) => i.status === 'closed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search incidents..."
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
            />
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as typeof selectedSeverity)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
            >
              <option value="all">All Severities</option>
              <option value="fatal">Fatal</option>
              <option value="critical">Critical</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
              <option value="near_miss">Near Miss</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
            >
              <option value="all">All Statuses</option>
              <option value="reported">Reported</option>
              <option value="investigating">Investigating</option>
              <option value="corrective_action">Corrective Action</option>
              <option value="closed">Closed</option>
              <option value="reopened">Reopened</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredIncidents.map((incident) => (
              <li
                key={incident.id}
                onClick={() => {
                  console.log('View incident:', incident);
                }}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <div className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(incident.severity)}`}
                        >
                          {incident.severity.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">{incident.incidentNumber}</span>
                      </div>
                      <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                        {incident.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">{incident.description}</p>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span>{new Date(incident.occurredAt).toLocaleDateString()}</span>
                        <span>{incident.location}</span>
                        {incident.injuredPersons.length > 0 && (
                          <span className="text-red-600">
                            {incident.injuredPersons.length} injured
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}
                    >
                      {incident.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default IncidentManagementView;
