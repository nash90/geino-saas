import { Context } from 'hono';
import { eq } from 'drizzle-orm';
import { users } from '../../db/schema';
import type { Env, AuthUser } from '../../middleware/auth';
import type { DbClient } from '../../db/client';

export async function getUserHandler(c: Context<{ Bindings: Env; Variables: { db: DbClient; user?: AuthUser } }>) {
  try {
    const id = c.req.param('id');
    const db = c.get('db');
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, id)
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
  } catch (error) {
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
}
