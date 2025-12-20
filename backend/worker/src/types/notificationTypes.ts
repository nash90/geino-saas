/**
 * Notification Type and Category Constants
 *
 * Keep in sync with frontend: /frontend/web-app/client/src/types/entities.ts
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
  PROJECT_MEMBER_ADDED: { code: 2, label: 'Added to Project', key: 'project_member_added', categoryCode: 1 },
  ORGANIZATION_MANAGER_ASSIGNED: { code: 3, label: 'Org Manager Assigned', key: 'organization_manager_assigned', categoryCode: 1 },
  PROJECT_MANAGER_ASSIGNED: { code: 4, label: 'Project Manager Assigned', key: 'project_manager_assigned', categoryCode: 1 },
  PROJECT_MEMBER_ASSIGNED: { code: 5, label: 'Project Member Assigned', key: 'project_member_assigned', categoryCode: 1 },

  // Task progress notifications (category_code = 2)
  TASK_ASSIGNED: { code: 11, label: 'Task Assigned', key: 'task_assigned', categoryCode: 2 },
  TASK_STATUS_CHANGED: { code: 12, label: 'Task Status Changed', key: 'task_status_changed', categoryCode: 2 },
  TASK_DETAIL_CHANGED: { code: 13, label: 'Task Detail Changed', key: 'task_detail_changed', categoryCode: 2 },
  TASK_UPDATED: { code: 14, label: 'Task Updated by Other', key: 'task_updated', categoryCode: 2 }
} as const;
