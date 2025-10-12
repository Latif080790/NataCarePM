/**
 * 📊 MONITORING DASHBOARD COMPONENT
 * Real-time system monitoring dashboard with metrics, health status, and analytics
 */

import React, { useState } from 'react';
import { Card } from './Card';
import MetricCard from './MetricCard';
import { Button } from './Button';
import { Modal } from './Modal';
import { 
    useSystemMetrics, 
    useErrorLogs, 
    useSystemHealth,
    useDashboardAnalytics 
} from '../hooks/useMonitoring';
import { monitoringService, SystemMetrics, ErrorLog } from '../api/monitoringService';

// ============================================
// TYPES
// ============================================

interface MonitoringDashboardProps {
    className?: string;
    compact?: boolean;
    showControls?: boolean;
}

interface HealthStatusProps {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    metrics: SystemMetrics | null;
}

interface ErrorLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    errors: ErrorLog[];
    onResolve: (errorId: string) => void;
}

// ============================================
// HEALTH STATUS COMPONENT
// ============================================

const HealthStatus: React.FC<HealthStatusProps> = ({ status, issues, metrics }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'healthy': return 'text-green-600 bg-green-100';
            case 'warning': return 'text-yellow-600 bg-yellow-100';
            case 'critical': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'healthy': return '✅';
            case 'warning': return '⚠️';
            case 'critical': return '🔴';
            default: return '❓';
        }
    };

    return (
        <Card className="border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    {getStatusIcon()}
                    System Health
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                    {status.toUpperCase()}
                </span>
            </div>

            {metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {Math.round(metrics.cpu)}%
                        </div>
                        <div className="text-sm text-gray-600">CPU Usage</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {Math.round(metrics.memory)}MB
                        </div>
                        <div className="text-sm text-gray-600">Memory</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {metrics.activeUsers}
                        </div>
                        <div className="text-sm text-gray-600">Active Users</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                            {Math.round(metrics.responseTime)}ms
                        </div>
                        <div className="text-sm text-gray-600">Response Time</div>
                    </div>
                </div>
            )}

            {issues.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <h4 className="font-medium text-yellow-800 mb-2">⚠️ Issues Detected:</h4>
                    <ul className="space-y-1">
                        {issues.map((issue, index) => (
                            <li key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                                <span className="text-yellow-500 mt-1">•</span>
                                {issue}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </Card>
    );
};

// ============================================
// ERROR LOG MODAL
// ============================================

const ErrorLogModal: React.FC<ErrorLogModalProps> = ({ 
    isOpen, 
    onClose, 
    errors, 
    onResolve 
}) => {
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-600 bg-red-100';
            case 'high': return 'text-orange-600 bg-orange-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'low': return 'text-blue-600 bg-blue-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Error Logs" size="lg">
            <div className="space-y-4 max-h-96 overflow-y-auto">
                {errors.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        ✅ No unresolved errors
                    </div>
                ) : (
                    errors.map((error) => (
                        <div key={error.errorId} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start justify-between mb-2">
                                <span className={`px-2 py-1 rounded text-sm font-medium ${getSeverityColor(error.severity)}`}>
                                    {error.severity.toUpperCase()}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {error.timestamp.toLocaleString()}
                                </span>
                            </div>
                            
                            <h4 className="font-medium text-gray-900 mb-2">
                                {error.message}
                            </h4>
                            
                            {error.component && (
                                <p className="text-sm text-gray-600 mb-1">
                                    Component: <span className="font-mono">{error.component}</span>
                                </p>
                            )}
                            
                            {error.userName && (
                                <p className="text-sm text-gray-600 mb-2">
                                    User: {error.userName}
                                </p>
                            )}
                            
                            {error.stack && (
                                <details className="mt-2">
                                    <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                                        Stack Trace
                                    </summary>
                                    <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                                        {error.stack}
                                    </pre>
                                </details>
                            )}
                            
                            <div className="flex justify-end mt-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onResolve(error.errorId)}
                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                >
                                    ✅ Mark Resolved
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Modal>
    );
};

// ============================================
// MAIN MONITORING DASHBOARD
// ============================================

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
    className = '',
    compact = false,
    showControls = true
}) => {
    const { metrics: systemMetrics } = useSystemMetrics();
    const { errors, loading: errorsLoading, resolveError } = useErrorLogs(20);
    const { health, refresh: refreshHealth } = useSystemHealth();
    const { analytics, refresh: refreshAnalytics } = useDashboardAnalytics('day');

    const [showErrorModal, setShowErrorModal] = useState(false);
    const [isMonitoring, setIsMonitoring] = useState(false);

    // ============================================
    // MONITORING CONTROLS
    // ============================================

    const startMonitoring = async () => {
        try {
            monitoringService.startMonitoring();
            setIsMonitoring(true);
        } catch (error) {
            console.error('Failed to start monitoring:', error);
        }
    };

    const stopMonitoring = () => {
        try {
            monitoringService.stopMonitoring();
            setIsMonitoring(false);
        } catch (error) {
            console.error('Failed to stop monitoring:', error);
        }
    };

    // ============================================
    // DATA PROCESSING
    // ============================================

    const metricsChartData = analytics?.metrics ? 
        analytics.metrics.slice(-24).map((metric: any) => ({
            name: new Date(metric.timestamp).getHours() + ':00',
            cpu: Math.round(metric.cpu),
            memory: Math.round(metric.memory),
            responseTime: Math.round(metric.responseTime),
            errorRate: metric.errorRate
        })) : [];

    const errorsByHour = analytics?.errors ? 
        analytics.errors.reduce((acc: any, error: any) => {
            const hour = new Date(error.timestamp).getHours();
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {}) : {};

    const errorChartData = Array.from({ length: 24 }, (_, i) => ({
        name: i + ':00',
        errors: errorsByHour[i] || 0
    }));

    // ============================================
    // RENDER
    // ============================================

    if (compact) {
        return (
            <div className={`space-y-4 ${className}`}>
                {/* Compact Health Status */}
                <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                            health?.status === 'healthy' ? 'bg-green-500' :
                            health?.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium">System Status</span>
                    </div>
                    
                    {systemMetrics && (
                        <>
                            <div className="text-sm">
                                CPU: <span className="font-mono">{Math.round(systemMetrics.cpu)}%</span>
                            </div>
                            <div className="text-sm">
                                Mem: <span className="font-mono">{Math.round(systemMetrics.memory)}MB</span>
                            </div>
                            <div className="text-sm">
                                Users: <span className="font-mono">{systemMetrics.activeUsers}</span>
                            </div>
                        </>
                    )}
                    
                    {errors.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowErrorModal(true)}
                            className="text-red-600 border-red-600"
                        >
                            🔴 {errors.length} Errors
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header Controls */}
            {showControls && (
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">
                        📊 System Monitoring
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                            <span className="text-sm text-gray-600">
                                {isMonitoring ? 'Monitoring Active' : 'Monitoring Stopped'}
                            </span>
                        </div>
                        
                        <Button
                            variant={isMonitoring ? 'secondary' : 'primary'}
                            size="sm"
                            onClick={isMonitoring ? stopMonitoring : startMonitoring}
                        >
                            {isMonitoring ? '⏹️ Stop' : '▶️ Start'} Monitoring
                        </Button>
                        
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                refreshHealth();
                                refreshAnalytics();
                            }}
                        >
                            🔄 Refresh
                        </Button>
                    </div>
                </div>
            )}

            {/* System Health Status */}
            {health && (
                <HealthStatus 
                    status={health.status}
                    issues={health.issues}
                    metrics={health.metrics}
                />
            )}

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Activities"
                    value={analytics?.summary?.totalActivities || 0}
                    icon="📊"
                    trend={undefined}
                />
                <MetricCard
                    title="Total Errors"
                    value={analytics?.summary?.totalErrors || 0}
                    icon="🔴"
                    trend={undefined}
                />
                <MetricCard
                    title="Critical Errors"
                    value={analytics?.summary?.criticalErrors || 0}
                    icon="🚨"
                    trend={undefined}
                />
                <MetricCard
                    title="Active Users"
                    value={systemMetrics?.activeUsers || 0}
                    icon="👥"
                    trend={undefined}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Metrics Chart */}
                <Card>
                    <h3 className="text-lg font-semibold mb-4">System Metrics (24h)</h3>
                    {metricsChartData.length > 0 ? (
                        <div className="h-64">
                            <svg width="100%" height="100%" viewBox="0 0 800 200">
                                {/* Simple line chart placeholder */}
                                <line x1="50" y1="150" x2="750" y2="50" stroke="#3B82F6" strokeWidth="2" />
                                <text x="50" y="170" className="text-xs fill-gray-600">CPU Usage Trend</text>
                            </svg>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            No metrics data available
                        </div>
                    )}
                </Card>

                {/* Error Rate Chart */}
                <Card>
                    <h3 className="text-lg font-semibold mb-4">Error Rate (24h)</h3>
                    {errorChartData.length > 0 ? (
                        <div className="h-64">
                            <svg width="100%" height="100%" viewBox="0 0 800 200">
                                {/* Simple bar chart placeholder */}
                                {errorChartData.slice(0, 12).map((item, index) => (
                                    <rect 
                                        key={index}
                                        x={50 + index * 60} 
                                        y={150 - (item.errors * 10)} 
                                        width="40" 
                                        height={item.errors * 10} 
                                        fill="#EF4444" 
                                    />
                                ))}
                                <text x="50" y="170" className="text-xs fill-gray-600">Error Rate by Hour</text>
                            </svg>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            No error data available
                        </div>
                    )}
                </Card>
            </div>

            {/* Recent Errors */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Recent Errors</h3>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowErrorModal(true)}
                        disabled={errors.length === 0}
                    >
                        View All ({errors.length})
                    </Button>
                </div>

                {errorsLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading errors...</div>
                ) : errors.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        ✅ No unresolved errors
                    </div>
                ) : (
                    <div className="space-y-2">
                        {errors.slice(0, 5).map((error) => (
                            <div key={error.errorId} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded">
                                <div className="flex-1">
                                    <span className="font-medium text-red-800">
                                        {error.message}
                                    </span>
                                    <div className="text-sm text-red-600">
                                        {error.timestamp.toLocaleString()} • {error.severity}
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => resolveError(error.errorId)}
                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                >
                                    Resolve
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Error Log Modal */}
            <ErrorLogModal
                isOpen={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                errors={errors}
                onResolve={resolveError}
            />
        </div>
    );
};

export default MonitoringDashboard;