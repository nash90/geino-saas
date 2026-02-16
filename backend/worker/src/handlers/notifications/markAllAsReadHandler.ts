import type { AuthContext } from '@/types/contextTypes';
import { NotificationService } from '@/services/notifications/NotificationService';
import { NotificationCategory } from '@/types/notificationTypes';
import { ErrorCodes } from '@/constants/errorCodes';

export async function markAllAsReadHandler(c: AuthContext) {
  const user = c.get('user');
  const category = c.req.query('category') as 'bell' | 'task_progress' | undefined;

  // Convert category string to code
  let categoryCode: number | undefined;
  if (category === 'bell') {
    categoryCode = NotificationCategory.BELL.code;
  } else if (category === 'task_progress') {
    categoryCode = NotificationCategory.TASK_PROGRESS.code;
  }

  const db = c.get('db');
  const notificationService = new NotificationService(db, c.env);

  const result = await notificationService.markAllAsRead(user.id, categoryCode);

  if (!result.success) {
    return c.json({ 
      error: result.error,
      errorCode: ErrorCodes.NOTIFICATION_UPDATE_FAILED
    }, 400);
  }

  return c.json({ success: true, message: result.data.message });
}
