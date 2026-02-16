/**
 * Notification Type and Category Constants
 *
 * Keep in sync with frontend: /frontend/web-app/client/src/types/entities.ts
 * 
 * Email Delivery Strategy:
 * - TASK_STATUS_CHANGED: In-app notification ONLY (no email) to reduce operational costs
 * - All other notification types: In-app notification + Email delivery
 * 
 * TASK_STATUS_CHANGED Metadata Format:
 * {
 *   actorUserId: string,
 *   oldStatusCode: number,      // Status code (1=To Do, 2=In Progress, 3=Done, etc.)
 *   newStatusCode: number,      // Status code (1=To Do, 2=In Progress, 3=Done, etc.)
 *   oldStatusLabel: string,     // Status label ("To Do", "In Progress", etc.)
 *   newStatusLabel: string      // Status label ("To Do", "In Progress", etc.)
 * }
 * 
 * Message Format Example:
 * "山田太郎さんがタスクのステータスを「To Do」から「In Progress」に変更しました"
 */

// Notification Category Codes
export const NotificationCategory = {
  BELL: { code: 1, label: 'Bell Notification', key: 'bell' },
  TASK_PROGRESS: { code: 2, label: 'Task Progress', key: 'task_progress' }
} as const;

// Notification Type Codes
export const NotificationType = {
  // Bell notifications (category_code = 1)
  USER_MENTIONED: { code: 1, label: 'Mentioned in Comment', key: 'user_mentioned', categoryCode: 1 },
  PROJECT_MEMBER_ASSIGNED: { code: 2, label: 'Project Member Assigned', key: 'project_member_assigned', categoryCode: 1 },
  ORGANIZATION_MANAGER_ASSIGNED: { code: 3, label: 'Org Manager Assigned', key: 'organization_manager_assigned', categoryCode: 1 },
  PROJECT_MANAGER_ASSIGNED: { code: 4, label: 'Project Manager Assigned', key: 'project_manager_assigned', categoryCode: 1 },

  // Task progress notifications (category_code = 2)
  TASK_ASSIGNED: { code: 11, label: 'Task Assigned', key: 'task_assigned', categoryCode: 2 },
  TASK_STATUS_CHANGED: { code: 12, label: 'Task Status Changed', key: 'task_status_changed', categoryCode: 2 },
  TASK_UPDATED: { code: 13, label: 'Task Details Updated', key: 'task_updated', categoryCode: 2 }
} as const;
