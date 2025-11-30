import { Context } from 'hono';
import { eq } from 'drizzle-orm';
import { users } from '../../db/schema';
import type { Env, AuthUser } from '../../middleware/auth';
import type { DbClient } from '../../db/client';

export async function updateUserHandler(c: Context<{ Bindings: Env; Variables: { db: DbClient; user?: AuthUser } }>) {
  try {
    const id = c.req.param('id');
    const { systemRoleCode } = await c.req.json();

    const db = c.get('db');
    
    const updatedUser = await db.update(users)
      .set({ 
        systemRoleCode,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser.length) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ 
      message: 'User updated successfully',
      user: updatedUser[0] 
    });
  } catch (error) {
    return c.json({ error: 'Failed to update user' }, 500);
  }
}
