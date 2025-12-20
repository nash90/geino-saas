import type { Notification } from '@/api/notifications';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  return (
    <div
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        notification.readAt
          ? 'bg-gray-50 hover:bg-gray-100'
          : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500'
      }`}
      onClick={() => onMarkAsRead(notification.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-medium text-sm">{notification.title}</p>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
          <p className="text-xs text-gray-400 mt-2">
            {new Date(notification.createdAt).toLocaleString('ja-JP')}
          </p>
        </div>
        {!notification.readAt && (
          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1"></div>
        )}
      </div>
    </div>
  );
}
