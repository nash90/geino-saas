import { Hono } from 'hono';
import type { PreAuthEnv } from '@/types';
import { authenticate } from '@/middleware/auth';
import { listNotificationsHandler } from '@/handlers/notifications/listNotificationsHandler';
import { getUnreadCountHandler } from '@/handlers/notifications/getUnreadCountHandler';
import { markAsReadHandler } from '@/handlers/notifications/markAsReadHandler';
import { markAllAsReadHandler } from '@/handlers/notifications/markAllAsReadHandler';

const notificationsRoute = new Hono<PreAuthEnv>();

// All routes require authentication
notificationsRoute.use('/*', async (c, next) => {
  const user = await authenticate(c);
  c.set('user', user);
  await next();
});

// GET /api/notifications - List notifications
notificationsRoute.get('/', listNotificationsHandler);

// GET /api/notifications/unread-count - Get unread count
notificationsRoute.get('/unread-count', getUnreadCountHandler);

// PATCH /api/notifications/:notificationId/read - Mark single as read
notificationsRoute.patch('/:notificationId/read', markAsReadHandler);

// POST /api/notifications/mark-all-read - Mark all as read
notificationsRoute.post('/mark-all-read', markAllAsReadHandler);

export default notificationsRoute;
