import { Hono } from 'hono';
import { authenticate, requireSystemAdmin, type Env, type AuthUser } from '../middleware/auth';
import type { DbClient } from '../db/client';
import { listUsersHandler } from '../handlers/users/listUsersHandler';
import { getUserHandler } from '../handlers/users/getUserHandler';
import { updateUserHandler } from '../handlers/users/updateUserHandler';
import { deleteUserHandler } from '../handlers/users/deleteUserHandler';

const usersRoute = new Hono<{ Bindings: Env; Variables: { db: DbClient; user?: AuthUser } }>();

// Middleware to authenticate all user routes
usersRoute.use('*', async (c, next) => {
  try {
    await authenticate(c);
    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
});

usersRoute.get('/', requireSystemAdmin(), listUsersHandler);
usersRoute.get('/:id', requireSystemAdmin(), getUserHandler);
usersRoute.patch('/:id', requireSystemAdmin(), updateUserHandler);
usersRoute.delete('/:id', requireSystemAdmin(), deleteUserHandler);

export default usersRoute;
