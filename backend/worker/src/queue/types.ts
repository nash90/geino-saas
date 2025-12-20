/**
 * Queue Event Types
 */

export interface NotificationEvent {
  typeCode: number; // Numeric type code from NotificationType
  payload: NotificationEventPayload;
}

export interface NotificationEventPayload {
  recipientUserId: string;
  recipientUserIds?: string[];
  actorUserId: string;
  taskId?: string;
  projectId?: string;
  organizationId?: string;
  commentId?: string;
  oldValue?: any;
  newValue?: any;
  roleCode?: number;
  timestamp: string;
  [key: string]: any;
}

export interface EmailContent {
  subject: string;
  html: string;
}
