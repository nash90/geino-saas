import { Button } from '@/components/ui/button';
import { TaskStatus, NotificationType } from '@/types/entities';
import type { Notification } from '@/api/notifications';

interface TaskProgressNotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

export function TaskProgressNotificationItem({
  notification,
  onMarkAsRead
}: TaskProgressNotificationItemProps) {
  const metadata = notification.metadata ? JSON.parse(notification.metadata) : {};

  const getStatusLabel = (statusCode: number): string => {
    const status = Object.values(TaskStatus).find(s => s.code === statusCode);
    return status?.label || '不明';
  };

  return (
    <div
      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
        notification.readAt
          ? 'bg-white hover:bg-gray-50'
          : 'bg-blue-50 hover:bg-blue-100 border-blue-200'
      }`}
      onClick={() => onMarkAsRead(notification.id)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{notification.title}</h3>
            {!notification.readAt && (
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>

          {/* Display status change if applicable */}
          {notification.typeCode === NotificationType.TASK_STATUS_CHANGED.code &&
           metadata.oldStatus &&
           metadata.newStatus && (
            <div className="flex items-center gap-2 text-sm mb-2">
              <span className="px-2 py-1 bg-gray-100 rounded">
                {getStatusLabel(metadata.oldStatus)}
              </span>
              <span>→</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                {getStatusLabel(metadata.newStatus)}
              </span>
            </div>
          )}

          <p className="text-xs text-gray-400">
            {new Date(notification.createdAt).toLocaleString('ja-JP')}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = '/taskboard';
          }}
        >
          タスクを確認
        </Button>
      </div>
    </div>
  );
}
