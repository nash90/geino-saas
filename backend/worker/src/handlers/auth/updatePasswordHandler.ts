import { Context } from 'hono';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../../middleware/auth';
import type { DbClient } from '../../db/client';

export async function updatePasswordHandler(c: Context<{ Bindings: Env; Variables: { db: DbClient } }>) {
  try {
    const { token, newPassword } = await c.req.json();

    if (!token || !newPassword) {
      return c.json({ error: 'Token and new password are required' }, 400);
    }

    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Verify token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return c.json({ error: 'Invalid or expired token' }, 400);
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      return c.json({ error: 'Failed to update password' }, 500);
    }

    return c.json({ message: 'Password updated successfully' });
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
}
