import type { Context } from 'hono';
import type { DbClient } from '../db/client';

/**
 * Environment variables interface
 */
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_ANON_KEY: string;
  DATABASE_URL: string;
  APP_URL?: string;
  ATTACHMENTS_BUCKET: R2Bucket;
}

/**
 * Authenticated user interface (subset of User without timestamps)
 */
export interface AuthUser {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  systemRoleCode: number | null;
}

/**
 * Base context for all handlers
 * Includes database client and environment variables
 */
export type BaseContext = Context<{
  Bindings: Env;
  Variables: {
    db: DbClient;
  };
}>;

/**
 * Authenticated context for protected routes
 * Includes database client, environment variables, and authenticated user
 */
export type AuthContext = Context<{
  Bindings: Env;
  Variables: {
    db: DbClient;
    user: AuthUser;
  };
}>;

/**
 * Optional auth context for routes that may or may not require authentication
 * User is optional
 */
export type OptionalAuthContext = Context<{
  Bindings: Env;
  Variables: {
    db: DbClient;
    user?: AuthUser;
  };
}>;
