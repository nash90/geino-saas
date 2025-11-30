import { Context } from 'hono';
import { eq } from 'drizzle-orm';
import { users } from '../../db/schema';
import { createClient } from '@supabase/supabase-js';
import type { Env, AuthUser } from '../../middleware/auth';
import type { DbClient } from '../../db/client';

export async function deleteUserHandler(c: Context<{ Bindings: Env; Variables: { db: DbClient; user?: AuthUser } }>) {
  try {
    const id = c.req.param('id');
    const db = c.get('db');
    
    // Delete from custom users table
    const deleted = await db.delete(users)
      .where(eq(users.id, id))
      .returning();

    if (!deleted.length) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Delete from Supabase auth
    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    await supabase.auth.admin.deleteUser(id);

    return c.json({ message: 'User deleted successfully' });
  } catch (error) {
    return c.json({ error: 'Failed to delete user' }, 500);
  }
}
