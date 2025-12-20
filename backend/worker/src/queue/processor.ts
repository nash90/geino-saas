/**
 * Process notification events
 * Creates notification records and sends emails
 */

import { NotificationService } from '@/services/notifications/NotificationService';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { Env } from '@/types/contextTypes';
import { buildNotificationData } from './notificationBuilder';
import { buildEmailContent } from './emailBuilder';
import type { NotificationEventPayload } from './types';

/**
 * Process a single notification event for a recipient
 */
export async function processNotificationEvent(
  typeCode: number,
  payload: NotificationEventPayload,
  recipientId: string,
  notificationService: NotificationService,
  env: Env,
  db: any
): Promise<void> {
  // 1. Create notification record in DB
  await createNotificationRecord(typeCode, payload, recipientId, notificationService, db);

  // 2. Send email notification
  await sendEmailNotification(typeCode, payload, recipientId, env, db);
}

/**
 * Create notification record in database
 */
async function createNotificationRecord(
  typeCode: number,
  payload: NotificationEventPayload,
  recipientId: string,
  notificationService: NotificationService,
  db: any
): Promise<void> {
  const notificationData = await buildNotificationData(typeCode, payload, recipientId, db);
  await notificationService.createNotification(notificationData);
}

/**
 * Send email notification via MailChannels
 */
async function sendEmailNotification(
  typeCode: number,
  payload: NotificationEventPayload,
  recipientId: string,
  env: Env,
  db: any
): Promise<void> {
  // Fetch recipient user info
  const [recipient] = await db.select().from(users).where(eq(users.id, recipientId));
  if (!recipient?.email) {
    console.warn(`No email found for user ${recipientId}, skipping email notification`);
    return;
  }

  const appUrl = env.APP_URL || 'http://localhost:3000';
  const emailContent = buildEmailContent(typeCode, payload, recipient, appUrl);

  // Send via MailChannels
  await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{
            email: recipient.email,
            name: `${recipient.lastname} ${recipient.firstname}`
          }],
        },
      ],
      from: {
        email: env.FROM_EMAIL,
        name: env.FROM_NAME,
      },
      subject: emailContent.subject,
      content: [
        {
          type: 'text/html',
          value: emailContent.html,
        },
      ],
    }),
  });
}
