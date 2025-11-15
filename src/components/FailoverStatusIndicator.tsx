/**
 * Failover Status Indicator Component
 * Displays current region and health status
 */

import React, { useState } from 'react';
import { useFailover } from '@/hooks/useFailover';
import { Modal } from '@/components/Modal';

const FailoverStatusIndicator: React.FC = () => {
  const {
    currentRegion,
    availableRegions,
    isHealthy,
    recentEvents,
    failoverHistory,
    manualFailover,
    isLoading,
  } = useFailover();

  const [showDetails, setShowDetails] = useState(false);
  const [showFailoverModal, setShowFailoverModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  const handleFailover = async () => {
    if (!selectedRegion) return;

    try {
      await manualFailover(selectedRegion, 'User-initiated manual failover');
      setShowFailoverModal(false);
    } catch (error) {
      console.error('Failover failed:', error);
      alert('Failover failed. Please try again or contact support.');
    }
  };

  return (
    <>
      {/* Status Indicator Badge */}
      <div
        className="fixed bottom-4 right-4 z-50 cursor-pointer"
        onClick={() => setShowDetails(true)}
      >
        <div
          className={`
          flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg
          ${isHealthy ? 'bg-green-500' : 'bg-yellow-500'}
          text-white text-sm font-medium
          hover:shadow-xl transition-shadow
        `}
        >
          <div
            className={`
            w-2 h-2 rounded-full animate-pulse
            ${isHealthy ? 'bg-green-200' : 'bg-yellow-200'}
          `}
          />
          <span>{currentRegion.name}</span>
          {!isHealthy && (
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-xs">Degraded</span>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && (
        <Modal isOpen={showDetails} onClose={() => setShowDetails(false)} title="Failover Status">
          <div className="space-y-6">
            {/* Current Region */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Region</h3>
              <div
                className={`
                p-4 rounded-lg border-2
                ${isHealthy ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}
              `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{currentRegion.name}</div>
                    <div className="text-sm text-gray-600">{currentRegion.id}</div>
                  </div>
                  <div
                    className={`
                    px-3 py-1 rounded-full text-sm font-medium
                    ${isHealthy ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                  `}
                  >
                    {isHealthy ? 'Healthy' : 'Degraded'}
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Failover */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Manual Failover</h3>
              <button
                onClick={() => setShowFailoverModal(true)}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Switch Region
              </button>
            </div>

            {/* Recent Events */}
            {recentEvents.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Events</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {recentEvents
                    .slice()
                    .reverse()
                    .map((event, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {event.type.replace(/_/g, ' ').toUpperCase()}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">{event.message}</div>
                          </div>
                          <div className="text-xs text-gray-500 ml-2">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Failover History */}
            {failoverHistory.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Failover History (Last 5)
                </h3>
                <div className="space-y-2">
                  {failoverHistory
                    .slice(-5)
                    .reverse()
                    .map((event, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-900">
                              {event.from} → {event.to}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">{event.reason}</div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Failover Confirmation Modal */}
      {showFailoverModal && (
        <Modal
          isOpen={showFailoverModal}
          onClose={() => setShowFailoverModal(false)}
          title="Manual Failover"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Select a region to switch to. This will reload the application.
            </p>

            <div className="space-y-2">
              {availableRegions.map((region) => (
                <label
                  key={region.id}
                  className={`
                    flex items-center p-4 rounded-lg border-2 cursor-pointer
                    ${selectedRegion === region.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                    ${region.id === currentRegion.id ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300'}
                  `}
                >
                  <input
                    type="radio"
                    name="region"
                    value={region.id}
                    checked={selectedRegion === region.id}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    disabled={region.id === currentRegion.id}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{region.name}</div>
                    <div className="text-sm text-gray-600">{region.id}</div>
                  </div>
                  {region.id === currentRegion.id && (
                    <span className="text-xs text-gray-500">Current</span>
                  )}
                </label>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowFailoverModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleFailover}
                disabled={!selectedRegion || selectedRegion === currentRegion.id || isLoading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Switching...' : 'Switch Region'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default FailoverStatusIndicator;

