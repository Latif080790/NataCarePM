import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/FormControls';
import { useToast } from '@/contexts/ToastContext';
import {
  Bell,
  BellOff,
  Search,
  Check,
  CheckCircle,
  AlertCircle,
  Info,
  MessageSquare,
  Calendar,
  Clock,
  Trash2,
  Settings,
  Eye,
  User,
  FileText,
  CheckSquare,
} from 'lucide-react';
import { formatDate } from '@/constants';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'task' | 'document' | 'comment' | 'reminder';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'project' | 'task' | 'document' | 'user' | 'system';
  relatedId?: string;
  relatedType?: 'task' | 'document' | 'project' | 'user';
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

const notificationTypes = [
  { value: 'all', label: 'Semua Notifikasi', icon: Bell },
  { value: 'task', label: 'Task & Progress', icon: CheckSquare },
  { value: 'document', label: 'Dokumen', icon: FileText },
  { value: 'comment', label: 'Komentar', icon: MessageSquare },
  { value: 'reminder', label: 'Pengingat', icon: Clock },
  { value: 'system', label: 'Sistem', icon: Settings },
];

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'info':
      return <Info className="w-5 h-5 text-blue-500" />;
    case 'warning':
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'task':
      return <CheckSquare className="w-5 h-5 text-violet-600" />;
    case 'document':
      return <FileText className="w-5 h-5 text-persimmon" />;
    case 'comment':
      return <MessageSquare className="w-5 h-5 text-blue-600" />;
    case 'reminder':
      return <Clock className="w-5 h-5 text-orange-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

const getPriorityColor = (priority: Notification['priority']) => {
  switch (priority) {
    case 'low':
      return 'border-l-gray-400';
    case 'medium':
      return 'border-l-yellow-400';
    case 'high':
      return 'border-l-orange-400';
    case 'urgent':
      return 'border-l-red-500';
  }
};

// Mock notification data
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'task',
    title: 'Task Baru Ditugaskan',
    message: 'Anda telah ditugaskan untuk task "Instalasi Pondasi Blok A"',
    timestamp: new Date().toISOString(),
    isRead: false,
    priority: 'high',
    category: 'task',
    relatedId: 'task_123',
    relatedType: 'task',
    sender: { id: 'user_1', name: 'Project Manager' },
  },
  {
    id: '2',
    type: 'warning',
    title: 'Deadline Mendekati',
    message: 'Task "Pengecoran Lantai 2" akan berakhir dalam 2 hari',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isRead: false,
    priority: 'urgent',
    category: 'task',
    relatedId: 'task_124',
    relatedType: 'task',
  },
  {
    id: '3',
    type: 'document',
    title: 'Dokumen Baru Diunggah',
    message: 'Dokumen "Spesifikasi Teknis Rev.2" telah diunggah ke folder proyek',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    isRead: true,
    priority: 'medium',
    category: 'document',
    relatedId: 'doc_456',
    relatedType: 'document',
    sender: { id: 'user_2', name: 'Site Engineer' },
  },
  {
    id: '4',
    type: 'comment',
    title: 'Komentar Baru',
    message: 'Ada komentar baru di task "Pemasangan Bekisting"',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    isRead: true,
    priority: 'low',
    category: 'task',
    relatedId: 'task_125',
    relatedType: 'task',
    sender: { id: 'user_3', name: 'Supervisor' },
  },
  {
    id: '5',
    type: 'reminder',
    title: 'Pengingat Meeting',
    message: 'Meeting koordinasi proyek akan dimulai dalam 30 menit',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    isRead: false,
    priority: 'high',
    category: 'project',
  },
];

export default function NotificationCenterView() {
  const { addToast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  // Real-time notifications (mock implementation)
  useEffect(() => {
    // In real implementation, this would connect to a real-time notification service
    const interval = setInterval(() => {
      // Simulate new notifications occasionally
      if (Math.random() > 0.95) {
        const newNotification: Notification = {
          id: `${Date.now()}`,
          type: 'info',
          title: 'Update Otomatis',
          message: 'Progress proyek telah diperbarui',
          timestamp: new Date().toISOString(),
          isRead: false,
          priority: 'low',
          category: 'system',
        };
        setNotifications((prev) => [newNotification, ...prev]);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    const matchesType =
      selectedType === 'all' ||
      notification.type === selectedType ||
      notification.category === selectedType;
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRead = !showOnlyUnread || !notification.isRead;

    return matchesType && matchesSearch && matchesRead;
  });

  // Statistics
  const stats = {
    total: notifications.length,
    unread: notifications.filter((n) => !n.isRead).length,
    urgent: notifications.filter((n) => n.priority === 'urgent').length,
    today: notifications.filter(
      (n) => new Date(n.timestamp).toDateString() === new Date().toDateString()
    ).length,
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    addToast('Semua notifikasi ditandai sudah dibaca', 'success');
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    addToast('Notifikasi dihapus', 'success');
  };

  const handleBulkDelete = () => {
    setNotifications((prev) => prev.filter((n) => !selectedNotifications.includes(n.id)));
    setSelectedNotifications([]);
    addToast(`${selectedNotifications.length} notifikasi dihapus`, 'success');
  };

  const handleBulkMarkAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => (selectedNotifications.includes(n.id) ? { ...n, isRead: true } : n))
    );
    setSelectedNotifications([]);
    addToast(`${selectedNotifications.length} notifikasi ditandai sudah dibaca`, 'success');
  };

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map((n) => n.id));
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Baru saja';
    if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam lalu`;
    return formatDate(timestamp);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-night-black">Notification Center</h1>
          <p className="text-palladium">Kelola semua notifikasi dan update proyek</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={stats.unread === 0}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Tandai Semua Dibaca
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Pengaturan
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-palladium">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Bell className="w-8 h-8 text-violet-essence" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-palladium">Belum Dibaca</p>
                <p className="text-2xl font-bold text-persimmon">{stats.unread}</p>
              </div>
              <BellOff className="w-8 h-8 text-persimmon" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-palladium">Urgent</p>
                <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-palladium">Hari Ini</p>
                <p className="text-2xl font-bold text-green-600">{stats.today}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-palladium w-4 h-4" />
                <Input
                  placeholder="Cari notifikasi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex flex-wrap gap-2">
              {notificationTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.value}
                    variant={selectedType === type.value ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedType(type.value)}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {type.label}
                  </Button>
                );
              })}
            </div>

            {/* Read Filter */}
            <Button
              variant={showOnlyUnread ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setShowOnlyUnread(!showOnlyUnread)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Belum Dibaca
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedNotifications.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{selectedNotifications.length} notifikasi dipilih</p>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleBulkMarkAsRead}>
                  <Check className="w-4 h-4 mr-2" />
                  Tandai Dibaca
                </Button>
                <Button variant="ghost" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <Card className="flex-1">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Notifikasi ({filteredNotifications.length})</CardTitle>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={
                selectedNotifications.length === filteredNotifications.length &&
                filteredNotifications.length > 0
              }
              onChange={handleSelectAll}
              className="rounded"
            />
            <label className="text-sm">Pilih Semua</label>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[calc(100vh-500px)] overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 mx-auto text-palladium mb-4" />
                <h3 className="text-lg font-semibold text-night-black mb-2">
                  Tidak ada notifikasi
                </h3>
                <p className="text-palladium">
                  {searchTerm
                    ? `Tidak ada notifikasi yang cocok dengan "${searchTerm}"`
                    : 'Semua notifikasi sudah dibaca atau tidak ada notifikasi baru'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-palladium">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`
                                            p-4 border-l-4 hover:bg-gray-50 transition-colors
                                            ${getPriorityColor(notification.priority)}
                                            ${!notification.isRead ? 'bg-blue-50' : ''}
                                        `}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => handleSelectNotification(notification.id)}
                        className="mt-1 rounded"
                      />

                      <div className="mt-1">{getNotificationIcon(notification.type)}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4
                              className={`font-semibold ${!notification.isRead ? 'text-night-black' : 'text-palladium'}`}
                            >
                              {notification.title}
                            </h4>
                            <p className="text-sm text-palladium mt-1">{notification.message}</p>

                            <div className="flex items-center gap-4 mt-2 text-xs text-palladium">
                              <span>{getRelativeTime(notification.timestamp)}</span>

                              {notification.sender && (
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span>{notification.sender.name}</span>
                                </div>
                              )}

                              <span
                                className={`
                                                                px-2 py-1 rounded-full text-xs font-semibold
                                                                ${notification.priority === 'urgent' && 'bg-red-100 text-red-700'}
                                                                ${notification.priority === 'high' && 'bg-orange-100 text-orange-700'}
                                                                ${notification.priority === 'medium' && 'bg-yellow-100 text-yellow-700'}
                                                                ${notification.priority === 'low' && 'bg-gray-100 text-gray-700'}
                                                            `}
                              >
                                {notification.priority}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 ml-4">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteNotification(notification.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {notification.actionUrl && notification.actionLabel && (
                          <div className="mt-3">
                            <Button variant="outline" size="sm">
                              {notification.actionLabel}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
