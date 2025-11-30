import { Context } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema';
import type { DbClient } from '../db/client';

export interface AuthUser {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  systemRoleCode: number | null;
}

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_ANON_KEY: string;
  DATABASE_URL: string;
  APP_URL?: string;
}

function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

export async function authenticate(c: Context<{ Bindings: Env; Variables: { db: DbClient; user?: AuthUser } }>): Promise<AuthUser> {
  const cookieHeader = c.req.header('Cookie');
  const token = getCookieValue(cookieHeader || null, 'access_token');
  
  if (!token) {
    throw new Error('Unauthorized: No access token provided');
  }

  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Unauthorized: Invalid token');
  }

  const db = c.get('db');
  const appUser = await db.query.users.findFirst({
    where: eq(users.id, user.id)
  });

  if (!appUser) {
    throw new Error('User profile not found');
  }

  const authUser: AuthUser = {
    id: appUser.id,
    email: appUser.email,
    firstname: appUser.firstname,
    lastname: appUser.lastname,
    systemRoleCode: appUser.systemRoleCode,
  };

  c.set('user', authUser);
  return authUser;
}

export function requireSystemAdmin() {
  return async (c: Context<{ Bindings: Env; Variables: { user?: AuthUser } }>, next: () => Promise<void>) => {
    const user = c.get('user');
    
    if (!user || user.systemRoleCode !== 1) {
      return c.json({ error: 'Forbidden: System Admin access required' }, 403);
    }
    
    await next();
  };
}
