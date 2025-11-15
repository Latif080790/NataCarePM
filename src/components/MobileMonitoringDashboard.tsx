/**
 * Mobile Monitoring Dashboard Component
 * Real-time metrics for camera, GPS, and push notifications
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Camera, MapPin, Bell, TrendingUp, Activity } from 'lucide-react';
import { mobileAnalytics } from '@/utils/mobileAnalytics';

export function MobileMonitoringDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const refreshInterval = 30000; // 30 seconds

  useEffect(() => {
    const updateMetrics = () => {
      const data = mobileAnalytics.exportMetrics();
      setMetrics(data);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (!metrics) {
    return <div>Loading metrics...</div>;
  }

  const { camera, gps, push } = metrics;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold gradient-text">Mobile Feature Monitoring</h2>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
          <span className="text-sm text-gray-600">Live Updates Every {refreshInterval / 1000}s</span>
        </div>
      </div>

      {/* Camera Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-500" />
            Camera Upload Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              label="Total Uploads"
              value={camera.total}
              icon={<Camera className="w-4 h-4" />}
            />
            <MetricCard
              label="Success Rate"
              value={`${camera.successRate.toFixed(1)}%`}
              icon={<TrendingUp className="w-4 h-4" />}
              color={camera.successRate >= 95 ? 'text-green-500' : 'text-yellow-500'}
            />
            <MetricCard
              label="Target"
              value="95%+"
              icon={<Activity className="w-4 h-4" />}
              color="text-gray-500"
            />
          </div>

          {camera.total > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Success Rate Progress</span>
                <span className={camera.successRate >= 95 ? 'text-green-500' : 'text-yellow-500'}>
                  {camera.successRate.toFixed(1)}% / 95%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    camera.successRate >= 95 ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min(camera.successRate, 100)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* GPS Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            GPS Tracking Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              label="Total Captures"
              value={gps.total}
              icon={<MapPin className="w-4 h-4" />}
            />
            <MetricCard
              label="Avg Accuracy"
              value={`±${Math.round(gps.stats.average)}m`}
              icon={<Activity className="w-4 h-4" />}
              color="text-blue-500"
            />
            <MetricCard
              label="Geofence Compliance"
              value={`${gps.stats.geofenceCompliance.toFixed(1)}%`}
              icon={<TrendingUp className="w-4 h-4" />}
              color={gps.stats.geofenceCompliance >= 95 ? 'text-green-500' : 'text-yellow-500'}
            />
            <MetricCard
              label="Target"
              value="95%+"
              icon={<Activity className="w-4 h-4" />}
              color="text-gray-500"
            />
          </div>

          {gps.total > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Accuracy Range</p>
                <p className="text-lg font-semibold">
                  {Math.round(gps.stats.min)}m - {Math.round(gps.stats.max)}m
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Geofence Status</p>
                <div className="flex justify-between text-sm">
                  <span>Compliance</span>
                  <span className={gps.stats.geofenceCompliance >= 95 ? 'text-green-500' : 'text-yellow-500'}>
                    {gps.stats.geofenceCompliance.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className={`h-2 rounded-full ${
                      gps.stats.geofenceCompliance >= 95 ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(gps.stats.geofenceCompliance, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Push Notification Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-500" />
            Push Notification Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              label="Total Sent"
              value={push.total}
              icon={<Bell className="w-4 h-4" />}
            />
            <MetricCard
              label="Delivery Rate"
              value={`${push.stats.deliveryRate.toFixed(1)}%`}
              icon={<Activity className="w-4 h-4" />}
              color="text-blue-500"
            />
            <MetricCard
              label="Open Rate"
              value={`${push.stats.openRate.toFixed(1)}%`}
              icon={<TrendingUp className="w-4 h-4" />}
              color={push.stats.openRate >= 40 ? 'text-green-500' : 'text-yellow-500'}
            />
            <MetricCard
              label="Target"
              value="40%+"
              icon={<Activity className="w-4 h-4" />}
              color="text-gray-500"
            />
          </div>

          {push.total > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Open Rate Progress</span>
                <span className={push.stats.openRate >= 40 ? 'text-green-500' : 'text-yellow-500'}>
                  {push.stats.openRate.toFixed(1)}% / 40%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    push.stats.openRate >= 40 ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min(push.stats.openRate, 100)}%` }}
                />
              </div>
              {push.stats.avgTimeToOpen > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  Avg Time to Open: {Math.round(push.stats.avgTimeToOpen / 1000)}s
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-emerald-50 to-blue-50">
        <CardHeader>
          <CardTitle>Overall Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <StatusItem
              label="Camera System"
              status={camera.successRate >= 95 ? 'Excellent' : 'Needs Attention'}
              color={camera.successRate >= 95 ? 'text-green-600' : 'text-yellow-600'}
            />
            <StatusItem
              label="GPS Accuracy"
              status={gps.stats.geofenceCompliance >= 95 ? 'Excellent' : 'Needs Attention'}
              color={gps.stats.geofenceCompliance >= 95 ? 'text-green-600' : 'text-yellow-600'}
            />
            <StatusItem
              label="Push Notifications"
              status={push.stats.openRate >= 40 ? 'Excellent' : 'Needs Attention'}
              color={push.stats.openRate >= 40 ? 'text-green-600' : 'text-yellow-600'}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, icon, color = 'text-gray-700' }: any) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function StatusItem({ label, status, color }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{label}</span>
      <span className={`font-semibold ${color}`}>{status}</span>
    </div>
  );
}

