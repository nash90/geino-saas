import type { AuthContext } from '@/types/contextTypes';
import { NotificationService } from '@/services/notifications/NotificationService';
import { NotificationCategory } from '@/types/notificationTypes';
import { ErrorCodes } from '@/constants/errorCodes';

export async function listNotificationsHandler(c: AuthContext) {
  const user = c.get('user');
  const category = c.req.query('category') as 'bell' | 'task_progress' | undefined;
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  // Convert category string to code
  let categoryCode: number | undefined;
  if (category === 'bell') {
    categoryCode = NotificationCategory.BELL.code;
  } else if (category === 'task_progress') {
    categoryCode = NotificationCategory.TASK_PROGRESS.code;
  }

  const db = c.get('db');
  const notificationService = new NotificationService(db, c.env);

  const result = await notificationService.getUserNotifications(user.id, categoryCode, limit, offset);

  if (!result.success) {
    return c.json({ 
      error: result.error,
      errorCode: ErrorCodes.NOTIFICATION_LOAD_FAILED
    }, 400);
  }

  return c.json({ notifications: result.data });
}
