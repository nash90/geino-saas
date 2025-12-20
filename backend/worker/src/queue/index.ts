/**
 * Cloudflare Queue Consumer
 * Processes notification events and triggers both in-app notifications and emails
 */

import { createDbClient } from '@/db/client';
import { NotificationService } from '@/services/notifications/NotificationService';
import type { Env } from '@/types/contextTypes';
import { processNotificationEvent } from './processor';
import type { NotificationEvent } from './types';

export default {
  async queue(
    batch: MessageBatch<NotificationEvent>,
    env: Env
  ): Promise<void> {
    const db = createDbClient(env.DATABASE_URL);
    const notificationService = new NotificationService(db, env);

    for (const message of batch.messages) {
      try {
        const { typeCode, payload } = message.body;

        // Determine recipients (single or multiple)
        const recipientIds = payload.recipientUserIds || [payload.recipientUserId];

        // Process notification for each recipient
        for (const recipientId of recipientIds) {
          await processNotificationEvent(
            typeCode,
            payload,
            recipientId,
            notificationService,
            env,
            db
          );
        }

        // Acknowledge successful processing
        message.ack();
      } catch (error) {
        console.error('Queue processing error:', error);
        // Retry the message on error
        message.retry();
      }
    }
  },
};
