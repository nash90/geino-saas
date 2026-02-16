import { createClient } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema';
import type { OptionalAuthContext, AuthUser } from '../types';
import { SystemRole } from '../types/codeTypes';
import type { Profiler } from '../lib/profiler';
import { ErrorCodes } from '../constants/errorCodes';

function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

export async function authenticate(c: OptionalAuthContext): Promise<AuthUser> {
  const profiler = c.get('profiler') as Profiler;

  const cookieHeader = c.req.header('Cookie');
  const token = getCookieValue(cookieHeader || null, 'access_token');

  if (!token) {
    throw new Error('Unauthorized: No access token provided');
  }

  // Use Supabase client to verify token (now fast with Tokyo region)
  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  profiler.checkpoint('Supabase auth verification');

  if (error || !user) {
    throw new Error('Unauthorized: Invalid token');
  }

  const db = c.get('db');
  const appUser = await db.query.users.findFirst({
    where: eq(users.id, user.id)
  });
  profiler.checkpoint('Get User DB query');

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
  return async (c: OptionalAuthContext, next: () => Promise<void>) => {
    const user = c.get('user');
    
    if (!user || user.systemRoleCode !== SystemRole.SYSTEM_ADMIN.code) {
      return c.json({ 
        error: 'Forbidden: System Admin access required',
        errorCode: ErrorCodes.SYSTEM_ADMIN_REQUIRED 
      }, 403);
    }
    
    await next();
  };
}
