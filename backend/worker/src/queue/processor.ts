/**
 * Process notification events
 * Creates notification records and sends emails
 */

import { Resend } from 'resend';
import { NotificationService } from '@/services/notifications/NotificationService';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { Env } from '@/types/contextTypes';
import { buildNotificationData } from './notificationBuilder';
import { buildEmailContent } from './emailBuilder';
import type { NotificationEventPayload } from './types';

/**
 * Sleep utility for rate limiting
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
 * Send email notification via Resend
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

  console.log('📧 About to send email via Resend:', {
    to: recipient.email,
    subject: emailContent.subject,
    from: env.FROM_EMAIL,
    typeCode
  });

  try {
    // Initialize Resend with API key
    const resend = new Resend(env.RESEND_API_KEY);

    // Rate limiting: Resend allows 2 req/sec, so wait 600ms between sends
    // This prevents 429 errors when sending multiple notifications
    await sleep(600);

    // Send via Resend
    const { data, error } = await resend.emails.send({
      from: `${env.FROM_NAME} <${env.FROM_EMAIL}>`,
      to: [recipient.email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      // If rate limited, throw error to retry later
      if (error.message?.includes('rate_limit') || error.message?.includes('429')) {
        throw new Error('Rate limit exceeded - will retry');
      }
    } else {
      console.log('✅ Email sent successfully to:', recipient.email, 'ID:', data?.id);
    }
  } catch (error: any) {
    console.error('❌ Failed to send email:', error);
    // Log specific error details for debugging
    if (error.statusCode === 429) {
      console.error('⏱️ Rate limit hit - consider increasing delay or implementing queue');
    }
    throw error; // Re-throw to trigger queue retry mechanism
  }
}
