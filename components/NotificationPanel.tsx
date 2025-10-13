
import { Notification } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { formatDate } from '../constants';

interface NotificationPanelProps {
    notifications: Notification[];
    onClose: () => void;
}

export default function NotificationPanel({ notifications, onClose }: NotificationPanelProps) {
    return (
        <div className="absolute top-full right-0 mt-2 w-80 z-50">
            <Card className="shadow-2xl border-2 border-violet-essence">
                <CardHeader>
                    <CardTitle>Pemberitahuan</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <div key={notif.id} className={`p-3 border-b border-violet-essence/50 last:border-b-0 ${!notif.isRead ? 'bg-violet-essence/30' : 'bg-white'}`}>
                                    <p className="text-sm text-night-black">{notif.message}</p>
                                    <p className="text-xs text-palladium mt-1">{formatDate(notif.timestamp)}</p>
                                </div>
                            ))
                        ) : (
                            <p className="p-4 text-sm text-center text-palladium">Tidak ada pemberitahuan baru.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
