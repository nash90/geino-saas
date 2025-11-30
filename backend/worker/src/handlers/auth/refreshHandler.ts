import { Context } from 'hono';
import { setCookie } from 'hono/cookie';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../../middleware/auth';
import type { DbClient } from '../../db/client';

export async function refreshHandler(c: Context<{ Bindings: Env; Variables: { db: DbClient } }>) {
  try {
    const cookieHeader = c.req.header('Cookie');
    const refreshToken = cookieHeader?.match(/refresh_token=([^;]+)/)?.[1];

    if (!refreshToken) {
      return c.json({ error: 'No refresh token provided' }, 401);
    }

    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      return c.json({ error: 'Failed to refresh token' }, 401);
    }

    setCookie(c, 'access_token', data.session.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 3600,
      path: '/',
    });

    setCookie(c, 'refresh_token', data.session.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 2592000,
      path: '/',
    });

    return c.json({ message: 'Token refreshed successfully' });
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
}
