import { apiClient } from './client';

export interface Notification {
  id: string;
  userId: string;
  typeCode: number; // Numeric type code
  categoryCode: number; // Numeric category code
  title: string;
  message: string;
  taskId?: string;
  projectId?: string;
  organizationId?: string;
  commentId?: string;
  metadata?: string;
  readAt?: string;
  createdAt: string;
  taskTitle?: string; // Task title from joined tasks table
}

export const notificationsApi = {
  // List notifications
  list: async (category?: 'bell' | 'task_progress', limit = 50, offset = 0) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await apiClient.get<{ notifications: Notification[] }>(
      `/api/notifications?${params.toString()}`
    );
    return response.data;
  },

  // Get unread count
  getUnreadCount: async (category?: 'bell' | 'task_progress') => {
    const params = category ? `?category=${category}` : '';
    const response = await apiClient.get<{ count: number }>(
      `/api/notifications/unread-count${params}`
    );
    return response.data;
  },

  // Mark single notification as read
  markAsRead: async (notificationId: string) => {
    const response = await apiClient.patch(
      `/api/notifications/${notificationId}/read`
    );
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async (category?: 'bell' | 'task_progress') => {
    const params = category ? `?category=${category}` : '';
    const response = await apiClient.post(
      `/api/notifications/mark-all-read${params}`
    );
    return response.data;
  },
};
