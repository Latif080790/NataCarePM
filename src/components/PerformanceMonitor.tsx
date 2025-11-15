/**
 * Performance Monitor Component
 * 
 * Displays real-time performance metrics in development mode
 */

import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '@/utils/performance/performanceMonitor';
import { bundleAnalyzer } from '@/utils/performance/bundleAnalyzer';

interface PerformanceData {
  avgRenderTime: number;
  avgApiCallTime: number;
  totalMetrics: number;
  memoryUsage: { used: number; total: number } | null;
  bundleSize: number;
}

const PerformanceMonitor: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    avgRenderTime: 0,
    avgApiCallTime: 0,
    totalMetrics: 0,
    memoryUsage: null,
    bundleSize: 0,
  });
  
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development mode
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    
    const interval = setInterval(() => {
      const report = performanceMonitor.getPerformanceReport();
      const memoryUsage = performanceMonitor.getMemoryUsage();
      
      setPerformanceData({
        avgRenderTime: report.avgRenderTime,
        avgApiCallTime: report.avgApiCallTime,
        totalMetrics: report.totalMetrics,
        memoryUsage,
        bundleSize: bundleAnalyzer.analyzeBundle().totalSize,
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div 
      className={`fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg transition-all duration-300 z-50 ${
        isVisible ? 'opacity-100' : 'opacity-50 hover:opacity-100'
      }`}
      style={{ maxWidth: '300px' }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Performance Monitor</h3>
        <button 
          onClick={() => setIsVisible(!isVisible)}
          className="text-gray-300 hover:text-white"
        >
          {isVisible ? '−' : '+'}
        </button>
      </div>
      
      {isVisible && (
        <div className="text-xs space-y-1">
          <div>
            <span className="text-gray-400">Avg Render:</span>{' '}
            <span className={performanceData.avgRenderTime > 16 ? 'text-red-400' : 'text-green-400'}>
              {performanceData.avgRenderTime.toFixed(2)}ms
            </span>
          </div>
          
          <div>
            <span className="text-gray-400">Avg API:</span>{' '}
            <span className={performanceData.avgApiCallTime > 1000 ? 'text-red-400' : 'text-green-400'}>
              {performanceData.avgApiCallTime.toFixed(0)}ms
            </span>
          </div>
          
          <div>
            <span className="text-gray-400">Metrics:</span>{' '}
            <span>{performanceData.totalMetrics}</span>
          </div>
          
          {performanceData.memoryUsage && (
            <div>
              <span className="text-gray-400">Memory:</span>{' '}
              <span>
                {(performanceData.memoryUsage.used / 1024 / 1024).toFixed(1)}MB /{' '}
                {(performanceData.memoryUsage.total / 1024 / 1024).toFixed(1)}MB
              </span>
            </div>
          )}
          
          <div>
            <span className="text-gray-400">Bundle:</span>{' '}
            <span>{(performanceData.bundleSize / 1024).toFixed(1)}KB</span>
          </div>
          
          <div className="pt-2">
            <button 
              onClick={() => bundleAnalyzer.logAnalysis()}
              className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
            >
              Analyze Bundle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
