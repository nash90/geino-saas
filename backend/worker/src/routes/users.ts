import { Hono } from 'hono';
import { authenticate, requireSystemAdmin } from '../middleware/auth';
import type { Env, AuthUser } from '../types';
import type { DbClient } from '../db/client';
import { listUsersHandler } from '../handlers/users/listUsersHandler';
import { getUserHandler } from '../handlers/users/getUserHandler';
import { updateUserHandler } from '../handlers/users/updateUserHandler';
import { deleteUserHandler } from '../handlers/users/deleteUserHandler';
import { findUserByEmailHandler } from '../handlers/users/findUserByEmailHandler';

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

// Public routes for authenticated users
usersRoute.get('/find-by-email', findUserByEmailHandler);

// Admin-only routes
usersRoute.get('/', requireSystemAdmin(), listUsersHandler);
usersRoute.get('/:id', requireSystemAdmin(), getUserHandler);
usersRoute.patch('/:id', requireSystemAdmin(), updateUserHandler);
usersRoute.delete('/:id', requireSystemAdmin(), deleteUserHandler);

export default usersRoute;
