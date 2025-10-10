import React, { useState, useEffect } from 'react';
import { useRealtimeCollaboration } from '../contexts/RealtimeCollaborationContext';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { Activity, Clock, Filter, RefreshCw, ExternalLink } from 'lucide-react';

interface LiveActivityFeedProps {
    limit?: number;
    showFilter?: boolean;
    compact?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number;
}

type ActivityFilter = 'all' | 'tasks' | 'comments' | 'documents' | 'status';

export default function LiveActivityFeed({ 
    limit = 10, 
    showFilter = true, 
    compact = false,
    autoRefresh = true,
    refreshInterval = 30000 // 30 seconds
}: LiveActivityFeedProps) {
    const { recentActivity, sendActivityEvent } = useRealtimeCollaboration();
    const [filter, setFilter] = useState<ActivityFilter>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Filter activities based on selected filter
    const filteredActivity = recentActivity.filter(activity => {
        if (filter === 'all') return true;
        
        switch (filter) {
            case 'tasks':
                return ['task_created', 'task_updated', 'task_deleted'].includes(activity.action);
            case 'comments':
                return activity.action === 'comment_added';
            case 'documents':
                return activity.action === 'file_uploaded';
            case 'status':
                return activity.action === 'status_changed';
            default:
                return true;
        }
    }).slice(0, limit);

    // Auto refresh functionality
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            setIsRefreshing(true);
            setTimeout(() => setIsRefreshing(false), 1000);
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval]);

    const getActivityIcon = (action: string) => {
        const iconClass = "w-4 h-4";
        
        switch (action) {
            case 'task_created':
                return <div className={`${iconClass} bg-green-500 rounded-full`} />;
            case 'task_updated':
                return <div className={`${iconClass} bg-blue-500 rounded-full`} />;
            case 'task_deleted':
                return <div className={`${iconClass} bg-red-500 rounded-full`} />;
            case 'comment_added':
                return <div className={`${iconClass} bg-purple-500 rounded-full`} />;
            case 'file_uploaded':
                return <div className={`${iconClass} bg-orange-500 rounded-full`} />;
            case 'status_changed':
                return <div className={`${iconClass} bg-yellow-500 rounded-full`} />;
            default:
                return <div className={`${iconClass} bg-gray-500 rounded-full`} />;
        }
    };

    const getActionMessage = (activity: any) => {
        const actionMessages = {
            'task_created': 'membuat task baru',
            'task_updated': 'memperbarui task',
            'task_deleted': 'menghapus task',
            'comment_added': 'menambahkan komentar pada',
            'file_uploaded': 'mengupload dokumen ke',
            'status_changed': 'mengubah status'
        };

        return actionMessages[activity.action as keyof typeof actionMessages] || activity.action;
    };

    const getTimeAgo = (timestamp: Date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
        
        if (diffInSeconds < 60) {
            return 'baru saja';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} menit yang lalu`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} jam yang lalu`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} hari yang lalu`;
        }
    };

    const handleActivityClick = (activity: any) => {
        // Navigate to the relevant entity
        const routes = {
            'task': `/tasks/${activity.entityId}`,
            'comment': `/tasks/${activity.entityId}#comment-${activity.id}`,
            'document': `/documents/${activity.entityId}`,
            'project': `/projects/${activity.entityId}`
        };

        const route = routes[activity.entityType as keyof typeof routes];
        if (route) {
            window.location.href = route;
        }
    };

    if (compact) {
        return (
            <div className="space-y-2">
                {filteredActivity.slice(0, 3).map((activity) => (
                    <div 
                        key={activity.id} 
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleActivityClick(activity)}
                    >
                        {getActivityIcon(activity.action)}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-night-black truncate">
                                <span className="font-medium">{activity.userName}</span>
                                {' '}{getActionMessage(activity)}{' '}
                                <span className="font-medium">{activity.entityTitle}</span>
                            </p>
                            <p className="text-xs text-palladium">{getTimeAgo(activity.timestamp)}</p>
                        </div>
                        <ExternalLink className="w-3 h-3 text-palladium opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ))}
                
                {filteredActivity.length === 0 && (
                    <div className="text-center py-4 text-palladium">
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Belum ada aktivitas</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className={`w-5 h-5 text-violet-essence ${isRefreshing ? 'animate-spin' : ''}`} />
                        <CardTitle className="text-lg">Live Activity Feed</CardTitle>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {showFilter && (
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as ActivityFilter)}
                                className="px-2 py-1 text-sm border rounded-md"
                            >
                                <option value="all">Semua Aktivitas</option>
                                <option value="tasks">Tasks</option>
                                <option value="comments">Komentar</option>
                                <option value="documents">Dokumen</option>
                                <option value="status">Status</option>
                            </select>
                        )}
                        
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setIsRefreshing(true);
                                setTimeout(() => setIsRefreshing(false), 1000);
                            }}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="pt-0">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredActivity.map((activity) => (
                        <div 
                            key={activity.id} 
                            className="group flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 border border-transparent hover:border-violet-essence/20"
                            onClick={() => handleActivityClick(activity)}
                        >
                            <div className="flex-shrink-0 mt-1">
                                {getActivityIcon(activity.action)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-night-black">
                                            <span className="font-semibold">{activity.userName}</span>
                                            {' '}{getActionMessage(activity)}{' '}
                                            <span className="font-medium text-violet-essence">{activity.entityTitle}</span>
                                        </p>
                                        
                                        {activity.details && (
                                            <p className="text-xs text-palladium mt-1 line-clamp-2">
                                                {activity.details.description || activity.details.comment}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2 ml-2">
                                        <span className="text-xs text-palladium whitespace-nowrap">
                                            {getTimeAgo(activity.timestamp)}
                                        </span>
                                        <ExternalLink className="w-3 h-3 text-palladium opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        activity.entityType === 'task' ? 'bg-blue-100 text-blue-700' :
                                        activity.entityType === 'comment' ? 'bg-purple-100 text-purple-700' :
                                        activity.entityType === 'document' ? 'bg-orange-100 text-orange-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {activity.entityType}
                                    </span>
                                    
                                    <Clock className="w-3 h-3 text-palladium" />
                                    <span className="text-xs text-palladium">
                                        {activity.timestamp.toLocaleTimeString('id-ID', { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredActivity.length === 0 && (
                    <div className="text-center py-8 text-palladium">
                        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Belum ada aktivitas untuk filter ini</p>
                        <p className="text-xs mt-1">Aktivitas akan muncul secara real-time</p>
                    </div>
                )}

                {filteredActivity.length >= limit && (
                    <div className="text-center pt-4 border-t">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.location.href = '/activity'}
                        >
                            Lihat Semua Aktivitas
                            <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Hook for sending activity events easily
export const useActivityTracker = () => {
    const { sendActivityEvent } = useRealtimeCollaboration();

    const trackActivity = (
        action: string,
        entityType: string,
        entityId: string,
        entityTitle: string,
        details?: any
    ) => {
        sendActivityEvent({
            action: action as any,
            entityType: entityType as any,
            entityId,
            entityTitle,
            details
        });
    };

    return { trackActivity };
};