import type { Context } from 'hono';
import type { DbClient } from '../db/client';
import type { Profiler } from '../lib/profiler';

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
  // R2 credentials for pre-signed URLs
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;

  // Queue binding for notifications
  NOTIFICATIONS_QUEUE: Queue;

  // Email settings for Resend
  RESEND_API_KEY: string;
  FROM_EMAIL: string;
  FROM_NAME: string;
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
    profiler: Profiler;
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
    profiler: Profiler;
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
    profiler: Profiler;
  };
}>;

/**
 * Type helpers for Hono route definitions
 * These extract the generic parameters from Context types
 */
export type HonoEnv<T extends Context<any>> = T extends Context<infer E> ? E : never;

// Convenience types for route definitions
export type BaseEnv = HonoEnv<BaseContext>;
export type AuthEnv = HonoEnv<AuthContext>;
export type PreAuthEnv = HonoEnv<OptionalAuthContext>;
