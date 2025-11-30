import { Context } from 'hono';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../../middleware/auth';
import type { DbClient } from '../../db/client';

export async function resetPasswordHandler(c: Context<{ Bindings: Env; Variables: { db: DbClient } }>) {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Get APP_URL from environment or use default
    const appUrl = c.env.APP_URL || 'http://localhost:3000';

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/reset-password`,
    });

    return c.json({ 
      message: 'If an account exists with that email, you will receive a password reset link.' 
    });
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
}
