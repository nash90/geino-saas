import { Context } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { users } from '../../db/schema';
import type { Env } from '../../middleware/auth';
import type { DbClient } from '../../db/client';

export async function registerHandler(c: Context<{ Bindings: Env; Variables: { db: DbClient } }>) {
  try {
    const { email, password, firstname, lastname } = await c.req.json();

    if (!email || !password || !firstname || !lastname) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { firstname, lastname }
      }
    });

    if (authError || !authData.user) {
      return c.json({ error: authError?.message || 'Registration failed' }, 400);
    }

    // Create user profile in custom users table
    const db = c.get('db');
    try {
      await db.insert(users).values({
        id: authData.user.id,
        email,
        firstname,
        lastname,
        systemRoleCode: null,
      });
    } catch (dbError) {
      // Rollback: delete Supabase auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return c.json({ error: 'Failed to create user profile' }, 500);
    }

    return c.json({ 
      message: 'Registration successful! Please check your email to verify your account.' 
    });
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
}
