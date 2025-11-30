import { Context } from 'hono';
import type { Env, AuthUser } from '../../middleware/auth';
import type { DbClient } from '../../db/client';

export async function listUsersHandler(c: Context<{ Bindings: Env; Variables: { db: DbClient; user?: AuthUser } }>) {
  try {
    const db = c.get('db');
    const allUsers = await db.query.users.findMany({
      columns: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        systemRoleCode: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return c.json({ users: allUsers });
  } catch (error) {
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
}
