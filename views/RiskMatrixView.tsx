/**
 * Risk Matrix View
 * Priority 3B: Risk Management System
 * 
 * Interactive risk heat map visualization showing severity vs probability
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useRisk } from '../contexts/RiskContext';
import type { Risk, RiskSeverity, RiskProbability, RiskCategory } from '../types/risk.types';
import { Spinner } from '../components/Spinner';

interface RiskMatrixViewProps {
  projectId: string;
}

const RiskMatrixView: React.FC<RiskMatrixViewProps> = ({ projectId }) => {
  const {
    risks,
    risksLoading,
    risksError,
    fetchRisks,
  } = useRisk();

  // Local state
  const [selectedCategory, setSelectedCategory] = useState<RiskCategory | 'all'>('all');
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ severity: number; probability: number } | null>(null);

  // Fetch risks on mount
  useEffect(() => {
    fetchRisks(projectId);
  }, [projectId]);

  // Filter risks by category
  const filteredRisks = useMemo(() => {
    if (selectedCategory === 'all') return risks;
    return risks.filter(risk => risk.category === selectedCategory);
  }, [risks, selectedCategory]);

  // Matrix dimensions (5x5)
  const severityLevels: RiskSeverity[] = [5, 4, 3, 2, 1];
  const probabilityLevels: RiskProbability[] = [1, 2, 3, 4, 5];

  // Severity labels
  const severityLabels: Record<RiskSeverity, string> = {
    5: 'Catastrophic',
    4: 'Major',
    3: 'Moderate',
    2: 'Minor',
    1: 'Negligible',
  };

  // Probability labels
  const probabilityLabels: Record<RiskProbability, string> = {
    5: 'Almost Certain',
    4: 'Likely',
    3: 'Possible',
    2: 'Unlikely',
    1: 'Rare',
  };

  // Get risks for a specific cell
  const getRisksInCell = (severity: RiskSeverity, probability: RiskProbability): Risk[] => {
    return filteredRisks.filter(
      risk => risk.severity === severity && risk.probability === probability
    );
  };

  // Get cell color based on risk score
  const getCellColor = (severity: RiskSeverity, probability: RiskProbability): string => {
    const score = severity * probability;
    
    if (score >= 20) return 'bg-red-600 hover:bg-red-700';
    if (score >= 15) return 'bg-red-500 hover:bg-red-600';
    if (score >= 10) return 'bg-orange-500 hover:bg-orange-600';
    if (score >= 6) return 'bg-yellow-500 hover:bg-yellow-600';
    if (score >= 3) return 'bg-yellow-400 hover:bg-yellow-500';
    return 'bg-green-400 hover:bg-green-500';
  };

  // Get text color for contrast
  const getTextColor = (severity: RiskSeverity, probability: RiskProbability): string => {
    const score = severity * probability;
    return score >= 6 ? 'text-white' : 'text-gray-900';
  };

  // Get priority label
  const getPriorityLabel = (severity: RiskSeverity, probability: RiskProbability): string => {
    const score = severity * probability;
    
    if (score >= 16) return 'CRITICAL';
    if (score >= 10) return 'HIGH';
    if (score >= 5) return 'MEDIUM';
    return 'LOW';
  };

  // Category options
  const categoryOptions: { value: RiskCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'technical', label: 'Technical' },
    { value: 'financial', label: 'Financial' },
    { value: 'safety', label: 'Safety' },
    { value: 'legal', label: 'Legal' },
    { value: 'environmental', label: 'Environmental' },
    { value: 'operational', label: 'Operational' },
    { value: 'schedule', label: 'Schedule' },
    { value: 'quality', label: 'Quality' },
    { value: 'resource', label: 'Resource' },
    { value: 'stakeholder', label: 'Stakeholder' },
    { value: 'external', label: 'External' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Risk Matrix
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Visual risk assessment heat map
              </p>
            </div>
            
            {/* Category Filter */}
            <div className="mt-4 sm:mt-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Risk Priority Legend</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-red-600 rounded"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Critical (16-25)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-orange-500 rounded"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">High (10-15)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-yellow-500 rounded"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Medium (5-9)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-400 rounded"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Low (1-4)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Matrix */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {risksLoading ? (
          <div className="flex justify-center items-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <Spinner />
          </div>
        ) : risksError ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300">{risksError}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="p-6">
              {/* Risk Matrix Grid */}
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="w-32 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"></th>
                        {probabilityLevels.map((prob) => (
                          <th
                            key={prob}
                            className="p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-center"
                          >
                            <div className="text-xs font-medium text-gray-900 dark:text-white">
                              {probabilityLabels[prob]}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ({prob})
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {severityLevels.map((severity) => (
                        <tr key={severity}>
                          <td className="p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                            <div className="text-xs font-medium text-gray-900 dark:text-white text-right">
                              {severityLabels[severity]}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                              ({severity})
                            </div>
                          </td>
                          {probabilityLevels.map((probability) => {
                            const cellRisks = getRisksInCell(severity, probability);
                            const score = severity * probability;
                            const isHovered = hoveredCell?.severity === severity && hoveredCell?.probability === probability;

                            return (
                              <td
                                key={`${severity}-${probability}`}
                                className={`p-2 border border-gray-300 dark:border-gray-600 cursor-pointer transition-all ${getCellColor(severity, probability)} ${
                                  isHovered ? 'ring-4 ring-blue-500 scale-105 z-10' : ''
                                }`}
                                onMouseEnter={() => setHoveredCell({ severity, probability })}
                                onMouseLeave={() => setHoveredCell(null)}
                                onClick={() => {
                                  if (cellRisks.length > 0) {
                                    setSelectedRisk(cellRisks[0]);
                                  }
                                }}
                              >
                                <div className={`text-center ${getTextColor(severity, probability)}`}>
                                  <div className="text-xs font-bold mb-1">
                                    {getPriorityLabel(severity, probability)}
                                  </div>
                                  <div className="text-lg font-bold">
                                    {score}
                                  </div>
                                  {cellRisks.length > 0 && (
                                    <div className="mt-1 text-xs font-medium">
                                      {cellRisks.length} {cellRisks.length === 1 ? 'risk' : 'risks'}
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Axis Labels */}
              <div className="mt-4 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                <div className="transform -rotate-0">
                  ← Probability →
                </div>
                <div className="transform rotate-0">
                  ← Impact →
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Cell Details */}
        {hoveredCell && (
          <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Cell Details: {severityLabels[hoveredCell.severity as RiskSeverity]} × {probabilityLabels[hoveredCell.probability as RiskProbability]}
            </h3>
            
            {(() => {
              const cellRisks = getRisksInCell(hoveredCell.severity as RiskSeverity, hoveredCell.probability as RiskProbability);
              const score = hoveredCell.severity * hoveredCell.probability;
              
              return cellRisks.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No risks in this cell
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Risk Score: <span className="font-bold text-gray-900 dark:text-white">{score}</span> - {getPriorityLabel(hoveredCell.severity as RiskSeverity, hoveredCell.probability as RiskProbability)}
                  </div>
                  
                  <div className="space-y-2">
                    {cellRisks.map((risk) => (
                      <div
                        key={risk.id}
                        className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                        onClick={() => setSelectedRisk(risk)}
                      >
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {risk.title}
                          </h4>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                            {risk.description}
                          </p>
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 capitalize">
                              {risk.category}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 capitalize">
                              {risk.status}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Risk Distribution Chart */}
        <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Risk Distribution
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['critical', 'high', 'medium', 'low'] as const).map((priority) => {
              const count = filteredRisks.filter(risk => risk.priorityLevel === priority).length;
              const percentage = filteredRisks.length > 0 ? (count / filteredRisks.length) * 100 : 0;
              
              const colorClasses = {
                critical: 'bg-red-500',
                high: 'bg-orange-500',
                medium: 'bg-yellow-500',
                low: 'bg-green-500',
              };

              return (
                <div key={priority} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {priority}
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`${colorClasses[priority]} h-2 rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Risk Details Modal */}
        {selectedRisk && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedRisk.title}
                  </h3>
                  <button
                    onClick={() => setSelectedRisk(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {selectedRisk.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Severity</h4>
                      <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                        {selectedRisk.severity} - {severityLabels[selectedRisk.severity]}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Probability</h4>
                      <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                        {selectedRisk.probability} - {probabilityLabels[selectedRisk.probability]}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Risk Score</h4>
                      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedRisk.riskScore}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</h4>
                      <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white capitalize">
                        {selectedRisk.priorityLevel}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</h4>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                        {selectedRisk.category}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</h4>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                        {selectedRisk.status}
                      </p>
                    </div>
                  </div>

                  {selectedRisk.estimatedImpact > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Impact</h4>
                      <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                        ${selectedRisk.estimatedImpact.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskMatrixView;
