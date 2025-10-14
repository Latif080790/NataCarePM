import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Info,
  Activity,
  Zap
} from 'lucide-react';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  action?: string;
  actionLabel?: string;
}

interface MonitoringAlertsPanelProps {
  onActionClick?: (alert: Alert) => void;
}

export const MonitoringAlertsPanel: React.FC<MonitoringAlertsPanelProps> = ({
  onActionClick
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  useEffect(() => {
    generateAlerts();
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        addNewAlert();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const generateAlerts = () => {
    const mockAlerts: Alert[] = [
      {
        id: '1',
        type: 'critical',
        title: 'Budget Threshold Exceeded',
        message: 'Material costs exceeded planned budget by 15%. Immediate action required.',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        action: 'review-budget',
        actionLabel: 'Review Budget'
      },
      {
        id: '2',
        type: 'warning',
        title: 'Task Deadline Approaching',
        message: '5 tasks due within 48 hours. Consider resource reallocation.',
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        action: 'view-tasks',
        actionLabel: 'View Tasks'
      },
      {
        id: '3',
        type: 'info',
        title: 'Weekly Report Available',
        message: 'Project performance report for Week 32 is now available.',
        timestamp: new Date(Date.now() - 1000 * 60 * 120),
        action: 'view-report',
        actionLabel: 'View Report'
      },
      {
        id: '4',
        type: 'success',
        title: 'Milestone Achieved',
        message: 'Foundation work completed ahead of schedule by 3 days.',
        timestamp: new Date(Date.now() - 1000 * 60 * 180),
      },
      {
        id: '5',
        type: 'warning',
        title: 'Weather Alert',
        message: 'Heavy rain forecast for next 3 days. May impact outdoor work.',
        timestamp: new Date(Date.now() - 1000 * 60 * 240),
        action: 'adjust-schedule',
        actionLabel: 'Adjust Schedule'
      }
    ];

    setAlerts(mockAlerts);
  };

  const addNewAlert = () => {
    const newAlert: Alert = {
      id: Date.now().toString(),
      type: Math.random() > 0.5 ? 'info' : 'warning',
      title: 'System Update',
      message: 'New data synchronized from field operations.',
      timestamp: new Date()
    };
    
    setAlerts(prev => [newAlert, ...prev].slice(0, 10));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      default:
        return <Activity className="w-5 h-5 text-slate-400" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'from-red-500/20 to-red-600/10 border-red-500/30';
      case 'warning':
        return 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30';
      case 'info':
        return 'from-blue-500/20 to-blue-600/10 border-blue-500/30';
      case 'success':
        return 'from-green-500/20 to-green-600/10 border-green-500/30';
      default:
        return 'from-slate-500/20 to-slate-600/10 border-slate-500/30';
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.type === filter);

  const criticalCount = alerts.filter(a => a.type === 'critical').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;

  return (
    <Card className="card-enhanced">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/30 to-red-500/30 flex items-center justify-center">
            <Zap className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">System Monitoring</h3>
            <p className="text-xs text-slate-400">Real-time alerts & notifications</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {criticalCount > 0 && (
            <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30">
              {criticalCount} Critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-semibold border border-yellow-500/30">
              {warningCount} Warning
            </span>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-4 overflow-x-auto">
        {['all', 'critical', 'warning', 'info'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              filter === f
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && (
              <span className="ml-1">
                ({alerts.filter(a => a.type === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500/50" />
            <p className="text-sm">No {filter !== 'all' ? filter : ''} alerts</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`glass border rounded-xl p-4 bg-gradient-to-br ${getAlertColor(alert.type)} transition-all hover:scale-[1.01]`}
            >
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-sm font-semibold text-slate-100">{alert.title}</h4>
                    <span className="text-xs text-slate-500 flex items-center space-x-1 ml-2">
                      <Clock className="w-3 h-3" />
                      <span>{getTimeAgo(alert.timestamp)}</span>
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-300 mb-2">
                    {alert.message}
                  </p>
                  
                  {alert.action && (
                    <button
                      onClick={() => onActionClick && onActionClick(alert)}
                      className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      {alert.actionLabel || 'Take Action'} →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Status Footer */}
      <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-slate-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>System Monitoring Active</span>
        </div>
        <span className="text-slate-500">Last update: {getTimeAgo(new Date())}</span>
      </div>
    </Card>
  );
};
