import { createRemoteJWKSet, jwtVerify } from 'jose';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema';
import type { OptionalAuthContext, AuthUser } from '../types';
import { SystemRole } from '../types/codeTypes';
import type { Profiler } from '../lib/profiler';

function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

/**
 * Verify Supabase JWT using JWKS (supports ES256, RS256, HS256)
 * Uses Supabase's public keys endpoint for asymmetric verification
 */
async function verifySupabaseJWT(token: string, supabaseUrl: string): Promise<{ sub: string } | null> {
  try {
    // Fetch JWKS from Supabase's well-known endpoint
    const JWKS = createRemoteJWKSet(
      new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`)
    );

    // Verify JWT signature and extract payload
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `${supabaseUrl}/auth/v1`,
      audience: 'authenticated',
    });

    // Return user ID from token
    return { sub: payload.sub as string };
  } catch (error) {
    console.error('[JWT Verify] Error:', error);
    return null;
  }
}

export async function authenticate(c: OptionalAuthContext): Promise<AuthUser> {
  const profiler = c.get('profiler') as Profiler;

  const cookieHeader = c.req.header('Cookie');
  const token = getCookieValue(cookieHeader || null, 'access_token');

  if (!token) {
    throw new Error('Unauthorized: No access token provided');
  }

  // Verify JWT using JWKS (supports ES256/RS256/HS256)
  const jwtPayload = await verifySupabaseJWT(token, c.env.SUPABASE_URL);
  profiler.checkpoint('JWT verification (JWKS)');

  if (!jwtPayload || !jwtPayload.sub) {
    throw new Error('Unauthorized: Invalid token');
  }

  const db = c.get('db');
  const appUser = await db.query.users.findFirst({
    where: eq(users.id, jwtPayload.sub)
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
      return c.json({ error: 'Forbidden: System Admin access required' }, 403);
    }
    
    await next();
  };
}
