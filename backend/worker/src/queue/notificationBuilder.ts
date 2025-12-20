/**
 * Build notification data for each event type
 */

import type { CreateNotificationParams } from '@/services/notifications/NotificationService';
import { NotificationType, NotificationCategory } from '@/types/notificationTypes';
import { getTaskStatusLabel } from '@/types/codeTypes';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { NotificationEventPayload } from './types';

export async function buildNotificationData(
  typeCode: number,
  payload: NotificationEventPayload,
  recipientId: string,
  db: any
): Promise<CreateNotificationParams> {
  // Fetch actor user info
  const [actor] = await db.select().from(users).where(eq(users.id, payload.actorUserId));
  const actorName = actor ? `${actor.lastname} ${actor.firstname}` : 'Someone';

  // Build notification based on type code
  switch (typeCode) {
    case NotificationType.USER_MENTIONED.code:
      return {
        userId: recipientId,
        typeCode,
        categoryCode: NotificationCategory.BELL.code,
        title: 'コメントでメンションされました',
        message: `${actorName}さんがコメントであなたをメンションしました`,
        taskId: payload.taskId,
        commentId: payload.commentId,
        metadata: { actorUserId: payload.actorUserId },
      };

    case NotificationType.PROJECT_MEMBER_ADDED.code:
      return {
        userId: recipientId,
        typeCode,
        categoryCode: NotificationCategory.BELL.code,
        title: 'プロジェクトに追加されました',
        message: `${actorName}さんがあなたをプロジェクトに追加しました`,
        projectId: payload.projectId,
        metadata: { actorUserId: payload.actorUserId, roleCode: payload.roleCode },
      };

    case NotificationType.ORGANIZATION_MANAGER_ASSIGNED.code:
      return {
        userId: recipientId,
        typeCode,
        categoryCode: NotificationCategory.BELL.code,
        title: '組織マネージャーに任命されました',
        message: `${actorName}さんがあなたを組織マネージャーに任命しました`,
        organizationId: payload.organizationId,
        metadata: { actorUserId: payload.actorUserId, roleCode: payload.roleCode },
      };

    case NotificationType.PROJECT_MANAGER_ASSIGNED.code:
      return {
        userId: recipientId,
        typeCode,
        categoryCode: NotificationCategory.BELL.code,
        title: 'プロジェクトマネージャーに任命されました',
        message: `${actorName}さんがあなたをプロジェクトマネージャーに任命しました`,
        projectId: payload.projectId,
        metadata: { actorUserId: payload.actorUserId, roleCode: payload.roleCode },
      };

    case NotificationType.PROJECT_MEMBER_ASSIGNED.code:
      return {
        userId: recipientId,
        typeCode,
        categoryCode: NotificationCategory.BELL.code,
        title: 'プロジェクトメンバーに追加されました',
        message: `${actorName}さんがあなたをプロジェクトメンバーに追加しました`,
        projectId: payload.projectId,
        metadata: { actorUserId: payload.actorUserId, roleCode: payload.roleCode },
      };

    case NotificationType.TASK_ASSIGNED.code:
      return {
        userId: recipientId,
        typeCode,
        categoryCode: NotificationCategory.TASK_PROGRESS.code,
        title: 'タスクが割り当てられました',
        message: `${actorName}さんがあなたにタスクを割り当てました`,
        taskId: payload.taskId,
        projectId: payload.projectId,
        metadata: { actorUserId: payload.actorUserId },
      };

    case NotificationType.TASK_STATUS_CHANGED.code:
      const oldStatus = getTaskStatusLabel(payload.oldValue);
      const newStatus = getTaskStatusLabel(payload.newValue);
      return {
        userId: recipientId,
        typeCode,
        categoryCode: NotificationCategory.TASK_PROGRESS.code,
        title: 'タスクのステータスが変更されました',
        message: `${actorName}さんがタスクのステータスを「${oldStatus}」から「${newStatus}」に変更しました`,
        taskId: payload.taskId,
        projectId: payload.projectId,
        metadata: {
          actorUserId: payload.actorUserId,
          oldStatus: payload.oldValue,
          newStatus: payload.newValue,
        },
      };

    case NotificationType.TASK_DETAIL_CHANGED.code:
      return {
        userId: recipientId,
        typeCode,
        categoryCode: NotificationCategory.TASK_PROGRESS.code,
        title: 'タスクの詳細が変更されました',
        message: `${actorName}さんがタスクの詳細を変更しました`,
        taskId: payload.taskId,
        projectId: payload.projectId,
        metadata: { actorUserId: payload.actorUserId },
      };

    case NotificationType.TASK_UPDATED.code:
      return {
        userId: recipientId,
        typeCode,
        categoryCode: NotificationCategory.TASK_PROGRESS.code,
        title: 'タスクが更新されました',
        message: `${actorName}さんがあなたの作成したタスクを更新しました`,
        taskId: payload.taskId,
        projectId: payload.projectId,
        metadata: { actorUserId: payload.actorUserId },
      };

    default:
      throw new Error(`Unknown notification type code: ${typeCode}`);
  }
}
