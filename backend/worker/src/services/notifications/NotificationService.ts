import { BaseService } from '../base/BaseService';
import type { ServiceResponse } from '@/types';
import { notifications } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export interface CreateNotificationParams {
  userId: string;
  typeCode: number; // Use NotificationType constant
  categoryCode: number; // Use NotificationCategory constant
  title: string;
  message: string;
  taskId?: string;
  projectId?: string;
  organizationId?: string;
  commentId?: string;
  metadata?: Record<string, any>;
}

export class NotificationService extends BaseService {
  async createNotification(params: CreateNotificationParams): Promise<ServiceResponse> {
    try {
      const [notification] = await this.db
        .insert(notifications)
        .values({
          ...params,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        })
        .returning();

      return this.success(notification);
    } catch (error) {
      return this.handleError(error, 'createNotification');
    }
  }

  async getUserNotifications(
    userId: string,
    categoryCode?: number,
    limit = 50,
    offset = 0
  ): Promise<ServiceResponse> {
    try {
      const conditions = [eq(notifications.userId, userId)];
      if (categoryCode) {
        conditions.push(eq(notifications.categoryCode, categoryCode));
      }

      const userNotifications = await this.db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);

      return this.success(userNotifications);
    } catch (error) {
      return this.handleError(error, 'getUserNotifications');
    }
  }

  async getUnreadCount(userId: string, categoryCode?: number): Promise<ServiceResponse> {
    try {
      const conditions = [
        eq(notifications.userId, userId),
        sql`${notifications.readAt} IS NULL`,
      ];
      if (categoryCode) {
        conditions.push(eq(notifications.categoryCode, categoryCode));
      }

      const result = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(...conditions));

      return this.success({ count: Number(result[0].count) });
    } catch (error) {
      return this.handleError(error, 'getUnreadCount');
    }
  }

  async markAsRead(notificationId: string, userId: string): Promise<ServiceResponse> {
    try {
      const [updated] = await this.db
        .update(notifications)
        .set({ readAt: sql`now()` })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, userId)
          )
        )
        .returning();

      if (!updated) {
        return this.error('Notification not found', 'NOTIFICATION_NOT_FOUND');
      }

      return this.success(updated);
    } catch (error) {
      return this.handleError(error, 'markAsRead');
    }
  }

  async markAllAsRead(userId: string, categoryCode?: number): Promise<ServiceResponse> {
    try {
      const conditions = [
        eq(notifications.userId, userId),
        sql`${notifications.readAt} IS NULL`,
      ];
      if (categoryCode) {
        conditions.push(eq(notifications.categoryCode, categoryCode));
      }

      await this.db
        .update(notifications)
        .set({ readAt: sql`now()` })
        .where(and(...conditions));

      return this.success({ message: 'All notifications marked as read' });
    } catch (error) {
      return this.handleError(error, 'markAllAsRead');
    }
  }

  /**
   * Create new partition for next month
   * Called by cron job at beginning of each month
   */
  async createNextMonthPartition(): Promise<ServiceResponse> {
    try {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const monthAfter = new Date(now.getFullYear(), now.getMonth() + 2, 1);

      const partitionName = `notifications_${nextMonth.getFullYear()}_${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
      const startDate = nextMonth.toISOString().split('T')[0];
      const endDate = monthAfter.toISOString().split('T')[0];

      await this.db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${sql.identifier(partitionName)} PARTITION OF notifications
        FOR VALUES FROM (${startDate}) TO (${endDate})
      `);

      return this.success({
        message: `Created partition ${partitionName}`,
        partitionName
      });
    } catch (error) {
      return this.handleError(error, 'createNextMonthPartition');
    }
  }

  /**
   * Drop partitions older than 6 months
   * Called by cron job monthly
   */
  async dropOldPartitions(): Promise<ServiceResponse> {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const partitionName = `notifications_${sixMonthsAgo.getFullYear()}_${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}`;

      // Check if partition exists
      const result = await this.db.execute(sql`
        SELECT tablename FROM pg_tables
        WHERE tablename = ${partitionName}
      `);

      if (result.length > 0) {
        await this.db.execute(sql`
          DROP TABLE IF EXISTS ${sql.identifier(partitionName)}
        `);

        return this.success({
          message: `Dropped partition ${partitionName}`,
          partitionName
        });
      }

      return this.success({ message: 'No old partitions to drop' });
    } catch (error) {
      return this.handleError(error, 'dropOldPartitions');
    }
  }
}
