import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { notificationsApi, type Notification } from '@/api/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { NotificationFilters } from '@/components/notifications/NotificationFilters';
import { TaskProgressNotificationItem } from '@/components/notifications/TaskProgressNotificationItem';
import { Loader2 } from 'lucide-react';
import { NotificationType } from '@/types/entities';

export default function TasksProgress() {
  const { projects } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Filters
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.list('task_progress', 100, 0);
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('通知の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const data = await notificationsApi.getUnreadCount('task_progress');
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('通知の更新に失敗しました');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead('task_progress');
      loadNotifications();
      loadUnreadCount();
      toast.success('すべての通知を既読にしました');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('通知の更新に失敗しました');
    }
  };

  // Apply filters
  const filteredNotifications = notifications.filter((n) => {
    // Project filter
    if (selectedProject !== 'all' && n.projectId !== selectedProject) {
      return false;
    }

    // Status filter (for status_changed notifications)
    if (selectedStatus !== 'all' && n.typeCode === NotificationType.TASK_STATUS_CHANGED.code) {
      const metadata = n.metadata ? JSON.parse(n.metadata) : {};
      if (metadata.newStatus?.toString() !== selectedStatus) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">タスク進捗通知</h1>
          {unreadCount > 0 && (
            <span className="px-3 py-1 bg-red-500 text-white text-sm rounded-full">
              {unreadCount}件未読
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead}>
            すべて既読にする
          </Button>
        )}
      </div>

      {/* Filters */}
      <NotificationFilters
        projects={projects}
        selectedProject={selectedProject}
        selectedStatus={selectedStatus}
        onProjectChange={setSelectedProject}
        onStatusChange={setSelectedStatus}
      />

      {/* Notifications List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          通知はありません
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <TaskProgressNotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
