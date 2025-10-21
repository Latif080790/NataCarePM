import React from 'react';
import { useState } from 'react';
import { useRealtimeCollaboration } from '@/contexts/RealtimeCollaborationContext';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { Users, Circle, Eye, MessageCircle, Activity, Clock } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { id } from 'date-fns/locale';

interface OnlineUsersDisplayProps {
  showActivity?: boolean;
  compact?: boolean;
}

export default function OnlineUsersDisplay({
  showActivity = true,
  compact = false,
}: OnlineUsersDisplayProps) {
  const { onlineUsers, currentUserPresence, recentActivity, isUserOnline, typingUsers } =
    useRealtimeCollaboration();

  const [showDetails, setShowDetails] = useState(!compact);
  const [selectedTab, setSelectedTab] = useState<'users' | 'activity'>('users');

  const activeUsers = onlineUsers.filter((user) => isUserOnline(user.id));
  const recentUsers = onlineUsers.filter((user) => !isUserOnline(user.id)).slice(0, 5);

  const getViewLabel = (view: string): string => {
    const viewMap: { [key: string]: string } = {
      dashboard: 'Dashboard',
      tasks: 'Tasks',
      kanban: 'Kanban Board',
      gantt: 'Gantt Chart',
      documents: 'Documents',
      reports: 'Reports',
      finance: 'Finance',
      settings: 'Settings',
    };
    return viewMap[view] || view;
  };

  const getActionLabel = (action: string): string => {
    const actionMap: { [key: string]: string } = {
      task_created: 'membuat task',
      task_updated: 'memperbarui task',
      task_deleted: 'menghapus task',
      comment_added: 'menambah komentar',
      file_uploaded: 'mengupload file',
      status_changed: 'mengubah status',
    };
    return actionMap[action] || action;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'task_created':
      case 'task_updated':
        return <Circle className="w-3 h-3 text-blue-500" />;
      case 'task_deleted':
        return <Circle className="w-3 h-3 text-red-500" />;
      case 'comment_added':
        return <MessageCircle className="w-3 h-3 text-green-500" />;
      case 'file_uploaded':
        return <Circle className="w-3 h-3 text-purple-500" />;
      case 'status_changed':
        return <Activity className="w-3 h-3 text-orange-500" />;
      default:
        return <Circle className="w-3 h-3 text-gray-500" />;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {activeUsers.slice(0, 5).map((user) => (
            <div
              key={user.id}
              className="relative"
              title={`${user.displayName} - ${getViewLabel(user.currentView)}`}
            >
              <div className="w-8 h-8 rounded-full bg-persimmon text-white flex items-center justify-center text-xs font-semibold border-2 border-white">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
              {user.isTyping && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white animate-pulse"></div>
              )}
            </div>
          ))}
        </div>

        {activeUsers.length > 5 && (
          <div className="text-sm text-palladium">+{activeUsers.length - 5} lainnya</div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="ml-2"
        >
          <Users className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-essence" />
            <CardTitle className="text-lg">Real-time Collaboration</CardTitle>
          </div>

          {showActivity && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSelectedTab('users')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedTab === 'users'
                    ? 'bg-white text-violet-essence shadow-sm'
                    : 'text-palladium hover:text-night-black'
                }`}
              >
                Users ({activeUsers.length})
              </button>
              <button
                onClick={() => setSelectedTab('activity')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedTab === 'activity'
                    ? 'bg-white text-violet-essence shadow-sm'
                    : 'text-palladium hover:text-night-black'
                }`}
              >
                Activity
              </button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {selectedTab === 'users' ? (
          <div className="space-y-4">
            {/* Online Users */}
            {activeUsers.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-night-black mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Online ({activeUsers.length})
                </h4>
                <div className="space-y-2">
                  {activeUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className="w-10 h-10 rounded-full text-white flex items-center justify-center text-sm font-semibold"
                            style={{ backgroundColor: user.cursor?.color || '#6366f1' }}
                          >
                            {user.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          {user.isTyping && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white animate-pulse"></div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-night-black truncate">
                            {user.displayName}
                            {user.id === currentUserPresence?.id && (
                              <span className="text-xs text-palladium ml-1">(You)</span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-palladium">
                            <Eye className="w-3 h-3" />
                            <span>{getViewLabel(user.currentView)}</span>
                            {user.isTyping && (
                              <>
                                <span>•</span>
                                <span className="text-blue-600 font-medium animate-pulse">
                                  sedang mengetik...
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-palladium">
                        {formatDistance(user.lastSeen, new Date(), {
                          addSuffix: true,
                          locale: id,
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recently Active Users */}
            {recentUsers.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-night-black mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Recently Active
                </h4>
                <div className="space-y-2">
                  {recentUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 opacity-70"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className="w-10 h-10 rounded-full text-white flex items-center justify-center text-sm font-semibold"
                            style={{ backgroundColor: user.cursor?.color || '#6b7280' }}
                          >
                            {user.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 rounded-full border-2 border-white"></div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-night-black truncate">
                            {user.displayName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-palladium">
                            <Clock className="w-3 h-3" />
                            <span>Last seen {getViewLabel(user.currentView)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-palladium">
                        {formatDistance(user.lastSeen, new Date(), {
                          addSuffix: true,
                          locale: id,
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Typing Indicators */}
            {Object.keys(typingUsers).length > 0 && (
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                  <span>
                    {Object.values(typingUsers)
                      .map((user) => user.displayName)
                      .join(', ')}{' '}
                    sedang mengetik...
                  </span>
                </div>
              </div>
            )}

            {activeUsers.length === 0 && recentUsers.length === 0 && (
              <div className="text-center py-8 text-palladium">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Belum ada pengguna lain yang online</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-night-black mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Recent Activity (24h)
            </h4>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-shrink-0 mt-1">{getActionIcon(activity.action)}</div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-night-black">
                      <span className="font-medium">{activity.userName}</span>{' '}
                      {getActionLabel(activity.action)}{' '}
                      <span className="font-medium">{activity.entityTitle}</span>
                    </p>
                    <p className="text-xs text-palladium">
                      {formatDistance(activity.timestamp, new Date(), {
                        addSuffix: true,
                        locale: id,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {recentActivity.length === 0 && (
              <div className="text-center py-8 text-palladium">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Belum ada aktivitas terbaru</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
