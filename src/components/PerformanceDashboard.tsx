/**
 * Performance Dashboard Component
 * Real-time display of Core Web Vitals and custom metrics
 */

import React, { useState, useEffect } from 'react';
import { usePerformanceMetrics } from '@/hooks/useWebVitals';
import { Activity, Zap, Clock, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface MetricCardProps {
  name: string;
  value: number | null;
  unit: string;
  good: number;
  poor: number;
  icon: React.ReactNode;
  description: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ name, value, unit, good, poor, icon, description }) => {
  if (value === null) {
    return (
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {icon}
              <h3 className="text-sm font-medium text-gray-700">{name}</h3>
            </div>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-gray-300">--</p>
          <p className="text-xs text-gray-400 mt-1">Collecting data...</p>
        </div>
      </div>
    );
  }

  const rating = value <= good ? 'good' : value <= poor ? 'needs-improvement' : 'poor';
  const ratingColors = {
    good: 'text-green-600 bg-green-50 border-green-200',
    'needs-improvement': 'text-yellow-600 bg-yellow-50 border-yellow-200',
    poor: 'text-red-600 bg-red-50 border-red-200'
  };

  const ratingIcons = {
    good: <CheckCircle className="w-4 h-4" />,
    'needs-improvement': <AlertTriangle className="w-4 h-4" />,
    poor: <AlertTriangle className="w-4 h-4" />
  };

  const formatValue = (val: number) => {
    return name === 'CLS' ? val.toFixed(3) : Math.round(val);
  };

  return (
    <div className={`bg-white rounded-lg shadow p-4 border ${ratingColors[rating]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {icon}
            <h3 className="text-sm font-medium text-gray-700">{name}</h3>
          </div>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${ratingColors[rating]}`}>
          {ratingIcons[rating]}
          <span className="capitalize">{rating.replace('-', ' ')}</span>
        </div>
      </div>
      <div className="mt-3">
        <p className={`text-2xl font-bold ${ratingColors[rating]}`}>
          {formatValue(value)}{unit}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Good: ≤{good}{unit} | Poor: &gt;{poor}{unit}
        </p>
      </div>
    </div>
  );
};

export const PerformanceDashboard: React.FC = () => {
  const { getMetrics, getReport } = usePerformanceMetrics();
  const [metrics, setMetrics] = useState(getMetrics());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Update metrics every 5 seconds
    const interval = setInterval(() => {
      setMetrics(getMetrics());
    }, 5000);

    // Keyboard shortcut: Ctrl+Shift+P to toggle
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [getMetrics]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Show Performance Dashboard (Ctrl+Shift+P)"
      >
        <Activity className="w-5 h-5" />
      </button>
    );
  }

  const report = getReport();
  const sessionDuration = Math.round((Date.now() - metrics.sessionStart) / 1000);

  return (
    <div className="fixed bottom-4 right-4 w-[800px] max-h-[80vh] overflow-y-auto bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-bold">Performance Dashboard</h2>
              <p className="text-xs text-blue-100">Real-time monitoring (Ctrl+Shift+P to toggle)</p>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white hover:bg-blue-800 p-2 rounded transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Core Web Vitals */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Core Web Vitals
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              name="LCP"
              value={metrics.LCP}
              unit="ms"
              good={2500}
              poor={4000}
              icon={<TrendingDown className="w-4 h-4 text-blue-600" />}
              description="Largest Contentful Paint"
            />
            <MetricCard
              name="FID"
              value={metrics.FID}
              unit="ms"
              good={100}
              poor={300}
              icon={<Clock className="w-4 h-4 text-purple-600" />}
              description="First Input Delay"
            />
            <MetricCard
              name="CLS"
              value={metrics.CLS}
              unit=""
              good={0.1}
              poor={0.25}
              icon={<Activity className="w-4 h-4 text-green-600" />}
              description="Cumulative Layout Shift"
            />
            <MetricCard
              name="INP"
              value={metrics.INP}
              unit="ms"
              good={200}
              poor={500}
              icon={<Zap className="w-4 h-4 text-yellow-600" />}
              description="Interaction to Next Paint"
            />
            <MetricCard
              name="FCP"
              value={metrics.FCP}
              unit="ms"
              good={1800}
              poor={3000}
              icon={<Clock className="w-4 h-4 text-indigo-600" />}
              description="First Contentful Paint"
            />
            <MetricCard
              name="TTFB"
              value={metrics.TTFB}
              unit="ms"
              good={800}
              poor={1800}
              icon={<TrendingDown className="w-4 h-4 text-red-600" />}
              description="Time to First Byte"
            />
          </div>
        </div>

        {/* Session Stats */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Session Statistics</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Session Duration</p>
              <p className="text-lg font-bold text-gray-800">
                {Math.floor(sessionDuration / 60)}m {sessionDuration % 60}s
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Page Views</p>
              <p className="text-lg font-bold text-gray-800">{metrics.pageViews}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Error Count</p>
              <p className="text-lg font-bold text-gray-800">{metrics.errorCount}</p>
            </div>
          </div>
        </div>

        {/* Top Routes */}
        {Object.keys(metrics.routeLoadTime).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Route Performance</h3>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 max-h-40 overflow-y-auto">
              {Object.entries(report.routePerformance || {})
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 5)
                .map(([route, avg]) => {
                  const avgNum = avg as number;
                  return (
                    <div key={route} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                      <span className="text-xs text-gray-700 font-mono truncate flex-1">{route}</span>
                      <span className={`text-xs font-medium ml-2 ${avgNum > 1000 ? 'text-red-600' : avgNum > 500 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {avgNum}ms
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Connection Info */}
        {report.connection && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Network Connection</h3>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-medium text-gray-800">{report.connection.effectiveType}</span>
                </div>
                <div>
                  <span className="text-gray-600">RTT:</span>
                  <span className="ml-2 font-medium text-gray-800">{report.connection.rtt}ms</span>
                </div>
                <div>
                  <span className="text-gray-600">Downlink:</span>
                  <span className="ml-2 font-medium text-gray-800">{report.connection.downlink} Mbps</span>
                </div>
                <div>
                  <span className="text-gray-600">Save Data:</span>
                  <span className="ml-2 font-medium text-gray-800">{report.connection.saveData ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceDashboard;
