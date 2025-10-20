/**
 * CAPA (Corrective and Preventive Actions) View
 * Priority 3D: Quality Management System
 * 
 * Track and manage corrective and preventive actions
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuality } from '@/contexts/QualityContext';
import type { CAPARecord } from '@/types/quality.types';
import { Spinner } from '@/components/Spinner';
import { Button } from '@/components/Button';

interface CAPAViewProps {
  projectId: string;
}

const CAPAView: React.FC<CAPAViewProps> = ({ projectId }) => {
  const {
    defects,
    defectsLoading,
    fetchDefects,
  } = useQuality();

  // Local state
  const [capaRecords, setCapaRecords] = useState<CAPARecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'corrective' | 'preventive'>('all');
  const [selectedStatus, setSelectedStatus] = useState<CAPARecord['status'] | 'all'>('all');
  const [selectedRecord, setSelectedRecord] = useState<CAPARecord | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchDefects(projectId);
    // In a real implementation, fetch CAPA records from API
    // For now, we'll generate mock data based on defects
    generateMockCapaRecords();
  }, [projectId]);

  // Generate mock CAPA records
  const generateMockCapaRecords = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockRecords: CAPARecord[] = [
        {
          id: 'capa-001',
          projectId,
          type: 'corrective',
          issue: 'Concrete strength below specification',
          defectId: 'def-001',
          rootCause: 'Improper water-cement ratio during mixing',
          analysis: 'Laboratory tests revealed water content exceeded specifications by 15%',
          action: 'Implement automated mixing controls and daily quality checks',
          responsibility: 'Quality Manager',
          targetDate: new Date('2024-12-15'),
          status: 'in_progress',
          createdAt: new Date('2024-11-01'),
        },
        {
          id: 'capa-002',
          projectId,
          type: 'preventive',
          issue: 'Potential welding defects in steel framework',
          rootCause: 'Lack of standardized welding procedures',
          analysis: 'Industry analysis shows 30% of structural issues stem from welding inconsistencies',
          action: 'Develop and implement welding procedure specifications (WPS) for all structural work',
          responsibility: 'Engineering Lead',
          targetDate: new Date('2024-12-20'),
          status: 'planned',
          createdAt: new Date('2024-11-05'),
        },
        {
          id: 'capa-003',
          projectId,
          type: 'corrective',
          issue: 'Water infiltration in basement level',
          defectId: 'def-002',
          rootCause: 'Inadequate waterproofing membrane application',
          analysis: 'Inspection revealed gaps in membrane coverage at wall-floor joints',
          action: 'Remove and reapply waterproofing system with enhanced corner details',
          responsibility: 'Waterproofing Contractor',
          targetDate: new Date('2024-12-10'),
          status: 'completed',
          implementation: {
            completedDate: new Date('2024-12-08'),
            completedBy: 'John Smith',
            evidence: ['photo-001.jpg', 'photo-002.jpg', 'test-report.pdf'],
          },
          verification: {
            verifiedDate: new Date('2024-12-09'),
            verifiedBy: 'Jane Doe',
            effective: true,
            comments: 'Water pressure test passed. No leaks detected.',
          },
          createdAt: new Date('2024-10-15'),
        },
        {
          id: 'capa-004',
          projectId,
          type: 'preventive',
          issue: 'Risk of schedule delays due to material delivery',
          rootCause: 'Single-source supplier dependency',
          analysis: 'Current supplier has 20% on-time delivery rate in last quarter',
          action: 'Establish backup supplier agreements and maintain buffer stock',
          responsibility: 'Procurement Manager',
          targetDate: new Date('2024-12-25'),
          status: 'in_progress',
          createdAt: new Date('2024-11-10'),
        },
        {
          id: 'capa-005',
          projectId,
          type: 'corrective',
          issue: 'Safety incident - near miss with crane operation',
          rootCause: 'Insufficient safety training for ground crew',
          analysis: 'Crew members were unaware of proper hand signal protocols',
          action: 'Mandatory crane safety certification for all ground personnel',
          responsibility: 'Safety Officer',
          targetDate: new Date('2024-11-30'),
          status: 'verified',
          implementation: {
            completedDate: new Date('2024-11-28'),
            completedBy: 'Safety Team',
            evidence: ['training-records.pdf', 'certification-roster.xlsx'],
          },
          verification: {
            verifiedDate: new Date('2024-11-29'),
            verifiedBy: 'Safety Director',
            effective: true,
            comments: 'All personnel certified. Zero incidents since implementation.',
          },
          createdAt: new Date('2024-11-01'),
        },
      ];
      
      setCapaRecords(mockRecords);
      setLoading(false);
    }, 500);
  };

  // Filtered CAPA records
  const filteredRecords = useMemo(() => {
    return capaRecords.filter(record => {
      const matchesSearch = !searchQuery ||
        record.issue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.responsibility.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === 'all' || record.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [capaRecords, searchQuery, selectedType, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = capaRecords.length;
    const corrective = capaRecords.filter(r => r.type === 'corrective').length;
    const preventive = capaRecords.filter(r => r.type === 'preventive').length;
    const completed = capaRecords.filter(r => r.status === 'completed' || r.status === 'verified').length;
    const overdue = capaRecords.filter(r => 
      new Date(r.targetDate) < new Date() && 
      !['completed', 'verified'].includes(r.status)
    ).length;
    const effectiveness = capaRecords.filter(r => 
      r.verification?.effective === true
    ).length;

    return { total, corrective, preventive, completed, overdue, effectiveness };
  }, [capaRecords]);

  // Get status color
  const getStatusColor = (status: CAPARecord['status']): string => {
    switch (status) {
      case 'planned': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'verified': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'ineffective': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  // Get type badge
  const getTypeBadge = (type: 'corrective' | 'preventive') => {
    if (type === 'corrective') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
          Corrective
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        Preventive
      </span>
    );
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Check if overdue
  const isOverdue = (record: CAPARecord): boolean => {
    return new Date(record.targetDate) < new Date() && 
           !['completed', 'verified'].includes(record.status);
  };

  // Handle record click
  const handleRecordClick = (record: CAPARecord) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                CAPA Management
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Corrective and Preventive Actions
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button
                onClick={() => console.log('Create CAPA')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New CAPA
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="bg-white dark:bg-gray-700 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600 p-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</dd>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 overflow-hidden rounded-lg border border-orange-200 dark:border-orange-800 p-4">
              <dt className="text-sm font-medium text-orange-600 dark:text-orange-400 truncate">Corrective</dt>
              <dd className="mt-1 text-2xl font-semibold text-orange-900 dark:text-orange-200">{stats.corrective}</dd>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 overflow-hidden rounded-lg border border-blue-200 dark:border-blue-800 p-4">
              <dt className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">Preventive</dt>
              <dd className="mt-1 text-2xl font-semibold text-blue-900 dark:text-blue-200">{stats.preventive}</dd>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 overflow-hidden rounded-lg border border-green-200 dark:border-green-800 p-4">
              <dt className="text-sm font-medium text-green-600 dark:text-green-400 truncate">Completed</dt>
              <dd className="mt-1 text-2xl font-semibold text-green-900 dark:text-green-200">{stats.completed}</dd>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 overflow-hidden rounded-lg border border-red-200 dark:border-red-800 p-4">
              <dt className="text-sm font-medium text-red-600 dark:text-red-400 truncate">Overdue</dt>
              <dd className="mt-1 text-2xl font-semibold text-red-900 dark:text-red-200">{stats.overdue}</dd>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 overflow-hidden rounded-lg border border-purple-200 dark:border-purple-800 p-4">
              <dt className="text-sm font-medium text-purple-600 dark:text-purple-400 truncate">Effective</dt>
              <dd className="mt-1 text-2xl font-semibold text-purple-900 dark:text-purple-200">{stats.effectiveness}</dd>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search CAPA records..."
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Type filter */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                id="type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as typeof selectedType)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">All Types</option>
                <option value="corrective">Corrective</option>
                <option value="preventive">Preventive</option>
              </select>
            </div>

            {/* Status filter */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="verified">Verified</option>
                <option value="ineffective">Ineffective</option>
              </select>
            </div>
          </div>
        </div>

        {/* CAPA Records List */}
        {loading || defectsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No CAPA records</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new CAPA record.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                onClick={() => handleRecordClick(record)}
                className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getTypeBadge(record.type)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status.replace('_', ' ')}
                      </span>
                      {isOverdue(record) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          Overdue
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {record.issue}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-500 dark:text-gray-400">Root Cause:</span>
                        <p className="text-gray-900 dark:text-white mt-1">{record.rootCause}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500 dark:text-gray-400">Action:</span>
                        <p className="text-gray-900 dark:text-white mt-1">{record.action}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {record.responsibility}
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Target: {formatDate(record.targetDate)}
                      </div>
                      {record.implementation && (
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Completed {formatDate(record.implementation.completedDate)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)} />
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    CAPA Details
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      {getTypeBadge(selectedRecord.type)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRecord.status)}`}>
                        {selectedRecord.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedRecord.issue}</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Root Cause Analysis</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRecord.rootCause}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">{selectedRecord.analysis}</p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Action Plan</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRecord.action}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Responsibility</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRecord.responsibility}</p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Target Date</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(selectedRecord.targetDate)}</p>
                    </div>
                  </div>
                  
                  {selectedRecord.implementation && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-3">Implementation</h5>
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Completed by <strong>{selectedRecord.implementation.completedBy}</strong> on {formatDate(selectedRecord.implementation.completedDate)}
                        </p>
                        {selectedRecord.implementation.evidence && selectedRecord.implementation.evidence.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Evidence:</p>
                            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                              {selectedRecord.implementation.evidence.map((file, idx) => (
                                <li key={idx}>{file}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {selectedRecord.verification && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-3">Verification</h5>
                      <div className={`${selectedRecord.verification.effective ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'} border rounded-lg p-4`}>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Verified by <strong>{selectedRecord.verification.verifiedBy}</strong> on {formatDate(selectedRecord.verification.verifiedDate)}
                        </p>
                        <p className="text-sm mt-2">
                          <span className="font-medium">Effectiveness: </span>
                          <span className={selectedRecord.verification.effective ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {selectedRecord.verification.effective ? 'Effective' : 'Ineffective'}
                          </span>
                        </p>
                        {selectedRecord.verification.comments && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {selectedRecord.verification.comments}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CAPAView;
