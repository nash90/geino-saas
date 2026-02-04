import type { Notification } from '@/api/notifications';
import { formatDateTime } from '@/lib/date-utils';

interface TaskProgressNotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onTaskClick?: (taskId: string) => void;
}

export function TaskProgressNotificationItem({
  notification,
  onMarkAsRead,
  onTaskClick
}: TaskProgressNotificationItemProps) {
  const metadata = notification.metadata ? JSON.parse(notification.metadata) : {};

  // Build message from metadata if main message is empty (safety fallback)
  const displayMessage = notification.message || 
    (metadata.oldStatusLabel && metadata.newStatusLabel
      ? `タスクのステータスを「${metadata.oldStatusLabel}」から「${metadata.newStatusLabel}」に変更しました`
      : '');

  const handleClick = () => {
    if (!notification.readAt) {
      onMarkAsRead(notification.id);
    }
  };

  const handleTaskClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.readAt) {
      onMarkAsRead(notification.id);
    }
    if (notification.taskId && onTaskClick) {
      onTaskClick(notification.taskId);
    }
  };

  return (
    <div
      className={`p-4 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
        notification.readAt ? '' : 'bg-blue-50'
      }`}
      onClick={handleClick}
    >
      {/* Title and Timestamp */}
      <div className="flex items-center justify-between gap-4 mb-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{notification.title}</h3>
          {!notification.readAt && (
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          )}
        </div>
        <span className="text-sm text-gray-400 whitespace-nowrap">
          {formatDateTime(notification.createdAt)}
        </span>
      </div>

      {/* Status change message */}
      {displayMessage && (
        <p className="text-sm text-gray-700 mb-2">{displayMessage}</p>
      )}

      {/* Task title link */}
      {notification.taskId && notification.taskTitle && (
        <button
          onClick={handleTaskClick}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          {notification.taskTitle}
        </button>
      )}
    </div>
  );
}
