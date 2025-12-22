import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { notificationsApi, type Notification } from '@/api/notifications';

interface NotificationContextType {
  // Bell notifications
  bellNotifications: Notification[];
  bellUnreadCount: number;
  loadingBellNotifications: boolean;
  loadBellNotifications: () => Promise<void>;

  // Task progress notifications
  taskProgressUnreadCount: number;

  // Actions
  markAsRead: (notificationId: string, category: 'bell' | 'task_progress') => Promise<void>;
  markAllAsRead: (category: 'bell' | 'task_progress') => Promise<void>;
  refreshUnreadCounts: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [bellNotifications, setBellNotifications] = useState<Notification[]>([]);
  const [bellUnreadCount, setBellUnreadCount] = useState(0);
  const [taskProgressUnreadCount, setTaskProgressUnreadCount] = useState(0);
  const [loadingBellNotifications, setLoadingBellNotifications] = useState(false);

  // Load unread counts on mount
  useEffect(() => {
    loadUnreadCounts();
  }, []);

  const loadUnreadCounts = async () => {
    try {
      const [bellData, taskProgressData] = await Promise.all([
        notificationsApi.getUnreadCount('bell'),
        notificationsApi.getUnreadCount('task_progress'),
      ]);
      setBellUnreadCount(bellData.count);
      setTaskProgressUnreadCount(taskProgressData.count);
    } catch (error) {
      console.error('Failed to load unread counts:', error);
    }
  };

  const loadBellNotifications = async () => {
    setLoadingBellNotifications(true);
    try {
      const data = await notificationsApi.list('bell', 20, 0);
      setBellNotifications(data.notifications);
    } catch (error) {
      console.error('Failed to load bell notifications:', error);
    } finally {
      setLoadingBellNotifications(false);
    }
  };

  const markAsRead = async (notificationId: string, category: 'bell' | 'task_progress') => {
    try {
      await notificationsApi.markAsRead(notificationId);

      // Reload bell notifications if it's a bell notification
      if (category === 'bell') {
        await loadBellNotifications();
      }

      // Refresh unread counts for both categories
      await loadUnreadCounts();
    } catch (error) {
      console.error('Failed to mark as read:', error);
      throw error;
    }
  };

  const markAllAsRead = async (category: 'bell' | 'task_progress') => {
    try {
      await notificationsApi.markAllAsRead(category);

      // Reload bell notifications if it's a bell notification
      if (category === 'bell') {
        await loadBellNotifications();
      }

      // Refresh unread counts for both categories
      await loadUnreadCounts();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      throw error;
    }
  };

  const refreshUnreadCounts = async () => {
    await loadUnreadCounts();
  };

  return (
    <NotificationContext.Provider
      value={{
        bellNotifications,
        bellUnreadCount,
        loadingBellNotifications,
        loadBellNotifications,
        taskProgressUnreadCount,
        markAsRead,
        markAllAsRead,
        refreshUnreadCounts,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
