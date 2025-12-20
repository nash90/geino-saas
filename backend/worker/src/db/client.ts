import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Create database client for Cloudflare Workers + Supabase
 * @param databaseUrl - Database connection URL
 */
export function createDbClient(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    prepare: false,      // Disable prepared statements for serverless/edge
    max: 5,              // Allow 5 concurrent connections per Worker request
    idle_timeout: 30,    // Close connection after 30s idle
    connect_timeout: 30, // 30 second connection timeout
  });

  return drizzle(client, { schema });
}

export type DbClient = ReturnType<typeof createDbClient>;
