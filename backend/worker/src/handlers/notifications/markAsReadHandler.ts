import type { AuthContext } from '@/types/contextTypes';
import { NotificationService } from '@/services/notifications/NotificationService';
import { ErrorCodes } from '@/constants/errorCodes';

export async function markAsReadHandler(c: AuthContext) {
  const user = c.get('user');
  const notificationId = c.req.param('notificationId');

  const db = c.get('db');
  const notificationService = new NotificationService(db, c.env);

  const result = await notificationService.markAsRead(notificationId, user.id);

  if (!result.success) {
    const statusCode = result.code === 'NOTIFICATION_NOT_FOUND' ? 404 : 400;
    const errorCode = result.code === 'NOTIFICATION_NOT_FOUND' ? 
      ErrorCodes.NOTIFICATION_NOT_FOUND : 
      ErrorCodes.NOTIFICATION_UPDATE_FAILED;
    return c.json({ error: result.error, errorCode }, statusCode);
  }

  return c.json({ success: true });
}
