/**
 * Build email content for each notification type
 */

import { NotificationType } from '@/types/notificationTypes';
import { getTaskStatusLabel } from '@/types/codeTypes';
import type { EmailContent, NotificationEventPayload } from './types';

export function buildEmailContent(
  typeCode: number,
  payload: NotificationEventPayload,
  recipient: any,
  appUrl: string
): EmailContent {
  const recipientName = `${recipient.lastname} ${recipient.firstname}`;

  switch (typeCode) {
    case NotificationType.USER_MENTIONED.code:
      return {
        subject: 'コメントでメンションされました - Geino SaaS',
        html: `
          <h2>コメントでメンションされました</h2>
          <p>${recipientName}さん、</p>
          <p>タスクのコメントであなたがメンションされました。</p>
          <p><a href="${appUrl}/taskboard">タスクを確認する</a></p>
        `,
      };

    case NotificationType.ORGANIZATION_MANAGER_ASSIGNED.code:
      return {
        subject: '組織マネージャーに任命されました - Geino SaaS',
        html: `
          <h2>組織マネージャーに任命されました</h2>
          <p>${recipientName}さん、</p>
          <p>組織マネージャーに任命されました。</p>
          <p><a href="${appUrl}/organizations">組織を確認する</a></p>
        `,
      };

    case NotificationType.PROJECT_MANAGER_ASSIGNED.code:
      return {
        subject: 'プロジェクトマネージャーに任命されました - Geino SaaS',
        html: `
          <h2>プロジェクトマネージャーに任命されました</h2>
          <p>${recipientName}さん、</p>
          <p>プロジェクトマネージャーに任命されました。</p>
          <p><a href="${appUrl}/projects">プロジェクトを確認する</a></p>
        `,
      };

    case NotificationType.PROJECT_MEMBER_ASSIGNED.code:
      return {
        subject: 'プロジェクトメンバーに追加されました - Geino SaaS',
        html: `
          <h2>プロジェクトメンバーに追加されました</h2>
          <p>${recipientName}さん、</p>
          <p>プロジェクトメンバーに追加されました。</p>
          <p><a href="${appUrl}/projects">プロジェクトを確認する</a></p>
        `,
      };

    case NotificationType.TASK_ASSIGNED.code:
      return {
        subject: 'タスクが割り当てられました - Geino SaaS',
        html: `
          <h2>新しいタスクが割り当てられました</h2>
          <p>${recipientName}さん、</p>
          <p>新しいタスクがあなたに割り当てられました。</p>
          <p><a href="${appUrl}/taskboard">タスクを確認する</a></p>
        `,
      };

    case NotificationType.TASK_STATUS_CHANGED.code:
      const oldStatus = getTaskStatusLabel(payload.oldValue);
      const newStatus = getTaskStatusLabel(payload.newValue);
      return {
        subject: 'タスクのステータスが変更されました - Geino SaaS',
        html: `
          <h2>タスクのステータスが変更されました</h2>
          <p>${recipientName}さん、</p>
          <p>タスクのステータスが「${oldStatus}」から「${newStatus}」に変更されました。</p>
          <p><a href="${appUrl}/taskboard">タスクを確認する</a></p>
        `,
      };

    case NotificationType.TASK_UPDATED.code:
      return {
        subject: 'タスクの詳細が更新されました - Geino SaaS',
        html: `
          <h2>タスクの詳細が更新されました</h2>
          <p>${recipientName}さん、</p>
          <p>プロジェクトのタスクの詳細が更新されました。</p>
          <p><a href="${appUrl}/taskboard">タスクを確認する</a></p>
        `,
      };

    default:
      return {
        subject: '通知 - Geino SaaS',
        html: `
          <p>${recipientName}さん、</p>
          <p>新しい通知があります。</p>
          <p><a href="${appUrl}">確認する</a></p>
        `,
      };
  }
}
