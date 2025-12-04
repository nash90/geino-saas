import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createDbClient } from './db/client';
import auth from './routes/auth';
import users from './routes/users';
import organizations from './routes/organizations';
import type { Env } from './types';
import type { DbClient } from './db/client';

const app = new Hono<{ Bindings: Env; Variables: { db: DbClient } }>();

// CORS middleware
app.use('*', cors({
  origin: (origin) => {
    // Allow localhost and your production domains
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      // Add your production domains here
    ];
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
}));

// Database middleware - attach db client to context
app.use('*', async (c, next) => {
  const db = createDbClient(c.env.DATABASE_URL);
  c.set('db', db);
  await next();
});

// Health check
app.get('/', (c) => {
  return c.json({ message: 'Geino SaaS API is running', version: '1.0.0' });
});

// Mount routes
app.route('/api/auth', auth);
app.route('/api/users', users);
app.route('/api/organizations', organizations);

export default app;
