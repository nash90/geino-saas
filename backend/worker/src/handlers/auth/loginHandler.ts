import { Context } from 'hono';
import { setCookie } from 'hono/cookie';
import { createClient } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';
import { users } from '../../db/schema';
import type { Env } from '../../middleware/auth';
import type { DbClient } from '../../db/client';

export async function loginHandler(c: Context<{ Bindings: Env; Variables: { db: DbClient } }>) {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Missing email or password' }, 400);
    }

    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Fetch user profile
    const db = c.get('db');
    const userProfile = await db.query.users.findFirst({
      where: eq(users.id, data.user.id)
    });

    if (!userProfile) {
      return c.json({ error: 'User profile not found' }, 404);
    }

    // Set httpOnly cookies
    setCookie(c, 'access_token', data.session.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 3600, // 1 hour
      path: '/',
    });

    setCookie(c, 'refresh_token', data.session.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 2592000, // 30 days
      path: '/',
    });

    return c.json({
      user: {
        id: userProfile.id,
        email: userProfile.email,
        firstname: userProfile.firstname,
        lastname: userProfile.lastname,
        systemRoleCode: userProfile.systemRoleCode,
      },
      organizations: [], // TODO: Fetch from organization_members
      projects: [], // TODO: Fetch from project_members
    });
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
}
