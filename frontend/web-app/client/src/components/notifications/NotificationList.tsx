import { Loader2 } from 'lucide-react';
import { NotificationItem } from './NotificationItem';
import type { Notification } from '@/api/notifications';

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  onMarkAsRead: (id: string) => void;
}

export function NotificationList({
  notifications,
  loading,
  onMarkAsRead
}: NotificationListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        通知はありません
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
        />
      ))}
    </div>
  );
}
