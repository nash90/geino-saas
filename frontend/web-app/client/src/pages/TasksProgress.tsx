import { useState, useEffect } from 'react';
import { notificationsApi, type Notification } from '@/api/notifications';
import { useNotifications } from '@/contexts/NotificationContext';
import { toast } from 'sonner';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { TaskProgressNotificationItem } from '@/components/notifications/TaskProgressNotificationItem';
import { handleApiError } from '@/lib/errorHandler';
import { OPERATION_ERROR_MESSAGES } from '@/constants/errorMessages';

export default function TasksProgress() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Use notification context for unread count
  const { taskProgressUnreadCount, markAsRead: contextMarkAsRead, markAllAsRead: contextMarkAllAsRead } = useNotifications();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadNotifications();
  }, [currentPage]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const data = await notificationsApi.list('task_progress', itemsPerPage, offset);
      setNotifications(data.notifications);

      // Calculate total pages (Note: This is approximate, ideally backend should return total count)
      if (data.notifications.length < itemsPerPage && currentPage === 1) {
        setTotalPages(1);
      } else if (data.notifications.length < itemsPerPage) {
        setTotalPages(currentPage);
      } else {
        // Assume there might be more pages
        setTotalPages(currentPage + 1);
      }
    } catch (error) {
      handleApiError(error, OPERATION_ERROR_MESSAGES.NOTIFICATION_LOAD_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await contextMarkAsRead(notificationId, 'task_progress');
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await contextMarkAllAsRead('task_progress');
      loadNotifications();
      toast.success('すべての通知を既読にしました');
    } catch (error) {
      handleApiError(error, OPERATION_ERROR_MESSAGES.NOTIFICATION_UPDATE_FAILED);
    }
  };

  const handleTaskClick = (taskId: string) => {
    // Navigate to task detail page
    setLocation(`/taskboard/${taskId}`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">進捗ありタスク</h1>
        {taskProgressUnreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead}>
            すべて既読にする
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="divide-y">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                通知はありません
              </div>
            ) : (
              notifications.map((notification) => (
                <TaskProgressNotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onTaskClick={handleTaskClick}
                />
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-gray-500">
                ページ {currentPage} / {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  前へ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage >= totalPages}
                >
                  次へ
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
