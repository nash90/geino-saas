import { Context } from 'hono';
import { desc, count } from 'drizzle-orm';
import { users } from '../../db/schema';
import type { Env, AuthUser } from '../../middleware/auth';
import type { DbClient } from '../../db/client';

export async function listUsersHandler(c: Context<{ Bindings: Env; Variables: { db: DbClient; user?: AuthUser } }>) {
  try {
    const db = c.get('db');
    
    // Get pagination parameters from query string
    const page = Math.max(1, parseInt(c.req.query('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '10')));
    const offset = (page - 1) * limit;

    // Get total count
    const [{ value: totalCount }] = await db.select({ value: count() }).from(users);
    
    // Get paginated users
    const usersList = await db.query.users.findMany({
      columns: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        systemRoleCode: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [desc(users.createdAt)],
      limit,
      offset,
    });

    return c.json({
      users: usersList,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
}
