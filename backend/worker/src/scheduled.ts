import { createDbClient } from './db/client';
import { NotificationService } from './services/notifications/NotificationService';
import type { Env } from './types/contextTypes';

export async function scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
  const db = createDbClient(env.DATABASE_URL);
  const notificationService = new NotificationService(db, env);

    // 1. Create partition for next month
    const createResult = await notificationService.createNextMonthPartition();
    if (createResult.success) {
      console.log('Scheduled partition create:', createResult.data.message);
    } else {
      console.error('Scheduled partition create failed:', createResult.error);
    }

    // 2. Drop partitions older than 6 months
    const dropResult = await notificationService.dropOldPartitions();
    if (dropResult.success) {
      console.log('Scheduled partition drop:', dropResult.data.message);
    } else {
      console.error('Scheduled partition drop failed:', dropResult.error);
    }
}
